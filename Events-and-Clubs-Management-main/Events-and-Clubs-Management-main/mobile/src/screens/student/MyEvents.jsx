import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, Modal, Pressable, Image, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Bookmark, ScanLine, QrCode } from "lucide-react-native";
import { decode as decodeBase64 } from "base64-arraybuffer";
import {
  getMyRegistrations,
  unregisterFromEvent,
  getEventQRAttendance,
} from "../../api/participation";
import { saveArrayBufferAsFile, downloadApiFileToDevice } from "../../utils/downloadFile";
import { formatDateTime } from "../../utils/formatDate";
import { colors, radii, spacing, shadow } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import InlineAlert from "../../components/ui/InlineAlert";
import PageHeader from "../../components/ui/PageHeader";

const MyEvents = ({ navigation }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [actionInProgress, setActionInProgress] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [qrEvent, setQrEvent] = useState(null);

  const fetchRegistrations = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await getMyRegistrations();
      setRegistrations(res.data);
      setError("");
    } catch {
      setError("Failed to load your registrations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  useFocusEffect(
    useCallback(() => {
      fetchRegistrations({ silent: true });
    }, [fetchRegistrations]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegistrations({ silent: true });
  };

  const handleUnregister = async (eventId) => {
    setActionMsg({ type: "", text: "" });
    setActionInProgress(eventId);
    try {
      await unregisterFromEvent(eventId);
      setActionMsg({ type: "success", text: "Unregistered successfully." });
      fetchRegistrations({ silent: true });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to unregister.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDownloadCertificate = async (registration) => {
    setDownloadingId(registration.event);
    try {
      await downloadApiFileToDevice(
        `events/${registration.event}/certificate/download/`,
        `certificate_${registration.event_title.replace(/\s+/g, "_")}.pdf`,
        "application/pdf",
      );
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err?.message
          ? `Download failed — ${err.message}`
          : "Certificate not available yet.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const upcoming = registrations.filter((r) => r.event_status === "Approved");
  const completed = registrations.filter((r) => r.event_status === "Completed");

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Loading your events…</Text>
      </View>
    );
  }

  const attendanceBadge = (status) => {
    if (status === "Present") return <StatusBadge tone="success">Present</StatusBadge>;
    if (status === "Absent") return <StatusBadge tone="danger">Absent</StatusBadge>;
    return <StatusBadge tone="tan">Not marked</StatusBadge>;
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <PageHeader
          eyebrow={
            <>
              <Bookmark size={14} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>Your registrations</Text>
            </>
          }
          title="My events"
          subtitle="Track your registrations, attendance, and certificates in one place."
          actions={
            <Button
              variant="outline"
              size="sm"
              icon={<ScanLine size={16} color={colors.textPrimary} />}
              onPress={() => navigation.navigate("ScanTab")}
              style={{ backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.3)" }}
              textStyle={{ color: "#FFFFFF" }}
            >
              Scan QR to check in
            </Button>
          }
        />

        {error ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{error}</InlineAlert> : null}
        {actionMsg.text ? (
          <InlineAlert type={actionMsg.type} style={{ marginTop: spacing.md }}>{actionMsg.text}</InlineAlert>
        ) : null}

        {registrations.length === 0 ? (
          <Card style={{ marginTop: spacing.lg, alignItems: "center", paddingVertical: spacing.xxl }}>
            <Text style={styles.emptyText}>You haven&apos;t joined any events yet.</Text>
            <Button style={{ marginTop: spacing.md }} onPress={() => navigation.navigate("Events")}>
              Browse events
            </Button>
          </Card>
        ) : (
          <>
            {upcoming.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming ({upcoming.length})</Text>
                <View style={{ gap: spacing.md }}>
                  {upcoming.map((r) => (
                    <Card key={r.id}>
                      <Text style={styles.cardTitle}>{r.event_title}</Text>
                      <Text style={styles.cardClub}>{r.club_name}</Text>
                      <Text style={styles.cardMeta}>
                        {formatDateTime(r.event_date)} · {r.venue || "Venue TBA"}
                      </Text>

                      {r.attendance_qr_active || r.qr_payload ? (
                        <View style={styles.qrRow}>
                          <StatusBadge tone="success">{r.attendance_qr_active ? "QR active" : "QR ready"}</StatusBadge>
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => setQrEvent({ id: r.event, title: r.event_title })}
                          >
                            View QR
                          </Button>
                        </View>
                      ) : null}

                      <View style={styles.buttonRow}>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ flex: 1 }}
                          onPress={() => navigation.navigate("ScanTab")}
                        >
                          Check in
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ flex: 1 }}
                          textStyle={{ color: colors.danger }}
                          onPress={() => handleUnregister(r.event)}
                          disabled={actionInProgress === r.event}
                        >
                          {actionInProgress === r.event ? "Processing…" : "Unregister"}
                        </Button>
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            ) : null}

            {completed.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past events ({completed.length})</Text>
                <View style={{ gap: spacing.md }}>
                  {completed.map((r) => (
                    <Card key={r.id}>
                      <Text style={styles.cardTitle}>{r.event_title}</Text>
                      <Text style={styles.cardClub}>{r.club_name}</Text>
                      <Text style={styles.cardMeta}>
                        {formatDateTime(r.event_date)} · {r.venue || "—"}
                      </Text>
                      <View style={{ marginTop: spacing.sm, alignSelf: "flex-start" }}>
                        {attendanceBadge(r.attendance_status)}
                      </View>
                      {r.event_status === "Completed" ? (
                        <Button
                          style={{ marginTop: spacing.md }}
                          onPress={() => handleDownloadCertificate(r)}
                          disabled={downloadingId === r.event}
                          loading={downloadingId === r.event}
                        >
                          Download certificate
                        </Button>
                      ) : null}
                    </Card>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {qrEvent ? (
        <EventQrModal
          event={qrEvent}
          navigation={navigation}
          onClose={() => setQrEvent(null)}
          onAfterClose={() => setQrEvent(null)}
        />
      ) : null}
    </>
  );
};

// Same inline QR-preview modal as EventDiscovery.jsx (duplicated locally —
// there's no shared component file in this port's scope to hold it).
const EventQrModal = ({ event, navigation, onClose, onAfterClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const fetchQr = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getEventQRAttendance(event.id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load the QR code.");
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    fetchQr();
  }, [fetchQr]);

  const close = () => {
    onClose?.();
    onAfterClose?.();
  };

  const handleDownload = async () => {
    if (!data?.qr_image_base64) return;
    setDownloading(true);
    try {
      await saveArrayBufferAsFile(
        decodeBase64(data.qr_image_base64),
        `qr_${(event.title || "event").replace(/\s+/g, "_")}.png`,
        "image/png",
      );
    } catch {
      // ignore — share sheet may be unavailable on some devices
    } finally {
      setDownloading(false);
    }
  };

  const active = !loading && !error && data?.qr_active && data?.qr_image_base64;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable style={modalStyles.overlay} onPress={close}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={modalStyles.title}>{event.title}</Text>
          <Text style={modalStyles.subtitle}>Show this code at the event entrance to mark attendance.</Text>

          <View style={modalStyles.statusRow}>
            {loading ? (
              <StatusBadge tone="tan">Loading…</StatusBadge>
            ) : error ? (
              <StatusBadge tone="danger">Error</StatusBadge>
            ) : active ? (
              <StatusBadge tone="success">Active</StatusBadge>
            ) : (
              <StatusBadge tone="tan">Not active</StatusBadge>
            )}
            {data?.expires_at ? (
              <Text style={modalStyles.expiry}>Expires {formatDateTime(data.expires_at)}</Text>
            ) : null}
          </View>

          <View style={modalStyles.imageWrap}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : error ? (
              <Text style={modalStyles.errorText}>{error}</Text>
            ) : active ? (
              <Image
                source={{ uri: `data:image/png;base64,${data.qr_image_base64}` }}
                style={modalStyles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={{ alignItems: "center", gap: 8 }}>
                <QrCode size={26} color={colors.textMuted} />
                <Text style={modalStyles.emptyText}>The QR code isn't active yet. Tap Refresh in a moment.</Text>
              </View>
            )}
          </View>

          <View style={modalStyles.actionsRow}>
            <Button variant="outline" size="sm" onPress={fetchQr} disabled={loading} style={{ flex: 1 }}>
              Refresh
            </Button>
            <Button
              size="sm"
              onPress={handleDownload}
              disabled={!active || downloading}
              loading={downloading}
              style={{ flex: 1 }}
            >
              Download QR
            </Button>
          </View>
          {navigation ? (
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                close();
                navigation.navigate("ScanTab");
              }}
            >
              Scan on another device
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onPress={close}>
            Close
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: spacing.sm },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF" },
  emptyText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },

  section: { marginTop: spacing.xl, gap: spacing.md },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textPrimary },

  cardTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textPrimary },
  cardClub: { marginTop: 2, fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.primary },
  cardMeta: { marginTop: 4, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },

  qrRow: { marginTop: spacing.md, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  buttonRow: { marginTop: spacing.md, flexDirection: "row", gap: spacing.sm },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  card: { width: "100%", maxWidth: 380, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.md, ...shadow.card },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary },
  subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  expiry: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
  imageWrap: {
    minHeight: 200,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  qrImage: { width: 220, height: 220, backgroundColor: "#FFFFFF", borderRadius: radii.md },
  errorText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.danger, textAlign: "center" },
  emptyText: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: "center" },
  actionsRow: { flexDirection: "row", gap: spacing.sm },
});

export default MyEvents;
