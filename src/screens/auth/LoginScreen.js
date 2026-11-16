import Placeholder from "../../components/Placeholder";

export default function LoginScreen({ navigation }) {
  return (
    <Placeholder
      title="Login"
      subtitle="Login form comes in step 4"
      links={[{ label: "Continue (temporary)", onPress: () => navigation.replace("Main") }]}
    />
  );
}
