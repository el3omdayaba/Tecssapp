// tests/finalHero0ChainTest.js
// ✅ Automated test to verify hero_0 referral logic and rewards

import { signUpHero } from "../services/authService.js";
import { processReferral } from "../services/referralHandler.js";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";

async function runTest() {
  console.log("🚀 Starting hero_0 referral chain test...");

  const emails = ["t1@t.com", "t2@t.com", "t3@t.com", "t4@t.com", "t5@t.com"];
  const heroes = [];

  // Sign up first user under hero_0
  const first = await signUpHero(emails[0], "11111", "hero_0");
  await processReferral(first.referred_by, first.uid);
  heroes.push(first.uid);

  // Sign up 4 more, chained
  for (let i = 1; i < emails.length; i++) {
    const prev = heroes[i - 1];
    const user = await signUpHero(emails[i], "11111", prev);
    await processReferral(user.referred_by, user.uid);
    heroes.push(user.uid);
  }

  console.log("✅ Chain created:", heroes.join(" -> "));

  // Check balances and levels
  for (const uid of heroes) {
    const snap = await getDoc(doc(db, "USERS", uid));
    const user = snap.exists() ? snap.data() : null;
    if (!user) {
      console.error(`❌ Missing user: ${uid}`);
      continue;
    }
    console.log(`👤 ${uid} | balance: ${user.tssa_balance || 0} | level: ${user.hero_level || "?"}`);
  }

  // Check founder
  const founderSnap = await getDoc(doc(db, "USERS", "hero_0"));
  if (founderSnap.exists()) {
    const founder = founderSnap.data();
    console.log(`🏛️ hero_0 balance: ${founder.tssa_balance} | referrals: ${founder.direct_referrals}`);
  } else {
    console.warn("⚠️ hero_0 not found");
  }

  console.log("✅ Final check complete.");
}

runTest();
