// utils/streakSimulator.js

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { updateStreak } from "../services/streakEngine.js";

/**
 * 🎯 Simulate a 65-day streak and force reward trigger
 * Works for both "invite" and "login" types.
 */
export async function simulate65DayStreak(heroId, type = "invite") {
  const streakKey = `${type}_streak`;
  const dateKey = `last_${type}_date`;

  // 1. Manually set the streak state to simulate 65 days
  await updateDoc(doc(db, "USERS", heroId), {
    [streakKey]: 64,
    [dateKey]: "2025-05-13"  // fake "yesterday"
  });

  // 2. Call updateStreak to push it to 65 and reward
  await updateStreak(heroId, type);

  console.log(`🎯 Simulated + triggered 65-day ${type} streak for ${heroId}`);
}
