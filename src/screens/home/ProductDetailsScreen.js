import Placeholder from "../../components/Placeholder";

export default function ProductDetailsScreen({ route }) {
  return <Placeholder title="Product Details" subtitle={`productId: ${route.params?.productId}`} />;
}
