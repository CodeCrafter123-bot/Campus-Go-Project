import Placeholder from "../../components/Placeholder";

export default function ProfileScreen({ navigation }) {
  return (
    <Placeholder
      title="Profile"
      links={[
        { label: "Wallet", onPress: () => navigation.navigate("Wallet") },
        { label: "Log out (temporary)", onPress: () => navigation.getParent()?.getParent()?.replace("Welcome") },
      ]}
    />
  );
}
