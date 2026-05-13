// Tooth Clicker — Main App + Game component
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
  if (window.playTone) {
    window.playTone(880, 0.05, 'sine', 0.05);
  }
};

function loadAllSaves() {try {return JSON.parse(localStorage.getItem(SAVES_KEY) || '{}') || {};} catch (e) {return {};}}
function saveAllSaves(o) {try {localStorage.setItem(SAVES_KEY, JSON.stringify(o));} catch (e) {}}
function loadUserSave(u) {if (!u) return null;return loadAllSaves()[u] || null;}
function persistUserSave(u, s) {if (!u) return;const all = loadAllSaves();all[u] = s;saveAllSaves(all);}
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


// Boss messages are now managed via the Admin Panel.

// Color asignado por persona — rotación entre rojo, violeta y azul al azar por aparición
const NAME_COLORS = ['oklch(0.6 0.22 25)', 'oklch(0.55 0.25 295)', 'oklch(0.6 0.2 250)'];

function BossMarquee({ msg, lang, danger, onDismiss }) {
  const [shown, setShown] = useState('');
  const [containerReady, setContainerReady] = useState(false);
  const messageBody = msg[lang] || msg.es;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // Color aleatorio para el nombre — se elige una vez por mensaje
  const nameColor = useMemo(() => NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)], [msg]);

  useEffect(() => {
    // 1) Mostrar el contenedor primero
    setShown('');
    setContainerReady(false);
    const showContainer = setTimeout(() => setContainerReady(true), 50);
    // 2) Empezar el typewriter después de que el contenedor entre
    let id;
    const startType = setTimeout(() => {
      let i = 0;
      id = setInterval(() => {
        i++;
        setShown(messageBody.slice(0, i));
        if (i >= messageBody.length) clearInterval(id);
      }, 28);
    }, 380);
    const dismissTimer = setTimeout(() => dismissRef.current && dismissRef.current(), 22000 + messageBody.length * 40);
    return () => { clearTimeout(showContainer); clearTimeout(startType); clearInterval(id); clearTimeout(dismissTimer); };
  }, [messageBody]);

  const bg = '#000';
  const accentColor = msg.color || '#1a8fff';
  const textColor = '#fff';
  const iconColor = danger ? 'oklch(0.85 0.2 25)' : accentColor;
  const finalNameColor = danger ? 'oklch(0.85 0.2 25)' : accentColor;
  const sayWord = lang === 'es' ? 'dice' : 'says';

  // Particle System
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!msg.particles || msg.particles === 'none') return;
    const count = msg.particles === 'confetti' ? 40 : 25;
    const p = Array.from({ length: count }, (_, i) => {
      const side = Math.floor(Math.random() * 4); 
      let x, y, vx, vy;
      if (side === 0) { x = Math.random() * 100; y = -5; vx = (Math.random()-0.5)*60; vy = -40 - Math.random()*60; }
      else if (side === 1) { x = 105; y = Math.random() * 100; vx = 40 + Math.random()*60; vy = (Math.random()-0.5)*60; }
      else if (side === 2) { x = Math.random() * 100; y = 105; vx = (Math.random()-0.5)*60; vy = 40 + Math.random()*60; }
      else { x = -5; y = Math.random() * 100; vx = -40 - Math.random()*60; vy = (Math.random()-0.5)*60; }

      return {
        id: i,
        x, y,
        vx, vy,
        s: 3 + Math.random() * 5,
        rot: Math.random() * 360,
        delay: Math.random() * 2,
        dur: 0.8 + Math.random() * 1.2
      };
    });
    setParticles(p);
  }, [msg]);

  const posStyles = {
    top: { top: 40, bottom: 'auto' },
    center: { top: '50%', transform: 'translateY(-50%)', bottom: 'auto' },
    bottom: { bottom: 20, top: 'auto' }
  };
  const sizeStyles = {
    small: { maxWidth: 600, fontSize: 13 },
    medium: { maxWidth: 900, fontSize: 15 },
    large: { maxWidth: 1200, fontSize: 18 }
  };
  const animClass = msg.animation && msg.animation !== 'none' ? `anim-${msg.animation}` : '';

  return (
    <div style={{ position: 'fixed', left: 16, right: 16, zIndex: 1500, display: 'flex', justifyContent: 'center', pointerEvents: 'none', ...posStyles[msg.position || 'bottom'] }}>
      {/* Particles Layer */}
      {particles.map(pt => (
        <div key={pt.id} className={`particle-${msg.particles}`} style={{
          position: 'absolute', left: `${pt.x}%`, top: `${pt.y}%`, width: pt.s, height: pt.s,
          pointerEvents: 'none', zIndex: 1, opacity: 0,
          '--vx': `${pt.vx}px`, '--vy': `${pt.vy}px`, '--rot': `${pt.rot}deg`,
          animation: `p-physics ${pt.dur}s ease-out ${pt.delay}s infinite`,
          filter: 'drop-shadow(0 0 3px currentColor)'
        }} />
      ))}
      
      <div className={animClass} style={{
        background: bg,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: (msg.animation === 'rainbow' && !danger) ? undefined : (danger ? 'oklch(0.6 0.25 25)' : accentColor),
        borderRadius: 'var(--radius-m)',
        padding: '16px 24px',
        boxShadow: (msg.animation === 'rainbow' && !danger) ? undefined : `0 0 30px ${accentColor}44, 0 10px 40px rgba(0,0,0,0.5)`,
        width: '100%',
        ...sizeStyles[msg.size || 'medium'],
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        animation: `${danger ? 'dangerPulse 0.8s ease-in-out infinite, ' : ''}modalIn 280ms ease${(msg.animation && msg.animation !== 'none') ? `, ${msg.animation === 'rainbow' ? 'rainbowBorder 2.5s linear' : 'anim-' + msg.animation + ' ' + (msg.animation === 'shake' ? '0.2s' : msg.animation === 'float' ? '1.5s' : '1s') + ' ease-in-out'} infinite` : ''}`,
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'visible'
      }}>
        {/* Glow effect */}
        <div style={{ position: 'absolute', inset: -2, borderRadius: 'inherit', background: `linear-gradient(45deg, ${accentColor}, transparent, ${accentColor})`, opacity: 0.3, zIndex: -1 }}></div>

        <i className={danger ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info'} style={{ color: iconColor, fontSize: 24, flex: '0 0 auto', filter: `drop-shadow(0 0 8px ${iconColor})` }}></i>
        <div style={{ fontSize: 'inherit', color: textColor, fontFamily: 'var(--font-sans)', lineHeight: 1.5, fontWeight: 500, textAlign: 'left', flex: 1, minWidth: 0 }}>
          <span style={{ color: finalNameColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${finalNameColor}44`, paddingBottom: 2 }}>{msg.who} {sayWord}:</span>{' '}
          <span style={{ display: 'block', marginTop: 4 }}>
            {containerReady && (<>
              {shown}
              {shown.length < messageBody.length && <span style={{ display: 'inline-block', width: 2, height: '1em', background: textColor, marginLeft: 1, verticalAlign: 'middle', animation: 'cursorBlink 0.8s steps(1) infinite' }}></span>}
            </>)}
          </span>
        </div>
        <button 
          onClick={() => onDismiss()}
          style={{ all: 'unset', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.2)' }}
          className="hover-bg-danger"
        >
          <i className="fa-solid fa-xmark" style={{ fontSize: 14 }}></i>
        </button>
      </div>
    </div>
  );
}

function FallingTeethSimulation({ totalGenerators, clickPulse, toothImg }) {
  const containerRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const particlesRef = useRef([]);
  const lastSpawnRef = useRef(performance.now());
  const lastClickPulseRef = useRef(clickPulse);
  const animationRef = useRef(null);
  
  const stateRef = useRef({ totalGenerators, clickPulse, toothImg });
  useEffect(() => {
    stateRef.current = { totalGenerators, clickPulse, toothImg };
  }, [totalGenerators, clickPulse, toothImg]);

  useEffect(() => {
    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.max(0.001, Math.min((now - lastTime) / 1000, 0.1)); 
      lastTime = now;
      
      const width = containerRef.current ? containerRef.current.clientWidth : 300;
      const height = containerRef.current ? containerRef.current.clientHeight : 320;
      
      const st = stateRef.current;
      
      const createTooth = () => ({
        id: Math.random().toString(36),
        x: Math.random() * (width - 30),
        y: -40,
        vx: (Math.random() - 0.5) * 60,
        vy: 50 + Math.random() * 100, 
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 200,
        size: 15 + Math.random() * 25,
        state: 'falling', 
        life: 2 + Math.random() * 2,
        img: st.toothImg
      });

      if (st.clickPulse !== lastClickPulseRef.current) {
        const diff = st.clickPulse - lastClickPulseRef.current;
        lastClickPulseRef.current = st.clickPulse;
        for (let i = 0; i < diff; i++) {
          if (particlesRef.current.length < 400) {
            particlesRef.current.push(createTooth());
          }
        }
      }

      let rate = 0;
      if (st.totalGenerators > 0) {
        rate = (1 / 7) + Math.max(0, st.totalGenerators - 1) * 0.05; 
      }
      
      const spawnInterval = rate > 0 ? 1000 / rate : Infinity;
      
      if (rate > 0 && now - lastSpawnRef.current > spawnInterval) {
        if (particlesRef.current.length < 400) {
          particlesRef.current.push(createTooth());
        }
        lastSpawnRef.current = now;
      }

      let alive = [];
      const gravity = 800; 
      const bounceDamping = 0.5;

      for (let p of particlesRef.current) {
        if (p.state === 'falling') {
          p.vy += gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.rotV * dt;

          if (p.y + p.size > height - 10) { 
            p.y = height - 10 - p.size;
            p.vy = -p.vy * bounceDamping;
            
            if (Math.abs(p.vy) < 50) {
              p.state = 'resting';
              p.vy = 0;
              p.vx = 0;
              p.rotV = 0;
            }
          }
        } else if (p.state === 'resting') {
          p.life -= dt;
        }

        if (p.life > 0) alive.push(p);
      }

      particlesRef.current = alive;
      setParticles([...alive]);
      
      animationRef.current = requestAnimationFrame(tick);
    };
    
    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <img 
          key={p.id} 
          src={p.img || toothImg} 
          style={{ 
            position: 'absolute', 
            left: 0, top: 0, 
            width: p.size, height: p.size, 
            objectFit: 'contain',
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`,
            opacity: p.state === 'resting' ? Math.min(1, p.life) : 1, 
            transition: 'opacity 0.1s'
          }} 
          alt="" 
        />
      ))}
    </div>
  );
}

window.getXPRequired = function(level) {
  if (level <= 0) return 100;
  let req = 100;
  // Mult starts at 1.75 and grows by 0.5 per level
  for (let i = 0; i < level; i++) {
    req *= (1.75 + (i * 0.5));
    if (req > 1e307) return 1e308; // Infinity safety
  }
  return Math.floor(req);
};

function defaultState() {
  return { teeth: 0, totalEarned: 0, totalClicks: 0, goldenClicks: 0, generators: {}, clickUpgrades: {}, achievements: {}, newAchievementIds: {}, storeUpgrades: {}, prestige: 0, prestigeCount: 0, selectedTooth: 0, startedAt: Date.now(), timePlayed: 0, lastTick: Date.now(), feedbackSent: false, feedbackCount: 0, dontShowTourAgain: false, hasSeenTour: false, hasSeenHelpIndicator: false, clinicName: null, level: 0, xp: 0, xpUpgrades: {}, musicSettings: { volume: 0.4, muted: false, playMode: 'shuffle', currentTrackId: null } };
}

function MusicFloatingBtn({ isPlaying, onClick, currentTrack, currentTime, duration, onHover, onLeave, lang }) {
  return (
    <div 
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position: 'fixed',
        bottom: 30, right: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 50,
        cursor: 'pointer'
      }}
    >
      <style>{`
        @keyframes musicWave {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
      `}</style>
      {isPlaying && currentTrack && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--primary-i030)', boxShadow: 'var(--elevation-10)', pointerEvents: 'none', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-i100)', whiteSpace: 'nowrap' }}>
            {currentTrack.title}
          </div>
          <div style={{ width: 1, height: 10, background: 'var(--border-subtle)' }} />
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            -{formatMusicTime(Math.max(0, duration - currentTime))}
          </div>
        </div>
      )}
      <div 
        style={{
          width: 38, height: 38,
          borderRadius: '50%',
          background: isPlaying ? 'var(--primary-i100)' : 'var(--bg-2)',
          border: `2px solid ${isPlaying ? 'transparent' : 'var(--border-subtle)'}`,
          boxShadow: isPlaying ? '0 4px 15px rgba(0, 118, 219, 0.4)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isPlaying ? '#fff' : 'var(--fg-3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = 'var(--primary-i100)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = isPlaying ? 'transparent' : 'var(--border-subtle)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
          {[0.1, 0.4, 0.2, 0.5, 0.3].map((delay, i) => (
            <div key={i} style={{ 
              width: 2, 
              height: isPlaying ? 14 : 2, 
              background: isPlaying ? '#fff' : 'var(--fg-3)', 
              borderRadius: 2,
              opacity: isPlaying ? 1 : 0.6,
              animation: isPlaying ? `musicWave 0.8s ease-in-out infinite ${delay}s` : 'none',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MusicPlayerModal({ 
  onClose, tracks, currentTrack, onSelectTrack,
  isPlaying, onTogglePlay, onStop,
  volume, onChangeVolume,
  muted, onToggleMute,
  playMode, onChangePlayMode,
  currentTime, duration, onSeek,
  soundOn, toggleSound, lang
}) {
  const isShuffle = playMode.includes('shuffle');
  const isLoop = playMode.includes('loop');
  const isStop = playMode === 'stop';
  const trackListRef = React.useRef(null);

  React.useEffect(() => {
    if (trackListRef.current && currentTrack) {
      const el = trackListRef.current.querySelector(`[data-track-id="${currentTrack.id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <Modal onClose={onClose} maxWidth={400}>
      <style>{`
        .music-slider { height: 2px; -webkit-appearance: none; background: var(--border-subtle); border-radius: 1px; outline: none; }
        .music-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: var(--primary-i100); cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
      `}</style>
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="t-heading-s" style={{ margin: 0 }}>{lang === 'es' ? 'Reproductor de Música' : 'Music Player'}</h2>
        <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--fg-3)' }}>
          <i className="fa-solid fa-xmark" style={{ fontSize: 18 }}></i>
        </button>
      </div>
      
      <div style={{ padding: 'var(--spacing-4)', background: 'var(--bg-2)', borderRadius: 'var(--radius-s)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === 'es' ? 'Volumen Música' : 'Music Volume'}</div>
          <button onClick={onToggleMute} style={{ all: 'unset', cursor: 'pointer', color: muted ? 'var(--negative-i100)' : 'var(--fg-2)' }}>
            <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
          </button>
        </div>
        <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={e => onChangeVolume(parseFloat(e.target.value))} className="music-slider" style={{ width: '100%', cursor: 'pointer' }} />
        
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === 'es' ? 'Efectos de Sonido' : 'Sound Effects'}</div>
          <button onClick={toggleSound} style={{ all: 'unset', cursor: 'pointer', color: soundOn ? 'var(--positive-i100)' : 'var(--fg-3)', fontSize: 20 }}>
            <i className={`fa-solid ${soundOn ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => onChangePlayMode('shuffle')} style={{ flex: 1, padding: '8px', background: isShuffle ? 'var(--primary-i010)' : 'var(--bg-2)', border: `1px solid ${isShuffle ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isShuffle ? 'var(--primary-i100)' : 'var(--fg-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'all 150ms' }}>
          <i className="fa-solid fa-shuffle"></i> {lang === 'es' ? 'Aleatorio' : 'Shuffle'}
        </button>
        <button onClick={() => onChangePlayMode('loop')} style={{ flex: 1, padding: '8px', background: isLoop ? 'var(--primary-i010)' : 'var(--bg-2)', border: `1px solid ${isLoop ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isLoop ? 'var(--primary-i100)' : 'var(--fg-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'all 150ms' }}>
          <i className="fa-solid fa-repeat"></i> {lang === 'es' ? 'Bucle' : 'Loop'}
        </button>
        <button onClick={() => onChangePlayMode('stop')} style={{ flex: 1, padding: '8px', background: isStop ? 'var(--primary-i010)' : 'var(--bg-2)', border: `1px solid ${isStop ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isStop ? 'var(--primary-i100)' : 'var(--fg-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'all 150ms' }}>
          <i className="fa-solid fa-ban"></i> {lang === 'es' ? 'Fin' : 'End'}
        </button>
      </div>

      <div ref={trackListRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
        {tracks.map(t => {
          const isCurrent = currentTrack?.id === t.id;
          return (
            <div key={t.id} data-track-id={t.id}
              onClick={() => { if (!isCurrent) onSelectTrack(t); }}
              style={{ background: isCurrent ? 'var(--primary-i005)' : 'transparent', border: `1px solid ${isCurrent ? 'var(--primary-i020)' : 'var(--border-subtle)'}`, borderRadius: 10, padding: '12px 14px', cursor: isCurrent ? 'default' : 'pointer', transition: 'all 150ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCurrent ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={t.cover || 'https://img.icons8.com/color/96/music-record.png'} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover', background: 'var(--bg-3)' }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: isCurrent ? 'var(--primary-i100)' : 'var(--fg-1)' }}>{t.title}</div>
                </div>
                {!isCurrent && <i className="fa-solid fa-play" style={{ fontSize: 10, color: 'var(--fg-3)', opacity: 0.6 }}></i>}
              </div>
              
              {isCurrent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={(e) => { e.stopPropagation(); onTogglePlay(); }} style={{ all: 'unset', cursor: 'pointer', color: 'var(--primary-i100)', width: 14 }}>
                    <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} style={{ fontSize: 14 }}></i>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onStop(); }} style={{ all: 'unset', cursor: 'pointer', color: 'var(--negative-i100)', width: 14 }}>
                    <i className="fa-solid fa-stop" style={{ fontSize: 14 }}></i>
                  </button>
                  <input 
                    type="range" min="0" max={duration || 100} step="0.1" value={currentTime || 0} 
                    onClick={e => e.stopPropagation()}
                    onChange={e => onSeek(parseFloat(e.target.value))} 
                    className="music-slider"
                    style={{ flex: 1, cursor: 'pointer' }} 
                  />
                  <span style={{ fontSize: 11, color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>
                    -{formatMusicTime(Math.max(0, duration - currentTime))}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

const topBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '8px 12px', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', background: 'var(--bg-1)', fontFamily: 'var(--font-sans)' };
const primaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--primary-i100)', color: '#fff', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };
const secondaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--bg-3)', color: 'var(--fg-1)', borderRadius: 'var(--radius-s)', fontWeight: 500, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };
const debugBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '4px 8px', fontSize: 10, fontWeight: 700, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-2)', transition: 'all 100ms' };

function Modal({ children, onClose, maxWidth }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(5,9,13,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeIn 150ms ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-1)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-m)', boxShadow: 'var(--elevation-30)', maxWidth: maxWidth || 420, width: '92%', animation: 'modalIn 200ms ease', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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
  const specialNextRef = useRef(Date.now() + 30000); // first spawn after 30s
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

  useEffect(() => {
    if (audioRef.current && !isMusicPlaying && !musicAttempted.current && !userPausedMusic.current) {
      musicAttempted.current = true;
      audioRef.current.play().then(() => setIsMusicPlaying(true)).catch(e => console.warn('Autoplay blocked:', e));
    }
  }, []);

  useEffect(() => {
    const handleFirstClick = () => {
      if (!userPausedMusic.current && !isMusicPlaying && audioRef.current && audioRef.current.paused && !musicAttempted.current) {
        musicAttempted.current = true;
        audioRef.current.play().then(() => setIsMusicPlaying(true)).catch(e => {});
      }
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, []);
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
    const up = (window.XP_UPGRADES || []).find(u => u.id === id);
    if (!up || state.xpUpgrades[id]) return;
    const cost = up.baseCost * Math.pow(1.5, state.prestigeCount || 0);
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
  const stateRef = useRef(state);stateRef.current = state;
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
  const perSecondRaw = useMemo(() => {
    let v = 0;
    for (const g of window.GENERATORS) {
      let gProd = (state.generators[g.id] || 0) * g.baseProduction;
      if (storeMults.gen[g.id]) gProd *= storeMults.gen[g.id];
      v += gProd;
    }
    return v;
  }, [state.generators, storeMults]);
  const clickBase = useMemo(() => window.computeClickPower(state, perSecondRaw).total, [state.clickUpgrades, state.generators, state.achievements, state.timePlayed, perSecondRaw]);
  const goldenMult = goldenActiveUntil > Date.now() ? 7 : 1;
  const crystalMult = crystalFrenzyUntil > Date.now() ? 5 : 1;
  const globalMult = prestigeMult * achMult * goldenMult * crystalMult * storeMults.global;
  const perClick = clickBase * storeMults.click * globalMult;
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
    return 5_000_000_000_000 * Math.pow(1.25, count);
  }, [state.prestigeCount]);
  const prestigeGain = state.totalEarned >= prestigeReq ? 1 : 0;

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
        let newXP = (s.xp || 0) + (xpPassiveBase + xpFromUpgrades) * dt;
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

        return { ...s, teeth: s.teeth + earned, totalEarned: s.totalEarned + earned, timePlayed: s.timePlayed + dt, lastTick: now, xp: newXP, level: newLevel };
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
  }, [username]);

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

  useEffect(() => {
    const pushScore = () => {
      const s = stateRef.current;
      if (!s) return;
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
    };
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
      setState((s) => {
        const next = { ...s, achievements: { ...s.achievements }, newAchievementIds: { ...(s.newAchievementIds || {}) } };
        for (const a of newUnlocks) {
          next.achievements[a.id] = true;
          next.newAchievementIds[a.id] = true;
        }
        return next;
      });
      const a = newUnlocks[0];setToast(a);setTimeout(() => setToast(null), 3500);
      if (soundRef.current) {window.playTone(660, 0.12, 'triangle', 0.06);setTimeout(() => window.playTone(880, 0.12, 'triangle', 0.06), 100);}
    }
  }, [state.totalClicks, state.totalEarned, state.generators, state.prestige, state.goldenClicks, state.clickUpgrades, state.timePlayed, state.feedbackSent]);

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
          specialNextRef.current = Date.now() + 300000; // 5-min cooldown on timeout
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

      return { ...s, teeth: s.teeth + gain, totalEarned: s.totalEarned + gain, totalClicks: s.totalClicks + 1, maxCPS: Math.max(s.maxCPS || 0, cps), xp: newXP, level: newLevel };
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
    const x = e.clientX - rect.left;const y = e.clientY - rect.top;
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
    specialNextRef.current = now + 300000; // 5-min cooldown
    setState((s) => ({ ...s, goldenClicks: s.goldenClicks + 1 }));
    if (soundRef.current) {window.playTone(880, 0.1, 'triangle', 0.08);setTimeout(() => window.playTone(1320, 0.15, 'triangle', 0.08), 80);}
  }, []);

  // Dismiss special tooth + start 5-min cooldown
  const dismissSpecialTooth = useCallback((id) => {
    if (specialToothRef.current?.id === id) {
      specialToothRef.current = null;
      setSpecialTooth(null);
      specialNextRef.current = Date.now() + 300000; // 5-min cooldown
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
    setState((st) => ({ ...st, teeth: st.teeth + bonus, totalEarned: st.totalEarned + bonus }));
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
    const oldPrestige = stateRef.current?.prestige || 0;
    const newPrestige = oldPrestige + prestigeGain;
    const oldCount = stateRef.current?.prestigeCount || 0;
    const newCount = oldCount + 1;
    // Find newly unlocked stages based on prestige COUNT
    const newlyUnlocked = window.TOOTH_STAGES.filter((s) => s.prestige > 0 && s.prestige > oldCount && s.prestige <= newCount);
    setState((s) => ({ ...defaultState(), prestige: newPrestige, prestigeCount: newCount, selectedTooth: s.selectedTooth || 0, achievements: s.achievements, startedAt: s.startedAt, timePlayed: s.timePlayed, totalClicks: s.totalClicks, goldenClicks: s.goldenClicks, lastTick: Date.now() }));
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
    const nextProduction = g.baseProduction * baseMult;
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

  return (
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
              <span className="t-body-s" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{fmt(perSecond)}/s</span>
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-hand-pointer" style={{ fontSize: 13, color: 'var(--alternative-i100)' }}></i>
            <div>
              <span className="t-mini-caps" style={{ color: 'var(--fg-3)', marginRight: 6 }}>{t.perClick}</span>
              <span className="t-heading-s" style={{ color: 'var(--alternative-i100)', fontVariantNumeric: 'tabular-nums' }}>{fmt(perClick)}</span>
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
                      setState(s => ({ ...s, clinicName: final || null }));
                      // Immediately sync clinic name to cloud
                      setTimeout(() => {
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
                            clinicName: final || null, 
                            level: s.level || 0,
                            banUntil: ban.until,
                            banIndefinite: ban.until === -1
                          });
                        }
                      }, 100);
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
            <div style={{ position: 'relative', width: '100%', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', width: 1200, height: 1200,
                  pointerEvents: 'none', zIndex: 0,
                  background: `repeating-conic-gradient(${sunColor} 0 15deg, transparent 15deg 30deg)`,
                  borderRadius: '50%',
                  opacity: sunOpacity,
                  transition: 'opacity 1.2s ease-out',
                  animation: 'rotateSun 40s linear infinite'
                }} />
                <div 
                  id="main-tooth-target"
                  onMouseDown={(e) => { handleClick(e); setIsMainMouseDown(true); }}
                  onMouseUp={() => setIsMainMouseDown(false)}
                  onMouseLeave={() => setIsMainMouseDown(false)}
                  onTouchStart={(e) => { handleClick(e); setIsMainMouseDown(true); }}
                  onTouchEnd={() => setIsMainMouseDown(false)}
                  style={{ position: 'relative', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', zIndex: 1 }} key={clickPulse}>
                  <img src={currentToothImg} alt="tooth" style={{ width: 260, height: 260, objectFit: 'contain', filter: holdBonusUntil > Date.now() ? 'drop-shadow(0 0 35px oklch(0.7 0.2 320 / 0.8)) saturate(1.4)' : goldenMult > 1 ? 'drop-shadow(0 0 24px #FFC22088) sepia(0.4) saturate(2) hue-rotate(10deg)' : crystalMult > 1 ? 'drop-shadow(0 0 28px oklch(0.7 0.2 210 / 0.85)) saturate(1.3) brightness(1.1)' : 'drop-shadow(0 8px 24px rgba(0,118,219,0.18))', animation: 'toothClick 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                  {floats.map((f) =>
                  <div key={f.id} style={{ position: 'absolute', left: f.x, top: f.y, pointerEvents: 'none', color: '#000000', fontWeight: 900, fontSize: 18, textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 2px 4px rgba(0,0,0,0.2)', animation: 'clickPop 600ms ease-out forwards', fontVariantNumeric: 'tabular-nums', '--tx': `${f.tx}px`, zIndex: 100 }}>+{fmt(f.gain)}</div>
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
              <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4 }}>+{fmt(perClick)} {t.teeth} / click</div>
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
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <div className="t-heading-m">{lang === 'es' ? 'Academia Dental' : 'Dental Academy'}</div>
                <div className="t-body-m" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'Mejora tus conocimientos para subir de nivel más rápido.' : 'Improve your knowledge to level up faster.'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(window.XP_UPGRADES || []).filter(up => (state.prestigeCount || 0) >= up.prestigeReq).slice(0, 50).map(up => {
                  const purchased = state.xpUpgrades[up.id];
                  const cost = up.baseCost * Math.pow(1.5, state.prestigeCount || 0);
                  const canAfford = state.teeth >= cost;
                  return (
                    <div key={up.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: purchased ? 'var(--primary-i005)' : 'var(--bg-2)', border: purchased ? '1px solid var(--primary-i020)' : '1px solid var(--border-subtle)', borderRadius: 10, opacity: !purchased && !canAfford ? 0.7 : 1 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: purchased ? 'var(--primary-i100)' : 'var(--fg-1)' }}>{up.name[lang]}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{up.desc[lang]}</div>
                      </div>
                      <button 
                        disabled={purchased || !canAfford}
                        onClick={() => buyXpUpgrade(up.id)}
                        style={{
                          all: 'unset', boxSizing: 'border-box', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: (purchased || !canAfford) ? 'not-allowed' : 'pointer',
                          background: purchased ? 'var(--positive-i100)' : (canAfford ? 'var(--primary-i100)' : 'var(--bg-3)'),
                          color: (purchased || canAfford) ? '#fff' : 'var(--fg-3)',
                          minWidth: 80, textAlign: 'center'
                        }}
                      >
                        {purchased ? (lang === 'es' ? 'Comprado' : 'Purchased') : fmt(cost)}
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
            { label: t.perSecond, value: fmt(perSecond), color: 'var(--positive-i100)' },
            { label: t.perClick, value: fmt(perClick), color: 'var(--alternative-i100)' },
            { label: lang === 'es' ? 'Bonus global' : 'Global bonus', value: `x${fmt(Math.floor(globalMult * 100) / 100)}`, color: 'var(--warning-i130)' }]
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
      {musicModalOpen && (
        <MusicPlayerModal
          lang={lang}
          onClose={() => setMusicModalOpen(false)}
          tracks={tracks}
          currentTrack={currentTrack}
          onSelectTrack={(t) => { userPausedMusic.current = false; setCurrentTrack(t); setIsMusicPlaying(true); }}
          isPlaying={isMusicPlaying}
          onTogglePlay={() => { userPausedMusic.current = isMusicPlaying; setIsMusicPlaying(!isMusicPlaying); }}
          onStop={handleStop}
          volume={musicVolume}
          onChangeVolume={setMusicVolume}
          muted={musicMuted}
          onToggleMute={() => setMusicMuted(!musicMuted)}
          playMode={playMode}
          onChangePlayMode={handlePlayModeChange}
          audioRef={audioRef}
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
        <window.Modal onClose={() => setShowLevelUpModal(false)} maxWidth={380}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎊</div>
            <div className="t-heading-m" style={{ color: 'var(--primary-i100)' }}>{lang === 'es' ? '¡Nuevo Nivel!' : 'Level Up!'}</div>
            <div className="t-body-m" style={{ marginTop: 8, color: 'var(--fg-2)' }}>
              {lang === 'es' ? `¡Felicidades! Has alcanzado el nivel ${justLeveledTo}.` : `Congratulations! You've reached level ${justLeveledTo}.`}
            </div>
            <div style={{ marginTop: 24, padding: '12px', background: 'var(--primary-i005)', borderRadius: 12, border: '1px solid var(--primary-i020)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-i130)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {lang === 'es' ? 'Próximo Objetivo' : 'Next Goal'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                {fmt(window.getXPRequired(justLeveledTo))} XP
              </div>
            </div>
            <button onClick={() => setShowLevelUpModal(false)} style={{ ...primaryBtnStyle, marginTop: 24, width: '100%' }}>
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


    </div>);
}

function FeedbackModal({ onClose, lang, username, onSuccess, state, setState }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const PROFANITY = ['puto', 'puta', 'mierda', 'carajo', 'fuck', 'shit', 'idiot', 'estupido', 'estupida', 'idiota', 'bitch', 'asshole', 'pendejo', 'pendeja', 'culiao', 'culia', 'maricon', 'zorra', 'bastard', 'crap', 'damn', 'faggot'];

  const count = state.feedbackCount || 0;
  const isLimit = count >= 2;

  const handleSend = () => {
    if (!text.trim()) {
      setError(lang === 'es' ? 'El mensaje es requerido' : 'Message is required');
      return;
    }
    const lower = text.toLowerCase();
    const found = PROFANITY.find(w => lower.includes(w));
    if (found) {
      setError(lang === 'es' ? 'Tu mensaje debe ser corregido ya que contiene lenguaje inapropiado.' : 'Your message must be corrected as it contains inappropriate language.');
      return;
    }
    setLoading(true);
    
    // Direct sending via JSONBin (window.cloudSubmitFeedback)
    window.cloudSubmitFeedback({
      username: username,
      message: text,
      lang: lang
    })
    .then(res => {
      if (res.ok) {
        console.log('Feedback saved to JSONBin');
        // Achievement & Teeth Reward
        setState((prev) => {
          const isFirst = !prev.feedbackSent;
          return { 
            ...prev, 
            feedbackSent: true, 
            feedbackCount: (prev.feedbackCount || 0) + 1,
            teeth: isFirst ? (prev.teeth || 0) + 100 : (prev.teeth || 0), 
            totalEarned: isFirst ? (prev.totalEarned || 0) + 100 : (prev.totalEarned || 0) 
          };
        });
        setLoading(false);
        onSuccess();
      } else {
        throw new Error(res.error);
      }
    })
    .catch(error => {
      console.error('Error saving feedback:', error);
      // Fallback: show success to user anyway to avoid frustration, but log it
      setLoading(false);
      onSuccess();
    });
  };

  return (
    <window.Modal onClose={onClose} maxWidth={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isLimit ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--positive-i010)', color: 'var(--positive-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
              <i className="fa-solid fa-heart"></i>
            </div>
            <div className="t-heading-m" style={{ marginBottom: 12 }}>
              {lang === 'es' ? '¡Tu opinión es invaluable!' : 'Your feedback is invaluable!'}
            </div>
            <div className="t-body-m" style={{ color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 20 }}>
              {lang === 'es' 
                ? '¡Muchas gracias! Ya hemos recibido tus dos comentarios y son sumamente valiosos para nosotros. Por ahora no es necesario que envíes más, ¡pero apreciamos enormemente tu compromiso con la consulta!'
                : 'Thank you so much! We have already received your two messages and they are extremely valuable to us. For now, it is not necessary for you to send more, but we truly appreciate your commitment to our practice!'}
            </div>
            <button onClick={onClose} className="t-heading-xs" style={{ ...primaryBtnStyle, width: '100%' }}>
              {lang === 'es' ? 'Entendido, ¡gracias!' : 'Got it, thanks!'}
            </button>
          </div>
        ) : (
          <>
            <div>
              <div className="t-heading-m">{lang === 'es' ? 'Enviar Feedback' : 'Send Feedback'}</div>
              <div className="t-body-s" style={{ color: 'var(--fg-3)', marginTop: 4 }}>
                {lang === 'es' ? 'Tu opinión nos ayuda a mejorar la consulta.' : 'Your feedback helps us improve the practice.'}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                value={text}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setText(e.target.value);
                    setError('');
                  }
                }}
                placeholder={lang === 'es' ? 'Escribe aquí tu feedback...' : 'Type your feedback here...'}
                style={{
                  width: '100%', height: 120, padding: 12, borderRadius: 8,
                  border: `1.5px solid ${error ? 'var(--negative-i100)' : 'var(--border-subtle)'}`,
                  background: 'var(--bg-2)', color: 'var(--fg-1)',
                  fontFamily: 'inherit', fontSize: 14, resize: 'none', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: text.length >= 190 ? 'var(--negative-i100)' : 'var(--fg-4)' }}>
                {text.length}/200
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--negative-i100)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                <i className="fa-solid fa-circle-exclamation"></i> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} className="t-heading-xs" style={{ ...secondaryBtnStyle, flex: 1 }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button 
                onClick={handleSend} 
                disabled={loading}
                className="t-heading-xs" 
                style={{ ...primaryBtnStyle, flex: 2, opacity: loading ? 0.7 : 1, position: 'relative' }}
              >
                {loading ? (
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                ) : (
                  lang === 'es' ? 'Enviar Mensaje' : 'Send Message'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </window.Modal>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ lang, onLangChange, onEnterGame, onBack }) {
  const [adminUsers, setAdminUsers] = useState([ADMIN_NAME]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [publicUsers, setPublicUsers] = useState(() => loadUsers());
  const [globalUsers, setGlobalUsers] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [newAdminName, setNewAdminName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [newPublicName, setNewPublicName] = useState('');
  const [publicNameErr, setPublicNameErr] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [customMessages, setCustomMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [isSavingMessages, setIsSavingMessages] = useState(false);
  const [adminTab, setAdminTab] = useState('accounts'); // 'accounts', 'leaderboard', 'feedback', 'messages'
  const [playerSort, setPlayerSort] = useState('prestige'); // 'prestige', 'level', 'teeth'
  const [playerFilter, setPlayerFilter] = useState('all'); // 'all', 'banned'
  const [cpsThreshold, setCpsThreshold] = useState(() => {
    try { return parseInt(localStorage.getItem('admin_cps_threshold')) || 20; } catch(e) { return 20; }
  });
  const [globalTooltip, setGlobalTooltip] = useState(null);
  const fmt = window.formatNum;

  const [newMsgName, setNewMsgName] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [newMsgMilestone, setNewMsgMilestone] = useState(1);
  const [newMsgColor, setNewMsgColor] = useState('#1a8fff');
  const [newMsgPos, setNewMsgPos] = useState('bottom'); // top, center, bottom
  const [newMsgSize, setNewMsgSize] = useState('medium'); // small, medium, large
  const [newMsgAnim, setNewMsgAnim] = useState('none'); // none, pulse, shake, float
  const [newMsgParticles, setNewMsgParticles] = useState('none'); // none, stars, teeth, fire, confetti
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [msgFilter, setMsgFilter] = useState('all');
  const [msgToDelete, setMsgToDelete] = useState(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeLoading, setWipeLoading] = useState(false);
  const [successNote, setSuccessNote] = useState('');
  const [previewMsg, setPreviewMsg] = useState(null);

  const MILESTONE_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300, 360];

  // Load everything on mount
  useEffect(() => {
    // 1. Admin accounts
    window.cloudLoadAdminAccounts().then(res => {
      if (res.ok) setAdminUsers(res.accounts);
      setAdminLoading(false);
    });
    // 2. Global leaderboard users
    window.cloudFetchLeaderboard().then(res => {
      if (res.ok) setGlobalUsers(res.scores || []);
      setGlobalLoading(false);
    });
    // 3. Feedback
    window.cloudFetchFeedback().then(res => {
      if (res.ok) setFeedback(res.feedback || []);
      setFeedbackLoading(false);
    });
    // 4. Custom Messages
    window.cloudLoadCustomMessages().then(res => {
      let msgs = res.ok ? res.messages : [];
      // Initial default messages if empty
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
        // Save defaults if we seeded
        window.cloudSaveCustomMessages(msgs);
      }
      setCustomMessages(msgs);
      setMessagesLoading(false);
    });
  }, []);

  const saveMessagesToCloud = (updatedList) => {
    setIsSavingMessages(true);
    window.cloudSaveCustomMessages(updatedList).then(res => {
      setIsSavingMessages(false);
      if (!res.ok) alert('Error guardando mensajes en la nube: ' + res.error);
    });
  };

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
    setAdminUsers(updated);
    window.cloudSaveAdminAccounts && window.cloudSaveAdminAccounts(updated);
    setNewAdminName('');
    setNameErr('');
  };

  const handleDelete = ({ name, type }) => {
    // 1. Local cleanup
    deleteUserSave(name);
    
    // 2. Cloud cleanup (Leaderboard)
    window.cloudDeleteScore && window.cloudDeleteScore(name);
    
    // 3. UI State cleanup
    if (type === 'admin') {
      const updated = adminUsers.filter((u) => u !== name);
      setAdminUsers(updated);
      window.cloudSaveAdminAccounts && window.cloudSaveAdminAccounts(updated);
    } else if (type === 'public') {
      const updated = publicUsers.filter((u) => u !== name);
      saveUsers(updated);
      setPublicUsers(updated);
      if (localStorage.getItem(DEVICE_USER_KEY) === name) localStorage.removeItem(DEVICE_USER_KEY);
    } else if (type === 'global') {
      setGlobalUsers(prev => prev.filter(u => u.name !== name));
    }
    
    setDeleteTarget(null);
  };

  const handleAddPublic = (e) => {
    e && e.preventDefault();
    const cleaned = (newPublicName || '').trim().slice(0, 24);
    if (!cleaned) return;
    const reserved = (ADMIN_NAME || 'James').toLowerCase();
    if (cleaned.toLowerCase() === reserved) {
      setPublicNameErr(lang === 'es' ? 'Ese nombre está reservado' : 'That name is reserved'); return;
    }
    if ([...adminUsers, ...publicUsers].some(u => u.toLowerCase() === cleaned.toLowerCase())) {
      setPublicNameErr(lang === 'es' ? 'Ya existe ese nombre' : 'Name already exists'); return;
    }
    const updated = [...publicUsers, cleaned];
    saveUsers(updated);
    setPublicUsers(updated);
    setNewPublicName('');
    setPublicNameErr('');
  };

  const handleWipeAll = async () => {
    setWipeLoading(true);
    const res = await window.cloudClearAllPlayers();
    if (res.ok) {
      resetAllProgress();
      setGlobalUsers([]);
      setPublicUsers([]);
      setFeedback([]);
      setCustomMessages([]);
      setWipeLoading(false);
      setShowWipeConfirm(false);
      alert(lang === 'es' ? '¡Wipe total completado!' : 'Total wipe completed!');
    } else {
      setWipeLoading(false);
      alert('Error: ' + res.error);
    }
  };

  const handleResetAll = async () => {
    setResetLoading(true);
    resetAllProgress();
    setGlobalUsers([]);
    setPublicUsers([]);
    await new Promise((r) => setTimeout(r, 900));
    setResetLoading(false); setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
    setShowResetConfirm(false);
  };

  const UserRow = ({ name, type }) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f4f8fc', borderRadius: 10, border: '1px solid rgba(100,160,230,0.2)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: type === 'admin' ? 'rgba(26,143,255,0.15)' : 'rgba(100,160,230,0.15)', color: type === 'admin' ? '#1a8fff' : '#5a8aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {(name[0] || '?').toUpperCase()}
      </div>
      <span style={{ flex: 1, fontSize: 15, color: '#1a3a5a', fontWeight: 600 }}>{name}</span>
      <button onClick={() => onEnterGame(name)} className="app-btn" style={{ ...btn, padding: '6px 12px', background: 'rgba(26,143,255,0.1)', color: '#1a8fff', fontSize: 12, border: '1px solid rgba(26,143,255,0.2)', borderRadius: 8 }}>
        <i className="fa-solid fa-play"></i>
        {lang === 'es' ? 'Jugar' : 'Play'}
      </button>
      <button onClick={() => setDeleteTarget({ name, type })} className="app-btn" style={{ ...btn, padding: '6px 10px', background: 'rgba(220,50,50,0.08)', color: '#c33', fontSize: 12, border: '1px solid rgba(220,50,50,0.2)', borderRadius: 8 }}>
        <i className="fa-solid fa-trash"></i>
      </button>
    </div>;



  return (
    <div style={{ minHeight: '100vh', background: '#e8f2fb', fontFamily: "'PixelifySans', var(--font-sans)", position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'url(uploads/background-e5bd6167.png)', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none', opacity: 0.45 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', padding: '32px 20px 56px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} className="app-btn" style={{ ...btn, padding: '8px 12px', background: 'rgba(255,255,255,0.8)', color: '#4a6a8a', fontSize: 13, border: '1px solid rgba(100,160,230,0.35)' }}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#1a8fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a3a5a', lineHeight: 1 }}>Panel Admin</div>

          </div>
          <button onClick={onLangChange} className="app-btn" style={{ ...btn, padding: '8px 12px', background: 'rgba(255,255,255,0.8)', color: '#4a6a8a', fontSize: 13, border: '1px solid rgba(100,160,230,0.35)' }}>
            {lang === 'es' ? '🇬🇧' : '🇪🇸'}
          </button>
        </div>

        {/* Sub Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(255,255,255,0.5)', padding: 4, borderRadius: 12, border: '1px solid rgba(100,160,230,0.2)' }}>
          {[
            { id: 'accounts', label: 'Admin', icon: 'fa-user-shield' },
            { id: 'leaderboard', label: lang === 'es' ? 'Jugadores' : 'Players', icon: 'fa-users' },
            { id: 'feedback', label: 'Feedback', icon: 'fa-comments' },
            { id: 'messages', label: 'Mensajes', icon: 'fa-bullhorn' },
            { id: 'danger', label: lang === 'es' ? 'Zona Peligrosa' : 'Danger Zone', icon: 'fa-triangle-exclamation' },
          ].map(t => (
            <button key={t.id} onClick={() => { window.playClickSound && window.playClickSound(); setAdminTab(t.id); }} className="app-btn" style={{
              ...btn, flex: 1, padding: '8px 12px', fontSize: 11, borderRadius: 10,
              background: adminTab === t.id ? (t.id === 'danger' ? '#e11d24' : '#1a8fff') : 'transparent',
              color: adminTab === t.id ? '#fff' : (t.id === 'danger' ? '#e11d24' : '#4a6a8a'),
              border: 'none', boxShadow: adminTab === t.id ? `0 4px 12px ${t.id === 'danger' ? 'rgba(225,29,36,0.25)' : 'rgba(26,143,255,0.25)'}` : 'none'
            }}>
              <i className={`fa-solid ${t.icon}`} style={{ fontSize: 10 }}></i>
              {t.label}
            </button>
          ))}
        </div>

        {adminTab === 'accounts' && (
          <>
            {/* Admin's own accounts */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <i className="fa-solid fa-user-shield" style={{ color: '#1a8fff', fontSize: 15 }}></i>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
              {lang === 'es' ? 'Mis cuentas' : 'My accounts'}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({adminUsers.length})</span>
            </span>
          </div>

          {adminUsers.length > 0 &&
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {adminUsers.map((u) => <UserRow key={u} name={u} type="admin" />)}
            </div>
          }
          {adminUsers.length === 0 &&
          <div style={{ textAlign: 'center', padding: '10px 0 4px', color: '#8aaacc', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
              {lang === 'es' ? 'Sin cuentas aún' : 'No accounts yet'}
            </div>
          }
        </div>

        {/* CPS Threshold Config */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <i className="fa-solid fa-gauge-high" style={{ color: '#ff9800', fontSize: 15 }}></i>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
              {lang === 'es' ? 'Límite de CPS (Clicks por Segundo)' : 'CPS Limit (Clicks per Second)'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#5a8aaa', marginBottom: 12, lineHeight: 1.5 }}>
            {lang === 'es' 
              ? `Cuando un jugador alcance ${cpsThreshold} CPS, se activará la advertencia o ban por uso de macros.`
              : `When a player reaches ${cpsThreshold} CPS, the macro warning or ban will be triggered.`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="range" min="5" max="50" step="1" value={cpsThreshold}
              onChange={e => {
                const v = parseInt(e.target.value);
                setCpsThreshold(v);
                try { localStorage.setItem('admin_cps_threshold', v); } catch(e) {}
              }}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            <div style={{ minWidth: 60, textAlign: 'center', padding: '6px 12px', background: cpsThreshold <= 10 ? 'rgba(220,50,50,0.1)' : cpsThreshold <= 25 ? 'rgba(255,152,0,0.1)' : 'rgba(76,175,80,0.1)', border: `1px solid ${cpsThreshold <= 10 ? 'rgba(220,50,50,0.3)' : cpsThreshold <= 25 ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)'}`, borderRadius: 8, fontWeight: 700, fontSize: 16, color: cpsThreshold <= 10 ? '#c33' : cpsThreshold <= 25 ? '#e68a00' : '#388e3c' }}>
              {cpsThreshold}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8aaacc', marginTop: 6 }}>
            <span>{lang === 'es' ? 'Más estricto' : 'Stricter'}</span>
            <span>{lang === 'es' ? 'Más permisivo' : 'More permissive'}</span>
          </div>
        </div>

          </>
        )}

        {adminTab === 'leaderboard' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <i className="fa-solid fa-users" style={{ color: 'var(--primary-i100)', fontSize: 15 }}></i>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
                {lang === 'es' ? 'Todos los Jugadores' : 'All Players'}
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({globalUsers.filter(u => u.name.toLowerCase() !== 'james').length})</span>
              </span>
              {globalLoading && <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 12, color: 'var(--primary-i050)', marginLeft: 'auto' }}></i>}
            </div>

            {/* Filters & Sort */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.6)', padding: 3, borderRadius: 8, border: '1px solid rgba(100,160,230,0.15)' }}>
                {[{ id: 'all', label: lang === 'es' ? 'Todos' : 'All' }, { id: 'banned', label: lang === 'es' ? 'Banneados' : 'Banned' }].map(f => (
                  <button key={f.id} onClick={() => setPlayerFilter(f.id)} className="app-btn" style={{ ...btn, padding: '4px 10px', fontSize: 10, borderRadius: 6, background: playerFilter === f.id ? '#1a8fff' : 'transparent', color: playerFilter === f.id ? '#fff' : '#4a6a8a', border: 'none' }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.6)', padding: 3, borderRadius: 8, border: '1px solid rgba(100,160,230,0.15)' }}>
                {[{ id: 'prestige', label: lang === 'es' ? 'Prestigio' : 'Prestige' }, { id: 'level', label: lang === 'es' ? 'Nivel' : 'Level' }, { id: 'teeth', label: lang === 'es' ? 'Dientes' : 'Teeth' }].map(s => (
                  <button key={s.id} onClick={() => setPlayerSort(s.id)} className="app-btn" style={{ ...btn, padding: '4px 10px', fontSize: 10, borderRadius: 6, background: playerSort === s.id ? '#1a8fff' : 'transparent', color: playerSort === s.id ? '#fff' : '#4a6a8a', border: 'none' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            
            {(() => {
              let players = globalUsers.filter(u => u.name.toLowerCase() !== 'james').map(u => {
                const localBan = window.AntiCheat.checkBanStatus(u.name);
                const isBanned = localBan.isBanned || (u.banIndefinite === true) || (u.banUntil && u.banUntil > Date.now());
                const indefinite = localBan.indefinite || (u.banIndefinite === true);
                const until = localBan.until || u.banUntil || 0;
                return { ...u, banStatus: { isBanned, indefinite, until } };
              });
              if (playerFilter === 'banned') players = players.filter(u => u.banStatus.isBanned);
              players.sort((a, b) => {
                if (playerSort === 'level') return (b.level || 0) - (a.level || 0);
                if (playerSort === 'teeth') return (b.totalEarned || 0) - (a.totalEarned || 0);
                return (b.prestigeCount || b.prestige || 0) - (a.prestigeCount || a.prestige || 0);
              });
              
              if (players.length === 0) return (
                <div style={{ textAlign: 'center', padding: '12px 0', color: '#8aaacc', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
                  {globalLoading ? (lang === 'es' ? 'Cargando base de datos...' : 'Loading database...') : (playerFilter === 'banned' ? (lang === 'es' ? 'No hay jugadores banneados' : 'No banned players') : (lang === 'es' ? 'No hay jugadores en el ranking' : 'No players in leaderboard'))}
                </div>
              );
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                  {players.map((u) => (
                    <div key={'global-' + u.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: u.banStatus.isBanned ? 'rgba(220,50,50,0.06)' : '#f0f7ff', borderRadius: 10, border: `1px solid ${u.banStatus.isBanned ? 'rgba(220,50,50,0.2)' : 'rgba(0,118,219,0.15)'}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.banStatus.isBanned ? '#e55' : 'var(--primary-i100)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {(u.name[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 14, color: '#1a3a5a', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                          {u.banStatus.isBanned && <span style={{ fontSize: 9, padding: '1px 6px', background: '#e55', color: '#fff', borderRadius: 4, fontWeight: 700 }}>BAN</span>}
                        </div>
                        <div style={{ fontSize: 10, color: '#7a9abf', fontWeight: 500, marginTop: 1 }}>
                          <i className="fa-solid fa-hospital" style={{ marginRight: 4, fontSize: 8 }}></i>
                          {u.clinicName || (lang === 'es' ? `Clínica de ${u.name}` : `${u.name}'s Clinic`)}
                        </div>
                        <div style={{ fontSize: 10, color: '#5a8aaa', fontWeight: 600, marginTop: 2 }}>
                          {window.formatNum(u.totalEarned)} {lang === 'es' ? 'dientes' : 'teeth'} · {lang === 'es' ? 'Prestigio' : 'Prestige'} {u.prestigeCount || u.prestige || 0} · Lv.{u.level || 0}
                        </div>
                        {u.banStatus.isBanned && (
                          <div style={{ fontSize: 10, color: '#c33', fontWeight: 600, marginTop: 2 }}>
                            <i className="fa-solid fa-clock" style={{ marginRight: 4 }}></i>
                            {u.banStatus.indefinite 
                              ? (lang === 'es' ? 'Ban permanente' : 'Permanent ban')
                              : (lang === 'es' ? `Baneado hasta ${new Date(u.banStatus.until).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}` : `Banned until ${new Date(u.banStatus.until).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {u.banStatus.isBanned && (
                          <button 
                            onClick={() => setRestoreTarget(u.name)}
                            onMouseEnter={e => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'Restaurar jugador' : 'Restore player', pos: { x: rect.left + rect.width / 2, y: rect.top } });
                            }}
                            onMouseLeave={() => setGlobalTooltip(null)}
                            className="app-btn" style={{ ...btn, padding: '6px 10px', background: 'rgba(76,175,80,0.1)', color: '#388e3c', fontSize: 12, border: '1px solid rgba(76,175,80,0.25)', borderRadius: 8 }}
                          >
                            <i className="fa-solid fa-user-check"></i>
                          </button>
                        )}
                        <button 
                          onClick={() => setDeleteTarget({ name: u.name, type: 'global' })}
                          onMouseEnter={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setGlobalTooltip({ type: 'text', text: lang === 'es' ? 'Eliminar jugador' : 'Delete player', pos: { x: rect.left + rect.width / 2, y: rect.top } });
                          }}
                          onMouseLeave={() => setGlobalTooltip(null)}
                          className="app-btn" style={{ ...btn, padding: '6px 10px', background: 'rgba(220,50,50,0.1)', color: '#c33', fontSize: 12, border: '1px solid rgba(220,50,50,0.25)', borderRadius: 8 }}
                        >
                          <i className="fa-solid fa-user-slash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {adminTab === 'feedback' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <i className="fa-solid fa-comments" style={{ color: 'var(--alternative-i100)', fontSize: 15 }}></i>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
                {lang === 'es' ? 'Mensajes de Jugadores' : 'Player Feedback'}
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({feedback.length})</span>
              </span>
              {feedback.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm(lang === 'es' ? '¿ESTÁS SEGURO? Se borrarán TODOS los mensajes permanentemente.' : 'ARE YOU SURE? ALL messages will be permanently deleted.')) {
                      window.cloudClearAllFeedback().then(res => {
                        if (res.ok) setFeedback([]);
                      });
                    }
                  }}
                  className="app-btn"
                  style={{ ...btn, padding: '4px 10px', background: 'rgba(220,50,50,0.1)', color: '#c33', fontSize: 11, border: '1px solid rgba(220,50,50,0.2)', borderRadius: 8, marginLeft: 'auto' }}
                >
                  <i className="fa-solid fa-dumpster-fire" style={{ marginRight: 6 }}></i>
                  {lang === 'es' ? 'Borrar todo' : 'Clear all'}
                </button>
              )}
              {feedbackLoading && <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 12, color: 'var(--alternative-i050)', marginLeft: feedback.length > 0 ? 8 : 'auto' }}></i>}
            </div>
            
            {feedback.length === 0 ?
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8aaacc', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
                {feedbackLoading ? (lang === 'es' ? 'Cargando mensajes...' : 'Loading messages...') : (lang === 'es' ? 'No hay mensajes aún' : 'No messages yet')}
              </div> :
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {feedback.map((f, idx) => (
                  <div key={'fb-' + idx} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid rgba(100,160,230,0.15)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-i100)' }}>
                        <i className="fa-solid fa-user" style={{ marginRight: 6, fontSize: 11 }}></i>
                        {f.username}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--fg-4)', fontFamily: 'var(--font-sans)' }}>
                        {new Date(f.createdAt).toLocaleString(lang === 'es' ? 'es-AR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.4, fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap' }}>
                      {f.message}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button 
                        onClick={() => {
                          if (confirm(lang === 'es' ? '¿Eliminar este mensaje?' : 'Delete this message?')) {
                            window.cloudDeleteFeedback(f.createdAt).then(res => {
                              if (res.ok) setFeedback(prev => prev.filter(fb => fb.createdAt !== f.createdAt));
                            });
                          }
                        }}
                        style={{ ...btn, padding: '4px 8px', background: 'rgba(220,50,50,0.08)', color: '#c33', fontSize: 11, border: '1px solid rgba(220,50,50,0.15)', borderRadius: 6 }}
                      >
                        <i className="fa-solid fa-trash" style={{ marginRight: 4 }}></i>
                        {lang === 'es' ? 'Borrar' : 'Delete'}
                      </button>
                    </div>
                    {f.lang && (
                      <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.15, fontSize: 14 }}>
                        {f.lang === 'es' ? '🇦🇷' : '🇺🇸'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {adminTab === 'messages' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <i className="fa-solid fa-bullhorn" style={{ color: '#ff9800', fontSize: 15 }}></i>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
                {lang === 'es' ? 'Mensajes por Tiempo de Juego' : 'Playtime Milestone Messages'}
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({customMessages.length})</span>
              </span>
              {successNote && <span style={{ fontSize: 11, color: '#2ecc71', fontWeight: 700, marginLeft: 12, animation: 'fadeIn 0.3s' }}><i className="fa-solid fa-check-circle"></i> {successNote}</span>}
              {(messagesLoading || isSavingMessages) && <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 12, color: '#ff9800', marginLeft: 'auto' }}></i>}
              {isSavingMessages && <span style={{ fontSize: 10, color: '#ff9800', marginLeft: 8 }}>{lang === 'es' ? 'Guardando...' : 'Saving...'}</span>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button 
                onClick={() => { setEditingMsg(null); setShowCreateModal(true); }}
                className="app-btn"
                style={{ ...btn, flex: 1, height: 44, background: '#1a8fff', color: '#fff', boxShadow: '0 4px 12px rgba(26,143,255,0.2)', fontSize: 14 }}
              >
                <i className="fa-solid fa-plus"></i> {lang === 'es' ? 'Nuevo mensaje' : 'New message'}
              </button>
              <select 
                value={msgFilter}
                onChange={e => setMsgFilter(e.target.value)}
                className="app-select"
                style={{ width: 120 }}
              >
                <option value="all">{lang === 'es' ? 'Todos' : 'All'}</option>
                <option value="shown">{lang === 'es' ? 'Ya mostrados' : 'Shown'}</option>
                <option value="pending">{lang === 'es' ? 'Pendientes' : 'Pending'}</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...customMessages]
                .filter(m => {
                  const currentT = window.__timePlayed || 0;
                  if (msgFilter === 'shown') return m.milestone <= currentT;
                  if (msgFilter === 'pending') return m.milestone > currentT;
                  return true;
                })
                .sort((a, b) => a.milestone - b.milestone)
                .map(m => (
                <div key={m.id} style={{ padding: '14px', background: '#fff', borderRadius: 12, border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: m.color || '#1a8fff', boxShadow: `0 0 8px ${m.color || '#1a8fff'}44` }}></div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#2d3748' }}>{m.who}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', background: '#f7fafc', padding: '3px 10px', borderRadius: 20 }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: 5 }}></i>
                      {lang === 'es' ? `Al minuto ${m.milestone}` : `At minute ${m.milestone}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.5, fontStyle: 'italic', background: '#fdfdfd', padding: '10px 14px', borderRadius: 10, borderLeft: `3px solid ${m.color || '#1a8fff'}` }}>
                    "{m.text}"
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 6, background: '#f7fafc', padding: '4px 8px', borderRadius: 6 }}>
                        <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 10 }}></i>
                        {m.animation || 'none'}
                      </div>
                      <div style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 6, background: '#f7fafc', padding: '4px 8px', borderRadius: 6 }}>
                        <i className="fa-solid fa-sparkles" style={{ fontSize: 10 }}></i>
                        {m.particles || 'none'}
                      </div>
                      <div style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 6, background: '#f7fafc', padding: '4px 8px', borderRadius: 6 }}>
                        <i className="fa-solid fa-up-down-left-right" style={{ fontSize: 10 }}></i>
                        {m.position} / {m.size}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <button 
                        onClick={() => setPreviewMsg({ ...m, es: m.text, en: m.text })} 
                        className="app-btn"
                        style={{ all: 'unset', color: '#ff9800', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                      >
                        <i className="fa-solid fa-eye"></i> {lang === 'es' ? 'Previsualizar' : 'Preview'}
                      </button>
                      <button onClick={() => setEditingMsg(m)} className="app-btn" style={{ all: 'unset', color: '#1a8fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        <i className="fa-solid fa-pen-to-square"></i> {lang === 'es' ? 'Editar' : 'Edit'}
                      </button>
                      <button onClick={() => setMsgToDelete(m)} className="app-btn" style={{ all: 'unset', color: '#e53e3e', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        <i className="fa-solid fa-trash"></i> {lang === 'es' ? 'Borrar' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {customMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0', fontStyle: 'italic', fontSize: 14 }}>
                  {lang === 'es' ? 'No hay mensajes creados' : 'No messages created'}
                </div>
              )}
            </div>
          </div>
        )}

        {adminTab === 'danger' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#e11d24', fontSize: 15 }}></i>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#7a1a1a' }}>{lang === 'es' ? 'Zona Peligrosa' : 'Danger Zone'}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', padding: 16, borderRadius: 12 }}>
                <div style={{ fontWeight: 700, color: '#c53030', fontSize: 14, marginBottom: 4 }}>{lang === 'es' ? 'Resetear progreso del juego' : 'Reset game progress'}</div>
                <div style={{ fontSize: 12, color: '#7b2d2d', lineHeight: 1.5, marginBottom: 14 }}>
                  {lang === 'es' ? 'Borra el progreso de todos los jugadores y el ranking global. Las cuentas se mantienen.' : 'Wipes all player progress and global leaderboard. Accounts are preserved.'}
                </div>
                <button onClick={() => setShowResetConfirm(true)} className="app-btn" style={{ ...btn, width: '100%', height: 40, background: '#e11d24', color: '#fff' }}>
                  <i className="fa-solid fa-rotate-left"></i> {lang === 'es' ? 'Resetear Progreso' : 'Reset Progress'}
                </button>
                {resetDone && <div style={{ marginTop: 8, fontSize: 12, color: '#2f855a', textAlign: 'center' }}>{lang === 'es' ? '¡Reset completado!' : 'Reset complete!'}</div>}
              </div>

              <div style={{ background: '#2d3748', border: '1px solid #1a202c', padding: 16, borderRadius: 12 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 4 }}>{lang === 'es' ? 'Wipe Total (Eliminar todo)' : 'Total Wipe (Delete everything)'}</div>
                <div style={{ fontSize: 12, color: '#cbd5e0', lineHeight: 1.5, marginBottom: 14 }}>
                  {lang === 'es' ? '¡ACCIÓN IRREVERSIBLE! Elimina todos los jugadores, cuentas, mensajes y feedback de la base de datos.' : 'IRREVERSIBLE! Deletes all players, accounts, messages, and feedback from the database.'}
                </div>
                <button onClick={() => setShowWipeConfirm(true)} className="app-btn" style={{ ...btn, width: '100%', height: 40, background: '#000', color: '#fff', border: '1px solid #4a5568' }}>
                  <i className="fa-solid fa-skull-crossbones"></i> {lang === 'es' ? 'EJECUTAR WIPE TOTAL' : 'EXECUTE TOTAL WIPE'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- INDEPENDENT MODALS (TOP LEVEL) --- */}

      {/* Create/Edit Message Modal */}
      {(showCreateModal || editingMsg) && (
        <Modal onClose={() => { setShowCreateModal(false); setEditingMsg(null); }} maxWidth={550}>
          <div style={{ padding: '4px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', color: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-bullhorn"></i>
              </div>
              {editingMsg ? (lang === 'es' ? 'Editar mensaje' : 'Edit message') : (lang === 'es' ? 'Crear nuevo mensaje' : 'Create new message')}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Nombre del Emisor' : 'Sender Name'}</div>
                <input 
                  type="text" 
                  className="app-input"
                  placeholder={lang === 'es' ? 'ej. Cris' : 'e.g. Cris'}
                  value={editingMsg ? editingMsg.who : newMsgName}
                  onChange={e => editingMsg ? setEditingMsg({...editingMsg, who: e.target.value}) : setNewMsgName(e.target.value)}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Contenido del Mensaje' : 'Message Content'}</div>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    className="app-input app-textarea"
                    placeholder={lang === 'es' ? 'Escribe algo sarcástico...' : 'Write something sarcastic...'}
                    maxLength={100}
                    value={editingMsg ? editingMsg.text : newMsgText}
                    onChange={e => editingMsg ? setEditingMsg({...editingMsg, text: e.target.value}) : setNewMsgText(e.target.value)}
                  />
                  <div style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 10, color: (editingMsg ? editingMsg.text.length : newMsgText.length) >= 100 ? '#e53e3e' : '#a0aec0', fontWeight: 700 }}>
                    {(editingMsg ? editingMsg.text.length : newMsgText.length)}/100
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Minuto de juego' : 'Playtime Minute'}</div>
                  <input 
                    type="number" 
                    min={1}
                    className="app-input"
                    value={editingMsg ? editingMsg.milestone : newMsgMilestone}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      editingMsg ? setEditingMsg({...editingMsg, milestone: val}) : setNewMsgMilestone(val);
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Color del Nombre' : 'Name Color'}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={editingMsg ? editingMsg.color : newMsgColor} 
                      onChange={e => editingMsg ? setEditingMsg({...editingMsg, color: e.target.value}) : setNewMsgColor(e.target.value)} 
                      style={{ width: 36, height: 36, border: '2px solid #e2e8f0', borderRadius: '50%', cursor: 'pointer', background: '#fff', overflow: 'hidden', padding: 0 }} 
                    />
                    <div style={{ fontSize: 13, color: '#1a3a5a', fontWeight: 700, fontFamily: 'monospace', background: '#f1f5f9', padding: '6px 10px', borderRadius: 10 }}>{editingMsg ? editingMsg.color : newMsgColor}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Posición y Tamaño' : 'Pos & Size'}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="app-select" style={{ flex: 1 }} value={editingMsg ? editingMsg.position : newMsgPos} onChange={e => editingMsg ? setEditingMsg({...editingMsg, position: e.target.value}) : setNewMsgPos(e.target.value)}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                    <select className="app-select" style={{ flex: 1 }} value={editingMsg ? editingMsg.size : newMsgSize} onChange={e => editingMsg ? setEditingMsg({...editingMsg, size: e.target.value}) : setNewMsgSize(e.target.value)}>
                      <option value="small">S</option>
                      <option value="medium">M</option>
                      <option value="large">L</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Efecto y Partículas' : 'Effect & Particles'}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="app-select" style={{ flex: 1 }} value={editingMsg ? editingMsg.animation : newMsgAnim} onChange={e => editingMsg ? setEditingMsg({...editingMsg, animation: e.target.value}) : setNewMsgAnim(e.target.value)}>
                      <option value="none">-</option>
                      <option value="pulse">Pulse 💓</option>
                      <option value="shake">Shake 🫨</option>
                      <option value="float">Float ☁️</option>
                      <option value="rainbow">Rainbow 🌈</option>
                    </select>
                    <select className="app-select" style={{ flex: 1 }} value={editingMsg ? editingMsg.particles : newMsgParticles} onChange={e => editingMsg ? setEditingMsg({...editingMsg, particles: e.target.value}) : setNewMsgParticles(e.target.value)}>
                      <option value="none">-</option>
                      <option value="stars">Stars ✨</option>
                      <option value="teeth">Teeth 🦷</option>
                      <option value="fire">Fire 🔥</option>
                      <option value="confetti">Confetti 🎉</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={() => { setShowCreateModal(false); setEditingMsg(null); }} className="app-btn" style={{ ...btn, flex: 1, height: 46, background: '#f1f5f9', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    if (editingMsg) {
                      if (!editingMsg.who || !editingMsg.text) return;
                      const updated = customMessages.map(m => m.id === editingMsg.id ? editingMsg : m);
                      setCustomMessages(updated);
                      saveMessagesToCloud(updated);
                      setEditingMsg(null);
                      setSuccessNote(lang === 'es' ? '¡Mensaje actualizado!' : 'Message updated!');
                      setTimeout(() => setSuccessNote(''), 3000);
                    } else {
                      if (!newMsgName || !newMsgText) return;
                      const updated = [...customMessages, {
                        id: Math.random().toString(36).substr(2, 9),
                        who: newMsgName, text: newMsgText, milestone: newMsgMilestone,
                        color: newMsgColor, position: newMsgPos, size: newMsgSize,
                        animation: newMsgAnim, particles: newMsgParticles,
                        createdAt: Date.now()
                      }];
                      setCustomMessages(updated);
                      saveMessagesToCloud(updated);
                      setNewMsgName(''); setNewMsgText('');
                      setShowCreateModal(false);
                      setSuccessNote(lang === 'es' ? '¡Mensaje creado!' : 'Message created!');
                      setTimeout(() => setSuccessNote(''), 3000);
                    }
                  }}
                  className="app-btn"
                  style={{ ...btn, flex: 2, height: 46, background: '#1a8fff', color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 12px rgba(26,143,255,0.25)' }}
                >
                  <i className="fa-solid fa-check" style={{ marginRight: 8 }}></i>
                  {lang === 'es' ? (editingMsg ? 'Actualizar' : 'Guardar') : (editingMsg ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Milestone Message Confirmation */}
      {msgToDelete && (
        <Modal onClose={() => setMsgToDelete(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '10px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff5f5', color: '#e53e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 4px 12px rgba(229,62,62,0.15)' }}>
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', marginBottom: 6 }}>{lang === 'es' ? '¿Eliminar mensaje?' : 'Delete message?'}</div>
              <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.6 }}>
                {lang === 'es' ? `Estás por eliminar el mensaje de "${msgToDelete.who}". Esta acción no se puede deshacer.` : `You are about to delete the message from "${msgToDelete.who}". This action cannot be undone.`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
              <button onClick={() => setMsgToDelete(null)} className="app-btn" style={{ ...btn, flex: 1, height: 44, background: '#f1f5f9', color: '#64748b' }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  const updated = customMessages.filter(x => x.id !== msgToDelete.id);
                  setCustomMessages(updated);
                  saveMessagesToCloud(updated);
                  setMsgToDelete(null);
                }}
                className="app-btn"
                style={{ ...btn, flex: 1, height: 44, background: '#e53e3e', color: '#fff', boxShadow: '0 4px 12px rgba(229,62,62,0.2)' }}
              >
                {lang === 'es' ? 'Eliminar' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Wipe Confirmation Modal */}
      {showWipeConfirm && (
        <Modal onClose={() => setShowWipeConfirm(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '10px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
              <i className="fa-solid fa-skull"></i>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#000', marginBottom: 8, letterSpacing: '-0.02em' }}>{lang === 'es' ? '¿EJECUTAR WIPE TOTAL?' : 'EXECUTE TOTAL WIPE?'}</div>
              <div style={{ fontSize: 13, color: '#c53030', lineHeight: 1.6, background: '#fff5f5', padding: 14, borderRadius: 12, border: '1px solid #feb2b2' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
                {lang === 'es' ? 'Esta acción ELIMINARÁ TODAS las cuentas, mensajes y feedback permanentemente.' : 'This action will PERMANENTLY DELETE all accounts, messages, and feedback.'}
                <div style={{ fontWeight: 800, marginTop: 8, textTransform: 'uppercase' }}>{lang === 'es' ? '¡NO HAY VUELTA ATRÁS!' : 'THERE IS NO GOING BACK!'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
              <button onClick={() => setShowWipeConfirm(false)} className="app-btn" style={{ ...btn, flex: 1, height: 46, background: '#f1f5f9', color: '#64748b' }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button 
                onClick={handleWipeAll}
                disabled={wipeLoading}
                className="app-btn"
                style={{ ...btn, flex: 1, height: 46, background: '#000', color: '#fff' }}
              >
                {wipeLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (lang === 'es' ? 'SÍ, BORRAR TODO' : 'YES, WIPE ALL')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Confirmation */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '10px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff5f5', color: '#e53e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              <i className="fa-solid fa-user-slash"></i>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', marginBottom: 6 }}>{lang === 'es' ? `Eliminar "${deleteTarget.name}"` : `Delete "${deleteTarget.name}"`}</div>
              <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.6 }}>
                {lang === 'es' ? 'Se borrarán todos sus datos y progreso del juego permanentemente.' : 'All their data and game progress will be permanently deleted.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
              <button onClick={() => setDeleteTarget(null)} className="app-btn" style={{ ...btn, flex: 1, height: 44, background: '#f1f5f9', color: '#64748b' }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={() => handleDelete(deleteTarget)} className="app-btn" style={{ ...btn, flex: 1, height: 44, background: '#e53e3e', color: '#fff' }}>
                {lang === 'es' ? 'Eliminar' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Restore Player Confirmation */}
      {restoreTarget && (
        <Modal onClose={() => setRestoreTarget(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '10px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', color: '#388e3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              <i className="fa-solid fa-user-check"></i>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', marginBottom: 6 }}>{lang === 'es' ? `Restaurar "${restoreTarget}"` : `Restore "${restoreTarget}"`}</div>
              <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.6 }}>
                {lang === 'es' ? 'Se eliminará el ban del jugador y podrá volver a jugar normalmente.' : 'The player ban will be lifted and they will be able to play normally again.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
              <button onClick={() => setRestoreTarget(null)} className="app-btn" style={{ ...btn, flex: 1, height: 44, background: '#f1f5f9', color: '#64748b' }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={() => { 
                window.AntiCheat.unban(restoreTarget); 
                setGlobalUsers(prev => prev.map(u => u.name === restoreTarget ? { ...u, banUntil: 0, banIndefinite: false } : u));
                setRestoreTarget(null); 
              }} className="app-btn" style={{ ...btn, flex: 1, height: 44, background: '#388e3c', color: '#fff' }}>
                {lang === 'es' ? 'Restaurar' : 'Restore'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Progress Confirmation */}
      {showResetConfirm && (
        <Modal onClose={() => setShowResetConfirm(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '10px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', marginBottom: 6 }}>{lang === 'es' ? '¿Resetear todo?' : 'Reset everything?'}</div>
              <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.6 }}>
                {lang === 'es' ? 'Se borrará el progreso en juego de todos los jugadores y el ranking global. Las cuentas se mantienen.' : 'All in-game progress and the global ranking will be wiped. Accounts are preserved.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
              <button onClick={() => setShowResetConfirm(false)} className="app-btn" style={{ ...btn, flex: 1, height: 44, background: '#f1f5f9', color: '#64748b' }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={handleResetAll} disabled={resetLoading} className="app-btn" style={{ ...btn, flex: 1, height: 44, background: '#d97706', color: '#fff' }}>
                {resetLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (lang === 'es' ? '¡Resetear todo!' : 'Reset everything!')}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {previewMsg && (
        <BossMarquee msg={previewMsg} lang={lang} danger={false} onDismiss={() => setPreviewMsg(null)} />
      )}

      {globalTooltip && (
        <div style={{
          position: 'fixed', 
          left: Math.max(110, Math.min(window.innerWidth - 110, globalTooltip.pos.x)), 
          top: globalTooltip.pos.y + (globalTooltip.direction === 'down' ? 12 : -15),
          transform: globalTooltip.direction === 'down' ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-100%)',
          background: 'var(--fg-1)', color: 'var(--bg-1)',
          padding: '8px 14px', borderRadius: 10,
          fontSize: 12, lineHeight: 1.4,
          zIndex: 10000, pointerEvents: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          width: 'max-content', maxWidth: 250, whiteSpace: 'normal', textAlign: 'center',
          animation: 'fadeIn 150ms ease-out',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {globalTooltip.type === 'shop' ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{globalTooltip.data[lang] || globalTooltip.data.es}</div>
              <div style={{ fontSize: 11, color: '#FFC220', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <i className="fa-solid fa-tooth"></i> {fmt(globalTooltip.data.cost)}
              </div>
              <div style={{ fontSize: 10, opacity: 0.9 }}>{globalTooltip.data.desc[lang] || globalTooltip.data.desc.es}</div>
            </>
          ) : (
            <div style={{ fontWeight: 600 }}>{globalTooltip.text}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState(() => {
    // Persistent Admin Session Check
    try {
      const session = JSON.parse(localStorage.getItem(ADMIN_AUTH_KEY));
      if (session && session.expiresAt > Date.now()) {
        return 'admin';
      }
    } catch (e) {}
    return 'gate';
  });
  const [username, setUsername] = useState(null);
  const [users, setUsers] = useState(() => loadUsers());
  const [deviceUser, setDeviceUser] = useState(() => localStorage.getItem(DEVICE_USER_KEY) || null);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'es');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== '0');
  const [numFormat, setNumFormat] = useState(() => localStorage.getItem(NUMFMT_KEY) || 'short');

  // Global reset check
  useEffect(() => {
    const checkReset = async () => {
      try {
        const res = await window.cloudFetchLeaderboard();
        if (res.ok && res.lastResetAt) {
          const localReset = parseInt(localStorage.getItem(LAST_RESET_KEY) || '0');
          if (res.lastResetAt > localReset) {
            console.log("Global reset detected. Wiping local progress...", res.lastResetAt);
            
            // 1. Mark this reset as handled LOCALLY first to prevent reload loops
            localStorage.setItem(LAST_RESET_KEY, res.lastResetAt.toString());
            
            // 2. Clear sensitive game data but keep non-game settings if possible 
            // (or just clear all for maximum safety as per plan)
            const keysToClear = [SAVES_KEY, USERS_KEY, DEVICE_USER_KEY, CURRENT_USER_KEY, ADMIN_AUTH_KEY];
            keysToClear.forEach(k => localStorage.removeItem(k));
            
            // 3. Force state update and reload
            if (username) {
              setUsername(null);
              setScreen('gate');
            }
            
            // Short delay to ensure localStorage is written before reload
            setTimeout(() => window.location.reload(), 100);
          }
        }
      } catch (e) {
        console.error("Reset check failed", e);
      }
    };
    
    // Initial check
    checkReset();
    
    // Periodic check every 45s (slightly faster than 60s)
    const id = setInterval(checkReset, 45000);
    return () => clearInterval(id);
  }, [username]);

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

  const handleCreateUser = useCallback((name) => {
    const cleaned = name.trim().slice(0, 24);
    if (!cleaned) return;
    if (checkBan(cleaned)) return;
    const updated = [...loadUsers(), cleaned];
    saveUsers(updated);
    localStorage.setItem(DEVICE_USER_KEY, cleaned);
    setUsers(updated);
    setDeviceUser(cleaned);
    setUsername(cleaned);
    setScreen('game');
  }, []);

  const handleSelectUser = useCallback((name) => {
    if (checkBan(name)) return;
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
    setUsername(null);
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
      <Game key={username} username={username} lang={lang} onLangChange={handleLangChange}
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
    </>
  );
}

Object.assign(window, { Modal, MenuItem, MenuDivider, deleteUserSave, ADMIN_NAME });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));