const { useState, useEffect } = React;
const { 
  Modal, loadUsers, saveUsers, deleteUserSave, resetAllProgress, 
  ADMIN_NAME, formatNum 
} = window;

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
    // 5. Settings (CPS Threshold, etc.)
    window.cloudFetchSettings().then(res => {
      if (res.ok && res.settings) {
        if (res.settings.cpsThreshold) {
          setCpsThreshold(res.settings.cpsThreshold);
          try { localStorage.setItem('admin_cps_threshold', res.settings.cpsThreshold); } catch(e) {}
        }
      }
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
                window.cloudSaveSettings({ cpsThreshold: v });
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
              <button 
                onClick={() => {
                  setGlobalLoading(true);
                  window.cloudFetchLeaderboard().then(res => {
                    if (res.ok) setGlobalUsers(res.scores || []);
                    setGlobalLoading(false);
                  });
                }}
                disabled={globalLoading}
                className="app-btn"
                style={{ ...btn, padding: '4px 10px', background: 'rgba(26,143,255,0.1)', color: '#1a8fff', fontSize: 11, border: '1px solid rgba(26,143,255,0.2)', borderRadius: 8, marginLeft: 'auto' }}
              >
                <i className={`fa-solid ${globalLoading ? 'fa-circle-notch fa-spin' : 'fa-arrows-rotate'}`} style={{ marginRight: 6 }}></i>
                {lang === 'es' ? 'Actualizar' : 'Refresh'}
              </button>
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
                          {window.formatNum(u.totalEarned || 0)} {lang === 'es' ? 'dientes' : 'teeth'} · {lang === 'es' ? 'Prestigio' : 'Prestige'} {u.prestigeCount || 0} · Lv.{u.level || 0}
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

window.AdminPanel = AdminPanel;
