window.AdminHelpIcon = function({ title, text }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <i 
        className="fa-solid fa-circle-question" 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        style={{ cursor: 'pointer', opacity: 0.7, marginLeft: 8, fontSize: '0.9em' }}
        title="Ayuda"
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
      ></i>
      {isOpen && ReactDOM.createPortal(
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(5,9,13,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 150ms ease' }}>
          <div className="game-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-1)', padding: '24px', borderRadius: 'var(--radius-m)', boxShadow: 'var(--elevation-30)', width: '450px', maxWidth: '92%', animation: 'modalIn 200ms ease', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 20, color: 'var(--fg-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-info" style={{ color: 'var(--primary-i100)' }}></i> {title}
              </h2>
              <p style={{ margin: '0 0 24px 0', color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {text}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="app-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }} style={{ background: 'var(--primary-i100)', color: '#fff', padding: '8px 16px' }}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
