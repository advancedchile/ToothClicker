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


function Modal({ children, onClose, maxWidth, persistent, overflowVisible }) {
  return (
    <div onClick={() => !persistent && onClose && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(5,9,13,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeIn 150ms ease' }}>
      <div className="game-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-1)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-m)', boxShadow: 'var(--elevation-30)', maxWidth: maxWidth || 420, width: '92%', animation: 'modalIn 200ms ease', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: overflowVisible ? 'visible' : 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>);
}

function PrestigeConfetti() {
  const [particles, setParticles] = useState([]);
  const idRef = useRef(0);
  const COLORS = ['#FFD700','#FF007A','#00D1FF','#FF4500','#7B61FF','#00E676','#FF6D00','#E040FB'];
  const spawn = useCallback((count) => {
    const now = [];
    for (let i = 0; i < count; i++) {
      const edge = Math.floor(Math.random() * 4);
      let x, y;
      if (edge === 0) { x = Math.random() * 100; y = 0; }        // top
      else if (edge === 1) { x = Math.random() * 100; y = 100; }  // bottom
      else if (edge === 2) { x = 0; y = Math.random() * 100; }    // left
      else { x = 100; y = Math.random() * 100; }                   // right
      const dx = (Math.random() - 0.5) * 180;
      const dy = (Math.random() - 0.5) * 180 + 40;
      const rot = (Math.random() - 0.5) * 720;
      const w = 5 + Math.random() * 6;
      const h = 4 + Math.random() * 8;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const dur = 1.2 + Math.random() * 0.8;
      now.push({ id: idRef.current++, x, y, dx, dy, rot, w, h, color, dur });
    }
    setParticles(prev => [...prev, ...now]);
  }, []);
  useEffect(() => {
    spawn(25);
    const iv = setInterval(() => spawn(6), 400);
    return () => clearInterval(iv);
  }, [spawn]);
  useEffect(() => {
    if (particles.length > 120) {
      setParticles(prev => prev.slice(-80));
    }
  }, [particles.length]);
  return (
    <div className="prestige-confetti-container">
      {particles.map(p => (
        <div key={p.id} className="prestige-confetti-particle" style={{
          left: p.x + '%', top: p.y + '%',
          width: p.w, height: p.h,
          background: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animationDuration: p.dur + 's',
          '--cx': p.dx + 'px', '--cy': p.dy + 'px', '--cr': p.rot + 'deg'
        }} />
      ))}
    </div>
  );
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

const getAbsoluteSrc = (src) => {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  
  let base = '';
  if (window.location.hostname.includes('github.io')) {
    base = '/ToothClicker/';
  } else {
    base = window.location.pathname;
    if (!base.endsWith('/')) {
      const parts = base.split('/');
      parts.pop();
      base = parts.join('/') + '/';
    }
  }
  
  const origin = window.location.origin;
  const cleanBase = base.startsWith('/') ? base : '/' + base;
  return `${origin}${cleanBase}${src.startsWith('/') ? src.slice(1) : src}`;
};

function FloatingBonus({ bonus, onClick }) {
  const { useState, useEffect, useRef } = React;
  const [pos, setPos] = useState({ x: bonus.x, y: bonus.y });
  const [progress, setProgress] = useState(0);

  const speed = bonus.speed === 'fast' ? 4 : bonus.speed === 'slow' ? 1 : 2.2;
  const vRef = useRef({ vx: (Math.random() > 0.5 ? 1 : -1) * speed, vy: (Math.random() > 0.5 ? 1 : -1) * speed });
  const posRef = useRef({ x: bonus.x, y: bonus.y });

  useEffect(() => {
    const lifespan = 7000;
    const start = bonus.spawnedAt || Date.now();
    let rAF;
    
    const update = () => {
      const now = Date.now();
      const elapsed = now - start;
      const p = Math.min(1, elapsed / lifespan);
      setProgress(p);

      let { x, y } = posRef.current;
      let { vx, vy } = vRef.current;
      
      x += vx;
      y += vy;

      if (x < 36) { x = 36; vx *= -1; }
      if (x > window.innerWidth - 36) { x = window.innerWidth - 36; vx *= -1; }
      if (y < 36) { y = 36; vy *= -1; }
      if (y > window.innerHeight - 36) { y = window.innerHeight - 36; vy *= -1; }

      posRef.current = { x, y };
      vRef.current = { vx, vy };
      setPos({ x, y });

      if (p < 1) {
        rAF = requestAnimationFrame(update);
      }
    };
    rAF = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rAF);
  }, []);

  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)', zIndex: 500, width: 72, height: 72 }}>
      <div style={{ position: 'absolute', inset: -15, pointerEvents: 'none' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="6" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#FFC220" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 * progress} strokeLinecap="round" />
        </svg>
      </div>
      <img src={bonus.image || 'uploads/gold-tooth-1.png'} alt={bonus.name?.es} onClick={() => onClick(bonus)} style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }} />
    </div>
  );
}

function Game({ username, saved: cloudSaved, sessionId, lang: initialLang, onLangChange, onLogout, onDeleteUser, numFormat: initialNumFormat, onNumFormatChange, onBackToAdmin, activeSeasonConfig, isSeasonModalOpen }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const isAdmin = username === 'James';
  
  const [seasonTimeLeft, setSeasonTimeLeft] = useState(null);
  useEffect(() => {
    if (!activeSeasonConfig) return;
    const updateTime = () => {
      const ms = activeSeasonConfig.endDate - Date.now();
      if (ms <= 0) {
        window.location.reload(); 
      } else {
        setSeasonTimeLeft(ms);
      }
    };
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, [activeSeasonConfig]);

  const formatSeasonTime = (ms) => {
    if (!ms || ms < 0) return '0s';
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${d > 0 ? d + 'd ' : ''}${h}:${m}:${ss}`;
  };

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
        const { perSecond } = window.computePassivePower(snap, []);
        const earned = perSecond * capped;
        if (earned > 0) info = { elapsedSeconds: elapsed, cappedSeconds: capped, wasCapped: elapsed > OFFLINE_CAP_S, earned };
      }
    }
    bootRef.current = { saved: snap, offlineInfo: info };
  }
  const saved = bootRef.current.saved;
  const offlineInfo = bootRef.current.offlineInfo;

  const [state, setState] = useState(() => {
    const activeTemplateId = window.GAME_CONTENT?._templateId || null;
    if (!saved) {
      return { ...defaultState(), _templateId: activeTemplateId };
    }
    
    // Season Wipe Logic
    if (activeTemplateId && saved._templateId && saved._templateId !== activeTemplateId) {
      console.log(`[Season] Mismatch detected: saved ${saved._templateId} vs active ${activeTemplateId}. Wiping local save.`);
      return { ...defaultState(), _templateId: activeTemplateId };
    }
    
    const base = { ...defaultState(), ...saved, _templateId: activeTemplateId || saved._templateId };
    
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

    if (!base.legacyXpRebalanceDone) {
      if (base.level > 25 && base.timePlayed) {
        const xpFromUpgrades = (window.XP_UPGRADES || []).reduce((acc, up) => acc + (base.xpUpgrades?.[up.id] ? up.xpPassive : 0), 0);
        const specialPassiveXpMult = (window.LEVEL_UPGRADES || []).reduce((acc, up) => acc + (base.xpUpgrades?.[up.id] && (!up.xpMultType || up.xpMultType === 'passive' || up.xpMultType === 'both') ? (up.xpMult || 0) : 0), 0);
        const globalPassiveXpMult = 1 + specialPassiveXpMult;
        
        const currentXpRate = xpFromUpgrades * globalPassiveXpMult;
        let recalculatedTotalXP = 100 + (currentXpRate * base.timePlayed);
        
        let newLevel = 0;
        while (newLevel < 50000) {
          const req = window.getXPRequired(newLevel);
          if (recalculatedTotalXP >= req) {
            recalculatedTotalXP -= req;
            newLevel++;
          } else {
            break;
          }
        }
        
        base.level = newLevel;
        base.xp = recalculatedTotalXP;
        
        if (base.xpUpgrades) {
          (window.LEVEL_UPGRADES || []).forEach(up => {
            if (base.level < up.levelReq && base.xpUpgrades[up.id]) {
              delete base.xpUpgrades[up.id];
            }
          });
        }
      }
      base.legacyXpRebalanceDone = true;
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
  const [visualEffects, setVisualEffects] = useState(() => localStorage.getItem('tooth-clicker-visual-effects') !== '0');
  const [tab, setTab] = useState('generators');
  const [floats, setFloats] = useState([]);

  const [toast, setToast] = useState(null);
  const [achievementToasts, setAchievementToasts] = useState([]);
  const [clickPulse, setClickPulse] = useState(0);
  const [saveFlash, setSaveFlash] = useState(false);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSpinningBrushes, setShowSpinningBrushes] = useState(() => localStorage.getItem('tooth-clicker-show-spinning-brushes') !== '0');
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y }
  const [showCuriosityModal, setShowCuriosityModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [newToothUnlock, setNewToothUnlock] = useState(null); // { stage, idx }
  const [newMusicUnlock, setNewMusicUnlock] = useState(null);
  const [musicScrollToId, setMusicScrollToId] = useState(null);
  const [buyQty, setBuyQty] = useState(1);
  const [visualTick, setVisualTick] = useState(0);
  const [sunOpacity, setSunOpacity] = useState(0);
  const [sunColor, setSunColor] = useState('transparent');
  const [spawnedBonuses, setSpawnedBonuses] = useState([]);
  const [activeBonusEffects, setActiveBonusEffects] = useState([]);
  const activeEffectsRef = useRef([]);
  const spawnedBonusesRef = useRef([]);
  const bonusTimerRef = useRef(null);

  // Music Player State
  const audioRef = useRef(null);
  const musicAttempted = useRef(false);
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  
  const processedAchievementsRef = useRef(new Set());
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(() => {
    const id = saved?.musicSettings?.currentTrackId;
    const found = MUSIC_TRACKS.find(t => t.id === id);
    const lvl = saved?.state?.level || 0;
    const pstg = saved?.state?.prestigeCount || 0;
    if (found && lvl >= (found.reqLevel || 0) && pstg >= (found.reqPrestige || 0)) return found;
    const unlocked = MUSIC_TRACKS.filter(t => lvl >= (t.reqLevel || 0) && pstg >= (t.reqPrestige || 0));
    const playable = unlocked.length > 0 ? unlocked : MUSIC_TRACKS;
    return playable[Math.floor(Math.random() * playable.length)];
  });
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(() => saved?.musicSettings?.volume ?? 0.4);
  const [musicMuted, setMusicMuted] = useState(() => saved?.musicSettings?.muted ?? false);
  const [playMode, setPlayMode] = useState(() => saved?.musicSettings?.playMode ?? 'shuffle');
  const [musicTime, setMusicTime] = useState(0);
  const lastTimeUpdate = useRef(0);
  const [tabsMenuOpen, setTabsMenuOpen] = useState(false);
  const [tabViewOpen, setTabViewOpen] = useState(false);
  const [musicDuration, setMusicDuration] = useState(0);
  const [showSeasonBanner, setShowSeasonBanner] = useState(true);
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
    const unlockedTracks = tracks.filter(t => (state.level >= (t.reqLevel || 0)) && ((state.prestigeCount || 0) >= (t.reqPrestige || 0)));
    if (unlockedTracks.length === 0) return;
    const random = unlockedTracks[Math.floor(Math.random() * unlockedTracks.length)];
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

  // Load music from template
  useEffect(() => {
    const templateMusic = window.GAME_CONTENT?.music || [];
    setTracks(templateMusic);
    // If current track is not in the list, set it to the saved one or random
    setCurrentTrack(curr => {
      if (templateMusic.length === 0) return null;
      const isCurrValid = curr && templateMusic.find(t => t.id === curr.id);
      const isCurrUnlocked = isCurrValid && (state.level >= (curr.reqLevel || 0)) && ((state.prestigeCount || 0) >= (curr.reqPrestige || 0));
      
      if (isCurrUnlocked) return curr;
      
      const savedId = saved?.musicSettings?.currentTrackId;
      const savedTrack = templateMusic.find(t => t.id === savedId);
      if (savedTrack && (state.level >= (savedTrack.reqLevel || 0)) && ((state.prestigeCount || 0) >= (savedTrack.reqPrestige || 0))) return savedTrack;

      const unlocked = templateMusic.filter(t => (state.level >= (t.reqLevel || 0)) && ((state.prestigeCount || 0) >= (t.reqPrestige || 0)));
      const playable = unlocked.length > 0 ? unlocked : templateMusic;
      return playable[Math.floor(Math.random() * playable.length)];
    });
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
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicPlaying) {
      const targetVol = musicMuted ? 0 : musicVolume;
      const absoluteSrc = getAbsoluteSrc(currentTrack?.src);

      // 1. If the source changed, update it
      if (audio.src !== absoluteSrc && absoluteSrc) {
        audio.src = absoluteSrc;
        audio.load();
        initialFadeDone.current = false;
      }

      // 2. Play the audio if it is paused
      if (audio.paused) {
        if (!initialFadeDone.current) {
          audio.volume = 0;
          audio.play()
            .then(() => {
              // Fade in
              let cur = 0;
              const step = 0.02;
              const interval = setInterval(() => {
                cur += step;
                if (cur >= targetVol) {
                  audio.volume = targetVol;
                  initialFadeDone.current = true;
                  clearInterval(interval);
                } else {
                  audio.volume = cur;
                }
              }, 50);
              return () => clearInterval(interval);
            })
            .catch(e => {
              console.warn('Asynchronous fade-in play blocked:', e);
            });
        } else {
          audio.volume = targetVol;
          audio.play().catch(e => {
            console.warn('Asynchronous resume play blocked:', e);
          });
        }
      } else {
        // If already playing, just ensure the volume is correct
        audio.volume = targetVol;
      }
    } else {
      audio.pause();
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
  const [questionFeedback, setQuestionFeedback] = useState(null);
  const [questionResult, setQuestionResult] = useState(null); // { correct, rewardDesc }
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
  const shownFixedMessagesRef = useRef(new Set());

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
    return !!saved?.dontShowTourAgain;
  });
  // We'll track if the user has EVER seen the tour to decide whether to auto-start
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return !!saved?.hasSeenTour;
  });
  const [hasSeenHelpIndicator, setHasSeenHelpIndicator] = useState(() => {
    return !!saved?.hasSeenHelpIndicator;
  });
  const buyXpUpgrade = (id) => {
    const up = [...(window.XP_UPGRADES || []), ...(window.LEVEL_UPGRADES || [])].find(u => u.id === id);
    if (!up || state.xpUpgrades?.[id]) return;
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
      return spawnedBonuses.length > 0 || activeBonusEffects.some(e => e.until > now);
    };
    if (!check()) return;
    const id = setInterval(() => setVisualTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [spawnedBonuses, activeBonusEffects]);

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
  useEffect(() => {
    window.setGlobalTooltip = setGlobalTooltip;
    return () => {
      delete window.setGlobalTooltip;
    };
  }, []);
  const [toothParticles, setToothParticles] = useState([]);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const soundRef = useRef(soundOn);soundRef.current = soundOn;
  const perClickRef = useRef(0);
  const t = window.STRINGS[lang];
  const unlockedTeethRef = useRef(null);

  useEffect(() => {
    if (!state) return;
    
    if (unlockedTeethRef.current === null) {
      unlockedTeethRef.current = window.TOOTH_STAGES.map(s => window.isToothUnlocked(state, s));
      return;
    }
    
    const newlyUnlocked = [];
    window.TOOTH_STAGES.forEach((s, idx) => {
      const isUnlocked = window.isToothUnlocked(state, s);
      if (isUnlocked && !unlockedTeethRef.current[idx]) {
        if (s.prestige > 0 || (s.reqLevel || 0) > 0 || s.reqGenId || (s.reqAcademyUpgrades && s.reqAcademyUpgrades.length > 0)) {
          newlyUnlocked.push({ stage: s, idx });
        }
      }
      unlockedTeethRef.current[idx] = isUnlocked;
    });

    if (newlyUnlocked.length > 0) {
      const latestUnlocked = newlyUnlocked[newlyUnlocked.length - 1];
      setTimeout(() => setNewToothUnlock({ stage: latestUnlocked.stage, idx: latestUnlocked.idx }), 600);
      if (soundRef.current) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => window.playTone(f, 0.15, 'triangle', 0.06), i * 80));
    }
  }, [state.prestigeCount, state.level, state.generators, state.xpUpgrades]);

  const unlockedMusicRef = useRef(null);

  useEffect(() => {
    if (!state || tracks.length === 0) return;
    
    if (unlockedMusicRef.current === null) {
      unlockedMusicRef.current = tracks.map(t => {
        return (state.level >= (t.reqLevel || 0)) && (state.prestigeCount >= (t.reqPrestige || 0));
      });
      return;
    }
    
    const newlyUnlocked = [];
    tracks.forEach((t, idx) => {
      const isUnlocked = (state.level >= (t.reqLevel || 0)) && (state.prestigeCount >= (t.reqPrestige || 0));
      if (isUnlocked && !unlockedMusicRef.current[idx]) {
        if ((t.reqLevel || 0) > 0 || (t.reqPrestige || 0) > 0) {
          newlyUnlocked.push(t);
        }
      }
      unlockedMusicRef.current[idx] = isUnlocked;
    });

    if (newlyUnlocked.length > 0) {
      const latestUnlocked = newlyUnlocked[newlyUnlocked.length - 1];
      setTimeout(() => setNewMusicUnlock(latestUnlocked), 600);
      if (soundRef.current) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => window.playTone(f, 0.15, 'triangle', 0.06), i * 80));
    }
  }, [state.prestigeCount, state.level, tracks]);

  const passiveData = useMemo(() => window.computePassivePower(state, activeBonusEffects), [state, activeBonusEffects]);
  const storeMults = passiveData.storeMults;
  const globalMult = passiveData.globalMult;
  const perSecondRaw = passiveData.perSecondRaw;
  const perSecond = passiveData.perSecond;
  const genProductions = passiveData.genProductions;
  
  const clickBase = useMemo(() => window.computeClickPower(state).total, [state.clickUpgrades, state.achievements, state.timePlayed]);
  const activeClickMult = activeBonusEffects.filter(e => e.until > Date.now() && e.type === 'multiplier_click').reduce((acc, curr) => acc * (curr.multiplier || 1), 1);
  const perClick = clickBase * (storeMults.click || 1) * globalMult * activeClickMult;
  
  const displayedPerSecond = perSecond + (liveCPS * perClick);
  
  const bonusPerSmile = window.GAME_CONTENT?.prestigeConfig?.bonusPerSmile ?? 0.05;
  const prestigeMult = 1 + ((state.prestige || 0) * bonusPerSmile);
  perClickRef.current = perClick;
  // Displayed tooth: player-selected if unlocked, else auto (highest unlocked)
  const autoStage = window.getToothStage(state.prestigeCount || 0, state.level || 1, state);
  const selectedStage = (() => {
    const s = window.TOOTH_STAGES[state.selectedTooth || 0];
    if (s && window.isToothUnlocked(state, s)) return s;
    return autoStage;
  })();

  const achUnlockedCount = Object.values(state.achievements || {}).filter(Boolean).length;
  const prestigeReq = useMemo(() => {
    const count = state.prestigeCount || 0;
    const baseReq = window.GAME_CONTENT?.prestigeConfig?.baseReq ?? 100000000000000;
    const scaling = window.GAME_CONTENT?.prestigeConfig?.scaling ?? 1.5;
    return baseReq * Math.pow(scaling, count);
  }, [state.prestigeCount]);

  const prestigeGain = useMemo(() => {
    if (state.totalEarned < prestigeReq) return 0;
    const B = window.GAME_CONTENT?.prestigeConfig?.baseReq ?? 100000000000000;
    const r = window.GAME_CONTENT?.prestigeConfig?.scaling ?? 1.5;
    const n = state.prestigeCount || 0;
    // Calculate total points k that can be gained at once
    const k = Math.log(1 + (state.totalEarned * (r - 1)) / (B * Math.pow(r, n))) / Math.log(r);
    return Math.max(0, Math.floor(k));
  }, [state.totalEarned, prestigeReq, state.prestigeCount]);

  const hasAffordableAcademyUpgrades = useMemo(() => {
    const allUps = [...(window.LEVEL_UPGRADES || []), ...(window.XP_UPGRADES || [])];
    return allUps.some(up => {
      const purchased = !!state.xpUpgrades?.[up.id];
      const meetsGenQty = up.reqGeneratorId ? ((state.generators?.[up.reqGeneratorId] || 0) >= (up.reqGenQty || 1)) : true;
      const validReqAch = up.reqAchievementId && up.reqAchievementId !== "none" && String(up.reqAchievementId).trim() !== "" && (window.ACHIEVEMENTS || []).some(a => String(a.id) === String(up.reqAchievementId));
      const meetsAch = validReqAch ? !!state.achievements[up.reqAchievementId] : true;
      const validLegacyAch = up.achievementId && up.achievementId !== "none" && String(up.achievementId).trim() !== "" && (window.ACHIEVEMENTS || []).some(a => String(a.id) === String(up.achievementId));
      const legacyAch = validLegacyAch ? !!state.achievements[up.achievementId] : true;
      const lvlReq = (up.levelReq !== undefined) ? up.levelReq : (up.reqLevel || 0);
      const isUnlocked = meetsGenQty && meetsAch && legacyAch && (state.level >= lvlReq);
      const cost = up.baseCost || up.costXP || 0;
      const canAfford = state.teeth >= cost;
      return !purchased && isUnlocked && canAfford;
    });
  }, [state.teeth, state.xpUpgrades, state.achievements, state.level, state.generators]);

  const anyMobileNotification = useMemo(() => {
    return Object.keys(state.newAchievementIds || {}).length > 0 ||
           prestigeGain > 0 ||
           hasAffordableAcademyUpgrades;
  }, [state.newAchievementIds, prestigeGain, hasAffordableAcademyUpgrades]);
  
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
        
        const passiveData = window.computePassivePower(s, activeEffectsRef.current);
        const earned = passiveData.perSecond * dt;
        
        // Passive XP Gain
        const xpPassiveBase = 0;
        const xpFromUpgrades = (window.XP_UPGRADES || []).reduce((acc, up) => acc + (s.xpUpgrades?.[up.id] ? up.xpPassive : 0), 0);
        
        // Apply global XP multipliers from special
        const specialPassiveXpMult = (window.LEVEL_UPGRADES || []).reduce((acc, up) => acc + (s.xpUpgrades?.[up.id] && (!up.xpMultType || up.xpMultType === 'passive' || up.xpMultType === 'both') ? (up.xpMult || 0) : 0), 0);
        let activeGlobalBonusMult = 1;
        activeEffectsRef.current.forEach(e => {
          if (e.type === 'multiplier_global' && e.until > Date.now()) {
            activeGlobalBonusMult *= (e.multiplier || 1);
          }
        });
        
        const globalPassiveXpMult = (1 + specialPassiveXpMult) * activeGlobalBonusMult;
        
        let newXP = (s.xp || 0) + (xpPassiveBase + xpFromUpgrades) * globalPassiveXpMult * dt;
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
  }, []);

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
    // Show tour if it's the first time and they haven't opted out (and it's not the admin user 'James')
    if (!hasSeenTour && !dontShowTourAgain && state.totalEarned === 0 && currentTourStep === null && username !== 'James' && !isSeasonModalOpen) {
      const timer = setTimeout(() => setCurrentTourStep(0), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, state.totalEarned, currentTourStep, isSeasonModalOpen, dontShowTourAgain, username]);

  const pushScore = useCallback((stateOverride, isLeaving = false) => {
    const s = stateOverride || stateRef.current;
    if (!s || !username) return;
    const ban = window.AntiCheat.getBanData(username);
    const entry = { 
      name: username, 
      password: s.password,
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
    for (const a of window.ACHIEVEMENTS) {
      if (!state.achievements[a.id] && !processedAchievementsRef.current.has(a.id) && typeof a.check === 'function' && a.check(state)) {
        newUnlocks.push(a);
        processedAchievementsRef.current.add(a.id);
      }
    }
    if (newUnlocks.length > 0) {
      setState((s) => {
        const next = { ...s, achievements: { ...s.achievements }, newAchievementIds: { ...(s.newAchievementIds || {}) } };
        for (const a of newUnlocks) {
          next.achievements[a.id] = true;
          next.newAchievementIds[a.id] = true;
        }
        return next;
      });
      const newToasts = newUnlocks.map((a, i) => {
        const hasUpgrade = (window.XP_UPGRADES || []).some(up => up.achievementId === a.id);
        return {
          ...a,
          uniqueId: 'ach_' + a.id + '_' + Date.now() + '_' + i,
          desc_es: hasUpgrade ? `${a.desc_es} ¡Nueva mejora de academia desbloqueada!` : a.desc_es,
          desc_en: hasUpgrade ? `${a.desc_en} New academy upgrade unlocked!` : a.desc_en
        };
      });
      
      setAchievementToasts(prev => [...prev, ...newToasts]);
      
      if (soundRef.current) {window.playTone(660, 0.12, 'triangle', 0.06);setTimeout(() => window.playTone(880, 0.12, 'triangle', 0.06), 100);}
    }
  }, [state.totalClicks, state.totalEarned, state.lifetimeEarned, state.generators, state.prestige, state.goldenClicks, state.clickUpgrades, state.timePlayed, state.feedbackSent]);

  // Track continuous play session time
  const sessionStartTime = useRef(null);
  useEffect(() => {
    if (sessionStartTime.current === null && state.timePlayed > 0) {
      sessionStartTime.current = state.timePlayed;
    }
    // Synchronize play time in minutes with the administration panel
    if (typeof window !== 'undefined') {
      window.__timePlayed = state.timePlayed / 60;
    }
  }, [state.timePlayed]);

  // Handle 1-Hour Continuous Session Authoritative Boss Messages
  const lastHourTriggeredRef = useRef(0);
  useEffect(() => {
    if (sessionStartTime.current === null) return;
    const elapsedSeconds = Math.max(0, state.timePlayed - sessionStartTime.current);
    const hourCount = Math.floor(elapsedSeconds / 3600); // 3600 seconds = 1 hour
    
    if (hourCount > 0 && hourCount > lastHourTriggeredRef.current) {
      lastHourTriggeredRef.current = hourCount;
      if (window.AUTHORITATIVE_BOSS_MESSAGES) {
        const pick = window.AUTHORITATIVE_BOSS_MESSAGES[Math.floor(Math.random() * window.AUTHORITATIVE_BOSS_MESSAGES.length)];
        const formattedText = window.replaceHoras(pick.text, hourCount);
        setBossMsg({
          who: pick.who,
          es: formattedText,
          en: formattedText,
          isCustom: true,
          milestone: hourCount * 60,
          color: pick.color,
          position: 'center',
          size: 'large',
          animation: 'rainbow',
          particles: 'fire'
        });
      }
    }
  }, [state.timePlayed]);

  // Handle Random Spacing Scheduler (5-10 min)
  useEffect(() => {
    const randomPool = customMessages.filter(m => m.milestone === -1);
    if (randomPool.length === 0) return;
    let timeoutId;
    
    function triggerRandomBossMessage() {
      const validPool = randomPool.filter(m => stateRef.current.level >= (m.levelReq || 0));
      if (validPool.length === 0) return;
      const pick = validPool[Math.floor(Math.random() * validPool.length)];
      setBossMsg({
        who: pick.who,
        es: pick.text,
        en: pick.text,
        isCustom: true,
        milestone: -1,
        color: pick.color || '#1a8fff',
        position: pick.position || 'bottom',
        size: pick.size || 'medium',
        animation: pick.animation || 'none',
        particles: pick.particles || 'none',
        ...(pick.msgType === 'question' ? {
          msgType: 'question',
          options: pick.options,
          correctOptionIndex: pick.correctOptionIndex,
          explanationText: pick.explanationText,
          correctReward: pick.correctReward,
          wrongReward: pick.wrongReward
        } : {})
      });
    }

    function scheduleNext() {
      // Spacing between 5 and 10 minutes (in ms)
      const randomDelay = (5 + Math.random() * 5) * 60 * 1000;
      timeoutId = setTimeout(() => {
        triggerRandomBossMessage();
        scheduleNext();
      }, randomDelay);
    }

    // Initial delay: first message appears randomly between 5 and 7 minutes after entering
    const initialDelay = (5 + Math.random() * 2) * 60 * 1000;
    timeoutId = setTimeout(() => {
      triggerRandomBossMessage();
      scheduleNext();
    }, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [customMessages]);

  // Handle Fixed Playtime Custom Messages (milestone >= 0)
  useEffect(() => {
    if (customMessages.length === 0) return;
    const currentMin = Math.floor(state.timePlayed / 60);
    customMessages.forEach(m => {
      if (typeof m.milestone === 'number' && m.milestone >= 0 && m.milestone === currentMin) {
        if (!shownFixedMessagesRef.current.has(m.id) && state.level >= (m.levelReq || 0)) {
          shownFixedMessagesRef.current.add(m.id);
          setBossMsg({
            who: m.who,
            es: m.text,
            en: m.text,
            isCustom: true,
            milestone: m.milestone,
            color: m.color || '#1a8fff',
            position: m.position || 'bottom',
            size: m.size || 'medium',
            animation: m.animation || 'none',
            particles: m.particles || 'none',
            ...(m.msgType === 'question' ? {
              msgType: 'question',
              options: m.options,
              correctOptionIndex: m.correctOptionIndex,
              explanationText: m.explanationText,
              correctReward: m.correctReward,
              wrongReward: m.wrongReward
            } : {})
          });
        }
      }
    });
  }, [state.timePlayed, customMessages]);

  // Load custom messages on mount
  useEffect(() => {
    Promise.all([
      window.cloudLoadCustomMessages(),
      window.cloudFetchSettings()
    ]).then(([res, setRes]) => {
      let msgs = res.ok ? res.messages : [];
      
      // Force all seeded messages that currently have a positive milestone in the old database to milestone: -1 (Random/Collaborator)
      // Since seed IDs are not persisted in the database (they are stored as autogenerated UUIDs), we identify the old seed list
      // by checking if the number of messages with non-random milestones (milestone !== -1) is very large (> 100).
      const oldSeedCount = msgs.filter(m => m.milestone !== -1).length;
      if (oldSeedCount > 100) {
        let migrated = msgs.map(m => ({ ...m, milestone: -1 }));
        window.cloudSaveCustomMessages(migrated);
        msgs = migrated;
      } else if (msgs.length < 600 && window.getBossMessagesSeed) {
        // Fallback for new empty databases
        const seed = window.getBossMessagesSeed();
        window.cloudSaveCustomMessages(seed);
        msgs = seed;
      }

      // Apply name fallback to any message missing a name using window.EMPLOYEE_NAMES
      const names = window.EMPLOYEE_NAMES || ['Dani'];
      msgs = msgs.map(m => {
        if (!m.who || !m.who.trim()) {
          const randomName = names[Math.floor(Math.random() * names.length)];
          return { ...m, who: randomName };
        }
        return m;
      });

      let applyFilters = false;
      let advFilters = null;

      if (setRes && setRes.ok && setRes.settings) {
        applyFilters = setRes.settings.applyAdvancedFiltersToGame === true;
        advFilters = setRes.settings.advancedFilters;
      } else {
        try { applyFilters = localStorage.getItem('admin_apply_filters_to_game') === 'true'; } catch(e) {}
        try { advFilters = JSON.parse(localStorage.getItem('admin_advanced_filters')); } catch(e) {}
      }

      if (applyFilters && advFilters) {
         msgs = msgs.filter(m => {
            let isQuestion = m.msgType === 'question' || (m.text || '').includes('||question:');
            
            if (advFilters.msgType === 'question' && !isQuestion) return false;
            if (advFilters.msgType === 'normal' && isQuestion) return false;
            if (advFilters.position !== 'all' && m.position !== advFilters.position) return false;
            if (advFilters.size !== 'all' && m.size !== advFilters.size) return false;
            if (advFilters.animation !== 'all' && m.animation !== advFilters.animation) return false;
            if (advFilters.particles !== 'all' && m.particles !== advFilters.particles) return false;
            if (advFilters.color !== 'all' && (m.color || '#1a8fff') !== advFilters.color) return false;
            if (advFilters.levelReq !== '' && (m.levelReq || 0) !== Number(advFilters.levelReq)) return false;
            
            return true;
         });
      }

      setCustomMessages(msgs);
    });
  }, []);

  // Dynamic Random Bonuses Spawner (Global Scheduler)
  useEffect(() => {
    const list = window.GAME_CONTENT?.randomBonuses || [];
    if (list.length === 0) return;

    if (spawnedBonuses.length === 0 && activeBonusEffects.length === 0) {
      if (bonusTimerRef.current) return;

      const bonus = list[Math.floor(Math.random() * list.length)];
      const minMs = (bonus.intervalMin || 5) * 60000;
      const maxMs = (bonus.intervalMax || 10) * 60000;
      const delay = minMs + Math.random() * (maxMs - minMs);

      bonusTimerRef.current = setTimeout(() => {
        bonusTimerRef.current = null;
        const now = Date.now();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const x = 80 + Math.random() * (w - 160);
        const y = 120 + Math.random() * (h - 240);
        const id = Math.random().toString(36).substring(2, 9);
        
        const newSpawn = { ...bonus, x, y, id, spawnedAt: now };
        setSpawnedBonuses([newSpawn]);
        
        // Remove after 7s if not clicked
        setTimeout(() => {
          setSpawnedBonuses(curr => {
            const stillThere = curr.some(b => b.id === id);
            if (stillThere) {
               return curr.filter(b => b.id !== id);
            }
            return curr;
          });
        }, 7000);
      }, delay);
    } else {
      // If there's an active bonus or spawn, cancel any pending spawn timers
      if (bonusTimerRef.current) {
         clearTimeout(bonusTimerRef.current);
         bonusTimerRef.current = null;
      }
    }
  }, [spawnedBonuses, activeBonusEffects]);

  useEffect(() => { activeEffectsRef.current = activeBonusEffects; }, [activeBonusEffects]);
  useEffect(() => { spawnedBonusesRef.current = spawnedBonuses; }, [spawnedBonuses]);

  // Handle hold auto-click
  useEffect(() => {
    const holdBonus = activeBonusEffects.find(e => e.until > Date.now() && e.type === 'hold');
    if (isMainMouseDown && holdBonus) {
      const cps = holdBonus.cps || 10;
      const msPerClick = Math.max(10, 1000 / cps);
      const interval = setInterval(() => {
        const rect = mainToothRef.current?.getBoundingClientRect() || { width: 300, height: 300, left: window.innerWidth/2 - 150, top: window.innerHeight/2 - 150 };
        const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 40;
        const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 40;
        performClick(x, y);
      }, msPerClick);
      return () => clearInterval(interval);
    }
  }, [isMainMouseDown, activeBonusEffects, performClick]);


  const performClick = useCallback((x, y) => {
    if (cheatLevel > 0) return;
    const gain = perClickRef.current;
    setState((s) => {
      const now = Date.now();
      clickTimesRef.current = [...clickTimesRef.current.filter(t => now - t < 1000), now];
      const cps = clickTimesRef.current.length;
      const maxCPS = (() => {
        try {
          const enabled = localStorage.getItem('admin_cps_limit_enabled') !== 'false';
          if (!enabled) return 999999;
          return parseInt(localStorage.getItem('admin_cps_threshold')) || 20;
        } catch(e) {
          return 20;
        }
      })();
      if (cps >= maxCPS && cheatLevel === 0) {
        const banResult = window.AntiCheat.applyBan(username);
        if (banResult) {
          setCheatLevel(banResult.newLevel);
          setIsMainMouseDown(false);
        }
      }
      const xpPerClickBase = 0.1;
      const xpFromUpgrades = (window.XP_UPGRADES || []).reduce((acc, up) => acc + (s.xpUpgrades?.[up.id] ? up.xpPerClick : 0), 0);
      const specialClickXpMult = (window.LEVEL_UPGRADES || []).reduce((acc, up) => acc + (s.xpUpgrades?.[up.id] && (up.xpMultType === 'click' || up.xpMultType === 'both') ? (up.xpMult || 0) : 0), 0);
      let activeGlobalBonusMult = 1;
      activeEffectsRef.current.forEach(e => {
        if (e.type === 'multiplier_global' && e.until > Date.now()) {
          activeGlobalBonusMult *= (e.multiplier || 1);
        }
      });
      
      const globalClickXpMult = (1 + specialClickXpMult) * activeGlobalBonusMult;
      const xpGained = (xpPerClickBase + xpFromUpgrades) * globalClickXpMult;
      
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

  const handleBonusClick = useCallback((bonus) => {
    setSpawnedBonuses(curr => curr.filter(b => b.id !== bonus.id));
    const now = Date.now();
    
    // Default duration is 10s if not specified, unless it's instant
    const durMs = (bonus.duration || 10) * 1000;
    
    if (bonus.type === 'instant') {
      const s = stateRef.current;
      let amount = 0;
      let descEs = '';
      let descEn = '';

      if (bonus.instantRewardType === 'percent') {
        const pct = bonus.multiplier || 0;
        amount = Math.floor((s.teeth * pct) / 100);
        descEs = `+${pct}% de dientes actuales`;
        descEn = `+${pct}% of current teeth`;
      } else {
        amount = bonus.multiplier || 0;
        descEs = `+${window.formatNum(Math.floor(amount))} dientes`;
        descEn = `+${window.formatNum(Math.floor(amount))} teeth`;
      }
      
      setState((st) => ({ ...st, teeth: st.teeth + amount, totalEarned: st.totalEarned + amount }));
      setToast({ id: 'bonus_' + bonus.id, es: descEs, en: descEn, img: bonus.image });
      if (soundRef.current) [1047, 1319, 1568, 2093].forEach((f, i) => setTimeout(() => window.playTone(f, 0.14, 'triangle', 0.07), i * 65));
      
    } else {
      // It's a duration-based effect
      const newEffect = { ...bonus, until: now + durMs };
      setActiveBonusEffects([newEffect]); // Only 1 effect at a time
      
      let msgEs = '', msgEn = '';
      if (bonus.type === 'hold') {
        msgEs = `¡Mantén presionado (${bonus.duration}s)!`;
        msgEn = `Hold down (${bonus.duration}s)!`;
        if (soundRef.current) [660, 880, 1320].forEach((f, i) => setTimeout(() => window.playTone(f, 0.1, 'triangle', 0.08), i * 100));
      } else if (bonus.type && bonus.type.startsWith('multiplier_')) {
        msgEs = bonus.name.es;
        msgEn = bonus.name.en;
        if (soundRef.current) [880, 1320].forEach((f, i) => setTimeout(() => window.playTone(f, 0.15, 'triangle', 0.08), i * 80));
      }
      
      setToast({ id: 'eff_' + bonus.id, es: msgEs, en: msgEn, img: bonus.image });
    }
    setTimeout(() => setToast(null), 4000);
  }, []);

  const buyStoreUpgrade = useCallback((up) => {
    if (state.teeth >= up.cost && !state.storeUpgrades[up.id]) {
      setState(s => ({
        ...s,
        teeth: s.teeth - up.cost,
        storeUpgrades: { ...s.storeUpgrades, [up.id]: true }
      }));
      setToast({ 
        id: `buy_up_${up.id}`, 
        es: `¡Mejora comprada: ${up.es || up.name?.es || up.name || '(Sin nombre)'}!`, 
        en: `Upgrade bought: ${up.en || up.name?.en || up.name || '(Unnamed)'}!` 
      });
      setTimeout(() => setToast(null), 3000);
      setGlobalTooltip(null);
      if (soundRef.current) window.playTone(880, 0.15, 'sine', 0.1);
    }
  }, [state.teeth, state.storeUpgrades]);

  const genBulkCost = useCallback((base, owned, qty, scale = 1.15) => {
    // sum of geometric series: base * scale^owned * (scale^qty - 1) / (scale - 1)
    if (scale === 1) return base * qty;
    return Math.floor(base * Math.pow(scale, owned) * (Math.pow(scale, qty) - 1) / (scale - 1));
  }, []);

  const buyGenerator = useCallback((genId, qty) => {
    const amount = qty || 1;
    setState((s) => {
      const gen = window.GENERATORS.find((x) => x.id === genId);
      const owned = s.generators[genId] || 0;
      let cost, actualBuy;
      if (amount === 1) {
        cost = window.genCost(gen.baseCost, owned, gen.costScale);
        actualBuy = 1;
      } else {
        // Buy as many as we can afford up to `amount`
        let total = 0;actualBuy = 0;
        for (let i = 0; i < amount; i++) {
          const c = window.genCost(gen.baseCost, owned + i, gen.costScale);
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
    const newCount = oldCount + 1;
    const oldPrestige = stateRef.current?.prestige || 0;
    const newPrestige = oldPrestige + gain;
    
    // We now handle tooth unlock notifications via a generic useEffect

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

  const toggleVisualEffects = useCallback(() => {setVisualEffects((v) => {localStorage.setItem('tooth-clicker-visual-effects', v ? '0' : '1');return !v;});}, []);

  const cycleNumFormat = useCallback(() => {
    const order = ['short', 'long', 'engineering', 'scientific'];
    setNumFormatLocal((m) => {const next = order[(order.indexOf(m) + 1) % order.length];try {localStorage.setItem(NUMFMT_KEY, next);} catch (e) {}onNumFormatChange && onNumFormatChange(next);return next;});
  }, [onNumFormatChange]);

  const toggleSpinningBrushes = useCallback(() => {
    setShowSpinningBrushes((s) => {
      const n = !s;
      localStorage.setItem('tooth-clicker-show-spinning-brushes', n ? '1' : '0');
      return n;
    });
  }, []);

  const genStatus = window.GENERATORS.map((g) => {
    const owned = state.generators[g.id] || 0;
    let cost, canAfford, actualQty;
    if (buyQty === 1) {
      cost = window.genCost(g.baseCost, owned, g.costScale);
      canAfford = state.teeth >= cost;
      actualQty = 1;
    } else {
      // Calculate how many we can actually afford (up to buyQty)
      let total = 0;actualQty = 0;
      for (let i = 0; i < buyQty; i++) {
        const c = window.genCost(g.baseCost, owned + i, g.costScale);
        if (total + c > state.teeth) break;
        total += c;actualQty++;
      }
      cost = genBulkCost(g.baseCost, owned, buyQty, g.costScale);
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
  const [achFilter, setAchFilter] = React.useState('all');
  const clickStatus = window.CLICK_UPGRADES.map((u) => {
    const purchased = !!state.clickUpgrades[u.id];
    const unlockAtVal = u.unlockAt !== undefined ? u.unlockAt : Math.floor(u.cost * 0.5);
    const unlocked = state.totalEarned >= unlockAtVal;
    const revealed = unlocked || purchased || state.totalEarned >= unlockAtVal * 0.5 || window.CLICK_UPGRADES.indexOf(u) === 0;
    return { up: u, purchased, unlocked, revealed, canAfford: state.teeth >= u.cost };
  });
  const filteredClickStatus = clickStatus.filter((c) => {
    if (!c.revealed) return false;
    if (clickFilter === 'unlocked') return c.unlocked;
    if (clickFilter === 'locked') return !c.unlocked;
    return true;
  });

  const activeDurationBonus = activeBonusEffects.find(e => e.until > Date.now());
  const currentToothImg = (activeDurationBonus && activeDurationBonus.image) ? activeDurationBonus.image : (
    activeBonusEffects.some(e => e.until > Date.now() && e.type === 'hold') ? "uploads/gold-tooth-1.png" : 
    activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_click') ? "uploads/crystal-tooth-1.png" : 
    selectedStage.img
  );
  const currentGlbData = (activeDurationBonus && activeDurationBonus.glbData) ? activeDurationBonus.glbData : selectedStage.glbData;
  const isBonusOverride = currentToothImg !== selectedStage.img || currentGlbData !== selectedStage.glbData;
  const show3D = !!currentGlbData;

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
              <span className="mobile-stat-value"><window.Odometer value={state.teeth} formatFn={fmt} /></span>
              <span className="mobile-stat-sub"><window.Odometer value={displayedPerSecond} formatFn={(v) => fmt(v, true)} />/s</span>
           </div>
           <div className="mobile-stat-row">
              <span className="mobile-stat-label">{t.perClick}</span>
              <span className="mobile-stat-value mobile-stat-click"><window.Odometer value={perClick} formatFn={(v) => fmt(v, true)} /></span>
              <span className="mobile-stat-sub">x<window.Odometer value={globalMult} formatFn={(v) => fmt(Math.floor(v * 100) / 100)} /></span>
           </div>
        </section>

        <section className="mobile-tooth-area">
            <div 
              onMouseDown={show3D ? undefined : (e) => { handleClick(e); setIsMainMouseDown(true); }}
              onMouseUp={() => setIsMainMouseDown(false)}
              onMouseLeave={() => setIsMainMouseDown(false)}
              onTouchStart={show3D ? undefined : (e) => { handleClick(e); setIsMainMouseDown(true); }}
              onTouchEnd={() => setIsMainMouseDown(false)}
              style={{ position: 'relative', cursor: show3D ? 'default' : 'pointer', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', width: 280, height: 280 }}
            >
              {showSpinningBrushes && <window.ToothbrushRing count={window.GENERATORS?.length > 0 ? (state.generators[window.GENERATORS[0].id] || 0) : 0} radius={165} />}
              {show3D ? (
                <window.Tooth3DViewer 
                  glbData={currentGlbData} 
                  textureUrl={currentToothImg}
                  onClick={(e) => { handleClick(e); setIsMainMouseDown(true); setTimeout(() => setIsMainMouseDown(false), 100); }} 
                  onPointerDownOut={(e) => setIsMainMouseDown(true)}
                  onPointerUpOut={(e) => setIsMainMouseDown(false)}
                  disableRotation={activeBonusEffects.some(e => e.until > Date.now() && e.type === 'hold')}
                  className="mobile-main-tooth"
                  style={{ width: 320, height: 420, zIndex: 5, filter: activeBonusEffects.some(e => e.until > Date.now() && e.type === 'hold') ? 'drop-shadow(0 0 35px oklch(0.7 0.2 320 / 0.8)) saturate(1.4)' : activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_click') ? 'drop-shadow(0 0 28px oklch(0.7 0.2 210 / 0.85)) saturate(1.3) brightness(1.1)' : activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_gen') ? 'drop-shadow(0 0 24px #FFC22088) sepia(0.4) saturate(2) hue-rotate(10deg)' : 'drop-shadow(0 8px 24px rgba(0,118,219,0.18))' }} 
                />
              ) : (
                <img 
                  src={currentToothImg} 
                  alt="tooth" 
                  className="mobile-main-tooth"
                  style={{
                    width: 280, height: 280, objectFit: 'contain', position: 'relative', zIndex: 5,
                    filter: activeBonusEffects.some(e => e.until > Date.now() && e.type === 'hold') ? 'drop-shadow(0 0 35px oklch(0.7 0.2 320 / 0.8)) saturate(1.4)' : activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_click') ? 'drop-shadow(0 0 28px oklch(0.7 0.2 210 / 0.85)) saturate(1.3) brightness(1.1)' : activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_gen') ? 'drop-shadow(0 0 24px #FFC22088) sepia(0.4) saturate(2) hue-rotate(10deg)' : 'drop-shadow(0 8px 24px rgba(0,118,219,0.18))'
                  }}
                />
              )}
              {toothParticles.map((p) => (
                <img key={p.id} src={currentToothImg} alt="" style={{ position: 'absolute', left: p.x, top: p.y, width: 34, height: 34, objectFit: 'contain', pointerEvents: 'none', animation: 'toothPop 2000ms ease-out forwards', '--tx': `${p.tx}px`, '--rot': `${p.rot}deg`, zIndex: 90, opacity: 0.9 }} />
              ))}
           </div>
           <div className="mobile-click-text">
              <div className="mobile-click-me">{liveCPS > 0 ? `${liveCPS} CPS` : '\u00A0'}</div>

           </div>

           <div className="mobile-upgrades-row">
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
                     style={{ 
                       borderColor: canAfford ? up.color : 'var(--neutral-i020)', 
                       color: canAfford ? up.color : 'var(--fg-3)', 
                       cursor: canAfford ? 'pointer' : 'not-allowed' 
                     }} 
                     onClick={() => buyStoreUpgrade(up)}
                   >
                     <i className={`fa-solid ${up.icon}`}></i>
                   </div>
                 );
              })}
              {/* Placeholder if none available */}
              {((window.STORE_UPGRADES || []).filter(up => !state.storeUpgrades[up.id] && (up.type === 'generator' ? (state.generators[up.targetId] || 0) >= up.milestone : state.totalEarned >= up.requirement)).length === 0) && (
                <div className="mobile-upgrade-slot disabled" style={{ opacity: 0.3, borderColor: 'var(--neutral-i020)', color: 'var(--fg-4)' }}>
                  <i className="fa-solid fa-lock"></i>
                </div>
              )}
           </div>

           {floats.map((f) =>
              <div key={f.id} style={{ position: 'absolute', left: f.x, top: f.y, pointerEvents: 'none', color: '#000000', fontWeight: 900, fontSize: 18, textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 2px 4px rgba(0,0,0,0.2)', animation: 'clickPop 600ms ease-out forwards', fontVariantNumeric: 'tabular-nums', '--tx': `${f.tx}px`, zIndex: 100 }}>+{fmt(f.gain, true)}</div>
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
            <button className="mobile-hamburger-btn" onClick={() => setTabsMenuOpen(true)} style={{ position: 'relative' }}>
                <i className="fa-solid fa-bars" style={{ color: '#fff' }}></i>
                {anyMobileNotification && (
                  <span style={{ 
                    position: 'absolute', 
                    top: 6, 
                    right: 6, 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    background: '#e11d24', 
                    border: '2px solid #0076db',
                    boxShadow: '0 0 0 2px rgba(225,29,36,0.2)'
                  }}></span>
                )}
              </button>
        </footer>

        {/* Mobile Menu Overlay (Player Menu) */}
        <div 
          className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          <div className="mobile-menu-drawer" onClick={e => e.stopPropagation()}>
            <button className="mobile-menu-item" onClick={() => { setMenuOpen(false); setShowSettingsModal(true); }}>
              <i className="fa-solid fa-sliders"></i>
              <span className="mobile-menu-item-text">{lang === 'es' ? 'Configuración' : 'Settings'}</span>
            </button>

            <button className="mobile-menu-item" onClick={() => { setMenuOpen(false); setShowAbout(true); }}>
              <i className="fa-solid fa-circle-info"></i>
              <span className="mobile-menu-item-text">{lang === 'es' ? 'Acerca de' : 'About'}</span>
            </button>

            <button className="mobile-menu-item" onClick={() => { setMenuOpen(false); window.open('https://forms.gle/wM6YLVeGz6DfHQ4V8', '_blank'); }}>
              <i className="fa-solid fa-comment-dots"></i>
              <span className="mobile-menu-item-text">{lang === 'es' ? 'Enviar feedback' : 'Send feedback'}</span>
            </button>

            <div className="mobile-menu-divider" />




            <button className="mobile-menu-item" onClick={() => { onLogout && onLogout(); setMenuOpen(false); }}>
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
              { id: 'achievements', label: t.tabAch, icon: 'fa-solid fa-trophy', dot: Object.keys(state.newAchievementIds || {}).length > 0 },
              { id: 'prestige', label: t.tabPrestige, icon: 'fa-solid fa-crown', dot: prestigeGain > 0 },
              { id: 'skills', label: lang === 'es' ? 'Academia' : 'Academy', icon: 'fa-solid fa-graduation-cap', dot: hasAffordableAcademyUpgrades },
              { id: 'leaderboard', label: t.tabLeaderboard, icon: 'fa-solid fa-ranking-star' },
              { id: 'stats', label: t.tabStats, icon: 'fa-solid fa-chart-line' }
            ].map((item) => (
              <button 
                key={item.id} 
                className={`mobile-tab-item ${tabViewOpen && tab === item.id ? 'active' : ''}`} 
                onClick={() => { setTab(item.id); setTabsMenuOpen(false); setTabViewOpen(true); }}
                style={{ position: 'relative' }}
              >
                <i className={item.icon}></i>
                <span className="mobile-tab-label">{item.label}</span>
                {item.dot && (
                  <span style={{ 
                    position: 'absolute', 
                    top: 18, 
                    right: 20, 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: '#e11d24', 
                    border: '1.5px solid #fff',
                    boxShadow: '0 0 0 2px rgba(225,29,36,0.1)'
                  }}></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Tab View Bottom Sheet */}
        <div 
          className={`mobile-tab-view-overlay ${tabViewOpen ? 'open' : ''}`}
          onClick={() => setTabViewOpen(false)}
        >
          <div className="mobile-tab-view-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-tab-view-header">
              <div className="mobile-tab-view-title">
                <i className={
                  tab === 'generators' ? 'fa-solid fa-industry' :
                  tab === 'click' ? 'fa-solid fa-hand-pointer' :
                  tab === 'achievements' ? 'fa-solid fa-trophy' :
                  tab === 'prestige' ? 'fa-solid fa-crown' :
                  tab === 'skills' ? 'fa-solid fa-graduation-cap' :
                  tab === 'leaderboard' ? 'fa-solid fa-ranking-star' :
                  'fa-solid fa-chart-line'
                }></i>
                <span>
                  {tab === 'generators' ? t.tabGen :
                   tab === 'click' ? t.tabClick :
                   tab === 'achievements' ? t.tabAch :
                   tab === 'prestige' ? t.tabPrestige :
                   tab === 'skills' ? (lang === 'es' ? 'Academia' : 'Academy') :
                   tab === 'leaderboard' ? t.tabLeaderboard :
                   t.tabStats}
                </span>
              </div>
              <button className="mobile-tab-view-close" onClick={() => setTabViewOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="mobile-tab-view-body">
              {tab === 'generators' && (
                <div>
                  <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                    <div>
                      <div className="t-heading-m">{t.generatorsTitle}</div>
                      <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{t.generatorsSub}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, background: 'var(--bg-3)', padding: 3, borderRadius: 'var(--radius-s)', flexShrink: 0 }}>
                      {[1, 10, 25, 50, 100, 1000].map((q) => (
                        <button key={q} onClick={() => { window.playClickSound && window.playClickSound(); setBuyQty(q); }} style={{
                          all: 'unset', boxSizing: 'border-box', padding: '5px 9px', borderRadius: 6,
                          fontSize: 12, fontWeight: buyQty === q ? 700 : 500, cursor: 'pointer',
                          background: buyQty === q ? 'var(--primary-i100)' : 'transparent',
                          color: buyQty === q ? '#fff' : 'var(--fg-2)',
                          transition: 'all 120ms ease', fontFamily: 'var(--font-sans)'
                        }}>x{q}</button>
                      ))}
                    </div>
                  </div>
                  <div id="generators-container-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {genStatus.map((g) => (
                      <window.GeneratorRow key={g.gen.id} gen={g.gen} owned={g.owned} cost={g.cost} canAfford={g.canAfford} unlocked={g.unlocked} revealed={g.revealed} production={g.production} nextProduction={g.nextProduction} lang={lang} totalTeeth={state.totalEarned} buyQty={buyQty} actualQty={g.actualQty} onBuy={() => buyGenerator(g.gen.id, buyQty)} />
                    ))}
                  </div>
                </div>
              )}

              {tab === 'click' && (
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
                  <div id="click-upgrades-container-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {filteredClickStatus.map((c) => (
                      <window.ClickUpgradeRow key={c.up.id} up={c.up} purchased={c.purchased} unlocked={c.unlocked} canAfford={c.canAfford} lang={lang} totalTeeth={state.totalEarned} onBuy={() => buyClickUpgrade(c.up.id)} />
                    ))}
                  </div>
                </div>
              )}

              {tab === 'achievements' && (
                <div>
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div className="t-heading-m">{t.achTitle}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 3, background: 'var(--bg-3)', padding: 3, borderRadius: 'var(--radius-s)', flexShrink: 0, width: '100%', overflowX: 'auto' }}>
                        {['all', 'new', 'seen', 'locked'].map((f) => (
                          <button key={f} onClick={() => { window.playClickSound && window.playClickSound(); setAchFilter(f); }} style={{
                            all: 'unset', boxSizing: 'border-box', padding: '5px 9px', borderRadius: 6,
                            fontSize: 12, fontWeight: achFilter === f ? 700 : 500, cursor: 'pointer',
                            background: achFilter === f ? 'var(--primary-i100)' : 'transparent',
                            color: achFilter === f ? '#fff' : 'var(--fg-2)',
                            transition: 'all 120ms ease', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap'
                          }}>
                            {f === 'all' ? (lang === 'es' ? 'Todos' : 'All') : f === 'new' ? (lang === 'es' ? 'Nuevos' : 'New') : f === 'seen' ? (lang === 'es' ? 'Obtenidos' : 'Obtained') : (lang === 'es' ? 'Bloqueados' : 'Locked')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const totalAch = Object.keys(state.achievements || {}).length;
                    if (totalAch === 0) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                          <img src="assets/logros/logros-empty.png" alt="Empty" style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16 }} />
                          <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'Juega para obtener logros que te darán muchos beneficios.' : 'Play to earn achievements that will give you many benefits.'}</div>
                        </div>
                      );
                    }
                    const filteredAch = window.ACHIEVEMENTS.filter(a => {
                      if (achFilter === 'new') return !!state.newAchievementIds?.[a.id];
                      if (achFilter === 'seen') return !!state.achievements[a.id] && !state.newAchievementIds?.[a.id];
                      if (achFilter === 'locked') return !state.achievements[a.id];
                      return true;
                    });
                    if (filteredAch.length === 0) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                          <img src="assets/logros/logros-empty.png" alt="Empty" style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16 }} />
                          <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'No se encontró ningún logro.' : 'No achievements found.'}</div>
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '10px' }}>
                        {filteredAch.map((a) => (
                          <window.AchievementCard 
                            key={a.id} 
                            ach={{ ...a, isNew: !!state.newAchievementIds?.[a.id] }} 
                            unlocked={!!state.achievements[a.id]} 
                            lang={lang} 
                            onHover={(ach, pos, unlocked) => {
                              if (pos) setGlobalTooltip({ type: 'ach', data: ach, pos, unlocked });
                              if (state.newAchievementIds?.[ach.id]) markAchievementSeen(ach.id);
                            }} 
                            onLeave={() => setGlobalTooltip(null)} 
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {tab === 'prestige' && (
                <div>
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div className="t-heading-m" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="fa-solid fa-crown" style={{ color: 'var(--warning-i100)' }}></i>{t.prestigeTitle}
                    </div>
                    <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4 }}>{t.prestigeDesc}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                    <window.StatTile label={t.prestigeHave} value={fmt(state.prestige)} icon="fa-solid fa-crown" accent="var(--warning-i130)" onHelpEnter={(e) => setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'La cantidad de Sonrisas doradas que posees actualmente. Cada una multiplica pasivamente toda tu ganancia de dientes por un 5%. ¡No se pierden al prestigiar!' : 'The amount of Golden smiles you currently own. Each one passively multiplies all your teeth earnings by 5%. They are not lost upon prestiging!', pos: {x: e.clientX, y: e.clientY} })} onHelpLeave={() => setGlobalTooltip(null)} />
                    <window.StatTile label={lang === 'es' ? 'Veces prestigiado' : 'Times prestiged'} value={fmt(state.prestigeCount || 0)} icon="fa-solid fa-rotate" accent="var(--warning-i100)" onHelpEnter={(e) => setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'El número total de veces que has reiniciado tu progreso a cambio de Sonrisas doradas. Mientras más lo hagas, irás descubriendo nuevas evoluciones de dientes.' : 'The total number of times you have reset your progress in exchange for Golden smiles. Doing this unlocks new teeth evolutions.', pos: {x: e.clientX, y: e.clientY} })} onHelpLeave={() => setGlobalTooltip(null)} />
                    <window.StatTile label={t.prestigeEarn} value={`+${fmt(prestigeGain)}`} icon="fa-solid fa-plus" accent="var(--positive-i100)" onHelpEnter={(e) => setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'La cantidad exacta de Sonrisas doradas que ganarás si decides hacer el prestigio en este preciso momento. Recuerda que cada sonrisa requiere cada vez más dientes.' : 'The exact amount of Golden smiles you\'ll earn if you choose to prestige right now. Remember, each smile requires more and more teeth.', pos: {x: e.clientX, y: e.clientY} })} onHelpLeave={() => setGlobalTooltip(null)} />
                    <window.StatTile label={t.prestigeBonus} value={`+${fmt((prestigeMult - 1) * 100)}%`} icon="fa-solid fa-chart-line" accent="var(--alternative-i100)" onHelpEnter={(e) => setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'El multiplicador total de ganancia que te otorgan tus Sonrisas doradas. Por ejemplo, si tienes 20 Sonrisas, obtendrás un +100% (el doble) de todos los dientes.' : 'The total earnings multiplier granted by your Golden smiles. For example, owning 20 Smiles grants you a +100% (double) boost to all teeth.', pos: {x: e.clientX, y: e.clientY} })} onHelpLeave={() => setGlobalTooltip(null)} />
                  </div>
                  <button onClick={() => { setTabViewOpen(false); setShowPrestigeConfirm(true); }} disabled={prestigeGain <= 0} style={{ all: 'unset', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 'var(--spacing-4) var(--spacing-6)', background: prestigeGain > 0 ? 'var(--warning-i100)' : 'var(--bg-3)', color: prestigeGain > 0 ? 'var(--warning-i150)' : 'var(--fg-4)', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 15, cursor: prestigeGain > 0 ? 'pointer' : 'not-allowed', width: '100%', transition: 'background 150ms' }}>
                    <i className="fa-solid fa-crown"></i>
                    {prestigeGain > 0 ? t.prestigeBtn : (lang === 'es' ? `Necesitas ${fmt(prestigeReq)} dientes totales` : `You need ${fmt(prestigeReq)} total teeth`)}
                  </button>

                  {/* Tooth progression gallery */}
                  <div style={{ marginTop: 'var(--spacing-6)' }}>
                    <div className="t-heading-xs" style={{ color: 'var(--fg-2)', marginBottom: 'var(--spacing-3)' }}>
                      {lang === 'es' ? 'Evolución del diente' : 'Tooth evolution'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-2)' }}>
                      {window.TOOTH_STAGES.map((s, i) => {
                        const unlocked = window.isToothUnlocked(state, s);
                        const isCurrent = (state.selectedTooth || 0) === i && unlocked;
                        return (
                          <div key={i} 
                            onClick={() => { if (unlocked) { window.playClickSound && window.playClickSound(); setState((prev) => ({ ...prev, selectedTooth: i })); } }} 
                            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 'var(--spacing-2)', borderRadius: 'var(--radius-m)', cursor: unlocked ? 'pointer' : 'default', background: isCurrent ? 'var(--primary-i010)' : unlocked ? 'var(--bg-2)' : 'var(--bg-3)', border: `1px solid ${isCurrent ? 'var(--primary-i100)' : unlocked ? 'var(--border-subtle)' : 'var(--border-subtle)'}`, transition: 'all 150ms' }}>
                            <div style={{ relative: true, width: 48, height: 48 }}>
                              <img src={s.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', opacity: unlocked ? 1 : 0.2, filter: unlocked ? 'none' : 'grayscale(1)' }} />
                              {!unlocked && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="fa-solid fa-lock" style={{ fontSize: 14, color: 'var(--fg-4)' }}></i>
                                </div>
                              )}
                              {isCurrent && (
                                <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--primary-i100)', border: '2px solid white' }} />
                              )}
                            </div>
                            <div className="t-body-xs" style={{ color: unlocked ? 'var(--fg-2)' : 'var(--fg-4)', textAlign: 'center', lineHeight: 1.2, fontSize: 9, fontWeight: isCurrent ? 600 : 400 }}>
                              {unlocked ? (s[lang] || s.es).split(' ').slice(1).join(' ') || s[lang] || s.es : `x${s.prestige}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'skills' && (
                <div>
                  <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div className="t-heading-m">{lang === 'es' ? 'Academia Dental' : 'Dental Academy'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, background: 'var(--bg-3)', padding: 3, borderRadius: 'var(--radius-s)', flexShrink: 0 }}>
                      {['all', 'bought', 'not_bought'].map((f) => (
                        <button key={f} onClick={() => { window.playClickSound && window.playClickSound(); setAcademyFilter(f); }} style={{
                          all: 'unset', boxSizing: 'border-box', padding: '5px 9px', borderRadius: 6,
                          fontSize: 12, fontWeight: academyFilter === f ? 700 : 500, cursor: 'pointer',
                          background: academyFilter === f ? 'var(--primary-i100)' : 'transparent',
                          color: academyFilter === f ? '#fff' : 'var(--fg-2)',
                          transition: 'all 120ms ease', fontFamily: 'var(--font-sans)'
                        }}>
                          {f === 'all' ? (lang === 'es' ? 'Todos' : 'All') : f === 'bought' ? (lang === 'es' ? 'Comprados' : 'Bought') : (lang === 'es' ? 'No comprados' : 'Not bought')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(() => {
                      const allUpgrades = [...(window.LEVEL_UPGRADES || []), ...(window.XP_UPGRADES || [])];
                      if (allUpgrades.length === 0) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                            <img src="assets/academia/academia-empty.png" alt="Empty" style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16 }} />
                            <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'Juega para obtener diplomas y títulos que te harán el mejor profesional' : 'Play to earn diplomas and titles that will make you the best professional'}</div>
                          </div>
                        );
                      }
                      const filteredUpgrades = allUpgrades.filter(up => {
                        const purchased = !!state.xpUpgrades?.[up.id];
                        const meetsGenQty = up.reqGeneratorId ? ((state.generators?.[up.reqGeneratorId] || 0) >= (up.reqGenQty || 1)) : true;
                        const meetsAch = up.reqAchievementId ? !!state.achievements[up.reqAchievementId] : true;
                        const legacyAch = up.achievementId ? !!state.achievements[up.achievementId] : true;
                        const lvlReq = (up.levelReq !== undefined) ? up.levelReq : (up.reqLevel || 0);
                        const meetsLevel = state.level >= lvlReq;
                        
                        const isUnlocked = meetsGenQty && meetsAch && legacyAch && meetsLevel;
                        const isShown = purchased || (up.reqGeneratorId ? meetsGenQty : (isUnlocked || state.level >= Math.max(1, lvlReq - 2)));
                        up._isUnlockedCache = isUnlocked;

                        if (academyFilter === 'not_bought') return !purchased && isShown;
                        if (academyFilter === 'bought') return purchased;
                        return isShown; 
                      });

                      if (filteredUpgrades.length === 0) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                            <img src="assets/academia/academia-empty.png" alt="Empty" style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16 }} />
                            <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'No se encontró ninguna mejora.' : 'No upgrades found.'}</div>
                          </div>
                        );
                      }

                      return filteredUpgrades.map(up => {
                        const purchased = !!state.xpUpgrades?.[up.id];
                        const cost = up.baseCost;
                        const canAfford = state.teeth >= cost;
                        const isSpecial = up.isLevelSpecial;
                        return (
                          <React.Fragment key={up.id}>
                          {!up._isUnlockedCache && !purchased ? (
                            <div 
                              onMouseEnter={(e) => {
                                if (!setGlobalTooltip) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                let text = lang === 'es' ? 'Bloqueado. Requisitos:\n' : 'Locked. Requirements:\n';
                                const lvlReq = (up.levelReq !== undefined) ? up.levelReq : (up.reqLevel || 0);
                                text += (lang === 'es' ? `- Nivel ${lvlReq}\n` : `- Level ${lvlReq}\n`);
                                if (up.reqGeneratorId && up.reqGenQty) {
                                  const gen = (window.GENERATORS || []).find(g => g.id === up.reqGeneratorId);
                                  const gName = gen ? (gen.name?.[lang] || gen[lang] || gen.name?.es || gen.es || '(?)') : '(?)';
                                  text += `- ${up.reqGenQty}x ${gName}\n`;
                                }
                                const achId = up.reqAchievementId || up.achievementId;
                                if (achId) {
                                  const ach = (window.ACHIEVEMENTS || []).find(a => a.id === achId);
                                  const achName = ach ? (ach.name?.[lang] || ach[lang] || ach.name?.es || ach.es || '(?)') : '(?)';
                                  text += (lang === 'es' ? `- Logro: ${achName}` : `- Achievement: ${achName}`);
                                }
                                setGlobalTooltip({ type: 'text', text: text.trim(), pos: { x: rect.left + rect.width / 2, y: rect.bottom }, direction: 'down' });
                              }}
                              onMouseLeave={() => setGlobalTooltip(null)}
                              style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', 
                              background: 'var(--bg-3)', border: '1px solid var(--border-subtle)', borderRadius: 12, opacity: 0.6
                            }}>
                              <div style={{ flex: 1, minWidth: 0, paddingRight: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)' }}>
                                  <i className="fa-solid fa-lock"></i>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-3)' }}>???</div>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--fg-4)', fontWeight: 600 }}>{lang === 'es' ? 'BLOQUEADO' : 'LOCKED'}</div>
                            </div>
                          ) : (
                            <div style={{ 
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
                          )}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {tab === 'leaderboard' && (
                <window.LeaderboardPanel username={username} lang={lang} />
              )}

              {tab === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
                  <div>
                    <div className="t-heading-m">{t.statsTitle}</div>
                    <div className="t-body-s" style={{ color: 'var(--fg-3)', marginTop: 2 }}>{lang === 'es' ? 'Todo lo que pasó en tu consulta.' : 'Everything that happened in your practice.'}</div>
                  </div>
                  <window.StatsGroup title={t.general} icon="fa-solid fa-chart-line" rows={[
                    { label: t.currentTeeth, value: <window.Odometer value={state.teeth} formatFn={fmt} />, strong: true },
                    { label: t.perSecond, value: <><window.Odometer value={displayedPerSecond} formatFn={(v) => fmt(v, true)} />/s</>, color: 'var(--positive-i100)' },
                    { label: t.perClick, value: <window.Odometer value={perClick} formatFn={(v) => fmt(v, true)} />, color: 'var(--alternative-i100)' },
                    { label: lang === 'es' ? 'Bonus global' : 'Global bonus', value: <>x<window.Odometer value={globalMult} formatFn={(v) => fmt(Math.floor(v * 100) / 100)} /></>, color: 'var(--warning-i130)' },
                    { label: lang === 'es' ? 'Récord CPS' : 'CPS Record', value: <window.Odometer value={state.maxCPS || 0} formatFn={fmt} />, color: 'var(--positive-i100)' }
                  ]} />
                  <window.StatsGroup title={lang === 'es' ? 'Progresión' : 'Progression'} icon="fa-solid fa-arrow-trend-up" accent="var(--primary-i100)" rows={[
                    { label: lang === 'es' ? 'Nivel del jugador' : 'Player level', value: <window.Odometer value={state.level || 0} formatFn={fmt} />, strong: true, color: 'var(--primary-i100)' },
                    { label: lang === 'es' ? 'Experiencia (XP)' : 'Experience (XP)', value: <>{(state.xp || 0).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / <window.Odometer value={window.getXPRequired(state.level || 0)} formatFn={fmt} /></> },
                    { label: t.totalTeeth, value: <window.Odometer value={state.totalEarned} formatFn={fmt} /> },
                    { label: t.totalClicks, value: <window.Odometer value={state.totalClicks} formatFn={fmt} /> },
                    { label: lang === 'es' ? 'Generadores totales' : 'Total generators', value: <window.Odometer value={Object.values(state.generators || {}).reduce((a, b) => a + (b || 0), 0)} formatFn={fmt} /> },
                    { label: lang === 'es' ? 'Mejoras compradas' : 'Upgrades bought', value: `${Object.values(state.clickUpgrades || {}).filter(Boolean).length}/${window.CLICK_UPGRADES.length}` },
                    { label: lang === 'es' ? 'Logros' : 'Achievements', value: `${Object.keys(state.achievements || {}).length}/${window.ACHIEVEMENTS.length}` }
                  ]} />
                  <window.StatsGroup title={lang === 'es' ? 'Prestigio y Dientes Dorados' : 'Prestige & Golden Teeth'} icon="fa-solid fa-crown" accent="var(--warning-i130)" rows={[
                    { label: t.prestigeHave, value: <window.Odometer value={state.prestige} formatFn={fmt} />, strong: true },
                    { label: lang === 'es' ? 'Veces prestigiado' : 'Times prestiged', value: <window.Odometer value={state.prestigeCount || 0} formatFn={fmt} />, color: 'var(--warning-i100)' },
                    { label: lang === 'es' ? 'Próxima ganancia' : 'Next gain', value: <>+<window.Odometer value={prestigeGain} formatFn={fmt} /></> },
                    { label: lang === 'es' ? 'Dientes dorados' : 'Golden teeth', value: <window.Odometer value={state.goldenClicks} formatFn={fmt} />, color: 'var(--warning-i100)' }
                  ]} />
                  <window.StatsGroup title={lang === 'es' ? 'Tiempo' : 'Time'} icon="fa-solid fa-clock" accent="var(--fg-2)" rows={[
                    { label: t.timePlayed, value: window.formatTime(state.timePlayed), strong: true },
                    { label: lang === 'es' ? 'Empezaste' : 'Started', value: new Date(state.startedAt || Date.now()).toLocaleDateString(lang === 'es' ? 'es' : 'en') },
                    { label: lang === 'es' ? 'Sesión actual' : 'Current session', value: window.formatTime(Math.max(0, (state.timePlayed || 0) - (bootRef.current?.saved?.timePlayed || 0))) }
                  ]} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {activeSeasonConfig && seasonTimeLeft !== null && showSeasonBanner && !initialLoading && !isSeasonModalOpen && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-i100)', color: '#fff', textAlign: 'center', padding: '8px 40px 8px 20px', borderRadius: '20px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 100000, display: 'flex', alignItems: 'center', fontSize: 14, animation: 'bannerTransform 600ms cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <div>{lang === 'es' ? 'La temporada' : 'Season'} "{activeSeasonConfig.name}" {lang === 'es' ? 'termina en' : 'ends in'}: {formatSeasonTime(seasonTimeLeft)}</div>
          <button onClick={() => setShowSeasonBanner(false)} style={{ position: 'absolute', right: 8, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
      {isMobile ? renderMobileView() : (
        <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', fontFamily: 'var(--font-sans)', color: 'var(--fg-1)' }}>
      {/* Top bar */}
      <header style={{ height: 64, background: 'var(--bg-1)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 var(--spacing-6)', gap: 'var(--spacing-4)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={window.GAME_CONTENT?.terminology?.images?.logoHorizontal || "uploads/logo-horizontal-4d4fb63d.png"} style={{ height: 44, width: 'auto', objectFit: 'contain', flexShrink: 0 }} alt="Tooth Clicker" />
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
              <window.Odometer value={state.teeth} formatFn={fmt} className="t-heading-s" style={{ color: 'var(--primary-i100)' }} />
              <span className="t-body-s" style={{ color: 'var(--fg-3)', marginLeft: 4 }}><window.Odometer value={displayedPerSecond} formatFn={(v) => fmt(v, true)} />/s</span>
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-hand-pointer" style={{ fontSize: 13, color: 'var(--alternative-i100)' }}></i>
            <div>
              <span className="t-mini-caps" style={{ color: 'var(--fg-3)', marginRight: 6 }}>{t.perClick}</span>
              <window.Odometer value={perClick} formatFn={(v) => fmt(v, true)} className="t-heading-s" style={{ color: 'var(--alternative-i100)' }} />
              {globalMult > 1 && <span className="t-body-s" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>x<window.Odometer value={globalMult} formatFn={(v) => fmt(Math.floor(v * 100) / 100)} /></span>}
            </div>
          </div>
        </div>
        {activeBonusEffects.filter(e => e.until > Date.now()).map(eff => (
          <div key={eff.id} style={{ padding: '6px 12px', background: 'var(--warning-i010)', border: '1px solid var(--warning-i050)', borderRadius: 'var(--radius-pill)', color: 'var(--warning-i130)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 1s ease-in-out infinite' }}>
            <i className="fa-solid fa-bolt"></i>{eff.name?.[lang] || eff.name?.es || ''} — {Math.max(0, Math.ceil((eff.until - Date.now()) / 1000))}s
          </div>
        ))}
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
              {onBackToAdmin && (
                <>
                  <window.MenuItem icon="fa-shield-halved" label={lang === 'es' ? 'Volver a Administración' : 'Back to Administration'} onClick={() => { setMenuOpen(false); onBackToAdmin(); }} />
                  <window.MenuDivider />
                </>
              )}
              <window.MenuItem icon="fa-sliders" label={lang === 'es' ? 'Configuración' : 'Settings'} onClick={() => { setMenuOpen(false); setShowSettingsModal(true); }} />
              <window.MenuItem icon="fa-circle-info" label={lang === 'es' ? 'Acerca de' : 'About'} onClick={() => {setMenuOpen(false);setShowAbout(true);}} />
              <window.MenuItem icon="fa-comment-dots" label={lang === 'es' ? 'Enviar feedback' : 'Send feedback'} onClick={() => {setMenuOpen(false);window.open('https://forms.gle/wM6YLVeGz6DfHQ4V8', '_blank');}} />
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

            </div>
          }
        </div>
      </header>

      <main style={{ display: 'flex', width: '100%', gap: 'var(--spacing-6)', padding: 'var(--spacing-6)', margin: '0 auto', alignItems: 'start', height: 'calc(100vh - 64px)', boxSizing: 'border-box' }}>
        {/* LEFT */}
        <section style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 0, padding: 'var(--spacing-8) var(--spacing-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-5)', overflow: 'hidden', position: 'relative', height: '100%', boxSizing: 'border-box' }}>
            {visualEffects && (
              <FallingTeethSimulation clickPulse={clickPulse} totalGenerators={Object.values(state.generators || {}).reduce((a, b) => a + b, 0)} toothImg={currentToothImg} />
            )}
            {username === 'James' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>

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
                      particles: pick.particles,
                      ...(pick.msgType === 'question' ? {
                        msgType: 'question',
                        options: pick.options,
                        correctOptionIndex: pick.correctOptionIndex,
                        explanationText: pick.explanationText,
                        correctReward: pick.correctReward,
                        wrongReward: pick.wrongReward
                      } : {})
                    });
                  }
                }} style={{ ...debugBtnStyle, background: 'var(--primary-i010)', color: 'var(--primary-i100)', borderColor: 'var(--primary-i030)' }}>Trigger Msg ({customMessages.length})</button>
                <button onClick={() => {
                  const list = window.GAME_CONTENT?.randomBonuses || [];
                  if (list.length > 0) {
                    const bonus = list[Math.floor(Math.random() * list.length)];
                    const w = window.innerWidth;
                    const h = window.innerHeight;
                    const x = 80 + Math.random() * (w - 160);
                    const y = 120 + Math.random() * (h - 240);
                    const id = Math.random().toString(36).substring(2, 9);
                    const newSpawn = { ...bonus, x, y, id, spawnedAt: Date.now() };
                    // Replace entirely any existing floating bonuses with this new one
                    setSpawnedBonuses([newSpawn]);
                    setTimeout(() => {
                      setSpawnedBonuses(curr => curr.filter(b => b.id !== id));
                    }, 7000);
                  }
                }} style={{ ...debugBtnStyle, background: 'var(--warning-i010)', color: 'var(--warning-i100)', borderColor: 'var(--warning-i030)' }}>Trigger Bonus ({(window.GAME_CONTENT?.randomBonuses || []).length})</button>
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
                    fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,118,219,0.15)',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="t-heading-l" style={{ color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>
                    {state.clinicName || (lang === 'es' ? `Clínica de ${username}` : `${username}'s Clinic`)}
                  </span>
                  <button 
                    onClick={() => { window.playClickSound && window.playClickSound(); setIsEditingClinic(true); setTempClinicName(state.clinicName || (lang === 'es' ? `Clínica de ${username}` : `${username}'s Clinic`)); }} 
                    style={{ all: 'unset', cursor: 'pointer', color: 'var(--fg-3)', transition: 'color 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-i100)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-3)'}
                  >
                    <i className="fa-solid fa-pen-to-square" style={{ fontSize: 16 }}></i>
                  </button>
                </div>
              )}
            </div>
            <div style={{ position: 'relative', width: '100%', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                {visualEffects && (
                  <div className="aurora-container" style={{ '--aurora-opacity': auroraOpacity, zIndex: -1, mixBlendMode: 'soft-light' }} />
                )}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', width: 1200, height: 1200,
                  pointerEvents: 'none', zIndex: 0,
                  background: `repeating-conic-gradient(${sunColor} 0 15deg, transparent 15deg 30deg)`,
                  borderRadius: '50%',
                  opacity: sunOpacity,
                  transition: 'opacity 1.2s ease-out',
                  animation: 'rotateSun 40s linear infinite'
                }} />
                {showSpinningBrushes && <window.ToothbrushRing count={window.GENERATORS?.length > 0 ? (state.generators[window.GENERATORS[0].id] || 0) : 0} />}
                <div 
                  id="main-tooth-target"
                  onMouseDown={show3D ? undefined : (e) => { handleClick(e); setIsMainMouseDown(true); }}
                  onMouseUp={() => setIsMainMouseDown(false)}
                  onMouseLeave={() => setIsMainMouseDown(false)}
                  onTouchStart={show3D ? undefined : (e) => { handleClick(e); setIsMainMouseDown(true); }}
                  onTouchEnd={() => setIsMainMouseDown(false)}
                  style={{ position: 'relative', cursor: show3D ? 'default' : 'pointer', userSelect: 'none', WebkitUserSelect: 'none', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {show3D ? (
                    <window.Tooth3DViewer 
                      glbData={currentGlbData} 
                      textureUrl={currentToothImg}
                      onClick={(e) => { handleClick(e); setIsMainMouseDown(true); setTimeout(() => setIsMainMouseDown(false), 100); }} 
                      onPointerDownOut={(e) => setIsMainMouseDown(true)}
                      onPointerUpOut={(e) => setIsMainMouseDown(false)}
                      disableRotation={activeBonusEffects.some(e => e.until > Date.now() && e.type === 'hold')}
                      style={{ width: 320, height: 420, zIndex: 2, filter: activeBonusEffects.some(e => e.until > Date.now() && e.type === 'hold') ? 'drop-shadow(0 0 35px oklch(0.7 0.2 320 / 0.8)) saturate(1.4)' : activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_click') ? 'drop-shadow(0 0 28px oklch(0.7 0.2 210 / 0.85)) saturate(1.3) brightness(1.1)' : activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_gen') ? 'drop-shadow(0 0 24px #FFC22088) sepia(0.4) saturate(2) hue-rotate(10deg)' : 'drop-shadow(0 8px 24px rgba(0,118,219,0.18))' }} 
                    />
                  ) : (
                    <img src={currentToothImg} alt="tooth" style={{ width: 260, height: 260, objectFit: 'contain', filter: activeBonusEffects.some(e => e.until > Date.now() && e.type === 'hold') ? 'drop-shadow(0 0 35px oklch(0.7 0.2 320 / 0.8)) saturate(1.4)' : activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_click') ? 'drop-shadow(0 0 28px oklch(0.7 0.2 210 / 0.85)) saturate(1.3) brightness(1.1)' : activeBonusEffects.some(e => e.until > Date.now() && e.type === 'multiplier_gen') ? 'drop-shadow(0 0 24px #FFC22088) sepia(0.4) saturate(2) hue-rotate(10deg)' : 'drop-shadow(0 8px 24px rgba(0,118,219,0.18))', animation: 'toothClick 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', position: 'relative', zIndex: 2 }} />
                  )}
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
              <div className="t-heading-xs" style={{ 
                color: liveCPS >= 30 ? '#e53935' : liveCPS >= 25 ? '#f57c00' : liveCPS > 0 ? '#43a047' : 'var(--fg-1)',
                transition: 'color 0.5s ease',
                animation: liveCPS >= 30 ? 'shake 0.08s linear infinite' : liveCPS >= 25 ? 'shake 0.15s linear infinite' : 'none'
              }}>
                {liveCPS > 0 ? `${liveCPS} CPS` : '\u00A0'}
              </div>
            </div>
          </div>

        </section>

        {/* MIDDLE COLUMN: GRID */}
        <section style={{ 
          flex: '1 1 0',
          minWidth: 0,
          backgroundColor: '#e6f0f9',
          backgroundImage: 'radial-gradient(circle at 10px 10px, color-mix(in srgb, var(--fg-3) 25%, transparent) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: 'center',
          border: 'none', 
          borderRadius: 0,
          height: 'calc(100vh - 120px)', 
          maxHeight: 'calc(100vh - 120px)', 
          boxSizing: 'border-box',
          padding: '16px 20px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 64px)', justifyContent: 'space-between', rowGap: '16px', alignContent: 'start' }}>
            {(window.STORE_UPGRADES || []).filter(up => {
              // Always show purchased upgrades, otherwise check availability conditions
              if (state.storeUpgrades?.[up.id]) return true;
              if (up.type === 'generator') {
                return (state.generators?.[up.targetId] || 0) >= up.milestone;
              }
              return state.totalEarned >= up.requirement;
            }).map(up => {
              const purchased = !!state.storeUpgrades?.[up.id];
              const canAfford = state.teeth >= up.cost;
              return <window.StoreUpgradeIcon key={up.id} up={up} purchased={purchased} canAfford={canAfford} onBuy={buyStoreUpgrade} lang={lang} fmt={fmt} onHover={(up, pos) => setGlobalTooltip({ type: 'shop', data: up, pos })} onLeave={() => setGlobalTooltip(null)} />;
            })}
          </div>
        </section>

      {/* RIGHT: TABS */}
      <section style={{ flex: '1 1 0', minWidth: 0, height: 'calc(100vh - 120px)', maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 0, overflow: 'hidden' }}>
          <window.TabBar id="game-tabs-tour" active={tab} onChange={(newTab) => { window.playClickSound && window.playClickSound(); setTab(newTab); }} setTooltip={setGlobalTooltip} tabs={[
          { id: 'generators', label: t.tabGen, icon: 'fa-solid fa-industry', img: 'assets/icons/industry.png' },
          { id: 'click', label: t.tabClick, icon: 'fa-solid fa-hand-pointer', img: 'assets/icons/pointer_hand.png' },
          { id: 'achievements', label: t.tabAch, icon: 'fa-solid fa-trophy', img: 'assets/icons/trophy.png', dot: Object.keys(state.newAchievementIds || {}).length > 0 },
          { id: 'prestige', label: t.tabPrestige, icon: 'fa-solid fa-crown', img: 'assets/icons/crown.png', dot: prestigeGain > 0 },
          { id: 'skills', label: lang === 'es' ? 'Academia' : 'Academy', icon: 'fa-solid fa-graduation-cap', img: 'assets/icons/graduation_cap.png', dot: hasAffordableAcademyUpgrades },
          { id: 'leaderboard', label: t.tabLeaderboard, icon: 'fa-solid fa-ranking-star', img: 'assets/icons/podium.png' },
          { id: 'stats', label: t.tabStats, icon: 'fa-solid fa-chart-line', img: 'assets/icons/chart.png' }]
          } />

          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-5) var(--spacing-6) var(--spacing-6)', boxSizing: 'border-box' }}>
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
              <div id="generators-container-desktop" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {genStatus.map((g) => <window.GeneratorRow key={g.gen.id} gen={g.gen} owned={g.owned} cost={g.cost} canAfford={g.canAfford} unlocked={g.unlocked} revealed={g.revealed} production={g.production} nextProduction={g.nextProduction} lang={lang} totalTeeth={state.totalEarned} buyQty={buyQty} actualQty={g.actualQty} onBuy={() => buyGenerator(g.gen.id, buyQty)} />)}
              </div>
            </div>
          }

          {tab === 'click' && (
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
              <div id="click-upgrades-container-desktop" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {window.CLICK_UPGRADES.filter(up => {
                  const purchased = !!state.clickUpgrades[up.id];
                  const unlockAtVal = up.unlockAt !== undefined ? up.unlockAt : Math.floor(up.cost * 0.5);
                  const unlocked = state.totalEarned >= unlockAtVal;
                  const revealed = unlocked || purchased || state.totalEarned >= unlockAtVal * 0.5 || window.CLICK_UPGRADES.indexOf(up) === 0;
                  
                  if (!revealed) return false;
                  if (clickFilter === 'unlocked' && !unlocked && !purchased) return false;
                  if (clickFilter === 'locked' && (unlocked || purchased)) return false;
                  
                  return true;
                }).map(up => {
                  const purchased = !!state.clickUpgrades[up.id];
                  const canAfford = state.teeth >= up.cost;
                  const unlockAtVal = up.unlockAt !== undefined ? up.unlockAt : Math.floor(up.cost * 0.5);
                  const unlocked = state.totalEarned >= unlockAtVal;
                  return <window.ClickUpgradeRow key={up.id} up={up} purchased={purchased} unlocked={unlocked} canAfford={canAfford} lang={lang} totalTeeth={state.totalEarned} onBuy={() => buyClickUpgrade(up.id)} />;
                })}
              </div>
            </div>
          )}

          {tab === 'achievements' &&
          <div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div className="t-heading-m">{t.achTitle}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3, background: 'var(--bg-3)', padding: 3, borderRadius: 'var(--radius-s)', flexShrink: 0, width: '100%', overflowX: 'auto' }}>
                    {['all', 'new', 'seen', 'locked'].map((f) => (
                      <button key={f} onClick={() => { window.playClickSound && window.playClickSound(); setAchFilter(f); }} style={{
                        all: 'unset', boxSizing: 'border-box', padding: '5px 9px', borderRadius: 6,
                        fontSize: 12, fontWeight: achFilter === f ? 700 : 500, cursor: 'pointer',
                        background: achFilter === f ? 'var(--primary-i100)' : 'transparent',
                        color: achFilter === f ? '#fff' : 'var(--fg-2)',
                        transition: 'all 120ms ease', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap'
                      }}>
                        {f === 'all' ? (lang === 'es' ? 'Todos' : 'All') : f === 'new' ? (lang === 'es' ? 'Nuevos' : 'New') : f === 'seen' ? (lang === 'es' ? 'Obtenidos' : 'Obtained') : (lang === 'es' ? 'Bloqueados' : 'Locked')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {(() => {

                const filteredAch = window.ACHIEVEMENTS.filter(a => {
                  if (achFilter === 'new') return !!state.newAchievementIds?.[a.id];
                  if (achFilter === 'seen') return !!state.achievements[a.id] && !state.newAchievementIds?.[a.id];
                  if (achFilter === 'locked') return !state.achievements[a.id];
                  return true;
                });
                if (filteredAch.length === 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                      <img src="assets/logros/logros-empty.png" alt="Empty" style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16 }} />
                      <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'No se encontró ningún logro.' : 'No achievements found.'}</div>
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '10px' }}>
                    {filteredAch.map((a) => (
                      <window.AchievementCard 
                        key={a.id} 
                        ach={{ ...a, isNew: !!state.newAchievementIds?.[a.id] }} 
                        unlocked={!!state.achievements[a.id]} 
                        lang={lang} 
                        onHover={(ach, pos, unlocked) => {
                          if (pos) setGlobalTooltip({ type: 'ach', data: ach, pos, unlocked });
                          if (state.newAchievementIds?.[ach.id]) markAchievementSeen(ach.id);
                        }} 
                        onLeave={() => setGlobalTooltip(null)} 
                      />
                    ))}
                  </div>
                );
              })()}
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
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 'var(--spacing-2)' }}>
                  {window.TOOTH_STAGES.map((s, i) => {
                  const unlocked = window.isToothUnlocked(state, s);
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
                        <div style={{ position: 'relative', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={s.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', opacity: isCurrent ? 1 : (unlocked ? 0.7 : 0.2), filter: isCurrent ? 'none' : 'grayscale(1)' }} />
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
          {tab === 'skills' && (
            <div>
              <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                <div>
                  <div className="t-heading-m">{lang === 'es' ? 'Academia Dental' : 'Dental Academy'}</div>
                </div>
                <div style={{ display: 'flex', gap: 3, background: 'var(--bg-3)', padding: 3, borderRadius: 'var(--radius-s)', flexShrink: 0 }}>
                  {['all', 'bought', 'not_bought'].map((f) => (
                    <button key={f} onClick={() => { window.playClickSound && window.playClickSound(); setAcademyFilter(f); }} style={{
                      all: 'unset', boxSizing: 'border-box', padding: '5px 9px', borderRadius: 6,
                      fontSize: 12, fontWeight: academyFilter === f ? 700 : 500, cursor: 'pointer',
                      background: academyFilter === f ? 'var(--primary-i100)' : 'transparent',
                      color: academyFilter === f ? '#fff' : 'var(--fg-2)',
                      transition: 'all 120ms ease', fontFamily: 'var(--font-sans)'
                    }}>
                      {f === 'all' ? (lang === 'es' ? 'Todos' : 'All') : f === 'bought' ? (lang === 'es' ? 'Comprados' : 'Bought') : (lang === 'es' ? 'No comprados' : 'Not bought')}
                    </button>
                  ))}
                </div>
              </div>
              {(() => {
                const allLvl = window.LEVEL_UPGRADES || [];
                const allXp = window.XP_UPGRADES || [];
                if (allLvl.length === 0 && allXp.length === 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                      <img src="assets/academia/academia-empty.png" alt="Empty" style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16 }} />
                      <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'Juega para obtener diplomas y títulos que te harán el mejor profesional' : 'Play to earn diplomas and titles that will make you the best professional'}</div>
                    </div>
                  );
                }

                const filteredLvl = allLvl.filter(up => {
                  const purchased = !!state.xpUpgrades?.[up.id];
                  const lvlReq = (up.levelReq !== undefined) ? up.levelReq : (up.reqLevel || 0);
                  const isUnlocked = state.level >= lvlReq;
                  const canAfford = state.teeth >= (up.baseCost || 0);
                  const hasEverAfforded = state.totalEarned >= (up.baseCost || 0);
                  const isShown = purchased || canAfford || hasEverAfforded;
                  up._isUnlockedCache = isUnlocked;

                  if (academyFilter === 'not_bought') return !purchased && isShown;
                  if (academyFilter === 'bought') return purchased;
                  return isShown;
                });

                const filteredXp = allXp.filter(up => {
                  const purchased = !!state.xpUpgrades?.[up.id];
                  const meetsGenQty = up.reqGeneratorId ? ((state.generators?.[up.reqGeneratorId] || 0) >= (up.reqGenQty || 1)) : true;
                  const validReqAch = up.reqAchievementId && up.reqAchievementId !== "none" && String(up.reqAchievementId).trim() !== "" && (window.ACHIEVEMENTS || []).some(a => String(a.id) === String(up.reqAchievementId));
                  const meetsAch = validReqAch ? !!state.achievements[up.reqAchievementId] : true;
                  const validLegacyAch = up.achievementId && up.achievementId !== "none" && String(up.achievementId).trim() !== "" && (window.ACHIEVEMENTS || []).some(a => String(a.id) === String(up.achievementId));
                  const legacyAch = validLegacyAch ? !!state.achievements[up.achievementId] : true;
                  const lvlReq = (up.levelReq !== undefined) ? up.levelReq : (up.reqLevel || 0);
                  const meetsLevel = state.level >= lvlReq;
                  
                  const isUnlocked = meetsGenQty && meetsAch && legacyAch && meetsLevel;
                  const canAfford = state.teeth >= (up.baseCost || up.costXP || 0);
                  const hasEverAfforded = state.totalEarned >= (up.baseCost || up.costXP || 0);
                  const isShown = purchased || canAfford || hasEverAfforded;
                  up._isUnlockedCache = isUnlocked;

                  if (academyFilter === 'not_bought') return !purchased && isShown;
                  if (academyFilter === 'bought') return purchased;
                  return isShown;
                });

                if (filteredLvl.length === 0 && filteredXp.length === 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                      <img src="assets/academia/academia-empty.png" alt="Empty" style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16 }} />
                      <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'No se encontró ninguna mejora.' : 'No upgrades found.'}</div>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    {filteredLvl.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-2)' }}>
                        {filteredLvl.map((up, i) => {
                          const unlocked = up._isUnlockedCache;
                          const purchased = !!state.xpUpgrades?.[up.id];
                          const canAfford = state.teeth >= up.baseCost;
                          return <window.AcademyUpgradeRow key={up.id || i} up={up} purchased={purchased} canAfford={canAfford} unlocked={unlocked} onBuy={() => buyXpUpgrade(up.id)} lang={lang} totalXP={state.teeth} onHover={setGlobalTooltip} onLeave={() => setGlobalTooltip(null)} state={state} />;
                        })}
                      </div>
                    )}
                    {filteredXp.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-2)' }}>
                        {filteredXp.map((up, i) => {
                          const unlocked = up._isUnlockedCache;
                          const purchased = !!state.xpUpgrades?.[up.id];
                          const canAfford = state.teeth >= up.baseCost;
                          return <window.AcademyUpgradeRow key={up.id || i} up={up} purchased={purchased} canAfford={canAfford} unlocked={unlocked} onBuy={() => buyXpUpgrade(up.id)} lang={lang} totalXP={state.teeth} onHover={setGlobalTooltip} onLeave={() => setGlobalTooltip(null)} state={state} />;
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {tab === 'leaderboard' && <window.LeaderboardPanel username={username} lang={lang} />}

          {tab === 'stats' &&
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
              <div>
                <div className="t-heading-m">{t.statsTitle}</div>
                <div className="t-body-s" style={{ color: 'var(--fg-3)', marginTop: 2 }}>{lang === 'es' ? 'Todo lo que pasó en tu consulta.' : 'Everything that happened in your practice.'}</div>
              </div>
              <window.StatsGroup title={t.general} icon="fa-solid fa-chart-line" rows={[
            { label: t.currentTeeth, value: <window.Odometer value={state.teeth} formatFn={fmt} />, strong: true },
            { label: t.perSecond, value: <><window.Odometer value={displayedPerSecond} formatFn={(v) => fmt(v, true)} />/s</>, color: 'var(--positive-i100)' },
            { label: t.perClick, value: <window.Odometer value={perClick} formatFn={(v) => fmt(v, true)} />, color: 'var(--alternative-i100)' },
            { label: lang === 'es' ? 'Bonus global' : 'Global bonus', value: <>x<window.Odometer value={globalMult} formatFn={(v) => fmt(Math.floor(v * 100) / 100)} /></>, color: 'var(--warning-i130)' },
            { label: lang === 'es' ? 'Récord CPS' : 'CPS Record', value: <window.Odometer value={state.maxCPS || 0} formatFn={fmt} />, color: 'var(--positive-i100)' }]
            } />
              <window.StatsGroup title={lang === 'es' ? 'Progresión' : 'Progression'} icon="fa-solid fa-arrow-trend-up" accent="var(--primary-i100)" rows={[
            { label: lang === 'es' ? 'Nivel del jugador' : 'Player level', value: <window.Odometer value={state.level || 0} formatFn={fmt} />, strong: true, color: 'var(--primary-i100)' },
            { label: lang === 'es' ? 'Experiencia (XP)' : 'Experience (XP)', value: <>{(state.xp || 0).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / <window.Odometer value={window.getXPRequired(state.level || 0)} formatFn={fmt} /></> },
            { label: t.totalTeeth, value: <window.Odometer value={state.totalEarned} formatFn={fmt} /> },
            { label: t.totalClicks, value: <window.Odometer value={state.totalClicks} formatFn={fmt} /> },
            { label: lang === 'es' ? 'Generadores totales' : 'Total generators', value: <window.Odometer value={Object.values(state.generators || {}).reduce((a, b) => a + (b || 0), 0)} formatFn={fmt} /> },
            { label: lang === 'es' ? 'Mejoras compradas' : 'Upgrades bought', value: `${Object.values(state.clickUpgrades || {}).filter(Boolean).length}/${window.CLICK_UPGRADES.length}` },
            { label: lang === 'es' ? 'Logros' : 'Achievements', value: `${Object.keys(state.achievements || {}).length}/${window.ACHIEVEMENTS.length}` }]
            } />
              <window.StatsGroup title={lang === 'es' ? 'Prestigio y Dientes Dorados' : 'Prestige & Golden Teeth'} icon="fa-solid fa-crown" accent="var(--warning-i130)" rows={[
            { label: t.prestigeHave, value: <window.Odometer value={state.prestige} formatFn={fmt} />, strong: true },
            { label: lang === 'es' ? 'Veces prestigiado' : 'Times prestiged', value: <window.Odometer value={state.prestigeCount || 0} formatFn={fmt} />, color: 'var(--warning-i100)' },
            { label: lang === 'es' ? 'Próxima ganancia' : 'Next gain', value: <>+<window.Odometer value={prestigeGain} formatFn={fmt} /></> },
            { label: lang === 'es' ? 'Dientes dorados' : 'Golden teeth', value: <window.Odometer value={state.goldenClicks} formatFn={fmt} />, color: 'var(--warning-i100)' }]
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
        </div>
      )}

      <audio 
        ref={audioRef}
        src={currentTrack ? getAbsoluteSrc(currentTrack.src) : ''}
        preload="none"
        style={{ display: 'none' }}
        onTimeUpdate={(e) => {
          const now = Date.now();
          const t = e.target.currentTime;
          if (now - lastTimeUpdate.current > 330 || Math.abs(t - musicTime) > 1 || t === 0) {
            setMusicTime(t);
            lastTimeUpdate.current = now;
          }
        }}
        onLoadedMetadata={(e) => setMusicDuration(e.target.duration)}
        onEnded={(e) => {
          const isLoop = playMode.includes('loop');
          const isShuffle = playMode.includes('shuffle');
          const isStop = playMode === 'stop';

          if (isStop) {
            setIsMusicPlaying(false);
            e.target.currentTime = 0;
          } else if (isShuffle) {
            const unlockedTracks = tracks.filter(t => (state.level >= (t.reqLevel || 0)) && ((state.prestigeCount || 0) >= (t.reqPrestige || 0)));
            if (unlockedTracks.length === 0) return;
            const nextTrack = unlockedTracks[Math.floor(Math.random() * unlockedTracks.length)];
            setCurrentTrack(nextTrack);
            if (audioRef.current) {
              audioRef.current.src = getAbsoluteSrc(nextTrack.src);
              audioRef.current.load();
              audioRef.current.volume = musicMuted ? 0 : musicVolume;
              audioRef.current.play().catch(err => console.log('Ended shuffle play blocked:', err));
            }
          } else if (isLoop) {
            e.target.currentTime = 0;
            e.target.play().catch(err => { console.error('Loop play blocked:', err); setIsMusicPlaying(false); });
          } else {
            const unlockedTracks = tracks.filter(t => (state.level >= (t.reqLevel || 0)) && ((state.prestigeCount || 0) >= (t.reqPrestige || 0)));
            if (unlockedTracks.length === 0) return;
            const idx = unlockedTracks.findIndex(t => t.id === currentTrack?.id);
            const nextTrack = unlockedTracks[((idx !== -1 ? idx : 0) + 1) % unlockedTracks.length];
            setCurrentTrack(nextTrack);
            if (audioRef.current) {
              audioRef.current.src = getAbsoluteSrc(nextTrack.src);
              audioRef.current.load();
              audioRef.current.volume = musicMuted ? 0 : musicVolume;
              audioRef.current.play().catch(err => console.log('Ended next play blocked:', err));
            }
          }
        }}
      />

      {initialLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeOut 0.3s ease 1.2s forwards' }}>
          <img src={window.GAME_CONTENT?.terminology?.images?.logoVertical || "uploads/logo-vertical.png"} alt="Logo" style={{ width: 220, marginBottom: 24, animation: 'pulse 1.5s infinite ease-in-out', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(80,140,220,0.22))' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary-i100)', fontWeight: 600, fontSize: 16 }}>
            <i className="fa-solid fa-circle-notch fa-spin"></i>
            {initialLang === 'es' ? 'Cargando clínica dental...' : 'Loading dental clinic...'}
          </div>
        </div>
      )}

      {!isMobile && (
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
      )}
      {musicModalOpen && (
        <MusicPlayerModal
          lang={lang}
          state={state}
          visualEffects={visualEffects}
          onClose={() => { setMusicModalOpen(false); setMusicScrollToId(null); }}
          tracks={tracks}
          currentTrack={currentTrack}
          scrollToTrackId={musicScrollToId}
          onSelectTrack={(t) => { 
            userPausedMusic.current = false; 
            setCurrentTrack(t); 
            setIsMusicPlaying(true); 
            // Unlock/Play directly in click handler for mobile
            if (audioRef.current) {
              audioRef.current.src = getAbsoluteSrc(t.src); // Force source update immediately with absolute path
              audioRef.current.load(); // Required on some mobile browsers after src change
              audioRef.current.volume = musicMuted ? 0 : musicVolume;
              audioRef.current.play().catch(e => console.log('Gesture play:', e));
            }
          }}
          onPlayRandom={() => {
            const unlockedTracks = tracks.filter(t => (state.level >= (t.reqLevel || 0)) && ((state.prestigeCount || 0) >= (t.reqPrestige || 0)));
            if (unlockedTracks.length === 0) return;
            const random = unlockedTracks[Math.floor(Math.random() * unlockedTracks.length)];
            setCurrentTrack(random);
            setIsMusicPlaying(true);
            if (audioRef.current) {
              audioRef.current.src = getAbsoluteSrc(random.src);
              audioRef.current.load();
              audioRef.current.volume = musicMuted ? 0 : musicVolume;
              audioRef.current.play().catch(e => console.log('Random play gesture fail:', e));
            }
          }}
          isPlaying={isMusicPlaying}
          onTogglePlay={() => { 
            const next = !isMusicPlaying;
            userPausedMusic.current = isMusicPlaying; 
            setIsMusicPlaying(next); 
            if (audioRef.current) {
              if (next) {
                const absSrc = getAbsoluteSrc(currentTrack.src);
                if (audioRef.current.src !== absSrc) {
                  audioRef.current.src = absSrc;
                  audioRef.current.load();
                }
                audioRef.current.volume = musicMuted ? 0 : musicVolume;
                audioRef.current.play().catch(e => {
                   console.log('Toggle play fail:', e);
                   audioRef.current.load();
                   audioRef.current.play().catch(p => console.log('Retry play fail:', p));
                });
              }
              else audioRef.current.pause();
            }
          }}
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
          onShareTrack={(track) => {
            const teethStr = window.formatNumWithMode(state.lifetimeEarned || state.totalEarned || 0, 'short', lang);
            const url = `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}/player.html?track=${track.id}&teeth=${encodeURIComponent(teethStr)}`;
            const text = lang === 'es' 
              ? `Juega ToothClicker, mi clínica ya tiene ${teethStr}.` 
              : `Play ToothClicker, my clinic already has ${teethStr}.`;
            
            const handleCopy = () => {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                  setToast({ id: 'share_success', es: '¡Enlace de compartir copiado al portapapeles!', en: 'Share link copied to clipboard!' });
                  setTimeout(() => setToast(null), 3000);
                }).catch(() => {
                  fallbackCopy();
                });
              } else {
                fallbackCopy();
              }
            };

            const fallbackCopy = () => {
              const input = document.createElement('input');
              input.value = url;
              document.body.appendChild(input);
              input.select();
              try {
                document.execCommand('copy');
                setToast({ id: 'share_success', es: '¡Enlace de compartir copiado al portapapeles!', en: 'Share link copied to clipboard!' });
                setTimeout(() => setToast(null), 3000);
              } catch (e) {
                console.error('Copy fallback failed', e);
              }
              document.body.removeChild(input);
            };

            if (navigator.share) {
              navigator.share({
                title: 'Tooth Clicker',
                text: text,
                url: url
              }).catch(() => {
                handleCopy();
              });
            } else {
              handleCopy();
            }
          }}
          onHoverShare={(pos) => {
            setGlobalTooltip({
              type: 'text',
              text: lang === 'es' ? 'Compartir enlace' : 'Share link',
              pos: pos,
              direction: 'up'
            });
          }}
          onLeaveShare={() => setGlobalTooltip(null)}
        />

      )}



      {spawnedBonuses.map(b => (
        <FloatingBonus key={b.id} bonus={b} onClick={handleBonusClick} />
      ))}

      <window.Toast toast={toast} lang={lang} />
      
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none' }}>
        {achievementToasts.map((t, idx) => {
          const reverseIdx = achievementToasts.length - 1 - idx;
          const translateY = reverseIdx * -16;
          const scale = 1 - (reverseIdx * 0.05);
          const opacity = Math.max(0.25, 1 - (reverseIdx * 0.25));
              const effect = t.borderEffect || (t.id ? 'rainbow' : 'none');
              const effectAnim = effect === 'rainbow' ? 'rainbow-border-anim 2s linear infinite' : effect === 'pulse' ? 'pulse-border-anim 1.5s ease-in-out infinite' : 'none';
              
              return (
                <div 
                  key={t.uniqueId} 
                  className="stacked-toast"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAchievementToasts(prev => {
                      const next = [...prev];
                      const activeIdx = next.findIndex(x => x.uniqueId === t.uniqueId);
                      if (activeIdx > -1) {
                        const [active] = next.splice(activeIdx, 1);
                        next.push(active);
                      }
                      return next;
                    });
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    '--base-ty': `${translateY}px`,
                    '--base-scale': scale,
                    '--base-op': opacity,
                    zIndex: 1000 - reverseIdx,
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    width: 'max-content',
                    animation: 'toastStackIn 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                >
                  <window.Toast toast={t} lang={lang} styleOverride={{ position: 'relative', bottom: 'auto', left: 'auto', transform: 'none', animation: effectAnim }} onClose={() => setAchievementToasts(prev => prev.filter(x => x.uniqueId !== t.uniqueId))} />
                </div>
              );
            })}
      </div>

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
      <Modal onClose={() => setShowPrestigeConfirm(false)} overflowVisible>
          <div className="prestige-sunburst"></div>
          <PrestigeConfetti />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ width: 54, height: 54, borderRadius: 'var(--radius-s)', background: 'var(--warning-i010)', color: 'var(--warning-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-3)' }}>
              <i className="fa-solid fa-crown" style={{ fontSize: 22 }}></i>
            </div>
            <div className="t-heading-m">{t.prestigeBtn}</div>
            <div className="t-body-m" style={{ color: 'var(--fg-2)', marginTop: 6 }}>{t.confirmPrestige}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'var(--spacing-5)' }}>
              <button onClick={() => setShowPrestigeConfirm(false)} style={secondaryBtnStyle}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
              <button onClick={doPrestige} style={{ ...primaryBtnStyle, background: 'var(--warning-i100)', color: 'var(--warning-i150)' }}><i className="fa-solid fa-crown" style={{ marginRight: 6 }}></i>{t.prestigeBtn}</button>
            </div>
          </div>
        </Modal>
      }

      {showSettingsModal && (
        <Modal onClose={() => setShowSettingsModal(false)} maxWidth={480}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-gear" style={{ fontSize: 20, color: 'var(--primary-i100)', animation: 'spin 12s linear infinite' }}></i>
              <span className="t-heading-m" style={{ fontWeight: 700 }}>{lang === 'es' ? 'Configuración del juego' : 'Game Settings'}</span>
            </div>
            <button onClick={() => { window.playClickSound && window.playClickSound(); setShowSettingsModal(false); }} style={{ all: 'unset', cursor: 'pointer', color: 'var(--fg-3)', transition: 'color 0.2s', padding: 4 }}>
              <i className="fa-solid fa-xmark" style={{ fontSize: 18 }}></i>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', overflowY: 'auto', paddingRight: 4, maxHeight: 'calc(100vh - 200px)' }}>
            {/* The 3 switches list separated by dividers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Sound Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <i className={`fa-solid ${soundOn ? 'fa-volume-high' : 'fa-volume-xmark'}`} style={{ color: soundOn ? 'var(--primary-i100)' : 'var(--fg-3)', fontSize: 16, width: 20, textAlign: 'center' }}></i>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'es' ? 'Efectos de sonido' : 'Sound Effects'}</span>
                    <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{lang === 'es' ? 'Activa/desactiva los sonidos al hacer click y comprar' : 'Enable/disable click and purchase sounds'}</span>
                  </div>
                </div>
                <label className="settings-switch">
                  <input 
                    type="checkbox" 
                    checked={soundOn} 
                    onChange={() => { window.playClickSound && window.playClickSound(); toggleSound(); }} 
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)' }} />

              {/* Visual Effects Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <i className={`fa-solid ${visualEffects ? 'fa-wand-magic-sparkles' : 'fa-wand-magic'}`} style={{ color: visualEffects ? 'var(--primary-i100)' : 'var(--fg-3)', fontSize: 16, width: 20, textAlign: 'center' }}></i>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'es' ? 'Simulaciones y partículas' : 'Simulations & Particles'}</span>
                    <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{lang === 'es' ? 'Activa/desactiva la lluvia de dientes y animaciones globales' : 'Enable/disable falling teeth and global animations'}</span>
                  </div>
                </div>
                <label className="settings-switch">
                  <input 
                    type="checkbox" 
                    checked={visualEffects} 
                    onChange={() => { window.playClickSound && window.playClickSound(); toggleVisualEffects(); }} 
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)' }} />

              {/* Orbiting Toothbrushes Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <i className="fa-solid fa-broom" style={{ color: showSpinningBrushes ? 'var(--primary-i100)' : 'var(--fg-3)', fontSize: 16, width: 20, textAlign: 'center' }}></i>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'es' ? 'Mostrar cepillos girando' : 'Show spinning toothbrushes'}</span>
                    <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{lang === 'es' ? 'Muestra u oculta los cepillos orbitando alrededor del diente central' : 'Show or hide orbiting brushes around the central tooth'}</span>
                  </div>
                </div>
                <label className="settings-switch">
                  <input 
                    type="checkbox" 
                    checked={showSpinningBrushes} 
                    onChange={() => { window.playClickSound && window.playClickSound(); toggleSpinningBrushes(); }} 
                  />
                  <span className="settings-slider" />
                </label>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

            {/* Language Settings */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => { if (lang !== 'es') { window.playClickSound && window.playClickSound(); toggleLang(); } }}
                style={{ 
                  flex: 1, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: lang === 'es' ? 'var(--primary-i010)' : 'var(--bg-3)',
                  color: lang === 'es' ? 'var(--primary-i100)' : 'var(--fg-2)',
                  border: lang === 'es' ? '1.5px solid var(--primary-i050)' : '1.5px solid var(--border-subtle)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <span style={{ fontSize: 16 }}>🇪🇸</span> Español
              </button>
              <button 
                onClick={() => { if (lang !== 'en') { window.playClickSound && window.playClickSound(); toggleLang(); } }}
                style={{ 
                  flex: 1, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: lang === 'en' ? 'var(--primary-i010)' : 'var(--bg-3)',
                  color: lang === 'en' ? 'var(--primary-i100)' : 'var(--fg-2)',
                  border: lang === 'en' ? '1.5px solid var(--primary-i050)' : '1.5px solid var(--border-subtle)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <span style={{ fontSize: 16 }}>🇺🇸</span> English
              </button>
            </div>
            
            <window.MenuDivider />
            
            {/* Account Settings */}
            <h4 style={{ fontSize: 13, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 0 0', fontWeight: 700 }}>
              {lang === 'es' ? 'Cuenta y Seguridad' : 'Account & Security'}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              {!state.googleLinked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-3)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.4 }}>
                    {lang === 'es' ? 'Protege tu progreso y obtén el logro "Cuenta Protegida" vinculando tu partida a Google.' : 'Protect your progress and earn the "Protected Account" achievement by linking to Google.'}
                  </div>
                  <button 
                    onClick={() => {
                      if (window.playClickSound) window.playClickSound();
                      localStorage.setItem('link_intent_user', username);
                      localStorage.setItem('link_intent_pass', state.password || '');
                      window.cloudLoginWithGoogle && window.cloudLoginWithGoogle();
                    }}
                    className="app-btn"
                    style={{
                      all: 'unset', width: '100%', boxSizing: 'border-box',
                      padding: '10px', borderRadius: 8, textAlign: 'center',
                      background: '#fff', color: '#444', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: 'pointer', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: 16, height: 16 }} />
                    {lang === 'es' ? 'Vincular con Google' : 'Link to Google'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--positive-i010)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--positive-i050)' }}>
                  <i className="fa-solid fa-shield-check" style={{ color: 'var(--positive-i100)', fontSize: 20 }}></i>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--positive-i130)' }}>{lang === 'es' ? 'Cuenta Protegida' : 'Account Protected'}</span>
                    <span style={{ fontSize: 11, color: 'var(--positive-i100)' }}>{lang === 'es' ? 'Vinculado a Google' : 'Linked to Google'}</span>
                  </div>
                </div>
              )}
            </div>

            <window.MenuDivider />

            {/* Numeric Format Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <div className="form-label">{lang === 'es' ? 'Formato Numérico' : 'Number Format'}</div>
              <select 
                className="app-select" 
                value={numFormat} 
                onChange={(e) => { 
                  window.playClickSound && window.playClickSound(); 
                  const val = e.target.value;
                  setNumFormatLocal(val);
                  localStorage.setItem(NUMFMT_KEY, val);
                  onNumFormatChange && onNumFormatChange(val);
                }}
                style={{ width: '100%', height: 46 }}
              >
                <option value="short">{lang === 'es' ? 'Corto (Abreviado - 1.2M)' : 'Short (Abbreviated - 1.2M)'}</option>
                <option value="long">{lang === 'es' ? 'Largo (Completo - 1.2 Millón)' : 'Long (Full - 1.2 Million)'}</option>
                <option value="engineering">{lang === 'es' ? 'Ingeniería (1.2e6)' : 'Engineering (1.2e6)'}</option>
                <option value="scientific">{lang === 'es' ? 'Científico (1.2 x 10^6)' : 'Scientific (1.2 x 10^6)'}</option>
              </select>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

            {/* Danger Zone: Reset Account */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed var(--negative-i050)', background: 'var(--negative-i005)', padding: '12px 16px', borderRadius: 12, gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--negative-i130)' }}>{lang === 'es' ? 'Eliminar cuenta' : 'Delete Account'}</span>
                <span style={{ fontSize: 10, color: 'var(--negative-i130)', opacity: 0.85, lineHeight: 1.3 }}>{lang === 'es' ? 'Borra permanentemente tu progreso, usuario y ranking.' : 'Permanently erase all progress, user and rank.'}</span>
              </div>
              <button 
                onClick={() => { window.playClickSound && window.playClickSound(); setShowResetConfirm(true); }} 
                className="app-btn"
                style={{ 
                  all: 'unset', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, background: 'var(--negative-i100)', color: '#fff', 
                  fontSize: 12, fontWeight: 700, boxShadow: '0 2px 4px rgba(225,29,36,0.2)', transition: 'background 0.2s',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                {t.reset}
              </button>
            </div>
          </div>
        </Modal>
      )}

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
            {newToothUnlock.stage.glbData ? (
              <div style={{ position: 'relative', width: 110, height: 110, filter: 'drop-shadow(0 4px 16px rgba(255,194,32,0.4))' }}>
                <window.Tooth3DViewer glbData={newToothUnlock.stage.glbData} textureUrl={newToothUnlock.stage.img} style={{ width: '100%', height: '100%' }} />
              </div>
            ) : (
              <img src={newToothUnlock.stage.img} alt={newToothUnlock.stage[lang] || newToothUnlock.stage.es} style={{ width: 110, height: 110, objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(255,194,32,0.4))' }} />
            )}
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

      {newMusicUnlock && !showLevelUpModal && (
        <div onClick={() => setNewMusicUnlock(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(5,9,13,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, animation: 'fadeIn 200ms ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-2)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 340, maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid var(--border-subtle)', animation: 'scaleUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-i010)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-i100)', fontSize: 32, marginBottom: 8 }}>
              <i className="fa-solid fa-music"></i>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-i100)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{lang === 'es' ? '¡Nueva Canción Desbloqueada!' : 'New Song Unlocked!'}</div>
              <div className="t-heading-m" style={{ color: 'var(--fg-1)' }}>{newMusicUnlock.title}</div>
            </div>
            <button onClick={() => {
              setMusicScrollToId(newMusicUnlock.id);
              setMusicModalOpen(true);
              setNewMusicUnlock(null);
            }} style={{ ...primaryBtnStyle, width: '100%', marginTop: 8 }}>
              {lang === 'es' ? 'Abrir reproductor' : 'Open player'}
            </button>
            <button onClick={() => setNewMusicUnlock(null)} style={{ ...secondaryBtnStyle, width: '100%', marginTop: -8 }}>
              {lang === 'es' ? 'Cerrar' : 'Close'}
            </button>
          </div>
        </div>
      )}

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
      {bossMsg && <BossMarquee msg={bossMsg} lang={lang} danger={bossMsg.danger} onDismiss={() => setBossMsg(null)} onAnswer={bossMsg.msgType === 'question' ? (userAnswer) => {
        const correct = bossMsg.options ? (userAnswer === bossMsg.correctOptionIndex) : (userAnswer === bossMsg.questionAnswer);
        const reward = correct ? bossMsg.correctReward : bossMsg.wrongReward;
        let rewardDesc = '';
        if (reward && reward.type !== 'none') {
          if (reward.type === 'addTeeth') {
            setState(s => ({ ...s, teeth: s.teeth + reward.amount, totalEarned: s.totalEarned + reward.amount, lifetimeEarned: (s.lifetimeEarned || 0) + reward.amount }));
            rewardDesc = lang === 'es' ? `+${window.formatNum(reward.amount)} dientes` : `+${window.formatNum(reward.amount)} teeth`;
          } else if (reward.type === 'removeTeeth') {
            setState(s => ({ ...s, teeth: Math.max(0, s.teeth - reward.amount) }));
            rewardDesc = lang === 'es' ? `-${window.formatNum(reward.amount)} dientes` : `-${window.formatNum(reward.amount)} teeth`;
          } else if (reward.type === 'randomBonus') {
            const bonuses = ['gold', 'crystal', 'hold'];
            const pick = bonuses[Math.floor(Math.random() * bonuses.length)];
            if (pick === 'gold') { setGoldenActiveUntil(Date.now() + 13000); setCrystalFrenzyUntil(0); setHoldBonusUntil(0); rewardDesc = lang === 'es' ? 'Bonus Diente Dorado x7 activado' : 'Golden Tooth x7 bonus activated'; }
            else if (pick === 'crystal') { setCrystalFrenzyUntil(Date.now() + 15000); setGoldenActiveUntil(0); setHoldBonusUntil(0); rewardDesc = lang === 'es' ? 'Frenesí Cristal x5 activado' : 'Crystal Frenzy x5 activated'; }
            else { setHoldBonusUntil(Date.now() + 20000); setGoldenActiveUntil(0); setCrystalFrenzyUntil(0); rewardDesc = lang === 'es' ? 'Auto-click activado' : 'Auto-click activated'; }
          }
        } else {
          rewardDesc = lang === 'es' ? 'Sin efecto' : 'No effect';
        }
        if (soundRef.current) {
          if (correct) { window.playTone(660, 0.12, 'triangle', 0.06); setTimeout(() => window.playTone(880, 0.15, 'triangle', 0.06), 100); }
          else { window.playTone(220, 0.2, 'sawtooth', 0.08); setTimeout(() => window.playTone(180, 0.25, 'sawtooth', 0.08), 120); }
        }
        
        if (!correct && bossMsg.explanationText) {
          setQuestionFeedback(bossMsg.explanationText);
        }

        setBossMsg(null);
        setQuestionResult({ correct, rewardDesc });
        setTimeout(() => setQuestionResult(null), 4000);
      } : undefined} />
      }

      {/* Question Result Toast */}
      {questionResult && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 3000,
          background: questionResult.correct ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)',
          color: '#fff', padding: '16px 28px', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 14,
          animation: 'modalIn 200ms ease',
          fontFamily: 'var(--font-sans)', maxWidth: 400
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            <i className={questionResult.correct ? 'fa-solid fa-check' : 'fa-solid fa-xmark'}></i>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
              {questionResult.correct ? (lang === 'es' ? '¡Correcto!' : 'Correct!') : (lang === 'es' ? '¡Incorrecto!' : 'Wrong!')}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{questionResult.rewardDesc}</div>
          </div>
        </div>
      )}

      {/* Question Feedback Modal */}
      {questionFeedback && (
        <window.Modal onClose={() => setQuestionFeedback(null)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <h2 style={{ fontSize: 20, color: '#1a3a5a', marginBottom: 12 }}>{lang === 'es' ? '¡Respuesta Incorrecta!' : 'Wrong Answer!'}</h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24, padding: '0 10px' }}>
              {questionFeedback}
            </p>
            <button 
              onClick={() => setQuestionFeedback(null)} 
              className="app-btn" 
              style={{ background: '#1a8fff', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, width: '100%' }}
            >
              {lang === 'es' ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </window.Modal>
      )}
      
      <window.SmartTooltip tooltip={globalTooltip} lang={lang} fmt={fmt} state={state} />

      {contextMenu && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, minWidth: 260, background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', boxShadow: 'var(--elevation-20)', padding: 6, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {onBackToAdmin && (
            <>
              <window.MenuItem icon="fa-shield-halved" label={lang === 'es' ? 'Volver a Administración' : 'Back to Administration'} onClick={() => { window.playClickSound && window.playClickSound(); setContextMenu(null); onBackToAdmin(); }} />
              <window.MenuDivider />
            </>
          )}
          <window.MenuItem icon="fa-sliders" label={lang === 'es' ? 'Configuración' : 'Settings'} onClick={() => { window.playClickSound && window.playClickSound(); setShowSettingsModal(true); }} />
          <window.MenuItem icon="fa-circle-info" label={lang === 'es' ? 'Acerca de' : 'About'} onClick={() => { window.playClickSound && window.playClickSound(); setShowAbout(true); }} />
          <window.MenuItem icon="fa-comment-dots" label={lang === 'es' ? 'Enviar feedback' : 'Send feedback'} onClick={() => { window.playClickSound && window.playClickSound(); window.open('https://forms.gle/wM6YLVeGz6DfHQ4V8', '_blank'); }} />
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
            if (stateRef.current) stateRef.current.dontShowTourAgain = next;
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
              if (stateRef.current) {
                stateRef.current.hasSeenTour = nextSeenTour;
                stateRef.current.hasSeenHelpIndicator = nextSeenHelp;
              }
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
  const [gameContentReady, setGameContentReady] = useState(false);
  const [seasonModalData, setSeasonModalData] = useState(null);
  const [activeSeasonConfig, setActiveSeasonConfig] = useState(null);

  useEffect(() => {
    const initContent = async () => {
      try {
        if (window.cloudGetSeasonConfig) {
          const sRes = await window.cloudGetSeasonConfig();
          if (sRes.ok && sRes.config) {
            setActiveSeasonConfig(sRes.config);
          }
        }

        if (window.cloudFetchGameContent) {
          const res = await window.cloudFetchGameContent();
          window.initializeGameContent(res.ok ? res.content : null);
        } else {
          window.initializeGameContent(null);
        }
      } catch (e) {
        console.error("Failed to fetch game content", e);
        window.initializeGameContent(null);
      }
      setGameContentReady(true);
    };

    initContent();
  }, []);

  useEffect(() => {
    if (screen === 'game' && username) {
      const fetchAndCheckSeason = async () => {
        let currentConfig = activeSeasonConfig;
        if (window.cloudGetSeasonConfig) {
          const sRes = await window.cloudGetSeasonConfig();
          if (sRes.ok && sRes.config) {
            currentConfig = sRes.config;
            setActiveSeasonConfig(currentConfig);
          }
        }
        
        if (currentConfig && currentConfig.id) {
          const userLastSeen = localStorage.getItem('last_seen_season_' + username);
          if (userLastSeen !== currentConfig.id) {
            setSeasonModalData(currentConfig);
            localStorage.setItem('last_seen_season_' + username, currentConfig.id);
          }
        }
      };
      fetchAndCheckSeason();
    }
  }, [screen, username]);

  // Font & Branding Initialization
  useEffect(() => {
    if (gameContentReady) {
      // Inject custom fonts
      const customFonts = window.GAME_CONTENT?.typography?.customFonts || [];
      customFonts.forEach(font => {
        if (font.value && font.url && !document.getElementById(`font-${font.value}`)) {
          const style = document.createElement('style');
          style.id = `font-${font.value}`;
          style.innerHTML = `@font-face { font-family: "${font.value}"; src: url(${font.url}); }`;
          document.head.appendChild(style);
        }
      });
      
      const activeFont = window.GAME_CONTENT?.typography?.font || 'PixelifySans';
      document.documentElement.style.setProperty('--active-font', `"${activeFont}"`);

      // Inject custom favicon
      const customFavicon = window.GAME_CONTENT?.terminology?.images?.favicon;
      if (customFavicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = customFavicon;
      }
    }
  }, [gameContentReady]);

  const [deviceUser, setDeviceUser] = useState(() => localStorage.getItem(DEVICE_USER_KEY) || null);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'es');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== '0');
  const [numFormat, setNumFormat] = useState(() => localStorage.getItem(NUMFMT_KEY) || 'short');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_ID_KEY) || null);
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [savedState, setSavedState] = useState(null);

  const [appVersion, setAppVersion] = useState(() => window.APP_VERSION || 'v0.5.5-beta');

  // Load dynamic version history from Supabase settings on startup
  useEffect(() => {
    // Backup original hardcoded history
    if (!window.DEFAULT_VERSION_HISTORY && window.VERSION_HISTORY) {
      window.DEFAULT_VERSION_HISTORY = [...window.VERSION_HISTORY];
    }

    const loadDynamicVersion = async () => {
      try {
        if (window.cloudFetchVersionMetadata) {
          const res = await window.cloudFetchVersionMetadata();
          if (res.ok && res.history && res.history.length > 0) {
            console.log("[VersionSync] Loaded dynamic version:", res.history[0].v);
            
            const localDefault = window.DEFAULT_VERSION_HISTORY || [];
            const merged = [...res.history];
            for (const item of localDefault) {
              if (!merged.some(m => m.v === item.v)) {
                merged.push(item);
              }
            }
            
            window.VERSION_HISTORY = merged;
            window.APP_VERSION = res.history[0].v;
            setAppVersion(res.history[0].v);
          }
        }
      } catch (e) {
        console.warn("[VersionSync] Failed to load dynamic version history", e);
      }
    };
    loadDynamicVersion();
  }, []);

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
        if (setRes.ok && setRes.settings) {
          if (setRes.settings.cpsThreshold) {
            localStorage.setItem('admin_cps_threshold', setRes.settings.cpsThreshold.toString());
          }
          if (setRes.settings.cpsLimitEnabled !== undefined) {
            localStorage.setItem('admin_cps_limit_enabled', setRes.settings.cpsLimitEnabled.toString());
          }
          if (setRes.settings.advancedFilters !== undefined) {
            localStorage.setItem('admin_advanced_filters', JSON.stringify(setRes.settings.advancedFilters));
          }
          if (setRes.settings.applyAdvancedFiltersToGame !== undefined) {
            localStorage.setItem('admin_apply_filters_to_game', setRes.settings.applyAdvancedFiltersToGame.toString());
          }
        }
      } catch (e) {}
    };
    
    syncData();
    const id = setInterval(syncData, 15000);
    return () => clearInterval(id);
  }, [username, sessionId]);
  useEffect(() => {
    window.__lang = lang;
    document.documentElement.lang = lang;
  }, [lang]);

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
      if (res.error === 'El jugador ya existe' && password === 'oauth') {
        // Attempt to auto-link if it's an orphaned Google account
        const linkRes = await window.cloudLinkGoogleAccount(cleaned, 'oauth');
        if (linkRes.ok) {
          // Linked successfully! Fetch player data and select
          const authRes = await window.cloudFetchPlayerByAuth();
          if (authRes.ok && authRes.found) {
            handleSelectUser(authRes.player.name, authRes.player, null);
          }
          return;
        }
      }
      alert(lang === 'es' ? 'Error al registrar: ' + res.error : 'Registration error: ' + res.error);
      return;
    }

    const updated = [...loadUsers(), cleaned];
    saveUsers(updated);
    localStorage.setItem(DEVICE_USER_KEY, cleaned);
    
    // Store password locally in the save object
    persistUserSave(cleaned, { ...defaultState(), password, googleLinked: passwordOrOauth === 'oauth' });
    
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
      let cloudProgress = cloudData.saveData || cloudData.save_data || cloudData; 
      
      if (cloudData.auth_id) {
        cloudProgress.googleLinked = true;
      }
      
      if (name === 'James') {
        const localData = loadUserSave(name);
        if (localData && Object.keys(localData).length > 1) {
           cloudProgress = localData;
        }
      }
      
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
    
    if (name === 'James') {
      const localData = loadUserSave(name);
      if (localData && Object.keys(localData).length > 1) {
         setSavedState(localData);
      }
    }
    
    setUsername(name);
    setScreen('game');
  }, [checkBan]);

  const handleLogout = useCallback(async () => {
    setSessionTerminated(false);
    
    // Force a save before destroying the session
    if (window.forcePushScore) {
      try { window.forcePushScore(); } catch(e) {}
    }
    
    try {
      if (window._supabase) {
        await window._supabase.auth.signOut();
      }
    } catch(e) {}
    
    // Unmount game and clear local state only after session is fully destroyed
    setScreen('gate');
    setUsername(null);
    setSessionId(null);
    localStorage.removeItem(SESSION_ID_KEY);
    refreshUsers();
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

  if (!gameContentReady) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-1)', color: 'var(--fg-1)' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 32, color: 'var(--primary-i100)' }}></i>
      </div>
    );
  }

  if (screen === 'admin') {

    return (
      <window.AdminLayout
        lang={lang}
        onLangChange={() => handleLangChange()}
        onEnterGame={handleAdminEnterGame}
        onBack={handleAdminBack} />);
  }

  if (screen === 'game') {
    const isAdmin = !!localStorage.getItem(ADMIN_AUTH_KEY);
    return (
      <>
        <Game key={username} username={username} sessionId={sessionId} lang={lang} onLangChange={handleLangChange}
          saved={savedState}
          onLogout={handleLogout} onDeleteUser={handleDeleteUser}
          numFormat={numFormat} onNumFormatChange={handleNumFormatChange}
          onBackToAdmin={(isAdmin && username === ADMIN_NAME) ? () => setScreen('admin') : undefined} 
          activeSeasonConfig={activeSeasonConfig}
          isSeasonModalOpen={!!seasonModalData} />
        
        {seasonModalData && (
          <window.Modal persistent={true}>
            <div style={{ textAlign: 'center' }}>
              {seasonModalData.image && (
                <div style={{ margin: 'calc(-1 * var(--spacing-6)) calc(-1 * var(--spacing-6)) 20px calc(-1 * var(--spacing-6))' }}>
                  <img src={seasonModalData.image} alt="Season" style={{ width: '100%', display: 'block', borderTopLeftRadius: 'var(--radius-m)', borderTopRightRadius: 'var(--radius-m)' }} />
                </div>
              )}
              <style>{`
                .season-welcome-message ul { padding-left: 24px; margin-top: 8px; margin-bottom: 8px; list-style-type: disc; }
                .season-welcome-message ol { padding-left: 24px; margin-top: 8px; margin-bottom: 8px; list-style-type: decimal; }
                .season-welcome-message p { margin-bottom: 8px; }
              `}</style>
              <div className="season-welcome-message" style={{ color: 'var(--fg-1)', lineHeight: 1.5, marginBottom: 24, textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: seasonModalData.description || '' }}></div>
              {seasonModalData.audio && (
                <audio autoPlay src={seasonModalData.audio} />
              )}
              <button className="app-btn" onClick={() => setSeasonModalData(null)} style={{ padding: '12px 32px', background: 'var(--primary-i100)', color: '#fff', fontSize: 16, width: '100%' }}>
                {lang === 'es' ? '¡Empezar a Jugar!' : 'Start Playing!'}
              </button>
            </div>
          </window.Modal>
        )}
      </>
    );
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