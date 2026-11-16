import Placeholder from "../../components/Placeholder";

export default function CartScreen({ navigation }) {
  return (
    <Placeholder
      title="Cart"
      links={[{ label: "Checkout", onPress: () => navigation.navigate("Checkout") }]}
    />
  );
}
