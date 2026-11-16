import Placeholder from "../../components/Placeholder";

export default function StoreMenuScreen({ navigation, route }) {
  return (
    <Placeholder
      title="Store Menu"
      subtitle={`storeId: ${route.params?.storeId}`}
      links={[{ label: "Open a product", onPress: () => navigation.navigate("ProductDetails", { productId: "p1" }) }]}
    />
  );
}
