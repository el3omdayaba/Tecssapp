// tests/testTssaRewards.js
import { calculateTSSAReward } from '../services/rewardEngine.js';

console.log("📊 Final TSSA Reward Decay (Distance from New User):\n");

for (let level = 0; level <= 80; level++) {
  const reward = level === 0 ? 1.0 : calculateTSSAReward(level); // 👈 Manual override for founder
  console.log(`Level ${level}: ${reward} TSSA`);
}
