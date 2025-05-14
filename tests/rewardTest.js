// tests/rewardTest.js

import { signUpHero } from "../services/authService.js";
import { db } from "../firebaseConfig.js";
import { getDoc, doc } from "firebase/firestore";
import { updateLoginStreak, updateInviteStreak } from "../services/streakEngine.js";

const testEmails = [
  "test1@tssa.app",
  "test2@tssa.app",
  "test3@tssa.app",
  "test4@tssa.app"
];

const testPasswords = ["pass123", "pass234", "pass345", "pass456"];

async function runReferralTest() {
  console.log("🚀 Starting Referral Chain Test...");

  const heroIds = [];
  let referrer = "hero_0";

  for (let i = 0; i < testEmails.length; i++) {
    const email = testEmails[i];
    const password = testPasswords[i];

    const user = await signUpHero(email, password, referrer);
    heroIds.push(user.uid);
    referrer = user.uid;
  }

  // Simulate hero_0 reaching 65-day streaks manually
  await updateInviteStreak("hero_0");
  await updateLoginStreak("hero_0");

  // Show user states
  console.log("\n📊 Final State of Test Users:");
  for (const heroId of ["hero_0", ...heroIds]) {
    const snap = await getDoc(doc(db, "USERS", heroId));
    const data = snap.exists() ? snap.data() : {};
    const tssa = data.tssa_balance || 0;
    const invites = data.invite_streak || 0;
    const logins = data.login_streak || 0;
    console.log(`🧪 ${heroId.padEnd(8)} | 💰 TSSA: ${tssa} | 🔥 Invite Streak: ${invites} | 📅 Login Streak: ${logins}`);
  }

  // Test extra login for last hero
  const lastHero = heroIds.at(-1);
  await updateLoginStreak(lastHero);
  const updated = (await getDoc(doc(db, "USERS", lastHero))).data();
  console.log(`\n📅 Final Login Streak: ${lastHero} → ${updated.login_streak || 0} | 💰 TSSA: ${updated.tssa_balance}`);
  console.log("✅ Referral + Streak Test Complete.");
}

runReferralTest().catch(console.error);
