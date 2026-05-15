
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

  // We will map one upgrade to each non-secret achievement roughly
  // excluding the very first ones to keep it balanced
  const nonSecretAchievements = achievements.filter(a => !a.secret);
  
  nonSecretAchievements.forEach((ach, i) => {
    const nIdx = i % namesES.length;
    const tIdx = Math.floor(i / 5) % topicsES.length;
    const difficulty = i + 1; // Used for scaling
    
    // Type rotation: 1=XP Click, 2=XP Passive, 3=Global Production
    const type = i % 3;
    let xpPerClick = 0, xpPassive = 0, gpsBonus = 0;
    let benefitDescES = "", benefitDescEN = "";

    if (type === 0) {
      // XP per click (Increased from 0.1 * tier)
      xpPerClick = 0.15 * Math.pow(1.05, difficulty);
      benefitDescES = `+${xpPerClick.toFixed(2)} XP por click.`;
      benefitDescEN = `+${xpPerClick.toFixed(2)} XP per click.`;
    } else if (type === 1) {
      // XP passive (Increased from 0.05 * tier)
      xpPassive = 0.08 * Math.pow(1.05, difficulty);
      benefitDescES = `+${xpPassive.toFixed(2)} XP/seg pasiva.`;
      benefitDescEN = `+${xpPassive.toFixed(2)} XP/sec passive.`;
    } else {
      // Global production (Increased from 1% * tier)
      gpsBonus = 0.015 * Math.pow(1.03, Math.floor(difficulty/2));
      benefitDescES = `+${(gpsBonus * 100).toFixed(2)}% producción pasiva global.`;
      benefitDescEN = `+${(gpsBonus * 100).toFixed(2)}% global passive production.`;
    }

    // Cost scales with difficulty but remains affordable relative to achievement progress
    // Roughly 50% of what they likely earned to get the achievement
    const baseCost = 1000 * Math.pow(1.35, difficulty);

    upgrades.push({
      id: `xp_up_${ach.id}`,
      achievementId: ach.id,
      name: {
        es: `${namesES[nIdx]} de ${topicsES[tIdx]} ${window.toRoman ? window.toRoman(Math.floor(i/20) + 1) : (Math.floor(i/20) + 1)}`,
        en: `${namesEN[nIdx]} of ${topicsEN[tIdx]} ${window.toRoman ? window.toRoman(Math.floor(i/20) + 1) : (Math.floor(i/20) + 1)}`
      },
      desc: {
        es: `Otorgado por el logro "${ach.es}". ${benefitDescES}`,
        en: `Granted by achievement "${ach.en}". ${benefitDescEN}`
      },
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
    const xpMult = 0.02 * lvl;   // 2% XP mult per level
    
    upgrades.push({
      id: `lvl_up_${lvl}`,
      levelReq: lvl,
      isLevelSpecial: true,
      name: {
        es: `Excelencia Académica Nivel ${lvl}`,
        en: `Academic Excellence Level ${lvl}`
      },
      desc: {
        es: `Premio por alcanzar el nivel ${lvl}. +${(gpsBonus * 100).toFixed(0)}% prod. global y +${(xpMult * 100).toFixed(0)}% XP global.`,
        en: `Award for reaching level ${lvl}. +${(gpsBonus * 100).toFixed(0)}% global prod. and +${(xpMult * 100).toFixed(0)}% global XP.`
      },
      baseCost: baseCost,
      gpsBonus,
      xpMult
    });
  }
  return upgrades;
}

window.XP_UPGRADES = generateXPUpgrades();
window.LEVEL_UPGRADES = generateLevelUpUpgrades();
