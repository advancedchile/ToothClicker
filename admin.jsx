const { useState, useEffect, useRef } = React;
const { 
  Modal, loadUsers, saveUsers, deleteUserSave, resetAllProgress, 
  ADMIN_NAME, formatNum 
} = window;

const BOSS_NAMES = [
  'Dani', 'Memo', 'José María', 'Andrea', 'Payo', 'Cris', 'Pascal', 
  'Tomi', 'John', 'Palo', 'Carlos', 'Gabo', 'Juanmi', 'María José'
];

const VALID_CHARS = [
  'ale', 'carlos', 'andrea', 'cami', 'chalo', 'cote', 'cotefi', 'cris',
  'dani', 'daniela', 'fabi', 'fenia', 'gabo', 'gianni', 'james', 'john',
  'jose_maria', 'juan', 'juanmi', 'juli', 'leo', 'lucho', 'manu', 'mari',
  'martin', 'mati', 'may', 'nico_flecha', 'nico_ojeda', 'palo', 'pancho',
  'pascal', 'patito', 'payo', 'rafa', 'sofi', 'tatan', 'tomi', 'vania', 'yisus'
];

function getAvatarUrl(who, customImage, msgId) {
  if (customImage) return customImage;
  if (!who) return null;
  
  let norm = who.toLowerCase().trim()
    .replace(/[áäàâ]/g, 'a')
    .replace(/[éëèê]/g, 'e')
    .replace(/[íïìî]/g, 'i')
    .replace(/[óöòô]/g, 'o')
    .replace(/[úüùû]/g, 'u')
    .replace(/ñ/g, 'nia')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (norm === 'feña') norm = 'fenia';

  if (norm === 'nico') {
    const val = typeof msgId === 'string' ? msgId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    return val % 2 === 0 ? 'assets/chars/nico_flecha.png' : 'assets/chars/nico_ojeda.png';
  }

  if (VALID_CHARS.includes(norm)) {
    if (norm === 'ale') return 'assets/chars/Ale.png';
    if (norm === 'carlos') return 'assets/chars/Carlos.png';
    return `assets/chars/${norm}.png`;
  }
  return null;
}

// ── Admin Terminology Component ───────────────────────────────────────────────
const TermRow = ({ label, keyName, term, updateField, image, onImageChange }) => {
  const [showEn, setShowEn] = useState(false);

  return (
    <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 'bold', color: 'var(--fg-1)' }}>{label}</div>
        <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setShowEn(false)}
            style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: !showEn ? 'var(--primary-i100)' : 'transparent', color: !showEn ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            ES
          </button>
          <button 
            onClick={() => setShowEn(true)}
            style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: showEn ? 'var(--primary-i100)' : 'transparent', color: showEn ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            EN
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {onImageChange && (
          <div style={{ flex: 'none', marginTop: 4 }}>
            <window.AdminImageUpload size={48} currentImage={image} onImageChange={onImageChange} />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
          {showEn ? (
            <>
              <div>
                <label style={{ fontSize: 10, color: 'var(--fg-3)' }}>Singular (EN)</label>
                <input className="app-input" value={term[keyName]?.en || ''} onChange={e => updateField(keyName, 'en', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--fg-3)' }}>Plural (EN)</label>
                <input className="app-input" value={term[keyName]?.enPlural || ''} onChange={e => updateField(keyName, 'enPlural', e.target.value)} style={{ width: '100%' }} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 10, color: 'var(--fg-3)' }}>Singular (ES)</label>
                <input className="app-input" value={term[keyName]?.es || ''} onChange={e => updateField(keyName, 'es', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--fg-3)' }}>Plural (ES)</label>
                <input className="app-input" value={term[keyName]?.esPlural || ''} onChange={e => updateField(keyName, 'esPlural', e.target.value)} style={{ width: '100%' }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Admin Logo & Favicon ────────────────────────────────────────────────────────

window.AdminLogo = function({ lang }) {
  const card = { background: 'rgba(255,255,255,0.88)', borderRadius: 16, padding: '20px', border: '1px solid rgba(100,160,230,0.25)', boxShadow: '0 2px 16px rgba(80,140,220,0.08)', backdropFilter: 'blur(8px)', marginBottom: 16 };
  
  const [logoVertical, setLogoVertical] = useState(() => {
    return window.GAME_CONTENT?.terminology?.images?.logoVertical || '';
  });

  const [logoHorizontal, setLogoHorizontal] = useState(() => {
    return window.GAME_CONTENT?.terminology?.images?.logoHorizontal || '';
  });

  const [favicon, setFavicon] = useState(() => {
    return window.GAME_CONTENT?.terminology?.images?.favicon || '';
  });

  const updateImage = (key, url, setter) => {
    setter(url);
    if (window.GAME_CONTENT) {
      if (!window.GAME_CONTENT.terminology) window.GAME_CONTENT.terminology = {};
      if (!window.GAME_CONTENT.terminology.images) window.GAME_CONTENT.terminology.images = {};
      window.GAME_CONTENT.terminology.images[key] = url;
    }
  };

  const updateFavicon = (url) => {
    updateImage('favicon', url, setFavicon);
    
    // Inject directly to preview instantly
    if (url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = url;
    }
  };

  const restoreFavicon = () => {
    updateFavicon('');
    // Restore default
    let link = document.querySelector("link[rel~='icon']");
    if (link) link.href = 'assets/favicon.png';
  };

  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-1)' }}>
        <i className="fa-solid fa-image" style={{ color: 'var(--accent)' }}></i>
        {lang === 'es' ? 'Branding del Juego (Logos y Favicon)' : 'Game Branding (Logos & Favicon)'}
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* LOGO VERTICAL */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--fg-1)' }}>
            {lang === 'es' ? 'Logo Vertical (Pantalla Inicial)' : 'Vertical Logo (Start Screen)'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 16 }}>
            {lang === 'es' 
              ? 'Se muestra en la pantalla de carga e inicio. Se recomienda un logo grande con fondo transparente.' 
              : 'Shown on the loading and start screens. Recommended: large logo with transparent background.'}
          </p>
          
          <window.AdminImageUpload 
            width="100%" 
            height={180}
            currentImage={logoVertical || "uploads/logo-vertical.png"} 
            onImageChange={url => updateImage('logoVertical', url, setLogoVertical)} 
            maxSizeKb={2048} 
          />
          
          {logoVertical && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button 
                className="app-btn"
                onClick={() => updateImage('logoVertical', '', setLogoVertical)} 
                style={{ background: 'transparent', color: 'var(--warning-i100)', border: '1px solid var(--warning-i100)', padding: '6px 12px', fontSize: 12 }}>
                <i className="fa-solid fa-rotate-left" style={{ marginRight: 6 }}></i>
                {lang === 'es' ? 'Restaurar original' : 'Restore original'}
              </button>
            </div>
          )}
        </div>

        {/* LOGO HORIZONTAL */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--fg-1)' }}>
            {lang === 'es' ? 'Logo Horizontal (Juego)' : 'Horizontal Logo (Game)'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 16 }}>
            {lang === 'es' 
              ? 'Se muestra en la barra superior mientras juegas. Debe ser ancho y no muy alto.' 
              : 'Shown on the top bar while playing. Should be wide and not very tall.'}
          </p>
          
          <window.AdminImageUpload 
            width="100%" 
            height={180}
            currentImage={logoHorizontal || "uploads/logo-horizontal-4d4fb63d.png"} 
            onImageChange={url => updateImage('logoHorizontal', url, setLogoHorizontal)} 
            maxSizeKb={2048} 
          />
          
          {logoHorizontal && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button 
                className="app-btn"
                onClick={() => updateImage('logoHorizontal', '', setLogoHorizontal)} 
                style={{ background: 'transparent', color: 'var(--warning-i100)', border: '1px solid var(--warning-i100)', padding: '6px 12px', fontSize: 12 }}>
                <i className="fa-solid fa-rotate-left" style={{ marginRight: 6 }}></i>
                {lang === 'es' ? 'Restaurar original' : 'Restore original'}
              </button>
            </div>
          )}
        </div>

        {/* FAVICON */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--fg-1)' }}>
            {lang === 'es' ? 'Favicon' : 'Favicon'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 16 }}>
            {lang === 'es' 
              ? 'Icono de pestaña. Pequeño y cuadrado.' 
              : 'Tab icon. Small and square.'}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <window.AdminImageUpload 
              width={100} 
              height={100}
              currentImage={favicon || "assets/favicon.png"} 
              onImageChange={updateFavicon} 
              maxSizeKb={1024} 
            />
            
            {favicon && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button 
                  className="app-btn"
                  onClick={restoreFavicon} 
                  style={{ background: 'transparent', color: 'var(--warning-i100)', border: '1px solid var(--warning-i100)', padding: '6px 12px', fontSize: 12 }}>
                  <i className="fa-solid fa-rotate-left" style={{ marginRight: 6 }}></i>
                  {lang === 'es' ? 'Restaurar' : 'Restore'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

window.AdminTerminology = function({ lang }) {
  const [term, setTerm] = useState(() => {
    return (window.GAME_CONTENT && window.GAME_CONTENT.terminology) ? { ...window.GAME_CONTENT.terminology } : {
      mainCurrency: { es: "Diente", en: "Tooth", esPlural: "Dientes", enPlural: "Teeth" },
      prestigeCurrency: { es: "Sonrisa dorada", en: "Golden smile", esPlural: "Sonrisas doradas", enPlural: "Golden smiles" },
      prestigeBonus: { es: "Bonus por sonrisa", en: "Smile bonus" },
      goldenCurrency: { es: "Diente dorado", en: "Golden tooth", esPlural: "Dientes dorados", enPlural: "Golden teeth" },
      diamondCurrency: { es: "Diente de diamante", en: "Diamond tooth", esPlural: "Dientes de diamante", enPlural: "Diamond teeth" },
      crystalCurrency: { es: "Diente de cristal", en: "Crystal tooth", esPlural: "Dientes de cristal", enPlural: "Crystal teeth" },
      images: { mainCurrency: "", prestigeCurrency: "", goldenCurrency: "", diamondCurrency: "", crystalCurrency: "" }
    };
  });
  
  const [showBonusEn, setShowBonusEn] = useState(false);

  const updateField = (key, field, val) => {
    const newTerm = { ...term, [key]: { ...term[key], [field]: val } };
    setTerm(newTerm);
    if (window.GAME_CONTENT) window.GAME_CONTENT.terminology = newTerm;
  };
  
  const updateImage = (key, val) => {
    const newTerm = { ...term, images: { ...(term.images || {}), [key]: val } };
    setTerm(newTerm);
    if (window.GAME_CONTENT) window.GAME_CONTENT.terminology = newTerm;
  };

  const card = { background: 'rgba(255,255,255,0.88)', borderRadius: 16, padding: '20px', border: '1px solid rgba(100,160,230,0.25)', boxShadow: '0 2px 16px rgba(80,140,220,0.08)', backdropFilter: 'blur(8px)', marginBottom: 16 };
  
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <i className="fa-solid fa-palette" style={{ color: '#e91e63', fontSize: 15 }}></i>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
          {lang === 'es' ? 'Configuración de Temática y Textos' : 'Theme & Texts Configuration'}
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 16 }}>
        {lang === 'es' 
          ? 'Personaliza los nombres y las imágenes de las monedas principales para darle una temática única al juego.' 
          : 'Customize the names and images of the main currencies to give the game a unique theme.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <TermRow 
          label={lang === 'es' ? 'Moneda Principal' : 'Main Currency'} 
          keyName="mainCurrency" 
          term={term} 
          updateField={updateField} 
          image={term.images?.mainCurrency}
          onImageChange={url => updateImage('mainCurrency', url)}
        />
        
        <TermRow 
          label={lang === 'es' ? 'Moneda de Prestigio' : 'Prestige Currency'} 
          keyName="prestigeCurrency" 
          term={term} 
          updateField={updateField} 
          image={term.images?.prestigeCurrency}
          onImageChange={url => updateImage('prestigeCurrency', url)}
        />
        
        <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 'bold', color: 'var(--fg-1)' }}>{lang === 'es' ? 'Nombre del Bonus de Prestigio' : 'Prestige Bonus Name'}</div>
            <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setShowBonusEn(false)}
                style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: !showBonusEn ? 'var(--primary-i100)' : 'transparent', color: !showBonusEn ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                ES
              </button>
              <button 
                onClick={() => setShowBonusEn(true)}
                style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: showBonusEn ? 'var(--primary-i100)' : 'transparent', color: showBonusEn ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                EN
              </button>
            </div>
          </div>
          <div>
            {showBonusEn ? (
              <input className="app-input" value={term.prestigeBonus?.en || ''} onChange={e => updateField('prestigeBonus', 'en', e.target.value)} style={{ width: '100%' }} />
            ) : (
              <input className="app-input" value={term.prestigeBonus?.es || ''} onChange={e => updateField('prestigeBonus', 'es', e.target.value)} style={{ width: '100%' }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



// ── Admin Typography ────────────────────────────────────────────────────────────

window.AdminTypography = function({ lang }) {
  const card = { background: 'rgba(255,255,255,0.88)', borderRadius: 16, padding: '20px', border: '1px solid rgba(100,160,230,0.25)', boxShadow: '0 2px 16px rgba(80,140,220,0.08)', backdropFilter: 'blur(8px)', marginBottom: 16 };

  const [selectedFont, setSelectedFont] = useState(() => {
    return window.GAME_CONTENT?.typography?.font || 'PixelifySans';
  });
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const applyFont = () => {
    if (window.GAME_CONTENT) {
      if (!window.GAME_CONTENT.typography) window.GAME_CONTENT.typography = {};
      window.GAME_CONTENT.typography.font = selectedFont;
    }
    document.documentElement.style.setProperty('--active-font', `"${selectedFont}"`);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const processFontFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { // 5MB max for font
      setUploadError(`La fuente excede el límite de 5MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Url = ev.target.result;
      let cleanName = file.name.replace(/\.[^/.]+$/, "");
      cleanName = cleanName.replace(/[^a-zA-Z0-9 ]/g, ""); // strip weird chars
      const fontValue = cleanName.replace(/\s+/g, '');
      
      if (!window.GAME_CONTENT) window.GAME_CONTENT = {};
      if (!window.GAME_CONTENT.typography) window.GAME_CONTENT.typography = {};
      if (!window.GAME_CONTENT.typography.customFonts) window.GAME_CONTENT.typography.customFonts = [];
      
      const newFont = { value: fontValue, label: cleanName, url: base64Url };
      
      // Update GAME_CONTENT directly so it will be saved
      window.GAME_CONTENT.typography.customFonts.push(newFont);
      
      // Inject dynamically right now so we can preview it instantly
      const style = document.createElement('style');
      style.innerHTML = `@font-face { font-family: "${newFont.value}"; src: url(${base64Url}); }`;
      document.head.appendChild(style);

      setSelectedFont(newFont.value);
      setUploadError('');
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const baseFonts = [
    { value: 'PixelifySans', label: 'Pixelify Sans' },
    { value: 'Amaranth', label: 'Amaranth' },
    { value: 'Londrina Solid', label: 'Londrina Solid' },
    { value: 'Poetsen One', label: 'Poetsen One' }
  ];
  const customFonts = window.GAME_CONTENT?.typography?.customFonts || [];
  const allFonts = [
    ...baseFonts, 
    ...customFonts.map(f => ({ value: f.value, label: f.label })),
    { value: '__UPLOAD__', label: lang === 'es' ? '+ Subir nueva tipografía...' : '+ Upload new font...' }
  ];

  const handleDropdownChange = (val) => {
    if (val === '__UPLOAD__') {
      if (fileInputRef.current) fileInputRef.current.click();
    } else {
      setSelectedFont(val);
    }
  };

  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-1)' }}>
        <i className="fa-solid fa-font" style={{ color: 'var(--accent)' }}></i>
        {lang === 'es' ? 'Tipografía' : 'Typography'}
      </h3>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <window.Dropdown 
            value={selectedFont} 
            onChange={handleDropdownChange}
            options={allFonts}
          />
        </div>
        <button 
          onClick={applyFont}
          style={{ ...window.primaryBtnStyle, flex: 'none', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', background: saved ? '#10b981' : 'var(--primary-i100)' }}
        >
          <i className={saved ? "fa-solid fa-check" : "fa-solid fa-check-circle"} style={{ fontSize: 16 }}></i>
          {saved ? (lang === 'es' ? '¡Aplicado!' : 'Applied!') : (lang === 'es' ? 'Aplicar Cambios' : 'Apply Changes')}
        </button>
      </div>

      <input 
        type="file" 
        accept=".ttf,.otf,.woff,.woff2" 
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={e => processFontFile(e.target.files[0])}
      />
      {uploadError && <div style={{ color: 'var(--danger-500)', fontSize: 12, marginBottom: 16 }}>{uploadError}</div>}
      
      <div className="typography-preview" style={{ padding: 16, background: 'var(--bg-1)', borderRadius: 8, border: '1px dashed var(--border-subtle)' }}>
        <style>{`.typography-preview * { font-family: "${selectedFont}", sans-serif !important; }`}</style>
        <div style={{ fontSize: 14, color: 'var(--fg-3)', marginBottom: 8, fontStyle: 'italic', opacity: 0.7 }}>
          {lang === 'es' ? 'Previsualización:' : 'Preview:'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
          {lang === 'es' ? 'El rápido zorro marrón salta sobre el perro perezoso.' : 'The quick brown fox jumps over the lazy dog.'}
        </div>
        <div style={{ fontSize: 16, color: 'var(--fg-2)' }}>
          1 2 3 4 5 6 7 8 9 0 - 1,000,000 CPS
        </div>
      </div>
    </div>
  );
};

// ── Admin Panel ───────────────────────────────────────────────────────────────

window.AdminCorePanel = function({ activeTab, setActiveTab, lang, onLangChange, onEnterGame, onBack }) {
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
  
  const [playerSort, setPlayerSort] = useState('prestige'); // 'prestige', 'level', 'teeth'
  const [playerFilter, setPlayerFilter] = useState('all'); // 'all', 'banned'
  const [cpsThreshold, setCpsThreshold] = useState(() => {
    try { return parseInt(localStorage.getItem('admin_cps_threshold')) || 20; } catch(e) { return 20; }
  });
  const [cpsLimitEnabled, setCpsLimitEnabled] = useState(() => {
    try { return localStorage.getItem('admin_cps_limit_enabled') !== 'false'; } catch(e) { return true; }
  });
  const [applyAdvancedFiltersToGame, setApplyAdvancedFiltersToGame] = useState(() => {
    try { return localStorage.getItem('admin_apply_filters_to_game') === 'true'; } catch(e) { return false; }
  });
  const [globalTooltip, setGlobalTooltip] = useState(null);
  const fmt = window.formatNum;

  const [newMsgName, setNewMsgName] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [newMsgMilestone, setNewMsgMilestone] = useState(1);
  const [newMsgIsRandom, setNewMsgIsRandom] = useState(true);
  const [newMsgPlaytimeVal, setNewMsgPlaytimeVal] = useState(5);
  const [newMsgPlaytimeUnit, setNewMsgPlaytimeUnit] = useState('minutes');
  const [newMsgColor, setNewMsgColor] = useState('#1a8fff');
  const [newMsgPos, setNewMsgPos] = useState('bottom'); // top, center, bottom
  const [newMsgSize, setNewMsgSize] = useState('medium'); // small, medium, large
  const [newMsgAnim, setNewMsgAnim] = useState('none'); // none, pulse, shake, float
  const [newMsgParticles, setNewMsgParticles] = useState('none'); // none, stars, teeth, fire, confetti
  const [newMsgImage, setNewMsgImage] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const fileInputRef = useRef(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [createMode, setCreateMode] = useState(null); // null, 'manual', 'random'
  const [newMsgType, setNewMsgType] = useState('normal'); // 'normal' | 'question'
  const [newMsgQuestionAnswer, setNewMsgQuestionAnswer] = useState(true); // true = Verdadero
  const [newMsgCorrectReward, setNewMsgCorrectReward] = useState({ type: 'addTeeth', amount: 1000 });
  const [newMsgWrongReward, setNewMsgWrongReward] = useState({ type: 'removeTeeth', amount: 500 });
  
  // New features for messages
  const [newMsgLevelReq, setNewMsgLevelReq] = useState(0);
  const [newMsgOptions, setNewMsgOptions] = useState(['Verdadero', 'Falso']);
  const [newMsgCorrectOptionIndex, setNewMsgCorrectOptionIndex] = useState(0);
  const [newMsgExplanationText, setNewMsgExplanationText] = useState('');

  const handleRandomizeEverything = () => {
    // 1. Pool of all name emisores
    const names = [
      "John", "Nico", "Dani", "Pas", "Memo", "Ale", "Carlos", "cris", "Seba", "Pancho", "José María", "Gabo", "feña", "Feña",
      "Alfonso", "Amparito", "Andrés", "Anto", "Bastián", "Cami", "Claudio", "Coty", "Cynthia", "Diego", "Edu", "Esteban",
      "Fran", "Gabriel", "Génesis", "Gino", "Ignacio", "Isidora", "Javi", "Jose", "Katita", "Maca", "Mane", "Manu",
      "Marcelo", "Mati", "Matías", "Nacho", "Nadia", "Natalia", "Naty", "Pablito", "Pato", "Romi", "Seba G.", "Tami", "Vale"
    ];
    const randName = names[Math.floor(Math.random() * names.length)];

    // 2. Humorous custom message templates
    const templates = [
      "¿Quién subió esto a prod sin probar en staging? El login da error 500 pero tú dale al click.",
      "Le prometí al principal inversor de riesgo que incorporaríamos IA en cada diente para el lunes.",
      "Ese botón principal de la interfaz está corrido exactamente 2px a la izquierda. ¡Qué horror visual!",
      "Nuestra API pública tarda 12 segundos enteros en responder una consulta simple. Excelente trabajo.",
      "Borré accidentalmente la base de datos de producción entera. Ups, espero que tengas un respaldo.",
      "Menos clicks inútiles en este juego y mucha más sinergia y alineación corporativa de alto impacto.",
      "¿Por qué decidiste de la nada cambiar la tipografía oficial por una sin licencia que parece fea?",
      "Todo el directorio internacional nos está observando de cerca hoy. Sigue clickeando con elegancia.",
      "Falta un contraste brutal de accesibilidad. Por favor, usa únicamente nuestra paleta corporativa.",
      "Tu código tiene tantos bugs y malas prácticas que parece escrito por un mono con sobredosis de café.",
      "Para optimizar los costos de electricidad de la startup: apaga tu monitor mientras no estés aquí.",
      "Figma es mi pasión y mi refugio creativo, pero ver tu código implementado es mi mayor tortura.",
      "El cliente más importante de la empresa quiere esta funcionalidad lista para ayer. ¡Corre a programar!",
      "¿Por qué el microservicio de facturación está intentando minar criptomonedas? Explícame esto ya.",
      "Tu mayor y más relevante aporte al sprint de esta semana fue desgastar el mouse con este clicker.",
      "Los reportes de KPIs trimestrales dan absoluta pena. Haz algo realmente útil por la compañía hoy.",
      "¿De verdad hiciste un commit directo a master sin pasar por revisión de código? La audacia me asusta.",
      "Ese tono fosforescente de verde literalmente daña mis retinas. Quítalo de inmediato de mi vista.",
      "Si algún cliente o inversor te llega a preguntar, todo este software ya está terminado y testeado.",
      "Esas sombras gigantes no tienen ningún tipo de sentido estético ni coherencia ahí. Quítalas ya.",
      "El logotipo corporativo debe ser considerablemente más grande, brillante y con sombras modernas.",
      "¿De verdad estás validando hipótesis de mercado o simplemente estás procrastinando con descaro?",
      "Nuestra base de datos explotó y perdimos tres meses de facturación, pero el diente sigue girando.",
      "¡Me encanta cómo pusiste un degradado arcoíris en la pantalla de carga sin avisarle a nadie!",
      "El gerente de cuentas está llorando en la sala de reuniones porque la demo no cargó. Buen trabajo.",
      "¿Puedes alinear el diente con la grilla de flexbox antes de que me dé un ataque de pánico visual?"
    ];
    const activeTexts = customMessages.map(m => m.text ? m.text.split('||image:')[0].trim() : '');
    const availableTemplates = templates.filter(tpl => !activeTexts.includes(tpl.trim()));
    const finalTemplates = availableTemplates.length > 0 ? availableTemplates : templates;
    const randText = finalTemplates[Math.floor(Math.random() * finalTemplates.length)];

    // 3. Random trigger type: playtime milestone vs random
    const randIsRandom = Math.random() < 0.5;

    // 4. Random playtime values (5 to 60) and unit
    const randPlaytimeVal = Math.floor(Math.random() * 55) + 5;
    const randPlaytimeUnit = Math.random() < 0.8 ? 'minutes' : 'hours';

    // 5. Random styles (excluding 'none' to always have real visual parameters)
    const positions = ['top', 'center', 'bottom'];
    const sizes = ['small', 'medium', 'large'];
    const animations = ['pulse', 'shake', 'float', 'rainbow'];
    const particlesOptions = ['stars', 'teeth', 'fire', 'confetti'];

    const randPos = positions[Math.floor(Math.random() * positions.length)];
    const randSize = sizes[Math.floor(Math.random() * sizes.length)];
    const randAnim = animations[Math.floor(Math.random() * animations.length)];
    const randPart = particlesOptions[Math.floor(Math.random() * particlesOptions.length)];

    // Generate vibrant Hex color
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 25) + 75; // 75-100%
    const l = Math.floor(Math.random() * 20) + 45; // 45-65%
    const sPct = s / 100;
    const lPct = l / 100;
    const c = (1 - Math.abs(2 * lPct - 1)) * sPct;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lPct - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
    const toHex = (val) => {
      const hex = Math.round((val + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    const randColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    // Set all new message states
    setNewMsgName(randName);
    setNewMsgText(randText);
    setNewMsgIsRandom(randIsRandom);
    setNewMsgPlaytimeVal(randPlaytimeVal);
    setNewMsgPlaytimeUnit(randPlaytimeUnit);
    setNewMsgPos(randPos);
    setNewMsgSize(randSize);
    setNewMsgAnim(randAnim);
    setNewMsgParticles(randPart);
    setNewMsgColor(randColor);
    setNewMsgImage(null); // Clear custom image to let seed avatar auto-match
  };
  const [msgFilter, setMsgFilter] = useState('all');
  const [msgToDelete, setMsgToDelete] = useState(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeLoading, setWipeLoading] = useState(false);
  const [successNote, setSuccessNote] = useState('');
  const [previewMsg, setPreviewMsg] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [msgSearch, setMsgSearch] = useState('');
  const [pendingImportJSON, setPendingImportJSON] = useState(null);
  const [selectedMsgIds, setSelectedMsgIds] = useState(new Set());
  const [showAdvancedFiltersModal, setShowAdvancedFiltersModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_advanced_filters');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return {
      msgType: 'all',
      position: 'all',
      size: 'all',
      animation: 'all',
      particles: 'all',
      color: 'all',
      levelReq: ''
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('admin_advanced_filters', JSON.stringify(advancedFilters));
      localStorage.setItem('admin_apply_filters_to_game', applyAdvancedFiltersToGame.toString());
    } catch(e) {}
    const t = setTimeout(() => {
      window.cloudSaveSettings({ advancedFilters, applyAdvancedFiltersToGame });
    }, 500);
    return () => clearTimeout(t);
  }, [advancedFilters, applyAdvancedFiltersToGame]);

  // ── Version Control States ──────────────────────────────────────────────────
  const [versionsList, setVersionsList] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [dbCommitSha, setDbCommitSha] = useState('');
  const [gitCommitSha, setGitCommitSha] = useState('');
  const [pendingCommits, setPendingCommits] = useState([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [newVersionString, setNewVersionString] = useState('');
  const [newVersionDate, setNewVersionDate] = useState('');
  const [newChangelogEs, setNewChangelogEs] = useState('');
  const [newChangelogEn, setNewChangelogEn] = useState('');
  const [isPublishingVersion, setIsPublishingVersion] = useState(false);
  const [versionSuccessNote, setVersionSuccessNote] = useState('');
  const [previewLang, setPreviewLang] = useState('es');

  // Semantic Conventional Commit Parser & Elaboration Dictionary
  const generateChangelogFromCommits = (commitsList) => {
    if (!commitsList || commitsList.length === 0) return { es: '', en: '' };
    const esLines = [];
    const enLines = [];
    
    commitsList.forEach(c => {
      let msg = c.commit && c.commit.message ? c.commit.message.split('\n')[0] : '';
      msg = msg.trim();
      if (!msg) return;
      
      const prefixRegex = /^(feat|fix|chore|refactor|style|docs|perf|test|build|ci)(\([a-z0-9-_]+\))?:\s*/i;
      let cleanMsg = msg.replace(prefixRegex, '');
      cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
      
      const low = msg.toLowerCase();
      let esElab = '';
      let enElab = '';
      
      if (low.includes('casing') || low.includes('case-insensitive') || (low.includes('login') && low.includes('james'))) {
        esElab = "Inicio de sesión insensible a mayúsculas: el juego ahora resuelve automáticamente las discrepancias de mayúsculas/minúsculas en el nombre de la cuenta al iniciar sesión, evitando la creación accidental de cuentas duplicadas.";
        enElab = "Case-insensitive login resolution: the authentication system now automatically resolves capital/lowercase differences in usernames during login, preventing duplicate account creations.";
      } 
      else if (low.includes('settings') || low.includes('configuraci')) {
        esElab = "Modal de configuración unificado: se agruparon todos los controles de sonido, idioma, efectos de partículas, efectos de cepillos y la opción de eliminación de cuenta en un solo modal premium accesible desde todos los menús del jugador.";
        enElab = "Unified settings modal: consolidated all audio, language, visual particle, spinning brush toggles, and the account deletion tool into a single premium modal accessible from all player menu context paths.";
      }
      else if (low.includes('version') || low.includes('history') || low.includes('log')) {
        esElab = "Optimización del historial de versiones: se rediseñó el modal de registro de versiones para extenderse a toda la altura disponible de la pantalla, brindando un scroll limpio y una lectura premium similar al reproductor de música.";
        enElab = "Version history optimization: redesigned the log modal body layout to scale and fill the maximum viewport height dynamically, providing a fluid scrolling experience matching the music player.";
      }
      else if (low.includes('delete') || low.includes('wrap') || low.includes('line')) {
        esElab = "Mejora visual de botones: se ajustó la disposición del botón de eliminación de cuenta con flexbox y propiedades 'nowrap' para asegurar que el texto del botón permanezca en una sola línea en dispositivos móviles.";
        enElab = "Button layout optimization: refined the delete account button layout using flexbox and white-space overrides to guarantee the button text remains strictly single-lined on narrow and mobile screens.";
      }
      else if (low.includes('music') || low.includes('reproductor') || low.includes('song') || low.includes('track')) {
        esElab = "Mejoras en el reproductor de música: optimizaciones generales en el rendimiento, estabilidad de las pistas, reproducción aleatoria y visualizaciones del disco giratorio.";
        enElab = "Music player enhancements: general performance optimizations, track loading stability, random shuffle adjustments, and rotating disc visualization fixes.";
      }
      else if (low.includes('brush') || low.includes('spinning') || low.includes('cepillo')) {
        esElab = "Control de cepillos giratorios: se vinculó el efecto visual de los cepillos en órbita a la nueva configuración de la cuenta, permitiendo a los jugadores ocultarlos o mostrarlos para ahorrar recursos.";
        enElab = "Spinning toothbrush visualization: bound the orbital toothbrush ring rendering to user settings, letting players show or hide orbiting brushes to save device resources.";
      }
      else if (low.includes('achieve') || low.includes('logro')) {
        esElab = "Ampliación de logros: refinamientos en los disparadores de logros por CPS y molares totales, aumentando la estabilidad de la sincronización en la nube.";
        enElab = "Achievements expansion: refined validation triggers for CPS and total molar achievements, improving cloud sync stability.";
      }
      else {
        let actionEs = 'Actualización';
        let actionEn = 'Update';
        if (low.startsWith('feat')) { actionEs = 'Nueva característica'; actionEn = 'New feature'; }
        else if (low.startsWith('fix')) { actionEs = 'Corrección de error'; actionEn = 'Bug fix'; }
        else if (low.startsWith('chore') || low.startsWith('refactor')) { actionEs = 'Optimización interna'; actionEn = 'Performance optimization'; }
        else if (low.startsWith('style') || low.startsWith('css')) { actionEs = 'Mejora visual'; actionEn = 'Visual enhancement'; }
        
        esElab = `${actionEs}: ${cleanMsg}`;
        enElab = `${actionEn}: ${cleanMsg}`;
      }
      
      esLines.push(esElab);
      enLines.push(enElab);
    });
    
    return {
      es: esLines.map(l => `• ${l}`).join('\n'),
      en: enLines.map(l => `• ${l}`).join('\n')
    };
  };

  const suggestNextVersion = (current) => {
    if (!current) return 'v0.1.0-beta';
    const match = current.match(/^v?(\d+)\.(\d+)\.(\d+)(-.+)?$/i);
    if (match) {
      const major = parseInt(match[1]);
      const minor = parseInt(match[2]);
      const patch = parseInt(match[3]);
      const suffix = match[4] || '';
      return `v${major}.${minor}.${patch + 1}${suffix}`;
    }
    return current + '-new';
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [msgFilter, activeTab, customMessages.length, msgSearch]);

  const MILESTONE_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300, 360];

  // Load everything on mount
  useEffect(() => {
    // 1. Admin accounts
    window.cloudLoadAdminAccounts().then(res => {
      if (res.ok) {
        const accs = res.accounts || [];
        if (!accs.includes(ADMIN_NAME)) accs.unshift(ADMIN_NAME);
        setAdminUsers(accs);
      }
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
      // Force all seeded messages that currently have a positive milestone in the old database to milestone: -1 (Random/Collaborator)
      // Since seed IDs are not persisted in the database (they are stored as autogenerated UUIDs), we identify the old seed list
      // by checking if the number of messages with non-random milestones (milestone !== -1) is very large (> 100).
      const oldSeedCount = msgs.filter(m => m.milestone !== -1).length;
      if (oldSeedCount > 100) {
        let migrated = msgs.map(m => ({ ...m, milestone: -1 }));
        window.cloudSaveCustomMessages(migrated);
        msgs = migrated;
      } else if (msgs.length < 600 && window.getBossMessagesSeed) {
        // Fallback for new empty databases
        const seed = window.getBossMessagesSeed();
        window.cloudSaveCustomMessages(seed);
        msgs = seed;
      }
      setCustomMessages(msgs);
      setMessagesLoading(false);
    });
    // 6. Version History and dynamic settings from Supabase
    if (window.cloudFetchVersionMetadata) {
      window.cloudFetchVersionMetadata().then(res => {
        if (res.ok) {
          setVersionsList(res.history || []);
          setDbCommitSha(res.latestSha || '');
        }
        setVersionsLoading(false);
      });
    } else {
      setVersionsLoading(false);
    }
  }, []);

  // Fetch latest GitHub Commit
  useEffect(() => {
    fetch('https://api.github.com/repos/advancedchile/ToothClicker/commits?sha=main&per_page=1')
      .then(r => {
        if (!r.ok) throw new Error("HTTP error " + r.status);
        return r.json();
      })
      .then(data => {
        if (data && data[0] && data[0].sha) {
          setGitCommitSha(data[0].sha);
        }
      })
      .catch(err => console.warn("Failed to fetch latest GitHub commit:", err));
  }, [activeTab]);

  // Fetch commit comparison if they don't match
  useEffect(() => {
    if (!gitCommitSha) return;
    
    if (!dbCommitSha) {
      // First-time setup: fetch last 3 commits from GitHub to prefill
      setLoadingCommits(true);
      fetch('https://api.github.com/repos/advancedchile/ToothClicker/commits?sha=main&per_page=3')
        .then(r => r.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setPendingCommits(data);
            const generated = generateChangelogFromCommits(data);
            setNewChangelogEs(generated.es);
            setNewChangelogEn(generated.en);
            const currentVersion = window.APP_VERSION || 'v0.5.5-beta';
            setNewVersionString(currentVersion);
            setNewVersionDate(new Date().toISOString().split('T')[0]);
          }
          setLoadingCommits(false);
        })
        .catch(err => {
          console.warn("Failed to fetch default commits:", err);
          setLoadingCommits(false);
        });
      return;
    }

    if (dbCommitSha === gitCommitSha) {
      setPendingCommits([]);
      return;
    }
    setLoadingCommits(true);
    fetch(`https://api.github.com/repos/advancedchile/ToothClicker/compare/${dbCommitSha}...${gitCommitSha}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.commits) {
          setPendingCommits(data.commits);
          const generated = generateChangelogFromCommits(data.commits);
          setNewChangelogEs(generated.es);
          setNewChangelogEn(generated.en);
          const currentVersion = window.APP_VERSION || 'v0.5.5-beta';
          const nextVer = suggestNextVersion(currentVersion);
          setNewVersionString(nextVer);
          setNewVersionDate(new Date().toISOString().split('T')[0]);
        }
        setLoadingCommits(false);
      })
      .catch(err => {
        console.warn("Failed to fetch commit comparison:", err);
        setLoadingCommits(false);
      });
  }, [dbCommitSha, gitCommitSha]);

  const saveMessagesToCloud = (updatedList) => {
    setIsSavingMessages(true);
    window.cloudSaveCustomMessages(updatedList).then(res => {
      setIsSavingMessages(false);
      if (!res.ok) alert('Error guardando mensajes en la nube: ' + res.error);
    });
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!Array.isArray(json)) {
          throw new Error('El archivo JSON debe contener un arreglo de mensajes.');
        }

        const newMessages = json.map(msg => {
          let finalWho = msg.who || '';
          let finalImage = msg.image || '';

          if (finalWho && finalWho.toLowerCase() === 'cualquiera') {
            const names = window.EMPLOYEE_NAMES || ['Dani'];
            finalWho = names[Math.floor(Math.random() * names.length)];
          }
          if (finalImage && finalImage.toLowerCase() === 'cualquiera') {
            finalImage = null; // Forces fallback to auto-avatar
          }

          const newMsg = {
            id: `m-imp-${Date.now()}-${Math.floor(Math.random()*10000)}`,
            who: finalWho,
            text: msg.text || '',
            image: finalImage,
            milestone: msg.milestone !== undefined ? msg.milestone : 1,
            color: msg.color || '#1a8fff',
            position: msg.position || 'bottom',
            size: msg.size || 'medium',
            animation: msg.animation || 'none',
            particles: msg.particles || 'none',
            levelReq: msg.levelReq,
            createdAt: Date.now() + Math.random()
          };

          if (msg.msgType === 'question') {
            newMsg.msgType = 'question';
            newMsg.options = msg.options;
            newMsg.correctOptionIndex = msg.correctOptionIndex;
            newMsg.explanationText = msg.explanationText;
            newMsg.correctReward = msg.correctReward;
            newMsg.wrongReward = msg.wrongReward;
            newMsg.questionAnswer = msg.questionAnswer !== undefined ? msg.questionAnswer : true;
          }

          return newMsg;
        });

        setPendingImportJSON(newMessages);
      } catch (err) {
        alert(lang === 'es' ? 'Error al importar JSON: ' + err.message : 'Error importing JSON: ' + err.message);
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const handleStartEditMsg = (m) => {
    const isRand = m.milestone === -1;
    let val = 5;
    let unit = 'minutes';
    if (!isRand) {
      if (m.milestone >= 60 && m.milestone % 60 === 0) {
        val = m.milestone / 60;
        unit = 'hours';
      } else {
        val = m.milestone;
        unit = 'minutes';
      }
    }
    setEditingMsg({
      ...m,
      isRandom: isRand,
      playtimeVal: val,
      playtimeUnit: unit,
      msgType: m.msgType || 'normal',
      questionAnswer: m.questionAnswer !== undefined ? m.questionAnswer : true,
      correctReward: m.correctReward || { type: 'addTeeth', amount: 1000 },
      wrongReward: m.wrongReward || { type: 'removeTeeth', amount: 500 }
    });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024) {
      alert(lang === 'es' ? 'La imagen no debe superar los 100 KB' : 'Image size must not exceed 100 KB');
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowed.includes(file.type)) {
      alert(lang === 'es' ? 'Formato no permitido. Solo png, jpg, jpeg y gif.' : 'Format not allowed. Only png, jpg, jpeg and gif.');
      return;
    }

    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        if (editingMsg) {
          setEditingMsg(prev => ({ ...prev, image: reader.result }));
        } else {
          setNewMsgImage(reader.result);
        }
        setAvatarLoading(false);
      }, 500);
    };
    reader.onerror = () => {
      setAvatarLoading(false);
      alert('Error reading file');
    };
    reader.readAsDataURL(file);
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
      if (name !== ADMIN_NAME) {
        const updated = adminUsers.filter((u) => u !== name);
        setAdminUsers(updated);
        window.cloudSaveAdminAccounts && window.cloudSaveAdminAccounts(updated);
      }
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
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'url(uploads/background-e5bd6167.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none', opacity: 0.45 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '32px 20px 56px' }}>

        {/* GitHub updates notification snackbar */}


        {activeTab === 'accounts' && (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-gauge-high" style={{ color: '#ff9800', fontSize: 15 }}></i>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
                {lang === 'es' ? 'Límite de CPS (Clicks por Segundo)' : 'CPS Limit (Clicks per Second)'}
              </span>
            </div>
            
            {/* Toggle Switch */}
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: cpsLimitEnabled ? '#388e3c' : '#718096', textTransform: 'uppercase' }}>
                {cpsLimitEnabled 
                  ? (lang === 'es' ? 'Activo' : 'Active') 
                  : (lang === 'es' ? 'Sin Límite' : 'No Limit')}
              </span>
              <div 
                onClick={() => {
                  const nextVal = !cpsLimitEnabled;
                  setCpsLimitEnabled(nextVal);
                  try { localStorage.setItem('admin_cps_limit_enabled', nextVal.toString()); } catch(e) {}
                  window.cloudSaveSettings({ cpsLimitEnabled: nextVal });
                }}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: cpsLimitEnabled ? '#4cd137' : '#d2d8d8',
                  padding: 2,
                  position: 'relative',
                  transition: 'all 0.2s',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: cpsLimitEnabled ? 22 : 2,
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </div>
            </label>
          </div>
          
          <div style={{ fontSize: 12, color: '#5a8aaa', marginBottom: 12, lineHeight: 1.5 }}>
            {cpsLimitEnabled ? (
              lang === 'es' 
                ? `Cuando un jugador alcance ${cpsThreshold} CPS, se activará la advertencia o ban por uso de macros.`
                : `When a player reaches ${cpsThreshold} CPS, the macro warning or ban will be triggered.`
            ) : (
              lang === 'es'
                ? 'El límite de CPS está desactivado. Los jugadores no recibirán advertencias ni bans por CPS elevado.'
                : 'The CPS limit is disabled. Players will not receive macro warnings or bans for high CPS.'
            )}
          </div>

          {cpsLimitEnabled && (
            <>
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
            </>
          )}
        </div>




          <window.AdminLogo lang={lang} />
          <window.AdminTerminology lang={lang} />
          <window.AdminTypography lang={lang} />
          </>
        )}

        {activeTab === 'leaderboard' && (
          <div style={card}>
            {(() => {
              const lbState = { 
                scores: globalUsers, 
                loading: globalLoading, 
                error: null, 
                refresh: () => {
                  setGlobalLoading(true);
                  window.cloudFetchLeaderboard().then(res => {
                    if (res.ok) setGlobalUsers(res.scores || []);
                    setGlobalLoading(false);
                  });
                }
              };

              const renderAdminActions = (u) => {
                const localBan = window.AntiCheat.checkBanStatus(u.name);
                const isBanned = localBan.isBanned || (u.banIndefinite === true) || (u.banUntil && u.banUntil > Date.now());
                
                return (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, justifyContent: 'flex-end' }}>
                    {isBanned && (
                      <button 
                        onClick={() => setRestoreTarget(u.name)}
                        className="app-btn" style={{ ...btn, padding: '6px 10px', background: 'rgba(76,175,80,0.1)', color: '#388e3c', fontSize: 12, border: '1px solid rgba(76,175,80,0.25)', borderRadius: 8 }}
                      >
                        <i className="fa-solid fa-user-check"></i>
                      </button>
                    )}
                    <button 
                      onClick={() => setDeleteTarget({ name: u.name, type: 'global' })}
                      className="app-btn" style={{ ...btn, padding: '6px 10px', background: 'rgba(220,50,50,0.1)', color: '#c33', fontSize: 12, border: '1px solid rgba(220,50,50,0.25)', borderRadius: 8 }}
                    >
                      <i className="fa-solid fa-user-slash"></i>
                    </button>
                  </div>
                );
              };

              // Filter users if "Banned" filter is active
              let filteredScores = globalUsers;
              if (playerFilter === 'banned') {
                filteredScores = globalUsers.filter(u => {
                  const lb = window.AntiCheat.checkBanStatus(u.name);
                  return lb.isBanned || u.banIndefinite || (u.banUntil && u.banUntil > Date.now());
                });
              }

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="fa-solid fa-users" style={{ color: 'var(--primary-i100)', fontSize: 20 }}></i>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a' }}>
                        {lang === 'es' ? 'Gestión de Jugadores' : 'Player Management'}
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({globalUsers.filter(u => u.name.toLowerCase() !== 'james').length})</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.6)', padding: 3, borderRadius: 8, border: '1px solid rgba(100,160,230,0.15)' }}>
                      {[{ id: 'all', label: lang === 'es' ? 'Todos' : 'All' }, { id: 'banned', label: lang === 'es' ? 'Banneados' : 'Banned' }].map(f => (
                        <button key={f.id} onClick={() => setPlayerFilter(f.id)} className="app-btn" style={{ ...btn, padding: '4px 10px', fontSize: 10, borderRadius: 6, background: playerFilter === f.id ? '#1a8fff' : 'transparent', color: playerFilter === f.id ? '#fff' : '#4a6a8a', border: 'none' }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <window.LeaderboardBody 
                    lb={{ ...lbState, scores: filteredScores }} 
                    lang={lang} 
                    currentUser={null} 
                    renderRowExtra={renderAdminActions}
                    extraColumns="100px"
                    noScroll={true}
                  />
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'feedback' && (
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
                        {f.name || f.username || 'Anónimo'}
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

        {activeTab === 'messages' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <i className="fa-solid fa-bullhorn" style={{ color: '#ff9800', fontSize: 15 }}></i>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
                {lang === 'es' ? 'Mensajes por Tiempo de Juego' : 'Playtime Milestone Messages'}
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({customMessages.length})</span>
              </span>
              <button
                onClick={() => {
                  if (confirm(lang === 'es' ? '¿Estás seguro de restablecer todos los mensajes personalizados a los valores aleatorios por defecto? Se perderán los cambios manuales.' : 'Are you sure you want to reset all custom messages to the default random values? Manual changes will be lost.')) {
                    setIsSavingMessages(true);
                    const seed = window.getBossMessagesSeed ? window.getBossMessagesSeed() : [];
                    window.cloudSaveCustomMessages(seed).then(res => {
                      setIsSavingMessages(false);
                      if (res.ok) {
                        setCustomMessages(seed);
                        setSuccessNote(lang === 'es' ? '¡Mensajes restablecidos!' : 'Messages reset!');
                        setTimeout(() => setSuccessNote(''), 3000);
                      } else {
                        alert('Error: ' + res.error);
                      }
                    });
                  }
                }}
                className="app-btn"
                style={{
                  padding: '4px 10px',
                  background: '#fee2e2',
                  color: '#ef4444',
                  border: '1px solid #fca5a5',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <i className="fa-solid fa-rotate-left"></i> {lang === 'es' ? 'Restablecer Semilla' : 'Reset Seed'}
              </button>

              <label 
                className="app-btn hover-bg-blue"
                style={{
                  padding: '4px 10px',
                  background: '#e0f2fe',
                  color: '#0ea5e9',
                  border: '1px solid #7dd3fc',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s'
                }}
              >
                <i className="fa-solid fa-file-import"></i> {lang === 'es' ? 'Importar JSON' : 'Import JSON'}
                <input 
                  type="file" 
                  accept=".json" 
                  style={{ display: 'none' }} 
                  onChange={handleImportJSON} 
                />
              </label>

              {successNote && <span style={{ fontSize: 11, color: '#2ecc71', fontWeight: 700, marginLeft: 12, animation: 'fadeIn 0.3s' }}><i className="fa-solid fa-check-circle"></i> {successNote}</span>}
              {(messagesLoading || isSavingMessages) && <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 12, color: '#ff9800', marginLeft: 'auto' }}></i>}
              {isSavingMessages && <span style={{ fontSize: 10, color: '#ff9800', marginLeft: 8 }}>{lang === 'es' ? 'Guardando...' : 'Saving...'}</span>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setNewMsgName('');
                  setNewMsgText('');
                  setNewMsgMilestone(1);
                  setNewMsgIsRandom(true);
                  setNewMsgPlaytimeVal(5);
                  setNewMsgPlaytimeUnit('minutes');
                  setNewMsgColor('#1a8fff');
                  setNewMsgPos('bottom');
                  setNewMsgSize('medium');
                  setNewMsgAnim('none');
                  setNewMsgParticles('none');
                  setNewMsgImage(null);
                  setCreateMode(null);
                  setShowCreateModal(true);
                }}
                className="app-btn"
                style={{ ...btn, flex: 1, minWidth: 150, height: 44, background: '#1a8fff', color: '#fff', boxShadow: '0 4px 12px rgba(26,143,255,0.2)', fontSize: 14 }}
              >
                <i className="fa-solid fa-plus"></i> {lang === 'es' ? 'Nuevo mensaje' : 'New message'}
              </button>

              {/* Buscador de emisor */}
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 14, top: 15, color: '#8aaacc', fontSize: 14 }}></i>
                <input
                  type="text"
                  placeholder={lang === 'es' ? 'Buscar emisor...' : 'Search sender...'}
                  value={msgSearch}
                  onChange={e => setMsgSearch(e.target.value)}
                  className="app-input search-input"
                  style={{
                    width: '100%',
                    height: 44,
                    paddingLeft: 38,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
                {msgSearch && (
                  <button
                    onClick={() => setMsgSearch('')}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 10,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      fontSize: 16,
                      padding: 4
                    }}
                  >
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                )}
              </div>

              <window.Dropdown 
                value={msgFilter}
                onChange={val => setMsgFilter(val)}
                style={{ width: 180, height: 44 }}
                options={[
                  { value: "all", label: lang === 'es' ? 'Todos' : 'All' },
                  { value: "bosses", label: lang === 'es' ? 'Solo jefes' : 'Solo leaders' },
                  { value: "collabs", label: lang === 'es' ? 'Solo colaboradores' : 'Solo staff' },
                  { value: "json", label: lang === 'es' ? 'Importados por JSON' : 'Imported via JSON' }
                ]}
              />

              <button
                onClick={() => setShowAdvancedFiltersModal(true)}
                className="app-btn"
                style={{ ...btn, height: 44, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: 14, padding: '0 16px' }}
                title={lang === 'es' ? 'Filtros Avanzados' : 'Advanced Filters'}
              >
                <i className="fa-solid fa-filter"></i> {lang === 'es' ? 'Avanzado' : 'Advanced'}
              </button>

              {selectedMsgIds.size > 0 && (
                <button
                  onClick={() => {
                    if (confirm(lang === 'es' ? `¿Seguro que deseas eliminar los ${selectedMsgIds.size} mensajes seleccionados? Esta acción no se puede deshacer.` : `Are you sure you want to delete the ${selectedMsgIds.size} selected messages? This cannot be undone.`)) {
                      const updated = customMessages.filter(m => !selectedMsgIds.has(m.id));
                      setCustomMessages(updated);
                      saveMessagesToCloud(updated);
                      setSelectedMsgIds(new Set());
                    }
                  }}
                  className="app-btn"
                  style={{ ...btn, height: 44, background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', fontSize: 14, padding: '0 16px' }}
                >
                  <i className="fa-solid fa-trash-can"></i> {lang === 'es' ? `Borrar seleccionados (${selectedMsgIds.size})` : `Delete selected (${selectedMsgIds.size})`}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(() => {
                const parseAdvProps = (m) => {
                  let rawText = m.text || '';
                  let extraData = {};
                  if (rawText.includes("||extra:")) {
                    const parts = rawText.split("||extra:");
                    rawText = parts[0];
                    const remainder = parts[1];
                    const endIdx = remainder.indexOf('||');
                    try { extraData = JSON.parse(endIdx === -1 ? remainder : remainder.substring(0, endIdx)); } catch(e) {}
                  }
                  const isQuestion = m.msgType === 'question' || (m.text || '').includes('||question:');
                  return {
                    isQuestion,
                    position: m.position || extraData.position || 'bottom',
                    size: m.size || extraData.size || 'medium',
                    animation: m.animation || extraData.animation || 'none',
                    particles: m.particles || extraData.particles || 'none',
                    levelReq: m.levelReq !== undefined ? m.levelReq : (extraData.levelReq !== undefined ? extraData.levelReq : 0)
                  };
                };

                const filtered = [...customMessages]
                  .filter(m => {
                    // Base Text Search
                    if (msgSearch.trim()) {
                      const query = msgSearch.toLowerCase();
                      const name = (m.who || '').toLowerCase();
                      const textMatch = (m.text || '').toLowerCase().includes(query);
                      if (!name.includes(query) && !textMatch) return false;
                    }
                    
                    // Base Role Filter
                    const isBoss = typeof m.milestone === 'number' && m.milestone >= 0;
                    if (msgFilter === 'bosses' && !isBoss) return false;
                    if (msgFilter === 'collabs' && isBoss) return false;
                    if (msgFilter === 'json' && (!m.id || !m.id.startsWith('m-imp-'))) return false;

                    // Advanced Filters
                    const adv = parseAdvProps(m);
                    if (advancedFilters.msgType === 'question' && !adv.isQuestion) return false;
                    if (advancedFilters.msgType === 'normal' && adv.isQuestion) return false;
                    if (advancedFilters.position !== 'all' && adv.position !== advancedFilters.position) return false;
                    if (advancedFilters.size !== 'all' && adv.size !== advancedFilters.size) return false;
                    if (advancedFilters.animation !== 'all' && adv.animation !== advancedFilters.animation) return false;
                    if (advancedFilters.particles !== 'all' && adv.particles !== advancedFilters.particles) return false;
                    if (advancedFilters.color !== 'all' && (m.color || '#1a8fff') !== advancedFilters.color) return false;
                    if (advancedFilters.levelReq !== '' && adv.levelReq !== Number(advancedFilters.levelReq)) return false;

                    return true;
                  })
                  .sort((a, b) => a.milestone - b.milestone);

                const itemsPerPage = 25;
                const totalItems = filtered.length;
                const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

                const allFilteredIds = filtered.map(m => m.id);
                const allSelected = filtered.length > 0 && allFilteredIds.every(id => selectedMsgIds.has(id));

                return (
                  <>
                    {filtered.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSet = new Set(selectedMsgIds);
                              allFilteredIds.forEach(id => newSet.add(id));
                              setSelectedMsgIds(newSet);
                            } else {
                              const newSet = new Set(selectedMsgIds);
                              allFilteredIds.forEach(id => newSet.delete(id));
                              setSelectedMsgIds(newSet);
                            }
                          }}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>
                          {lang === 'es' ? 'Seleccionar todos los filtrados' : 'Select all filtered'} ({filtered.length})
                        </span>
                      </div>
                    )}
                    {paginated.map(m => {
                      const isBoss = typeof m.milestone === 'number' && m.milestone >= 0;
                      
                      let cleanText = m.text || '';
                      let isQuestion = m.msgType === 'question';
                      let qAnswer = m.questionAnswer;
                      let extraData = null;

                      if (cleanText.includes('||extra:')) {
                        const parts = cleanText.split('||extra:');
                        cleanText = parts[0];
                        const remainder = parts[1];
                        const endIdx = remainder.indexOf('||');
                        try {
                          extraData = JSON.parse(endIdx === -1 ? remainder : remainder.substring(0, endIdx));
                        } catch (e) {}
                        if (endIdx !== -1) cleanText += remainder.substring(endIdx);
                      }
                      
                      if (cleanText.includes('||question:')) {
                        isQuestion = true;
                        cleanText = cleanText.split('||question:')[0];
                      }
                      if (cleanText.includes('||image:')) {
                        cleanText = cleanText.split('||image:')[0];
                      }
                      
                      const hasOptions = extraData && extraData.options && extraData.options.length > 0;

                      return (
                        <div key={m.id} style={{ padding: '14px', background: '#fff', borderRadius: 12, border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input 
                                type="checkbox" 
                                checked={selectedMsgIds.has(m.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedMsgIds);
                                  if (e.target.checked) newSet.add(m.id);
                                  else newSet.delete(m.id);
                                  setSelectedMsgIds(newSet);
                                }}
                                style={{ width: 16, height: 16, cursor: 'pointer', marginRight: 4 }}
                              />
                              {(() => {
                                const avatarUrl = getAvatarUrl(m.who, m.image, m.id);
                                if (avatarUrl) {
                                  return (
                                    <img
                                      src={avatarUrl}
                                      alt={m.who}
                                      style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: `2px solid ${m.color || '#1a8fff'}`,
                                        boxShadow: `0 0 6px ${m.color || '#1a8fff'}44`
                                      }}
                                    />
                                  );
                                } else {
                                  return (
                                    <div style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      background: '#f1f5f9',
                                      border: `2px solid ${m.color || '#1a8fff'}`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: m.color || '#1a8fff',
                                      fontSize: 12,
                                      boxShadow: `0 0 6px ${m.color || '#1a8fff'}44`
                                    }}>
                                      <i className="fa-solid fa-user"></i>
                                    </div>
                                  );
                                }
                              })()}
                              <span style={{ fontWeight: 700, fontSize: 14, color: '#2d3748' }}>{m.who}</span>
                            </div>
                          </div>
                        <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.5, fontStyle: 'italic', background: '#fdfdfd', padding: '10px 14px', borderRadius: 10, borderLeft: `3px solid ${m.color || '#1a8fff'}` }}>
                          "{cleanText}"
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                            <div style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 6, background: '#f7fafc', padding: '4px 8px', borderRadius: 6 }}>
                              {isBoss ? '👑' : '⚡'} {isBoss ? (lang === 'es' ? 'Jefe' : 'Boss') : (lang === 'es' ? 'Aleatorio' : 'Random')}
                            </div>
                            {isQuestion && (
                              <div style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 6, background: '#f7fafc', padding: '4px 8px', borderRadius: 6 }}>
                                ❓ {lang === 'es' ? 'Pregunta' : 'Question'}
                              </div>
                            )}
                            {isBoss && (
                              <div style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 6, background: '#f7fafc', padding: '4px 8px', borderRadius: 6 }}>
                                <i className="fa-regular fa-clock" style={{ fontSize: 10 }}></i>
                                {m.milestone >= 60 && m.milestone % 60 === 0 ? `${m.milestone / 60} h` : `${m.milestone} min`}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 14 }}>
                            <button 
                              onClick={() => setPreviewMsg({ ...m, es: m.text, en: m.text })} 
                              className="app-btn"
                              style={{ all: 'unset', color: '#ff9800', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                            >
                              {lang === 'es' ? 'Previsualizar' : 'Preview'}
                            </button>
                            <button onClick={() => handleStartEditMsg(m)} className="app-btn" style={{ all: 'unset', color: '#1a8fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                              {lang === 'es' ? 'Editar' : 'Edit'}
                            </button>
                            <button onClick={() => setMsgToDelete(m)} className="app-btn" style={{ all: 'unset', color: '#e53e3e', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                              {lang === 'es' ? 'Borrar' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                    {totalItems === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0', fontStyle: 'italic', fontSize: 14 }}>
                        {lang === 'es' ? 'No hay mensajes creados' : 'No messages created'}
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 24, background: '#f8fafc', padding: '10px 16px', borderRadius: 12, border: '1px solid #edf2f7' }}>
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => { window.playClickSound && window.playClickSound(); setCurrentPage(p => Math.max(1, p - 1)); }}
                          className="app-btn"
                          style={{ ...btn, padding: '8px 14px', background: currentPage === 1 ? '#e2e8f0' : '#1a8fff', color: currentPage === 1 ? '#a0aec0' : '#fff', border: 'none', borderRadius: 8, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                        >
                          <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#4a5568', minWidth: 100, textAlign: 'center' }}>
                          {lang === 'es' ? `Página ${currentPage} de ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                        </span>
                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => { window.playClickSound && window.playClickSound(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                          className="app-btn"
                          style={{ ...btn, padding: '8px 14px', background: currentPage === totalPages ? '#e2e8f0' : '#1a8fff', color: currentPage === totalPages ? '#a0aec0' : '#fff', border: 'none', borderRadius: 8, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                        >
                          <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
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

        {activeTab === 'versions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Publication Form */}
            <div style={{ marginBottom: 24 }}>
              {/* Form Card */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <i className="fa-solid fa-file-signature" style={{ color: '#1a8fff', fontSize: 15 }}></i>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
                    {lang === 'es' ? 'Publicar Nueva Versión' : 'Publish New Version'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>
                      {lang === 'es' ? 'Número de Versión' : 'Version Number'}
                    </label>
                    <input 
                      type="text" 
                      value={newVersionString} 
                      onChange={e => setNewVersionString(e.target.value)} 
                      className="app-input" 
                      style={{ width: '100%', height: 38, fontSize: 13 }}
                      placeholder="e.g. v0.5.6-beta" 
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>
                      {lang === 'es' ? 'Fecha de Lanzamiento' : 'Release Date'}
                    </label>
                    <input 
                      type="date" 
                      value={newVersionDate} 
                      onChange={e => setNewVersionDate(e.target.value)} 
                      className="app-input" 
                      style={{ width: '100%', height: 38, fontSize: 13 }} 
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', display: 'block' }}>
                      {lang === 'es' ? 'Changelog (Una viñeta • por línea)' : 'Changelog (One • bullet per line)'}
                    </label>
                    <button 
                      onClick={() => setPreviewLang(previewLang === 'es' ? 'en' : 'es')}
                      className="app-btn"
                      style={{ ...btn, padding: '2px 8px', fontSize: 10, background: 'var(--bg-3)', color: 'var(--fg-2)', border: '1px solid var(--border)', borderRadius: 4 }}
                    >
                      {previewLang === 'es' ? 'ES' : 'EN'}
                    </button>
                  </div>
                  {previewLang === 'es' ? (
                    <window.AdminRichTextEditor 
                      value={newChangelogEs} 
                      onChange={val => setNewChangelogEs(val)} 
                      placeholder="• Detalle 1..."
                    />
                  ) : (
                    <window.AdminRichTextEditor 
                      value={newChangelogEn} 
                      onChange={val => setNewChangelogEn(val)} 
                      placeholder="• Detail 1..."
                    />
                  )}
                </div>

                <button 
                  onClick={async () => {
                    if (!newVersionString.trim()) { alert(lang === 'es' ? 'Ingresa el número de versión' : 'Please enter the version number'); return; }
                    
                    setIsPublishingVersion(true);
                    window.playClickSound && window.playClickSound();
                    
                    const newRelease = {
                      v: newVersionString.trim(),
                      date: newVersionDate || new Date().toISOString().split('T')[0],
                      es: newChangelogEs.trim(),
                      en: newChangelogEn.trim()
                    };
                    
                    const updatedHistory = [newRelease, ...versionsList];
                    const targetSha = gitCommitSha || dbCommitSha;
                    
                    const res = await window.cloudSaveVersionHistory(updatedHistory, targetSha);
                    setIsPublishingVersion(false);
                    
                    if (res.ok) {
                      setVersionsList(updatedHistory);
                      setDbCommitSha(targetSha);
                      setPendingCommits([]);
                      
                      // Dynamically update game local state with clean unique merge
                      const localDefault = window.DEFAULT_VERSION_HISTORY || [];
                      const merged = [...updatedHistory];
                      for (const item of localDefault) {
                        if (!merged.some(m => m.v === item.v)) {
                          merged.push(item);
                        }
                      }
                      window.VERSION_HISTORY = merged;
                      window.APP_VERSION = newRelease.v;
                      
                      // Play positive chime
                      if (window.playChimeSound) window.playChimeSound();
                      
                      setVersionSuccessNote(lang === 'es' ? '¡Versión publicada con éxito!' : 'Version published successfully!');
                      setTimeout(() => setVersionSuccessNote(''), 4000);
                    } else {
                      alert("Error: " + res.error);
                    }
                  }} 
                  disabled={isPublishingVersion}
                  className="app-btn" 
                  style={{ ...btn, width: '100%', height: 44, background: '#10b981', color: '#fff', fontSize: 14, boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
                >
                  {isPublishingVersion ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      {lang === 'es' ? 'Publicando...' : 'Publishing...'}
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      {lang === 'es' ? 'Publicar Changelog en Staging/Prod' : 'Publish Changelog to Staging/Prod'}
                    </>
                  )}
                </button>
                {versionSuccessNote && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#059669', fontWeight: 700, textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                    <i className="fa-solid fa-circle-check"></i> {versionSuccessNote}
                  </div>
                )}
              </div>
            </div>

            {/* Chronological Version Logs List */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#ff9800', fontSize: 15 }}></i>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5a' }}>
                  {lang === 'es' ? 'Historial de Versiones Documentadas' : 'Documented Version History'}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaacc', marginLeft: 8 }}>({versionsList.length})</span>
                </span>
              </div>

              {versionsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#8aaacc', fontStyle: 'italic', fontSize: 13 }}>
                  {lang === 'es' ? 'No hay versiones registradas aún.' : 'No registered versions yet.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {versionsList.map((v, index) => (
                    <div key={index} style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid rgba(100,160,230,0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dotted rgba(100,160,230,0.3)', paddingBottom: 6, marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a8fff' }}>
                          {v.v}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: '#8aaacc', fontWeight: 600 }}>{v.date}</span>
                          <button 
                            onClick={async () => {
                              if (confirm(lang === 'es' ? `¿Eliminar la versión ${v.v} del historial?` : `Delete version ${v.v} from history?`)) {
                                window.playClickSound && window.playClickSound();
                                const updated = versionsList.filter((item, idx) => idx !== index);
                                const nextSha = updated.length > 0 ? dbCommitSha : '';
                                
                                const res = await window.cloudSaveVersionHistory(updated, nextSha);
                                if (res.ok) {
                                  setVersionsList(updated);
                                  const localDefault = window.DEFAULT_VERSION_HISTORY || [];
                                  const merged = [...updated];
                                  for (const item of localDefault) {
                                    if (!merged.some(m => m.v === item.v)) {
                                      merged.push(item);
                                    }
                                  }
                                  window.VERSION_HISTORY = merged;
                                  if (updated.length > 0) {
                                    window.APP_VERSION = updated[0].v;
                                  } else if (localDefault.length > 0) {
                                    window.APP_VERSION = localDefault[0].v;
                                  }
                                } else {
                                  alert("Error: " + res.error);
                                }
                              }
                            }}
                            className="app-btn"
                            style={{ ...btn, padding: '4px 8px', background: 'rgba(220,50,50,0.08)', color: '#c33', fontSize: 11, border: '1px solid rgba(220,50,50,0.15)', borderRadius: 6 }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#8aaacc', textTransform: 'uppercase', marginBottom: 4 }}>Español</div>
                          <div style={{ fontSize: 11, color: '#4a5568', whiteSpace: 'pre-wrap', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: v.es }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#8aaacc', textTransform: 'uppercase', marginBottom: 4 }}>English</div>
                          <div style={{ fontSize: 11, color: '#4a5568', whiteSpace: 'pre-wrap', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: v.en }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- INDEPENDENT MODALS (TOP LEVEL) --- */}

      {showAdvancedFiltersModal && (
        <Modal onClose={() => setShowAdvancedFiltersModal(false)} maxWidth={500} persistent={false}>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-filter" style={{ color: '#1a8fff' }}></i>
              {lang === 'es' ? 'Filtros Avanzados' : 'Advanced Filters'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* MsgType */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{lang === 'es' ? 'Tipo de Mensaje' : 'Message Type'}</span>
                <window.Dropdown 
                  value={advancedFilters.msgType} 
                  onChange={val => setAdvancedFilters({...advancedFilters, msgType: val})} 
                  options={[
                    { value: "all", label: lang === 'es' ? 'Cualquiera' : 'Any' },
                    { value: "normal", label: lang === 'es' ? 'Normal' : 'Normal' },
                    { value: "question", label: lang === 'es' ? 'Pregunta' : 'Question' }
                  ]}
                />
              </div>
              {/* Position */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{lang === 'es' ? 'Posición' : 'Position'}</span>
                <window.Dropdown 
                  value={advancedFilters.position} 
                  onChange={val => setAdvancedFilters({...advancedFilters, position: val})} 
                  options={[
                    { value: "all", label: lang === 'es' ? 'Cualquiera' : 'Any' },
                    { value: "top", label: 'Top' },
                    { value: "center", label: 'Center' },
                    { value: "bottom", label: 'Bottom' }
                  ]}
                />
              </div>
              {/* Size */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{lang === 'es' ? 'Tamaño' : 'Size'}</span>
                <window.Dropdown 
                  value={advancedFilters.size} 
                  onChange={val => setAdvancedFilters({...advancedFilters, size: val})} 
                  options={[
                    { value: "all", label: lang === 'es' ? 'Cualquiera' : 'Any' },
                    { value: "small", label: 'Small' },
                    { value: "medium", label: 'Medium' },
                    { value: "large", label: 'Large' }
                  ]}
                />
              </div>
              {/* Animation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{lang === 'es' ? 'Animación' : 'Animation'}</span>
                <window.Dropdown 
                  value={advancedFilters.animation} 
                  onChange={val => setAdvancedFilters({...advancedFilters, animation: val})} 
                  options={[
                    { value: "all", label: lang === 'es' ? 'Cualquiera' : 'Any' },
                    { value: "none", label: 'None' },
                    { value: "pulse", label: 'Pulse' },
                    { value: "shake", label: 'Shake' },
                    { value: "float", label: 'Float' }
                  ]}
                />
              </div>
              {/* Particles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{lang === 'es' ? 'Partículas' : 'Particles'}</span>
                <window.Dropdown 
                  value={advancedFilters.particles} 
                  onChange={val => setAdvancedFilters({...advancedFilters, particles: val})} 
                  options={[
                    { value: "all", label: lang === 'es' ? 'Cualquiera' : 'Any' },
                    { value: "none", label: 'None' },
                    { value: "stars", label: 'Stars' },
                    { value: "teeth", label: 'Teeth' },
                    { value: "confetti", label: 'Confetti' },
                    { value: "fire", label: 'Fire' }
                  ]}
                />
              </div>
              {/* Level Req */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{lang === 'es' ? 'Nivel Requerido' : 'Level Required'}</span>
                <input 
                  type="number"
                  placeholder={lang === 'es' ? 'Cualquiera...' : 'Any...'}
                  value={advancedFilters.levelReq}
                  onChange={e => setAdvancedFilters({...advancedFilters, levelReq: e.target.value})}
                  className="app-input"
                  style={{ height: 40 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input 
                type="checkbox" 
                checked={applyAdvancedFiltersToGame}
                onChange={e => setApplyAdvancedFiltersToGame(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
                id="applyFiltersToGameCheck"
              />
              <label htmlFor="applyFiltersToGameCheck" style={{ fontSize: 14, fontWeight: 700, color: '#1a3a5a', cursor: 'pointer' }}>
                {lang === 'es' ? 'Aplicar estos filtros al juego en vivo' : 'Apply these filters to the game'}
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setAdvancedFilters({ msgType: 'all', position: 'all', size: 'all', animation: 'all', particles: 'all', color: 'all', levelReq: '' })}
                className="app-btn"
                style={{ ...btn, height: 40, background: '#fee2e2', color: '#ef4444', fontSize: 14 }}
              >
                {lang === 'es' ? 'Limpiar Filtros' : 'Clear Filters'}
              </button>
              <button 
                onClick={() => setShowAdvancedFiltersModal(false)}
                className="app-btn"
                style={{ ...btn, height: 40, background: '#1a8fff', color: '#fff', fontSize: 14, minWidth: 120 }}
              >
                {lang === 'es' ? 'Aplicar' : 'Apply'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pendingImportJSON && (
        <Modal onClose={() => setPendingImportJSON(null)} maxWidth={400} persistent={false}>
          <div style={{ padding: '4px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>📥</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#1a3a5a' }}>
              {lang === 'es' ? 'Confirmar Importación' : 'Confirm Import'}
            </h3>
            <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 20 }}>
              {lang === 'es' 
                ? `¿Estás seguro de que deseas importar y guardar ${pendingImportJSON.length} mensajes masivamente?` 
                : `Are you sure you want to import and save ${pendingImportJSON.length} messages in bulk?`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button 
                onClick={() => setPendingImportJSON(null)}
                style={{ ...btn, flex: 1, height: 40, background: '#f1f5f9', color: '#64748b', fontSize: 14 }}
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  const updatedMessages = [...customMessages, ...pendingImportJSON];
                  setCustomMessages(updatedMessages);
                  saveMessagesToCloud(updatedMessages);
                  setSuccessNote(lang === 'es' ? `¡${pendingImportJSON.length} mensajes importados!` : `${pendingImportJSON.length} messages imported!`);
                  setTimeout(() => setSuccessNote(''), 3000);
                  setPendingImportJSON(null);
                }}
                style={{ ...btn, flex: 1, height: 40, background: '#1a8fff', color: '#fff', fontSize: 14 }}
              >
                {lang === 'es' ? 'Importar JSON' : 'Import JSON'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit Message Modal */}
      {(showCreateModal || editingMsg) && (
        <Modal onClose={() => { setShowCreateModal(false); setEditingMsg(null); setCreateMode(null); }} maxWidth={550} persistent={true}>
          <div style={{ padding: '4px 8px', overflowY: 'auto', overflowX: 'hidden', flex: 1, boxSizing: 'border-box' }}>
            {showCreateModal && createMode === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', color: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-bullhorn"></i>
                  </div>
                  {lang === 'es' ? 'Crear nuevo mensaje' : 'Create new message'}
                </div>
                
                <div style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.5, textAlign: 'left' }}>
                  {lang === 'es' 
                    ? 'Elige cómo deseas crear tu nuevo mensaje personalizado:' 
                    : 'Choose how you want to create your new custom message:'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div 
                    onClick={() => setCreateMode('manual')}
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: 16,
                      padding: 20,
                      cursor: 'pointer',
                      background: '#fff',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      textAlign: 'center'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a8fff'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      <i className="fa-solid fa-pen-to-square"></i>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                      {lang === 'es' ? 'Mensaje manual' : 'Manual Message'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                      {lang === 'es' 
                        ? 'Configura cada detalle de tu mensaje: emisor, texto, tiempos y estilos personalizados.' 
                        : 'Configure every detail of your message: sender, text, timing, and custom styles.'}
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setCreateMode('random');
                      handleRandomizeEverything();
                    }}
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: 16,
                      padding: 20,
                      cursor: 'pointer',
                      background: '#fff',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      textAlign: 'center'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7e22ce'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#faf5ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      <i className="fa-solid fa-shuffle"></i>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                      {lang === 'es' ? 'Mensaje aleatorio' : 'Random Message'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                      {lang === 'es' 
                        ? 'Genera un mensaje con emisor, texto y estilos divertidos totalmente al azar con un clic.' 
                        : 'Generate a message with a random sender, text, and fun styles completely at random in one click.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => setShowCreateModal(false)} className="app-btn" style={{ ...btn, height: 40, padding: '0 20px', background: '#f1f5f9', color: '#64748b' }}>
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', color: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-bullhorn"></i>
                  </div>
                  {editingMsg 
                    ? (lang === 'es' ? 'Editar mensaje' : 'Edit message') 
                    : (createMode === 'random' 
                       ? (lang === 'es' ? 'Crear mensaje completamente aleatorio' : 'Create Random Message') 
                       : (lang === 'es' ? 'Crear nuevo mensaje' : 'Create new message'))}
                </div>

                {/* If createMode is random, render a large, styled banner button at the top */}
                {!editingMsg && createMode === 'random' && (
                  <div style={{ marginBottom: 16, background: '#faf5ff', border: '1px dashed #d8b4fe', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        <i className="fa-solid fa-dice"></i>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#581c87' }}>
                          {lang === 'es' ? 'Modo Completamente Aleatorio' : 'Fully Random Mode'}
                        </div>
                        <div style={{ fontSize: 11, color: '#7e22ce' }}>
                          {lang === 'es' ? 'Genera emisor, texto y estilos al azar.' : 'Shuffling sender, text, timing and visual style.'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRandomizeEverything}
                      className="app-btn"
                      style={{
                        ...btn,
                        height: 36,
                        padding: '0 16px',
                        background: '#7e22ce',
                        color: '#fff',
                        boxShadow: '0 4px 10px rgba(126,34,206,0.2)',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <i className="fa-solid fa-shuffle"></i>
                      {lang === 'es' ? 'Generar todo aleatorio' : 'Randomize Everything'}
                    </button>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* Avatar Box */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 11, color: '#718096', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avatar</div>
                  <div 
                    onClick={() => {
                      if (!avatarLoading) {
                        fileInputRef.current && fileInputRef.current.click();
                      }
                    }}
                    onMouseEnter={() => setAvatarHover(true)}
                    onMouseLeave={() => setAvatarHover(false)}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      border: '2px dashed #cbd5e1',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: avatarLoading ? 'not-allowed' : 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    className="hover-border-primary"
                  >
                    {avatarLoading ? (
                      <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#1a8fff', fontSize: 18 }}></i>
                    ) : (() => {
                      const currentAvatarUrl = getAvatarUrl(
                        editingMsg ? editingMsg.who : newMsgName,
                        editingMsg ? editingMsg.image : newMsgImage,
                        editingMsg ? editingMsg.id : undefined
                      );
                      return (
                        <>
                          {currentAvatarUrl ? (
                            <img src={currentAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <i className="fa-solid fa-user-plus" style={{ color: '#94a3b8', fontSize: 20 }}></i>
                          )}
                          {avatarHover && (
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0, 0, 0, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              zIndex: 2,
                              transition: 'opacity 0.2s'
                            }}>
                              <i className="fa-solid fa-pen" style={{ fontSize: 14 }}></i>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  
                  {(() => {
                    const hasCustomImage = editingMsg ? !!editingMsg.image : !!newMsgImage;
                    if (hasCustomImage) {
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editingMsg) {
                              setEditingMsg({ ...editingMsg, image: null });
                            } else {
                              setNewMsgImage(null);
                            }
                          }}
                          style={{
                            all: 'unset',
                            fontSize: 10,
                            color: '#e53e3e',
                            cursor: 'pointer',
                            fontWeight: 600,
                            textDecoration: 'underline'
                          }}
                        >
                          {lang === 'es' ? 'Eliminar' : 'Remove'}
                        </button>
                      );
                    }
                    return null;
                  })()}
                  
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept=".png,.jpg,.jpeg,.gif"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Nombre del Emisor' : 'Sender Name'}</div>
                  <input 
                    type="text" 
                    className="app-input"
                    placeholder={lang === 'es' ? 'ej. Cris' : 'e.g. Cris'}
                    value={editingMsg ? editingMsg.who : newMsgName}
                    onChange={e => editingMsg ? setEditingMsg({...editingMsg, who: e.target.value}) : setNewMsgName(e.target.value)}
                  />
                </div>
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

              {/* Message Type Selector: Normal vs Pregunta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: '#718096', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Tipo de Mensaje' : 'Message Type'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[{ value: 'normal', label: lang === 'es' ? 'Normal' : 'Normal', desc: lang === 'es' ? 'Mensaje de texto estándar' : 'Standard text message' }, { value: 'question', label: lang === 'es' ? 'Pregunta' : 'Question', desc: lang === 'es' ? 'V/F con premio o penalización' : 'T/F with reward or penalty' }].map(opt => {
                    const isActive = (editingMsg ? (editingMsg.msgType || 'normal') : newMsgType) === opt.value;
                    return (
                      <div key={opt.value} onClick={() => {
                        if (editingMsg) setEditingMsg({ ...editingMsg, msgType: opt.value });
                        else setNewMsgType(opt.value);
                      }} style={{ 
                        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                        background: isActive ? '#eff6ff' : '#f8fafc', 
                        padding: '12px 16px', borderRadius: 12, 
                        border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        transition: 'all 200ms ease'
                      }}>
                        <div style={{ 
                          width: 18, height: 18, borderRadius: '50%', border: isActive ? '5px solid #3b82f6' : '2px solid #cbd5e1',
                          background: '#fff', flexShrink: 0
                        }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#1e3a8a' : '#475569' }}>{opt.label}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>{opt.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question Config — only visible when type is 'question' */}
              {((editingMsg ? (editingMsg.msgType || 'normal') : newMsgType) === 'question') && (
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <i className="fa-solid fa-circle-question" style={{ color: '#7c3aed', fontSize: 16 }}></i>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#581c87' }}>{lang === 'es' ? 'Configurar Pregunta' : 'Question Config'}</span>
                  </div>

                  {/* Options config */}
                  {(() => {
                    const options = editingMsg ? (editingMsg.options || ['Verdadero', 'Falso']) : newMsgOptions;
                    const correctIdx = editingMsg ? (editingMsg.correctOptionIndex || 0) : newMsgCorrectOptionIndex;
                    const setOpts = (opts) => editingMsg ? setEditingMsg({...editingMsg, options: opts}) : setNewMsgOptions(opts);
                    const setCorrect = (idx) => editingMsg ? setEditingMsg({...editingMsg, correctOptionIndex: idx}) : setNewMsgCorrectOptionIndex(idx);
                    
                    return (
                      <div>
                        <div style={{ fontSize: 11, color: '#6b21a8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{lang === 'es' ? 'Alternativas de Respuesta' : 'Answer Options'}</span>
                          {options.length < 5 && (
                            <button type="button" onClick={() => setOpts([...options, 'Nueva Opción'])} style={{ all: 'unset', color: '#1a8fff', cursor: 'pointer', textTransform: 'none' }}>+ {lang === 'es' ? 'Añadir' : 'Add'}</button>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {options.map((opt, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button 
                                type="button" 
                                onClick={() => setCorrect(idx)}
                                style={{ all: 'unset', cursor: 'pointer', width: 24, height: 24, borderRadius: '50%', border: correctIdx === idx ? '6px solid #16a34a' : '2px solid #cbd5e1', background: '#fff', boxSizing: 'border-box', flexShrink: 0 }}
                              />
                              <input 
                                type="text" 
                                className="app-input" 
                                value={opt} 
                                onChange={e => {
                                  const newOpts = [...options];
                                  newOpts[idx] = e.target.value;
                                  setOpts(newOpts);
                                }}
                                style={{ height: 38, borderColor: correctIdx === idx ? '#16a34a' : undefined }}
                              />
                              {options.length > 2 && (
                                <button type="button" onClick={() => {
                                  const newOpts = options.filter((_, i) => i !== idx);
                                  setOpts(newOpts);
                                  if (correctIdx === idx) setCorrect(0);
                                  else if (correctIdx > idx) setCorrect(correctIdx - 1);
                                }} style={{ all: 'unset', color: '#e53e3e', cursor: 'pointer', padding: 4 }}>
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Explanation Text */}
                  <div>
                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      {lang === 'es' ? 'Explicación (al fallar)' : 'Explanation (if wrong)'}
                    </div>
                    <textarea 
                      className="app-input app-textarea"
                      placeholder={lang === 'es' ? 'Escribe la respuesta correcta para que el jugador aprenda...' : 'Write the correct answer so the player learns...'}
                      value={editingMsg ? (editingMsg.explanationText || '') : newMsgExplanationText}
                      onChange={e => editingMsg ? setEditingMsg({...editingMsg, explanationText: e.target.value}) : setNewMsgExplanationText(e.target.value)}
                      style={{ minHeight: 60 }}
                    />
                  </div>

                  {/* Reward if correct */}
                  {(() => {
                    const reward = editingMsg ? editingMsg.correctReward : newMsgCorrectReward;
                    const setReward = (r) => editingMsg ? setEditingMsg({ ...editingMsg, correctReward: r }) : setNewMsgCorrectReward(r);
                    return (
                      <div>
                        <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          <i className="fa-solid fa-check-circle" style={{ marginRight: 4 }}></i>{lang === 'es' ? 'Si acierta' : 'If correct'}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <window.Dropdown style={{ flex: 2, height: 38 }} value={reward.type} onChange={val => setReward({ ...reward, type: val })}
                            options={[
                              { value: 'addTeeth', label: lang === 'es' ? '🦷 Dar dientes' : '🦷 Give teeth' },
                              { value: 'removeTeeth', label: lang === 'es' ? '💀 Quitar dientes' : '💀 Remove teeth' },
                              { value: 'randomBonus', label: lang === 'es' ? '🎲 Bonus aleatorio' : '🎲 Random bonus' },
                              { value: 'none', label: lang === 'es' ? '— Sin efecto' : '— No effect' }
                            ]}
                          />
                          {reward.type !== 'randomBonus' && reward.type !== 'none' && (
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input type="text" className="app-input" style={{ width: '100%', height: 38, paddingRight: 80 }} value={reward.amount != null ? reward.amount.toLocaleString('es-CL') : ''} onChange={e => setReward({ ...reward, amount: parseInt(e.target.value.replace(/\D/g, ''), 10) || 0 })} />
                              {reward.amount > 0 && <span style={{ position: 'absolute', right: 10, top: 11, fontSize: 11, color: '#94a3b8', pointerEvents: 'none', fontWeight: 600 }}>({window.formatNum(reward.amount)})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Penalty if wrong */}
                  {(() => {
                    const reward = editingMsg ? editingMsg.wrongReward : newMsgWrongReward;
                    const setReward = (r) => editingMsg ? setEditingMsg({ ...editingMsg, wrongReward: r }) : setNewMsgWrongReward(r);
                    return (
                      <div>
                        <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          <i className="fa-solid fa-times-circle" style={{ marginRight: 4 }}></i>{lang === 'es' ? 'Si falla' : 'If wrong'}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <window.Dropdown style={{ flex: 2, height: 38 }} value={reward.type} onChange={val => setReward({ ...reward, type: val })}
                            options={[
                              { value: 'removeTeeth', label: lang === 'es' ? '💀 Quitar dientes' : '💀 Remove teeth' },
                              { value: 'addTeeth', label: lang === 'es' ? '🦷 Dar dientes' : '🦷 Give teeth' },
                              { value: 'randomBonus', label: lang === 'es' ? '🎲 Bonus aleatorio' : '🎲 Random bonus' },
                              { value: 'none', label: lang === 'es' ? '— Sin efecto' : '— No effect' }
                            ]}
                          />
                          {reward.type !== 'randomBonus' && reward.type !== 'none' && (
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input type="text" className="app-input" style={{ width: '100%', height: 38, paddingRight: 80 }} value={reward.amount != null ? reward.amount.toLocaleString('es-CL') : ''} onChange={e => setReward({ ...reward, amount: parseInt(e.target.value.replace(/\D/g, ''), 10) || 0 })} />
                              {reward.amount > 0 && <span style={{ position: 'absolute', right: 10, top: 11, fontSize: 11, color: '#94a3b8', pointerEvents: 'none', fontWeight: 600 }}>({window.formatNum(reward.amount)})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Controls: Mensaje Aleatorio & Tiempo de juego Radio Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '4px 0' }}>
                {/* Mensaje Aleatorio Radio Card */}
                <div 
                  onClick={() => {
                    if (editingMsg) setEditingMsg({ ...editingMsg, isRandom: true });
                    else setNewMsgIsRandom(true);
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    background: (editingMsg ? editingMsg.isRandom : newMsgIsRandom) ? '#eff6ff' : '#f8fafc', 
                    padding: '12px 16px', borderRadius: 12, 
                    border: (editingMsg ? editingMsg.isRandom : newMsgIsRandom) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    transition: 'all 200ms ease'
                  }}>
                  <div style={{ 
                    width: 18, height: 18, borderRadius: '50%', border: (editingMsg ? editingMsg.isRandom : newMsgIsRandom) ? '5px solid #3b82f6' : '2px solid #cbd5e1',
                    background: '#fff', flexShrink: 0
                  }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: (editingMsg ? editingMsg.isRandom : newMsgIsRandom) ? '#1e3a8a' : '#475569' }}>
                      {lang === 'es' ? 'Mensaje Aleatorio' : 'Random Message'}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      {lang === 'es' ? 'Intervalo 5-10 min' : '5-10 min interval'}
                    </div>
                  </div>
                </div>

                {/* Tiempo de juego Radio Card */}
                <div 
                  onClick={() => {
                    if (editingMsg) setEditingMsg({ ...editingMsg, isRandom: false });
                    else setNewMsgIsRandom(false);
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    background: (editingMsg ? !editingMsg.isRandom : !newMsgIsRandom) ? '#eff6ff' : '#f8fafc', 
                    padding: '12px 16px', borderRadius: 12, 
                    border: (editingMsg ? !editingMsg.isRandom : !newMsgIsRandom) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    transition: 'all 200ms ease'
                  }}>
                  <div style={{ 
                    width: 18, height: 18, borderRadius: '50%', border: (editingMsg ? !editingMsg.isRandom : !newMsgIsRandom) ? '5px solid #3b82f6' : '2px solid #cbd5e1',
                    background: '#fff', flexShrink: 0
                  }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: (editingMsg ? !editingMsg.isRandom : !newMsgIsRandom) ? '#1e3a8a' : '#475569' }}>
                      {lang === 'es' ? 'Tiempo de juego' : 'Playtime'}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      {lang === 'es' ? 'Tiempo fijo' : 'Fixed playtime'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Playtime settings, Level Requirement & Name Color */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Nivel Mínimo Requerido' : 'Min Level Required'}</div>
                  <input 
                    type="number" 
                    min="0"
                    className="app-input"
                    placeholder="0"
                    value={editingMsg ? (editingMsg.levelReq || 0) : newMsgLevelReq}
                    onChange={e => editingMsg ? setEditingMsg({...editingMsg, levelReq: parseInt(e.target.value) || 0}) : setNewMsgLevelReq(parseInt(e.target.value) || 0)}
                  />
                </div>

                {(() => {
                  const isRand = editingMsg ? editingMsg.isRandom : newMsgIsRandom;
                  return (
                    <div style={{ opacity: isRand ? 0.45 : 1, pointerEvents: isRand ? 'none' : 'auto', transition: 'all 200ms ease', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 11, color: '#718096', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {lang === 'es' ? 'Tiempo de Juego' : 'Playtime Milestone'}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          type="number" 
                          min={1}
                          disabled={isRand}
                          className="app-input"
                          style={{ flex: 1, height: 42 }}
                          value={editingMsg ? editingMsg.playtimeVal : newMsgPlaytimeVal}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 1;
                            if (editingMsg) {
                              setEditingMsg({...editingMsg, playtimeVal: val});
                            } else {
                              setNewMsgPlaytimeVal(val);
                            }
                          }}
                        />
                        <window.Dropdown 
                          disabled={isRand}
                          style={{ width: 100, height: 42 }}
                          value={editingMsg ? editingMsg.playtimeUnit : newMsgPlaytimeUnit}
                          onChange={val => {
                            if (editingMsg) {
                              setEditingMsg({...editingMsg, playtimeUnit: val});
                            } else {
                              setNewMsgPlaytimeUnit(val);
                            }
                          }}
                          options={[
                            { value: "minutes", label: lang === 'es' ? 'Min' : 'Min' },
                            { value: "hours", label: lang === 'es' ? 'Hrs' : 'Hrs' }
                          ]}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {lang === 'es' ? 'Color del Nombre' : 'Name Color'}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={editingMsg ? editingMsg.color : newMsgColor} 
                      onChange={e => editingMsg ? setEditingMsg({...editingMsg, color: e.target.value}) : setNewMsgColor(e.target.value)} 
                      style={{ width: 36, height: 36, border: '2px solid #e2e8f0', borderRadius: '50%', cursor: 'pointer', background: '#fff', overflow: 'hidden', padding: 0 }} 
                    />
                    <div style={{ fontSize: 13, color: '#1a3a5a', fontWeight: 700, fontFamily: 'monospace', background: '#f1f5f9', padding: '6px 10px', borderRadius: 10 }}>
                      {editingMsg ? editingMsg.color : newMsgColor}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Posición y Tamaño' : 'Pos & Size'}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <window.Dropdown style={{ flex: 1 }} value={editingMsg ? editingMsg.position : newMsgPos} onChange={val => editingMsg ? setEditingMsg({...editingMsg, position: val}) : setNewMsgPos(val)}
                      options={[
                        { value: 'top', label: 'Top' },
                        { value: 'center', label: 'Center' },
                        { value: 'bottom', label: 'Bottom' }
                      ]}
                    />
                    <window.Dropdown style={{ flex: 1 }} value={editingMsg ? editingMsg.size : newMsgSize} onChange={val => editingMsg ? setEditingMsg({...editingMsg, size: val}) : setNewMsgSize(val)}
                      options={[
                        { value: 'small', label: 'S' },
                        { value: 'medium', label: 'M' },
                        { value: 'large', label: 'L' }
                      ]}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'es' ? 'Efecto y Partículas' : 'Effect & Particles'}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <window.Dropdown style={{ flex: 1 }} value={editingMsg ? editingMsg.animation : newMsgAnim} onChange={val => editingMsg ? setEditingMsg({...editingMsg, animation: val}) : setNewMsgAnim(val)}
                      options={[
                        { value: 'none', label: '-' },
                        { value: 'pulse', label: 'Pulse 💓' },
                        { value: 'shake', label: 'Shake 🫨' },
                        { value: 'float', label: 'Float ☁️' },
                        { value: 'rainbow', label: 'Rainbow 🌈' }
                      ]}
                    />
                    <window.Dropdown style={{ flex: 1 }} value={editingMsg ? editingMsg.particles : newMsgParticles} onChange={val => editingMsg ? setEditingMsg({...editingMsg, particles: val}) : setNewMsgParticles(val)}
                      options={[
                        { value: 'none', label: '-' },
                        { value: 'stars', label: 'Stars ✨' },
                        { value: 'teeth', label: 'Teeth 🦷' },
                        { value: 'fire', label: 'Fire 🔥' },
                        { value: 'confetti', label: 'Confetti 🎉' }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Randomize Parameters Button */}
              {(editingMsg || createMode !== 'random') && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const positions = ['top', 'center', 'bottom'];
                      const sizes = ['small', 'medium', 'large'];
                      const animations = ['pulse', 'shake', 'float', 'rainbow'];
                      const particlesOptions = ['stars', 'teeth', 'fire', 'confetti'];
                      
                      const randPos = positions[Math.floor(Math.random() * positions.length)];
                      const randSize = sizes[Math.floor(Math.random() * sizes.length)];
                      const randAnim = animations[Math.floor(Math.random() * animations.length)];
                      const randPart = particlesOptions[Math.floor(Math.random() * particlesOptions.length)];
                      
                      // Generate vibrant color (HSL vibrant conversion)
                      const h = Math.floor(Math.random() * 360);
                      const s = Math.floor(Math.random() * 25) + 75; // 75-100%
                      const l = Math.floor(Math.random() * 20) + 45; // 45-65%
                      const sPct = s / 100;
                      const lPct = l / 100;
                      const c = (1 - Math.abs(2 * lPct - 1)) * sPct;
                      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                      const m = lPct - c / 2;
                      let r = 0, g = 0, b = 0;
                      if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
                      else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
                      else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
                      else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
                      else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
                      else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
                      const toHex = (val) => {
                        const hex = Math.round((val + m) * 255).toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                      };
                      const randColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

                      if (editingMsg) {
                        setEditingMsg({
                          ...editingMsg,
                          position: randPos,
                          size: randSize,
                          animation: randAnim,
                          particles: randPart,
                          color: randColor
                        });
                      } else {
                        setNewMsgPos(randPos);
                        setNewMsgSize(randSize);
                        setNewMsgAnim(randAnim);
                        setNewMsgParticles(randPart);
                        setNewMsgColor(randColor);
                      }
                    }}
                    className="app-btn"
                    style={{
                      ...btn,
                      height: 36,
                      padding: '0 14px',
                      background: '#f8fafc',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      fontWeight: 700,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <i className="fa-solid fa-dice" style={{ color: '#1a8fff', fontSize: 15 }}></i>
                    {lang === 'es' ? 'Parámetros aleatorios' : 'Randomize Style'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={() => { setShowCreateModal(false); setEditingMsg(null); }} className="app-btn" style={{ ...btn, flex: 1, height: 46, background: '#f1f5f9', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    if (editingMsg) {
                      if (!editingMsg.text) return;
                      // Fallback name if left empty:
                      let who = editingMsg.who ? editingMsg.who.trim() : '';
                      if (!who) {
                        const names = window.EMPLOYEE_NAMES || ['Dani'];
                        who = names[Math.floor(Math.random() * names.length)];
                      }
                      
                      const milestone = editingMsg.isRandom 
                        ? -1 
                        : (editingMsg.playtimeUnit === 'hours' ? editingMsg.playtimeVal * 60 : editingMsg.playtimeVal);

                      const updatedMsg = {
                        ...editingMsg,
                        who,
                        milestone
                      };
                      // Delete temporary properties we added for the form
                      delete updatedMsg.isRandom;
                      delete updatedMsg.playtimeVal;
                      delete updatedMsg.playtimeUnit;

                      const updated = customMessages.map(m => m.id === editingMsg.id ? updatedMsg : m);
                      setCustomMessages(updated);
                      saveMessagesToCloud(updated);
                      setEditingMsg(null);
                      setSuccessNote(lang === 'es' ? '¡Mensaje actualizado!' : 'Message updated!');
                      setTimeout(() => setSuccessNote(''), 3000);
                    } else {
                      if (!newMsgText) return;
                      // Fallback name if left empty:
                      let who = newMsgName ? newMsgName.trim() : '';
                      if (!who) {
                        const names = window.EMPLOYEE_NAMES || ['Dani'];
                        who = names[Math.floor(Math.random() * names.length)];
                      }

                      const milestone = newMsgIsRandom 
                        ? -1 
                        : (newMsgPlaytimeUnit === 'hours' ? newMsgPlaytimeVal * 60 : newMsgPlaytimeVal);

                      const newMsg = {
                        id: Math.random().toString(36).substr(2, 9),
                        who,
                        text: newMsgText,
                        milestone,
                        color: newMsgColor,
                        position: newMsgPos,
                        size: newMsgSize,
                        animation: newMsgAnim,
                        particles: newMsgParticles,
                        image: newMsgImage,
                        createdAt: Date.now()
                      };
                      if (newMsgType === 'question') {
                        newMsg.msgType = 'question';
                        newMsg.options = newMsgOptions;
                        newMsg.correctOptionIndex = newMsgCorrectOptionIndex;
                        newMsg.explanationText = newMsgExplanationText;
                        newMsg.correctReward = newMsgCorrectReward;
                        newMsg.wrongReward = newMsgWrongReward;
                      }
                      newMsg.levelReq = newMsgLevelReq;
                      const updated = [...customMessages, newMsg];
                      setCustomMessages(updated);
                      saveMessagesToCloud(updated);
                      setNewMsgName('');
                      setNewMsgText('');
                      setNewMsgImage(null);
                      setNewMsgType('normal');
                      setNewMsgOptions(['Verdadero', 'Falso']);
                      setNewMsgCorrectOptionIndex(0);
                      setNewMsgExplanationText('');
                      setNewMsgLevelReq(0);
                      setNewMsgCorrectReward({ type: 'addTeeth', amount: 1000 });
                      setNewMsgWrongReward({ type: 'removeTeeth', amount: 500 });
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
            </>
          )}
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
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5a', marginBottom: 6 }}>
                {deleteTarget.name === ADMIN_NAME 
                  ? (lang === 'es' ? `Eliminar progreso de "${deleteTarget.name}"` : `Delete progress for "${deleteTarget.name}"`)
                  : (lang === 'es' ? `Eliminar "${deleteTarget.name}"` : `Delete "${deleteTarget.name}"`)}
              </div>
              <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.6 }}>
                {deleteTarget.name === ADMIN_NAME 
                  ? (lang === 'es' ? 'Se borrará todo su progreso permanentemente (la cuenta de administrador se mantendrá).' : 'All progress will be permanently deleted (admin account will remain).')
                  : (lang === 'es' ? 'Se borrarán todos sus datos y progreso del juego permanentemente.' : 'All data and game progress will be permanently deleted.')}
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
        <>
          <div 
            onClick={() => setPreviewMsg(null)} 
            style={{ position: 'fixed', inset: 0, zIndex: 1499, cursor: 'pointer' }} 
          />
          <BossMarquee 
            msg={previewMsg} 
            lang={lang} 
            danger={false} 
            onDismiss={() => setPreviewMsg(null)} 
            onAnswer={() => setPreviewMsg(null)} 
          />
        </>
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
