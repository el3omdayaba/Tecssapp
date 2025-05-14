import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";
import { processReferral } from "../services/referralHandler.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const NUM_HEROES = 40;
const SIGNUP_REWARD = 1.0;
const FOUNDER_ID = "hero_0";

// --- Reward Decay ---
function calculateTSSAReward(level) {
  if (level < 1) return 0;
  if (level <= 10) return Math.max(1.0 - (level - 1) * 0.1, 1e-7);
  if (level <= 20) return Math.max(0.1 - (level - 10) * 0.01, 1e-7);
  if (level <= 30) return Math.max(0.01 - (level - 20) * 0.001, 1e-7);
  if (level <= 40) return Math.max(0.001 - (level - 30) * 0.0001, 1e-7);
  return 1e-7;
}

// --- Helpers ---
async function getBalance(heroId) {
  const snap = await getDoc(doc(db, "USERS", heroId));
  return snap.exists() ? snap.data().tssa_balance : null;
}

function printTree(referralMap) {
  const tree = {};

  // Build tree object
  for (const [child, parent] of Object.entries(referralMap)) {
    if (!tree[parent]) tree[parent] = [];
    tree[parent].push(child);
  }

  // Recursive printer
  function printNode(node, indent = "") {
    console.log(indent + node);
    const children = tree[node] || [];
    for (const child of children) {
      printNode(child, indent + "  ");
    }
  }

  console.log("\n🌳 Referral Tree:");
  printNode(FOUNDER_ID);
}

// --- MAIN TEST ---
async function runLongReferralTest() {
  console.log(`🧪 Running deep referral test with ${NUM_HEROES} users...`);

  const referralMap = { [FOUNDER_ID]: null };
  const expectedBalances = { [FOUNDER_ID]: 0 };

  // Step 1: Create founder
  await setDoc(doc(db, "USERS", FOUNDER_ID), {
    hero_id: FOUNDER_ID,
    referred_by: null,
    referral_path: [],
    hero_level: 0,
    tssa_balance: 0,
    created_at: Date.now(),
  });

  // Step 2: Register users with random referrers
  for (let i = 1; i < NUM_HEROES; i++) {
    const newId = `hero_${i}`;
    const referrerPool = Object.keys(referralMap);
    const referrer = referrerPool[Math.floor(Math.random() * referrerPool.length)];

    referralMap[newId] = referrer;
    expectedBalances[newId] = SIGNUP_REWARD; // signup reward

    // Track upline rewards
    const chain = [];
    let cursor = referrer;
    while (cursor) {
      chain.push(cursor);
      cursor = referralMap[cursor];
    }

    chain.forEach((uplineId, index) => {
      const level = index + 1;
      const reward = calculateTSSAReward(level);
      if (!expectedBalances[uplineId]) expectedBalances[uplineId] = 0;
      expectedBalances[uplineId] += reward;
    });

    expectedBalances[FOUNDER_ID] += 1.0; // founder bonus

    await processReferral(referrer, newId);
    await new Promise((res) => setTimeout(res, 150)); // Avoid ECONNRESET
  }

  // Step 3: Verify and print results
  console.log("\n📊 Final TSSA Balances Check:");
  let allCorrect = true;
  for (const heroId of Object.keys(expectedBalances)) {
    const expected = Number(expectedBalances[heroId].toFixed(7));
    const actual = Number((await getBalance(heroId))?.toFixed(7));

    const correct = actual === expected;
    console.log(`${correct ? "✅" : "❌"} ${heroId.padEnd(8)} → ${actual} TSSA (expected ${expected})`);
    if (!correct) allCorrect = false;
  }

  // Step 4: Print the tree
  printTree(referralMap);

  if (allCorrect) {
    console.log(`\n✅ All ${NUM_HEROES} balances correct! 🎉`);
  } else {
    console.log(`\n❌ Discrepancy found in balances. Please review.`);
  }
}

runLongReferralTest();
