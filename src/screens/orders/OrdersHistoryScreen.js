import Placeholder from "../../components/Placeholder";
import { useOrders } from "../../context/OrdersContext";

// Temporary – the real history list comes in step 10.
export default function OrdersHistoryScreen({ navigation }) {
  const { orders } = useOrders();
  const latest = orders[0];
  return (
    <Placeholder
      title="My Orders"
      subtitle={`${orders.length} order(s) – full list in step 10`}
      links={latest ? [{ label: "Track latest order", onPress: () => navigation.navigate("OrderTracking", { orderId: latest.id }) }] : []}
    />
  );
}
