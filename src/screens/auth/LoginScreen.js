import { Alert } from "react-native";
import Placeholder from "../../components/Placeholder";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const loginDemo = async () => {
    const { error } = await login("demo@ua.edu.lb", "campus123");
    if (error) Alert.alert("Login failed", error);
  };

  return (
    <Placeholder
      title="Login"
      subtitle="Real login form comes in step 4"
      links={[{ label: "Log in as demo student", onPress: loginDemo }]}
    />
  );
}
