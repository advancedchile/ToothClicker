// Tooth Clicker — Main App + Game component
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const SAVES_KEY = 'tooth-clicker-saves-v2';
const CURRENT_USER_KEY = 'tooth-clicker-current-user';
const LANG_KEY = 'tooth-clicker-lang';
const SOUND_KEY = 'tooth-clicker-sound';
const NUMFMT_KEY = 'tooth-clicker-numfmt';
const USERS_KEY = 'tooth-clicker-users'; // public users list
const DEVICE_USER_KEY = 'tooth-clicker-device-user'; // the 1 user this device owns
const ADMIN_USERS_KEY = 'tooth-clicker-admin-users'; // admin's private accounts
const LB_RESET_KEY = 'tooth-clicker-lb-reset-v3'; // one-time leaderboard wipe flag

function loadAllSaves() {try {return JSON.parse(localStorage.getItem(SAVES_KEY) || '{}') || {};} catch (e) {return {};}}
function saveAllSaves(o) {try {localStorage.setItem(SAVES_KEY, JSON.stringify(o));} catch (e) {}}
function loadUserSave(u) {if (!u) return null;return loadAllSaves()[u] || null;}
function persistUserSave(u, s) {if (!u) return;const all = loadAllSaves();all[u] = s;saveAllSaves(all);}
function deleteUserSave(u) {const all = loadAllSaves();delete all[u];saveAllSaves(all);}

function loadUsers() {try {return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') || [];} catch (e) {return [];}}
function saveUsers(a) {try {localStorage.setItem(USERS_KEY, JSON.stringify(a));} catch (e) {}}
function loadAdminUsers() {try {return JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || '[]') || [];} catch (e) {return [];}}
function saveAdminUsers(a) {try {localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(a));} catch (e) {}}

function resetAllProgress() {
  localStorage.removeItem(SAVES_KEY);
  window.cloudResetAll && window.cloudResetAll();
}

// One-time leaderboard wipe on first load of this version
if (!localStorage.getItem(LB_RESET_KEY)) {
  localStorage.setItem(LB_RESET_KEY, '1');
  setTimeout(() => {window.cloudResetAll && window.cloudResetAll();}, 1000);
}

function defaultState() {
  return { teeth: 0, totalEarned: 0, totalClicks: 0, goldenClicks: 0, generators: {}, clickUpgrades: {}, achievements: {}, prestige: 0, selectedTooth: 0, startedAt: Date.now(), timePlayed: 0, lastTick: Date.now() };
}

const topBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '8px 12px', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', background: 'var(--bg-1)', fontFamily: 'var(--font-sans)' };
const primaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--primary-i100)', color: '#fff', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };
const secondaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--bg-3)', color: 'var(--fg-1)', borderRadius: 'var(--radius-s)', fontWeight: 500, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };

function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(5,9,13,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeIn 150ms ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-1)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-m)', boxShadow: 'var(--elevation-30)', maxWidth: 420, width: '92%', animation: 'modalIn 200ms ease', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>);

}

function MenuItem({ icon, label, onClick, danger, trailing }) {
  const [hover, setHover] = useState(false);
  const color = danger ? 'var(--negative-i100)' : 'var(--fg-1)';
  return (
    <button role="menuitem" onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ all: 'unset', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, cursor: 'pointer', background: hover ? danger ? 'var(--negative-i010)' : 'var(--bg-3)' : 'transparent', color, fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>
      <i className={`fa-solid ${icon}`} style={{ width: 16, textAlign: 'center', color }}></i>
      <span style={{ flex: 1 }}>{label}</span>
      {trailing}
    </button>);

}
function MenuDivider() {return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 2px' }} />;}

function Game({ username, lang: initialLang, onLangChange, onLogout, onDeleteUser, numFormat: initialNumFormat, onNumFormatChange }) {
  const bootRef = useRef(null);
  if (bootRef.current === null) {
    const OFFLINE_CAP_S = 2 * 60 * 60;
    const snap = loadUserSave(username);
    let info = null;
    if (snap && snap.lastTick) {
      const elapsed = Math.max(0, (Date.now() - snap.lastTick) / 1000);
      if (elapsed >= 30) {
        const capped = Math.min(elapsed, OFFLINE_CAP_S);
        let passive = 0;
        for (const g of window.GENERATORS) passive += (snap.generators?.[g.id] || 0) * g.baseProduction;
        const pMult = 1 + 0.05 * (snap.prestige || 0);
        const aMult = 1 + 0.01 * Object.values(snap.achievements || {}).filter(Boolean).length;
        const earned = passive * pMult * aMult * capped;
        if (earned > 0) info = { elapsedSeconds: elapsed, cappedSeconds: capped, wasCapped: elapsed > OFFLINE_CAP_S, earned };
      }
    }
    bootRef.current = { saved: snap, offlineInfo: info };
  }
  const saved = bootRef.current.saved;
  const offlineInfo = bootRef.current.offlineInfo;

  const [state, setState] = useState(() => {
    if (!saved) return defaultState();
    const base = { ...defaultState(), ...saved };
    if (offlineInfo) return { ...base, teeth: (base.teeth || 0) + offlineInfo.earned, totalEarned: (base.totalEarned || 0) + offlineInfo.earned, lastTick: Date.now() };
    return { ...base, lastTick: Date.now() };
  });
  const [showWelcomeBack, setShowWelcomeBack] = useState(() => !!offlineInfo);
  const [lang, setLangLocal] = useState(initialLang);
  const [numFormat, setNumFormatLocal] = useState(initialNumFormat || 'short');
  if (typeof window !== 'undefined') {window.__numFormat = numFormat;window.__lang = lang;}
  const fmt = useCallback((n) => window.formatNumWithMode(n, numFormat, lang), [numFormat, lang]);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== '0');
  const [tab, setTab] = useState('generators');
  const [floats, setFloats] = useState([]);
  const [golden, setGolden] = useState(null);
  const [goldenActiveUntil, setGoldenActiveUntil] = useState(0);
  const [toast, setToast] = useState(null);
  const [clickPulse, setClickPulse] = useState(0);
  const [saveFlash, setSaveFlash] = useState(false);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [newToothUnlock, setNewToothUnlock] = useState(null); // { stage, idx }
  const [buyQty, setBuyQty] = useState(1);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);};
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const stateRef = useRef(state);stateRef.current = state;
  const soundRef = useRef(soundOn);soundRef.current = soundOn;
  const t = window.STRINGS[lang];

  const prestigeMult = 1 + 0.05 * (state.prestige || 0);
  const achMult = 1 + 0.01 * Object.values(state.achievements || {}).filter(Boolean).length;
  const perSecondRaw = useMemo(() => {let v = 0;for (const g of window.GENERATORS) v += (state.generators[g.id] || 0) * g.baseProduction;return v;}, [state.generators]);
  const clickBase = useMemo(() => window.computeClickPower(state, perSecondRaw).total, [state.clickUpgrades, state.generators, state.achievements, state.timePlayed, perSecondRaw]);
  const goldenMult = goldenActiveUntil > Date.now() ? 7 : 1;
  const globalMult = prestigeMult * achMult * goldenMult;
  const perClick = clickBase * globalMult;
  // Displayed tooth: player-selected if unlocked, else auto (highest unlocked)
  const autoStage = window.getToothStage(state.prestige);
  const selectedStage = (() => {
    const s = window.TOOTH_STAGES[state.selectedTooth || 0];
    if (s && (state.prestige || 0) >= s.prestige) return s;
    return autoStage;
  })();
  const perSecond = perSecondRaw * globalMult;
  const genProductions = useMemo(() => {const out = {};for (const g of window.GENERATORS) out[g.id] = (state.generators[g.id] || 0) * g.baseProduction * globalMult;return out;}, [state.generators, globalMult]);
  const achUnlockedCount = Object.values(state.achievements || {}).filter(Boolean).length;
  const prestigeGain = useMemo(() => {const base = Math.max(0, state.totalEarned - 1_000_000);if (base <= 0) return 0;return Math.floor(Math.pow(base / 1_000_000_000, 0.5) * 15);}, [state.totalEarned]);

  // Game tick
  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => {
        const now = Date.now();
        const dt = (now - s.lastTick) / 1000;
        let v = 0;for (const g of window.GENERATORS) v += (s.generators[g.id] || 0) * g.baseProduction;
        const pMult = 1 + 0.05 * (s.prestige || 0);
        const aMult = 1 + 0.01 * Object.values(s.achievements || {}).filter(Boolean).length;
        const gMult = goldenActiveUntil > now ? 7 : 1;
        const earned = v * pMult * aMult * gMult * dt;
        return { ...s, teeth: s.teeth + earned, totalEarned: s.totalEarned + earned, timePlayed: s.timePlayed + dt, lastTick: now };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [goldenActiveUntil]);

  // Autosave
  const doManualSave = useCallback(() => {
    try {persistUserSave(username, stateRef.current);setSaveFlash(true);setTimeout(() => setSaveFlash(false), 1500);const s = stateRef.current;if (s) window.cloudSubmitScore({ name: username, totalEarned: s.totalEarned || 0, prestige: s.prestige || 0, timePlayed: s.timePlayed || 0, teeth: s.teeth || 0 });} catch (e) {}
  }, [username]);

  useEffect(() => {
    const saveId = setInterval(() => {try {persistUserSave(username, stateRef.current);setSaveFlash(true);setTimeout(() => setSaveFlash(false), 1500);} catch (e) {}}, 60000);
    const onUnload = () => {try {persistUserSave(username, stateRef.current);} catch (e) {}};
    window.addEventListener('beforeunload', onUnload);
    return () => {clearInterval(saveId);window.removeEventListener('beforeunload', onUnload);onUnload();};
  }, [username]);

  useEffect(() => {
    const pushScore = () => {const s = stateRef.current;if (!s) return;window.cloudSubmitScore({ name: username, totalEarned: s.totalEarned || 0, prestige: s.prestige || 0, timePlayed: s.timePlayed || 0, teeth: s.teeth || 0 });};
    const first = setTimeout(pushScore, 10000);
    const id = setInterval(pushScore, 30000);
    window.addEventListener('beforeunload', pushScore);
    return () => {clearTimeout(first);clearInterval(id);window.removeEventListener('beforeunload', pushScore);pushScore();};
  }, [username]);

  // Achievement checker
  useEffect(() => {
    const newUnlocks = [];
    for (const a of window.ACHIEVEMENTS) {if (!state.achievements[a.id] && a.check(state)) newUnlocks.push(a);}
    if (newUnlocks.length > 0) {
      setState((s) => {const next = { ...s, achievements: { ...s.achievements } };for (const a of newUnlocks) next.achievements[a.id] = true;return next;});
      const a = newUnlocks[0];setToast(a);setTimeout(() => setToast(null), 3500);
      if (soundRef.current) {window.playTone(660, 0.12, 'triangle', 0.06);setTimeout(() => window.playTone(880, 0.12, 'triangle', 0.06), 100);}
    }
  }, [state.totalClicks, state.totalEarned, state.generators, state.prestige, state.goldenClicks, state.clickUpgrades, state.timePlayed]);

  // Golden tooth spawner
  useEffect(() => {
    let timeoutId;
    function spawnGolden() {
      const w = window.innerWidth;const h = window.innerHeight;
      const x = 80 + Math.random() * (w - 160);const y = 120 + Math.random() * (h - 240);
      const id = Math.random().toString(36);
      setGolden({ x, y, id, spawnedAt: Date.now() });
      setTimeout(() => setGolden((g) => g && g.id === id ? null : g), 13000);
    }
    function scheduleNext() {timeoutId = setTimeout(() => {spawnGolden();scheduleNext();}, 60000 + Math.random() * 120000);}
    timeoutId = setTimeout(() => {spawnGolden();scheduleNext();}, 45000 + Math.random() * 30000);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;const y = e.clientY - rect.top;
    const gain = perClick;
    setState((s) => ({ ...s, teeth: s.teeth + gain, totalEarned: s.totalEarned + gain, totalClicks: s.totalClicks + 1 }));
    setFloats((f) => [...f, { id: Math.random(), x, y, gain, born: Date.now() }]);
    setClickPulse((p) => p + 1);
    if (soundRef.current) window.playTone(520 + Math.random() * 40, 0.06, 'sine', 0.03);
  }, [perClick]);

  useEffect(() => {
    if (floats.length === 0) return;
    const id = setTimeout(() => setFloats((f) => f.filter((x) => Date.now() - x.born < 1000)), 1100);
    return () => clearTimeout(id);
  }, [floats]);

  const handleGoldenClick = useCallback(() => {
    setGolden(null);setGoldenActiveUntil(Date.now() + 13000);
    setState((s) => ({ ...s, goldenClicks: s.goldenClicks + 1 }));
    if (soundRef.current) {window.playTone(880, 0.1, 'triangle', 0.08);setTimeout(() => window.playTone(1320, 0.15, 'triangle', 0.08), 80);}
  }, []);

  const genBulkCost = useCallback((base, owned, qty) => {
    // sum of geometric series: base * 1.15^owned * (1.15^qty - 1) / 0.15
    const SCALE = 1.15;
    return base * Math.pow(SCALE, owned) * (Math.pow(SCALE, qty) - 1) / (SCALE - 1);
  }, []);

  const buyGenerator = useCallback((genId, qty) => {
    const amount = qty || 1;
    setState((s) => {
      const gen = window.GENERATORS.find((x) => x.id === genId);
      const owned = s.generators[genId] || 0;
      let cost, actualBuy;
      if (amount === 1) {
        cost = window.genCost(gen.baseCost, owned);
        actualBuy = 1;
      } else {
        // Buy as many as we can afford up to `amount`
        let total = 0;actualBuy = 0;
        for (let i = 0; i < amount; i++) {
          const c = window.genCost(gen.baseCost, owned + i);
          if (total + c > s.teeth) break;
          total += c;actualBuy++;
        }
        cost = total;
      }
      if (actualBuy === 0 || s.teeth < cost) return s;
      if (soundRef.current) window.playTone(700, 0.08, 'square', 0.04);
      return { ...s, teeth: s.teeth - cost, generators: { ...s.generators, [genId]: owned + actualBuy } };
    });
  }, []);

  const buyClickUpgrade = useCallback((upId) => {
    setState((s) => {
      if (s.clickUpgrades[upId]) return s;
      const up = window.CLICK_UPGRADES.find((x) => x.id === upId);
      if (s.teeth < up.cost) return s;
      if (soundRef.current) {window.playTone(800, 0.08, 'triangle', 0.05);setTimeout(() => window.playTone(1000, 0.08, 'triangle', 0.05), 60);}
      return { ...s, teeth: s.teeth - up.cost, clickUpgrades: { ...s.clickUpgrades, [upId]: true } };
    });
  }, []);

  const doPrestige = useCallback(() => {
    setShowPrestigeConfirm(false);
    if (prestigeGain <= 0) return;
    const oldPrestige = stateRef.current?.prestige || 0;
    const newPrestige = oldPrestige + prestigeGain;
    // Find newly unlocked stages
    const newlyUnlocked = window.TOOTH_STAGES.filter((s) => s.prestige > 0 && s.prestige > oldPrestige && s.prestige <= newPrestige);
    setState((s) => ({ ...defaultState(), prestige: newPrestige, selectedTooth: s.selectedTooth || 0, achievements: s.achievements, startedAt: s.startedAt, timePlayed: s.timePlayed, totalClicks: s.totalClicks, goldenClicks: s.goldenClicks, lastTick: Date.now() }));
    if (soundRef.current) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => window.playTone(f, 0.15, 'triangle', 0.06), i * 80));
    if (newlyUnlocked.length > 0) {
      const latestUnlocked = newlyUnlocked[newlyUnlocked.length - 1];
      const idx = window.TOOTH_STAGES.indexOf(latestUnlocked);
      setTimeout(() => setNewToothUnlock({ stage: latestUnlocked, idx }), 600);
    }
  }, [prestigeGain]);

  const doReset = useCallback(() => {
    setShowResetConfirm(false);deleteUserSave(username);
    try {window.cloudDeleteScore(username);} catch (e) {}
    setState(defaultState());onDeleteUser && onDeleteUser();
  }, [username, onDeleteUser]);

  const toggleLang = useCallback(() => {
    setLangLocal((l) => {const n = l === 'es' ? 'en' : 'es';localStorage.setItem(LANG_KEY, n);onLangChange && onLangChange(n);return n;});
  }, [onLangChange]);

  const toggleSound = useCallback(() => {setSoundOn((s) => {localStorage.setItem(SOUND_KEY, s ? '0' : '1');return !s;});}, []);

  const cycleNumFormat = useCallback(() => {
    const order = ['short', 'long', 'engineering', 'scientific'];
    setNumFormatLocal((m) => {const next = order[(order.indexOf(m) + 1) % order.length];try {localStorage.setItem(NUMFMT_KEY, next);} catch (e) {}onNumFormatChange && onNumFormatChange(next);return next;});
  }, [onNumFormatChange]);

  const genStatus = window.GENERATORS.map((g) => {
    const owned = state.generators[g.id] || 0;
    let cost, canAfford, actualQty;
    if (buyQty === 1) {
      cost = window.genCost(g.baseCost, owned);
      canAfford = state.teeth >= cost;
      actualQty = 1;
    } else {
      // Calculate how many we can actually afford (up to buyQty)
      let total = 0;actualQty = 0;
      for (let i = 0; i < buyQty; i++) {
        const c = window.genCost(g.baseCost, owned + i);
        if (total + c > state.teeth) break;
        total += c;actualQty++;
      }
      cost = genBulkCost(g.baseCost, owned, buyQty);
      canAfford = actualQty >= buyQty; // can afford the full requested qty
    }
    const unlocked = state.totalEarned >= g.unlockAt || owned > 0;
    const revealed = state.totalEarned >= g.unlockAt * 0.5 || owned > 0 || window.GENERATORS.indexOf(g) === 0;
    return { gen: g, owned, cost, unlocked, revealed, canAfford, actualQty, production: genProductions[g.id] };
  });

  const [clickFilter, setClickFilter] = React.useState('all');
  const clickStatus = window.CLICK_UPGRADES.map((u) => ({ up: u, purchased: !!state.clickUpgrades[u.id], unlocked: state.totalEarned >= u.unlockAt, canAfford: state.teeth >= u.cost }));
  const filteredClickStatus = clickStatus.filter((c) => {
    if (clickFilter === 'unlocked') return c.unlocked;
    if (clickFilter === 'locked') return !c.unlocked;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', fontFamily: 'var(--font-sans)', color: 'var(--fg-1)' }}>
      {/* Top bar */}
      <header style={{ height: 64, background: 'var(--bg-1)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 var(--spacing-6)', gap: 'var(--spacing-4)', position: 'sticky', top: 0, zIndex: 10 }}>
        <img src="uploads/logo-horizontal-4d4fb63d.png" style={{ height: 44, width: 'auto', objectFit: 'contain', flexShrink: 0 }} alt="Tooth Clicker" />
        <div style={{ flex: 1 }} />
        {/* Inline stats — single line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-tooth" style={{ fontSize: 13, color: 'var(--primary-i100)' }}></i>
            <div>
              <span className="t-mini-caps" style={{ color: 'var(--fg-3)', marginRight: 6 }}>{t.currentTeeth}</span>
              <span className="t-heading-s" style={{ color: 'var(--primary-i100)', fontVariantNumeric: 'tabular-nums' }}>{fmt(state.teeth)}</span>
              <span className="t-body-s" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{fmt(perSecond)}/s</span>
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-hand-pointer" style={{ fontSize: 13, color: 'var(--alternative-i100)' }}></i>
            <div>
              <span className="t-mini-caps" style={{ color: 'var(--fg-3)', marginRight: 6 }}>{t.perClick}</span>
              <span className="t-heading-s" style={{ color: 'var(--alternative-i100)', fontVariantNumeric: 'tabular-nums' }}>{fmt(perClick)}</span>
              {globalMult > 1 && <span className="t-body-s" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>x{globalMult.toFixed(1)}</span>}
            </div>
          </div>
        </div>
        {goldenActiveUntil > Date.now() &&
        <div style={{ padding: '6px 12px', background: 'var(--warning-i010)', border: '1px solid var(--warning-i050)', borderRadius: 'var(--radius-pill)', color: 'var(--warning-i130)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 1s ease-in-out infinite' }}>
            <i className="fa-solid fa-bolt"></i>{t.goldenActive} — {Math.max(0, Math.ceil((goldenActiveUntil - Date.now()) / 1000))}s
          </div>
        }
        <div style={{ padding: '6px 10px 6px 8px', background: 'var(--primary-i010)', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-i100)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11 }}>{(username[0] || '?').toUpperCase()}</div>
          <div className="t-body-s" style={{ color: 'var(--primary-i130)', fontWeight: 500 }}>{username}</div>
        </div>
        <button onClick={doManualSave} style={topBtnStyle} title={t.saveNow}>
          <i className={saveFlash ? 'fa-solid fa-check' : 'fa-solid fa-floppy-disk'} style={{ marginRight: 6, color: saveFlash ? 'var(--positive-i100)' : 'inherit' }}></i>
          {saveFlash ? t.savedJustNow : t.saveNow}
        </button>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen((o) => !o)} style={{ ...topBtnStyle, background: menuOpen ? 'var(--bg-3)' : 'transparent' }}>
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
          {menuOpen &&
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 220, background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', boxShadow: 'var(--elevation-20)', padding: 6, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <MenuItem icon={soundOn ? 'fa-volume-high' : 'fa-volume-xmark'} label={soundOn ? t.soundOn : t.soundOff} onClick={toggleSound} />
              <MenuItem icon="fa-language" label={lang === 'es' ? 'Español' : 'English'} trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'EN →' : 'ES →'}</span>} onClick={toggleLang} />
              <MenuItem icon="fa-hashtag" label={lang === 'es' ? 'Formato numérico' : 'Number format'} trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{{ short: '1.2M', long: lang === 'es' ? 'millón' : 'million', engineering: '1.2e6', scientific: '10^6' }[numFormat]} →</span>} onClick={cycleNumFormat} />
              <MenuItem icon="fa-circle-info" label={lang === 'es' ? 'Acerca de' : 'About'} onClick={() => {setMenuOpen(false);setShowAbout(true);}} />
              <MenuDivider />
              <MenuItem icon="fa-right-from-bracket" label={t.logout} onClick={() => {setMenuOpen(false);try {persistUserSave(username, stateRef.current);} catch (e) {}try {const s = stateRef.current;if (s) window.cloudSubmitScore({ name: username, totalEarned: s.totalEarned || 0, prestige: s.prestige || 0, timePlayed: s.timePlayed || 0, teeth: s.teeth || 0 });} catch (e) {}onLogout && onLogout();}} />
              <MenuItem icon="fa-trash" label={t.reset} danger onClick={() => {setMenuOpen(false);setShowResetConfirm(true);}} />
            </div>
          }
        </div>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: 'minmax(380px,1fr) minmax(560px,1.4fr)', gap: 'var(--spacing-6)', padding: 'var(--spacing-6)', maxWidth: 1440, margin: '0 auto', alignItems: 'start' }}>
        {/* LEFT — sticky */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', position: 'sticky', top: 72, alignSelf: 'start' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', padding: 'var(--spacing-8) var(--spacing-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-5)', boxShadow: 'var(--elevation-10)' }}>
            <div onClick={handleClick} style={{ position: 'relative', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', transition: 'transform 80ms ease-out', transform: `scale(${1 - clickPulse % 2 * 0.04})` }} key={clickPulse}>
              <img src={selectedStage.img} alt="tooth" style={{ width: 260, height: 260, objectFit: 'contain', filter: goldenMult > 1 ? 'drop-shadow(0 0 24px #FFC22088) sepia(0.4) saturate(2) hue-rotate(10deg)' : 'drop-shadow(0 8px 24px rgba(0,118,219,0.18))' }} />
              {floats.map((f) =>
              <div key={f.id} style={{ position: 'absolute', left: f.x, top: f.y, pointerEvents: 'none', transform: 'translate(-50%,-50%)', color: goldenMult > 1 ? 'var(--warning-i100)' : 'var(--primary-i100)', fontWeight: 700, fontSize: 22, textShadow: '0 2px 8px rgba(0,0,0,0.18)', animation: 'floatUp 1s ease-out forwards', fontVariantNumeric: 'tabular-nums' }}>+{fmt(f.gain)}</div>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="t-heading-m">{t.clickMe}</div>
              <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4 }}>+{fmt(perClick)} {t.teeth} / click</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <window.StatTile label={t.totalClicks} value={fmt(state.totalClicks)} icon="fa-solid fa-hand-pointer" />
            <window.StatTile label={t.timePlayed} value={window.formatTime(state.timePlayed)} icon="fa-solid fa-clock" />
          </div>
          {/* Tooth stage indicator */}
          {(() => {
            const stage = selectedStage;
            const stageIdx = window.TOOTH_STAGES.indexOf(stage);
            const nextStage = window.TOOTH_STAGES[stageIdx + 1];
            return (
              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', padding: 'var(--spacing-3) var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={stage.img} style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-heading-xs" style={{ color: 'var(--fg-1)' }}>{stage[lang] || stage.es}</div>
                  {nextStage && <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? `Próximo en prestigio ${nextStage.prestige}` : `Next at prestige ${nextStage.prestige}`}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {window.TOOTH_STAGES.map((s, i) =>
                  <div key={i} style={{ width: i === stageIdx ? 10 : 6, height: i === stageIdx ? 10 : 6, borderRadius: '50%', background: i <= stageIdx ? 'var(--primary-i100)' : 'var(--neutral-i020)', transition: 'all 200ms', flexShrink: 0 }} />
                  )}
                </div>
              </div>);

          })()}
        </section>

        {/* RIGHT */}
        <section style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', padding: 'var(--spacing-5) var(--spacing-6) var(--spacing-6)', minHeight: 620, boxShadow: 'var(--elevation-10)' }}>
          <window.TabBar active={tab} onChange={setTab} tabs={[
          { id: 'generators', label: t.tabGen, icon: 'fa-solid fa-industry' },
          { id: 'click', label: t.tabClick, icon: 'fa-solid fa-hand-pointer' },
          { id: 'achievements', label: t.tabAch, icon: 'fa-solid fa-trophy', badge: `${achUnlockedCount}/${window.ACHIEVEMENTS.length}` },
          { id: 'prestige', label: t.tabPrestige, icon: 'fa-solid fa-crown' },
          { id: 'leaderboard', label: t.tabLeaderboard, icon: 'fa-solid fa-ranking-star' },
          { id: 'stats', label: t.tabStats, icon: 'fa-solid fa-chart-line' }]
          } />

          {tab === 'generators' &&
          <div>
              <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                <div>
                  <div className="t-heading-m">{t.generatorsTitle}</div>
                  <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.generatorsSub}</div>
                </div>
                <div style={{ display: 'flex', gap: 3, background: 'var(--bg-3)', padding: 3, borderRadius: 'var(--radius-s)', flexShrink: 0 }}>
                  {[1, 10, 25, 50, 100, 1000].map((q) =>
                <button key={q} onClick={() => setBuyQty(q)} style={{
                  all: 'unset', boxSizing: 'border-box', padding: '5px 9px', borderRadius: 6,
                  fontSize: 12, fontWeight: buyQty === q ? 700 : 500, cursor: 'pointer',
                  background: buyQty === q ? 'var(--primary-i100)' : 'transparent',
                  color: buyQty === q ? '#fff' : 'var(--fg-2)',
                  transition: 'all 120ms ease', fontFamily: 'var(--font-sans)'
                }}>x{q}</button>
                )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {genStatus.map((g) => <window.GeneratorRow key={g.gen.id} gen={g.gen} owned={g.owned} cost={g.cost} canAfford={g.canAfford} unlocked={g.unlocked} revealed={g.revealed} production={g.production} lang={lang} totalTeeth={state.totalEarned} buyQty={buyQty} actualQty={g.actualQty} onBuy={() => buyGenerator(g.gen.id, buyQty)} />)}
              </div>
            </div>
          }

          {tab === 'click' &&
          <div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                  <div>
                    <div className="t-heading-m">{t.clickPowerTitle}</div>
                    <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.clickPowerSub}</div>
                  </div>
                  <select
                    value={clickFilter}
                    onChange={(e) => setClickFilter(e.target.value)}
                    style={{
                      fontFamily: 'inherit',
                      fontSize: 'var(--t-body-s-size, 13px)',
                      background: 'var(--neutral-i005)',
                      color: 'var(--fg-1)',
                      border: '1px solid var(--neutral-i020)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="all">{t.upgradeFilterAll}</option>
                    <option value="unlocked">{t.upgradeFilterUnlocked}</option>
                    <option value="locked">{t.upgradeFilterLocked}</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {filteredClickStatus.map((c) => <window.ClickUpgradeRow key={c.up.id} up={c.up} purchased={c.purchased} unlocked={c.unlocked} canAfford={c.canAfford} lang={lang} totalTeeth={state.totalEarned} onBuy={() => buyClickUpgrade(c.up.id)} />)}
              </div>
            </div>
          }

          {tab === 'achievements' &&
          <div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <div className="t-heading-m">{t.achTitle}</div>
                <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.achSub}</div>
                <div className="t-body-s" style={{ color: 'var(--fg-2)', marginTop: 6 }}>{achUnlockedCount}/{window.ACHIEVEMENTS.length} · +{achUnlockedCount}% bonus</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                {window.ACHIEVEMENTS.map((a) => <window.AchievementCard key={a.id} ach={a} unlocked={!!state.achievements[a.id]} lang={lang} />)}
              </div>
            </div>
          }

          {tab === 'prestige' &&
          <div>
              <div style={{ marginBottom: 'var(--spacing-5)' }}>
                <div className="t-heading-m" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-crown" style={{ color: 'var(--warning-i100)' }}></i>{t.prestigeTitle}
                </div>
                <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4, maxWidth: 540 }}>{t.prestigeDesc}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
                <window.StatTile label={t.prestigeHave} value={fmt(state.prestige)} icon="fa-solid fa-crown" accent="var(--warning-i130)" />
                <window.StatTile label={t.prestigeEarn} value={`+${fmt(prestigeGain)}`} icon="fa-solid fa-plus" accent="var(--positive-i100)" />
                <window.StatTile label={t.prestigeBonus} value={`+${((prestigeMult - 1) * 100).toFixed(0)}%`} icon="fa-solid fa-chart-line" accent="var(--alternative-i100)" />
              </div>
              <button onClick={() => setShowPrestigeConfirm(true)} disabled={prestigeGain <= 0} style={{ all: 'unset', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 'var(--spacing-4) var(--spacing-6)', background: prestigeGain > 0 ? 'var(--warning-i100)' : 'var(--bg-3)', color: prestigeGain > 0 ? 'var(--warning-i150)' : 'var(--fg-4)', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 15, cursor: prestigeGain > 0 ? 'pointer' : 'not-allowed', width: '100%', transition: 'background 150ms' }}
            onMouseEnter={(e) => {if (prestigeGain > 0) e.currentTarget.style.background = 'var(--warning-i070)';}}
            onMouseLeave={(e) => {if (prestigeGain > 0) e.currentTarget.style.background = 'var(--warning-i100)';}}>
                <i className="fa-solid fa-crown"></i>
                {prestigeGain > 0 ? t.prestigeBtn : t.prestigeLock}
              </button>

              {/* Tooth progression gallery */}
              <div style={{ marginTop: 'var(--spacing-6)' }}>
                <div className="t-heading-xs" style={{ color: 'var(--fg-2)', marginBottom: 'var(--spacing-3)' }}>
                  {lang === 'es' ? 'Evolución del diente' : 'Tooth evolution'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--spacing-2)' }}>
                  {window.TOOTH_STAGES.map((s, i) => {
                  const unlocked = (state.prestige || 0) >= s.prestige;
                  const isCurrent = (state.selectedTooth || 0) === i && unlocked;
                  return (
                    <div key={i} onClick={() => {if (unlocked) setState((prev) => ({ ...prev, selectedTooth: i }));}} title={unlocked ? s[lang] || s.es : lang === 'es' ? `Se desbloquea en prestigio ${s.prestige}` : `Unlocks at prestige ${s.prestige}`}
                    style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 'var(--spacing-2)', borderRadius: 'var(--radius-m)', cursor: unlocked ? 'pointer' : 'default', background: isCurrent ? 'var(--primary-i010)' : unlocked ? 'var(--bg-2)' : 'var(--bg-3)', border: `1px solid ${isCurrent ? 'var(--primary-i100)' : unlocked ? 'var(--border-subtle)' : 'var(--border-subtle)'}`, cursor: 'default', transition: 'all 150ms' }}>
                        <div style={{ position: 'relative', width: 48, height: 48 }}>
                          <img src={s.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', opacity: unlocked ? 1 : 0.2, filter: unlocked ? 'none' : 'grayscale(1)' }} />
                          {!unlocked &&
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="fa-solid fa-lock" style={{ fontSize: 14, color: 'var(--fg-4)' }}></i>
                            </div>
                        }
                          {isCurrent &&
                        <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: 'var(--primary-i100)', border: '2px solid white' }} />
                        }
                        </div>
                        <div className="t-body-xs" style={{ color: unlocked ? 'var(--fg-2)' : 'var(--fg-4)', textAlign: 'center', lineHeight: 1.2, fontSize: 9, fontWeight: isCurrent ? 600 : 400 }}>
                          {unlocked ? (s[lang] || s.es).split(' ').slice(1).join(' ') || s[lang] || s.es : `P${s.prestige}`}
                        </div>
                      </div>);

                })}
                </div>
              </div>
            </div>
          }

          {tab === 'leaderboard' && <window.LeaderboardPanel username={username} lang={lang} />}

          {tab === 'stats' &&
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
              <div>
                <div className="t-heading-m">{t.statsTitle}</div>
                <div className="t-body-s" style={{ color: 'var(--fg-3)', marginTop: 2 }}>{lang === 'es' ? 'Todo lo que pasó en tu consulta.' : 'Everything that happened in your practice.'}</div>
              </div>
              <window.StatsGroup title={lang === 'es' ? 'Producción' : 'Production'} icon="fa-solid fa-gauge-high" accent="var(--primary-i100)" rows={[
            { label: t.currentTeeth, value: fmt(state.teeth), strong: true },
            { label: t.perSecond, value: fmt(perSecond), color: 'var(--positive-i100)' },
            { label: t.perClick, value: fmt(perClick), color: 'var(--alternative-i100)' },
            { label: lang === 'es' ? 'Bonus global' : 'Global bonus', value: `x${globalMult.toFixed(2)}`, color: 'var(--warning-i130)' }]
            } />
              <window.StatsGroup title={lang === 'es' ? 'Progreso' : 'Progress'} icon="fa-solid fa-chart-line" accent="var(--positive-i100)" rows={[
            { label: t.totalTeeth, value: fmt(state.totalEarned), strong: true },
            { label: t.totalClicks, value: fmt(state.totalClicks) },
            { label: lang === 'es' ? 'Generadores totales' : 'Total generators', value: fmt(Object.values(state.generators || {}).reduce((a, b) => a + (b || 0), 0)) },
            { label: lang === 'es' ? 'Mejoras compradas' : 'Upgrades bought', value: `${Object.values(state.clickUpgrades || {}).filter(Boolean).length}/${window.CLICK_UPGRADES.length}` },
            { label: lang === 'es' ? 'Logros' : 'Achievements', value: `${Object.keys(state.achievements || {}).length}/${window.ACHIEVEMENTS.length}` }]
            } />
              <window.StatsGroup title={t.prestige || 'Prestigio'} icon="fa-solid fa-crown" accent="var(--warning-i130)" rows={[
            { label: t.prestigeHave, value: fmt(state.prestige), strong: true },
            { label: lang === 'es' ? 'Próxima ganancia' : 'Next gain', value: `+${fmt(prestigeGain)}` },
            { label: lang === 'es' ? 'Dientes dorados' : 'Golden teeth', value: fmt(state.goldenClicks), color: 'var(--warning-i100)' }]
            } />
              <window.StatsGroup title={lang === 'es' ? 'Tiempo' : 'Time'} icon="fa-solid fa-clock" accent="var(--fg-2)" rows={[
            { label: t.timePlayed, value: window.formatTime(state.timePlayed), strong: true },
            { label: lang === 'es' ? 'Empezaste' : 'Started', value: new Date(state.startedAt || Date.now()).toLocaleDateString(lang === 'es' ? 'es' : 'en') },
            { label: lang === 'es' ? 'Sesión actual' : 'Current session', value: window.formatTime(Math.max(0, (state.timePlayed || 0) - (bootRef.current?.saved?.timePlayed || 0))) }]
            } />
            </div>
          }
        </section>
      </main>

      {/* Golden tooth */}
      {golden &&
      <button onClick={handleGoldenClick} style={{ position: 'fixed', left: golden.x, top: golden.y, transform: 'translate(-50%,-50%)', background: 'none', border: 'none', cursor: 'pointer', zIndex: 500, animation: 'goldFloat 2.2s ease-in-out infinite', padding: 0 }}>
          <img src={window.getToothStage(state.prestige).img} alt="golden" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 16px #FFC220) sepia(0.6) saturate(2.5) hue-rotate(10deg)' }} />
        </button>
      }

      <window.Toast toast={toast} lang={lang} />

      {showWelcomeBack && offlineInfo &&
      <Modal onClose={() => setShowWelcomeBack(false)}>
          <div style={{ width: 54, height: 54, borderRadius: 'var(--radius-s)', background: 'var(--primary-i010)', color: 'var(--primary-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-3)' }}>
            <i className="fa-solid fa-face-smile" style={{ fontSize: 22 }}></i>
          </div>
          <div className="t-heading-m">{t.welcomeBackTitle}, {username}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 10, lineHeight: 1.55 }}>
            {t.welcomeBackMsg} <strong style={{ color: 'var(--primary-i130)' }}>{fmt(Math.floor(offlineInfo.earned))}</strong> {t.welcomeBackPatients}.
          </div>
          <div className="t-body-s" style={{ color: offlineInfo.wasCapped ? 'var(--warning-i130)' : 'var(--fg-3)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: offlineInfo.wasCapped ? '8px 10px' : 0, background: offlineInfo.wasCapped ? 'var(--warning-i010)' : 'transparent', border: offlineInfo.wasCapped ? '1px solid var(--warning-i030)' : 'none', borderRadius: 6 }}>
            <i className="fa-solid fa-clock"></i> {t.welcomeBackCap}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'var(--spacing-5)' }}>
            <button onClick={() => setShowWelcomeBack(false)} style={primaryBtnStyle}><i className="fa-solid fa-arrow-right" style={{ marginRight: 6 }}></i>{t.welcomeBackContinue}</button>
          </div>
        </Modal>
      }

      {showPrestigeConfirm &&
      <Modal onClose={() => setShowPrestigeConfirm(false)}>
          <div style={{ width: 54, height: 54, borderRadius: 'var(--radius-s)', background: 'var(--warning-i010)', color: 'var(--warning-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-3)' }}>
            <i className="fa-solid fa-crown" style={{ fontSize: 22 }}></i>
          </div>
          <div className="t-heading-m">{t.prestigeBtn}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 6 }}>{t.confirmPrestige}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'var(--spacing-5)' }}>
            <button onClick={() => setShowPrestigeConfirm(false)} style={secondaryBtnStyle}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
            <button onClick={doPrestige} style={{ ...primaryBtnStyle, background: 'var(--warning-i100)', color: 'var(--warning-i150)' }}><i className="fa-solid fa-crown" style={{ marginRight: 6 }}></i>{t.prestigeBtn}</button>
          </div>
        </Modal>
      }

      {showResetConfirm &&
      <Modal onClose={() => setShowResetConfirm(false)}>
          <div style={{ width: 54, height: 54, borderRadius: 'var(--radius-s)', background: 'var(--negative-i010)', color: 'var(--negative-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-3)' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 22 }}></i>
          </div>
          <div className="t-heading-m">{t.reset}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 6 }}>{t.confirmReset}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'var(--spacing-5)' }}>
            <button onClick={() => setShowResetConfirm(false)} style={secondaryBtnStyle}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
            <button onClick={doReset} style={{ ...primaryBtnStyle, background: 'var(--negative-i100)' }}>{t.reset}</button>
          </div>
        </Modal>
      }
      {/* New tooth unlock notification */}
      {newToothUnlock &&
      <div onClick={() => setNewToothUnlock(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(5,9,13,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, animation: 'fadeIn 200ms ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-1)', borderRadius: 'var(--radius-m)', padding: 'var(--spacing-6)', maxWidth: 340, width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, animation: 'modalIn 250ms ease', boxShadow: 'var(--elevation-30)', border: '2px solid var(--warning-i100)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--warning-i100)', background: 'var(--warning-i010)', padding: '4px 12px', borderRadius: 999 }}>
              {lang === 'es' ? '¡Nuevo diente desbloqueado!' : 'New tooth unlocked!'}
            </div>
            <img src={newToothUnlock.stage.img} alt={newToothUnlock.stage[lang] || newToothUnlock.stage.es} style={{ width: 110, height: 110, objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(255,194,32,0.4))' }} />
            <div className="t-heading-m" style={{ color: 'var(--fg-1)', textAlign: 'center' }}>{newToothUnlock.stage[lang] || newToothUnlock.stage.es}</div>
            <div className="t-body-s" style={{ color: 'var(--fg-3)', textAlign: 'center' }}>
              {lang === 'es' ? 'Prestigio ' + newToothUnlock.stage.prestige + ' alcanzado' : 'Prestige ' + newToothUnlock.stage.prestige + ' reached'}
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
              <button onClick={() => setNewToothUnlock(null)} style={{ ...secondaryBtnStyle, flex: 1 }}>
                {lang === 'es' ? 'Más tarde' : 'Later'}
              </button>
              <button onClick={() => {setState((prev) => ({ ...prev, selectedTooth: newToothUnlock.idx }));setNewToothUnlock(null);}} style={{ ...primaryBtnStyle, flex: 1 }}>
                {lang === 'es' ? '¡Equipar!' : 'Equip!'}
              </button>
            </div>
          </div>
        </div>
      }
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} lang={lang} />}
    </div>);

}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ lang, onLangChange, onEnterGame, onBack }) {
  const [adminUsers, setAdminUsers] = useState(() => loadAdminUsers());
  const [publicUsers, setPublicUsers] = useState(() => loadUsers());
  const [newAdminName, setNewAdminName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { name, type: 'admin'|'public' }
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const btn = { all: 'unset', boxSizing: 'border-box', cursor: 'pointer', fontFamily: "'PixelifySans', var(--font-sans)", borderRadius: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 140ms' };
  const card = { background: 'rgba(255,255,255,0.88)', borderRadius: 16, padding: '20px', border: '1px solid rgba(100,160,230,0.25)', boxShadow: '0 2px 16px rgba(80,140,220,0.08)', backdropFilter: 'blur(8px)', marginBottom: 16 };

  const allNames = [...adminUsers, ...publicUsers];

  const handleAddAdmin = (e) => {
    e && e.preventDefault();
    const cleaned = (newAdminName || '').trim().slice(0, 24);
    if (!cleaned) return;
    if (allNames.some((u) => u.toLowerCase() === cleaned.toLowerCase())) {
      setNameErr(lang === 'es' ? 'Ya existe ese nombre' : 'Name already exists');return;
    }
    const updated = [...adminUsers, cleaned];
    saveAdminUsers(updated);
    setAdminUsers(updated);
    setNewAdminName('');
    setNameErr('');
  };

  const handleDelete = ({ name, type }) => {
    deleteUserSave(name);
    window.cloudDeleteScore && window.cloudDeleteScore(name);
    if (type === 'admin') {
      const updated = adminUsers.filter((u) => u !== name);
      saveAdminUsers(updated);setAdminUsers(updated);
    } else {
      const updated = publicUsers.filter((u) => u !== name);
      saveUsers(updated);setPublicUsers(updated);
      // Also clear device-owner if they deleted themselves
      if (localStorage.getItem(DEVICE_USER_KEY) === name) localStorage.removeItem(DEVICE_USER_KEY);
    }
    setDeleteTarget(null);
  };

  const handleResetAll = async () => {
    setResetLoading(true);
    resetAllProgress();
    await new Promise((r) => setTimeout(r, 900));
    setResetLoading(false);setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
    setShowResetConfirm(false);
  };

  const UserRow = ({ name, type }) =>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f4f8fc', borderRadius: 10, border: '1px solid rgba(100,160,230,0.2)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: type === 'admin' ? 'rgba(26,143,255,0.15)' : 'rgba(100,160,230,0.15)', color: type === 'admin' ? '#1a8fff' : '#5a8aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {(name[0] || '?').toUpperCase()}
      </div>
      <span style={{ flex: 1, fontSize: 15, color: '#1a3a5a', fontWeight: 600 }}>{name}</span>
      <button onClick={() => onEnterGame(name)} style={{ ...btn, padding: '6px 12px', background: 'rgba(26,143,255,0.1)', color: '#1a8fff', fontSize: 12, border: '1px solid rgba(26,143,255,0.2)', borderRadius: 8 }}>
        <i className="fa-solid fa-play"></i>
        {lang === 'es' ? 'Jugar' : 'Play'}
      </button>
      <button onClick={() => setDeleteTarget({ name, type })} style={{ ...btn, padding: '6px 10px', background: 'rgba(220,50,50,0.08)', color: '#c33', fontSize: 12, border: '1px solid rgba(220,50,50,0.2)', borderRadius: 8 }}>
        <i className="fa-solid fa-trash"></i>
      </button>
    </div>;


  return (
    <div style={{ minHeight: '100vh', background: '#e8f2fb', fontFamily: "'PixelifySans', var(--font-sans)", position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'url(uploads/background-e5bd6167.png)', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none', opacity: 0.45 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto', padding: '32px 20px 56px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={{ ...btn, padding: '8px 12px', background: 'rgba(255,255,255,0.8)', color: '#4a6a8a', fontSize: 13, border: '1px solid rgba(100,160,230,0.35)' }}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#1a8fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a3a5a', lineHeight: 1 }}>Panel Admin</div>
            <div style={{ fontSize: 12, color: '#6a8aaa', fontFamily: 'var(--font-sans)', marginTop: 2 }}>
              {lang === 'es' ? 'Solo visible desde este dispositivo' : 'Visible from this device only'}
            </div>
          </div>
          <button onClick={onLangChange} style={{ ...btn, padding: '8px 12px', background: 'rgba(255,255,255,0.8)', color: '#4a6a8a', fontSize: 13, border: '1px solid rgba(100,160,230,0.35)' }}>
            {lang === 'es' ? '🇬🇧' : '🇪🇸'}
          </button>
        </div>

        {/* Admin's own accounts */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <i className="fa-solid fa-user-shield" style={{ color: '#1a8fff', fontSize: 15 }}></i>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
              {lang === 'es' ? 'Mis cuentas' : 'My accounts'}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({adminUsers.length})</span>
            </span>
          </div>
          <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: 8, marginBottom: adminUsers.length > 0 ? 12 : 0 }}>
            <input
              value={newAdminName}
              onChange={(e) => {setNewAdminName(e.target.value);setNameErr('');}}
              maxLength={24}
              placeholder={lang === 'es' ? 'Nombre de cuenta...' : 'Account name...'}
              style={{ flex: 1, padding: '10px 14px', fontSize: 14, fontFamily: "'PixelifySans', var(--font-sans)", border: `2px solid ${nameErr ? '#e55' : 'rgba(100,160,230,0.4)'}`, borderRadius: 10, background: '#fff', outline: 'none', color: '#334' }} />
            
            <button type="submit" disabled={!newAdminName.trim()} style={{ ...btn, padding: '10px 18px', background: newAdminName.trim() ? '#1a8fff' : 'rgba(100,140,180,0.2)', color: newAdminName.trim() ? '#fff' : 'rgba(100,140,180,0.5)', fontSize: 14, cursor: newAdminName.trim() ? 'pointer' : 'not-allowed' }}>
              <i className="fa-solid fa-plus"></i>
            </button>
          </form>
          {nameErr && <div style={{ marginBottom: 10, fontSize: 12, color: '#c33', fontFamily: 'var(--font-sans)' }}>{nameErr}</div>}
          {adminUsers.length > 0 &&
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {adminUsers.map((u) => <UserRow key={u} name={u} type="admin" />)}
            </div>
          }
          {adminUsers.length === 0 &&
          <div style={{ textAlign: 'center', padding: '10px 0 4px', color: '#8aaacc', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
              {lang === 'es' ? 'Crea tus cuentas privadas arriba' : 'Create your private accounts above'}
            </div>
          }
        </div>

        {/* Public players */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <i className="fa-solid fa-users" style={{ color: '#5a8aaa', fontSize: 15 }}></i>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
              {lang === 'es' ? 'Jugadores públicos' : 'Public players'}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({publicUsers.length})</span>
            </span>
          </div>
          {publicUsers.length === 0 ?
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#8aaacc', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
              {lang === 'es' ? 'Sin jugadores registrados aún' : 'No registered players yet'}
            </div> :

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {publicUsers.map((u) => <UserRow key={u} name={u} type="public" />)}
            </div>
          }
        </div>

        {/* Danger zone */}
        <div style={{ background: 'rgba(255,240,240,0.92)', borderRadius: 16, padding: '20px', border: '1px solid rgba(220,50,50,0.2)', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: '#c33', fontSize: 14 }}></i>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#7a1a1a' }}>{lang === 'es' ? 'Zona peligrosa' : 'Danger zone'}</span>
          </div>
          <div style={{ fontSize: 13, color: '#a06060', fontFamily: 'var(--font-sans)', marginBottom: 14, lineHeight: 1.5 }}>
            {lang === 'es' ? 'Borra el progreso de TODOS los jugadores y el leaderboard global. Los usuarios no se eliminan.' : 'Wipes ALL players progress and the global leaderboard. Users are not deleted.'}
          </div>
          <button onClick={() => setShowResetConfirm(true)} style={{ ...btn, width: '100%', padding: '12px 0', background: '#c33', color: '#fff', fontSize: 14, borderRadius: 10 }}>
            <i className="fa-solid fa-rotate-left"></i>
            {lang === 'es' ? 'Resetear todo el progreso' : 'Reset all progress'}
          </button>
          {resetDone && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: '#1a7a3a', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <i className="fa-solid fa-check-circle"></i>{lang === 'es' ? '¡Reseteado!' : 'Reset done!'}
          </div>}
        </div>
      </div>

      {deleteTarget &&
      <Modal onClose={() => setDeleteTarget(null)}>
          <div style={{ width: 50, height: 50, borderRadius: 'var(--radius-s)', background: 'var(--negative-i010)', color: 'var(--negative-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <i className="fa-solid fa-trash" style={{ fontSize: 18 }}></i>
          </div>
          <div className="t-heading-m">{lang === 'es' ? `Eliminar "${deleteTarget.name}"` : `Delete "${deleteTarget.name}"`}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 6 }}>
            {lang === 'es' ? 'Se borrarán todos sus datos y progreso del juego.' : 'All their data and game progress will be deleted.'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={() => setDeleteTarget(null)} style={{ all: 'unset', boxSizing: 'border-box', flex: 1, padding: '11px 0', background: 'var(--bg-3)', color: 'var(--fg-1)', borderRadius: 'var(--radius-s)', fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button onClick={() => handleDelete(deleteTarget)} style={{ all: 'unset', boxSizing: 'border-box', flex: 1, padding: '11px 0', background: 'var(--negative-i100)', color: '#fff', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
              {lang === 'es' ? 'Eliminar' : 'Delete'}
            </button>
          </div>
        </Modal>
      }

      {showResetConfirm &&
      <Modal onClose={() => setShowResetConfirm(false)}>
          <div style={{ width: 50, height: 50, borderRadius: 'var(--radius-s)', background: 'var(--negative-i010)', color: 'var(--negative-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 18 }}></i>
          </div>
          <div className="t-heading-m">{lang === 'es' ? '¿Resetear todo?' : 'Reset everything?'}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 6 }}>
            {lang === 'es' ? 'Se borrará el progreso en juego de todos los jugadores y el ranking global. Las cuentas no se eliminan.' : 'All in-game progress and the global ranking will be wiped. Accounts are not deleted.'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={() => setShowResetConfirm(false)} style={{ all: 'unset', boxSizing: 'border-box', flex: 1, padding: '11px 0', background: 'var(--bg-3)', color: 'var(--fg-1)', borderRadius: 'var(--radius-s)', fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button onClick={handleResetAll} disabled={resetLoading} style={{ all: 'unset', boxSizing: 'border-box', flex: 1, padding: '11px 0', background: 'var(--negative-i100)', color: '#fff', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 14, cursor: resetLoading ? 'wait' : 'pointer', textAlign: 'center', fontFamily: 'var(--font-sans)', opacity: resetLoading ? 0.7 : 1 }}>
              {resetLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : lang === 'es' ? '¡Resetear todo!' : 'Reset everything!'}
            </button>
          </div>
        </Modal>
      }
    </div>);

}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState('gate'); // 'gate' | 'game' | 'admin'
  const [username, setUsername] = useState(null);
  const [users, setUsers] = useState(() => loadUsers());
  const [deviceUser, setDeviceUser] = useState(() => localStorage.getItem(DEVICE_USER_KEY) || null);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'es');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== '0');
  const [numFormat, setNumFormat] = useState(() => localStorage.getItem(NUMFMT_KEY) || 'short');

  // Keep window.__lang in sync (used by UserPill)
  useEffect(() => {window.__lang = lang;}, [lang]);

  const refreshUsers = useCallback(() => setUsers(loadUsers()), []);

  const handleCreateUser = useCallback((name) => {
    const cleaned = name.trim().slice(0, 24);
    if (!cleaned) return;
    const updated = [...loadUsers(), cleaned];
    saveUsers(updated);
    localStorage.setItem(DEVICE_USER_KEY, cleaned);
    setUsers(updated);
    setDeviceUser(cleaned);
    setUsername(cleaned);
    setScreen('game');
  }, []);

  const handleSelectUser = useCallback((name) => {
    setUsername(name);
    setScreen('game');
  }, []);

  const handleAdminAccess = useCallback(() => setScreen('admin'), []);

  const handleAdminEnterGame = useCallback((name) => {
    setUsername(name);
    setScreen('game');
  }, []);

  const handleLogout = useCallback(() => {
    setUsername(null);
    refreshUsers();
    setScreen('gate');
  }, [refreshUsers]);

  const handleDeleteUser = useCallback(() => {
    // If device owner deleted themselves, clear that flag
    if (username === deviceUser) {
      localStorage.removeItem(DEVICE_USER_KEY);
      setDeviceUser(null);
    }
    setUsername(null);
    refreshUsers();
    setScreen('gate');
  }, [username, deviceUser, refreshUsers]);

  const handleLangChange = useCallback((l) => {
    const next = typeof l === 'string' && l.length === 2 ? l : lang === 'es' ? 'en' : 'es';
    localStorage.setItem(LANG_KEY, next);
    setLang(next);
  }, [lang]);

  const handleSoundToggle = useCallback(() => {
    setSoundOn((s) => {const n = !s;localStorage.setItem(SOUND_KEY, n ? '1' : '0');return n;});
  }, []);

  const handleNumFormatChange = useCallback((m) => {
    setNumFormat(m);try {localStorage.setItem(NUMFMT_KEY, m);} catch (e) {}
  }, []);

  if (screen === 'admin') {
    return (
      <AdminPanel
        lang={lang}
        onLangChange={() => handleLangChange()}
        onEnterGame={handleAdminEnterGame}
        onBack={() => setScreen('gate')} />);


  }

  if (screen === 'game') {
    return (
      <Game key={username} username={username} lang={lang} onLangChange={handleLangChange}
      onLogout={handleLogout} onDeleteUser={handleDeleteUser}
      numFormat={numFormat} onNumFormatChange={handleNumFormatChange} />);

  }

  return (
    <window.Gate
      lang={lang}
      onLangChange={handleLangChange}
      onSelectUser={handleSelectUser}
      onCreateUser={handleCreateUser}
      onAdminAccess={handleAdminAccess}
      users={users}
      deviceUser={deviceUser}
      soundOn={soundOn}
      onSoundToggle={handleSoundToggle} />);


}

function AboutModal({ onClose, lang }) {
  const versions = VERSION_HISTORY.map((item) => ({
    v: item.v,
    date: item.date,
    desc: lang === 'es' ? item.es : item.en,
    latest: item.latest
  }));
  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 300, maxWidth: 360, minHeight: 0 }}>
        <img src="uploads/logo-vertical.png" alt="ToothClicker" style={{ width: 180, objectFit: 'contain', marginBottom: 8, flexShrink: 0 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)', marginBottom: 16, flexShrink: 0, padding: "20px 0px" }}>
          {lang === 'es' ? 'Creado por Jaime Arias' : 'Created by Jaime Arias'}
        </div>
        <div style={{ width: '100%', borderTop: '1.5px dashed #d0dce8', marginBottom: 16, flexShrink: 0 }} />
        <div style={{ width: '100%' }}>
          {(() => {
            const latest = versions.find((v) => v.latest);
            if (!latest) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#1a8fff', padding: '4px 14px', borderRadius: 999 }}>{latest.v}</span>
                {latest.date && <span style={{ fontSize: 11, color: '#aac0d4', fontFamily: 'var(--font-sans)' }}>{latest.date}</span>}
              </div>);

          })()}
        </div>
        <button onClick={onClose} style={{ all: 'unset', boxSizing: 'border-box', marginTop: 24, width: '100%', textAlign: 'center', padding: '13px 0', borderRadius: 999, background: '#1a8fff', color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: "'PixelifySans', var(--font-sans)", cursor: 'pointer', flexShrink: 0 }}>
          {lang === 'es' ? 'Cerrar' : 'Close'}
        </button>
      </div>
    </Modal>);

}

Object.assign(window, { AboutModal, Modal, primaryBtnStyle, secondaryBtnStyle, deleteUserSave });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));