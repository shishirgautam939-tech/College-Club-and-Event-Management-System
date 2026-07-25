import { useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Camera, CheckCircle2 } from "lucide-react-native";
import { verifyQRAttendance } from "../../api/participation";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import InlineAlert from "../../components/ui/InlineAlert";
import PageHeader from "../../components/ui/PageHeader";

// Ported verbatim from client/src/pages/student/ScanAttendance.jsx — pure
// string/URL parsing with no DOM dependency, so it works unchanged on
// native. Handles: the custom event-attendance:// scheme, an https URL
// carrying eventId/token query params, and a raw JSON payload.
const parseQrPayload = (decodedText) => {
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
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [scanning, setScanning] = useState(true);
  const [manualEventId, setManualEventId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const processedTokenRef = useRef(""); // guard against duplicate decodes while a request is in flight

  const handleVerify = async (eventId, token) => {
    setMessage({ type: "", text: "" });
    try {
      const res = await verifyQRAttendance(eventId, token);
      setMessage({ type: "success", text: res.data.detail });
      setIsProcessing(false);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Could not verify attendance. Please try again.";
      setMessage({ type: "error", text: errorMsg });
      setIsProcessing(false);
      return false;
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (!data || isProcessing || processedTokenRef.current === data) return;
    processedTokenRef.current = data;

    try {
      const payload = parseQrPayload(data);
      setIsProcessing(true);
      const ok = await handleVerify(payload.event_id, payload.token);
      if (ok) {
        setScanning(false);
      } else {
        // Failed verification — let the user try another code.
        processedTokenRef.current = "";
      }
    } catch (err) {
      processedTokenRef.current = "";
      setMessage({
        type: "error",
        text: err.message || "That QR code doesn't look right. Please scan the code shown at the event.",
      });
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualEventId || !manualToken) {
      setMessage({ type: "error", text: "Please enter both Event ID and Attendance token." });
      return;
    }
    setIsProcessing(true);
    const ok = await handleVerify(Number(manualEventId), manualToken.trim());
    if (ok) {
      setScanning(false);
    }
  };

  const restartScanner = () => {
    setMessage({ type: "", text: "" });
    setManualEventId("");
    setManualToken("");
    setIsProcessing(false);
    processedTokenRef.current = "";
    setScanning(true);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        eyebrow={
          <>
            <Camera size={14} color="#FFFFFF" />
            <Text style={styles.eyebrowText}>Attendance</Text>
          </>
        }
        title="Check in with QR"
        subtitle="Point your camera at the QR code displayed at the event venue. Make sure you're registered before scanning."
      />

      {message.text ? (
        <InlineAlert type={message.type || "error"} style={{ marginTop: spacing.md }}>
          {message.text}
        </InlineAlert>
      ) : null}

      {scanning ? (
        <Card style={{ marginTop: spacing.lg }}>
          {!permission ? (
            <View style={styles.permissionBox}>
              <Text style={styles.mutedText}>Checking camera permission…</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <Camera size={28} color={colors.textMuted} />
              <Text style={styles.permissionText}>
                Camera access is needed to scan the attendance QR code.
              </Text>
              <Button onPress={requestPermission}>Grant camera access</Button>
            </View>
          ) : (
            <View style={styles.cameraWrap}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              {isProcessing ? (
                <View style={styles.cameraOverlay}>
                  <Text style={styles.cameraOverlayText}>Verifying…</Text>
                </View>
              ) : null}
            </View>
          )}
        </Card>
      ) : (
        <Card style={{ marginTop: spacing.lg, alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl }}>
          <View style={styles.successIconWrap}>
            <CheckCircle2 size={32} color={colors.success} />
          </View>
          <Text style={styles.successText}>You&apos;re checked in. Enjoy the event!</Text>
          <Button variant="outline" onPress={restartScanner}>
            Scan another code
          </Button>
        </Card>
      )}

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.troubleTitle}>Having trouble?</Text>
        <Text style={styles.troubleSubtitle}>
          Enter the event ID and token manually if the camera isn&apos;t working.
        </Text>
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Input
            placeholder="Event ID"
            value={manualEventId}
            onChangeText={(v) => setManualEventId(v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            editable={!isProcessing}
          />
          <Input
            placeholder="Attendance token"
            value={manualToken}
            onChangeText={setManualToken}
            autoCapitalize="none"
            editable={!isProcessing}
          />
          <Button onPress={handleManualSubmit} disabled={isProcessing} loading={isProcessing}>
            Verify manually
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF" },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },

  permissionBox: { alignItems: "center", justifyContent: "center", gap: spacing.md, paddingVertical: spacing.xl },
  permissionText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.lg },

  cameraWrap: { height: 340, borderRadius: radii.md, overflow: "hidden", backgroundColor: colors.dark },
  cameraOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(36,30,26,0.65)",
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  cameraOverlayText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: "#FFFFFF" },

  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.successMuted,
  },
  successText: { fontFamily: fontFamily.semibold, fontSize: fontSize.base, color: colors.textPrimary, textAlign: "center" },

  troubleTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.base, color: colors.textPrimary },
  troubleSubtitle: { marginTop: 2, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
});

export default ScanAttendance;
