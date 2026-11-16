import Placeholder from "../../components/Placeholder";

export default function OrderTrackingScreen({ route }) {
  return <Placeholder title="Order Tracking" subtitle={`orderId: ${route.params?.orderId}`} />;
}
