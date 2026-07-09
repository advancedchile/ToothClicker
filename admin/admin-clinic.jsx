const { useState, useRef, useEffect } = React;

const ShadowAdjustModalContent = ({ formData, initialParams, onClose, onSave }) => {
  const [params, setParams] = useState(initialParams || {
    corners: null, imgWidth: 0, imgHeight: 0, blur: 4, opacity: 0.25,
    globalOffsetX: 0, globalOffsetY: 0, globalScale: 1
  });
  const [draggingCorner, setDraggingCorner] = useState(null);
  const [draggingShadow, setDraggingShadow] = useState(null);
  const imgContainerRef = useRef(null); // Ref to the image wrapper to calculate local coords
  const imageElRef = useRef(null);

  const initCorners = (w, h) => {
    setParams(prev => {
      if (prev.corners) return prev;
      return {
        ...prev,
        imgWidth: w,
        imgHeight: h,
        corners: [
          { x: 0, y: h * 0.6 },
          { x: w, y: h * 0.6 },
          { x: w, y: h },
          { x: 0, y: h }
        ],
        globalOffsetX: prev.globalOffsetX !== undefined ? prev.globalOffsetX : 0,
        globalOffsetY: prev.globalOffsetY !== undefined ? prev.globalOffsetY : 0,
        globalScale: prev.globalScale !== undefined ? prev.globalScale : 1,
        blur: prev.blur !== undefined ? prev.blur : 4,
        opacity: prev.opacity !== undefined ? prev.opacity : 0.25
      };
    });
  };

  const handleImgLoad = (e) => {
    if (params.corners) return;
    const w = e.target.offsetWidth;
    const h = e.target.offsetHeight;
    if (w > 0 && h > 0) {
      initCorners(w, h);
    }
  };

  useEffect(() => {
    let frameId;
    const checkImage = () => {
      if (params.corners) return; // Ya está inicializado
      if (imageElRef.current && imageElRef.current.complete) {
        const w = imageElRef.current.offsetWidth;
        const h = imageElRef.current.offsetHeight;
        if (w > 0 && h > 0) {
          initCorners(w, h);
          return;
        }
      }
      frameId = requestAnimationFrame(checkImage);
    };
    checkImage();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [params.corners]);

  const getMatrix = () => {
    if (!params.corners || !params.imgWidth || !params.imgHeight || !window.solveHomography) return 'none';
    const w = params.imgWidth;
    const h = params.imgHeight;
    const src = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
    const h_mat = window.solveHomography(src, params.corners);
    return `translate(${params.globalOffsetX || 0}px, ${params.globalOffsetY || 0}px) scale(${params.globalScale || 1}) matrix3d(${h_mat.join(',')})`;
  };

  const handlePointerDown = (e, index) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setDraggingCorner(index);
  };

  const handleShadowPointerDown = (e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setDraggingShadow({
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: params.globalOffsetX || 0,
      startOffsetY: params.globalOffsetY || 0
    });
  };

  const handlePointerMove = (e) => {
    if (draggingCorner !== null) {
      if (!imgContainerRef.current || !params.corners) return;
      const rect = imgContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gx = params.globalOffsetX !== undefined ? params.globalOffsetX : 0;
      const gy = params.globalOffsetY !== undefined ? params.globalOffsetY : 0;
      const gs = params.globalScale !== undefined ? params.globalScale : 1;
      const newCorners = [...params.corners];
      newCorners[draggingCorner] = { x: (x - gx) / gs, y: (y - gy) / gs };
      setParams({ ...params, corners: newCorners });
    } else if (draggingShadow !== null) {
      const dx = e.clientX - draggingShadow.startX;
      const dy = e.clientY - draggingShadow.startY;
      setParams({
        ...params,
        globalOffsetX: draggingShadow.startOffsetX + dx,
        globalOffsetY: draggingShadow.startOffsetY + dy
      });
    }
  };

  const handlePointerUp = (e) => {
    if (draggingCorner !== null) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) { }
      setDraggingCorner(null);
    }
    if (draggingShadow !== null) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) { }
      setDraggingShadow(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '85vh', padding: 24, gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 20, color: 'var(--fg-1)' }}>Ajustar Sombra: {(formData.name && formData.name.es) || 'Asset'}</h2>
        <button className="app-btn" onClick={onClose} style={{ background: 'var(--bg-3)', color: 'var(--fg-3)', padding: '6px 12px' }}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 24 }}>
        {/* Preview Area */}
        <div
          style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <svg width="200%" height="200%" style={{ position: 'absolute', top: '-50%', left: '-50%', zIndex: 0, pointerEvents: 'none' }}>
            <defs>
              <pattern id="iso-minor-modal" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="scale(1, 0.57735) rotate(45)">
                <rect width="40" height="40" fill="none" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.3" vectorEffect="non-scaling-stroke" />
              </pattern>
              <pattern id="iso-major-modal" width="200" height="200" patternUnits="userSpaceOnUse" patternTransform="scale(1, 0.57735) rotate(45)">
                <rect width="200" height="200" fill="none" stroke="#60a5fa" strokeWidth="2" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#iso-minor-modal)" />
            <rect width="100%" height="100%" fill="url(#iso-major-modal)" />
          </svg>

          <div style={{ position: 'relative', zIndex: 1 }} ref={imgContainerRef}>
            {/* Contenedor de la Sombra */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                zIndex: -1
              }}
            >
              {params.corners && (
                <img
                  src={formData.iconUrl || 'assets/clinic/clinica-dental-1.png'}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transformOrigin: 'top left',
                    transform: getMatrix(),
                    filter: `brightness(0) opacity(${params.opacity}) blur(${params.blur}px)`,
                    pointerEvents: 'auto',
                    cursor: 'move'
                  }}
                  onPointerDown={handleShadowPointerDown}
                  alt=""
                  draggable={false}
                />
              )}
            </div>

            <img
              ref={imageElRef}
              src={formData.iconUrl || 'assets/clinic/clinica-dental-1.png'}
              onLoad={handleImgLoad}
              style={{
                display: 'block',
                maxWidth: 250,
                height: 'auto',
                transform: formData.flipX ? `scaleX(-1)` : 'none',
                pointerEvents: 'none'
              }}
              alt="Asset Preview"
              draggable={false}
            />

            {/* Tiradores de las esquinas */}
            {params.corners && params.corners.map((corner, i) => {
              const gx = params.globalOffsetX !== undefined ? params.globalOffsetX : 0;
              const gy = params.globalOffsetY !== undefined ? params.globalOffsetY : 0;
              const gs = params.globalScale !== undefined ? params.globalScale : 1;
              const finalX = corner.x * gs + gx;
              const finalY = corner.y * gs + gy;
              return (
                <div
                  key={i}
                  onPointerDown={(e) => handlePointerDown(e, i)}
                  style={{
                    position: 'absolute',
                    left: finalX,
                    top: finalY,
                    width: 20,
                    height: 20,
                    transform: 'translate(-50%, -50%)',
                    background: '#fff',
                    border: '3px solid var(--primary-i100)',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    zIndex: 10
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Controls Area */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 8 }}>
          <div style={{ padding: 12, background: 'var(--bg-3)', borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.4 }}>
              <i className="fa-solid fa-info-circle" style={{ marginRight: 6 }}></i>
              Arrastra los círculos en la previsualización para deformar la sombra. Usa estos controles para moverla o cambiar su tamaño global.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--fg-2)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Posición Global X</span>
              <span style={{ color: 'var(--primary-i100)' }}>{params.globalOffsetX || 0}px</span>
            </label>
            <input type="range" min="-200" max="200" step="1" value={params.globalOffsetX || 0} onChange={e => setParams({ ...params, globalOffsetX: parseInt(e.target.value) })} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--fg-2)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Posición Global Y</span>
              <span style={{ color: 'var(--primary-i100)' }}>{params.globalOffsetY || 0}px</span>
            </label>
            <input type="range" min="-200" max="200" step="1" value={params.globalOffsetY || 0} onChange={e => setParams({ ...params, globalOffsetY: parseInt(e.target.value) })} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--fg-2)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Tamaño Global</span>
              <span style={{ color: 'var(--primary-i100)' }}>{params.globalScale || 1}</span>
            </label>
            <input type="range" min="0.1" max="3" step="0.05" value={params.globalScale || 1} onChange={e => setParams({ ...params, globalScale: parseFloat(e.target.value) })} style={{ width: '100%' }} />
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--fg-2)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Difuminado (Blur)</span>
              <span style={{ color: 'var(--primary-i100)' }}>{params.blur}px</span>
            </label>
            <input type="range" min="0" max="20" step="0.5" value={params.blur} onChange={e => setParams({ ...params, blur: parseFloat(e.target.value) })} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--fg-2)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Opacidad</span>
              <span style={{ color: 'var(--primary-i100)' }}>{params.opacity}</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={params.opacity} onChange={e => setParams({ ...params, opacity: parseFloat(e.target.value) })} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="app-btn" onClick={onClose} style={{ flex: 1, background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
        <button className="app-btn" onClick={() => onSave(params)} style={{ flex: 1, background: 'var(--primary-i100)', color: '#fff' }}>
          <i className="fa-solid fa-check"></i> Guardar Sombra
        </button>
      </div>
    </div>
  );
};

const AdminClinicMapBuilder = function ({ lang, setToast, onClose }) {
  if (!window.CLINIC_TILES) {
    window.CLINIC_TILES = [
      { id: 'floor_default', name: 'Piso', type: 'floor', colorTop: '#EAE4DC', colorLeft: '#d6cfc4', colorRight: '#c4bcae', height: 10, w: 200, l: 200 },
      { id: 'wall_custom', type: 'wall', name: 'Pared', width: 200, length: 20, height: 300, colorTop: '#F2F8FF', colorLeft: '#E2F1FF', colorRight: '#D2E6FA', cost: 50 },
      { id: 'wall_custom_y', type: 'wall', name: 'Pared', width: 20, length: 200, height: 300, colorTop: '#F2F8FF', colorLeft: '#E2F1FF', colorRight: '#D2E6FA', cost: 50, hidden: true }
    ];
  }

  const [tiles, setTiles] = React.useState(() => {
    const initial = window.CLINIC_MAP_TILES || [];
    return initial.map(t => {
      if (t.colorTop) return t; // Already has saved colors
      const def = window.CLINIC_TILES.find(d => d.id === t.id);
      if (!def) return t;
      return {
        ...t,
        colorTop: def.colorTop,
        colorLeft: def.colorLeft,
        colorRight: def.colorRight
      };
    });
  });
  const [activeTool, setActiveTool] = React.useState(null);
  const [hoverCell, setHoverCell] = React.useState(null);
  const [hoverSub, setHoverSub] = React.useState('x');
  const [hoverTileKey, setHoverTileKey] = React.useState(null);
  const [updateTrigger, setUpdateTrigger] = React.useState(0);

  const [mapAreas, setMapAreas] = React.useState(window.CLINIC_MAP_AREAS || []);
  const [areas, setAreas] = React.useState(window.CLINIC_AREAS || []);
  const [selectionStart, setSelectionStart] = React.useState(null);
  const selectionStartRef = React.useRef(null);
  const [selectionCurrent, setSelectionCurrent] = React.useState(null);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [showAreaModal, setShowAreaModal] = React.useState(false);
  const [areaFormData, setAreaFormData] = React.useState({ id: null, name: '', reqLevel: 0, price: 0 });
  const [hoveredAreaId, setHoveredAreaId] = React.useState(null);

  const adjustColor = React.useCallback((hex, percent) => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, Math.max(0, parseInt(r * (100 + percent) / 100)));
    g = Math.min(255, Math.max(0, parseInt(g * (100 + percent) / 100)));
    b = Math.min(255, Math.max(0, parseInt(b * (100 + percent) / 100)));

    const RR = ((r.toString(16).length === 1) ? "0" + r.toString(16) : r.toString(16));
    const GG = ((g.toString(16).length === 1) ? "0" + g.toString(16) : g.toString(16));
    const BB = ((b.toString(16).length === 1) ? "0" + b.toString(16) : b.toString(16));

    return "#" + RR + GG + BB;
  }, []);

  const handleColorChange = React.useCallback((id, newColor) => {
    const tileDef = window.CLINIC_TILES.find(d => d.id === id);
    if (tileDef) {
      tileDef.colorTop = newColor;
      tileDef.colorLeft = adjustColor(newColor, -10);
      tileDef.colorRight = adjustColor(newColor, -20);

      if (id === 'wall_custom') {
        const yWall = window.CLINIC_TILES.find(d => d.id === 'wall_custom_y');
        if (yWall) {
          yWall.colorTop = tileDef.colorTop;
          yWall.colorLeft = tileDef.colorLeft;
          yWall.colorRight = tileDef.colorRight;
        }
      }
      setUpdateTrigger(prev => prev + 1);
    }
  }, [adjustColor]);

  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const pos = React.useRef({ x: 0, y: 0 });
  const vel = React.useRef({ x: 0, y: 0 });
  const scale = React.useRef({ current: 0.1, target: 0.1 });
  const zoomCenter = React.useRef(null);

  const isDragging = React.useRef(false);
  const lastMouse = React.useRef({ x: 0, y: 0 });
  const rafRef = React.useRef(null);
  const imageSize = { w: 4096, h: 2286 };
  const lastClickRef = React.useRef({ time: 0, instId: null, timeout: null });

  // Trigger re-render occasionally if we need states updated, but mostly handled by refs
  const [, setTick] = React.useState(0);

  const enforceBounds = (p, currentScale) => {
    if (!containerRef.current) return p;
    const rect = containerRef.current.getBoundingClientRect();

    const boundMinX = Math.min(rect.width - 7000 * currentScale, 3000 * currentScale);
    const boundMaxX = Math.max(rect.width - 7000 * currentScale, 3000 * currentScale);
    const boundMinY = Math.min(rect.height - 4000 * currentScale, 2000 * currentScale);
    const boundMaxY = Math.max(rect.height - 4000 * currentScale, 2000 * currentScale);

    return {
      x: Math.max(boundMinX, Math.min(boundMaxX, p.x)),
      y: Math.max(boundMinY, Math.min(boundMaxY, p.y))
    };
  };

  const updateTransform = () => {
    if (mapRef.current) {
      mapRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) scale(${scale.current.current})`;
    }
    setTick(t => t + 1); // trigger re-render for ghost tile transform
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
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (!containerRef.current) return;

      if (!window.__zoomAccum) window.__zoomAccum = 0;
      window.__zoomAccum += e.deltaY;

      if (Math.abs(window.__zoomAccum) < 30) return;
      const isZoomingIn = window.__zoomAccum < 0;
      window.__zoomAccum = 0;

      const rect = containerRef.current.getBoundingClientRect();
      zoomCenter.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      const minScale = baseScale * 0.5;
      let levels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
      levels = levels.filter(l => l >= minScale);
      if (levels[0] > minScale) levels.unshift(minScale);

      let currIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < levels.length; i++) {
        const diff = Math.abs(levels[i] - scale.current.target);
        if (diff < minDiff) {
          minDiff = diff;
          currIdx = i;
        }
      }

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
    return () => {
      if (node) node.removeEventListener('wheel', handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePointerDown = (e) => {
    if ((e.button === 0 && !activeTool) || e.button === 1) {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      vel.current = { x: 0, y: 0 };
      e.currentTarget.setPointerCapture(e.pointerId);
      startPhysicsLoop();
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      if (lastClickRef.current && lastClickRef.current.timeout) {
        clearTimeout(lastClickRef.current.timeout);
        lastClickRef.current.timeout = null;
        lastClickRef.current.instId = null;
      }
    }

    pos.current.x += dx;
    pos.current.y += dy;

    vel.current.x = vel.current.x * 0.5 + dx * 0.5;
    vel.current.y = vel.current.y * 0.5 + dy * 0.5;

    lastMouse.current = { x: e.clientX, y: e.clientY };
    updateTransform();
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    if (e && e.currentTarget && e.pointerId !== undefined) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) { }
    }
    startPhysicsLoop();
  };

  const handleZoom = (factor) => {
    zoomCenter.current = null;
    const newTarget = Math.max(0.1, Math.min(3, scale.current.target * factor));
    scale.current.target = newTarget;
    startPhysicsLoop();
  };

  const isAreaColliding = (areaId, ax, ay, ignoreInstId = null) => {
    const areaDef = areas.find(a => a.id === areaId);
    if (!areaDef) return false;
    const minX = ax;
    const maxX = ax + areaDef.width - 1;
    const minY = ay;
    const maxY = ay + areaDef.length - 1;

    return mapAreas.some(inst => {
      if (inst.id === ignoreInstId) return false;
      const oDef = areas.find(a => a.id === inst.areaId);
      if (!oDef) return false;
      const oMinX = inst.x;
      const oMaxX = inst.x + oDef.width - 1;
      const oMinY = inst.y;
      const oMaxY = inst.y + oDef.length - 1;

      return (minX <= oMaxX && maxX >= oMinX && minY <= oMaxY && maxY >= oMinY);
    });
  };

  const handleTileAction = (x, y, sub = hoverSub) => {
    if (!activeTool || activeTool === 'select_area') return;

    if (activeTool.startsWith('area_')) {
      const areaId = activeTool.replace('area_', '');
      const areaDef = areas.find(a => a.id === areaId);
      if (!areaDef) return;
      const targetX = x - Math.floor(areaDef.width / 2);
      const targetY = y - Math.floor(areaDef.length / 2);
      if (isAreaColliding(areaId, targetX, targetY)) return;
      setMapAreas(prev => [...prev, {
        id: window.crypto.randomUUID(),
        areaId: areaId,
        x: targetX,
        y: targetY
      }]);
      setActiveTool(null); // Detach tool after placing
      return;
    }

    let toolToUse = activeTool;
    if (activeTool === 'wall_custom') {
      toolToUse = sub === 'y' ? 'wall_custom_y' : 'wall_custom';
    }

    const def = window.CLINIC_TILES.find(d => d.id === toolToUse);
    if (!def) return;

    setTiles(prev => {
      const next = prev.filter(t => t.x !== x || t.y !== y);
      const existing = prev.filter(t => t.x === x && t.y === y);
      let z = 0;
      if (existing.length > 0) {
        if (def.type === 'floor') return prev; // No piso sobre otra cosa

        // Prevent duplicate wall of same orientation
        const hasSameWall = existing.some(t => t.id === toolToUse);
        if (hasSameWall) return prev;

        z = existing.reduce((sum, t) => {
          const d2 = window.CLINIC_TILES.find(dd => dd.id === t.id);
          return sum + (d2 && d2.type === 'floor' ? (d2.height || 0) : 0);
        }, 0);
        next.push(...existing);
      }
      next.push({ id: toolToUse, x, y, z, colorTop: def.colorTop, colorLeft: def.colorLeft, colorRight: def.colorRight });
      return next;
    });
  };

  const handleRightClick = (e, x, y) => {
    e.preventDefault();
    if (activeTool) {
      setActiveTool(null);
    } else if (x !== undefined && y !== undefined) {
      // Check if we hit a Map Area first
      let hitArea = null;
      for (let i = mapAreas.length - 1; i >= 0; i--) {
        const inst = mapAreas[i];
        const areaDef = areas.find(a => a.id === inst.areaId);
        if (areaDef) {
          // Check if x, y falls within the area's bounding box
          if (x >= inst.x && x < inst.x + areaDef.width && y >= inst.y && y < inst.y + areaDef.length) {
            // Check if there is an actual tile here
            const hasTile = areaDef.tiles.some(t => t.dx === x - inst.x && t.dy === y - inst.y);
            if (hasTile) {
              hitArea = inst.id;
              break;
            }
          }
        }
      }

      if (hitArea) {
        setMapAreas(prev => prev.filter(a => a.id !== hitArea));
        return;
      }

      // Erase regular tile
      setTiles(prev => {
        const atPos = prev.filter(t => t.x === x && t.y === y).sort((a, b) => b.z - a.z);
        if (atPos.length === 0) return prev;
        const top = atPos[0];
        return prev.filter(t => t !== top);
      });
    }
  };

  const [saveStatus, setSaveStatus] = React.useState(false);
  const [isSavingMap, setIsSavingMap] = React.useState(false);

  const saveMap = async () => {
    setIsSavingMap(true);
    try {
      const currentContent = window.GAME_CONTENT || {};
      currentContent.clinicMapTiles = tiles;
      currentContent.clinicAreas = areas;
      currentContent.clinicMapAreas = mapAreas;
      window.GAME_CONTENT = currentContent;

      // Actualizar variables globales para que al reabrir el modal sin refrescar, sigan ahí
      window.CLINIC_MAP_TILES = tiles;
      window.CLINIC_AREAS = areas;
      window.CLINIC_MAP_AREAS = mapAreas;

      // Verificar si estamos editando una plantilla
      const lastEdited = localStorage.getItem('admin_last_edited_template');
      let isTemplate = false;
      let templateInfo = null;
      if (lastEdited) {
        try {
          templateInfo = JSON.parse(lastEdited);
          isTemplate = true;
        } catch (e) { }
      }

      if (isTemplate && templateInfo && window.cloudSaveTemplate) {
        // Guardar en la plantilla, NO en el juego en vivo!
        let savedLocally = false;
        const filePathToSave = templateInfo.path || `templates/plantilla-${templateInfo.id}.json`;
        try {
          const resp = await fetch('/api/save-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: filePathToSave, content: currentContent })
          });
          const result = await resp.json();
          if (result.ok) savedLocally = true;
        } catch (e) { }

        if (!savedLocally) {
          const res = await window.cloudSaveTemplate(templateInfo.id, templateInfo.name, currentContent);
          if (!res.ok) throw new Error(res.error || 'Template cloud save failed');
        }
      } else if (window.cloudSaveGameContent) {
        // Guardar en el juego en vivo
        const res = await window.cloudSaveGameContent(currentContent);
        if (!res.ok) throw new Error(res.error || 'Cloud save failed');
      }

      if (window.electronAPI) {
        await window.electronAPI.updateGameContent({ clinicMapTiles: tiles, clinicAreas: areas, clinicMapAreas: mapAreas });
      } else {
        const localContent = JSON.parse(localStorage.getItem('gameContent') || '{}');
        localContent.clinicMapTiles = tiles;
        localContent.clinicAreas = areas;
        localContent.clinicMapAreas = mapAreas;
        localStorage.setItem('gameContent', JSON.stringify(localContent));
      }

      window.dispatchEvent(new Event('clinicMapUpdated'));

      setSaveStatus(true);
      setTimeout(() => setSaveStatus(false), 2000);
    } catch (e) {
      console.error(e);
      if (setToast) setToast({ type: 'error', message: 'Error al guardar.' });
    } finally {
      setIsSavingMap(false);
    }
  };

  // Helper to generate pointer events for grid cells and 3D tiles
  const getTileEvents = (x, y, tileKey = null) => ({
    onPointerDown: (e) => {
      if (activeTool && activeTool !== 'select_area' || e.button === 2) e.stopPropagation();
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) { }

      if (activeTool === 'select_area' && e.button === 0) {
        setIsSelecting(true);
        setSelectionStart({ x, y });
        setSelectionCurrent({ x, y });
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const isRightHalf = e.clientX > (rect.left + rect.width / 2);
      const sub = isRightHalf ? 'x' : 'y';
      if (activeTool && activeTool.startsWith('wall_')) setHoverSub(sub);

      if (e.button === 0) {
        let hitArea = null;
        if (!activeTool) {
          for (let i = mapAreas.length - 1; i >= 0; i--) {
            const inst = mapAreas[i];
            const areaDef = areas.find(a => a.id === inst.areaId);
            if (areaDef) {
              if (x >= inst.x && x < inst.x + areaDef.width && y >= inst.y && y < inst.y + areaDef.length) {
                const hasTile = areaDef.tiles.some(t => t.dx === x - inst.x && t.dy === y - inst.y);
                if (hasTile) {
                  hitArea = inst;
                  break;
                }
              }
            }
          }
        }

        if (hitArea) {
          const now = Date.now();
          if (lastClickRef.current.instId === hitArea.id && now - lastClickRef.current.time < 300) {
            clearTimeout(lastClickRef.current.timeout);
            const areaDef = areas.find(a => a.id === hitArea.areaId);
            if (areaDef) {
              let wColor = '#F2F8FF', fColor = '#EAE4DC';
              if (areaDef.tiles && areaDef.tiles.length > 0) {
                const wTile = areaDef.tiles.find(t => window.CLINIC_TILES.find(d => d.id === t.id)?.type === 'wall');
                if (wTile) wColor = wTile.colorTop || window.CLINIC_TILES.find(d => d.id === wTile.id)?.colorTop || '#F2F8FF';
                const fTile = areaDef.tiles.find(t => window.CLINIC_TILES.find(d => d.id === t.id)?.type === 'floor');
                if (fTile) fColor = fTile.colorTop || window.CLINIC_TILES.find(d => d.id === fTile.id)?.colorTop || '#EAE4DC';
              }
              setAreaFormData({ id: areaDef.id, name: areaDef.name, reqLevel: areaDef.reqLevel, price: areaDef.price, wallColor: wColor, floorColor: fColor });
              setShowAreaModal(true);
            }
            lastClickRef.current.instId = null;
          } else {
            const timeout = setTimeout(() => {
              if (lastClickRef.current.timeout === timeout) {
                setMapAreas(prev => prev.filter(a => a.id !== hitArea.id));
                setActiveTool(`area_${hitArea.areaId}`);
              }
            }, 250);
            lastClickRef.current = { time: now, instId: hitArea.id, timeout };
          }
          return;
        }

        handleTileAction(x, y, sub);
      }
      else if (e.button === 2) handleRightClick(e, x, y);
    },
    onPointerMove: (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const isRightHalf = e.clientX > (rect.left + rect.width / 2);
      if (activeTool && activeTool.startsWith('wall_')) setHoverSub(isRightHalf ? 'x' : 'y');
    },
    onPointerEnter: (e) => {
      setHoverCell({ x, y });
      if (tileKey) setHoverTileKey(tileKey);

      if (activeTool === 'select_area' && e.buttons === 1) {
        setSelectionCurrent({ x, y });
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const isRightHalf = e.clientX > (rect.left + rect.width / 2);
      const sub = isRightHalf ? 'x' : 'y';
      if (activeTool && activeTool.startsWith('wall_')) setHoverSub(sub);

      if (e.buttons === 1 && (!activeTool || !activeTool.startsWith('area_'))) handleTileAction(x, y, sub);
      else if (e.buttons === 2) handleRightClick(e, x, y);
    },
    onPointerUp: (e) => {
      if (isDragging.current) return;

      if (activeTool === 'select_area' && e.button === 0) {
        setIsSelecting(false);
        if (selectionStart && selectionCurrent) {
           const minX = Math.min(selectionStart.x, selectionCurrent.x);
           const maxX = Math.max(selectionStart.x, selectionCurrent.x);
           const minY = Math.min(selectionStart.y, selectionCurrent.y);
           const maxY = Math.max(selectionStart.y, selectionCurrent.y);

           let wColor = '#F2F8FF', fColor = '#EAE4DC';
           const selectedTiles = tiles.filter(t => t.x >= minX && t.x <= maxX && t.y >= minY && t.y <= maxY);
           
           const wTile = selectedTiles.find(t => window.CLINIC_TILES.find(d => d.id === t.id)?.type === 'wall');
           if (wTile) wColor = wTile.colorTop || window.CLINIC_TILES.find(d => d.id === wTile.id)?.colorTop || '#F2F8FF';
           
           const fTile = selectedTiles.find(t => window.CLINIC_TILES.find(d => d.id === t.id)?.type === 'floor');
           if (fTile) fColor = fTile.colorTop || window.CLINIC_TILES.find(d => d.id === fTile.id)?.colorTop || '#EAE4DC';

           setAreaFormData(prev => ({ ...prev, id: null, wallColor: wColor, floorColor: fColor }));
           setShowAreaModal(true);
        }
        return;
      }
    },
    onPointerLeave: () => {
      // hoverCell not cleared here to avoid ghost flickering between adjacent tiles
      if (hoverTileKey === tileKey) setHoverTileKey(null);
    },
    onContextMenu: (e) => handleRightClick(e, x, y)
  });

  // Generate 30x30 clickable cells
  const cells = [];
  for (let x = 0; x < 30; x++) {
    for (let y = 0; y < 30; y++) {
      const gx = x * 200 + 8400;
      const gy = y * 200 - 3200;
      const svgX = (gx - gy) * 0.70710678;
      const svgY = (gx + gy) * 0.408248;
      const sx = svgX - 6144;
      const sy = svgY - 3429;

      const p1x = 200 * 0.70710678;
      const p1y = 200 * 0.408248;
      const p3x = -200 * 0.70710678;
      const p3y = 200 * 0.408248;
      const p2x = p1x + p3x;
      const p2y = p1y + p3y;
      const face = `0,0 ${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`;

      cells.push(
        <svg key={`c_${x}_${y}`} style={{ position: 'absolute', left: sx, top: sy, overflow: 'visible', zIndex: 0 }}>
          <polygon points={face} fill="rgba(255,255,255,0.05)" stroke="rgba(0,0,0,0.15)" style={{ pointerEvents: 'auto', cursor: activeTool ? 'crosshair' : 'grab' }} {...getTileEvents(x, y)} />
        </svg>
      );
    }
  }

  const btnStyle = {
    all: 'unset', boxSizing: 'border-box', width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', background: 'var(--bg-1)', color: 'var(--fg-1)',
    boxShadow: 'var(--elevation-30)', cursor: 'pointer', fontSize: 16,
    transition: 'all 0.2s', border: '1px solid var(--border-subtle)'
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 100001, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: 'calc(100% - 40px)', height: 'calc(100% - 40px)',
        background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-l)', boxShadow: 'var(--elevation-30)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}>Configurar Clínica</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div style={{ width: 280, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-1)', padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, padding: '8px', background: 'var(--primary-i10)', color: 'var(--primary-i100)', border: 'none', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>Áreas</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {areas.map(area => (
                <div
                  key={area.id}
                  onClick={() => setActiveTool(activeTool === `area_${area.id}` ? null : `area_${area.id}`)}
                  onMouseEnter={() => setHoveredAreaId(area.id)}
                  onMouseLeave={() => setHoveredAreaId(null)}
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: hoveredAreaId === area.id || activeTool === `area_${area.id}` ? 'var(--primary-i100)' : 'var(--fg-1)', transition: 'color 0.2s', position: 'relative' }}
                >
                  <div style={{ fontSize: 14, fontWeight: 'bold', flex: 1 }}>{area.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Nvl. {area.reqLevel || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}><i className="fa-solid fa-tooth"></i> {window.formatNumWithMode ? window.formatNumWithMode(area.price || 0, 'short', lang) : (window.formatNum ? window.formatNum(area.price || 0) : area.price || 0)}</div>
                  <div style={{ display: 'flex', opacity: hoveredAreaId === area.id ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: hoveredAreaId === area.id ? 'auto' : 'none' }}>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      let wColor = '#F2F8FF', fColor = '#EAE4DC';
                      if (area.tiles && area.tiles.length > 0) {
                        const wTile = area.tiles.find(t => window.CLINIC_TILES.find(d => d.id === t.id)?.type === 'wall');
                        if (wTile) wColor = wTile.colorTop || window.CLINIC_TILES.find(d => d.id === wTile.id)?.colorTop || '#F2F8FF';
                        const fTile = area.tiles.find(t => window.CLINIC_TILES.find(d => d.id === t.id)?.type === 'floor');
                        if (fTile) fColor = fTile.colorTop || window.CLINIC_TILES.find(d => d.id === fTile.id)?.colorTop || '#EAE4DC';
                      }
                      setAreaFormData({ 
                        id: area.id, 
                        name: area.name, 
                        reqLevel: area.reqLevel || 0, 
                        price: area.price || 0, 
                        activeColor: '#F2F8FF',
                        tiles: area.tiles ? [...area.tiles] : [],
                        width: area.width,
                        length: area.length,
                        fourWalls: area.fourWalls || false
                      });
                      setShowAreaModal(true);
                    }} style={{ all: 'unset', color: 'var(--primary-i100)', cursor: 'pointer', padding: '4px 8px' }}>
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('¿Eliminar este prefab de área?')) {
                        setAreas(prev => prev.filter(a => a.id !== area.id));
                        setMapAreas(prev => prev.filter(a => a.areaId !== area.id));
                        if (activeTool === `area_${area.id}`) setActiveTool(null);
                      }
                    }} style={{ all: 'unset', color: 'var(--danger-i100)', cursor: 'pointer', padding: '4px 8px' }}>
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {areas.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13, background: 'var(--bg-2)', borderRadius: 8 }}>No hay áreas. Arrastra sobre el mapa para crear una.</div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                className="app-btn"
                onClick={saveMap}
                disabled={isSavingMap || saveStatus}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'center', gap: 8,
                  background: saveStatus ? 'var(--positive-i100)' : 'var(--primary-i100)',
                  color: saveStatus ? 'var(--bg-1)' : '#fff', padding: '12px 0'
                }}
              >
                {isSavingMap ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{saveStatus ? 'Guardado Exitoso' : 'Guardar Mapa BD'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Canvas 3D */}
          <window.ThreeAdminClinicMap
            tiles={tiles}
            areas={areas}
            mapAreas={mapAreas}
            activeTool={activeTool}
            isAreaColliding={isAreaColliding}
            onGridClick={(x, y, isRightClick, sub) => {
              if (isRightClick) {
                handleRightClick({ preventDefault: () => {} }, x, y);
              } else {
                if (activeTool === 'select_area') return;
                
                let hitArea = null;
                if (!activeTool) {
                  for (let i = mapAreas.length - 1; i >= 0; i--) {
                    const inst = mapAreas[i];
                    const areaDef = areas.find(a => a.id === inst.areaId);
                    if (areaDef && x >= inst.x && x < inst.x + areaDef.width && y >= inst.y && y < inst.y + areaDef.length) {
                      if (areaDef.tiles.some(t => t.dx === x - inst.x && t.dy === y - inst.y)) { hitArea = inst; break; }
                    }
                  }
                }

                if (hitArea) {
                  const now = Date.now();
                  if (lastClickRef.current.instId === hitArea.id && now - lastClickRef.current.time < 300) {
                    clearTimeout(lastClickRef.current.timeout);
                    const areaDef = areas.find(a => a.id === hitArea.areaId);
                    if (areaDef) {
                      setAreaFormData({ 
                          id: areaDef.id, 
                          name: areaDef.name, 
                          reqLevel: areaDef.reqLevel, 
                          price: areaDef.price, 
                          activeColor: '#F2F8FF',
                          tiles: areaDef.tiles ? [...areaDef.tiles] : [],
                          width: areaDef.width,
                          length: areaDef.length,
                          fourWalls: areaDef.fourWalls || false
                      });
                      setShowAreaModal(true);
                    }
                    lastClickRef.current.instId = null;
                  } else {
                    const timeout = setTimeout(() => {
                      if (lastClickRef.current.timeout === timeout) {
                        setMapAreas(prev => prev.filter(a => a.id !== hitArea.id));
                        setActiveTool(`area_${hitArea.areaId}`);
                      }
                    }, 250);
                    lastClickRef.current = { time: now, instId: hitArea.id, timeout };
                  }
                  return;
                }
                // Only run handleTileAction if a tool is active (area creation on empty tiles is handled in onPointerDown)
                if (activeTool) handleTileAction(x, y, sub);
              }
            }}
            onGridDragStart={(x, y) => {
              setIsSelecting(true);
              selectionStartRef.current = { x, y };
              setSelectionStart({ x, y });
              setSelectionCurrent({ x, y });
            }}
            onGridDragEnd={(x, y) => {
              setIsSelecting(false);
              setSelectionCurrent({ x, y });
              const start = selectionStartRef.current;
              if (start) {
                  const minX = Math.min(start.x, x);
                  const maxX = Math.max(start.x, x);
                  const minY = Math.min(start.y, y);
                  const maxY = Math.max(start.y, y);
                  
                  // Auto-generate tiles
                  const newTiles = [];
                  for(let dx = 0; dx <= maxX - minX; dx++) {
                      for(let dy = 0; dy <= maxY - minY; dy++) {
                          // Floor
                          newTiles.push({ id: 'floor_default', z: 0, dx, dy, colorTop: '#EAE4DC', colorLeft: adjustColor('#EAE4DC', -10), colorRight: adjustColor('#EAE4DC', -20) });
                          
                          // Top Wall (if at dy === 0)
                          if (dy === 0) {
                              newTiles.push({ id: 'wall_custom', z: 0, dx, dy, colorTop: '#F2F8FF', colorLeft: adjustColor('#F2F8FF', -10), colorRight: adjustColor('#F2F8FF', -20) });
                          }
                          // Left Wall (if at dx === 0)
                          if (dx === 0) {
                              newTiles.push({ id: 'wall_custom_y', z: 0, dx, dy, colorTop: '#F2F8FF', colorLeft: adjustColor('#F2F8FF', -10), colorRight: adjustColor('#F2F8FF', -20) });
                          }
                      }
                  }
                  
                  setAreaFormData({ id: null, name: '', reqLevel: 0, price: 0, activeColor: '#F2F8FF', tiles: newTiles, width: maxX - minX + 1, length: maxY - minY + 1, fourWalls: false, minX, minY });
                  setShowAreaModal(true);
              }
            }}
          />
        </div>
      </div>
      {/* Area Modal */}
      {showAreaModal && (
        <window.Modal onClose={() => setShowAreaModal(false)} maxWidth={900} persistent={true}>
          <div style={{ display: 'flex', flexDirection: 'row', height: 600 }}>
            {/* Left Column: Settings */}
            <div style={{ width: 350, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', borderRight: '1px solid var(--border-subtle)' }}>
              <h2 style={{ margin: '0', fontSize: 20 }}>{areaFormData.id ? 'Editar Área' : 'Crear Área'}</h2>

              <div className="admin-form-row">
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nombre del Área</label>
                <input type="text" className="app-input" value={areaFormData.name} onChange={e => setAreaFormData({ ...areaFormData, name: e.target.value })} style={{ width: '100%' }} placeholder="Ej: Sala de Espera" />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Precio (Dientes)</label>
                  <window.AdminNumberInput className="app-input" value={areaFormData.price} onChange={e => setAreaFormData({ ...areaFormData, price: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nivel Requerido</label>
                  <window.AdminNumberInput className="app-input" value={areaFormData.reqLevel} onChange={e => setAreaFormData({ ...areaFormData, reqLevel: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              <div className="admin-form-row" style={{ marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
                  <input type="checkbox" checked={areaFormData.fourWalls || false} onChange={e => {
                      const checked = e.target.checked;
                      setAreaFormData(prev => {
                          const w = prev.width;
                          const l = prev.length;
                          let newTiles = [...prev.tiles];
                          if (checked) {
                              // Add bottom and right walls if missing
                              for(let dx = 0; dx < w; dx++) {
                                  if (!newTiles.find(t => t.dx === dx && t.dy === l - 1 && t.id === 'wall_custom')) {
                                      newTiles.push({ id: 'wall_custom', z: 0, dx, dy: l - 1, colorTop: '#F2F8FF', colorLeft: adjustColor('#F2F8FF', -10), colorRight: adjustColor('#F2F8FF', -20) });
                                  }
                              }
                              for(let dy = 0; dy < l; dy++) {
                                  if (!newTiles.find(t => t.dx === w - 1 && t.dy === dy && t.id === 'wall_custom_y')) {
                                      newTiles.push({ id: 'wall_custom_y', z: 0, dx: w - 1, dy, colorTop: '#F2F8FF', colorLeft: adjustColor('#F2F8FF', -10), colorRight: adjustColor('#F2F8FF', -20) });
                                  }
                              }
                          } else {
                              // Remove bottom and right walls
                              newTiles = newTiles.filter(t => {
                                  if (t.id === 'wall_custom' && t.dy === l - 1 && l > 1) return false;
                                  if (t.id === 'wall_custom_y' && t.dx === w - 1 && w > 1) return false;
                                  return true;
                              });
                          }
                          return { ...prev, fourWalls: checked, tiles: newTiles };
                      });
                  }} />
                  Activar las 4 paredes (Habitación cerrada)
                </label>
              </div>

              <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 8, marginTop: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--fg-1)', display: 'block', marginBottom: 8 }}>Pincel de Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={areaFormData.activeColor || '#F2F8FF'} onChange={e => setAreaFormData({...areaFormData, activeColor: e.target.value})} style={{ width: 48, height: 48, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 8 }} />
                  <input type="text" className="app-input" value={areaFormData.activeColor || '#F2F8FF'} onChange={e => setAreaFormData({...areaFormData, activeColor: e.target.value})} style={{ flex: 1, height: 48 }} />
                </div>
                
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {['#F2F8FF', '#EAE4DC', '#CADDFB', '#d9c0a3', '#ffcccc', '#ccffcc', '#ccccff'].map(c => (
                    <div key={c} onClick={() => setAreaFormData({...areaFormData, activeColor: c})} style={{ width: 24, height: 24, background: c, borderRadius: '50%', cursor: 'pointer', border: areaFormData.activeColor === c ? '2px solid var(--fg-1)' : '1px solid var(--border)' }} />
                  ))}
                </div>
                <p style={{ margin: '12px 0 0 0', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.4 }}>
                  Selecciona un color aquí, luego <b>haz clic en las baldosas o paredes</b> del modelo 3D para pintarlas.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 16 }}>
                <button className="app-btn" onClick={() => setShowAreaModal(false)} style={{ flex: 1, background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
                {areaFormData.id && (
                  <button className="app-btn" onClick={() => {
                    const clonedArea = {
                      id: window.crypto.randomUUID(),
                      name: areaFormData.name + ' (copia)',
                      price: parseInt(areaFormData.price) || 0,
                      reqLevel: parseInt(areaFormData.reqLevel) || 0,
                      tiles: areaFormData.tiles ? [...areaFormData.tiles] : [],
                      width: areaFormData.width,
                      length: areaFormData.length,
                      fourWalls: areaFormData.fourWalls || false
                    };
                    setAreas(prev => [...prev, clonedArea]);
                    setToast({ type: 'success', message: 'Área clonada' });
                    setShowAreaModal(false);
                  }} style={{ flex: 1, background: 'var(--bg-3)', color: 'var(--fg-1)' }}>
                    <i className="fa-solid fa-copy" style={{ marginRight: 6 }}></i>Clonar
                  </button>
                )}
                <button className="app-btn" onClick={() => {
                  if (!areaFormData.name) {
                     setToast({ type: 'error', message: 'El nombre es obligatorio' });
                     return;
                  }
                  
                  const isEdit = !!areaFormData.id;
                  if (isEdit) {
                    setAreas(prev => prev.map(a => a.id === areaFormData.id ? { ...a, name: areaFormData.name, price: parseInt(areaFormData.price) || 0, reqLevel: parseInt(areaFormData.reqLevel) || 0, tiles: areaFormData.tiles, fourWalls: areaFormData.fourWalls } : a));
                    setToast({ type: 'success', message: 'Área actualizada' });
                  } else {
                    const newArea = {
                      id: window.crypto.randomUUID(),
                      name: areaFormData.name,
                      price: parseInt(areaFormData.price) || 0,
                      reqLevel: parseInt(areaFormData.reqLevel) || 0,
                      tiles: areaFormData.tiles,
                      width: areaFormData.width,
                      length: areaFormData.length,
                      fourWalls: areaFormData.fourWalls
                    };
                    setAreas(prev => [...prev, newArea]);
                    const newInstance = { id: window.crypto.randomUUID(), areaId: newArea.id, x: areaFormData.minX, y: areaFormData.minY };
                    setMapAreas(prev => [...prev, newInstance]);
                    setToast({ type: 'success', message: 'Área creada' });
                  }
                  setShowAreaModal(false);
                }} style={{ flex: 1, background: 'var(--primary-i100)', color: '#fff' }}>{areaFormData.id ? 'Guardar' : 'Guardar Área'}</button>
              </div>
            </div>

            {/* Right Column: 3D Preview */}
            <div style={{ flex: 1, position: 'relative', background: 'var(--bg-1)' }}>
               <div key={areaFormData.viewMode || 'top'} style={{ width: '100%', height: '100%', animation: 'fadeIn 0.25s ease' }}>
                 {window.ThreeAreaPainter && (
                   <window.ThreeAreaPainter 
                       tiles={areaFormData.tiles || []} 
                       viewMode={areaFormData.viewMode || 'top'}
                       onTileClick={(tileIndex) => {
                           setAreaFormData(prev => {
                               const newTiles = [...prev.tiles];
                               const color = prev.activeColor || '#F2F8FF';
                               newTiles[tileIndex] = {
                                   ...newTiles[tileIndex],
                                   colorTop: color,
                                   colorLeft: adjustColor(color, -10),
                                   colorRight: adjustColor(color, -20)
                               };
                               return { ...prev, tiles: newTiles };
                           });
                       }}
                   />
                 )}
               </div>
               <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg-2)', padding: 8, borderRadius: 8, display: 'flex', gap: 8, boxShadow: 'var(--elevation-30)' }}>
                   <button 
                       onClick={() => setAreaFormData(prev => ({...prev, viewMode: 'top'}))} 
                       style={{ all: 'unset', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', background: (!areaFormData.viewMode || areaFormData.viewMode === 'top') ? 'var(--primary-i100)' : 'transparent', color: (!areaFormData.viewMode || areaFormData.viewMode === 'top') ? '#fff' : 'var(--fg-1)', fontWeight: 'bold', fontSize: 13 }}
                   >
                       Top
                   </button>
                   <button 
                       onClick={() => setAreaFormData(prev => ({...prev, viewMode: 'isometric'}))} 
                       style={{ all: 'unset', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', background: areaFormData.viewMode === 'isometric' ? 'var(--primary-i100)' : 'transparent', color: areaFormData.viewMode === 'isometric' ? '#fff' : 'var(--fg-1)', fontWeight: 'bold', fontSize: 13 }}
                   >
                       Isométrico
                   </button>
               </div>
            </div>
          </div>
        </window.Modal>
      )}
    </div>
  );
};

const AdminClinicView = function ({ lang, setToast }) {
  const [items, setItems] = useState([...(window.GAME_CONTENT.clinicAssets || [])]);
  const [areas, setAreas] = useState([...(window.GAME_CONTENT.clinicAreas || [])]);
  const [mapAreas, setMapAreas] = useState([...(window.GAME_CONTENT.clinicMapAreas || [])]);
  const [activeTool, setActiveTool] = useState('select_area');
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editLang, setEditLang] = useState('es');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [saveStatus, setSaveStatus] = useState(false);
  const [showMapBuilder, setShowMapBuilder] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: { es: '', en: '' },
    price: 0,
    interestRate: 1.15,
    reqLevel: 0,
    reqGeneratorId: '',
    reqGeneratorAmount: 0,
    iconUrl: 'assets/clinic/',
    flipX: false,
    hasShadow: true,
    upgrades: []
  });

  const [showUpgradesModal, setShowUpgradesModal] = useState(false);
  const [editingUpgradeIndex, setEditingUpgradeIndex] = useState(null);
  const [upgradeFormData, setUpgradeFormData] = useState(null);
  const [upgradeEditLang, setUpgradeEditLang] = useState('es');
  const [hoveredUpgrade, setHoveredUpgrade] = useState(null);
  const [upgradeErrors, setUpgradeErrors] = useState({ name: false, iconUrl: false });

  const [showShadowAdjustModal, setShowShadowAdjustModal] = useState(false);
  const [tempShadowParams, setTempShadowParams] = useState(null);

  const saveToGlobal = (newItems) => {
    setItems(newItems);
    if (window.GAME_CONTENT) window.GAME_CONTENT.clinicAssets = newItems;
    window.CLINIC_ASSETS = newItems;
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const item = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, item);
    saveToGlobal(newItems);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCopyName = (nameObj) => {
    const nameStr = (nameObj && nameObj.es) || (nameObj && nameObj.en) || (typeof nameObj === 'string' ? nameObj : '');
    if (!nameStr) return;
    navigator.clipboard.writeText(nameStr);
    if (setToast) {
      setToast({ id: 'copy_name_' + Date.now(), es: 'Nombre copiado al portapapeles', en: 'Name copied to clipboard' });
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    const item = items[index];
    setFormData({
      id: item.id || `clinic_${Date.now()}`,
      name: {
        es: (item.name && item.name.es) || (typeof item.name === 'string' ? item.name : '') || item.es || '',
        en: (item.name && item.name.en) || (typeof item.name === 'string' ? item.name : '') || item.en || ''
      },
      price: item.price || 0,
      interestRate: item.interestRate !== undefined ? item.interestRate : 1.15,
      reqLevel: item.reqLevel || 0,
      reqGeneratorId: item.reqGeneratorId || '',
      iconUrl: item.iconUrl || '',
      glbData: item.glbData || '',
      flipX: !!item.flipX,
      isWallAsset: item.isWallAsset || false,
      hasShadow: item.hasShadow !== false,
      shadowParams: item.shadowParams || null,
      upgrades: item.upgrades || []
    });
  };

  const handleAdd = () => {
    setEditingIndex('new');
    setFormData({
      id: `clinic_${Date.now()}`,
      name: { es: '', en: '' },
      price: 0,
      interestRate: 1.15,
      reqLevel: 0,
      reqGeneratorId: '',
      iconUrl: '',
      glbData: '',
      flipX: false,
      isWallAsset: false,
      hasShadow: true,
      shadowParams: null,
      upgrades: []
    });
  };

  const handleDelete = (index) => {
    setDeleteTarget(index);
  };

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      const newItems = [...items];
      newItems.splice(deleteTarget, 1);
      saveToGlobal(newItems);
      if (editingIndex === deleteTarget) setEditingIndex(null);
      setDeleteTarget(null);

      const newSelected = new Set();
      selectedItems.forEach(i => {
        if (i < deleteTarget) newSelected.add(i);
        else if (i > deleteTarget) newSelected.add(i - 1);
      });
      setSelectedItems(newSelected);
    }
  };

  const handleToggleSelect = (index) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedItems(newSet);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(items.map((_, i) => i)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const confirmBulkDelete = () => {
    const newItems = items.filter((_, i) => !selectedItems.has(i));
    saveToGlobal(newItems);
    setSelectedItems(new Set());
    setShowBulkDeleteModal(false);
    setEditingIndex(null);
  };

  const handleSaveForm = () => {
    const newItem = {
      ...(editingIndex !== 'new' ? items[editingIndex] : {}),
      id: formData.id,
      name: formData.name,
      es: formData.name.es,
      en: formData.name.en,
      price: Number(formData.price),
      interestRate: Number(formData.interestRate),
      reqLevel: Number(formData.reqLevel),
      reqGeneratorId: formData.reqGeneratorId,
      iconUrl: formData.iconUrl,
      flipX: formData.flipX,
      isWallAsset: formData.isWallAsset,
      hasShadow: formData.hasShadow,
      shadowParams: formData.shadowParams,
      upgrades: formData.upgrades || []
    };

    if (formData.glbData) {
      newItem.glbData = formData.glbData;
      newItem.is3D = true;
    } else {
      delete newItem.glbData;
      delete newItem.is3D;
    }

    const newItems = [...items];
    let newEditingIndex = editingIndex;
    if (editingIndex === 'new') {
      newItems.push(newItem);
      newEditingIndex = newItems.length - 1;
      setEditingIndex(newEditingIndex);
    } else {
      newItems[editingIndex] = newItem;
    }

    saveToGlobal(newItems);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleAddUpgrade = () => {
    setEditingUpgradeIndex('new');
    setUpgradeErrors({ name: false, iconUrl: false });
    setUpgradeFormData({
      id: `${formData.id}_upg_${Date.now()}`,
      name: { es: '', en: '' },
      price: 0,
      reqLevel: 0,
      reqGeneratorId: '',
      reqGeneratorAmount: 0,
      iconUrl: 'assets/clinic/',
      flipX: false
    });
  };

  const handleEditUpgrade = (index) => {
    setEditingUpgradeIndex(index);
    setUpgradeErrors({ name: false, iconUrl: false });
    const upg = formData.upgrades[index];
    setUpgradeFormData({
      id: upg.id || `${formData.id}_upg_${Date.now()}`,
      name: {
        es: (upg.name && upg.name.es) || (typeof upg.name === 'string' ? upg.name : '') || upg.es || '',
        en: (upg.name && upg.name.en) || (typeof upg.name === 'string' ? upg.name : '') || upg.en || ''
      },
      price: upg.price || 0,
      reqLevel: upg.reqLevel || 0,
      reqGeneratorId: upg.reqGeneratorId || '',
      reqGeneratorAmount: upg.reqGeneratorAmount || 0,
      iconUrl: upg.iconUrl || 'assets/clinic/',
      flipX: upg.flipX || false
    });
  };

  const handleDeleteUpgrade = (index) => {
    const newUpgrades = [...formData.upgrades];
    newUpgrades.splice(index, 1);
    setFormData({ ...formData, upgrades: newUpgrades });
  };

  const handleSaveUpgradeForm = () => {
    const errs = {
      name: !upgradeFormData.name.es,
      iconUrl: !upgradeFormData.iconUrl
    };

    setUpgradeErrors(errs);

    if (errs.name || errs.iconUrl) {
      return;
    }

    const newUpgrade = {
      ...upgradeFormData,
      es: upgradeFormData.name.es,
      en: upgradeFormData.name.en,
      price: Number(upgradeFormData.price),
      reqLevel: Number(upgradeFormData.reqLevel),
      reqGeneratorAmount: Number(upgradeFormData.reqGeneratorAmount),
    };

    const newUpgrades = [...formData.upgrades];
    if (editingUpgradeIndex === 'new') {
      newUpgrades.push(newUpgrade);
    } else {
      newUpgrades[editingUpgradeIndex] = newUpgrade;
    }

    setFormData({ ...formData, upgrades: newUpgrades });
    setEditingUpgradeIndex(null);
  };

  return (
    <div style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* List */}
      <div style={{ flex: 1, background: 'var(--bg-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              checked={items.length > 0 && selectedItems.size === items.length}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer', width: 16, height: 16 }}
            />
            <h2 style={{ margin: 0, fontSize: 18 }}>Clínica ({items.length})</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="app-btn" onClick={() => setShowMapBuilder(true)} style={{ background: 'var(--primary-i100)', color: '#fff', padding: '8px 16px', marginRight: 16 }}>
              <i className="fa-solid fa-map"></i> Configurar clínica
            </button>
            {selectedItems.size > 0 && (
              <button className="app-btn" onClick={() => setShowBulkDeleteModal(true)} style={{ background: 'var(--warning-i10)', color: 'var(--warning-i100)' }}>
                <i className="fa-solid fa-trash"></i> Eliminar ({selectedItems.size})
              </button>
            )}
            <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff' }}>
              <i className="fa-solid fa-plus"></i> Nuevo
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-1)', borderRadius: 8, border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 40, color: 'var(--fg-4)', marginBottom: 16 }}><i className="fa-solid fa-hospital"></i></div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--fg-1)' }}>Sin assets</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--fg-3)', fontSize: 14 }}>Aún no has creado ningún recurso para la clínica.</p>
              <button className="app-btn" onClick={handleAdd} style={{ background: 'var(--primary-i100)', color: '#fff', padding: '8px 16px' }}>
                <i className="fa-solid fa-plus"></i> Crear primer asset
              </button>
            </div>
          ) : items.map((item, i) => (
            <div
              key={i}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`admin-list-row ${editingIndex === i ? 'editing' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12,
                background: dragOverIndex === i ? 'var(--primary-i10)' : 'var(--bg-1)',
                borderRadius: 8,
                border: dragOverIndex === i ? '2px dashed var(--primary-i100)' : '1px solid var(--border)',
                cursor: 'grab',
                opacity: draggedIndex === i ? 0.5 : 1,
                userSelect: 'none'
              }}
              onClick={() => handleCopyName(item.name || item)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="fa-solid fa-grip-vertical" style={{ color: 'var(--fg-4)', cursor: 'grab', padding: '0 4px' }}></i>
                <input
                  type="checkbox"
                  checked={selectedItems.has(i)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleToggleSelect(i)}
                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                />
                <div style={{ fontWeight: 'bold', color: 'var(--fg-3)', minWidth: 24 }}>{i + 1}.</div>
                <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(window.GLBPreview && (item.glbData || item.modelUrl?.includes('.glb') || item.modelUrl?.includes('.gltf') || item.iconUrl?.includes('.glb') || item.iconUrl?.includes('.gltf') || item.is3D)) ? (
                    <window.GLBPreview url={item.glbData || item.modelUrl || item.iconUrl} flipX={item.flipX} size={120} autoRotate={false} isometric={true} scaleMultiplier={1.8} />
                  ) : (
                    <img src={item.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{(item.name && item.name.es) || item.es || (typeof item.name === 'string' ? item.name : '(Sin nombre)')}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Precio: {window.formatNum(item.price)} | Lvl Req: {item.reqLevel} {item.reqGeneratorId ? `| Gen: ${item.reqGeneratorId} (x${item.reqGeneratorAmount})` : ''}</div>
                </div>
              </div>
              <div className="row-actions" style={{ display: 'flex', gap: 8 }}>
                <button className="btn-edit-text" onClick={(e) => { e.stopPropagation(); handleEdit(i); }}>Editar</button>
                <button className="btn-delete-icon" onClick={(e) => { e.stopPropagation(); handleDelete(i); }}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      {editingIndex !== null && (
        <window.AdminEditorSidebar
          title={editingIndex === 'new' ? 'Nuevo Asset' : 'Editar Asset'}
          onClose={() => setEditingIndex(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <window.AdminImageUpload 
                currentImage={formData.iconUrl} 
                onImageChange={(url) => setFormData({...formData, iconUrl: url})} 
                size={120} style={{ marginBottom: 0, flexShrink: 0, border: formData.glbData ? 'none' : undefined, background: formData.glbData ? 'transparent' : undefined }}
                previewComponent={formData.glbData ? <window.GLBPreview url={formData.glbData} flipX={formData.flipX} size={120} autoRotate={false} isometric={true} scaleMultiplier={1.8} /> : null}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nombre</label>
                  <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
                    <button type="button" onClick={() => setEditLang('es')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: editLang === 'es' ? 'var(--primary-i100)' : 'transparent', color: editLang === 'es' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>ES</button>
                    <button type="button" onClick={() => setEditLang('en')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: editLang === 'en' ? 'var(--primary-i100)' : 'transparent', color: editLang === 'en' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>EN</button>
                  </div>
                </div>
                <input type="text" className="app-input" value={formData.name[editLang] || ''} onChange={e => setFormData({ ...formData, name: { ...formData.name, [editLang]: e.target.value } })} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="admin-form-row" style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Modelo 3D (.glb, opcional)</label>
              <window.AdminGlbUpload 
                currentGlb={formData.glbData} 
                onGlbChange={(data) => setFormData({...formData, glbData: data})} 
                onSnapshot={(dataUrl) => setFormData(prev => {
                  if (!prev.iconUrl || prev.iconUrl.startsWith('data:')) {
                    return {...prev, iconUrl: dataUrl};
                  }
                  return prev;
                })}
                height={240}
                isometric={true}
              />
            </div>

            <div className="admin-form-row" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: 'fit-content' }}>
                  <div style={{ position: 'relative', width: 44, height: 24, background: formData.isWallAsset ? 'var(--primary-i100)' : 'var(--bg-3)', borderRadius: 12, transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: formData.isWallAsset ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--fg-1)' }}>Asset de pared</span>
                  <input type="checkbox" checked={formData.isWallAsset} onChange={e => setFormData({ ...formData, isWallAsset: e.target.checked })} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Precio (Dientes)</label>
                <window.AdminNumberInput className="app-input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Tasa de Interés</label>
                <window.AdminNumberInput className="app-input" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} style={{ width: '100%' }} step="0.01" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nivel Requerido</label>
                <window.AdminNumberInput className="app-input" value={formData.reqLevel} onChange={e => setFormData({ ...formData, reqLevel: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Generador Requerido</label>
                <div style={{ marginTop: 4 }}>
                  <window.Dropdown
                    value={formData.reqGeneratorId || ''}
                    onChange={val => setFormData({ ...formData, reqGeneratorId: val })}
                    style={{ width: '100%' }}
                    options={[
                      { value: "", label: "Ninguno" },
                      ...(window.GENERATORS || []).map(g => ({ value: g.id, label: (g.name && g.name.es) || g.es || (typeof g.name === 'string' ? g.name : '(Sin nombre)') }))
                    ]}
                  />
                </div>
              </div>
              {formData.reqGeneratorId && (
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Cantidad</label>
                  <window.AdminNumberInput className="app-input" value={formData.reqGeneratorAmount} onChange={e => setFormData({ ...formData, reqGeneratorAmount: e.target.value })} style={{ width: '100%' }} />
                </div>
              )}
            </div>

            <div className="admin-form-row" style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>
                {formData.upgrades && formData.upgrades.length > 0
                  ? `${formData.upgrades.length} mejora${formData.upgrades.length !== 1 ? 's' : ''} creada${formData.upgrades.length !== 1 ? 's' : ''}.`
                  : 'Sin mejoras creadas.'}
              </div>
              <button className="app-btn" onClick={() => setShowUpgradesModal(true)} style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', width: '100%' }}>
                Añadir mejora
              </button>
            </div>

            <button className="app-btn" onClick={handleSaveForm} style={{ width: '100%', background: saveStatus ? 'var(--positive-i100)' : 'var(--primary-i100)', color: '#fff', marginTop: 8, transition: 'background 0.2s' }}>
              {saveStatus ? <span><i className="fa-solid fa-check"></i> ¡Guardado!</span> : 'Guardar'}
            </button>
          </div>
        </window.AdminEditorSidebar>
      )}

      {/* Individual Delete Modal */}
      {deleteTarget !== null && (
        <window.Modal onClose={() => setDeleteTarget(null)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: 'var(--warning-i100)', marginBottom: 16 }}><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar Asset?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este asset de la clínica?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="app-btn" onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={confirmDelete} style={{ flex: 1, padding: '10px 16px', background: 'var(--warning-i100)', color: '#fff' }}>Eliminar</button>
            </div>
          </div>
        </window.Modal>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <window.Modal onClose={() => setShowBulkDeleteModal(false)} maxWidth={400} persistent={false}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 40, color: 'var(--warning-i100)', marginBottom: 16 }}><i className="fa-solid fa-trash-can"></i></div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, color: 'var(--fg-1)' }}>¿Eliminar {selectedItems.size} Asset(s)?</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--fg-3)', fontSize: 14 }}>Esta acción eliminará todos los assets seleccionados y no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="app-btn" onClick={() => setShowBulkDeleteModal(false)} style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={confirmBulkDelete} style={{ flex: 1, padding: '10px 16px', background: 'var(--warning-i100)', color: '#fff' }}>Eliminar Todos</button>
            </div>
          </div>
        </window.Modal>
      )}
      {/* Upgrades List Modal */}
      {showUpgradesModal && editingUpgradeIndex === null && (
        <window.Modal onClose={() => setShowUpgradesModal(false)} maxWidth={500} persistent={true}>
          <div style={{ padding: '24px 16px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, textAlign: 'center' }}>Mejoras de {(formData.name && formData.name.es) || formData.es || 'Asset'}</h2>

            {(!formData.upgrades || formData.upgrades.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-1)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: 40, color: 'var(--fg-4)', marginBottom: 16 }}><i className="fa-solid fa-arrow-up-right-dots"></i></div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--fg-1)' }}>Este objeto aún no tiene mejoras</h3>
                <button className="app-btn" onClick={handleAddUpgrade} style={{ background: 'var(--primary-i100)', color: '#fff', padding: '8px 16px', marginTop: 12 }}>
                  <i className="fa-solid fa-plus"></i> Añadir mejora
                </button>
                <div style={{ marginTop: 16 }}>
                  <button className="app-btn" onClick={() => setShowUpgradesModal(false)} style={{ background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cerrar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {formData.upgrades.map((upg, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredUpgrade(i)}
                    onMouseLeave={() => setHoveredUpgrade(null)}
                    onClick={() => handleEditUpgrade(i)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                      background: hoveredUpgrade === i ? 'var(--bg-2)' : 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {upg.iconUrl ? (
                        <img src={upg.iconUrl} style={{ width: 32, height: 32, objectFit: 'contain', transform: upg.flipX ? 'scaleX(-1)' : 'none' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, background: 'var(--bg-3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-image" style={{ color: 'var(--fg-3)' }}></i></div>
                      )}
                      <div style={{ fontWeight: 'bold' }}>{(upg.name && upg.name.es) || upg.es || '(Sin nombre)'}</div>
                    </div>
                    {hoveredUpgrade === i && (
                      <button
                        className="btn-delete-icon"
                        onClick={(e) => { e.stopPropagation(); handleDeleteUpgrade(i); }}
                        style={{ color: 'var(--warning-i100)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                ))}

                <button className="app-btn" onClick={handleAddUpgrade} style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', padding: '8px 16px', marginTop: 12, width: '100%' }}>
                  <i className="fa-solid fa-plus"></i> Añadir nueva mejora
                </button>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <button className="app-btn" onClick={() => setShowUpgradesModal(false)} style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', padding: '8px 24px' }}>Cerrar</button>
                </div>
              </div>
            )}
          </div>
        </window.Modal>
      )}



      {/* Upgrade Editor Modal */}
      {editingUpgradeIndex !== null && upgradeFormData && (
        <window.Modal onClose={() => setEditingUpgradeIndex(null)} maxWidth={500} persistent={true}>
          <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: '0', fontSize: 20, textAlign: 'center' }}>
              {editingUpgradeIndex === 'new' ? 'Añadir Mejora' : 'Editar Mejora'}
            </h2>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 72, height: 72, background: 'var(--bg-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {upgradeFormData.iconUrl ? (
                  <img src={upgradeFormData.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: upgradeFormData.flipX ? 'scaleX(-1)' : 'none' }} />
                ) : (
                  <i className="fa-solid fa-image" style={{ color: 'var(--fg-4)', fontSize: 24 }}></i>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nombre</label>
                  <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
                    <button type="button" onClick={() => setUpgradeEditLang('es')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: upgradeEditLang === 'es' ? 'var(--primary-i100)' : 'transparent', color: upgradeEditLang === 'es' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>ES</button>
                    <button type="button" onClick={() => setUpgradeEditLang('en')} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: upgradeEditLang === 'en' ? 'var(--primary-i100)' : 'transparent', color: upgradeEditLang === 'en' ? '#fff' : 'var(--fg-3)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>EN</button>
                  </div>
                </div>
                <input type="text" className="app-input" value={upgradeFormData.name[upgradeEditLang] || ''} onChange={e => setUpgradeFormData({ ...upgradeFormData, name: { ...upgradeFormData.name, [upgradeEditLang]: e.target.value } })} style={{ width: '100%', border: upgradeErrors.name ? '1px solid var(--negative-i100)' : undefined }} />
                {upgradeErrors.name && <div style={{ color: 'var(--negative-i100)', fontSize: 11, marginTop: 4 }}>Este campo es requerido.</div>}
              </div>
            </div>

            <div className="admin-form-row">
              <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Ruta de la Imagen</label>
              <input type="text" className="app-input" value={upgradeFormData.iconUrl} onChange={e => setUpgradeFormData({ ...upgradeFormData, iconUrl: e.target.value })} style={{ width: '100%', border: upgradeErrors.iconUrl ? '1px solid var(--negative-i100)' : undefined }} />
              {upgradeErrors.iconUrl && <div style={{ color: 'var(--negative-i100)', fontSize: 11, marginTop: 4 }}>Este campo es requerido.</div>}
            </div>



            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Precio (Dientes)</label>
                <window.AdminNumberInput className="app-input" value={upgradeFormData.price} onChange={e => setUpgradeFormData({ ...upgradeFormData, price: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Nivel Requerido</label>
                <window.AdminNumberInput className="app-input" value={upgradeFormData.reqLevel} onChange={e => setUpgradeFormData({ ...upgradeFormData, reqLevel: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Generador Requerido</label>
                <div style={{ marginTop: 4 }}>
                  <window.Dropdown
                    value={upgradeFormData.reqGeneratorId || ''}
                    onChange={val => setUpgradeFormData({ ...upgradeFormData, reqGeneratorId: val })}
                    style={{ width: '100%' }}
                    options={[
                      { value: "", label: "Ninguno" },
                      ...(window.GENERATORS || []).map(g => ({ value: g.id, label: (g.name && g.name.es) || g.es || (typeof g.name === 'string' ? g.name : '(Sin nombre)') }))
                    ]}
                  />
                </div>
              </div>
              {upgradeFormData.reqGeneratorId && (
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--fg-3)' }}>Cantidad</label>
                  <window.AdminNumberInput className="app-input" value={upgradeFormData.reqGeneratorAmount} onChange={e => setUpgradeFormData({ ...upgradeFormData, reqGeneratorAmount: e.target.value })} style={{ width: '100%' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="app-btn" onClick={() => setEditingUpgradeIndex(null)} style={{ flex: 1, background: 'var(--bg-3)', color: 'var(--fg-1)' }}>Cancelar</button>
              <button className="app-btn" onClick={handleSaveUpgradeForm} style={{ flex: 1, background: 'var(--primary-i100)', color: '#fff' }}>Guardar</button>
            </div>
          </div>
        </window.Modal>
      )}

      {/* Shadow Adjust Modal */}
      {showShadowAdjustModal && (
        <window.Modal onClose={() => setShowShadowAdjustModal(false)} maxWidth={1000} persistent={true}>
          <ShadowAdjustModalContent
            formData={formData}
            initialParams={tempShadowParams}
            onClose={() => setShowShadowAdjustModal(false)}
            onSave={(newParams) => {
              setFormData({ ...formData, shadowParams: newParams });
              setShowShadowAdjustModal(false);
            }}
          />
        </window.Modal>
      )}

      {/* Map Builder Modal */}
      {showMapBuilder && (
        <AdminClinicMapBuilder onClose={() => setShowMapBuilder(false)} setToast={setToast} lang={lang} />
      )}

    </div>
  );
};

window.AdminClinic = AdminClinicView;
