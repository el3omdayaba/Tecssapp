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
    referral_path: [],
    tssa_balance: 0,
    created_at: new Date().toISOString(),
  };

  await setDoc(doc(db, "USERS", "hero_0"), founder);
  console.log("✅ hero_0 created in USERS collection");
}

createHero0().catch(console.error);
