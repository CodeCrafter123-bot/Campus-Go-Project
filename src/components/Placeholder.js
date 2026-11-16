import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

// Temporary screen body used until each real screen is built.
// `links` is a list of { label, onPress } buttons to test navigation.
export default function Placeholder({ title, subtitle, links = [] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {links.map((link) => (
        <Pressable key={link.label} style={styles.button} onPress={link.onPress}>
          <Text style={styles.buttonText}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: "bold", color: colors.text },
  subtitle: { marginTop: spacing.sm, color: colors.textMuted, textAlign: "center" },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  buttonText: { color: colors.white, fontWeight: "600" },
});
