import { useState } from "react";
import { View, Text, FlatList, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { useOrders } from "../../context/OrdersContext";
import { buildings } from "../../data";
import { formatPrice } from "../../utils/pricing";
import { locationLabel } from "../../utils/format";
import { validateRoom, validateRequired } from "../../utils/validation";
import { colors, radius, spacing } from "../../theme/colors";

const EMPTY_LOCATION = { label: "", buildingId: null, room: "" };

export default function ProfileScreen({ navigation }) {
  const { user, logout, addLocation, removeLocation } = useAuth();
  const { balance } = useWallet();
  const { orders } = useOrders();

  const [adding, setAdding] = useState(false);
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [errors, setErrors] = useState({});

  const initials = user.fullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const isStaff = user.universityId.startsWith("ST");

  const saveLocation = () => {
    const found = {};
    const labelError = validateRequired(location.label, "Name");
    if (labelError) found.label = labelError;
    if (!location.buildingId) found.buildingId = "Choose a building.";
    const roomError = validateRoom(location.room);
    if (roomError) found.room = roomError;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    addLocation({ label: location.label.trim(), buildingId: location.buildingId, room: location.room.trim().toUpperCase() });
    setLocation(EMPTY_LOCATION);
    setAdding(false);
  };

  const confirmRemove = (loc) =>
    Alert.alert("Remove location?", `${loc.label} – ${locationLabel(loc.buildingId, loc.room)}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeLocation(loc.id) },
    ]);

  const confirmLogout = () =>
    Alert.alert("Log out?", "Your cart and orders stay saved on this phone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);

  const header = (
    <View>
      {/* Identity card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.role}>{isStaff ? "Staff" : "Student"} · {user.faculty}</Text>

        <View style={styles.details}>
          <DetailRow icon="card-outline" label="ID" value={user.universityId} />
          <DetailRow icon="mail-outline" label="Email" value={user.email} />
          <DetailRow icon="call-outline" label="Phone" value={user.phone} />
          <DetailRow icon="school-outline" label="Faculty" value={user.faculty} />
        </View>
      </View>

      {/* Wallet shortcut */}
      <Pressable style={styles.walletCard} onPress={() => navigation.navigate("Wallet")}>
        <Ionicons name="wallet" size={28} color={colors.white} />
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Campus Wallet</Text>
          <Text style={styles.walletBalance}>{formatPrice(balance)}</Text>
        </View>
        <Text style={styles.walletAction}>Top up ›</Text>
      </Pressable>

      <View style={styles.statsRow}>
        <Stat value={orders.length} label="Orders" />
        <Stat value={delivered} label="Delivered" />
        <Stat value={user.savedLocations.length} label="Locations" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Saved delivery locations</Text>
        {!adding ? (
          <Pressable onPress={() => setAdding(true)} hitSlop={8}>
            <Text style={styles.link}>+ Add</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const footer = (
    <View>
      {user.savedLocations.length === 0 && !adding ? (
        <Text style={styles.emptyText}>No saved locations yet. Add your lab or usual classroom.</Text>
      ) : null}

      {adding ? (
        <View style={styles.addCard}>
          <TextField
            label="Name"
            placeholder='e.g. "My Lab"'
            value={location.label}
            onChangeText={(t) => setLocation((l) => ({ ...l, label: t }))}
            error={errors.label}
          />
          <Text style={styles.smallLabel}>Building</Text>
          <View style={styles.chips}>
            {buildings.map((b) => (
              <Chip
                key={b.id}
                label={b.id}
                selected={location.buildingId === b.id}
                onPress={() => setLocation((l) => ({ ...l, buildingId: b.id }))}
              />
            ))}
          </View>
          {errors.buildingId ? <Text style={styles.error}>{errors.buildingId}</Text> : null}
          <TextField
            label="Room"
            placeholder="e.g. 204"
            autoCapitalize="characters"
            value={location.room}
            onChangeText={(t) => setLocation((l) => ({ ...l, room: t }))}
            error={errors.room}
            style={styles.roomField}
          />
          <View style={styles.addActions}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                setAdding(false);
                setErrors({});
                setLocation(EMPTY_LOCATION);
              }}
              style={styles.flex}
            />
            <Button title="Save" onPress={saveLocation} style={styles.flex} />
          </View>
        </View>
      ) : null}

      <Button title="Log out" variant="outline" icon="log-out-outline" onPress={confirmLogout} style={styles.logout} textColor={colors.danger} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={user.savedLocations}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.locationRow}>
            <Ionicons name="star" size={18} color={colors.accent} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.label}</Text>
              <Text style={styles.locationPlace}>{locationLabel(item.buildingId, item.room)}</Text>
            </View>
            <Pressable onPress={() => confirmRemove(item)} hitSlop={10} accessibilityLabel={`Remove ${item.label}`}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
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
  profileCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center" },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: spacing.md },
  role: { color: colors.textMuted, marginTop: 2 },
  details: { alignSelf: "stretch", marginTop: spacing.lg },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailLabel: { width: 70, marginLeft: spacing.sm, color: colors.textMuted },
  detailValue: { flex: 1, color: colors.text, fontWeight: "600", textAlign: "right" },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  walletInfo: { flex: 1, marginLeft: spacing.md },
  walletLabel: { color: colors.primaryLight, fontSize: 13 },
  walletBalance: { color: colors.white, fontSize: 24, fontWeight: "800" },
  walletAction: { color: colors.white, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  link: { color: colors.primary, fontWeight: "800", fontSize: 15 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  locationInfo: { flex: 1, marginLeft: spacing.md },
  locationName: { fontWeight: "700", color: colors.text },
  locationPlace: { color: colors.textMuted, fontSize: 13 },
  emptyText: { color: colors.textMuted, marginBottom: spacing.md },
  addCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  smallLabel: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  error: { color: colors.danger, fontSize: 13 },
  roomField: { marginTop: spacing.md },
  addActions: { flexDirection: "row", gap: spacing.md },
  logout: { marginTop: spacing.xl, borderColor: colors.danger },
});
