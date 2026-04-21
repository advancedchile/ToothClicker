// ==========================================================================
// Gate (start screen) + Cloud Leaderboard
// ==========================================================================

const { useState: useStateG, useEffect: useEffectG, useMemo: useMemoG, useCallback: useCallbackG, useRef: useRefG } = React;

// ---- custom hook: cloud leaderboard with polling ----
function useCloudLeaderboard({ pollMs = 15000, enabled = true } = {}) {
  const [state, setState] = useStateG({ loading: true, error: null, scores: [], lastUpdate: 0 });

  const refresh = useCallbackG(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    const res = await cloudFetchLeaderboard();
    if (res.ok) {
      setState({ loading: false, error: null, scores: res.scores, lastUpdate: Date.now() });
    } else {
      setState(s => ({ ...s, loading: false, error: res.error }));
    }
  }, []);

  useEffectG(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [enabled, pollMs, refresh]);

  return { ...state, refresh };
}

function formatRelTime(ms, lang) {
  const t = STRINGS[lang];
  if (!ms) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  return `${s}${t.lbSec}`;
}

function Gate({ lang, onLangChange, onStart, existingUser, onContinue, soundOn, onSoundToggle, onDeleteUser }) {
  const t = STRINGS[lang];
  const [name, setName] = useStateG('');
  const [tab, setTab] = useStateG('game');
  const [menuOpen, setMenuOpen] = useStateG(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useStateG(false);
  const menuRef = useRefG(null);
  const lb = useCloudLeaderboard({ pollMs: 15000 });
  const [, forceTick] = useStateG(0);

  useEffectG(() => {
    const id = setInterval(() => forceTick(x => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffectG(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const existing = useMemoG(() => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    return lb.scores.find(p => (p.name || '').toLowerCase() === trimmed.toLowerCase()) || null;
  }, [lb.scores, name]);

  const canPlay = name.trim().length > 0 && !existing;

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (!canPlay) return;
    onStart(name.trim(), lang);
  };
  const handleContinueClick = (e) => {
    e && e.preventDefault();
    onContinue && onContinue();
  };

  const myRecord = useMemoG(() => {
    if (!existingUser) return null;
    return lb.scores.find(p => (p.name || '').toLowerCase() === existingUser.toLowerCase()) || null;
  }, [lb.scores, existingUser]);

  const toggleLang = () => onLangChange(lang === 'es' ? 'en' : 'es');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 0% 0%, var(--primary-i010), var(--bg-canvas) 60%), var(--bg-canvas)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--spacing-6)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div className="gate-hero-wrap" style={{
        width: '100%', maxWidth: 1060,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 620px)',
        gap: 'var(--spacing-6)',
        alignItems: 'center',
      }}>
        {/* LEFT: hero visual */}
        <div className="gate-hero" style={{
          position: 'relative',
          minHeight: 520,
          borderRadius: 'var(--radius-m)',
          padding: 'var(--spacing-8)',
          background: 'linear-gradient(160deg, var(--primary-i130) 0%, var(--primary-i100) 60%, var(--alternative-i130) 130%)',
          color: '#fff',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '0 20px 60px -20px rgba(0, 40, 100, 0.35)',
        }}>
          {/* floating tooth pattern */}
          <svg aria-hidden="true" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0.13, pointerEvents: 'none',
          }}>
            <defs>
              <pattern id="tp" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M40 20 c-8 0-14 5-14 14 0 6 2 11 3 18 l1 6 c0 4 3 7 4 7 1 0 2-3 2-7 l0-6 c0-2 1-3 2-3 s2 1 2 3 l0 6 c0 4 1 7 2 7 1 0 4-3 4-7 l1-6 c1-7 3-12 3-18 0-9-6-14-10-14z" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tp)" />
          </svg>
          {/* giant background tooth */}
          <div style={{
            position: 'absolute', right: -60, bottom: -80,
            width: 420, height: 420,
            opacity: 0.18,
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))',
          }} aria-hidden="true">
            <ToothIcon size={420} />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', borderRadius: 'var(--radius-pill)',
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff' }} />
              Atom Labs · Tooth Clicker
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(28px, 3.2vw, 42px)', lineHeight: 1.05, fontWeight: 700,
              letterSpacing: -0.5,
              marginBottom: 14,
              textWrap: 'balance',
            }}>
              {lang === 'es' ? 'Del primer click' : 'From the first click'}<br/>
              <span style={{ color: '#fff', opacity: 0.72 }}>
                {lang === 'es' ? 'a la clínica global.' : 'to the global clinic.'}
              </span>
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.92, maxWidth: 340 }}>
              {lang === 'es'
                ? '120+ generadores, 100+ mejoras de click y 300+ logros. Tu progreso se queda contigo hasta cuando cerrás la pestaña.'
                : '120+ generators, 100+ click upgrades and 300+ achievements. Your progress stays — even when the tab is closed.'}
            </div>
          </div>

          <div style={{
            position: 'relative', zIndex: 1,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
          }}>
            <HeroStat n="120+" l={lang === 'es' ? 'Generadores' : 'Generators'} />
            <HeroStat n="100+" l={lang === 'es' ? 'Mejoras' : 'Upgrades'} />
            <HeroStat n="300+" l={lang === 'es' ? 'Logros' : 'Achievements'} />
          </div>
        </div>

        {/* RIGHT: card */}
        <div style={{
        width: '100%',
        background: 'var(--bg-1)',
        borderRadius: 'var(--radius-m)',
        boxShadow: 'var(--elevation-10)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* HEADER */}
        <div style={{
          padding: 'var(--spacing-6) var(--spacing-6) var(--spacing-5)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-s)',
            background: 'var(--primary-i100)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,118,219,0.25)',
          }}>
            <i className="fa-solid fa-tooth" style={{ fontSize: 22 }}></i>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-mini-caps" style={{ color: 'var(--primary-i100)' }}>Atom Labs</div>
            <div className="t-heading-l" style={{ color: 'var(--fg-1)' }}>{t.gateTitle}</div>
          </div>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                all: 'unset', boxSizing: 'border-box',
                width: 40, height: 40, borderRadius: 'var(--radius-s)',
                border: '1px solid var(--border-subtle)',
                background: menuOpen ? 'var(--bg-3)' : 'transparent',
                color: 'var(--fg-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={t.menuOptions}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
            {menuOpen && (
              <div role="menu" style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                minWidth: 220,
                background: 'var(--bg-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-s)',
                boxShadow: 'var(--elevation-20)',
                padding: 6,
                zIndex: 20,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <MenuItem
                  icon={soundOn ? 'fa-volume-high' : 'fa-volume-xmark'}
                  label={soundOn ? t.soundOn : t.soundOff}
                  onClick={() => { onSoundToggle && onSoundToggle(); }}
                />
                <MenuItem
                  icon="fa-language"
                  label={lang === 'es' ? 'Español' : 'English'}
                  trailing={<span className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{lang === 'es' ? 'EN →' : 'ES →'}</span>}
                  onClick={() => { toggleLang(); }}
                />
                {existingUser && (
                  <React.Fragment>
                    <MenuDivider />
                    <MenuItem
                      icon="fa-trash"
                      label={t.reset}
                      danger
                      onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true); }}
                    />
                  </React.Fragment>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex', gap: 4,
          padding: '0 var(--spacing-6)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <GateTab active={tab === 'game'} onClick={() => setTab('game')} label={t.gateTabGame} icon="fa-play" />
          <GateTab active={tab === 'lb'} onClick={() => setTab('lb')} label={t.gateTabLeaderboard} icon="fa-ranking-star" />
        </div>

        {/* TAB BODY */}
        <div style={{ padding: 'var(--spacing-6)' }}>
          {tab === 'game' && (
            existingUser ? (
              <form onSubmit={handleContinueClick} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div style={{
                  padding: 'var(--spacing-4) var(--spacing-5)',
                  background: 'var(--primary-i005)',
                  border: '1px solid var(--primary-i020)',
                  borderRadius: 'var(--radius-s)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--primary-i100)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700,
                  }}>{(existingUser[0] || '?').toUpperCase()}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="t-mini-caps" style={{ color: 'var(--primary-i100)' }}>{t.gateWelcomeBack}</div>
                    <div className="t-heading-m" style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{existingUser}</div>
                  </div>
                </div>

                <div className="t-body-m" style={{ color: 'var(--fg-2)' }}>{t.gateWelcomeBackSub}</div>

                {myRecord && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <MiniStat label={t.lbTotal} value={formatNum(myRecord.totalEarned || 0)} icon="fa-tooth" color="var(--primary-i100)" />
                    <MiniStat label={t.lbPrestige} value={formatNum(myRecord.prestige || 0)} icon="fa-crown" color="var(--warning-i100)" />
                  </div>
                )}

                <button
                  type="submit"
                  autoFocus
                  style={{
                    all: 'unset', boxSizing: 'border-box', textAlign: 'center',
                    padding: '14px 20px', borderRadius: 'var(--radius-s)',
                    background: 'var(--primary-i100)', color: '#fff',
                    fontWeight: 600, fontSize: 15, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', transition: 'background 150ms',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-i130)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-i100)'; }}
                >
                  <i className="fa-solid fa-play" style={{ fontSize: 13 }}></i>
                  {t.gateContinue}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div className="t-body-l" style={{ color: 'var(--fg-2)' }}>{t.gateTagline}</div>
                <div>
                  <label className="t-mini-caps" style={{ color: 'var(--fg-3)', display: 'block', marginBottom: 6 }}>
                    {t.gateNameLabel}
                  </label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    placeholder={t.gateNamePlaceholder}
                    style={{
                      width: '100%', padding: '12px 14px', fontSize: 15,
                      fontFamily: 'var(--font-sans)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-s)',
                      background: 'var(--bg-1)', color: 'var(--fg-1)',
                      outline: 'none',
                      transition: 'border 150ms, box-shadow 150ms',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-i100)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-i010)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  {existing && (
                    <div className="t-body-s" style={{ color: 'var(--negative-i130)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fa-solid fa-circle-xmark"></i>
                      {t.gateExisting}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canPlay}
                  style={{
                    all: 'unset', boxSizing: 'border-box', textAlign: 'center',
                    padding: '14px 20px', borderRadius: 'var(--radius-s)',
                    background: canPlay ? 'var(--primary-i100)' : 'var(--bg-3)',
                    color: canPlay ? '#fff' : 'var(--fg-4)',
                    fontWeight: 600, fontSize: 15,
                    cursor: canPlay ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-sans)', transition: 'background 150ms',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { if (canPlay) e.currentTarget.style.background = 'var(--primary-i130)'; }}
                  onMouseLeave={e => { if (canPlay) e.currentTarget.style.background = 'var(--primary-i100)'; }}
                >
                  {t.gatePlay}
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: 13 }}></i>
                </button>
              </form>
            )
          )}

          {tab === 'lb' && (
            <div>
              <LeaderboardHeader lb={lb} lang={lang} />
              <LeaderboardBody lb={lb} lang={lang} currentUser={existingUser} />
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Delete user confirm modal */}
      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
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
            <button onClick={() => setShowDeleteConfirm(false)} style={secondaryBtnStyle}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                if (existingUser) {
                  try { cloudDeleteScore(existingUser); } catch (e) {}
                  try { deleteUserSave(existingUser); } catch (e) {}
                }
                onDeleteUser && onDeleteUser();
              }}
              style={{ ...primaryBtnStyle, background: 'var(--negative-i100)' }}
            >
              {t.reset}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HeroStat({ n, l }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.14)',
      borderRadius: 'var(--radius-s)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.12)',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.78, marginTop: 4 }}>{l}</div>
    </div>
  );
}

function GateTab({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', boxSizing: 'border-box',
        padding: '12px 16px',
        cursor: 'pointer',
        color: active ? 'var(--primary-i100)' : 'var(--fg-3)',
        fontWeight: active ? 600 : 500,
        fontSize: 14,
        fontFamily: 'var(--font-sans)',
        borderBottom: `2px solid ${active ? 'var(--primary-i100)' : 'transparent'}`,
        marginBottom: -1,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'all 120ms',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--fg-1)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--fg-3)'; }}
    >
      <i className={`fa-solid ${icon}`} style={{ fontSize: 13 }}></i>
      {label}
    </button>
  );
}


function LeaderboardHeader({ lb, lang, subtitle }) {
  const t = STRINGS[lang];
  let status;
  if (lb.loading && !lb.lastUpdate) {
    status = <><i className="fa-solid fa-circle-notch fa-spin" style={{ color: 'var(--fg-3)' }}></i> {t.lbLoading}</>;
  } else if (lb.error) {
    status = <><i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--negative-i100)' }}></i> {t.lbError}</>;
  } else {
    status = <><i className="fa-solid fa-circle" style={{ color: 'var(--positive-i100)', fontSize: 8 }}></i> {t.lbLastUpdate} {formatRelTime(lb.lastUpdate, lang)}</>;
  }
  return (
    <div style={{ marginBottom: 'var(--spacing-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-ranking-star" style={{ color: 'var(--warning-i100)', fontSize: 20 }}></i>
          <div className="t-heading-m" style={{ color: 'var(--fg-1)' }}>{t.lbTitle}</div>
        </div>
        <button
          onClick={lb.refresh}
          disabled={lb.loading}
          style={{
            all: 'unset',
            boxSizing: 'border-box',
            padding: '6px 10px',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-s)',
            color: 'var(--fg-2)',
            fontSize: 12, fontWeight: 500,
            cursor: lb.loading ? 'wait' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-sans)',
            opacity: lb.loading ? 0.6 : 1,
          }}
          title={t.lbRefresh}
        >
          <i className={lb.loading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rotate'} style={{ fontSize: 11 }}></i>
          {t.lbRefresh}
        </button>
      </div>
      <div className="t-body-m" style={{ color: 'var(--fg-3)', marginTop: 4 }}>{t.lbSub}</div>
      <div className="t-body-s" style={{
        color: lb.error ? 'var(--negative-i130)' : 'var(--fg-3)',
        marginTop: 8,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {status}
        {lb.error && (
          <button onClick={lb.refresh} style={{
            all: 'unset', cursor: 'pointer',
            color: 'var(--primary-i100)', fontWeight: 600,
            textDecoration: 'underline', marginLeft: 6,
          }}>{t.lbRetry}</button>
        )}
      </div>
    </div>
  );
}

function LeaderboardBody({ lb, lang, selectedName, currentUser, onPick }) {
  const t = STRINGS[lang];
  const rows = lb.scores || [];

  if (lb.loading && rows.length === 0 && !lb.error) {
    return (
      <div style={{
        padding: 'var(--spacing-8) var(--spacing-4)',
        textAlign: 'center',
        color: 'var(--fg-3)',
      }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 22, marginBottom: 10 }}></i>
        <div className="t-body-m">{t.lbLoading}</div>
      </div>
    );
  }

  if (!lb.loading && rows.length === 0 && !lb.error) {
    return (
      <div style={{
        padding: 'var(--spacing-8) var(--spacing-4)',
        textAlign: 'center',
        background: 'var(--bg-3)',
        borderRadius: 'var(--radius-m)',
        color: 'var(--fg-3)',
      }}>
        <i className="fa-solid fa-trophy" style={{ fontSize: 28, color: 'var(--fg-4)', display: 'block', marginBottom: 10 }}></i>
        <div className="t-body-m">{t.lbEmpty}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', maxHeight: 460 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 80px 130px',
        gap: 'var(--spacing-3)',
        padding: '0 var(--spacing-3)',
        color: 'var(--fg-3)',
        marginBottom: 2,
      }} className="t-mini-caps">
        <div>{t.lbRank}</div>
        <div>{t.lbPlayer}</div>
        <div style={{ textAlign: 'right' }}>{t.lbPrestige}</div>
        <div style={{ textAlign: 'right' }}>{t.lbTotal}</div>
      </div>

      {rows.map((r, i) => {
        const isSelected = selectedName && (r.name || '').toLowerCase() === selectedName.toLowerCase();
        const isCurrent = currentUser && r.name === currentUser;
        const highlight = isSelected || isCurrent;
        const medal = i === 0 ? '#FFC220' : i === 1 ? '#A6B5C5' : i === 2 ? '#E8A06E' : null;
        return (
          <div
            key={r.name + '-' + i}
            onClick={onPick ? () => onPick(r.name) : undefined}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 80px 130px',
              gap: 'var(--spacing-3)',
              alignItems: 'center',
              padding: '10px var(--spacing-3)',
              background: highlight ? 'var(--primary-i010)' : 'var(--bg-1)',
              border: `1px solid ${highlight ? 'var(--primary-i100)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-s)',
              cursor: onPick ? 'pointer' : 'default',
              transition: 'all 120ms',
            }}
            onMouseEnter={e => { if (onPick && !highlight) { e.currentTarget.style.background = 'var(--primary-i005)'; e.currentTarget.style.borderColor = 'var(--primary-i020)'; } }}
            onMouseLeave={e => { if (onPick && !highlight) { e.currentTarget.style.background = 'var(--bg-1)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; } }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: medal || 'var(--bg-3)',
              color: medal ? '#fff' : 'var(--fg-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              boxShadow: medal ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
            }}>{i + 1}</div>
            <div style={{ minWidth: 0 }}>
              <div className="t-heading-xs" style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name}
                {isCurrent && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: 10, fontWeight: 600,
                    background: 'var(--primary-i100)', color: '#fff',
                    padding: '2px 6px', borderRadius: 999,
                  }}>{t.lbYou}</span>
                )}
              </div>
              <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>
                {formatTime(r.timePlayed || 0)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--warning-i130)', fontWeight: 600 }}>
              <i className="fa-solid fa-crown" style={{ color: 'var(--warning-i100)', fontSize: 11, marginRight: 4 }}></i>
              {formatNum(r.prestige || 0)}
            </div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--primary-i100)', fontWeight: 600 }}>
              {formatNum(r.totalEarned || 0)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardPanel({ username, lang }) {
  const lb = useCloudLeaderboard({ pollMs: 15000 });
  const [, tick] = useStateG(0);
  useEffectG(() => {
    const id = setInterval(() => tick(x => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <LeaderboardHeader lb={lb} lang={lang} />
      <LeaderboardBody lb={lb} lang={lang} currentUser={username} />
    </div>
  );
}

Object.assign(window, { Gate, LeaderboardPanel, useCloudLeaderboard, MiniStat });

function MiniStat({ label, value, icon, color }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--bg-1)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-s)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'var(--bg-3)', color: color || 'var(--fg-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13,
      }}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{label}</div>
        <div className="t-heading-xs" style={{ color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      </div>
    </div>
  );
}
