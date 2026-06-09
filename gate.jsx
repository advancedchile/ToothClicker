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

function LeaderboardBody({ lb, lang, currentUser, renderRowExtra, extraColumns = "", noScroll = false }) {
  const t = window.STRINGS[lang];
  const [sortBy, setSortBy] = window.useStateG('prestige'); // 'prestige' or 'level'
  const [selectedPlayer, setSelectedPlayer] = useStateG(null);
  const allRows = lb.scores || [];
  const rows = allRows
    .filter(r => r.name.toLowerCase() !== 'james')
    .sort((a, b) => {
      if (sortBy === 'level') {
        return (b.level || 0) - (a.level || 0) || (b.prestige || 0) - (a.prestige || 0);
      }
      if (sortBy === 'total') {
        return (b.totalEarned || 0) - (a.totalEarned || 0) || (b.prestige || 0) - (a.prestige || 0);
      }
      return (b.prestige || 0) - (a.prestige || 0) || (b.totalEarned || 0) - (a.totalEarned || 0);
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

  const gridCols = `18px 1fr 90px 48px ${extraColumns}`;

  return (
    <React.Fragment>
      <div className="leaderboard-body-list" style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: noScroll ? 'visible' : 'auto', maxHeight: noScroll ? 'none' : 520 }}>
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
          <button 
            onClick={() => { window.playClickSound && window.playClickSound(); setSortBy('total'); }}
            style={{
              all: 'unset', boxSizing: 'border-box', flex: 1, padding: '8px', borderRadius: 8, textAlign: 'center', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              background: sortBy === 'total' ? 'var(--primary-i100)' : 'var(--bg-3)',
              color: sortBy === 'total' ? '#fff' : 'var(--fg-3)',
              transition: 'all 150ms', fontFamily: 'var(--font-sans)'
            }}
          >
            <i className="fa-solid fa-tooth" style={{ marginRight: 6 }}></i>
            {lang === 'es' ? 'POR DIENTES' : 'BY TEETH'}
          </button>
        </div>
        <div className="leaderboard-header-row t-mini-caps" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 'var(--spacing-3)', padding: '0 var(--spacing-3)', color: 'var(--fg-3)', marginBottom: 2 }}>
          <div>{t.lbRank}</div><div>{t.lbPlayer}</div>
          <div style={{ textAlign: 'right' }}>{t.lbPrestige}</div>
          <div style={{ textAlign: 'center' }}>Info</div>
          {extraColumns && <div></div>}
        </div>
        {rows.map((r, i) => {
          const isCurrent = currentUser && r.name === currentUser;
          const medal = i === 0 ? '#FFC220' : i === 1 ? '#A6B5C5' : i === 2 ? '#E8A06E' : null;
          return (
            <div key={r.name + '-' + i} className={`leaderboard-row ${isCurrent ? 'current-player' : ''}`} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 'var(--spacing-3)', alignItems: 'center', padding: '10px var(--spacing-3)', background: isCurrent ? 'var(--primary-i010)' : 'var(--bg-1)', border: `1px solid ${isCurrent ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-s)' }}>
              <div className="leaderboard-rank-num" style={{ color: medal || 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>{i + 1}</div>
              <div className="leaderboard-player-col" style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className="leaderboard-tooth-wrapper" style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                  {window.TOOTH_STAGES && (() => {
                    const stage = window.getToothStage(r.prestigeCount || 0, r.level || 1);
                    return (i === 0 && stage.glbData) ? (
                      <div style={{ position: 'absolute', width: 64, height: 64, pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
                        <window.Tooth3DViewer glbData={stage.glbData} textureUrl={stage.img} style={{ width: '100%', height: '100%' }} animateFloat={false} />
                      </div>
                    ) : (
                      <img src={stage.img} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    );
                  })()}
                  {(() => {
                    const timeSince = Date.now() - r.updatedAt;
                    const online = r.isOnline !== false && timeSince < 60000;
                    return (
                      <div style={{ 
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 8,
                        height: 8,
                        borderRadius: '50%', 
                        background: online ? '#22C55E' : '#94A3B8', 
                        boxShadow: online ? '0 0 6px #22C55E' : 'none', 
                        border: '1.5px solid var(--bg-1)',
                        zIndex: 2
                      }} />
                    );
                  })()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="t-heading-xs" style={{ color: 'var(--fg-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    {isCurrent && <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 10, fontWeight: 600, background: 'var(--primary-i100)', color: '#fff', padding: '2px 6px', borderRadius: 999 }}>{t.lbYou}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--primary-i100)', fontWeight: 600, marginBottom: 2, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.clinicName ? r.clinicName : (lang === 'es' ? `Clínica de ${r.name}` : `${r.name}'s Clinic`)}</span>
                    <span style={{ color: 'var(--fg-3)', fontWeight: 400, flexShrink: 0 }}>Niv. {r.level || 0}</span>
                  </div>
                </div>
              </div>
              <div className="leaderboard-prestige-col" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--warning-i130)', fontWeight: 600 }}>
                <i className="fa-solid fa-crown" style={{ color: 'var(--warning-i100)', fontSize: 11, marginRight: 4 }}></i>
                <window.Odometer value={r.prestige || 0} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    window.playClickSound && window.playClickSound(); 
                    setSelectedPlayer(r); 
                  }}
                  className="leaderboard-info-btn"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    window.setGlobalTooltip && window.setGlobalTooltip({
                      type: 'text',
                      text: lang === 'es' ? 'Ver detalles' : 'View details',
                      pos: { x: rect.left + rect.width / 2, y: rect.top }
                    });
                  }}
                  onMouseLeave={() => {
                    window.setGlobalTooltip && window.setGlobalTooltip(null);
                  }}
                >
                  <i className="fa-solid fa-info"></i>
                </button>
              </div>
              {renderRowExtra && renderRowExtra(r)}
            </div>
          );
        })}
      </div>
      {window.ReactDOM ? window.ReactDOM.createPortal(
        <React.Fragment>
          <div 
            className={`player-sidebar-overlay ${selectedPlayer ? 'open' : ''}`} 
            onClick={() => { window.playClickSound && window.playClickSound(); setSelectedPlayer(null); }} 
          />
          <div className={`player-sidebar ${selectedPlayer ? 'open' : ''}`}>
            {selectedPlayer && (
              <React.Fragment>
                <button 
                  className="player-sidebar-close" 
                  onClick={() => { window.playClickSound && window.playClickSound(); setSelectedPlayer(null); }} 
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <PlayerDetailSidebar 
                  player={selectedPlayer} 
                  lang={lang} 
                />
              </React.Fragment>
            )}
          </div>
        </React.Fragment>,
        document.body
      ) : (
        <React.Fragment>
          <div 
            className={`player-sidebar-overlay ${selectedPlayer ? 'open' : ''}`} 
            onClick={() => { window.playClickSound && window.playClickSound(); setSelectedPlayer(null); }} 
          />
          <div className={`player-sidebar ${selectedPlayer ? 'open' : ''}`}>
            {selectedPlayer && (
              <React.Fragment>
                <button 
                  className="player-sidebar-close" 
                  onClick={() => { window.playClickSound && window.playClickSound(); setSelectedPlayer(null); }} 
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <PlayerDetailSidebar 
                  player={selectedPlayer} 
                  lang={lang} 
                />
              </React.Fragment>
            )}
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
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

  return <div><LeaderboardHeader lb={{...lb, refresh: handleRefresh}} lang={lang} /><LeaderboardBody lb={lb} lang={lang} currentUser={username} noScroll={true} /></div>;
}

function PlayerDetailSidebar({ player, lang }) {
  const { name, clinicName, level, teeth, prestigeCount, totalEarned, timePlayed, isOnline, updatedAt, saveData } = player;
  
  const stage = window.getToothStage ? window.getToothStage(prestigeCount || 0, level || 1) : { img: 'uploads/tooth1.png' };
  const displayClinic = clinicName || (lang === 'es' ? `Clínica de ${name}` : `${name}'s Clinic`);
  const online = isOnline !== false && (Date.now() - updatedAt) < 60000;

  const stats = React.useMemo(() => {
    let sd = saveData;
    if (typeof sd === 'string') {
      try { sd = JSON.parse(sd); } catch(e) {}
    }
    
    // If saveData is missing or empty for players who have earned teeth, we consider it unsynced and return null.
    if (!sd || typeof sd !== 'object' || (totalEarned > 0 && !sd.totalClicks && !sd.generators)) {
      return null;
    }
    
    // Store upgrades multiplier
    const storeMults = { click: 1, global: 1, gen: {} };
    const boughtStoreUpgrades = Object.keys(sd.storeUpgrades || {});
    boughtStoreUpgrades.forEach(id => {
      const up = (window.STORE_UPGRADES || []).find(u => u.id === id);
      if (!up) return;
      if (up.type === 'click') storeMults.click *= up.multiplier;
      if (up.type === 'global') storeMults.global *= up.multiplier;
      if (up.type === 'generator') storeMults.gen[up.targetId] = (storeMults.gen[up.targetId] || 1) * up.multiplier;
    });

    const bonusPerSmile = window.GAME_CONTENT?.prestigeConfig?.bonusPerSmile ?? 0.05;
    const prestigeMult = 1 + bonusPerSmile * (sd.prestige || 0);
    const achUnlockedCount = Object.values(sd.achievements || {}).filter(Boolean).length;
    const achMult = 1 + 0.01 * achUnlockedCount;
    
    const xpUpgrades = sd.xpUpgrades || {};
    const academyGpsMult = (() => {
      const regular = (window.XP_UPGRADES || []).reduce((acc, up) => acc + (xpUpgrades[up.id] ? (up.gpsBonus || 0) : 0), 0);
      const special = (window.LEVEL_UPGRADES || []).reduce((acc, up) => acc + (xpUpgrades[up.id] ? (up.gpsBonus || 0) : 0), 0);
      return 1 + regular + special;
    })();

    const globalMult = prestigeMult * achMult * storeMults.global * academyGpsMult;

    // Generators production
    let perSecondRaw = 0;
    const generatorsObj = sd.generators || {};
    let totalGenerators = 0;
    for (const g of window.GENERATORS || []) {
      const count = generatorsObj[g.id] || 0;
      totalGenerators += count;
      let gProd = count * g.baseProduction;
      if (storeMults.gen[g.id]) gProd *= storeMults.gen[g.id];
      perSecondRaw += gProd;
    }
    const perSecond = perSecondRaw * globalMult;

    // Click power
    let clickBase = 1;
    if (window.computeClickPower) {
      try {
        clickBase = window.computeClickPower(sd).total;
      } catch (e) {
        let flat = 1, mult = 1;
        const ups = sd.clickUpgrades || {};
        const playTime = sd.timePlayed || 0;
        for (const u of window.CLICK_UPGRADES || []) {
          if (!ups[u.id]) continue;
          if (u.type === 'flat') flat += u.value;
          else if (u.type === 'mult') mult *= u.value;
          else if (u.type === 'perAch') { mult *= (1 + (u.value / 100) * achUnlockedCount); }
          else if (u.type === 'timeBonus') { if (playTime >= u.threshold) mult *= (1 + u.value / 100); }
        }
        clickBase = flat * mult;
      }
    }
    const perClick = clickBase * (storeMults.click || 1) * globalMult;

    return {
      perSecond,
      perClick,
      totalClicks: sd.totalClicks || 0,
      goldenClicks: sd.goldenClicks || 0,
      diamondClicks: sd.diamondClicks || 0,
      crystalClicks: sd.crystalClicks || 0,
      achievementsCount: achUnlockedCount,
      clickUpgradesCount: Object.values(sd.clickUpgrades || {}).filter(Boolean).length,
      academyUpgradesCount: Object.values(sd.xpUpgrades || {}).filter(Boolean).length,
      totalGenerators,
      startedAt: sd.startedAt ? new Date(sd.startedAt).toLocaleDateString() : null
    };
  }, [saveData, totalEarned]);

  const t = {
    es: {
      title: 'Detalles del jugador',
      general: 'Progreso General',
      teeth: 'Dientes actuales',
      totalTeeth: 'Dientes totales',
      level: 'Nivel',
      time: 'Tiempo jugado',
      started: 'Miembro desde',
      status: 'Estado',
      online: 'En línea',
      offline: 'Desconectado',
      clicks: 'Estadísticas de Clicks',
      totalClicks: 'Clicks totales',
      clickPower: 'Poder de click',
      golden: 'Dientes de oro',
      diamond: 'Dientes de diamante',
      crystal: 'Dientes de cristal',
      upgrades: 'Mejoras y Logros',
      cps: 'Producción por segundo',
      generators: 'Generadores',
      clickUps: 'Mejoras de click',
      achievements: 'Logros',
      academy: 'Mejoras de academia',
      prestigeCount: 'Prestigios',
      prestigeTimes: prestigeCount === 1 ? '1 prestigio' : `${prestigeCount} prestigios`
    },
    en: {
      title: 'Player Details',
      general: 'General Progress',
      teeth: 'Current teeth',
      totalTeeth: 'All-time teeth',
      level: 'Level',
      time: 'Time played',
      started: 'Member since',
      status: 'Status',
      online: 'Online',
      offline: 'Offline',
      clicks: 'Click Statistics',
      totalClicks: 'Total clicks',
      clickPower: 'Click power',
      golden: 'Golden teeth',
      diamond: 'Diamond teeth',
      crystal: 'Crystal teeth',
      upgrades: 'Upgrades & Achievements',
      cps: 'Production per second',
      generators: 'Generators owned',
      clickUps: 'Click upgrades',
      achievements: 'Achievements',
      academy: 'Academy upgrades',
      prestigeCount: 'Prestiges',
      prestigeTimes: prestigeCount === 1 ? '1 prestige' : `${prestigeCount} prestiges`
    }
  }[lang] || t.es;

  return (
    <React.Fragment>
      <div className="player-sidebar-header">
        {stage.glbData ? (
          <div className="player-sidebar-avatar" style={{ position: 'relative', width: 200, height: 200, marginTop: -20, marginBottom: -10, cursor: 'grab' }}>
            <window.Tooth3DViewer glbData={stage.glbData} textureUrl={stage.img} style={{ width: '100%', height: '100%' }} />
          </div>
        ) : (
          <img src={stage.img} className="player-sidebar-avatar" alt="" />
        )}
        <h2 className="player-sidebar-name">{name}</h2>
        <div className="player-sidebar-subtitle">
          <span>{displayClinic}</span>
          <span className="player-sidebar-prestige-sep">•</span>
          <span className="player-sidebar-prestige-inline">
            <i className="fa-solid fa-crown" style={{ color: 'var(--warning-i100)', marginRight: 4 }}></i>
            {t.prestigeTimes}
          </span>
        </div>
      </div>
      
      <div className="player-sidebar-body">
        {/* Section 1: General Info */}
        <div className="player-sidebar-section">
          <h3 className="player-sidebar-section-title">
            <i className="fa-solid fa-chart-line"></i> {t.general}
          </h3>
          <div className="player-sidebar-grid">
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.status}</span>
              <span className="player-sidebar-card-value" style={{ color: online ? '#22C55E' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? '#22C55E' : '#64748B', display: 'inline-block' }}></span>
                {online ? t.online : t.offline}
              </span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.level}</span>
              <span className="player-sidebar-card-value">Niv. {level || 0}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.teeth}</span>
              <span className="player-sidebar-card-value"><window.Odometer value={teeth || 0} /></span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.totalTeeth}</span>
              <span className="player-sidebar-card-value"><window.Odometer value={totalEarned || 0} /></span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.time}</span>
              <span className="player-sidebar-card-value">{window.formatTime(timePlayed || 0)}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.started}</span>
              <span className="player-sidebar-card-value">{stats?.startedAt || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Click Statistics */}
        <div className="player-sidebar-section">
          <h3 className="player-sidebar-section-title">
            <i className="fa-solid fa-mouse-pointer"></i> {t.clicks}
          </h3>
          <div className="player-sidebar-grid">
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.totalClicks}</span>
              <span className="player-sidebar-card-value">{stats ? <window.Odometer value={stats.totalClicks} /> : 'N/A'}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.clickPower}</span>
              <span className="player-sidebar-card-value">{stats ? <window.Odometer value={stats.perClick} /> : 'N/A'}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.golden}</span>
              <span className="player-sidebar-card-value">{stats ? <window.Odometer value={stats.goldenClicks} /> : 'N/A'}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.diamond}</span>
              <span className="player-sidebar-card-value">{stats ? <window.Odometer value={stats.diamondClicks} /> : 'N/A'}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.crystal}</span>
              <span className="player-sidebar-card-value">{stats ? <window.Odometer value={stats.crystalClicks} /> : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Upgrades & Production */}
        <div className="player-sidebar-section">
          <h3 className="player-sidebar-section-title">
            <i className="fa-solid fa-gears"></i> {t.upgrades}
          </h3>
          <div className="player-sidebar-grid">
            <div className="player-sidebar-card" style={{ gridColumn: 'span 2' }}>
              <span className="player-sidebar-card-label">{t.cps}</span>
              <span className="player-sidebar-card-value" style={{ color: 'var(--primary-i100)' }}>
                {stats ? <window.Odometer value={stats.perSecond} /> : 'N/A'}
              </span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.generators}</span>
              <span className="player-sidebar-card-value">{stats ? <window.Odometer value={stats.totalGenerators} /> : 'N/A'}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.clickUps}</span>
              <span className="player-sidebar-card-value">{stats ? stats.clickUpgradesCount : 'N/A'}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.achievements}</span>
              <span className="player-sidebar-card-value">{stats ? stats.achievementsCount : 'N/A'}</span>
            </div>
            <div className="player-sidebar-card">
              <span className="player-sidebar-card-label">{t.academy}</span>
              <span className="player-sidebar-card-value">{stats ? stats.academyUpgradesCount : 'N/A'}</span>
            </div>
          </div>
        </div>

        {!stats && (
          <div className="player-sidebar-no-data">
            {lang === 'es' 
              ? '* No hay datos de guardado sincronizados recientemente para mostrar más estadísticas.' 
              : '* No recently synchronized save data to show additional statistics.'}
          </div>
        )}
      </div>
    </React.Fragment>
  );
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

// ── Dental anti-bot questions ──────────────────────────────────────────────
const DENTAL_QUESTIONS = [
  {
    id: 1,
    q_es: "¿Cuántos dientes tiene un adulto promedio sin muelas del juicio? (Ingresa número)",
    q_en: "How many teeth does an average adult have without wisdom teeth? (Enter number)",
    ans: ["28"]
  },
  {
    id: 2,
    q_es: "Si tienes 32 dientes y el dentista te extrae 2 molares, ¿cuántos te quedan? (Ingresa número)",
    q_en: "If you have 32 teeth and the dentist extracts 2 molars, how many do you have left? (Enter number)",
    ans: ["30"]
  },
  {
    id: 3,
    q_es: "Escribe la palabra 'DIENTE' en mayúsculas para continuar:",
    q_en: "Type the word 'TOOTH' in capital letters to continue:",
    ans: ["DIENTE", "TOOTH"]
  },
  {
    id: 4,
    q_es: "¿Cuál es el color ideal de un diente sano y limpio? (Ingresa una palabra)",
    q_en: "What is the ideal color of a clean, healthy tooth? (Enter one word)",
    ans: ["blanco", "white", "blancos"]
  },
  {
    id: 5,
    q_es: "¿Qué hadita te deja monedas bajo la almohada si dejas un diente de leche?",
    q_en: "What fairy leaves you coins under your pillow if you leave a baby tooth?",
    ans: ["hadita de los dientes", "tooth fairy", "hada", "hadita"]
  }
];

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

  // Anti-bot security states
  const [websiteField, setWebsiteField] = useStateG('');
  const [challengeQuestion, setChallengeQuestion] = useStateG(null);
  const [challengeAnswer, setChallengeAnswer] = useStateG('');
  
  const [googleSession, setGoogleSession] = useStateG(false);
  const [showManualRegister, setShowManualRegister] = useStateG(false);  
  useEffectG(() => {
    if (window.cloudFetchPlayerByAuth) {
      window.cloudFetchPlayerByAuth().then(res => {
        if (res.ok && res.found) {
          const intentUser = localStorage.getItem('link_intent_user');
          const intentPass = localStorage.getItem('link_intent_pass');
          if (intentUser) {
             window.cloudLinkGoogleAccount(intentUser, intentPass).then(linkRes => {
                localStorage.removeItem('link_intent_user');
                localStorage.removeItem('link_intent_pass');
                if (linkRes.ok) {
                   window.cloudFetchPlayerByAuth().then(r => {
                      if (r.ok && r.found) onSelectUser(r.player.name, r.player, null);
                   });
                } else {
                   alert(lang === 'es' ? 'Error al vincular cuenta: ' + linkRes.error : 'Error linking account: ' + linkRes.error);
                   onSelectUser(res.player.name, res.player, null);
                }
             });
          } else {
            onSelectUser(res.player.name, res.player, null);
          }
        } else if (res.ok && !res.found) {
           setGoogleSession(true); // New Google User
        } else if (res.error && res.error !== 'No estas autenticado con Google' && res.error !== 'Auth session missing!') {
           console.log('Google Auth Error:', res.error);
        }
      });
    }
  }, [onSelectUser, lang]);

  const RESERVED = (window.ADMIN_NAME || 'James').toLowerCase();

  const cloudUser = useMemoG(() => {
    const t = name.trim().toLowerCase();
    if (!t) return null;
    return (lb.scores || []).find(s => s.name.toLowerCase() === t);
  }, [name, lb.scores]);

  const nameReserved = useMemoG(() => name.trim().toLowerCase() === RESERVED, [name]);

  // Pick a fresh question whenever registration mode is active and the name changes
  useEffectG(() => {
    if (name.trim() && !cloudUser) {
      const q = DENTAL_QUESTIONS[Math.floor(Math.random() * DENTAL_QUESTIONS.length)];
      setChallengeQuestion(q);
      setChallengeAnswer('');
    } else {
      setChallengeQuestion(null);
      setChallengeAnswer('');
    }
  }, [name, cloudUser]);

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    const cleanInput = name.trim();
    if (!cleanInput || nameReserved || loading) return;

    // Case-insensitive matching to use existing DB casing or capitalize the first letter for new users
    const matchingScoreUser = (lb.scores || []).find(s => s.name.toLowerCase() === cleanInput.toLowerCase());
    const cleanName = matchingScoreUser ? matchingScoreUser.name : (cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1));

    // 1. Honeypot check: Bots automatically fill all visible/hidden text fields
    if (websiteField.trim() !== '') {
      console.warn("Honeypot filled. Bot rejected.");
      setError(lang === 'es' ? 'Error de red. Intenta de nuevo más tarde.' : 'Network error. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');

    if (cloudUser && !googleSession) {
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
      if (!googleSession && !showPassword) {
        setShowPassword(true);
        setLoading(false);
        return;
      }

      // 2. Dental Captcha check
      if (!googleSession && challengeQuestion) {
        const cleanAns = challengeAnswer.trim().toLowerCase();
        const isCorrect = challengeQuestion.ans.some(a => {
          const expected = a.toLowerCase().trim();
          return cleanAns === expected || cleanAns.includes(expected) || expected.includes(cleanAns) && cleanAns.length >= 2;
        });

        if (!cleanAns || !isCorrect) {
          setError(lang === 'es' ? '❌ Respuesta anti-bot incorrecta' : '❌ Incorrect anti-bot answer');
          setLoading(false);
          return;
        }
      }

      onCreateUser(cleanName, googleSession ? 'oauth' : password);
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
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'url(uploads/background-e5bd6167.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 24px', width: '100%', maxWidth: 400 }}>

        <img src={window.GAME_CONTENT?.terminology?.images?.logoVertical || "uploads/logo-vertical.png"} alt="ToothClicker" style={{ width: 220, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0 8px 24px rgba(80,140,220,0.22))', animation: 'pulse 1.5s infinite ease-in-out' }} />

        {/* Initial login buttons */}
        {!deviceUser && !googleSession && !showManualRegister && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <button
              type="button"
              onClick={async () => {
                 setLoading(true);
                 await window.cloudLoginWithGoogle();
              }}
              className="app-btn"
              style={{
                all: 'unset', boxSizing: 'border-box',
                width: '100%', padding: '12px', borderRadius: 999,
                background: '#fff', color: '#444', fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #ddd',
                fontFamily: 'var(--font-sans)'
              }}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: 20, height: 20 }} />
              {lang === 'es' ? 'Continuar con Google' : 'Continue with Google'}
            </button>
            <button
              type="button"
              onClick={() => setShowManualRegister(true)}
              className="app-btn"
              style={{
                all: 'unset', boxSizing: 'border-box',
                width: '100%', padding: '12px', borderRadius: 999,
                background: '#1a8fff', color: '#fff', fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(26,143,255,0.2)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              <i className="fa-solid fa-user-pen"></i>
              {lang === 'es' ? 'Continuar registro manual' : 'Continue manual registration'}
            </button>
          </div>
        )}

        {/* Registration/Login Form — only if this device hasn't registered yet AND they chose a method */}
        {!deviceUser && (showManualRegister || googleSession) && (
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            {/* Honeypot field (hidden offscreen) */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
              <input
                type="text"
                name="user_website"
                value={websiteField}
                onChange={e => setWebsiteField(e.target.value)}
                tabIndex="-1"
                autoComplete="off"
              />
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <input
                autoFocus
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                maxLength={24}
                placeholder={googleSession ? (lang === 'es' ? 'Elige tu nombre (Google)' : 'Pick your name (Google)') : (lang === 'es' ? 'Tu nombre...' : 'Your name...')}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 22px',
                  fontSize: 16, fontFamily: "'PixelifySans', var(--font-sans)",
                  border: `2px solid ${error ? '#e55' : 'rgba(100,160,230,0.5)'}`,
                  borderRadius: 999, background: googleSession ? 'rgba(230, 245, 255, 0.95)' : 'rgba(255,255,255,0.88)', color: '#334',
                  outline: 'none', backdropFilter: 'blur(4px)',
                  boxShadow: '0 2px 12px rgba(80,140,220,0.10)', transition: 'border 150ms',
                }}
              />
            </div>



            {!googleSession && showPassword && (
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

            {/* Custom Dental Captcha Challenge */}
            {!googleSession && !cloudUser && showPassword && challengeQuestion && (
              <div style={{
                width: '100%',
                background: 'rgba(250, 245, 255, 0.9)',
                border: '2px dashed #a855f7',
                borderRadius: 14,
                padding: '12px 16px',
                marginTop: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                animation: 'modalIn 0.35s ease',
                boxSizing: 'border-box',
                boxShadow: '0 4px 12px rgba(168,85,247,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7e22ce', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
                  <i className="fa-solid fa-tooth" style={{ animation: 'anim-pulse 1s infinite' }}></i>
                  <span>{lang === 'es' ? 'DESAFÍO DENTAL ANTI-BOTS' : 'ANTI-BOT DENTAL CHALLENGE'}</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#3b0764', fontWeight: 600, fontFamily: 'var(--font-sans)', lineHeight: 1.35 }}>
                  {lang === 'es' ? challengeQuestion.q_es : challengeQuestion.q_en}
                </div>
                <input
                  type="text"
                  value={challengeAnswer}
                  onChange={e => { setChallengeAnswer(e.target.value); setError(''); }}
                  placeholder={lang === 'es' ? 'Tu respuesta aquí...' : 'Your answer here...'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '8px 14px',
                    fontSize: 13, fontFamily: 'var(--font-sans)',
                    border: '1.5px solid #d8b4fe',
                    borderRadius: 8, background: '#fff', color: '#1a052e',
                    outline: 'none', transition: 'border 150ms'
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
                  <i className={googleSession ? "fa-brands fa-google" : (cloudUser ? "fa-solid fa-cloud-arrow-down" : "fa-solid fa-user-plus")}></i>
                  {googleSession ? (lang === 'es' ? 'Finalizar Registro' : 'Finish Registration') : (cloudUser ? (lang === 'es' ? 'Continuar Partida' : 'Continue Game') : (lang === 'es' ? 'Empezar a Jugar' : 'Start Playing'))}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowManualRegister(false);
                if (googleSession && window._supabase) {
                  window._supabase.auth.signOut();
                  setGoogleSession(false);
                }
              }}
              style={{
                all: 'unset', cursor: 'pointer', color: '#1a8fff', fontSize: 13,
                fontWeight: 600, fontFamily: 'var(--font-sans)', marginTop: 8,
                textDecoration: 'underline'
              }}
            >
              {lang === 'es' ? 'Volver atrás' : 'Go back'}
            </button>

            <div style={{ fontSize: 12, color: error ? '#c33' : 'rgba(80,110,150,0.7)', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
              {error || (nameReserved
                ? (lang === 'es' ? '⚠ Ese nombre está reservado' : '⚠ That name is reserved')
                : googleSession
                  ? (lang === 'es' ? 'Elige tu usuario para vincular a Google' : 'Pick your username to link to Google')
                  : cloudUser 
                    ? (lang === 'es' ? 'Jugador encontrado en la nube' : 'Player found in cloud')
                    : (lang === 'es' ? 'Elige un nombre y contraseña para guardar tu progreso' : 'Pick a name and password to save your progress'))}
            </div>
          </form>
        )}

        {/* Public user pills */}
        {deviceUser && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(80,110,150,0.65)', fontFamily: 'var(--font-sans)', textAlign: 'center', marginBottom: 2 }}>
              {lang === 'es' ? 'Tu perfil activo' : 'Your active profile'}
            </div>
            <UserPill 
              name={deviceUser} 
              onSelect={async (name) => {
                const save = window.loadUserSave(name);
                const pass = save ? save.password : null;
                if (pass) {
                  const res = await window.cloudAuthenticate(name, pass);
                  if (res.ok) {
                    onSelectUser(name, res.player, pass);
                  } else {
                    onLogoutDeviceUser();
                  }
                } else {
                  onLogoutDeviceUser();
                }
              }} 
              isOwn={true} 
              onLogout={onLogoutDeviceUser}
              isOnline={(lb.scores || []).some(s => s.name === deviceUser && (Date.now() - s.updatedAt) < 120000)}
            />
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

      {showLb && window.innerWidth > 768 && (
        <window.Modal onClose={() => setShowLb(false)} maxWidth={640}>
          <LeaderboardHeader lb={lb} lang={lang} />
          <LeaderboardBody lb={lb} lang={lang} currentUser={null} />
        </window.Modal>
      )}

      <div 
        className={`mobile-tab-view-overlay ${showLb && window.innerWidth <= 768 ? 'open' : ''}`}
        onClick={() => setShowLb(false)}
      >
        <div className="mobile-tab-view-sheet" onClick={e => e.stopPropagation()}>
          <div className="mobile-tab-view-header">
            <div className="mobile-tab-view-title">
              <i className="fa-solid fa-ranking-star"></i>
              <span>{lang === 'es' ? 'Ranking Global' : 'Global Ranking'}</span>
            </div>
            <button className="mobile-tab-view-close" onClick={() => setShowLb(false)}>&times;</button>
          </div>
          <div className="mobile-tab-view-body">
            {showLb && window.innerWidth <= 768 && (
              <LeaderboardPanel username={deviceUser || null} lang={lang} />
            )}
          </div>
        </div>
      </div>

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

Object.assign(window, { Gate, LeaderboardPanel, LeaderboardHeader, LeaderboardBody, MiniStat, useCloudLeaderboard });
