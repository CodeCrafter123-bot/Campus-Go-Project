import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QuantitySelector from "./QuantitySelector";
import { formatPrice, round2 } from "../utils/pricing";
import { describeItem } from "../utils/format";
import { printPricing } from "../data";
import { colors, radius, spacing } from "../theme/colors";

export default function CartItemRow({ item, onChangeQuantity, onRemove }) {
  const details = describeItem(item);
  const isPrint = item.type === "print";

  return (
    <View style={styles.row}>
      <View style={styles.image}>
        <Text style={styles.emoji}>{item.image}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {details ? <Text style={styles.details}>{details}</Text> : null}
        <Text style={styles.unit}>
          {formatPrice(item.unitPrice)} {isPrint ? "per copy" : "each"}
        </Text>
        <View style={styles.bottomRow}>
          <QuantitySelector
            small
            value={item.quantity}
            onChange={onChangeQuantity}
            max={isPrint ? printPricing.maxCopies : 20}
          />
          <Text style={styles.lineTotal}>{formatPrice(round2(item.unitPrice * item.quantity))}</Text>
        </View>
      </View>

      <Pressable onPress={onRemove} hitSlop={10} style={styles.remove} accessibilityLabel={`Remove ${item.name}`}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  emoji: { fontSize: 30 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  details: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  unit: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  lineTotal: { fontSize: 16, fontWeight: "800", color: colors.text },
  remove: { paddingLeft: spacing.sm },
});
