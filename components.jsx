// UI Components for Tooth Clicker
const { useState: useStateC } = React;

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

function StatTile({ label, value, sub, icon, accent }) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)', padding: "12px 14px" }}>
      <div className="t-mini-caps" style={{ color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <i className={icon} style={{ fontSize: 11, color: accent || 'var(--fg-3)' }}></i>}
        {label}
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

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--spacing-5)', overflowX: 'auto' }}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            position: 'relative',
            background: 'none', border: 'none', borderBottom: isActive ? '2px solid var(--primary-i100)' : '2px solid transparent',
            padding: 'var(--spacing-3) var(--spacing-4)', color: isActive ? 'var(--primary-i100)' : 'var(--fg-2)',
            fontWeight: isActive ? 600 : 500, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)',
            transition: 'color 150ms ease', whiteSpace: 'nowrap', flexShrink: 0
          }}>
            <i className={t.icon} style={{ fontSize: 13 }}></i>
            {t.label}
            {t.badge != null &&
            <span style={{ fontSize: 10, fontWeight: 600, background: isActive ? 'var(--primary-i010)' : 'var(--bg-3)', color: isActive ? 'var(--primary-i100)' : 'var(--fg-3)', padding: '2px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center' }}>{t.badge}</span>
            }
            {t.dot && (
              <span style={{ position: 'absolute', top: 8, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--negative-i100)', border: '2px solid var(--bg-1)' }}></span>
            )}
          </button>);

      })}
    </div>);

}

function GeneratorRow({ gen, owned, cost, canAfford, unlocked, revealed, onBuy, lang, totalTeeth, production, buyQty, actualQty }) {
  const t = window.STRINGS[lang];
  const name = gen[lang] || gen.es;
  const desc = gen[`desc_${lang}`] || gen.desc_es;
  if (!revealed) return null;
  if (!unlocked) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: '8px', alignItems: 'center', padding: '5px 8px', background: 'var(--bg-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', opacity: 0.55, boxSizing: 'border-box' }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)', flexShrink: 0 }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 12 }}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-3)', lineHeight: 1.2 }}>???</div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.unlockAt} {window.formatNum(gen.unlockAt)} {t.teeth}</div>
        </div>
        <div></div>
        <div style={{ textAlign: 'right', minWidth: 72, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.cost}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', fontVariantNumeric: 'tabular-nums' }}>−{window.formatNum(Math.max(0, gen.unlockAt - totalTeeth))}</div>
        </div>
      </div>);
  }
  return (
    <button onClick={onBuy} disabled={!canAfford} className="app-btn" style={{
      all: 'unset', display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: '8px',
      alignItems: 'center', padding: '5px 8px',
      background: 'var(--bg-1)', border: `1px solid ${canAfford ? 'var(--primary-i020)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-s)', cursor: canAfford ? 'pointer' : 'not-allowed',
      opacity: canAfford ? 1 : 0.75, transition: 'all 150ms ease', boxSizing: 'border-box'
    }}>
      
      <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--primary-i010)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-i100)', flexShrink: 0 }}>
        <i className={gen.icon} style={{ fontSize: 14 }}></i>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.2 }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
      </div>
      <div style={{ textAlign: 'right', minWidth: 56, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.owned}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{owned}</div>
        {owned > 0 && <div style={{ fontSize: 10, color: 'var(--positive-i100)', fontVariantNumeric: 'tabular-nums' }}>+{window.formatNum(production)}/s</div>}
      </div>
      <div style={{ textAlign: 'right', minWidth: 72, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          {buyQty > 1 &&
            <span style={{ background: canAfford ? 'var(--primary-i010)' : 'var(--bg-3)', color: canAfford ? 'var(--primary-i100)' : 'var(--fg-3)', padding: '1px 4px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>
              x{actualQty < buyQty ? `${actualQty}/${buyQty}` : buyQty}
            </span>
          }
          {t.cost}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: canAfford ? 'var(--primary-i100)' : 'var(--fg-2)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', lineHeight: 1.2 }}>
          <i className="fa-solid fa-tooth" style={{ fontSize: 11, color: 'inherit' }}></i>
          {window.formatNum(cost)}
        </div>
      </div>
    </button>);

}

function ClickUpgradeRow({ up, purchased, canAfford, unlocked, onBuy, lang, totalTeeth }) {
  const t = window.STRINGS[lang];
  const name = up[lang] || up.es;
  const desc = up[`desc_${lang}`] || up.desc_es;

  const sharedGrid = { display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: '8px', alignItems: 'center', padding: '5px 8px', boxSizing: 'border-box', borderRadius: 'var(--radius-s)' };

  if (!unlocked) {
    return (
      <div style={{ ...sharedGrid, background: 'var(--bg-3)', border: '1px solid var(--border-subtle)', opacity: 0.55 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)', flexShrink: 0 }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 12 }}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-3)', lineHeight: 1.2 }}>???</div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.unlockAt} {window.formatNum(up.unlockAt)} {t.teeth}</div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 72, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.cost}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', fontVariantNumeric: 'tabular-nums' }}>−{window.formatNum(Math.max(0, up.unlockAt - totalTeeth))}</div>
        </div>
      </div>);
  }

  if (purchased) {
    return (
      <div style={{ ...sharedGrid, background: 'var(--positive-i010)', border: '1px solid var(--positive-i050)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--positive-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
          <i className="fa-solid fa-check" style={{ fontSize: 13 }}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--positive-i150)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--positive-i130)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--positive-i130)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{t.ach_unlocked}</div>
      </div>);
  }

  return (
    <button onClick={onBuy} disabled={!canAfford} className="app-btn" style={{
      all: 'unset', ...sharedGrid,
      background: 'var(--bg-1)', border: `1px solid ${canAfford ? 'var(--primary-i020)' : 'var(--border-subtle)'}`,
      cursor: canAfford ? 'pointer' : 'not-allowed',
      opacity: canAfford ? 1 : 0.75, transition: 'all 150ms ease',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--alternative-i010)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--alternative-i100)', flexShrink: 0 }}>
        <i className="fa-solid fa-arrow-up-right-dots" style={{ fontSize: 13 }}></i>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
      </div>
      <div style={{ textAlign: 'right', minWidth: 72, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.cost}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: canAfford ? 'var(--primary-i100)' : 'var(--fg-2)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', lineHeight: 1.2 }}>
          <i className="fa-solid fa-tooth" style={{ fontSize: 11 }}></i>
          {window.formatNum(up.cost)}
        </div>
      </div>
    </button>);
}

function achIcon(ach) {
  const cat = ach.cat;
  if (cat === 'secret' || !cat) {
    // secrets: try to derive from id keyword
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
    // derive from generator id embedded in achievement id: own_{genId}_{n}
    const parts = (ach.id || '').split('_');
    const genId = parts.slice(1, -1).join('_');
    const gen = window.GENERATORS && window.GENERATORS.find(g => g.id === genId);
    // Important: strip "fa-solid " if present, as the component adds it back
    if (gen && gen.icon) return gen.icon.replace('fa-solid ', '');
    return 'fa-industry';
  }
  return 'fa-trophy';
}

function AchievementCard({ ach, unlocked, lang, onHover, onLeave }) {
  const [hov, setHov] = useStateC(false);
  const icon = achIcon(ach);
  return (
    <div
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={(e) => {
        setHov(true);
        if (onHover) {
          const rect = e.currentTarget.getBoundingClientRect();
          onHover(ach, { x: rect.left + rect.width / 2, y: rect.top }, unlocked);
        }
      }}
      onMouseLeave={() => {
        setHov(false);
        if (onLeave) onLeave();
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: unlocked ? 'var(--warning-i100)' : 'var(--bg-3)',
        border: `1.5px solid ${unlocked ? 'var(--warning-i070)' : 'var(--border-subtle)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: unlocked ? '#fff' : 'var(--fg-4)',
        opacity: unlocked ? 1 : 0.5,
        cursor: 'default',
        transition: 'transform 120ms, box-shadow 120ms',
        transform: hov ? 'scale(1.12)' : 'scale(1)',
        boxShadow: hov && unlocked ? '0 4px 12px rgba(255,194,32,0.35)' : hov ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
      }}>
        <i className={`fa-solid ${icon}`} style={{ fontSize: 16 }}></i>
        {ach.isNew && (
          <div style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: 'var(--negative-i100)', border: '2px solid var(--bg-1)', zIndex: 2 }}></div>
        )}
      </div>
    </div>);
}

function Toast({ toast, lang }) {
  if (!toast) return null;
  const t = window.STRINGS[lang];
  const isAch = !!toast.cat;
  const isUpgrade = !!toast.id && toast.id.startsWith('buy_up_');
  const isSpecial = !!toast.id && toast.id.startsWith('__');
  const isFeedback = toast.id === 'feedback_success';
  
  let icon = "fa-solid fa-trophy";
  let title = t.toast_achieved;
  let accent = "var(--warning-i100)";
  let accentText = "var(--warning-i070)";

  if (isUpgrade) {
    icon = "fa-solid fa-cart-shopping";
    title = lang === 'es' ? 'Mejora comprada' : 'Upgrade bought';
    accent = "var(--primary-i100)";
    accentText = "var(--primary-i070)";
  } else if (isSpecial) {
    icon = "fa-solid fa-bolt";
    title = lang === 'es' ? 'Bonus activo' : 'Bonus active';
    accent = "var(--alternative-i100)";
    accentText = "var(--alternative-i070)";
  } else if (isFeedback) {
    icon = "fa-solid fa-comment-dots";
    title = lang === 'es' ? 'Mensaje enviado' : 'Message sent';
    accent = "var(--positive-i100)";
    accentText = "var(--positive-i070)";
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--complementary-i080)', color: '#fff', padding: 'var(--spacing-3) var(--spacing-4)', borderRadius: 'var(--radius-m)', boxShadow: 'var(--elevation-20)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', zIndex: 1000, animation: 'toastIn 250ms ease', maxWidth: 420 }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-s)', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
        <i className={icon} style={{ fontSize: 16 }}></i>
      </div>
      <div>
        <div className="t-mini-caps" style={{ color: accentText }}>{title}</div>
        <div className="t-heading-xs" style={{ color: '#fff' }}>{toast[lang] || toast.es}</div>
      </div>
    </div>);
}

function StoreUpgradeIcon({ up, canAfford, onBuy, lang, fmt, onHover, onLeave }) {
  const [hov, setHov] = useStateC(false);
  
  return (
    <div 
      style={{ position: 'relative' }}
      onMouseEnter={(e) => {
        setHov(true);
        if (onHover) {
          const rect = e.currentTarget.getBoundingClientRect();
          onHover(up, { x: rect.left + rect.width / 2, y: rect.top });
        }
      }}
      onMouseLeave={() => {
        setHov(false);
        if (onLeave) onLeave();
      }}
    >
      <button
        onClick={() => onBuy(up)}
        disabled={!canAfford}
        style={{
          all: 'unset', boxSizing: 'border-box',
          width: 44, height: 44, borderRadius: 8, border: '2px solid',
          borderColor: canAfford ? up.color : 'var(--neutral-i020)',
          background: canAfford ? 'var(--bg-1)' : 'var(--bg-2)',
          color: canAfford ? up.color : 'var(--fg-3)',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, transition: 'all 200ms ease', opacity: canAfford ? 1 : 0.6,
          transform: hov && canAfford ? 'scale(1.1)' : 'scale(1)',
          boxShadow: 'none'
        }}>
        <i className={`fa-solid ${up.icon}`}></i>
      </button>
    </div>
  );
}

Object.assign(window, { ToothIcon, StatTile, StatsGroup, TabBar, GeneratorRow, ClickUpgradeRow, AchievementCard, Toast, StoreUpgradeIcon });function VersionLogModal({ onClose, lang }) {
  const versions = (window.VERSION_HISTORY || []).map((item) => ({
    v: item.v,
    date: item.date,
    desc: lang === 'es' ? item.es : item.en
  }));

  return (
    <window.Modal onClose={onClose} maxWidth={420}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <i className="fa-solid fa-clock-rotate-left" style={{ color: '#1a8fff', fontSize: 20 }}></i>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}>{lang === 'es' ? 'Historial de Versiones' : 'Version History'}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 400, paddingRight: 6 }}>
        {versions.map((v, i) => (
          <div key={v.v + i} style={{ borderLeft: '2px solid #e1e8ef', paddingLeft: 16, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1a8fff', background: 'rgba(26,143,255,0.1)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-sans)' }}>{v.v}</span>
              {v.date && <span style={{ fontSize: 10, color: '#8aaacc', fontFamily: 'var(--font-sans)' }}>{v.date}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>{v.desc}</div>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ ...primaryBtnStyle, marginTop: 20 }}>
        {lang === 'es' ? 'Volver' : 'Back'}
      </button>
    </window.Modal>
  );
}

function AboutModal({ onClose, lang }) {
  const [showLog, setShowLog] = React.useState(false);
  const versions = (window.VERSION_HISTORY || []).map((item) => ({
    v: item.v,
    date: item.date,
    desc: lang === 'es' ? item.es : item.en,
    latest: item.latest
  }));

  if (showLog) return <VersionLogModal onClose={() => setShowLog(false)} lang={lang} />;

  return (
    <window.Modal onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 300, maxWidth: 360, minHeight: 0 }}>
        <img src="uploads/logo-vertical.png" alt="ToothClicker" style={{ width: 180, objectFit: 'contain', marginBottom: 8, flexShrink: 0 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)', marginBottom: 16, flexShrink: 0, padding: "20px 0px" }}>
          {lang === 'es' ? 'Creado por Jaime Arias' : 'Created by Jaime Arias'}
        </div>
        <div style={{ width: '100%', borderTop: '1.5px dashed #d0dce8', marginBottom: 16, flexShrink: 0 }} />
        <div style={{ width: '100%' }}>
          {(() => {
            const latest = versions.find((v) => v.latest);
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
              </div>);
          })()}
        </div>
        <button onClick={onClose} style={{ all: 'unset', boxSizing: 'border-box', marginTop: 24, width: '100%', textAlign: 'center', padding: '13px 0', borderRadius: 999, background: '#1a8fff', color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: "'PixelifySans', var(--font-sans)", cursor: 'pointer', flexShrink: 0 }}>
          {lang === 'es' ? 'Cerrar' : 'Close'}
        </button>
      </div>
    </window.Modal>);
}

Object.assign(window, { AboutModal, VersionLogModal, primaryBtnStyle, secondaryBtnStyle });