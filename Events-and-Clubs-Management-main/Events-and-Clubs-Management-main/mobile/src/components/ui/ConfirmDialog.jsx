import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Button from "./Button";

/**
 * Drop-in replacement for `window.confirm()` before destructive actions.
 * Renders nothing until `open` is true; `onConfirm` only fires when the
 * user explicitly confirms, mirroring the old confirm()-gated behavior.
 */
const ConfirmDialog = ({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
}) => (
  <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => onOpenChange?.(false)}>
    <Pressable style={styles.overlay} onPress={() => onOpenChange?.(false)}>
      <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        <View style={styles.actions}>
          <Button variant="outline" onPress={() => onOpenChange?.(false)} style={{ flex: 1 }}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onPress={() => {
              onConfirm?.();
              onOpenChange?.(false);
            }}
            style={{ flex: 1 }}
          >
            {confirmLabel}
          </Button>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary },
  description: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
});

export default ConfirmDialog;
