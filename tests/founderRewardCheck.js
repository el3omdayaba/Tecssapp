import { db } from "../firebaseConfig.js";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";

/**
 * 1. Checks that hero_0 has correct TSSA balance.
 * 2. Prints leaderboard of top 10 TSSA holders.
 */
async function runValidation(expectedFounderBalance = 20) {
  // Check hero_0
  const founderDoc = await getDoc(doc(db, "USERS", "hero_0"));
  const data = founderDoc.exists() ? founderDoc.data() : null;

  if (!data) {
    console.error("❌ hero_0 not found");
    return;
  }

  const actual = data.tssa_balance || 0;
  console.log(`🏛️  hero_0 balance: ${actual} TSSA`);

  if (actual === expectedFounderBalance) {
    console.log("✅ Founder reward validation passed.\n");
  } else {
    console.error(`❌ Expected ${expectedFounderBalance} TSSA but got ${actual}\n`);
  }

  // Leaderboard
  console.log("🏆 Top TSSA Balances:");
  const snapshot = await getDocs(collection(db, "USERS"));

  const balances = [];
  snapshot.forEach(doc => {
    const { hero_id, tssa_balance = 0 } = doc.data();
    balances.push({ id: hero_id || doc.id, balance: tssa_balance });
  });

  balances
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10)
    .forEach((entry, index) => {
      const label = entry.id === "hero_0" ? "👑" : "";
      console.log(`${index + 1}. ${entry.id.padEnd(10)} → ${entry.balance} TSSA ${label}`);
    });

  console.log("\n✅ Leaderboard loaded.");
}

runValidation(20); // change this to your test batch size
