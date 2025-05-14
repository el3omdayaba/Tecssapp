import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";
import { processReferral } from "../services/referralHandler.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const NUM_HEROES = 20;

function calculateTSSAReward(level) {
  if (level <= 10) return Math.max(1.0 - (level - 1) * 0.1, 1e-7);
  if (level <= 20) return Math.max(0.1 - (level - 10) * 0.01, 1e-7);
  if (level <= 30) return Math.max(0.01 - (level - 20) * 0.001, 1e-7);
  return 1e-7;
}

async function getUser(heroId) {
  const snap = await getDoc(doc(db, "USERS", heroId));
  return snap.exists() ? snap.data() : null;
}

async function getReferrals(heroId) {
  const snap = await getDoc(doc(db, "REFERRALS", heroId));
  return snap.exists() ? snap.data().direct || [] : [];
}

async function getReferralPath(heroId) {
  const snap = await getDoc(doc(db, "REFERRAL_PATHS", heroId));
  return snap.exists() ? snap.data().upstream || [] : [];
}

function printTree(referralMap) {
  const tree = {};
  for (const [child, parent] of Object.entries(referralMap)) {
    if (!tree[parent]) tree[parent] = [];
    tree[parent].push(child);
  }

  function printNode(node, indent = "") {
    console.log(indent + node);
    for (const child of tree[node] || []) {
      printNode(child, indent + "  ");
    }
  }

  console.log("\n🌳 Referral Tree:");
  printNode("hero_0");
}

async function runFullReferralTest() {
  console.log(`🧪 Starting full referral system test (${NUM_HEROES} heroes)...`);

  // Cleanup
  const usersSnap = await getDocs(collection(db, "USERS"));
  const referralsSnap = await getDocs(collection(db, "REFERRALS"));
  const pathsSnap = await getDocs(collection(db, "REFERRAL_PATHS"));

  for (const docSnap of [...usersSnap.docs, ...referralsSnap.docs, ...pathsSnap.docs]) {
    await deleteDoc(docSnap.ref);
  }

  const referralMap = { hero_0: null };
  const expectedBalances = { hero_0: 0 };

  // Create founder
  await setDoc(doc(db, "USERS", "hero_0"), {
    hero_id: "hero_0",
    referred_by: null,
    hero_level: 0,
    tssa_balance: 0,
    created_at: Date.now(),
  });

  // Create referral chain
  for (let i = 1; i < NUM_HEROES; i++) {
    const newId = `hero_${i}`;
    const referrerList = Object.keys(referralMap);
    const referrer = referrerList[Math.floor(Math.random() * referrerList.length)];

    referralMap[newId] = referrer;
    expectedBalances[newId] = 1.0;

    const path = [];
    let walker = referrer;
    while (walker) {
      path.push(walker);
      walker = referralMap[walker];
    }

    path.forEach((upline, index) => {
      const reward = calculateTSSAReward(index + 1);
      if (!expectedBalances[upline]) expectedBalances[upline] = 0;
      expectedBalances[upline] += reward;
    });

    expectedBalances["hero_0"] += 1.0;

    await processReferral(referrer, newId);
    await new Promise((res) => setTimeout(res, 150));
  }

  // Verify structure and balances
  let allPass = true;
  console.log("\n📊 Verifying balances + Firestore structure...");

  for (const heroId of Object.keys(expectedBalances)) {
    const user = await getUser(heroId);
    const balance = user?.tssa_balance ?? 0;
    const expected = Number(expectedBalances[heroId].toFixed(7));
    const actual = Number(balance.toFixed(7));
    const hasPath = user?.referral_path === undefined;
    const correct = expected === actual && hasPath;

    if (!correct) allPass = false;
    console.log(`${correct ? "✅" : "❌"} ${heroId.padEnd(8)} → ${actual} TSSA (expected ${expected})${!hasPath ? " | ❌ referral_path still exists" : ""}`);
  }

  // Verify referral relationships
  console.log("\n🔗 Verifying REFERRALS & REFERRAL_PATHS...");
  for (const [child, parent] of Object.entries(referralMap)) {
    if (!parent) continue;

    const referrals = await getReferrals(parent);
    const path = await getReferralPath(child);
    const isInDirect = referrals.includes(child);
    const isUpstreamCorrect = path.includes(parent);

    if (!isInDirect || !isUpstreamCorrect) {
      allPass = false;
      console.log(`❌ ${child} referral check failed (direct: ${isInDirect}, upstream: ${isUpstreamCorrect})`);
    } else {
      console.log(`✅ ${child} referral: direct & upstream correct`);
    }
  }

  printTree(referralMap);

  if (allPass) {
    console.log(`\n🎉 All ${NUM_HEROES} users verified successfully!`);
  } else {
    console.log(`\n⚠️ One or more checks failed. See above.`);
  }
}

runFullReferralTest();
