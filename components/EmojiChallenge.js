// components/EmojiChallenge.js

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const EMOJI_SETS = [
  { emojis: ["🐶", "🐶", "🐱", "🐶"], answer: 2 },
  { emojis: ["🍎", "🍌", "🍌", "🍌"], answer: 0 },
  { emojis: ["🚗", "🚗", "🚀", "🚗"], answer: 2 },
  { emojis: ["🎩", "👒", "🎩", "🎩"], answer: 1 },
  { emojis: ["🐸", "🐸", "🐸", "🦎"], answer: 3 },
];

export default function EmojiChallenge({ onSuccess }) {
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Pick a random challenge
    const random = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
    setChallenge(random);
  }, []);

  const handleAnswer = (index) => {
    if (index === challenge.answer) {
      setError(null);
      onSuccess(true);
    } else {
      setError("❌ Try again. That’s not the odd one out.");
    }
  };

  if (!challenge) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 Hero Gate Challenge</Text>
      <Text style={styles.subtitle}>Tap the odd one out:</Text>
      <View style={styles.emojiRow}>
        {challenge.emojis.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emojiButton}
            onPress={() => handleAnswer(index)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 10 },
  emojiRow: { flexDirection: "row", gap: 10 },
  emojiButton: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 12,
  },
  emoji: { fontSize: 28 },
  error: { color: "red", marginTop: 8 },
});
