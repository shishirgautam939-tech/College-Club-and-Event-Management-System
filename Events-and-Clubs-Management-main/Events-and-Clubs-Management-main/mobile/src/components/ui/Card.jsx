import { View } from "react-native";
import { colors, radii, shadow, spacing } from "../../theme/colors";

const Card = ({ style, children, ...props }) => (
  <View
    style={[
      {
        backgroundColor: colors.card,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: spacing.lg,
        ...shadow.card,
      },
      style,
    ]}
    {...props}
  >
    {children}
  </View>
);

export default Card;
