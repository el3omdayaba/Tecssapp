import { db } from "../firebaseConfig.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { processReferral } from "../services/referralHandler.js";

const USERS = 40;
const createdUsers = [];

async function getTotalReferralCount(userId, referralMap) {
  const direct = referralMap[userId] || [];
  let total = direct.length;
  for (const childId of direct) {
    total += await getTotalReferralCount(childId, referralMap);
  }
  return total;
}

async function updateTotalReferrals() {
  console.log("\n🔄 Updating total_referrals...");
  const referralSnapshot = await getDocs(collection(db, "REFERRALS"));
  const referralMap = {};
  referralSnapshot.forEach(docSnap => {
    const { direct = [] } = docSnap.data();
    referralMap[docSnap.id] = direct.map(e => typeof e === "string" ? e : e.id);
  });

  const userSnapshot = await getDocs(collection(db, "USERS"));
  for (const docSnap of userSnapshot.docs) {
    const userId = docSnap.id;
    const total = await getTotalReferralCount(userId, referralMap);
    await updateDoc(doc(db, "USERS", userId), { total_referrals: total });
  }
  console.log("✅ Total referrals updated.\n");
}

async function runFinalPhase1Test() {
  console.log("🧪 Running Final Phase 1 Test with 40 users...");

  // 1. Create referral tree
  await processReferral("hero_0", "hero_1");
  createdUsers.push("hero_1");

  for (let i = 2; i <= USERS; i++) {
    const newUser = `hero_${i}`;
    const referrer = `hero_${Math.floor((i - 1) / 2)}`;
    await processReferral(referrer, newUser);
    createdUsers.push(newUser);
  }

  // 2. Update total_referrals
  await updateTotalReferrals();

  // 3. Validate hero_0 balance
  const founderDoc = await getDoc(doc(db, "USERS", "hero_0"));
  const founderBalance = founderDoc.exists() ? founderDoc.data().tssa_balance : 0;
  const expectedFounder = createdUsers.length;
  console.log(`🏛️  hero_0 balance: ${founderBalance} TSSA`);
  console.log(founderBalance === expectedFounder ? "✅ hero_0 validated" : `❌ Expected ${expectedFounder} but got ${founderBalance}`);

  // 4. USERS Summary
  const userSnap = await getDocs(collection(db, "USERS"));
  console.log("\n📊 USERS Summary (hero_id | level | direct | total | balance):");
  const userDataList = [];

  for (const docSnap of userSnap.docs) {
    const data = docSnap.data();
    const id = data.hero_id || docSnap.id;
    const level = data.hero_level || 0;
    const direct = data.direct_referrals || 0;
    const total = data.total_referrals || 0;
    const balance = data.tssa_balance || 0;
    userDataList.push({ id, level, direct, total, balance });
    console.log(`${id.padEnd(10)} | lvl ${level} | dir ${direct} | tot ${total} | 💰 ${balance}`);
  }

  // 5. REFERRALS
  const referralsSnap = await getDocs(collection(db, "REFERRALS"));
  console.log("\n📂 REFERRALS:");
  referralsSnap.forEach(docSnap => {
    const { direct = [] } = docSnap.data();
    const ids = direct.map(e => typeof e === "string" ? e : e.id);
    console.log(`${docSnap.id}: ${ids.length} direct →`, ids.join(", "));
  });

  // 6. REFERRAL_PATHS
  const pathsSnap = await getDocs(collection(db, "REFERRAL_PATHS"));
  console.log("\n📂 REFERRAL_PATHS:");
  pathsSnap.forEach(docSnap => {
    const { upstream = [] } = docSnap.data();
    console.log(`${docSnap.id}: ↑ ${upstream.join(" → ")}`);
  });

  // 7. REWARDS Summary
  const rewardsSnap = await getDocs(collection(db, "REWARDS"));
  console.log(`\n🪙 REWARDS (${rewardsSnap.size} total):`);
  const rewardMap = {};
  rewardsSnap.forEach(docSnap => {
    const data = docSnap.data();
    const to = data.heroId;
    rewardMap[to] = (rewardMap[to] || 0) + data.amount;
  });

  Object.entries(rewardMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([id, amt]) => {
      console.log(`${id.padEnd(10)} → ${amt.toFixed(5)} TSSA`);
    });

  // 8. Leaderboard
  console.log("\n🏆 TSSA Leaderboard (Top 10):");
  userDataList
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10)
    .forEach((u, i) => {
      console.log(`#${i + 1} ${u.id.padEnd(10)} → 💰 ${u.balance.toFixed(5)} TSSA`);
    });

  console.log("\n🏁 Final Phase 1 Test Completed.");
}

runFinalPhase1Test().catch(console.error);
