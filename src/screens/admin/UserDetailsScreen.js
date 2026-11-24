import { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { useAuth, ROOT_ADMIN_ID } from "../../context/AuthContext";
import { STATUS_LABELS } from "../../context/OrdersContext";
import { formatPrice, round2 } from "../../utils/pricing";
import { formatDateTime } from "../../utils/format";
import { getBuildingById } from "../../data";
import { showAlert } from "../../utils/dialog";
import { colors, radius, spacing } from "../../theme/colors";

// Shows one account with its wallet and orders, loaded from GET /api/admin/users/:userId.
// (The cart is not shown: it stays on the user's own phone.)
export default function UserDetailsScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: me, request, setFrozen, deleteUser } = useAuth();
  const [details, setDetails] = useState(null); // { user, wallet, orders }
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await request(`/admin/users/${userId}`);
    if (data) setDetails(data);
    setError(loadError || null);
  }, [request, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!details) {
    return error ? (
      <EmptyState icon="person-outline" title="User not found" message={error} />
    ) : (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  const { user: target, wallet, orders } = details;
  const isAdmin = target.role === "admin";
  const locked = target.id === me.id || target.id === ROOT_ADMIN_ID;
  const sortedOrders = orders; // the server already sends them newest first
  const totalSpent = round2(orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.total || 0), 0));
  const infoRows = [
    ["Full name", target.fullName],
    ["Email", target.email],
    ["University ID", target.universityId || "—"],
    ["Faculty", target.faculty || "—"],
    ["Phone", target.phone || "—"],
    ["Role", isAdmin ? "Admin" : "User"],
    ["Status", target.frozen ? "Frozen" : "Active"],
    ["Created", target.createdAt ? formatDateTime(target.createdAt) : "Not recorded"],
    ["Account ID", target.id],
  ];
  const confirmFreeze = () => {
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
          onPress: async () => {
            const { error: freezeError } = await setFrozen(target.id, freezing);
            if (freezeError) showAlert("Not allowed", freezeError);
            else load(); // show the new status
          },
        },
      ]
    );
  };
  const confirmDelete = () =>
    showAlert("Delete user?", `${target.fullName} (${target.email}) and all their wallet, saved locations and order data will be permanently deleted.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error: deleteError } = await deleteUser(target.id);
          if (deleteError) showAlert("Not allowed", deleteError);
          else navigation.goBack();
        },
      },
    ]);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.avatar, isAdmin && styles.avatarAdmin]}>
          <Ionicons name={isAdmin ? "shield-checkmark" : "person"} size={32} color={colors.white} />
        </View>
        <Text style={styles.heroName}>{target.fullName}</Text>
        <Text style={styles.heroEmail}>{target.email}</Text>
        <StatusBadge open={!target.frozen} label={target.frozen ? "Frozen" : "Active"} />
      </View>
      <Card title="Account information">
        {infoRows.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </Card>
      {!isAdmin ? (
        <>
          <Card title="Wallet">
            <InfoRow label="Balance" value={formatPrice(wallet.balance)} />
            <InfoRow label="Transactions" value={String(wallet.transactions.length)} />
            {wallet.transactions.slice(0, 5).map((tx) => (
              <View key={tx.id} style={styles.listRow}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle} numberOfLines={1}>{tx.description}</Text>
                  <Text style={styles.listSub}>{formatDateTime(tx.date)}</Text>
                </View>
                <Text style={[styles.amount, { color: tx.amount >= 0 ? colors.success : colors.danger }]}>
                  {tx.amount >= 0 ? "+" : "-"}{formatPrice(Math.abs(tx.amount))}
                </Text>
              </View>
            ))}
          </Card>
          <Card title="Orders">
            <InfoRow label="Total orders" value={String(orders.length)} />
            <InfoRow label="Total spent" value={formatPrice(totalSpent)} />
            {sortedOrders.length === 0 ? (
              <Text style={styles.empty}>No orders yet.</Text>
            ) : (
              sortedOrders.slice(0, 5).map((o) => (
                <View key={o.id} style={styles.listRow}>
                  <View style={styles.listMain}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      #{o.id.slice(-6).toUpperCase()} · {o.storeName}
                    </Text>
                    <Text style={styles.listSub}>
                      {STATUS_LABELS[o.status] || o.status} · {formatDateTime(o.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{formatPrice(o.total)}</Text>
                </View>
              ))
            )}
          </Card>
          <Card title="Saved locations">
            {target.savedLocations.length === 0 ? (
              <Text style={styles.empty}>No saved locations.</Text>
            ) : (
              target.savedLocations.map((l) => (
                <View key={l.id} style={styles.listRow}>
                  <View style={styles.listMain}>
                    <Text style={styles.listTitle}>{l.label}</Text>
                    <Text style={styles.listSub}>
                      {getBuildingById(l.buildingId)?.name || `Building ${l.buildingId}`}, Room {l.room}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
      {locked ? (
        <Text style={styles.locked}>{target.id === me.id ? "This is your account." : "Main admin account is protected."}</Text>
      ) : (
        <View style={styles.actions}>
          <Button
            title={target.frozen ? "Unfreeze" : "Freeze"}
            variant="outline"
            icon={target.frozen ? "play-outline" : "snow-outline"}
            onPress={confirmFreeze}
            style={styles.flex}
          />
          <Button title="Delete" variant="danger" icon="trash-outline" onPress={confirmDelete} style={styles.flex} />
        </View>
      )}
    </ScrollView>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} selectable>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  hero: { alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.textMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  avatarAdmin: { backgroundColor: colors.primary },
  heroName: { fontSize: 20, fontWeight: "800", color: colors.text },
  heroEmail: { color: colors.textMuted, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.textMuted, fontSize: 13, marginRight: spacing.md },
  value: { color: colors.text, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  listMain: { flex: 1, marginRight: spacing.sm },
  listTitle: { color: colors.text, fontWeight: "600" },
  listSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: "800", color: colors.text },
  empty: { color: colors.textMuted },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  locked: { color: colors.textMuted, textAlign: "center", marginTop: spacing.lg },
});
