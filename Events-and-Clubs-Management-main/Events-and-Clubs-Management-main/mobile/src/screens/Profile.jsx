import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LayoutGrid, LogOut, ChevronRight, ShieldCheck } from "lucide-react-native";
import useAuth from "../hooks/useAuth";
import { colors, radii, shadow, spacing } from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";
import Avatar from "../components/ui/Avatar";
import StatusBadge from "../components/ui/StatusBadge";

// There's no equivalent page on web — admin/faculty/student identity and
// sign-out live in the sidebar footer dropdown there (AdminLayout.jsx /
// MainLayout.jsx). The mobile bottom-tab spec calls for a dedicated Profile
// tab, so this is a small original screen rather than a port; it adapts its
// links to the signed-in role instead of duplicating three near-identical
// screens.
const ROLE_TONE = { Admin: "brand", Faculty: "violet", Student: "success" };

const Profile = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Avatar name={user?.name} size={64} />
        <Text style={styles.name}>{user?.name || "—"}</Text>
        <StatusBadge tone={ROLE_TONE[user?.role] || "brand"} style={{ marginTop: 6 }}>
          {user?.role || "—"}
        </StatusBadge>
      </View>

      {user?.role === "Admin" && (
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate("Clubs")}>
          <View style={styles.linkIcon}>
            <LayoutGrid size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Manage clubs</Text>
            <Text style={styles.linkSub}>Create clubs, assign coordinators</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
      )}

      <View style={styles.linkRow}>
        <View style={styles.linkIcon}>
          <ShieldCheck size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Signed in as</Text>
          <Text style={styles.linkSub}>{user?.role} account</Text>
        </View>
      </View>

      <Pressable style={styles.signOutBtn} onPress={logout}>
        <LogOut size={16} color={colors.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    ...shadow.card,
  },
  name: { marginTop: spacing.md, fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryMuted,
  },
  linkTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  linkSub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.dangerMuted,
    backgroundColor: colors.dangerMuted,
    paddingVertical: 12,
  },
  signOutText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.danger },
});

export default Profile;
