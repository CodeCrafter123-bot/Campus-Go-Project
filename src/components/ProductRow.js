import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "../utils/pricing";
import { colors, radius, spacing } from "../theme/colors";

// One product in a store menu. Out-of-stock products are shown but greyed out.
export default function ProductRow({ product, onPress }) {
  const hasOptions = product.options.sizes.length > 0 || product.options.extras.length > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !product.inStock && styles.outOfStock, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.price)}${product.inStock ? "" : ", out of stock"}`}
    >
      <View style={styles.image}>
        <Text style={styles.emoji}>{product.image}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>
            {hasOptions ? "from " : ""}
            {formatPrice(product.price)}
          </Text>
          {!product.inStock ? <Text style={styles.stockLabel}>Out of stock</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  outOfStock: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  emoji: { fontSize: 34 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  description: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  bottomRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs },
  price: { fontSize: 15, fontWeight: "700", color: colors.primary },
  stockLabel: {
    marginLeft: spacing.sm,
    fontSize: 11,
    fontWeight: "700",
    color: colors.danger,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
});
