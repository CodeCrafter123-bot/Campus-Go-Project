import Placeholder from "../../components/Placeholder";

export default function HomeScreen({ navigation }) {
  return (
    <Placeholder
      title="Campus Stores"
      links={[{ label: "Open a store", onPress: () => navigation.navigate("StoreMenu", { storeId: "cafeteria" }) }]}
    />
  );
}
