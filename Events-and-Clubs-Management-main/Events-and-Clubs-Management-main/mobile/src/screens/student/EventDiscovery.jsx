import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar, MapPin, Search, Users, Zap, QrCode } from "lucide-react-native";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { getApprovedEvents } from "../../api/events";
import { registerForEvent, unregisterFromEvent, getEventQRAttendance } from "../../api/participation";
import { saveArrayBufferAsFile } from "../../utils/downloadFile";
import { formatDateTime } from "../../utils/formatDate";
import useAuth from "../../hooks/useAuth";
import { colors, radii, spacing, shadow } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import InlineAlert from "../../components/ui/InlineAlert";
import PageHeader from "../../components/ui/PageHeader";

const EventDiscovery = ({ navigation }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [actionInProgress, setActionInProgress] = useState(null);
  const [search, setSearch] = useState("");
  const [qrEvent, setQrEvent] = useState(null);

  const fetchEvents = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await getApprovedEvents();
      setEvents(res.data);
      setError("");
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents({ silent: true });
    }, [fetchEvents]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents({ silent: true });
  };

  const handleRegister = async (eventId) => {
    setActionMsg({ type: "", text: "" });
    setActionInProgress(eventId);
    try {
      await registerForEvent(eventId);
      setActionMsg({ type: "success", text: "You're registered. See you there!" });
      fetchEvents({ silent: true });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Registration failed.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnregister = async (eventId) => {
    setActionMsg({ type: "", text: "" });
    setActionInProgress(eventId);
    try {
      await unregisterFromEvent(eventId);
      setActionMsg({ type: "success", text: "Registration cancelled." });
      fetchEvents({ silent: true });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Unregister failed.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Loading events…</Text>
      </View>
    );
  }

  const filtered = events.filter(
    (ev) =>
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.club_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (ev.venue || "").toLowerCase().includes(search.toLowerCase()),
  );

  const isFull = (ev) => ev.spots_left === 0;
  const isStudent = user?.role === "Student";

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
              <Zap size={14} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>Discover</Text>
            </>
          }
          title="Find your next event"
          subtitle={`${events.length} approved event${events.length === 1 ? "" : "s"} on campus · register, attend, and earn certificates.`}
        />

        <View style={styles.searchRow}>
          <Text style={styles.resultCount}>
            {filtered.length} event{filtered.length === 1 ? "" : "s"} matching your search
          </Text>
          <View style={styles.searchWrap}>
            <View style={styles.searchIcon} pointerEvents="none">
              <Search size={16} color={colors.textMuted} />
            </View>
            <Input
              placeholder="Search by name, club, or venue…"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              containerStyle={{ flex: 1 }}
            />
          </View>
        </View>

        {error ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{error}</InlineAlert> : null}
        {actionMsg.text ? (
          <InlineAlert type={actionMsg.type} style={{ marginTop: spacing.md }}>{actionMsg.text}</InlineAlert>
        ) : null}

        {filtered.length === 0 ? (
          <Card style={{ marginTop: spacing.lg, alignItems: "center", paddingVertical: spacing.xxl }}>
            <Text style={styles.emptyText}>
              {search ? "No events match your search." : "Nothing scheduled right now. Check back soon."}
            </Text>
          </Card>
        ) : (
          <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
            {filtered.map((ev) => (
              <Card key={ev.id}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{ev.title}</Text>
                  {ev.is_registered ? <StatusBadge tone="success">Joined</StatusBadge> : null}
                </View>

                <Text style={styles.cardClub}>{ev.club_name}</Text>

                {ev.description ? (
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {ev.description}
                  </Text>
                ) : null}

                <View style={styles.metaBlock}>
                  <View style={styles.metaRow}>
                    <Calendar size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{formatDateTime(ev.event_date)}</Text>
                  </View>
                  {ev.venue ? (
                    <View style={styles.metaRow}>
                      <MapPin size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{ev.venue}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Users size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      <Text style={styles.metaStrong}>{ev.registration_count}</Text>
                      {ev.max_participants ? ` / ${ev.max_participants}` : ""} registered
                    </Text>
                    {isFull(ev) ? (
                      <StatusBadge tone="danger" style={{ marginLeft: 4 }}>Full</StatusBadge>
                    ) : null}
                  </View>
                </View>

                {isStudent ? (
                  <View style={styles.cardActions}>
                    {ev.is_registered ? (
                      <View style={{ gap: spacing.sm }}>
                        <View style={styles.qrStatusRow}>
                          <Text style={styles.qrStatusText}>
                            {ev.attendance_qr_active ? "QR ready for check-in" : "Preparing your QR…"}
                          </Text>
                          {ev.attendance_qr_active ? <StatusBadge tone="success">Active</StatusBadge> : null}
                        </View>
                        <View style={styles.buttonRow}>
                          <Button
                            onPress={() => setQrEvent(ev)}
                            disabled={!ev.attendance_qr_active}
                            style={{ flex: 1 }}
                          >
                            Show my QR
                          </Button>
                          <Button
                            variant="outline"
                            onPress={() => handleUnregister(ev.id)}
                            disabled={actionInProgress === ev.id}
                            style={{ flex: 1 }}
                            textStyle={{ color: colors.danger }}
                          >
                            {actionInProgress === ev.id ? "…" : "Cancel"}
                          </Button>
                        </View>
                      </View>
                    ) : (
                      <Button
                        onPress={() => handleRegister(ev.id)}
                        disabled={actionInProgress === ev.id || isFull(ev)}
                        loading={actionInProgress === ev.id}
                      >
                        {isFull(ev) ? "Event full" : "Register"}
                      </Button>
                    )}
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {qrEvent ? (
        <EventQrModal
          event={qrEvent}
          navigation={navigation}
          onClose={() => setQrEvent(null)}
          onAfterClose={() => {
            setQrEvent(null);
            fetchEvents({ silent: true });
          }}
        />
      ) : null}
    </>
  );
};

// Fetches and displays the student's attendance QR for an event. Always
// re-fetches on open so the displayed code matches the current server token
// (handles organizer rotations and lazy activations). Mirrors web's
// client/src/components/EventQRModal.jsx as an inline RN Modal since there's
// no shared modal component to reuse on mobile.
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
      // Sharing may be unavailable on some devices — fail silently, same
      // spirit as the web version's plain <a download> click.
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: 0 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: spacing.sm },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF" },

  searchRow: { marginTop: spacing.lg, gap: spacing.sm },
  resultCount: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
  searchWrap: { position: "relative", justifyContent: "center" },
  searchIcon: { position: "absolute", left: 14, zIndex: 1 },
  searchInput: { paddingLeft: 38 },

  emptyText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },

  cardHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  cardTitle: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fontSize.lg, color: colors.textPrimary },
  cardClub: { marginTop: 4, fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.primary },
  cardDescription: { marginTop: spacing.sm, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },

  metaBlock: { marginTop: spacing.md, gap: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
  metaStrong: { fontFamily: fontFamily.semibold, color: colors.textPrimary },

  cardActions: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  qrStatusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qrStatusText: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
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

export default EventDiscovery;
