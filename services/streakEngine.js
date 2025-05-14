// services/streakEngine.js

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { getTodayDate } from "../utils/dateUtils.js";
import { increment } from "firebase/firestore";

/**
 * 🔢 Reverse-decay TSSA reward calculator based on streak day.
 */
export function calculateStreakReward(day) {
  if (day === 65) return 0; // 🛑 Milestone handled separately
  if (day <= 10) return day * 1e-7;
  if (day <= 19) return (day - 10) * 1e-6;
  if (day <= 28) return (day - 19) * 1e-5;
  if (day <= 37) return (day - 28) * 1e-4;
  if (day <= 46) return (day - 37) * 1e-3;
  if (day <= 55) return (day - 46) * 1e-2;
  if (day <= 64) return (day - 55) * 1e-1;
  return 0; // After 65, no regular reward
}

/**
 * 🔁 Updates streak logic for invite or login streaks.
 * - Increments or resets streak
 * - Applies TSSA reward based on streak day
 * - Adds 1.0 TSSA bonus when reaching day 65 (once)
 */
export async function updateStreak(heroId, type = "invite") {
  const userRef = doc(db, "USERS", heroId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const today = getTodayDate();
  const yesterday = getTodayDate(-1);

  const streakKey = `${type}_streak`;
  const dateKey = `last_${type}_date`;
  const bonusKey = `${type}_bonus_awarded`;

  const lastDate = userData[dateKey];
  const prevStreak = userData[streakKey] || 0;
  const bonusGiven = userData[bonusKey] || false;

  // Already logged today
  if (lastDate === today) return;

  const newStreak = (lastDate === yesterday) ? prevStreak + 1 : 1;
  let reward = calculateStreakReward(newStreak);
  const updates = {
    [streakKey]: newStreak,
    [dateKey]: today,
  };

  // 🎁 Bonus: grant 1.0 TSSA if reaching streak 65 for first time
  if (newStreak === 65 && !bonusGiven) {
    reward += 1.0;
    updates[bonusKey] = true;
  }

  updates.tssa_balance = (userData.tssa_balance || 0) + reward;

  await updateDoc(userRef, updates);
  console.log(`✅ ${type} streak updated for ${heroId}: +${reward} TSSA`);
}

// Wrappers
export const updateInviteStreak = (heroId) => updateStreak(heroId, "invite");
export const updateLoginStreak = (heroId) => updateStreak(heroId, "login");
