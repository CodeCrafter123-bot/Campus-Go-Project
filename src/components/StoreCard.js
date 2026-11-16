import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import { colors, radius, spacing } from "../theme/colors";

// One row of the stores list. `status` = { open, label } from getStoreStatus().
export default function StoreCard({ store, status, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, !status.open && styles.closed, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${store.name}, ${status.open ? "open" : "closed"}`}
    >
      <View style={[styles.logo, { backgroundColor: store.color }]}>
        <Ionicons name={store.icon} size={30} color={colors.white} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{store.name}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {store.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{store.category}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.meta}> ~{store.avgPrepMinutes} min</Text>
        </View>
        <StatusBadge open={status.open} label={status.label} />
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  closed: { opacity: 0.65 },
  pressed: { opacity: 0.8 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  description: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", marginVertical: spacing.xs },
  meta: { color: colors.textMuted, fontSize: 13 },
  metaDot: { color: colors.textMuted, marginHorizontal: 6 },
});
