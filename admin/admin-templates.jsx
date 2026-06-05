const { useState, useEffect } = React;

window.AdminTemplates = function({ lang, editingTemplateId, onEditTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [createTarget, setCreateTarget] = useState(null);
  const [createData, setCreateData] = useState({ name: '', path: '', copyLive: true });

  const [activeConfig, setActiveConfig] = useState(null);
  const [liveTemplateData, setLiveTemplateData] = useState(null);
  const [timeNow, setTimeNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTimeNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatSeasonTime = (endDate) => {
    const ms = new Date(endDate).getTime() - Date.now();
    if (ms <= 0) return lang === 'es' ? 'Finalizada (Requiere reinicio)' : 'Ended (Requires reset)';
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };

  const isTemplateLive = (t) => {
    if (activeConfig && activeConfig.templateId === t.id) return true;
    if (t.isExternal && liveTemplateData?.useExternalTemplate && liveTemplateData?.path === t.path) return true;
    if (!t.isExternal && liveTemplateData?._templateId === t.id) return true;
    return false;
  };


  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    
    const res = await window.cloudFetchTemplates();
    const configRes = window.cloudGetSeasonConfig ? await window.cloudGetSeasonConfig() : { ok: true, config: null };
    const liveRes = await window.cloudFetchGameContent();

    if (configRes.ok && configRes.config) {
      setActiveConfig(configRes.config);
    } else {
      setActiveConfig(null);
    }

    if (liveRes.ok && liveRes.content) {
      setLiveTemplateData(liveRes.content);
    } else {
      setLiveTemplateData(null);
    }

    if (res.ok) {
      setTemplates(res.templates || []);
    } else {
      alert("Error cargando plantillas: " + res.error);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setCreateData({ name: '', path: '', copyLive: true });
    setCreateTarget('new');
  };

  const handleCreateExternal = () => {
    setCreateData({ name: '', path: '', copyLive: false });
    setCreateTarget('external');
  };

  const confirmCreate = async () => {
    const { name, path, copyLive } = createData;
    const target = createTarget;
    setCreateTarget(null);
    setLoading(true);

    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    if (target === 'external') {
      const res = await window.cloudRegisterExternalTemplate(id, name, path);
      if (res.ok) {
        await loadTemplates();
      } else {
        alert("Error: " + res.error);
      }
    } else {
      const createEmptyContent = () => ({
        generators: [],
        clickUpgrades: [],
        achievements: [],
        toothStages: [
          { img: 'uploads/tooth1.png', prestige: 0, es: 'Diente base', en: 'Base tooth' }
        ],
        xpUpgrades: [],
        levelUpgrades: [],
        storeUpgrades: [],
        prestigeConfig: { baseReq: 100_000_000_000_000, scaling: 1.5, bonusPerSmile: 0.05 },
        levelConfig: { maxLevel: 100, baseXP: 100, scaling: 1.5, modalMessage: { es: "¡Nivel Completado!", en: "Level Up!" }, showParticles: true, customSound: null }
      });

      let contentToSave;
      if (copyLive) {
        const resLive = await window.cloudFetchGameContent();
        if (resLive.ok && resLive.content) {
          contentToSave = resLive.content;
        } else {
          alert(lang === 'es' ? 'No se pudo obtener el contenido en vivo. Se empezará desde cero.' : 'Could not fetch live content. Starting from scratch.');
          contentToSave = createEmptyContent();
        }
      } else {
        contentToSave = createEmptyContent();
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const fileName = `plantilla-${slug || id}.json`;
      const filePathToSave = `templates/${fileName}`;

      let savedLocally = false;
      try {
        const resp = await fetch('/api/save-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: filePathToSave,
            content: contentToSave
          })
        });
        const result = await resp.json();
        if (result.ok) {
          savedLocally = true;
        }
      } catch (e) {
        console.warn("Servidor local no disponible.", e);
      }

      let res;
      if (savedLocally) {
        res = await window.cloudRegisterExternalTemplate(id, name, filePathToSave);
      } else {
        res = await window.cloudSaveTemplate(id, name, contentToSave);
      }

      if (res.ok) {
        await loadTemplates();
      } else {
        alert("Error: " + res.error);
      }
    }
    setLoading(false);
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const content = JSON.parse(ev.target.result);
          // Set to GAME_CONTENT directly, this will trigger the auto-save in layout and reflect in UI
          window.initializeGameContent(content, true);
          window.ORIGINAL_TEMPLATE_STR = "";
          alert(lang === 'es' ? 'Plantilla importada exitosamente al editor.' : 'Template successfully imported to editor.');
        } catch (err) {
          alert('Error al procesar JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  const handleDelete = (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await window.cloudDeleteTemplate(deleteTarget);
    if (res.ok) {
      if (editingTemplateId === deleteTarget) {
        onEditTemplate(null);
      }
      await loadTemplates();
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
    setDeleteTarget(null);
  };

  const handlePublish = (id) => {
    setPublishTarget(id);
  };

  const confirmPublish = async () => {
    if (!publishTarget) return;
    const id = publishTarget;
    setPublishTarget(null);

    setPublishingId(id);
    const t = templates.find(temp => temp.id === id);
    let contentToPublish = null;

    if (t.isExternal) {
      contentToPublish = { isExternalPointer: true, pointerObj: { useExternalTemplate: true, path: t.path } };
    } else {
      const tRes = await window.cloudFetchTemplateContent(id);
      if (!tRes.ok) {
        alert("Error cargando el contenido de la plantilla: " + tRes.error);
        setPublishingId(null);
        return;
      }
      contentToPublish = tRes.content;
    }

    const res = await window.cloudPublishTemplate(id, contentToPublish);
    if (res.ok) {
      alert(lang === 'es' ? '¡Plantilla publicada exitosamente!' : 'Template published successfully!');
      // Force reload page to grab new live content
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
    setPublishingId(null);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', color: 'var(--fg-1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>{lang === 'es' ? 'Plantillas de Contenido' : 'Content Templates'}</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {editingTemplateId && (
            <button className="app-btn" onClick={handleImportJson} style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <i className="fa-solid fa-file-import"></i>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>{lang === 'es' ? 'Importar JSON' : 'Import JSON'}</span>
                <window.AdminHelpIcon 
                  title="Importar JSON" 
                  text="Carga un archivo .json desde tu computadora para sobreescribir temporalmente la plantilla que estás editando. Para que estos cambios sean permanentes, debes presionar 'Guardar Plantilla' después de importar." 
                />
              </div>
            </button>
          )}
          <button className="app-btn" onClick={handleCreateExternal} disabled={loading} style={{ background: 'var(--alternative-i100)', color: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}>
            <i className="fa-solid fa-link"></i>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{lang === 'es' ? 'Registrar Externa' : 'Register External'}</span>
              <window.AdminHelpIcon 
                title="Registrar Externa" 
                text="Agrega una nueva plantilla al sistema indicando su ruta física (ej: templates/plantilla-xyz.json) en lugar de guardarla en la base de datos de Supabase. Útil para cargar contenido grande si la BD está lenta." 
              />
            </div>
          </button>
          <button className="app-btn" onClick={handleCreate} disabled={loading} style={{ background: 'var(--primary-i100)', color: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}>
            <i className="fa-solid fa-plus"></i>
            {lang === 'es' ? 'Nueva Plantilla' : 'New Template'}
          </button>
        </div>
      </div>

      
      {activeConfig && (
        <div style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: 12, marginBottom: 24, border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa-solid fa-clock fa-spin" style={{ fontSize: 24 }}></i>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{lang === 'es' ? 'Temporada Activa:' : 'Active Season:'} {activeConfig.name}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                {lang === 'es' ? 'Tiempo restante:' : 'Time remaining:'} <strong style={{color: 'var(--fg-1)'}}>{formatSeasonTime(activeConfig.endDate)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>

        <p style={{ margin: 0, color: 'var(--fg-2)', fontSize: 14 }}>
          {lang === 'es' ? 
            'Las plantillas te permiten diseñar, balancear y probar nuevo contenido dinámico (mejoras, generadores, etc.) sin afectar a los jugadores actuales. Una vez que esté lista, puedes publicarla para iniciar una nueva "temporada".' : 
            'Templates allow you to design, balance, and test new dynamic content without affecting current players. Once ready, you can publish it to start a new "season".'
          }
        </p>
      </div>

      {loading && !publishingId ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-3)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-3)', background: 'var(--bg-2)', borderRadius: 12, border: '1px dashed var(--border)' }}>
              {lang === 'es' ? 'No hay plantillas guardadas.' : 'No templates saved.'}
            </div>
          ) : (
            templates.map(t => {
              const isEditing = editingTemplateId === t.id;
              const isLive = isTemplateLive(t);
              const dateObj = new Date(t.createdAt);
              const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

              return (
                <div key={t.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px 20px', background: isEditing ? 'rgba(26,143,255,0.05)' : 'var(--bg-2)', 
                  borderRadius: 12, border: isEditing ? '2px solid var(--primary-i100)' : '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.name}
                      {isEditing && (
                        <span style={{ fontSize: 12, background: 'var(--primary-i100)', color: '#fff', padding: '2px 8px', borderRadius: 12 }}>
                          {lang === 'es' ? 'Editando Actualmente' : 'Currently Editing'}
                        </span>
                      )}
                      {isLive && (
                        <span style={{ fontSize: 12, background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: 12 }}>
                          <i className="fa-solid fa-circle-check"></i> {lang === 'es' ? 'EN VIVO' : 'LIVE'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>
                      ID: {t.id} • {lang === 'es' ? 'Creada:' : 'Created:'} {dateStr}
                      {t.isExternal && <span style={{ marginLeft: 8, color: 'var(--alternative-i100)' }}><i className="fa-solid fa-link"></i> {t.path}</span>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      className="app-btn" 
                      onClick={() => onEditTemplate(isEditing ? null : t)}
                      style={{ background: isEditing ? 'var(--bg-3)' : 'var(--primary-i010)', color: isEditing ? 'var(--fg-1)' : 'var(--primary-i100)', minWidth: 100 }}
                    >
                      {isEditing ? (lang === 'es' ? 'Dejar de Editar' : 'Stop Editing') : (lang === 'es' ? 'Editar' : 'Edit')}
                    </button>
                    
                    <button 
                      className="app-btn" 
                      onClick={() => handleDelete(t.id)}
                      style={{ background: '#fff5f5', color: '#e53e3e' }}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>

                    <button 
                      className="app-btn" 
                      onClick={() => handlePublish(t.id)}
                      disabled={publishingId !== null}
                      style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 'bold' }}
                    >
                      {publishingId === t.id ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-rocket"></i>}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span>{lang === 'es' ? ' Publicar' : ' Publish'}</span>
                        <window.AdminHelpIcon 
                          title="Publicar Plantilla" 
                          text="Inicia una nueva temporada usando esta plantilla. Todos los jugadores comenzarán desde cero (nivel 1) usando el contenido, mejoras y configuraciones definidas en esta plantilla. El progreso de la temporada actual se guardará en el historial." 
                        />
                      </div>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget !== null && (
        <window.Modal onClose={() => setDeleteTarget(null)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: 'var(--warning-i100)', marginBottom: 16 }}><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar Plantilla?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>
              {lang === 'es' ? '¿Estás seguro de eliminar esta plantilla? Esta acción no se puede deshacer.' : 'Are you sure you want to delete this template? This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="app-btn" onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={confirmDelete} style={{ flex: 1, padding: '10px 16px', background: 'var(--warning-i100)', color: '#fff' }}>Eliminar</button>
            </div>
          </div>
        </window.Modal>
      )}

      {/* Publish Modal */}
      {publishTarget !== null && (
        <window.Modal onClose={() => setPublishTarget(null)} maxWidth={500} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: '#16a34a', marginBottom: 16 }}><i className="fa-solid fa-rocket"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Publicar Plantilla?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--warning-i100)', fontSize: 14, fontWeight: 'bold' }}>
              {lang === 'es' ? 
                '¡ATENCIÓN! Publicar esta plantilla reemplazará el contenido en vivo actual y BORRARÁ el progreso de todos los jugadores (inicio de nueva temporada). El estado anterior se guardará como un archivo histórico. ¿Estás absolutamente seguro de continuar?' : 
                'WARNING! Publishing this template will replace the live content and WIPE all player progress (season reset). The previous state will be archived. Are you absolutely sure?'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="app-btn" onClick={() => setPublishTarget(null)} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={confirmPublish} style={{ flex: 1, padding: '10px 16px', background: '#16a34a', color: '#fff' }}>Publicar Temporada</button>
            </div>
          </div>
        </window.Modal>
      )}
      {/* Create Modal */}
      {createTarget !== null && (
        <window.Modal onClose={() => setCreateTarget(null)} maxWidth={500} persistent={false}>
          <div style={{ padding: '20px 10px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: 20, color: 'var(--fg-1)' }}>
              {createTarget === 'new' 
                ? (lang === 'es' ? 'Crear Nueva Plantilla' : 'Create New Template')
                : (lang === 'es' ? 'Registrar Plantilla Externa' : 'Register External Template')}
            </h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--fg-2)', fontSize: 14 }}>
                {lang === 'es' ? 'Nombre de la plantilla:' : 'Template name:'}
              </label>
              <input 
                type="text" 
                className="app-input" 
                value={createData.name} 
                onChange={(e) => setCreateData({...createData, name: e.target.value})}
                placeholder={lang === 'es' ? 'Ej. Temporada 2' : 'E.g. Season 2'}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--fg-1)' }}
                autoFocus
              />
            </div>
            
            {createTarget === 'external' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--fg-2)', fontSize: 14 }}>
                  {lang === 'es' ? 'Ruta o URL del archivo JSON:' : 'JSON file path/URL:'}
                </label>
                <input 
                  type="text" 
                  className="app-input" 
                  value={createData.path} 
                  onChange={(e) => setCreateData({...createData, path: e.target.value})}
                  placeholder={lang === 'es' ? 'Ej. templates/temporada2.json' : 'E.g. templates/season2.json'}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--fg-1)' }}
                />
              </div>
            )}
            
            {createTarget === 'new' && (
              <div style={{ marginBottom: 24, padding: '12px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--fg-1)', fontSize: 14 }}>
                  <input 
                    type="checkbox" 
                    checked={createData.copyLive} 
                    onChange={(e) => setCreateData({...createData, copyLive: e.target.checked})}
                    style={{ width: 18, height: 18 }}
                  />
                  <span>
                    {lang === 'es' 
                      ? 'Poblar plantilla con todo el contenido "en vivo"' 
                      : 'Populate template with all current "live" content'}
                  </span>
                </label>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="app-btn" onClick={() => setCreateTarget(null)} style={{ padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button 
                className="app-btn" 
                onClick={confirmCreate} 
                disabled={!createData.name || (createTarget === 'external' && !createData.path) || loading}
                style={{ padding: '10px 16px', background: 'var(--primary-i100)', color: '#fff', opacity: (!createData.name || (createTarget === 'external' && !createData.path) || loading) ? 0.5 : 1 }}
              >
                {lang === 'es' ? 'Crear' : 'Create'}
              </button>
            </div>
          </div>
        </window.Modal>
      )}
    </div>
  );
};
