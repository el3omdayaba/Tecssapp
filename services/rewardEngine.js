// services/rewardEngine.js

import { db } from "../firebaseConfig.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { calculateTSSAReward } from "./rewardMath.js";

/**
 * 🪙 Distributes TSSA to each eligible user in the referral chain,
 * if they exist in the same branch (validated via REFERRAL_PATHS).
 * Ensures hero_0 is always rewarded once.
 *
 * @param {string[]} referralChain - Ordered upstream list (closest → top)
 * @param {string} newUserId - The ID of the newly signed-up hero
 */
export async function distributeTSSARewards(referralChain, newUserId) {
  const rewards = [];

  const pathSnap = await getDoc(doc(db, "REFERRAL_PATHS", newUserId));
  const referralPath = pathSnap.exists() ? pathSnap.data().upstream || [] : [];

  if (!referralPath.length) {
    console.warn(`🚫 No referral path for ${newUserId}. Skipping all rewards.`);
    return;
  }

  console.log("➡️ New User:", newUserId);
  console.log("📜 Path:", referralPath);
  console.log("🔗 Chain:", referralChain);

  let founderRewarded = false;

  for (let i = 0; i < referralChain.length; i++) {
    const heroId = referralChain[i];

    if (!referralPath.includes(heroId)) {
      console.log(`⛔ Skipping ${heroId} — not in same referral branch`);
      continue;
    }

    const level = i + 1;
    const amount = heroId === "hero_0" ? 1.0 : calculateTSSAReward(level);

    if (amount <= 0) {
      console.warn(`⚠️ Skipping reward for ${heroId} at level ${level} — invalid amount`);
      continue;
    }

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

    console.log(`✅ ${heroId} received ${amount} TSSA from ${newUserId} (Level ${level})`);
    rewards.push(reward);

    if (heroId === "hero_0") {
      founderRewarded = true;
    }
  }

  // 🏛️ Ensure founder always gets 1.0 if not already rewarded in loop
  if (!founderRewarded && !referralChain.includes("hero_0")) {
    const founderRef = doc(db, "USERS", "hero_0");
    const founderSnap = await getDoc(founderRef);

    if (founderSnap.exists()) {
      const founderReward = {
        heroId: "hero_0",
        amount: 1.0,
        source: newUserId,
        level: referralChain.length + 1,
        timestamp: serverTimestamp(),
      };

      await setDoc(doc(db, "REWARDS", `hero_0_${newUserId}`), founderReward);
      await updateDoc(founderRef, {
        tssa_balance: increment(1.0),
      });

      console.log(`🏛️ Founder (hero_0) rewarded 1.0 TSSA separately`);
      rewards.push(founderReward);
    } else {
      console.warn("⚠️ Founder (hero_0) not found in Firestore");
    }
  }

  console.log("🪙 Rewards Finalized:", rewards);
}
