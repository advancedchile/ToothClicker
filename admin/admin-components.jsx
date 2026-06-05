const { useState, useRef } = React;

window.AdminEditorSidebar = function({ children, onClose, title }) {
  const [width, setWidth] = React.useState(() => {
    const saved = localStorage.getItem('adminEditorWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  
  const isDragging = useRef(false);

  const startResize = (e) => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    let newWidth = window.innerWidth - e.clientX;
    if (newWidth < 250) newWidth = 250;
    if (newWidth > 500) newWidth = 500;
    setWidth(newWidth);
  };

  const stopResize = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = '';
  };
  
  const [stickyTop, setStickyTop] = useState(24);

  React.useEffect(() => {
    const banner = document.getElementById('template-banner');
    if (banner) {
      setStickyTop(banner.offsetHeight + 24);
    }
  }, []);
  
  React.useEffect(() => {
    localStorage.setItem('adminEditorWidth', width);
  }, [width]);

  return (
    <div style={{ width, background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexShrink: 0, position: 'sticky', top: stickyTop, alignSelf: 'flex-start' }}>
      <div 
        onMouseDown={startResize}
        style={{ width: 16, cursor: 'col-resize', position: 'absolute', left: -8, top: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ width: 4, height: 40, background: 'var(--border)', borderRadius: 2 }} />
      </div>
      <div style={{ flex: 1, padding: 20, minWidth: 0 }}>
        <style>{`
          .admin-sidebar-close {
            background: transparent;
            border: 1px solid transparent;
            border-radius: 6px;
            color: var(--fg-3);
            cursor: pointer;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .admin-sidebar-close:hover {
            border: 1px solid var(--border);
            background: var(--bg-1);
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            color: var(--fg-1);
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="admin-sidebar-close" onClick={onClose}><i className="fa-solid fa-times"></i></button>
        </div>
        {children}
      </div>
    </div>
  );
};

window.AdminImageUpload = function({ currentImage, onImageChange, maxSizeKb = 500, size = 64, width, height, style = {} }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const processFile = (file) => {
    if (!file) return;

    if (file.size > maxSizeKb * 1024) {
      setError(`La imagen excede el límite de ${maxSizeKb}KB`);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG, WEBP, GIF o SVG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      onImageChange(ev.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const finalWidth = width !== undefined ? width : size;
  const finalHeight = height !== undefined ? height : size;
  const active = isDragging || isHovered;

  return (
    <div>
      <div 
        style={{ 
          width: finalWidth, height: finalHeight, 
          border: `2px dashed ${active ? 'var(--primary-i100)' : 'var(--border)'}`, 
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', 
          background: active ? 'var(--bg-4)' : 'var(--bg-3)', 
          boxShadow: active ? '0 4px 16px rgba(80,140,220,0.15)' : 'none',
          marginBottom: 8, transition: 'all 0.2s', padding: 4, boxSizing: 'border-box',
          ...style
        }}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {currentImage ? (
          <img src={currentImage} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Upload preview" />
        ) : (
          <i className="fa-solid fa-cloud-arrow-up" style={{ color: isDragging ? 'var(--primary-i100)' : 'var(--fg-3)', fontSize: 24 }}></i>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style={{ display: 'none' }} />
      {error && <div style={{ color: 'var(--warning-i100)', fontSize: 12 }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <input 
          type="text" 
          placeholder="O ingresa la ruta / URL..."
          value={currentImage && !currentImage.startsWith('data:') ? currentImage : ''}
          onChange={(e) => onImageChange(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--fg-1)', fontSize: 12, boxSizing: 'border-box' }}
        />
      </div>
    </div>
  );

};

window.AdminGlbUpload = function({ currentGlb, onGlbChange, onSnapshot, maxSizeKb = 2000, width = '100%', height = 64 }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const processFile = (file) => {
    if (!file) return;

    if (file.size > maxSizeKb * 1024) {
      setError(`El archivo excede el límite de ${maxSizeKb}KB`);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.glb')) {
      setError('Formato no válido. Usa solo .glb');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      onGlbChange(ev.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const active = isDragging || isHovered;

  return (
    <div>
      <div 
        style={{ 
          width, height, 
          border: `2px dashed ${active ? 'var(--primary-i100)' : 'var(--border)'}`, 
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', 
          background: active ? 'var(--bg-4)' : 'var(--bg-3)', 
          boxShadow: active ? '0 4px 16px rgba(80,140,220,0.15)' : 'none',
          marginBottom: 8, transition: 'all 0.2s', padding: 12, boxSizing: 'border-box'
        }}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {currentGlb ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <window.Tooth3DViewer 
              glbData={currentGlb} 
              style={{ width: '100%', height: '100%' }} 
              animateFloat={false}
              onModelLoaded={onSnapshot}
              modelScale={3.2}
            />
            <button 
              className="app-btn" 
              onClick={(e) => { e.stopPropagation(); onGlbChange(''); if (onSnapshot) onSnapshot(''); }} 
              style={{ position: 'absolute', top: 4, right: 4, padding: '4px 8px', background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--warning-i100)', zIndex: 10 }}
              title="Quitar modelo 3D"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ) : (
          <div style={{ color: isDragging ? 'var(--primary-i100)' : 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-upload"></i> Subir GLB (Max {maxSizeKb}KB)
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".glb" style={{ display: 'none' }} />
      {error && <div style={{ color: 'var(--warning-i100)', fontSize: 12 }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <input 
          type="text" 
          placeholder="O ingresa la ruta / URL..."
          value={currentGlb && !currentGlb.startsWith('data:') ? currentGlb : ''}
          onChange={(e) => onGlbChange(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--fg-1)', fontSize: 12, boxSizing: 'border-box' }}
        />
      </div>
    </div>
  );
};

window.AdminNumberInput = function({ value, onChange, onBlur, className, style, step }) {
  const [displayValue, setDisplayValue] = React.useState('');

  React.useEffect(() => {
    if (value === undefined || value === null || value === '') {
      setDisplayValue('');
      return;
    }
    
    const parsedDisplay = displayValue.replace(/\./g, '').replace(',', '.');
    if (Number(parsedDisplay) !== Number(value) || parsedDisplay === '') {
      const str = value.toString();
      const parts = str.split('.');
      let intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      let decPart = parts.length > 1 ? ',' + parts[1] : '';
      setDisplayValue(intPart + decPart);
    }
  }, [value]);

  const handleChange = (e) => {
    let val = e.target.value;
    val = val.replace(/[^\d.,]/g, '');
    
    let cleanStr = val.replace(/\./g, '');
    let parts = cleanStr.split(',');
    let intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    let decPart = parts.length > 1 ? ',' + parts[1] : '';
    
    setDisplayValue(intPart + decPart);
    
    let clean = val.replace(/\./g, '').replace(',', '.');
    if (clean === '' || clean.endsWith('.')) {
      onChange({ target: { value: clean } }); 
    } else {
      onChange({ target: { value: Number(clean) } });
    }
  };

  const handleBlur = (e) => {
    if (displayValue !== '') {
      let clean = displayValue.replace(/\./g, '').replace(',', '.');
      const num = Number(clean);
      if (!isNaN(num)) {
        const parts = num.toString().split('.');
        let intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let decPart = parts.length > 1 ? ',' + parts[1] : '';
        setDisplayValue(intPart + decPart);
        onChange({ target: { value: num } });
      }
    }
    if (onBlur) onBlur(e);
  };

  const parsedNum = displayValue !== '' ? Number(displayValue.replace(/\./g, '').replace(',', '.')) : NaN;
  const hasPreview = displayValue !== '' && !isNaN(parsedNum);

  return (
    <div style={{ position: 'relative', ...style }}>
      <style>{`
        .admin-num-padded {
          padding-right: 80px !important;
        }
      `}</style>
      <input 
        type="text" 
        className={`${className || ''} ${hasPreview ? 'admin-num-padded' : ''}`}
        style={{ width: '100%', boxSizing: 'border-box' }}
        value={displayValue} 
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={step ? "0,0" : "0"}
      />
      {displayValue !== '' && !isNaN(parsedNum) && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', fontSize: 12, pointerEvents: 'none', fontWeight: 'bold' }}>
          ({window.formatNum ? window.formatNum(parsedNum) : parsedNum})
        </div>
      )}
    </div>
  );
};

window.AdminRichTextEditor = function({ value, onChange, placeholder, style, className }) {
  const editorRef = React.useRef(null);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const handleLink = () => {
    const url = prompt('Ingresa la URL del enlace:');
    if (url) exec('createLink', url);
  };

  const btnStyle = {
    background: 'transparent',
    border: 'none',
    color: '#4a5568',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  };

  const wrapperStyle = {
    boxSizing: 'border-box',
    width: '100%',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: 14,
    fontSize: 14,
    border: '2px solid #e2e8f0',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'var(--font-sans)',
    color: '#1a3a5a',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
    ...style
  };

  const toolbarStyle = {
    display: 'flex',
    gap: 6,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottom: '2px solid #e2e8f0',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const divider = <div style={{ width: 2, height: 16, background: '#e2e8f0', margin: '0 2px', borderRadius: 1 }} />;

  return (
    <>
      <style>{`
        .rich-text-wrapper:focus-within {
          background: #fff !important;
          border-color: #1a8fff !important;
          box-shadow: 0 0 0 4px rgba(26,143,255,0.15), 0 4px 12px rgba(26,143,255,0.1) !important;
          transform: translateY(-1px) !important;
        }
      `}</style>
      <div className={`rich-text-wrapper ${className || ''}`} style={wrapperStyle}>
        <div style={toolbarStyle}>
          <button type="button" onClick={() => exec('bold')} style={btnStyle} title="Negrita">
            <i className="fa-solid fa-bold"></i>
          </button>
          <button type="button" onClick={() => exec('underline')} style={btnStyle} title="Subrayado">
            <i className="fa-solid fa-underline"></i>
          </button>
          {divider}
          <button type="button" onClick={() => exec('insertUnorderedList')} style={btnStyle} title="Lista con viñetas">
            <i className="fa-solid fa-list-ul"></i>
          </button>
          <button type="button" onClick={() => exec('insertOrderedList')} style={btnStyle} title="Lista numerada">
            <i className="fa-solid fa-list-ol"></i>
          </button>
          {divider}
          <button type="button" onClick={handleLink} style={btnStyle} title="Enlace">
            <i className="fa-solid fa-link"></i>
          </button>
          {divider}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }} title="Color de Texto">
            <i className="fa-solid fa-font" style={{ fontSize: 11, color: '#4a5568' }}></i>
            <input type="color" onChange={(e) => exec('foreColor', e.target.value)} style={{ width: 16, height: 16, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }} title="Color de Fondo">
            <i className="fa-solid fa-fill" style={{ fontSize: 11, color: '#4a5568' }}></i>
            <input type="color" onChange={(e) => exec('hiliteColor', e.target.value)} style={{ width: 16, height: 16, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} />
          </div>
          {divider}
          <select 
            onChange={(e) => { exec('fontSize', e.target.value); e.target.value = ''; }} 
            style={{ 
              background: '#fff', 
              color: '#4a5568', 
              border: '1px solid #cbd5e1', 
              borderRadius: 6, 
              padding: '2px 8px', 
              fontSize: 12, 
              outline: 'none', 
              cursor: 'pointer',
              marginLeft: 'auto',
              height: 26,
              fontFamily: 'inherit'
            }}
          >
            <option value="" disabled selected>Tamaño...</option>
            <option value="1">Muy Pequeño</option>
            <option value="2">Pequeño</option>
            <option value="3">Normal</option>
            <option value="4">Mediano</option>
            <option value="5">Grande</option>
            <option value="6">Muy Grande</option>
          </select>
        </div>
          <div 
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            style={{ 
              minHeight: 120, 
              outline: 'none', 
              lineHeight: 1.6, 
              cursor: 'text'
            }}
            data-placeholder={placeholder}
          />
        </div>
      </>
    );
  };

  window.AdminExportNamesModal = function({ items, lang, onClose, setToast }) {
    const getNames = () => {
      return items.map(item => {
        let nameToUse = '';
        if (item.name && typeof item.name === 'object') {
          nameToUse = lang === 'es' ? (item.name.es || item.name.en || '') : (item.name.en || item.name.es || '');
        } else if (typeof item.name === 'string' && item.name.trim() !== '') {
          nameToUse = item.name;
        } else {
          nameToUse = lang === 'es' ? (item.es || item.en || '') : (item.en || item.es || '');
        }
        return nameToUse;
      }).filter(n => n && n.trim() !== '');
    };

    const handleCopy = (namesToCopy, label) => {
      const text = namesToCopy.join(', ');
      const createToast = (msgEs, msgEn) => ({
        id: '__admin_toast',
        title: lang === 'es' ? 'Exportación' : 'Export',
        icon: 'fa-solid fa-copy',
        accent: 'var(--bg-3)',
        accentText: 'var(--fg-1)',
        es: msgEs,
        en: msgEn
      });

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setToast(createToast('Nombres copiados al portapapeles', 'Names copied to clipboard'));
          setTimeout(() => setToast(null), 3000);
        }).catch(err => {
          setToast(createToast(`Error al copiar: ${err}`, `Copy error: ${err}`));
          setTimeout(() => setToast(null), 3000);
        });
      } else {
        setToast(createToast('El portapapeles no está disponible', 'Clipboard unavailable'));
        setTimeout(() => setToast(null), 3000);
      }
    };

    const allNames = getNames();
    const batchSize = 40;
    const batches = [];
    for (let i = 0; i < allNames.length; i += batchSize) {
      batches.push(allNames.slice(i, i + batchSize));
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
        <div style={{ background: 'var(--bg-1)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
          <h2 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 }}>
            <i className="fa-solid fa-copy"></i> {lang === 'es' ? 'Exportar Nombres' : 'Export Names'}
          </h2>
          <p style={{ margin: '0 0 20px 0', color: 'var(--fg-3)', fontSize: 14 }}>
            {lang === 'es' 
              ? `Hay ${allNames.length} elementos en total. Selecciona una opción para copiar al portapapeles.`
              : `There are ${allNames.length} total items. Select an option to copy to clipboard.`}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              className="app-btn" 
              style={{ width: '100%', background: 'var(--primary-i100)', color: '#fff', justifyContent: 'center', padding: '12px' }}
              onClick={() => handleCopy(allNames, lang === 'es' ? 'Todos los nombres' : 'All names')}
            >
              {lang === 'es' ? 'Copiar todos los nombres' : 'Copy all names'}
            </button>
            
            {batches.length > 1 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-4)', textTransform: 'uppercase' }}>
                  {lang === 'es' ? 'Copiar por lotes' : 'Copy in batches'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {batches.map((batch, index) => {
                    const start = index * batchSize + 1;
                    const end = start + batch.length - 1;
                    const label = `${start} - ${end}`;
                    return (
                      <button 
                        key={index}
                        className="app-btn" 
                        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', justifyContent: 'center' }}
                        onClick={() => handleCopy(batch, `Lote ${label}`)}
                      >
                        {lang === 'es' ? 'Copiar' : 'Copy'} {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="app-btn" onClick={onClose} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              {lang === 'es' ? 'Cerrar' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  };
