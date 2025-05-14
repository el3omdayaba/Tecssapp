// services/referralEngine.js

import { db } from "../firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

/**
 * 📚 Returns the upstream referral chain for a given hero.
 * Ordered: closest referrer → up to "hero_0".
 *
 * @param {string} heroId - Hero ID of the user (e.g. "hero_27")
 * @returns {string[]} - Array of ancestor hero IDs, including "hero_0"
 */
export async function getReferralChain(heroId) {
  try {
    const snapshot = await getDoc(doc(db, "REFERRAL_PATHS", heroId));
    if (!snapshot.exists()) {
      console.warn(`⚠️ No referral path found for ${heroId}`);
      return [];
    }

    const { upstream } = snapshot.data();

    if (!Array.isArray(upstream)) {
      console.warn(`⚠️ referralPath malformed for ${heroId}`);
      return [];
    }

    return upstream;
  } catch (error) {
    console.error("❌ Failed to fetch referral chain:", error);
    return [];
  }
}
