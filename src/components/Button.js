import { Pressable, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme/colors";

// reusable button used anywhere with its style 

//props of the button title on what to do on pressed on what to handle 
export default function Button({ title, onPress, variant = "primary", icon, loading = false, disabled = false, style, textColor }) {
  const isDisabled = disabled || loading;
  const v = { ...VARIANTS[variant], ...(textColor && { text: textColor }) };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={v.text} style={styles.icon} /> : null}
          <Text style={[styles.text, { color: v.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
//styles and  variants 
const VARIANTS = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.white },
  outline: { bg: "transparent", border: colors.primary, text: colors.primary },
  danger: { bg: colors.danger, border: colors.danger, text: colors.white },
  ghost: { bg: "transparent", border: "transparent", text: colors.primary },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center" },
  icon: { marginRight: spacing.sm },
  text: { fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
