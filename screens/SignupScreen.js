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
import EmojiChallenge from "../components/EmojiChallenge";

export default function SignupScreen({ initialReferralCode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [captchaPassed, setCaptchaPassed] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async () => {
    if (!captchaPassed) {
      Alert.alert("Human Check Required", "Please complete the Hero Challenge.");
      return;
    }

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim();
    const finalReferrer = referralCode.trim() || initialReferralCode || null;

    if (cleanedEmail.length < 4 || cleanedPassword.length < 4) {
      Alert.alert("Missing Fields", "Email and password must be at least 4 characters.");
      return;
    }

    if (!isValidEmail(cleanedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      const user = await signUpHero(cleanedEmail, cleanedPassword, finalReferrer);

      // Only run referral logic if there *was* a referrer
      if (user.referred_by) {
        await processReferral(user.referred_by, user.uid);
      }

      Alert.alert("Signup Successful", user.email);
    } catch (error) {
      console.error("🚨 Signup error:", error.message);
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

        <EmojiChallenge onSuccess={(passed) => setCaptchaPassed(passed)} />

        <Button title="Sign Up" onPress={handleSignup} disabled={!captchaPassed} />
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
