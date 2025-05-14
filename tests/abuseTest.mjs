// tests/abuseTest.mjs

import { signUpHero } from "../services/authService.js";
import { buildReferralPath } from "../services/referralBuilder.js";
import { getReferralChain } from "../services/referralEngine.js";
import { distributeTSSARewards } from "../services/rewardEngine.js";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";

async function abuseVelocityAndRewardTest() {
  console.log("🚀 Starting full referral + reward + abuse test...");

  const primaryReferrer = "hero_1";
  const newHeroes = [];

  for (let i = 1; i <= 6; i++) {
    try {
      const email = `test${i}@tssa.com`;
      const password = "pass123";

      const referredBy = i === 1 ? "hero_0" : primaryReferrer;

      const user = await signUpHero(email, password, referredBy, true); // bypass = true
      console.log(`✅ Signup ${i} as ${user.uid}`);
      newHeroes.push({ id: user.uid, referredBy: user.referred_by });

      // 🔁 Build referral path
      await buildReferralPath(user.uid, user.referred_by);
    } catch (err) {
      console.error(`❌ Signup ${i} failed:`, err.message);
    }
  }

  // Simulate reward distribution for each new user
  for (const { id: newHeroId } of newHeroes) {
    try {
      const chain = await getReferralChain(newHeroId);
      console.log(`🔗 Referral Chain for ${newHeroId}:`, chain);

      const rewards = await distributeTSSARewards(chain, newHeroId);

      console.log(`🪙 Rewards distributed for ${newHeroId}:`, rewards);
    } catch (err) {
      console.error(`❌ Reward distribution failed for ${newHeroId}:`, err.message);
    }
  }

  // Final check: is hero_1 flagged?
  const referrerDoc = await getDoc(doc(db, "USERS", primaryReferrer));
  const flagged = referrerDoc.data()?.is_flagged;
  console.log(`🚩 hero_1 is_flagged: ${flagged}`);

  console.log("🏁 Abuse + reward test complete.");
}

abuseVelocityAndRewardTest();
