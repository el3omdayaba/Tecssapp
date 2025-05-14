import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";
import { processReferral } from "../services/referralHandler.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createHero(id, referredBy = null, balance = 0) {
  const path = referredBy ? [`${referredBy}`] : [];
  await setDoc(doc(db, "USERS", id), {
    hero_id: id,
    referred_by: referredBy,
    referral_path: path,
    hero_level: path.length,
    tssa_balance: balance,
    created_at: Date.now(),
  });
}

async function getBalance(id) {
  const snap = await getDoc(doc(db, "USERS", id));
  return snap.exists() ? snap.data().tssa_balance : null;
}

async function runHeroLevelTest() {
  console.log("🧪 Running multi-level hero test...");

  // Reset chain
  await createHero("hero_0");
  await processReferral("hero_0", "hero_1");
  await processReferral("hero_1", "hero_2");
  await processReferral("hero_2", "hero_3");

  // Expected final balances
  const expected = {
    hero_0: 3.0, // reward from hero_1, hero_2, hero_3
    hero_1: 2.9, // reward from hero_2, hero_3
    hero_2: 2.0, // reward from hero_3
    hero_3: 1.0, // signup bonus
  };

  const actual = {};
  for (const id of Object.keys(expected)) {
    actual[id] = await getBalance(id);
  }

  // Report
  for (const id in expected) {
    const correct = actual[id] === expected[id];
    console.log(`${correct ? "✅" : "❌"} ${id}: ${actual[id]} TSSA ${correct ? "" : `(expected ${expected[id]})`}`);
  }

  console.log("🏁 Test complete.\n");
}

runHeroLevelTest();
