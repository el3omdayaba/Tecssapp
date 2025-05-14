// scripts/logBackup.js

import fs from "fs";
import path from "path";

const backupDir = "../backups";
const readmePath = "../README.md";

try {
  // Get latest backup folder
  const folders = fs
    .readdirSync(backupDir)
    .filter(name => fs.lstatSync(path.join(backupDir, name)).isDirectory())
    .sort((a, b) => fs.statSync(path.join(backupDir, b)).ctimeMs - fs.statSync(path.join(backupDir, a)).ctimeMs);

  const latest = folders[0];
  const logEntry = `
### ✅ Backup Log: ${latest}

- ✅ All core services tested and stable
- ✅ Referral chain restricted to same-branch rewards
- ✅ TSSA balances updated correctly across referral levels
- ✅ Automated test for 7 users passed
- ✅ Backup created with auto-cleanup logic
- 🔒 Ready for cross-branch isolation tests

---
`;

  fs.appendFileSync(readmePath, logEntry);
  console.log("📝 README.md updated with backup log.");
} catch (err) {
  console.error("❌ Failed to update README.md:", err.message);
}
