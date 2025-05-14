import { db } from "../firebaseConfig.js";
import { collection, getDocs, deleteDoc } from "firebase/firestore";

/**
 * Deletes all documents from key collections for a clean slate.
 */
async function resetFirestore() {
  console.log("⚠️ Resetting Firestore collections...\n");

  const collections = [
    "USERS",
    "REWARDS",
    "REFERRALS",
    "REFERRAL_PATHS",
    "REFERRAL_ACTIVITY", // ✅ Added abuse tracking
  ];

  for (const name of collections) {
    const colRef = collection(db, name);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log(`⚠️ ${name} is already empty.`);
      continue;
    }

    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }

    console.log(`✅ Deleted all documents from ${name}`);
  }

  console.log("\n🏁 Firestore reset complete.");
}

resetFirestore().catch((error) => {
  console.error("❌ Firestore reset failed:", error);
});

