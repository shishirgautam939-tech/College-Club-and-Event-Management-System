import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, GraduationCap, Pencil, Plus, Search, Trash2 } from "lucide-react-native";
import { getAllUsers, deleteUser } from "../../api/users";
import { colors, radii, shadow, spacing, toneColors } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import StatusBadge from "../../components/ui/StatusBadge";
import InlineAlert from "../../components/ui/InlineAlert";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Avatar from "../../components/ui/Avatar";
import PageHeader from "../../components/ui/PageHeader";

const BRANCHES = [
  { code: "BCT", label: "BCT - Computer", tone: "info" },
  { code: "BCE", label: "BCE - Civil", tone: "success" },
  { code: "BEE", label: "BEE - Electrical", tone: "warning" },
  { code: "BEI", label: "BEI - Electronics", tone: "violet" },
];

// The web version stores the selected branch in the URL (?branch=BCT) so it
// survives a refresh/back-nav. There's no query-string equivalent in a
// native stack, so it's local screen state instead — seeded from
// route.params.branch in case something ever deep-links in with one.
const Students = ({ navigation, route }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(route?.params?.branch || null);

  const branchInfo = BRANCHES.find((b) => b.code === selectedBranch);
  const filteredStudents = useMemo(
    () => (selectedBranch ? users.filter((u) => u.branch === selectedBranch) : users),
    [users, selectedBranch],
  );
  const searchedStudents = useMemo(() => {
    if (!search.trim()) return filteredStudents;
    const q = search.toLowerCase();
    return filteredStudents.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.roll_number || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }, [filteredStudents, search]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await getAllUsers();
      setUsers(res.data.filter((u) => u.user_type === "Student"));
    } catch {
      setError("Failed to load students.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load({ silent: true });
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load({ silent: true });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id: userId, full_name: userName } = deleteTarget;
    setActionMsg({ type: "", text: "" });
    try {
      await deleteUser(userId);
      setActionMsg({ type: "success", text: `Student "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Failed to delete student." });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, styles.centered, { padding: spacing.lg }]}>
        <InlineAlert type="error">{error}</InlineAlert>
      </View>
    );
  }

  if (selectedBranch && !branchInfo) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow={<Text style={styles.eyebrowText}>Students</Text>}
          title="Branch not found"
          subtitle="The selected branch is invalid. Please choose a branch from the list."
          actions={
            <Button
              variant="ghost"
              icon={<ArrowLeft size={16} color="#FFFFFF" />}
              onPress={() => setSelectedBranch(null)}
              style={styles.headerButton}
              textStyle={styles.headerButtonText}
            >
              Back to branches
            </Button>
          }
        />
      </ScrollView>
    );
  }

  // No branch selected — show the branch picker grid.
  if (!selectedBranch) {
    const totalStudents = users.length;
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <PageHeader
          eyebrow={<Text style={styles.eyebrowText}>Students</Text>}
          title="Browse by branch"
          subtitle={`Pick a branch to view enrolled students. ${totalStudents} students on campus.`}
          actions={
            <Button
              variant="ghost"
              icon={<Plus size={16} color="#FFFFFF" />}
              onPress={() => navigation.navigate("CreateUser")}
              style={styles.headerButton}
              textStyle={styles.headerButtonText}
            >
              Add new student
            </Button>
          }
        />

        <View style={styles.branchGrid}>
          {BRANCHES.map((b) => {
            const count = users.filter((u) => u.branch === b.code).length;
            const tone = toneColors[b.tone] || toneColors.brand;
            return (
              <Pressable key={b.code} onPress={() => setSelectedBranch(b.code)} style={styles.branchCard}>
                <View style={[styles.branchIconWrap, { backgroundColor: tone.bg }]}>
                  <GraduationCap size={20} color={tone.fg} />
                </View>
                <Text style={styles.branchCode}>{b.code}</Text>
                <Text style={styles.branchName}>{b.label.split(" - ")[1]}</Text>
                <Text style={styles.branchCount}>{count}</Text>
                <StatusBadge tone={b.tone}>Students</StatusBadge>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // Branch selected — show the filtered student list.
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <PageHeader
        eyebrow={<Text style={styles.eyebrowText}>{`Students · ${selectedBranch}`}</Text>}
        title={`${branchInfo?.label || selectedBranch} students`}
        subtitle={`${filteredStudents.length} enrolled · ${searchedStudents.length} shown`}
        actions={
          <Button
            variant="ghost"
            icon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => navigation.navigate("CreateUser")}
            style={styles.headerButton}
            textStyle={styles.headerButtonText}
          >
            Add new student
          </Button>
        }
      />

      {actionMsg.text ? (
        <InlineAlert type={actionMsg.type} style={{ marginTop: spacing.md }}>
          {actionMsg.text}
        </InlineAlert>
      ) : null}

      <Card style={styles.listCard}>
        <View style={styles.listToolbar}>
          <Pressable onPress={() => setSelectedBranch(null)} style={styles.branchesBtn} hitSlop={8}>
            <ArrowLeft size={14} color={colors.textPrimary} />
            <Text style={styles.branchesBtnText}>Branches</Text>
          </Pressable>
          <StatusBadge tone="info">{selectedBranch}</StatusBadge>
          <Text style={styles.shownCount}>
            {searchedStudents.length} of {filteredStudents.length}
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
          <Input
            placeholder="Search name, roll, or email…"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            style={styles.searchInput}
            containerStyle={styles.searchInputContainer}
          />
        </View>

        {searchedStudents.length > 0 ? (
          <View style={styles.groupList}>
            {searchedStudents.map((user, idx) => (
              <View key={user.id} style={[styles.userRow, idx > 0 && styles.userRowBorder]}>
                <Avatar name={user.full_name} size={38} bg={colors.primary} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.full_name}
                  </Text>
                  <Text style={styles.userSub} numberOfLines={1}>
                    Student · {user.email}
                  </Text>
                  <View style={styles.chipRow}>
                    <View style={styles.codeChip}>
                      <Text style={styles.codeChipText}>{user.roll_number || "—"}</Text>
                    </View>
                    <StatusBadge tone={branchInfo?.tone || "brand"}>{user.branch || "—"}</StatusBadge>
                    <StatusBadge tone={user.is_active ? "success" : "warning"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <Pressable
                    accessibilityLabel="Edit student"
                    hitSlop={8}
                    onPress={() => navigation.navigate("EditUser", { userId: user.id })}
                    style={styles.iconBtn}
                  >
                    <Pencil size={16} color={colors.textPrimary} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Delete student"
                    hitSlop={8}
                    onPress={() => setDeleteTarget(user)}
                    style={[styles.iconBtn, styles.iconBtnDanger]}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{search ? "No matches" : "No students in this branch"}</Text>
            <Text style={styles.emptySub}>
              {search ? "Try a different search term." : "Add the first student to get started."}
            </Text>
          </View>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete student?"
        description={deleteTarget ? `Delete student "${deleteTarget.full_name}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },

  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF", letterSpacing: 0.4 },
  headerButton: { backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  headerButtonText: { color: "#FFFFFF" },

  branchGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  branchCard: {
    width: "47%",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    ...shadow.card,
  },
  branchIconWrap: { width: 44, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  branchCode: { marginTop: 4, fontFamily: fontFamily.semibold, fontSize: fontSize.base, color: colors.textPrimary },
  branchName: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
  branchCount: { fontFamily: fontFamily.bold, fontSize: fontSize.xxl, color: colors.textPrimary },

  listCard: { padding: spacing.lg, gap: spacing.md },
  listToolbar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  branchesBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  branchesBtnText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  shownCount: { marginLeft: "auto", fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },

  searchWrap: { justifyContent: "center" },
  searchIcon: { position: "absolute", left: 14, top: 15, zIndex: 1 },
  searchInputContainer: { gap: 0 },
  searchInput: { paddingLeft: 38 },

  groupList: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  userRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md },
  userRowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  userSub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
  chipRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 4 },
  codeChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  codeChipText: { fontFamily: fontFamily.medium, fontSize: 11, color: colors.textPrimary },

  userActions: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 32, height: 32, borderRadius: radii.sm, alignItems: "center", justifyContent: "center" },
  iconBtnDanger: { backgroundColor: colors.dangerMuted },

  emptyState: { alignItems: "center", paddingVertical: spacing.xxl, gap: 4 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  emptySub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
});

export default Students;
