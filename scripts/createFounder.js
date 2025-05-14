// scripts/createFounder.js

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createHero0() {
  const founder = {
    uid: "hero_0",
    email: "founder@tecssapp.com",
    password: "root",
    referred_by: null,
    tssa_balance: 0,
    invite_streak: 0,
    last_invite_date: "",
    created_at: new Date().toISOString(),
  };

  // 🧾 USERS/hero_0
  await setDoc(doc(db, "USERS", "hero_0"), founder);
  console.log("✅ hero_0 created in USERS collection");

  // 🌱 REFERRAL_PATHS/hero_0
  await setDoc(doc(db, "REFERRAL_PATHS", "hero_0"), {
    upstream: ["hero_0"]
  });
  console.log("✅ hero_0 created in REFERRAL_PATHS collection");
}

createHero0().catch(console.error);
