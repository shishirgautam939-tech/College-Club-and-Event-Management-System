// Evento mobile design tokens.
//
// Background/card/typography follow the cream design spec; primary/tan
// accents are pulled from the existing web app's brand tokens
// (client/src/assets/styles/index.css) so the mobile app stays visually
// consistent with the web app rather than inventing a new brand.
export const colors = {
  background: "#FDFBF7",
  card: "#FFFFFF",
  cardBorder: "#EFE9DE",

  textPrimary: "#2B2420",
  textMuted: "#8A7F72",
  textInverse: "#FDFBF7",

  primary: "#146356",
  primaryMuted: "#E8F0EE",

  tan: "#C4785A",
  tanMuted: "#F5E9E2",

  success: "#22A06B",
  successMuted: "#E4F5EC",
  info: "#2F80D6",
  infoMuted: "#E7F0FC",
  warning: "#F2994A",
  warningMuted: "#FDEEE0",
  violet: "#8B5CF6",
  violetMuted: "#F1EBFE",
  danger: "#E5484D",
  dangerMuted: "#FBE7E7",

  dark: "#241E1A",
  darkElevated: "#332A24",

  overlay: "rgba(36, 30, 26, 0.5)",
};

export const toneColors = {
  brand: { fg: colors.primary, bg: colors.primaryMuted },
  tan: { fg: colors.tan, bg: colors.tanMuted },
  success: { fg: colors.success, bg: colors.successMuted },
  info: { fg: colors.info, bg: colors.infoMuted },
  warning: { fg: colors.warning, bg: colors.warningMuted },
  violet: { fg: colors.violet, bg: colors.violetMuted },
  danger: { fg: colors.danger, bg: colors.dangerMuted },
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const shadow = {
  card: {
    shadowColor: "#2B2420",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
