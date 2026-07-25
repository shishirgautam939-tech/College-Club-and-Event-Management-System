import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
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

const STATUS_TONE = { Proposed: "warning", Approved: "info", Rejected: "danger", Completed: "success" };
const TABS = [
  { key: "pending", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All events" },
];

const EmptyState = ({ title, sub }) => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyTitle}>{title}</Text>
    {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
  </View>
);

const AdminEvents = ({ navigation }) => {
  const [tab, setTab] = useState("pending");
  const [pendingEvents, setPendingEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await getFacultyProposedEvents();
      setPendingEvents(res.data);
    } catch {
      setError("Failed to load events.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchApprovedEvents = useCallback(async () => {
    try {
      const res = await getAllEvents("Approved");
      setApprovedEvents(res.data);
    } catch {
      setError("Failed to load approved events.");
    }
  }, []);

  const fetchAllEvents = useCallback(async () => {
    try {
      const res = await getAllEvents(statusFilter || undefined);
      setAllEvents(res.data);
    } catch {
      setError("Failed to load events.");
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
    fetchApprovedEvents();
  }, [fetchData, fetchApprovedEvents]);

  useEffect(() => {
    if (tab === "all") fetchAllEvents();
    if (tab === "approved") fetchApprovedEvents();
  }, [tab, statusFilter, fetchAllEvents, fetchApprovedEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchData({ silent: true });
      fetchApprovedEvents();
      if (tab === "all") fetchAllEvents();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]),
  );

  const switchTab = (t) => {
    setTab(t);
    setSearch("");
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchData({ silent: true }), fetchApprovedEvents(), tab === "all" ? fetchAllEvents() : null]).finally(
      () => setRefreshing(false),
    );
  };

  const handleReview = async (eventId, decision) => {
    setActionError("");
    setActionSuccess("");
    try {
      await reviewEvent(eventId, { decision, remarks });
      setActionSuccess(`Event ${decision.toLowerCase()} successfully.`);
      setReviewingId(null);
      setRemarks("");
      fetchData();
      fetchApprovedEvents();
      if (tab === "all") fetchAllEvents();
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
      fetchData();
      fetchApprovedEvents();
      fetchAllEvents();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.");
    }
  };

  const filterEvents = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.club_name || "").toLowerCase().includes(q) ||
        (e.created_by_name || "").toLowerCase().includes(q) ||
        (e.venue || "").toLowerCase().includes(q),
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Loading…</Text>
      </View>
    );
  }

  const visibleApproved = filterEvents(approvedEvents);
  const visibleAll = filterEvents(allEvents);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <PageHeader
        eyebrow={<Text style={styles.eyebrowText}>Events</Text>}
        title="Event management"
        subtitle={`${pendingEvents.length} pending · ${approvedEvents.length} approved · review proposals and run events end to end.`}
      />

      {error ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{error}</InlineAlert> : null}
      {actionSuccess ? <InlineAlert type="success" style={{ marginTop: spacing.md }}>{actionSuccess}</InlineAlert> : null}
      {actionError ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{actionError}</InlineAlert> : null}

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => switchTab(t.key)} style={[styles.tabChip, active && styles.tabChipActive]}>
              <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{t.label}</Text>
              {t.key === "pending" ? (
                <StatusBadge tone="tan" style={{ marginLeft: 6 }}>
                  {pendingEvents.length}
                </StatusBadge>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {tab === "pending" ? (
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          {pendingEvents.length === 0 ? (
            <Card style={{ padding: 0 }}>
              <EmptyState
                title="No pending proposals"
                sub="You're all caught up — every event proposal has been reviewed."
              />
            </Card>
          ) : (
            pendingEvents.map((ev) => (
              <Card key={ev.id}>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Avatar name={ev.title} size={40} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle}>{ev.title}</Text>
                      <StatusBadge tone="warning">{ev.status}</StatusBadge>
                    </View>
                    <Text style={styles.cardMeta}>
                      Club: {ev.club_name}  ·  Proposed by: {ev.created_by_name}  ·  Date: {formatDate(ev.event_date)}
                    </Text>
                    {ev.description ? <Text style={styles.cardDesc}>{ev.description}</Text> : null}
                  </View>
                </View>

                {reviewingId === ev.id ? (
                  <View style={styles.reviewBox}>
                    <Input
                      label="Remarks (optional)"
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Add remarks for the faculty…"
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
      ) : null}

      {tab === "approved" ? (
        <Card style={styles.listCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Approved &amp; upcoming{" "}
              <Text style={styles.sectionCount}>
                · {visibleApproved.length} of {approvedEvents.length}
              </Text>
            </Text>
          </View>
          <View style={styles.toolbar}>
            <Input placeholder="Search title, club, venue…" value={search} onChangeText={setSearch} containerStyle={{ flex: 1 }} />
          </View>

          {approvedEvents.length === 0 ? (
            <EmptyState title="No approved events" sub="Approve a pending proposal to see it here." />
          ) : visibleApproved.length === 0 ? (
            <EmptyState title="No matches" sub="Try a different search term." />
          ) : (
            visibleApproved.map((ev, idx) => (
              <View key={ev.id} style={[styles.listRow, idx > 0 && styles.rowBorder]}>
                <View style={styles.listRowTop}>
                  <Avatar name={ev.title} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={styles.rowSub}>{ev.club_name} · {formatDateTime(ev.event_date)}</Text>
                    <Text style={styles.rowSub}>{ev.venue || "Venue TBA"} · {ev.created_by_name}</Text>
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
      ) : null}

      {tab === "all" ? (
        <Card style={styles.listCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              All events <Text style={styles.sectionCount}>· {visibleAll.length} of {allEvents.length}</Text>
            </Text>
          </View>
          <View style={[styles.toolbar, { flexDirection: "column", alignItems: "stretch", gap: spacing.sm }]}>
            <View style={styles.pickerWrapSm}>
              <Picker selectedValue={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <Picker.Item label="All statuses" value="" />
                <Picker.Item label="Proposed" value="Proposed" />
                <Picker.Item label="Approved" value="Approved" />
                <Picker.Item label="Rejected" value="Rejected" />
                <Picker.Item label="Completed" value="Completed" />
              </Picker>
            </View>
            <Input placeholder="Search title, club, venue…" value={search} onChangeText={setSearch} />
          </View>

          {allEvents.length === 0 ? (
            <EmptyState title="No events found" sub="Try a different filter." />
          ) : visibleAll.length === 0 ? (
            <EmptyState title="No matches" sub="Try a different search or filter." />
          ) : (
            visibleAll.map((ev, idx) => (
              <View key={ev.id} style={[styles.listRow, idx > 0 && styles.rowBorder]}>
                <View style={styles.listRowTop}>
                  <Avatar name={ev.title} size={36} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{ev.title}</Text>
                      <StatusBadge tone={STATUS_TONE[ev.status] || "tan"}>{ev.status}</StatusBadge>
                    </View>
                    <Text style={styles.rowSub}>{ev.club_name} · {formatDateTime(ev.event_date)}</Text>
                    <Text style={styles.rowSub}>{ev.created_by_name}</Text>
                  </View>
                </View>
                {ev.status === "Approved" ? (
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
                ) : ev.status === "Completed" ? (
                  <View style={styles.rowActions}>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Eye size={14} color={colors.textPrimary} />}
                      onPress={() => navigation.navigate("EventAttendance", { eventId: ev.id })}
                    >
                      View attendance
                    </Button>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </Card>
      ) : null}
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

  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  cardTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textPrimary },
  cardMeta: { marginTop: 4, fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 },
  cardDesc: { marginTop: 6, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  reviewBox: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: spacing.md, gap: spacing.sm },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },

  listCard: { marginTop: spacing.lg, padding: 0, overflow: "hidden" },
  sectionHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.background },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  sectionCount: { fontFamily: fontFamily.regular, color: colors.textMuted },
  toolbar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  pickerWrapSm: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, backgroundColor: colors.card, overflow: "hidden" },

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

export default AdminEvents;
