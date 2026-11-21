import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { useAuth, ROOT_ADMIN_ID } from "../../context/AuthContext";
import {
  validateRequired,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  runValidators,
} from "../../utils/validation";
import { showAlert } from "../../utils/dialog";
import { colors, radius, spacing } from "../../theme/colors";

const EMPTY_ADMIN = { fullName: "", email: "", password: "", confirm: "" };

const validate = (v) =>
  runValidators({
    fullName: () => validateRequired(v.fullName, "Name"),
    email: () => validateEmail(v.email),
    password: () => validatePassword(v.password),
    confirm: () => validateConfirmPassword(v.password, v.confirm),
  });

export default function AdminScreen() {
  const { user, adminUsers, setFrozen, createAdmin, deleteUser } = useAuth();
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_ADMIN);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(null);
  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? adminUsers.filter((u) =>
          [u.fullName, u.email, u.universityId].some((field) => (field || "").toLowerCase().includes(q))
        )
      : adminUsers;
    return [...list].sort((a, b) => (a.role === b.role ? a.fullName.localeCompare(b.fullName) : a.role === "admin" ? -1 : 1));
  }, [adminUsers, query]);
  const adminCount = adminUsers.filter((u) => u.role === "admin").length;
  const frozenCount = adminUsers.filter((u) => u.frozen).length;
  const setField = (field) => (value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };
  const closeForm = () => {
    setCreating(false);
    setForm(EMPTY_ADMIN);
    setErrors({});
    setSubmitted(false);
  };
  const handleCreate = () => {
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const { error } = createAdmin(form);
    if (error) {
      setErrors({ email: error });
      return;
    }
    setNotice(`Admin account created for ${form.email.trim().toLowerCase()}.`);
    closeForm();
  };
  const confirmFreeze = (target) => {
    const freezing = !target.frozen;
    showAlert(
      freezing ? "Freeze account?" : "Unfreeze account?",
      freezing
        ? `${target.fullName} will not be able to log in until you unfreeze the account.`
        : `${target.fullName} will be able to log in again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: freezing ? "Freeze" : "Unfreeze",
          style: freezing ? "destructive" : "default",
          onPress: () => {
            const { error } = setFrozen(target.id, freezing);
            if (error) showAlert("Not allowed", error);
            else setNotice(`${target.fullName} was ${freezing ? "frozen" : "unfrozen"}.`);
          },
        },
      ]
    );
  };
  const confirmDelete = (target) =>
    showAlert("Delete user?", `${target.fullName} (${target.email}) and all their wallet, cart and order data will be permanently deleted.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await deleteUser(target.id);
          if (error) showAlert("Not allowed", error);
          else setNotice(`${target.fullName} was deleted.`);
        },
      },
    ]);
  const header = (
    <View>
      <View style={styles.summaryCard}>
        <Ionicons name="shield-checkmark" size={28} color={colors.white} />
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryLabel}>Signed in as admin</Text>
          <Text style={styles.summaryEmail} numberOfLines={1}>{user.email}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <Stat value={adminUsers.length} label="Accounts" />
        <Stat value={adminCount} label="Admins" />
        <Stat value={frozenCount} label="Frozen" />
      </View>
      {notice ? (
        <View style={styles.notice}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      {creating ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create new admin</Text>
          <TextField label="Full name" icon="person-outline" placeholder="Admin name" value={form.fullName} onChangeText={setField("fullName")} error={errors.fullName} />
          <TextField
            label="Email"
            icon="mail-outline"
            placeholder="name@ua.edu.lb"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={setField("email")}
            error={errors.email}
          />
          <TextField
            label="Password"
            icon="lock-closed-outline"
            placeholder="At least 8 characters, letters and numbers"
            secure
            autoCapitalize="none"
            value={form.password}
            onChangeText={setField("password")}
            error={errors.password}
          />
          <TextField
            label="Confirm password"
            icon="lock-closed-outline"
            placeholder="Repeat the password"
            secure
            autoCapitalize="none"
            value={form.confirm}
            onChangeText={setField("confirm")}
            error={errors.confirm}
            onSubmitEditing={handleCreate}
          />
          <View style={styles.formActions}>
            <Button title="Cancel" variant="ghost" onPress={closeForm} style={styles.flex} />
            <Button title="Create admin" icon="person-add-outline" onPress={handleCreate} style={styles.flex} />
          </View>
        </View>
      ) : (
        <Button
          title="Create new admin"
          icon="person-add-outline"
          onPress={() => {
            setNotice(null);
            setCreating(true);
          }}
        />
      )}
      <Text style={styles.sectionTitle}>Users</Text>
      <TextField
        icon="search-outline"
        placeholder="Search by name, email or ID"
        autoCapitalize="none"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
    </View>
  );
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={visibleUsers}
        keyExtractor={(u) => u.id}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" message="Try a different search." />}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <UserRow
            item={item}
            isSelf={item.id === user.id}
            isProtected={item.id === ROOT_ADMIN_ID}
            onOpen={() => navigation.navigate("UserDetails", { userId: item.id })}
            onFreeze={() => confirmFreeze(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />
    </KeyboardAvoidingView>
  );
}

function UserRow({ item, isSelf, isProtected, onOpen, onFreeze, onDelete }) {
  const isAdmin = item.role === "admin";
  const locked = isSelf || isProtected;
  return (
    <View style={[styles.userCard, item.frozen && styles.userCardFrozen]}>
      <Pressable onPress={onOpen} style={styles.userTop} accessibilityRole="button" accessibilityLabel={`Open details of ${item.fullName}`}>
        <View style={[styles.avatar, isAdmin && styles.avatarAdmin]}>
          <Ionicons name={isAdmin ? "shield-checkmark" : "person"} size={18} color={colors.white} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.fullName}
            {isSelf ? " (you)" : ""}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.userMeta}>{isAdmin ? "Admin" : `ID ${item.universityId}`}</Text>
        </View>
        <StatusBadge open={!item.frozen} label={item.frozen ? "Frozen" : "Active"} />
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
      </Pressable>
      {locked ? (
        <Text style={styles.lockedText}>{isSelf ? "This is your account." : "Main admin account is protected."}</Text>
      ) : (
        <View style={styles.userActions}>
          <Button
            title={item.frozen ? "Unfreeze" : "Freeze"}
            variant="outline"
            icon={item.frozen ? "play-outline" : "snow-outline"}
            onPress={onFreeze}
            style={styles.actionBtn}
          />
          <Button title="Delete" variant="danger" icon="trash-outline" onPress={onDelete} style={styles.actionBtn} />
        </View>
      )}
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  summaryCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg },
  summaryInfo: { flex: 1, marginLeft: spacing.md },
  summaryLabel: { color: colors.primaryLight, fontSize: 13 },
  summaryEmail: { color: colors.white, fontSize: 17, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.md },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  notice: { flexDirection: "row", alignItems: "center", backgroundColor: colors.successLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  noticeText: { color: colors.success, marginLeft: spacing.sm, flex: 1, fontWeight: "600" },
  formCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  formTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  formActions: { flexDirection: "row", gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  search: { marginBottom: spacing.sm },
  userCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  userCardFrozen: { borderWidth: 1, borderColor: colors.danger, backgroundColor: "#fffafa" },
  userTop: { flexDirection: "row", alignItems: "center" },
  chevron: { marginLeft: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.textMuted, alignItems: "center", justifyContent: "center" },
  avatarAdmin: { backgroundColor: colors.primary },
  userInfo: { flex: 1, marginHorizontal: spacing.md },
  userName: { fontWeight: "700", color: colors.text, fontSize: 15 },
  userEmail: { color: colors.textMuted, fontSize: 13 },
  userMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  userActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, minHeight: 42 },
  lockedText: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
});
