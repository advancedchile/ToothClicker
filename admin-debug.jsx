// Admin Debug Tools
const { useState, useEffect } = React;

window.AdminAutoClicker = function AdminAutoClicker({ onSimulateClick, lang, isMainMouseDown }) {
  const [cpsRate, setCpsRate] = useState(0); // 0 = Normal, 5, 10, 15, 20
  
  useEffect(() => {
    if (cpsRate === 0 || !isMainMouseDown) return;
    
    const intervalTime = 1000 / cpsRate;
    const interval = setInterval(() => {
      // Fake coordinates near the center
      const w = window.innerWidth, h = window.innerHeight;
      onSimulateClick(w / 2 + (Math.random() - 0.5) * 50, h / 2 + (Math.random() - 0.5) * 50);
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [cpsRate, isMainMouseDown, onSimulateClick]);

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1000, background: 'var(--bg-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', padding: 8, display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--elevation-20)' }}>
      <i className="fa-solid fa-wrench" style={{ color: 'var(--primary-i100)' }}></i>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-1)' }}>Admin Auto-Click:</div>
      <window.Dropdown 
        value={cpsRate}
        onChange={(val) => setCpsRate(parseInt(val))}
        style={{ width: 140 }}
        options={[
          { value: 0, label: lang === 'es' ? 'Juego normal' : 'Normal game' },
          { value: 5, label: '5 clicks x seg' },
          { value: 10, label: '10 clicks x seg' },
          { value: 15, label: '15 clicks x seg' },
          { value: 20, label: '20 clicks x seg' }
        ]}
      />
    </div>
  );
};
