import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ORDER_STATUSES, STATUS_LABELS } from "../context/OrdersContext";
import { formatTime, locationLabel } from "../utils/format";
import { colors, spacing } from "../theme/colors";

const ICONS = {
  received: "receipt-outline",
  preparing: "restaurant-outline",
  on_the_way: "bicycle-outline",
  delivered: "checkmark-done-outline",
};

// Vertical timeline: Received → Preparing → On the way → Delivered.
export default function StatusTimeline({ order }) {
  const currentIndex = ORDER_STATUSES.indexOf(order.status);

  return (
    <View>
      {ORDER_STATUSES.map((status, index) => {
        const done = index <= currentIndex;
        const active = index === currentIndex;
        const isLast = index === ORDER_STATUSES.length - 1;
        const label =
          status === "delivered" ? `Delivered to ${locationLabel(order.buildingId, order.room)}` : STATUS_LABELS[status];

        return (
          <View key={status} style={styles.step}>
            <View style={styles.markerColumn}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                <Ionicons name={ICONS[status]} size={16} color={done ? colors.white : colors.textMuted} />
              </View>
              {!isLast ? <View style={[styles.line, index < currentIndex && styles.lineDone]} /> : null}
            </View>
            <View style={styles.textColumn}>
              <Text style={[styles.label, done && styles.labelDone, active && styles.labelActive]}>{label}</Text>
              <Text style={styles.time}>
                {order.statusTimes[status] ? formatTime(order.statusTimes[status]) : active ? "In progress…" : " "}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: "row", minHeight: 62 },
  markerColumn: { alignItems: "center", width: 36 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: colors.success },
  dotActive: { backgroundColor: colors.primary, transform: [{ scale: 1.15 }] },
  line: { flex: 1, width: 3, backgroundColor: colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: colors.success },
  textColumn: { flex: 1, marginLeft: spacing.md, paddingTop: 5 },
  label: { fontSize: 15, color: colors.textMuted },
  labelDone: { color: colors.text, fontWeight: "600" },
  labelActive: { color: colors.primary, fontWeight: "800" },
  time: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
