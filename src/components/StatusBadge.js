import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

// Green "Open" or red "Closed" pill.
export default function StatusBadge({ open, label }) {
  return (
    <View style={[styles.badge, { backgroundColor: open ? colors.successLight : colors.dangerLight }]}>
      <View style={[styles.dot, { backgroundColor: open ? colors.success : colors.danger }]} />
      <Text style={[styles.text, { color: open ? colors.success : colors.danger }]}>
        {label || (open ? "Open" : "Closed")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.lg,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  text: { fontSize: 12, fontWeight: "700" },
});
