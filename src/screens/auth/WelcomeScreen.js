import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { colors, radius, spacing } from "../../theme/colors";

const FEATURES = [
  { icon: "fast-food-outline", text: "Order from the cafeteria, coffee corner & bookstore" },
  { icon: "print-outline", text: "Print your documents without leaving class" },
  { icon: "school-outline", text: "Delivered to your building & room, within your break" },
];

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="bicycle" size={56} color={colors.primary} />
        </View>
        <Text style={styles.appName}>CampusGo</Text>
        <Text style={styles.university}>Université Antonine</Text>
        <Text style={styles.intro}>
          Only a few minutes between two classes? Order now and get it delivered to your classroom before the break is over.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.icon} style={styles.featureRow}>
            <Ionicons name={f.icon} size={22} color={colors.white} />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title="Log in"
          onPress={() => navigation.navigate("Login")}
          style={styles.loginButton}
          variant="outline"
        />
        <Button
          title="Create an account"
          variant="outline"
          onPress={() => navigation.navigate("SignUp")}
          style={styles.signupButton}
          textColor={colors.white}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, padding: spacing.xl, justifyContent: "space-between" },
  hero: { alignItems: "center", marginTop: spacing.xl },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  appName: { fontSize: 36, fontWeight: "800", color: colors.white },
  university: { fontSize: 16, color: colors.primaryLight, marginTop: spacing.xs },
  intro: { fontSize: 16, color: colors.white, textAlign: "center", marginTop: spacing.lg, lineHeight: 22 },
  features: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radius.lg, padding: spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "center", marginVertical: spacing.sm },
  featureText: { color: colors.white, marginLeft: spacing.md, flex: 1, fontSize: 15 },
  actions: { gap: spacing.md, marginBottom: spacing.md },
  loginButton: { backgroundColor: colors.white, borderColor: colors.white },
  signupButton: { borderColor: colors.white },
});
