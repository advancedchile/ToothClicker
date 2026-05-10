// ==========================================================================
// Tooth Clicker — Store Upgrades System
// ==========================================================================

window.STORE_UPGRADES = (() => {
  const upgrades = [];
  const gens = window.GENERATORS || [];
  
  // 1. CLICK UPGRADES (approx 50)
  for (let i = 1; i <= 50; i++) {
    const cost = Math.floor(1000 * Math.pow(3.5, i));
    upgrades.push({
      id: `click_up_${i}`,
      type: 'click',
      multiplier: 2,
      cost: cost,
      requirement: Math.floor(cost * 0.65),
      icon: 'fa-hand-pointer',
      es: `Click de Diamante Nivel ${i}`,
      en: `Diamond Click Level ${i}`,
      desc_es: 'Tus clicks son el doble de potentes.',
      desc_en: 'Your clicks are twice as powerful.',
      color: '#00d2ff'
    });
  }

  // 2. GENERATOR UPGRADES (approx 200)
  gens.forEach((gen, gIdx) => {
    for (let i = 1; i <= 5; i++) {
      const cost = Math.floor(gen.baseCost * 250 * Math.pow(75, i));
      upgrades.push({
        id: `gen_up_${gen.id}_${i}`,
        type: 'generator',
        targetId: gen.id,
        multiplier: 2,
        cost: cost,
        requirement: Math.floor(cost * 0.65),
        icon: gen.icon.replace('fa-solid ', ''),
        es: `${gen.es} mejorado Nivel ${i}`,
        en: `${gen.en} upgraded Level ${i}`,
        desc_es: `La producción de ${gen.es} se duplica.`,
        desc_en: `The production of ${gen.en} is doubled.`,
        color: '#ffc220'
      });
    }
  });

  // 3. GLOBAL UPGRADES (approx 50)
  for (let i = 1; i <= 50; i++) {
    const cost = Math.floor(50000000 * Math.pow(15, i));
    upgrades.push({
      id: `global_up_${i}`,
      type: 'global',
      multiplier: 1.1,
      cost: cost,
      requirement: Math.floor(cost * 0.65),
      icon: 'fa-globe',
      es: `Eficiencia Global Nivel ${i}`,
      en: `Global Efficiency Level ${i}`,
      desc_es: 'Toda tu producción aumenta un 10%.',
      desc_en: 'All your production increases by 10%.',
      color: '#ff4b2b'
    });
  }

  // Sort by cost
  return upgrades.sort((a, b) => a.cost - b.cost).slice(0, 300);
})();
