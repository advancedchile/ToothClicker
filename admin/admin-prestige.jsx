const { useState } = React;

window.AdminPrestige = function({ lang }) {
  const [config, setConfig] = useState({ ...(window.GAME_CONTENT.prestigeConfig || {}) });
  const [stages, setStages] = useState([...(window.GAME_CONTENT.toothStages || [])]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editLang, setEditLang] = useState('es');
  
  const [formData, setFormData] = useState({
    reqPrestiges: 0,
    reqLevel: 0,
    reqGenId: '',
    reqGenQty: 0,
    reqAcademyUpgrades: [],
    label: { es: '', en: '' },
    iconUrl: '',
    glbData: ''
  });

  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    window.GAME_CONTENT.prestigeConfig = newConfig;
  };

  const saveStages = (newStages) => {
    setStages(newStages);
    window.GAME_CONTENT.toothStages = newStages;
    window.TOOTH_STAGES = newStages;
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    const item = stages[index];
    setFormData({
      reqPrestiges: item.reqPrestiges || item.prestige || 0,
      reqLevel: item.reqLevel || 0,
      reqGenId: item.reqGenId || '',
      reqGenQty: item.reqGenQty || 0,
      reqAcademyUpgrades: item.reqAcademyUpgrades || [],
      label: { es: item.label?.es || item.es || (typeof item.label === 'string' ? item.label : '') || '', en: item.label?.en || item.en || (typeof item.label === 'string' ? item.label : '') || '' },
      iconUrl: item.iconUrl || item.img || '',
      glbData: item.glbData || ''
    });
  };

  const handleAdd = () => {
    setEditingIndex('new');
    setFormData({
      reqPrestiges: 0,
      reqLevel: 0,
      reqGenId: '',
      reqGenQty: 0,
      reqAcademyUpgrades: [],
      label: { es: '', en: '' },
      iconUrl: '',
      glbData: ''
    });
  };

  const handleDelete = (index) => {
    setDeleteTarget(index);
  };

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      const newItems = [...stages];
      newItems.splice(deleteTarget, 1);
      saveStages(newItems);
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
      setSelectedItems(new Set(stages.map((_, i) => i)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const confirmBulkDelete = () => {
    const newItems = stages.filter((_, i) => !selectedItems.has(i));
    saveStages(newItems);
    setSelectedItems(new Set());
    setShowBulkDeleteModal(false);
    setEditingIndex(null);
  };

  const handleSaveForm = () => {
    const newItem = {
      ...(editingIndex !== 'new' ? stages[editingIndex] : {}),
      prestige: Number(formData.reqPrestiges),
      reqLevel: Number(formData.reqLevel),
      es: formData.label.es,
      en: formData.label.en,
      img: formData.iconUrl || 'uploads/tooth1.png'
    };
    if (formData.glbData) {
      newItem.glbData = formData.glbData;
    } else {
      delete newItem.glbData;
    }

    if (formData.reqGenId && Number(formData.reqGenQty) > 0) {
      newItem.reqGenId = formData.reqGenId;
      newItem.reqGenQty = Number(formData.reqGenQty);
    } else {
      delete newItem.reqGenId;
      delete newItem.reqGenQty;
    }

    if (formData.reqAcademyUpgrades && formData.reqAcademyUpgrades.length > 0) {
      newItem.reqAcademyUpgrades = formData.reqAcademyUpgrades;
    } else {
      delete newItem.reqAcademyUpgrades;
    }

    delete newItem.reqPrestiges;
    delete newItem.label;
    delete newItem.iconUrl;

    const newItems = [...stages];
    if (editingIndex === 'new') {
      newItems.push(newItem);
    } else {
      newItems[editingIndex] = newItem;
    }
    
    saveStages(newItems.sort((a,b) => a.prestige - b.prestige));
    setEditingIndex(null);
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Global Config */}
      <div style={{ background: 'var(--bg-2)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Configuración Global de Prestigio</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Dientes Base Requeridos</label>
            <window.AdminNumberInput className="app-input" value={config.baseReq || 100000000000000} onChange={e => saveConfig({...config, baseReq: Number(e.target.value)})} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Escalado (x)</label>
            <window.AdminNumberInput step="0.1" className="app-input" value={config.scaling || 1.5} onChange={e => saveConfig({...config, scaling: Number(e.target.value)})} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Bonus por Sonrisa (%)</label>
            <window.AdminNumberInput step="0.01" className="app-input" value={Math.round((config.bonusPerSmile || 0.05) * 100)} onChange={e => saveConfig({...config, bonusPerSmile: Number(e.target.value)/100})} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Stages List */}
        <div style={{ flex: 1, background: 'var(--bg-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input 
                type="checkbox" 
                checked={stages.length > 0 && selectedItems.size === stages.length}
                onChange={handleSelectAll}
                style={{ cursor: 'pointer', width: 16, height: 16 }}
              />
              <h2 style={{ margin: 0, fontSize: 18 }}>Modelos de Diente ({stages.length})</h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedItems.size > 0 && (
                <button className="app-btn" onClick={() => setShowBulkDeleteModal(true)} style={{ background: 'var(--warning-i10)', color: 'var(--warning-i100)' }}>
                  <i className="fa-solid fa-trash"></i> Eliminar ({selectedItems.size})
                </button>
              )}
              <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff' }}>
                <i className="fa-solid fa-plus"></i> Nuevo
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stages.map((item, i) => (
              <div key={i} className={`admin-list-row ${editingIndex === i ? 'editing' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input 
                    type="checkbox" 
                    checked={selectedItems.has(i)}
                    onChange={() => handleToggleSelect(i)}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  {item.iconUrl || item.img ? <img src={item.iconUrl || item.img} style={{ width: 48, height: 48, objectFit: 'contain' }} /> : <div style={{ width: 48, height: 48, background: 'var(--bg-3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-image" style={{ color: 'var(--fg-3)' }}></i></div>}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.label?.es || item.es || (typeof item.label === 'string' ? item.label : '(Sin nombre)')}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Requisito: Prestigios: {item.reqPrestiges || item.prestige} | Nivel: {item.reqLevel || 0}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="app-btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => handleEdit(i)}>Editar</button>
                  <button className="app-btn" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--warning-i100)' }} onClick={() => handleDelete(i)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingIndex !== null && (
          <window.AdminEditorSidebar 
            title={editingIndex === 'new' ? 'Nuevo Modelo' : 'Editar Modelo'}
            onClose={() => setEditingIndex(null)}
          >

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <window.AdminImageUpload 
                currentImage={formData.iconUrl} 
                onImageChange={(url) => setFormData({...formData, iconUrl: url})} 
                size={72} style={{ marginBottom: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nombre</label>
                  <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
                    <button type="button" onClick={() => setEditLang('es')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: editLang === 'es' ? 'var(--primary-i100)' : 'transparent', color: editLang === 'es' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>ES</button>
                    <button type="button" onClick={() => setEditLang('en')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: editLang === 'en' ? 'var(--primary-i100)' : 'transparent', color: editLang === 'en' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>EN</button>
                  </div>
                </div>
                <input type="text" className="app-input" value={formData.label[editLang] || ''} onChange={e => setFormData({...formData, label: {...formData.label, [editLang]: e.target.value}})} style={{ width: '100%' }} />
              </div>
            </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Modelo 3D (.glb, opcional)</label>
                <window.AdminGlbUpload 
                  currentGlb={formData.glbData} 
                  onGlbChange={(data) => setFormData({...formData, glbData: data})} 
                  onSnapshot={(dataUrl) => setFormData(prev => ({...prev, iconUrl: dataUrl}))}
                  height={240}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Prestigios Requeridos</label>
                <window.AdminNumberInput className="app-input" value={formData.reqPrestiges} onChange={e => setFormData({...formData, reqPrestiges: e.target.value})} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nivel de Jugador Requerido</label>
                <window.AdminNumberInput className="app-input" value={formData.reqLevel} onChange={e => setFormData({...formData, reqLevel: e.target.value})} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Requisito de Generador (Opcional)</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1 }}>
                    <window.Dropdown 
                      value={formData.reqGenId} 
                      onChange={val => setFormData({...formData, reqGenId: val})}
                      style={{ width: '100%' }}
                      options={[
                        { value: "", label: "Ninguno" },
                        ...(window.GENERATORS || []).map(g => ({ value: g.id, label: g.label?.es || g.es || g.name?.es || (typeof g.name === 'string' ? g.name : '(Sin nombre)') }))
                      ]}
                    />
                  </div>
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <input 
                      type="number"
                      className="app-input" 
                      value={formData.reqGenQty === 0 ? '' : formData.reqGenQty} 
                      onChange={e => setFormData({...formData, reqGenQty: Number(e.target.value) || 0})} 
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Mejoras de Academia Requeridas (Opcional)</label>
                {(() => {
                  const academyUpgrades = window.GAME_CONTENT?.xpUpgrades || window.XP_UPGRADES || [];
                  if (academyUpgrades.length === 0) {
                    return <div style={{ fontSize: 12, color: 'var(--fg-4)', padding: '16px', textAlign: 'center', background: 'var(--bg-1)', borderRadius: 6, border: '1px dashed var(--border)', marginTop: 6 }}>Aún no has creado ninguna mejora de la academia.</div>;
                  }
                  
                  const unselectedUpgrades = academyUpgrades.filter(up => !formData.reqAcademyUpgrades.includes(up.id));
                  
                  return (
                    <div style={{ marginTop: 4 }}>
                      <window.Dropdown 
                        value="" 
                        searchable={true}
                        onChange={val => {
                          if (val) {
                            setFormData({...formData, reqAcademyUpgrades: [...formData.reqAcademyUpgrades, val]});
                          }
                        }}
                        style={{ width: '100%' }}
                        options={[
                          { value: "", label: "Seleccionar mejora..." },
                          ...unselectedUpgrades.map(up => ({ value: up.id, label: up.name?.es || up.es || up.id }))
                        ]}
                      />
                      
                      {formData.reqAcademyUpgrades.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {formData.reqAcademyUpgrades.map(id => {
                            const up = academyUpgrades.find(u => u.id === id);
                            const label = up ? (up.name?.es || up.es || up.id) : id;
                            return (
                              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary-i100)', padding: '6px 12px', borderRadius: 16, fontSize: 12, color: '#fff', border: 'none', fontWeight: '500' }}>
                                <span>{label}</span>
                                <i 
                                  className="fa-solid fa-xmark" 
                                  style={{ cursor: 'pointer', color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}
                                  onMouseEnter={(e) => e.target.style.color = '#fff'}
                                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                                  onClick={() => {
                                    setFormData({...formData, reqAcademyUpgrades: formData.reqAcademyUpgrades.filter(uid => uid !== id)});
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <button className="app-btn" onClick={handleSaveForm} style={{ width: '100%', background: 'var(--primary-i100)', color: '#fff', marginTop: 8 }}>
                Guardar
              </button>
            </div>
          </window.AdminEditorSidebar>
        )}
      </div>
      {/* Individual Delete Modal */}
      {deleteTarget !== null && (
        <window.Modal onClose={() => setDeleteTarget(null)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: 'var(--warning-i100)', marginBottom: 16 }}><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar Diente?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este modelo de diente?</p>
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
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar {selectedItems.size} Diente(s)?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción eliminará todos los modelos de diente seleccionados y no se puede deshacer.</p>
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
