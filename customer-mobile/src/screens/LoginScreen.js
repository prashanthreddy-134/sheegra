import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function requestOtp() {
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/otp/request", { phone });
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.error || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/otp/verify", { phone, code });
      await login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logo}><Text style={styles.logoText}>F</Text></View>
      <Text style={styles.title}>{step === "phone" ? "Log in to Sheegra" : "Enter the code"}</Text>
      <Text style={styles.subtitle}>{step === "phone" ? "We'll text you a one-time code." : `Sent to ${phone}`}</Text>

      {step === "phone" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="+91 98xxxxxxxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={requestOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#F7F8F3" /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={[styles.input, styles.mono]}
            placeholder="6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={verifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#F7F8F3" /> : <Text style={styles.buttonText}>Verify & continue</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep("phone")}>
            <Text style={styles.link}>Change number</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8F3", padding: 24, justifyContent: "center" },
  logo: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#1B7A43", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoText: { color: "#F7F8F3", fontWeight: "800", fontSize: 20 },
  title: { fontWeight: "800", fontSize: 22, color: "#182419", marginBottom: 4 },
  subtitle: { color: "#18241999", marginBottom: 20 },
  input: { backgroundColor: "white", borderWidth: 1, borderColor: "#18241926", borderRadius: 14, padding: 14, marginBottom: 12 },
  mono: { letterSpacing: 4 },
  button: { backgroundColor: "#1B7A43", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#F7F8F3", fontWeight: "700" },
  link: { color: "#18241980", textAlign: "center", marginTop: 12 },
  error: { color: "#dc2626", marginBottom: 8 },
});
