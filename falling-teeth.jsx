const { useEffect, useRef } = React;
const { formatMusicTime } = window;

function FallingTeethSimulation({ totalGenerators, clickPulse, toothImg }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const lastSpawnRef = useRef(performance.now());
  const lastClickPulseRef = useRef(clickPulse);
  const animationRef = useRef(null);
  
  const stateRef = useRef({ totalGenerators, clickPulse, toothImg });
  useEffect(() => {
    stateRef.current = { totalGenerators, clickPulse, toothImg };
  }, [totalGenerators, clickPulse, toothImg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set up a map to cache loaded Image elements
    const imageCache = {};

    const getOrLoadImage = (src) => {
      if (!src) return null;
      if (imageCache[src]) return imageCache[src];
      
      const img = new Image();
      img.src = src;
      imageCache[src] = img;
      return img;
    };
    
    // Initialize resize handler
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = 300;
        canvas.height = 320;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.max(0.001, Math.min((now - lastTime) / 1000, 0.1)); 
      lastTime = now;
      
      const width = canvas.width;
      const height = canvas.height;
      const st = stateRef.current;

      const createTooth = () => ({
        x: Math.random() * (width - 30),
        y: -40,
        vx: (Math.random() - 0.5) * 60,
        vy: 50 + Math.random() * 100, 
        rot: Math.random() * 360 * Math.PI / 180,
        rotV: (Math.random() - 0.5) * 200 * Math.PI / 180,
        size: 15 + Math.random() * 25,
        state: 'falling', 
        life: 2 + Math.random() * 2,
        imgSrc: st.toothImg
      });

      // Handle click events (spawning teeth)
      if (st.clickPulse !== lastClickPulseRef.current) {
        const diff = st.clickPulse - lastClickPulseRef.current;
        lastClickPulseRef.current = st.clickPulse;
        for (let i = 0; i < diff; i++) {
          if (particlesRef.current.length < 400) {
            particlesRef.current.push(createTooth());
          }
        }
      }

      // Handle continuous auto click generator spawning
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

      // Physics loop
      let alive = [];
      const gravity = 800; 
      const bounceDamping = 0.5;

      // Clear the whole canvas frame at once
      ctx.clearRect(0, 0, width, height);

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

        if (p.life > 0) {
          alive.push(p);
          
          // Draw using context operations
          const imgElement = getOrLoadImage(p.imgSrc);
          if (imgElement && imgElement.complete) {
            ctx.save();
            ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
            ctx.rotate(p.rot);
            ctx.globalAlpha = p.state === 'resting' ? Math.max(0, Math.min(1, p.life)) : 1;
            try {
              ctx.drawImage(imgElement, -p.size / 2, -p.size / 2, p.size, p.size);
            } catch (e) {}
            ctx.restore();
          }
        }
      }

      particlesRef.current = alive;
      animationRef.current = requestAnimationFrame(tick);
    };
    
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 0 
      }} 
    />
  );
}

window.FallingTeethSimulation = FallingTeethSimulation;
