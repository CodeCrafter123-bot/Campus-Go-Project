import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";

export default function App() {
  const [name, setName] = useState("");
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Text style={styles.title}>My First Mobile App 🚀</Text>

      <Text style={styles.subtitle}>
        Running on my iPhone!
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Text style={styles.greeting}>
        Hello, {name.trim() || "Hussein"} 👋
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Counter</Text>
        <Text style={styles.count}>{count}</Text>

        <View style={styles.row}>
          <Pressable
            style={styles.button}
            onPress={() => setCount((previous) => previous - 1)}
          >
            <Text style={styles.buttonText}>−</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() => setCount((previous) => previous + 1)}
          >
            <Text style={styles.buttonText}>+</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.resetButton}
          onPress={() => setCount(0)}
        >
          <Text style={styles.resetText}>Reset counter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#64748b",
    marginTop: 10,
    marginBottom: 28,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#0f172a",
  },
  greeting: {
    fontSize: 21,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 24,
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    color: "#64748b",
  },
  count: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#2563eb",
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    gap: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    width: 72,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  resetButton: {
    marginTop: 20,
    padding: 10,
  },
  resetText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
  },
});