const { useState } = React;

window.AdminRandomBonuses = function({ lang, setToast }) {
  const [items, setItems] = useState(() => Array.isArray(window.GAME_CONTENT?.randomBonuses) ? [...window.GAME_CONTENT.randomBonuses] : []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  const [editLang, setEditLang] = useState('es');
  
  const [formData, setFormData] = useState({
    id: '',
    name: { es: '', en: '' },
    image: '',
    intervalMin: 5,
    intervalMax: 10,
    speed: 'normal',
    type: 'hold',
    holdTime: 3,
    cps: 10,
    multiplier: 2,
    instantRewardType: 'coins',
    duration: 15,
    glbData: ''
  });

  const saveToGlobal = (newItems) => {
    setItems(newItems);
    if (window.GAME_CONTENT) window.GAME_CONTENT.randomBonuses = newItems;
  };

  const handleCopyName = (nameObj) => {
    const nameStr = nameObj?.es || nameObj?.en || (typeof nameObj === 'string' ? nameObj : '');
    if (!nameStr) return;
    navigator.clipboard.writeText(nameStr);
    if (setToast) {
      setToast({ id: 'copy_name_' + Date.now(), es: 'Nombre copiado al portapapeles', en: 'Name copied to clipboard' });
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    const item = items[index];
    setFormData({
      id: item.id || `bonus_${Date.now()}`,
      name: { 
        es: item.name?.es || (typeof item.name === 'string' ? item.name : '') || item.es || '', 
        en: item.name?.en || (typeof item.name === 'string' ? item.name : '') || item.en || '' 
      },
      image: item.image || '',
      intervalMin: item.intervalMin || 5,
      intervalMax: item.intervalMax || 10,
      speed: item.speed || 'normal',
      type: item.type || 'hold',
      holdTime: item.holdTime || 3,
      cps: item.cps || 10,
      multiplier: item.multiplier || 2,
      instantRewardType: item.instantRewardType || 'coins',
      duration: item.duration || 15,
      glbData: item.glbData || ''
    });
  };

  const handleAdd = () => {
    setEditingIndex('new');
    setFormData({
      id: `bonus_${Math.random().toString(36).substring(2, 9)}`,
      name: { es: '', en: '' },
      image: '',
      intervalMin: 5,
      intervalMax: 10,
      speed: 'normal',
      type: 'hold',
      holdTime: 3,
      cps: 10,
      multiplier: 2,
      instantRewardType: 'coins',
      duration: 15,
      glbData: ''
    });
  };

  const handleDelete = (index) => {
    setDeleteTarget(index);
  };

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      const newItems = [...items];
      newItems.splice(deleteTarget, 1);
      saveToGlobal(newItems);
      if (editingIndex === deleteTarget) setEditingIndex(null);
      setDeleteTarget(null);
      
      const newSelected = new Set();
      selectedItems.forEach(i => {
        if (i < deleteTarget) newSelected.add(i);
        else if (i > deleteTarget) newSelected.add(i - 1);
      });
      setSelectedItems(newSelected);
    }
  };

  const handleToggleSelect = (index) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedItems(newSet);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(items.map((_, i) => i)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const confirmBulkDelete = () => {
    const newItems = items.filter((_, i) => !selectedItems.has(i));
    saveToGlobal(newItems);
    setSelectedItems(new Set());
    setShowBulkDeleteModal(false);
    setEditingIndex(null);
  };

  const handleSaveForm = () => {
    const newItem = {
      ...(editingIndex !== 'new' ? items[editingIndex] : {}),
      id: formData.id,
      name: formData.name,
      image: formData.image,
      intervalMin: Number(formData.intervalMin),
      intervalMax: Number(formData.intervalMax),
      speed: formData.speed,
      type: formData.type,
      holdTime: Number(formData.holdTime) || 0,
      cps: Number(formData.cps) || 10,
      multiplier: Number(formData.multiplier) || 2,
      instantRewardType: formData.instantRewardType || 'coins',
      duration: Number(formData.duration) || 0
    };

    if (formData.glbData) {
      newItem.glbData = formData.glbData;
    } else {
      delete newItem.glbData;
    }

    const newItems = [...items];
    if (editingIndex === 'new') {
      newItems.push(newItem);
    } else {
      newItems[editingIndex] = newItem;
    }
    
    saveToGlobal(newItems);
    setEditingIndex(null);
  };

  return (
    <div style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* List */}
      <div style={{ flex: 1, background: 'var(--bg-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="checkbox" 
              checked={items.length > 0 && selectedItems.size === items.length}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer', width: 16, height: 16 }}
            />
            <h2 style={{ margin: 0, fontSize: 18 }}>{lang === 'es' ? 'Bonus Aleatorios' : 'Random Bonuses'} ({items.length})</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedItems.size > 0 && (
              <button className="app-btn" onClick={() => setShowBulkDeleteModal(true)} style={{ background: 'var(--warning-i10)', color: 'var(--warning-i100)' }}>
                <i className="fa-solid fa-trash"></i> {lang === 'es' ? 'Eliminar' : 'Delete'} ({selectedItems.size})
              </button>
            )}
            <button className="app-btn" onClick={() => setShowExportModal(true)} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-copy"></i> {lang === 'es' ? 'Exportar' : 'Export'}
            </button>
            <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff' }}>
              <i className="fa-solid fa-plus"></i> {lang === 'es' ? 'Nuevo' : 'New'}
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-1)', borderRadius: 8, border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 40, color: 'var(--fg-4)', marginBottom: 16 }}><i className="fa-solid fa-gift"></i></div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--fg-1)' }}>{lang === 'es' ? 'Sin bonus' : 'No bonuses'}</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--fg-3)', fontSize: 14 }}>{lang === 'es' ? 'Aún no has creado ningún bonus.' : 'You have not created any bonus yet.'}</p>
              <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff', padding: '8px 16px' }}>
                <i className="fa-solid fa-plus"></i> {lang === 'es' ? 'Crear primer bonus' : 'Create first bonus'}
              </button>
            </div>
          ) : items.map((item, i) => (
            <div 
              key={i} 
              className={`admin-list-row ${editingIndex === i ? 'editing' : ''}`} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => handleCopyName(item.name || item)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input 
                  type="checkbox" 
                  checked={selectedItems.has(i)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleToggleSelect(i)}
                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                />
                <div style={{ fontWeight: 'bold', color: 'var(--fg-3)', minWidth: 24 }}>{i + 1}.</div>
                {item.image ? (
                  <img src={item.image} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                ) : <div style={{ width: 32, height: 32, background: 'var(--bg-3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-image" style={{ color: 'var(--fg-3)' }}></i></div>}
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.name?.es || (typeof item.name === 'string' ? item.name : '(Sin nombre)')}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                    Tipo: {item.type} | Aparece c/ {item.intervalMin}-{item.intervalMax} min
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="app-btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); handleEdit(i); }}>{lang === 'es' ? 'Editar' : 'Edit'}</button>
                <button className="app-btn" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--warning-i100)' }} onClick={(e) => { e.stopPropagation(); handleDelete(i); }}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
        {showExportModal && <window.AdminExportNamesModal items={items} lang={lang} onClose={() => setShowExportModal(false)} setToast={setToast} />}
      </div>

      {/* Editor */}
      {editingIndex !== null && (
        <window.AdminEditorSidebar 
          title={editingIndex === 'new' ? (lang === 'es' ? 'Nuevo Bonus' : 'New Bonus') : (lang === 'es' ? 'Editar Bonus' : 'Edit Bonus')}
          onClose={() => setEditingIndex(null)}
        >

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <window.AdminImageUpload 
                currentImage={formData.image} 
                onImageChange={(url) => setFormData({...formData, image: url})} 
                size={72}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nombre</label>
                  <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
                    <button type="button" onClick={() => setEditLang('es')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: editLang === 'es' ? 'var(--primary-i100)' : 'transparent', color: editLang === 'es' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>ES</button>
                    <button type="button" onClick={() => setEditLang('en')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: editLang === 'en' ? 'var(--primary-i100)' : 'transparent', color: editLang === 'en' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>EN</button>
                  </div>
                </div>
                <input type="text" className="app-input" value={formData.name[editLang] || ''} onChange={e => setFormData({...formData, name: {...formData.name, [editLang]: e.target.value}})} style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Modelo 3D (.glb, opcional)</label>
              <window.AdminGlbUpload 
                currentGlb={formData.glbData} 
                onGlbChange={(data) => setFormData({...formData, glbData: data})} 
                onSnapshot={(dataUrl) => setFormData(prev => ({...prev, image: dataUrl}))}
                height={240}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Intervalo Min (min)</label>
                <window.AdminNumberInput className="app-input" value={formData.intervalMin} onChange={e => setFormData({...formData, intervalMin: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Intervalo Max (min)</label>
                <window.AdminNumberInput className="app-input" value={formData.intervalMax} onChange={e => setFormData({...formData, intervalMax: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Tipo de Bonus</label>
              <window.Dropdown 
                value={formData.type} 
                onChange={val => setFormData({...formData, type: val})} 
                options={[
                  { value: 'hold', label: 'Mantener presionado (Hold)' },
                  { value: 'instant', label: 'Click instantáneo (Instant)' },
                  { value: 'multiplier_click', label: 'Multiplicador de click por X seg.' },
                  { value: 'multiplier_global', label: 'Multiplicador global por X seg.' },
                  { value: 'multiplier_generator', label: 'Multiplicador de generadores' }
                ]}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Velocidad</label>
                <window.Dropdown 
                  value={formData.speed} 
                  onChange={val => setFormData({...formData, speed: val})} 
                  options={[
                    { value: 'slow', label: 'Lento (Slow)' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'fast', label: 'Rápido (Fast)' }
                  ]}
                />
              </div>
              <div style={{ flex: 1 }}>
                {formData.type === 'instant' ? (
                  <>
                    <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Tiempo requerido para clickear (seg)</label>
                    <window.AdminNumberInput className="app-input" value={formData.holdTime} onChange={e => setFormData({...formData, holdTime: e.target.value})} style={{ width: '100%' }} />
                  </>
                ) : (
                  <>
                    <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Duración del bonus (seg)</label>
                    <window.AdminNumberInput className="app-input" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} style={{ width: '100%' }} />
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {formData.type !== 'instant' && (
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Tiempo requerido para clickear (seg)</label>
                  <window.AdminNumberInput className="app-input" value={formData.holdTime} onChange={e => setFormData({...formData, holdTime: e.target.value})} style={{ width: '100%' }} />
                </div>
              )}

              {formData.type === 'hold' && (
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Clicks por segundo (CPS)</label>
                  <window.AdminNumberInput className="app-input" value={formData.cps} onChange={e => setFormData({...formData, cps: e.target.value})} style={{ width: '100%' }} />
                </div>
              )}

              {(formData.type.startsWith('multiplier_') || formData.type === 'instant') && (
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>{formData.type === 'instant' ? 'Valor del premio' : 'Multiplicador (x)'}</label>
                  <window.AdminNumberInput className="app-input" value={formData.multiplier} onChange={e => setFormData({...formData, multiplier: e.target.value})} style={{ width: '100%' }} />
                </div>
              )}

              {formData.type === 'instant' && (
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Tipo de premio</label>
                  <window.Dropdown 
                    value={formData.instantRewardType || 'coins'} 
                    onChange={val => setFormData({...formData, instantRewardType: val})} 
                    options={[
                      { value: 'coins', label: 'Monedas (Dientes)' },
                      { value: 'percent', label: 'Porcentaje (%)' }
                    ]}
                  />
                </div>
              )}
            </div>

            <button className="app-btn" onClick={handleSaveForm} style={{ width: '100%', background: 'var(--primary-i100)', color: '#fff', marginTop: 8 }}>
              {lang === 'es' ? 'Guardar' : 'Save'}
            </button>
          </div>
        </window.AdminEditorSidebar>
      )}

      {/* Individual Delete Modal */}
      {deleteTarget !== null && (
        <window.Modal onClose={() => setDeleteTarget(null)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: 'var(--warning-i100)', marginBottom: 16 }}><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar Bonus?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este bonus?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="app-btn" onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={confirmDelete} style={{ flex: 1, padding: '10px 16px', background: 'var(--warning-i100)', color: '#fff' }}>Eliminar</button>
            </div>
          </div>
        </window.Modal>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <window.Modal onClose={() => setShowBulkDeleteModal(false)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: 'var(--warning-i100)', marginBottom: 16 }}><i className="fa-solid fa-trash-can"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar {selectedItems.size} Bonus?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción eliminará todos los bonus seleccionados y no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="app-btn" onClick={() => setShowBulkDeleteModal(false)} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={confirmBulkDelete} style={{ flex: 1, padding: '10px 16px', background: 'var(--warning-i100)', color: '#fff' }}>Eliminar Todos</button>
            </div>
          </div>
        </window.Modal>
      )}
    </div>
  );
};
