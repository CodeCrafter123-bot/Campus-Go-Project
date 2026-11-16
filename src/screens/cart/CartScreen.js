import { useLayoutEffect } from "react";
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CartItemRow from "../../components/CartItemRow";
import PriceSummary from "../../components/PriceSummary";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import { useCart } from "../../context/CartContext";
import { getStoreById, settings } from "../../data";
import { getOrderTotals, meetsMinimumOrder, formatPrice, round2 } from "../../utils/pricing";
import { isStoreOpen } from "../../utils/time";
import useNow from "../../utils/useNow";
import { colors, radius, spacing } from "../../theme/colors";

export default function CartScreen({ navigation }) {
  const cart = useCart();
  const now = useNow();
  const store = getStoreById(cart.storeId);
  const totals = getOrderTotals(cart.subtotal);
  const storeOpen = store ? isStoreOpen(store, now) : false;
  const minimumOk = meetsMinimumOrder(cart.subtotal);

  const confirmClear = () =>
    Alert.alert("Empty cart?", "All items will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Empty cart", style: "destructive", onPress: cart.clearCart },
    ]);

  // "Clear" button in the header, only when the cart has items.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: cart.items.length
        ? () => (
            <Pressable onPress={confirmClear} hitSlop={10}>
              <Text style={styles.headerButton}>Clear</Text>
            </Pressable>
          )
        : undefined,
    });
  });

  if (cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState icon="cart-outline" title="Your cart is empty" message="Order from a campus store or print a document.">
          <Button
            title="Browse stores"
            icon="storefront-outline"
            onPress={() => navigation.navigate("HomeTab", { screen: "Home" })}
          />
        </EmptyState>
      </View>
    );
  }

  // Messages for the delivery-fee and minimum-order rules.
  let feeNote = null;
  if (totals.deliveryFee > 0) {
    feeNote = `Add ${formatPrice(round2(settings.freeDeliveryFrom - cart.subtotal))} more for free delivery`;
  }

  let blockReason = null;
  if (!storeOpen) blockReason = `${store.name} is closed right now. You cannot place this order.`;
  else if (!minimumOk) {
    blockReason = `Minimum order is ${formatPrice(settings.minimumOrder)}. Add ${formatPrice(
      round2(settings.minimumOrder - cart.subtotal)
    )} more.`;
  }

  const footer = (
    <View>
      <PriceSummary {...totals} note={feeNote} />
      {blockReason ? (
        <View style={styles.warning}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.warningText}>{blockReason}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Pressable
            style={styles.storeRow}
            onPress={() =>
              store.id === "printing"
                ? navigation.navigate("PrintTab")
                : navigation.navigate("HomeTab", { screen: "StoreMenu", params: { storeId: store.id }, initial: false })
            }
          >
            <View style={[styles.storeIcon, { backgroundColor: store.color }]}>
              <Ionicons name={store.icon} size={18} color={colors.white} />
            </View>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.addMore}>+ Add more</Text>
          </Pressable>
        }
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onChangeQuantity={(q) => cart.updateQuantity(item.key, q)}
            onRemove={() => cart.removeItem(item.key)}
          />
        )}
        ListFooterComponent={footer}
      />

      <View style={styles.bottomBar}>
        <Button
          title={`Checkout · ${formatPrice(totals.total)}`}
          icon="arrow-forward"
          onPress={() => navigation.navigate("Checkout")}
          disabled={Boolean(blockReason)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  headerButton: { color: colors.white, fontWeight: "700", fontSize: 16 },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  storeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  storeName: { flex: 1, marginLeft: spacing.sm, fontSize: 16, fontWeight: "700", color: colors.text },
  addMore: { color: colors.primary, fontWeight: "700" },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  warningText: { color: colors.danger, marginLeft: spacing.sm, flex: 1 },
  bottomBar: { padding: spacing.lg, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
