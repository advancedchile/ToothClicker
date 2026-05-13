
/**
 * Generates the list of 350 XP upgrades algorithmically.
 */
function generateXPUpgrades() {
  const upgrades = [];
  const namesES = ["Seminario", "Taller", "Simposio", "Masterclass", "Diplomado", "Especialidad", "Doctorado", "Certificación", "Convención", "Foro", "Cumbre", "Encuentro", "Laboratorio", "Cátedra", "Mesa Redonda", "Retiro"];
  const namesEN = ["Seminar", "Workshop", "Symposium", "Masterclass", "Diploma", "Specialty", "PhD", "Certification", "Convention", "Forum", "Summit", "Encounter", "Lab", "Chair", "Roundtable", "Retreat"];
  const topicsES = ["Higiene", "Endodoncia", "Periodoncia", "Ortodoncia", "Estética", "Cirugía", "Implantes", "Radiología", "Odontopediatría", "Geriatría", "Blanqueamiento", "Esmalte", "Microbiología", "Bioética", "Marketing", "Gestión"];
  const topicsEN = ["Hygiene", "Endodontics", "Periodontics", "Orthodontics", "Aesthetics", "Surgery", "Implants", "Radiology", "Pediatric", "Geriatric", "Whitening", "Enamel", "Microbiology", "Bioethics", "Marketing", "Management"];

  for (let i = 1; i <= 350; i++) {
    const nIdx = (i - 1) % namesES.length;
    const tIdx = Math.floor((i - 1) / namesES.length) % topicsES.length;
    const tier = Math.floor((i - 1) / 10) + 1;
    
    // Cost formula: base * growth ^ level
    // We also consider prestige count to unlock/adjust
    const baseCost = 7500 * Math.pow(1.35, tier); // Increased by 50% (original 5000 * 1.5)
    
    upgrades.push({
      id: `xp_up_${i}`,
      name: {
        es: `${namesES[nIdx]} de ${topicsES[tIdx]} (Nivel ${tier})`,
        en: `${namesEN[nIdx]} of ${topicsEN[tIdx]} (Level ${tier})`
      },
      desc: {
        es: `Aumenta la ganancia de XP por click en +${(0.05 * tier).toFixed(2)} y pasiva en +${(0.02 * tier).toFixed(2)} XP/seg.`,
        en: `Increases XP per click by +${(0.05 * tier).toFixed(2)} and passive by +${(0.02 * tier).toFixed(2)} XP/sec.`
      },
      baseCost: baseCost,
      xpPerClick: 0.05 * tier,
      xpPassive: 0.02 * tier,
      prestigeReq: Math.floor((i - 1) / 15), // Unlock every 15 upgrades per 1 prestige level? No, let's make it more gradual.
    });
  }
  return upgrades;
}

window.XP_UPGRADES = generateXPUpgrades();
