import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamily } from "../../theme/typography";

export const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase() || "").join("") || "?";

const Avatar = ({ name, size = 40, bg = colors.tan, fg = "#FFFFFF", style }) => (
  <View
    style={[
      styles.circle,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      style,
    ]}
  >
    <Text style={[styles.text, { color: fg, fontSize: size * 0.4 }]}>{initialsOf(name)}</Text>
  </View>
);

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  text: { fontFamily: fontFamily.bold },
});

export default Avatar;
