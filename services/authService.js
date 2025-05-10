// services/authService.js

import { getFirestore, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

let heroCounter = 1; // 🔢 Simple mock counter for hero IDs

/**
 * Simulates hero sign up and writes to USERS collection.
 * @param {string} email
 * @param {string} password
 * @param {string} referrerId (e.g. "hero_0")
 * @returns user object with uid, email, password, referrer, timestamp
 */
export const signUpHero = async (email, password, referrerId = "hero_0") => {
  const uid = `hero_${heroCounter++}`;
  const user = {
    uid,
    email,
    password,
    referred_by: referrerId,
    created_at: new Date(),
  };

  await setDoc(doc(db, "USERS", uid), user);

  console.log("[Mock Signup] Hero created:", user);
  return user;
};
