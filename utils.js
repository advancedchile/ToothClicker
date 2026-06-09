// Tooth Clicker — Shared utilities, constants, and state helpers
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const SAVES_KEY        = 'tooth-clicker-saves-v2';
const CURRENT_USER_KEY = 'tooth-clicker-current-user';
const LANG_KEY         = 'tooth-clicker-lang';
const SOUND_KEY        = 'tooth-clicker-sound';
const NUMFMT_KEY       = 'tooth-clicker-numfmt';
const USERS_KEY        = 'tooth-clicker-users';
const DEVICE_USER_KEY  = 'tooth-clicker-device-user';
const ADMIN_USERS_KEY  = 'tooth-clicker-admin-users';
const LB_RESET_KEY     = 'tooth-clicker-lb-reset-v3';
const LAST_RESET_KEY   = 'tooth-clicker-last-reset-v1';
const ADMIN_AUTH_KEY   = 'tooth-clicker-admin-session-v1';
const SESSION_ID_KEY   = 'tooth-clicker-session-id';
const ADMIN_NAME       = 'James'; // reserved superuser name

let MUSIC_TRACKS = [
  { id: '1', title: 'Cartucho Azul', src: 'assets/music/Cartucho_Azul.mp3', cover: 'https://img.icons8.com/color/96/music-record.png' },
  { id: '2', title: 'Cartucho Azul 2', src: 'assets/music/Cartucho_Azul_2.mp3', cover: 'https://img.icons8.com/color/96/music-record.png' },
  { id: '3', title: 'Respira en 8 Bits 1', src: 'assets/music/Respira_en_8_Bits_1.mp3', cover: 'https://img.icons8.com/color/96/music-record.png' },
  { id: '4', title: 'Respira en 8 Bits 2', src: 'assets/music/Respira_en_8_Bits_2.mp3', cover: 'https://img.icons8.com/color/96/music-record.png' }
];

function formatMusicTime(secs) {
  if (isNaN(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatTime(secs) {
  if (isNaN(secs)) return "0 min";
  const minsTotal = Math.floor(secs / 60);
  const lang = window.__lang || 'es';
  
  if (minsTotal < 60) {
    return `${minsTotal} min`;
  } else {
    const hours = Math.floor(minsTotal / 60);
    const mins = minsTotal % 60;
    if (lang === 'es') {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}${mins > 0 ? ` ${mins} min` : ''}`;
    } else {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}${mins > 0 ? ` ${mins} min` : ''}`;
    }
  }
}

window.playClickSound = () => {
  if (localStorage.getItem('tooth-clicker-sound') === '0') return;
  if (window.playTone) {
    window.playTone(880, 0.05, 'sine', 0.05);
  }
};

function loadAllSaves() {try {return JSON.parse(localStorage.getItem(SAVES_KEY) || '{}') || {};} catch (e) {return {};}}
function saveAllSaves(o) {try {localStorage.setItem(SAVES_KEY, JSON.stringify(o));} catch (e) {}}
function loadUserSave(u) {if (!u) return null;return loadAllSaves()[u] || null;}
function persistUserSave(u, s) {
  if (!u) return;
  const all = loadAllSaves();
  const oldPass = all[u] && all[u].password;
  all[u] = s ? { ...s } : {};
  if (s && s.password) all[u].password = s.password;
  else if (oldPass) all[u].password = oldPass;
  saveAllSaves(all);
}
function deleteUserSave(u) {const all = loadAllSaves();delete all[u];saveAllSaves(all);}

function loadUsers() {try {return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') || [];} catch (e) {return [];}}
function saveUsers(a) {try {localStorage.setItem(USERS_KEY, JSON.stringify(a));} catch (e) {}}

// Unified leaderboard reset logic
function resetAllProgress() {
  localStorage.removeItem(SAVES_KEY);
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(DEVICE_USER_KEY);
  window.cloudResetAll && window.cloudResetAll();
}

function defaultState() {
  return { teeth: 0, totalEarned: 0, lifetimeEarned: 0, totalClicks: 0, goldenClicks: 0, specialGoldClicks: 0, diamondClicks: 0, crystalClicks: 0, generators: {}, clickUpgrades: {}, achievements: {}, newAchievementIds: {}, storeUpgrades: {}, prestige: 0, prestigeCount: 0, selectedTooth: 0, startedAt: Date.now(), timePlayed: 0, lastTick: Date.now(), feedbackSent: false, feedbackCount: 0, dontShowTourAgain: false, hasSeenTour: false, hasSeenHelpIndicator: false, clinicName: null, level: 0, xp: 0, xpUpgrades: {}, musicSettings: { volume: 0.4, muted: false, playMode: 'shuffle', currentTrackId: null }, googleLinked: false };
}

window.getXPRequired = function(level) {
  if (level <= 0) return 100;
  // Polynomial scaling: 100 + 50 * (level ^ 1.5)
  return Math.floor(100 + 50 * Math.pow(level, 1.5));
};

window.computePassivePower = function(state, activeBonusEffects = []) {
  // Store multipliers
  const storeMults = { click: 1, global: 1, gen: {} };
  Object.keys(state.storeUpgrades || {}).forEach(id => {
    const up = (window.STORE_UPGRADES || []).find(u => u.id === id);
    if (!up) return;
    if (up.type === 'click') storeMults.click *= up.multiplier;
    if (up.type === 'global') storeMults.global *= up.multiplier;
    if (up.type === 'generator') storeMults.gen[up.targetId] = (storeMults.gen[up.targetId] || 1) * up.multiplier;
  });

  const bonusPerSmile = window.GAME_CONTENT?.prestigeConfig?.bonusPerSmile ?? 0.05;
  const prestigeMult = 1 + bonusPerSmile * (state.prestige || 0);
  const achMult = 1 + 0.01 * Object.values(state.achievements || {}).filter(Boolean).length;
  
  const academyGpsMult = (window.XP_UPGRADES || []).reduce((acc, up) => acc + (state.xpUpgrades?.[up.id] ? (up.gpsBonus || 0) : 0), 0);
  const totalAcademyGpsMult = 1 + academyGpsMult;

  const academyGenMults = {};
  (window.XP_UPGRADES || []).forEach(up => {
    if (state.xpUpgrades?.[up.id] && up.reqGeneratorId && up.genProdMult) {
      academyGenMults[up.reqGeneratorId] = (academyGenMults[up.reqGeneratorId] || 0) + up.genProdMult;
    }
  });

  let globalBonusMult = 1;
  activeBonusEffects.forEach(e => {
    if (e.type === 'multiplier_global' && e.until > Date.now()) {
      globalBonusMult *= (e.multiplier || 1);
    }
  });

  const globalMult = prestigeMult * achMult * storeMults.global * totalAcademyGpsMult * globalBonusMult;

  let perSecondRaw = 0;
  const genProductions = {};
  for (const g of (window.GENERATORS || [])) {
    let gProd = (state.generators?.[g.id] || 0) * (g.baseProduction ?? g.baseProd ?? 0);
    
    let academySpecificMult = 1 + (academyGenMults[g.id] || 0) / 100;
    gProd *= academySpecificMult;
    
    // Check dynamic bonus generator multiplier
    let genBonusMult = 1;
    activeBonusEffects.forEach(e => {
      if (e.type === 'multiplier_gen' && e.generatorId === g.id && e.until > Date.now()) {
        genBonusMult *= (e.multiplier || 1);
      }
    });
    
    if (storeMults.gen[g.id]) gProd *= storeMults.gen[g.id];
    gProd *= genBonusMult;
    
    perSecondRaw += gProd;
    genProductions[g.id] = gProd * globalMult;
  }

  const perSecond = perSecondRaw * globalMult;

  return { perSecond, perSecondRaw, globalMult, genProductions, storeMults };
};

// Shared button styles
const topBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '8px 12px', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', background: 'var(--bg-1)', fontFamily: 'var(--font-sans)' };
const primaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--primary-i100)', color: '#fff', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };
const secondaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--bg-3)', color: 'var(--fg-1)', borderRadius: 'var(--radius-s)', fontWeight: 500, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };
const debugBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '4px 8px', fontSize: 10, fontWeight: 700, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-2)', transition: 'all 100ms' };

// Global exports
Object.assign(window, { 
  formatMusicTime, formatTime, 
  loadAllSaves, saveAllSaves, loadUserSave, persistUserSave, deleteUserSave, 
  loadUsers, saveUsers, resetAllProgress, defaultState, 
  topBtnStyle, primaryBtnStyle, secondaryBtnStyle, debugBtnStyle,
  computePassivePower,
  getAchReqText: function(ach, lang) {
    if (!ach.reqType) return lang === 'es' ? 'Sigue jugando para descubrirlo' : 'Keep playing to discover';
    const val = window.formatNum ? window.formatNum(ach.reqValue) : ach.reqValue;
    switch (ach.reqType) {
      case 'level': return lang === 'es' ? `Alcanza el nivel ${val}` : `Reach level ${val}`;
      case 'prestiges': return lang === 'es' ? `Prestigia ${val} veces` : `Prestige ${val} times`;
      case 'total_teeth': return lang === 'es' ? `Gana ${val} dientes totales` : `Earn ${val} total teeth`;
      case 'specific_generator_count': 
        const gen = window.GENERATORS?.find(g => g.id === ach.reqTargetId);
        const genName = gen?.name?.[lang] || gen?.[lang] || gen?.name?.es || gen?.es || '???';
        return lang === 'es' ? `Ten ${val} ${genName}` : `Own ${val} ${genName}`;
      case 'total_generators': return lang === 'es' ? `Ten ${val} generadores en total` : `Own ${val} generators in total`;
      case 'store_upgrades': return lang === 'es' ? `Compra ${val} mejoras de tienda` : `Buy ${val} store upgrades`;
      case 'academy_upgrades': return lang === 'es' ? `Compra ${val} mejoras de academia` : `Buy ${val} academy upgrades`;
      case 'playtime_minutes': return lang === 'es' ? `Juega por ${val} minutos` : `Play for ${val} minutes`;
      case 'total_clicks': return lang === 'es' ? `Haz ${val} clicks` : `Make ${val} clicks`;
      case 'max_cps': return lang === 'es' ? `Alcanza ${val} CPS` : `Reach ${val} CPS`;
      case 'golden_teeth': return lang === 'es' ? `Atrapa ${val} dientes dorados` : `Catch ${val} golden teeth`;
      case 'correct_answers': return lang === 'es' ? `Responde ${val} trivias correctamente` : `Answer ${val} trivias correctly`;
      case 'single_click_teeth': return lang === 'es' ? `Gana ${val} dientes en un solo click` : `Earn ${val} teeth in a single click`;
      default: return lang === 'es' ? 'Sigue jugando para descubrirlo' : 'Keep playing to discover';
    }
  },
  getTerm: function(key, isPlural = false, overrideLang = null) {
    const lang = overrideLang || window.__lang || 'es';
    const termConfig = window.GAME_CONTENT?.terminology?.[key];
    
    let result = '';
    if (termConfig) {
      if (isPlural) {
        result = lang === 'es' ? (termConfig.esPlural || termConfig.es) : (termConfig.enPlural || termConfig.en);
      } else {
        result = lang === 'es' ? termConfig.es : termConfig.en;
      }
    }

    if (!result || result.trim() === '') {
      if (key === 'mainCurrency') return isPlural ? (lang === 'es' ? 'Dientes' : 'Teeth') : (lang === 'es' ? 'Diente' : 'Tooth');
      if (key === 'prestigeCurrency') return isPlural ? (lang === 'es' ? 'Sonrisas doradas' : 'Golden smiles') : (lang === 'es' ? 'Sonrisa dorada' : 'Golden smile');
      if (key === 'prestigeBonus') return lang === 'es' ? 'Bonus por sonrisa' : 'Smile bonus';
      if (key === 'goldenCurrency') return isPlural ? (lang === 'es' ? 'Dientes dorados' : 'Golden teeth') : (lang === 'es' ? 'Diente dorado' : 'Golden tooth');
      if (key === 'diamondCurrency') return isPlural ? (lang === 'es' ? 'Dientes de diamante' : 'Diamond teeth') : (lang === 'es' ? 'Diente de diamante' : 'Diamond tooth');
      if (key === 'crystalCurrency') return isPlural ? (lang === 'es' ? 'Dientes de cristal' : 'Crystal teeth') : (lang === 'es' ? 'Diente de cristal' : 'Crystal tooth');
      return key;
    }
    
    return result;
  },
  SAVES_KEY, CURRENT_USER_KEY, LANG_KEY, SOUND_KEY, NUMFMT_KEY, USERS_KEY, DEVICE_USER_KEY, ADMIN_USERS_KEY, LAST_RESET_KEY, ADMIN_AUTH_KEY, SESSION_ID_KEY, ADMIN_NAME, MUSIC_TRACKS
});

