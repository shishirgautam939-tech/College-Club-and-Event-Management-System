import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Calendar, ClipboardCheck, CircleUserRound } from "lucide-react-native";
import { colors } from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";
import { stackScreenOptions } from "./stackOptions";

import EventDiscovery from "../screens/student/EventDiscovery";
import FacultyEvents from "../screens/faculty/FacultyEvents";
import EventAttendance from "../screens/admin/EventAttendance";
import Profile from "../screens/Profile";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DiscoverStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="EventDiscoveryHome" component={EventDiscovery} options={{ title: "Discover events" }} />
  </Stack.Navigator>
);

const ApprovalsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="FacultyEventsHome" component={FacultyEvents} options={{ title: "Approvals" }} />
    <Stack.Screen name="EventAttendance" component={EventAttendance} options={{ title: "Attendance" }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="ProfileHome" component={Profile} options={{ title: "Profile" }} />
  </Stack.Navigator>
);

const FacultyTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.cardBorder,
        height: 62,
        paddingBottom: 8,
        paddingTop: 6,
      },
      tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: fontSize.xs },
    }}
  >
    <Tab.Screen
      name="Discover"
      component={DiscoverStack}
      options={{ tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }}
    />
    <Tab.Screen
      name="Approvals"
      component={ApprovalsStack}
      options={{ tabBarIcon: ({ color, size }) => <ClipboardCheck color={color} size={size} /> }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{ title: "Profile", tabBarIcon: ({ color, size }) => <CircleUserRound color={color} size={size} /> }}
    />
  </Tab.Navigator>
);

export default FacultyTabNavigator;
