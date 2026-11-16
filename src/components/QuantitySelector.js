import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme/colors";

// − [value] +  control. `small` is used inside cart rows.
export default function QuantitySelector({ value, onChange, min = 1, max = 20, small = false }) {
  const size = small ? 30 : 40;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(value - 1)}
        disabled={value <= min}
        style={[styles.button, { width: size, height: size }, value <= min && styles.disabled]}
        accessibilityLabel="Decrease quantity"
        hitSlop={6}
      >
        <Ionicons name="remove" size={small ? 16 : 20} color={colors.primary} />
      </Pressable>
      <Text style={[styles.value, small && styles.valueSmall]}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={value >= max}
        style={[styles.button, { width: size, height: size }, value >= max && styles.disabled]}
        accessibilityLabel="Increase quantity"
        hitSlop={6}
      >
        <Ionicons name="add" size={small ? 16 : 20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  button: {
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.35 },
  value: { minWidth: 40, textAlign: "center", fontSize: 18, fontWeight: "700", color: colors.text },
  valueSmall: { minWidth: 30, fontSize: 15 },
});
