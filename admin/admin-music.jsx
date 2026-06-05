const { useState } = React;

window.AdminMusic = function({ lang, setToast }) {
  const [items, setItems] = useState(() => Array.isArray(window.GAME_CONTENT?.music) ? [...window.GAME_CONTENT.music] : []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    src: '',
    cover: '',
    reqLevel: 0,
    reqPrestige: 0
  });

  const saveToGlobal = (newItems) => {
    setItems(newItems);
    if (window.GAME_CONTENT) window.GAME_CONTENT.music = newItems;
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    const item = items[index];
    setFormData({
      id: item.id || `track_${Date.now()}`,
      title: item.title || '',
      src: item.src || '',
      cover: item.cover || '',
      reqLevel: item.reqLevel || 0,
      reqPrestige: item.reqPrestige || 0
    });
  };

  const handleAdd = () => {
    setEditingIndex('new');
    setFormData({
      id: `track_${Math.random().toString(36).substring(2, 9)}`,
      title: '',
      src: '',
      cover: '',
      reqLevel: 0,
      reqPrestige: 0
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
    let extractedTitle = formData.title;
    if (formData.src) {
      const parts = formData.src.split('/');
      const filename = parts[parts.length - 1];
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
      extractedTitle = nameWithoutExt.replace(/_/g, ' ');
    }

    const newItem = {
      ...(editingIndex !== 'new' ? items[editingIndex] : {}),
      id: formData.id,
      title: extractedTitle,
      src: formData.src,
      cover: formData.cover,
      reqLevel: Number(formData.reqLevel) || 0,
      reqPrestige: Number(formData.reqPrestige) || 0
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
            <h2 style={{ margin: 0, fontSize: 18 }}>Música ({items.length})</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedItems.size > 0 && (
              <button className="app-btn" onClick={() => setShowBulkDeleteModal(true)} style={{ background: 'var(--warning-i10)', color: 'var(--warning-i100)' }}>
                <i className="fa-solid fa-trash"></i> Eliminar ({selectedItems.size})
              </button>
            )}
            <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff' }}>
              <i className="fa-solid fa-plus"></i> Nueva Canción
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-1)', borderRadius: 8, border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 40, color: 'var(--fg-4)', marginBottom: 16 }}><i className="fa-solid fa-music"></i></div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--fg-1)' }}>Sin canciones</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--fg-3)', fontSize: 14 }}>Aún no has agregado ninguna canción.</p>
              <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff', padding: '8px 16px' }}>
                <i className="fa-solid fa-plus"></i> Añadir primera canción
              </button>
            </div>
          ) : items.map((item, i) => (
            <div 
              key={i} 
              className={`admin-list-row ${editingIndex === i ? 'editing' : ''}`} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
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
                {item.cover ? (
                  <img src={item.cover} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%' }} />
                ) : <div style={{ width: 32, height: 32, background: 'var(--bg-3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-music" style={{ color: 'var(--fg-3)' }}></i></div>}
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.title || '(Sin título)'}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                    Desbloqueo: {item.reqLevel ? `Nivel ${item.reqLevel}` : ''} {item.reqPrestige ? `Prestigio ${item.reqPrestige}` : ''} {!item.reqLevel && !item.reqPrestige ? 'Desde el inicio' : ''}
                  </div>
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

      {/* Editor */}
      {editingIndex !== null && (
        <window.AdminEditorSidebar 
          title={editingIndex === 'new' ? 'Nueva Canción' : 'Editar Canción'}
          onClose={() => setEditingIndex(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Ruta del archivo (.mp3) o URL</label>
              <input type="text" className="app-input" value={formData.src} onChange={e => setFormData({...formData, src: e.target.value})} style={{ width: '100%', marginBottom: 8 }} placeholder="/assets/music/song.mp3" />
              {formData.src && (
                <audio controls src={formData.src} style={{ width: '100%', height: 32, marginTop: 4 }}></audio>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <label style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--fg-1)', marginBottom: 8, display: 'block' }}>Condiciones de Desbloqueo</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nivel Requerido</label>
                  <window.AdminNumberInput className="app-input" value={formData.reqLevel} onChange={e => setFormData({...formData, reqLevel: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Prestigios Requeridos</label>
                  <window.AdminNumberInput className="app-input" value={formData.reqPrestige} onChange={e => setFormData({...formData, reqPrestige: e.target.value})} style={{ width: '100%' }} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>Si dejas ambos en 0, la canción estará disponible desde el inicio.</p>
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
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar Canción?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta canción?</p>
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
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar {selectedItems.size} Canciones?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción eliminará todas las canciones seleccionadas y no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="app-btn" onClick={() => setShowBulkDeleteModal(false)} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={confirmBulkDelete} style={{ flex: 1, padding: '10px 16px', background: 'var(--warning-i100)', color: '#fff' }}>Eliminar Todas</button>
            </div>
          </div>
        </window.Modal>
      )}
    </div>
  );
};
