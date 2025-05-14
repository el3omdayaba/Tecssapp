import { db } from "../firebaseConfig.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";

async function getTotalReferralCount(userId, referralMap) {
  const direct = referralMap[userId] || [];
  let total = direct.length;

  for (const childId of direct) {
    total += await getTotalReferralCount(childId, referralMap);
  }

  return total;
}

async function updateTotalReferrals() {
  console.log("🔄 Updating total_referrals...");

  // Step 1: Build referral map
  const referralSnapshot = await getDocs(collection(db, "REFERRALS"));
  const referralMap = {};

  referralSnapshot.forEach(docSnap => {
    const { direct = [] } = docSnap.data();
    referralMap[docSnap.id] = direct.map(entry => (typeof entry === "string" ? entry : entry.id));
  });

  // Step 2: Get all users
  const userSnapshot = await getDocs(collection(db, "USERS"));

  for (const docSnap of userSnapshot.docs) {
    const userId = docSnap.id;
    const total = await getTotalReferralCount(userId, referralMap);

    await updateDoc(doc(db, "USERS", userId), {
      total_referrals: total,
    });

    console.log(`✅ ${userId}: total_referrals = ${total}`);
  }

  console.log("🏁 Finished updating total_referrals.");
}

updateTotalReferrals().catch(console.error);
