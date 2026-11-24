import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusTimeline from "../../components/StatusTimeline";
import StarRating from "../../components/StarRating";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import { useOrders, STATUS_LABELS } from "../../context/OrdersContext";
import { formatPrice, round2 } from "../../utils/pricing";
import { describeItem, formatDateTime, locationLabel } from "../../utils/format";
import { colors, radius, spacing } from "../../theme/colors";
import { showAlert } from "../../utils/dialog";

// How often the screen asks the server for the latest status.
const POLL_INTERVAL_MS = 3000;
const FINAL_STATUSES = ["delivered", "cancelled"];

export default function OrderTrackingScreen({ navigation, route }) {
  const { orderId, justPlaced } = route.params;
  const { getOrder, refreshOrder, cancelOrder, rateOrder } = useOrders();
  const order = getOrder(orderId);

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(false);

  // Live tracking: the SERVER moves the order forward with time
  // (Received → Preparing → On the way → Delivered). While this screen is open
  // and the order is not finished, we ask the server every 3 seconds.
  // The cleanup stops the timer when the order is finished or the screen is closed.
  const status = order?.status;
  useEffect(() => {
    if (FINAL_STATUSES.includes(status)) return; // delivered or cancelled → nothing to do
    refreshOrder(orderId); // immediately, then every 3 s
    const timer = setInterval(() => refreshOrder(orderId), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [status, orderId, refreshOrder]);

  if (!order) {
    return (
      <View style={styles.container}>
        <EmptyState icon="alert-circle-outline" title="Order not found">
          <Button title="My orders" onPress={() => navigation.navigate("OrdersHistory")} />
        </EmptyState>
      </View>
    );
  }

  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  const handleCancel = () =>
    showAlert(
      "Cancel this order?",
      order.paymentMethod === "wallet" ? `${formatPrice(order.total)} will be refunded to your wallet.` : undefined,
      [
        { text: "Keep order", style: "cancel" },
        {
          text: "Cancel order",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            const { error } = await cancelOrder(order.id);
            setCancelling(false);
            if (error) showAlert("Too late", error);
          },
        },
      ]
    );

  const handleRate = async () => {
    if (stars === 0) {
      setRatingError("Please choose 1 to 5 stars.");
      return;
    }
    setRating(true);
    const { error } = await rateOrder(order.id, stars, comment);
    setRating(false);
    if (error) setRatingError(error);
  };

  const header = (
    <View>
      {justPlaced && !isCancelled ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={styles.successText}>Order placed! We'll bring it to your classroom.</Text>
        </View>
      ) : null}

      {/* Status headline */}
      <View style={styles.card}>
        <Text style={styles.orderMeta}>
          Order #{order.id.slice(-6).toUpperCase()} · {formatDateTime(order.createdAt)}
        </Text>
        <Text style={[styles.statusTitle, isCancelled && styles.cancelledText]}>
          {isCancelled ? "Order cancelled" : isDelivered ? "Delivered 🎉" : STATUS_LABELS[order.status]}
        </Text>

        <View style={styles.infoRow}>
          <InfoItem icon="location-outline" label="Deliver to" value={locationLabel(order.buildingId, order.room)} />
          <InfoItem icon="time-outline" label={isDelivered ? "Delivery slot" : "Estimated delivery"} value={order.slotLabel} />
        </View>
        <View style={styles.infoRow}>
          <InfoItem icon="bicycle-outline" label="Courier" value={order.courier} />
          <InfoItem
            icon={order.paymentMethod === "wallet" ? "wallet-outline" : "cash-outline"}
            label="Payment"
            value={order.paymentMethod === "wallet" ? "Campus Wallet" : "Cash on delivery"}
          />
        </View>
      </View>

      {/* Timeline */}
      {isCancelled ? (
        <View style={[styles.card, styles.cancelCard]}>
          <Ionicons name="close-circle" size={22} color={colors.danger} />
          <Text style={styles.cancelInfo}>
            This order was cancelled.
            {order.paymentMethod === "wallet" ? ` ${formatPrice(order.total)} was refunded to your wallet.` : ""}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <StatusTimeline order={order} />
        </View>
      )}

      {order.status === "received" ? (
        <Button title="Cancel order" variant="outline" icon="close-circle-outline" onPress={handleCancel} loading={cancelling} style={styles.cancelButton} textColor={colors.danger} />
      ) : null}

      <Text style={styles.sectionTitle}>{order.storeName}</Text>
    </View>
  );

  const footer = (
    <View>
      <View style={styles.card}>
        <TotalLine label="Subtotal" value={formatPrice(order.subtotal)} />
        <TotalLine label="Delivery fee" value={order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)} />
        <TotalLine label="Total" value={formatPrice(order.total)} bold />
      </View>

      {/* Rating – only after delivery */}
      {isDelivered ? (
        <View style={styles.card}>
          {order.rating ? (
            <>
              <Text style={styles.rateTitle}>Your rating</Text>
              <StarRating value={order.rating.stars} size={26} />
              {order.rating.comment ? <Text style={styles.ratingComment}>“{order.rating.comment}”</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.rateTitle}>How was your order?</Text>
              <StarRating
                value={stars}
                onChange={(s) => {
                  setStars(s);
                  setRatingError(null);
                }}
              />
              {ratingError ? <Text style={styles.error}>{ratingError}</Text> : null}
              <TextField
                placeholder="Add a comment (optional)"
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={200}
                style={styles.commentField}
              />
              <Button title="Submit rating" onPress={handleRate} loading={rating} />
            </>
          )}
        </View>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={order.items}
      keyExtractor={(item, index) => item.key || `${item.productId}-${index}`}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      renderItem={({ item }) => (
        <View style={styles.itemRow}>
          <Text style={styles.itemEmoji}>{item.image}</Text>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>
              {item.quantity} × {item.name}
            </Text>
            {describeItem(item) ? <Text style={styles.itemDetails}>{describeItem(item)}</Text> : null}
          </View>
          <Text style={styles.itemPrice}>{formatPrice(round2(item.unitPrice * item.quantity))}</Text>
        </View>
      )}
    />
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function TotalLine({ label, value, bold }) {
  return (
    <View style={styles.totalLine}>
      <Text style={[styles.totalLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.totalValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  successText: { color: colors.success, fontWeight: "700", marginLeft: spacing.sm, flex: 1 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  orderMeta: { color: colors.textMuted, fontSize: 13 },
  statusTitle: { fontSize: 26, fontWeight: "800", color: colors.primary, marginTop: spacing.xs, marginBottom: spacing.md },
  cancelledText: { color: colors.danger },
  infoRow: { flexDirection: "row", marginTop: spacing.sm },
  infoItem: { flex: 1, flexDirection: "row" },
  infoTextBox: { marginLeft: spacing.sm, flex: 1 },
  infoLabel: { fontSize: 12, color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: "700", color: colors.text },
  cancelCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.dangerLight },
  cancelInfo: { color: colors.danger, marginLeft: spacing.sm, flex: 1 },
  cancelButton: { marginBottom: spacing.md, borderColor: colors.danger },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginVertical: spacing.sm },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  itemEmoji: { fontSize: 26, marginRight: spacing.md },
  itemInfo: { flex: 1 },
  itemName: { fontWeight: "700", color: colors.text },
  itemDetails: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  itemPrice: { fontWeight: "700", color: colors.text },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { color: colors.textMuted },
  totalValue: { color: colors.text },
  bold: { fontWeight: "800", color: colors.text, fontSize: 16 },
  rateTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  ratingComment: { color: colors.text, fontStyle: "italic", marginTop: spacing.sm },
  error: { color: colors.danger, marginTop: spacing.xs },
  commentField: { marginTop: spacing.md },
});
