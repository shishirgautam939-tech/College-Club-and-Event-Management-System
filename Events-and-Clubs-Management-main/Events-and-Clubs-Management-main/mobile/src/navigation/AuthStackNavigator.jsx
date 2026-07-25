import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { stackScreenOptions } from "./stackOptions";
import Landing from "../screens/Landing";
import Login from "../screens/auth/Login";
import Register from "../screens/auth/Register";

const Stack = createNativeStackNavigator();

const AuthStackNavigator = () => (
  <Stack.Navigator screenOptions={{ ...stackScreenOptions, headerShown: false }}>
    <Stack.Screen name="Landing" component={Landing} />
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="Register" component={Register} />
  </Stack.Navigator>
);

export default AuthStackNavigator;
