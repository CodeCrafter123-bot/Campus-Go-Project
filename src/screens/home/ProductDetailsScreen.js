import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Chip from "../../components/Chip";
import Button from "../../components/Button";
import QuantitySelector from "../../components/QuantitySelector";
import { getProductById, getStoreById } from "../../data";
import { isStoreOpen } from "../../utils/time";
import { formatPrice, getUnitPrice, round2 } from "../../utils/pricing";
import useAddToCart from "../../utils/useAddToCart";
import useNow from "../../utils/useNow";
import { colors, radius, spacing } from "../../theme/colors";

export default function ProductDetailsScreen({ navigation, route }) {
  const product = getProductById(route.params.productId);
  const store = getStoreById(product.storeId);
  const now = useNow();
  const storeOpen = isStoreOpen(store, now);
  const addToCart = useAddToCart();

  const { sizes, extras } = product.options;
  const [size, setSize] = useState(sizes[0] || null); // first size selected by default
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [quantity, setQuantity] = useState(1);

  const toggleExtra = (extra) =>
    setSelectedExtras((list) =>
      list.some((e) => e.label === extra.label) ? list.filter((e) => e.label !== extra.label) : [...list, extra]
    );

  const unitPrice = getUnitPrice(product, size, selectedExtras);
  const total = round2(unitPrice * quantity);
  const canAdd = product.inStock && storeOpen;

  const handleAdd = () => {
    addToCart(
      {
        type: "product",
        productId: product.id,
        storeId: product.storeId,
        name: product.name,
        image: product.image,
        unitPrice,
        quantity,
        size,
        extras: selectedExtras,
      },
      () => navigation.goBack() // back to the menu; the "View cart" bar appears there
    );
  };

  let disabledReason = null;
  if (!product.inStock) disabledReason = "This product is out of stock.";
  else if (!storeOpen) disabledReason = `${store.name} is closed right now.`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageBox}>
          <Text style={styles.emoji}>{product.image}</Text>
          {!product.inStock ? (
            <View style={styles.outBadge}>
              <Text style={styles.outBadgeText}>OUT OF STOCK</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.storeName}>{store.name} · {product.category}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.description}>{product.description}</Text>

        {sizes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size</Text>
            <View style={styles.chips}>
              {sizes.map((s) => (
                <Chip
                  key={s.label}
                  label={s.extra > 0 ? `${s.label} (+${formatPrice(s.extra)})` : s.label}
                  selected={size?.label === s.label}
                  onPress={() => setSize(s)}
                  disabled={!product.inStock}
                />
              ))}
            </View>
          </View>
        ) : null}

        {extras.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extras <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.chips}>
              {extras.map((e) => (
                <Chip
                  key={e.label}
                  label={e.price > 0 ? `${e.label} +${formatPrice(e.price)}` : `${e.label} (free)`}
                  selected={selectedExtras.some((x) => x.label === e.label)}
                  onPress={() => toggleExtra(e)}
                  disabled={!product.inStock}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.section, styles.quantityRow]}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <QuantitySelector value={quantity} onChange={setQuantity} />
        </View>
      </ScrollView>

      {/* Bottom bar: total + add button */}
      <View style={styles.footer}>
        {disabledReason ? (
          <View style={styles.warning}>
            <Ionicons name="information-circle" size={18} color={colors.danger} />
            <Text style={styles.warningText}>{disabledReason}</Text>
          </View>
        ) : null}
        <Button
          title={canAdd ? `Add ${quantity} to cart · ${formatPrice(total)}` : "Unavailable"}
          icon={canAdd ? "cart" : undefined}
          onPress={handleAdd}
          disabled={!canAdd}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  imageBox: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emoji: { fontSize: 96 },
  outBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  outBadgeText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  storeName: { color: colors.textMuted, fontSize: 13 },
  name: { fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 2 },
  price: { fontSize: 20, fontWeight: "700", color: colors.primary, marginTop: spacing.xs },
  description: { color: colors.textMuted, fontSize: 15, marginTop: spacing.sm, lineHeight: 21 },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  optional: { color: colors.textMuted, fontWeight: "400", fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  warning: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  warningText: { color: colors.danger, marginLeft: spacing.xs, flex: 1 },
});
