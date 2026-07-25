import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LayoutGrid, Users, CalendarDays, CircleUserRound } from "lucide-react-native";
import { colors } from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";
import { stackScreenOptions } from "./stackOptions";

import AdminDashboard from "../screens/admin/AdminDashboard";
import AdminUsersHome from "../screens/admin/AdminUsersHome";
import Students from "../screens/admin/Students";
import Faculty from "../screens/admin/Faculty";
import CreateUser from "../screens/admin/CreateUser";
import EditUser from "../screens/admin/EditUser";
import AdminEvents from "../screens/admin/AdminEvents";
import EventAttendance from "../screens/admin/EventAttendance";
import Clubs from "../screens/admin/Clubs";
import CreateClub from "../screens/admin/CreateClub";
import Profile from "../screens/Profile";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// CreateUser/EditUser/CreateClub/Clubs are pushed from more than one tab
// (e.g. "Add user" from the Dashboard's quick actions AND from the Users
// tab) — each stack below declares its own copy of the route. React
// Navigation treats these as independent instances per stack, which is the
// supported way to reuse a screen across sibling tab stacks.
const DashboardStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AdminDashboardHome" component={AdminDashboard} options={{ headerShown: false }} />
    <Stack.Screen name="CreateUser" component={CreateUser} options={{ title: "Add a user" }} />
    <Stack.Screen name="EditUser" component={EditUser} options={{ title: "Edit user" }} />
    <Stack.Screen name="CreateClub" component={CreateClub} options={{ title: "Create a club" }} />
    <Stack.Screen name="Clubs" component={Clubs} options={{ title: "Clubs" }} />
    <Stack.Screen name="AdminEvents" component={AdminEvents} options={{ title: "Events" }} />
    <Stack.Screen name="EventAttendance" component={EventAttendance} options={{ title: "Attendance" }} />
  </Stack.Navigator>
);

const UsersStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AdminUsersHome" component={AdminUsersHome} options={{ title: "Users" }} />
    <Stack.Screen name="Students" component={Students} options={{ title: "Students" }} />
    <Stack.Screen name="Faculty" component={Faculty} options={{ title: "Faculty" }} />
    <Stack.Screen name="CreateUser" component={CreateUser} options={{ title: "Add a user" }} />
    <Stack.Screen name="EditUser" component={EditUser} options={{ title: "Edit user" }} />
  </Stack.Navigator>
);

const EventsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AdminEventsHome" component={AdminEvents} options={{ title: "Events" }} />
    <Stack.Screen name="EventAttendance" component={EventAttendance} options={{ title: "Attendance" }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="ProfileHome" component={Profile} options={{ title: "Profile" }} />
    <Stack.Screen name="Clubs" component={Clubs} options={{ title: "Clubs" }} />
    <Stack.Screen name="CreateClub" component={CreateClub} options={{ title: "Create a club" }} />
  </Stack.Navigator>
);

const AdminTabNavigator = () => (
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
      name="Dashboard"
      component={DashboardStack}
      options={{ tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} /> }}
    />
    <Tab.Screen
      name="UsersTab"
      component={UsersStack}
      options={{ title: "Users", tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
    />
    <Tab.Screen
      name="EventsTab"
      component={EventsStack}
      options={{ title: "Events", tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{ title: "Profile", tabBarIcon: ({ color, size }) => <CircleUserRound color={color} size={size} /> }}
    />
  </Tab.Navigator>
);

export default AdminTabNavigator;
