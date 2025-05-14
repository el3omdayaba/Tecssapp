import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BACKUP_DIR = path.resolve("backups");
const customTag = process.argv[2]; // Optional tag from CLI
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const fileTag = customTag ? customTag.replace(/\W+/g, "_") : timestamp;

const collectionsToBackup = ["USERS", "REWARDS", "REFERRALS", "REFERRAL_PATHS"];

async function backupFirestore() {
  console.log("🧾 Backing up Firestore collections...");

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }

  for (const name of collectionsToBackup) {
    const colRef = collection(db, name);
    const snapshot = await getDocs(colRef);
    const data = {};

    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });

    const fileName = `${name.toLowerCase()}_backup_${fileTag}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${name} → ${fileName}`);
  }

  // 🧹 Keep latest 10 of each type
  for (const name of collectionsToBackup) {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith(name.toLowerCase()) && f.endsWith(".json"))
      .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtimeMs - fs.statSync(path.join(BACKUP_DIR, a)).mtimeMs);

    const excess = files.slice(10);
    for (const oldFile of excess) {
      fs.unlinkSync(path.join(BACKUP_DIR, oldFile));
      console.log(`🗑️ Deleted old ${name} backup: ${oldFile}`);
    }
  }

  // 🔐 Git commit & push
  const gitCommand = `
    git add backups/*.json &&
    git commit -m "🔐 Firestore backup ${fileTag}" &&
    git push
  `;
  exec(gitCommand, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Git push failed:", stderr);
    } else {
      console.log("✅ Backup committed and pushed to GitHub.");
    }
  });
}

backupFirestore().catch(console.error);
