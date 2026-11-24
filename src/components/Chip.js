import { Pressable, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

// small rounded component used for filters and option pickers 
export default function Chip({ label, selected = false, onPress, disabled = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}
//screen tells whether it selected or no and what to do when tapped it also updates colors and styles 
const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { opacity: 0.4 },
  text: { color: colors.text, fontSize: 14 },
  selectedText: { color: colors.white, fontWeight: "600" },
});
