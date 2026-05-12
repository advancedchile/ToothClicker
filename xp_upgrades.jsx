
/**
 * Generates the list of 350 XP upgrades algorithmically.
 */
function generateXPUpgrades() {
  const upgrades = [];
  const namesES = ["Seminario", "Taller", "Simposio", "Masterclass", "Diplomado", "Especialidad", "Doctorado", "Certificación", "Convención", "Foro"];
  const namesEN = ["Seminar", "Workshop", "Symposium", "Masterclass", "Diploma", "Specialty", "PhD", "Certification", "Convention", "Forum"];
  const topicsES = ["Higiene", "Endodoncia", "Periodoncia", "Ortodoncia", "Estética", "Cirugía", "Implantes", "Radiología", "Odontopediatría", "Geriatría"];
  const topicsEN = ["Hygiene", "Endodontics", "Periodontics", "Orthodontics", "Aesthetics", "Surgery", "Implants", "Radiology", "Pediatric", "Geriatric"];

  for (let i = 1; i <= 350; i++) {
    const nIdx = (i - 1) % 10;
    const tIdx = Math.floor((i - 1) / 35) % 10;
    const tier = Math.floor((i - 1) / 10) + 1;
    
    // Cost formula: base * growth ^ level
    // We also consider prestige count to unlock/adjust
    const baseCost = 5000 * Math.pow(1.35, tier);
    
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
