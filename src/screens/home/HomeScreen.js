import Placeholder from "../../components/Placeholder";
import { useCart } from "../../context/CartContext";
import { getProductById } from "../../data";

export default function HomeScreen({ navigation }) {
  const { addItem, itemCount, clearCart } = useCart();
  const espresso = getProductById("cof-1");

  const addTestItem = () =>
    addItem({
      type: "product",
      productId: espresso.id,
      storeId: espresso.storeId,
      name: espresso.name,
      image: espresso.image,
      unitPrice: espresso.price,
      quantity: 1,
      size: null,
      extras: [],
    });

  return (
    <Placeholder
      title="Campus Stores"
      subtitle={`Items in cart: ${itemCount} (close and reopen the app – it stays saved)`}
      links={[
        { label: "Open a store", onPress: () => navigation.navigate("StoreMenu", { storeId: "cafeteria" }) },
        { label: "Add test espresso to cart", onPress: addTestItem },
        { label: "Clear cart", onPress: clearCart },
      ]}
    />
  );
}
