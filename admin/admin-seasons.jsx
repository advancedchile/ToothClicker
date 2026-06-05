const { useState, useEffect } = React;

function AdminDatePickerContent({ endDate, setEndDate, setShowDatePicker, lang }) {
  const initialDate = endDate ? new Date(endDate) : new Date();
  const [d, setD] = useState(String(initialDate.getDate()).padStart(2, '0'));
  const [m, setM] = useState(String(initialDate.getMonth() + 1).padStart(2, '0'));
  const [y, setY] = useState(String(initialDate.getFullYear()));
  const [h, setH] = useState(String(initialDate.getHours()).padStart(2, '0'));
  const [min, setMin] = useState(String(initialDate.getMinutes()).padStart(2, '0'));

  const days = Array.from({length: 31}, (_, i) => ({ value: String(i+1).padStart(2, '0'), label: String(i+1).padStart(2, '0') }));
  const months = Array.from({length: 12}, (_, i) => ({ value: String(i+1).padStart(2, '0'), label: String(i+1).padStart(2, '0') }));
  const years = Array.from({length: 10}, (_, i) => ({ value: String(new Date().getFullYear() + i), label: String(new Date().getFullYear() + i) }));
  const hours = Array.from({length: 24}, (_, i) => ({ value: String(i).padStart(2, '0'), label: String(i).padStart(2, '0') }));
  const mins = Array.from({length: 60}, (_, i) => ({ value: String(i).padStart(2, '0'), label: String(i).padStart(2, '0') }));

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label className="form-label">{lang === 'es' ? 'Día' : 'Day'}</label>
          <window.Dropdown value={d} onChange={setD} options={days} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">{lang === 'es' ? 'Mes' : 'Month'}</label>
          <window.Dropdown value={m} onChange={setM} options={months} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">{lang === 'es' ? 'Año' : 'Year'}</label>
          <window.Dropdown value={y} onChange={setY} options={years} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 30 }}>
        <div style={{ flex: 1 }}>
          <label className="form-label">{lang === 'es' ? 'Hora' : 'Hour'}</label>
          <window.Dropdown value={h} onChange={setH} options={hours} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">{lang === 'es' ? 'Minuto' : 'Minute'}</label>
          <window.Dropdown value={min} onChange={setMin} options={mins} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
        <button className="app-btn" onClick={() => setShowDatePicker(false)} style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', minWidth: 100 }}>
          {lang === 'es' ? 'Cancelar' : 'Cancel'}
        </button>
        <button 
          className="app-btn" 
          onClick={() => {
            setEndDate(`${y}-${m}-${d}T${h}:${min}`);
            setShowDatePicker(false);
          }} 
          style={{ background: 'var(--primary-i100)', color: '#fff', minWidth: 100 }}
        >
          {lang === 'es' ? 'Guardar' : 'Save'}
        </button>
      </div>
    </>
  );
}
window.AdminSeasons = function({ lang }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [activeConfig, setActiveConfig] = useState(null);
  const [seasonLogs, setSeasonLogs] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Form State
  const [name, setName] = useState('');
  const [endDate, setEndDate] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [image, setImage] = useState('');
  const [audio, setAudio] = useState('');
  const [description, setDescription] = useState('');

  // Modals & Accordions
  const [modalMsg, setModalMsg] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleLog = (id) => setExpandedLogs(p => ({ ...p, [id]: !p[id] }));

  const formatSeasonTime = (endDate) => {
    const ms = new Date(endDate).getTime() - Date.now();
    if (ms <= 0) return lang === 'es' ? 'Finalizada (Requiere reinicio)' : 'Ended (Requires reset)';
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load config
    const configRes = await window.cloudGetSeasonConfig();
    const logsRes = await window.cloudGetSeasonLogs();
    const tempRes = await window.cloudFetchTemplates();

    if (tempRes.ok) setTemplates(tempRes.templates || []);
    if (logsRes.ok) setSeasonLogs(logsRes.logs || []);
    
    if (configRes.ok && configRes.config) {
      const c = configRes.config;
      setActiveConfig(c);
      setName(c.name || '');
      setTemplateId(c.templateId || '');
      setImage(c.image || '');
      setAudio(c.audio || '');
      setDescription(c.description || '');
      
      // format date for datetime-local input
      if (c.endDate) {
        const d = new Date(c.endDate);
        const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
        const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
        setEndDate(localISOTime);
      }
    }
    
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!name || !endDate || !templateId) {
      setModalMsg({
        title: lang === 'es' ? 'Error' : 'Error',
        text: lang === 'es' ? 'Faltan campos obligatorios (Nombre, Fecha, Plantilla)' : 'Missing required fields (Name, Date, Template)'
      });
      return;
    }

    setSaving(true);
    
    const configToSave = {
      id: 'season_' + Date.now(),
      name,
      endDate: new Date(endDate).getTime(),
      templateId,
      image,
      audio,
      description,
      createdAt: Date.now()
    };

    const res = await window.cloudSaveSeasonConfig(configToSave);
    if (res.ok) {
      setModalMsg({
        title: lang === 'es' ? '¡Éxito!' : 'Success!',
        text: lang === 'es' ? 'Temporada programada guardada con éxito.' : 'Scheduled season saved successfully.'
      });
      await loadData();
    } else {
      setModalMsg({ title: 'Error', text: res.error });
    }
    setSaving(false);
  };

  const doCancelConfig = async () => {
    setShowCancelModal(false);
    setSaving(true);
    const res = await window.cloudSaveSeasonConfig(null);
    if (res.ok) {
      setActiveConfig(null);
      setName('');
      setEndDate('');
      setTemplateId('');
      setImage('');
      setAudio('');
      setDescription('');
      setModalMsg({ title: lang === 'es' ? 'Cancelada' : 'Cancelled', text: lang === 'es' ? 'Temporada cancelada.' : 'Season cancelled.' });
    } else {
      setModalMsg({ title: 'Error', text: res.error });
    }
    setSaving(false);
  };

  const doWipeConfig = async () => {
    setShowWipeModal(false);
    setSaving(true);
    const wipeRes = await window.cloudTriggerSeasonWipe(activeConfig);
    if (wipeRes.ok) {
      setModalMsg({ title: lang === 'es' ? '¡Éxito!' : 'Success!', text: lang === 'es' ? 'Reinicio de temporada ejecutado correctamente. Se publicará la plantilla oficial y los jugadores han sido archivados.' : 'Season reset executed successfully. The official template is published and players are archived.' });
      await loadData();
    } else {
      setModalMsg({ title: 'Error', text: wipeRes.error });
    }
    setSaving(false);
  };

  const card = { background: 'var(--bg-2)', borderRadius: 16, padding: '24px', border: '1px solid var(--border)', marginBottom: 24 };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--fg-3)' }}></i></div>;
  }

  return (
    <div style={{ padding: 24, width: '100%', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: 24, color: 'var(--fg-1)' }}>
        {lang === 'es' ? 'Gestión de Temporadas' : 'Season Management'}
      </h2>

      {/* Programar Temporada */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-1)' }}>
          <i className="fa-solid fa-calendar-check" style={{ color: 'var(--primary-i100)' }}></i>
          {lang === 'es' ? 'Programar Próxima Temporada' : 'Schedule Next Season'}
        </h3>
        
        {activeConfig && (
          <div style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: 8, marginBottom: 20, border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="fa-solid fa-clock fa-bounce" style={{ fontSize: 20 }}></i>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{lang === 'es' ? '¡Temporada Activa!' : 'Season Active!'}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {lang === 'es' 
                    ? 'El juego seguirá en curso hasta que fuerces el reinicio manual.' 
                    : 'The game will continue until you manually force the reset.'}
                </div>
              </div>
            </div>
            <button className="app-btn" onClick={() => setShowWipeModal(true)} disabled={saving} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', fontWeight: 'bold' }}>
              <i className="fa-solid fa-power-off"></i> {lang === 'es' ? 'Forzar Reinicio Ahora' : 'Force Reset Now'}
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label className="form-label">{lang === 'es' ? 'Nombre' : 'Name'}</label>
            <input type="text" className="app-input" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Temporada de Halloween" />
          </div>
          <div>
            <label className="form-label">{lang === 'es' ? 'Fecha y Hora de Fin' : 'End Date & Time'}</label>
            <div 
              style={{ 
                width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                padding: '12px 16px', background: '#f8fafc', borderRadius: 14, 
                border: '2px solid #e2e8f0', color: '#1a3a5a', boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)', fontSize: 14, minHeight: 46
              }}
              onClick={() => setShowDatePicker(true)}
            >
              {endDate ? new Date(endDate).toLocaleString() : (lang === 'es' ? 'dd/mm/aaaa, --:--' : 'mm/dd/yyyy, --:--')}
              <i className="fa-regular fa-calendar" style={{ marginLeft: 'auto', color: 'var(--fg-3)' }}></i>
            </div>
            
            {showDatePicker && (
              <window.Modal onClose={() => setShowDatePicker(false)} maxWidth={420} persistent={false}>
                <div style={{ padding: '24px 20px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: 24, color: 'var(--fg-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fa-regular fa-calendar-days" style={{ color: 'var(--primary-i100)' }}></i>
                    {lang === 'es' ? 'Seleccionar Fecha y Hora' : 'Select Date & Time'}
                  </h3>
                  
                  <AdminDatePickerContent 
                    endDate={endDate} 
                    setEndDate={setEndDate} 
                    setShowDatePicker={setShowDatePicker} 
                    lang={lang} 
                  />
                </div>
              </window.Modal>
            )}
          </div>
          <div>
            <label className="form-label">{lang === 'es' ? 'Plantilla' : 'Template'}</label>
            <window.Dropdown 
              value={templateId} 
              onChange={setTemplateId} 
              options={[
                { value: "", label: lang === 'es' ? '-- Selecciona una Plantilla --' : '-- Select a Template --' },
                ...templates.map(t => ({ value: t.id, label: `${t.name} (ID: ${t.id})` }))
              ]}
              style={{ width: '100%' }} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label className="form-label">{lang === 'es' ? 'Imagen de Temporada (500x400px)' : 'Season Image (500x400px)'}</label>
            <window.AdminImageUpload 
              width="100%" 
              height={200}
              currentImage={image} 
              onImageChange={setImage} 
              maxSizeKb={2048} 
            />
          </div>
          <div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">{lang === 'es' ? 'Sonido de Bienvenida (Opcional)' : 'Welcome Sound (Optional)'}</label>
              <input type="text" className="app-input" style={{ width: '100%' }} value={audio} onChange={e => setAudio(e.target.value)} placeholder="URL del archivo .mp3 o .wav" />
              <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 6 }}>
                {lang === 'es' ? 'Pega la URL de un audio, o súbelo externamente y pon el link.' : 'Paste the URL of an uploaded audio file.'}
              </p>
            </div>
            <div>
              <label className="form-label">{lang === 'es' ? 'Mensaje de Bienvenida (Texto Enriquecido)' : 'Welcome Message (Rich Text)'}</label>
              <window.AdminRichTextEditor 
                value={description}
                onChange={setDescription}
                placeholder={lang === 'es' ? 'Escribe aquí las novedades de la temporada...' : 'Write season news here...'}
                style={{ minHeight: 200 }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {activeConfig && (
            <button className="app-btn" onClick={() => setShowCancelModal(true)} disabled={saving} style={{ padding: '10px 24px', background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7' }}>
              {lang === 'es' ? 'Cancelar Temporada' : 'Cancel Season'}
            </button>
          )}
          <button className="app-btn" onClick={handleSaveConfig} disabled={saving} style={{ padding: '10px 24px', background: 'var(--primary-i100)', color: '#fff' }}>
            {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-save"></i>}
            {lang === 'es' ? ' Guardar Configuración' : ' Save Config'}
          </button>
        </div>
      </div>

      {/* Historial de Temporadas */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-1)' }}>
          <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--fg-2)' }}></i>
          {lang === 'es' ? 'Historial de Temporadas Pasadas' : 'Past Seasons History'}
        </h3>

        {seasonLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--fg-3)', background: 'var(--bg-1)', borderRadius: 12, border: '1px dashed var(--border)' }}>
            {lang === 'es' ? 'No hay registro de temporadas pasadas.' : 'No history of past seasons.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {seasonLogs.map(log => {
              const isExpanded = expandedLogs[log.id];
              return (
                <div key={log.id} style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-1)', overflow: 'hidden' }}>
                  <div 
                    onClick={() => toggleLog(log.id)}
                    style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'var(--bg-2)' : 'var(--bg-1)', transition: 'background 0.2s' }}
                  >
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--fg-1)', marginBottom: 4 }}>{log.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>
                        {new Date(log.startDate).toLocaleDateString()} - {new Date(log.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: 'var(--fg-3)', transition: 'transform 0.2s' }}></i>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 16 }}>
                        <i className="fa-solid fa-users" style={{ marginRight: 6 }}></i>
                        {log.totalParticipants} {lang === 'es' ? 'Jugadores Totales' : 'Total Players'}
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--fg-1)', marginBottom: 12 }}>Top 5:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {log.top5 && log.top5.length > 0 ? (
                          log.top5.map((p, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: 'var(--primary-i100)', fontWeight: 'bold' }}>#{idx + 1}</span>
                                <span style={{ color: 'var(--fg-1)' }}>{p.name}</span>
                              </div>
                              <div style={{ color: 'var(--fg-2)', display: 'flex', gap: 12 }}>
                                <span><i className="fa-solid fa-star" style={{ color: '#f59e0b', fontSize: 10 }}></i> P{p.prestigeCount}</span>
                                <span><i className="fa-solid fa-tooth" style={{ color: '#38bdf8', fontSize: 10 }}></i> {window.formatNumber ? window.formatNumber(p.teeth) : p.teeth}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>{lang === 'es' ? 'Sin datos de jugadores' : 'No player data'}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalMsg && (
        <window.Modal onClose={() => setModalMsg(null)} maxWidth={400} persistent={false}>
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <h3 className="t-heading-m" style={{ color: modalMsg.title === 'Error' ? 'var(--negative-i100)' : 'var(--primary-i100)', marginBottom: 12 }}>{modalMsg.title}</h3>
            <p className="t-body-m" style={{ color: 'var(--fg-2)', marginBottom: 24 }}>{modalMsg.text}</p>
            <button className="app-btn" onClick={() => setModalMsg(null)} style={{ background: 'var(--primary-i100)', color: '#fff', width: '100%', padding: '12px' }}>
              {lang === 'es' ? 'Aceptar' : 'OK'}
            </button>
          </div>
        </window.Modal>
      )}

      {showCancelModal && (
        <window.Modal onClose={() => setShowCancelModal(false)} maxWidth={400} persistent={false}>
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--negative-i100)' }}><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h3 className="t-heading-m" style={{ color: 'var(--fg-1)', marginBottom: 12 }}>{lang === 'es' ? '¿Cancelar Temporada?' : 'Cancel Season?'}</h3>
            <p className="t-body-m" style={{ color: 'var(--fg-2)', marginBottom: 24 }}>
              {lang === 'es' ? 'Esto eliminará la configuración actual de la temporada. Los jugadores y el progreso no se verán afectados.' : 'This will remove the current season configuration. Players and progress will not be affected.'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="app-btn" onClick={() => setShowCancelModal(false)} style={{ flex: 1, background: 'var(--bg-3)', color: 'var(--fg-1)' }}>
                {lang === 'es' ? 'Volver' : 'Back'}
              </button>
              <button className="app-btn" onClick={doCancelConfig} style={{ flex: 1, background: 'var(--negative-i100)', color: '#fff' }}>
                {lang === 'es' ? 'Sí, cancelar' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </window.Modal>
      )}

      {showWipeModal && (
        <window.Modal onClose={() => setShowWipeModal(false)} maxWidth={450} persistent={false}>
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12, color: '#ef4444' }}><i className="fa-solid fa-power-off"></i></div>
            <h3 className="t-heading-m" style={{ color: 'var(--fg-1)', marginBottom: 12 }}>{lang === 'es' ? '¿Forzar Reinicio de Temporada?' : 'Force Season Reset?'}</h3>
            <p className="t-body-s" style={{ color: 'var(--fg-2)', marginBottom: 24, lineHeight: 1.5 }}>
              {lang === 'es' 
                ? '¡Atención! Esto archivará todo el progreso de los jugadores, borrará el ranking y publicará la plantilla oficial configurada. Esta acción no se puede deshacer.' 
                : 'Warning! This will archive all player progress, wipe the leaderboard, and publish the configured official template. This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="app-btn" onClick={() => setShowWipeModal(false)} style={{ flex: 1, background: 'var(--bg-3)', color: 'var(--fg-1)' }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button className="app-btn" onClick={doWipeConfig} style={{ flex: 1, background: '#ef4444', color: '#fff', fontWeight: 'bold' }}>
                {lang === 'es' ? 'Confirmar Reinicio' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </window.Modal>
      )}

    </div>
  );
};
