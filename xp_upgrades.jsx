
/**
 * Generates the list of 350 XP upgrades algorithmically.
 */
function generateXPUpgrades() {
  const upgrades = [];
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

  for (let i = 1; i <= 350; i++) {
    const nIdx = (i - 1) % namesES.length;
    const tIdx = Math.floor((i - 1) / 3) % topicsES.length;
    const tier = Math.floor((i - 1) / 10) + 1;
    
    // Growth cost
    const baseCost = 5000 * Math.pow(1.4, i);
    
    const type = i % 3 === 0 ? 'gps' : (i % 3 === 1 ? 'xp_click' : 'xp_passive');
    
    let benefitDescES = "", benefitDescEN = "";
    let xpPerClick = 0, xpPassive = 0, gpsBonus = 0;

    if (type === 'gps') {
      gpsBonus = 0.01 * tier;
      benefitDescES = `+${(gpsBonus * 100).toFixed(1)}% producción pasiva global.`;
      benefitDescEN = `+${(gpsBonus * 100).toFixed(1)}% global passive production.`;
    } else if (type === 'xp_click') {
      xpPerClick = 0.1 * tier;
      benefitDescES = `+${xpPerClick.toFixed(2)} XP por click.`;
      benefitDescEN = `+${xpPerClick.toFixed(2)} XP per click.`;
    } else {
      xpPassive = 0.05 * tier;
      benefitDescES = `+${xpPassive.toFixed(2)} XP/seg pasiva.`;
      benefitDescEN = `+${xpPassive.toFixed(2)} XP/sec passive.`;
    }

    upgrades.push({
      id: `xp_up_${i}`,
      name: {
        es: `${namesES[nIdx]} de ${topicsES[tIdx]} ${"I".repeat((i%3)+1)}`,
        en: `${namesEN[nIdx]} of ${topicsEN[tIdx]} ${"I".repeat((i%3)+1)}`
      },
      desc: {
        es: `Nivel académico requerido para dominar ${topicsES[tIdx].toLowerCase()}. ${benefitDescES}`,
        en: `Academic level required to master ${topicsEN[tIdx].toLowerCase()}. ${benefitDescEN}`
      },
      baseCost: baseCost,
      xpPerClick,
      xpPassive,
      gpsBonus,
      levelReq: Math.floor(i * 1.5),
      teethReq: baseCost * 0.2
    });
  }
  return upgrades;
}

window.XP_UPGRADES = generateXPUpgrades();
