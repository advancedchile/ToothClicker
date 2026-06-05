const { useState } = React;

window.AdminGenerators = function({ lang, setToast }) {
  const [items, setItems] = useState([...window.GAME_CONTENT.generators]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editLang, setEditLang] = useState('es');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: { es: '', en: '' },
    description: { es: '', en: '' },
    baseCost: 10,
    baseProd: 1,
    unlockAt: 0,
    costScale: 115, // as percentage (e.g., 115 for 1.15x)
    iconUrl: '',
    icon: ''
  });

  const saveToGlobal = (newItems) => {
    setItems(newItems);
    if (window.GAME_CONTENT) window.GAME_CONTENT.generators = newItems;
    window.GENERATORS = newItems;
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };
  
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };
  
  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newItems = [...items];
    const item = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, item);
    saveToGlobal(newItems);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
      id: item.id || `gen_${Date.now()}`,
      name: { 
        es: item.name?.es || (typeof item.name === 'string' ? item.name : '') || item.es || '', 
        en: item.name?.en || (typeof item.name === 'string' ? item.name : '') || item.en || '' 
      },
      description: { 
        es: item.description?.es || (typeof item.description === 'string' ? item.description : '') || item.desc_es || '', 
        en: item.description?.en || (typeof item.description === 'string' ? item.description : '') || item.desc_en || '' 
      },
      baseCost: item.baseCost,
      baseProd: item.baseProd ?? item.baseProduction ?? 1,
      unlockAt: item.unlockAt || 0,
      costScale: Math.round((item.costScale || 1.15) * 100), // 1.15 -> 115
      iconUrl: item.iconUrl || (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:')) ? item.icon : '') || '',
      icon: item.icon && !item.icon.startsWith('http') && !item.icon.startsWith('data:') ? item.icon : ''
    });
  };

  const handleAdd = () => {
    setEditingIndex('new');
    setFormData({
      id: `gen_${Date.now()}`,
      name: { es: '', en: '' },
      description: { es: '', en: '' },
      baseCost: 10,
      baseProd: 1,
      unlockAt: 0,
      costScale: 115,
      iconUrl: '',
      icon: ''
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
    const scale = Number(formData.costScale) / 100;
    const newItem = {
      ...(editingIndex !== 'new' ? items[editingIndex] : {}),
      id: formData.id,
      name: formData.name,
      description: formData.description,
      es: formData.name.es,
      en: formData.name.en,
      desc_es: formData.description.es,
      desc_en: formData.description.en,
      baseCost: Number(formData.baseCost),
      baseProd: Number(formData.baseProd),
      baseProduction: Number(formData.baseProd),
      unlockAt: Number(formData.unlockAt) || 0,
      costScale: scale,
      iconUrl: formData.iconUrl,
      icon: formData.icon || 'fa-solid fa-image'
    };

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
            <h2 style={{ margin: 0, fontSize: 18 }}>Generadores ({items.length})</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedItems.size > 0 && (
              <button className="app-btn" onClick={() => setShowBulkDeleteModal(true)} style={{ background: 'var(--warning-i10)', color: 'var(--warning-i100)' }}>
                <i className="fa-solid fa-trash"></i> Eliminar ({selectedItems.size})
              </button>
            )}
            <button className="app-btn" onClick={() => setShowExportModal(true)} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-copy"></i> {lang === 'es' ? 'Exportar' : 'Export'}
            </button>
            <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff' }}>
              <i className="fa-solid fa-plus"></i> Nuevo
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-1)', borderRadius: 8, border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 40, color: 'var(--fg-4)', marginBottom: 16 }}><i className="fa-solid fa-industry"></i></div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--fg-1)' }}>Sin generadores</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--fg-3)', fontSize: 14 }}>Aún no has creado ningún generador.</p>
              <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff', padding: '8px 16px' }}>
                <i className="fa-solid fa-plus"></i> Crear primer generador
              </button>
            </div>
          ) : items.map((item, i) => (
            <div 
              key={i} 
              draggable={true}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`admin-list-row ${editingIndex === i ? 'editing' : ''}`} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, 
                background: dragOverIndex === i ? 'var(--primary-i10)' : 'var(--bg-1)', 
                borderRadius: 8, 
                border: dragOverIndex === i ? '2px dashed var(--primary-i100)' : '1px solid var(--border)', 
                cursor: 'grab',
                opacity: draggedIndex === i ? 0.5 : 1,
                userSelect: 'none'
              }}
              onClick={() => handleCopyName(item.name || item)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="fa-solid fa-grip-vertical" style={{ color: 'var(--fg-4)', cursor: 'grab', padding: '0 4px' }}></i>
                <input 
                  type="checkbox" 
                  checked={selectedItems.has(i)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleToggleSelect(i)}
                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                />
                <div style={{ fontWeight: 'bold', color: 'var(--fg-3)', minWidth: 24 }}>{i + 1}.</div>
                {item.iconUrl || item.icon ? (
                  item.iconUrl ? <img src={item.iconUrl} style={{ width: 32, height: 32, objectFit: 'contain' }} /> :
                  <i className={`fa-solid ${item.icon?.replace('fa-solid ', '')}`} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--fg-2)' }}></i>
                ) : <div style={{ width: 32, height: 32, background: 'var(--bg-3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-image" style={{ color: 'var(--fg-3)' }}></i></div>}
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.name?.es || item.es || (typeof item.name === 'string' ? item.name : '(Sin nombre)')}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Costo: {window.formatNum(item.baseCost)} | Prod: {window.formatNum(item.baseProd ?? item.baseProduction, null, null, true)}/s | Escala: {Math.round((item.costScale || 1.15)*100)}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="app-btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); handleEdit(i); }}>Editar</button>
                <button className="app-btn" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--warning-i100)' }} onClick={(e) => { e.stopPropagation(); handleDelete(i); }}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showExportModal && <window.AdminExportNamesModal items={items} lang={lang} onClose={() => setShowExportModal(false)} setToast={setToast} />}
      {/* Editor */}
      {editingIndex !== null && (
        <window.AdminEditorSidebar 
          title={editingIndex === 'new' ? 'Nuevo Generador' : 'Editar Generador'}
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
                <input type="text" className="app-input" value={formData.name[editLang] || ''} onChange={e => setFormData({...formData, name: {...formData.name, [editLang]: e.target.value}})} style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Descripción</label>
              <textarea className="app-input" value={formData.description[editLang] || ''} onChange={e => setFormData({...formData, description: {...formData.description, [editLang]: e.target.value}})} style={{ width: '100%', resize: 'vertical' }} />
            </div>


            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Costo Base</label>
                <window.AdminNumberInput className="app-input" value={formData.baseCost} onChange={e => setFormData({...formData, baseCost: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Producción (CPS)</label>
                <window.AdminNumberInput className="app-input" value={formData.baseProd} onChange={e => setFormData({...formData, baseProd: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Desbloqueo (Dientes)</label>
                <window.AdminNumberInput className="app-input" value={formData.unlockAt} onChange={e => setFormData({...formData, unlockAt: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="admin-form-row">
              <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Escala de costo %</label>
              <window.AdminNumberInput className="app-input" value={formData.costScale} onChange={e => setFormData({...formData, costScale: e.target.value})} style={{ width: '100%' }} />
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>El porcentaje multiplicador (ej. 115% para encarecer 1.15x, 250% para 2.5x)</div>
            </div>

            <button className="app-btn" onClick={handleSaveForm} style={{ width: '100%', background: 'var(--primary-i100)', color: '#fff', marginTop: 8 }}>
              Guardar
            </button>
          </div>
        </window.AdminEditorSidebar>
      )}

      {/* Individual Delete Modal */}
      {deleteTarget !== null && (
        <window.Modal onClose={() => setDeleteTarget(null)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: 'var(--warning-i100)', marginBottom: 16 }}><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar Generador?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este generador?</p>
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
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar {selectedItems.size} Generador(es)?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción eliminará todos los generadores seleccionados y no se puede deshacer.</p>
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
