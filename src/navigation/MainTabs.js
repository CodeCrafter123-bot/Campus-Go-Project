import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { HomeStack, PrintStack, CartStack, OrdersStack, ProfileStack } from "./stacks";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: "storefront",
  PrintTab: "print",
  CartTab: "cart",
  OrdersTab: "receipt",
  ProfileTab: "person",
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // each tab has its own stack header
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name] : `${TAB_ICONS[route.name]}-outline`}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Stores" }} />
      <Tab.Screen name="PrintTab" component={PrintStack} options={{ title: "Print" }} />
      <Tab.Screen name="CartTab" component={CartStack} options={{ title: "Cart" }} />
      <Tab.Screen name="OrdersTab" component={OrdersStack} options={{ title: "Orders" }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
