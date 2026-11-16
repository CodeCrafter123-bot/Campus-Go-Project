import { View, Text, StyleSheet } from "react-native";
import { formatPrice } from "../utils/pricing";
import { colors, radius, spacing } from "../theme/colors";

// Subtotal / delivery fee / total card.
export default function PriceSummary({ subtotal, deliveryFee, total, note }) {
  return (
    <View style={styles.card}>
      <Line label="Subtotal" value={formatPrice(subtotal)} />
      <Line label="Delivery fee" value={deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)} highlight={deliveryFee === 0} />
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={styles.divider} />
      <View style={styles.line}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
}

function Line({ label, value, highlight }) {
  return (
    <View style={styles.line}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.free]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 },
  label: { color: colors.textMuted, fontSize: 15 },
  value: { color: colors.text, fontWeight: "600", fontSize: 15 },
  free: { color: colors.success, fontWeight: "800" },
  note: { color: colors.accent, fontSize: 13, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { fontSize: 18, fontWeight: "800", color: colors.text },
  totalValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
});
