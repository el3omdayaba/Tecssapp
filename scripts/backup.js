import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Create backup
try {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, `../backups/step_backup_${timestamp}`);
  const command = `robocopy . "${backupDir}" /E /XD node_modules .git backups`;

  console.log("📦 Creating backup...");
  execSync(command, { stdio: "inherit" });

  console.log("✅ Backup complete!");
} catch (error) {
  if (error.status === 1) {
    console.log("✅ Backup completed with robocopy exit code 1 (normal file copy).");
  } else {
    console.error("❌ Backup failed:", error.message);
  }
}

// 🔁 Clean old backups
const BACKUP_DIR = path.join(__dirname, "../backups");
const MAX_BACKUPS = 10;

function cleanOldBackups() {
  const folders = fs
    .readdirSync(BACKUP_DIR)
    .filter(name => fs.lstatSync(path.join(BACKUP_DIR, name)).isDirectory())
    .sort(
      (a, b) =>
        fs.statSync(path.join(BACKUP_DIR, a)).ctimeMs -
        fs.statSync(path.join(BACKUP_DIR, b)).ctimeMs
    );

  const excess = folders.length - MAX_BACKUPS;
  if (excess > 0) {
    for (let i = 0; i < excess; i++) {
      const oldPath = path.join(BACKUP_DIR, folders[i]);
      fs.rmSync(oldPath, { recursive: true, force: true });
      console.log(`🧹 Deleted old backup: ${folders[i]}`);
    }
  }
}

cleanOldBackups();
