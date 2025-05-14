// tests/manualWriteTest.js

import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";

async function writeManualUser() {
  const uid = "manual_test_user";

  const testUser = {
    uid,
    email: "test@sample.com",
    password: "test123",
    referred_by: "hero_0",
    device_id: "manual_device",
    created_at: new Date(),
  };

  try {
    await setDoc(doc(db, "USERS", uid), testUser);
    console.log("✅ Wrote test user:", testUser);
  } catch (error) {
    console.error("❌ Failed to write test user:", error.message);
  }
}

writeManualUser();
