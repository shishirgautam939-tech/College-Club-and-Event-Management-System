import { colors } from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";

// Shared native-stack screenOptions so every stack in the app (auth, admin,
// student, faculty) gets the same header look without repeating it.
export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};
