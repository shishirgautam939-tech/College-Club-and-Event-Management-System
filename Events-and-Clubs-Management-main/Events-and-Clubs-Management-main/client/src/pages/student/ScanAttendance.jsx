import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { verifyQRAttendance } from "../../api/participation";

const ScanAttendance = () => {
  const [message, setMessage] = useState({ type: "", text: "" });
  const [scanning, setScanning] = useState(true);
  const [manualEventId, setManualEventId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const scannerRef = useRef(null);

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
          const payload = JSON.parse(decodedText);
          await handleVerify(payload.event_id, payload.token);
          scanner.clear().catch(() => {});
          setScanning(false);
        } catch {
          setMessage({
            type: "error",
            text: "That QR code doesn't look right. Please scan the code shown at the event.",
          });
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
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Could not verify attendance.",
      });
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualEventId || !manualToken) return;
    await handleVerify(Number(manualEventId), manualToken.trim());
  };

  const restartScanner = () => {
    setMessage({ type: "", text: "" });
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
            className="input-field"
          />
          <input
            type="text"
            placeholder="Attendance token"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="input-field"
          />
          <button type="submit" className="btn-primary w-full">
            Verify manually
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScanAttendance;
