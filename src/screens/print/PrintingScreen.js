import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FormContainer from "../../components/FormContainer";
import TextField from "../../components/TextField";
import SegmentedControl from "../../components/SegmentedControl";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import { getStoreById, printPricing } from "../../data";
import { getStoreStatus } from "../../utils/time";
import { calcPrintPrice, validatePrintJob, formatPrice } from "../../utils/pricing";
import useAddToCart from "../../utils/useAddToCart";
import useNow from "../../utils/useNow";
import { colors, radius, spacing } from "../../theme/colors";
import { showAlert } from "../../utils/dialog";

// Simulated "upload": the user picks one of these files from a fake file browser.
const SAMPLE_FILES = [
  { name: "Lab Report – Physics.pdf", pages: 12 },
  { name: "Mobile Dev – Lecture 5.pdf", pages: 34 },
  { name: "Final Project Proposal.docx", pages: 8 },
  { name: "Accounting Exercises.pdf", pages: 20 },
  { name: "Thesis Draft v3.pdf", pages: 86 },
  { name: "Poster Abstract.pdf", pages: 1 },
];

const BINDING_OPTIONS = [
  { value: "none", label: "None", icon: "document-outline" },
  { value: "staple", label: "Staple", icon: "attach", note: `+${formatPrice(printPricing.binding.staple)}` },
  { value: "spiral", label: "Spiral", icon: "reorder-four", note: `+${formatPrice(printPricing.binding.spiral)}` },
];

const EMPTY_JOB = { name: "", pages: "", copies: "1", color: false, doubleSided: false, binding: "none" };

// Error for one field only (so each message appears under the right input).
function fieldErrors(job) {
  const errors = {};
  const p = Number(job.pages);
  const c = Number(job.copies);
  if (job.pages !== "" && (!Number.isInteger(p) || p <= 0)) errors.pages = "Pages must be greater than 0.";
  else if (p > printPricing.maxPages) errors.pages = `Maximum ${printPricing.maxPages} pages per order.`;
  if (job.copies !== "" && (!Number.isInteger(c) || c <= 0)) errors.copies = "Copies must be greater than 0.";
  else if (c > printPricing.maxCopies) errors.copies = `Maximum ${printPricing.maxCopies} copies.`;
  return errors;
}

export default function PrintingScreen({ navigation }) {
  const store = getStoreById("printing");
  const now = useNow();
  const status = getStoreStatus(store, now);
  const addToCart = useAddToCart();

  const [job, setJob] = useState(EMPTY_JOB);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const set = (field) => (value) => {
    setJob((j) => ({ ...j, [field]: value }));
    setSubmitError(null);
  };
  // Only digits allowed in the number fields.
  const setNumber = (field) => (text) => set(field)(text.replace(/[^0-9]/g, ""));

  const errors = fieldErrors(job);
  // Live price: recalculated on every render, i.e. every time an option changes.
  const price = calcPrintPrice(job);
  const pagePrice = (job.color ? printPricing.color : printPricing.bw) * (job.doubleSided ? 1 - printPricing.doubleSidedDiscount : 1);
  const sheets = job.doubleSided ? Math.ceil((Number(job.pages) || 0) / 2) : Number(job.pages) || 0;

  const pickFile = (file) => {
    setJob((j) => ({ ...j, name: file.name, pages: String(file.pages) }));
    setPickerOpen(false);
    setSubmitError(null);
  };

  const handleAdd = () => {
    const error = validatePrintJob(job);
    if (error) {
      setSubmitError(error);
      return;
    }
    const copies = Number(job.copies);
    addToCart(
      {
        type: "print",
        productId: "print-job",
        storeId: store.id,
        name: job.name.trim(),
        image: "🖨️",
        unitPrice: price.perCopy, // price of ONE copy; quantity = number of copies
        quantity: copies,
        size: null,
        extras: [],
        printJob: {
          name: job.name.trim(),
          pages: Number(job.pages),
          color: job.color,
          doubleSided: job.doubleSided,
          binding: job.binding,
        },
      },
      () => {
        setJob(EMPTY_JOB);
        showAlert("Added to cart", `${job.name.trim()} – ${copies} cop${copies > 1 ? "ies" : "y"}`, [
          { text: "Print another", style: "cancel" },
          { text: "View cart", onPress: () => navigation.navigate("CartTab", { screen: "Cart" }) },
        ]);
      }
    );
  };

  return (
    <View style={styles.container}>
      <FormContainer>
        {/* Store status */}
        <View style={styles.storeRow}>
          <View>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeMeta}>~{store.avgPrepMinutes} min preparation</Text>
          </View>
          <StatusBadge open={status.open} label={status.label} />
        </View>

        {/* Document (simulated upload) */}
        <Text style={styles.label}>Document</Text>
        <Pressable style={styles.fileBox} onPress={() => setPickerOpen(true)} accessibilityRole="button">
          <Ionicons
            name={job.name ? "document-attach" : "cloud-upload-outline"}
            size={28}
            color={colors.primary}
          />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {job.name || "Choose a document"}
            </Text>
            <Text style={styles.fileHint}>{job.name ? "Tap to change" : "PDF or Word (simulated upload)"}</Text>
          </View>
        </Pressable>

        <View style={styles.row}>
          <TextField
            style={styles.half}
            label="Pages"
            placeholder="e.g. 12"
            keyboardType="number-pad"
            value={job.pages}
            onChangeText={setNumber("pages")}
            error={errors.pages}
            hint={`Max ${printPricing.maxPages}`}
          />
          <TextField
            style={styles.half}
            label="Copies"
            placeholder="1"
            keyboardType="number-pad"
            value={job.copies}
            onChangeText={setNumber("copies")}
            error={errors.copies}
          />
        </View>

        <Text style={styles.label}>Color</Text>
        <SegmentedControl
          value={job.color}
          onChange={set("color")}
          options={[
            { value: false, label: "Black & White", icon: "contrast-outline", note: `${formatPrice(printPricing.bw)}/page` },
            { value: true, label: "Color", icon: "color-palette-outline", note: `${formatPrice(printPricing.color)}/page` },
          ]}
        />

        <Text style={styles.label}>Sides</Text>
        <SegmentedControl
          value={job.doubleSided}
          onChange={set("doubleSided")}
          options={[
            { value: false, label: "Single-sided", icon: "document-outline" },
            { value: true, label: "Double-sided", icon: "documents-outline", note: `−${printPricing.doubleSidedDiscount * 100}%` },
          ]}
        />

        <Text style={styles.label}>Binding (per copy)</Text>
        <SegmentedControl value={job.binding} onChange={set("binding")} options={BINDING_OPTIONS} />

        {/* Live price breakdown */}
        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>Price</Text>
          <PriceLine label="Price per page" value={formatPrice(pagePrice)} />
          <PriceLine label="Pages" value={`× ${Number(job.pages) || 0}`} />
          {job.doubleSided ? <PriceLine label="Paper sheets" value={`${sheets} sheets`} /> : null}
          <PriceLine label="Binding" value={formatPrice(printPricing.binding[job.binding])} />
          <PriceLine label="Price per copy" value={formatPrice(price.perCopy)} />
          <PriceLine label="Copies" value={`× ${Number(job.copies) || 0}`} />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(price.total)}</Text>
          </View>
        </View>

        {submitError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}
        {!status.open ? (
          <View style={styles.errorBanner}>
            <Ionicons name="moon-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>The Printing Office is closed – you cannot order now.</Text>
          </View>
        ) : null}

        <Button
          title={`Add to cart · ${formatPrice(price.total)}`}
          icon="cart"
          onPress={handleAdd}
          disabled={!status.open}
        />
      </FormContainer>

      {/* Fake file browser */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a document</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={10} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={SAMPLE_FILES}
              keyExtractor={(f) => f.name}
              renderItem={({ item }) => (
                <Pressable style={styles.fileRow} onPress={() => pickFile(item)}>
                  <Ionicons
                    name={item.name.endsWith(".pdf") ? "document-text" : "document"}
                    size={24}
                    color={item.name.endsWith(".pdf") ? colors.danger : colors.primary}
                  />
                  <Text style={styles.fileRowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.fileRowPages}>{item.pages} p.</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PriceLine({ label, value }) {
  return (
    <View style={styles.priceLine}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  storeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  storeName: { fontSize: 18, fontWeight: "800", color: colors.text },
  storeMeta: { color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  fileBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.lg,
  },
  fileInfo: { marginLeft: spacing.md, flex: 1 },
  fileName: { fontWeight: "700", color: colors.text, fontSize: 15 },
  fileHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
  priceCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginVertical: spacing.xl },
  priceTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  priceLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  priceLabel: { color: colors.textMuted },
  priceValue: { color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 18, fontWeight: "800", color: colors.text },
  totalValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, marginLeft: spacing.sm, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "70%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileRowName: { flex: 1, marginLeft: spacing.md, color: colors.text, fontSize: 15 },
  fileRowPages: { color: colors.textMuted },
});
