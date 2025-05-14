// scripts/backup.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BACKUP_DIR = "./backups";
const MAX_BACKUPS = 10;

try {
  // 1. Create timestamped backup folder
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${BACKUP_DIR}/step_backup_${timestamp}`;
  const command = `robocopy . "${backupPath}" /E /XD node_modules .git backups`;

  console.log("📦 Creating backup...");
  execSync(command, { stdio: "inherit" });

  console.log("✅ Backup complete!");

  // 2. Clean old backups
  const folders = fs
    .readdirSync(BACKUP_DIR)
    .filter(name => fs.lstatSync(path.join(BACKUP_DIR, name)).isDirectory())
    .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, a)).ctimeMs - fs.statSync(path.join(BACKUP_DIR, b)).ctimeMs);

  const excess = folders.length - MAX_BACKUPS;
  if (excess > 0) {
    for (let i = 0; i < excess; i++) {
      const oldPath = path.join(BACKUP_DIR, folders[i]);
      fs.rmSync(oldPath, { recursive: true, force: true });
      console.log(`🧹 Deleted old backup: ${folders[i]}`);
    }
  }

  // 3. Append to backup_log.md
  const logPath = "./backup_log.md";
  const logEntry = `- ✅ Backup created at ${timestamp}\n`;
  fs.appendFileSync(logPath, logEntry);
  console.log("📝 Logged to backup_log.md");

} catch (error) {
  if (error.status === 1) {
    console.log("✅ Backup completed with robocopy exit code 1 (normal file copy).");
  } else {
    console.error("❌ Backup failed:", error.message);
  }
}
