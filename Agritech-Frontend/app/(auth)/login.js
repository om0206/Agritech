import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { loginUser } from "../../services/api";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      console.log("Login successful:", res);
      router.replace({
        pathname: "/(tabs)/profile",
        params: { 
          farmer: JSON.stringify(res.farmer),
          token: res.token
        }
      });
    } catch (error) {
      console.log("Login error:", error);
      alert("Login failed: Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />

      {/* Register Button */}
      <Text
        style={styles.register}
        onPress={() => router.push("/signup")}
      >
        Don't have an account? Register
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  register: {
    marginTop: 20,
    textAlign: "center",
    color: "blue",
  },
});