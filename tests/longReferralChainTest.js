import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";
import { processReferral } from "../services/referralHandler.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const NUM_HEROES = 40;

// Utility to simulate a clean Firestore write
async function createBaseHero(id) {
  await setDoc(doc(db, "USERS", id), {
    hero_id: id,
    referred_by: null,
    referral_path: [],
    hero_level: 0,
    tssa_balance: 0,
    created_at: Date.now(),
  });
}

// Utility to get balance from Firestore
async function getBalance(id) {
  const snap = await getDoc(doc(db, "USERS", id));
  return snap.exists() ? snap.data().tssa_balance : null;
}

async function runLongReferralTest() {
  console.log(`🧪 Starting test for ${NUM_HEROES} heroes`);

  // STEP 1: Create founder (hero_0)
  await createBaseHero("hero_0");

  // STEP 2: Sign up 39 more users with randomized referral logic
  const referralMap = { hero_0: null };
  for (let i = 1; i < NUM_HEROES; i++) {
    const newId = `hero_${i}`;
    const referrerPool = Object.keys(referralMap);
    const referrer = referrerPool[Math.floor(Math.random() * referrerPool.length)];

    referralMap[newId] = referrer;
    await processReferral(referrer, newId);
  }

  // STEP 3: Evaluate results
  let totalTssa = 0;
  for (let i = 0; i < NUM_HEROES; i++) {
    const id = `hero_${i}`;
    const balance = await getBalance(id);
    totalTssa += balance ?? 0;
    console.log(`👤 ${id.padEnd(8)} → TSSA: ${balance}`);
  }

  console.log(`\n🏁 Total distributed TSSA: ${totalTssa.toFixed(5)}`);
}

runLongReferralTest();
