import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FormContainer from "../../components/FormContainer";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { useAuth } from "../../context/AuthContext";
import {
  FACULTIES,
  PASSWORD_MIN_LENGTH,
  validateFullName,
  validateEmail,
  validateUniversityId,
  validateFaculty,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  runValidators,
} from "../../utils/validation";
import { colors, radius, spacing } from "../../theme/colors";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  universityId: "",
  faculty: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const validate = (f) =>
  runValidators({
    fullName: () => validateFullName(f.fullName),
    email: () => validateEmail(f.email),
    universityId: () => validateUniversityId(f.universityId),
    faculty: () => validateFaculty(f.faculty),
    phone: () => validatePhone(f.phone),
    password: () => validatePassword(f.password),
    confirmPassword: () => validateConfirmPassword(f.password, f.confirmPassword),
  });

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  const setField = (field) => (value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    setFormError(null);
    if (submitted) setErrors(validate(next)); // live feedback after the first submit
  };

  const handleSignUp = async () => {
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);
    const { error } = await signUp({
      ...form,
      universityId: form.universityId.trim().toUpperCase(),
      phone: form.phone.replace(/[\s-]/g, "").replace(/^\+961/, ""),
    });
    setLoading(false);
    if (error) setFormError(error);
    // On success the navigator switches to the app automatically.
  };

  return (
    <FormContainer>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>For Université Antonine students and staff.</Text>

      <TextField
        label="Full name"
        icon="person-outline"
        placeholder="e.g. Rita Khoury"
        autoCapitalize="words"
        value={form.fullName}
        onChangeText={setField("fullName")}
        error={errors.fullName}
      />
      <TextField
        label="University email"
        icon="mail-outline"
        placeholder="firstname.lastname@ua.edu.lb"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={setField("email")}
        error={errors.email}
      />
      <TextField
        label="Student / Staff ID"
        icon="card-outline"
        placeholder="202312345 or ST10234"
        autoCapitalize="characters"
        value={form.universityId}
        onChangeText={setField("universityId")}
        error={errors.universityId}
        hint="Students: 9 digits · Staff: ST + 5 digits"
      />

      <Text style={styles.label}>Faculty</Text>
      <View style={styles.chips}>
        {FACULTIES.map((f) => (
          <Chip key={f} label={f} selected={form.faculty === f} onPress={() => setField("faculty")(f)} />
        ))}
      </View>
      {errors.faculty ? <Text style={styles.error}>{errors.faculty}</Text> : null}

      <TextField
        label="Phone number"
        icon="call-outline"
        placeholder="71123456"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={setField("phone")}
        error={errors.phone}
        style={styles.afterChips}
      />
      <TextField
        label="Password"
        icon="lock-closed-outline"
        placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
        secure
        autoCapitalize="none"
        value={form.password}
        onChangeText={setField("password")}
        error={errors.password}
        hint="Use letters and numbers"
      />
      <TextField
        label="Confirm password"
        icon="lock-closed-outline"
        placeholder="Repeat your password"
        secure
        autoCapitalize="none"
        value={form.confirmPassword}
        onChangeText={setField("confirmPassword")}
        error={errors.confirmPassword}
      />

      {formError ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.bannerText}>{formError}</Text>
        </View>
      ) : null}

      <Button title="Create account" onPress={handleSignUp} loading={loading} />

      <Pressable onPress={() => navigation.replace("Login")} style={styles.switchLink}>
        <Text style={styles.switchText}>
          Already have an account? <Text style={styles.link}>Log in</Text>
        </Text>
      </Pressable>
    </FormContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl, fontSize: 15 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  error: { color: colors.danger, fontSize: 13 },
  afterChips: { marginTop: spacing.md },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  bannerText: { color: colors.danger, marginLeft: spacing.sm, flex: 1 },
  switchLink: { marginTop: spacing.xl, alignItems: "center" },
  switchText: { color: colors.textMuted, fontSize: 15 },
  link: { color: colors.primary, fontWeight: "700" },
});
