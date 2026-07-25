import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Users,
  Building2,
  LayoutGrid,
  Clock,
  CalendarCheck2,
  UserPlus,
  FolderPlus,
} from "lucide-react-native";
import { getDashboardStats } from "../../api/users";
import useAuth from "../../hooks/useAuth";
import { colors, radii, shadow, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import { formatTimeAgo } from "../../utils/formatDate";
import Avatar from "../../components/ui/Avatar";
import InlineAlert from "../../components/ui/InlineAlert";

const TONE_DOT = { success: colors.success, info: colors.info, neutral: colors.tan };

const AdminDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch {
      setError("Failed to load dashboard stats.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch every time the tab regains focus (e.g. after adding a user or
  // approving an event elsewhere), not just on first mount.
  useFocusEffect(
    useCallback(() => {
      load({ silent: true });
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load({ silent: true });
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Loading dashboard…</Text>
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={[styles.screen, { justifyContent: "center" }]}>
        <InlineAlert type="error">{error}</InlineAlert>
      </View>
    );
  }

  const activeMembers = (stats.total_students || 0) + (stats.total_faculty || 0);
  const branchBreakdown = stats.branch_breakdown || [];
  const branchLegend = branchBreakdown.map((b) => b.branch).join(" • ");

  const overviewCards = [
    {
      key: "students",
      label: "Students",
      value: stats.total_students,
      sub: branchLegend || "All branches",
      Icon: Users,
      tone: "brand",
      // Students/Faculty only exist inside the Users tab's own stack (see
      // AdminTabNavigator.jsx) — this screen lives in the Dashboard tab's
      // stack, so it has to jump tabs via the nested-navigate form rather
      // than navigating to the screen name directly.
      onPress: () => navigation.navigate("UsersTab", { screen: "Students" }),
    },
    {
      key: "faculty",
      label: "Faculty",
      value: stats.total_faculty,
      sub: `${stats.total_departments ?? 0} department${stats.total_departments === 1 ? "" : "s"}`,
      Icon: Building2,
      tone: "violet",
      onPress: () => navigation.navigate("UsersTab", { screen: "Faculty" }),
    },
    {
      key: "clubs",
      label: "Clubs",
      value: stats.total_clubs,
      sub: `${stats.clubs_pending_approval ?? 0} pending approval`,
      Icon: LayoutGrid,
      tone: "tan",
      onPress: () => navigation.navigate("Clubs"),
    },
    {
      key: "pending",
      label: "Pending",
      value: stats.pending_events,
      sub: "Awaiting review",
      Icon: Clock,
      tone: "warning",
      onPress: () => navigation.navigate("AdminEvents"),
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Section A — Header greeting */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Admin portal</Text>
          <Text style={styles.greeting}>
            {greeting}, {user?.name?.split(" ")[0] || "Admin"}
          </Text>
        </View>
        <Avatar name={user?.name || "Admin"} size={44} />
      </View>
      <View style={styles.subheadRow}>
        <View style={styles.subheadDot} />
        <Text style={styles.subheadText}>
          {activeMembers} active members across {branchBreakdown.length || 4} branches
        </Text>
      </View>

      {error ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{error}</InlineAlert> : null}

      {/* Section B — Branch distribution grid */}
      <View style={styles.branchGrid}>
        {branchBreakdown.map((b) => (
          <View key={b.branch} style={styles.branchCard}>
            <Text style={styles.branchLabel}>{b.branch}</Text>
            <Text style={styles.branchValue}>{b.count}</Text>
          </View>
        ))}
      </View>

      {/* Section C — Overview grid (rows 1–2: two equal cards each) */}
      <View style={styles.overviewGrid}>
        {overviewCards.map(({ key, label, value, sub, Icon, tone, onPress }) => (
          <Pressable key={key} onPress={onPress} style={styles.overviewCard}>
            <View style={[styles.overviewIconWrap, { backgroundColor: toneBg(tone) }]}>
              <Icon size={18} color={toneFg(tone)} />
            </View>
            <Text style={styles.overviewLabel}>{label}</Text>
            <Text style={styles.overviewValue}>{value ?? 0}</Text>
            <Text style={styles.overviewSub} numberOfLines={1}>{sub}</Text>
          </Pressable>
        ))}
      </View>

      {/* Section C row 3 + Section D — Approved card alongside Quick Actions */}
      <View style={styles.bottomRow}>
        <Pressable
          onPress={() => navigation.navigate("AdminEvents")}
          style={[styles.overviewCard, styles.bottomCol]}
        >
          <View style={[styles.overviewIconWrap, { backgroundColor: colors.successMuted }]}>
            <CalendarCheck2 size={18} color={colors.success} />
          </View>
          <Text style={styles.overviewLabel}>Approved</Text>
          <Text style={styles.overviewValue}>{stats.approved_events ?? 0}</Text>
          <Text style={styles.overviewSub}>This semester</Text>
        </Pressable>

        <View style={[styles.quickActions, styles.bottomCol]}>
          <Text style={styles.quickActionsTitle}>Quick actions</Text>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate("CreateUser")}
          >
            <UserPlus size={16} color={colors.dark} />
            <Text style={styles.quickActionText}>Add User</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate("CreateClub")}
          >
            <FolderPlus size={16} color={colors.dark} />
            <Text style={styles.quickActionText}>Add Club</Text>
          </Pressable>
        </View>
      </View>

      {/* Section E — Recent activity feed */}
      <Text style={styles.sectionLabel}>Recent activity</Text>
      <View style={styles.activityCard}>
        {(stats.recent_activity || []).length === 0 ? (
          <Text style={[styles.mutedText, { padding: spacing.lg }]}>Nothing yet.</Text>
        ) : (
          stats.recent_activity.map((item, i) => (
            <View
              key={`${item.type}-${item.timestamp}-${i}`}
              style={[styles.activityRow, i > 0 && styles.activityRowBorder]}
            >
              <View style={[styles.activityDot, { backgroundColor: TONE_DOT[item.tone] || colors.tan }]} />
              <Text style={styles.activityText} numberOfLines={2}>{item.message}</Text>
              <Text style={styles.activityTime}>{formatTimeAgo(item.timestamp)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

function toneBg(tone) {
  return (
    {
      brand: colors.primaryMuted,
      violet: colors.violetMuted,
      tan: colors.tanMuted,
      warning: colors.warningMuted,
    }[tone] || colors.primaryMuted
  );
}
function toneFg(tone) {
  return (
    {
      brand: colors.primary,
      violet: colors.violet,
      tan: colors.tan,
      warning: colors.warning,
    }[tone] || colors.primary
  );
}

const CARD_GAP = spacing.md;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },

  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  eyebrow: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  greeting: {
    marginTop: 4,
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  subheadRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm },
  subheadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  subheadText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },

  branchGrid: { flexDirection: "row", gap: CARD_GAP, marginTop: spacing.xl },
  branchCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    ...shadow.card,
  },
  branchLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  branchValue: { marginTop: 4, fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary },

  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    marginTop: spacing.xl,
  },
  overviewCard: {
    width: `${100 * (1 / 2) - 3}%`,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  overviewIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewLabel: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  overviewValue: { marginTop: 2, fontFamily: fontFamily.bold, fontSize: fontSize.xxl, color: colors.textPrimary },
  overviewSub: { marginTop: 2, fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },

  bottomRow: { flexDirection: "row", gap: CARD_GAP, marginTop: CARD_GAP },
  bottomCol: { flex: 1, width: undefined },

  quickActions: {
    backgroundColor: colors.dark,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  quickActionsTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(253,251,247,0.6)",
    marginBottom: 2,
  },
  quickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.tan,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  quickActionText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.dark },

  sectionLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow.card,
  },
  activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  activityRowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { flex: 1, fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textPrimary },
  activityTime: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
});

export default AdminDashboard;
