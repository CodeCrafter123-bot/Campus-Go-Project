import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { stackScreenOptions } from "./stacks";
import MainTabs from "./MainTabs";
import AdminTabs from "./AdminTabs";
import UserDetailsScreen from "../screens/admin/UserDetailsScreen";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
const Stack = createNativeStackNavigator();
export default function RootNavigator() {
  const { user, booting } = useAuth();
  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      {user ? (
        user.role === "admin" ? (
<>
  <Stack.Screen name="AdminMain" component={AdminTabs} options={{ headerShown: false }} />
  <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={{ title: "User details" }} />
</>        ) : (
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        )
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Log in" }} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Create account" }} />
        </>
      )}
    </Stack.Navigator>
  );
}