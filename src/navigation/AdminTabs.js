import { Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { showAlert } from "../utils/dialog";
import Dashboard from "../screens/admin/Dashboard";
import AdminScreen from "../screens/admin/AdminScreen";
const Tab = createBottomTabNavigator();
const TAB_ICONS = { DashboardTab: "stats-chart", UsersTab: "people" };
function LogoutButton() {
  const { logout } = useAuth();
  const confirmLogout = () =>
    showAlert("Log out?", "You will return to the login screen.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  return (
    <Pressable onPress={confirmLogout} hitSlop={10} accessibilityLabel="Log out" style={{ marginRight: spacing.lg }}>
      <Ionicons name="log-out-outline" size={24} color={colors.white} />
    </Pressable>
  );
}
export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "bold" },
        headerRight: () => <LogoutButton />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? TAB_ICONS[route.name] : `${TAB_ICONS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="DashboardTab" component={Dashboard} options={{ title: "Dashboard" }} />
      <Tab.Screen name="UsersTab" component={AdminScreen} options={{ title: "Users" }} />
    </Tab.Navigator>
  );
}