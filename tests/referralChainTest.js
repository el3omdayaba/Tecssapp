import { signUpHero } from "../services/mockAuthService.js";
import { getReferralChain, distributeTSSARewards } from "../services/referralEngine.js";
import { db } from "../firebaseConfig.js";



// Utility to make a random email
function getRandomEmail(n) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let name = "";
  for (let i = 0; i < n; i++) name += chars[Math.floor(Math.random() * chars.length)];
  return `${name}@test.com`;
}

// Simulate creating a referral chain
async function runReferralTest() {
  console.log("🚀 Starting referral chain test");

  const chainLength = 5;
  let currentReferrerId = "hero_0";

  for (let i = 1; i <= chainLength; i++) {
    const email = getRandomEmail(6);
    const password = "test123";

    console.log(`\n➡️ Signing up hero_${i} with referrer: ${currentReferrerId}`);

    const user = await signUpHero(email, password, currentReferrerId);

    const referralChain = await getReferralChain(user.referred_by);
    console.log("🔗 Referral chain:", referralChain);

    await distributeTSSARewards(referralChain, user.uid);
    console.log("✅ Rewards distributed for:", user.uid);

    currentReferrerId = user.uid;
  }

  console.log("✅ Test finished!");
}

runReferralTest().catch(console.error);
