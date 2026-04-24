// Gate screen — user selection + self-registration + admin access (no password)
const { useState: useStateG, useEffect: useEffectG, useMemo: useMemoG, useCallback: useCallbackG, useRef: useRefG } = React;

// ── Leaderboard hooks ───────────────────────────────────────────────────────
function useCloudLeaderboard({ pollMs = 15000, enabled = true } = {}) {
  const [state, setState] = useStateG({ loading: true, error: null, scores: [], lastUpdate: 0 });
  const refresh = useCallbackG(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    const res = await window.cloudFetchLeaderboard();
    if (res.ok) setState({ loading: false, error: null, scores: res.scores, lastUpdate: Date.now() });
    else setState(s => ({ ...s, loading: false, error: res.error }));
  }, []);
  useEffectG(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [enabled, pollMs, refresh]);
  return { ...state, refresh };
}

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
        <button onClick={lb.refresh} disabled={lb.loading} style={{ all: 'unset', boxSizing: 'border-box', padding: '6px 10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', color: 'var(--fg-2)', fontSize: 12, fontWeight: 500, cursor: lb.loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', opacity: lb.loading ? 0.6 : 1 }}>
          <i className={lb.loading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rotate'} style={{ fontSize: 11 }}></i>
          {t.lbRefresh}
        </button>
      </div>
      <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4 }}>{t.lbSub}</div>
      <div className="t-body-s" style={{ color: lb.error ? 'var(--negative-i130)' : 'var(--fg-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {status}
        {lb.error && <button onClick={lb.refresh} style={{ all: 'unset', cursor: 'pointer', color: 'var(--primary-i100)', fontWeight: 600, textDecoration: 'underline', marginLeft: 6 }}>{t.lbRetry}</button>}
      </div>
    </div>
  );
}

function LeaderboardBody({ lb, lang, currentUser }) {
  const t = window.STRINGS[lang];
  const rows = lb.scores || [];
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 460 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 130px', gap: 'var(--spacing-3)', padding: '0 var(--spacing-3)', color: 'var(--fg-3)', marginBottom: 2 }} className="t-mini-caps">
        <div>{t.lbRank}</div><div>{t.lbPlayer}</div>
        <div style={{ textAlign: 'right' }}>{t.lbPrestige}</div>
        <div style={{ textAlign: 'right' }}>{t.lbTotal}</div>
      </div>
      {rows.map((r, i) => {
        const isCurrent = currentUser && r.name === currentUser;
        const medal = i === 0 ? '#FFC220' : i === 1 ? '#A6B5C5' : i === 2 ? '#E8A06E' : null;
        return (
          <div key={r.name + '-' + i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 130px', gap: 'var(--spacing-3)', alignItems: 'center', padding: '10px var(--spacing-3)', background: isCurrent ? 'var(--primary-i010)' : 'var(--bg-1)', border: `1px solid ${isCurrent ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-s)', transition: 'all 120ms' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: medal || 'var(--bg-3)', color: medal ? '#fff' : 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, boxShadow: medal ? '0 2px 6px rgba(0,0,0,0.15)' : 'none' }}>{i + 1}</div>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {window.TOOTH_STAGES && <img src={window.getToothStage(r.prestige || 0).img} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />}
              <div style={{ minWidth: 0 }}>
                <div className="t-heading-xs" style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                  {isCurrent && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: 'var(--primary-i100)', color: '#fff', padding: '2px 6px', borderRadius: 999 }}>{t.lbYou}</span>}
                </div>
                <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>{window.formatTime(r.timePlayed || 0)}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--warning-i130)', fontWeight: 600 }}>
              <i className="fa-solid fa-crown" style={{ color: 'var(--warning-i100)', fontSize: 11, marginRight: 4 }}></i>
              {window.formatNum(r.prestige || 0)}
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
  return <div><LeaderboardHeader lb={lb} lang={lang} /><LeaderboardBody lb={lb} lang={lang} currentUser={username} /></div>;
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
function UserPill({ name, onSelect, isOwn }) {
  const [hov, setHov] = useStateG(false);
  return (
    <button
      style={{
        all: 'unset', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '12px 20px',
        borderRadius: 999,
        background: hov ? 'rgba(26,143,255,0.18)' : 'rgba(255,255,255,0.82)',
        border: `2px solid ${hov ? 'rgba(26,143,255,0.6)' : (isOwn ? 'rgba(26,143,255,0.4)' : 'rgba(100,160,230,0.3)')}`,
        boxShadow: hov ? '0 4px 16px rgba(26,143,255,0.18)' : '0 2px 10px rgba(80,140,220,0.08)',
        cursor: 'pointer', transition: 'all 140ms',
        fontFamily: "'PixelifySans', var(--font-sans)",
        transform: hov ? 'translateY(-1px)' : 'none',
        backdropFilter: 'blur(6px)',
      }}
      onClick={() => onSelect(name)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: hov ? '#1a8fff' : (isOwn ? 'rgba(26,143,255,0.2)' : 'rgba(100,160,230,0.2)'), color: hov ? '#fff' : '#3a6a9a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0, transition: 'all 140ms' }}>
        {(name[0] || '?').toUpperCase()}
      </div>
      <span style={{ fontSize: 16, fontWeight: 600, color: hov ? '#1a6acc' : '#334455', flex: 1, transition: 'color 140ms' }}>{name}</span>
      {isOwn && <span style={{ fontSize: 10, fontWeight: 600, color: '#1a8fff', background: 'rgba(26,143,255,0.12)', padding: '3px 8px', borderRadius: 999, fontFamily: 'var(--font-sans)' }}>
        {window.__lang === 'en' ? 'YOU' : 'TÚ'}
      </span>}
      <i className="fa-solid fa-arrow-right" style={{ fontSize: 12, color: hov ? '#1a8fff' : 'rgba(100,160,200,0.5)', transition: 'color 140ms' }}></i>
    </button>
  );
}

// ── Gate ─────────────────────────────────────────────────────────────────────
function Gate({ lang, onLangChange, onSelectUser, onCreateUser, onAdminAccess, users, deviceUser, soundOn, onSoundToggle, onShowAbout }) {
  const [name, setName] = useStateG('');
  const [showLb, setShowLb] = useStateG(false);
  const lb = useCloudLeaderboard({ pollMs: 15000 });

  const nameExists = useMemoG(() => {
    const t = name.trim().toLowerCase();
    if (!t) return false;
    return users.some(u => u.toLowerCase() === t);
  }, [users, name]);

  const canCreate = name.trim().length > 0 && !nameExists && !deviceUser;

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (!canCreate) return;
    onCreateUser(name.trim());
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#e8f2fb', fontFamily: "'PixelifySans', var(--font-sans)" }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'url(uploads/background-e5bd6167.png)', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 24px', width: '100%', maxWidth: 400 }}>

        <img src="uploads/logo-vertical.png" alt="ToothClicker" style={{ width: 200, objectFit: 'contain', marginBottom: 28, filter: 'drop-shadow(0 8px 24px rgba(80,140,220,0.22))' }} />

        {/* Registration form — only shown if this device hasn't created a user yet */}
        {!deviceUser && (
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={24}
                placeholder={lang === 'es' ? 'Tu nombre...' : 'Your name...'}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 52px 13px 22px',
                  fontSize: 16, fontFamily: "'PixelifySans', var(--font-sans)",
                  border: `2px solid ${nameExists ? '#e55' : 'rgba(100,160,230,0.5)'}`,
                  borderRadius: 999, background: 'rgba(255,255,255,0.88)', color: '#334',
                  outline: 'none', backdropFilter: 'blur(4px)',
                  boxShadow: '0 2px 12px rgba(80,140,220,0.10)', transition: 'border 150ms',
                }}
              />
              <button type="submit" disabled={!canCreate} style={{
                all: 'unset', boxSizing: 'border-box',
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: 999,
                background: canCreate ? '#1a8fff' : 'rgba(100,140,180,0.2)',
                color: canCreate ? '#fff' : 'rgba(100,140,180,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: canCreate ? 'pointer' : 'not-allowed', transition: 'background 150ms',
              }}>
                <i className="fa-solid fa-arrow-right-to-bracket" style={{ fontSize: 14 }}></i>
              </button>
            </div>
            <div style={{ fontSize: 12, color: nameExists ? '#c33' : 'rgba(80,110,150,0.7)', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
              {nameExists
                ? (lang === 'es' ? '⚠ Ese nombre ya existe' : '⚠ That name already exists')
                : (lang === 'es' ? 'Regístrate con tu nombre para jugar' : 'Register with your name to play')}
            </div>
          </form>
        )}

        {/* Existing users list */}
        {users.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {deviceUser && (
              <div style={{ fontSize: 12, color: 'rgba(80,110,150,0.65)', fontFamily: 'var(--font-sans)', textAlign: 'center', marginBottom: 4 }}>
                {lang === 'es' ? 'Selecciona tu perfil' : 'Select your profile'}
              </div>
            )}
            {users.map(u => (
              <UserPill key={u} name={u} onSelect={onSelectUser} isOwn={u === deviceUser} />
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, width: '100%' }}>
          <button onClick={() => setShowLb(true)} style={{ all: 'unset', boxSizing: 'border-box', flex: 1, padding: '11px 0', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(6px)', border: '1px solid rgba(100,160,230,0.3)', borderRadius: 999, color: '#4a6a8a', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 140ms', fontFamily: "'PixelifySans', var(--font-sans)" }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'}>
            <span style={{ fontSize: 16 }}>👑</span> Leaderboard
          </button>
          <button onClick={() => onLangChange(lang === 'es' ? 'en' : 'es')} style={{ all: 'unset', boxSizing: 'border-box', padding: '11px 16px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(6px)', border: '1px solid rgba(100,160,230,0.3)', borderRadius: 999, color: '#4a6a8a', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 140ms', fontFamily: "'PixelifySans', var(--font-sans)" }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'}>
            {lang === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}
          </button>
        </div>

        {/* Admin access — direct, no password */}
        <button onClick={onAdminAccess} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, color: 'rgba(80,110,150,0.45)', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, transition: 'color 140ms' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(26,143,255,0.75)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(80,110,150,0.45)'}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: 11 }}></i>
          {lang === 'es' ? 'Administrador' : 'Administrator'}
        </button>

        <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(80,110,150,0.4)', fontFamily: 'var(--font-sans)', letterSpacing: 0.2 }}>{APP_VERSION}</div>
      </div>

      {showLb && (
        <window.Modal onClose={() => setShowLb(false)}>
          <LeaderboardHeader lb={lb} lang={lang} />
          <LeaderboardBody lb={lb} lang={lang} currentUser={null} />
        </window.Modal>
      )}
    </div>
  );
}

Object.assign(window, { Gate, LeaderboardPanel, MiniStat, useCloudLeaderboard });
