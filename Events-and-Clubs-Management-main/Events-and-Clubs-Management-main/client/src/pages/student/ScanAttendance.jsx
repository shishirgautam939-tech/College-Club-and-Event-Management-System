import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { verifyQRAttendance } from "../../api/participation";

const parseQrPayload = (decodedText) => {
  // decodedText may be a string OR an object (Html5Qrcode.scanFileV2 returns an object).
  let text = "";
  if (typeof decodedText === "string") {
    text = decodedText;
  } else if (decodedText && typeof decodedText === "object") {
    text = decodedText.decodedText || decodedText.text || "";
  }
  text = text?.trim();
  if (!text) throw new Error("Empty QR payload");

  if (text.startsWith("event-attendance://")) {
    const rest = text.slice("event-attendance://".length);
    const [eventIdText, token] = rest.split("/", 2);
    if (!eventIdText || !token) throw new Error("Malformed QR payload");
    return { event_id: Number(eventIdText), token };
  }

  // The QR might encode a URL like https://host/scan-attendance?eventId=12&token=abc
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      const eventId = url.searchParams.get("eventId") || url.searchParams.get("event_id");
      const token = url.searchParams.get("token");
      if (eventId && token) {
        return { event_id: Number(eventId), token };
      }
    } catch {
      // fall through
    }
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed?.event_id && parsed?.token) {
      return { event_id: Number(parsed.event_id), token: parsed.token };
    }
  } catch {
    // fall through to error
  }

  throw new Error("Unsupported QR payload");
};

const ScanAttendance = () => {
  const [message, setMessage] = useState({ type: "", text: "" });
  const [scanning, setScanning] = useState(true);
  const [manualEventId, setManualEventId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const processedTokenRef = useRef(""); // guard against duplicate decodes

  useEffect(() => {
    if (!scanning) return undefined;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );
    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        try {
          // The library can fire success more than once for the same code; dedupe.
          const raw = typeof decodedText === "string"
            ? decodedText
            : decodedText?.decodedText || "";
          if (!raw || processedTokenRef.current === raw) return;
          processedTokenRef.current = raw;

          const payload = parseQrPayload(decodedText);
          setIsProcessing(true);
          const ok = await handleVerify(payload.event_id, payload.token);
          if (ok) {
            try { await scanner.clear(); } catch { /* ignore */ }
            setScanning(false);
          } else {
            // Failed verification — let the user try another code.
            processedTokenRef.current = "";
            setIsProcessing(false);
          }
        } catch (err) {
          processedTokenRef.current = "";
          setMessage({
            type: "error",
            text: err.message || "That QR code doesn't look right. Please scan the code shown at the event.",
          });
          setIsProcessing(false);
        }
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanning]);

  const handleVerify = async (eventId, token) => {
    setMessage({ type: "", text: "" });
    try {
      const res = await verifyQRAttendance(eventId, token);
      setMessage({
        type: "success",
        text: res.data.detail,
      });
      setIsProcessing(false);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Could not verify attendance. Please try again.";
      setMessage({
        type: "error",
        text: errorMsg,
      });
      setIsProcessing(false);
      return false;
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualEventId || !manualToken) {
      setMessage({
        type: "error",
        text: "Please enter both Event ID and Attendance token.",
      });
      return;
    }
    setIsProcessing(true);
    const ok = await handleVerify(Number(manualEventId), manualToken.trim());
    if (ok) {
      setScanning(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please select a valid image file (PNG, JPG, or WEBP).",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Stop the live scanner so it doesn't hold the camera while we decode the file.
    try {
      if (scannerRef.current) {
        try { await scannerRef.current.clear(); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }

    setIsProcessing(true);
    setMessage({ type: "", text: "" });

    try {
      // The Html5Qrcode constructor needs a real DOM element. We render a
      // hidden one with id="qr-reader-file" in JSX specifically for this.
      const html5Qrcode = new Html5Qrcode("qr-reader-file", /* verbose */ false);
      try {
        // scanFile(imageFile, showImage) — second arg renders the image in the
        // element so users can see what was decoded.
        const decodedText = await html5Qrcode.scanFile(file, true);
        const payload = parseQrPayload(decodedText);
        const ok = await handleVerify(payload.event_id, payload.token);
        if (ok) {
          setScanning(false);
        }
      } finally {
        try { await html5Qrcode.clear(); } catch { /* ignore */ }
      }
    } catch (err) {
      // Distinguish "could not decode" from "library crashed" so the message
      // is actually useful to the student.
      const messageText = (err && typeof err === "object" && "message" in err)
        ? String(err.message)
        : String(err || "");
      const isNoQr =
        /No QR Code found/i.test(messageText) ||
        /No barcode or QR code/i.test(messageText) ||
        /No MultiFormat Readers/i.test(messageText) ||
        /decode/i.test(messageText);
      setMessage({
        type: "error",
        text: isNoQr
          ? "No QR code found in that image. Make sure the image is clear, well-lit, and shows the full code."
          : (messageText || "Could not read QR code from image. Please try another image."),
      });
      setIsProcessing(false);
    }

    // Reset file input so the same file can be re-selected if needed.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const restartScanner = () => {
    setMessage({ type: "", text: "" });
    setManualEventId("");
    setManualToken("");
    setIsProcessing(false);
    setScanning(true);
  };

  return (
    <div className="page-shell max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Check in with QR</h1>
        <p className="page-subtitle">
          Point your camera at the QR code displayed at the event venue. Make sure
          you&apos;re registered before scanning.
        </p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
          {message.text}
        </div>
      )}

      {scanning ? (
        <div className="card p-6">
          <div id="qr-reader" className="rounded-xl overflow-hidden" />

          {/* Hidden host for the Html5Qrcode instance used to decode uploaded
              images. The library requires a real DOM element with the id it
              was constructed with — without this, scanFile() throws
              "HTML Element with id=... not found". */}
          <div id="qr-reader-file" className="hidden" aria-hidden="true" />

          <div className="mt-6 flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              aria-label="Upload QR code image"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="btn-secondary w-full"
            >
              {isProcessing ? "Processing..." : "Scan from Image File"}
            </button>
            <p className="text-xs text-stone-500 text-center">
              Or select a QR code image from your device
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center space-y-4">
          <div className="text-5xl">✓</div>
          <p className="text-stone-600">You&apos;re checked in. Enjoy the event!</p>
          <button type="button" onClick={restartScanner} className="btn-secondary">
            Scan another code
          </button>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-stone-800 mb-2">Having trouble?</h2>
        <p className="text-sm text-stone-500 mb-4">
          Enter the event ID and token manually if the camera isn&apos;t working.
        </p>
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <input
            type="number"
            placeholder="Event ID"
            value={manualEventId}
            onChange={(e) => setManualEventId(e.target.value)}
            disabled={isProcessing}
            className="input-field"
            min="1"
          />
          <input
            type="text"
            placeholder="Attendance token"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            disabled={isProcessing}
            className="input-field"
          />
          <button type="submit" disabled={isProcessing} className="btn-primary w-full">
            {isProcessing ? "Verifying..." : "Verify manually"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScanAttendance;
