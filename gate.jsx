// Gate screen — public user selection + hidden admin access via password
const { useState: useStateG, useEffect: useEffectG, useMemo: useMemoG, useCallback: useCallbackG } = React;

const ADMIN_PASSWORD = 'M1cuent@01';

// ── Leaderboard hook ────────────────────────────────────────────────────────
function useCloudLeaderboard({ pollMs = 15000, enabled = true } = {}) {
  const [state, setState] = useStateG({ loading: true, error: null, scores: [], lastUpdate: 0 });
  const refresh = useCallbackG(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    const res = await window.cloudFetchLeaderboard();
    if (res.ok) {
      setState({ loading: false, error: null, scores: res.scores, lastUpdate: Date.now() });
    } else setState(s => ({ ...s, loading: false, error: res.error }));
  }, []);
  useEffectG(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [enabled, pollMs, refresh]);
  return { ...state, refresh };
}

// ── Leaderboard components ──────────────────────────────────────────────────
function LeaderboardHeader({ lb, lang }) {
  const t = window.STRINGS[lang];
  const [, tick] = useStateG(0);
  useEffectG(() => { const id = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(id); }, []);
  let status;
  if (lb.loading && !lb.lastUpdate) status = <><i className="fa-solid fa-circle-notch fa-spin" style={{ color: 'var(--fg-3)' }}></i> {t.lbLoading}</>;
  else if (lb.error) status = <><i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--negative-i100)' }}></i> {t.lbError}</>;
  else { const s = Math.max(0, Math.floor((Date.now() - lb.lastUpdate) / 1000)); status = <><i className="fa-solid fa-circle" style={{ color: 'var(--positive-i100)', fontSize: 8 }}></i> {t.lbLastUpdate} {s}s</>; }
  return (
    <div style={{ marginBottom: 'var(--spacing-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-ranking-star" style={{ color: 'var(--warning-i100)', fontSize: 20 }}></i>
          <div className="t-heading-m">{t.lbTitle}</div>
        </div>
        <button onClick={lb.refresh} disabled={lb.loading} className="app-btn" style={{ all: 'unset', boxSizing: 'border-box', padding: '6px 10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', color: 'var(--fg-2)', fontSize: 12, fontWeight: 500, cursor: lb.loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', opacity: lb.loading ? 0.6 : 1, background: 'var(--bg-1)' }}>
          <i className={lb.loading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rotate'} style={{ fontSize: 11 }}></i>
          {t.lbRefresh}
        </button>
      </div>
      <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4 }}>{t.lbSub}</div>
      <div className="t-body-s" style={{ color: lb.error ? 'var(--negative-i130)' : 'var(--fg-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {status}
        {lb.error && <button onClick={lb.refresh} className="app-btn" style={{ all: 'unset', cursor: 'pointer', color: 'var(--primary-i100)', fontWeight: 600, textDecoration: 'underline', marginLeft: 6 }}>{t.lbRetry}</button>}
      </div>
    </div>
  );
}

function LeaderboardBody({ lb, lang, currentUser }) {
  const t = window.STRINGS[lang];
  const [sortBy, setSortBy] = window.useStateG('prestige'); // 'prestige' or 'level'
  const allRows = lb.scores || [];
  const rows = allRows
    .filter(r => r.name.toLowerCase() !== 'james')
    .sort((a, b) => {
      if (sortBy === 'level') {
        return (b.level || 0) - (a.level || 0) || (b.prestigeCount || 0) - (a.prestigeCount || 0);
      }
      return (b.prestigeCount || 0) - (a.prestigeCount || 0) || (b.level || 0) - (a.level || 0);
    });
  
  if (lb.loading && rows.length === 0 && !lb.error) return (
    <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', textAlign: 'center', color: 'var(--fg-3)' }}>
      <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 22, marginBottom: 10 }}></i>
      <div className="t-body-m">{t.lbLoading}</div>
    </div>
  );
  if (!lb.loading && rows.length === 0 && !lb.error) return (
    <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', textAlign: 'center', background: 'var(--bg-3)', borderRadius: 'var(--radius-m)', color: 'var(--fg-3)' }}>
      <i className="fa-solid fa-trophy" style={{ fontSize: 28, color: 'var(--fg-4)', display: 'block', marginBottom: 10 }}></i>
      <div className="t-body-m">{t.lbEmpty}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 520 }}>
      {/* Sort Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '0 4px' }}>
        <button 
          onClick={() => { window.playClickSound && window.playClickSound(); setSortBy('prestige'); }}
          style={{
            all: 'unset', boxSizing: 'border-box', flex: 1, padding: '8px', borderRadius: 8, textAlign: 'center', fontSize: 10, fontWeight: 700, cursor: 'pointer',
            background: sortBy === 'prestige' ? 'var(--primary-i100)' : 'var(--bg-3)',
            color: sortBy === 'prestige' ? '#fff' : 'var(--fg-3)',
            transition: 'all 150ms', fontFamily: 'var(--font-sans)'
          }}
        >
          <i className="fa-solid fa-crown" style={{ marginRight: 6 }}></i>
          {lang === 'es' ? 'POR PRESTIGIO' : 'BY PRESTIGE'}
        </button>
        <button 
          onClick={() => { window.playClickSound && window.playClickSound(); setSortBy('level'); }}
          style={{
            all: 'unset', boxSizing: 'border-box', flex: 1, padding: '8px', borderRadius: 8, textAlign: 'center', fontSize: 10, fontWeight: 700, cursor: 'pointer',
            background: sortBy === 'level' ? 'var(--primary-i100)' : 'var(--bg-3)',
            color: sortBy === 'level' ? '#fff' : 'var(--fg-3)',
            transition: 'all 150ms', fontFamily: 'var(--font-sans)'
          }}
        >
          <i className="fa-solid fa-graduation-cap" style={{ marginRight: 6 }}></i>
          {lang === 'es' ? 'POR NIVEL' : 'BY LEVEL'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 90px 140px', gap: 'var(--spacing-3)', padding: '0 var(--spacing-3)', color: 'var(--fg-3)', marginBottom: 2 }} className="t-mini-caps">
        <div>{t.lbRank}</div><div>{t.lbPlayer}</div>
        <div style={{ textAlign: 'right' }}>{t.lbPrestige}</div>
        <div style={{ textAlign: 'right' }}>{t.lbTotal}</div>
      </div>
      {rows.map((r, i) => {
        const isCurrent = currentUser && r.name === currentUser;
        const medal = i === 0 ? '#FFC220' : i === 1 ? '#A6B5C5' : i === 2 ? '#E8A06E' : null;
        return (
          <div key={r.name + '-' + i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 90px 140px', gap: 'var(--spacing-3)', alignItems: 'center', padding: '10px var(--spacing-3)', background: isCurrent ? 'var(--primary-i010)' : 'var(--bg-1)', border: `1px solid ${isCurrent ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-s)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: medal || 'var(--bg-3)', color: medal ? '#fff' : 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {window.TOOTH_STAGES && <img src={window.getToothStage(r.prestigeCount || 0).img} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />}
              <div style={{ minWidth: 0 }}>
                <div className="t-heading-xs" style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {(() => {
                    const timeSince = Date.now() - r.updatedAt;
                    const online = r.isOnline !== false && timeSince < 60000;
                    return (
                      <div style={{ 
                        width: 8, height: 8, borderRadius: '50%', 
                        background: online ? '#22C55E' : '#94A3B8', 
                        boxShadow: online ? '0 0 6px #22C55E' : 'none', 
                        flexShrink: 0 
                      }} />
                    );
                  })()}
                  {r.name}
                  {isCurrent && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: 'var(--primary-i100)', color: '#fff', padding: '2px 6px', borderRadius: 999 }}>{t.lbYou}</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--primary-i100)', fontWeight: 600, marginBottom: 2 }}>
                  {r.clinicName ? r.clinicName : (lang === 'es' ? `Clínica de ${r.name}` : `${r.name}'s Clinic`)}
                  <span style={{ marginLeft: 8, color: 'var(--fg-3)', fontWeight: 400 }}>• Niv. {r.level || 0}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--warning-i130)', fontWeight: 600 }}>
              <i className="fa-solid fa-crown" style={{ color: 'var(--warning-i100)', fontSize: 11, marginRight: 4 }}></i>
              {window.formatNum(r.prestigeCount || 0)}
            </div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--primary-i100)', fontWeight: 600 }}>{window.formatNum(r.totalEarned || 0)}</div>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardPanel({ username, lang }) {
  const lb = useCloudLeaderboard({ pollMs: 15000 });
  
  // Force sync when opening the panel
  useEffectG(() => {
    if (window.forcePushScore) {
       window.forcePushScore();
       // Wait a bit for the push to complete before refreshing
       setTimeout(() => lb.refresh(), 1500);
    }
  }, []);

  const handleRefresh = async () => {
    if (window.forcePushScore) {
      console.log("[Ranking] Forcing data push before refresh...");
      window.forcePushScore();
      // Wait a bit more to ensure Supabase has indexed the new row
      await new Promise(r => setTimeout(r, 2000));
    }
    await lb.refresh();
  };

  return <div><LeaderboardHeader lb={{...lb, refresh: handleRefresh}} lang={lang} /><LeaderboardBody lb={lb} lang={lang} currentUser={username} /></div>;
}

function MiniStat({ label, value, icon, color }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)', color: color || 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{label}</div>
        <div className="t-heading-xs" style={{ color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      </div>
    </div>
  );
}

// ── User pill ───────────────────────────────────────────────────────────────
function UserPill({ name, onSelect, isOwn, onLogout, isOnline }) {
  const [hov, setHov] = useStateG(false);
  return (
    <button
      className="app-btn"
      style={{
        all: 'unset', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '12px 20px', borderRadius: 999,
        background: 'rgba(255,255,255,0.82)',
        border: `2px solid ${isOwn ? 'rgba(26,143,255,0.4)' : 'rgba(100,160,230,0.3)'}`,
        boxShadow: '0 2px 10px rgba(80,140,220,0.08)',
        cursor: 'pointer', transition: 'all 140ms',
        fontFamily: "'PixelifySans', var(--font-sans)",
        backdropFilter: 'blur(6px)',
      }}
      onClick={() => { window.playClickSound && window.playClickSound(); onSelect(name); }}
    >
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: isOwn ? 'rgba(26,143,255,0.2)' : 'rgba(100,160,230,0.2)', color: '#3a6a9a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0, transition: 'all 140ms' }}>
        {(name[0] || '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#22C55E' : '#94A3B8', boxShadow: isOnline ? '0 0 6px #22C55E' : 'none', flexShrink: 0 }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#334455', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      </div>
      {isOwn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#1a8fff', background: 'rgba(26,143,255,0.12)', padding: '3px 8px', borderRadius: 999, fontFamily: 'var(--font-sans)' }}>
            {window.__lang === 'en' ? 'YOU' : 'TÚ'}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); window.playClickSound && window.playClickSound(); onLogout(); }}
            title={window.__lang === 'en' ? 'Logout / Clear session' : 'Cerrar sesión / Limpiar perfil'}
            style={{ all: 'unset', width: 28, height: 28, borderRadius: '50%', background: 'rgba(220,50,50,0.08)', color: '#c33', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(220,50,50,0.1)' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(220,50,50,0.15)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(220,50,50,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 11 }}></i>
          </button>
        </div>
      )}

      <i className="fa-solid fa-arrow-right" style={{ fontSize: 12, color: 'rgba(100,160,200,0.5)', transition: 'color 140ms' }}></i>
    </button>
  );
}

// ── Admin password modal ────────────────────────────────────────────────────
function AdminPasswordModal({ lang, onSuccess, onClose }) {
  const [pw, setPw] = useStateG('');
  const [err, setErr] = useStateG(false);
  const [show, setShow] = useStateG(false);

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (pw === ADMIN_PASSWORD) { onSuccess(); }
    else { setErr(true); setPw(''); setTimeout(() => setErr(false), 1800); }
  };

  return (
    <window.Modal onClose={onClose}>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 280 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(26,143,255,0.1)', color: '#1a8fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 6 }}>
          <i className="fa-solid fa-lock"></i>
        </div>
        <div style={{ fontFamily: "'PixelifySans', var(--font-sans)", fontSize: 19, fontWeight: 700, color: '#1a4a7a', marginBottom: 2 }}>
          {lang === 'es' ? 'Acceso restringido' : 'Restricted access'}
        </div>
        <div style={{ fontSize: 13, color: '#6a8aaa', fontFamily: 'var(--font-sans)', marginBottom: 16, textAlign: 'center' }}>
          {lang === 'es' ? 'Ingresa la contraseña para continuar' : 'Enter the password to continue'}
        </div>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <input
              autoFocus
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder={lang === 'es' ? 'Contraseña...' : 'Password...'}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 44px 12px 16px', fontSize: 15,
                fontFamily: 'var(--font-sans)',
                border: `2px solid ${err ? '#e55' : 'rgba(100,160,230,0.5)'}`,
                borderRadius: 10,
                background: err ? '#fff5f5' : 'rgba(255,255,255,0.95)',
                outline: 'none', transition: 'border 150ms',
                animation: err ? 'shake 0.35s ease' : 'none',
              }}
            />
            <button type="button" onClick={() => setShow(s => !s)} className="app-btn" style={{ all: 'unset', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#8aaacc', fontSize: 14 }}>
              <i className={show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
            </button>
          </div>
          {err && <div style={{ fontSize: 12, color: '#c33', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
            {lang === 'es' ? '❌ Contraseña incorrecta' : '❌ Wrong password'}
          </div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => { window.playClickSound && window.playClickSound(); onClose(); }} className="app-btn" style={{ all: 'unset', boxSizing: 'border-box', flex: 1, padding: '11px 0', background: 'rgba(100,140,180,0.12)', color: '#4a6080', borderRadius: 10, fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="submit" onClick={() => window.playClickSound && window.playClickSound()} className="app-btn" style={{ all: 'unset', boxSizing: 'border-box', flex: 1, padding: '11px 0', background: '#1a8fff', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
              {lang === 'es' ? 'Entrar' : 'Enter'}
            </button>
          </div>
        </form>
      </div>
    </window.Modal>
  );
}

// ── Gate ─────────────────────────────────────────────────────────────────────
function Gate({ lang, onLangChange, onSelectUser, onCreateUser, onAdminAccess, onLogoutDeviceUser, users, deviceUser }) {
  const [name, setName] = useStateG('');
  const [password, setPassword] = useStateG('');
  const [showPassword, setShowPassword] = useStateG(false);
  const [error, setError] = useStateG('');
  const [loading, setLoading] = useStateG(false);
  const [showLb, setShowLb] = useStateG(false);
  const [showAdminPw, setShowAdminPw] = useStateG(false);
  const lb = useCloudLeaderboard({ pollMs: 15000 });

  const RESERVED = (window.ADMIN_NAME || 'James').toLowerCase();

  const cloudUser = useMemoG(() => {
    const t = name.trim().toLowerCase();
    if (!t) return null;
    return (lb.scores || []).find(s => s.name.toLowerCase() === t);
  }, [name, lb.scores]);

  const nameReserved = useMemoG(() => name.trim().toLowerCase() === RESERVED, [name]);

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || nameReserved || loading) return;

    setLoading(true);
    setError('');

    if (cloudUser) {
      // Intentar Logear/Continuar
      if (!showPassword) {
        setShowPassword(true);
        setLoading(false);
        return;
      }
      const res = await window.cloudAuthenticate(cleanName, password);
      if (res.ok) {
        onSelectUser(cleanName, res.player, password);
      } else {
        setError(lang === 'es' ? 'Contraseña incorrecta' : 'Invalid password');
      }
    } else {
      // Intentar Registrar
      if (!showPassword) {
        setShowPassword(true);
        setLoading(false);
        return;
      }
      onCreateUser(cleanName, password);
    }
    setLoading(false);
  };

  // Lock icon click counter — 3 quick taps to open admin (subtle UX)
  const lockTaps = React.useRef(0);
  const lockTimer = React.useRef(null);
  const handleLockTap = () => {
    lockTaps.current += 1;
    clearTimeout(lockTimer.current);
    if (lockTaps.current >= 1) {
      lockTaps.current = 0;
      setShowAdminPw(true);
    } else {
      lockTimer.current = setTimeout(() => { lockTaps.current = 0; }, 1200);
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#e8f2fb', fontFamily: "'PixelifySans', var(--font-sans)" }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'url(uploads/background-e5bd6167.png)', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 24px', width: '100%', maxWidth: 400 }}>

        <img src="uploads/logo-vertical.png" alt="ToothClicker" style={{ width: 220, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0 8px 24px rgba(80,140,220,0.22))', animation: 'pulse 1.5s infinite ease-in-out' }} />

        {/* Registration/Login — only if this device hasn't registered yet */}
        {!deviceUser && (
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                autoFocus
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                maxLength={24}
                placeholder={lang === 'es' ? 'Tu nombre...' : 'Your name...'}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 22px',
                  fontSize: 16, fontFamily: "'PixelifySans', var(--font-sans)",
                  border: `2px solid ${error ? '#e55' : 'rgba(100,160,230,0.5)'}`,
                  borderRadius: 999, background: 'rgba(255,255,255,0.88)', color: '#334',
                  outline: 'none', backdropFilter: 'blur(4px)',
                  boxShadow: '0 2px 12px rgba(80,140,220,0.10)', transition: 'border 150ms',
                }}
              />
            </div>

            {showPassword && (
              <div style={{ position: 'relative', width: '100%', animation: 'modalIn 0.3s ease' }}>
                <input
                  autoFocus
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder={cloudUser ? (lang === 'es' ? 'Contraseña para continuar' : 'Password to continue') : (lang === 'es' ? 'Crea una contraseña' : 'Create a password')}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '13px 22px',
                    fontSize: 15, fontFamily: 'var(--font-sans)',
                    border: `2px solid ${error ? '#e55' : 'rgba(100,160,230,0.5)'}`,
                    borderRadius: 999, background: 'rgba(255,255,255,0.88)', color: '#334',
                    outline: 'none', backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 12px rgba(80,140,220,0.10)',
                  }}
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !name.trim()} 
              className="app-btn" 
              style={{
                all: 'unset', boxSizing: 'border-box',
                width: '100%', padding: '12px', borderRadius: 999,
                background: (loading || !name.trim()) ? 'rgba(100,140,180,0.2)' : '#1a8fff',
                color: '#fff', fontSize: 16, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: (loading || !name.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (
                <>
                  <i className={cloudUser ? "fa-solid fa-cloud-arrow-down" : "fa-solid fa-user-plus"}></i>
                  {cloudUser ? (lang === 'es' ? 'Continuar Partida' : 'Continue Game') : (lang === 'es' ? 'Empezar a Jugar' : 'Start Playing')}
                </>
              )}
            </button>

            <div style={{ fontSize: 12, color: error ? '#c33' : 'rgba(80,110,150,0.7)', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
              {error || (nameReserved
                ? (lang === 'es' ? '⚠ Ese nombre está reservado' : '⚠ That name is reserved')
                : cloudUser 
                  ? (lang === 'es' ? 'Jugador encontrado en la nube' : 'Player found in cloud')
                  : (lang === 'es' ? 'Elige un nombre y contraseña para guardar tu progreso' : 'Pick a name and password to save your progress'))}
            </div>
          </form>
        )}

        {/* Public user pills */}
        {deviceUser && users.length > 0 && (

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {deviceUser && (
              <div style={{ fontSize: 12, color: 'rgba(80,110,150,0.65)', fontFamily: 'var(--font-sans)', textAlign: 'center', marginBottom: 2 }}>
                {lang === 'es' ? 'Selecciona un perfil' : 'Select a profile'}
              </div>
            )}
            {users.map(u => (
              <UserPill 
                key={u} 
                name={u} 
                onSelect={onSelectUser} 
                isOwn={u === deviceUser} 
                onLogout={onLogoutDeviceUser}
                isOnline={(lb.scores || []).some(s => s.name === u && (Date.now() - s.updatedAt) < 120000)}
              />

            ))}
          </div>
        )}

        {/* Bottom row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, width: '100%' }}>
          <button onClick={() => { window.playClickSound && window.playClickSound(); setShowLb(true); }} className="app-btn" style={{ all: 'unset', boxSizing: 'border-box', flex: 1, padding: '11px 0', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(6px)', border: '1px solid rgba(100,160,230,0.3)', borderRadius: 999, color: '#4a6a8a', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'PixelifySans', var(--font-sans)" }}>
            <span style={{ fontSize: 16 }}>👑</span> Leaderboard
          </button>
        </div>

        {/* Discrete admin lock — tiny, subtle */}
        <button onClick={() => { window.playClickSound && window.playClickSound(); handleLockTap(); }} title="" className="app-btn" style={{ all: 'unset', cursor: 'pointer', color: 'rgba(80,110,150,0.2)', fontSize: 11, padding: '4px 8px', borderRadius: 999 }}>
          <i className="fa-solid fa-lock"></i>
        </button>

        <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(80,110,150,0.3)', fontFamily: 'var(--font-sans)', letterSpacing: 0.2 }}>{window.APP_VERSION || 'v0.5.5-beta'}</div>
      </div>

      {showLb && (
        <window.Modal onClose={() => setShowLb(false)} maxWidth={640}>
          <LeaderboardHeader lb={lb} lang={lang} />
          <LeaderboardBody lb={lb} lang={lang} currentUser={null} />
        </window.Modal>
      )}

      {showAdminPw && (
        <AdminPasswordModal
          lang={lang}
          onSuccess={() => { setShowAdminPw(false); onAdminAccess(); }}
          onClose={() => setShowAdminPw(false)}
        />
      )}
    </div>
  );
}

Object.assign(window, { Gate, LeaderboardPanel, MiniStat, useCloudLeaderboard });
