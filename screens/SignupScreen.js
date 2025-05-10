// screens/SignupScreen.js

import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { signUpHero } from "../services/authService";
import { processReferral } from "../services/referralHandler";

export default function SignupScreen({ initialReferralCode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const handleSignup = async () => {
    try {
      const finalReferrer = referralCode.trim() || initialReferralCode || "hero_0";
      const user = await signUpHero(email, password, finalReferrer);

      Alert.alert("Signup Successful", user.email);
      await processReferral(user.referred_by, user.uid);
    } catch (error) {
      Alert.alert("Signup Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Enter your password"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          style={styles.input}
        />

        <Text style={styles.label}>Referral Code (Optional)</Text>
        <TextInput
          placeholder="hero_x (or leave blank)"
          onChangeText={setReferralCode}
          value={referralCode}
          autoCapitalize="none"
          style={styles.input}
        />

        <Button title="Sign Up" onPress={handleSignup} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#000",
  },
  label: {
    marginBottom: 5,
    fontWeight: "bold",
    color: "#000",
  },
});
