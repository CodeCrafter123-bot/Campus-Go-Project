import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import { colors } from "../theme/colors";

// Cart icon with item-count badge, shown in the header of the store screens.
export default function CartHeaderButton() {
  const navigation = useNavigation();
  const { itemCount } = useCart();

  return (
    <Pressable
      onPress={() => navigation.navigate("CartTab", { screen: "Cart" })}
      hitSlop={10}
      accessibilityLabel={`Cart, ${itemCount} items`}
    >
      <Ionicons name="cart-outline" size={26} color={colors.white} />
      {itemCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
});
