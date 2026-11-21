import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { loadJSON } from "../../utils/storage";
import { computeStats } from "../../utils/adminStats";
import { formatPrice } from "../../utils/pricing";
import { colors, radius, spacing } from "../../theme/colors";

const CHART_HEIGHT = 90;

export default function Dashboard() {
  const { adminUsers } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const lists = await Promise.all(adminUsers.map((u) => loadJSON(`user:${u.id}:orders`, [])));
    setOrders(lists.flat());
    setLoading(false);
  }, [adminUsers]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  const stats = useMemo(() => computeStats(orders, adminUsers), [orders, adminUsers]);
  const maxCount = Math.max(1, ...stats.week.map((d) => d.count));
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Overview</Text>
        <Button title="Refresh" variant="ghost" icon="refresh-outline" onPress={load} loading={loading} style={styles.refresh} />
      </View>

      <Text style={styles.sectionLabel}>Users</Text>
      <View style={styles.grid}>
        <Kpi label="Total users" value={stats.totalUsers} />
        <Kpi label="Active" value={stats.activeUsers} />
        <Kpi label="Frozen" value={stats.frozenUsers} />
        <Kpi label="Admins" value={stats.admins} />
      </View>
      <Text style={[styles.sectionLabel, styles.sectionGap]}>Sales</Text>
      <View style={styles.grid}>
        <Kpi label="Sales today" value={formatPrice(stats.salesToday)} />
        <Kpi label="Orders today" value={stats.ordersToday} />
        <Kpi label="Total sales" value={formatPrice(stats.totalSales)} />
        <Kpi label="New users (7 days)" value={stats.newUsers} />
      </View>
      <Text style={styles.hint}>
        {stats.totalOrders} orders in total · {stats.cancelled} cancelled (not counted in sales)
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Orders – last 7 days</Text>
        <View style={styles.chart}>
          {stats.week.map((d, i) => (
            <View key={i} style={styles.barCol}>
              <Text style={styles.barCount}>{d.count}</Text>
              <View style={[styles.bar, { height: d.count > 0 ? Math.max(4, (d.count / maxCount) * CHART_HEIGHT) : 2 }]} />
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top products</Text>
        {stats.topProducts.length === 0 ? (
          <Text style={styles.empty}>No orders yet.</Text>
        ) : (
          stats.topProducts.map((p, i) => <Row key={p.name} rank={i + 1} name={p.name} value={`${p.quantity} sold`} />)
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Most active stores</Text>
        {stats.topStores.length === 0 ? (
          <Text style={styles.empty}>No orders yet.</Text>
        ) : (
          stats.topStores.map((s, i) => (
            <Row key={s.name} rank={i + 1} name={s.name} value={`${s.orders} orders · ${formatPrice(s.sales)}`} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Kpi({ label, value }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Row({ rank, name, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: "800", color: colors.text },
  refresh: { minHeight: 36, paddingHorizontal: spacing.md },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.sm },
  sectionGap: { marginTop: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  kpi: { width: "48.5%", backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md },
  kpiValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  kpiLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: CHART_HEIGHT + 40 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: 18, borderRadius: 4, backgroundColor: colors.primary },
  barCount: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  barLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  rank: { width: 22, fontWeight: "800", color: colors.primary },
  rowName: { flex: 1, color: colors.text, fontWeight: "600" },
  rowValue: { color: colors.textMuted, fontSize: 13, marginLeft: spacing.sm },
  empty: { color: colors.textMuted },
});
