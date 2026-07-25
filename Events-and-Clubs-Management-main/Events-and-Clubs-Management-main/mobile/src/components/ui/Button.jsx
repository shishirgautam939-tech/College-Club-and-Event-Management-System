import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, radii } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";

const VARIANTS = {
  default: { bg: colors.primary, fg: "#FFFFFF", border: "transparent" },
  outline: { bg: "transparent", fg: colors.textPrimary, border: colors.cardBorder },
  destructive: { bg: colors.danger, fg: "#FFFFFF", border: "transparent" },
  ghost: { bg: "transparent", fg: colors.textPrimary, border: "transparent" },
};

const Button = ({
  children,
  onPress,
  variant = "default",
  size = "md",
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
  ...props
}) => {
  const v = VARIANTS[variant] || VARIANTS.default;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === "lg" && styles.lg,
        size === "sm" && styles.sm,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.border === "transparent" ? 0 : 1,
        },
        isDisabled && { opacity: 0.55 },
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.fg }, textStyle]}>{children}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
  },
  lg: { paddingVertical: 15 },
  sm: { paddingVertical: 8, paddingHorizontal: 12 },
  text: { fontFamily: fontFamily.semibold, fontSize: fontSize.base },
});

export default Button;
