import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import useAuth from "../hooks/useAuth";
import { colors } from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";
import AuthStackNavigator from "./AuthStackNavigator";
import AdminTabNavigator from "./AdminTabNavigator";
import FacultyTabNavigator from "./FacultyTabNavigator";
import StudentTabNavigator from "./StudentTabNavigator";

// Mirrors client/src/routes/AppRoutes.jsx + ProtectedRoute.jsx: instead of
// per-route role checks, each role gets its own tab navigator up front, so
// there's no path a Student could type that would land them on an Admin
// screen (there's no address bar to type one into).
const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStackNavigator />
      ) : user.role === "Admin" ? (
        <AdminTabNavigator />
      ) : user.role === "Faculty" ? (
        <FacultyTabNavigator />
      ) : (
        <StudentTabNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },
});

export default RootNavigator;
