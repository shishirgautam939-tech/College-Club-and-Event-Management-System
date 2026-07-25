import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Check, ClipboardCheck, Eye, X } from "lucide-react-native";
import { getFacultyProposedEvents, reviewEvent, getAllEvents, completeEvent } from "../../api/events";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import InlineAlert from "../../components/ui/InlineAlert";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Avatar from "../../components/ui/Avatar";

const TABS = [
  { key: "pending", label: "Pending review" },
  { key: "approved", label: "Approved events" },
];

const EmptyState = ({ title, sub }) => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyTitle}>{title}</Text>
    {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
  </View>
);

const FacultyEvents = ({ navigation }) => {
  const [tab, setTab] = useState("pending");
  const [events, setEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState("");

  const fetchEvents = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await getFacultyProposedEvents();
      setEvents(res.data);
    } catch {
      setError("Failed to load proposed events.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchApproved = useCallback(async () => {
    try {
      const res = await getAllEvents("Approved");
      setApprovedEvents(res.data);
    } catch {
      // Faculty may not have access to all events, fallback silently
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (tab === "approved") fetchApproved();
  }, [tab, fetchApproved]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents({ silent: true });
      if (tab === "approved") fetchApproved();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchEvents({ silent: true }), fetchApproved()]).finally(() => setRefreshing(false));
  };

  const handleReview = async (eventId, decision) => {
    setActionError("");
    setActionSuccess("");
    try {
      await reviewEvent(eventId, { decision, remarks });
      setActionSuccess(`Event ${decision.toLowerCase()} successfully.`);
      setReviewingId(null);
      setRemarks("");
      fetchEvents();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.");
    }
  };

  const handleComplete = async (eventId) => {
    setActionError("");
    setActionSuccess("");
    try {
      await completeEvent(eventId);
      setActionSuccess("Event marked as completed.");
      fetchApproved();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <PageHeader
        eyebrow={
          <>
            <ClipboardCheck size={13} color="#FFFFFF" />
            <Text style={styles.eyebrowText}>Approvals</Text>
          </>
        }
        title="Faculty reviews"
        subtitle="Review pending event proposals and complete approved events."
      />

      {error ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{error}</InlineAlert> : null}
      {actionSuccess ? <InlineAlert type="success" style={{ marginTop: spacing.md }}>{actionSuccess}</InlineAlert> : null}
      {actionError ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{actionError}</InlineAlert> : null}

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tabChip, active && styles.tabChipActive]}>
              <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{t.label}</Text>
              {t.key === "pending" ? (
                <StatusBadge tone="tan" style={{ marginLeft: 6 }}>
                  {events.length}
                </StatusBadge>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {tab === "pending" ? (
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          {events.length === 0 ? (
            <Card style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
              <Text style={styles.mutedText}>No pending event proposals.</Text>
            </Card>
          ) : (
            events.map((ev) => (
              <Card key={ev.id}>
                <View style={styles.titleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{ev.title}</Text>
                    <Text style={styles.cardMeta}>
                      Club: {ev.club_name}  ·  Proposed by: {ev.created_by_name}  ·  Event date: {formatDate(ev.event_date)}
                    </Text>
                    {ev.description ? <Text style={styles.cardDesc}>{ev.description}</Text> : null}
                  </View>
                  <StatusBadge tone="warning">{ev.status}</StatusBadge>
                </View>

                {reviewingId === ev.id ? (
                  <View style={styles.reviewBox}>
                    <Input
                      label="Remarks (optional)"
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Add remarks…"
                      multiline
                      numberOfLines={2}
                      style={{ height: 64, paddingTop: 10, textAlignVertical: "top" }}
                    />
                    <View style={styles.actionsRow}>
                      <Button style={{ flex: 1 }} icon={<Check size={16} color="#FFFFFF" />} onPress={() => handleReview(ev.id, "Approved")}>
                        Approve
                      </Button>
                      <Button style={{ flex: 1 }} variant="destructive" icon={<X size={16} color="#FFFFFF" />} onPress={() => handleReview(ev.id, "Rejected")}>
                        Reject
                      </Button>
                    </View>
                    <Button
                      variant="outline"
                      onPress={() => {
                        setReviewingId(null);
                        setRemarks("");
                      }}
                    >
                      Cancel
                    </Button>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <Button style={{ flex: 1 }} icon={<Eye size={16} color="#FFFFFF" />} onPress={() => setReviewingId(ev.id)}>
                      Review
                    </Button>
                    <Button
                      style={{ flex: 1 }}
                      variant="outline"
                      textStyle={{ color: colors.success }}
                      icon={<Check size={16} color={colors.success} />}
                      onPress={() => handleReview(ev.id, "Approved")}
                    >
                      Quick approve
                    </Button>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      ) : (
        <Card style={styles.listCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Approved &amp; upcoming <Text style={styles.sectionCount}>· {approvedEvents.length} events</Text>
            </Text>
          </View>
          {approvedEvents.length === 0 ? (
            <EmptyState title="No approved events" />
          ) : (
            approvedEvents.map((ev, idx) => (
              <View key={ev.id} style={[styles.listRow, idx > 0 && styles.rowBorder]}>
                <View style={styles.listRowTop}>
                  <Avatar name={ev.title} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={styles.rowSub}>{ev.club_name} · {formatDateTime(ev.event_date)}</Text>
                  </View>
                </View>
                <View style={styles.rowActions}>
                  <Button
                    size="sm"
                    variant="outline"
                    textStyle={{ color: colors.success }}
                    icon={<Check size={14} color={colors.success} />}
                    onPress={() => handleComplete(ev.id)}
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ClipboardCheck size={14} color={colors.textPrimary} />}
                    onPress={() => navigation.navigate("EventAttendance", { eventId: ev.id })}
                  >
                    Attendance
                  </Button>
                </View>
              </View>
            ))
          )}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.background },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.6 },

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
  tabChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: radii.sm },
  tabChipActive: { backgroundColor: colors.primaryMuted },
  tabChipText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.textMuted },
  tabChipTextActive: { color: colors.primary },

  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.textPrimary },
  cardMeta: { marginTop: 4, fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 },
  cardDesc: { marginTop: 6, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  reviewBox: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: spacing.md, gap: spacing.sm },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },

  listCard: { marginTop: spacing.lg, padding: 0, overflow: "hidden" },
  sectionHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.background },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  sectionCount: { fontFamily: fontFamily.regular, color: colors.textMuted },

  emptyWrap: { paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, alignItems: "center", gap: 4 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  emptySub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: "center" },

  listRow: { padding: spacing.md, gap: spacing.sm },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  listRowTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowTitle: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  rowSub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  rowActions: { flexDirection: "row", gap: spacing.sm, marginLeft: 46 },
});

export default FacultyEvents;
