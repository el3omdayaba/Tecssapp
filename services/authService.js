// services/authService.js

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// 🔢 Firestore-based persistent hero ID generator
const getNextHeroId = async () => {
  const counterRef = doc(db, "SYSTEM", "heroCounter");
  const counterSnap = await getDoc(counterRef);

  let current = 1;
  if (counterSnap.exists()) {
    current = counterSnap.data().count || 1;
  }

  await setDoc(counterRef, { count: current + 1 });
  return `hero_${current}`;
};

// 🧾 Signup now accepts hero_0 or any valid referrer
export const signUpHero = async (email, password, referrerId = "hero_0") => {
  const uid = await getNextHeroId();
  const user = {
    uid,
    email,
    password,
    referred_by: referrerId,
    created_at: new Date(),
  };

  await setDoc(doc(db, "USERS", uid), user);
  console.log("✅ Hero created:", user);
  return user;
};
