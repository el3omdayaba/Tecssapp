function calculateTSSAReward(level) {
    if (level >= 1 && level <= 9) return 1;
    if (level >= 10 && level <= 18) return 0.1;
    if (level >= 19 && level <= 27) return 0.01;
    if (level >= 28 && level <= 36) return 0.001;
    if (level >= 37 && level <= 45) return 0.0001;
    if (level >= 46 && level <= 54) return 0.00001;
    if (level >= 55 && level <= 63) return 0.000001;
    return 0.0000001; // Flat after 63
  }
  
  console.log("✅ Testing TSSA Decay Logic\n");
  for (let i = 1; i <= 70; i += 1) {
    const reward = calculateTSSAReward(i);
    const marker = [1, 10, 19, 28, 37, 46, 55, 64].includes(i) ? "⬅️ decay step" : "";
    console.log(`Level ${i}: ${reward} TSSA ${marker}`);
  }
  