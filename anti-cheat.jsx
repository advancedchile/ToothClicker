// Anti-Cheat System
const BAN_LEVELS = [
  0,          // Level 0: Warning
  5 * 60 * 1000, // Level 1: 5 min
  30 * 60 * 1000, // Level 2: 30 min
  2 * 60 * 60 * 1000, // Level 3: 2 hours
  24 * 60 * 60 * 1000, // Level 4: 1 day
  3 * 24 * 60 * 60 * 1000, // Level 5: 3 days
  7 * 24 * 60 * 60 * 1000, // Level 6: 1 week
  -1, // Level 7: Indefinite
];

window.AntiCheat = {
  getBanData: (username) => {
    try {
      const level = parseInt(localStorage.getItem(`banLevel_${username}`)) || 0;
      const until = parseInt(localStorage.getItem(`banUntil_${username}`)) || 0;
      return { level, until };
    } catch(e) { return { level: 0, until: 0 }; }
  },
  
  applyBan: (username) => {
    const { level } = window.AntiCheat.getBanData(username);
    const newLevel = level + 1;
    const duration = BAN_LEVELS[Math.min(newLevel - 1, BAN_LEVELS.length - 1)];
    const until = duration === -1 ? -1 : Date.now() + duration;
    
    try {
      localStorage.setItem(`banLevel_${username}`, newLevel);
      if (duration !== 0) {
         localStorage.setItem(`banUntil_${username}`, until);
      }
      
      // Sync ban status to cloud
      if (username !== 'James') {
        window.cloudSubmitScore({ 
          name: username, 
          banUntil: duration === 0 ? 0 : until, 
          banIndefinite: duration === -1 
        });
      }

      if (duration === -1 && username !== 'James') {
         try { window.cloudDeleteScore(username); } catch(e) {}
      }
    } catch(e) {}
    
    return { newLevel, duration, until };
  },

  checkBanStatus: (username) => {
    if (username === 'James') return { isBanned: false };
    const data = window.AntiCheat.getBanData(username);
    if (data.until === -1) return { isBanned: true, indefinite: true };
    if (data.until > Date.now()) return { isBanned: true, indefinite: false, until: data.until };
    return { isBanned: false };
  },

  unban: (username) => {
    try {
      localStorage.removeItem(`banLevel_${username}`);
      localStorage.removeItem(`banUntil_${username}`);
      // Clear ban in cloud
      window.cloudSubmitScore({ name: username, banUntil: 0, banIndefinite: false });
    } catch(e) {}
  }
};

window.AntiCheatModal = function AntiCheatModal({ level, lang, onAcknowledge }) {
  React.useEffect(() => {
    const audio = new Audio('uploads/alert.mp3');
    audio.loop = true;
    audio.play().catch(e => console.warn('Alert audio blocked:', e));
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const getMsg = () => {
    if (level === 1) {
      return lang === 'es' 
        ? 'Hemos detectado un ritmo de clicks anormalmente alto. El uso de macros o autoclickers no está permitido. Esta es una advertencia.'
        : 'We detected an abnormally high click rate. Using macros or autoclickers is not allowed. This is a warning.';
    }
    if (level === 2) return lang === 'es' ? 'Has sido baneado por 5 minutos por uso de macros.' : 'You have been banned for 5 minutes for using macros.';
    if (level === 3) return lang === 'es' ? 'Has sido baneado por 30 minutos por uso continuo de macros.' : 'You have been banned for 30 minutes for continuous macro use.';
    if (level === 4) return lang === 'es' ? 'Has sido baneado por 2 horas.' : 'You have been banned for 2 hours.';
    if (level === 5) return lang === 'es' ? 'Has sido baneado por 1 día.' : 'You have been banned for 1 day.';
    if (level === 6) return lang === 'es' ? 'Has sido baneado por 3 días.' : 'You have been banned for 3 days.';
    if (level === 7) return lang === 'es' ? 'Has sido baneado por 1 semana. Una infracción más resultará en un ban indefinido.' : 'You have been banned for 1 week. One more violation will result in a permanent ban.';
    return lang === 'es' ? 'Has sido baneado indefinidamente. Tu progreso ha sido eliminado.' : 'You have been banned indefinitely. Your progress has been deleted.';
  };

  const btnLabel = level === 1 ? (lang === 'es' ? '¡Entendido!' : 'I understand!') : (lang === 'es' ? 'Salir' : 'Exit');

  return (
    <window.Modal onClose={() => {}}>
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚨</div>
        <h2 className="t-heading-m" style={{ marginBottom: 12, color: 'var(--negative-i100)' }}>
          {lang === 'es' ? '¡Uso de Macros Detectado!' : 'Macro Usage Detected!'}
        </h2>
        <p className="t-body-m" style={{ color: 'var(--fg-2)', lineHeight: 1.5, marginBottom: 20 }}>
          {getMsg()}
        </p>
        <button 
          onClick={onAcknowledge}
          className="t-heading-xs"
          style={{ all: 'unset', background: 'var(--negative-i100)', color: '#fff', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', transition: 'transform 100ms' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {btnLabel}
        </button>
      </div>
    </window.Modal>
  );
};
