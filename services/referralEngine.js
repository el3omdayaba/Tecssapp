// services/referralEngine.js

import { db } from "../firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

/**
 * Recursively builds the referral chain starting from the given referrerId.
 * Returns an array of IDs [closestReferrer, ..., hero_0] — ordered from near to far.
 */
export async function getReferralChain(startingReferrerId) {
  const chain = [];
  let currentId = startingReferrerId;

  while (currentId && currentId !== "hero_0") {
    chain.push(currentId);

    const snapshot = await getDoc(doc(db, "USERS", currentId));
    if (!snapshot.exists()) {
      console.warn(`⚠️ Referrer not found: ${currentId}`);
      break;
    }

    currentId = snapshot.data().referred_by;
  }

  // Always include hero_0 if we reached them
  if (currentId === "hero_0") {
    chain.push("hero_0");
  }

  return chain;
}
