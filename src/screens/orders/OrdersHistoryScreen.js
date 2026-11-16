import { useState } from "react";
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import StarRating from "../../components/StarRating";
import { useOrders, STATUS_LABELS } from "../../context/OrdersContext";
import { useCart } from "../../context/CartContext";
import { stores, getStoreById, getProductById } from "../../data";
import { formatPrice } from "../../utils/pricing";
import { formatDateTime, locationLabel } from "../../utils/format";
import { colors, radius, spacing } from "../../theme/colors";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS = {
  received: { bg: colors.primaryLight, text: colors.primary },
  preparing: { bg: "#fef3c7", text: "#b45309" },
  on_the_way: { bg: "#e0f2fe", text: "#0369a1" },
  delivered: { bg: colors.successLight, text: colors.success },
  cancelled: { bg: colors.dangerLight, text: colors.danger },
};

const matchesStatus = (order, filter) => {
  if (filter === "all") return true;
  if (filter === "active") return order.status !== "delivered" && order.status !== "cancelled";
  return order.status === filter;
};

export default function OrdersHistoryScreen({ navigation }) {
  const { orders } = useOrders();
  const cart = useCart();
  const [storeFilter, setStoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const visible = orders.filter(
    (o) => (storeFilter === "all" || o.storeId === storeFilter) && matchesStatus(o, statusFilter)
  );

  // Copies a previous order into the cart (skipping products that are now out of stock).
  const reorder = (order) => {
    const available = order.items.filter((i) => i.type === "print" || getProductById(i.productId)?.inStock);
    const skipped = order.items.length - available.length;

    if (available.length === 0) {
      Alert.alert("Cannot reorder", "None of these products are available right now.");
      return;
    }

    const doReorder = () => {
      cart.replaceCart(order.storeId, available);
      if (skipped > 0) {
        Alert.alert("Some items skipped", `${skipped} product(s) are out of stock and were not added.`);
      }
      navigation.navigate("CartTab", { screen: "Cart" });
    };

    if (cart.items.length > 0) {
      Alert.alert("Replace your cart?", "Your current cart will be emptied and replaced with this order.", [
        { text: "Cancel", style: "cancel" },
        { text: "Replace", style: "destructive", onPress: doReorder },
      ]);
    } else {
      doReorder();
    }
  };

  const header = (
    <View>
      <Text style={styles.filterLabel}>Store</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: "all", name: "All" }, ...stores]}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <Chip label={item.name} selected={storeFilter === item.id} onPress={() => setStoreFilter(item.id)} />
        )}
      />
      <Text style={styles.filterLabel}>Status</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(s) => s.value}
        renderItem={({ item }) => (
          <Chip label={item.label} selected={statusFilter === item.value} onPress={() => setStatusFilter(item.value)} />
        )}
      />
      <Text style={styles.count}>
        {visible.length} order{visible.length === 1 ? "" : "s"}
      </Text>
    </View>
  );

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState icon="receipt-outline" title="No orders yet" message="Your orders will appear here." />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(o) => o.id}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState title="No matching orders" message="Try another filter." />}
      renderItem={({ item }) => (
        <OrderCard
          order={item}
          onPress={() => navigation.navigate("OrderTracking", { orderId: item.id })}
          onReorder={() => reorder(item)}
        />
      )}
    />
  );
}

function OrderCard({ order, onPress, onReorder }) {
  const store = getStoreById(order.storeId);
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const statusColor = STATUS_COLORS[order.status];
  const finished = order.status === "delivered" || order.status === "cancelled";

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.storeIcon, { backgroundColor: store.color }]}>
          <Ionicons name={store.icon} size={20} color={colors.white} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.storeName}>{order.storeName}</Text>
          <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>{STATUS_LABELS[order.status]}</Text>
        </View>
      </View>

      <Text style={styles.items} numberOfLines={1}>
        {itemCount} item{itemCount > 1 ? "s" : ""} · {order.items.map((i) => i.name).join(", ")}
      </Text>
      <Text style={styles.location}>
        {locationLabel(order.buildingId, order.room)} · {order.slotLabel}
      </Text>

      <View style={styles.cardBottom}>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
        {order.rating ? <StarRating value={order.rating.stars} size={14} /> : null}
        <View style={styles.actions}>
          {finished ? (
            <Pressable style={styles.reorderButton} onPress={onReorder} hitSlop={6}>
              <Ionicons name="repeat" size={16} color={colors.white} />
              <Text style={styles.reorderText}>Reorder</Text>
            </Pressable>
          ) : (
            <Text style={styles.trackText}>Track ›</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  filterLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.xs },
  count: { color: colors.textMuted, marginVertical: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  pressed: { opacity: 0.85 },
  cardTop: { flexDirection: "row", alignItems: "center" },
  storeIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  storeName: { fontSize: 16, fontWeight: "800", color: colors.text },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  statusText: { fontSize: 12, fontWeight: "800" },
  items: { color: colors.text, marginTop: spacing.md },
  location: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  cardBottom: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.md },
  total: { fontSize: 18, fontWeight: "800", color: colors.text },
  actions: { flex: 1, alignItems: "flex-end" },
  reorderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  reorderText: { color: colors.white, fontWeight: "700", marginLeft: 4 },
  trackText: { color: colors.primary, fontWeight: "800" },
});
