// services/rewardEngine.js

import { db } from "../firebaseConfig.js";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { calculateTSSAReward } from "./rewardMath.js";

/**
 * Distributes TSSA rewards only to users in the same branch (referral_path).
 * Also guarantees hero_0 gets +1 TSSA.
 */
export async function distributeTSSARewards(referralChain, newUserId) {
  const rewards = [];

  // ✅ Get new user's referral_path
  const newUserSnap = await getDoc(doc(db, "USERS", newUserId));
  if (!newUserSnap.exists()) {
    console.error(`❌ New user ${newUserId} not found`);
    return;
  }

  const { referral_path = [] } = newUserSnap.data();

  // 🔍 DEBUG LOGGING
  console.log("➡️ New User:", newUserId);
  console.log("📜 Referral Path:", referral_path);
  console.log("🔗 Referral Chain:", referralChain);

  // ✅ Loop over referralChain and reward same-branch users
  for (let i = 0; i < referralChain.length; i++) {
    const heroId = referralChain[i];

    if (!referral_path.includes(heroId)) {
      console.log(`⛔ Skipping ${heroId} — not in same branch`);
      continue;
    }

    const level = i + 1;
    const amount = heroId === "hero_0" ? 1.0 : calculateTSSAReward(level);

    const reward = {
      heroId,
      amount,
      source: newUserId,
      level,
      timestamp: serverTimestamp(),
    };

    await setDoc(doc(db, "REWARDS", `${heroId}_${newUserId}`), reward);
    await updateDoc(doc(db, "USERS", heroId), {
      tssa_balance: increment(amount),
    });

    rewards.push(reward);
  }

  // ✅ Ensure founder always gets 1.0 TSSA
  if (!referral_path.includes("hero_0")) {
    const founderReward = {
      heroId: "hero_0",
      amount: 1.0,
      source: newUserId,
      level: 0,
      timestamp: serverTimestamp(),
    };

    await setDoc(doc(db, "REWARDS", `hero_0_${newUserId}`), founderReward);
    await updateDoc(doc(db, "USERS", "hero_0"), {
      tssa_balance: increment(1.0),
    });

    rewards.push(founderReward);
  }

  console.log("🪙 Rewards written to Firestore:", rewards);
}
