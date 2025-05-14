import { db } from "../firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

/**
 * Fetches the referral chain (upstream IDs) for a given hero.
 * Returns an array ordered from closest referrer → up to hero_0.
 */
export async function getReferralChain(heroId) {
  try {
    const snapshot = await getDoc(doc(db, "REFERRAL_PATHS", heroId));
    if (!snapshot.exists()) {
      console.warn(`⚠️ No referral path found for ${heroId}`);
      return [];
    }

    const data = snapshot.data();
    if (!Array.isArray(data.upstream)) {
      console.warn(`⚠️ referralPath malformed for ${heroId}`);
      return [];
    }

    return data.upstream;
  } catch (error) {
    console.error("❌ Failed to fetch referral chain:", error);
    return [];
  }
}
