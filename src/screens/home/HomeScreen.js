import { useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StoreCard from "../../components/StoreCard";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { stores, products, deliverySlots, settings, STORE_CATEGORIES } from "../../data";
import { getStoreStatus, getNextAvailableSlot, slotLabel } from "../../utils/time";
import { formatPrice } from "../../utils/pricing";
import useNow from "../../utils/useNow";
import { colors, radius, spacing } from "../../theme/colors";

// A store matches the search if its name, category, description or one of its products matches.
function matchesSearch(store, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (`${store.name} ${store.category} ${store.description}`.toLowerCase().includes(q)) return true;
  return products.some((p) => p.storeId === store.id && p.name.toLowerCase().includes(q));
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { balance } = useWallet();
  const now = useNow(); // re-renders every 30 s so badges stay live
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  // Stores with their live status; open stores first.
  const storesWithStatus = useMemo(
    () =>
      stores
        .map((store) => ({ store, status: getStoreStatus(store, now) }))
        .sort((a, b) => Number(b.status.open) - Number(a.status.open)),
    [now]
  );

  const visibleStores = storesWithStatus.filter(
    ({ store }) => (category === "All" || store.category === category) && matchesSearch(store, query.trim())
  );

  // Next slot that the fastest open store can still make.
  const nextSlot = useMemo(() => {
    const openStores = storesWithStatus.filter((s) => s.status.open).map((s) => s.store);
    if (openStores.length === 0) return null;
    const fastestPrep = Math.min(...openStores.map((s) => s.avgPrepMinutes));
    return getNextAvailableSlot(deliverySlots, {
      prepMinutes: fastestPrep,
      bufferMinutes: settings.deliveryBufferMinutes,
      date: now,
    });
  }, [storesWithStatus, now]);

  const firstName = user?.fullName.split(" ")[0];

  const header = (
    <View>
      <Text style={styles.greeting}>Hi {firstName} 👋</Text>
      <Text style={styles.subGreeting}>What do you need before your next class?</Text>

      {/* Banner: next delivery slot + wallet balance */}
      <View style={styles.banner}>
        <View style={styles.bannerItem}>
          <Ionicons name="time-outline" size={22} color={colors.white} />
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerLabel}>Next delivery slot</Text>
            <Text style={styles.bannerValue}>{nextSlot ? slotLabel(nextSlot) : "None left today"}</Text>
          </View>
        </View>
        <View style={styles.bannerDivider} />
        <Pressable
          style={styles.bannerItem}
          onPress={() => navigation.navigate("ProfileTab", { screen: "Wallet" })}
          accessibilityRole="button"
          accessibilityLabel="Open wallet"
        >
          <Ionicons name="wallet-outline" size={22} color={colors.white} />
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerLabel}>Wallet</Text>
            <Text style={styles.bannerValue}>{formatPrice(balance)}</Text>
          </View>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stores or products (e.g. latte)"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={STORE_CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Chip label={item} selected={category === item} onPress={() => setCategory(item)} />
        )}
        style={styles.chips}
      />

      <Text style={styles.sectionTitle}>Campus stores</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={visibleStores}
      keyExtractor={(item) => item.store.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <StoreCard
          store={item.store}
          status={item.status}
          onPress={() => navigation.navigate("StoreMenu", { storeId: item.store.id })}
        />
      )}
      ListEmptyComponent={
        <EmptyState title="No stores found" message="Try another search or category." />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  greeting: { fontSize: 24, fontWeight: "800", color: colors.text },
  subGreeting: { color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg },
  banner: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bannerItem: { flex: 1, flexDirection: "row", alignItems: "center" },
  bannerTextBox: { marginLeft: spacing.sm },
  bannerLabel: { color: colors.primaryLight, fontSize: 12 },
  bannerValue: { color: colors.white, fontSize: 16, fontWeight: "800", marginTop: 2 },
  bannerDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: spacing.md },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, marginLeft: spacing.sm, fontSize: 15, color: colors.text },
  chips: { marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
});
