const { useState, useEffect, useRef, useMemo } = React;
const NAME_COLORS = ['oklch(0.6 0.22 25)', 'oklch(0.55 0.25 295)', 'oklch(0.6 0.2 250)'];

const VALID_CHARS = [
  'ale', 'carlos', 'andrea', 'cami', 'chalo', 'cote', 'cotefi', 'cris',
  'dani', 'daniela', 'fabi', 'fenia', 'gabo', 'gianni', 'james', 'john',
  'jose_maria', 'juan', 'juanmi', 'juli', 'leo', 'lucho', 'manu', 'mari',
  'martin', 'mati', 'may', 'nico_flecha', 'nico_ojeda', 'palo', 'pancho',
  'pascal', 'patito', 'payo', 'rafa', 'sofi', 'tatan', 'tomi', 'vania', 'yisus'
];

function getAvatarUrl(who, customImage, msgId) {
  if (customImage) return customImage;
  if (!who) return null;
  
  let norm = who.toLowerCase().trim()
    .replace(/[áäàâ]/g, 'a')
    .replace(/[éëèê]/g, 'e')
    .replace(/[íïìî]/g, 'i')
    .replace(/[óöòô]/g, 'o')
    .replace(/[úüùû]/g, 'u')
    .replace(/ñ/g, 'nia')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (norm === 'feña') norm = 'fenia';

  if (norm === 'nico') {
    const val = typeof msgId === 'string' ? msgId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    return val % 2 === 0 ? 'assets/chars/nico_flecha.png' : 'assets/chars/nico_ojeda.png';
  }

  if (VALID_CHARS.includes(norm)) {
    if (norm === 'ale') return 'assets/chars/Ale.png';
    if (norm === 'carlos') return 'assets/chars/Carlos.png';
    return `assets/chars/${norm}.png`;
  }
  return null;
}

function BossMarquee({ msg, lang, danger, onDismiss }) {
  const [shown, setShown] = useState('');
  const [containerReady, setContainerReady] = useState(false);
  const messageBody = msg[lang] || msg.es;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // Color aleatorio para el nombre — se elige una vez por mensaje
  const nameColor = useMemo(() => NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)], [msg]);

  useEffect(() => {
    // 1) Mostrar el contenedor primero
    setShown('');
    setContainerReady(false);
    const showContainer = setTimeout(() => setContainerReady(true), 50);
    // 2) Empezar el typewriter después de que el contenedor entre
    let id;
    const startType = setTimeout(() => {
      let i = 0;
      id = setInterval(() => {
        i++;
        setShown(messageBody.slice(0, i));
        if (i >= messageBody.length) clearInterval(id);
      }, 28);
    }, 380);
    const dismissTimer = setTimeout(() => dismissRef.current && dismissRef.current(), 22000 + messageBody.length * 40);
    return () => { clearTimeout(showContainer); clearTimeout(startType); clearInterval(id); clearTimeout(dismissTimer); };
  }, [messageBody]);

  const bg = '#000';
  const accentColor = msg.color || '#1a8fff';
  const textColor = '#fff';
  const iconColor = danger ? 'oklch(0.85 0.2 25)' : accentColor;
  const finalNameColor = danger ? 'oklch(0.85 0.2 25)' : accentColor;
  const sayWord = lang === 'es' ? 'dice' : 'says';

  // Particle System
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!msg.particles || msg.particles === 'none') return;
    const count = msg.particles === 'confetti' ? 40 : 25;
    const p = Array.from({ length: count }, (_, i) => {
      const side = Math.floor(Math.random() * 4); 
      let x, y, vx, vy;
      if (side === 0) { x = Math.random() * 100; y = -5; vx = (Math.random()-0.5)*60; vy = -40 - Math.random()*60; }
      else if (side === 1) { x = 105; y = Math.random() * 100; vx = 40 + Math.random()*60; vy = (Math.random()-0.5)*60; }
      else if (side === 2) { x = Math.random() * 100; y = 105; vx = (Math.random()-0.5)*60; vy = 40 + Math.random()*60; }
      else { x = -5; y = Math.random() * 100; vx = -40 - Math.random()*60; vy = (Math.random()-0.5)*60; }

      return {
        id: i,
        x, y,
        vx, vy,
        s: 3 + Math.random() * 5,
        rot: Math.random() * 360,
        delay: Math.random() * 2,
        dur: 0.8 + Math.random() * 1.2
      };
    });
    setParticles(p);
  }, [msg]);

  const posStyles = {
    top: { top: 40, bottom: 'auto' },
    center: { top: '50%', transform: 'translateY(-50%)', bottom: 'auto' },
    bottom: { bottom: 20, top: 'auto' }
  };
  const sizeStyles = {
    small: { maxWidth: 600, fontSize: 13 },
    medium: { maxWidth: 900, fontSize: 15 },
    large: { maxWidth: 1200, fontSize: 18 }
  };
  const animClass = msg.animation && msg.animation !== 'none' ? `anim-${msg.animation}` : '';

  return (
    <div style={{ position: 'fixed', left: 16, right: 16, zIndex: 1500, display: 'flex', justifyContent: 'center', pointerEvents: 'none', ...posStyles[msg.position || 'bottom'] }}>
      {/* Particles Layer */}
      {particles.map(pt => (
        <div key={pt.id} className={`particle-${msg.particles}`} style={{
          position: 'absolute', left: `${pt.x}%`, top: `${pt.y}%`, width: pt.s, height: pt.s,
          pointerEvents: 'none', zIndex: 1, opacity: 0,
          '--vx': `${pt.vx}px`, '--vy': `${pt.vy}px`, '--rot': `${pt.rot}deg`,
          animation: `p-physics ${pt.dur}s ease-out ${pt.delay}s infinite`,
          filter: 'drop-shadow(0 0 3px currentColor)'
        }} />
      ))}
      
      <div className={animClass} style={{
        background: bg,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: (msg.animation === 'rainbow' && !danger) ? undefined : (danger ? 'oklch(0.6 0.25 25)' : accentColor),
        borderRadius: 'var(--radius-m)',
        padding: '16px 24px',
        boxShadow: (msg.animation === 'rainbow' && !danger) ? undefined : `0 0 30px ${accentColor}44, 0 10px 40px rgba(0,0,0,0.5)`,
        width: '100%',
        ...sizeStyles[msg.size || 'medium'],
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        animation: `${danger ? 'dangerPulse 0.8s ease-in-out infinite, ' : ''}modalIn 280ms ease${(msg.animation && msg.animation !== 'none') ? `, ${msg.animation === 'rainbow' ? 'rainbowBorder 2.5s linear' : 'anim-' + msg.animation + ' ' + (msg.animation === 'shake' ? '0.2s' : msg.animation === 'float' ? '1.5s' : '1s') + ' ease-in-out'} infinite` : ''}`,
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'visible'
      }}>
        {/* Glow effect */}
        <div style={{ position: 'absolute', inset: -2, borderRadius: 'inherit', background: `linear-gradient(45deg, ${accentColor}, transparent, ${accentColor})`, opacity: 0.3, zIndex: -1 }}></div>

        {(() => {
          if (danger) {
            return <i className="fa-solid fa-triangle-exclamation" style={{ color: iconColor, fontSize: 24, flex: '0 0 auto', filter: `drop-shadow(0 0 8px ${iconColor})` }}></i>;
          }
          const avatarUrl = getAvatarUrl(msg.who, msg.image, msg.id);
          if (avatarUrl) {
            return (
              <img
                src={avatarUrl}
                alt={msg.who}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flex: '0 0 auto',
                  border: `2px solid ${accentColor}`,
                  boxShadow: `0 0 16px ${accentColor}44`,
                  filter: `drop-shadow(0 0 4px ${accentColor}44)`
                }}
              />
            );
          } else {
            return (
              <div style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#1e293b',
                border: `2px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: iconColor,
                flex: '0 0 auto',
                boxShadow: `0 0 16px ${accentColor}44`
              }}>
                <i className="fa-solid fa-user" style={{ fontSize: 28 }}></i>
              </div>
            );
          }
        })()}
        <div style={{ fontSize: 'inherit', color: textColor, fontFamily: 'var(--font-sans)', lineHeight: 1.5, fontWeight: 500, textAlign: 'left', flex: 1, minWidth: 0 }}>
          {!messageBody.startsWith(msg.who + ' dice') && !messageBody.startsWith(msg.who + ' says') && (
            <span style={{ color: finalNameColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${finalNameColor}44`, paddingBottom: 2 }}>
              {msg.who} {sayWord}:
            </span>
          )}
          <span style={{ display: 'block', marginTop: (!messageBody.startsWith(msg.who + ' dice') && !messageBody.startsWith(msg.who + ' says')) ? 4 : 0 }}>
            {containerReady && (<>
              {shown}
              {shown.length < messageBody.length && <span style={{ display: 'inline-block', width: 2, height: '1em', background: textColor, marginLeft: 1, verticalAlign: 'middle', animation: 'cursorBlink 0.8s steps(1) infinite' }}></span>}
            </>)}
          </span>
        </div>
        <button 
          onClick={() => onDismiss()}
          style={{ all: 'unset', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.2)' }}
          className="hover-bg-danger"
        >
          <i className="fa-solid fa-xmark" style={{ fontSize: 14 }}></i>
        </button>
      </div>
    </div>
  );
}

window.BossMarquee = BossMarquee;
