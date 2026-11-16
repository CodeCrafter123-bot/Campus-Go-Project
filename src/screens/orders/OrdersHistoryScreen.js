import Placeholder from "../../components/Placeholder";

export default function OrdersHistoryScreen({ navigation }) {
  return (
    <Placeholder
      title="My Orders"
      links={[{ label: "Track an order", onPress: () => navigation.navigate("OrderTracking", { orderId: "demo" }) }]}
    />
  );
}
