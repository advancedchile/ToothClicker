const SmartTooltip = ({ tooltip, lang, fmt, state }) => {
  const ref = React.useRef();
  const [pos, setPos] = React.useState({ top: -9999, left: -9999, caretTop: 0, caretLeft: 0, opacity: 0, direction: 'up' });

  React.useEffect(() => {
    if (!tooltip || !ref.current) return;
    
    // microtask to allow DOM to render and get accurate dimensions
    const timer = setTimeout(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const targetX = tooltip.pos.x;
        const targetY = tooltip.pos.y;
        const targetTop = tooltip.pos.top !== undefined ? tooltip.pos.top : targetY;
        const targetBottom = tooltip.pos.bottom !== undefined ? tooltip.pos.bottom : targetY;
        const targetLeft = tooltip.pos.left !== undefined ? tooltip.pos.left : targetX;
        const targetRight = tooltip.pos.right !== undefined ? tooltip.pos.right : targetX;
        
        const PADDING = 12; 
        
        let direction = tooltip.direction || 'up';

        // Auto reposition if no space
        if (direction === 'up' && targetTop - height - PADDING < 10) direction = 'down';
        if (direction === 'down' && targetBottom + height + PADDING > window.innerHeight - 10) {
          direction = targetX > window.innerWidth / 2 ? 'left' : 'right';
        }
        if (direction === 'left' && targetLeft - width - PADDING < 10) direction = 'right';
        if (direction === 'right' && targetRight + width + PADDING > window.innerWidth - 10) {
          direction = targetY > window.innerHeight / 2 ? 'up' : 'down';
        }

        let top, left, caretTop, caretLeft;
        
        if (direction === 'up') {
          top = targetTop - height - PADDING;
          left = targetX - width / 2;
        } else if (direction === 'down') {
          top = targetBottom + PADDING;
          left = targetX - width / 2;
        } else if (direction === 'left') {
          top = targetY - height / 2;
          left = targetLeft - width - PADDING;
        } else if (direction === 'right') {
          top = targetY - height / 2;
          left = targetRight + PADDING;
        }

        const originalLeft = left;
        const originalTop = top;

        left = Math.max(10, Math.min(window.innerWidth - width - 10, left));
        top = Math.max(10, Math.min(window.innerHeight - height - 10, top));

        if (direction === 'up' || direction === 'down') {
           caretLeft = width / 2 + (originalLeft - left);
           caretTop = direction === 'up' ? height : 0;
           caretLeft = Math.max(16, Math.min(width - 16, caretLeft));
        } else {
           caretTop = height / 2 + (originalTop - top);
           caretLeft = direction === 'left' ? width : 0;
           caretTop = Math.max(16, Math.min(height - 16, caretTop));
        }

        setPos({ top, left, caretTop, caretLeft, opacity: 1, direction });
    }, 0);
    return () => clearTimeout(timer);
  }, [tooltip]);

  if (!tooltip) return null;

  return (
    <div ref={ref} style={{
      position: 'fixed',
      top: pos.top,
      left: pos.left,
      opacity: pos.opacity,
      minWidth: 50,
      maxWidth: 300,
      width: 'fit-content',
      background: '#232328', // Oscuro para que coincida con la imagen de referencia
      color: '#FFFFFF',
      padding: '12px 16px',
      borderRadius: 8,
      fontSize: 13,
      lineHeight: 1.5,
      zIndex: 10000,
      pointerEvents: 'none',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      transition: 'opacity 0.15s ease-out, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transform: pos.opacity ? 'scale(1)' : 'scale(0.95)',
      transformOrigin: `${pos.caretLeft}px ${pos.caretTop}px`,
      textAlign: 'center',
      fontFamily: 'var(--font-sans)',
      WebkitFontSmoothing: 'antialiased'
    }}>
      {/* Caret */}
      <div style={{
         position: 'absolute',
         ...(pos.direction === 'up' ? { top: '100%', left: pos.caretLeft } : {}),
         ...(pos.direction === 'down' ? { top: 0, left: pos.caretLeft } : {}),
         ...(pos.direction === 'left' ? { top: pos.caretTop, left: '100%' } : {}),
         ...(pos.direction === 'right' ? { top: pos.caretTop, left: 0 } : {}),
         transform: 'translate(-50%, -50%) rotate(45deg)',
         width: 14,
         height: 14,
         background: '#232328',
         borderRadius: 2,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {tooltip.type === 'shop' ? (() => {
            const isPurchased = !!state.storeUpgrades?.[tooltip.data.id];
            return (
              <>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.data[lang] || tooltip.data.es}</div>
                {!isPurchased && (
                  <div style={{ fontSize: 12, color: '#FFC220', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-solid fa-tooth"></i> {fmt(tooltip.data.cost)}
                  </div>
                )}
                <div style={{ opacity: 0.8, fontSize: 12 }}>{tooltip.data[`desc_${lang}`] || tooltip.data.desc_es}</div>
              </>
            );
        })() : tooltip.type === 'stage' ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.unlocked ? (tooltip.data[lang] || tooltip.data.es) : '???'}</div>
            <div style={{ opacity: 0.8, fontSize: 12, textAlign: 'left' }}>
              {tooltip.unlocked 
                ? <div style={{ textAlign: 'center' }}>{lang === 'es' ? 'Evolución desbloqueada' : 'Evolution unlocked'}</div>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                    <div style={{ fontWeight: 600, color: 'var(--warning-i100)', marginBottom: 2, textAlign: 'center' }}>
                      {lang === 'es' ? 'Requisitos para desbloquear:' : 'Unlock requirements:'}
                    </div>
                    {(() => {
                      const reqPrestige = tooltip.data.reqPrestiges || tooltip.data.prestige || 0;
                      const met = (state.prestigeCount || 0) >= reqPrestige;
                      return (
                        <div style={{ opacity: met ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className={`fa-solid ${met ? 'fa-check' : 'fa-xmark'}`} style={{ color: met ? 'var(--success-i100)' : 'var(--fg-4)', fontSize: 10, width: 12, textAlign: 'center' }}></i>
                          <span>{reqPrestige} prestigio{reqPrestige !== 1 ? 's' : ''}</span>
                        </div>
                      );
                    })()}
                    
                    {tooltip.data.reqLevel > 0 && (() => {
                      const met = (state.level || 1) >= tooltip.data.reqLevel;
                      return (
                        <div style={{ opacity: met ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className={`fa-solid ${met ? 'fa-check' : 'fa-xmark'}`} style={{ color: met ? 'var(--success-i100)' : 'var(--fg-4)', fontSize: 10, width: 12, textAlign: 'center' }}></i>
                          <span>Nivel {tooltip.data.reqLevel}</span>
                        </div>
                      );
                    })()}

                    {tooltip.data.reqGenId && tooltip.data.reqGenQty > 0 && (() => {
                      const met = (state.generators?.[tooltip.data.reqGenId] || 0) >= tooltip.data.reqGenQty;
                      const genName = (window.GENERATORS || []).find(g => g.id === tooltip.data.reqGenId)?.[lang] || (window.GENERATORS || []).find(g => g.id === tooltip.data.reqGenId)?.es || tooltip.data.reqGenId;
                      return (
                        <div style={{ opacity: met ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className={`fa-solid ${met ? 'fa-check' : 'fa-xmark'}`} style={{ color: met ? 'var(--success-i100)' : 'var(--fg-4)', fontSize: 10, width: 12, textAlign: 'center' }}></i>
                          <span>{tooltip.data.reqGenQty}x {genName}</span>
                        </div>
                      );
                    })()}

                    {tooltip.data.reqAcademyUpgrades && tooltip.data.reqAcademyUpgrades.length > 0 && (
                      <div style={{ marginTop: 2 }}>
                        <div style={{ marginBottom: 4 }}>{lang === 'es' ? 'Mejoras requeridas:' : 'Required upgrades:'}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 6 }}>
                          {tooltip.data.reqAcademyUpgrades.map(id => {
                            const met = !!state.xpUpgrades?.[id];
                            const up = (window.XP_UPGRADES || []).find(u => u.id === id);
                            const name = up ? (up[lang] || up.es) : id;
                            return (
                              <div key={id} style={{ opacity: met ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className={`fa-solid ${met ? 'fa-check' : 'fa-xmark'}`} style={{ color: met ? 'var(--success-i100)' : 'var(--fg-4)', fontSize: 10, width: 12, textAlign: 'center' }}></i>
                                <span>{name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          </>
        ) : tooltip.type === 'text' ? (
          <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.01em' }}>{tooltip.text}</div>
        ) : tooltip.type === 'xp' ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{lang === 'es' ? 'Experiencia' : 'Experience'}</div>
            <div style={{ opacity: 0.8, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {lang === 'es' ? 'Faltan ' : ''}
              {(window.getXPRequired(state.level) - state.xp).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {lang === 'es' ? ` XP para nivel ${state.level + 1}` : ` XP missing for level ${state.level + 1}`}
            </div>
          </>
        ) : tooltip.type === 'generic' ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.data.title}</div>
            <div style={{ opacity: 0.8, fontSize: 12 }}>{tooltip.data.desc}</div>
          </>
        ) : tooltip.type === 'ach' ? (
          <>
            {tooltip.unlocked ? (
              <>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.data[lang] || tooltip.data.es}</div>
                <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 4 }}>{tooltip.data[`desc_${lang}`] || tooltip.data.desc_es}</div>
                <div style={{ color: 'var(--positive-i100)', fontSize: 12, fontWeight: 600 }}>
                  {lang === 'es' ? `+${tooltip.data.rewardPercent !== undefined ? tooltip.data.rewardPercent : 1}% prod. global permanente` : `+${tooltip.data.rewardPercent !== undefined ? tooltip.data.rewardPercent : 1}% permanent global prod.`}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', height: '100%', color: 'var(--fg-3)', fontSize: 12, lineHeight: 1.4, fontWeight: 500 }}>
                {tooltip.data.description?.[lang] || tooltip.data[`desc_${lang}`] || tooltip.data.desc_es || (lang === 'es' ? 'Sigue jugando para descubrirlo' : 'Keep playing to discover')}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.unlocked ? (tooltip.data[lang] || tooltip.data.es) : '???'}</div>
            <div style={{ opacity: 0.8, fontSize: 12 }}>{tooltip.data[`desc_${lang}`] || tooltip.data.desc_es}</div>
          </>
        )}
      </div>
    </div>
  );
};
window.SmartTooltip = SmartTooltip;;
