// Admin Debug Tools
const { useState, useEffect } = React;

window.AdminAutoClicker = function AdminAutoClicker({ onSimulateClick, lang, isMainMouseDown, isBlocked }) {
  const [cpsRate, setCpsRate] = useState(0); // 0 = Normal, 5, 10, 15, 20
  
  useEffect(() => {
    if (cpsRate === 0 || !isMainMouseDown || isBlocked) return;
    
    const intervalTime = 1000 / cpsRate;
    const interval = setInterval(() => {
      // Fake coordinates near the center
      const w = window.innerWidth, h = window.innerHeight;
      onSimulateClick(w / 2 + (Math.random() - 0.5) * 50, h / 2 + (Math.random() - 0.5) * 50);
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [cpsRate, isMainMouseDown, isBlocked, onSimulateClick]);

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1000, background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', padding: 8, display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--elevation-20)' }}>
      <i className="fa-solid fa-wrench" style={{ color: 'var(--primary-i100)' }}></i>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-1)' }}>Admin Auto-Click:</div>
      <select 
        value={cpsRate}
        onChange={(e) => setCpsRate(parseInt(e.target.value))}
        style={{ background: 'var(--bg-2)', color: 'var(--fg-1)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '4px 8px', fontSize: 12, outline: 'none' }}
      >
        <option value={0}>{lang === 'es' ? 'Juego normal' : 'Normal game'}</option>
        <option value={5}>5 clicks x seg</option>
        <option value={10}>10 clicks x seg</option>
        <option value={15}>15 clicks x seg</option>
        <option value={20}>20 clicks x seg</option>
      </select>
    </div>
  );
};
