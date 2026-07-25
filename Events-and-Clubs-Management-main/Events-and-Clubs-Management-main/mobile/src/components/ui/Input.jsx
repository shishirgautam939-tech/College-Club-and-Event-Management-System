import { TextInput, View, Text, StyleSheet } from "react-native";
import { colors, radii } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";

const Input = ({ label, hint, error, style, containerStyle, ...props }) => (
  <View style={[styles.container, containerStyle]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, error && styles.inputError, style]}
      {...props}
    />
    {(hint || error) && (
      <Text style={[styles.hint, error && styles.hintError]}>{error || hint}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  inputError: { borderColor: colors.danger },
  hint: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },
  hintError: { color: colors.danger },
});

export default Input;
