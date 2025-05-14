import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc // 👈 this was missing
} from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { updateInviteStreak } from "./streakEngine.js";
import { getReferralChain } from "./referralEngine.js";
import { distributeTSSARewards } from "./rewardEngine.js";

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

// 🛡️ Checks if email is already registered
const isEmailAlreadyUsed = async (email) => {
  const usersRef = collection(db, "USERS");
  const q = query(usersRef, where("email", "==", email.trim().toLowerCase()));
  const snap = await getDocs(q);
  return !snap.empty;
};

// 🧾 Signup with full referral logic + invite streak + email duplication protection
export const signUpHero = async (email, password, referrerId = "hero_0") => {
  const cleanedEmail = email.trim().toLowerCase();

  // ⛔ Prevent duplicate emails
  const exists = await isEmailAlreadyUsed(cleanedEmail);
  if (exists) {
    throw new Error("🚫 This email is already registered.");
  }

  const uid = await getNextHeroId();
  const user = {
    uid,
    email: cleanedEmail,
    password,
    referred_by: referrerId,
    created_at: new Date(),
  };

  // 🧱 1. Create user document
  await setDoc(doc(db, "USERS", uid), user);
  console.log("✅ Hero created:", user);

  // 💰 2. Reward new user with signup TSSA
  await updateDoc(doc(db, "USERS", uid), {
    tssa_balance: 1.0,
  });

  // ❗ 3. If referrer is not self
  if (referrerId !== uid) {
    // 🔗 Build and save full referral path
    const parentPath = await getReferralChain(referrerId);
    const all = [referrerId, ...parentPath];
    const upstream = [...new Set(all)];
    
    await setDoc(doc(db, "REFERRAL_PATHS", uid), { upstream });

    // 🪙 Distribute TSSA up the chain
    await distributeTSSARewards(upstream, uid);

    // 🔥 Reward inviter's streak
    await updateInviteStreak(referrerId);
  }

  return user;
};
