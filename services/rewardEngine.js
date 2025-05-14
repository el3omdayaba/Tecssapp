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
 * Distributes TSSA rewards only to users in the same branch (validated via REFERRAL_PATHS).
 * Optionally gives hero_0 a fixed 1.0 TSSA per referral, if hero_0 exists.
 */
export async function distributeTSSARewards(referralChain, newUserId) {
  const rewards = [];

  const pathSnap = await getDoc(doc(db, "REFERRAL_PATHS", newUserId));
  const referralPath = pathSnap.exists() ? pathSnap.data().upstream || [] : [];

  console.log("➡️ New User:", newUserId);
  console.log("📜 Referral Path:", referralPath);
  console.log("🔗 Referral Chain:", referralChain);

  if (!referralPath.length) {
    console.warn(`🚫 No referralPath for ${newUserId} — rewards may be skipped`);
  }

  for (let i = 0; i < referralChain.length; i++) {
    const heroId = referralChain[i];

    if (!referralPath.includes(heroId)) {
      console.log(`⛔ Skipping ${heroId} — not in same branch`);
      continue;
    }

    const level = i + 1;
    const amount = calculateTSSAReward(level);

    if (amount <= 0) {
      console.warn(`⚠️ Skipping reward for ${heroId} at level ${level} — invalid amount: ${amount}`);
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

    console.log(`✅ ${heroId} rewarded ${amount} TSSA from ${newUserId} at level ${level}`);
    rewards.push(reward);
  }

  // ✅ Optional: Reward hero_0 if he exists
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

    console.log(`🏛️ Founder (hero_0) rewarded 1.0 TSSA from ${newUserId}`);
    rewards.push(founderReward);
  } else {
    console.log("ℹ️ Skipped founder reward — hero_0 does not exist");
  }

  console.log("🪙 Final Rewards written to Firestore:", rewards);
}
