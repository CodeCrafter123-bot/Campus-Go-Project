import { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FormContainer from "../../components/FormContainer";
import TextField from "../../components/TextField";
import SegmentedControl from "../../components/SegmentedControl";
import PriceSummary from "../../components/PriceSummary";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWallet } from "../../context/WalletContext";
import { useOrders } from "../../context/OrdersContext";
import { buildings, deliverySlots, getStoreById, settings } from "../../data";
import { checkSlot, isStoreOpen, slotLabel } from "../../utils/time";
import { getOrderTotals, formatPrice } from "../../utils/pricing";
import { locationLabel } from "../../utils/format";
import { validateRoom } from "../../utils/validation";
import useNow from "../../utils/useNow";
import { colors, radius, spacing } from "../../theme/colors";
import { showAlert } from "../../utils/dialog";

export default function CheckoutScreen({ navigation }) {
  const { user, addLocation } = useAuth();
  const cart = useCart();
  const wallet = useWallet();
  const { placeOrder } = useOrders();
  const now = useNow();

  const store = getStoreById(cart.storeId);
  const totals = getOrderTotals(cart.subtotal);

  const [buildingId, setBuildingId] = useState(null);
  const [room, setRoom] = useState("");
  const [saveLocation, setSaveLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [slotId, setSlotId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  // Each slot with its availability for THIS store (prep time + buffer, already passed, store closing).
  const slots = useMemo(
    () =>
      deliverySlots.map((slot) => ({
        slot,
        ...checkSlot(slot, {
          prepMinutes: store?.avgPrepMinutes ?? 0,
          bufferMinutes: settings.deliveryBufferMinutes,
          store,
          date: now,
        }),
      })),
    [store, now]
  );

  // Select the first available slot automatically, and drop a selection that became unavailable.
  useEffect(() => {
    const current = slots.find((s) => s.slot.id === slotId);
    if (!current || !current.available) {
      setSlotId(slots.find((s) => s.available)?.slot.id ?? null);
    }
  }, [slots, slotId]);

  // If the cart was emptied (e.g. order placed), leave this screen.
  if (!store) return null;

  const walletShort = paymentMethod === "wallet" && wallet.balance < totals.total;
  const selectedSlot = slots.find((s) => s.slot.id === slotId && s.available)?.slot;

  const applySavedLocation = (loc) => {
    setBuildingId(loc.buildingId);
    setRoom(loc.room);
    setSaveLocation(false);
    setErrors((e) => ({ ...e, building: null, room: null }));
  };

  const validate = () => {
    const found = {};
    if (!buildingId) found.building = "Please choose a building.";
    const roomError = validateRoom(room);
    if (roomError) found.room = roomError;
    if (!selectedSlot) found.slot = "Please choose a delivery time.";
    if (saveLocation && !locationName.trim()) found.locationName = "Give this location a name.";
    if (!isStoreOpen(store, new Date())) found.general = `${store.name} is closed now.`;
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  // Sends the order to the server (POST /api/orders), which checks everything again.
  const submitOrder = async () => {
    setPlacing(true);
    const { order, error } = await placeOrder({ buildingId, room, slot: selectedSlot, paymentMethod });
    setPlacing(false);
    if (error) {
      showAlert("Order refused", error);
      return;
    }
    if (saveLocation) addLocation({ label: locationName.trim(), buildingId, room: room.trim().toUpperCase() });

    // Reset the cart stack and open the tracking screen (with "My Orders" underneath it).
    navigation.popToTop();
    navigation.navigate("OrdersTab", {
      screen: "OrderTracking",
      params: { orderId: order.id, justPlaced: true },
      initial: false,
    });
  };

  const handleConfirm = () => {
    if (!validate()) return;
    if (walletShort) {
      showAlert(
        "Insufficient balance",
        `Your wallet has ${formatPrice(wallet.balance)} but the total is ${formatPrice(totals.total)}.\nTop up your wallet or pay cash on delivery.`
      );
      return;
    }
    showAlert(
      "Confirm your order",
      `${cart.itemCount} item(s) from ${store.name}\n` +
        `Deliver to: ${locationLabel(buildingId, room.trim())}\n` +
        `Time: ${slotLabel(selectedSlot)}\n` +
        `Payment: ${paymentMethod === "wallet" ? "Campus Wallet" : "Cash on delivery"}\n\n` +
        `Total: ${formatPrice(totals.total)}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Place order", onPress: submitOrder },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FormContainer>
        {/* ---------- 1. Location ---------- */}
        <SectionTitle icon="location-outline" title="Delivery location" />

        {user.savedLocations.length > 0 ? (
          <>
            <Text style={styles.smallLabel}>Saved locations</Text>
            <FlatList
              horizontal
              data={user.savedLocations}
              keyExtractor={(l) => l.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Chip
                  label={`★ ${item.label} – ${item.buildingId}${item.room}`}
                  selected={buildingId === item.buildingId && room === item.room}
                  onPress={() => applySavedLocation(item)}
                />
              )}
              style={styles.hList}
            />
          </>
        ) : null}

        <Text style={styles.smallLabel}>Building</Text>
        <FlatList
          horizontal
          data={buildings}
          keyExtractor={(b) => b.id}
          showsHorizontalScrollIndicator={false}
          style={styles.hList}
          renderItem={({ item }) => {
            const selected = buildingId === item.id;
            return (
              <Pressable
                onPress={() => {
                  setBuildingId(item.id);
                  setErrors((e) => ({ ...e, building: null }));
                }}
                style={[styles.buildingCard, selected && styles.cardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.buildingLetter, selected && styles.textSelected]}>{item.id}</Text>
                <Text style={[styles.buildingName, selected && styles.textSelected]} numberOfLines={2}>
                  {item.name.split("– ")[1]}
                </Text>
              </Pressable>
            );
          }}
        />
        {errors.building ? <Text style={styles.error}>{errors.building}</Text> : null}

        <TextField
          label="Room number"
          icon="business-outline"
          placeholder="e.g. 204"
          autoCapitalize="characters"
          value={room}
          onChangeText={(t) => {
            setRoom(t);
            if (errors.room) setErrors((e) => ({ ...e, room: validateRoom(t) }));
          }}
          error={errors.room}
          style={styles.roomField}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Save this location to my profile</Text>
          <Switch value={saveLocation} onValueChange={setSaveLocation} trackColor={{ true: colors.primary }} />
        </View>
        {saveLocation ? (
          <TextField
            placeholder='Name, e.g. "My Lab"'
            value={locationName}
            onChangeText={setLocationName}
            error={errors.locationName}
          />
        ) : null}

        {/* ---------- 2. Time ---------- */}
        <SectionTitle icon="time-outline" title="Delivery time (class break)" />
        <Text style={styles.helper}>
          {store.name} needs ~{store.avgPrepMinutes} min to prepare + {settings.deliveryBufferMinutes} min to deliver.
        </Text>
        <FlatList
          horizontal
          data={slots}
          keyExtractor={(s) => s.slot.id}
          showsHorizontalScrollIndicator={false}
          style={styles.hList}
          renderItem={({ item }) => {
            const selected = item.slot.id === slotId;
            return (
              <Pressable
                disabled={!item.available}
                onPress={() => {
                  setSlotId(item.slot.id);
                  setErrors((e) => ({ ...e, slot: null }));
                }}
                style={[styles.slotCard, selected && styles.cardSelected, !item.available && styles.slotDisabled]}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !item.available }}
              >
                <Text style={[styles.slotTime, selected && styles.textSelected]}>{item.slot.start}</Text>
                <Text style={[styles.slotEnd, selected && styles.textSelected]}>to {item.slot.end}</Text>
                <Text style={[styles.slotReason, selected && styles.textSelected]}>
                  {item.available ? "Available" : item.reason}
                </Text>
              </Pressable>
            );
          }}
        />
        {errors.slot || !slots.some((s) => s.available) ? (
          <Text style={styles.error}>{errors.slot || "No delivery slots left today for this store."}</Text>
        ) : null}

        {/* ---------- 3. Payment ---------- */}
        <SectionTitle icon="card-outline" title="Payment" />
        <SegmentedControl
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={[
            { value: "wallet", label: "Campus Wallet", icon: "wallet-outline", note: formatPrice(wallet.balance) },
            { value: "cash", label: "Cash", icon: "cash-outline", note: "on delivery" },
          ]}
        />
        {walletShort ? (
          <View style={styles.warning}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.warningText}>
              Insufficient balance ({formatPrice(wallet.balance)}). Top up or choose cash.
            </Text>
            <Pressable onPress={() => navigation.navigate("ProfileTab", { screen: "Wallet", initial: false })}>
              <Text style={styles.link}>Top up</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ---------- 4. Summary ---------- */}
        <SectionTitle icon="receipt-outline" title="Order summary" />
        <View style={styles.summaryInfo}>
          <SummaryRow icon="storefront-outline" text={`${store.name} · ${cart.itemCount} item(s)`} />
          <SummaryRow
            icon="location-outline"
            text={buildingId && room.trim() ? locationLabel(buildingId, room.trim()) : "Choose building and room"}
          />
          <SummaryRow icon="time-outline" text={selectedSlot ? slotLabel(selectedSlot) : "Choose a time"} />
        </View>
        <PriceSummary {...totals} />

        {errors.general ? <Text style={[styles.error, styles.generalError]}>{errors.general}</Text> : null}

        <Button
          title={`Place order · ${formatPrice(totals.total)}`}
          icon="checkmark-circle-outline"
          onPress={handleConfirm}
          loading={placing}
          style={styles.submit}
        />
      </FormContainer>
    </View>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SummaryRow({ icon, text }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginLeft: spacing.sm },
  smallLabel: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  helper: { color: colors.textMuted, marginBottom: spacing.md, marginTop: -spacing.sm },
  hList: { marginBottom: spacing.sm, flexGrow: 0 },
  buildingCard: {
    width: 96,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  buildingLetter: { fontSize: 24, fontWeight: "800", color: colors.primary },
  buildingName: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 2 },
  cardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  textSelected: { color: colors.white },
  roomField: { marginTop: spacing.md },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  switchLabel: { color: colors.text, flex: 1 },
  slotCard: {
    width: 110,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  slotDisabled: { opacity: 0.4, backgroundColor: colors.background },
  slotTime: { fontSize: 20, fontWeight: "800", color: colors.text },
  slotEnd: { color: colors.textMuted, fontSize: 13 },
  slotReason: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs, textAlign: "center" },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
  generalError: { marginTop: spacing.md },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  warningText: { color: colors.danger, marginHorizontal: spacing.sm, flex: 1 },
  link: { color: colors.primary, fontWeight: "800" },
  summaryInfo: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  summaryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  summaryText: { marginLeft: spacing.sm, color: colors.text },
  submit: { marginTop: spacing.lg },
});
