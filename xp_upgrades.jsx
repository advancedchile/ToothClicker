
/**
 * Generates the list of XP upgrades based on Achievement progression.
 * These upgrades appear in the Academy as rewards for unlocking achievements.
 */
function generateXPUpgrades() {
  const upgrades = [];
  const achievements = window.ACHIEVEMENTS || [];
  
  // Base names and topics for variety
  const namesES = [
    "Seminario", "Taller", "Simposio", "Masterclass", "Diplomado", "Especialidad", "Doctorado", 
    "Certificación", "Convención", "Foro", "Cumbre", "Encuentro", "Laboratorio", "Cátedra", 
    "Mesa Redonda", "Retiro", "Estudio", "Análisis", "Investigación", "Tutoría"
  ];
  const namesEN = [
    "Seminar", "Workshop", "Symposium", "Masterclass", "Diploma", "Specialty", "PhD", 
    "Certification", "Convention", "Forum", "Summit", "Encounter", "Lab", "Chair", 
    "Roundtable", "Retreat", "Study", "Analysis", "Research", "Tutoring"
  ];
  const topicsES = [
    "Higiene", "Endodoncia", "Periodoncia", "Ortodoncia", "Estética", "Cirugía", "Implantes", 
    "Radiología", "Odontopediatría", "Geriatría", "Blanqueamiento", "Esmalte", "Microbiología", 
    "Bioética", "Marketing", "Gestión", "Nanotecnología", "Biometría", "Ergonomía", "Farmacología"
  ];
  const topicsEN = [
    "Hygiene", "Endodontics", "Periodontics", "Orthodontics", "Aesthetics", "Surgery", "Implants", 
    "Radiology", "Pediatric", "Geriatric", "Whitening", "Enamel", "Microbiology", 
    "Bioethics", "Marketing", "Management", "Nanotechnology", "Biometrics", "Ergonomics", "Pharmacology"
  ];

  const nonSecretAchievements = achievements.filter(a => !a.secret);
  
  const getDifficultyScore = (ach) => {
    const id = ach.id || '';
    if (id === 'feedback_first') return 3;
    
    if (ach.cat === 'clicks') {
      const idx = parseInt(id.replace('click_', ''), 10);
      const clickMs = [100, 1000, 5000, 15000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000, 100000000, 250000000, 500000000, 1000000000, 5000000000, 10000000000];
      const val = clickMs[idx] || 100;
      return Math.log10(val) * 1.5 + 2;
    }
    
    if (ach.cat === 'earned') {
      const idx = parseInt(id.replace('earn_', ''), 10);
      const earnMs = [1e6, 1e8, 1e10, 1e12, 1e14, 1e16, 1e18, 1e21, 1e24, 1e27, 1e30, 1e35, 1e40, 1e45, 1e50, 1e60, 1e70, 1e80, 1e90, 1e100, 1e120, 1e140, 1e160, 1e180, 1e200, 1e220, 1e250, 1e280, 1e300, 1e308];
      const val = earnMs[idx] || 1e6;
      return Math.log10(val);
    }
    
    if (ach.cat === 'gen') {
      const parts = id.split('_');
      const qty = parseInt(parts[parts.length - 1], 10) || 25;
      const genId = parts.slice(1, -1).join('_');
      const generators = window.GENERATORS || [];
      const gen = generators.find(g => g.id === genId);
      if (!gen) return 4;
      const totalCost = gen.baseCost * (Math.pow(1.15, qty) - 1) / 0.15;
      return Math.max(1, Math.log10(totalCost));
    }
    
    if (ach.cat === 'prestige') {
      const idx = parseInt(id.replace('prest_', ''), 10);
      const prestMs = [10, 50, 250, 1000, 5000, 25000, 100000, 500000, 1000000, 10000000, 50000000, 100000000];
      const val = prestMs[idx] || 10;
      // Formula: totalEarned = (val)^2 * 1e6
      // Math.log10(totalEarned) = 2 * Math.log10(val) + 6
      return 6 + Math.log10(val) * 2;
    }
    
    if (ach.cat === 'golden') {
      const idx = parseInt(id.replace('gold_', ''), 10);
      const goldMs = [10, 50, 100, 250, 500, 1000, 5000, 10000, 25000, 50000, 100000, 1000000];
      const val = goldMs[idx] || 10;
      return 4 + Math.log10(val) * 4;
    }

    if (ach.cat === 'gold_special' || ach.cat === 'diamond' || ach.cat === 'crystal') {
      const parts = id.split('_');
      const qty = parseInt(parts[parts.length - 1], 10) || 100;
      return 8 + Math.log10(qty) * 4;
    }
    
    if (ach.cat === 'time') {
      const idx = parseInt(id.replace('time_', ''), 10);
      const timeMs = [3600, 3600*12, 86400, 86400*3, 86400*7, 86400*30, 86400*90, 86400*180, 86400*365, 86400*1000];
      const val = timeMs[idx] || 3600;
      return Math.log10(val) * 2 + 3;
    }
    
    if (ach.cat === 'upgrades') {
      const idx = parseInt(id.replace('up_', ''), 10);
      const upMs = [1,5,10,25,50,75,100,110,115,120];
      const val = upMs[idx] || 1;
      return Math.log10(val) * 5 + 4;
    }
    
    if (ach.cat === 'meta') {
      const idx = parseInt(id.replace('ach_', ''), 10);
      const achMs = [10,25,50,100,150,200,250,275,290,300];
      const val = achMs[idx] || 10;
      return Math.log10(val) * 5 + 5;
    }
    
    if (ach.cat === 'speed') {
      const idx = parseInt(id.replace('speed_', ''), 10);
      const speedMs = [5, 7, 10, 12, 15, 16, 20, 25, 35, 50, 75, 100];
      const val = speedMs[idx] || 5;
      return Math.log2(val) * 2 + 3;
    }
    
    if (ach.secret) {
      return 25;
    }
    
    return 10;
  };

  const sortedAchievements = [...nonSecretAchievements].sort((a, b) => getDifficultyScore(a) - getDifficultyScore(b));

  sortedAchievements.forEach((ach, i) => {
    const nIdx = i % namesES.length;
    const tIdx = Math.floor(i / 5) % topicsES.length;
    const difficulty = getDifficultyScore(ach);
    
    // Type rotation: 1=XP Click, 2=XP Passive, 3=Global Production
    const type = i % 3;
    let xpPerClick = 0, xpPassive = 0, gpsBonus = 0;
    let benefitDescES = "", benefitDescEN = "";

    if (type === 0) {
      xpPerClick = 0.02 * Math.pow(1.01, difficulty);
      benefitDescES = `+${xpPerClick.toFixed(2)} XP por click.`;
      benefitDescEN = `+${xpPerClick.toFixed(2)} XP per click.`;
    } else if (type === 1) {
      xpPassive = 0.01 * Math.pow(1.01, difficulty);
      benefitDescES = `+${xpPassive.toFixed(2)} XP/seg pasiva.`;
      benefitDescEN = `+${xpPassive.toFixed(2)} XP/sec passive.`;
    } else {
      gpsBonus = 0.01 * Math.pow(1.005, difficulty);
      benefitDescES = `+${(gpsBonus * 100).toFixed(2)}% producción pasiva global.`;
      benefitDescEN = `+${(gpsBonus * 100).toFixed(2)}% global passive production.`;
    }

    // Cost scales strictly with the achievement's real log10 cost
    const safeDifficulty = Math.min(300, Math.max(1, difficulty));
    let baseCost = Math.pow(10, safeDifficulty) * 0.05;
    if (baseCost < 50) baseCost = 50;

    upgrades.push({
      id: `xp_up_${ach.id}`,
      achievementId: ach.id,
      name: {
        es: `${namesES[nIdx]} de ${topicsES[tIdx]} ${window.toRoman ? window.toRoman(Math.floor(i/20) + 1) : (Math.floor(i/20) + 1)}`,
        en: `${namesEN[nIdx]} of ${topicsEN[tIdx]} ${window.toRoman ? window.toRoman(Math.floor(i/20) + 1) : (Math.floor(i/20) + 1)}`
      },
      desc: {
        es: benefitDescES,
        en: benefitDescEN
      },
      icon: ["fa-solid fa-graduation-cap", "fa-solid fa-book", "fa-solid fa-certificate", "fa-solid fa-flask", "fa-solid fa-microscope", "fa-solid fa-chalkboard-user", "fa-solid fa-award", "fa-solid fa-scroll", "fa-solid fa-user-graduate", "fa-solid fa-laptop-code"][nIdx % 10],
      baseCost: baseCost,
      xpPerClick,
      xpPassive,
      gpsBonus,
    });
  });

  return upgrades;
}

/**
 * Generates special level-up upgrades.
 * These appear in the Academy when reaching certain levels.
 */
function generateLevelUpUpgrades() {
  const upgrades = [];
  for (let lvl = 1; lvl <= 100; lvl++) {
    const difficulty = lvl;
    const baseCost = 25000 * Math.pow(1.5, lvl);
    
    // Level rewards alternate or stack
    const gpsBonus = 0.05 * lvl; // 5% per level, much better!
    const xpMult = 0.005 * lvl;   // 0.5% XP mult per level
    
    upgrades.push({
      id: `lvl_up_${lvl}`,
      levelReq: lvl,
      isLevelSpecial: true,
      name: {
        es: `Excelencia Académica Nivel ${lvl}`,
        en: `Academic Excellence Level ${lvl}`
      },
      desc: {
        es: `Premio por alcanzar el nivel ${lvl}. +${(gpsBonus * 100).toFixed(0)}% prod. global y +${(xpMult * 100).toFixed(1)}% XP global.`,
        en: `Award for reaching level ${lvl}. +${(gpsBonus * 100).toFixed(0)}% global prod. and +${(xpMult * 100).toFixed(1)}% global XP.`
      },
      icon: 'fa-solid fa-award',
      baseCost: baseCost,
      gpsBonus,
      xpMult
    });
  }
  return upgrades;
}

window.XP_UPGRADES = []; // generateXPUpgrades();
