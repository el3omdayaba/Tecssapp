// services/referralBuilder.js

import { db } from "../firebaseConfig.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

/**
 * Recursively builds the referral path for a new hero
 * and stores it in REFERRAL_PATHS and REFERRALS collections.
 * 
 * @param {string} newHeroId - ID of the newly signed-up hero
 * @param {string} referredBy - ID of the hero who referred them
 */
export const buildReferralPath = async (newHeroId, referredBy) => {
  const upstream = [];

  let current = referredBy;
  while (current && current !== "hero_0") {
    const docSnap = await getDoc(doc(db, "REFERRAL_PATHS", current));
    if (docSnap.exists()) {
      const data = docSnap.data();
      upstream.push(current, ...(data.upstream || []));
      break;
    } else {
      upstream.push(current);
      const userSnap = await getDoc(doc(db, "USERS", current));
      current = userSnap.exists() ? userSnap.data().referred_by : null;
    }
  }

  // Always include hero_0 at the root
  if (!upstream.includes("hero_0")) {
    upstream.push("hero_0");
  }

  // Save upstream path
  await setDoc(doc(db, "REFERRAL_PATHS", newHeroId), {
    hero_id: newHeroId,
    upstream,
  });

  // Update REFERRALS (direct children of referredBy)
  await setDoc(
    doc(db, "REFERRALS", referredBy),
    { direct: arrayUnion(newHeroId) },
    { merge: true }
  );

  console.log(`🌿 Referral path created for ${newHeroId}:`, upstream);
};
