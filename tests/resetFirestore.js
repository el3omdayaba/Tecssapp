import { db } from "../firebaseConfig.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

/**
 * Deletes all docs in USERS and REWARDS for a clean slate.
 */
async function resetFirestore() {
  console.log("⚠️ Resetting Firestore collections...");

  const collections = ["USERS", "REWARDS"];
  for (const name of collections) {
    const colRef = collection(db, name);
    const snapshot = await getDocs(colRef);

    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
    }

    console.log(`✅ Deleted all from ${name}`);
  }

  console.log("🏁 Firestore reset complete.");
}

resetFirestore().catch(console.error);
