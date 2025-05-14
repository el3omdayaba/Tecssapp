import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig.js";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BACKUP_DIR = path.resolve("backups");

// Optional CLI argument for tag
const customTag = process.argv[2];

async function backupUsers() {
  console.log("🧾 Creating Firestore USERS backup...");

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }

  // Fetch Firestore data
  const snapshot = await getDocs(collection(db, "USERS"));
  const data = {};
  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });

  // Create filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileTag = customTag ? customTag.replace(/\W+/g, "_") : timestamp;
  const fileName = `users_backup_${fileTag}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);

  // Write backup file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Backup saved: ${filePath}`);

  // Clean older backups (keep latest 10)
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".json"))
    .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtimeMs - fs.statSync(path.join(BACKUP_DIR, a)).mtimeMs);

  const excess = files.slice(10);
  for (const oldFile of excess) {
    fs.unlinkSync(path.join(BACKUP_DIR, oldFile));
    console.log(`🗑️ Deleted old backup: ${oldFile}`);
  }

  // Auto-commit and push to GitHub
  const gitCommand = `
    git add ${filePath} &&
    git commit -m "🔐 Backup USERS ${fileTag}" &&
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

backupUsers();
