import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme/colors";

// Row of mutually exclusive options. options = [{ value, label, icon?, note? }]
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, selected && styles.selected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            {opt.icon ? (
              <Ionicons name={opt.icon} size={18} color={selected ? colors.white : colors.primary} />
            ) : null}
            <Text style={[styles.label, selected && styles.selectedText]}>{opt.label}</Text>
            {opt.note ? <Text style={[styles.note, selected && styles.selectedText]}>{opt.note}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontWeight: "700", color: colors.text, marginTop: 2 },
  note: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  selectedText: { color: colors.white },
});
