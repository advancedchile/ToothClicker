const { useState } = React;

const AdminDraftDB = {
  db: null,
  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ToothClickerAdminDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(this.db); };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts');
        }
      };
    });
  },
  async get(key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async set(key, value) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  async remove(key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

window.AdminLayout = function({ lang, onLangChange, onEnterGame, onBack }) {
  const [activeTab, setActiveTab] = useState('accounts');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [isSwitchingTemplate, setIsSwitchingTemplate] = useState(false);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });
  const [toast, setToast] = useState(null);

  const toggleSidebar = () => {
    const val = !sidebarCollapsed;
    setSidebarCollapsed(val);
    localStorage.setItem('adminSidebarCollapsed', val);
  };

  React.useEffect(() => {
    document.body.classList.add('admin-ui');
    
    // Check if we were editing a template before refresh
    const lastStr = localStorage.getItem('admin_last_edited_template');
    if (lastStr) {
      try {
        const t = JSON.parse(lastStr);
        AdminDraftDB.get('admin_unsaved_template_' + t.id).then((unsaved) => {
          if (unsaved) {
            window.initializeGameContent(JSON.parse(unsaved), true);
            window.ORIGINAL_TEMPLATE_STR = ""; 
            setEditingTemplate(t);
            if (window.applyGlobalStyles) window.applyGlobalStyles();
          } else {
            handleEditTemplate(t);
          }
        }).catch(e => {
          console.error("Error restoring draft", e);
          handleEditTemplate(t);
        });
      } catch (e) {
        console.error("Error restoring template", e);
      }
    } else {
      // If we weren't editing a template, we might have been editing LIVE
      AdminDraftDB.get('admin_unsaved_live').then((unsaved) => {
        if (unsaved) {
          window.initializeGameContent(JSON.parse(unsaved), true);
          window.ORIGINAL_TEMPLATE_STR = "";
          if (window.applyGlobalStyles) window.applyGlobalStyles();
        }
      }).catch(e => console.error("Error restoring live draft", e));
    }

    return () => {
      document.body.classList.remove('admin-ui');
    };
  }, []);

  // Auto-save loop for templates and live environment
  React.useEffect(() => {
    let interval;
    interval = setInterval(() => {
      if (window.GAME_CONTENT) {
        if (editingTemplate) {
          AdminDraftDB.set('admin_unsaved_template_' + editingTemplate.id, JSON.stringify(window.GAME_CONTENT)).catch(e => console.error("Auto-save error", e));
        } else {
          AdminDraftDB.set('admin_unsaved_live', JSON.stringify(window.GAME_CONTENT)).catch(e => console.error("Auto-save live error", e));
        }
      }
    }, 3000); // Auto save every 3 seconds to IndexedDB
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [editingTemplate]);

  // We will pass these props to the specific admin modules
  const commonProps = { lang, onLangChange, onEnterGame, onBack, isTemplate: !!editingTemplate, setToast };

  const renderContent = () => {
    switch (activeTab) {
      case 'accounts':
      case 'leaderboard':
      case 'messages':
      case 'danger':
      case 'versions':
        // Render the old AdminPanel content (we will extract this later)
        return <window.AdminCorePanel activeTab={activeTab} setActiveTab={setActiveTab} {...commonProps} />;
      case 'seasons':
        return <window.AdminSeasons key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'generators':
        return <window.AdminGenerators key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'clickUpgrades':
        return <window.AdminClickUpgrades key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'storeUpgrades':
        return <window.AdminStoreUpgrades key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'academyUpgrades':
        return <window.AdminAcademyUpgrades key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'achievements':
        return <window.AdminAchievements key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'prestige':
        return <window.AdminPrestige key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'levelConfig':
        return <window.AdminLevelConfig key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'music':
        return <window.AdminMusic key={editingTemplate?.id || 'live'} {...commonProps} />;
      case 'templates':
        return (
          <window.AdminTemplates 
            key={editingTemplate?.id || 'live'}
            {...commonProps} 
            editingTemplateId={editingTemplate?.id || null}
            onEditTemplate={handleEditTemplate}
          />
        );
      case 'bonuses':
        return <window.AdminRandomBonuses key={editingTemplate?.id || 'live'} {...commonProps} />;
      default:
        return <div>WIP</div>;
    }
  };

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(undefined);

  const handleEditTemplate = async (template) => {
    if (editingTemplate) {
      const currentStr = JSON.stringify(window.GAME_CONTENT);
      if (window.ORIGINAL_TEMPLATE_STR !== currentStr) {
        setPendingTemplate(template);
        setShowUnsavedModal(true);
        return;
      }
    }
    await proceedSwitchTemplate(template);
  };

  const proceedSwitchTemplate = async (template) => {
    setIsSwitchingTemplate(true);
    if (!template && editingTemplate) {
      AdminDraftDB.remove('admin_unsaved_template_' + editingTemplate.id);
      
      // Stop editing: revert to live content
      localStorage.removeItem('admin_last_edited_template');
      const res = await window.cloudFetchGameContent();
      window.initializeGameContent(res.ok ? res.content : null);
      setEditingTemplate(null);
      if (window.applyGlobalStyles) window.applyGlobalStyles();
    } else if (template) {
      if (editingTemplate) {
        AdminDraftDB.remove('admin_unsaved_template_' + editingTemplate.id);
      }
      // Start editing: fetch template content
      localStorage.setItem('admin_last_edited_template', JSON.stringify(template));
      const res = await window.cloudFetchTemplateContent(template.id);
      if (res.ok) {
        window.initializeGameContent(res.content, true);
        window.ORIGINAL_TEMPLATE_STR = JSON.stringify(window.GAME_CONTENT);
        setEditingTemplate(template);
        if (window.applyGlobalStyles) window.applyGlobalStyles();
      } else {
        alert("Error cargando plantilla: " + res.error);
      }
    }
    // Force a re-render of components by tweaking state briefly if needed
    // or just let the re-render happen since window.GAME_CONTENT changed
    // Components reading window.GAME_CONTENT directly on mount will get the new data.
    // To ensure full re-render, we might want to toggle activeTab briefly, but changing editingTemplate triggers a re-render.
    setIsSwitchingTemplate(false);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAll = async () => {
    if (!window.GAME_CONTENT) return;
    setIsSaving(true);
    setSaveSuccess(false);
    
    let res;
    if (editingTemplate) {
      // Intentar guardar mediante el servidor local
      let savedLocally = false;
      const filePathToSave = editingTemplate.path || `templates/plantilla-${editingTemplate.id}.json`;

      try {
        const resp = await fetch('/api/save-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: filePathToSave,
            content: window.GAME_CONTENT
          })
        });
        const result = await resp.json();
        if (result.ok) {
          savedLocally = true;
          // Si la plantilla era interna y se guardó exitosamente en local,
          // la convertimos a externa para que el juego siempre la lea desde el archivo local 
          // y evitemos timeouts de base de datos en el futuro.
          if (!editingTemplate.isExternal) {
            await window.cloudRegisterExternalTemplate(editingTemplate.id, editingTemplate.name, filePathToSave);
            editingTemplate.isExternal = true;
            editingTemplate.path = filePathToSave;
          }
        }
      } catch (e) {
        console.warn("Servidor local no disponible. Haciendo fallback.", e);
      }

      if (!savedLocally) {
        // Guardar en la nube (Supabase) in all cases if local server is down
        res = await window.cloudSaveTemplate(editingTemplate.id, editingTemplate.name, window.GAME_CONTENT);
        if (!res.ok) {
          alert("Error al guardar la plantilla en Supabase: " + res.error);
          setIsSaving(false);
          return;
        }
        
        // If it was external, it's now living in Supabase
        if (editingTemplate.isExternal) {
          editingTemplate.isExternal = false;
          delete editingTemplate.path;
          alert(lang === 'es' 
            ? 'La plantilla externa se ha guardado en Supabase exitosamente (ya no es un archivo local).'
            : 'External template saved to Supabase successfully (no longer a local file).');
        }
      }
      
      // Update draft cache logic
      AdminDraftDB.remove('admin_unsaved_template_' + editingTemplate.id);
      window.ORIGINAL_TEMPLATE_STR = JSON.stringify(window.GAME_CONTENT);
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return;
    } else {
      res = await window.cloudSaveGameContent(window.GAME_CONTENT);
      if (res && res.ok) {
        AdminDraftDB.remove('admin_unsaved_live');
      }
    }

    setIsSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert("Error al guardar: " + res.error);
    }
  };

  return (
    <div className="admin-ui" style={{ display: 'flex', width: '100vw', height: '100vh', background: 'var(--bg-1)', color: 'var(--fg-1)' }}>
      {/* CSS to hide scrollbar */}
      <style>{`
        .admin-sidebar-scroll::-webkit-scrollbar {
          display: none;
        }
        .admin-sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 70 : 280, transition: 'width 0.2s', background: 'var(--bg-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: sidebarCollapsed ? '20px 0' : '20px', display: 'flex', flexDirection: sidebarCollapsed ? 'column' : 'row', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', gap: sidebarCollapsed ? 16 : 12, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={onBack} 
              className="app-btn" 
              style={{ padding: '8px', background: 'transparent' }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ type: 'text', text: 'Cerrar sesión', pos: { x: rect.right + 10, y: rect.top + rect.height / 2 }, direction: 'right' });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
            {!sidebarCollapsed && <div style={{ fontSize: 18, fontWeight: 'bold', whiteSpace: 'nowrap' }}>Panel Admin</div>}
          </div>
          
          <button 
            className="app-btn" 
            onClick={toggleSidebar} 
            style={{ padding: '8px', background: 'transparent', color: 'var(--fg-3)' }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({ type: 'text', text: sidebarCollapsed ? 'Expandir' : 'Colapsar', pos: { x: rect.right + 10, y: rect.top + rect.height / 2 }, direction: 'right' });
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <i className={`fa-solid ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <button 
            className="app-btn" 
            onClick={handleSaveAll} 
            disabled={isSaving || isSwitchingTemplate}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, background: saveSuccess ? 'var(--positive-i100)' : 'var(--primary-i100)', color: saveSuccess ? 'var(--bg-1)' : '#fff', padding: sidebarCollapsed ? '12px 0' : undefined }}
            onMouseEnter={(e) => {
              if (sidebarCollapsed && setTooltip) {
                const rect = e.currentTarget.getBoundingClientRect();
                const tooltipText = saveSuccess ? 'Guardado Exitoso' : (editingTemplate ? (editingTemplate.isExternal ? 'Guardar plantilla' : 'Guardar Plantilla en Nube') : 'Guardar Cambios BD');
                setTooltip({ type: 'text', text: tooltipText, pos: { x: rect.right + 10, y: rect.top + rect.height / 2 }, direction: 'right' });
              }
            }}
            onMouseLeave={() => {
              if (sidebarCollapsed && setTooltip) setTooltip(null);
            }}
          >
            {isSaving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
            {!sidebarCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>{saveSuccess ? 'Guardado Exitoso' : (editingTemplate ? (editingTemplate.isExternal ? 'Guardar plantilla' : 'Guardar Plantilla') : 'Guardar Cambios BD')}</span>
                {!saveSuccess && (
                  <window.AdminHelpIcon 
                    title={editingTemplate ? 'Guardar Plantilla' : 'Guardar Cambios BD'} 
                    text={editingTemplate ? 'Guarda los cambios de la plantilla que estás editando actualmente en la base de datos (Supabase). Estos cambios NO afectarán al juego en vivo de los jugadores hasta que vayas a la sección de Plantillas y decidas "Publicar" esta plantilla para iniciar una nueva temporada.' : 'Guarda de forma permanente cualquier cambio que hayas realizado en esta sesión en la base de datos en vivo (Supabase). Los jugadores verán estos cambios la próxima vez que recarguen el juego o cuando el juego se sincronice automáticamente.'} 
                  />
                )}
              </div>
            )}
          </button>
        </div>

        <div className="admin-sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 0', overflowX: 'hidden' }}>
          {!sidebarCollapsed && (
            <div style={{ padding: '0 16px', fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 8, whiteSpace: 'nowrap' }}>
              Sistema
            </div>
          )}
          <SidebarItem active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon="fa-sliders" text="Administración" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} icon="fa-trophy" text="Ranking" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} icon="fa-envelope" text="Mensajes" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'danger'} onClick={() => setActiveTab('danger')} icon="fa-triangle-exclamation" text="Zona de Peligro" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'versions'} onClick={() => setActiveTab('versions')} icon="fa-code-commit" text="Versiones" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'seasons'} onClick={() => setActiveTab('seasons')} icon="fa-calendar-check" text="Temporadas" collapsed={sidebarCollapsed} setTooltip={setTooltip} />

          {!sidebarCollapsed && (
            <div style={{ padding: '0 16px', fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)', textTransform: 'uppercase', marginTop: 24, marginBottom: 8, whiteSpace: 'nowrap' }}>
              Contenido del Juego
            </div>
          )}
          <SidebarItem active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} icon="fa-layer-group" text="Plantillas" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'generators'} onClick={() => setActiveTab('generators')} icon="fa-building" text="Generadores" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'clickUpgrades'} onClick={() => setActiveTab('clickUpgrades')} icon="fa-mouse-pointer" text="Mejoras de Click" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'storeUpgrades'} onClick={() => setActiveTab('storeUpgrades')} icon="fa-store" text="Mejoras de Tienda" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'academyUpgrades'} onClick={() => setActiveTab('academyUpgrades')} icon="fa-graduation-cap" text="Mejoras de Academia" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')} icon="fa-medal" text="Logros" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'prestige'} onClick={() => setActiveTab('prestige')} icon="fa-crown" text="Prestigio y Dientes" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'levelConfig'} onClick={() => setActiveTab('levelConfig')} icon="fa-star" text="Nivel de Jugador" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'music'} onClick={() => setActiveTab('music')} icon="fa-music" text="Música" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
          <SidebarItem active={activeTab === 'bonuses'} onClick={() => setActiveTab('bonuses')} icon="fa-gift" text="Bonus Aleatorios" collapsed={sidebarCollapsed} setTooltip={setTooltip} />
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button 
            className="app-btn" 
            onClick={() => onEnterGame('James')} 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, background: 'var(--alternative-i100)', color: '#fff', padding: sidebarCollapsed ? '12px 0' : undefined }}
            onMouseEnter={(e) => {
              if (sidebarCollapsed && setTooltip) {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ type: 'text', text: 'Entrar al Juego (James)', pos: { x: rect.right + 10, y: rect.top + rect.height / 2 }, direction: 'right' });
              }
            }}
            onMouseLeave={() => {
              if (sidebarCollapsed && setTooltip) setTooltip(null);
            }}
          >
            <i className="fa-solid fa-play"></i>
            {!sidebarCollapsed && 'Entrar al Juego'}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#e8f2fb', display: 'flex', flexDirection: 'column' }}>
        {editingTemplate && (
          <div id="template-banner" style={{ position: 'sticky', top: 0, background: 'var(--primary-i100)', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-pen-ruler"></i>
              {lang === 'es' 
                ? `Estás editando la plantilla: ${editingTemplate.name}. Los cambios no afectarán al juego en vivo.`
                : `Editing template: ${editingTemplate.name}. Changes won't affect live game.`}
            </div>
            <button 
              onClick={() => handleEditTemplate(null)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              {lang === 'es' ? 'Volver a Edición en Vivo' : 'Back to Live'}
            </button>
          </div>
        )}
        
        {isSwitchingTemplate ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--fg-3)' }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-3x"></i>
          </div>
        ) : (
          <div style={{ flex: 1, position: 'relative' }}>
            {/* We key on editingTemplate?.id to force unmount/remount of the active tab components so they pick up new GAME_CONTENT */}
            <div key={editingTemplate ? editingTemplate.id : 'live'}>
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {showUnsavedModal && (
        <window.Modal onClose={() => setShowUnsavedModal(false)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: 'var(--warning-i100)', marginBottom: 16 }}><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Salir sin guardar?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Tienes cambios sin guardar en esta plantilla. Si sales ahora, se perderán. ¿Deseas salir de todas formas?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="app-btn" onClick={() => setShowUnsavedModal(false)} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={() => {
                setShowUnsavedModal(false);
                proceedSwitchTemplate(pendingTemplate);
              }} style={{ flex: 1, padding: '10px 16px', background: 'var(--warning-i100)', color: '#fff' }}>Salir sin guardar</button>
            </div>
          </div>
        </window.Modal>
      )}

      {window.SmartTooltip && <window.SmartTooltip tooltip={tooltip} lang={lang} />}
      {toast && window.Toast && <window.Toast toast={toast} lang={lang} />}
    </div>
  );
};

function SidebarItem({ active, onClick, icon, text, collapsed, setTooltip }) {
  return (
    <div 
      onClick={onClick}
      style={{
        padding: collapsed ? '12px 0' : '12px 24px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        background: active ? 'var(--primary-i010)' : 'transparent',
        color: active ? 'var(--primary-i100)' : 'var(--fg-2)',
        borderRight: active ? '3px solid var(--primary-i100)' : '3px solid transparent',
        transition: 'all 0.2s',
        fontWeight: active ? 600 : 500
      }}
      onMouseEnter={(e) => { 
        if(!active) e.currentTarget.style.background = 'var(--bg-3)'; 
        if(collapsed && setTooltip) {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltip({ type: 'text', text: text, pos: { x: rect.right + 10, y: rect.top + rect.height/2 }, direction: 'right' });
        }
      }}
      onMouseLeave={(e) => { 
        if(!active) e.currentTarget.style.background = 'transparent'; 
        if(collapsed && setTooltip) {
          setTooltip(null);
        }
      }}
    >
      <i className={`fa-solid ${icon}`} style={{ width: 20, textAlign: 'center', fontSize: collapsed ? 18 : 16 }}></i>
      {!collapsed && <span>{text}</span>}
    </div>
  );
}
