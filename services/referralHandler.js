// services/referralHandler.js

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { getReferralChain } from "./referralEngine.js";
import { distributeTSSARewards } from "./rewardEngine.js";

/**
 * 🔁 Fully handles referral registration logic:
 * - Builds and saves the upstream referral path
 * - Stores direct referral in REFERRALS
 * - Tracks direct_referrals count in USERS
 * - Writes hero_level to new user
 * - Distributes TSSA to the chain
 * - Adds 1.0 TSSA to the new user as signup reward
 */
export async function processReferral(referrerId, newUserId) {
  try {
    const refDoc = await getDoc(doc(db, "USERS", referrerId));
    if (!refDoc.exists()) {
      console.warn(`⚠️ Referrer ${referrerId} not found. Skipping rewards.`);
      return;
    }

    // 🔗 1. Build upstream referral path
    const referralPath = await getReferralChain(referrerId);

    // Ensure "hero_0" is included
    if (!referralPath.includes("hero_0")) {
      referralPath.push("hero_0");
    }

    const heroLevel = referralPath.length;

    // 🧾 2. Update new user's record with level + referrer
    const newUserRef = doc(db, "USERS", newUserId);
    await setDoc(
      newUserRef,
      {
        referred_by: referrerId,
        hero_level: heroLevel,
      },
      { merge: true }
    );

    // 📚 3. Save referral path to REFERRAL_PATHS
    await setDoc(doc(db, "REFERRAL_PATHS", newUserId), {
      upstream: referralPath,
    });

    // 🌱 4. Save direct referral
    await setDoc(
      doc(db, "REFERRALS", referrerId),
      { direct: arrayUnion(newUserId) },
      { merge: true }
    );

    // 📊 5. Increment referrer's direct count
    await updateDoc(doc(db, "USERS", referrerId), {
      direct_referrals: increment(1),
    });

    // 🪙 6. Distribute TSSA to the referral chain
    await distributeTSSARewards(referrerId, newUserId);

    // 🎁 7. Give the new user 1.0 TSSA as a welcome reward
    await updateDoc(newUserRef, {
      tssa_balance: increment(1.0),
    });

    console.log(`🌟 Referral processed for ${newUserId}`);
  } catch (error) {
    console.error("❌ Referral processing failed:", error);
    throw error;
  }
}
