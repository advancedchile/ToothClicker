const { useState, useRef } = React;

window.AdminLevelConfig = function({ lang }) {
  const [config, setConfig] = useState({ ...(window.GAME_CONTENT.levelConfig || {}) });
  const [editLang, setEditLang] = useState('es');
  const fileInputRef = useRef(null);

  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    window.GAME_CONTENT.levelConfig = newConfig;
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("El archivo de audio excede el límite de 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      saveConfig({ ...config, customSound: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
      
      <div style={{ background: 'var(--bg-2)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Configuración de Niveles</h2>
        
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nivel Máximo</label>
            <window.AdminNumberInput className="app-input" value={config.maxLevel || 100} onChange={e => saveConfig({...config, maxLevel: Number(e.target.value)})} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>XP Base</label>
            <window.AdminNumberInput className="app-input" value={config.baseXP || 100} onChange={e => saveConfig({...config, baseXP: Number(e.target.value)})} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Escalado de XP (x)</label>
            <window.AdminNumberInput step="0.1" className="app-input" value={config.scaling || 1.5} onChange={e => saveConfig({...config, scaling: Number(e.target.value)})} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-2)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Modal de "Level Up"</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Mensaje de Felicitación</label>
              <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setEditLang('es')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: editLang === 'es' ? 'var(--primary-i100)' : 'transparent', color: editLang === 'es' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>ES</button>
                <button type="button" onClick={() => setEditLang('en')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: editLang === 'en' ? 'var(--primary-i100)' : 'transparent', color: editLang === 'en' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>EN</button>
              </div>
            </div>
            <input type="text" className="app-input" value={config.modalMessage?.[editLang] || ''} onChange={e => saveConfig({...config, modalMessage: {...(config.modalMessage || {}), [editLang]: e.target.value}})} style={{ width: '100%' }} />
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
            <input type="checkbox" checked={config.showParticles !== false} onChange={e => saveConfig({...config, showParticles: e.target.checked})} />
            <span>Mostrar confeti y partículas al subir de nivel</span>
          </label>

          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)', display: 'block', marginBottom: 8 }}>Sonido de Level Up Personalizado (Max 500kb MP3/WAV)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="app-btn" onClick={() => fileInputRef.current.click()} style={{ background: 'var(--bg-3)' }}>
                Subir Sonido
              </button>
              <input type="file" ref={fileInputRef} onChange={handleAudioUpload} accept="audio/mpeg,audio/wav,audio/ogg" style={{ display: 'none' }} />
              
              {config.customSound && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <audio src={config.customSound} controls style={{ height: 32 }}></audio>
                  <button className="app-btn" onClick={() => saveConfig({...config, customSound: null})} style={{ color: 'var(--warning-i100)', background: 'transparent' }}>
                    <i className="fa-solid fa-trash"></i> Quitar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
