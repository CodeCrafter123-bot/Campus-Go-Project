import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";

import HomeScreen from "../screens/home/HomeScreen";
import StoreMenuScreen from "../screens/home/StoreMenuScreen";
import ProductDetailsScreen from "../screens/home/ProductDetailsScreen";
import PrintingScreen from "../screens/print/PrintingScreen";
import CartScreen from "../screens/cart/CartScreen";
import CheckoutScreen from "../screens/cart/CheckoutScreen";
import OrdersHistoryScreen from "../screens/orders/OrdersHistoryScreen";
import OrderTrackingScreen from "../screens/orders/OrderTrackingScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import WalletScreen from "../screens/profile/WalletScreen";

// Shared header style for every stack
export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: "bold" },
};

const HomeStackNav = createNativeStackNavigator();
export function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={stackScreenOptions}>
      <HomeStackNav.Screen name="Home" component={HomeScreen} options={{ title: "CampusGo" }} />
      <HomeStackNav.Screen name="StoreMenu" component={StoreMenuScreen} options={{ title: "Menu" }} />
      <HomeStackNav.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: "Product" }} />
    </HomeStackNav.Navigator>
  );
}

const PrintStackNav = createNativeStackNavigator();
export function PrintStack() {
  return (
    <PrintStackNav.Navigator screenOptions={stackScreenOptions}>
      <PrintStackNav.Screen name="Printing" component={PrintingScreen} options={{ title: "Printing Service" }} />
    </PrintStackNav.Navigator>
  );
}

const CartStackNav = createNativeStackNavigator();
export function CartStack() {
  return (
    <CartStackNav.Navigator screenOptions={stackScreenOptions}>
      <CartStackNav.Screen name="Cart" component={CartScreen} options={{ title: "My Cart" }} />
      <CartStackNav.Screen name="Checkout" component={CheckoutScreen} />
    </CartStackNav.Navigator>
  );
}

const OrdersStackNav = createNativeStackNavigator();
export function OrdersStack() {
  return (
    <OrdersStackNav.Navigator screenOptions={stackScreenOptions}>
      <OrdersStackNav.Screen name="OrdersHistory" component={OrdersHistoryScreen} options={{ title: "My Orders" }} />
      <OrdersStackNav.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: "Order Tracking" }} />
    </OrdersStackNav.Navigator>
  );
}

const ProfileStackNav = createNativeStackNavigator();
export function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={stackScreenOptions}>
      <ProfileStackNav.Screen name="Profile" component={ProfileScreen} />
      <ProfileStackNav.Screen name="Wallet" component={WalletScreen} />
    </ProfileStackNav.Navigator>
  );
}
