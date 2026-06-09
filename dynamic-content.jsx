// dynamic-content.jsx

window.GAME_CONTENT = null;
window.ORIGINAL_DEFAULTS = null;

window.initializeGameContent = function(dbContent, isTemplate = false) {
  if (!window.ORIGINAL_DEFAULTS) {
    window.ORIGINAL_DEFAULTS = {
      generators: JSON.parse(JSON.stringify(window.GENERATORS || [])),
      clickUpgrades: JSON.parse(JSON.stringify(window.CLICK_UPGRADES || [])),
      achievements: JSON.parse(JSON.stringify(window.ACHIEVEMENTS || [])),
      toothStages: JSON.parse(JSON.stringify(window.TOOTH_STAGES || [])),
      xpUpgrades: JSON.parse(JSON.stringify(window.XP_UPGRADES || [])),
      // levelUpgrades removed
      storeUpgrades: JSON.parse(JSON.stringify(window.STORE_UPGRADES || [])),
      music: JSON.parse(JSON.stringify(window.MUSIC || []))
    };
  }

  const defaults = {
    ...window.ORIGINAL_DEFAULTS,
    prestigeConfig: {
      baseReq: 100_000_000_000_000,
      scaling: 1.5,
      bonusPerSmile: 0.05
    },
    levelConfig: {
      maxLevel: 100,
      baseXP: 100,
      scaling: 1.5,
      modalMessage: {
        es: "¡Nivel Completado!",
        en: "Level Up!"
      },
      showParticles: true,
      customSound: null
    },
    terminology: {
      mainCurrency: { es: "Diente", en: "Tooth", esPlural: "Dientes", enPlural: "Teeth" },
      prestigeCurrency: { es: "Sonrisa dorada", en: "Golden smile", esPlural: "Sonrisas doradas", enPlural: "Golden smiles" },
      prestigeBonus: { es: "Bonus por sonrisa", en: "Smile bonus" },
      goldenCurrency: { es: "Diente dorado", en: "Golden tooth", esPlural: "Dientes dorados", enPlural: "Golden teeth" },
      diamondCurrency: { es: "Diente de diamante", en: "Diamond tooth", esPlural: "Dientes de diamante", enPlural: "Diamond teeth" },
      crystalCurrency: { es: "Diente de cristal", en: "Crystal tooth", esPlural: "Dientes de cristal", enPlural: "Crystal teeth" },
      images: {
        mainCurrency: "",
        prestigeCurrency: "",
      }
    },
    typography: {
      font: 'PixelifySans'
    },
    randomBonuses: [
      { id: 'gold', name: {es: 'Diente dorado', en: 'Golden tooth'}, image: 'uploads/gold-tooth-1.png', intervalMin: 8, intervalMax: 15, speed: 'normal', type: 'hold', duration: 20 },
      { id: 'diamond', name: {es: 'Diente de diamante', en: 'Diamond tooth'}, image: 'uploads/diamond-tooth-1.png', intervalMin: 8, intervalMax: 15, speed: 'normal', type: 'instant', hours: 2 },
      { id: 'crystal', name: {es: 'Diente de cristal', en: 'Crystal tooth'}, image: 'uploads/crystal-tooth-1.png', intervalMin: 8, intervalMax: 15, speed: 'fast', type: 'multiplier_click', duration: 45, multiplier: 5 }
    ]
  };

  if (!dbContent) {
    if (isTemplate) {
      window.GAME_CONTENT = {
        generators: [], clickUpgrades: [], achievements: [], toothStages: [], xpUpgrades: [], levelUpgrades: [], storeUpgrades: [],
        prestigeConfig: defaults.prestigeConfig, levelConfig: defaults.levelConfig, terminology: {
          mainCurrency: { es: "", en: "", esPlural: "", enPlural: "" },
          prestigeCurrency: { es: "", en: "", esPlural: "", enPlural: "" },
          prestigeBonus: { es: "", en: "" },
          images: { mainCurrency: "", prestigeCurrency: "" }
        },
        typography: defaults.typography,
        randomBonuses: [],
        music: []
      };
    } else {
      window.GAME_CONTENT = JSON.parse(JSON.stringify(defaults));
    }
  } else {
    // Deep clone dbContent to prevent reference leaking
    const safeDb = JSON.parse(JSON.stringify(dbContent));
    
    if (isTemplate) {
      window.GAME_CONTENT = {
        generators: Array.isArray(safeDb.generators) ? safeDb.generators : [],
        clickUpgrades: Array.isArray(safeDb.clickUpgrades) ? safeDb.clickUpgrades : [],
        achievements: Array.isArray(safeDb.achievements) ? safeDb.achievements : [],
        toothStages: Array.isArray(safeDb.toothStages) ? safeDb.toothStages : [],
        storeUpgrades: Array.isArray(safeDb.storeUpgrades) ? safeDb.storeUpgrades : [],
        prestigeConfig: safeDb.prestigeConfig || defaults.prestigeConfig,
        levelConfig: safeDb.levelConfig || defaults.levelConfig,
        terminology: safeDb.terminology || {
          mainCurrency: { es: "", en: "", esPlural: "", enPlural: "" },
          prestigeCurrency: { es: "", en: "", esPlural: "", enPlural: "" },
          prestigeBonus: { es: "", en: "" },
          images: { mainCurrency: "", prestigeCurrency: "" }
        },
        typography: safeDb.typography || defaults.typography,
        randomBonuses: safeDb.randomBonuses || [],
        music: Array.isArray(safeDb.music) ? safeDb.music : []
      };
      
      const dbXpUps = Array.isArray(safeDb.xpUpgrades) ? safeDb.xpUpgrades : [];
      const mergedXpUps = [...JSON.parse(JSON.stringify(defaults.xpUpgrades))];
      dbXpUps.forEach(dbUp => {
        const idx = mergedXpUps.findIndex(u => u.id === dbUp.id);
        if (idx >= 0) mergedXpUps[idx] = dbUp;
        else mergedXpUps.push(dbUp);
      });
      window.GAME_CONTENT.xpUpgrades = mergedXpUps;

      const dbLvlUps = Array.isArray(safeDb.levelUpgrades) ? safeDb.levelUpgrades : [];
      const mergedLvlUps = [...JSON.parse(JSON.stringify(defaults.levelUpgrades))];
      dbLvlUps.forEach(dbUp => {
        const idx = mergedLvlUps.findIndex(u => u.id === dbUp.id);
        if (idx >= 0) mergedLvlUps[idx] = dbUp;
        else mergedLvlUps.push(dbUp);
      });
      window.GAME_CONTENT.levelUpgrades = mergedLvlUps;
      
    } else {
      window.GAME_CONTENT = {
        generators: Array.isArray(safeDb.generators) ? safeDb.generators : JSON.parse(JSON.stringify(defaults.generators)),
        clickUpgrades: Array.isArray(safeDb.clickUpgrades) ? safeDb.clickUpgrades : JSON.parse(JSON.stringify(defaults.clickUpgrades)),
        achievements: Array.isArray(safeDb.achievements) ? safeDb.achievements : JSON.parse(JSON.stringify(defaults.achievements)),
        toothStages: Array.isArray(safeDb.toothStages) ? safeDb.toothStages : JSON.parse(JSON.stringify(defaults.toothStages)),
        storeUpgrades: Array.isArray(safeDb.storeUpgrades) ? safeDb.storeUpgrades : JSON.parse(JSON.stringify(defaults.storeUpgrades)),
        prestigeConfig: { ...defaults.prestigeConfig, ...(safeDb.prestigeConfig || {}) },
        levelConfig: { ...defaults.levelConfig, ...(safeDb.levelConfig || {}) },
        terminology: { ...defaults.terminology, ...(safeDb.terminology || {}) },
        typography: { ...defaults.typography, ...(safeDb.typography || {}) },
        randomBonuses: safeDb.randomBonuses || JSON.parse(JSON.stringify(defaults.randomBonuses)),
        music: Array.isArray(safeDb.music) ? safeDb.music : JSON.parse(JSON.stringify(defaults.music || []))
      };
      
      const dbXpUps = Array.isArray(safeDb.xpUpgrades) ? safeDb.xpUpgrades : [];
      const mergedXpUps = [...JSON.parse(JSON.stringify(defaults.xpUpgrades))];
      dbXpUps.forEach(dbUp => {
        const idx = mergedXpUps.findIndex(u => u.id === dbUp.id);
        if (idx >= 0) mergedXpUps[idx] = dbUp;
        else mergedXpUps.push(dbUp);
      });
      window.GAME_CONTENT.xpUpgrades = mergedXpUps;

      const dbLvlUps = Array.isArray(safeDb.levelUpgrades) ? safeDb.levelUpgrades : [];
      const mergedLvlUps = [...JSON.parse(JSON.stringify(defaults.levelUpgrades))];
      dbLvlUps.forEach(dbUp => {
        const idx = mergedLvlUps.findIndex(u => u.id === dbUp.id);
        if (idx >= 0) mergedLvlUps[idx] = dbUp;
        else mergedLvlUps.push(dbUp);
      });
      window.GAME_CONTENT.levelUpgrades = mergedLvlUps;
    }
  }

  // Backwards compatibility for the rest of the app:
  window.GENERATORS = window.GAME_CONTENT.generators;
  window.CLICK_UPGRADES = window.GAME_CONTENT.clickUpgrades;
  if (!window.ORIGINAL_ACH_CHECKS && window.ACHIEVEMENTS) {
    window.ORIGINAL_ACH_CHECKS = {};
    window.ACHIEVEMENTS.forEach(a => {
      if (typeof a.check === 'function') window.ORIGINAL_ACH_CHECKS[a.id] = a.check;
    });
  }

  window.ACHIEVEMENTS = window.GAME_CONTENT.achievements.map(a => {
    if (a.reqType) {
      a.check = (state) => {
        const val = Number(a.reqValue) || 0;
        switch(a.reqType) {
          case 'level': return (state.level || 0) >= val;
          case 'prestiges': return (state.prestigeCount || state.prestige || 0) >= val;
          case 'total_teeth': return (state.lifetimeEarned || state.totalEarned || 0) >= val;
          case 'specific_generator_count': return (state.generators?.[a.reqTargetId] || 0) >= val;
          case 'total_generators': return Object.values(state.generators || {}).reduce((sum, v) => sum + v, 0) >= val;
          case 'store_upgrades': return Object.values(state.storeUpgrades || {}).filter(Boolean).length >= val;
          case 'academy_upgrades': return Object.values(state.xpUpgrades || {}).filter(Boolean).length >= val;
          case 'playtime_minutes': return (state.timePlayed || 0) >= val * 60;
          case 'total_clicks': return (state.totalClicks || 0) >= val;
          case 'max_cps': return (state.maxCPS || 0) >= val;
          case 'golden_teeth': return (state.goldenClicks || 0) >= val;
          case 'correct_answers': return (state.correctAnswers || 0) >= val;
          case 'single_click_teeth': return (state.maxSingleClick || 0) >= val;
          default: return false;
        }
      };
    } else {
      a.check = window.ORIGINAL_ACH_CHECKS?.[a.id] || (() => false);
    }
    return a;
  });
  window.TOOTH_STAGES = window.GAME_CONTENT.toothStages;
  window.XP_UPGRADES = window.GAME_CONTENT.xpUpgrades;
  // LEVEL_UPGRADES removed
  window.STORE_UPGRADES = window.GAME_CONTENT.storeUpgrades;
};

window.applyGlobalStyles = function() {
  if (!window.GAME_CONTENT) return;
  const customFonts = window.GAME_CONTENT.typography?.customFonts || [];
  customFonts.forEach(font => {
    if (font.value && font.url && !document.getElementById(`font-${font.value}`)) {
      const style = document.createElement('style');
      style.id = `font-${font.value}`;
      style.innerHTML = `@font-face { font-family: "${font.value}"; src: url(${font.url}); }`;
      document.head.appendChild(style);
    }
  });
  
  const activeFont = window.GAME_CONTENT.typography?.font || 'PixelifySans';
  document.documentElement.style.setProperty('--active-font', `"${activeFont}"`);

  const customFavicon = window.GAME_CONTENT.terminology?.images?.favicon;
  if (customFavicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = customFavicon;
  }
};
