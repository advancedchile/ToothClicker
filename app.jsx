// Tooth Clicker — Main App + Game component
// Constants, utilities, defaultState → utils.jsx
// BossMarquee → boss-marquee.jsx
// FallingTeethSimulation → falling-teeth.jsx
// MusicFloatingBtn, MusicPlayerModal → music.jsx
// FeedbackModal → feedback.jsx
// AdminPanel → admin.jsx

const { useState, useEffect, useRef, useMemo, useCallback } = React;
const { 
  loadUsers, saveUsers, loadUserSave, persistUserSave, deleteUserSave, 
  resetAllProgress, defaultState, 
  SAVES_KEY, USERS_KEY, DEVICE_USER_KEY, CURRENT_USER_KEY, LAST_RESET_KEY, ADMIN_AUTH_KEY, ADMIN_NAME, ADMIN_USERS_KEY, LANG_KEY, SOUND_KEY, NUMFMT_KEY
} = window;


function Modal({ children, onClose, maxWidth, persistent }) {
  return (
    <div onClick={() => !persistent && onClose && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(5,9,13,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeIn 150ms ease' }}>
      <div className="game-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-1)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-m)', boxShadow: 'var(--elevation-30)', maxWidth: maxWidth || 420, width: '92%', animation: 'modalIn 200ms ease', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

function Game({ username, saved: cloudSaved, sessionId, lang: initialLang, onLangChange, onLogout, onDeleteUser, numFormat: initialNumFormat, onNumFormatChange }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const isAdmin = username === 'James';
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const bootRef = useRef(null);
  if (bootRef.current === null) {
    const OFFLINE_CAP_S = 2 * 60 * 60;
    const localSnap = loadUserSave(username);
    
    // Merge logic: use cloud if it has better progress, otherwise keep local
    let snap = localSnap;
    if (cloudSaved) {
      const cloudPCount = cloudSaved.prestigeCount || 0;
      const localPCount = localSnap?.prestigeCount || 0;
      const cloudTotal = cloudSaved.lifetimeEarned || cloudSaved.totalEarned || 0;
      const localTotal = localSnap?.lifetimeEarned || localSnap?.totalEarned || 0;
      
      // If cloud is strictly better in either metric, use cloud
      if (!localSnap || cloudPCount > localPCount || cloudTotal > localTotal) {
        console.log("[Sync] Using cloud save as it has better progress.");
        snap = { ...defaultState(), ...cloudSaved };
      } else {
        console.log("[Sync] Keeping local save as it has better progress.");
      }
    }

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
    
    // Legacy support: for old saves, auto-grant upgrades for already earned achievements/levels
    if (!base.legacyAcademyFixDone) {
      if (!base.xpUpgrades) base.xpUpgrades = {};
      (window.XP_UPGRADES || []).forEach(up => {
        if (up.achievementId && base.achievements && base.achievements[up.achievementId]) {
          base.xpUpgrades[up.id] = true;
        }
      });
      (window.LEVEL_UPGRADES || []).forEach(up => {
        if (base.level >= up.levelReq) {
          base.xpUpgrades[up.id] = true;
        }
      });
      base.legacyAcademyFixDone = true;
    }

    if (offlineInfo) return { ...base, teeth: (base.teeth || 0) + offlineInfo.earned, totalEarned: (base.totalEarned || 0) + offlineInfo.earned, lifetimeEarned: (base.lifetimeEarned || 0) + offlineInfo.earned, lastTick: Date.now() };
    return { ...base, lastTick: Date.now() };
  });
  const [showWelcomeBack, setShowWelcomeBack] = useState(() => !!offlineInfo);
  const [lang, setLangLocal] = useState(initialLang);
  const [numFormat, setNumFormatLocal] = useState(initialNumFormat || 'short');
  if (typeof window !== 'undefined') {window.__numFormat = numFormat;window.__lang = lang;}
  const fmt = useCallback((n, kd = false) => window.formatNumWithMode(n, numFormat, lang, kd), [numFormat, lang]);
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
  const [contextMenu, setContextMenu] = useState(null); // { x, y }
  const [showCuriosityModal, setShowCuriosityModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [newToothUnlock, setNewToothUnlock] = useState(null); // { stage, idx }
  const [buyQty, setBuyQty] = useState(1);
  const [visualTick, setVisualTick] = useState(0);
  const [sunOpacity, setSunOpacity] = useState(0);
  const [sunColor, setSunColor] = useState('transparent');
  // Special bonus teeth — only one shown at a time
  const [specialTooth, setSpecialTooth] = useState(null); // { type:'gold'|'diamond'|'crystal', x, y, id }
  const specialToothRef = useRef(null);
  const getNextBonusTime = (min, max) => Date.now() + (min + Math.random() * (max - min)) * 60000;
  const specialNextRef = useRef(getNextBonusTime(5, 10)); // first spawn after 5-10 min
  const [crystalFrenzyUntil, setCrystalFrenzyUntil] = useState(0);
  const [holdBonusUntil, setHoldBonusUntil] = useState(0);
  
  // Music Player State
  const audioRef = useRef(null);
  const musicAttempted = useRef(false);
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(() => {
    const id = saved?.musicSettings?.currentTrackId;
    const found = MUSIC_TRACKS.find(t => t.id === id);
    return found || MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];
  });
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(() => saved?.musicSettings?.volume ?? 0.4);
  const [musicMuted, setMusicMuted] = useState(() => saved?.musicSettings?.muted ?? false);
  const [playMode, setPlayMode] = useState(() => saved?.musicSettings?.playMode ?? 'shuffle');
  const [musicTime, setMusicTime] = useState(0);
  const [tabsMenuOpen, setTabsMenuOpen] = useState(false);
  const [musicDuration, setMusicDuration] = useState(0);
  const sessionStartMinutes = useRef(null);

  const handlePlayModeChange = (m) => {
    setPlayMode(curr => {
      if (m === 'stop') return curr === 'stop' ? 'shuffle' : 'stop';
      let parts = curr === 'stop' ? [] : curr.split('+');
      if (parts.includes(m)) parts = parts.filter(x => x !== m);
      else parts.push(m);
      return parts.length === 0 ? 'stop' : parts.join('+');
    });
  };

  const handleStop = () => {
    userPausedMusic.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsMusicPlaying(false);
  };

  const handlePlayRandom = () => {
    if (tracks.length === 0) return;
    const random = tracks[Math.floor(Math.random() * tracks.length)];
    setCurrentTrack(random);
    setIsMusicPlaying(true);
  };


  useEffect(() => {
    if (sessionStartMinutes.current === null && state.timePlayed > 0) {
      sessionStartMinutes.current = state.timePlayed / 60;
    }
  }, [state.timePlayed]);

  useEffect(() => {
    setState(s => ({
      ...s,
      musicSettings: {
        volume: musicVolume,
        muted: musicMuted,
        playMode: playMode,
        currentTrackId: currentTrack?.id
      }
    }));
  }, [musicVolume, musicMuted, playMode, currentTrack]);

  // Load dynamic music from GitHub
  useEffect(() => {
    fetch('https://api.github.com/repos/advancedchile/ToothClicker/contents/assets/music')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mp3s = data
            .filter(f => f.name.endsWith('.mp3') && f.name !== 'congrats.mp3')
            .map((f, i) => ({
              id: f.sha, // Use GitHub SHA as stable ID
              title: f.name.replace(/_/g, ' ').replace('.mp3', ''),
              src: f.path
            }));
          if (mp3s.length > 0) {
            setTracks(mp3s);
            // If current track is just a fallback, pick one from the new list
            setCurrentTrack(curr => {
              if (!curr || !mp3s.find(t => t.id === curr.id)) {
                const savedId = saved?.musicSettings?.currentTrackId;
                return mp3s.find(t => t.id === savedId) || mp3s[Math.floor(Math.random() * mp3s.length)];
              }
              return curr;
            });
          }
        }
      })
      .catch(err => console.warn('GitHub Music Sync failed, using fallbacks.', err));
  }, []);

  const initialFadeDone = useRef(false);

  // Volume sync (no fade for user adjustments)
  useEffect(() => {
    if (audioRef.current && initialFadeDone.current) {
      audioRef.current.volume = musicMuted ? 0 : musicVolume;
      localStorage.setItem('music-vol', musicVolume.toString());
    }
  }, [musicVolume, musicMuted]);

  // Handle Play/Change Track (Fade-in ONLY on entry)
  useEffect(() => {
    if (audioRef.current && isMusicPlaying) {
      const targetVol = musicMuted ? 0 : musicVolume;
      
      if (!initialFadeDone.current) {
        audioRef.current.volume = 0;
        audioRef.current.play().catch(e => {
          console.error('Initial audio play blocked:', e);
          setIsMusicPlaying(false);
        });

        // Initial fade in effect
        let cur = 0;
        const step = 0.02;
        const interval = setInterval(() => {
          cur += step;
          if (cur >= targetVol) {
            if (audioRef.current) audioRef.current.volume = targetVol;
            initialFadeDone.current = true;
            clearInterval(interval);
          } else {
            if (audioRef.current) audioRef.current.volume = cur;
          }
        }, 50);
        return () => clearInterval(interval);
      } else {
        // Regular track change or resume - instant volume sync
        audioRef.current.volume = targetVol;
        audioRef.current.play().catch(e => {
          console.error('Audio play blocked:', e);
          setIsMusicPlaying(false);
        });
      }
    } else if (audioRef.current && !isMusicPlaying) {
      audioRef.current.pause();
    }
  }, [isMusicPlaying, currentTrack]);

  const userPausedMusic = useRef(false);

  // Music auto-play is disabled per user request

  const [isMainMouseDown, setIsMainMouseDown] = useState(false);
  const [goldHoldProgress, setGoldHoldProgress] = useState(0); // 0–1
  const goldHoldRef = useRef({ interval: null, clicks: 0 });
  const mainToothRef = useRef(null);
  const autoClickTimerRef = useRef(null);
  // Bubbles on click
  const [bubbles, setBubbles] = useState([]);
  // Boss marquee
  const [bossMsg, setBossMsg] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [cheatLevel, setCheatLevel] = useState(0);
  const clickTimesRef = useRef([]);
  const [liveCPS, setLiveCPS] = useState(0);
  const [isEditingClinic, setIsEditingClinic] = useState(false);
  const [tempClinicName, setTempClinicName] = useState(state.clinicName || '');
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [academyFilter, setAcademyFilter] = useState('all');
  const [justLeveledTo, setJustLeveledTo] = useState(0);
  const [shownMilestones, setShownMilestones] = useState(() => {
    const saved = loadUserSave(username);
    return new Set(saved?.shownMilestones || []);
  });
  const [customMessages, setCustomMessages] = useState([]);
  const customLastShownRef = useRef({}); // { msgId: timestamp }

  // Live CPS tracker — updates every 200ms for smooth feedback
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const recent = clickTimesRef.current.filter(t => now - t < 1000);
      setLiveCPS(recent.length);
    }, 200);
    return () => clearInterval(id);
  }, []);

  const [currentTourStep, setCurrentTourStep] = useState(null);
  const [dontShowTourAgain, setDontShowTourAgain] = useState(() => {
    const saved = loadUserSave(username);
    return saved?.dontShowTourAgain === true;
  });
  // We'll track if the user has EVER seen the tour to decide whether to auto-start
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    const saved = loadUserSave(username);
    return !!saved?.hasSeenTour;
  });
  const [hasSeenHelpIndicator, setHasSeenHelpIndicator] = useState(() => {
    const saved = loadUserSave(username);
    return !!saved?.hasSeenHelpIndicator;
  });
  const buyXpUpgrade = (id) => {
    const up = [...(window.XP_UPGRADES || []), ...(window.LEVEL_UPGRADES || [])].find(u => u.id === id);
    if (!up || state.xpUpgrades[id]) return;
    const cost = up.baseCost;
    if (state.teeth < cost) return;
    
    window.playClickSound && window.playClickSound();
    setState(s => ({
      ...s,
      teeth: s.teeth - cost,
      xpUpgrades: { ...s.xpUpgrades, [id]: true }
    }));
  };

  const menuRef = useRef(null);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      return golden || specialTooth || holdBonusUntil > now || goldenActiveUntil > now || crystalFrenzyUntil > now;
    };
    if (!check()) return;
    const id = setInterval(() => setVisualTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [golden, specialTooth, holdBonusUntil, goldenActiveUntil, crystalFrenzyUntil]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      const menuW = 270, menuH = 320;
      let x = e.clientX, y = e.clientY;
      if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
      if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
      if (x < 8) x = 8;
      if (y < 8) y = 8;
      setContextMenu({ x, y });
    };
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const [globalTooltip, setGlobalTooltip] = useState(null);
  const [toothParticles, setToothParticles] = useState([]);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const soundRef = useRef(soundOn);soundRef.current = soundOn;
  const perClickRef = useRef(0);
  const t = window.STRINGS[lang];

  const storeMults = useMemo(() => {
    const res = { click: 1, global: 1, gen: {} };
    const boughtIds = Object.keys(state.storeUpgrades || {});
    boughtIds.forEach(id => {
      const up = (window.STORE_UPGRADES || []).find(u => u.id === id);
      if (!up) return;
      if (up.type === 'click') res.click *= up.multiplier;
      if (up.type === 'global') res.global *= up.multiplier;
      if (up.type === 'generator') res.gen[up.targetId] = (res.gen[up.targetId] || 1) * up.multiplier;
    });
    return res;
  }, [state.storeUpgrades]);

  const prestigeMult = 1 + 0.05 * (state.prestige || 0);
  const achMult = 1 + 0.01 * Object.values(state.achievements || {}).filter(Boolean).length;
  const academyGpsMult = useMemo(() => {
    const regular = (window.XP_UPGRADES || []).reduce((acc, up) => acc + (state.xpUpgrades[up.id] ? (up.gpsBonus || 0) : 0), 0);
    const special = (window.LEVEL_UPGRADES || []).reduce((acc, up) => acc + (state.xpUpgrades[up.id] ? (up.gpsBonus || 0) : 0), 0);
    return 1 + regular + special;
  }, [state.xpUpgrades]);
  const academyXpMult = useMemo(() => {
    const special = (window.LEVEL_UPGRADES || []).reduce((acc, up) => acc + (state.xpUpgrades[up.id] ? (up.xpMult || 0) : 0), 0);
    return 1 + special;
  }, [state.xpUpgrades]);
  const perSecondRaw = useMemo(() => {
    let v = 0;
    for (const g of window.GENERATORS) {
      let gProd = (state.generators[g.id] || 0) * g.baseProduction;
      if (storeMults.gen[g.id]) gProd *= storeMults.gen[g.id];
      v += gProd;
    }
    return v;
  }, [state.generators, storeMults]);
  const has75Gens = useMemo(() => {
    return Object.values(state.generators || {}).some(qty => qty >= 75);
  }, [state.generators]);

  const clickBase = useMemo(() => window.computeClickPower(state).total, [state.clickUpgrades, state.achievements, state.timePlayed]);
  
  // Click upgrades and store upgrades give 2x if 75+ gens, else 0.2x
  const upgradeBonus = (clickBase * (storeMults.click || 1)) - 1;
  const appliedUpgradeBonus = upgradeBonus * (has75Gens ? 2.0 : 0.2);

  const crystalMult = crystalFrenzyUntil > Date.now() ? 5 : 1;
  const goldenMult = goldenActiveUntil > Date.now() ? 7 : 1;
  const globalMult = prestigeMult * achMult * goldenMult * crystalMult * storeMults.global * academyGpsMult;
  
  const perClick = (1 + appliedUpgradeBonus) * globalMult;
  perClickRef.current = perClick;
  // Displayed tooth: player-selected if unlocked, else auto (highest unlocked)
  const autoStage = window.getToothStage(state.prestigeCount || 0);
  const selectedStage = (() => {
    const s = window.TOOTH_STAGES[state.selectedTooth || 0];
    if (s && (state.prestigeCount || 0) >= s.prestige) return s;
    return autoStage;
  })();
  const perSecond = perSecondRaw * globalMult;
  const genProductions = useMemo(() => {const out = {};for (const g of window.GENERATORS) out[g.id] = (state.generators[g.id] || 0) * g.baseProduction * globalMult;return out;}, [state.generators, globalMult]);
  const achUnlockedCount = Object.values(state.achievements || {}).filter(Boolean).length;
  const prestigeReq = useMemo(() => {
    const count = state.prestigeCount || 0;
    // Increased significantly: 100T base, 1.5x scaling
    return 100_000_000_000_000 * Math.pow(1.5, count);
  }, [state.prestigeCount]);

  const prestigeGain = useMemo(() => {
    if (state.totalEarned < prestigeReq) return 0;
    const B = 100_000_000_000_000;
    const r = 1.5;
    const n = state.prestigeCount || 0;
    // Calculate total points k that can be gained at once
    const k = Math.log(1 + (state.totalEarned * (r - 1)) / (B * Math.pow(r, n))) / Math.log(r);
    return Math.max(0, Math.floor(k));
  }, [state.totalEarned, prestigeReq, state.prestigeCount]);
  
  const auroraOpacity = useMemo(() => {
    const t = state.teeth || 0;
    if (t < 1e12) return 0;
    if (t < 5e14) return ((t - 1e12) / (5e14 - 1e12)) * 0.15;
    if (t < 2.5e16) return 0.15 + ((t - 5e14) / (2.5e16 - 5e14)) * 0.25;
    return Math.min(0.65, 0.4 + ((t - 2.5e16) / 1e18) * 0.25);
  }, [state.teeth]);

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
        
        // Passive XP Gain
        const xpPassiveBase = 0;
        const xpFromUpgrades = (window.XP_UPGRADES || []).reduce((acc, up) => acc + (s.xpUpgrades[up.id] ? up.xpPassive : 0), 0);
        
        // Apply global XP multipliers from special academy upgrades
        const specialXpMult = (window.LEVEL_UPGRADES || []).reduce((acc, up) => acc + (s.xpUpgrades[up.id] ? (up.xpMult || 0) : 0), 0);
        const globalXpMult = 1 + specialXpMult;

        let newXP = (s.xp || 0) + (xpPassiveBase + xpFromUpgrades) * globalXpMult * dt;
        let newLevel = s.level || 0;
        const maxLevel = 50000;
        while (newLevel < maxLevel) {
          const req = window.getXPRequired(newLevel);
          if (newXP >= req) {
            newXP -= req;
            newLevel++;
            setTimeout(() => {
              setJustLeveledTo(newLevel);
              setShowLevelUpModal(true);
              const audio = new Audio('assets/music/congrats.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            }, 0);
          } else { break; }
        }

        return { ...s, teeth: s.teeth + earned, totalEarned: s.totalEarned + earned, lifetimeEarned: (s.lifetimeEarned || 0) + earned, timePlayed: s.timePlayed + dt, lastTick: now, xp: newXP, level: newLevel };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [goldenActiveUntil]);

  // Autosave
  const doManualSave = useCallback(() => {
    try {
      persistUserSave(username, stateRef.current);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
      pushScore(); // Use unified push logic
    } catch (e) { console.error("Manual save failed:", e); }
  }, [username, pushScore]);

  useEffect(() => {
    const saveId = setInterval(() => {try {persistUserSave(username, stateRef.current);setSaveFlash(true);setTimeout(() => setSaveFlash(false), 1500);} catch (e) {}}, 60000);
    const onUnload = () => {try {persistUserSave(username, stateRef.current);} catch (e) {}};
    window.addEventListener('beforeunload', onUnload);
    return () => {clearInterval(saveId);window.removeEventListener('beforeunload', onUnload);onUnload();};
  }, [username]);

  useEffect(() => {
    // Show tour if it's the first time and they haven't opted out
    if (!hasSeenTour && !dontShowTourAgain && state.totalEarned === 0 && currentTourStep === null) {
      const timer = setTimeout(() => setCurrentTourStep(0), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, state.totalEarned, currentTourStep]);

  const pushScore = useCallback((stateOverride, isLeaving = false) => {
    const s = stateOverride || stateRef.current;
    if (!s || !username) return;
    const ban = window.AntiCheat.getBanData(username);
    const entry = { 
      name: username, 
      sessionId,
      totalEarned: s.lifetimeEarned || s.totalEarned || 0, 
      prestige: s.prestige || 0, 
      prestigeCount: s.prestigeCount || 0, 
      timePlayed: s.timePlayed || 0, 
      teeth: s.teeth || 0, 
      clinicName: s.clinicName, 
      level: s.level || 0,
      saveData: { ...s, isOnline: !isLeaving }, 
      banUntil: ban.until,
      banIndefinite: ban.until === -1
    };
    window.cloudSubmitScore(entry);
  }, [username, sessionId]);

  useEffect(() => {
    window.forcePushScore = pushScore;
    const first = setTimeout(() => pushScore(), 1500);
    const id = setInterval(() => pushScore(), 15000);
    const handleLeave = () => pushScore(null, true);
    window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') handleLeave(); });
    window.addEventListener('pagehide', handleLeave);
    return () => {
      delete window.forcePushScore; 
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener('visibilitychange', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
      handleLeave();
    };
  }, [pushScore]);

  // Achievement checker
  useEffect(() => {
    const newUnlocks = [];
    for (const a of window.ACHIEVEMENTS) {if (!state.achievements[a.id] && a.check(state)) newUnlocks.push(a);}
    if (newUnlocks.length > 0) {
      setState((s) => {
        const next = { ...s, achievements: { ...s.achievements }, newAchievementIds: { ...(s.newAchievementIds || {}) } };
        for (const a of newUnlocks) {
          next.achievements[a.id] = true;
          next.newAchievementIds[a.id] = true;
        }
        return next;
      });
      const a = newUnlocks[0];
      const hasUpgrade = (window.XP_UPGRADES || []).some(up => up.achievementId === a.id);
      
      setToast({
        ...a,
        desc_es: hasUpgrade ? `${a.desc_es} ¡Nueva mejora de academia desbloqueada!` : a.desc_es,
        desc_en: hasUpgrade ? `${a.desc_en} New academy upgrade unlocked!` : a.desc_en
      });
      
      setTimeout(() => setToast(null), 3500);
      if (soundRef.current) {window.playTone(660, 0.12, 'triangle', 0.06);setTimeout(() => window.playTone(880, 0.12, 'triangle', 0.06), 100);}
    }
  }, [state.totalClicks, state.totalEarned, state.lifetimeEarned, state.generators, state.prestige, state.goldenClicks, state.clickUpgrades, state.timePlayed, state.feedbackSent]);

  // Handle Custom Milestone Messages
  useEffect(() => {
    if (bossMsg || customMessages.length === 0 || sessionStartMinutes.current === null) return;
    const elapsedMinutes = (state.timePlayed || 0) / 60;
    
    // Find messages whose milestone has been reached but haven't been shown
    // AND were reached during THIS session (to avoid offline spam)
    const pending = customMessages.filter(m => {
      return elapsedMinutes >= m.milestone && 
             m.milestone >= sessionStartMinutes.current &&
             !shownMilestones.has('custom-' + m.id);
    });

    if (pending.length > 0) {
      // Pick the highest milestone reached that is still pending
      const pick = pending.sort((a, b) => b.milestone - a.milestone)[0];
      
      setBossMsg({ 
        who: pick.who, 
        es: pick.text, 
        en: pick.text, 
        isCustom: true,
        milestone: pick.milestone,
        color: pick.color,
        position: pick.position,
        size: pick.size,
        animation: pick.animation,
        particles: pick.particles
      });

      // Mark as shown both in local state and persistent state
      setShownMilestones(prev => {
        const next = new Set(prev);
        next.add('custom-' + pick.id);
        return next;
      });
      setState(s => ({
        ...s,
        shownMilestones: Array.from(new Set([...(s.shownMilestones || []), 'custom-' + pick.id]))
      }));
    }
  }, [state.timePlayed, bossMsg, customMessages, shownMilestones]);

  // Load custom messages on mount
  useEffect(() => {
    window.cloudLoadCustomMessages().then(res => {
      let msgs = res.ok ? res.messages : [];
      if (msgs.length === 0) {
        msgs = [
          { id: 'm1', who: 'Dani', text: 'qué bueno que ya estás "trabajando". el ticket de QA del flujo de pagos sigue sin tocar, eh.', milestone: 1, createdAt: Date.now() },
          { id: 'm2', who: 'Memo', text: 'lindo el clicker. el endpoint /auth lleva 1 minuto rompiendo staging. pero tú dale.', milestone: 2, createdAt: Date.now() + 1 },
          { id: 'm3', who: 'José María', text: 'el cliente acaba de entrar al call. yo le digo que estás "validando hipótesis", ¿sale?', milestone: 3, createdAt: Date.now() + 2 },
          { id: 'm4', who: 'Dani', text: '5 minutos clickeando. yo llevo 5 reportando el mismo bug del onboarding. coincidencia, seguro.', milestone: 5, createdAt: Date.now() + 3 },
          { id: 'm5', who: 'Memo', text: 'la build sigue rota. tu rama también. pero qué bonito clickeas.', milestone: 10, createdAt: Date.now() + 4 },
          { id: 'm6', who: 'José María', text: 'el prospecto preguntó por features. inventé 3. te las paso después, suerte.', milestone: 15, createdAt: Date.now() + 5 },
          { id: 'm7', who: 'Dani', text: '1 hora. ya escribí el bug report de tu productividad. severity: blocker.', milestone: 60, createdAt: Date.now() + 6 }
        ];
      }
      setCustomMessages(msgs);
    });
  }, []);

  // Golden tooth spawner — only when no other bonus is active
  useEffect(() => {
    let timeoutId;
    function spawnGolden() {
      const now = Date.now();
      // Skip if any bonus is active, another tooth is on screen, or on cooldown
      if (specialToothRef.current || golden || now < specialNextRef.current) return;
      if (goldenActiveUntil > now || crystalFrenzyUntil > now || holdBonusUntil > now) return;
      
      const w = window.innerWidth;const h = window.innerHeight;
      const x = 80 + Math.random() * (w - 160);const y = 120 + Math.random() * (h - 240);
      const id = Math.random().toString(36);
      setGolden({ x, y, id, spawnedAt: now });
      setTimeout(() => setGolden((g) => g && g.id === id ? null : g), 7000); // 7s duration
    }
    function scheduleNext() {timeoutId = setTimeout(() => {spawnGolden();scheduleNext();}, 60000 + Math.random() * 120000);}
    timeoutId = setTimeout(() => {spawnGolden();scheduleNext();}, 45000 + Math.random() * 30000);
    return () => clearTimeout(timeoutId);
  }, [goldenActiveUntil, crystalFrenzyUntil, holdBonusUntil, golden]);

  // Unified special tooth spawner — one at a time, 5-min cooldown after each
  useEffect(() => {
    const DURATIONS = { gold: 10000, diamond: 18000, crystal: 16000 };
    const check = setInterval(() => {
      if (specialToothRef.current) return;
      const now = Date.now();
      // Block if any other bonus active
      if (goldenActiveUntil > now || crystalFrenzyUntil > now || holdBonusUntil > now) return;
      // Block if golden classic tooth is on screen or cooldown active
      if (golden || now < specialNextRef.current) return;
      const types = ['gold', 'diamond', 'crystal'];
      const type = types[Math.floor(Math.random() * types.length)];
      const w = window.innerWidth, h = window.innerHeight;
      const id = Math.random().toString(36);
      const tooth = { type, x: 80 + Math.random() * (w - 160), y: 120 + Math.random() * (h - 240), id, spawnedAt: now };
      specialToothRef.current = tooth;
      setSpecialTooth(tooth);
      setTimeout(() => {
        if (specialToothRef.current?.id === id) {
          specialToothRef.current = null;
          setSpecialTooth(null);
          specialNextRef.current = getNextBonusTime(8, 15); // 8-15 min cooldown on timeout
        }
      }, 7000); // 7s duration
    }, 3000);
    return () => clearTimeout(check);
  }, []);

  const performClick = useCallback((x, y) => {
    if (cheatLevel > 0) return;
    const gain = perClickRef.current;
    setState((s) => {
      const now = Date.now();
      clickTimesRef.current = [...clickTimesRef.current.filter(t => now - t < 1000), now];
      const cps = clickTimesRef.current.length;
      const maxCPS = (() => { try { return parseInt(localStorage.getItem('admin_cps_threshold')) || 20; } catch(e) { return 20; } })();
      if (cps >= maxCPS && cheatLevel === 0) {
        const banResult = window.AntiCheat.applyBan(username);
        if (banResult) {
          setCheatLevel(banResult.newLevel);
          setIsMainMouseDown(false);
        }
      }
      const xpPerClickBase = 0.1;
      const xpFromUpgrades = (window.XP_UPGRADES || []).reduce((acc, up) => acc + (s.xpUpgrades[up.id] ? up.xpPerClick : 0), 0);
      const xpGained = xpPerClickBase + xpFromUpgrades;
      
      let newXP = (s.xp || 0) + xpGained;
      let newLevel = s.level || 0;
      const maxLevel = 50000;
      
      while (newLevel < maxLevel) {
        const req = window.getXPRequired(newLevel);
        if (newXP >= req) {
          newXP -= req;
          newLevel++;
          // Trigger level up effect
          setTimeout(() => {
            setJustLeveledTo(newLevel);
            setShowLevelUpModal(true);
            const audio = new Audio('assets/music/congrats.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          }, 0);
        } else {
          break;
        }
      }

      return { ...s, teeth: s.teeth + gain, totalEarned: s.totalEarned + gain, lifetimeEarned: (s.lifetimeEarned || 0) + gain, totalClicks: s.totalClicks + 1, maxCPS: Math.max(s.maxCPS || 0, cps), xp: newXP, level: newLevel };
    });
    setFloats([{ id: Math.random(), x, y, gain, born: Date.now(), tx: (Math.random() - 0.5) * 80 }]);
    setToothParticles([{ id: Math.random(), x, y, born: Date.now(), tx: (Math.random() - 0.5) * 320, rot: (Math.random() - 0.5) * 180 }]);
    // Bubble particles — subtle (2-3)
    const newBubbles = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => ({
      id: Math.random(), born: Date.now(),
      x: x + (Math.random() - 0.5) * 50,
      y: y + (Math.random() - 0.5) * 40,
      size: 4 + Math.random() * 5,
      dx: (Math.random() - 0.5) * 20,
      dy: -(15 + Math.random() * 25),
      hue: 200 + Math.random() * 40,
    }));
    setBubbles((b) => [...b, ...newBubbles]);
    setClickPulse((p) => p + 1);
    if (soundRef.current) window.playTone(520 + Math.random() * 40, 0.06, 'sine', 0.03);
  }, []);

  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    performClick(x, y);
  }, [performClick]);

  useEffect(() => {
    if (floats.length === 0) return;
    const id = setTimeout(() => setFloats((f) => f.filter((x) => Date.now() - x.born < 800)), 800);
    return () => clearTimeout(id);
  }, [floats]);

  useEffect(() => {
    if (toothParticles.length === 0) return;
    const id = setTimeout(() => setToothParticles((p) => p.filter((x) => Date.now() - x.born < 2000)), 2000);
    return () => clearTimeout(id);
  }, [toothParticles]);

  useEffect(() => {
    if (bubbles.length === 0) return;
    const id = setTimeout(() => setBubbles((b) => b.filter((x) => Date.now() - x.born < 900)), 1000);
    return () => clearTimeout(id);
  }, [bubbles]);

  const handleGoldenClick = useCallback(() => {
    setGolden(null);
    const now = Date.now();
    setCrystalFrenzyUntil(0);
    setHoldBonusUntil(0);
    setGoldenActiveUntil(now + 13000);
    specialNextRef.current = getNextBonusTime(8, 15); // 8-15 min cooldown
    setState((s) => ({ ...s, goldenClicks: s.goldenClicks + 1 }));
    if (soundRef.current) {window.playTone(880, 0.1, 'triangle', 0.08);setTimeout(() => window.playTone(1320, 0.15, 'triangle', 0.08), 80);}
  }, []);

  // Dismiss special tooth + start 5-min cooldown
  const dismissSpecialTooth = useCallback((id) => {
    if (specialToothRef.current?.id === id) {
      specialToothRef.current = null;
      setSpecialTooth(null);
      specialNextRef.current = getNextBonusTime(8, 15); // 8-15 min cooldown
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    const bType = holdBonusUntil > now ? 'hold' : goldenActiveUntil > now ? 'gold' : crystalFrenzyUntil > now ? 'crystal' : null;
    if (bType) {
      const col = bType === 'hold' ? 'rgba(230, 80, 200, 0.35)' : bType === 'gold' ? 'rgba(255, 194, 32, 0.35)' : 'rgba(80, 180, 230, 0.35)';
      setSunColor(col);
      setSunOpacity(1);
    } else {
      setSunOpacity(0);
    }
  }, [holdBonusUntil, goldenActiveUntil, crystalFrenzyUntil, visualTick]);

  const handleGoldBonusClick = useCallback(() => {
    const id = specialToothRef.current?.id;
    if (id) dismissSpecialTooth(id);
    setGoldenActiveUntil(0);
    setCrystalFrenzyUntil(0);
    setHoldBonusUntil(Date.now() + 20000);
    setState(s => ({ ...s, specialGoldClicks: (s.specialGoldClicks || 0) + 1 }));
    setToast({ id: '__gold_hold', es: '¡Bonus de click mantenido activo (20s)!', en: 'Hold-to-click bonus active (20s)!' });
    setTimeout(() => setToast(null), 3000);
    if (soundRef.current) [660, 880, 1320].forEach((f, i) => setTimeout(() => window.playTone(f, 0.1, 'triangle', 0.08), i * 100));
  }, [dismissSpecialTooth]);

  const buyStoreUpgrade = useCallback((up) => {
    if (state.teeth >= up.cost && !state.storeUpgrades[up.id]) {
      setState(s => ({
        ...s,
        teeth: s.teeth - up.cost,
        storeUpgrades: { ...s.storeUpgrades, [up.id]: true }
      }));
      setToast({ 
        id: `buy_up_${up.id}`, 
        es: `¡Mejora comprada: ${up.es}!`, 
        en: `Upgrade bought: ${up.en}!` 
      });
      setTimeout(() => setToast(null), 3000);
      setGlobalTooltip(null);
      if (soundRef.current) window.playTone(880, 0.15, 'sine', 0.1);
    }
  }, [state.teeth, state.storeUpgrades]);

  // Auto-clicker logic
  useEffect(() => {
    if (isMainMouseDown && holdBonusUntil > Date.now()) {
      if (autoClickTimerRef.current) return;
      autoClickTimerRef.current = setInterval(() => {
        if (holdBonusUntil <= Date.now()) {
          clearInterval(autoClickTimerRef.current);
          autoClickTimerRef.current = null;
          return;
        }
        // Fire click at center of tooth or random offset
        const x = 130 + (Math.random() - 0.5) * 100;
        const y = 130 + (Math.random() - 0.5) * 100;
        performClick(x, y);
      }, 100);
    } else {
      if (autoClickTimerRef.current) {
        clearInterval(autoClickTimerRef.current);
        autoClickTimerRef.current = null;
      }
    }
    return () => {
      if (autoClickTimerRef.current) {
        clearInterval(autoClickTimerRef.current);
        autoClickTimerRef.current = null;
      }
    };
  }, [isMainMouseDown, holdBonusUntil, performClick]);

  const startGoldHold = () => {}; // No longer used but kept to avoid breakage if referenced elsewhere
  const stopGoldHold = () => {};

  // Diamond tooth — instant 2h of passive production
  const handleDiamondClick = useCallback(() => {
    const id = specialToothRef.current?.id;
    if (id) dismissSpecialTooth(id);
    const s = stateRef.current;
    let passive = 0; for (const g of window.GENERATORS) passive += (s.generators[g.id] || 0) * g.baseProduction;
    const pMult = 1 + 0.05 * (s.prestige || 0);
    const aMult = 1 + 0.01 * Object.values(s.achievements || {}).filter(Boolean).length;
    const bonus = passive * pMult * aMult * 7200; // 2 h
    setState((st) => ({ ...st, teeth: st.teeth + bonus, totalEarned: st.totalEarned + bonus, diamondClicks: (st.diamondClicks || 0) + 1 }));
    setToast({ id: '__diamond', es: `+${fmt(Math.floor(bonus))} dientes (2h de producción)`, en: `+${fmt(Math.floor(bonus))} teeth (2h production)` });
    setTimeout(() => setToast(null), 4500);
    if (soundRef.current) [1047, 1319, 1568, 2093].forEach((f, i) => setTimeout(() => window.playTone(f, 0.14, 'triangle', 0.07), i * 65));
  }, [fmt, dismissSpecialTooth]);

  // Crystal tooth — x5 click multiplier for 45s
  const handleCrystalClick = useCallback(() => {
    const id = specialToothRef.current?.id;
    if (id) dismissSpecialTooth(id);
    setGoldenActiveUntil(0);
    setHoldBonusUntil(0);
    setCrystalFrenzyUntil(Date.now() + 45000);
    setState(s => ({ ...s, crystalClicks: (s.crystalClicks || 0) + 1 }));
    setToast({ id: '__crystal', es: '¡Frenesí de cristal! x5 clicks durante 45 s', en: 'Crystal frenzy! x5 clicks for 45 s' });
    setTimeout(() => setToast(null), 4000);
    if (soundRef.current) [440, 554, 659, 880, 1100].forEach((f, i) => setTimeout(() => window.playTone(f, 0.12, 'triangle', 0.06), i * 75));
  }, [dismissSpecialTooth]);

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
    const gain = prestigeGain;
    const oldCount = stateRef.current?.prestigeCount || 0;
    const newCount = oldCount + gain;
    const oldPrestige = stateRef.current?.prestige || 0;
    const newPrestige = oldPrestige + gain;
    
    // Find newly unlocked stages based on prestige COUNT gain
    const newlyUnlocked = window.TOOTH_STAGES.filter((s) => s.prestige > 0 && s.prestige > oldCount && s.prestige <= newCount);

    setState((s) => {
      const next = { 
        ...defaultState(), 
        prestige: newPrestige, 
        prestigeCount: newCount, 
        selectedTooth: s.selectedTooth || 0, 
        achievements: s.achievements, 
        startedAt: s.startedAt, 
        timePlayed: s.timePlayed, 
        totalClicks: s.totalClicks, 
        goldenClicks: s.goldenClicks, 
        lastTick: Date.now(),
        // Persist Level and Academy progress
        level: s.level,
        xp: s.xp,
        xpUpgrades: s.xpUpgrades,
        // Persist Clinic name and Lifetime Earnings
        clinicName: s.clinicName,
        totalEarned: 0, // Reset run progress
        lifetimeEarned: s.lifetimeEarned || s.totalEarned // Persist lifetime
      };

      // Immediate local persistence
      persistUserSave(username, next);
      return next;
    });

    // Immediate cloud sync
    setTimeout(() => {
      const s = stateRef.current;
      if (s) pushScore(s);
    }, 100);

    if (soundRef.current) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => window.playTone(f, 0.15, 'triangle', 0.06), i * 80));
    if (newlyUnlocked.length > 0) {
      const latestUnlocked = newlyUnlocked[newlyUnlocked.length - 1];
      const idx = window.TOOTH_STAGES.indexOf(latestUnlocked);
      setTimeout(() => setNewToothUnlock({ stage: latestUnlocked, idx }), 600);
    }
  }, [prestigeGain, username, sessionId]);

  const doReset = useCallback(() => {
    setShowResetConfirm(false);deleteUserSave(username);
    try {window.cloudDeleteScore(username);} catch (e) {}
    setState(defaultState());onDeleteUser && onDeleteUser();
  }, [username, onDeleteUser]);

  const markAchievementSeen = useCallback((id) => {
    if (!state.newAchievementIds?.[id]) return;
    setState(s => {
      const next = { ...s.newAchievementIds };
      delete next[id];
      return { ...s, newAchievementIds: next };
    });
  }, [state.newAchievementIds]);

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
    const baseMult = (storeMults.gen[g.id] || 1) * globalMult;
    genProductions[g.id] = (owned || 0) * g.baseProduction * baseMult;
    const nextProduction = g.baseProduction * baseMult * buyQty;
    const unlocked = state.totalEarned >= g.unlockAt || owned > 0;
    const revealed = state.totalEarned >= g.unlockAt * 0.5 || owned > 0 || window.GENERATORS.indexOf(g) === 0;
    return { gen: g, owned, cost, unlocked, revealed, canAfford, actualQty, production: genProductions[g.id], nextProduction };
  });

  const [clickFilter, setClickFilter] = React.useState('all');
  const clickStatus = window.CLICK_UPGRADES.map((u) => ({ up: u, purchased: !!state.clickUpgrades[u.id], unlocked: state.totalEarned >= u.unlockAt, canAfford: state.teeth >= u.cost }));
  const filteredClickStatus = clickStatus.filter((c) => {
    if (clickFilter === 'unlocked') return c.unlocked;
    if (clickFilter === 'locked') return !c.unlocked;
    return true;
  });

  const currentToothImg = holdBonusUntil > Date.now() ? "uploads/gold-tooth-1.png" : crystalFrenzyUntil > Date.now() ? "uploads/crystal-tooth-1.png" : selectedStage.img;

  const renderMobileView = () => {
    return (
      <div className="mobile-game-container">
        <header className="mobile-header">
          {isEditingClinic ? (
            <input 
              autoFocus
              className="mobile-clinic-input"
              value={tempClinicName}
              onChange={e => setTempClinicName(e.target.value.slice(0, 30))}
              onBlur={() => {
                setIsEditingClinic(false);
                const final = tempClinicName.trim();
                if (final !== state.clinicName) {
                  const nextClinic = final || null;
                  setState(s => ({ ...s, clinicName: nextClinic }));
                  pushScore({ ...stateRef.current, clinicName: nextClinic });
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                  setTempClinicName(state.clinicName || '');
                  setIsEditingClinic(false);
                }
              }}
              style={{
                all: 'unset',
                background: '#f0f4f8',
                padding: '10px 12px',
                borderRadius: '10px',
                width: '100%',
                maxWidth: '240px',
                fontSize: '16px',
                fontFamily: 'inherit',
                border: '2px solid #0076db',
                height: '42px',
                boxSizing: 'border-box'
              }}
            />
          ) : (
            <div className="mobile-clinic-name" onClick={() => { setIsEditingClinic(true); setTempClinicName(state.clinicName || (lang === 'es' ? `Clínica de ${username}` : `${username}'s Clinic`)); }} style={{ cursor: 'pointer' }}>
               {state.clinicName || (lang === 'es' ? `Clínica de ${username}` : `${username}'s Clinic`)}
               <i className="fa-solid fa-pen-to-square" style={{ fontSize: 13, opacity: 0.5, marginLeft: 6 }}></i>
            </div>
          )}
          <button 
            className={`mobile-player-pill ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="mobile-avatar">{(username[0] || '?').toUpperCase()}</div>
            <div className="mobile-player-info">
              <div className="mobile-player-name">{username}</div>
              <div className="mobile-player-lvl">
                <span className="mobile-lvl-text">NIV. {state.level}</span>
                <div className="mobile-xp-bar">
                   <div className="mobile-xp-progress" style={{ width: `${Math.min(100, (state.xp / window.getXPRequired(state.level)) * 100)}%` }} />
                </div>
              </div>
            </div>
            <i className="fa-solid fa-angle-down" style={{ fontSize: 10, color: '#0076db', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}></i>
          </button>
        </header>

        <section className="mobile-stats-container">
           <div className="mobile-stat-row">
              <span className="mobile-stat-label">{t.currentTeeth}</span>
              <span className="mobile-stat-value">{fmt(state.teeth)}</span>
              <span className="mobile-stat-sub">{fmt(perSecond, true)}/s</span>
           </div>
           <div className="mobile-stat-row">
              <span className="mobile-stat-label">{t.perClick}</span>
              <span className="mobile-stat-value mobile-stat-click">{fmt(perClick, true)}</span>
              <span className="mobile-stat-sub">x{fmt(Math.floor(globalMult * 100) / 100)}</span>
           </div>
        </section>

        <section className="mobile-tooth-area">
            <div 
              onMouseDown={(e) => { handleClick(e); setIsMainMouseDown(true); }}
              onMouseUp={() => setIsMainMouseDown(false)}
              onMouseLeave={() => setIsMainMouseDown(false)}
              onTouchStart={(e) => { handleClick(e); setIsMainMouseDown(true); }}
              onTouchEnd={() => setIsMainMouseDown(false)}
              style={{ position: 'relative', cursor: 'pointer', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', width: 200, height: 200 }}
            >
              <window.ToothbrushRing count={state.generators.brush} radius={100} />
              <img 
                src={currentToothImg} 
                alt="tooth" 
                className="mobile-main-tooth"
                style={{
                  width: 200, height: 200, objectFit: 'contain', position: 'relative', zIndex: 5,
                  filter: holdBonusUntil > Date.now() ? 'drop-shadow(0 0 35px oklch(0.7 0.2 320 / 0.8)) saturate(1.4)' : goldenMult > 1 ? 'drop-shadow(0 0 24px #FFC22088) sepia(0.4) saturate(2) hue-rotate(10deg)' : crystalMult > 1 ? 'drop-shadow(0 0 28px oklch(0.7 0.2 210 / 0.85)) saturate(1.3) brightness(1.1)' : 'drop-shadow(0 8px 24px rgba(0,118,219,0.18))'
                }}
              />
              {toothParticles.map((p) => (
                <img key={p.id} src={currentToothImg} alt="" style={{ position: 'absolute', left: p.x, top: p.y, width: 34, height: 34, objectFit: 'contain', pointerEvents: 'none', animation: 'toothPop 2000ms ease-out forwards', '--tx': `${p.tx}px`, '--rot': `${p.rot}deg`, zIndex: 90, opacity: 0.9 }} />
              ))}
           </div>
           <div className="mobile-click-text">
              <div className="mobile-click-me">{liveCPS > 0 ? `${liveCPS} CPS` : (lang === 'es' ? 'Toca el diente' : 'Tap the tooth')}</div>
              <div className="mobile-click-gain">+{fmt(perClick, true)} {t.teeth} / click</div>
           </div>

           {floats.map((f) =>
              <div key={f.id} style={{ position: 'absolute', left: f.x, top: f.y, pointerEvents: 'none', color: '#000000', fontWeight: 900, fontSize: 18, textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 2px 4px rgba(0,0,0,0.2)', animation: 'clickPop 600ms ease-out forwards', fontVariantNumeric: 'tabular-nums', '--tx': `${f.tx}px`, zIndex: 100 }}>+{fmt(f.gain, true)}</div>
           )}
        </section>

        <section className="mobile-upgrades-row">
           {(window.STORE_UPGRADES || []).filter(up => {
              if (state.storeUpgrades[up.id]) return false;
              if (up.type === 'generator') return (state.generators[up.targetId] || 0) >= up.milestone;
              return state.totalEarned >= up.requirement;
           }).map(up => {
              const canAfford = state.teeth >= up.cost;
              return (
                <div 
                  key={up.id} 
                  className={`mobile-upgrade-slot ${!canAfford ? 'disabled' : ''}`} 
                  style={{ color: canAfford ? up.color : '#8c8c8d', cursor: 'pointer' }} 
                  onClick={() => buyStoreUpgrade(up)}
                >
                  <i className={`fa-solid ${up.icon}`}></i>
                </div>
              );
           })}
           {/* Placeholder if none available */}
           {((window.STORE_UPGRADES || []).filter(up => !state.storeUpgrades[up.id] && (up.type === 'generator' ? (state.generators[up.targetId] || 0) >= up.milestone : state.totalEarned >= up.requirement)).length === 0) && (
             <div className="mobile-upgrade-slot disabled" style={{ opacity: 0.3 }}>
               <i className="fa-solid fa-lock"></i>
             </div>
           )}
        </section>

        <footer className="mobile-footer-player">
           <button className="mobile-music-bars-btn" onClick={() => setMusicModalOpen(true)}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
                 {[0.1, 0.4, 0.2, 0.5, 0.3].map((delay, i) => (
                   <div key={i} style={{ 
                     width: 2.5, 
                     height: isMusicPlaying ? 16 : 2, 
                     background: '#fff', 
                     borderRadius: 2,
                     opacity: isMusicPlaying ? 1 : 0.6,
                     animation: isMusicPlaying ? `musicWave 0.8s ease-in-out infinite ${delay}s` : 'none',
                     transition: 'all 0.3s ease'
                   }} />
                 ))}
               </div>
            </button>
             <button className="mobile-hamburger-btn" onClick={() => setTabsMenuOpen(true)}>
               <i className="fa-solid fa-bars" style={{ color: '#fff' }}></i>
            </button>
        </footer>

        {/* Mobile Menu Overlay (Player Menu) */}
        <div 
          className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          <div className="mobile-menu-drawer" onClick={e => e.stopPropagation()}>
            <button className="mobile-menu-item" onClick={() => { toggleSound(); setMenuOpen(false); }}>
              <i className={`fa-solid ${soundOn ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
              <span className="mobile-menu-item-text">{soundOn ? t.soundOn : t.soundOff}</span>
            </button>

            <button className="mobile-menu-item" onClick={() => { toggleLang(); setMenuOpen(false); }}>
              <i className="fa-solid fa-language"></i>
              <span className="mobile-menu-item-text">{lang === 'es' ? 'Español' : 'English'}</span>
            </button>

            <button className="mobile-menu-item" onClick={() => { cycleNumFormat(); setMenuOpen(false); }}>
              <i className="fa-solid fa-hashtag"></i>
              <span className="mobile-menu-item-text">{lang === 'es' ? 'Formato numérico' : 'Number format'}</span>
              <span className="mobile-menu-item-trailing">{{ short: '1.2M', long: lang === 'es' ? 'millón' : 'million', engineering: '1.2e6', scientific: '10^6' }[numFormat]} →</span>
            </button>

            <button className="mobile-menu-item" onClick={() => { setMenuOpen(false); setShowAbout(true); }}>
              <i className="fa-solid fa-circle-info"></i>
              <span className="mobile-menu-item-text">{lang === 'es' ? 'Acerca de' : 'About'}</span>
            </button>

            <button className="mobile-menu-item" onClick={() => { setMenuOpen(false); setShowFeedbackModal(true); }}>
              <i className="fa-solid fa-comment-dots"></i>
              <span className="mobile-menu-item-text">{lang === 'es' ? 'Enviar feedback' : 'Send feedback'}</span>
            </button>

            <div className="mobile-menu-divider" />


            <button className="mobile-menu-item" onClick={() => { setMenuOpen(false); setShowResetConfirm(true); }}>
              <i className="fa-solid fa-trash"></i>
              <span className="mobile-menu-item-text">{t.reset}</span>
            </button>

            <button className="mobile-menu-item danger" onClick={() => { onLogout && onLogout(); setMenuOpen(false); }}>
              <i className="fa-solid fa-right-from-bracket"></i>
              <span className="mobile-menu-item-text">{t.logout}</span>
            </button>
          </div>
        </div>

        {/* Mobile Tabs Menu (Game Navigation) */}
        <div 
          className={`mobile-tabs-overlay ${tabsMenuOpen ? 'open' : ''}`} 
          onClick={() => setTabsMenuOpen(false)}
        >
          <div className="mobile-tabs-sheet" onClick={e => e.stopPropagation()}>
            {[
              { id: 'generators', label: t.tabGen, icon: 'fa-solid fa-industry' },
              { id: 'click', label: t.tabClick, icon: 'fa-solid fa-hand-pointer' },
              { id: 'achievements', label: t.tabAch, icon: 'fa-solid fa-trophy' },
              { id: 'prestige', label: t.tabPrestige, icon: 'fa-solid fa-crown' },
              { id: 'skills', label: lang === 'es' ? 'Academia' : 'Academy', icon: 'fa-solid fa-graduation-cap' },
              { id: 'leaderboard', label: t.tabLeaderboard, icon: 'fa-solid fa-ranking-star' },
              { id: 'stats', label: t.tabStats, icon: 'fa-solid fa-chart-line' }
            ].map((item) => (
              <button 
                key={item.id} 
                className={`mobile-tab-item ${tab === item.id ? 'active' : ''}`} 
                onClick={() => { setTab(item.id); setTabsMenuOpen(false); }}
              >
                <i className={item.icon}></i>
                <span className="mobile-tab-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isMobile ? renderMobileView() : (
        <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', fontFamily: 'var(--font-sans)', color: 'var(--fg-1)' }}>
      {/* Top bar */}
      <header style={{ height: 64, background: 'var(--bg-1)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 var(--spacing-6)', gap: 'var(--spacing-4)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="uploads/logo-horizontal-4d4fb63d.png" style={{ height: 44, width: 'auto', objectFit: 'contain', flexShrink: 0 }} alt="Tooth Clicker" />
          <button 
            id="manual-tour-trigger"
            onClick={() => setCurrentTourStep(0)}
            style={{ all: 'unset', boxSizing: 'border-box', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--primary-i010)', border: '1px solid var(--primary-i030)', color: 'var(--primary-i100)', transition: 'all 150ms' }}
            title={lang === 'es' ? 'Tour guiado' : 'Guided tour'}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-i100)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--primary-i010)'; e.currentTarget.style.color = 'var(--primary-i100)'; }}
          >
            <i className="fa-solid fa-question" style={{ fontSize: 10 }}></i>
          </button>
        </div>
        <div style={{ flex: 1 }} />
        {/* Inline stats — single line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-tooth" style={{ fontSize: 13, color: 'var(--primary-i100)' }}></i>
            <div>
              <span className="t-mini-caps" style={{ color: 'var(--fg-3)', marginRight: 6 }}>{t.currentTeeth}</span>
              <span className="t-heading-s" style={{ color: 'var(--primary-i100)', fontVariantNumeric: 'tabular-nums' }}>{fmt(state.teeth)}</span>
              <span className="t-body-s" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{fmt(perSecond, true)}/s</span>
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-hand-pointer" style={{ fontSize: 13, color: 'var(--alternative-i100)' }}></i>
            <div>
              <span className="t-mini-caps" style={{ color: 'var(--fg-3)', marginRight: 6 }}>{t.perClick}</span>
              <span className="t-heading-s" style={{ color: 'var(--alternative-i100)', fontVariantNumeric: 'tabular-nums' }}>{fmt(perClick, true)}</span>
              {globalMult > 1 && <span className="t-body-s" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>x{fmt(Math.floor(globalMult * 100) / 100)}</span>}
            </div>
          </div>
        </div>
        {goldenActiveUntil > Date.now() &&
        <div style={{ padding: '6px 12px', background: 'var(--warning-i010)', border: '1px solid var(--warning-i050)', borderRadius: 'var(--radius-pill)', color: 'var(--warning-i130)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 1s ease-in-out infinite' }}>
            <i className="fa-solid fa-bolt"></i>{t.goldenActive} — {Math.max(0, Math.ceil((goldenActiveUntil - Date.now()) / 1000))}s
          </div>
        }
        {crystalFrenzyUntil > Date.now() &&
        <div style={{ padding: '6px 12px', background: 'oklch(0.93 0.06 220 / 0.3)', border: '1px solid oklch(0.7 0.12 220)', borderRadius: 'var(--radius-pill)', color: 'oklch(0.35 0.18 220)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 1s ease-in-out infinite' }}>
            <i className="fa-solid fa-snowflake"></i>{lang === 'es' ? 'Frenesí x5' : 'Frenzy x5'} — {Math.max(0, Math.ceil((crystalFrenzyUntil - Date.now()) / 1000))}s
          </div>
        }
        {holdBonusUntil > Date.now() &&
        <div style={{ padding: '6px 12px', background: 'oklch(0.9 0.15 80 / 0.3)', border: '1px solid oklch(0.7 0.2 80)', borderRadius: 'var(--radius-pill)', color: 'oklch(0.4 0.2 80)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 1s ease-in-out infinite' }}>
            <i className="fa-solid fa-hand-pointer"></i>{lang === 'es' ? 'Auto-click' : 'Auto-click'} — {Math.max(0, Math.ceil((holdBonusUntil - Date.now()) / 1000))}s
          </div>
        }
        <button onClick={doManualSave} style={topBtnStyle} title={t.saveNow}>
          <i className={saveFlash ? 'fa-solid fa-check' : 'fa-solid fa-floppy-disk'} style={{ marginRight: 6, color: saveFlash ? 'var(--positive-i100)' : 'inherit' }}></i>
          {saveFlash ? t.savedJustNow : t.saveNow}
        </button>
        <div id="user-menu-tour" ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setMenuOpen((o) => !o)} 
            style={{ 
              all: 'unset', boxSizing: 'border-box', 
              padding: '6px 12px 6px 8px', background: 'var(--primary-i010)', borderRadius: 'var(--radius-pill)', 
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              border: menuOpen ? '1.5px solid var(--primary-i050)' : '1.5px solid transparent',
              transition: 'all 200ms'
            }}
          >
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-i100)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11 }}>{(username[0] || '?').toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="t-body-s" style={{ color: 'var(--primary-i130)', fontWeight: 600, lineHeight: 1.2 }}>{username}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--primary-i100)', textTransform: 'uppercase' }}>Niv. {state.level}</span>
                <div 
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    window.__xpTimer = setTimeout(() => {
                      const req = window.getXPRequired(state.level);
                      const missing = req - state.xp;
                      setGlobalTooltip({ 
                        type: 'xp', 
                        direction: 'down',
                        pos: { x: rect.left + rect.width / 2, y: rect.bottom + 8 } 
                      });
                    }, 1000);
                  }}
                  onMouseLeave={() => {
                    clearTimeout(window.__xpTimer);
                    setGlobalTooltip(null);
                  }}
                  style={{ width: 40, height: 4, background: 'rgba(0,118,219,0.1)', borderRadius: 2, overflow: 'hidden', cursor: 'help' }}
                >
                  <div style={{ width: `${Math.min(100, (state.xp / window.getXPRequired(state.level)) * 100)}%`, height: '100%', background: 'var(--primary-i100)', transition: 'width 300ms' }} />
                </div>
              </div>
            </div>
            <i className="fa-solid fa-angle-down" style={{ fontSize: 10, color: 'var(--primary-i100)', marginLeft: 2, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}></i>
          </button>
          {menuOpen &&
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 260, background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', boxShadow: 'var(--elevation-20)', padding: 6, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <window.MenuItem icon={soundOn ? 'fa-volume-high' : 'fa-volume-xmark'} label={soundOn ? t.soundOn : t.soundOff} onClick={toggleSound} />
              <window.MenuItem icon="fa-language" label={lang === 'es' ? 'Español' : 'English'} trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'EN →' : 'ES →'}</span>} onClick={toggleLang} />
              <window.MenuItem icon="fa-hashtag" label={lang === 'es' ? 'Formato numérico' : 'Number format'} trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{{ short: '1.2M', long: lang === 'es' ? 'millón' : 'million', engineering: '1.2e6', scientific: '10^6' }[numFormat]} →</span>} onClick={cycleNumFormat} />
              <window.MenuItem icon="fa-circle-info" label={lang === 'es' ? 'Acerca de' : 'About'} onClick={() => {setMenuOpen(false);setShowAbout(true);}} />
              <window.MenuItem icon="fa-comment-dots" label={lang === 'es' ? 'Enviar feedback' : 'Send feedback'} onClick={() => {setMenuOpen(false);setShowFeedbackModal(true);}} />
              <window.MenuDivider />
              <window.MenuItem icon="fa-right-from-bracket" label={t.logout} onClick={() => {
                setMenuOpen(false);
                try {persistUserSave(username, stateRef.current);} catch (e) {}
                try {
                  const s = stateRef.current;
                  if (s) {
                    const ban = window.AntiCheat.getBanData(username);
                    window.cloudSubmitScore({ 
                      name: username, 
                      totalEarned: s.totalEarned || 0, 
                      prestige: s.prestige || 0, 
                      prestigeCount: s.prestigeCount || 0, 
                      timePlayed: s.timePlayed || 0, 
                      teeth: s.teeth || 0, 
                      clinicName: s.clinicName, 
                      level: s.level || 0,
                      banUntil: ban.until,
                      banIndefinite: ban.until === -1
                    });
                  }
                } catch (e) {}
                onLogout && onLogout();
              }} />
              <window.MenuItem icon="fa-trash" label={t.reset} danger onClick={() => {setMenuOpen(false);setShowResetConfirm(true);}} />
            </div>
          }
        </div>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: 'minmax(380px,1fr) minmax(560px,1.4fr)', gap: 'var(--spacing-6)', padding: 'var(--spacing-6)', maxWidth: 1440, margin: '0 auto', alignItems: 'start', height: 'calc(100vh - 64px)', boxSizing: 'border-box' }}>
        {/* LEFT */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', alignSelf: 'start', position: 'sticky', top: 'var(--spacing-6)' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', padding: 'var(--spacing-8) var(--spacing-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-5)', boxShadow: 'var(--elevation-10)', overflow: 'hidden', position: 'relative' }}>
            <FallingTeethSimulation clickPulse={clickPulse} totalGenerators={Object.values(state.generators || {}).reduce((a, b) => a + b, 0)} toothImg={currentToothImg} />
            {username === 'James' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
                <button onClick={() => { 
                  const now = Date.now(); const id = Math.random().toString(36);
                  setGolden({ x: 80 + Math.random() * (window.innerWidth - 160), y: 120 + Math.random() * (window.innerHeight - 240), id, spawnedAt: now });
                  setSpecialTooth(null); specialToothRef.current = null;
                  setTimeout(() => setGolden((g) => g && g.id === id ? null : g), 7000);
                }} style={debugBtnStyle}>Spawn Gold x7</button>
                <button onClick={() => {
                  const now = Date.now(); const id = Math.random().toString(36);
                  const tooth = { type: 'gold', x: 80 + Math.random() * (window.innerWidth - 160), y: 120 + Math.random() * (window.innerHeight - 240), id, spawnedAt: now };
                  setSpecialTooth(tooth); specialToothRef.current = tooth;
                  setGolden(null);
                  setTimeout(() => { if (specialToothRef.current?.id === id) { specialToothRef.current = null; setSpecialTooth(null); } }, 7000);
                }} style={debugBtnStyle}>Spawn Hold</button>
                <button onClick={() => {
                  const now = Date.now(); const id = Math.random().toString(36);
                  const tooth = { type: 'diamond', x: 80 + Math.random() * (window.innerWidth - 160), y: 120 + Math.random() * (window.innerHeight - 240), id, spawnedAt: now };
                  setSpecialTooth(tooth); specialToothRef.current = tooth;
                  setGolden(null);
                  setTimeout(() => { if (specialToothRef.current?.id === id) { specialToothRef.current = null; setSpecialTooth(null); } }, 7000);
                }} style={debugBtnStyle}>Spawn Diamond</button>
                <button onClick={() => {
                  const now = Date.now(); const id = Math.random().toString(36);
                  const tooth = { type: 'crystal', x: 80 + Math.random() * (window.innerWidth - 160), y: 120 + Math.random() * (window.innerHeight - 240), id, spawnedAt: now };
                  setSpecialTooth(tooth); specialToothRef.current = tooth;
                  setGolden(null);
                  setTimeout(() => { if (specialToothRef.current?.id === id) { specialToothRef.current = null; setSpecialTooth(null); } }, 7000);
                }} style={debugBtnStyle}>Spawn Crystal</button>
                <button onClick={() => {
                  if (customMessages.length > 0) {
                    const pick = customMessages[Math.floor(Math.random() * customMessages.length)];
                    setBossMsg({ 
                      who: pick.who, 
                      es: pick.text, 
                      en: pick.text, 
                      isCustom: true,
                      danger: false,
                      color: pick.color,
                      position: pick.position,
                      size: pick.size,
                      animation: pick.animation,
                      particles: pick.particles
                    });
                  }
                }} style={{ ...debugBtnStyle, background: 'var(--primary-i010)', color: 'var(--primary-i100)', borderColor: 'var(--primary-i030)' }}>Trigger Msg ({customMessages.length})</button>
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: 16, marginTop: -10, position: 'relative', zIndex: 10 }}>
              {isEditingClinic ? (
                <input 
                  autoFocus
                  value={tempClinicName}
                  onChange={e => setTempClinicName(e.target.value.slice(0, 30))}
                  onBlur={() => {
                    setIsEditingClinic(false);
                    const final = tempClinicName.trim();
                    if (final !== state.clinicName) {
                      const nextClinic = final || null;
                      setState(s => ({ ...s, clinicName: nextClinic }));
                      // Push immediately with the new value
                      pushScore({ ...stateRef.current, clinicName: nextClinic });
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') {
                      setTempClinicName(state.clinicName || '');
                      setIsEditingClinic(false);
                    }
                  }}
                  style={{
                    all: 'unset', boxSizing: 'border-box',
                    background: 'var(--bg-1)', border: '2px solid var(--primary-i100)',
                    borderRadius: 8, padding: '4px 12px', width: 'auto', minWidth: 200,
                    fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,118,219,0.15)',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="t-heading-s" style={{ color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>
                    {state.clinicName || (lang === 'es' ? `Clínica de ${username}` : `${username}'s Clinic`)}
                  </span>
                  <button 
                    onClick={() => { window.playClickSound && window.playClickSound(); setIsEditingClinic(true); setTempClinicName(state.clinicName || (lang === 'es' ? `Clínica de ${username}` : `${username}'s Clinic`)); }} 
                    style={{ all: 'unset', cursor: 'pointer', color: 'var(--fg-3)', transition: 'color 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-i100)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-3)'}
                  >
                    <i className="fa-solid fa-pen-to-square" style={{ fontSize: 13 }}></i>
                  </button>
                </div>
              )}
            </div>
            <div style={{ position: 'relative', width: '100%', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                <div className="aurora-container" style={{ '--aurora-opacity': auroraOpacity, zIndex: -1, mixBlendMode: 'soft-light' }} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', width: 1200, height: 1200,
                  pointerEvents: 'none', zIndex: 0,
                  background: `repeating-conic-gradient(${sunColor} 0 15deg, transparent 15deg 30deg)`,
                  borderRadius: '50%',
                  opacity: sunOpacity,
                  transition: 'opacity 1.2s ease-out',
                  animation: 'rotateSun 40s linear infinite'
                }} />
                <window.ToothbrushRing count={state.generators.brush} />
                <div 
                  id="main-tooth-target"
                  onMouseDown={(e) => { handleClick(e); setIsMainMouseDown(true); }}
                  onMouseUp={() => setIsMainMouseDown(false)}
                  onMouseLeave={() => setIsMainMouseDown(false)}
                  onTouchStart={(e) => { handleClick(e); setIsMainMouseDown(true); }}
                  onTouchEnd={() => setIsMainMouseDown(false)}
                  style={{ position: 'relative', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} key={clickPulse}>
                  <img src={currentToothImg} alt="tooth" style={{ width: 260, height: 260, objectFit: 'contain', filter: holdBonusUntil > Date.now() ? 'drop-shadow(0 0 35px oklch(0.7 0.2 320 / 0.8)) saturate(1.4)' : goldenMult > 1 ? 'drop-shadow(0 0 24px #FFC22088) sepia(0.4) saturate(2) hue-rotate(10deg)' : crystalMult > 1 ? 'drop-shadow(0 0 28px oklch(0.7 0.2 210 / 0.85)) saturate(1.3) brightness(1.1)' : 'drop-shadow(0 8px 24px rgba(0,118,219,0.18))', animation: 'toothClick 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', position: 'relative', zIndex: 2 }} />
                  {floats.map((f) =>
                  <div key={f.id} style={{ position: 'absolute', left: f.x, top: f.y, pointerEvents: 'none', color: '#000000', fontWeight: 900, fontSize: 18, textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 2px 4px rgba(0,0,0,0.2)', animation: 'clickPop 600ms ease-out forwards', fontVariantNumeric: 'tabular-nums', '--tx': `${f.tx}px`, zIndex: 100 }}>+{fmt(f.gain, true)}</div>
                  )}
                {toothParticles.map((p) => (
                  <img key={p.id} src={currentToothImg} alt="" style={{ position: 'absolute', left: p.x, top: p.y, width: 34, height: 34, objectFit: 'contain', pointerEvents: 'none', animation: 'toothPop 2000ms ease-out forwards', '--tx': `${p.tx}px`, '--rot': `${p.rot}deg`, zIndex: 90, opacity: 0.9 }} />
                ))}
                {bubbles.map((b) => {
                  const age = (Date.now() - b.born) / 900;
                  return (
                    <div key={b.id} style={{ position: 'absolute', left: b.x + b.dx * age, top: b.y + b.dy * age, pointerEvents: 'none', width: b.size, height: b.size, borderRadius: '50%', background: `oklch(0.88 0.12 ${b.hue} / ${1 - age})`, border: `1px solid oklch(0.75 0.15 ${b.hue} / ${0.6 - age * 0.6})`, transform: 'translate(-50%,-50%)', transition: 'none' }} />
                  );
                })}
              </div>
              </div>
            <div style={{ textAlign: 'center' }}>
              <div className="t-heading-m" style={{ 
                color: liveCPS >= 30 ? '#e53935' : liveCPS >= 25 ? '#f57c00' : liveCPS > 0 ? '#43a047' : 'var(--fg-1)',
                transition: 'color 0.5s ease',
                animation: liveCPS >= 30 ? 'shake 0.08s linear infinite' : liveCPS >= 25 ? 'shake 0.15s linear infinite' : 'none'
              }}>
                {liveCPS > 0 ? `${liveCPS} CPS` : t.clickMe}
              </div>
              <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4 }}>+{fmt(perClick, true)} {t.teeth} / click</div>
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
              {(window.STORE_UPGRADES || []).filter(up => {
                if (state.storeUpgrades[up.id]) return false;
                if (up.type === 'generator') {
                  return (state.generators[up.targetId] || 0) >= up.milestone;
                }
                return state.totalEarned >= up.requirement;
              }).map(up => {
                const canAfford = state.teeth >= up.cost;
                return <window.StoreUpgradeIcon key={up.id} up={up} canAfford={canAfford} onBuy={buyStoreUpgrade} lang={lang} fmt={fmt} onHover={(up, pos) => setGlobalTooltip({ type: 'shop', data: up, pos })} onLeave={() => setGlobalTooltip(null)} />;
              })}
              {(window.STORE_UPGRADES || []).filter(up => {
                if (state.storeUpgrades[up.id]) return false;
                if (up.type === 'generator') {
                  return (state.generators[up.targetId] || 0) >= up.milestone;
                }
                return state.totalEarned >= up.requirement;
              }).length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic', padding: '10px 0' }}>
                  {lang === 'es' ? 'La tienda está trabajando en nuevas mejoras…' : 'The store is working on new upgrades…'}
                </div>
              )}
            </div>
          </div>
        </section>

      {/* RIGHT */}
      <section style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', padding: 'var(--spacing-5) var(--spacing-6) var(--spacing-6)', height: 'calc(100vh - 120px)', maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <window.TabBar id="game-tabs-tour" active={tab} onChange={(newTab) => { window.playClickSound && window.playClickSound(); setTab(newTab); }} tabs={[
          { id: 'generators', label: t.tabGen, icon: 'fa-solid fa-industry' },
          { id: 'click', label: t.tabClick, icon: 'fa-solid fa-hand-pointer' },
          { id: 'achievements', label: t.tabAch, icon: 'fa-solid fa-trophy', dot: Object.keys(state.newAchievementIds || {}).length > 0 },
          { id: 'prestige', label: t.tabPrestige, icon: 'fa-solid fa-crown' },
          { id: 'skills', label: lang === 'es' ? 'Academia' : 'Academy', icon: 'fa-solid fa-graduation-cap' },
          { id: 'leaderboard', label: t.tabLeaderboard, icon: 'fa-solid fa-ranking-star' },
          { id: 'stats', label: t.tabStats, icon: 'fa-solid fa-chart-line' }]
          } />

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {tab === 'generators' &&
            <div>
              <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                <div>
                  <div className="t-heading-m">{t.generatorsTitle}</div>
                  <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.generatorsSub}</div>
                </div>
                <div style={{ display: 'flex', gap: 3, background: 'var(--bg-3)', padding: 3, borderRadius: 'var(--radius-s)', flexShrink: 0 }}>
                  {[1, 10, 25, 50, 100, 1000].map((q) =>
                <button key={q} onClick={() => { window.playClickSound && window.playClickSound(); setBuyQty(q); }} style={{
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
                {genStatus.map((g) => <window.GeneratorRow key={g.gen.id} gen={g.gen} owned={g.owned} cost={g.cost} canAfford={g.canAfford} unlocked={g.unlocked} revealed={g.revealed} production={g.production} nextProduction={g.nextProduction} lang={lang} totalTeeth={state.totalEarned} buyQty={buyQty} actualQty={g.actualQty} onBuy={() => buyGenerator(g.gen.id, buyQty)} />)}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                  <div>
                    <div className="t-heading-m">{t.achTitle}</div>
                    <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.achSub}</div>
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
                    <option value="new">{lang === 'es' ? 'Nuevos' : 'New'}</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 'var(--spacing-2)' }}>
                {window.ACHIEVEMENTS.filter(a => {
                  if (clickFilter === 'new') return !!state.newAchievementIds?.[a.id];
                  if (clickFilter === 'unlocked') return !!state.achievements[a.id];
                  if (clickFilter === 'locked') return !state.achievements[a.id];
                  return true;
                }).map((a) => (
                  <window.AchievementCard 
                    key={a.id} 
                    ach={{ ...a, isNew: !!state.newAchievementIds?.[a.id] }} 
                    unlocked={!!state.achievements[a.id]} 
                    lang={lang} 
                    onHover={(ach, pos, unlocked) => {
                      setGlobalTooltip({ type: 'ach', data: ach, pos, unlocked });
                      if (state.newAchievementIds?.[ach.id]) markAchievementSeen(ach.id);
                    }} 
                    onLeave={() => setGlobalTooltip(null)} 
                  />
                ))}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
                <window.StatTile label={t.prestigeHave} value={fmt(state.prestige)} icon="fa-solid fa-crown" accent="var(--warning-i130)" onHelpEnter={(e) => setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'La cantidad de Sonrisas doradas que posees actualmente. Cada una multiplica pasivamente toda tu ganancia de dientes por un 5%. ¡No se pierden al prestigiar!' : 'The amount of Golden smiles you currently own. Each one passively multiplies all your teeth earnings by 5%. They are not lost upon prestiging!', pos: {x: e.clientX, y: e.clientY} })} onHelpLeave={() => setGlobalTooltip(null)} />
                <window.StatTile label={lang === 'es' ? 'Veces prestigiado' : 'Times prestiged'} value={fmt(state.prestigeCount || 0)} icon="fa-solid fa-rotate" accent="var(--warning-i100)" onHelpEnter={(e) => setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'El número total de veces que has reiniciado tu progreso a cambio de Sonrisas doradas. Mientras más lo hagas, irás descubriendo nuevas evoluciones de dientes.' : 'The total number of times you have reset your progress in exchange for Golden smiles. Doing this unlocks new teeth evolutions.', pos: {x: e.clientX, y: e.clientY} })} onHelpLeave={() => setGlobalTooltip(null)} />
                <window.StatTile label={t.prestigeEarn} value={`+${fmt(prestigeGain)}`} icon="fa-solid fa-plus" accent="var(--positive-i100)" onHelpEnter={(e) => setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'La cantidad exacta de Sonrisas doradas que ganarás si decides hacer el prestigio en este preciso momento. Recuerda que cada sonrisa requiere cada vez más dientes.' : 'The exact amount of Golden smiles you\'ll earn if you choose to prestige right now. Remember, each smile requires more and more teeth.', pos: {x: e.clientX, y: e.clientY} })} onHelpLeave={() => setGlobalTooltip(null)} />
                <window.StatTile label={t.prestigeBonus} value={`+${fmt((prestigeMult - 1) * 100)}%`} icon="fa-solid fa-chart-line" accent="var(--alternative-i100)" onHelpEnter={(e) => setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'El multiplicador total de ganancia que te otorgan tus Sonrisas doradas. Por ejemplo, si tienes 20 Sonrisas, obtendrás un +100% (el doble) de todos los dientes.' : 'The total earnings multiplier granted by your Golden smiles. For example, owning 20 Smiles grants you a +100% (double) boost to all teeth.', pos: {x: e.clientX, y: e.clientY} })} onHelpLeave={() => setGlobalTooltip(null)} />
              </div>
              <button onClick={() => setShowPrestigeConfirm(true)} disabled={prestigeGain <= 0} style={{ all: 'unset', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 'var(--spacing-4) var(--spacing-6)', background: prestigeGain > 0 ? 'var(--warning-i100)' : 'var(--bg-3)', color: prestigeGain > 0 ? 'var(--warning-i150)' : 'var(--fg-4)', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 15, cursor: prestigeGain > 0 ? 'pointer' : 'not-allowed', width: '100%', transition: 'background 150ms' }}
            onMouseEnter={(e) => {if (prestigeGain > 0) e.currentTarget.style.background = 'var(--warning-i070)';}}
            onMouseLeave={(e) => {if (prestigeGain > 0) e.currentTarget.style.background = 'var(--warning-i100)';}}>
                <i className="fa-solid fa-crown"></i>
                {prestigeGain > 0 ? t.prestigeBtn : (lang === 'es' ? `Necesitas ${fmt(prestigeReq)} dientes totales` : `You need ${fmt(prestigeReq)} total teeth`)}
              </button>

              {/* Tooth progression gallery */}
              <div style={{ marginTop: 'var(--spacing-6)' }}>
                <div className="t-heading-xs" style={{ color: 'var(--fg-2)', marginBottom: 'var(--spacing-3)' }}>
                  {lang === 'es' ? 'Evolución del diente' : 'Tooth evolution'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--spacing-2)' }}>
                  {window.TOOTH_STAGES.map((s, i) => {
                  const unlocked = (state.prestigeCount || 0) >= s.prestige;
                  const isCurrent = (state.selectedTooth || 0) === i && unlocked;
                  return (
                    <div key={i} 
                      onClick={() => {if (unlocked) { window.playClickSound && window.playClickSound(); setState((prev) => ({ ...prev, selectedTooth: i })); }}} 
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setGlobalTooltip({ type: 'stage', data: s, pos: { x: rect.left + rect.width / 2, y: rect.top }, unlocked });
                      }}
                      onMouseLeave={() => setGlobalTooltip(null)}
                      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 'var(--spacing-2)', borderRadius: 'var(--radius-m)', cursor: unlocked ? 'pointer' : 'default', background: isCurrent ? 'var(--primary-i010)' : unlocked ? 'var(--bg-2)' : 'var(--bg-3)', border: `1px solid ${isCurrent ? 'var(--primary-i100)' : unlocked ? 'var(--border-subtle)' : 'var(--border-subtle)'}`, transition: 'all 150ms', transform: 'scale(1)' }}>
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
                          {unlocked ? (s[lang] || s.es).split(' ').slice(1).join(' ') || s[lang] || s.es : `x${s.prestige}`}
                        </div>
                      </div>);

                })}
                </div>
              </div>
            </div>
          }
          {tab === 'skills' &&
            <div>
              <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div className="t-heading-m">{lang === 'es' ? 'Academia Dental' : 'Dental Academy'}</div>
                  <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'Premios académicos por tus logros y nivel.' : 'Academic rewards for your achievements and level.'}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-3)', padding: 3, borderRadius: 8 }}>
                  {['all', 'not_bought', 'bought'].map(f => (
                    <button key={f} onClick={() => setAcademyFilter(f)} style={{
                      all: 'unset', boxSizing: 'border-box', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: academyFilter === f ? 'var(--primary-i100)' : 'transparent',
                      color: academyFilter === f ? '#fff' : 'var(--fg-2)', transition: 'all 150ms'
                    }}>
                      {f === 'all' ? (lang === 'es' ? 'Todos' : 'All') : 
                       f === 'not_bought' ? (lang === 'es' ? 'No comprados' : 'Not bought') : 
                       (lang === 'es' ? 'Comprados' : 'Bought')}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...(window.LEVEL_UPGRADES || []), ...(window.XP_UPGRADES || [])].filter(up => {
                  const purchased = !!state.xpUpgrades[up.id];
                  const isUnlocked = up.achievementId ? !!state.achievements[up.achievementId] : (state.level >= up.levelReq);
                  
                  if (academyFilter === 'not_bought') return !purchased && isUnlocked;
                  if (academyFilter === 'bought') return purchased;
                  
                  return isUnlocked || purchased; 
                })
                .map(up => {
                  const purchased = !!state.xpUpgrades[up.id];
                  const cost = up.baseCost;
                  const canAfford = state.teeth >= cost;
                  const isSpecial = up.isLevelSpecial;
                  
                  return (
                    <div key={up.id} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', 
                      background: purchased ? 'var(--positive-i005)' : (isSpecial ? 'var(--warning-i005)' : 'var(--bg-1)'), 
                      border: purchased ? '1px solid var(--positive-i020)' : (isSpecial ? '1px solid var(--warning-i030)' : '1px solid var(--primary-i020)'), 
                      borderRadius: 12,
                      transition: 'all 200ms'
                    }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: purchased ? 'var(--positive-i100)' : 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {up.name[lang]}
                          </div>
                          {isSpecial && <i className="fa-solid fa-star" style={{ fontSize: 10, color: 'var(--warning-i100)' }}></i>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2, lineHeight: 1.3 }}>
                          {up.desc[lang]}
                        </div>
                      </div>
                      <button 
                        disabled={purchased || !canAfford}
                        onClick={() => buyXpUpgrade(up.id)}
                        style={{
                          all: 'unset', boxSizing: 'border-box', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, 
                          cursor: (purchased || !canAfford) ? 'not-allowed' : 'pointer',
                          background: purchased ? 'var(--positive-i100)' : (canAfford ? 'var(--primary-i100)' : 'var(--bg-3)'),
                          color: (purchased || canAfford) ? '#fff' : 'var(--fg-3)',
                          minWidth: 90, textAlign: 'center', transition: 'all 150ms'
                        }}
                      >
                        {purchased ? (lang === 'es' ? 'Completado' : 'Completed') : fmt(cost)}
                      </button>
                    </div>
                  );
                })}
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
            { label: t.perSecond, value: fmt(perSecond, true), color: 'var(--positive-i100)' },
            { label: t.perClick, value: fmt(perClick, true), color: 'var(--alternative-i100)' },
            { label: lang === 'es' ? 'Bonus global' : 'Global bonus', value: `x${fmt(Math.floor(globalMult * 100) / 100)}`, color: 'var(--warning-i130)' },
            { label: lang === 'es' ? 'Récord CPS' : 'CPS Record', value: fmt(state.maxCPS || 0), color: 'var(--positive-i100)' }]
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
            { label: lang === 'es' ? 'Veces prestigiado' : 'Times prestiged', value: fmt(state.prestigeCount || 0), color: 'var(--warning-i100)' },
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
          </div>
        </section>
      </main>

      <audio 
        ref={audioRef}
        src={currentTrack?.src || ''}
        onTimeUpdate={(e) => setMusicTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setMusicDuration(e.target.duration)}
        onEnded={(e) => {
          const isLoop = playMode.includes('loop');
          const isShuffle = playMode.includes('shuffle');
          const isStop = playMode === 'stop';

          if (isStop) {
            setIsMusicPlaying(false);
            e.target.currentTime = 0;
          } else if (isShuffle) {
            // Shuffle (with or without Loop) = random next
            let nextIdx = Math.floor(Math.random() * tracks.length);
            setCurrentTrack(tracks[nextIdx]);
          } else if (isLoop) {
            // Loop alone = repeat current
            e.target.currentTime = 0;
            e.target.play().catch(err => { console.error('Loop play blocked:', err); setIsMusicPlaying(false); });
          } else {
            // Neither = next in order
            setCurrentTrack(curr => {
              const idx = tracks.findIndex(t => t.id === curr.id);
              const next = tracks[(idx + 1) % tracks.length];
              return next;
            });
          }
        }}
      />

      {initialLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeOut 0.3s ease 1.2s forwards' }}>
          <img src="uploads/logo-vertical.png" alt="Logo" style={{ width: 220, marginBottom: 24, animation: 'pulse 1.5s infinite ease-in-out', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(80,140,220,0.22))' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary-i100)', fontWeight: 600, fontSize: 16 }}>
            <i className="fa-solid fa-circle-notch fa-spin"></i>
            {initialLang === 'es' ? 'Cargando clínica dental...' : 'Loading dental clinic...'}
          </div>
        </div>
      )}

      <MusicFloatingBtn 
        isPlaying={isMusicPlaying} 
        onClick={() => setMusicModalOpen(true)} 
        currentTrack={currentTrack} 
        currentTime={musicTime} 
        duration={musicDuration}
        lang={lang}
        onHover={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setGlobalTooltip({
            type: 'text',
            text: isMusicPlaying ? (lang === 'es' ? 'Reproduciendo' : 'Playing') : (lang === 'es' ? 'Click para escuchar música.' : 'Click to play music.'),
            pos: { x: rect.left + rect.width / 2, y: rect.top - 8 },
            direction: 'up'
          });
        }}
        onLeave={() => setGlobalTooltip(null)}
      />
        </div>
      )}
      {musicModalOpen && (
        <MusicPlayerModal
          lang={lang}
          onClose={() => setMusicModalOpen(false)}
          tracks={tracks}
          currentTrack={currentTrack}
          onSelectTrack={(t) => { userPausedMusic.current = false; setCurrentTrack(t); setIsMusicPlaying(true); }}
          onPlayRandom={handlePlayRandom}
          isPlaying={isMusicPlaying}
          onTogglePlay={() => { userPausedMusic.current = isMusicPlaying; setIsMusicPlaying(!isMusicPlaying); }}
          onStop={handleStop}
          volume={musicVolume}
          onChangeVolume={setMusicVolume}
          muted={musicMuted}
          onToggleMute={() => setMusicMuted(!musicMuted)}
          playMode={playMode}
          onChangePlayMode={handlePlayModeChange}
          currentTime={musicTime}
          duration={musicDuration}
          onSeek={(t) => { if (audioRef.current) audioRef.current.currentTime = t; }}
          soundOn={soundOn}
          toggleSound={toggleSound}
        />

      )}

      {/* Golden tooth */}
      {golden &&
      <div style={{ position: 'fixed', left: golden.x, top: golden.y, transform: 'translate(-50%,-50%)', zIndex: 500, animation: 'goldFloat 2.2s ease-in-out infinite', width: 72, height: 72 }}>
          <svg width="72" height="72" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,194,32,0.2)" strokeWidth="3" />
            <circle cx="36" cy="36" r="32" fill="none" stroke="#FFC220" strokeWidth="3"
              strokeDasharray={`${Math.max(0, 1 - (Date.now() - golden.spawnedAt) / 7000) * 201.1} 201.1`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 100ms linear' }} />
          </svg>
          <button onClick={handleGoldenClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72 }}>
            <img src={window.getToothStage(state.prestigeCount || 0).img} alt="golden" style={{ width: 50, height: 50, objectFit: 'contain', filter: 'drop-shadow(0 0 16px #FFC220) sepia(0.6) saturate(2.5) hue-rotate(10deg)' }} />
          </button>
        </div>
      }

      {/* Gold tooth — click to activate auto-click bonus */}
      {specialTooth?.type === 'gold' &&
      <div style={{ position: 'fixed', left: specialTooth.x, top: specialTooth.y, transform: 'translate(-50%,-50%)', zIndex: 500, animation: 'goldFloat 1.8s ease-in-out infinite', userSelect: 'none', width: 72, height: 72 }}>
          <svg width="72" height="72" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,194,32,0.2)" strokeWidth="3" />
            <circle cx="36" cy="36" r="32" fill="none" stroke="#FFC220" strokeWidth="3"
              strokeDasharray={`${Math.max(0, 1 - (Date.now() - specialTooth.spawnedAt) / 7000) * 201.1} 201.1`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 100ms linear' }} />
          </svg>
          <button
            onClick={handleGoldBonusClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 72, height: 72 }}>
            <img src="uploads/gold-tooth-1.png" alt="gold tooth" style={{ width: 42, height: 42, objectFit: 'contain', filter: 'drop-shadow(0 0 18px #FFC22099)' }} />
            <div style={{ position: 'absolute', bottom: -12, background: 'rgba(0,0,0,0.65)', color: '#FFC220', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
              {lang === 'es' ? '¡Auto-click!' : 'Auto-click!'}
            </div>
          </button>
        </div>
      }

      {/* Diamond tooth — click for 2h instant production */}
      {specialTooth?.type === 'diamond' &&
      <div style={{ position: 'fixed', left: specialTooth.x, top: specialTooth.y, transform: 'translate(-50%,-50%)', zIndex: 500, animation: 'goldFloat 2.5s ease-in-out infinite', userSelect: 'none', width: 72, height: 72 }}>
          <svg width="72" height="72" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <circle cx="36" cy="36" r="32" fill="none" stroke="oklch(0.85 0.12 220)" strokeWidth="3"
              strokeDasharray={`${Math.max(0, 1 - (Date.now() - specialTooth.spawnedAt) / 7000) * 201.1} 201.1`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 100ms linear' }} />
          </svg>
          <button onClick={handleDiamondClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 72, height: 72 }}>
            <img src="uploads/diamond-tooth-1.png" alt="diamond tooth" style={{ width: 42, height: 42, objectFit: 'contain', filter: 'drop-shadow(0 0 20px oklch(0.8 0.15 220 / 0.9))' }} />
            <div style={{ position: 'absolute', bottom: -12, background: 'rgba(0,0,0,0.65)', color: 'oklch(0.85 0.12 220)', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
              {lang === 'es' ? '2h de producción' : '2h production'}
            </div>
          </button>
        </div>
      }

      {/* Crystal tooth — click for x5 frenzy 45s */}
      {specialTooth?.type === 'crystal' &&
      <div style={{ position: 'fixed', left: specialTooth.x, top: specialTooth.y, transform: 'translate(-50%,-50%)', zIndex: 500, animation: 'goldFloat 2s ease-in-out infinite', userSelect: 'none', width: 72, height: 72 }}>
          <svg width="72" height="72" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <circle cx="36" cy="36" r="32" fill="none" stroke="oklch(0.8 0.15 200)" strokeWidth="3"
              strokeDasharray={`${Math.max(0, 1 - (Date.now() - specialTooth.spawnedAt) / 7000) * 201.1} 201.1`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 100ms linear' }} />
          </svg>
          <button onClick={handleCrystalClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 72, height: 72 }}>
            <img src="uploads/crystal-tooth-1.png" alt="crystal tooth" style={{ width: 42, height: 42, objectFit: 'contain', filter: 'drop-shadow(0 0 20px oklch(0.75 0.18 200 / 0.85))' }} />
            <div style={{ position: 'absolute', bottom: -12, background: 'rgba(0,0,0,0.65)', color: 'oklch(0.8 0.15 200)', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
              {lang === 'es' ? 'Frenesí x5 — 45s' : 'x5 Frenzy — 45s'}
            </div>
          </button>
        </div>
      }

      <window.Toast toast={toast} lang={lang} />

      {showWelcomeBack && offlineInfo &&
      <Modal onClose={() => setShowWelcomeBack(false)}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-3)' }}>
            <img src={selectedStage.img} alt="" style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(80,140,220,0.25))' }} />
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
              {lang === 'es' ? `Tras ${newToothUnlock.stage.prestige} prestigio${newToothUnlock.stage.prestige === 1 ? '' : 's'} realizados` : `After ${newToothUnlock.stage.prestige} prestige${newToothUnlock.stage.prestige === 1 ? '' : 's'}`}
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
      {showFeedbackModal && (
        <FeedbackModal 
          onClose={() => setShowFeedbackModal(false)} 
          lang={lang} 
          username={username} 
          state={state}
          setState={setState}
          onSuccess={() => {
            setShowFeedbackModal(false);
            setToast({ id: 'feedback_success', es: '¡Gracias por tu feedback!', en: 'Thanks for your feedback!' });
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}
      {cheatLevel > 0 && (
        <window.AntiCheatModal 
          level={cheatLevel} 
          lang={lang} 
          onAcknowledge={() => {
            clickTimesRef.current = [];
            if (cheatLevel > 1) {
              // Kick user
              onLogout();
            } else {
              setCheatLevel(0);
            }
          }} 
        />
      )}
      {username === 'James' && cheatLevel === 0 && (
        <window.AdminAutoClicker 
          lang={lang} 
          isMainMouseDown={isMainMouseDown} 
          onSimulateClick={performClick} 
        />
      )}
      {bossMsg && <BossMarquee msg={bossMsg} lang={lang} danger={bossMsg.danger} onDismiss={() => setBossMsg(null)} />}
      
      {globalTooltip && (
        <div style={{
          position: 'fixed', 
          left: Math.max(110, Math.min(window.innerWidth - 110, globalTooltip.pos.x)), 
          top: globalTooltip.pos.y + (globalTooltip.direction === 'down' ? 8 : -8),
          transform: globalTooltip.direction === 'down' ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-100%)',
          background: 'var(--fg-1)', color: 'var(--bg-1)',
          padding: '8px 14px', borderRadius: 10,
          fontSize: 12, lineHeight: 1.4,
          zIndex: 10000, pointerEvents: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          width: 200, whiteSpace: 'normal', textAlign: 'center',
          animation: 'fadeIn 150ms ease-out',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {globalTooltip.type === 'shop' ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{globalTooltip.data[lang] || globalTooltip.data.es}</div>
              <div style={{ fontSize: 11, color: '#FFC220', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <i className="fa-solid fa-tooth"></i> {fmt(globalTooltip.data.cost)}
              </div>
              <div style={{ opacity: 0.8, fontSize: 11 }}>{globalTooltip.data[`desc_${lang}`] || globalTooltip.data.desc_es}</div>
            </>
          ) : globalTooltip.type === 'stage' ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{globalTooltip.unlocked ? (globalTooltip.data[lang] || globalTooltip.data.es) : '???'}</div>
              <div style={{ opacity: 0.8, fontSize: 11 }}>
                {globalTooltip.unlocked 
                  ? (lang === 'es' ? 'Evolución desbloqueada' : 'Evolution unlocked')
                  : (lang === 'es' ? `Se desbloquea tras ${globalTooltip.data.prestige} prestigio${globalTooltip.data.prestige === 1 ? '' : 's'}` : `Unlocks after ${globalTooltip.data.prestige} prestige${globalTooltip.data.prestige === 1 ? '' : 's'}`)
                }
              </div>
            </>
          ) : globalTooltip.type === 'text' ? (
            <div style={{ fontSize: 12 }}>{globalTooltip.text}</div>
          ) : globalTooltip.type === 'xp' ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{lang === 'es' ? 'Experiencia' : 'Experience'}</div>
              <div style={{ opacity: 0.8, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                {lang === 'es' ? 'Faltan ' : ''}
                {(window.getXPRequired(state.level) - state.xp).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {lang === 'es' ? ` XP para nivel ${state.level + 1}` : ` XP missing for level ${state.level + 1}`}
              </div>
            </>
          ) : globalTooltip.type === 'generic' ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{globalTooltip.data.title}</div>
              <div style={{ opacity: 0.8, fontSize: 11 }}>{globalTooltip.data.desc}</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{globalTooltip.unlocked ? (globalTooltip.data[lang] || globalTooltip.data.es) : '???'}</div>
              <div style={{ opacity: 0.8, fontSize: 11 }}>{globalTooltip.data[`desc_${lang}`] || globalTooltip.data.desc_es}</div>
            </>
          )}
        </div>
      )}

      {contextMenu && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, minWidth: 260, background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', boxShadow: 'var(--elevation-20)', padding: 6, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <window.MenuItem icon={soundOn ? 'fa-volume-high' : 'fa-volume-xmark'} label={soundOn ? t.soundOn : t.soundOff} onClick={() => { window.playClickSound && window.playClickSound(); toggleSound(); }} />
          <window.MenuItem icon="fa-language" label={lang === 'es' ? 'Español' : 'English'} trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'EN →' : 'ES →'}</span>} onClick={() => { window.playClickSound && window.playClickSound(); toggleLang(); }} />
          <window.MenuItem icon="fa-hashtag" label={lang === 'es' ? 'Formato numérico' : 'Number format'} trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{{ short: '1.2M', long: lang === 'es' ? 'millón' : 'million', engineering: '1.2e6', scientific: '10^6' }[numFormat]} →</span>} onClick={() => { window.playClickSound && window.playClickSound(); cycleNumFormat(); }} />
          <window.MenuItem icon="fa-circle-info" label={lang === 'es' ? 'Acerca de' : 'About'} onClick={() => { window.playClickSound && window.playClickSound(); setShowAbout(true); }} />
          <window.MenuItem icon="fa-comment-dots" label={lang === 'es' ? 'Enviar feedback' : 'Send feedback'} onClick={() => { window.playClickSound && window.playClickSound(); setShowFeedbackModal(true); }} />
          <window.MenuDivider />
          <window.MenuItem icon="fa-question" label="¡Te sientes curioso?" onClick={() => { window.playClickSound && window.playClickSound(); setShowCuriosityModal(true); }} />
          <window.MenuDivider />
          <window.MenuItem icon="fa-right-from-bracket" label={t.logout} onClick={() => { 
            window.playClickSound && window.playClickSound(); 
            try {persistUserSave(username, stateRef.current);} catch (e) {}
            try {
              const s = stateRef.current;
              if (s) {
                const ban = window.AntiCheat.getBanData(username);
                window.cloudSubmitScore({ 
                  name: username, 
                  totalEarned: s.totalEarned || 0, 
                  prestige: s.prestige || 0, 
                  prestigeCount: s.prestigeCount || 0, 
                  timePlayed: s.timePlayed || 0, 
                  teeth: s.teeth || 0, 
                  clinicName: s.clinicName,
                  banUntil: ban.until,
                  banIndefinite: ban.until === -1
                });
              }
            } catch (e) {}
            onLogout && onLogout();
          }} />
          <window.MenuItem icon="fa-trash" label={t.reset} danger onClick={() => { window.playClickSound && window.playClickSound(); setShowResetConfirm(true); }} />
        </div>
      )}

      {showLevelUpModal && (
        <window.Modal onClose={() => setShowLevelUpModal(false)} maxWidth={380} persistent>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎊</div>
            <div className="t-heading-m" style={{ color: 'var(--primary-i100)' }}>{lang === 'es' ? '¡Nuevo Nivel!' : 'Level Up!'}</div>
            <div className="t-body-m" style={{ marginTop: 8, color: 'var(--fg-2)' }}>
              {lang === 'es' ? `¡Felicidades! Has alcanzado el nivel ${justLeveledTo}.` : `Congratulations! You've reached level ${justLeveledTo}.`}
            </div>
            {(() => {
              const up = (window.LEVEL_UPGRADES || []).find(u => u.levelReq === justLeveledTo);
              if (!up) return null;
              return (
                <div style={{ marginTop: 16, padding: '12px', background: 'var(--warning-i005)', borderRadius: 12, border: '1px solid var(--warning-i030)', textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--warning-i130)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {lang === 'es' ? '¡NUEVA MEJORA ESPECIAL!' : 'NEW SPECIAL UPGRADE!'}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-1)' }}>{up.name[lang]}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{up.desc[lang]}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-i100)', marginTop: 4 }}>{lang === 'es' ? 'Disponible en la Academia' : 'Available in the Academy'}</div>
                </div>
              );
            })()}
            <div style={{ marginTop: 16, padding: '12px', background: 'var(--primary-i005)', borderRadius: 12, border: '1px solid var(--primary-i020)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-i130)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {lang === 'es' ? 'Próximo Objetivo' : 'Next Goal'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                {fmt(window.getXPRequired(justLeveledTo))} XP
              </div>
            </div>
            <button onClick={() => setShowLevelUpModal(false)} style={{ ...primaryBtnStyle, marginTop: 20, width: '100%' }}>
              {lang === 'es' ? '¡Excelente!' : 'Awesome!'}
            </button>
          </div>
        </window.Modal>
      )}

      {showCuriosityModal && (
        <window.Modal onClose={() => setShowCuriosityModal(false)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
            <p className="t-body-m" style={{ color: 'var(--fg-2)', lineHeight: 1.5, marginBottom: 20 }}>
              Lamento desepcionarte pero aquí no hay nada
            </p>
            <button 
              onClick={() => setShowCuriosityModal(false)}
              style={primaryBtnStyle}
            >
              {lang === 'es' ? 'Entendido' : 'Understood'}
            </button>
          </div>
        </window.Modal>
      )}
      {currentTourStep !== null && (
        <window.GameTour 
          step={currentTourStep} 
          lang={lang} 
          onNext={() => setCurrentTourStep(s => s + 1)}
          onPrev={() => setCurrentTourStep(s => s - 1)}
          dontShowAgain={dontShowTourAgain}
          onToggleShowAgain={() => {
            const next = !dontShowTourAgain;
            setDontShowTourAgain(next);
            setState(s => ({ ...s, dontShowTourAgain: next }));
          }}
          onClose={() => {
            if (currentTourStep !== null && currentTourStep < 5 && !hasSeenHelpIndicator) {
              setCurrentTourStep(5);
              return;
            }
            if (!hasSeenTour || !hasSeenHelpIndicator) {
              const nextSeenTour = true;
              const nextSeenHelp = true;
              setHasSeenTour(nextSeenTour);
              setHasSeenHelpIndicator(nextSeenHelp);
              setState(s => ({ ...s, hasSeenTour: nextSeenTour, hasSeenHelpIndicator: nextSeenHelp }));
            }
            setCurrentTourStep(null);
          }}
        />
      )}
    </>
  );
}

function App() {
  const [username, setUsername] = useState(null);
  const [screen, setScreen] = useState("gate");
  const [users, setUsers] = useState(() => loadUsers());
  const [deviceUser, setDeviceUser] = useState(() => localStorage.getItem(DEVICE_USER_KEY) || null);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'es');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== '0');
  const [numFormat, setNumFormat] = useState(() => localStorage.getItem(NUMFMT_KEY) || 'short');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_ID_KEY) || null);
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [savedState, setSavedState] = useState(null);

  // Global reset check and settings sync
  useEffect(() => {
    const syncData = async () => {
      try {
        const res = await window.cloudFetchLeaderboard();
        if (res.ok && res.lastResetAt) {
          const localReset = parseInt(localStorage.getItem(LAST_RESET_KEY) || '0');
          if (res.lastResetAt > localReset) {
            console.log("Global reset detected. Wiping local progress...", res.lastResetAt);
            localStorage.setItem(LAST_RESET_KEY, res.lastResetAt.toString());
            const keysToClear = [SAVES_KEY, USERS_KEY, DEVICE_USER_KEY, CURRENT_USER_KEY, ADMIN_AUTH_KEY];
            keysToClear.forEach(k => localStorage.removeItem(k));
            if (username) { setUsername(null); setScreen('gate'); }
            return;
          }
        }

        // Check for session termination
        if (username && sessionId && !sessionTerminated) {
          const checkUser = username;
          const checkSession = sessionId;
          const meRes = await window.cloudFetchPlayer(checkUser);
          
          // If we logged out or changed user while waiting, stop
          if (!username || !sessionId || username !== checkUser || sessionId !== checkSession) return;

          if (meRes.ok && meRes.player) {
            const cloudSessionId = meRes.player.sessionId;
            if (cloudSessionId && cloudSessionId !== checkSession) {
              console.warn(`[SessionCheck] Mismatch for ${username}! Cloud: ${cloudSessionId} vs Local: ${checkSession}`);
              setSessionTerminated(true);
              return;
            }
          }
        }

        // Check for deleted users (Admin cleanup)
        if (res.ok && res.scores) {
          const cloudNames = new Set(res.scores.map(s => s.name.toLowerCase()));
          const localUsers = loadUsers();
          let needsUpdate = false;
          const filtered = localUsers.filter(u => {
            const low = u.toLowerCase();
            if (low === 'james') return true;
            if (cloudNames.has(low)) return true;
            const save = loadUserSave(u);
            if (save && (save.totalEarned > 1000000 || (save.prestigeCount || 0) > 0)) {
              console.log(`User ${u} deleted from cloud. Clearing locally.`);
              deleteUserSave(u);
              needsUpdate = true;
              return false;
            }
            return true;
          });
          if (needsUpdate) {
            saveUsers(filtered);
            setUsers(filtered);
            const currentDevUser = localStorage.getItem(DEVICE_USER_KEY);
            if (currentDevUser && !filtered.includes(currentDevUser)) {
              localStorage.removeItem(DEVICE_USER_KEY);
              setDeviceUser(null);
              if (username === currentDevUser) {
                setUsername(null);
                setScreen('gate');
                window.location.reload();
              }
            }
          }
        }
      } catch (e) { console.error("Sync error:", e); }

      try {
        const setRes = await window.cloudFetchSettings();
        if (setRes.ok && setRes.settings && setRes.settings.cpsThreshold) {
          localStorage.setItem('admin_cps_threshold', setRes.settings.cpsThreshold.toString());
        }
      } catch (e) {}
    };
    
    syncData();
    const id = setInterval(syncData, 15000);
    return () => clearInterval(id);
  }, [username, sessionId]);
  // Keep window.__lang in sync (used by UserPill)
  useEffect(() => {window.__lang = lang;}, [lang]);

  const [banErrorMsg, setBanErrorMsg] = useState(null);

  const checkBan = useCallback((name) => {
    const status = window.AntiCheat.checkBanStatus(name);
    if (status && status.isBanned) {
      const msg = status.indefinite 
        ? (lang === 'es' ? 'Esta cuenta ha sido baneada permanentemente por uso de macros. Todo tu progreso ha sido eliminado.' : 'This account is permanently banned for macro usage. Your progress has been wiped.')
        : (lang === 'es' ? `Esta cuenta está suspendida hasta el ${new Date(status.until).toLocaleString()}.` : `This account is suspended until ${new Date(status.until).toLocaleString()}.`);
      setBanErrorMsg(msg);
      return true;
    }
    return false;
  }, [lang]);

  const refreshUsers = useCallback(() => setUsers(loadUsers()), []);

  const handleCreateUser = useCallback(async (name, password) => {
    const cleaned = name.trim().slice(0, 24);
    if (!cleaned || !password) return;
    if (checkBan(cleaned)) return;
    
    // Register in cloud
    const res = await window.cloudRegister(cleaned, password, defaultState());
    if (!res.ok) {
      alert(lang === 'es' ? 'Error al registrar: ' + res.error : 'Registration error: ' + res.error);
      return;
    }

    const updated = [...loadUsers(), cleaned];
    saveUsers(updated);
    localStorage.setItem(DEVICE_USER_KEY, cleaned);
    
    // Store password locally in the save object
    persistUserSave(cleaned, { ...defaultState(), password });
    
    setUsers(updated);
    setDeviceUser(cleaned);
    
    if (res.sessionId) {
      setSessionId(res.sessionId);
      localStorage.setItem(SESSION_ID_KEY, res.sessionId);
    }
    
    setUsername(cleaned);
    setSavedState(null); // New users start fresh
    setScreen('game');
  }, [lang, checkBan]);

  const handleSelectUser = useCallback((name, cloudData = null, password = null) => {
    if (checkBan(name)) return;
    
    if (cloudData) {
      const cloudProgress = cloudData.saveData || cloudData; 
      setSavedState(cloudProgress);
      
      // Ensure user is in the local list
      const currentUsers = loadUsers();
      if (!currentUsers.includes(name)) {
        saveUsers([...currentUsers, name]);
        setUsers(loadUsers());
      }

      if (cloudData.sessionId) {
        setSessionId(cloudData.sessionId);
        localStorage.setItem(SESSION_ID_KEY, cloudData.sessionId);
      }
    } else {
      setSavedState(null);
    }
    
    setUsername(name);
    setScreen('game');
  }, [checkBan]);

  const handleAdminAccess = useCallback(() => {
    const session = { expiresAt: Date.now() + 30 * 60 * 1000 };
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
    setScreen('admin');
  }, []);

  const handleAdminBack = useCallback(() => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setScreen('gate');
  }, []);

  const handleAdminEnterGame = useCallback((name) => {
    if (name !== 'James' && checkBan(name)) return;
    setUsername(name);
    setScreen('game');
  }, [checkBan]);

  const handleLogout = useCallback(() => {
    setSessionTerminated(false);
    setUsername(null);
    setSessionId(null);
    localStorage.removeItem(SESSION_ID_KEY);
    refreshUsers();
    setScreen('gate');
  }, [refreshUsers]);

  const handleDeleteUser = useCallback(() => {
    // Remove from users list
    try {
      const users = loadUsers();
      const filtered = users.filter((u) => (typeof u === 'string' ? u : u.name) !== username);
      saveUsers(filtered);
    } catch (e) {}
    // Also clean admin accounts list if present
    try {
      const admins = JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || '[]');
      const filtered = admins.filter((u) => (typeof u === 'string' ? u : u.name) !== username);
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(filtered));
    } catch (e) {}
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

  const handleLogoutDeviceUser = useCallback(() => {
    localStorage.removeItem(DEVICE_USER_KEY);
    setDeviceUser(null);
  }, []);

  if (screen === 'admin') {

    return (
      <AdminPanel
        lang={lang}
        onLangChange={() => handleLangChange()}
        onEnterGame={handleAdminEnterGame}
        onBack={handleAdminBack} />);
  }

  if (screen === 'game') {
    return (
      <Game key={username} username={username} sessionId={sessionId} lang={lang} onLangChange={handleLangChange}
        saved={savedState}
        onLogout={handleLogout} onDeleteUser={handleDeleteUser}
        numFormat={numFormat} onNumFormatChange={handleNumFormatChange} />);
  }

  return (
    <>
      <window.Gate
        lang={lang}
        onLangChange={handleLangChange}
        onSelectUser={handleSelectUser}
        onCreateUser={handleCreateUser}
        onAdminAccess={handleAdminAccess}
        onLogoutDeviceUser={handleLogoutDeviceUser}
        users={users}
        deviceUser={deviceUser}

        soundOn={soundOn}
        onSoundToggle={handleSoundToggle} />
        
      {banErrorMsg && (
        <window.Modal onClose={() => setBanErrorMsg(null)}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⛔</div>
            <h2 className="t-heading-m" style={{ color: 'var(--negative-i100)', marginBottom: 12 }}>
              {lang === 'es' ? 'Acceso Denegado' : 'Access Denied'}
            </h2>
            <p className="t-body-m" style={{ color: 'var(--fg-2)', lineHeight: 1.5, marginBottom: 20 }}>
              {banErrorMsg}
            </p>
            <button 
              onClick={() => setBanErrorMsg(null)}
              className="t-heading-xs"
              style={{ all: 'unset', background: 'var(--bg-3)', color: 'var(--fg-1)', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}
            >
              {lang === 'es' ? 'Volver' : 'Back'}
            </button>
          </div>
        </window.Modal>
      )}

      {sessionTerminated && (
        <window.Modal onClose={() => {}} persistent={true}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📱</div>
            <h2 className="t-heading-m" style={{ color: 'var(--warning-i130)', marginBottom: 12 }}>
              {lang === 'es' ? 'Sesión Cerrada' : 'Session Closed'}
            </h2>
            <p className="t-body-m" style={{ color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 24 }}>
              {lang === 'es' 
                ? 'Tu sesión se ha cerrado porque has ingresado al juego desde otro dispositivo.' 
                : 'Your session has been closed because you logged into the game from another device.'}
            </p>
            <button 
              onClick={() => {
                localStorage.removeItem(SESSION_ID_KEY);
                window.location.reload();
              }}
              style={{
                all: 'unset', boxSizing: 'border-box', width: '100%', padding: '12px', 
                background: 'var(--primary-i100)', color: '#fff', borderRadius: 10, 
                fontWeight: 600, fontSize: 15, cursor: 'pointer'
              }}
            >
              {lang === 'es' ? 'Entendido' : 'Understood'}
            </button>
          </div>
        </window.Modal>
      )}
    </>
  );
}

Object.assign(window, { Modal, MenuItem, MenuDivider, deleteUserSave, ADMIN_NAME });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));