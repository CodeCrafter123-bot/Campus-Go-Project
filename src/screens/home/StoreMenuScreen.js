import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProductRow from "../../components/ProductRow";
import StatusBadge from "../../components/StatusBadge";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import { useCart } from "../../context/CartContext";
import { getStoreById, getStoreMenuSections } from "../../data";
import { getStoreStatus } from "../../utils/time";
import { formatPrice } from "../../utils/pricing";
import useNow from "../../utils/useNow";
import { colors, radius, spacing } from "../../theme/colors";

export default function StoreMenuScreen({ navigation, route }) {
  const { storeId } = route.params;
  const store = getStoreById(storeId);
  const now = useNow();
  const status = getStoreStatus(store, now);
  const cart = useCart();
  const [category, setCategory] = useState("All");

  const sections = useMemo(() => getStoreMenuSections(storeId), [storeId]);
  const categories = ["All", ...sections.map((s) => s.title)];

  // FlatList rows: a header row for each category, followed by its products.
  const rows = useMemo(() => {
    const list = [];
    sections
      .filter((s) => category === "All" || s.title === category)
      .forEach((s) => {
        list.push({ type: "header", key: `h-${s.title}`, title: s.title, count: s.data.length });
        s.data.forEach((p) => list.push({ type: "product", key: p.id, product: p }));
      });
    return list;
  }, [sections, category]);

  const cartIsThisStore = cart.storeId === storeId && cart.itemCount > 0;

  const header = (
    <View>
      <View style={styles.storeCard}>
        <View style={[styles.logo, { backgroundColor: store.color }]}>
          <Ionicons name={store.icon} size={28} color={colors.white} />
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeMeta}>
            {store.category} · ~{store.avgPrepMinutes} min preparation
          </Text>
          <StatusBadge open={status.open} label={status.label} />
        </View>
      </View>

      {!status.open ? (
        <View style={styles.closedBanner}>
          <Ionicons name="moon-outline" size={18} color={colors.danger} />
          <Text style={styles.closedText}>This store is closed. You can browse the menu but cannot order.</Text>
        </View>
      ) : null}

      {store.id === "printing" ? (
        <Pressable style={styles.printBanner} onPress={() => navigation.navigate("PrintTab")}>
          <Ionicons name="document-text-outline" size={22} color={colors.white} />
          <Text style={styles.printText}>Print a document (pages, color, binding…)</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </Pressable>
      ) : null}

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <Chip label={item} selected={category === item} onPress={() => setCategory(item)} />}
        style={styles.chips}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="No products" />}
        renderItem={({ item }) =>
          item.type === "header" ? (
            <Text style={styles.sectionTitle}>
              {item.title} <Text style={styles.sectionCount}>({item.count})</Text>
            </Text>
          ) : (
            <ProductRow
              product={item.product}
              onPress={() => navigation.navigate("ProductDetails", { productId: item.product.id })}
            />
          )
        }
      />

      {/* Floating "view cart" bar when the cart has items from this store */}
      {cartIsThisStore ? (
        <Pressable style={styles.cartBar} onPress={() => navigation.navigate("CartTab", { screen: "Cart" })}>
          <View style={styles.cartCount}>
            <Text style={styles.cartCountText}>{cart.itemCount}</Text>
          </View>
          <Text style={styles.cartBarText}>View cart</Text>
          <Text style={styles.cartBarText}>{formatPrice(cart.subtotal)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  storeCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 20, fontWeight: "800", color: colors.text },
  storeMeta: { color: colors.textMuted, marginVertical: spacing.xs },
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  closedText: { color: colors.danger, marginLeft: spacing.sm, flex: 1 },
  printBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  printText: { color: colors.white, fontWeight: "700", flex: 1, marginHorizontal: spacing.sm },
  chips: { marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionCount: { color: colors.textMuted, fontWeight: "400", fontSize: 15 },
  cartBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cartCount: {
    backgroundColor: colors.white,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cartCountText: { color: colors.primary, fontWeight: "800" },
  cartBarText: { color: colors.white, fontWeight: "800", fontSize: 16 },
});
