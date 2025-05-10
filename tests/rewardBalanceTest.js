//rewardBalanceTest.js

import { signUpHero } from "../services/mockAuthService.js";
import { processReferral } from "../services/referralHandler.js";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";

async function printBalance(heroId) {
  const snap = await getDoc(doc(db, "USERS", heroId));
  const data = snap.exists() ? snap.data() : {};
  const balance = data.tssa_balance || 0;
  console.log(`${heroId} balance: ${Number(balance).toFixed(2)}`);
}

export async function runTest() {
  console.log("\u{1F680} Running TSSA balance test");

  const chain = [];
  let referrer = "hero_0";

  for (let i = 1; i <= 7; i++) {
    const hero = await signUpHero(`test${i}@t.com`, "123", referrer);
    chain.push(hero.uid);
    await processReferral(hero.referred_by, hero.uid);
    referrer = hero.uid;
  }

  for (const heroId of chain) {
    await printBalance(heroId);
  }
  await printBalance("hero_0");
}

runTest().catch(console.error);
