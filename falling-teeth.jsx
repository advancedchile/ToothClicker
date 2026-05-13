function FallingTeethSimulation({ totalGenerators, clickPulse, toothImg }) {
  const containerRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const particlesRef = useRef([]);
  const lastSpawnRef = useRef(performance.now());
  const lastClickPulseRef = useRef(clickPulse);
  const animationRef = useRef(null);
  
  const stateRef = useRef({ totalGenerators, clickPulse, toothImg });
  useEffect(() => {
    stateRef.current = { totalGenerators, clickPulse, toothImg };
  }, [totalGenerators, clickPulse, toothImg]);

  useEffect(() => {
    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.max(0.001, Math.min((now - lastTime) / 1000, 0.1)); 
      lastTime = now;
      
      const width = containerRef.current ? containerRef.current.clientWidth : 300;
      const height = containerRef.current ? containerRef.current.clientHeight : 320;
      
      const st = stateRef.current;
      
      const createTooth = () => ({
        id: Math.random().toString(36),
        x: Math.random() * (width - 30),
        y: -40,
        vx: (Math.random() - 0.5) * 60,
        vy: 50 + Math.random() * 100, 
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 200,
        size: 15 + Math.random() * 25,
        state: 'falling', 
        life: 2 + Math.random() * 2,
        img: st.toothImg
      });

      if (st.clickPulse !== lastClickPulseRef.current) {
        const diff = st.clickPulse - lastClickPulseRef.current;
        lastClickPulseRef.current = st.clickPulse;
        for (let i = 0; i < diff; i++) {
          if (particlesRef.current.length < 400) {
            particlesRef.current.push(createTooth());
          }
        }
      }

      let rate = 0;
      if (st.totalGenerators > 0) {
        rate = (1 / 7) + Math.max(0, st.totalGenerators - 1) * 0.05; 
      }
      
      const spawnInterval = rate > 0 ? 1000 / rate : Infinity;
      
      if (rate > 0 && now - lastSpawnRef.current > spawnInterval) {
        if (particlesRef.current.length < 400) {
          particlesRef.current.push(createTooth());
        }
        lastSpawnRef.current = now;
      }

      let alive = [];
      const gravity = 800; 
      const bounceDamping = 0.5;

      for (let p of particlesRef.current) {
        if (p.state === 'falling') {
          p.vy += gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.rotV * dt;

          if (p.y + p.size > height - 10) { 
            p.y = height - 10 - p.size;
            p.vy = -p.vy * bounceDamping;
            
            if (Math.abs(p.vy) < 50) {
              p.state = 'resting';
              p.vy = 0;
              p.vx = 0;
              p.rotV = 0;
            }
          }
        } else if (p.state === 'resting') {
          p.life -= dt;
        }

        if (p.life > 0) alive.push(p);
      }

      particlesRef.current = alive;
      setParticles([...alive]);
      
      animationRef.current = requestAnimationFrame(tick);
    };
    
    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <img 
          key={p.id} 
          src={p.img || toothImg} 
          style={{ 
            position: 'absolute', 
            left: 0, top: 0, 
            width: p.size, height: p.size, 
            objectFit: 'contain',
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`,
            opacity: p.state === 'resting' ? Math.min(1, p.life) : 1, 
            transition: 'opacity 0.1s'
          }} 
          alt="" 
        />
      ))}
    </div>
  );
}
