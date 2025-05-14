import { signUpHero } from "../services/authService.js";
import { getDoc, doc, deleteDoc, updateDoc } from "firebase/firestore"; // ✅ FIXED: added updateDoc here
import { db } from "../firebaseConfig.js";
import { updateLoginStreak, updateStreak } from "../services/streakEngine.js";

const PASSWORD = "TssaTest!123";

const structure = {
  hero_0: ["hero_1", "hero_2", "hero_3"],
  hero_1: ["hero_4", "hero_5"],
  hero_2: ["hero_6", "hero_7"],
  hero_3: ["hero_8", "hero_9"]
};

const allHeroIds = Object.keys(structure).concat(...Object.values(structure));

/**
 * 🧼 Clean previous test users (excluding hero_0)
 */
async function cleanTestUsers() {
  console.log("🧹 Cleaning previous test data...");

  const toDelete = allHeroIds.filter(id => id !== "hero_0");
  for (const id of toDelete) {
    await Promise.all([
      deleteDoc(doc(db, "USERS", id)),
      deleteDoc(doc(db, "REFERRAL_PATHS", id)),
      deleteDoc(doc(db, "REFERRALS", id)),
      deleteDoc(doc(db, "REWARDS", `hero_0_${id}`)),
    ]);
  }

  console.log("✅ Cleanup complete.\n");
}

/**
 * 🎯 Simulate a 65-day streak and trigger reward
 */
async function simulate65DayStreak(heroId, type = "invite") {
  const streakKey = `${type}_streak`;
  const dateKey = `last_${type}_date`;

  await updateDoc(doc(db, "USERS", heroId), {
    [streakKey]: 64,
    [dateKey]: "2025-05-13"
  });

  await updateStreak(heroId, type); // triggers +1.0 TSSA at 65
  console.log(`🎯 Simulated 65-day ${type} streak for ${heroId}`);
}

/**
 * 🧪 Run referral tree and streak simulation
 */
async function runMegaTest() {
  console.log("🚀 Creating smart branching referral test...\n");

  const founderSnap = await getDoc(doc(db, "USERS", "hero_0"));
  if (!founderSnap.exists()) {
    throw new Error("❗ hero_0 not found. Run `node scripts/createFounder.js` first.");
  }

  // 🧱 Build referral structure
  for (const parent in structure) {
    for (const child of structure[parent]) {
      const email = `${child}@tssa.app`;
      await signUpHero(email, PASSWORD, parent);
    }
  }

  // 🧪 Simulate max streaks for hero_0
  await simulate65DayStreak("hero_0", "invite");
  await simulate65DayStreak("hero_0", "login");

  // 📊 Show balances
  console.log("\n📊 Final Balances:");
  for (const heroId of allHeroIds) {
    const snap = await getDoc(doc(db, "USERS", heroId));
    const data = snap.exists() ? snap.data() : {};
    const tssa = data.tssa_balance || 0;
    const invites = data.invite_streak || 0;
    const logins = data.login_streak || 0;
    console.log(`🧪 ${heroId.padEnd(8)} | 💰 TSSA: ${tssa.toFixed(7)} | 🔥 Invite Streak: ${invites} | 📅 Login Streak: ${logins}`);
  }

  // 🎯 Extra login streak to validate live trigger
  const lastHero = "hero_9";
  await updateLoginStreak(lastHero);
  const finalSnap = await getDoc(doc(db, "USERS", lastHero));
  const final = finalSnap.data();

  console.log(`\n📅 Extra Login Streak: ${lastHero} → ${final.login_streak || 0} | TSSA: ${final.tssa_balance}`);
  console.log("\n✅ Mega Referral Tree Test Complete.");
}

// 🚀 Run it
const main = async () => {
  await cleanTestUsers();
  await runMegaTest();
};

main().catch(console.error);
