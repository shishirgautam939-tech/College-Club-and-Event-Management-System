import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Calendar, Bookmark, ScanLine, Award, Plus, CircleUserRound } from "lucide-react-native";
import { colors } from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";
import { stackScreenOptions } from "./stackOptions";

import EventDiscovery from "../screens/student/EventDiscovery";
import MyEvents from "../screens/student/MyEvents";
import ScanAttendance from "../screens/student/ScanAttendance";
import MyCertificates from "../screens/student/MyCertificates";
import ProposeEvent from "../screens/student/ProposeEvent";
import Profile from "../screens/Profile";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const single = (name, Component, title) => () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name={name} component={Component} options={{ title }} />
  </Stack.Navigator>
);

const EventsStack = single("EventDiscoveryHome", EventDiscovery, "Discover events");
const MyEventsStack = single("MyEventsHome", MyEvents, "My events");
const ScanStack = single("ScanAttendanceHome", ScanAttendance, "Check in with QR");
const CertificatesStack = single("MyCertificatesHome", MyCertificates, "My certificates");
const ProposeStack = single("ProposeEventHome", ProposeEvent, "Propose an event");
const ProfileStack = single("ProfileHome", Profile, "Profile");

const StudentTabNavigator = () => (
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
      name="Events"
      component={EventsStack}
      options={{ tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }}
    />
    <Tab.Screen
      name="MyEventsTab"
      component={MyEventsStack}
      options={{ title: "My Events", tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size} /> }}
    />
    <Tab.Screen
      name="ScanTab"
      component={ScanStack}
      options={{ title: "Scan QR", tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} /> }}
    />
    <Tab.Screen
      name="CertificatesTab"
      component={CertificatesStack}
      options={{ title: "Certificates", tabBarIcon: ({ color, size }) => <Award color={color} size={size} /> }}
    />
    <Tab.Screen
      name="ProposeTab"
      component={ProposeStack}
      options={{ title: "Propose", tabBarIcon: ({ color, size }) => <Plus color={color} size={size} /> }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{ title: "Profile", tabBarIcon: ({ color, size }) => <CircleUserRound color={color} size={size} /> }}
    />
  </Tab.Navigator>
);

export default StudentTabNavigator;
