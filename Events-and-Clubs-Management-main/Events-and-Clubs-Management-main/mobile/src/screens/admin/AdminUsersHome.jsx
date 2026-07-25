import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Pencil, Plus, Search, Trash2 } from "lucide-react-native";
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

// Mobile StatusBadge only ships brand/tan/success/info/warning/violet/danger
// tones (no "accent"/"muted" like the web design system), so Admins maps to
// the closest warm tone (tan) and "Inactive" maps to warning instead of a
// neutral gray that doesn't exist here.
const ROLE_META = {
  Students: { tone: "brand", label: "Student" },
  Faculty: { tone: "violet", label: "Faculty" },
  Staff: { tone: "warning", label: "Staff" },
  Admins: { tone: "tan", label: "Admin" },
};

const AdminUsersHome = ({ navigation, route }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Supported for parity with the web version's ?type= filter, in case a
  // future screen deep-links here with a role filter — nothing does today.
  const filterType = route?.params?.type;

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again later.");
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
      setActionMsg({ type: "success", text: `User "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to delete user.",
      });
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

  const allGroups = {
    Students: users.filter((u) => u.user_type === "Student"),
    Faculty: users.filter((u) => u.user_type === "Faculty"),
    Staff: users.filter((u) => u.user_type === "Staff"),
    Admins: users.filter((u) => u.user_type === "Admin"),
  };

  let userGroups = allGroups;
  if (filterType === "Student") userGroups = { Students: allGroups.Students };
  else if (filterType === "Faculty") userGroups = { Faculty: allGroups.Faculty };
  else if (filterType === "Staff") userGroups = { Staff: allGroups.Staff };
  else if (filterType === "Admin") userGroups = { Admins: allGroups.Admins };

  const applySearch = (group) => {
    if (!search.trim()) return group;
    const q = search.toLowerCase();
    return group.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.roll_number || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.branch || "").toLowerCase().includes(q),
    );
  };

  const totalShown = Object.values(userGroups).reduce((sum, g) => sum + applySearch(g).length, 0);
  const totalAll = users.length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <PageHeader
        eyebrow={<Text style={styles.eyebrowText}>User management</Text>}
        title={filterType ? `${filterType} management` : "All users"}
        subtitle={`${totalShown} of ${totalAll} users shown`}
        actions={
          <Button
            variant="ghost"
            icon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => navigation.navigate("CreateUser")}
            style={styles.headerButton}
            textStyle={styles.headerButtonText}
          >
            Add new user
          </Button>
        }
      />

      {actionMsg.text ? (
        <InlineAlert type={actionMsg.type} style={{ marginTop: spacing.md }}>
          {actionMsg.text}
        </InlineAlert>
      ) : null}

      <Card style={styles.listCard}>
        <Text style={styles.listCardLabel}>
          All users <Text style={styles.listCardLabelMuted}>· search across roles</Text>
        </Text>
        <View style={styles.searchWrap}>
          <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
          <Input
            placeholder="Search by name, roll, email, branch…"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            style={styles.searchInput}
            containerStyle={styles.searchInputContainer}
          />
        </View>

        {Object.entries(userGroups).map(([groupName, groupUsers]) => {
          const visible = applySearch(groupUsers);
          const meta = ROLE_META[groupName] || ROLE_META.Students;
          return (
            <View key={groupName} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{groupName}</Text>
                <StatusBadge tone={meta.tone}>{visible.length}</StatusBadge>
              </View>
              {visible.length > 0 ? (
                <View style={styles.groupList}>
                  {visible.map((user, idx) => (
                    <View key={user.id} style={[styles.userRow, idx > 0 && styles.userRowBorder]}>
                      <Avatar
                        name={user.full_name}
                        size={38}
                        bg={(toneColors[meta.tone] || toneColors.brand).fg}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {user.full_name}
                        </Text>
                        <Text style={styles.userSub} numberOfLines={1}>
                          {meta.label} · {user.email}
                        </Text>
                        <View style={styles.chipRow}>
                          {groupName === "Students" && (
                            <>
                              <View style={styles.codeChip}>
                                <Text style={styles.codeChipText}>{user.roll_number || "—"}</Text>
                              </View>
                              <StatusBadge tone="info">{user.branch || "—"}</StatusBadge>
                            </>
                          )}
                          {groupName === "Faculty" && (
                            <StatusBadge tone="violet">{user.department_name || "—"}</StatusBadge>
                          )}
                          <StatusBadge tone={user.is_active ? "success" : "warning"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </StatusBadge>
                        </View>
                      </View>
                      <View style={styles.userActions}>
                        <Pressable
                          accessibilityLabel="Edit user"
                          hitSlop={8}
                          onPress={() => navigation.navigate("EditUser", { userId: user.id })}
                          style={styles.iconBtn}
                        >
                          <Pencil size={16} color={colors.textPrimary} />
                        </Pressable>
                        <Pressable
                          accessibilityLabel="Delete user"
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
                <Text style={styles.emptyGroupText}>No matches in this group.</Text>
              )}
            </View>
          );
        })}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete user?"
        description={deleteTarget ? `Delete user "${deleteTarget.full_name}"? This action cannot be undone.` : ""}
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

  listCard: { padding: spacing.lg, gap: spacing.md },
  listCardLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  listCardLabelMuted: { fontFamily: fontFamily.regular, color: colors.textMuted },

  searchWrap: { justifyContent: "center" },
  searchIcon: { position: "absolute", left: 14, top: 15, zIndex: 1 },
  searchInputContainer: { gap: 0 },
  searchInput: { paddingLeft: 38 },

  group: { marginTop: spacing.sm },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  groupTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  groupList: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  emptyGroupText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, fontStyle: "italic" },

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
});

export default AdminUsersHome;
