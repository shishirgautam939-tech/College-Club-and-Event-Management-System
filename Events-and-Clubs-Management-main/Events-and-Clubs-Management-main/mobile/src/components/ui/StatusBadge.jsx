import { View, Text, StyleSheet } from "react-native";
import { toneColors } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";

// tone: brand | tan | success | info | warning | violet | danger
const StatusBadge = ({ tone = "brand", children, dot = false, style }) => {
  const c = toneColors[tone] || toneColors.brand;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: c.fg }]} />}
      <Text style={[styles.text, { color: c.fg }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs },
});

export default StatusBadge;
