// ✅ mockAuthService.js

import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebaseConfig.js";

let heroCounter = 1;

export const signUpHero = async (email, password, referrerId = null) => {
  const uid = `hero_${heroCounter++}`;

  // Build referral_path from parent
  let referralPath = [];
  if (referrerId) {
    const refDoc = await getDoc(doc(db, "USERS", referrerId));
    if (refDoc.exists()) {
      const refData = refDoc.data();
      referralPath = [...(refData.referral_path || []), referrerId];
    }
  }

  const user = {
    uid,
    email,
    password,
    referred_by: referrerId,
    referral_path: referralPath,
    tssa_balance: 0,
    created_at: new Date(),
  };

  await setDoc(doc(db, "USERS", uid), user);

  // ✅ Give 1.0 TSSA to new user
  await updateDoc(doc(db, "USERS", uid), {
    tssa_balance: increment(1.0),
  });

  console.log("[Mock Signup] Hero created:", user);
  return user;
};
