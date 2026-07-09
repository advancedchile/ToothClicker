// UI Components for Tooth Clicker
const { useState: useStateC } = React;

const is3DUrl = (url, is3DFlag) => url && !url.startsWith('data:image/') && (url.includes('.glb') || url.includes('.gltf') || url.startsWith('data:') || is3DFlag);

// Solves an 8x8 linear system to find homography matrix h0..h7
window.solveHomography = function (src, dst) {
  function solveGaussian(A, b) {
    let n = A.length;
    for (let i = 0; i < n; i++) {
      let maxEl = Math.abs(A[i][i]), maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; }
      }
      for (let k = i; k < n; k++) {
        let tmp = A[maxRow][k]; A[maxRow][k] = A[i][k]; A[i][k] = tmp;
      }
      let tmp = b[maxRow]; b[maxRow] = b[i]; b[i] = tmp;
      for (let k = i + 1; k < n; k++) {
        let c = -A[k][i] / A[i][i];
        for (let j = i; j < n; j++) {
          if (i === j) A[k][j] = 0;
          else A[k][j] += c * A[i][j];
        }
        b[k] += c * b[i];
      }
    }
    let x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = b[i] / A[i][i];
      for (let k = i - 1; k >= 0; k--) b[k] -= A[k][i] * x[i];
    }
    return x;
  }

  let A = [], B = [];
  for (let i = 0; i < 4; i++) {
    A.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x]);
    B.push(dst[i].x);
    A.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y]);
    B.push(dst[i].y);
  }
  let h = solveGaussian(A, B);
  return [
    h[0], h[3], 0, h[6],
    h[1], h[4], 0, h[7],
    0, 0, 1, 0,
    h[2], h[5], 0, 1
  ];
};

const primaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--primary-i100)', color: '#fff', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };
const secondaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--bg-3)', color: 'var(--fg-1)', borderRadius: 'var(--radius-s)', fontWeight: 500, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };

function ToothIcon({ size = 220, golden = false }) {
  const fill1 = golden ? '#FFD463' : '#FFFFFF';
  const fill2 = golden ? '#FFC220' : '#EBF4FC';
  const stroke = golden ? '#7F6A33' : '#0076DB';
  const shadow = golden ? '#FFC220' : '#0076DB';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ filter: `drop-shadow(0 10px 24px ${shadow}40)` }}>
      <defs>
        <linearGradient id={`tooth-grad-${golden ? 'g' : 'w'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill1} />
          <stop offset="100%" stopColor={fill2} />
        </linearGradient>
        <radialGradient id={`tooth-shine-${golden ? 'g' : 'w'}`} cx="30%" cy="25%" r="35%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M100 22 C 60 22, 34 42, 34 80 C 34 110, 48 128, 54 150 C 60 170, 72 182, 82 178 C 92 174, 92 158, 96 144 C 100 130, 104 130, 108 144 C 112 158, 114 174, 124 178 C 134 182, 146 170, 150 150 C 154 130, 166 110, 166 80 C 166 42, 140 22, 100 22 Z"
        fill={`url(#tooth-grad-${golden ? 'g' : 'w'})`} stroke={stroke} strokeWidth="3" />

      <ellipse cx="75" cy="60" rx="22" ry="30" fill={`url(#tooth-shine-${golden ? 'g' : 'w'})`} />
      <path d="M70 110 Q 100 125 130 110" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.35" />
    </svg>);

}

/**
 * Renders a ring of toothbrushes around the main tooth.
 * Each purchase of "brush" adds one toothbrush (max 100).
 */
function ToothbrushRing({ count, radius = 180 }) {
  const max = 100;
  const displayCount = Math.min(count || 0, max);

  if (displayCount <= 0) return null;

  const delayStep = 0.1; // 100ms between brushes
  const pulseTime = 1;   // 1s pulse duration
  const cycleTime = Math.max(pulseTime, displayCount * delayStep);
  const peakPercent = (pulseTime / 2 / cycleTime) * 100;
  const endPercent = (pulseTime / cycleTime) * 100;

  return (
    <div style={{
      position: 'absolute',
      width: 0,
      height: 0,
      zIndex: 0,
      animation: 'rotateSun 60s linear infinite',
      pointerEvents: 'none'
    }}>
      <style>{`
        @keyframes brushWaveDynamic {
          0% { opacity: 1; transform: translateY(0); }
          ${peakPercent}% { opacity: 0.3; transform: translateY(-3px); }
          ${endPercent}%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes brushEntry {
          0% { opacity: 0; transform: translateY(-${radius + 10}px) rotate(180deg) scale(0); }
          60% { opacity: 1; transform: translateY(-${radius - 5}px) rotate(180deg) scale(1.1); }
          100% { opacity: 1; transform: translateY(-${radius}px) rotate(180deg) scale(1); }
        }
      `}</style>
      {Array.from({ length: displayCount }).map((_, i) => {
        const angle = (i / displayCount) * 360;
        return (
          <div key={i} style={{
            position: 'absolute',
            width: 0,
            height: 0,
            transform: `rotate(${angle}deg)`,
            transition: 'transform 0.5s ease-out'
          }}>
            <div style={{
              position: 'absolute',
              width: 0,
              height: 0,
              transform: `translateY(-${radius}px) rotate(180deg)`,
              animation: 'brushEntry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards'
            }}>
              <img
                src="assets/tooth_wash/tooth_wash_1.png"
                alt=""
                style={{
                  position: 'absolute',
                  width: 50,
                  height: 50,
                  objectFit: 'contain',
                  left: -25,
                  top: -25,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  animation: `brushWaveDynamic ${cycleTime}s infinite ease-in-out`,
                  animationDelay: `${i * delayStep}s`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatTile({ label, value, sub, icon, accent, onHelpEnter, onHelpLeave }) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)', padding: "12px 14px" }}>
      <div className="t-mini-caps" style={{ color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <i className={icon} style={{ fontSize: 11, color: accent || 'var(--fg-3)' }}></i>}
        {label}
        {onHelpEnter && <i
          className="fa-solid fa-circle-question"
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-i100)'; onHelpEnter(e); }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-4)'; if (onHelpLeave) onHelpLeave(); }}
          style={{ fontSize: 11, color: 'var(--fg-4)', cursor: 'help', transition: 'color 150ms' }}></i>}
      </div>
      <div className="t-heading-l" style={{ color: accent || 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>{sub}</div>}
    </div>);

}

function StatsGroup({ title, icon, accent, rows }) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--spacing-3) var(--spacing-5)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-2)' }}>
        <div style={{ width: 26, height: 26, borderRadius: 4, background: accent || 'var(--fg-2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
          <i className={icon}></i>
        </div>
        <div className="t-heading-xs" style={{ color: 'var(--fg-1)' }}>{title}</div>
      </div>
      <div>
        {rows.map((r, i) =>
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px var(--spacing-5)', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
            <div className="t-body-s" style={{ color: 'var(--fg-2)' }}>{r.label}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: r.strong ? 600 : 500, fontSize: r.strong ? 18 : 14, color: r.color || 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>{r.value}</div>
          </div>
        )}
      </div>
    </div>);

}

function TabBar({ tabs, active, onChange, id, setTooltip, style = {} }) {
  return (
    <div id={id} style={{
      display: 'flex',
      gap: 6,
      background: 'var(--bg-2)',
      padding: '8px 8px 8px 8px',
      borderBottom: '1px solid var(--border-subtle)',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      ...style
    }}>
      {tabs.filter(Boolean).map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            onClick={() => { window.playClickSound && window.playClickSound(); onChange(t.id); }}
            onMouseEnter={(e) => {
              if (setTooltip) {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ type: 'text', text: t.label, pos: { x: rect.left + rect.width / 2, y: rect.bottom }, direction: 'down' });
              }
            }}
            onMouseLeave={() => {
              if (setTooltip) setTooltip(null);
            }}
            style={{
              all: 'unset',
              position: 'relative',
              boxSizing: 'border-box',
              flex: 1,
              background: isActive ? 'var(--bg-1)' : 'transparent',
              padding: '10px 0',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease',
              boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {t.img ?
              <img src={t.img} style={{ width: 32, height: 32, objectFit: 'contain', filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)', transform: isActive ? 'scale(1.2)' : 'scale(0.95)', transition: 'all 200ms ease' }} />
              : <i className={t.icon} style={{ fontSize: 24, color: isActive ? 'var(--primary-i100)' : 'var(--fg-4)', transform: isActive ? 'scale(1.2)' : 'scale(0.95)', transition: 'all 200ms ease' }}></i>
            }
            {t.badge != null &&
              <span style={{
                position: 'absolute',
                top: 4,
                right: 'calc(50% - 24px)',
                fontSize: 9,
                fontWeight: 700,
                background: 'var(--primary-i100)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 999,
                minWidth: 16,
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>{t.badge}</span>
            }
            {t.dot && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 'calc(50% - 20px)',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#e11d24',
                border: '2px solid var(--bg-1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}></span>
            )}
          </button>
        );
      })}
    </div>
  );
}


function GeneratorRow({ gen, owned, cost, canAfford, unlocked, revealed, onBuy, lang, totalTeeth, production, nextProduction, buyQty, actualQty }) {
  const t = window.STRINGS[lang];
  const name = gen.name?.[lang] || gen[lang] || gen.es;
  const desc = gen.description?.[lang] || gen[`desc_${lang}`] || gen.desc_es;
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 });
  const rowRef = React.useRef(null);

  if (!revealed) return null;

  const sharedGrid = { display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: '8px', alignItems: 'center', padding: '5px 8px', boxSizing: 'border-box', borderRadius: 'var(--radius-s)' };

  const handleEnter = () => {
    setIsHovered(true);
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      const container = rowRef.current.closest('section') || rowRef.current.closest('.mobile-tab-view-body') || rowRef.current.closest('#generators-container-desktop');
      const containerRect = container ? container.getBoundingClientRect() : rect;
      let leftPos = containerRect.left - 250 - 5;
      if (leftPos < 5) {
        leftPos = containerRect.right + 5;
      }
      setTooltipPos({ top: rect.top, left: leftPos });
    }
  };

  const handleLeave = () => {
    setIsPressed(false);
    setIsHovered(false);
  };

  if (!unlocked) {
    return (
      <div style={{ ...sharedGrid, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', opacity: 0.5, cursor: 'not-allowed' }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)', flexShrink: 0 }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 12 }}></i>
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', lineHeight: 1.2 }}>???</div>
          <div style={{ fontSize: 10, color: 'var(--fg-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.unlockAt} <window.Odometer value={gen.unlockAt || 0} /> {t.teeth}</div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 50, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-4)' }}>{t.cost}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', fontVariantNumeric: 'tabular-nums' }}>−<window.Odometer value={Math.max(0, (gen.unlockAt || 0) - totalTeeth)} /></div>
        </div>
      </div>);
  }

  return (
    <>
      <div
        ref={rowRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={canAfford ? onBuy : undefined}
        onMouseDown={() => canAfford && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          ...sharedGrid,
          background: canAfford ? 'var(--bg-1)' : 'var(--bg-2)',
          border: canAfford ? '1px solid var(--primary-i100)' : '1px solid var(--border-subtle)',
          boxShadow: canAfford ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          opacity: canAfford ? 1 : 0.65,
          transform: isPressed ? 'translateY(1px)' : 'none',
          transition: 'transform 100ms ease, border-color 150ms ease, background 150ms ease, box-shadow 150ms ease'
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 6, background: canAfford ? 'var(--primary-i010)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: canAfford ? 'var(--primary-i100)' : 'var(--fg-3)', flexShrink: 0, transition: 'background 150ms ease, color 150ms ease', overflow: 'hidden' }}>
          {gen.iconUrl ? <img src={gen.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={gen.icon} style={{ fontSize: 14 }}></i>}
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Cant. <span style={{ fontWeight: 700, color: 'var(--fg-1)' }}>{owned}</span></div>
          <div style={{ fontSize: 10, color: 'var(--positive-i100)', fontVariantNumeric: 'tabular-nums' }}>+<window.Odometer value={owned > 0 ? production : nextProduction} formatFn={(v) => window.formatNum(v, null, null, true)} />/s</div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 50, flexShrink: 0 }}>
          {buyQty > 1 &&
            <div style={{ fontSize: 9, color: canAfford ? 'var(--primary-i100)' : 'var(--fg-4)', textTransform: 'uppercase', marginBottom: 2 }}>
              x{actualQty < buyQty ? `${actualQty}/${buyQty}` : buyQty}
            </div>
          }
          <div style={{ fontSize: 13, fontWeight: canAfford ? 700 : 400, color: canAfford ? 'var(--fg-1)' : 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>
            <window.Odometer value={cost} />
          </div>
        </div>
      </div>

      {isHovered && window.ReactDOM && window.ReactDOM.createPortal(
        <div style={{
          position: 'absolute',
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: 250,
          minHeight: 100,
          background: 'var(--bg-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-m)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '12px',
          boxSizing: 'border-box',
          display: 'flex',
          gap: '12px',
          zIndex: 99999,
          animation: 'fadeIn 0.2s ease-out',
          pointerEvents: 'none'
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {gen.iconUrl ? <img src={gen.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={gen.icon} style={{ fontSize: 24, color: 'var(--fg-2)' }}></i>}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.2 }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.3, marginTop: 4 }}>{desc}</div>
            </div>
            <div style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cantidad:</span> <span style={{ fontWeight: 600 }}>{owned}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--positive-i100)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Producción:</span> <span>+<window.Odometer value={owned > 0 ? production : nextProduction} formatFn={(v) => window.formatNum(v, null, null, true)} />/s</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--fg-4)', fontWeight: 600 }}>Coste</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: canAfford ? 'var(--positive-i100)' : 'var(--negative-i100)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="fa-solid fa-tooth" style={{ fontSize: 11 }}></i>
                <window.Odometer value={cost} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function ClickUpgradeRow({ up, purchased, canAfford, unlocked, onBuy, lang, totalTeeth }) {
  const t = window.STRINGS[lang];
  const name = up.name?.[lang] || up[lang] || up.es;
  const desc = up.description?.[lang] || up[`desc_${lang}`] || up.desc_es;
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 });
  const rowRef = React.useRef(null);

  const prevPurchased = React.useRef(purchased);
  const [showConfetti, setShowConfetti] = React.useState(false);

  React.useEffect(() => {
    if (!prevPurchased.current && purchased) {
      setShowConfetti(true);
      const id = setTimeout(() => setShowConfetti(false), 200);
      return () => clearTimeout(id);
    }
    prevPurchased.current = purchased;
  }, [purchased]);

  const sharedGrid = { display: 'grid', gridTemplateColumns: '32px 1fr', gap: '8px', alignItems: 'center', padding: '5px 8px', boxSizing: 'border-box', borderRadius: 'var(--radius-s)' };

  const handleEnter = () => {
    setIsHovered(true);
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      const container = rowRef.current.closest('section') || rowRef.current.closest('.mobile-tab-view-body') || rowRef.current.closest('#click-upgrades-container-desktop');
      const containerRect = container ? container.getBoundingClientRect() : rect;
      let leftPos = containerRect.left - 250 - 5;
      if (leftPos < 5) {
        leftPos = containerRect.right + 5;
      }
      setTooltipPos({ top: rect.top, left: leftPos });
    }
  };

  const handleLeave = () => {
    setIsPressed(false);
    setIsHovered(false);
  };

  const ConfettiParticle = () => {
    const [active, setActive] = React.useState(false);

    const { startX, startY, tx, ty } = React.useMemo(() => {
      const edge = Math.random();
      let x, y, angle;
      if (edge < 0.25) {
        x = Math.random() * 100; y = 0;
        angle = -Math.PI / 2 + (Math.random() - 0.5);
      } else if (edge < 0.5) {
        x = 100; y = Math.random() * 100;
        angle = (Math.random() - 0.5);
      } else if (edge < 0.75) {
        x = Math.random() * 100; y = 100;
        angle = Math.PI / 2 + (Math.random() - 0.5);
      } else {
        x = 0; y = Math.random() * 100;
        angle = Math.PI + (Math.random() - 0.5);
      }
      const dist = 30 + Math.random() * 30;
      return { startX: x, startY: y, tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist };
    }, []);

    React.useEffect(() => {
      let raf = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)));
      return () => cancelAnimationFrame(raf);
    }, []);

    const color = ['#ff3366', '#33ccff', '#ffcc00', '#33ff66', '#a64dff'][Math.floor(Math.random() * 5)];
    return (
      <div style={{
        position: 'absolute', top: `${startY}%`, left: `${startX}%`, width: 6, height: 6, background: color, borderRadius: '50%',
        transform: active ? `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)` : 'translate(-50%, -50%) scale(1.5)',
        opacity: active ? 0 : 1,
        transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease-out',
        pointerEvents: 'none'
      }} />
    );
  };

  if (!unlocked) {
    return (
      <div style={{ ...sharedGrid, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', opacity: 0.5, cursor: 'not-allowed' }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)', flexShrink: 0 }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 12 }}></i>
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', lineHeight: 1.2 }}>???</div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', fontVariantNumeric: 'tabular-nums' }}>
            −<window.Odometer value={Math.max(0, (up.unlockAt !== undefined ? up.unlockAt : Math.floor(up.cost * 0.5)) - totalTeeth)} />
          </div>
        </div>
      </div>);
  }

  const tooltipPortal = isHovered && window.ReactDOM && window.ReactDOM.createPortal(
    <div style={{
      position: 'absolute',
      top: tooltipPos.top,
      left: tooltipPos.left,
      width: 250,
      minHeight: 100,
      background: 'var(--bg-1)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-m)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      padding: '12px',
      boxSizing: 'border-box',
      display: 'flex',
      gap: '12px',
      zIndex: 99999,
      animation: 'fadeIn 0.2s ease-out',
      pointerEvents: 'none'
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        {up.iconUrl ? <img src={up.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={up.icon || "fa-solid fa-arrow-up-right-dots"} style={{ fontSize: 24, color: 'var(--fg-2)' }}></i>}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.3, marginTop: 4 }}>{desc}</div>
        </div>
        <div style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 11, color: 'var(--positive-i100)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Prod. x click:</span> <span>{up.type === 'mult' ? `x${up.value || up.multiplier || 1}` : `+${up.value || up.multiplier || 0}`}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--fg-4)', fontWeight: 600 }}>Coste</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: purchased ? 'var(--fg-2)' : (canAfford ? 'var(--positive-i100)' : 'var(--negative-i100)'), display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="fa-solid fa-tooth" style={{ fontSize: 11 }}></i>
            <window.Odometer value={up.cost} formatFn={(v) => window.formatNum(Math.floor(v))} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  if (purchased) {
    return (
      <>
        <div
          ref={rowRef}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          style={{ ...sharedGrid, gridTemplateColumns: '32px 1fr', background: 'var(--positive-i010)', border: '1px solid var(--positive-i100)', position: 'relative', transform: isHovered ? 'translateY(-1px)' : 'none', transition: 'transform 150ms ease' }}
        >
          {showConfetti && Array.from({ length: 16 }).map((_, i) => <ConfettiParticle key={i} />)}
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
            {up.iconUrl ? <img src={up.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={up.icon || "fa-solid fa-arrow-up-right-dots"} style={{ fontSize: 13 }}></i>}
          </div>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
              <span style={{ fontSize: 10, color: 'var(--positive-i150)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {up.type === 'mult' ? `x${up.value || up.multiplier || 1}` : `+${up.value || up.multiplier || 0}`}
              </span>
              <span style={{ fontSize: 11, color: 'var(--positive-i130)', whiteSpace: 'nowrap' }}>x click</span>
            </div>
          </div>
          <div style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--positive-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}>
            <i className="fa-solid fa-check" style={{ fontSize: 8 }}></i>
          </div>
        </div>
        {tooltipPortal}
      </>
    );
  }

  return (
    <>
      <div
        ref={rowRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={canAfford ? onBuy : undefined}
        onMouseDown={() => canAfford && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          ...sharedGrid,
          position: 'relative',
          background: canAfford ? 'var(--bg-1)' : 'var(--bg-2)',
          border: canAfford ? '1px solid var(--primary-i100)' : '1px solid var(--border-subtle)',
          boxShadow: canAfford ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          opacity: canAfford ? 1 : 0.65,
          transform: isPressed ? 'translateY(1px)' : (isHovered ? 'translateY(-1px)' : 'none'),
          transition: 'transform 100ms ease, border-color 150ms ease, background 150ms ease, box-shadow 150ms ease'
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 6, background: canAfford ? 'var(--alternative-i010)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: canAfford ? 'var(--alternative-i100)' : 'var(--fg-3)', flexShrink: 0, overflow: 'hidden', transition: 'background 150ms ease, color 150ms ease' }}>
          {up.iconUrl ? <img src={up.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={up.icon || "fa-solid fa-arrow-up-right-dots"} style={{ fontSize: 13 }}></i>}
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, color: 'var(--positive-i100)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {up.type === 'mult' ? `x${up.value || up.multiplier || 1}` : `+${up.value || up.multiplier || 0}`}
            </span>
            <span style={{ fontSize: 11, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>x click</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: canAfford ? 700 : 400, color: canAfford ? 'var(--fg-1)' : 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>
            <window.Odometer value={up.cost} formatFn={(v) => window.formatNum(Math.floor(v))} />
          </div>
        </div>
      </div>
      {tooltipPortal}
    </>
  );
}

function AcademyUpgradeRow({ up, purchased, canAfford, unlocked, onBuy, lang, totalXP, isCoins, onHover, onLeave, state }) {
  const name = up.name?.[lang] || up[lang] || up.name?.es || up.es || "Mejora";
  const desc = up.desc?.[lang] || up.description?.[lang] || up.desc?.es || up.description?.es || "";
  const isSpecial = up.isLevelSpecial;
  const cost = isCoins ? up.costCoins : up.baseCost || up.costXP;

  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 });
  const rowRef = React.useRef(null);

  const prevPurchased = React.useRef(purchased);
  const [showConfetti, setShowConfetti] = React.useState(false);

  React.useEffect(() => {
    if (!prevPurchased.current && purchased) {
      setShowConfetti(true);
      const id = setTimeout(() => setShowConfetti(false), 200);
      return () => clearTimeout(id);
    }
    prevPurchased.current = purchased;
  }, [purchased]);

  const sharedGrid = { display: 'grid', gridTemplateColumns: '32px 1fr', gap: '8px', alignItems: 'center', padding: '5px 8px', boxSizing: 'border-box', borderRadius: 'var(--radius-s)' };

  const handleEnter = () => {
    setIsHovered(true);
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      const container = rowRef.current.closest('section') || rowRef.current.closest('.mobile-tab-view-body') || rowRef.current.closest('#click-upgrades-container-desktop') || rowRef.current.closest('div');
      const containerRect = container ? container.getBoundingClientRect() : rect;
      let leftPos = containerRect.left - 250 - 5;
      if (leftPos < 5) {
        leftPos = containerRect.right + 5;
      }
      setTooltipPos({ top: rect.top, left: leftPos });
    }
  };

  const handleLeave = () => {
    setIsPressed(false);
    setIsHovered(false);
  };

  const ConfettiParticle = () => {
    const [active, setActive] = React.useState(false);

    const { startX, startY, tx, ty } = React.useMemo(() => {
      const edge = Math.random();
      let x, y, angle;
      if (edge < 0.25) {
        x = Math.random() * 100; y = 0;
        angle = -Math.PI / 2 + (Math.random() - 0.5);
      } else if (edge < 0.5) {
        x = 100; y = Math.random() * 100;
        angle = (Math.random() - 0.5);
      } else if (edge < 0.75) {
        x = Math.random() * 100; y = 100;
        angle = Math.PI / 2 + (Math.random() - 0.5);
      } else {
        x = 0; y = Math.random() * 100;
        angle = Math.PI + (Math.random() - 0.5);
      }
      const dist = 30 + Math.random() * 30;
      return { startX: x, startY: y, tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist };
    }, []);

    React.useEffect(() => {
      let raf = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)));
      return () => cancelAnimationFrame(raf);
    }, []);

    const color = ['#ff3366', '#33ccff', '#ffcc00', '#33ff66', '#a64dff'][Math.floor(Math.random() * 5)];
    return (
      <div style={{
        position: 'absolute', top: `${startY}%`, left: `${startX}%`, width: 6, height: 6, background: color, borderRadius: '50%',
        transform: active ? `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)` : 'translate(-50%, -50%) scale(1.5)',
        opacity: active ? 0 : 1,
        transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease-out',
        pointerEvents: 'none'
      }} />
    );
  };

  if (!unlocked) {
    return (
      <div ref={rowRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave} style={{ ...sharedGrid, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', opacity: 0.5, cursor: 'not-allowed' }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)', flexShrink: 0 }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 12 }}></i>
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', lineHeight: 1.2 }}>???</div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', fontVariantNumeric: 'tabular-nums' }}>
            {lang === 'es' ? 'Bloqueado' : 'Locked'}
          </div>
        </div>

        {isHovered && window.ReactDOM && window.ReactDOM.createPortal(
          <div style={{
            position: 'absolute',
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: 250,
            background: 'var(--bg-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-m)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '12px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 99999,
            animation: 'fadeIn 0.2s ease-out',
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{lang === 'es' ? 'Bloqueado' : 'Locked'}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{lang === 'es' ? 'Requisitos:' : 'Requirements:'}</div>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', fontSize: 11, color: 'var(--fg-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(() => {
                const reqs = [];
                const lvlReq = (up.levelReq !== undefined) ? up.levelReq : (up.reqLevel || 0);
                if (lvlReq > 0) {
                  const met = state && state.level >= lvlReq;
                  reqs.push({ text: lang === 'es' ? `Nivel ${lvlReq}` : `Level ${lvlReq}`, met });
                }
                if (up.reqGeneratorId && up.reqGenQty) {
                  const gen = (window.GENERATORS || []).find(g => g.id === up.reqGeneratorId);
                  const gName = gen ? (gen.name?.[lang] || gen[lang] || gen.name?.es || gen.es || '(?)') : '(?)';
                  const met = state && (state.generators?.[up.reqGeneratorId] || 0) >= up.reqGenQty;
                  reqs.push({ text: `${up.reqGenQty}x ${gName}`, met });
                }
                const achId = up.reqAchievementId || up.achievementId;
                if (achId && achId !== "none" && String(achId).trim() !== "") {
                  const ach = (window.ACHIEVEMENTS || []).find(a => String(a.id) === String(achId));
                  if (ach) {
                    const achName = ach.name?.[lang] || ach[lang] || ach.name?.es || ach.es || '(?)';
                    const met = state && !!state.achievements[achId];
                    reqs.push({ text: lang === 'es' ? `Logro: ${achName}` : `Achievement: ${achName}`, met });
                  }
                }
                return reqs.map((r, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, color: r.met ? 'var(--positive-i100)' : 'var(--fg-3)' }}>
                    <i className={r.met ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"} style={{ fontSize: 12 }}></i>
                    <span style={{ fontWeight: r.met ? 600 : 400 }}>{r.text}</span>
                  </li>
                ));
              })()}
            </ul>
            {cost > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--fg-4)', fontWeight: 600 }}>Coste</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: canAfford ? 'var(--positive-i100)' : 'var(--negative-i100)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isCoins ? <span style={{ fontSize: 11 }}>{lang === 'es' ? 'Monedas' : 'Coins'}</span> : <i className="fa-solid fa-tooth" style={{ fontSize: 11 }}></i>}
                  <window.Odometer value={cost} formatFn={(v) => window.formatNum(Math.floor(v))} />
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
    );
  }

  const tooltipPortal = isHovered && window.ReactDOM && window.ReactDOM.createPortal(
    <div style={{
      position: 'absolute',
      top: tooltipPos.top,
      left: tooltipPos.left,
      width: 250,
      minHeight: 100,
      background: 'var(--bg-1)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-m)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      padding: '12px',
      boxSizing: 'border-box',
      display: 'flex',
      gap: '12px',
      zIndex: 99999,
      animation: 'fadeIn 0.2s ease-out',
      pointerEvents: 'none'
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        {up.iconUrl ? <img src={up.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={up.icon || "fa-solid fa-graduation-cap"} style={{ fontSize: 24, color: 'var(--fg-2)' }}></i>}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.2 }}>{name}</div>
        </div>
        <div style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {up.passiveMult > 0 && <div style={{ fontSize: 11, color: 'var(--positive-i100)', display: 'flex', justifyContent: 'space-between' }}><span>Pasiva:</span> <span>+{up.passiveMult}%</span></div>}
          {up.clickMult > 0 && <div style={{ fontSize: 11, color: 'var(--positive-i100)', display: 'flex', justifyContent: 'space-between' }}><span>Click:</span> <span>+{up.clickMult}%</span></div>}
          {up.globalMult > 0 && <div style={{ fontSize: 11, color: 'var(--positive-i100)', display: 'flex', justifyContent: 'space-between' }}><span>Global:</span> <span>+{up.globalMult}%</span></div>}
          {up.xpMult > 0 && <div style={{ fontSize: 11, color: 'var(--positive-i100)', display: 'flex', justifyContent: 'space-between' }}><span>XP:</span> <span>+{up.xpMult}%</span></div>}
          {up.genProdMult > 0 && up.reqGeneratorId && (() => {
            const gen = (window.GENERATORS || []).find(g => g.id === up.reqGeneratorId);
            const gName = gen ? (gen.name?.[lang] || gen[lang] || gen.name?.es || gen.es || '(?)') : '(?)';
            return <div style={{ fontSize: 11, color: 'var(--positive-i100)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}><span>{gName}:</span> <span>+{up.genProdMult}%</span></div>;
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--fg-4)', fontWeight: 600 }}>Coste</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: purchased ? 'var(--fg-2)' : (canAfford ? 'var(--positive-i100)' : 'var(--negative-i100)'), display: 'flex', alignItems: 'center', gap: 4 }}>
            {isCoins ? <span style={{ fontSize: 11 }}>{lang === 'es' ? 'Monedas' : 'Coins'}</span> : <i className="fa-solid fa-tooth" style={{ fontSize: 11 }}></i>}
            <window.Odometer value={cost} formatFn={(v) => window.formatNum(Math.floor(v))} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  if (purchased) {
    return (
      <>
        <div
          ref={rowRef}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          style={{ ...sharedGrid, background: 'var(--positive-i010)', border: '1px solid var(--positive-i100)', position: 'relative', transform: isHovered ? 'translateY(-1px)' : 'none', transition: 'transform 150ms ease' }}
        >
          {showConfetti && Array.from({ length: 16 }).map((_, i) => <ConfettiParticle key={i} />)}
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
            {up.iconUrl ? <img src={up.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={up.icon || "fa-solid fa-graduation-cap"} style={{ fontSize: 13 }}></i>}
          </div>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--positive-i150)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          </div>
          <div style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--positive-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}>
            <i className="fa-solid fa-check" style={{ fontSize: 8 }}></i>
          </div>
        </div>
        {tooltipPortal}
      </>
    );
  }

  return (
    <>
      <div
        ref={rowRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={canAfford ? onBuy : undefined}
        onMouseDown={() => canAfford && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          ...sharedGrid,
          position: 'relative',
          background: isSpecial ? 'var(--warning-i005)' : (canAfford ? 'var(--bg-1)' : 'var(--bg-2)'),
          border: canAfford ? (isSpecial ? '1px solid var(--warning-i030)' : '1px solid var(--primary-i100)') : '1px solid var(--border-subtle)',
          boxShadow: canAfford ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          opacity: canAfford ? 1 : 0.65,
          transform: isPressed ? 'translateY(1px)' : (isHovered ? 'translateY(-1px)' : 'none'),
          transition: 'transform 100ms ease, border-color 150ms ease, background 150ms ease, box-shadow 150ms ease'
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 6, background: canAfford ? (isSpecial ? 'var(--warning-i010)' : 'var(--alternative-i010)') : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: canAfford ? (isSpecial ? 'var(--warning-i100)' : 'var(--alternative-i100)') : 'var(--fg-3)', flexShrink: 0, overflow: 'hidden', transition: 'background 150ms ease, color 150ms ease' }}>
          {up.iconUrl ? <img src={up.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={up.icon || "fa-solid fa-graduation-cap"} style={{ fontSize: 13 }}></i>}
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 12, fontWeight: canAfford ? 700 : 400, color: canAfford ? 'var(--fg-1)' : 'var(--fg-3)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4 }}>
            {isCoins ? <span style={{ fontSize: 10, fontWeight: 600 }}>{lang === 'es' ? 'Monedas' : 'Coins'}</span> : <i className="fa-solid fa-tooth" style={{ fontSize: 11 }}></i>}
            <window.Odometer value={cost} formatFn={(v) => window.formatNum(Math.floor(v))} />
          </div>
        </div>
      </div>
      {tooltipPortal}
    </>
  );
}

function achIcon(ach) {
  const cat = ach.cat;
  if (cat === 'secret' || !cat) {
    const id = ach.id || '';
    if (id.includes('golden') || id.includes('gold')) return 'fa-star';
    if (id.includes('click')) return 'fa-hand-pointer';
    if (id.includes('prest')) return 'fa-crown';
    if (id.includes('time') || id.includes('marathon') || id.includes('idle') || id.includes('patient')) return 'fa-clock';
    if (id.includes('omega') || id.includes('divine') || id.includes('pantheon')) return 'fa-infinity';
    if (id.includes('dragon')) return 'fa-dragon';
    if (id.includes('fairy')) return 'fa-wand-sparkles';
    if (id.includes('hydra')) return 'fa-water';
    if (id.includes('balance')) return 'fa-scale-balanced';
    if (id.includes('777') || id.includes('lucky')) return 'fa-dice';
    if (id.includes('speed')) return 'fa-bolt';
    if (id.includes('mono')) return 'fa-broom';
    if (id.includes('diverse')) return 'fa-layer-group';
    if (id.includes('minimal')) return 'fa-compress';
    if (id.includes('all_click')) return 'fa-arrow-up-right-dots';
    return 'fa-user-ninja';
  }
  if (cat === 'earned') return 'fa-tooth';
  if (cat === 'prestige') return 'fa-crown';
  if (cat === 'golden') return 'fa-star';
  if (cat === 'time') return 'fa-clock';
  if (cat === 'upgrades' || cat === 'clicks') return 'fa-arrow-up-right-dots';
  if (cat === 'meta') return 'fa-trophy';
  if (cat === 'gen') {
    const parts = (ach.id || '').split('_');
    const genId = parts.slice(1, -1).join('_');
    const gen = window.GENERATORS && window.GENERATORS.find(g => g.id === genId);
    if (gen && gen.icon) return gen.icon.replace('fa-solid ', '');
    return 'fa-industry';
  }
  return 'fa-trophy';
}

window.achIcon = achIcon;

function AchievementCard({ ach, unlocked, lang, onHover, onLeave }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 });
  const rowRef = React.useRef(null);
  const icon = achIcon(ach);

  const handleEnter = () => {
    setIsHovered(true);
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();

      if (!unlocked) {
        if (onHover) onHover(ach, {
          top: rect.top + 7,
          bottom: rect.bottom - 7,
          left: rect.left,
          right: rect.right,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }, unlocked);
        return;
      }

      const container = rowRef.current.closest('section') || rowRef.current.closest('.mobile-tab-view-body') || rowRef.current.closest('#achievements-container-desktop');
      const containerRect = container ? container.getBoundingClientRect() : rect;

      let leftPos = containerRect.left - 250 - 5;
      if (leftPos < 5) {
        leftPos = containerRect.right + 5;
      }

      let topPos = rect.top;
      if (topPos + 100 > window.innerHeight) {
        topPos = window.innerHeight - 100 - 10;
      }

      setTooltipPos({ top: topPos, left: leftPos });

      // We pass null for pos to signal that we are handling the tooltip internally
      if (onHover) {
        onHover(ach, null, unlocked);
      }
    }
  };

  const handleLeave = () => {
    setIsHovered(false);
    if (onLeave) onLeave();
  };

  return (
    <>
      <div
        ref={rowRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          width: 48, height: 48, padding: 4, boxSizing: 'border-box',
          borderRadius: 'var(--radius-s)',
          position: 'relative',
          background: unlocked ? 'var(--warning-i010)' : 'var(--bg-2)',
          border: unlocked ? '1px solid var(--warning-i100)' : '1px solid var(--border-subtle)',
          boxShadow: unlocked ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
          cursor: 'default',
          opacity: unlocked ? 1 : 0.65,
          transform: isHovered ? 'translateY(-1px)' : 'none',
          transition: 'transform 100ms ease, border-color 150ms ease, background 150ms ease, box-shadow 150ms ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: 4, background: unlocked ? 'transparent' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: unlocked ? 'var(--warning-i100)' : 'var(--fg-3)', overflow: 'hidden', transition: 'background 150ms ease, color 150ms ease' }}>
          {(ach.iconUrl && unlocked) ? <img src={ach.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={`fa-solid ${unlocked ? icon : 'fa-question'}`} style={{ fontSize: 16 }}></i>}
        </div>
        {ach.isNew && (
          <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--negative-i100)', border: '1px solid var(--bg-1)', zIndex: 2 }}></div>
        )}
      </div>

      {isHovered && unlocked && window.ReactDOM && window.ReactDOM.createPortal(
        <div style={{
          position: 'absolute',
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: 250,
          background: 'var(--bg-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-m)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '12px',
          boxSizing: 'border-box',
          display: 'flex',
          gap: '12px',
          zIndex: 99999,
          animation: 'fadeIn 0.2s ease-out',
          pointerEvents: 'none'
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {ach.iconUrl ? <img src={ach.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <i className={`fa-solid ${icon}`} style={{ fontSize: 24, color: unlocked ? 'var(--warning-i100)' : 'var(--fg-2)' }}></i>}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {unlocked ? (
              <>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.2 }}>{ach.name?.[lang] || ach[lang] || ach.name?.es || ach.es}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.3, marginTop: 4 }}>{ach.description?.[lang] || ach[`desc_${lang}`] || ach.desc_es}</div>
                </div>
                <div style={{ color: 'var(--positive-i100)', fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                  {lang === 'es' ? `+${ach.rewardPercent !== undefined ? ach.rewardPercent : 1}% prod. global permanente` : `+${ach.rewardPercent !== undefined ? ach.rewardPercent : 1}% permanent global prod.`}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', height: '100%', color: 'var(--fg-3)', fontSize: 12, lineHeight: 1.4, fontWeight: 500 }}>
                {window.getAchReqText ? window.getAchReqText(ach, lang) : (lang === 'es' ? 'Sigue jugando para descubrirlo' : 'Keep playing to discover')}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Toast({ toast, lang, styleOverride, onClose }) {
  if (!toast) return null;
  const t = window.STRINGS[lang];
  const isAch = !!toast.cat || toast.reqType !== undefined || toast.rewardPercent !== undefined;
  const isUpgrade = !!toast.id && toast.id.startsWith('buy_up_');
  const isSpecial = !!toast.id && (toast.id.startsWith('__') || toast.id.startsWith('bonus_') || toast.id.startsWith('eff_'));
  const isFeedback = toast.id === 'feedback_success';

  let icon = toast.icon;
  let title = lang === 'en' && toast.titleEn ? toast.titleEn : toast.title;
  let accent = toast.accent;
  let accentText = toast.accentText;

  if (isAch) {
    icon = icon || (window.achIcon ? `fa-solid ${window.achIcon(toast)}` : "fa-solid fa-trophy");
    title = title || (lang === 'es' ? '¡NUEVO LOGRO OBTENIDO!' : 'NEW ACHIEVEMENT UNLOCKED!');
    accent = accent || "var(--warning-i100)";
    accentText = accentText || "var(--warning-i070)";
  } else if (isUpgrade) {
    icon = icon || "fa-solid fa-cart-shopping";
    title = title || (lang === 'es' ? 'Mejora comprada' : 'Upgrade bought');
    accent = accent || "var(--primary-i100)";
    accentText = accentText || "var(--primary-i070)";
  } else if (isSpecial) {
    icon = icon || "fa-solid fa-bolt";
    title = title || (lang === 'es' ? 'Bonus activo' : 'Bonus active');
    accent = accent || "var(--alternative-i100)";
    accentText = accentText || "var(--alternative-i070)";
  } else if (isFeedback) {
    icon = icon || "fa-solid fa-comment-dots";
    title = title || (lang === 'es' ? 'Mensaje enviado' : 'Message sent');
    accent = accent || "var(--positive-i100)";
    accentText = accentText || "var(--positive-i070)";
  } else {
    icon = icon || "fa-solid fa-info-circle";
    title = title || "Info";
    accent = accent || "var(--primary-i100)";
    accentText = accentText || "var(--primary-i070)";
  }

  const animationStyle = isAch ? 'toastIn 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'toastIn 250ms ease, toastOut 250ms ease 3.2s forwards';

  let borderStyle = isAch ? '2px solid transparent' : 'none';
  let customAnimation = isAch ? 'rainbow-border-anim 2s linear infinite, toastIn 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)' : animationStyle;

  if (isAch) {
    const thickness = toast.borderThickness !== undefined ? toast.borderThickness : 2;
    const style = toast.borderStyle || 'solid';
    const color = toast.borderColor || 'transparent';
    const effect = toast.borderEffect || (toast.id ? 'rainbow' : 'none');

    borderStyle = `${thickness}px ${style} ${color}`;

    let effectAnim = '';
    if (effect === 'rainbow') effectAnim = 'rainbow-border-anim 2s linear infinite, ';
    else if (effect === 'pulse') effectAnim = 'pulse-border-anim 1.5s ease-in-out infinite, ';

    customAnimation = `${effectAnim}toastIn 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
  }

  const containerStyle = {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--complementary-i080)', color: '#fff', padding: 'var(--spacing-3) var(--spacing-4)',
    borderRadius: 'var(--radius-m)', boxShadow: isAch ? 'none' : 'var(--elevation-20)',
    display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', zIndex: 1000,
    animation: customAnimation, maxWidth: 420, border: borderStyle,
    ...styleOverride
  };

  return (
    <div className="game-toast-container" style={containerStyle}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-s)', background: (toast.iconUrl || toast.img) ? 'transparent' : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
        {(toast.iconUrl || toast.img) ? (
          <img src={toast.iconUrl || toast.img} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <i className={icon} style={{ fontSize: 16 }}></i>
        )}
      </div>
      <div>
        <div className="t-mini-caps" style={{ color: isAch ? '#fff' : accentText, fontWeight: isAch ? 800 : 600, fontSize: isAch ? 13 : undefined, textShadow: isAch ? '0 0 8px rgba(255,215,0,0.8), 0 0 15px rgba(255,140,0,0.6)' : 'none', letterSpacing: isAch ? '1px' : undefined }}>{title}</div>
        <div className="t-heading-xs" style={{ color: '#fff' }}>{toast[lang] || toast.es}</div>
        {toast.desc_es && (
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
            {toast[`desc_${lang}`] || toast.desc_es}
          </div>
        )}
        {isAch && (
          <div style={{ fontSize: 11, color: 'var(--positive-i100)', fontWeight: 600, marginTop: 2 }}>
            {lang === 'es' ? `+${toast.rewardPercent !== undefined ? toast.rewardPercent : 1}% prod. global permanente` : `+${toast.rewardPercent !== undefined ? toast.rewardPercent : 1}% permanent global prod.`}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ all: 'unset', background: 'rgba(255,255,255,0.1)', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 8, flexShrink: 0, transition: 'background 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>);
}

function StoreUpgradeIcon({ up, canAfford, purchased, onBuy, lang, fmt, onHover, onLeave, draggable, onDragStart, onDragEnter, onDragOver, onDragLeave, onDrop, onDragEnd }) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const rowRef = React.useRef(null);

  const handleEnter = () => {
    setIsHovered(true);
    if (onHover && rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      onHover(up, {
        x: rect.left + rect.width / 2,
        y: rect.top,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    }
  };

  const handleLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    if (onLeave) onLeave();
  };

  return (
    <div
      ref={rowRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => !purchased && canAfford && onBuy(up)}
      onMouseDown={() => !purchased && canAfford && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      draggable={draggable ? "true" : "false"}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        width: '100%', aspectRatio: '1 / 1', maxWidth: 64, padding: 5, boxSizing: 'border-box',
        borderRadius: 'var(--radius-s)',
        position: 'relative',
        background: purchased ? 'var(--positive-i010)' : (canAfford ? 'var(--bg-1)' : 'var(--bg-2)'),
        border: purchased ? '1px solid var(--positive-i100)' : (canAfford ? '1px solid var(--primary-i100)' : '1px solid var(--border-subtle)'),
        boxShadow: (canAfford && !purchased) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
        cursor: purchased ? 'grab' : (canAfford ? 'pointer' : 'not-allowed'),
        opacity: (!purchased && !canAfford) ? 0.65 : 1,
        transform: isPressed ? 'translateY(1px)' : (isHovered ? 'translateY(-1px)' : 'none'),
        transition: 'transform 100ms ease, border-color 150ms ease, background 150ms ease, box-shadow 150ms ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitUserDrag: draggable ? 'element' : 'none'
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: 4, background: purchased ? 'transparent' : (canAfford ? 'var(--alternative-i010)' : 'var(--bg-3)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: purchased ? 'var(--positive-i100)' : (canAfford ? 'var(--alternative-i100)' : 'var(--fg-3)'), overflow: 'hidden', transition: 'background 150ms ease, color 150ms ease', pointerEvents: 'none' }}>
        {up.iconUrl ? <img src={up.iconUrl} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} /> : <i className={`fa-solid ${up.icon || 'fa-store'}`} style={{ fontSize: 24, pointerEvents: 'none' }}></i>}
      </div>
      {purchased && (
        <div style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--positive-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}>
          <i className="fa-solid fa-check" style={{ fontSize: 8 }}></i>
        </div>
      )}
    </div>
  );
}

function VersionLogModal({ onClose, lang }) {
  const versions = (window.VERSION_HISTORY || []).map((item) => ({
    v: item.v,
    date: item.date,
    desc: lang === 'es' ? item.es : item.en
  }));

  return (
    <window.Modal onClose={onClose} maxWidth={650}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <i className="fa-solid fa-clock-rotate-left" style={{ color: '#1a8fff', fontSize: 20 }}></i>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}>{lang === 'es' ? 'Historial de Versiones' : 'Version History'}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: 6 }}>
        {versions.map((v, i) => (
          <div key={v.v + i} style={{ borderLeft: '2px solid #e1e8ef', paddingLeft: 16, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1a8fff', background: 'rgba(26,143,255,0.1)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-sans)' }}>{v.v}</span>
              {v.date && <span style={{ fontSize: 10, color: '#8aaacc', fontFamily: 'var(--font-sans)' }}>{v.date}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.5, fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: v.desc }} />
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ ...primaryBtnStyle, flex: 'none', width: '100%', marginTop: 20 }}>
        {lang === 'es' ? 'Volver' : 'Back'}
      </button>
    </window.Modal>
  );
}
function LegalModal({ onClose, lang }) {
  const content = {
    title: lang === 'es' ? 'Aviso Legal y Privacidad' : 'Legal Notice & Privacy',
    sections: [
      {
        title: lang === 'es' ? '1. Privacidad de la Información' : '1. Information Privacy',
        body: lang === 'es'
          ? 'El juego no utiliza, almacena ni recopila datos sensibles, confidenciales o privados de clínicas, pacientes, colaboradores ni de ninguna entidad relacionada con Healthatom o sus filiales. Toda la interacción del usuario se procesa sin vincularse a expedientes médicos o administrativos reales.'
          : 'The game does not use, store, or collect sensitive, confidential, or private data of clinics, patients, collaborators, or any entity related to Healthatom or its affiliates. All user interaction is processed without linking to real medical or administrative records.'
      },
      {
        title: lang === 'es' ? '2. Naturaleza del Contenido' : '2. Nature of the Content',
        body: lang === 'es'
          ? 'Toda la información, mecánicas y elementos educativos presentes en el juego tienen un propósito estrictamente de aprendizaje y entretenimiento. Dicho contenido ha sido elaborado a partir de información de carácter general y extraída de fuentes y documentación públicas pertenecientes a Healthatom, Medlink, Dentalink y Gerty.'
          : 'All information, mechanics, and educational elements present in the game have a strict learning and entertainment purpose. Such content has been developed from general information and extracted from public sources and documentation belonging to Healthatom, Medlink, Dentalink, and Gerty.'
      },
      {
        title: lang === 'es' ? '3. Comunicaciones y Datos Personales' : '3. Communications & Personal Data',
        body: lang === 'es'
          ? 'Garantizamos que el juego en ningún momento enviará ningún tipo de correo electrónico (email) ni solicitará información personal, de contacto, ubicación o financiera a ningún jugador. La experiencia está diseñada íntegramente para preservar el anonimato y la seguridad digital del usuario en todo momento.'
          : 'We guarantee that the game will at no time send any kind of email or request personal, contact, location, or financial information from any player. The experience is entirely designed to preserve the anonymity and digital security of the user at all times.'
      },
      {
        title: lang === 'es' ? '4. Gratuidad del Servicio' : '4. Free Service',
        body: lang === 'es'
          ? '"ToothClicker" ha sido concebido, diseñado y publicado para ser disfrutado de forma cien por ciento (100%) gratuita. No existen compras ocultas, suscripciones, microtransacciones ni requerimientos de pago bajo ninguna circunstancia, garantizando un acceso equitativo para todos.'
          : '"ToothClicker" has been conceived, designed, and published to be enjoyed one hundred percent (100%) for free. There are no hidden purchases, subscriptions, microtransactions, or payment requirements under any circumstances, ensuring equitable access for all.'
      }
    ]
  };

  return (
    <window.Modal onClose={onClose} maxWidth={650}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <i className="fa-solid fa-scale-balanced" style={{ color: '#1a8fff', fontSize: 20 }}></i>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}>{content.title}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: 6 }}>
        {content.sections.map((sec, i) => (
          <div key={i} style={{ borderLeft: '2px solid #e1e8ef', paddingLeft: 16, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a8fff', fontFamily: 'var(--font-sans)' }}>{sec.title}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.6, fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap', opacity: 0.9 }}>
              {sec.body}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 8, fontStyle: 'italic', fontFamily: 'var(--font-sans)', opacity: 0.8 }}>
          {lang === 'es'
            ? 'Al utilizar esta aplicación, reconoces haber leído y comprendido este aviso legal, aceptando que el propósito de esta plataforma es puramente lúdico y educativo.'
            : 'By using this application, you acknowledge having read and understood this legal notice, accepting that the purpose of this platform is purely playful and educational.'}
        </div>
      </div>
      <button onClick={onClose} style={{ ...primaryBtnStyle, flex: 'none', width: '100%', marginTop: 24 }}>
        {lang === 'es' ? 'Entendido' : 'Understood'}
      </button>
    </window.Modal>
  );
}

function AboutModal({ onClose, lang }) {
  const [showLog, setShowLog] = React.useState(false);
  const [showLegal, setShowLegal] = React.useState(false);
  const versions = (window.VERSION_HISTORY || []).map((item) => ({
    v: item.v,
    date: item.date,
    desc: lang === 'es' ? item.es : item.en,
    latest: item.latest
  }));

  if (showLog) return <VersionLogModal onClose={() => setShowLog(false)} lang={lang} />;
  if (showLegal) return <LegalModal onClose={() => setShowLegal(false)} lang={lang} />;

  return (
    <window.Modal onClose={onClose} maxWidth={480}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 300, maxWidth: 600, minHeight: 0 }}>
        <img src={window.GAME_CONTENT?.terminology?.images?.logoVertical || "uploads/logo-vertical.png"} alt="ToothClicker" style={{ width: 180, objectFit: 'contain', marginBottom: 8, flexShrink: 0 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)', marginBottom: 16, flexShrink: 0, padding: "20px 0px" }}>
          {lang === 'es' ? 'Creado por Jaime Arias' : 'Created by Jaime Arias'}
        </div>
        <div style={{ width: '100%', borderTop: '1.5px dashed #d0dce8', marginBottom: 16, flexShrink: 0 }} />
        <div style={{ width: '100%' }}>
          {(() => {
            const latest = versions[0];
            if (!latest) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#1a8fff', padding: '4px 14px', borderRadius: 999, fontFamily: 'var(--font-sans)' }}>{latest.v}</span>
                {latest.date && <span style={{ fontSize: 11, color: '#aac0d4', fontFamily: 'var(--font-sans)' }}>{latest.date}</span>}
                <button
                  onClick={() => setShowLog(true)}
                  style={{ all: 'unset', color: '#1a8fff', fontSize: 12, fontWeight: 600, marginTop: 10, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-sans)' }}
                >
                  {lang === 'es' ? 'Ver log de versiones' : 'View version log'}
                </button>
                <button
                  onClick={() => setShowLegal(true)}
                  style={{ all: 'unset', color: '#1a8fff', fontSize: 12, fontWeight: 600, marginTop: 4, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-sans)' }}
                >
                  {lang === 'es' ? 'Legal' : 'Legal'}
                </button>
              </div>);
          })()}
        </div>
        <button onClick={onClose} style={{ all: 'unset', boxSizing: 'border-box', marginTop: 24, width: '100%', textAlign: 'center', padding: '13px 0', borderRadius: 999, background: '#1a8fff', color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: "'PixelifySans', var(--font-sans)", cursor: 'pointer', flexShrink: 0 }}>
          {lang === 'es' ? 'Cerrar' : 'Close'}
        </button>
      </div>
    </window.Modal>);
}

function GameTour({ step, lang, onNext, onPrev, onClose, dontShowAgain, onToggleShowAgain }) {
  const t = window.STRINGS[lang];
  const [closing, setClosing] = React.useState(false);

  React.useEffect(() => {
    setClosing(false);
  }, [step]);
  const steps = [
    {
      targetId: null,
      title: { es: '¡Bienvenido a Tooth Clicker!', en: 'Welcome to Tooth Clicker!' },
      desc: { es: 'Prepárate para convertirte en el magnate dental definitivo. 🦷✨', en: 'Get ready to become the ultimate dental tycoon. 🦷✨' }
    },
    {
      targetId: 'main-tooth-target',
      title: { es: '¡Dale caña!', en: 'Go for it!' },
      desc: { es: 'Haz click en este diente para empezar a recolectar piezas. ¡Cada click cuenta!', en: 'Click on this tooth to start collecting pieces. Every click counts!' }
    },
    {
      targetId: 'game-tabs-tour',
      title: { es: 'Progreso constante', en: 'Constant progress' },
      desc: { es: 'Aquí es donde ocurre la magia. Compra clínicas, desbloquea mejoras locas y presume de tus logros dentales.', en: 'This is where the magic happens. Buy clinics, unlock crazy upgrades, and show off your dental achievements.' }
    },
    {
      targetId: 'tab-prestige',
      title: { es: 'Poder ancestral', en: 'Ancient power' },
      desc: { es: '¿Listo para el siguiente nivel? El prestigio te da bonus permanentes que te harán imparable.', en: 'Ready for the next level? Prestige gives you permanent bonuses that will make you unstoppable.' }
    },
    {
      targetId: 'tab-leaderboard',
      title: { es: 'La cima te espera', en: 'The top awaits' },
      desc: { es: 'Mira cómo te comparas con otros dentistas de todo el mundo en tiempo real.', en: 'See how you compare with other dentists around the world in real time.' }
    },
    {
      targetId: 'manual-tour-trigger',
      title: { es: 'Siempre aquí para ayudarte', en: 'Always here to help' },
      desc: { es: 'Si alguna vez necesitas repasar algo, puedes volver a iniciar este tour haciendo click en este icono de ayuda. ¡A cepillar!', en: 'If you ever need to review anything, you can restart this tour by clicking this help icon. Happy brushing!' }
    }
  ];

  const current = steps[step];
  if (!current) return null;

  const [rect, setRect] = React.useState(null);

  React.useLayoutEffect(() => {
    if (current.targetId) {
      const el = document.getElementById(current.targetId);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    } else {
      setRect(null);
    }
  }, [step, current.targetId]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 250);
  };

  const modalStyle = rect ? {
    position: 'fixed',
    left: rect.left + rect.width / 2,
    top: rect.bottom + 20,
    transform: 'translateX(-50%)',
    zIndex: 10000,
    width: 320
  } : {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10000,
    width: 380
  };

  // Adjust for edges
  if (rect) {
    if (modalStyle.left - 160 < 20) modalStyle.left = 180;
    if (modalStyle.left + 160 > window.innerWidth - 20) modalStyle.left = window.innerWidth - 180;
    if (modalStyle.top + 200 > window.innerHeight - 20) modalStyle.top = rect.top - 220;
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: closing ? 'none' : 'auto',
      animation: closing ? 'fadeOut 250ms forwards' : 'fadeIn 300ms forwards',
      display: rect ? 'block' : 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Blurred and dimmed overlay with a hole cut out */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(5,9,13,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        transition: 'clip-path 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        clipPath: rect ? `polygon(
          0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 
          ${rect.left - 8}px ${rect.top - 8}px, 
          ${rect.left - 8}px ${rect.bottom + 8}px, 
          ${rect.right + 8}px ${rect.bottom + 8}px, 
          ${rect.right + 8}px ${rect.top - 8}px, 
          ${rect.left - 8}px ${rect.top - 8}px
        )` : 'none'
      }} />

      {/* Highlight border and glow */}
      {rect && (
        <div style={{
          position: 'fixed',
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          border: '2px solid var(--primary-i100)',
          boxShadow: '0 0 40px var(--primary-i100)',
          borderRadius: 12,
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: closing ? 0 : 1
        }} />
      )}

      {/* Modal Container: Handles fixed positioning if rect exists, else flex centering handles it */}
      <div style={rect ? {
        position: 'fixed',
        left: modalStyle.left,
        top: modalStyle.top,
        transform: modalStyle.transform,
        zIndex: 10000,
        width: modalStyle.width
      } : {
        position: 'relative',
        zIndex: 10000,
        width: modalStyle.width
      }}>
        <div className="tour-modal" style={{
          background: 'var(--bg-1)',
          padding: 'var(--spacing-6)',
          borderRadius: 'var(--radius-l)',
          boxShadow: 'var(--elevation-30)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: closing ? 'modalOut 250ms forwards' : 'modalIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-i100)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'es' ? `Paso ${step + 1} de ${steps.length}` : `Step ${step + 1} of ${steps.length}`}
            </span>
            <button onClick={handleClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--fg-3)', fontSize: 18 }} className="hover-bg-danger">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="t-heading-m" style={{ color: 'var(--fg-1)' }}>{current.title[lang] || current.title.es}</div>
          <div className="t-body-m" style={{ color: 'var(--fg-2)', lineHeight: 1.5 }}>{current.desc[lang] || current.desc.es}</div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={dontShowAgain} onChange={onToggleShowAgain} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 500 }}>{lang === 'es' ? 'No volver a mostrar' : 'Don\'t show again'}</span>
            </label>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button onClick={onPrev} style={secondaryBtnStyle}>
                {lang === 'es' ? 'Anterior' : 'Previous'}
              </button>
            )}
            <button onClick={step === steps.length - 1 ? handleClose : onNext} style={primaryBtnStyle}>
              {step === steps.length - 1 ? (lang === 'es' ? '¡Entendido!' : 'Got it!') : (lang === 'es' ? 'Siguiente' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Dropdown({ value, onChange, options, style, disabled = false, searchable = false, placeholder = "Buscar..." }) {
  const [isOpen, setIsOpen] = useStateC(false);
  const [rect, setRect] = useStateC(null);
  const [searchTerm, setSearchTerm] = useStateC('');
  const dropdownRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const updatePosition = React.useCallback(() => {
    if (dropdownRef.current) {
      setRect(dropdownRef.current.getBoundingClientRect());
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => {
        updatePosition();
      };
      // Usar capture = true para interceptar todos los scrolls (incluso de contenedores internos)
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setSearchTerm('');
    }
    setIsOpen(!isOpen);
  };

  React.useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(o => String(o.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : 'Selecciona...';

  let portalStyle = {};
  if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < 250 && spaceAbove > spaceBelow;

    portalStyle = {
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    };

    if (dropUp) {
      portalStyle.bottom = window.innerHeight - rect.top + 4;
    } else {
      portalStyle.top = rect.bottom + 4;
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        style={{
          all: 'unset', boxSizing: 'border-box', width: '100%', padding: '12px 16px',
          background: disabled ? 'var(--bg-2)' : 'var(--bg-1)',
          borderRadius: 14, fontSize: 14, border: isOpen ? '2px solid var(--primary-i100)' : '2px solid var(--border-default)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'var(--font-sans)',
          color: 'var(--fg-1)', boxShadow: isOpen ? '0 0 0 4px rgba(0,118,219,0.15), 0 4px 12px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayLabel}</span>
        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: 'var(--primary-i100)', fontSize: 12, marginLeft: 8 }}></i>
      </button>

      {isOpen && ReactDOM.createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
            onMouseDown={(e) => { e.stopPropagation(); setIsOpen(false); }}
          />
          <div style={{
            ...portalStyle,
            background: 'var(--bg-1)', border: '1px solid var(--border-default)', borderRadius: 12,
            boxShadow: 'var(--elevation-20)',
            maxHeight: 250, display: 'flex', flexDirection: 'column'
          }}>
            {searchable && (
              <div style={{ padding: 8, borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)', fontSize: 12 }}></i>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={placeholder}
                    onKeyDown={e => e.stopPropagation()}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '6px 10px 6px 28px',
                      borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-2)',
                      color: 'var(--fg-1)', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}
            <div style={{ overflowY: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {options.filter(opt => !searchable || !searchTerm || (opt.label || '').toString().toLowerCase().includes(searchTerm.toLowerCase())).map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
                  style={{
                    all: 'unset', boxSizing: 'border-box', padding: '10px 12px',
                    borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    background: String(value) === String(opt.value) ? 'var(--primary-i010)' : 'transparent',
                    color: String(value) === String(opt.value) ? 'var(--primary-i100)' : 'var(--fg-1)',
                    fontWeight: String(value) === String(opt.value) ? 600 : 500,
                    transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (String(value) !== String(opt.value)) {
                      e.currentTarget.style.background = 'var(--bg-2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (String(value) !== String(opt.value)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
              {options.filter(opt => !searchable || !searchTerm || (opt.label || '').toString().toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>
                  No hay opciones
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

const OdometerChar = React.memo(function OdometerChar({ char }) {
  const isDigit = /^[0-9]$/.test(char);
  if (!isDigit) {
    return <span style={{ display: 'inline-block', height: '1em', lineHeight: '1em', verticalAlign: 'bottom' }}>{char}</span>;
  }
  return (
    <span style={{ display: 'inline-block', height: '1em', overflow: 'hidden', verticalAlign: 'bottom' }}>
      <span style={{
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: `translateY(-${parseInt(char, 10)}em)`,
        willChange: 'transform'
      }}>
        {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <span key={d} style={{ height: '1em', lineHeight: '1em', textAlign: 'center' }}>{d}</span>
        ))}
      </span>
    </span>
  );
});

function Odometer({ value, formatFn, className, style, ...props }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setDisplayValue(value);
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const str = formatFn ? formatFn(displayValue) : (window.formatNum ? window.formatNum(displayValue) : String(displayValue));
  return (
    <span className={className} style={{ display: 'inline-flex', verticalAlign: 'bottom', fontVariantNumeric: 'tabular-nums', ...style }} {...props}>
      {str.split('').map((char, i) => {
        const posFromEnd = str.length - i;
        return <OdometerChar key={posFromEnd} char={char} />;
      })}
    </span>
  );
}

window.Tooth3DViewer = function ({ glbData, textureUrl, onClick, onPointerDownOut, onPointerUpOut, style, className, animateFloat = true, onModelLoaded, modelScale = 2.4, disableRotation = false, isometric = false }) {
  const mountRef = React.useRef(null);
  const onClickRef = React.useRef(onClick);
  const animateFloatRef = React.useRef(animateFloat);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  React.useEffect(() => {
    animateFloatRef.current = animateFloat;
  }, [animateFloat]);

  React.useEffect(() => {
    if (!window.THREE) {
      setError("Three.js not loaded");
      return;
    }
    if (!window.THREE.GLTFLoader) {
      setError("GLTFLoader not loaded");
      return;
    }

    const { THREE } = window;
    const width = mountRef.current.clientWidth || 260;
    const height = mountRef.current.clientHeight || 260;

    let scene = new THREE.Scene();

    // Transparent background, preserve drawing buffer for snapshot extraction
    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    let camera;
    if (isometric) {
      const aspect = width / height;
      const frustumSize = 5;
      camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        -100, 100
      );
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
    } else {
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 5;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    let mesh = null;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let hasMoved = false;
    let animationFrameId;
    let rotationVelocity = 0;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (mesh) {
        if (animateFloatRef.current) {
          time += 0.03;
          // Floating up and down
          mesh.position.y = Math.sin(time) * 0.12;
        } else {
          mesh.position.y += (0 - mesh.position.y) * 0.1;
        }

        if (!isDragging) {
          if (Math.abs(rotationVelocity) > 0.001 && !disableRotation) {
            mesh.rotation.y += rotationVelocity;
            rotationVelocity *= 0.95; // Friction
          } else {
            rotationVelocity = 0;
          }
        }
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      }
    };
    animate();

    const loader = new THREE.GLTFLoader();

    // Add Draco support for optimized GLBs
    let dracoLoader = null;
    if (window.THREE.DRACOLoader) {
      dracoLoader = new window.THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
      loader.setDRACOLoader(dracoLoader);
    }

    let isMounted = true;

    const disposeMaterial = (mat) => {
      if (!mat) return;
      for (const key of Object.keys(mat)) {
        const value = mat[key];
        if (value && typeof value === 'object' && value.dispose) {
          try {
            value.dispose();
          } catch (e) { }
        }
      }
      if (mat.dispose) {
        try {
          mat.dispose();
        } catch (e) { }
      }
    };

    loader.load(glbData, (gltf) => {
      if (!isMounted) {
        // Dispose GLTF right away if component unmounted while loading
        gltf.scene.traverse((object) => {
          if (object.isMesh) {
            if (object.geometry) {
              try { object.geometry.dispose(); } catch (e) { }
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(disposeMaterial);
              } else {
                disposeMaterial(object.material);
              }
            }
          }
        });
        return;
      }

      const object = gltf.scene;

      // Center and scale
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      const scale = modelScale / maxDim; // Adjust scale based on prop
      object.scale.set(scale, scale, scale);
      object.position.sub(center.multiplyScalar(scale));
      object.rotation.y = -Math.PI / 2; // Rotate 90 degrees to face front

      // Do not apply external texture. Let the GLB use its own baked materials.

      // Add a soft circular shadow underneath the model to look floating
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const ctx = shadowCanvas.getContext('2d');
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(0,0,0,0.25)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);

      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowMaterial = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), shadowMaterial);
      shadowMesh.rotation.x = -Math.PI / 2; // Flat on the floor
      shadowMesh.position.y = -1.4; // Slightly below the scaled model
      if (scene) scene.add(shadowMesh);

      // Wrap in a group for rotation
      mesh = new THREE.Group();
      mesh.add(object);
      if (scene) scene.add(mesh);

      // Take snapshot if requested
      if (onModelLoaded) {
        // Force a render so the canvas has the model drawn
        if (renderer && scene && camera) {
          const oldAspect = camera.aspect;
          const oldFov = camera.fov;
          const oldWidth = mountRef.current.clientWidth || 260;
          const oldHeight = mountRef.current.clientHeight || 260;

          // Temporarily render as square to get a perfect icon snapshot without clipping
          renderer.setSize(256, 256);
          camera.aspect = 1;
          camera.fov = 38; // Zoom out slightly to avoid cutting off
          camera.updateProjectionMatrix();

          renderer.render(scene, camera);
          const dataUrl = renderer.domElement.toDataURL('image/png');
          onModelLoaded(dataUrl);

          // Restore
          renderer.setSize(oldWidth, oldHeight);
          camera.aspect = oldAspect;
          camera.fov = oldFov;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        }
      }
    }, undefined, (err) => {
      console.error(err);
      setError("Invalid GLB data");
    });

    const onPointerDown = (e) => {
      e.preventDefault(); // Stop native dragging
      if (mountRef.current) mountRef.current.style.cursor = 'grabbing';
      isDragging = true;
      hasMoved = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      previousMousePosition = { x: clientX, y: clientY };
      if (onPointerDownOut) onPointerDownOut(e);
    };

    const onPointerMove = (e) => {
      if (isDragging && mesh) {
        e.preventDefault(); // Prevent scrolling while rotating
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaMove = clientX - previousMousePosition.x;

        if (!disableRotation) {
          hasMoved = true;
          mesh.rotation.y += deltaMove * 0.01;
          rotationVelocity = deltaMove * 0.01;
        } else {
          if (Math.abs(deltaMove) > 5) hasMoved = true;
        }

        previousMousePosition = { x: clientX, y: previousMousePosition.y };
      }
    };

    const onPointerUp = (e) => {
      if (isDragging && !hasMoved) {
        // Raycaster for click
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const rect = renderer.domElement.getBoundingClientRect();
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(mesh, true);

        if (intersects.length > 0) {
          // Reset rotation briefly for visual effect
          mesh.scale.setScalar(0.96);
          setTimeout(() => {
            if (mesh) {
              mesh.scale.setScalar(1.0);
            }
          }, 100);

          const mockEvent = {
            clientX,
            clientY,
            currentTarget: mountRef.current
          };
          if (onClickRef.current) onClickRef.current(mockEvent);
        }
      }
      isDragging = false;
      hasMoved = false;
      if (mountRef.current) mountRef.current.style.cursor = 'pointer';
      if (onPointerUpOut) onPointerUpOut(e);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && renderer && camera) {
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }
    });
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    return () => {
      isMounted = false;
      canvas.removeEventListener('mousedown', onPointerDown);
      canvas.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvas.removeEventListener('touchstart', onPointerDown);
      canvas.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      resizeObserver.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      // Memory cleanup: Traverse and dispose everything
      if (scene) {
        scene.traverse((object) => {
          if (object.geometry) {
            try { object.geometry.dispose(); } catch (e) { }
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(disposeMaterial);
            } else {
              disposeMaterial(object.material);
            }
          }
        });
      }

      if (dracoLoader) {
        try { dracoLoader.dispose(); } catch (e) { }
      }

      if (mountRef.current) mountRef.current.innerHTML = '';
      if (renderer) {
        try { renderer.dispose(); } catch (e) { }
      }

      // Nullify all references for GC
      scene = null;
      renderer = null;
      camera = null;
      mesh = null;
      dracoLoader = null;
    };
  }, [glbData]);

  if (error) {
    return <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ff000022' }} className={className}>Error 3D: {error}</div>;
  }

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'pointer', ...style }} className={className} />
  );
};

function InteractiveClinicMap({ state, onAssetAction }) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);

  const latestState = React.useRef(state);
  latestState.current = state;

  const [hoveredAsset, setHoveredAsset] = React.useState(null);
  const hoverTimeoutRef = React.useRef(null);
  const [floatingTexts, setFloatingTexts] = React.useState([]);
  const [openUpgradeMenu, setOpenUpgradeMenu] = React.useState(null);

  const addFloatingText = (x, y, text) => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  };

  const pos = React.useRef({ x: 0, y: 0 });
  const vel = React.useRef({ x: 0, y: 0 });
  const scale = React.useRef({ current: 1, target: 1 });
  const zoomCenter = React.useRef(null);

  const isDragging = React.useRef(false);
  const lastMouse = React.useRef({ x: 0, y: 0 });
  const rafRef = React.useRef(null);
  const imageSize = { w: 4096, h: 2286 };

  // Validate placed assets on load to recycle items placed on invalid/unpurchased tiles
  React.useEffect(() => {
    if (!state?.placedClinicAssets) return;

    const floorTileIds = (window.CLINIC_TILES || []).filter(d => d.type === 'floor').map(d => d.id);
    const mapTiles = [...(window.CLINIC_MAP_TILES || [])];
    const areas = window.GAME_CONTENT?.clinicAreas || [];
    const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
    const purchasedAreas = state.purchasedAreas || [];

    mapAreas.forEach(inst => {
      const areaDef = areas.find(a => a.id === inst.areaId);
      const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
      if (isUnlocked) {
        if (areaDef && areaDef.tiles) {
          areaDef.tiles.forEach(t => {
            mapTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true });
          });
        }
      }
    });

    const isTileValidLocal = (lx, ly, assetId) => {
      const tempSvgX = lx + 6144;
      const tempSvgY = ly + 3429;
      const tempUnscaledY = tempSvgY / 0.57735;
      const tempGx = (tempSvgX + tempUnscaledY) * 0.70710678;
      const tempGy = (-tempSvgX + tempUnscaledY) * 0.70710678;
      const qx = Math.floor((tempGx - 8400) / 200);
      const qy = Math.floor((tempGy + 3200) / 200);

      const localGx = (tempGx - 8400) - (qx * 200);
      const localGy = (tempGy + 3200) - (qy * 200);

      const tileDefsObj = mapTiles.filter(t => t.x === qx && t.y === qy);
      const tileDefs = tileDefsObj.map(t => t.id);
      const hasFloor = tileDefs.some(id => floorTileIds.includes(id)) || tileDefsObj.some(t => t.isArea && (!t.type || t.type === 'floor' || window.CLINIC_TILES?.find(d => d.id === t.id)?.type === 'floor'));
      let wallCollision = false;
      for (let id of tileDefs) {
        if (id === 'wall_custom' && localGy < 25) wallCollision = true;
        if (id === 'wall_custom_y' && localGx < 25) wallCollision = true;
      }

      const assetDef = assetId ? (window.CLINIC_ASSETS || []).find(a => a.id === assetId) : null;
      if (assetDef && assetDef.isWallAsset) {
        return wallCollision;
      }

      return hasFloor && !wallCollision;
    };

    let needsRecycle = [];
    Object.entries(state.placedClinicAssets).forEach(([id, inst]) => {
      const asset = (window.CLINIC_ASSETS || []).find(a => a.id === inst.assetId);
      let abottom = 60;
      if (asset && asset.shadowParams && asset.shadowParams.imgHeight) {
        const s = 0.85 * (asset.scale || 1);
        abottom = (asset.shadowParams.imgHeight / 2) * s * 0.85;
      }

      let isValid = isTileValidLocal(inst.x, inst.y, inst.assetId);
      if (isValid && (!asset || !asset.isWallAsset)) {
        isValid = isTileValidLocal(inst.x, inst.y + abottom, inst.assetId);
      }

      if (!isValid) {
        needsRecycle.push(id);
      }
    });

    if (needsRecycle.length > 0) {
      onAssetAction && onAssetAction('recycle_multiple', needsRecycle);
    }
    // We only run this when the components mount or the map area definition updates to clean up bad assets.
  }, [state?.purchasedAreas, window.GAME_CONTENT?.clinicMapAreas]);

  const enforceBounds = (p, currentScale) => {
    if (!containerRef.current) return p;
    const rect = containerRef.current.getBoundingClientRect();

    // Limits computed based on the expanded isometric background
    const boundMinX = Math.min(rect.width - 7000 * currentScale, 3000 * currentScale);
    const boundMaxX = Math.max(rect.width - 7000 * currentScale, 3000 * currentScale);
    const boundMinY = Math.min(rect.height - 4000 * currentScale, 2000 * currentScale);
    const boundMaxY = Math.max(rect.height - 4000 * currentScale, 2000 * currentScale);

    return {
      x: Math.max(boundMinX, Math.min(boundMaxX, p.x)),
      y: Math.max(boundMinY, Math.min(boundMaxY, p.y))
    };
  };

  React.useEffect(() => {
    let baseScale = 0.1;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const initialScale = rect.height / imageSize.h;
      baseScale = initialScale;

      scale.current.current = initialScale;
      scale.current.target = initialScale;

      pos.current = enforceBounds({
        x: (rect.width - imageSize.w * initialScale) / 2,
        y: (rect.height - imageSize.h * initialScale) / 2
      }, initialScale);

      updateTransform();
      startPhysicsLoop();
    }

    const handleWheel = (e) => {
      // Solo hacer zoom si se mantiene presionado CMD (Mac) o CTRL (Windows)
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      if (!containerRef.current) return;

      // Acumulador para scroll de trackpad (evitar saltar múltiples niveles muy rápido)
      if (!window.__zoomAccum) window.__zoomAccum = 0;
      window.__zoomAccum += e.deltaY;

      if (Math.abs(window.__zoomAccum) < 30) return;
      const isZoomingIn = window.__zoomAccum < 0;
      window.__zoomAccum = 0; // Reset

      const rect = containerRef.current.getBoundingClientRect();
      zoomCenter.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // Niveles discretos de zoom
      const minScale = baseScale * 0.5;
      let levels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
      levels = levels.filter(l => l >= minScale);
      if (levels[0] > minScale) levels.unshift(minScale);

      // Encontrar el nivel actual más cercano
      let currIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < levels.length; i++) {
        const diff = Math.abs(levels[i] - scale.current.target);
        if (diff < minDiff) {
          minDiff = diff;
          currIdx = i;
        }
      }

      // Mover un nivel de zoom
      if (isZoomingIn) {
        currIdx = Math.min(levels.length - 1, currIdx + 1);
      } else {
        currIdx = Math.max(0, currIdx - 1);
      }

      scale.current.target = levels[currIdx];
      startPhysicsLoop();
    };

    const node = containerRef.current;
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: false });
    }

    const onDropAsset = (e) => {
      const { id, clientX, clientY, offsetX, offsetY } = e.detail;
      if (!containerRef.current || !onAssetAction) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        let finalFlipX = e.detail.flipX;
        let localX, localY;
        let is3D = false;

        if (window.getClinicMapParams && window.getClinicMapParams().get3DSnappedCoords) {
          const mapParams = window.getClinicMapParams();
          const snapped = mapParams.get3DSnappedCoords(clientX, clientY);
          if (!snapped) return;
          
          if (!mapParams.isTileValidLocal(0, 0, id, clientX, clientY)) return;

          // Convert 3D grid cell (snapped.localX, snapped.localY) to SVG coordinates for backwards-compatible storage
          const gx = snapped.localX + 8400; // snapped.localX is px (which is qx * 200)
          const gy = snapped.localY - 3200; // snapped.localY is pz (which is qy * 200)
          const newSvgX = (gx - gy) * 0.70710678;
          const newSvgY = (gx + gy) * 0.408248;
          localX = newSvgX - 6144;
          localY = newSvgY - 3429;
          
          is3D = true;
        } else {
          let targetClientX = clientX - (offsetX || 0);
          let targetClientY = clientY - (offsetY || 0);
          localX = (targetClientX - rect.left - pos.current.x) / scale.current.current;
          localY = (targetClientY - rect.top - pos.current.y) / scale.current.current;

          // Convert to exact SVG cartesian coordinates
          const svgX = localX + 6144;
          const svgY = localY + 3429;
          const unscaledY = svgY / 0.57735;
          let gx = (svgX + unscaledY) * 0.70710678;
          let gy = (-svgX + unscaledY) * 0.70710678;

          // Clamp to 30x30 major tiles (200x200 each => 6000x6000 cartesian)
          gx = Math.max(8400, Math.min(14400, gx));
          gy = Math.max(-3200, Math.min(2800, gy));

          let originalGx = gx;
          let originalGy = gy;

          if (window.getClinicMapParams) {
            const mapParams = window.getClinicMapParams();
            if (mapParams.snapAsset) {
              const snapRes = mapParams.snapAsset(gx, gy, id);
              gx = snapRes.gx;
              gy = snapRes.gy;
              if (snapRes.flipX !== null) {
                finalFlipX = snapRes.flipX;
              }
            }
          }

          if (gx !== originalGx || gy !== originalGy) {
            const newSvgX = (gx - gy) * 0.70710678;
            const newSvgY = (gx + gy) * 0.408248;
            localX = newSvgX - 6144;
            localY = newSvgY - 3429;
          }
        }

        const isTileValid = (lx, ly) => {
          if (is3D) return true; // Already validated
          const tempSvgX = lx + 6144;
          const tempSvgY = ly + 3429;
          const tempUnscaledY = tempSvgY / 0.57735;
          const tempGx = (tempSvgX + tempUnscaledY) * 0.70710678;
          const tempGy = (-tempSvgX + tempUnscaledY) * 0.70710678;
          const qx = Math.floor((tempGx - 8400) / 200);
          const qy = Math.floor((tempGy + 3200) / 200);

          const localGx = (tempGx - 8400) - (qx * 200);
          const localGy = (tempGy + 3200) - (qy * 200);

          const floorTileIds = (window.CLINIC_TILES || []).filter(d => d.type === 'floor').map(d => d.id);
          const mapTiles = [...(window.CLINIC_MAP_TILES || [])];

          const areas = window.GAME_CONTENT?.clinicAreas || [];
          const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
          const purchasedAreas = latestState.current?.purchasedAreas || [];

          mapAreas.forEach(inst => {
            const areaDef = areas.find(a => a.id === inst.areaId);
            const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
            if (isUnlocked) {
              if (areaDef && areaDef.tiles) {
                areaDef.tiles.forEach(t => {
                  mapTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true });
                });
              }
            }
          });

          const tileDefsObj = mapTiles.filter(t => t.x === qx && t.y === qy);
          const tileDefs = tileDefsObj.map(t => t.id);
          const hasFloor = tileDefs.some(id => floorTileIds.includes(id)) || tileDefsObj.some(t => t.isArea && (!t.type || t.type === 'floor' || window.CLINIC_TILES?.find(d => d.id === t.id)?.type === 'floor'));

          let wallCollision = false;
          for (let tid of tileDefs) {
            if (tid === 'wall_custom' && localGy < 25) wallCollision = true;
            if (tid === 'wall_custom_y' && localGx < 25) wallCollision = true;
          }

          let actualAssetId = id;
          if (latestState.current?.placedClinicAssets?.[id]) actualAssetId = latestState.current.placedClinicAssets[id].assetId;
          else if (latestState.current?.recycledClinicAssets?.find(a => a.instanceId === id)) actualAssetId = latestState.current.recycledClinicAssets.find(a => a.instanceId === id).assetId;

          const assetDef = actualAssetId ? (window.CLINIC_ASSETS || []).find(a => a.id === actualAssetId) : null;
          if (assetDef && assetDef.isWallAsset) {
            return wallCollision;
          }

          return hasFloor && !wallCollision;
        };

        let actualAssetId = id;
        if (latestState.current?.placedClinicAssets?.[id]) actualAssetId = latestState.current.placedClinicAssets[id].assetId;
        else if (latestState.current?.recycledClinicAssets?.find(a => a.instanceId === id)) actualAssetId = latestState.current.recycledClinicAssets.find(a => a.instanceId === id).assetId;
        const asset = (window.CLINIC_ASSETS || []).find(a => a.id === actualAssetId);
        let abottom = 60;
        if (asset && asset.shadowParams && asset.shadowParams.imgHeight) {
          const s = 0.85 * (asset.scale || 1);
          abottom = (asset.shadowParams.imgHeight / 2) * s * 0.85;
        }

        let isValid = isTileValid(localX, localY);
        if (isValid && (!asset || !asset.isWallAsset)) {
          isValid = isTileValid(localX, localY + abottom);
        }

        if (!isValid) {
          return;
        }

        if (!e.detail.isFromMap && !e.detail.isRecycledInst) {
          const asset = (window.CLINIC_ASSETS || []).find(a => a.id === id);
          const count = latestState.current.purchasedClinicAssetsCount?.[asset?.id] || 0;
          const interest = asset?.interestRate !== undefined ? asset.interestRate : 1.15;
          const price = Math.floor((asset?.price || 0) * Math.pow(interest, count));
          if ((latestState.current.teeth || 0) >= price) {
            addFloatingText(localX, localY - 80, `-${window.formatNumber ? window.formatNumber(price) : price}`);
            if (window.playTone) {
              window.playTone(1200, 0.05, 'square', 0.1);
              setTimeout(() => window.playTone(1600, 0.1, 'square', 0.1), 80);
            }
          }
        }

        if (e.detail.isRecycledInst) {
          onAssetAction('place_recycle', id, localX, localY, finalFlipX);
        } else if (e.detail.isFromMap) {
          onAssetAction('move', id, localX, localY, finalFlipX);
        } else {
          onAssetAction('place', id, localX, localY, finalFlipX);
        }
      }
    };
    window.addEventListener('clinicAssetDrop', onDropAsset);

    window.getClinicMapParams = () => {
      if (!containerRef.current) return null;
      return {
        rect: containerRef.current.getBoundingClientRect(),
        pos: pos.current,
        scale: scale.current.current,
        isTileValidLocal: (lx, ly, assetId) => {
          const tempSvgX = lx + 6144;
          const tempSvgY = ly + 3429;
          const tempUnscaledY = tempSvgY / 0.57735;
          const tempGx = (tempSvgX + tempUnscaledY) * 0.70710678;
          const tempGy = (-tempSvgX + tempUnscaledY) * 0.70710678;
          const qx = Math.floor((tempGx - 8400) / 200);
          const qy = Math.floor((tempGy + 3200) / 200);

          const localGx = (tempGx - 8400) - (qx * 200);
          const localGy = (tempGy + 3200) - (qy * 200);

          const floorTileIds = (window.CLINIC_TILES || []).filter(d => d.type === 'floor').map(d => d.id);
          const mapTiles = [...(window.CLINIC_MAP_TILES || [])];
          const areas = window.GAME_CONTENT?.clinicAreas || [];
          const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
          const purchasedAreas = latestState.current?.purchasedAreas || [];

          mapAreas.forEach(inst => {
            const areaDef = areas.find(a => a.id === inst.areaId);
            const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
            if (isUnlocked) {
              if (areaDef && areaDef.tiles) {
                areaDef.tiles.forEach(t => {
                  mapTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true });
                });
              }
            }
          });

          const tileDefsObj = mapTiles.filter(t => t.x === qx && t.y === qy);
          const tileDefs = tileDefsObj.map(t => t.id);
          const hasFloor = tileDefs.some(id => floorTileIds.includes(id)) || tileDefsObj.some(t => t.isArea && (!t.type || t.type === 'floor' || window.CLINIC_TILES?.find(d => d.id === t.id)?.type === 'floor'));

          let wallCollision = false;
          for (let tid of tileDefs) {
            if (tid === 'wall_custom' && localGy < 25) wallCollision = true;
            if (tid === 'wall_custom_y' && localGx < 25) wallCollision = true;
          }

          let actualAssetId = assetId;
          if (latestState.current?.placedClinicAssets?.[assetId]) actualAssetId = latestState.current.placedClinicAssets[assetId].assetId;
          else if (latestState.current?.recycledClinicAssets?.find(a => a.instanceId === assetId)) actualAssetId = latestState.current.recycledClinicAssets.find(a => a.instanceId === assetId).assetId;

          const assetDef = actualAssetId ? (window.CLINIC_ASSETS || []).find(a => a.id === actualAssetId) : null;
          if (assetDef && assetDef.isWallAsset) {
            return wallCollision;
          }

          return hasFloor && !wallCollision;
        },
        snapAsset: (gx, gy, assetId) => {
          let actualAssetId = assetId;
          if (latestState.current?.placedClinicAssets?.[assetId]) actualAssetId = latestState.current.placedClinicAssets[assetId].assetId;
          else if (latestState.current?.recycledClinicAssets?.find(a => a.instanceId === assetId)) actualAssetId = latestState.current.recycledClinicAssets.find(a => a.instanceId === assetId).assetId;

          const assetDef = actualAssetId ? (window.CLINIC_ASSETS || []).find(a => a.id === actualAssetId) : null;
          if (!assetDef || !assetDef.isWallAsset) return { gx, gy, flipX: null };

          const mapTiles = [...(window.CLINIC_MAP_TILES || [])];
          const areas = window.GAME_CONTENT?.clinicAreas || [];
          const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
          const purchasedAreas = latestState.current?.purchasedAreas || [];

          mapAreas.forEach(inst => {
            const areaDef = areas.find(a => a.id === inst.areaId);
            const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
            if (isUnlocked && areaDef && areaDef.tiles) {
              areaDef.tiles.forEach(t => mapTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true, instId: inst.id, price: areaDef.price, reqLevel: areaDef.reqLevel }));
            }
          });

          const isPurchasedFloor = (cx, cy) => mapTiles.some(other => {
            if (other.x !== cx || other.y !== cy) return false;
            const oDef = (window.CLINIC_TILES || []).find(d => d.id === other.id);
            if (oDef?.type !== 'floor') return false;
            if (!other.isArea) return true;
            return purchasedAreas.includes(other.instId) || (other.price <= 0 && other.reqLevel <= 0);
          });

          let minDistance = Infinity;
          let snappedGx = gx;
          let snappedGy = gy;
          let finalFlipX = null;

          mapTiles.forEach(t => {
            const isWallCustomY = t.id === 'wall_custom_y';
            const isWallCustom = t.id === 'wall_custom';
            if (!isWallCustomY && !isWallCustom) return;

            const isLockedArea = t.isArea && (!purchasedAreas.includes(t.instId)) && !(t.price <= 0 && t.reqLevel <= 0);
            if (isLockedArea) return;

            if (isWallCustom && isPurchasedFloor(t.x, t.y) && isPurchasedFloor(t.x, t.y - 1)) return;
            if (isWallCustomY && isPurchasedFloor(t.x, t.y) && isPurchasedFloor(t.x - 1, t.y)) return;

            const tGx = t.x * 200 + 8400;
            const tGy = t.y * 200 - 3200;

            if (isWallCustomY) {
              const distToLine = Math.abs(gx - tGx);
              const clampedGy = Math.max(tGy, Math.min(gy, tGy + 200));
              const distToPoint = Math.abs(gy - clampedGy);
              const totalDist = distToLine + distToPoint;
              if (totalDist < minDistance) {
                minDistance = totalDist;
                snappedGx = tGx + 20;
                snappedGy = clampedGy;
                finalFlipX = true;
              }
            }
            if (isWallCustom) {
              const distToLine = Math.abs(gy - tGy);
              const clampedGx = Math.max(tGx, Math.min(gx, tGx + 200));
              const distToPoint = Math.abs(gx - clampedGx);
              const totalDist = distToLine + distToPoint;
              if (totalDist < minDistance) {
                minDistance = totalDist;
                snappedGx = clampedGx;
                snappedGy = tGy + 20;
                finalFlipX = false;
              }
            }
          });

          return { gx: snappedGx, gy: snappedGy, flipX: finalFlipX };
        }
      };
    };

    return () => {
      if (node) node.removeEventListener('wheel', handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('clinicAssetDrop', onDropAsset);
      delete window.getClinicMapParams;
    };
  }, [onAssetAction]);

  const updateTransform = () => {
    if (mapRef.current) {
      mapRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) scale(${scale.current.current})`;
      if (containerRef.current) {
        const z = scale.current.current;
        let desiredScreenScale = 1;
        if (z < 1) {
          // Cuando se aleja (z < 1), el botón se achica pero no tanto como el mapa
          desiredScreenScale = 1 - (1 - z) * 0.6; // A z=0.2, el tamaño relativo es 0.52 (aprox 16px)
        } else {
          // Cuando se acerca (z > 1), el botón crece levemente hasta un máximo
          desiredScreenScale = Math.min(1.2, 1 + (z - 1) * 0.1);
        }
        const btnScale = desiredScreenScale / z;
        containerRef.current.style.setProperty('--map-zoom', z);
        containerRef.current.style.setProperty('--btn-zoom', btnScale);
      }
    }
  };

  const startPhysicsLoop = () => {
    if (rafRef.current) return;
    let lastTime = performance.now();

    const loop = (time) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 16, 2);
      lastTime = time;

      let needsUpdate = false;

      if (Math.abs(scale.current.target - scale.current.current) > 0.001) {
        const oldScale = scale.current.current;
        scale.current.current += (scale.current.target - scale.current.current) * 0.15 * dt;

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const cx = zoomCenter.current ? zoomCenter.current.x : rect.width / 2;
          const cy = zoomCenter.current ? zoomCenter.current.y : rect.height / 2;
          const scaleRatio = scale.current.current / oldScale;
          pos.current.x = cx - (cx - pos.current.x) * scaleRatio;
          pos.current.y = cy - (cy - pos.current.y) * scaleRatio;
        }
        needsUpdate = true;
      } else {
        scale.current.current = scale.current.target;
      }

      if (!isDragging.current) {
        if (Math.abs(vel.current.x) > 0.1 || Math.abs(vel.current.y) > 0.1) {
          pos.current.x += vel.current.x * dt;
          pos.current.y += vel.current.y * dt;
          vel.current.x *= 0.90;
          vel.current.y *= 0.90;
          needsUpdate = true;
        } else {
          vel.current.x = 0;
          vel.current.y = 0;
        }
      }

      const boundedPos = enforceBounds(pos.current, scale.current.current);
      if (boundedPos.x !== pos.current.x || boundedPos.y !== pos.current.y) {
        if (!isDragging.current) {
          vel.current.x *= 0.5;
          vel.current.y *= 0.5;
        }
        pos.current = boundedPos;
        needsUpdate = true;
      }

      if (needsUpdate) {
        updateTransform();
      } else if (!isDragging.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const handlePointerDown = (e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    vel.current = { x: 0, y: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    startPhysicsLoop();
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    pos.current.x += dx;
    pos.current.y += dy;

    vel.current.x = vel.current.x * 0.5 + dx * 0.5;
    vel.current.y = vel.current.y * 0.5 + dy * 0.5;

    lastMouse.current = { x: e.clientX, y: e.clientY };
    updateTransform();
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    startPhysicsLoop();
  };

  const handleZoom = (factor) => {
    zoomCenter.current = null;
    // We don't have access to initialScale directly here, but we can assume min scale is 0.1
    // Actually, we can just use 0.1 and enforceBounds will handle centering if it gets too small
    const newTarget = Math.max(0.1, Math.min(3, scale.current.target * factor));
    scale.current.target = newTarget;
    startPhysicsLoop();
  };

  const btnStyle = {
    all: 'unset', boxSizing: 'border-box', width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', background: 'var(--bg-1)', color: 'var(--fg-1)',
    boxShadow: 'var(--elevation-30)', cursor: 'pointer', fontSize: 16,
    transition: 'all 0.2s', border: '1px solid var(--border-subtle)'
  };

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, background: '#fff', overflow: 'hidden', position: 'relative', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        ref={mapRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: imageSize.w, height: imageSize.h,
          transformOrigin: '0 0'
        }}
      >
        <style>{`
          @keyframes clinicFloatUpFade {
            0% { transform: translate(-50%, 0); opacity: 1; }
            100% { transform: translate(-50%, -80px); opacity: 0; }
          }
        `}</style>
        <svg width="400%" height="400%" style={{ position: 'absolute', top: '-150%', left: '-150%', zIndex: -100001 }}>
          <defs>
            <pattern id="iso-minor" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="scale(1, 0.57735) rotate(45)">
              <rect width="40" height="40" fill="none" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.3" vectorEffect="non-scaling-stroke" />
            </pattern>
            <pattern id="iso-major" width="200" height="200" patternUnits="userSpaceOnUse" patternTransform="scale(1, 0.57735) rotate(45)">
              <rect width="200" height="200" fill="none" stroke="#60a5fa" strokeWidth="2" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#iso-minor)" />
          <rect width="100%" height="100%" fill="url(#iso-major)" />
          <g transform="scale(1, 0.57735) rotate(45)">
            <rect x="8400" y="-3200" width="6000" height="6000" fill="rgba(255, 255, 255, 0.4)" stroke="#334155" strokeWidth="4" strokeDasharray="10, 10" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>

        {/* Renderizado de Bloques Isométricos (Pisos y Muros) */}
        {(() => {
          const allTiles = [...(window.CLINIC_MAP_TILES || [])];
          const areas = window.GAME_CONTENT?.clinicAreas || [];
          const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];

          mapAreas.forEach(inst => {
            const areaDef = areas.find(a => a.id === inst.areaId);
            if (areaDef && areaDef.tiles) {
              areaDef.tiles.forEach(t => {
                allTiles.push({
                  ...t,
                  x: inst.x + t.dx,
                  y: inst.y + t.dy,
                  isArea: true,
                  instId: inst.id,
                  areaId: areaDef.id,
                  price: areaDef.price,
                  reqLevel: areaDef.reqLevel
                });
              });
            }
          });

          return allTiles.sort((a, b) => {
            const valA = a.x * 200 + a.y * 200 + (a.z || 0);
            const valB = b.x * 200 + b.y * 200 + (b.z || 0);
            if (valA !== valB) return valA - valB;
            if (a.id === 'wall_custom' && b.id === 'wall_custom_y') return 1;
            if (a.id === 'wall_custom_y' && b.id === 'wall_custom') return -1;
            return 0;
          }).map((t, i) => {
            const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
            if (!def) return null;

            const gx = t.x * 200 + 8400;
            const gy = t.y * 200 - 3200;

            let w = def.width || def.w || 200;
            const l = def.length || def.l || 200;
            const h = def.height || def.h || 10;
            let dx = 0;

            if (def.id === 'wall_custom') {
              const hasYWall = allTiles.some(other => other.x === t.x && other.y === t.y && other.id === 'wall_custom_y');
              if (hasYWall) {
                dx = 20;
                w = w - 20;
              }
            }

            const svgX = (gx + dx - gy) * 0.70710678;
            const svgY = (gx + dx + gy) * 0.408248;
            const sx = svgX - 6144;
            const sy = svgY - 3429 - (t.z || 0) - h;

            const p1x = w * 0.70710678;
            const p1y = w * 0.408248;
            const p3x = -l * 0.70710678;
            const p3y = l * 0.408248;
            const p2x = p1x + p3x;
            const p2y = p1y + p3y;

            const topFace = `0,0 ${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`;
            const rightFace = `${p1x},${p1y} ${p2x},${p2y} ${p2x},${p2y + h} ${p1x},${p1y + h}`;
            const leftFace = `${p3x},${p3y} ${p2x},${p2y} ${p2x},${p2y + h} ${p3x},${p3y + h}`;

            const isLockedArea = t.isArea && (!state.purchasedAreas || !state.purchasedAreas.includes(t.instId)) && !(t.price <= 0 && t.reqLevel <= 0);

            let shouldHideWall = false;
            if (def.type === 'wall') {
              if (isLockedArea) {
                shouldHideWall = true;
              } else {
                const isPurchasedFloor = (cx, cy) => allTiles.some(other => {
                  if (other.x !== cx || other.y !== cy) return false;
                  const oDef = (window.CLINIC_TILES || []).find(d => d.id === other.id);
                  if (oDef?.type !== 'floor') return false;
                  if (!other.isArea) return true;
                  return (state?.purchasedAreas && state.purchasedAreas.includes(other.instId)) || (other.price <= 0 && other.reqLevel <= 0);
                });

                if (def.id === 'wall_custom') {
                  if (isPurchasedFloor(t.x, t.y) && isPurchasedFloor(t.x, t.y - 1)) {
                    shouldHideWall = true;
                  }
                } else if (def.id === 'wall_custom_y') {
                  if (isPurchasedFloor(t.x, t.y) && isPurchasedFloor(t.x - 1, t.y)) {
                    shouldHideWall = true;
                  }
                }
              }
            }

            if (shouldHideWall) return null;

            return (
              <svg key={i} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${sx}px, ${sy}px)`, overflow: 'visible', pointerEvents: 'none', zIndex: -100000, filter: isLockedArea ? 'brightness(0.3) saturate(0)' : 'none', transition: 'all 0.3s' }}>
                <polygon points={leftFace} fill={t.colorLeft || def.colorLeft || '#DFD9D1'} />
                <polygon points={rightFace} fill={t.colorRight || def.colorRight || '#D4CEC6'} />
                <polygon points={topFace} fill={t.colorTop || def.colorTop || '#EAE4DC'} stroke={def.type === 'wall' ? 'none' : "rgba(0,0,0,0.05)"} strokeWidth={1} />
              </svg>
            );
          });
        })()}

        {/* Renderizado de Áreas Bloqueadas (UI interactiva) */}
        {(window.GAME_CONTENT?.clinicMapAreas || []).map(inst => {
          const clinicAreas = window.GAME_CONTENT?.clinicAreas || [];
          const areaDef = clinicAreas.find(a => a.id === inst.areaId);
          const isPurchased = (state?.purchasedAreas && state.purchasedAreas.includes(inst.id)) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
          if (isPurchased) return null;
          if (!areaDef) return null;

          const centerX = inst.x + areaDef.width / 2 - 0.5;
          const centerY = inst.y + areaDef.length / 2 - 0.5;
          const gx = centerX * 200 + 8400;
          const gy = centerY * 200 - 3200;
          const svgX = (gx - gy) * 0.70710678;
          const svgY = (gx + gy) * 0.408248;
          const sx = svgX - 6144;
          const sy = svgY - 3429;

          const isLevelReqMet = state?.level >= areaDef.reqLevel;

          return (
            <div key={`lock_${inst.id}`} onClick={() => onAssetAction && onAssetAction('buy_area', inst.id, areaDef)} onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: sx, top: sy, transform: 'translate(-50%, -50%)', zIndex: -99990, cursor: isLevelReqMet ? 'pointer' : 'not-allowed', background: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', border: '2px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', pointerEvents: 'auto', transition: 'transform 0.2s', ...(!isLevelReqMet ? { opacity: 0.8 } : {}) }} onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}>
              <i className={`fa-solid ${isLevelReqMet ? 'fa-unlock' : 'fa-lock'}`} style={{ fontSize: 24, marginBottom: 8, color: isLevelReqMet ? 'var(--positive-i100)' : 'var(--warning-i100)' }}></i>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{areaDef.name}</div>
              {!isLevelReqMet ? (
                <div style={{ fontSize: 13, color: 'var(--warning-i100)', marginTop: 4 }}>Req Nivel {areaDef.reqLevel}</div>
              ) : (
                <div style={{ fontSize: 14, color: '#fef08a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-tooth"></i> {window.formatNum ? window.formatNum(areaDef.price) : areaDef.price}</div>
              )}
            </div>
          );
        })}

        {state?.placedClinicAssets && Object.entries(state.placedClinicAssets).sort((a, b) => a[1].y - b[1].y).map(([id, p]) => {
          const asset = (window.CLINIC_ASSETS || []).find(a => a.id === p.assetId);
          if (!asset) return null;

          const totalFlip = !!asset.flipX !== !!p.flipX;

          let displayIcon = asset.glbData || asset.modelUrl || asset.iconUrl;
          if (p.activeUpgrade !== null && p.activeUpgrade !== undefined && asset.upgrades?.[p.activeUpgrade]) {
            displayIcon = asset.upgrades[p.activeUpgrade].glbData || asset.upgrades[p.activeUpgrade].modelUrl || asset.upgrades[p.activeUpgrade].iconUrl || displayIcon;
          }

          const availableUpgrades = asset.upgrades || [];
          const boughtUpgrades = p.purchasedUpgrades || [];
          const count = state.purchasedClinicAssetsCount?.[p.assetId] || 0;
          const interest = asset.interestRate !== undefined ? asset.interestRate : 1.15;
          const hasPurchasableUpgrade = availableUpgrades.some((upg, i) => {
            if (boughtUpgrades.includes(i)) return false;
            const p_price = Math.floor((upg.price || 0) * Math.pow(interest, count));
            return state.teeth >= p_price && state.level >= (upg.reqLevel || 0);
          });

          const isWallAsset = asset && asset.isWallAsset;
          let shiftY = 0;
          if (isWallAsset) {
              const imgH = asset.shadowParams?.imgHeight || 120;
              shiftY = (imgH / 2) * 0.85 * (p.scale || 1);
          }

          return (
            <div
              key={id}
              onPointerEnter={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                if (hoveredAsset !== id && openUpgradeMenu !== null) setOpenUpgradeMenu(null);
                setHoveredAsset(id);
              }}
              onPointerLeave={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = setTimeout(() => {
                  setHoveredAsset(prev => prev === id ? null : prev);
                  setOpenUpgradeMenu(prev => prev === id ? null : prev);
                }, 1000);
              }}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y - shiftY,
                transform: `translate(-50%, -50%) scale(${0.85 * (p.scale || 1)})`,
                opacity: (window.currentDraggingAssetId === id) ? 0 : 1,
              }}
            >
              <div style={{ position: 'relative' }}>
                {asset.hasShadow !== false && (() => {
                  const sp = asset.shadowParams || { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 0.4, skewX: 0, blur: 4, opacity: 0.25 };

                  let transformStyle = '';
                  let tOrigin = 'bottom center';

                  if (sp.corners && window.solveHomography && sp.imgWidth && sp.imgHeight) {
                    const w = sp.imgWidth;
                    const h = sp.imgHeight;
                    const src = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
                    let dst = sp.corners;

                    // Si está volteada horizontalmente, invertimos las X de las esquinas en relación al ancho
                    if (totalFlip) {
                      dst = dst.map(c => ({ x: w - c.x, y: c.y }));
                    }

                    const h_mat = window.solveHomography(src, dst);
                    transformStyle = `translate(${sp.globalOffsetX || 0}px, ${sp.globalOffsetY || 0}px) scale(${sp.globalScale || 1}) matrix3d(${h_mat.join(',')})`;
                    tOrigin = 'top left'; // La matriz se calcula desde 0,0
                  } else {
                    transformStyle = `translate(${sp.offsetX || 0}px, ${sp.offsetY || 0}px) skewX(${sp.skewX || 0}deg) scaleY(${sp.scaleY ?? 0.4}) ${totalFlip ? `scaleX(-${sp.scaleX ?? 1})` : `scaleX(${sp.scaleX ?? 1})`}`;
                  }

                  return (
                    <React.Fragment>
                      {displayIcon && (window.GLBPreview && is3DUrl(displayIcon, asset.is3D)) ? (
                          <div style={{
                            position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                            transformOrigin: tOrigin, transform: transformStyle,
                            filter: `brightness(0) opacity(${sp.opacity ?? 0.25}) blur(${sp.blur ?? 4}px)`,
                            zIndex: -1, pointerEvents: 'none'
                          }}>
                              <window.GLBPreview url={displayIcon} flipX={totalFlip} size={250} is3D={asset.is3D} />
                          </div>
                      ) : (
                        <img
                          src={displayIcon || 'assets/clinic/clinica-dental-1.png'}
                          style={{
                            position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'contain',
                            transformOrigin: tOrigin, transform: transformStyle,
                            filter: `brightness(0) opacity(${sp.opacity ?? 0.25}) blur(${sp.blur ?? 4}px)`,
                            zIndex: -1, pointerEvents: 'none'
                          }}
                          alt="" draggable={false}
                        />
                      )}
                    </React.Fragment>
                  );
                })()}
                {displayIcon && (window.GLBPreview && is3DUrl(displayIcon, asset.is3D)) ? (
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const offsetX = e.clientX - (rect.left + rect.width / 2);
                        const offsetY = e.clientY - (rect.top + rect.height / 2);
                        window.dispatchEvent(new CustomEvent('clinicAssetDragStart', { detail: { id, iconUrl: displayIcon, clientX: e.clientX, clientY: e.clientY, offsetX, offsetY, isFromMap: true, flipX: totalFlip, mapScale: scale?.current?.current, assetScale: p.scale || 1, is3D: asset.is3D } }));
                      }}
                      style={{ cursor: 'grab', width: 250, height: 250 }}
                    >
                        <window.GLBPreview url={displayIcon} flipX={totalFlip} size={250} is3D={asset.is3D} />
                    </div>
                ) : (
                  <img
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const offsetX = e.clientX - (rect.left + rect.width / 2);
                      const offsetY = e.clientY - (rect.top + rect.height / 2);
                      window.dispatchEvent(new CustomEvent('clinicAssetDragStart', { detail: { id, iconUrl: displayIcon, clientX: e.clientX, clientY: e.clientY, offsetX, offsetY, isFromMap: true, flipX: totalFlip, mapScale: scale?.current?.current, assetScale: p.scale || 1, is3D: false } }));
                    }}
                    src={displayIcon || 'assets/clinic/clinica-dental-1.png'}
                    style={{ display: 'block', maxWidth: 250, height: 'auto', transform: totalFlip ? `scaleX(-1)` : 'none', cursor: 'grab' }}
                    alt="Placed Asset" draggable={false}
                  />
                )}
                {hoveredAsset === id && window.currentDraggingAssetId !== id && (
                  <div style={{
                    position: 'absolute', top: -5, left: -5, right: -5, bottom: -5,
                    border: '2px dashed rgba(0,0,0,0.4)', borderRadius: 8, pointerEvents: 'none'
                  }} />
                )}
                {hoveredAsset === id && window.currentDraggingAssetId !== id && (
                  <div style={{
                    position: 'absolute', top: -5, left: 'calc(100% + 5px)',
                    transform: `scale(calc(var(--btn-zoom, 1) / ${0.85 * (p.scale || 1)}))`,
                    transformOrigin: 'top left',
                    display: 'flex', flexDirection: 'column', gap: 5, zIndex: 11
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAssetAction('flip', id); }}
                      onPointerDown={e => e.stopPropagation()}
                      style={{
                        width: 32, height: 32,
                        borderRadius: '50%', background: 'var(--primary-i100)', color: '#fff',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--elevation-30)', fontSize: 14, flexShrink: 0
                      }}
                    >
                      <i className="fa-solid fa-arrows-rotate"></i>
                    </button>
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const initialScale = p.scale || 1;

                        const onMove = (ev) => {
                          const deltaX = ev.clientX - startX;
                          const deltaY = ev.clientY - startY;
                          const distance = (deltaX + deltaY) * 0.005;
                          const newScale = Math.max(0.3, Math.min(3, initialScale + distance));
                          onAssetAction('scale', id, newScale);
                        };

                        const onUp = () => {
                          window.removeEventListener('pointermove', onMove);
                          window.removeEventListener('pointerup', onUp);
                        };

                        window.addEventListener('pointermove', onMove);
                        window.addEventListener('pointerup', onUp);
                      }}
                      style={{
                        width: 32, height: 32,
                        borderRadius: '50%', background: 'var(--bg-1)', color: 'var(--primary-i100)',
                        border: '2px solid var(--primary-i100)', cursor: 'nwse-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--elevation-30)', fontSize: 14, flexShrink: 0
                      }}
                    >
                      <i className="fa-solid fa-expand"></i>
                    </div>
                    {availableUpgrades.length > 0 && (
                      <div style={{ position: 'relative', width: 32, height: 32 }}>
                        <button
                          onPointerDown={e => {
                            e.stopPropagation();
                            setOpenUpgradeMenu(openUpgradeMenu === id ? null : id);
                          }}
                          style={{
                            width: 32, height: 32,
                            borderRadius: '50%', background: 'var(--bg-1)', color: 'var(--warning-i100)',
                            border: '2px solid var(--warning-i100)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--elevation-30)', fontSize: 14, flexShrink: 0
                          }}
                        >
                          <i className="fa-solid fa-arrow-up"></i>
                          {hasPurchasableUpgrade && (
                            <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, background: 'var(--error-i100)', borderRadius: '50%', border: '2px solid var(--bg-1)' }} />
                          )}
                        </button>

                        {openUpgradeMenu === id && (
                          <div
                            onPointerDown={e => e.stopPropagation()}
                            style={{
                              position: 'absolute', top: 0, right: '100%', marginRight: 16,
                              background: 'var(--bg-1)', borderRadius: 12, padding: 8, border: '1px solid var(--border)',
                              boxShadow: 'var(--elevation-30)', width: 220, zIndex: 100,
                              transformOrigin: 'top right'
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-2)', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                              Mejoras
                            </div>
                            {availableUpgrades.map((upg, i) => {
                              const upgPrice = Math.floor((upg.price || 0) * Math.pow(interest, count));
                              const upgName = upg.name?.es || upg.es || upg.id;
                              const isBought = boughtUpgrades.includes(i);
                              const isActive = p.activeUpgrade === i;

                              return (
                                <div
                                  key={i}
                                  onClick={() => {
                                    if (isBought) {
                                      // Equip
                                      onAssetAction('upgrade', id, i);
                                    } else if (state.teeth >= upgPrice && state.level >= (upg.reqLevel || 0)) {
                                      // Buy
                                      onAssetAction('upgrade', id, i);
                                    }
                                  }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: 8,
                                    background: isActive ? 'var(--primary-i10)' : 'var(--bg-2)',
                                    borderRadius: 6, marginBottom: 4, cursor: isActive ? 'default' : 'pointer',
                                    border: isActive ? '1px solid var(--primary-i100)' : '1px solid var(--border-subtle)'
                                  }}
                                >
                                  <div style={{ width: 24, height: 24, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
                                    {upg.iconUrl ? (
                                      (window.GLBPreview && upg.iconUrl.includes('.glb')) ? <window.GLBPreview url={upg.iconUrl} flipX={upg.flipX} size={24} /> :
                                      <img src={upg.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : <i className="fa-solid fa-image" style={{ fontSize: 10, margin: 7 }}></i>}
                                  </div>
                                  <div style={{ flex: 1, fontSize: 11, fontWeight: 'bold', color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {upgName}
                                    <div style={{ fontSize: 10, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                      {isBought ? (
                                        <span style={{ color: 'var(--success-i100)' }}>{isActive ? 'Equipado' : 'Comprado'}</span>
                                      ) : (
                                        <>
                                          <i className="fa-solid fa-tooth" style={{ fontSize: 9, color: 'var(--primary-i100)' }}></i>
                                          {window.formatNum ? window.formatNum(upgPrice) : upgPrice}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Botón para desequipar (volver al asset base) */}
                            {p.activeUpgrade !== null && p.activeUpgrade !== undefined && (
                              <div
                                onClick={() => onAssetAction('upgrade', id, null)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8, padding: 8,
                                  background: 'var(--bg-2)',
                                  borderRadius: 6, marginTop: 4, cursor: 'pointer',
                                  border: '1px solid var(--border-subtle)'
                                }}
                              >
                                <div style={{ width: 24, height: 24, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
                                  {asset.iconUrl ? (
                                    (window.GLBPreview && asset.iconUrl.includes('.glb')) ? <window.GLBPreview url={asset.iconUrl} flipX={asset.flipX} size={24} /> :
                                    <img src={asset.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  ) : <i className="fa-solid fa-image" style={{ fontSize: 10, margin: 7 }}></i>}
                                </div>
                                <div style={{ flex: 1, fontSize: 11, fontWeight: 'bold', color: 'var(--fg-1)' }}>
                                  Objeto Base
                                  <div style={{ fontSize: 10, color: 'var(--success-i100)' }}>Restaurar</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {floatingTexts.map(ft => (
          <div key={ft.id} style={{
            position: 'absolute', left: ft.x, top: ft.y,
            transform: 'translate(-50%, 0)',
            color: '#ef4444', fontWeight: 'bold', fontSize: 32,
            pointerEvents: 'none', zIndex: 9999,
            animation: 'clinicFloatUpFade 2s ease-out forwards',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <i className="fa-solid fa-tooth" style={{ fontSize: 24, color: 'var(--primary-i100)' }}></i>
            {ft.text}
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10 }}>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); handleZoom(1.4); }}
          style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-1)'; e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerDownCapture={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onPointerUpCapture={e => e.currentTarget.style.transform = 'scale(1.05)'}
        >
          <i className="fa-solid fa-plus"></i>
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); handleZoom(1 / 1.4); }}
          style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-1)'; e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerDownCapture={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onPointerUpCapture={e => e.currentTarget.style.transform = 'scale(1.05)'}
        >
          <i className="fa-solid fa-minus"></i>
        </button>
      </div>
    </div>
  );
}

function ClinicModal({ isOpen, onClose, state, lang, username, onSaveName, onAssetAction }) {
  if (!isOpen) return null;

  const [tempName, setTempName] = React.useState(state.clinicName || (lang === 'es' ? `Clínica de ${username}` : `${username}'s Clinic`));
  const [dragState, setDragState] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('assets');

  React.useEffect(() => {
    const handleDragStart = (e) => {
      window.currentDraggingAssetId = e.detail.id; // set global for InteractiveClinicMap
      setDragState({ id: e.detail.id, isRecycledInst: e.detail.isRecycledInst, iconUrl: e.detail.iconUrl, x: e.detail.clientX, y: e.detail.clientY, offsetX: e.detail.offsetX || 0, offsetY: e.detail.offsetY || 0, isFromMap: e.detail.isFromMap, flipX: e.detail.flipX, mapScale: e.detail.mapScale, assetScale: e.detail.assetScale, is3D: e.detail.is3D });
    };
    window.addEventListener('clinicAssetDragStart', handleDragStart);
    return () => window.removeEventListener('clinicAssetDragStart', handleDragStart);
  }, []);

  const handlePointerMove = (e) => {
    if (dragState) {
      setDragState(s => ({ ...s, x: e.clientX, y: e.clientY }));
    }
  };

  const handlePointerUp = (e) => {
    if (dragState) {
      window.dispatchEvent(new CustomEvent('clinicAssetDrop', { detail: { id: dragState.id, isRecycledInst: dragState.isRecycledInst, clientX: e.clientX, clientY: e.clientY, offsetX: dragState.offsetX, offsetY: dragState.offsetY, isFromMap: dragState.isFromMap } }));

      // Also check if we dropped it back to the sidebar
      const sidebarRect = document.getElementById('clinic-sidebar').getBoundingClientRect();
      if (e.clientX >= sidebarRect.left && e.clientX <= sidebarRect.right && e.clientY >= sidebarRect.top && e.clientY <= sidebarRect.bottom) {
        if (dragState.isFromMap && onAssetAction) {
          onAssetAction('remove', dragState.id);
        }
      }

      window.currentDraggingAssetId = null;
      setDragState(null);
    }
  };

  // Determine which icon to use based on level
  // For now we just use the placeholder 'assets/clinic/clinica-dental-1.png'
  const clinicIcon = 'assets/clinic/clinica-dental-1.png';

  const t = window.STRINGS?.[lang] || { close: 'Cerrar' };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 100001, display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: dragState ? 'none' : 'auto'
      }}
    >
      {dragState && (() => {
        let finalX = dragState.x - dragState.offsetX;
        let finalY = dragState.y - dragState.offsetY;
        let mapScaleVal = dragState.isFromMap ? (dragState.mapScale ? 0.85 * dragState.mapScale * (dragState.assetScale || 1) : 0.85 * (dragState.assetScale || 1)) : 0.425;

        let isPositionValid = true;

        let dragFlipX = dragState.flipX;

        if (window.getClinicMapParams) {
          const mapParams = window.getClinicMapParams();
          if (mapParams && dragState.x >= mapParams.rect.left && dragState.x <= mapParams.rect.right && dragState.y >= mapParams.rect.top && dragState.y <= mapParams.rect.bottom) {
            let localX = (finalX - mapParams.rect.left - mapParams.pos.x) / mapParams.scale;
            let localY = (finalY - mapParams.rect.top - mapParams.pos.y) / mapParams.scale;

            const unscaledY = localY / 0.57735;
            let gx = (localX + unscaledY) * 0.70710678;
            let gy = (-localX + unscaledY) * 0.70710678;

            if (mapParams.snapAsset) {
              let originalGx = gx;
              let originalGy = gy;
              const snapRes = mapParams.snapAsset(gx, gy, dragState.id);
              gx = snapRes.gx;
              gy = snapRes.gy;
              if (snapRes.flipX !== null) {
                dragFlipX = snapRes.flipX;
              }
              if (gx !== originalGx || gy !== originalGy) {
                const newSvgX = (gx - gy) * 0.70710678;
                const newSvgY = (gx + gy) * 0.408248;
                localX = newSvgX - 6144;
                localY = newSvgY - 3429;
              }
            }

            finalX = (localX * mapParams.scale) + mapParams.pos.x + mapParams.rect.left;
            finalY = (localY * mapParams.scale) + mapParams.pos.y + mapParams.rect.top;

            mapScaleVal = 0.85 * mapParams.scale * (dragState.assetScale || 1);

            if (mapParams && mapParams.isTileValidLocal) {
              isPositionValid = mapParams.isTileValidLocal(localX, localY, dragState.id, finalX, finalY);
              const assetDef = dragState.id ? (window.CLINIC_ASSETS || []).find(a => a.id === dragState.id) : null;
              if (assetDef && assetDef.isWallAsset) {
                let imgH = assetDef.shadowParams?.imgHeight || 120;
                finalY -= (imgH / 2) * mapScaleVal;
              }
              if (isPositionValid && (!assetDef || !assetDef.isWallAsset)) {
                let abottom = 60;
                if (assetDef && assetDef.shadowParams && assetDef.shadowParams.imgHeight) {
                  const s = 0.85 * (dragState.assetScale || 1);
                  abottom = (assetDef.shadowParams.imgHeight / 2) * s * 0.85;
                }
                isPositionValid = mapParams.isTileValidLocal(localX, localY + abottom, dragState.id, finalX, finalY);
              }
            }
          }
        }

        return (
          <div style={{ position: 'fixed', left: finalX, top: finalY, transform: `translate(-50%, -50%) scale(${mapScaleVal})`, zIndex: 1000000, pointerEvents: 'none', filter: isPositionValid ? 'none' : 'drop-shadow(0 0 10px red) drop-shadow(0 0 20px red) hue-rotate(300deg) saturate(500%) brightness(50%)' }}>
            {dragState.iconUrl && (window.GLBPreview && is3DUrl(dragState.iconUrl, dragState.is3D)) ? (
                <window.GLBPreview url={dragState.iconUrl} flipX={dragFlipX} size={250} is3D={dragState.is3D} />
            ) : (
                <img src={dragState.iconUrl || 'assets/clinic/clinica-dental-1.png'} style={{ maxWidth: 250, height: 'auto', display: 'block', transform: dragFlipX ? 'scaleX(-1)' : 'none' }} />
            )}
          </div>
        );
      })()}
      <div style={{
        width: 'calc(100% - 40px)', height: 'calc(100% - 40px)',
        background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-l)', boxShadow: 'var(--elevation-30)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={clinicIcon} style={{ width: 48, height: 48, objectFit: 'contain' }} alt="Clinic Icon" />
            <input
              value={tempName}
              onChange={e => setTempName(e.target.value.slice(0, 30))}
              onBlur={e => onSaveName(tempName)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              style={{
                all: 'unset', boxSizing: 'border-box',
                background: 'var(--bg-2)', border: '1px solid var(--border-subtle)',
                borderRadius: 8, padding: '8px 12px', width: 300,
                fontSize: 24, fontWeight: 700, color: 'var(--fg-1)',
                fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--primary-i100)'}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-2)', borderRadius: 20, border: '1px solid var(--border-subtle)' }}>
              <i className="fa-solid fa-tooth" style={{ fontSize: 16, color: 'var(--primary-i100)' }}></i>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--fg-1)' }}>{window.formatNum ? window.formatNum(state.teeth || 0) : Math.floor(state.teeth || 0)}</span>
            </div>
            <button
              onClick={onClose}
              style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--fg-1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--fg-3)'; }}
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: 18 }}></i>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div
            id="clinic-sidebar"
            style={{ width: 280, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-1)', padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => setActiveTab('assets')}
                style={{ flex: 1, padding: '6px', fontSize: 12, fontWeight: 'bold', background: activeTab === 'assets' ? 'var(--primary-i100)' : 'var(--bg-2)', color: activeTab === 'assets' ? '#fff' : 'var(--fg-2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
              >
                Tienda
              </button>
              <button
                onClick={() => setActiveTab('recycled')}
                style={{ flex: 1, padding: '6px', fontSize: 12, fontWeight: 'bold', background: activeTab === 'recycled' ? 'var(--primary-i100)' : 'var(--bg-2)', color: activeTab === 'recycled' ? '#fff' : 'var(--fg-2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
              >
                {((state.recycledClinicAssets || []).filter(inst => (window.CLINIC_ASSETS || []).some(a => a.id === inst.assetId)).length > 0) ? `Reciclados (${(state.recycledClinicAssets || []).filter(inst => (window.CLINIC_ASSETS || []).some(a => a.id === inst.assetId)).length})` : 'Reciclados'}
              </button>
            </div>

            {activeTab === 'assets' && (
              <>
                <div className="t-heading-s" style={{ marginBottom: 8, color: 'var(--fg-1)' }}>{lang === 'es' ? 'Recursos disponibles' : 'Available assets'}</div>

                {(!window.CLINIC_ASSETS || window.CLINIC_ASSETS.length === 0) ? (
                  <div className="t-body-s" style={{ color: 'var(--fg-3)', textAlign: 'center', padding: '20px 0' }}>
                    {lang === 'es' ? 'No hay recursos creados' : 'No assets created'}
                  </div>
                ) : window.CLINIC_ASSETS.map(asset => {
                  const reqLvl = asset.reqLevel || 0;
                  const hasLevel = state.level >= reqLvl;
                  const reqGenId = asset.reqGeneratorId;
                  const reqGenAmt = asset.reqGeneratorAmount || 0;
                  const hasGen = reqGenId ? ((state.generators && state.generators[reqGenId]) || 0) >= reqGenAmt : true;

                  const isAvailable = hasLevel && hasGen;
                  const nameStr = asset.name?.[lang] || asset[lang] || asset.id;

                  const count = state.purchasedClinicAssetsCount?.[asset.id] || 0;
                  const interest = asset.interestRate !== undefined ? asset.interestRate : 1.15;
                  const currentPrice = Math.floor((asset.price || 0) * Math.pow(interest, count));

                  if (!isAvailable) {
                    return (
                      <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)', opacity: 0.5 }}>
                        <div style={{ width: 40, height: 40, background: 'var(--bg-3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-lock" style={{ color: 'var(--fg-4)' }}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--fg-2)' }}>???</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>
                            {!hasLevel ? `Lvl ${reqLvl}` : `Gen: ${reqGenAmt}`}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={asset.id}
                      onClick={e => {
                        e.stopPropagation();
                        const count = state.purchasedClinicAssetsCount?.[asset.id] || 0;
                        const interest = asset.interestRate !== undefined ? asset.interestRate : 1.15;
                        const price = Math.floor((asset.price || 0) * Math.pow(interest, count));
                        if ((state.teeth || 0) < price) {
                           onAssetAction('buy_shop_asset', asset.id, 'check_only');
                           return;
                        }
                        
                        const instanceId = `inst_${Date.now()}_${Math.random().toString(36).substring(2,9)}`;
                        if (localStorage.getItem('tooth-clicker-sound') !== '0' && window.playTone) {
                          window.playTone(1200, 0.05, 'square', 0.1);
                          setTimeout(() => window.playTone(1600, 0.1, 'square', 0.1), 70);
                          setTimeout(() => window.playTone(2000, 0.15, 'triangle', 0.08), 140);
                        }
                        
                        onAssetAction('buy_shop_asset', asset.id, instanceId);
                        window.dispatchEvent(new CustomEvent('clinicAssetAttach', { 
                          detail: { 
                            id: instanceId, 
                            assetId: asset.id,
                            isRecycledInst: true, 
                            isFromMap: false, 
                            isWallAsset: asset.type === 'wall' || asset.isWallAsset 
                          } 
                        }));
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      <div style={{ width: 64, height: 64, background: 'var(--bg-3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {(asset.glbData || asset.modelUrl || asset.iconUrl) ? (
                          (window.GLBPreview && is3DUrl(asset.glbData || asset.modelUrl || asset.iconUrl, asset.is3D)) ? <window.GLBPreview url={asset.glbData || asset.modelUrl || asset.iconUrl} flipX={asset.flipX} size={64} is3D={asset.is3D} autoRotate={false} isometric={true} scaleMultiplier={1.5} /> :
                          <img src={asset.glbData || asset.modelUrl || asset.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: asset.flipX ? 'scaleX(-1)' : 'none', pointerEvents: 'none' }} draggable={false} />
                        ) : <i className="fa-solid fa-image" style={{ color: 'var(--fg-4)', fontSize: 24 }}></i>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--fg-1)' }}>{nameStr}</div>
                        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="fa-solid fa-tooth" style={{ fontSize: 11, color: 'var(--primary-i100)' }}></i>
                          {window.formatNum ? window.formatNum(currentPrice) : currentPrice}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'recycled' && (() => {
              const validRecycledAssets = (state.recycledClinicAssets || []).filter(inst => (window.CLINIC_ASSETS || []).some(a => a.id === inst.assetId));
              return (
              <>
                <div className="t-heading-s" style={{ marginBottom: 8, color: 'var(--fg-1)' }}>{lang === 'es' ? 'Reciclados' : 'Recycled'}</div>

                {validRecycledAssets.length === 0 ? (
                  <div className="t-body-s" style={{ color: 'var(--fg-3)', textAlign: 'center', padding: '20px 0' }}>
                    {lang === 'es' ? 'No hay objetos reciclados' : 'No recycled assets'}
                  </div>
                ) : (() => {
                  const groupedRecycled = {};
                  validRecycledAssets.forEach(inst => {
                     const key = `${inst.assetId}_${inst.activeUpgrade || ''}`;
                     if (!groupedRecycled[key]) groupedRecycled[key] = { ...inst, count: 0, instances: [] };
                     groupedRecycled[key].count++;
                     groupedRecycled[key].instances.push(inst.instanceId);
                  });
                  return Object.values(groupedRecycled).map(group => {
                    const inst = group;
                    const assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === inst.assetId);
                    const nameStr = assetDef.name?.[lang] || assetDef[lang] || assetDef.id;

                    let modelUrl = assetDef.glbData || assetDef.modelUrl || assetDef.iconUrl;
                    if (inst.activeUpgrade !== null && inst.activeUpgrade !== undefined && assetDef.upgrades?.[inst.activeUpgrade]) {
                      const upg = assetDef.upgrades[inst.activeUpgrade];
                      modelUrl = upg.glbData || upg.modelUrl || upg.iconUrl || modelUrl;
                    }

                    return (
                      <div
                        key={group.instances[0]}
                        onClick={e => {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent('clinicAssetAttach', { 
                            detail: { 
                              id: group.instances[0], 
                              assetId: inst.assetId,
                              isRecycledInst: true, 
                              isFromMap: false 
                            } 
                          }));
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                      >
                        <div style={{ width: 64, height: 64, background: 'var(--bg-3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {modelUrl ? (
                            (window.GLBPreview && is3DUrl(modelUrl, assetDef.is3D)) ? <window.GLBPreview url={modelUrl} flipX={assetDef.flipX} size={64} is3D={assetDef.is3D} autoRotate={false} isometric={true} scaleMultiplier={1.5} /> :
                            <img src={modelUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: assetDef.flipX ? 'scaleX(-1)' : 'none', pointerEvents: 'none' }} draggable={false} />
                          ) : <i className="fa-solid fa-image" style={{ color: 'var(--fg-4)', fontSize: 24 }}></i>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--fg-1)' }}>
                            {nameStr} {group.count > 1 && <span style={{ color: 'var(--primary-i100)' }}>x{group.count}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </>
              );
            })()}
          </div>

          <window.ThreeClinicMap state={state} onAssetAction={onAssetAction} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Odometer, ToothbrushRing, AboutModal, VersionLogModal, GameTour, StatTile, StatsGroup, TabBar, GeneratorRow, ClickUpgradeRow, AcademyUpgradeRow, AchievementCard, Toast, StoreUpgradeIcon, ToothIcon, primaryBtnStyle, secondaryBtnStyle, Dropdown, Tooth3DViewer, ClinicModal });