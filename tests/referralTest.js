// tests/referralTest.js

import { signUpHero } from "../services/mockAuthService.js";
import { getReferralChain, distributeTSSARewards } from "../services/referralEngine.js";
import { getFirestore } from "firebase/firestore";
import app from "../firebaseConfig.js"; // ✅ Use the already-safe initialized app

const db = getFirestore(app); // 🔐 optional (if needed later)

// Utility to make a random email
function getRandomEmail(n) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let name = "";
  for (let i = 0; i < n; i++) name += chars[Math.floor(Math.random() * chars.length)];
  return `${name}@test.com`;
}

// Simulate creating a referral chain
async function runReferralTest() {
  console.log("🚀 Starting referral test");

  const chainLength = 5;
  let currentReferralCode = "hero_0";

  for (let i = 1; i <= chainLength; i++) {
    const email = getRandomEmail(6);
    const password = "test123";

    console.log(`\n➡️ Signing up hero_${i} with referral code: ${currentReferralCode}`);

    const user = await signUpHero(email, password, currentReferralCode);

    const referralChain = await getReferralChain(currentReferralCode);
    const rewards = distributeTSSARewards(referralChain);

    console.log("🪙 Rewards issued:");
    console.log(rewards);

    currentReferralCode = user.uid;
  }

  console.log("✅ Test finished!");
}

runReferralTest().catch(console.error);

