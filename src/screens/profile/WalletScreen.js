import { useState } from "react";
import { View, Text, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import { useWallet } from "../../context/WalletContext";
import { formatPrice } from "../../utils/pricing";
import { formatDateTime } from "../../utils/format";
import { colors, radius, spacing } from "../../theme/colors";
import { showAlert } from "../../utils/dialog";

const QUICK_AMOUNTS = [5, 10, 20, 50];

const TX_STYLE = {
  topup: { icon: "add-circle", color: colors.success },
  refund: { icon: "arrow-undo-circle", color: colors.success },
  payment: { icon: "remove-circle", color: colors.danger },
};

export default function WalletScreen() {
  const { balance, transactions, topUp } = useWallet();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Allow digits and one decimal point, max 2 decimals.
  const onChangeAmount = (text) => {
    const clean = text.replace(",", ".").replace(/[^0-9.]/g, "");
    if (/^\d*\.?\d{0,2}$/.test(clean)) {
      setAmount(clean);
      setError(null);
    }
  };

  const handleTopUp = () => {
    const value = Number(amount);
    // Validate first, then ask for confirmation of the simulated card payment.
    if (!(value > 0)) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (value > 500) {
      setError("Maximum top-up is $500.");
      return;
    }
    showAlert("Simulated payment", `Charge ${formatPrice(value)} to your card ending in 4242?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pay",
        onPress: async () => {
          setSaving(true);
          const result = await topUp(value); // POST /api/wallet/topup
          setSaving(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          setAmount("");
          showAlert("Top-up successful", `${formatPrice(value)} was added to your wallet.`);
        },
      },
    ]);
  };

  const header = (
    <View>
      <View style={styles.balanceCard}>
        <Ionicons name="wallet" size={32} color={colors.white} />
        <Text style={styles.balanceLabel}>Current balance</Text>
        <Text style={styles.balance}>{formatPrice(balance)}</Text>
      </View>

      <View style={styles.topUpCard}>
        <Text style={styles.sectionTitle}>Top up</Text>
        <View style={styles.chips}>
          {QUICK_AMOUNTS.map((a) => (
            <Chip
              key={a}
              label={`$${a}`}
              selected={Number(amount) === a}
              onPress={() => {
                setAmount(String(a));
                setError(null);
              }}
            />
          ))}
        </View>
        <TextField
          placeholder="Other amount"
          icon="cash-outline"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={onChangeAmount}
          error={error}
          hint="Maximum $500 per top-up (simulated card payment)"
          style={styles.amountField}
        />
        <Button title={`Top up ${amount ? formatPrice(Number(amount)) : ""}`} icon="add-circle-outline" onPress={handleTopUp} loading={saving} />
      </View>

      <Text style={styles.sectionTitle}>Transactions</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={transactions}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No transactions yet" />}
        renderItem={({ item }) => {
          const style = TX_STYLE[item.type];
          return (
            <View style={styles.txRow}>
              <Ionicons name={style.icon} size={30} color={style.color} />
              <View style={styles.txInfo}>
                <Text style={styles.txDescription}>{item.description}</Text>
                <Text style={styles.txDate}>{formatDateTime(item.date)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: style.color }]}>
                {item.amount > 0 ? "+" : "−"}
                {formatPrice(Math.abs(item.amount))}
              </Text>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  balanceLabel: { color: colors.primaryLight, marginTop: spacing.sm },
  balance: { color: colors.white, fontSize: 40, fontWeight: "800", marginTop: spacing.xs },
  topUpCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginVertical: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  amountField: { marginTop: spacing.sm },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  txInfo: { flex: 1, marginLeft: spacing.md },
  txDescription: { fontWeight: "700", color: colors.text },
  txDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: "800" },
});
