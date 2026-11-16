import Placeholder from "../../components/Placeholder";

export default function WelcomeScreen({ navigation }) {
  return (
    <Placeholder
      title="CampusGo"
      subtitle="Antonine campus delivery – your order, in your classroom, before the break ends."
      links={[
        { label: "Log in", onPress: () => navigation.navigate("Login") },
        { label: "Sign up", onPress: () => navigation.navigate("SignUp") },
      ]}
    />
  );
}
