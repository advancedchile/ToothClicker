// ==========================================================================
// Tooth Clicker — Store Upgrades System
// ==========================================================================

window.STORE_UPGRADES = (() => {
  const upgrades = [];
  const gens = window.GENERATORS || [];
  
  // 1. CLICK UPGRADES (approx 50)
  for (let i = 1; i <= 50; i++) {
    const cost = Math.floor(2250 * Math.pow(3.5, i)); // 1000 * 2.25
    upgrades.push({
      id: `click_up_${i}`,
      type: 'click',
      multiplier: 1.5,
      cost: cost,
      requirement: Math.floor(cost * 0.65),
      icon: 'fa-hand-pointer',
      es: `Click de Diamante Nivel ${i}`,
      en: `Diamond Click Level ${i}`,
      desc_es: 'Tus clicks son un 50% más potentes.',
      desc_en: 'Your clicks are 50% more powerful.',
      color: '#00d2ff'
    });
  }

  // 2. GENERATOR UPGRADES (based on milestones: 10, 25, 50, 100, 250, 500, 1000, 3000, 5000, 10000, 20000)
  const milestones = [10, 25, 50, 100, 250, 500, 1000, 3000, 5000, 10000, 20000];
  gens.forEach((gen, gIdx) => {
    milestones.forEach((m, mIdx) => {
      // Scale cost based on milestone and generator base cost
      const cost = Math.floor(gen.baseCost * 33.75 * Math.pow(m, 1.2) * (mIdx + 1)); // 15 * 2.25 = 33.75
      upgrades.push({
        id: `gen_up_${gen.id}_${m}`,
        type: 'generator',
        targetId: gen.id,
        multiplier: 2,
        cost: cost,
        milestone: m,
        icon: gen.icon.replace('fa-solid ', ''),
        es: `${gen.es} mejorado`,
        en: `${gen.en} upgraded`,
        desc_es: `La producción de ${gen.es} se duplica.`,
        desc_en: `The production of ${gen.en} is doubled.`,
        color: '#ffc220'
      });
    });
  });

  // 3. GLOBAL UPGRADES (approx 50)
  for (let i = 1; i <= 50; i++) {
    const cost = Math.floor(112500000 * Math.pow(15, i)); // 50000000 * 2.25
    upgrades.push({
      id: `global_up_${i}`,
      type: 'global',
      multiplier: 1.05,
      cost: cost,
      requirement: Math.floor(cost * 0.65),
      icon: 'fa-globe',
      es: `Eficiencia Global Nivel ${i}`,
      en: `Global Efficiency Level ${i}`,
      desc_es: 'Toda tu producción aumenta un 5%.',
      desc_en: 'All your production increases by 5%.',
      color: '#ff4b2b'
    });
  }

  // Sort by cost
  return upgrades.sort((a, b) => a.cost - b.cost).slice(0, 300);
})();
