// Tooth Clicker — i18n strings + formatNum helper
const STRINGS = {
  get es() {
    return {
      appName: 'Tooth Clicker', appSubtitle: 'Un experimento de Atom Labs',
      get teeth() { return window.getTerm('mainCurrency', true, 'es').toLowerCase(); }, perSecond: 'por segundo', perClick: 'por click',
      get clickMe() { return `Haz click en el ${window.getTerm('mainCurrency', false, 'es').toLowerCase()}`; }, totalClicks: 'Clicks totales',
      get totalTeeth() { return `${window.getTerm('mainCurrency', true, 'es')} totales`; }, timePlayed: 'Tiempo jugado', get currentTeeth() { return `${window.getTerm('mainCurrency', true, 'es')} actuales`; },
      get goldenMsg() { return `¡${window.getTerm('goldenCurrency', false, 'es')}! x7 durante 13 s`; }, goldenActive: 'Multiplicador x7 activo',
      tabClick: 'Click', tabGen: 'Generadores', tabAch: 'Logros',
      tabPrestige: 'Prestigio', tabStats: 'Estadísticas', tabLeaderboard: 'Ranking',
      buy: 'Comprar', owned: 'Cantidad', produces: 'Produce', cost: 'Coste',
      locked: 'Bloqueado', unlockAt: 'Se desbloquea a',
      get prestigeTitle() { return window.getTerm('prestigeCurrency', false, 'es'); },
      get prestigeDesc() { return `Reinicia tu clínica y generadores a cambio de ${window.getTerm('prestigeCurrency', true, 'es')} permanentes. Tu Nivel, XP y mejoras de Academia se mantienen.`; },
      prestigeEarn: 'Ganarás', get prestigeHave() { return window.getTerm('prestigeCurrency', true, 'es'); }, get prestigeBonus() { return window.getTerm('prestigeBonus', false, 'es'); },
      prestigeBtn: 'Reiniciar y prestigiar', get prestigeLock() { return `Necesitas al menos 1 ${window.getTerm('prestigeCurrency', false, 'es').toLowerCase()} para prestigiar`; },
      get confirmPrestige() { return `¿Seguro? Se reiniciarán tus ${window.getTerm('mainCurrency', true, 'es').toLowerCase()} y generadores, pero mantendrás tu Nivel y Academia.`; },
      ach_unlocked: 'Desbloqueado', ach_locked: 'Bloqueado',
      reset: 'Eliminar cuenta',
      confirmReset: 'Si eliminas tu cuenta perderás TODO el progreso del juego, tu usuario y tu puesto en el ranking. Esta acción no se puede deshacer. ¿Seguro?',
      lang: 'ES', saveNow: 'Guardar', savedJustNow: 'Guardado',
      logout: 'Cerrar sesión', menuOptions: 'Opciones',
      clickPowerTitle: 'Mejoras de click', get clickPowerSub() { return `Aumenta cuántos ${window.getTerm('mainCurrency', true, 'es').toLowerCase()} consigues por click`; },
      upgradeFilterAll: 'Todas', upgradeFilterUnlocked: 'Desbloqueadas', upgradeFilterLocked: 'Bloqueadas',
      generatorsTitle: 'Generadores', get generatorsSub() { return `Producen ${window.getTerm('mainCurrency', true, 'es').toLowerCase()} automáticamente cada segundo`; },
      achTitle: 'Logros', achSub: 'Recompensas por tus hitos. Cada uno otorga +1 % de producción permanente.',
      statsTitle: 'Estadísticas', soundOn: 'Sonido activado', soundOff: 'Sonido desactivado',
      toast_achieved: 'Logro desbloqueado', prestige: 'Prestigio',
      gateTabGame: 'Juego', gateTabLeaderboard: 'Ranking global',
      gateTitle: 'Tooth Clicker',
      get gateTagline() { return `Un clicker de Atom Labs. Recoge ${window.getTerm('mainCurrency', true, 'es').toLowerCase()}, abre clínicas, llega a la cima del ranking.`; },
      gateWelcomeBack: 'Bienvenido de vuelta', gateWelcomeBackSub: 'Continúa donde lo dejaste.',
      gateNameLabel: 'Tu nombre', gateNamePlaceholder: 'Escribe tu nombre',
      gatePlay: 'Empezar a jugar', gateContinue: 'Continuar partida',
      gateExisting: 'Este nombre ya está en uso en el ranking. Elige otro.',
      welcomeBackTitle: 'Bienvenido de vuelta', welcomeBackMsg: 'Mientras estabas fuera conseguiste',
      welcomeBackPatients: 'pacientes felices', welcomeBackCap: 'Las ganancias offline están limitadas a 2 horas.',
      welcomeBackContinue: 'Continuar jugando',
      lbTitle: 'Ranking global', lbSub: 'Ranking global en tiempo real.',
      lbEmpty: 'Aún no hay jugadores en el ranking. ¡Sé el primero!',
      lbLoading: 'Cargando ranking…', lbError: 'No se pudo conectar con el servidor',
      lbRetry: 'Reintentar', lbRefresh: 'Actualizar', lbLastUpdate: 'Actualizado hace',
      lbSec: 's', lbRank: '#', lbPlayer: 'Jugador', lbPrestige: 'Prestigio', get lbTotal() { return `${window.getTerm('mainCurrency', true, 'es')} totales`; }, lbYou: 'Tú',
    };
  },
  get en() {
    return {
      appName: 'Tooth Clicker', appSubtitle: 'An Atom Labs experiment',
      get teeth() { return window.getTerm('mainCurrency', true, 'en').toLowerCase(); }, perSecond: 'per second', perClick: 'per click',
      get clickMe() { return `Click the ${window.getTerm('mainCurrency', false, 'en').toLowerCase()}`; }, totalClicks: 'Total clicks',
      get totalTeeth() { return `All-time ${window.getTerm('mainCurrency', true, 'en').toLowerCase()}`; }, timePlayed: 'Time played', get currentTeeth() { return `Current ${window.getTerm('mainCurrency', true, 'en').toLowerCase()}`; },
      get goldenMsg() { return `${window.getTerm('goldenCurrency', false, 'en')}! x7 for 13 s`; }, goldenActive: 'x7 multiplier active',
      tabClick: 'Click', tabGen: 'Generators', tabAch: 'Achievements',
      tabPrestige: 'Prestige', tabStats: 'Stats', tabLeaderboard: 'Leaderboard',
      buy: 'Buy', owned: 'Owned', produces: 'Produces', cost: 'Cost',
      locked: 'Locked', unlockAt: 'Unlocks at',
      get prestigeTitle() { return window.getTerm('prestigeCurrency', false, 'en'); },
      get prestigeDesc() { return `Reset your clinic and generators in exchange for permanent ${window.getTerm('prestigeCurrency', true, 'en')}. Your Level, XP, and Academy upgrades are preserved.`; },
      prestigeEarn: 'You will earn', get prestigeHave() { return window.getTerm('prestigeCurrency', true, 'en'); }, get prestigeBonus() { return window.getTerm('prestigeBonus', false, 'en'); },
      prestigeBtn: 'Reset and prestige', get prestigeLock() { return `You need at least 1 ${window.getTerm('prestigeCurrency', false, 'en').toLowerCase()} to prestige`; },
      get confirmPrestige() { return `Are you sure? Your ${window.getTerm('mainCurrency', true, 'en').toLowerCase()} and generators will reset, but you will keep your Level and Academy.`; },
      ach_unlocked: 'Unlocked', ach_locked: 'Locked',
      reset: 'Delete account',
      confirmReset: 'Deleting your account will erase ALL game progress, your user and your leaderboard position. This cannot be undone. Are you sure?',
      lang: 'EN', saveNow: 'Save', savedJustNow: 'Saved',
      logout: 'Log out', menuOptions: 'Options',
      clickPowerTitle: 'Click upgrades', get clickPowerSub() { return `Increase how many ${window.getTerm('mainCurrency', true, 'en').toLowerCase()} each click produces`; },
      upgradeFilterAll: 'All', upgradeFilterUnlocked: 'Unlocked', upgradeFilterLocked: 'Locked',
      generatorsTitle: 'Generators', get generatorsSub() { return `They produce ${window.getTerm('mainCurrency', true, 'en').toLowerCase()} automatically every second`; },
      achTitle: 'Achievements', achSub: 'Rewards for your milestones. Each grants +1 % permanent production.',
      statsTitle: 'Stats', soundOn: 'Sound on', soundOff: 'Sound off',
      toast_achieved: 'Achievement unlocked', prestige: 'Prestige',
      gateTabGame: 'Game', gateTabLeaderboard: 'Global leaderboard',
      gateTitle: 'Tooth Clicker',
      get gateTagline() { return `An Atom Labs clicker. Collect ${window.getTerm('mainCurrency', true, 'en').toLowerCase()}, open clinics, top the leaderboard.`; },
      gateWelcomeBack: 'Welcome back', gateWelcomeBackSub: 'Continue where you left off.',
      gateNameLabel: 'Your name', gateNamePlaceholder: 'Type your name',
      gatePlay: 'Start playing', gateContinue: 'Continue game',
      gateExisting: 'This name is already in the leaderboard. Pick another.',
      welcomeBackTitle: 'Welcome back', welcomeBackMsg: 'While you were away you earned',
      welcomeBackPatients: 'happy patients', welcomeBackCap: 'Offline earnings are capped at 2 hours.',
      welcomeBackContinue: 'Keep playing',
      lbTitle: 'Global leaderboard', lbSub: 'Live global ranking.',
      lbEmpty: 'No players yet. Be the first!',
      lbLoading: 'Loading leaderboard…', lbError: "Couldn't reach the server",
      lbRetry: 'Retry', lbRefresh: 'Refresh', lbLastUpdate: 'Updated',
      lbSec: 's ago', lbRank: '#', lbPlayer: 'Player', lbPrestige: 'Prestige', get lbTotal() { return `All-time ${window.getTerm('mainCurrency', true, 'en').toLowerCase()}`; }, lbYou: 'You',
    };
  }
};

function formatNum(n, modeOverride, langOverride, keepDecimals = false) {
  const mode = modeOverride || window.__numFormat || 'short';
  const lang = langOverride || window.__lang || 'es';
  return window.formatNumWithMode(n, mode, lang, keepDecimals);
}

// Tooth stage progression — unlocked by NUMBER OF PRESTIGES PERFORMED (prestigeCount), not by prestige points.
const TOOTH_STAGES = [
  { img: 'uploads/tooth1.png',             prestige: 0,        es: 'Diente descompuesto',  en: 'Rotten tooth' },
  { img: 'uploads/tooth2.png',             prestige: 1,        es: 'Diente con caries',    en: 'Cavity tooth' },
  { img: 'uploads/tooth3.png',             prestige: 3,        es: 'Diente deteriorado',   en: 'Damaged tooth' },
  { img: 'uploads/tooth4.png',             prestige: 10,       es: 'Diente preocupado',    en: 'Worried tooth' },
  { img: 'uploads/tooth5.png',             prestige: 25,       es: 'Diente amarillo',      en: 'Yellow tooth' },
  { img: 'uploads/tooth6.png',             prestige: 60,       es: 'Diente apagado',       en: 'Dull tooth' },
  { img: 'uploads/tooth7.png',             prestige: 125,      es: 'Diente neutral',       en: 'Neutral tooth' },
  { img: 'uploads/tooth8.png',             prestige: 300,      es: 'Diente contento',      en: 'Content tooth' },
  { img: 'uploads/tooth9.png',             prestige: 650,      es: 'Diente feliz',         en: 'Happy tooth' },
  { img: 'uploads/tooth10.png',            prestige: 1500,     es: 'Diente muy feliz',     en: 'Very happy tooth' },
  { img: 'uploads/tooth11.png',            prestige: 3500,     es: 'Diente brillante',     en: 'Bright tooth' },
  { img: 'uploads/tooth12.png',            prestige: 8000,     es: 'Diente carcajada',     en: 'Laughing tooth' },
  { img: 'uploads/tooth13-c01eb4d6.png',   prestige: 18000,    es: 'Diente radiante',      en: 'Radiant tooth' },
  { img: 'uploads/tooth14.png',            prestige: 40000,    es: 'Diente estrella',      en: 'Star tooth' },
  { img: 'uploads/tooth15.png',            prestige: 100000,   es: 'Diente celestial',     en: 'Celestial tooth' },
  { img: 'uploads/tooth16.png',            prestige: 250000,   es: 'Diente legendario',    en: 'Legendary tooth' },
  { img: 'uploads/tooth17.png',            prestige: 600000,   es: 'Diente supremo',       en: 'Supreme tooth' },
  { img: 'uploads/tooth18.png',            prestige: 1500000,  es: 'Diente definitivo',    en: 'Ultimate tooth' },
];

window.isToothUnlocked = function(state, s) {
  if (!s || !state) return false;
  let unlocked = (state.prestigeCount || 0) >= (s.prestige || 0) && (state.level || 1) >= (s.reqLevel || 0);
  
  if (unlocked && s.reqGenId && s.reqGenQty) {
    unlocked = unlocked && (state.generators?.[s.reqGenId] || 0) >= s.reqGenQty;
  }
  
  if (unlocked && s.reqAcademyUpgrades && s.reqAcademyUpgrades.length > 0) {
    unlocked = unlocked && s.reqAcademyUpgrades.every(id => !!state.xpUpgrades?.[id]);
  }
  
  return unlocked;
};

// prestigeCount = number of times the player has performed a prestige reset
// level = current player level
function getToothStage(prestigeCount, level = 1, fullState = null) {
  const stages = window.TOOTH_STAGES || TOOTH_STAGES;
  if (!stages || stages.length === 0) {
    return { img: 'uploads/tooth1.png', es: 'Diente base', en: 'Base tooth' };
  }
  let stage = stages[0];
  for (const s of stages) { 
    let unlocked = false;
    if (fullState) {
      unlocked = window.isToothUnlocked(fullState, s);
    } else {
      unlocked = (prestigeCount || 0) >= s.prestige && level >= (s.reqLevel || 0);
    }
    if (unlocked) {
      stage = s;
    }
  }
  
  const customImg = window.GAME_CONTENT?.terminology?.images?.mainCurrency;
  if (customImg) {
    return { ...stage, img: customImg };
  }
  
  return stage;
}

Object.assign(window, { STRINGS, formatNum, TOOTH_STAGES, getToothStage, isToothUnlocked });
