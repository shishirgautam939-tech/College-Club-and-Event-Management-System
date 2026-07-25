import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
// legacy subpath: documentDirectory/writeAsStringAsync moved there in SDK 54
// (see src/utils/downloadFile.js)
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Check, CheckCircle2, Circle, Download, QrCode, Users, X } from "lucide-react-native";
import {
  getEventAttendance,
  markAttendance,
  getEventQRAttendance,
  activateEventQR,
  deactivateEventQR,
  generateEventCertificates,
} from "../../api/participation";
import { completeEvent } from "../../api/events";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import InlineAlert from "../../components/ui/InlineAlert";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Avatar from "../../components/ui/Avatar";

// This screen is mounted under both the Admin tab stack and the Faculty
// Approvals stack (see AdminTabNavigator.jsx / FacultyTabNavigator.jsx). The
// web source (client/src/pages/admin/EventAttendance.jsx) has no
// Admin-vs-Faculty branching at all — every action goes through the same
// admin/faculty-shared endpoints in api/participation.js and api/events.js,
// with the backend enforcing who can act on which event — so nothing here
// needs to read useAuth().user.role either.

const EmptyState = ({ title, sub }) => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyTitle}>{title}</Text>
    {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
  </View>
);

const HeaderChip = ({ icon, text }) => (
  <View style={styles.headerChip}>
    {icon}
    <Text style={styles.headerChipText}>{text}</Text>
  </View>
);

const EventAttendance = ({ route }) => {
  const eventId = route?.params?.eventId;

  const [activeTab, setActiveTab] = useState("manual");
  const [eventInfo, setEventInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  // QR check-in modal state — ports client/src/components/EventQRModal.jsx's
  // fetch/refresh/download behavior plus the activate/deactivate controls
  // that live inline in the web EventAttendance QR tab, merged into a single
  // in-screen Modal opened from a button (no separate route needed).
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrActionLoading, setQrActionLoading] = useState(false);
  const [autoActivateTried, setAutoActivateTried] = useState(false);

  const fetchAttendance = useCallback(
    async ({ silent = false } = {}) => {
      if (!eventId) {
        setError("No event selected.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await getEventAttendance(eventId);
        const nextParticipants = Array.isArray(res.data.participants) ? res.data.participants : [];
        setEventInfo({
          event_id: res.data.event_id,
          event_title: res.data.event_title,
          event_status: res.data.event_status,
        });
        setParticipants(nextParticipants.map((p) => ({ ...p, present: p.present ?? false })));
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load attendance data.");
      } finally {
        if (!silent) setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useFocusEffect(
    useCallback(() => {
      fetchAttendance({ silent: true });
    }, [fetchAttendance]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance({ silent: true });
  };

  const filteredParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return participants;
    return participants.filter((p) => {
      const haystack = [p.user_name, p.user_email, p.roll_number].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [participants, search]);

  const togglePresent = (userId) => {
    setParticipants((prev) => prev.map((p) => (p.user_id === userId ? { ...p, present: !p.present } : p)));
  };

  const markAllPresent = () => setParticipants((prev) => prev.map((p) => ({ ...p, present: true })));
  const markAllAbsent = () => setParticipants((prev) => prev.map((p) => ({ ...p, present: false })));

  const handleSave = async () => {
    setActionMsg({ type: "", text: "" });
    setSaving(true);
    try {
      const attendanceData = participants.map((p) => ({ user_id: p.user_id, present: p.present }));
      const res = await markAttendance(eventId, attendanceData);
      setActionMsg({ type: "success", text: res.data.detail });
      fetchAttendance({ silent: true });
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Failed to save attendance." });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteEvent = async () => {
    setActionMsg({ type: "", text: "" });
    try {
      const res = await completeEvent(eventId);
      setActionMsg({
        type: "success",
        text: `${res.data.detail} ${res.data.certificates_issued || 0} certificate(s) issued.`,
      });
      fetchAttendance({ silent: true });
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Could not complete event." });
    }
  };

  const handleGenerateCertificates = async () => {
    setActionMsg({ type: "", text: "" });
    try {
      const res = await generateEventCertificates(eventId);
      setActionMsg({ type: "success", text: res.data.detail });
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Could not generate certificates." });
    }
  };

  // ── QR modal ──
  const fetchQr = useCallback(async () => {
    setQrLoading(true);
    setQrError("");
    try {
      const res = await getEventQRAttendance(eventId);
      setQrData(res.data);
    } catch (err) {
      setQrError(err.response?.data?.detail || "Could not load the QR code.");
    } finally {
      setQrLoading(false);
    }
  }, [eventId]);

  const openQrModal = () => {
    setQrModalOpen(true);
    setAutoActivateTried(false);
    fetchQr();
  };
  const closeQrModal = () => setQrModalOpen(false);

  const handleActivateQR = useCallback(async () => {
    setQrActionLoading(true);
    setActionMsg({ type: "", text: "" });
    try {
      const res = await activateEventQR(eventId);
      setQrData(res.data);
      setActionMsg({ type: "success", text: "QR check-in is now live for students." });
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Could not activate QR attendance." });
    } finally {
      setQrActionLoading(false);
    }
  }, [eventId]);

  const handleDeactivateQR = async () => {
    setQrActionLoading(true);
    try {
      await deactivateEventQR(eventId);
      await fetchQr();
      setActionMsg({ type: "success", text: "QR check-in has been turned off." });
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Could not deactivate QR attendance." });
    } finally {
      setQrActionLoading(false);
    }
  };

  const handleDownloadQr = async () => {
    if (!qrData?.qr_image_base64) return;
    try {
      const filename = `qr_${(eventInfo?.event_title || "event").replace(/\s+/g, "_")}.png`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, qrData.qr_image_base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "image/png" });
      }
    } catch {
      setActionMsg({ type: "error", text: "Could not save the QR code." });
    }
  };

  // Mirrors the web QR tab auto-activating check-in the moment it's opened
  // for an Approved event that doesn't have an active code yet — but only
  // tries once per modal session so a failed activation doesn't loop.
  useEffect(() => {
    if (!qrModalOpen || autoActivateTried) return;
    if (eventInfo?.event_status !== "Approved") return;
    if (qrLoading || !qrData) return;
    if (qrData.qr_active) return;
    setAutoActivateTried(true);
    handleActivateQR();
  }, [qrModalOpen, autoActivateTried, eventInfo?.event_status, qrLoading, qrData, handleActivateQR]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Loading attendance…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, { padding: spacing.lg }]}>
        <InlineAlert type="error">{error}</InlineAlert>
      </View>
    );
  }

  const presentCount = participants.filter((p) => p.present).length;
  const presentPct = participants.length > 0 ? Math.round((presentCount / participants.length) * 100) : 0;
  const qrActive = qrData?.qr_active && qrData?.qr_image_base64;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <PageHeader
          eyebrow={<Text style={styles.eyebrowText}>Attendance · {eventInfo?.event_status}</Text>}
          title={eventInfo?.event_title}
          subtitle={`${presentCount} of ${participants.length} marked present · ${presentPct}% attendance`}
          actions={
            <>
              <HeaderChip icon={<Check size={13} color="#FFFFFF" />} text={`${presentCount} present`} />
              <HeaderChip icon={<Users size={13} color="#FFFFFF" />} text={`${participants.length} registered`} />
            </>
          }
        />

        {actionMsg.text ? (
          <InlineAlert type={actionMsg.type} style={{ marginTop: spacing.md }}>
            {actionMsg.text}
          </InlineAlert>
        ) : null}

        {eventInfo?.event_status === "Approved" ? (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              When the event ends, mark it complete to issue certificates to attendees.
            </Text>
            <Button size="sm" onPress={handleCompleteEvent}>
              Complete &amp; issue certificates
            </Button>
          </Card>
        ) : null}

        {eventInfo?.event_status === "Completed" ? (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeText}>Regenerate certificates for all present attendees if needed.</Text>
            <Button size="sm" variant="outline" onPress={handleGenerateCertificates}>
              Regenerate certificates
            </Button>
          </Card>
        ) : null}

        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab("manual")}
            style={[styles.tabChip, activeTab === "manual" && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === "manual" && styles.tabChipTextActive]}>Manual list</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("qr")}
            style={[styles.tabChip, activeTab === "qr" && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === "qr" && styles.tabChipTextActive]}>QR check-in</Text>
          </Pressable>
        </View>

        {activeTab === "manual" ? (
          <Card style={styles.listCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Attendees{" "}
                <Text style={styles.sectionCount}>
                  · {filteredParticipants.length} of {participants.length}
                </Text>
              </Text>
            </View>
            <View style={styles.toolbar}>
              <Input
                placeholder="Search name, roll, email…"
                value={search}
                onChangeText={setSearch}
                containerStyle={{ flex: 1, minWidth: 160 }}
              />
              <View style={styles.toolbarBtnRow}>
                <Button
                  size="sm"
                  variant="outline"
                  textStyle={{ color: colors.success }}
                  icon={<Check size={14} color={colors.success} />}
                  onPress={markAllPresent}
                >
                  All present
                </Button>
                <Button size="sm" variant="outline" icon={<X size={14} color={colors.textPrimary} />} onPress={markAllAbsent}>
                  All absent
                </Button>
                <Button size="sm" onPress={handleSave} loading={saving}>
                  Save
                </Button>
              </View>
            </View>

            {participants.length === 0 ? (
              <EmptyState title="No registrations yet" sub="Students will appear here once they register for the event." />
            ) : filteredParticipants.length === 0 ? (
              <EmptyState title="No matches" sub="Try a different search term." />
            ) : (
              filteredParticipants.map((p, idx) => (
                <Pressable
                  key={p.user_id}
                  onPress={() => togglePresent(p.user_id)}
                  style={[styles.participantRow, idx > 0 && styles.rowBorder, p.present && styles.participantRowActive]}
                >
                  {p.present ? <CheckCircle2 size={20} color={colors.success} /> : <Circle size={20} color={colors.textMuted} />}
                  <Avatar name={p.user_name} size={34} bg={p.present ? colors.success : colors.tan} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {idx + 1}. {p.user_name}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {p.user_email}
                      {p.roll_number ? ` · ${p.roll_number}` : ""}
                    </Text>
                  </View>
                  <StatusBadge tone={p.present ? "success" : "tan"}>{p.present ? "Present" : "Absent"}</StatusBadge>
                </Pressable>
              ))
            )}
          </Card>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <Card>
              <Text style={styles.cardTitle}>Display this at the venue</Text>
              <Text style={styles.cardDesc}>
                Students scan the code with their phone to check in. Only registered students can verify.
              </Text>
              <Button
                style={{ marginTop: spacing.md }}
                icon={<QrCode size={16} color="#FFFFFF" />}
                onPress={openQrModal}
              >
                Show QR code
              </Button>
            </Card>

            <Card>
              <Text style={styles.cardTitle}>How it works</Text>
              <View style={{ marginTop: spacing.sm, gap: 6 }}>
                {[
                  "Start QR check-in when the event begins.",
                  "Display the code on a screen or print it at the entrance.",
                  "Students open Scan QR from the menu and point their camera.",
                  "Attendance is recorded instantly for registered participants.",
                  "Complete the event when finished to send certificates.",
                ].map((step, i) => (
                  <Text key={i} style={styles.stepText}>
                    {i + 1}. {step}
                  </Text>
                ))}
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      <Modal visible={qrModalOpen} transparent animationType="fade" onRequestClose={closeQrModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {eventInfo?.event_title}
              </Text>
              <Pressable onPress={closeQrModal} hitSlop={10}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>Show this code at the event entrance to mark attendance.</Text>

            <View style={styles.modalStatusRow}>
              {qrLoading ? (
                <StatusBadge tone="tan">Loading…</StatusBadge>
              ) : qrError ? (
                <StatusBadge tone="danger">Error</StatusBadge>
              ) : qrActive ? (
                <StatusBadge tone="success">Active</StatusBadge>
              ) : (
                <StatusBadge tone="tan">Not active</StatusBadge>
              )}
              {qrData?.expires_at ? (
                <Text style={styles.modalExpiry}>Expires {new Date(qrData.expires_at).toLocaleString()}</Text>
              ) : null}
            </View>

            <View style={styles.qrBox}>
              {qrLoading ? (
                <View style={styles.qrBoxCenter}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.mutedText}>Loading QR…</Text>
                </View>
              ) : qrError ? (
                <Text style={styles.qrErrorText}>{qrError}</Text>
              ) : qrActive ? (
                <Image
                  source={{ uri: `data:image/png;base64,${qrData.qr_image_base64}` }}
                  style={styles.qrImage}
                />
              ) : (
                <View style={styles.qrBoxCenter}>
                  <QrCode size={26} color={colors.textMuted} />
                  <Text style={styles.mutedText}>QR check-in is not active yet.</Text>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <Button variant="outline" style={{ flex: 1 }} onPress={fetchQr} disabled={qrLoading}>
                Refresh
              </Button>
              {qrActive ? (
                <Button variant="destructive" style={{ flex: 1 }} onPress={handleDeactivateQR} loading={qrActionLoading}>
                  Turn off
                </Button>
              ) : (
                <Button style={{ flex: 1 }} onPress={handleActivateQR} loading={qrActionLoading}>
                  Activate
                </Button>
              )}
            </View>
            <Button
              variant="outline"
              style={{ marginTop: spacing.sm }}
              icon={<Download size={16} color={colors.textPrimary} />}
              disabled={!qrData?.qr_image_base64 || qrLoading}
              onPress={handleDownloadQr}
            >
              Download QR
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.background },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.6 },

  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerChipText: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: "#FFFFFF" },

  noticeCard: { marginTop: spacing.lg, gap: spacing.sm },
  noticeText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },

  tabBar: {
    flexDirection: "row",
    gap: 4,
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 4,
  },
  tabChip: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: radii.sm },
  tabChipActive: { backgroundColor: colors.primaryMuted },
  tabChipText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.textMuted },
  tabChipTextActive: { color: colors.primary },

  listCard: { marginTop: spacing.lg, padding: 0, overflow: "hidden" },
  sectionHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.background },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  sectionCount: { fontFamily: fontFamily.regular, color: colors.textMuted },
  toolbar: { gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  toolbarBtnRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },

  emptyWrap: { paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, alignItems: "center", gap: 4 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  emptySub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: "center" },

  participantRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  participantRowActive: { backgroundColor: colors.successMuted },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  rowTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  rowSub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },

  cardTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.textPrimary },
  cardDesc: { marginTop: 4, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  stepText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  modalCard: { width: "100%", maxWidth: 400, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  modalTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary },
  modalSubtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  modalStatusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  modalExpiry: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },

  qrBox: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.background,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  qrBoxCenter: { alignItems: "center", justifyContent: "center", gap: spacing.sm },
  qrImage: { width: 224, height: 224, borderRadius: radii.md, backgroundColor: "#FFFFFF" },
  qrErrorText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.danger, textAlign: "center" },

  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
});

export default EventAttendance;
