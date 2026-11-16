import Placeholder from "../../components/Placeholder";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { formatPrice } from "../../utils/pricing";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  return (
    <Placeholder
      title={user.fullName}
      subtitle={`${user.email}\nWallet: ${formatPrice(balance)}`}
      links={[
        { label: "Wallet", onPress: () => navigation.navigate("Wallet") },
        { label: "Log out", onPress: logout },
      ]}
    />
  );
}
