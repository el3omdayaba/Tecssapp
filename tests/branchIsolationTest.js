// tests/branchIsolationTest.js

import { signUpHero } from "../services/mockAuthService.js";
import { processReferral } from "../services/referralHandler.js";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";

async function printBalance(heroId) {
  const snap = await getDoc(doc(db, "USERS", heroId));
  const data = snap.exists() ? snap.data() : {};
  console.log(`${heroId} balance: ${data.tssa_balance || 0}`);
}

async function runBranchIsolationTest() {
  console.log("🚀 Running Branch Isolation Test");

  // Branch A
  const hero1 = await signUpHero("a1@t.com", "123", "hero_0");
  await processReferral(hero1.referred_by, hero1.uid);

  const hero2 = await signUpHero("a2@t.com", "123", hero1.uid);
  await processReferral(hero2.referred_by, hero2.uid);

  const hero3 = await signUpHero("a3@t.com", "123", hero2.uid);
  await processReferral(hero3.referred_by, hero3.uid);

  // Branch B
  const hero4 = await signUpHero("b1@t.com", "123", "hero_0");
  await processReferral(hero4.referred_by, hero4.uid);

  const hero5 = await signUpHero("b2@t.com", "123", hero4.uid);
  await processReferral(hero5.referred_by, hero5.uid);

  const hero6 = await signUpHero("b3@t.com", "123", hero5.uid);
  await processReferral(hero6.referred_by, hero6.uid);

  const hero7 = await signUpHero("b4@t.com", "123", hero6.uid);
  await processReferral(hero7.referred_by, hero7.uid);

  const ids = [
    hero1.uid, hero2.uid, hero3.uid,
    hero4.uid, hero5.uid, hero6.uid, hero7.uid, "hero_0"
  ];

  console.log("\n💰 Final Balances:");
  for (const id of ids) await printBalance(id);
}

runBranchIsolationTest().catch(console.error);
