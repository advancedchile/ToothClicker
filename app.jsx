// ==========================================================================
// Tooth Clicker — Main App
// ==========================================================================

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const SAVES_KEY = 'tooth-clicker-saves-v2';   // { [username]: stateObj }
const CURRENT_USER_KEY = 'tooth-clicker-current-user';
const LANG_KEY = 'tooth-clicker-lang';
const SOUND_KEY = 'tooth-clicker-sound';
const NUMFMT_KEY = 'tooth-clicker-numfmt';

function loadAllSaves() {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) { return {}; }
}
function saveAllSaves(obj) {
  try { localStorage.setItem(SAVES_KEY, JSON.stringify(obj)); } catch (e) {}
}
function loadUserSave(username) {
  if (!username) return null;
  const all = loadAllSaves();
  return all[username] || null;
}
function persistUserSave(username, state) {
  if (!username) return;
  const all = loadAllSaves();
  all[username] = state;
  saveAllSaves(all);
}
function getLeaderboard() {
  const all = loadAllSaves();
  return Object.entries(all)
    .map(([name, s]) => ({
      name,
      totalEarned: s.totalEarned || 0,
      prestige: s.prestige || 0,
      timePlayed: s.timePlayed || 0,
      teeth: s.teeth || 0,
    }))
    .sort((a, b) => {
      if (b.prestige !== a.prestige) return b.prestige - a.prestige;
      return b.totalEarned - a.totalEarned;
    });
}
function deleteUserSave(username) {
  const all = loadAllSaves();
  delete all[username];
  saveAllSaves(all);
}

function defaultState() {
  return {
    teeth: 0,
    totalEarned: 0,
    totalClicks: 0,
    goldenClicks: 0,
    generators: {},       // id -> owned count
    clickUpgrades: {},    // id -> bought bool
    achievements: {},     // id -> bool
    prestige: 0,          // golden smiles earned
    startedAt: Date.now(),
    timePlayed: 0,        // seconds
    lastTick: Date.now(),
  };
}

function App() {
  const [username, setUsername] = useState(() => localStorage.getItem(CURRENT_USER_KEY) || null);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'es');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== '0');
  const [numFormat, setNumFormat] = useState(() => localStorage.getItem(NUMFMT_KEY) || 'short');

  const handleNumFormatChange = useCallback((m) => {
    setNumFormat(m);
    try { localStorage.setItem(NUMFMT_KEY, m); } catch (e) {}
  }, []);
  const [inGame, setInGame] = useState(false);

  const handleStart = useCallback((name, chosenLang) => {
    const cleaned = (name || '').trim().slice(0, 24);
    if (!cleaned) return;
    const existing = localStorage.getItem(CURRENT_USER_KEY);
    // If a user already exists on this device, treat "start" as "continue".
    if (existing) {
      setLang(chosenLang);
      localStorage.setItem(LANG_KEY, chosenLang);
      setInGame(true);
      return;
    }
    localStorage.setItem(CURRENT_USER_KEY, cleaned);
    localStorage.setItem(LANG_KEY, chosenLang);
    setUsername(cleaned);
    setLang(chosenLang);
    setInGame(true);
  }, []);

  // "Continue" from the welcome-back Gate (device lock present).
  const handleContinue = useCallback(() => {
    setInGame(true);
  }, []);

  // Logout: return to welcome screen but keep device lock + save.
  const handleLogout = useCallback(() => {
    setInGame(false);
  }, []);

  // Delete user: clear device lock + save, back to fresh Gate.
  const handleDeleteUser = useCallback(() => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUsername(null);
    setInGame(false);
  }, []);

  const handleLangChange = useCallback((l) => {
    localStorage.setItem(LANG_KEY, l);
    setLang(l);
  }, []);

  const handleSoundToggle = useCallback(() => {
    setSoundOn(s => {
      const n = !s;
      localStorage.setItem(SOUND_KEY, n ? '1' : '0');
      return n;
    });
  }, []);

  if (!inGame) {
    return (
      <Gate
        lang={lang}
        onLangChange={handleLangChange}
        onStart={handleStart}
        existingUser={username}
        onContinue={handleContinue}
        soundOn={soundOn}
        onSoundToggle={handleSoundToggle}
        onDeleteUser={handleDeleteUser}
        numFormat={numFormat}
      />
    );
  }
  return (
    <Game
      key={username}
      username={username}
      lang={lang}
      onLangChange={handleLangChange}
      onLogout={handleLogout}
      onDeleteUser={handleDeleteUser}
      initialSoundOn={soundOn}
      onSoundChange={(v) => { setSoundOn(v); localStorage.setItem(SOUND_KEY, v ? '1' : '0'); }}
      numFormat={numFormat}
      onNumFormatChange={handleNumFormatChange}
    />
  );
}

function Game({ username, lang: initialLang, onLangChange, onLogout, onDeleteUser, numFormat: initialNumFormat, onNumFormatChange }) {
  // Freeze the saved snapshot + offline-earnings computation to mount time.
  // If we recomputed on every render, the 3s autosave would reset lastTick
  // and the welcome-back modal would unmount before the user could see it.
  const bootRef = useRef(null);
  if (bootRef.current === null) {
    const OFFLINE_CAP_S = 2 * 60 * 60; // 2 hours
    const snap = loadUserSave(username);
    let info = null;
    if (snap && snap.lastTick) {
      const elapsed = Math.max(0, (Date.now() - snap.lastTick) / 1000);
      if (elapsed >= 30) {
        const capped = Math.min(elapsed, OFFLINE_CAP_S);
        let passive = 0;
        for (const g of GENERATORS) passive += (snap.generators?.[g.id] || 0) * g.baseProduction;
        const pMult = 1 + 0.05 * (snap.prestige || 0);
        const aMult = 1 + 0.01 * Object.values(snap.achievements || {}).filter(Boolean).length;
        const earned = passive * pMult * aMult * capped;
        if (earned > 0) {
          info = {
            elapsedSeconds: elapsed,
            cappedSeconds: capped,
            wasCapped: elapsed > OFFLINE_CAP_S,
            earned,
          };
        }
      }
    }
    bootRef.current = { saved: snap, offlineInfo: info };
  }
  const saved = bootRef.current.saved;
  const offlineInfo = bootRef.current.offlineInfo;

  const [state, setState] = useState(() => {
    if (!saved) return defaultState();
    const base = { ...defaultState(), ...saved };
    if (offlineInfo) {
      return {
        ...base,
        teeth: (base.teeth || 0) + offlineInfo.earned,
        totalEarned: (base.totalEarned || 0) + offlineInfo.earned,
        lastTick: Date.now(),
      };
    }
    return { ...base, lastTick: Date.now() };
  });
  const [showWelcomeBack, setShowWelcomeBack] = useState(() => !!offlineInfo);
  const [lang, setLangLocal] = useState(initialLang);
  const [numFormat, setNumFormatLocal] = useState(initialNumFormat || 'short');
  // expose current lang + numFormat globally so components that call formatNum()
  // without props (GeneratorRow, ClickUpgradeRow, AchievementCard...) stay in sync.
  if (typeof window !== 'undefined') { window.__numFormat = numFormat; window.__lang = lang; }
  const fmt = useCallback((n) => window.formatNumWithMode(n, numFormat, lang), [numFormat, lang]);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== '0');
  const [tab, setTab] = useState('generators');
  const [floats, setFloats] = useState([]); // floating +N on click
  const [golden, setGolden] = useState(null); // {x, y, id, spawnedAt}
  const [goldenActiveUntil, setGoldenActiveUntil] = useState(0);
  const [toast, setToast] = useState(null);
  const [clickPulse, setClickPulse] = useState(0);
  const [saveFlash, setSaveFlash] = useState(false);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  const t = STRINGS[lang];

  // ---- Derived values ----
  const prestigeMult = 1 + 0.05 * (state.prestige || 0);
  const achMult = 1 + 0.01 * Object.values(state.achievements || {}).filter(Boolean).length;
  const perSecondRaw = useMemo(() => {
    let v = 0;
    for (const g of GENERATORS) v += (state.generators[g.id] || 0) * g.baseProduction;
    return v;
  }, [state.generators]);

  const clickBase = useMemo(() => {
    return computeClickPower(state, perSecondRaw).total;
  }, [state.clickUpgrades, state.generators, state.achievements, state.timePlayed, perSecondRaw]);

  const goldenMult = goldenActiveUntil > Date.now() ? 7 : 1;
  const globalMult = prestigeMult * achMult * goldenMult;

  const perClick = clickBase * globalMult;

  const perSecond = perSecondRaw * globalMult;

  const genProductions = useMemo(() => {
    const out = {};
    for (const g of GENERATORS) out[g.id] = (state.generators[g.id] || 0) * g.baseProduction * globalMult;
    return out;
  }, [state.generators, globalMult]);

  const achUnlockedCount = Object.values(state.achievements || {}).filter(Boolean).length;

  // Prestige gain: earned_teeth^0.5 / 10000 ish; classic formula
  const prestigeGain = useMemo(() => {
    const base = Math.max(0, state.totalEarned - 1_000_000);
    if (base <= 0) return 0;
    return Math.floor(Math.pow(base / 1_000_000_000, 0.5) * 15);
  }, [state.totalEarned]);

  // ---- Game tick ----
  useEffect(() => {
    const interval = setInterval(() => {
      setState(s => {
        const now = Date.now();
        const dt = (now - s.lastTick) / 1000;
        let v = 0;
        for (const g of GENERATORS) v += (s.generators[g.id] || 0) * g.baseProduction;
        const pMult = 1 + 0.05 * (s.prestige || 0);
        const aMult = 1 + 0.01 * Object.values(s.achievements || {}).filter(Boolean).length;
        const gMult = goldenActiveUntil > now ? 7 : 1;
        const mult = pMult * aMult * gMult;
        const earned = v * mult * dt;
        return {
          ...s,
          teeth: s.teeth + earned,
          totalEarned: s.totalEarned + earned,
          timePlayed: s.timePlayed + dt,
          lastTick: now,
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [goldenActiveUntil]);

  // ---- Autosave every 5 minutes + cloud submit every 30s ----
  const doManualSave = useCallback(() => {
    try {
      persistUserSave(username, stateRef.current);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
      // Also push to cloud immediately on manual save
      const s = stateRef.current;
      if (s) cloudSubmitScore({
        name: username,
        totalEarned: s.totalEarned || 0,
        prestige: s.prestige || 0,
        timePlayed: s.timePlayed || 0,
        teeth: s.teeth || 0,
      });
    } catch (e) {}
  }, [username]);

  useEffect(() => {
    const saveId = setInterval(() => {
      try {
        persistUserSave(username, stateRef.current);
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 1500);
      } catch (e) {}
    }, 60 * 1000); // every 60 seconds — keeps the "Guardado" flash visible regularly
    // Also save once on unmount so logout/close never loses >0s of progress
    const onUnload = () => {
      try { persistUserSave(username, stateRef.current); } catch (e) {}
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      clearInterval(saveId);
      window.removeEventListener('beforeunload', onUnload);
      onUnload();
    };
  }, [username]);

  useEffect(() => {
    // Cloud submit: first push after 10s, then every 30s, plus on unmount/unload
    const pushScore = () => {
      const s = stateRef.current;
      if (!s) return;
      cloudSubmitScore({
        name: username,
        totalEarned: s.totalEarned || 0,
        prestige: s.prestige || 0,
        timePlayed: s.timePlayed || 0,
        teeth: s.teeth || 0,
      });
    };
    const first = setTimeout(pushScore, 10_000);
    const id = setInterval(pushScore, 30_000);
    const onUnload = () => pushScore();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener('beforeunload', onUnload);
      pushScore(); // on exit
    };
  }, [username]);

  // ---- Achievement checker ----
  useEffect(() => {
    const newUnlocks = [];
    for (const a of ACHIEVEMENTS) {
      if (!state.achievements[a.id] && a.check(state)) {
        newUnlocks.push(a);
      }
    }
    if (newUnlocks.length > 0) {
      setState(s => {
        const next = { ...s, achievements: { ...s.achievements } };
        for (const a of newUnlocks) next.achievements[a.id] = true;
        return next;
      });
      // toast only the first
      const a = newUnlocks[0];
      setToast(a);
      setTimeout(() => setToast(null), 3500);
      if (soundRef.current) {
        playTone(660, 0.12, 'triangle', 0.06);
        setTimeout(() => playTone(880, 0.12, 'triangle', 0.06), 100);
      }
    }
  }, [state.totalClicks, state.totalEarned, state.generators, state.prestige, state.goldenClicks, state.clickUpgrades, state.timePlayed]);

  // ---- Golden tooth spawner ----
  useEffect(() => {
    let timeoutId;
    function scheduleNext() {
      const delay = 60_000 + Math.random() * 120_000; // 1-3 min
      timeoutId = setTimeout(() => {
        spawnGolden();
        scheduleNext();
      }, delay);
    }
    function spawnGolden() {
      // anywhere in the viewport, with some padding
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = 80 + Math.random() * (w - 160);
      const y = 120 + Math.random() * (h - 240);
      const id = Math.random().toString(36);
      setGolden({ x, y, id, spawnedAt: Date.now() });
      // auto despawn after 13s
      setTimeout(() => {
        setGolden(g => (g && g.id === id ? null : g));
      }, 13_000);
    }
    // first one quicker for feedback
    const firstDelay = 45_000 + Math.random() * 30_000;
    timeoutId = setTimeout(() => {
      spawnGolden();
      scheduleNext();
    }, firstDelay);
    return () => clearTimeout(timeoutId);
  }, []);

  // ---- Handlers ----
  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gain = perClick;
    setState(s => ({ ...s, teeth: s.teeth + gain, totalEarned: s.totalEarned + gain, totalClicks: s.totalClicks + 1 }));
    setFloats(f => [...f, { id: Math.random(), x, y, gain, born: Date.now() }]);
    setClickPulse(p => p + 1);
    if (soundRef.current) playTone(520 + Math.random() * 40, 0.06, 'sine', 0.03);
  }, [perClick]);

  // cleanup floats
  useEffect(() => {
    if (floats.length === 0) return;
    const id = setTimeout(() => {
      setFloats(f => f.filter(x => Date.now() - x.born < 1000));
    }, 1100);
    return () => clearTimeout(id);
  }, [floats]);

  const handleGoldenClick = useCallback(() => {
    setGolden(null);
    setGoldenActiveUntil(Date.now() + 13_000);
    setState(s => ({ ...s, goldenClicks: s.goldenClicks + 1 }));
    if (soundRef.current) {
      playTone(880, 0.1, 'triangle', 0.08);
      setTimeout(() => playTone(1320, 0.15, 'triangle', 0.08), 80);
    }
  }, []);

  const buyGenerator = useCallback((genId) => {
    setState(s => {
      const gen = GENERATORS.find(x => x.id === genId);
      const owned = s.generators[genId] || 0;
      const cost = genCost(gen.baseCost, owned);
      if (s.teeth < cost) return s;
      if (soundRef.current) playTone(700, 0.08, 'square', 0.04);
      return {
        ...s,
        teeth: s.teeth - cost,
        generators: { ...s.generators, [genId]: owned + 1 },
      };
    });
  }, []);

  const buyClickUpgrade = useCallback((upId) => {
    setState(s => {
      if (s.clickUpgrades[upId]) return s;
      const up = CLICK_UPGRADES.find(x => x.id === upId);
      if (s.teeth < up.cost) return s;
      if (soundRef.current) {
        playTone(800, 0.08, 'triangle', 0.05);
        setTimeout(() => playTone(1000, 0.08, 'triangle', 0.05), 60);
      }
      return {
        ...s,
        teeth: s.teeth - up.cost,
        clickUpgrades: { ...s.clickUpgrades, [upId]: true },
      };
    });
  }, []);

  const doPrestige = useCallback(() => {
    setShowPrestigeConfirm(false);
    if (prestigeGain <= 0) return;
    setState(s => ({
      ...defaultState(),
      prestige: (s.prestige || 0) + prestigeGain,
      achievements: s.achievements, // keep achievements
      startedAt: s.startedAt,
      timePlayed: s.timePlayed,
      totalClicks: s.totalClicks,
      goldenClicks: s.goldenClicks,
      lastTick: Date.now(),
    }));
    if (soundRef.current) {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'triangle', 0.06), i * 80));
    }
  }, [prestigeGain]);

  const doReset = useCallback(() => {
    setShowResetConfirm(false);
    deleteUserSave(username);
    try { cloudDeleteScore(username); } catch (e) {}
    setState(defaultState());
    onDeleteUser && onDeleteUser();
  }, [username, onDeleteUser]);

  const toggleLang = useCallback(() => {
    setLangLocal(l => {
      const n = l === 'es' ? 'en' : 'es';
      localStorage.setItem(LANG_KEY, n);
      onLangChange && onLangChange(n);
      return n;
    });
  }, [onLangChange]);

  const toggleSound = useCallback(() => {
    setSoundOn(s => {
      localStorage.setItem(SOUND_KEY, s ? '0' : '1');
      return !s;
    });
  }, []);

  const cycleNumFormat = useCallback(() => {
    const order = ['short', 'long', 'engineering', 'scientific'];
    setNumFormatLocal(m => {
      const next = order[(order.indexOf(m) + 1) % order.length];
      try { localStorage.setItem(NUMFMT_KEY, next); } catch (e) {}
      onNumFormatChange && onNumFormatChange(next);
      return next;
    });
  }, [onNumFormatChange]);

  // Generators with reveal logic: revealed once totalEarned or teeth ever reached 75% of unlockAt
  const genStatus = GENERATORS.map(g => {
    const owned = state.generators[g.id] || 0;
    const cost = genCost(g.baseCost, owned);
    const unlocked = state.totalEarned >= g.unlockAt || owned > 0;
    const revealed = state.totalEarned >= g.unlockAt * 0.5 || owned > 0 || GENERATORS.indexOf(g) === 0;
    return { gen: g, owned, cost, unlocked, revealed, canAfford: state.teeth >= cost, production: genProductions[g.id] };
  });

  const clickStatus = CLICK_UPGRADES.map(u => {
    const unlocked = state.totalEarned >= u.unlockAt;
    return { up: u, purchased: !!state.clickUpgrades[u.id], unlocked, canAfford: state.teeth >= u.cost };
  });

  const nextAffordable = genStatus.find(g => g.unlocked && g.canAfford);

  // ---- Render ----
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-canvas)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--fg-1)',
    }}>
      {/* Top bar */}
      <header style={{
        height: 64,
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center',
        padding: '0 var(--spacing-6)',
        gap: 'var(--spacing-4)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-s)',
          background: 'var(--primary-i100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <i className="fa-solid fa-tooth" style={{ fontSize: 16 }}></i>
        </div>
        <div style={{ flex: 1 }}>
          <div className="t-heading-s" style={{ color: 'var(--fg-1)', lineHeight: 1.2 }}>{t.appName}</div>
          <div className="t-body-xs" style={{ color: 'var(--fg-3)' }}>{t.appSubtitle}</div>
        </div>

        {goldenActiveUntil > Date.now() && (
          <div style={{
            padding: '6px 12px',
            background: 'var(--warning-i010)',
            border: '1px solid var(--warning-i050)',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--warning-i130)',
            fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            animation: 'pulse 1s ease-in-out infinite',
          }}>
            <i className="fa-solid fa-bolt"></i>
            {t.goldenActive} — {Math.max(0, Math.ceil((goldenActiveUntil - Date.now()) / 1000))}s
          </div>
        )}

        <div style={{
          padding: '6px 10px 6px 8px',
          background: 'var(--primary-i010)',
          borderRadius: 'var(--radius-pill)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--primary-i100)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 11,
          }}>{(username[0] || '?').toUpperCase()}</div>
          <div className="t-body-s" style={{ color: 'var(--primary-i130)', fontWeight: 500 }}>{username}</div>
        </div>
        <button onClick={doManualSave} style={topBtnStyle} title={t.saveNow}>
          <i className={saveFlash ? 'fa-solid fa-check' : 'fa-solid fa-floppy-disk'} style={{ marginRight: 6, color: saveFlash ? 'var(--positive-i100)' : 'inherit' }}></i>
          {saveFlash ? t.savedJustNow : t.saveNow}
        </button>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ ...topBtnStyle, background: menuOpen ? 'var(--bg-3)' : 'transparent' }}
            title={t.menuOptions}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
          {menuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: 220,
                background: 'var(--bg-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-s)',
                boxShadow: 'var(--elevation-20)',
                padding: 6,
                zIndex: 20,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}
            >
              <MenuItem
                icon={soundOn ? 'fa-volume-high' : 'fa-volume-xmark'}
                label={soundOn ? t.soundOn : t.soundOff}
                onClick={() => { toggleSound(); }}
              />
              <MenuItem
                icon="fa-language"
                label={lang === 'es' ? 'Español' : 'English'}
                trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{t.lang === 'ES' ? 'EN →' : 'ES →'}</span>}
                onClick={() => { toggleLang(); }}
              />
              <MenuItem
                icon="fa-hashtag"
                label={lang === 'es' ? 'Formato numérico' : 'Number format'}
                trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{({short:'1.2M', long: lang === 'es' ? 'millón' : 'million', engineering:'1.2e6', scientific:'10^6'})[numFormat]}  →</span>}
                onClick={() => { cycleNumFormat(); }}
              />
              <MenuDivider />
              <MenuItem
                icon="fa-right-from-bracket"
                label={t.logout}
                onClick={() => {
                  setMenuOpen(false);
                  // Save progress + push to cloud BEFORE logging out
                  try { persistUserSave(username, stateRef.current); } catch (e) {}
                  try {
                    const s = stateRef.current;
                    if (s) cloudSubmitScore({
                      name: username,
                      totalEarned: s.totalEarned || 0,
                      prestige: s.prestige || 0,
                      timePlayed: s.timePlayed || 0,
                      teeth: s.teeth || 0,
                    });
                  } catch (e) {}
                  onLogout && onLogout();
                }}
              />
              <MenuItem
                icon="fa-trash"
                label={t.reset}
                danger
                onClick={() => { setMenuOpen(false); setShowResetConfirm(true); }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main layout: tooth hero + upgrades panel */}
      <main style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 1fr) minmax(560px, 1.4fr)',
        gap: 'var(--spacing-6)',
        padding: 'var(--spacing-6)',
        maxWidth: 1440,
        margin: '0 auto',
        alignItems: 'start',
      }}>
        {/* LEFT: hero tooth + stats */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
          {/* Stats tiles row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <StatTile
              label={t.currentTeeth}
              value={fmt(state.teeth)}
              sub={`${fmt(perSecond)} ${t.perSecond}`}
              icon="fa-solid fa-tooth"
              accent="var(--primary-i100)"
            />
            <StatTile
              label={t.perClick}
              value={fmt(perClick)}
              sub={globalMult > 1 ? `x${globalMult.toFixed(2)} ${t.prestigeBonus.toLowerCase()}` : ''}
              icon="fa-solid fa-hand-pointer"
              accent="var(--alternative-i100)"
            />
          </div>

          {/* Tooth clicker card */}
          <div style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-m)',
            padding: 'var(--spacing-8) var(--spacing-6)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 'var(--spacing-5)',
            boxShadow: 'var(--elevation-10)',
          }}>
            <div
              onClick={handleClick}
              style={{
                position: 'relative',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                transition: 'transform 80ms ease-out',
                transform: `scale(${1 - (clickPulse % 2) * 0.04})`,
              }}
              key={clickPulse}
            >
              <ToothIcon size={260} golden={goldenMult > 1} />
              {/* floating numbers */}
              {floats.map(f => (
                <div
                  key={f.id}
                  style={{
                    position: 'absolute',
                    left: f.x, top: f.y,
                    pointerEvents: 'none',
                    transform: 'translate(-50%, -50%)',
                    color: goldenMult > 1 ? 'var(--warning-i100)' : 'var(--primary-i100)',
                    fontWeight: 700,
                    fontSize: 22,
                    textShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    animation: 'floatUp 1s ease-out forwards',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  +{fmt(f.gain)}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="t-heading-m" style={{ color: 'var(--fg-1)' }}>{t.clickMe}</div>
              <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4 }}>
                +{fmt(perClick)} {t.teeth} / click
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <StatTile label={t.totalClicks} value={fmt(state.totalClicks)} icon="fa-solid fa-hand-pointer" />
            <StatTile label={t.timePlayed} value={formatTime(state.timePlayed)} icon="fa-solid fa-clock" />
          </div>
        </section>

        {/* RIGHT: tabs + upgrades */}
        <section style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-m)',
          padding: 'var(--spacing-5) var(--spacing-6) var(--spacing-6)',
          minHeight: 620,
          boxShadow: 'var(--elevation-10)',
        }}>
          <TabBar
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'generators', label: t.tabGen, icon: 'fa-solid fa-industry' },
              { id: 'click', label: t.tabClick, icon: 'fa-solid fa-hand-pointer' },
              { id: 'achievements', label: t.tabAch, icon: 'fa-solid fa-trophy', badge: `${achUnlockedCount}/${ACHIEVEMENTS.length}` },
              { id: 'prestige', label: t.tabPrestige, icon: 'fa-solid fa-crown' },
              { id: 'leaderboard', label: t.tabLeaderboard, icon: 'fa-solid fa-ranking-star' },
              { id: 'stats', label: t.tabStats, icon: 'fa-solid fa-chart-line' },
            ]}
          />

          {tab === 'generators' && (
            <div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <div className="t-heading-m">{t.generatorsTitle}</div>
                <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.generatorsSub}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {genStatus.map(g => (
                  <GeneratorRow
                    key={g.gen.id}
                    gen={g.gen}
                    owned={g.owned}
                    cost={g.cost}
                    canAfford={g.canAfford}
                    unlocked={g.unlocked}
                    revealed={g.revealed}
                    production={g.production}
                    lang={lang}
                    totalTeeth={state.totalEarned}
                    onBuy={() => buyGenerator(g.gen.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === 'click' && (
            <div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <div className="t-heading-m">{t.clickPowerTitle}</div>
                <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.clickPowerSub}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {clickStatus.map(c => (
                  <ClickUpgradeRow
                    key={c.up.id}
                    up={c.up}
                    purchased={c.purchased}
                    unlocked={c.unlocked}
                    canAfford={c.canAfford}
                    lang={lang}
                    totalTeeth={state.totalEarned}
                    onBuy={() => buyClickUpgrade(c.up.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === 'achievements' && (
            <div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <div className="t-heading-m">{t.achTitle}</div>
                <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.achSub}</div>
                <div className="t-body-s" style={{ color: 'var(--fg-2)', marginTop: 6 }}>
                  {achUnlockedCount}/{ACHIEVEMENTS.length} · +{achUnlockedCount}% {lang === 'es' ? 'bonus' : 'bonus'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                {ACHIEVEMENTS.map(a => (
                  <AchievementCard key={a.id} ach={a} unlocked={!!state.achievements[a.id]} lang={lang} />
                ))}
              </div>
            </div>
          )}

          {tab === 'prestige' && (
            <div>
              <div style={{ marginBottom: 'var(--spacing-5)' }}>
                <div className="t-heading-m" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-crown" style={{ color: 'var(--warning-i100)' }}></i>
                  {t.prestigeTitle}
                </div>
                <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4, maxWidth: 540 }}>{t.prestigeDesc}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
                <StatTile label={t.prestigeHave} value={fmt(state.prestige)} icon="fa-solid fa-crown" accent="var(--warning-i130)" />
                <StatTile label={t.prestigeEarn} value={`+${fmt(prestigeGain)}`} icon="fa-solid fa-plus" accent="var(--positive-i100)" />
                <StatTile label={t.prestigeBonus} value={`+${((prestigeMult - 1) * 100).toFixed(0)}%`} icon="fa-solid fa-chart-line" accent="var(--alternative-i100)" />
              </div>

              <button
                onClick={() => setShowPrestigeConfirm(true)}
                disabled={prestigeGain <= 0}
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: 'var(--spacing-4) var(--spacing-6)',
                  background: prestigeGain > 0 ? 'var(--warning-i100)' : 'var(--bg-3)',
                  color: prestigeGain > 0 ? 'var(--warning-i150)' : 'var(--fg-4)',
                  border: 'none',
                  borderRadius: 'var(--radius-s)',
                  fontWeight: 600, fontSize: 15,
                  cursor: prestigeGain > 0 ? 'pointer' : 'not-allowed',
                  width: '100%',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { if (prestigeGain > 0) e.currentTarget.style.background = 'var(--warning-i070)'; }}
                onMouseLeave={e => { if (prestigeGain > 0) e.currentTarget.style.background = 'var(--warning-i100)'; }}
              >
                <i className="fa-solid fa-crown"></i>
                {prestigeGain > 0 ? t.prestigeBtn : t.prestigeLock}
              </button>
            </div>
          )}

          {tab === 'leaderboard' && (
            <LeaderboardPanel username={username} lang={lang} />
          )}

          {tab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
              <div>
                <div className="t-heading-m">{t.statsTitle}</div>
                <div className="t-body-s" style={{ color: 'var(--fg-3)', marginTop: 2 }}>
                  {lang === 'es' ? 'Todo lo que pasó en tu consulta.' : 'Everything that happened in your practice.'}
                </div>
              </div>

              {/* Production group */}
              <StatsGroup
                title={lang === 'es' ? 'Producción' : 'Production'}
                icon="fa-solid fa-gauge-high"
                accent="var(--primary-i100)"
                rows={[
                  { label: t.currentTeeth, value: fmt(state.teeth), strong: true },
                  { label: t.perSecond, value: fmt(perSecond), color: 'var(--positive-i100)' },
                  { label: t.perClick, value: fmt(perClick), color: 'var(--alternative-i100)' },
                  { label: lang === 'es' ? 'Bonus global' : 'Global bonus', value: `x${globalMult.toFixed(2)}`, color: 'var(--warning-i130)' },
                ]}
              />

              {/* Progress group */}
              <StatsGroup
                title={lang === 'es' ? 'Progreso' : 'Progress'}
                icon="fa-solid fa-chart-line"
                accent="var(--positive-i100)"
                rows={[
                  { label: t.totalTeeth, value: fmt(state.totalEarned), strong: true },
                  { label: t.totalClicks, value: fmt(state.totalClicks) },
                  { label: lang === 'es' ? 'Generadores totales' : 'Total generators', value: fmt(Object.values(state.generators || {}).reduce((a, b) => a + (b || 0), 0)) },
                  { label: lang === 'es' ? 'Mejoras compradas' : 'Upgrades bought', value: `${Object.values(state.clickUpgrades || {}).filter(Boolean).length}/${CLICK_UPGRADES.length}` },
                  { label: lang === 'es' ? 'Logros' : 'Achievements', value: `${Object.keys(state.achievements || {}).length}/${ACHIEVEMENTS.length}` },
                ]}
              />

              {/* Prestige group */}
              <StatsGroup
                title={t.prestige}
                icon="fa-solid fa-crown"
                accent="var(--warning-i130)"
                rows={[
                  { label: t.prestigeHave, value: fmt(state.prestige), strong: true },
                  { label: lang === 'es' ? 'Próxima ganancia' : 'Next gain', value: `+${fmt(prestigeGain)}` },
                  { label: lang === 'es' ? 'Dientes dorados' : 'Golden teeth', value: fmt(state.goldenClicks), color: 'var(--warning-i100)' },
                ]}
              />

              {/* Time group */}
              <StatsGroup
                title={lang === 'es' ? 'Tiempo' : 'Time'}
                icon="fa-solid fa-clock"
                accent="var(--fg-2)"
                rows={[
                  { label: t.timePlayed, value: formatTime(state.timePlayed), strong: true },
                  { label: lang === 'es' ? 'Empezaste' : 'Started', value: new Date(state.startedAt || Date.now()).toLocaleDateString(lang === 'es' ? 'es' : 'en') },
                  { label: lang === 'es' ? 'Sesión actual' : 'Current session', value: formatTime(Math.max(0, (state.timePlayed || 0) - (bootRef.current?.saved?.timePlayed || 0))) },
                ]}
              />
            </div>
          )}
        </section>
      </main>

      {/* Golden tooth */}
      {golden && (
        <button
          onClick={handleGoldenClick}
          style={{
            position: 'fixed',
            left: golden.x, top: golden.y,
            transform: 'translate(-50%, -50%)',
            background: 'none', border: 'none',
            cursor: 'pointer',
            zIndex: 500,
            animation: 'goldFloat 2.2s ease-in-out infinite, goldSpin 6s linear infinite',
            padding: 0,
          }}
        >
          <ToothIcon size={72} golden />
        </button>
      )}

      <Toast toast={toast} lang={lang} />

      {/* Welcome-back offline earnings modal */}
      {showWelcomeBack && offlineInfo && (
        <Modal onClose={() => setShowWelcomeBack(false)}>
          <div style={{
            width: 54, height: 54, borderRadius: 'var(--radius-s)',
            background: 'var(--primary-i010)', color: 'var(--primary-i100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--spacing-3)',
          }}>
            <i className="fa-solid fa-face-smile" style={{ fontSize: 22 }}></i>
          </div>
          <div className="t-heading-m">{t.welcomeBackTitle}, {username}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 10, lineHeight: 1.55 }}>
            {t.welcomeBackMsg}{' '}
            <strong style={{ color: 'var(--primary-i130)' }}>{fmt(Math.floor(offlineInfo.earned))}</strong>{' '}
            {t.welcomeBackPatients}.
          </div>
          {offlineInfo.wasCapped ? (
            <div className="t-body-s" style={{ color: 'var(--warning-i130)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'var(--warning-i010)', border: '1px solid var(--warning-i030)', borderRadius: 6 }}>
              <i className="fa-solid fa-clock"></i> {t.welcomeBackCap}
            </div>
          ) : (
            <div className="t-body-s" style={{ color: 'var(--fg-3)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-clock"></i> {t.welcomeBackCap}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 'var(--spacing-5)' }}>
            <button onClick={() => setShowWelcomeBack(false)} style={primaryBtnStyle}>
              <i className="fa-solid fa-arrow-right" style={{ marginRight: 6 }}></i>
              {t.welcomeBackContinue}
            </button>
          </div>
        </Modal>
      )}

      {/* Prestige confirm modal */}
      {showPrestigeConfirm && (
        <Modal onClose={() => setShowPrestigeConfirm(false)}>
          <div style={{
            width: 54, height: 54, borderRadius: 'var(--radius-s)',
            background: 'var(--warning-i010)', color: 'var(--warning-i100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--spacing-3)',
          }}>
            <i className="fa-solid fa-crown" style={{ fontSize: 22 }}></i>
          </div>
          <div className="t-heading-m">{t.prestigeBtn}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 6 }}>{t.confirmPrestige}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'var(--spacing-5)' }}>
            <button onClick={() => setShowPrestigeConfirm(false)} style={secondaryBtnStyle}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button onClick={doPrestige} style={{ ...primaryBtnStyle, background: 'var(--warning-i100)', color: 'var(--warning-i150)' }}>
              <i className="fa-solid fa-crown" style={{ marginRight: 6 }}></i>
              {t.prestigeBtn}
            </button>
          </div>
        </Modal>
      )}

      {showResetConfirm && (
        <Modal onClose={() => setShowResetConfirm(false)}>
          <div style={{
            width: 54, height: 54, borderRadius: 'var(--radius-s)',
            background: 'var(--negative-i010)', color: 'var(--negative-i100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--spacing-3)',
          }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 22 }}></i>
          </div>
          <div className="t-heading-m">{t.reset}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 6 }}>{t.confirmReset}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'var(--spacing-5)' }}>
            <button onClick={() => setShowResetConfirm(false)} style={secondaryBtnStyle}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button onClick={doReset} style={{ ...primaryBtnStyle, background: 'var(--negative-i100)' }}>
              {t.reset}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const topBtnStyle = {
  all: 'unset', boxSizing: 'border-box',
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--fg-2)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-s)',
  cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center',
  background: 'var(--bg-1)',
  fontFamily: 'var(--font-sans)',
};

const primaryBtnStyle = {
  all: 'unset', boxSizing: 'border-box',
  padding: '10px 18px',
  background: 'var(--primary-i100)',
  color: '#fff',
  borderRadius: 'var(--radius-s)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  flex: 1,
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
};

const secondaryBtnStyle = {
  all: 'unset', boxSizing: 'border-box',
  padding: '10px 18px',
  background: 'var(--bg-3)',
  color: 'var(--fg-1)',
  borderRadius: 'var(--radius-s)',
  fontWeight: 500,
  fontSize: 14,
  cursor: 'pointer',
  flex: 1,
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
};

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5, 9, 13, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 150ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-1)',
          padding: 'var(--spacing-6)',
          borderRadius: 'var(--radius-m)',
          boxShadow: 'var(--elevation-30)',
          maxWidth: 420, width: '92%',
          animation: 'modalIn 200ms ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger, trailing }) {
  const [hover, setHover] = useState(false);
  const color = danger ? 'var(--negative-i100)' : 'var(--fg-1)';
  return (
    <button
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        all: 'unset', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        background: hover ? (danger ? 'var(--negative-i010)' : 'var(--bg-3)') : 'transparent',
        color,
        fontSize: 14,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <i className={`fa-solid ${icon}`} style={{ width: 16, textAlign: 'center', color }}></i>
      <span style={{ flex: 1 }}>{label}</span>
      {trailing}
    </button>
  );
}

function MenuDivider() {
  return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 2px' }} />;
}

Object.assign(window, { App, Game, Modal, MenuItem, MenuDivider, primaryBtnStyle, secondaryBtnStyle, topBtnStyle, defaultState, loadUserSave, persistUserSave, getLeaderboard, deleteUserSave });
