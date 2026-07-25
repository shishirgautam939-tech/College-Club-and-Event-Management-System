import { useId } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { fontFamily, fontSize } from "../theme/typography";

export const LogoMark = ({ size = 40 }) => {
  // react-native-svg's url(#id) gradient references can fail to resolve on
  // Android when the id contains the colons React's useId() produces
  // (e.g. ":r0:") — strip everything but letters/digits to keep it safe.
  const gradientId = `logoGrad${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#38613f" />
          <Stop offset="100%" stopColor="#1a2f1d" />
        </LinearGradient>
      </Defs>
      <Rect x="4" y="4" width="40" height="40" rx="12" fill={`url(#${gradientId})`} />
      <Rect x="14" y="16" width="20" height="18" rx="3" stroke="#FAF7F2" strokeWidth="2" />
      <Path d="M14 22h20" stroke="#FAF7F2" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="19" cy="28" r="1.5" fill="#C4785A" />
      <Circle cx="24" cy="28" r="1.5" fill="#C4785A" />
      <Circle cx="29" cy="28" r="1.5" fill="#FAF7F2" fillOpacity="0.5" />
      <Path d="M18 12v4M30 12v4" stroke="#C4785A" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

const Logo = ({ showText = true, compact = false, light = false, markSize = 40, style }) => (
  <View style={[styles.row, style]}>
    <LogoMark size={markSize} />
    {showText && (
      <Text
        style={[
          styles.text,
          { fontSize: compact ? fontSize.sm : fontSize.md, color: light ? "#FFFFFF" : "#292524" },
        ]}
        numberOfLines={1}
      >
        {compact ? "Evento" : "College Club and Event Management"}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: { fontFamily: fontFamily.semibold, flexShrink: 1 },
});

export default Logo;
