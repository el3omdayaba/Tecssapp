// rewardMath.js

/**
 * Calculates the TSSA reward based on how far a referrer is from the new user.
 * - Level 0 (founder): always 1.0 TSSA
 * - Levels 1–10:    decay by 0.1 (1.0 → 0.1)
 * - Levels 11–19:   decay by 0.01 (0.1 → 0.01)
 * - Levels 20–28:   decay by 0.001 (0.01 → 0.001)
 * - Levels 29–37:   decay by 0.0001
 * - Levels 38–46:   decay by 0.00001
 * - Levels 47–55:   decay by 0.000001
 * - Levels 56–63:   decay by 0.0000001
 * - Level 64+:        fixed at 1e-7
 */
export function calculateTSSAReward(level) {
    if (level === 0) return 1.0;
  
    if (level >= 1 && level <= 10) {
      return parseFloat((1.0 - 0.1 * (level - 1)).toFixed(7));
    }
    if (level >= 11 && level <= 19) {
      return parseFloat((0.1 - 0.01 * (level - 11)).toFixed(7));
    }
    if (level >= 20 && level <= 28) {
      return parseFloat((0.01 - 0.001 * (level - 20)).toFixed(7));
    }
    if (level >= 29 && level <= 37) {
      return parseFloat((0.001 - 0.0001 * (level - 29)).toFixed(7));
    }
    if (level >= 38 && level <= 46) {
      return parseFloat((0.0001 - 0.00001 * (level - 38)).toFixed(7));
    }
    if (level >= 47 && level <= 55) {
      return parseFloat((0.00001 - 0.000001 * (level - 47)).toFixed(7));
    }
    if (level >= 56 && level <= 63) {
      return parseFloat((0.000001 - 0.0000001 * (level - 56)).toFixed(7));
    }
  
    return 0.0000001; // Fixed minimum for level 64+
  }
  