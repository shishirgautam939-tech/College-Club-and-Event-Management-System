import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";

// The generic gradient header used by every non-dashboard admin/student/
// faculty screen on web (client/src/components/PageHeader.jsx). The Admin
// Dashboard screen has its own cream-styled header per the design spec —
// this one is for everything else, so the rest of the app still looks like
// it belongs to the same product.
const PageHeader = ({ eyebrow, title, subtitle, actions, style }) => (
  <LinearGradient
    colors={["#0d3b34", "#146356", "#1c3f57"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[styles.wrap, style]}
  >
    {eyebrow && <View style={styles.eyebrow}>{eyebrow}</View>}
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {actions && <View style={styles.actions}>{actions}</View>}
  </LinearGradient>
);

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: "#FFFFFF" },
  subtitle: {
    marginTop: 4,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 19,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.md },
});

export default PageHeader;
