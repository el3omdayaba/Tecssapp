import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCollection(name) {
  const snap = await getDocs(collection(db, name));
  if (snap.empty) {
    console.log(`❌ No documents found in ${name}`);
    return;
  }

  console.log(`\n📂 ${name} (${snap.size} docs):`);
  snap.forEach((doc) => {
    console.log(`📝 ${doc.id}:`, doc.data());
  });
}

async function runCheck() {
  console.log("🔍 Checking Firestore collections...\n");

  await checkCollection("REFERRALS");
  await checkCollection("REFERRAL_PATHS");
  await checkCollection("REWARDS");

  console.log("\n✅ Check complete.");
}

runCheck();
