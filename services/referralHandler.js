// services/referralHandler.js

import { doc, getDoc } from "firebase/firestore"; // ✅ Add this line
import { db } from "../firebaseConfig.js";
import { getReferralChain } from "./referralEngine.js";
import { distributeTSSARewards } from "./rewardEngine.js";

/**
 * Handles referral logic:
 * - fetches referral chain
 * - verifies it's in the same branch
 * - distributes rewards
 */
export async function processReferral(referrerId, newUserId) {
  try {
    // Optional: verify referrer exists
    const refDoc = await getDoc(doc(db, "USERS", referrerId));
    if (!refDoc.exists()) {
      console.warn(`⚠️ Referrer ${referrerId} not found. Skipping rewards.`);
      return;
    }

    const referralChain = await getReferralChain(referrerId);
    await distributeTSSARewards(referralChain, newUserId);
  } catch (error) {
    console.error("❌ Referral processing failed:", error);
    throw error;
  }
}
