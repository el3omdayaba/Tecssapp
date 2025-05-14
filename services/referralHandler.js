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
 * Handles referral logic:
 * - builds referral path manually (ends in hero_0)
 * - stores path in REFERRAL_PATHS
 * - stores direct referrals in REFERRALS
 * - tracks direct_referrals in USERS
 * - adds hero_level to new user
 * - distributes TSSA rewards
 * - gives 1 TSSA signup reward to new user
 */
export async function processReferral(referrerId, newUserId) {
  try {
    const refDoc = await getDoc(doc(db, "USERS", referrerId));
    if (!refDoc.exists()) {
      console.warn(`⚠️ Referrer ${referrerId} not found. Skipping rewards.`);
      return;
    }

    const referralPath = [];
    let currentId = referrerId;

    while (currentId) {
      referralPath.push(currentId);
      const snap = await getDoc(doc(db, "USERS", currentId));
      if (!snap.exists()) break;

      const next = snap.data().referred_by;
      if (!next || referralPath.includes(next)) break; // prevent cycles
      currentId = next;
    }

    // ✅ Ensure hero_0 is at the end (root)
    if (!referralPath.includes("hero_0")) {
      referralPath.push("hero_0");
    }

    const heroLevel = referralPath.length;
    const newUserDoc = doc(db, "USERS", newUserId);

    await setDoc(
      newUserDoc,
      {
        hero_id: newUserId,
        referred_by: referrerId,
        hero_level: heroLevel,
      },
      { merge: true }
    );

    await setDoc(doc(db, "REFERRAL_PATHS", newUserId), {
      upstream: referralPath,
    });

    await setDoc(
      doc(db, "REFERRALS", referrerId),
      {
        direct: arrayUnion(newUserId),
      },
      { merge: true }
    );

    await updateDoc(doc(db, "USERS", referrerId), {
      direct_referrals: increment(1),
    });

    await distributeTSSARewards(referralPath, newUserId);

    await updateDoc(newUserDoc, {
      tssa_balance: increment(1.0),
    });
  } catch (error) {
    console.error("❌ Referral processing failed:", error);
    throw error;
  }
}
