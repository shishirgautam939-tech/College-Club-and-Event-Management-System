import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { Plus, Trash2 } from "lucide-react-native";
import { getClubs, getClubMembers, addClubMember, removeClubMember } from "../../api/clubs";
import { getAllUsers } from "../../api/users";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import InlineAlert from "../../components/ui/InlineAlert";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Avatar from "../../components/ui/Avatar";

const POSITIONS = ["Member", "Event Manager", "President", "Vice President", "Secretary", "Treasurer"];

const POSITION_TONE = {
  President: "tan",
  "Vice President": "violet",
  Secretary: "info",
  Treasurer: "warning",
  "Event Manager": "brand",
  Member: "tan",
};

const EmptyState = ({ title, sub }) => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyTitle}>{title}</Text>
    {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
  </View>
);

const Clubs = ({ navigation, route }) => {
  const [clubs, setClubs] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberPosition, setNewMemberPosition] = useState("Member");
  const [addingMember, setAddingMember] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  const loadClubs = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await getClubs();
      setClubs(response.data);
    } catch {
      setError("Failed to load clubs.");
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  useFocusEffect(
    useCallback(() => {
      loadClubs({ silent: true });
    }, [loadClubs]),
  );

  // Mirrors the web version reading `?name=` from the URL to preselect a
  // club when arriving from another screen — the mobile equivalent is a
  // route param instead of a query string.
  useEffect(() => {
    const wantedName = route?.params?.name;
    if (!wantedName || clubs.length === 0) return;
    const matched = clubs.find((club) => club.club_name === wantedName);
    if (matched) setSelectedClubId(String(matched.id));
  }, [route?.params?.name, clubs]);

  const loadMembers = useCallback(async (clubId) => {
    if (!clubId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    try {
      const response = await getClubMembers(clubId);
      setMembers(response.data);
    } catch {
      setError("Failed to load club members.");
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers(selectedClubId);
  }, [selectedClubId, loadMembers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClubs({ silent: true });
    if (selectedClubId) loadMembers(selectedClubId);
    else setRefreshing(false);
  };

  const selectedClub = useMemo(
    () => clubs.find((club) => String(club.id) === String(selectedClubId)) || null,
    [clubs, selectedClubId],
  );

  const searchedMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        (m.roll_number || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.position || "").toLowerCase().includes(q),
    );
  }, [members, search]);

  const handleShowAddMember = async () => {
    setShowAddMember(true);
    setStudentsLoading(true);
    try {
      const res = await getAllUsers();
      setStudents(res.data.filter((u) => u.user_type === "Student"));
    } catch {
      setActionMsg({ type: "error", text: "Failed to load students." });
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberUserId) return;
    setAddingMember(true);
    setActionMsg({ type: "", text: "" });
    try {
      await addClubMember(selectedClubId, {
        user: parseInt(newMemberUserId, 10),
        position: newMemberPosition,
      });
      setActionMsg({ type: "success", text: "Member added successfully." });
      setNewMemberUserId("");
      setNewMemberPosition("Member");
      setShowAddMember(false);
      const res = await getClubMembers(selectedClubId);
      setMembers(res.data);
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to add member.",
      });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    const { id: memberId } = removeTarget;
    setActionMsg({ type: "", text: "" });
    try {
      await removeClubMember(selectedClubId, memberId);
      setActionMsg({ type: "success", text: "Member removed." });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to remove member.",
      });
    } finally {
      setRemoveTarget(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Loading clubs…</Text>
      </View>
    );
  }

  if (error && clubs.length === 0) {
    return (
      <View style={[styles.screen, { padding: spacing.lg }]}>
        <InlineAlert type="error">{error}</InlineAlert>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <PageHeader
          eyebrow={<Text style={styles.eyebrowText}>Clubs</Text>}
          title="Club management"
          subtitle={`${clubs.length} clubs on campus · ${
            selectedClub ? `${members.length} members in this club` : "Pick a club to manage its members."
          }`}
          actions={
            <Button
              size="sm"
              variant="outline"
              style={styles.headerAction}
              textStyle={styles.headerActionText}
              icon={<Plus size={15} color="#FFFFFF" />}
              onPress={() => navigation.navigate("CreateClub")}
            >
              Create club
            </Button>
          }
        />

        {actionMsg.text ? (
          <InlineAlert type={actionMsg.type} style={{ marginTop: spacing.md }}>
            {actionMsg.text}
          </InlineAlert>
        ) : null}

        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.selectorHeader}>
            <Text style={styles.fieldLabel}>Select a club</Text>
            {selectedClub ? (
              <StatusBadge tone={selectedClub.is_council ? "violet" : "brand"}>
                {selectedClub.is_council ? "Council" : "Club"}
              </StatusBadge>
            ) : null}
          </View>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedClubId}
              onValueChange={(value) => {
                setSelectedClubId(value);
                setShowAddMember(false);
                setSearch("");
              }}
            >
              <Picker.Item label="— Choose a club —" value="" />
              {clubs.map((club) => (
                <Picker.Item
                  key={club.id}
                  label={`${club.club_name}${club.is_council ? " (Council)" : ""}`}
                  value={String(club.id)}
                />
              ))}
            </Picker>
          </View>

          {selectedClub ? (
            <View style={styles.infoBox}>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Faculty Coordinator</Text>
                  <Text style={styles.infoValue}>{selectedClub.faculty_coordinator_name || "—"}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Members</Text>
                  <Text style={styles.infoValueStrong}>{members.length}</Text>
                </View>
              </View>
              {selectedClub.description ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={styles.infoLabel}>About</Text>
                  <Text style={styles.infoDesc}>{selectedClub.description}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Card>

        <Card style={styles.listCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedClub ? `${selectedClub.club_name} members` : "Club members"}{" "}
              <Text style={styles.sectionCount}>
                · {searchedMembers.length} of {members.length}
              </Text>
            </Text>
          </View>

          {selectedClubId ? (
            <View style={styles.toolbar}>
              <Input
                placeholder="Search members…"
                value={search}
                onChangeText={setSearch}
                containerStyle={{ flex: 1 }}
              />
              <Button size="sm" icon={<Plus size={15} color="#FFFFFF" />} onPress={handleShowAddMember}>
                Add
              </Button>
            </View>
          ) : null}

          {showAddMember && selectedClubId ? (
            <View style={styles.addForm}>
              <Text style={styles.fieldLabelSm}>Student</Text>
              <View style={styles.pickerWrapSm}>
                <Picker selectedValue={newMemberUserId} onValueChange={setNewMemberUserId}>
                  <Picker.Item label={studentsLoading ? "Loading…" : "Select a student…"} value="" />
                  {students.map((s) => (
                    <Picker.Item
                      key={s.id}
                      label={`${s.full_name} (${s.roll_number || s.email})`}
                      value={String(s.id)}
                    />
                  ))}
                </Picker>
              </View>
              <Text style={styles.fieldLabelSm}>Position</Text>
              <View style={styles.pickerWrapSm}>
                <Picker selectedValue={newMemberPosition} onValueChange={setNewMemberPosition}>
                  {POSITIONS.map((p) => (
                    <Picker.Item key={p} label={p} value={p} />
                  ))}
                </Picker>
              </View>
              <View style={styles.actionsRow}>
                <Button
                  style={{ flex: 1 }}
                  onPress={handleAddMember}
                  loading={addingMember}
                  disabled={!newMemberUserId}
                >
                  Add
                </Button>
                <Button style={{ flex: 1 }} variant="outline" onPress={() => setShowAddMember(false)}>
                  Cancel
                </Button>
              </View>
            </View>
          ) : null}

          {!selectedClubId ? (
            <EmptyState title="No club selected" sub="Choose a club above to manage its members." />
          ) : membersLoading ? (
            <View style={styles.centeredSmall}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.mutedText}>Loading members…</Text>
            </View>
          ) : searchedMembers.length > 0 ? (
            searchedMembers.map((member, idx) => (
              <View key={member.id} style={[styles.memberRow, idx > 0 && styles.rowBorder]}>
                <Avatar name={member.full_name} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{member.full_name}</Text>
                  <Text style={styles.memberSub}>{member.email}</Text>
                  <View style={styles.memberBadgeRow}>
                    <StatusBadge tone={POSITION_TONE[member.position] || "tan"}>{member.position}</StatusBadge>
                    {member.roll_number ? <Text style={styles.rollCode}>{member.roll_number}</Text> : null}
                  </View>
                </View>
                <Pressable onPress={() => setRemoveTarget(member)} style={styles.removeBtn} hitSlop={8}>
                  <Trash2 size={16} color={colors.danger} />
                </Pressable>
              </View>
            ))
          ) : (
            <EmptyState
              title={search ? "No matches" : "No members yet"}
              sub={search ? "Try a different search term." : "Add the first member to this club."}
            />
          )}
        </Card>
      </ScrollView>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove member?"
        description={removeTarget ? `Remove ${removeTarget.full_name} from this club? This can't be undone.` : ""}
        confirmLabel="Remove"
        onConfirm={handleRemoveMember}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.background },
  centeredSmall: { alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },

  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.6 },
  headerAction: { backgroundColor: "rgba(255,255,255,0.14)", borderColor: "rgba(255,255,255,0.35)" },
  headerActionText: { color: "#FFFFFF" },

  selectorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  fieldLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  fieldLabelSm: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  pickerWrap: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, backgroundColor: colors.card, overflow: "hidden" },
  pickerWrapSm: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, backgroundColor: colors.card, overflow: "hidden", marginTop: 4 },

  infoBox: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, padding: spacing.md },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  infoItem: { minWidth: 140, gap: 4 },
  infoLabel: { fontFamily: fontFamily.semibold, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", color: colors.textMuted },
  infoValue: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textPrimary },
  infoValueStrong: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.textPrimary },
  infoDesc: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },

  listCard: { marginTop: spacing.lg, padding: 0, overflow: "hidden" },
  sectionHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.background },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  sectionCount: { fontFamily: fontFamily.regular, color: colors.textMuted },

  toolbar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  addForm: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.primaryMuted },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },

  emptyWrap: { paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, alignItems: "center", gap: 4 },
  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  emptySub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: "center" },

  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  memberName: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  memberSub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  memberBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  rollCode: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: colors.textMuted, backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  removeBtn: { width: 34, height: 34, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.dangerMuted },
});

export default Clubs;
