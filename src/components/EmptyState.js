import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme/colors";
//empty statte componenet 
export default function EmptyState({ icon = "search-outline", title, message, children }) {
  return (

    //why there is nothing to display 

    //could be used for an empty screen or empyt cart 
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: spacing.xl, marginTop: spacing.xl },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: spacing.md },
  message: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.lg },
});
