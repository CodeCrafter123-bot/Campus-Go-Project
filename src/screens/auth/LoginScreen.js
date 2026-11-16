import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FormContainer from "../../components/FormContainer";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { validateEmail, validateRequired, runValidators } from "../../utils/validation";
import { colors, radius, spacing } from "../../theme/colors";

const validate = (values) =>
  runValidators({
    email: () => validateEmail(values.email),
    password: () => validateRequired(values.password, "Password"),
  });

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false); // show live errors only after the first try
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Updates a field and re-validates if the user already pressed "Log in".
  const setField = (field) => (value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    setLoginError(null);
    if (submitted) setErrors(validate(next));
  };

  const handleLogin = async () => {
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    const { error } = await login(form.email, form.password);
    setLoading(false);
    if (error) setLoginError(error);
    // On success the navigator switches to the app automatically.
  };

  return (
    <FormContainer>
      <Text style={styles.title}>Welcome back 👋</Text>
      <Text style={styles.subtitle}>Log in with your university account.</Text>

      {loginError ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.bannerText}>{loginError}</Text>
        </View>
      ) : null}

      <TextField
        label="University email"
        icon="mail-outline"
        placeholder="firstname.lastname@ua.edu.lb"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={form.email}
        onChangeText={setField("email")}
        error={errors.email}
      />
      <TextField
        label="Password"
        icon="lock-closed-outline"
        placeholder="Your password"
        secure
        autoCapitalize="none"
        value={form.password}
        onChangeText={setField("password")}
        error={errors.password}
        onSubmitEditing={handleLogin}
      />

      <Button title="Log in" onPress={handleLogin} loading={loading} style={styles.submit} />

      <Pressable onPress={() => navigation.replace("SignUp")} style={styles.switchLink}>
        <Text style={styles.switchText}>
          No account yet? <Text style={styles.link}>Create one</Text>
        </Text>
      </Pressable>

      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>Demo account</Text>
        <Text style={styles.demoText}>demo@ua.edu.lb · campus123</Text>
      </View>
    </FormContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl, fontSize: 15 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  bannerText: { color: colors.danger, marginLeft: spacing.sm, flex: 1 },
  submit: { marginTop: spacing.sm },
  switchLink: { marginTop: spacing.xl, alignItems: "center" },
  switchText: { color: colors.textMuted, fontSize: 15 },
  link: { color: colors.primary, fontWeight: "700" },
  demoBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
  },
  demoTitle: { fontWeight: "700", color: colors.primary },
  demoText: { color: colors.text, marginTop: 2 },
});
