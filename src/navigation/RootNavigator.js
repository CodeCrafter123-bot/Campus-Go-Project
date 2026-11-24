import { ActivityIndicator, View } from "react-native";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useCatalog } from "../context/CatalogContext";
import { colors } from "../theme/colors";
import { stackScreenOptions } from "./stacks";
import MainTabs from "./MainTabs";
import AdminTabs from "./AdminTabs";
import UserDetailsScreen from "../screens/admin/UserDetailsScreen";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";

const Stack = createNativeStackNavigator();

// Chooses what to show based on the logged-in account:
// - logged out → Welcome / Login / Sign up
// - admin      → Admin panel (Dashboard + Users) and the user details screen
// - user       → the normal CampusGo tabs
// Logging in/out switches automatically – no manual navigation needed.
export default function RootNavigator() {
  const { user, booting, connectionError, retryConnection } = useAuth();
  const { ready: catalogReady } = useCatalog();

  // Wait for the saved login AND the catalog download.
  if (booting || !catalogReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // A login was saved but the server can't be reached (backend off or wrong Wi-Fi).
  if (connectionError && !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.background }}>
        <EmptyState icon="cloud-offline-outline" title="No connection" message={connectionError}>
          <Button title="Try again" icon="refresh" onPress={retryConnection} />
        </EmptyState>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      {!user ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Log in" }} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Create account" }} />
        </>
      ) : user.role === "admin" ? (
        <>
          <Stack.Screen name="AdminMain" component={AdminTabs} options={{ headerShown: false }} />
          <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={{ title: "User details" }} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
