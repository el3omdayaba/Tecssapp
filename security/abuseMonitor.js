// security/abuseMonitor.js

import { db } from "../firebaseConfig.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Logs referral activity and checks if a user is abusing the system.
 * If abuse is detected, the user is flagged in USERS collection.
 * 
 * @param {string} referrerId - The hero_x who referred the new user
 */
export const logReferralActivity = async (referrerId) => {
  const ref = doc(db, "REFERRAL_ACTIVITY", referrerId);
  const userRef = doc(db, "USERS", referrerId);

  const now = new Date();
  const currentHour = now.toISOString().slice(0, 13); // "2025-05-10T22"
  const currentDay = now.toISOString().slice(0, 10);  // "2025-05-10"

  const activityDoc = await getDoc(ref);

  if (!activityDoc.exists()) {
    // First time referral log
    await setDoc(ref, {
      referrer_id: referrerId,
      hourly: { [currentHour]: 1 },
      daily: { [currentDay]: 1 },
      last_updated: serverTimestamp(),
    });
    return;
  }

  const data = activityDoc.data();

  const hourlyCount = (data.hourly?.[currentHour] || 0) + 1;
  const dailyCount = (data.daily?.[currentDay] || 0) + 1;

  const updatePayload = {
    [`hourly.${currentHour}`]: increment(1),
    [`daily.${currentDay}`]: increment(1),
    last_updated: serverTimestamp(),
  };

  await updateDoc(ref, updatePayload);

  if (hourlyCount > 3 || dailyCount > 10) {
    console.warn(`🚨 ABUSE WARNING: ${referrerId} triggered velocity limits`);
    await updateDoc(userRef, { is_flagged: true });
  }
};
