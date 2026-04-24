// UI Components for Tooth Clicker
const { useState: useStateC } = React;

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
      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 'var(--spacing-4)', alignItems: 'center', padding: 'var(--spacing-3) var(--spacing-4)', background: 'var(--bg-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', opacity: 0.6 }}>
        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-s)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)' }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 16 }}></i>
        </div>
        <div>
          <div className="t-heading-xs" style={{ color: 'var(--fg-3)' }}>???</div>
          <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>{t.unlockAt} {window.formatNum(gen.unlockAt)} {t.teeth}</div>
        </div>
        <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>{window.formatNum(Math.max(0, gen.unlockAt - totalTeeth))} {t.teeth}</div>
      </div>);

  }
  return (
    <button onClick={onBuy} disabled={!canAfford} style={{
      all: 'unset', display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: '8px',
      alignItems: 'center', padding: '5px 8px',
      background: 'var(--bg-1)', border: `1px solid ${canAfford ? 'var(--primary-i020)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-s)', cursor: canAfford ? 'pointer' : 'not-allowed',
      opacity: canAfford ? 1 : 0.75, transition: 'all 150ms ease', boxSizing: 'border-box'
    }}
    onMouseEnter={(e) => {if (canAfford) {e.currentTarget.style.background = 'var(--primary-i005)';e.currentTarget.style.borderColor = 'var(--primary-i100)';}}}
    onMouseLeave={(e) => {e.currentTarget.style.background = 'var(--bg-1)';e.currentTarget.style.borderColor = canAfford ? 'var(--primary-i020)' : 'var(--border-subtle)';}}>
      
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
  if (!unlocked) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 'var(--spacing-4)', alignItems: 'center', padding: 'var(--spacing-3) var(--spacing-4)', background: 'var(--bg-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-m)', opacity: 0.6 }}>
        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-s)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)' }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 16 }}></i>
        </div>
        <div>
          <div className="t-heading-xs" style={{ color: 'var(--fg-3)' }}>???</div>
          <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>{t.unlockAt} {window.formatNum(up.unlockAt)} {t.teeth}</div>
        </div>
        <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>{window.formatNum(Math.max(0, up.unlockAt - totalTeeth))} {t.teeth}</div>
      </div>);

  }
  if (purchased) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 'var(--spacing-4)', alignItems: 'center', padding: 'var(--spacing-3) var(--spacing-4)', background: 'var(--positive-i010)', border: '1px solid var(--positive-i050)', borderRadius: 'var(--radius-m)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-s)', background: 'var(--positive-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <i className="fa-solid fa-check" style={{ fontSize: 18 }}></i>
        </div>
        <div>
          <div className="t-heading-xs" style={{ color: 'var(--positive-i150)' }}>{name}</div>
          <div className="t-body-s" style={{ color: 'var(--positive-i130)' }}>{desc}</div>
        </div>
        <div className="t-mini-caps" style={{ color: 'var(--positive-i130)' }}>{t.ach_unlocked}</div>
      </div>);

  }
  return (
    <button onClick={onBuy} disabled={!canAfford} style={{
      all: 'unset', display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 'var(--spacing-4)',
      alignItems: 'center', padding: 'var(--spacing-3) var(--spacing-4)',
      background: 'var(--bg-1)', border: `1px solid ${canAfford ? 'var(--primary-i020)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-m)', cursor: canAfford ? 'pointer' : 'not-allowed',
      opacity: canAfford ? 1 : 0.75, transition: 'all 150ms ease', boxSizing: 'border-box'
    }}
    onMouseEnter={(e) => {if (canAfford) {e.currentTarget.style.background = 'var(--primary-i005)';e.currentTarget.style.borderColor = 'var(--primary-i100)';}}}
    onMouseLeave={(e) => {e.currentTarget.style.background = 'var(--bg-1)';e.currentTarget.style.borderColor = canAfford ? 'var(--primary-i020)' : 'var(--border-subtle)';}}>
      
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-s)', background: 'var(--alternative-i010)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--alternative-i100)' }}>
        <i className="fa-solid fa-arrow-up-right-dots" style={{ fontSize: 18 }}></i>
      </div>
      <div>
        <div className="t-heading-xs" style={{ color: 'var(--fg-1)' }}>{name}</div>
        <div className="t-body-s" style={{ color: 'var(--fg-3)' }}>{desc}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="t-mini-caps" style={{ color: 'var(--fg-3)' }}>{t.cost}</div>
        <div className="t-heading-s" style={{ color: canAfford ? 'var(--primary-i100)' : 'var(--fg-2)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <i className="fa-solid fa-tooth" style={{ fontSize: 13 }}></i>
          {window.formatNum(up.cost)}
        </div>
      </div>
    </button>);

}

function AchievementCard({ ach, unlocked, lang }) {
  const t = window.STRINGS[lang];
  const name = ach[lang] || ach.es;
  const desc = ach[`desc_${lang}`] || ach.desc_es;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 'var(--spacing-3)', alignItems: 'center', padding: 'var(--spacing-3) var(--spacing-4)', background: unlocked ? 'var(--warning-i010)' : 'var(--bg-3)', border: `1px solid ${unlocked ? 'var(--warning-i050)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-m)', opacity: unlocked ? 1 : 0.75 }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-s)', background: unlocked ? 'var(--warning-i100)' : 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: unlocked ? '#fff' : 'var(--fg-4)' }}>
        <i className={unlocked ? 'fa-solid fa-trophy' : 'fa-solid fa-lock'} style={{ fontSize: 18 }}></i>
      </div>
      <div>
        <div className="t-heading-xs" style={{ color: unlocked ? 'var(--warning-i130)' : 'var(--fg-3)' }}>{unlocked ? name : '???'}</div>
        <div className="t-body-s" style={{ color: unlocked ? 'var(--warning-i120)' : 'var(--fg-3)' }}>{desc}</div>
      </div>
    </div>);

}

function Toast({ toast, lang }) {
  if (!toast) return null;
  const t = window.STRINGS[lang];
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--complementary-i080)', color: '#fff', padding: 'var(--spacing-3) var(--spacing-4)', borderRadius: 'var(--radius-m)', boxShadow: 'var(--elevation-20)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', zIndex: 1000, animation: 'toastIn 250ms ease', maxWidth: 420 }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-s)', background: 'var(--warning-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
        <i className="fa-solid fa-trophy" style={{ fontSize: 16 }}></i>
      </div>
      <div>
        <div className="t-mini-caps" style={{ color: 'var(--warning-i070)' }}>{t.toast_achieved}</div>
        <div className="t-heading-xs" style={{ color: '#fff' }}>{toast[lang] || toast.es}</div>
      </div>
    </div>);

}

Object.assign(window, { ToothIcon, StatTile, StatsGroup, TabBar, GeneratorRow, ClickUpgradeRow, AchievementCard, Toast });

function AboutModal({ onClose, lang }) {
  const versions = VERSION_HISTORY.map((item) => ({
    v: item.v,
    date: item.date,
    desc: lang === 'es' ? item.es : item.en,
    latest: item.latest
  }));
  return (
    <window.Modal onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 300, maxWidth: 360 }}>
        <img src="uploads/logo-vertical.png" alt="ToothClicker" style={{ width: 180, objectFit: 'contain', marginBottom: 8 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)', marginBottom: 16 }}>
          {lang === 'es' ? 'Creado por Jaime Arias' : 'Created by Jaime Arias'}
        </div>
        <div style={{ width: '100%', borderTop: '1.5px dashed #d0dce8', marginBottom: 16 }} />
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5a7a9a', fontFamily: 'var(--font-sans)', marginBottom: 10 }}>
            {lang === 'es' ? 'Historial de versiones' : 'Version history'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {versions.map((item, i) =>
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)', color: item.latest ? '#fff' : '#8fa8be', background: item.latest ? '#1a8fff' : '#c8d8e8', padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{item.v}</span>
                  {item.date && <span style={{ fontSize: 10, color: '#aac0d4', fontFamily: 'var(--font-sans)' }}>{item.date}</span>}
                </div>
                <span style={{ fontSize: 13, color: '#4a6a88', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{item.desc}</span>
              </div>
            )}
          </div>
        </div>
        <button onClick={onClose} style={{ all: 'unset', boxSizing: 'border-box', marginTop: 24, width: '100%', textAlign: 'center', padding: '13px 0', borderRadius: 999, background: '#1a8fff', color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: "'PixelifySans', var(--font-sans)", cursor: 'pointer' }}>
          {lang === 'es' ? 'Cerrar' : 'Close'}
        </button>
      </div>
    </window.Modal>);

}

Object.assign(window, { AboutModal });