import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Pencil, Plus, Search, Trash2, UserCog } from "lucide-react-native";
import { getAllUsers, getDepartments, deleteUser } from "../../api/users";
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

// "accent" doesn't exist in the mobile tone palette, so it's swapped for
// "tan" — the same substitution used on AdminUsersHome for the Admins group.
const DEPT_TONE = ["info", "success", "warning", "violet", "tan"];

const matchesDepartment = (userDepartment, deptId) =>
  userDepartment === deptId || userDepartment?.id === deptId;

// Department is local screen state instead of a URL search param — see the
// same note in Students.jsx.
const Faculty = ({ navigation, route }) => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDept, setSelectedDept] = useState(route?.params?.dept ? Number(route.params.dept) : null);

  const validDeptId = Number.isInteger(selectedDept) && selectedDept > 0 ? selectedDept : null;

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [usersRes, deptsRes] = await Promise.all([getAllUsers(), getDepartments()]);
      setUsers(usersRes.data.filter((u) => u.user_type === "Faculty"));
      setDepartments(deptsRes.data);
    } catch {
      setError("Failed to load data.");
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
      setActionMsg({ type: "success", text: `Faculty "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Failed to delete." });
    } finally {
      setDeleteTarget(null);
    }
  };

  const deptInfo = departments.find((d) => d.id === validDeptId);
  const filteredFaculty = useMemo(
    () => users.filter((u) => matchesDepartment(u.department, validDeptId)),
    [users, validDeptId],
  );
  const searchedFaculty = useMemo(() => {
    if (!search.trim()) return filteredFaculty;
    const q = search.toLowerCase();
    return filteredFaculty.filter(
      (u) => u.full_name.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q),
    );
  }, [filteredFaculty, search]);

  const deptIndex = departments.findIndex((d) => d.id === validDeptId);
  const deptTone = DEPT_TONE[(deptIndex >= 0 ? deptIndex : 0) % DEPT_TONE.length];

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

  // No department selected — show department cards.
  if (!selectedDept) {
    const totalFaculty = users.length;
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <PageHeader
          eyebrow={<Text style={styles.eyebrowText}>Faculty</Text>}
          title="Browse by department"
          subtitle={`Choose a department to see its faculty members. ${totalFaculty} faculty on campus.`}
          actions={
            <Button
              variant="ghost"
              icon={<Plus size={16} color="#FFFFFF" />}
              onPress={() => navigation.navigate("CreateUser")}
              style={styles.headerButton}
              textStyle={styles.headerButtonText}
            >
              Add new faculty
            </Button>
          }
        />

        <View style={styles.branchGrid}>
          {departments.map((dept, idx) => {
            const count = users.filter((u) => matchesDepartment(u.department, dept.id)).length;
            const shortName = dept.department_name.replace("Department of ", "");
            const tone = DEPT_TONE[idx % DEPT_TONE.length];
            const toneC = toneColors[tone] || toneColors.brand;
            return (
              <Pressable key={dept.id} onPress={() => setSelectedDept(dept.id)} style={styles.branchCard}>
                <View style={[styles.branchIconWrap, { backgroundColor: toneC.bg }]}>
                  <UserCog size={20} color={toneC.fg} />
                </View>
                <Text style={styles.branchCode} numberOfLines={2}>
                  {shortName}
                </Text>
                <Text style={styles.branchCount}>{count}</Text>
                <StatusBadge tone={tone}>Faculty</StatusBadge>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // Department selected but invalid.
  if (!validDeptId) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow={<Text style={styles.eyebrowText}>Faculty</Text>}
          title="Department not found"
          subtitle="The selected department is invalid. Please go back and choose a valid department."
          actions={
            <Button
              variant="ghost"
              icon={<ArrowLeft size={16} color="#FFFFFF" />}
              onPress={() => setSelectedDept(null)}
              style={styles.headerButton}
              textStyle={styles.headerButtonText}
            >
              Back to departments
            </Button>
          }
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <PageHeader
        eyebrow={<Text style={styles.eyebrowText}>{`Faculty · ${deptInfo?.department_name || "Department"}`}</Text>}
        title={`${deptInfo?.department_name || "Department"} — Faculty`}
        subtitle={`${filteredFaculty.length} members · ${searchedFaculty.length} shown`}
        actions={
          <Button
            variant="ghost"
            icon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => navigation.navigate("CreateUser")}
            style={styles.headerButton}
            textStyle={styles.headerButtonText}
          >
            Add new faculty
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
          <Pressable onPress={() => setSelectedDept(null)} style={styles.branchesBtn} hitSlop={8}>
            <ArrowLeft size={14} color={colors.textPrimary} />
            <Text style={styles.branchesBtnText}>Departments</Text>
          </Pressable>
          <StatusBadge tone={deptTone}>{deptInfo?.department_name || "Department"}</StatusBadge>
          <Text style={styles.shownCount}>
            {searchedFaculty.length} of {filteredFaculty.length}
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            style={styles.searchInput}
            containerStyle={styles.searchInputContainer}
          />
        </View>

        {searchedFaculty.length > 0 ? (
          <View style={styles.groupList}>
            {searchedFaculty.map((user, idx) => (
              <View key={user.id} style={[styles.userRow, idx > 0 && styles.userRowBorder]}>
                <Avatar name={user.full_name} size={38} bg={colors.violet} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.full_name}
                  </Text>
                  <Text style={styles.userSub} numberOfLines={1}>
                    Faculty · {user.email}
                  </Text>
                  <View style={styles.chipRow}>
                    <StatusBadge tone={deptTone}>{deptInfo?.department_name || "—"}</StatusBadge>
                    <StatusBadge tone={user.is_active ? "success" : "warning"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <Pressable
                    accessibilityLabel="Edit faculty"
                    hitSlop={8}
                    onPress={() => navigation.navigate("EditUser", { userId: user.id })}
                    style={styles.iconBtn}
                  >
                    <Pencil size={16} color={colors.textPrimary} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Delete faculty"
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
            <Text style={styles.emptyTitle}>{search ? "No matches" : "No faculty in this department"}</Text>
            <Text style={styles.emptySub}>
              {search ? "Try a different search term." : "Add the first faculty member."}
            </Text>
          </View>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete faculty?"
        description={deleteTarget ? `Delete faculty "${deleteTarget.full_name}"? This action cannot be undone.` : ""}
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
  branchCode: {
    marginTop: 4,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textAlign: "center",
  },
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

  userActions: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 32, height: 32, borderRadius: radii.sm, alignItems: "center", justifyContent: "center" },
  iconBtnDanger: { backgroundColor: colors.dangerMuted },

  emptyState: { alignItems: "center", paddingVertical: spacing.xxl, gap: 4 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  emptySub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
});

export default Faculty;
