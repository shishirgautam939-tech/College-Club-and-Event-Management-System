import { View, Text, StyleSheet } from "react-native";
import { CheckCircle2, AlertCircle } from "lucide-react-native";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";

const InlineAlert = ({ type = "error", children, style }) => {
  if (!children) return null;
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const fg = isSuccess ? colors.success : colors.danger;
  const bg = isSuccess ? colors.successMuted : colors.dangerMuted;

  return (
    <View style={[styles.wrap, { backgroundColor: bg }, style]}>
      <Icon size={18} color={fg} style={{ marginTop: 1 }} />
      <Text style={[styles.text, { color: fg }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  text: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.sm, lineHeight: 19 },
});

export default InlineAlert;
