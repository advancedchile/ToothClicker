const { useEffect, useRef, useState } = React;

const cleanUpMesh = (mesh, forceAll = false) => {
  if (!mesh) return;

  // Detect if mesh belongs to a map piece
  let isMapPiece = mesh.userData && mesh.userData.isMapPiece;
  if (!isMapPiece) {
    let p = mesh.parent;
    while (p) {
      if (p.userData && p.userData.isMapPiece) {
        isMapPiece = true;
        break;
      }
      p = p.parent;
    }
  }

  if (mesh.geometry) {
    if (forceAll || isMapPiece) {
      mesh.geometry.dispose();
    }
  }

  if (mesh.material) {
    const disposeMat = (mat) => {
      const isCloned = mesh.userData && mesh.userData.materialCloned;
      if (forceAll || isMapPiece || isCloned || (mat.userData && mat.userData.cloned)) {
        if (mat.map) mat.map.dispose();
        if (mat.lightMap) mat.lightMap.dispose();
        if (mat.bumpMap) mat.bumpMap.dispose();
        if (mat.normalMap) mat.normalMap.dispose();
        if (mat.specularMap) mat.specularMap.dispose();
        if (mat.envMap) mat.envMap.dispose();
        mat.dispose();
      }
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(disposeMat);
    } else {
      disposeMat(mesh.material);
    }
  }
};

const disposeHierarchy = (obj, forceAll = false) => {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.isMesh) {
      cleanUpMesh(child, forceAll);
    }
  });
};

function ThreeClinicMap({ state, onAssetAction }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const velocity = useRef({ x: 0, y: 0 });
  const isPanDraggingRef = useRef(false);
  const prevPlacedAssets = useRef({});
  const lockedAreasRef = useRef([]);
  const [lockedAreas, setLockedAreas] = React.useState([]);
  const [zoomLevel, setZoomLevel] = React.useState(0);
  const [areaTooltip, setAreaTooltip] = React.useState(null);
  const [confettis, setConfettis] = React.useState([]);
  
  const uiElementsRef = useRef([]);
  const assetButtonsRef = useRef({});
  const hoveredAssetRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const hoverHelperRef = useRef(null);
  const isHoveringOverlayRef = useRef(false);
  const dropAnimRef = useRef({});

  // Zoom refs
  const zoomLevelRef = useRef(0);
  const zoom0Ref = useRef(1);
  const targetZoomRef = useRef(1);
  const prevPurchasedAreasRef = useRef(state?.purchasedAreas || []);
  const lockedAreaMeshesRef = useRef([]);
  const loadedModels = useRef({}); // Cache for models

  const project3DToScreen = (x, y, z) => {
    if (!cameraRef.current || !containerRef.current) return null;
    const tempV = new THREE.Vector3(x, y, z);
    tempV.project(cameraRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (tempV.x * 0.5 + 0.5) * rect.width,
      y: -(tempV.y * 0.5 - 0.5) * rect.height
    };
  };

  const recalculateZoomFit = () => {
    if (!cameraRef.current || !containerRef.current) return;
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    let sumX = 0;
    let sumZ = 0;
    let count = 0;

    // Include starting tiles from CLINIC_MAP_TILES
    const initialTiles = window.CLINIC_MAP_TILES || [];
    initialTiles.forEach(t => {
      const tx = t.x * 200;
      const tz = t.y * 200;
      minX = Math.min(minX, tx);
      maxX = Math.max(maxX, tx);
      minZ = Math.min(minZ, tz);
      maxZ = Math.max(maxZ, tz);
      sumX += tx;
      sumZ += tz;
      count++;
    });

    const areas = window.GAME_CONTENT?.clinicAreas || [];
    const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
    const purchasedAreas = latestState.current?.purchasedAreas || state?.purchasedAreas || [];

    mapAreas.forEach(inst => {
      const areaDef = areas.find(a => a.id === inst.areaId);
      const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
      if (isUnlocked && areaDef && areaDef.tiles) {
         areaDef.tiles.forEach(t => {
            const tx = (inst.x + t.dx) * 200;
            const tz = (inst.y + t.dy) * 200;
            minX = Math.min(minX, tx);
            maxX = Math.max(maxX, tx);
            minZ = Math.min(minZ, tz);
            maxZ = Math.max(maxZ, tz);
            sumX += tx;
            sumZ += tz;
            count++;
         });
      }
    });

    if (minX === Infinity) {
       minX = 0; maxX = 5800; minZ = 0; maxZ = 5800;
    }

    const MIN_SPAN = 3400;
    const spanX = Math.max((maxX - minX) + 200, MIN_SPAN);
    const spanZ = Math.max((maxZ - minZ) + 200, MIN_SPAN);
    const maxWallHeight = 300;
    const effectiveSpanZ = spanZ + maxWallHeight * 0.7;

    const frustumSize = 4000;
    const frustumW = frustumSize * aspect;
    const frustumH = frustumSize;

    // Use a factor of 0.65 to fit the unlocked areas beautifully on the screen
    const zoomX = frustumW / (spanX * 0.65);
    const zoomZ = frustumH / (effectiveSpanZ * 0.65);
    const zoom0 = Math.min(Math.min(zoomX, zoomZ), 1.65);

    zoom0Ref.current = zoom0;
    targetZoomRef.current = zoom0 * Math.pow(1.10, zoomLevelRef.current);
    
    // Update camera immediately to avoid frame-jump
    cameraRef.current.zoom = targetZoomRef.current;
    cameraRef.current.updateProjectionMatrix();

    // Centering camera
    let centerX = 2900;
    let centerZ = 2900;
    if (count > 0) {
       centerX = sumX / count;
       centerZ = sumZ / count;
    }
    cameraRef.current.position.set(centerX + 2000, 2000, centerZ + 2000);
    cameraRef.current.lookAt(centerX, 0, centerZ);
  };

  // Refs for tracking drag logic
  const dragPlaneRef = useRef(null);
  const wallMeshesRef = useRef([]);
  const gridHelperRef = useRef(null);
  const assetsGroupRef = useRef(null);
  const previewGroupRef = useRef(null);
  const reflectionsGroupRef = useRef(null);
  const previewReflectionGroupRef = useRef(null);
  const gltfLoaderRef = useRef(null);
  if (!gltfLoaderRef.current && window.THREE) {
    const loader = new window.THREE.GLTFLoader();
    if (window.THREE.DRACOLoader) {
      const dracoLoader = new window.THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
      loader.setDRACOLoader(dracoLoader);
    }
    gltfLoaderRef.current = loader;
  }

  // Latest state for event handlers
  const latestState = useRef(state);
  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    if (latestState.current?.purchasedAreas?.length > 0) {
      window.dispatchEvent(new Event('clinicMapUpdated'));
    }

    const prev = prevPurchasedAreasRef.current;
    const curr = state?.purchasedAreas || [];
    const newlyPurchased = curr.filter(id => !prev.includes(id));

    if (newlyPurchased.length > 0) {
      newlyPurchased.forEach(instId => {
        // Play cash register sound
        if (localStorage.getItem('tooth-clicker-sound') !== '0' && window.playTone) {
          window.playTone(1200, 0.05, 'square', 0.1);
          setTimeout(() => window.playTone(1600, 0.1, 'square', 0.1), 70);
          setTimeout(() => window.playTone(2000, 0.15, 'triangle', 0.08), 140);
        }

        // Trigger confetti
        const areas = window.GAME_CONTENT?.clinicAreas || [];
        const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
        const inst = mapAreas.find(i => i.id === instId);
        if (inst) {
          const areaDef = areas.find(a => a.id === inst.areaId);
          if (areaDef && areaDef.tiles) {
            const dxs = areaDef.tiles.map(t => t.dx);
            const dys = areaDef.tiles.map(t => t.dy);
            const minX = Math.min(...dxs);
            const maxX = Math.max(...dxs);
            const minY = Math.min(...dys);
            const maxY = Math.max(...dys);

            const cx = (inst.x + (minX + maxX) / 2) * 200;
            const cz = (inst.y + (minY + maxY) / 2) * 200;

            const screenPos = project3DToScreen(cx, 0, cz);
            if (screenPos) {
              const COLORS = ['#FFD700', '#FF007A', '#00D1FF', '#FF4500', '#7B61FF', '#00E676', '#FF6D00', '#E040FB'];
              const newParticles = [];
              const count = 60;
              for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 50 + Math.random() * 200;
                const dx = Math.cos(angle) * speed;
                const dy = Math.sin(angle) * speed + 80;
                const rot = (Math.random() - 0.5) * 1080;
                const size = 5 + Math.random() * 8;
                const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                const shape = Math.random() > 0.5 ? 'circle' : 'square';
                newParticles.push({
                  id: `${instId}_${i}_${Math.random()}`,
                  x: screenPos.x,
                  y: screenPos.y,
                  dx,
                  dy,
                  rot,
                  size,
                  color,
                  shape
                });
              }
              setConfettis(prevList => [...prevList, ...newParticles]);
              setTimeout(() => {
                setConfettis(prevList => prevList.filter(p => !p.id.startsWith(instId)));
              }, 1600);
            }
          }
        }
      });
    }

    prevPurchasedAreasRef.current = curr;
    recalculateZoomFit();
  }, [state?.purchasedAreas]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8f2fb');
    sceneRef.current = scene;

    // 2. Setup Camera (Orthographic for isometric look)
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const frustumSize = 4000;
    const camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2,
      1, 10000
    );

    cameraRef.current = camera;
    recalculateZoomFit();

    // 3. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4e2f5, 0.35);
    hemiLight.position.set(0, 5000, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.48);
    dirLight.position.set(2900 - 800, 2500, 2900 - 200); 
    dirLight.target.position.set(2900, 0, 2900);
    scene.add(dirLight.target);
    dirLight.castShadow = true;
    dirLight.shadow.radius = 8;
    dirLight.shadow.bias = -0.0003;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -2500;
    dirLight.shadow.camera.right = 2500;
    dirLight.shadow.camera.top = 2500;
    dirLight.shadow.camera.bottom = -2500;
    dirLight.shadow.camera.far = 6000;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xf0f6ff, 0.24);
    fillLight.position.set(2900 + 1200, 1800, 2900 + 1000);
    fillLight.target.position.set(2900, 0, 2900);
    scene.add(fillLight.target);
    scene.add(fillLight);

    const assetAmbientLight = new THREE.AmbientLight(0xffffff, 0.18);
    assetAmbientLight.layers.set(1);
    scene.add(assetAmbientLight);

    // 5. Build Map
    buildMap(scene);

    // 6. Invisible plane for drag/drop raycasting
    const dragGeo = new THREE.PlaneGeometry(100000, 100000);
    dragGeo.rotateX(-Math.PI / 2);
    const dragMat = new THREE.MeshBasicMaterial({ visible: false });
    const dragPlane = new THREE.Mesh(dragGeo, dragMat);
    scene.add(dragPlane);
    dragPlaneRef.current = dragPlane;

    // Assets group
    const assetsGroup = new THREE.Group();
    scene.add(assetsGroup);
    assetsGroupRef.current = assetsGroup;

    const reflectionsGroup = new THREE.Group();
    reflectionsGroup.scale.y = -1;
    scene.add(reflectionsGroup);
    reflectionsGroupRef.current = reflectionsGroup;

    const previewGroup = new THREE.Group();
    scene.add(previewGroup);
    previewGroupRef.current = previewGroup;

    const previewReflectionGroup = new THREE.Group();
    previewReflectionGroup.scale.y = -1;
    scene.add(previewReflectionGroup);
    previewReflectionGroupRef.current = previewReflectionGroup;

    const solidFloorGeo = new THREE.PlaneGeometry(100000, 100000);
    solidFloorGeo.rotateX(-Math.PI / 2);
    const solidFloorMat = new THREE.MeshBasicMaterial({ color: '#FDFCF8' });
    const solidFloor = new THREE.Mesh(solidFloorGeo, solidFloorMat);
    solidFloor.position.y = -100;
    scene.add(solidFloor);

    // Grid helper
    const gridHelper = new THREE.GridHelper(100000, 500, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -0.5;
    gridHelper.position.x = 100;
    gridHelper.position.z = 100;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const hoverHelper = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(200, 200)),
      new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 3, depthWrite: false })
    );
    hoverHelper.rotation.x = -Math.PI / 2;
    hoverHelper.position.y = 5;
    hoverHelper.visible = false;
    scene.add(hoverHelper);
    hoverHelperRef.current = hoverHelper;

    const onClinicMapUpdated = () => {
      // Clear old map
      for (let i = scene.children.length - 1; i >= 0; i--) {
        const obj = scene.children[i];
        if (obj.userData && obj.userData.isMapPiece) {
          disposeHierarchy(obj, false);
          scene.remove(obj);
        }
      }
      buildMap(scene);
    };
    window.addEventListener('clinicMapUpdated', onClinicMapUpdated);

    // Render loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isPanDraggingRef.current && (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.01)) {
        camera.position.x -= velocity.current.x;
        camera.position.z -= velocity.current.y;
        velocity.current.x *= 0.9;
        velocity.current.y *= 0.9;
        camera.updateProjectionMatrix();
      }

      if (camera && targetZoomRef.current) {
        const diff = targetZoomRef.current - camera.zoom;
        if (Math.abs(diff) > 0.001) {
          camera.zoom += diff * 0.15;
          camera.updateProjectionMatrix();
        } else if (camera.zoom !== targetZoomRef.current) {
          camera.zoom = targetZoomRef.current;
          camera.updateProjectionMatrix();
        }
      }

      // Update floating locks animation
      if (sceneRef.current) {
        sceneRef.current.traverse(child => {
          if (child.name && child.name.startsWith('lockIcon_')) {
            const targetY = child.userData.targetY ?? 20;
            child.position.y += (targetY - child.position.y) * 0.15;
            child.rotation.y += 0.012;
          }
        });
      }

      // Update locked area UI overlays
      if (uiElementsRef.current && camera && containerRef.current) {
        lockedAreasRef.current.forEach((la, idx) => {
          const el = uiElementsRef.current[idx];
          if (!el) return;
          const pos = new THREE.Vector3(la.px, 0, la.pz);
          pos.project(camera);
          
          if (pos.z > 1) {
             el.style.display = 'none';
          } else {
             el.style.display = 'flex';
             const x = (pos.x * 0.5 + 0.5) * containerRef.current.clientWidth;
             const y = -(pos.y * 0.5 - 0.5) * containerRef.current.clientHeight;
             el.style.left = `${x}px`;
             el.style.top = `${y}px`;
          }
        });
      }

      // Update asset rotation buttons
      if (assetButtonsRef.current && assetsGroupRef.current && camera && containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        assetsGroupRef.current.children.forEach(child => {
           if (child.userData && child.userData.instanceId) {
              const instId = child.userData.instanceId;
              const isAttached = window.attachedAsset && window.attachedAsset.id === instId;
              child.visible = !isAttached;
              
              const baseY = child.userData.baseY || 0;
              if (dropAnimRef.current[instId] !== undefined) {
                  dropAnimRef.current[instId] += (0 - dropAnimRef.current[instId]) * 0.15;
                  if (dropAnimRef.current[instId] < 0.5) {
                      dropAnimRef.current[instId] = 0;
                      delete dropAnimRef.current[instId];
                  }
                  child.position.y = baseY + dropAnimRef.current[instId];
              } else {
                  child.position.y = baseY;
              }
              
              if (reflectionsGroupRef.current) {
                  const refChild = reflectionsGroupRef.current.children.find(c => c.userData.instanceId === instId);
                  if (refChild) {
                      refChild.visible = child.visible;
                      refChild.position.copy(child.position);
                      refChild.rotation.copy(child.rotation);
                  }
              }
              
              const domNode = assetButtonsRef.current[instId];
              if (domNode) {
                 if (isAttached || hoveredAssetRef.current !== instId) {
                    domNode.style.display = 'none';
                 } else {
                    const pos = new THREE.Vector3();
                    child.getWorldPosition(pos);
                    pos.project(camera);
                    if (pos.z < 1) {
                       const x = (pos.x * 0.5 + 0.5) * w;
                       const y = -(pos.y * 0.5 - 0.5) * h;
                       domNode.style.left = `${x}px`;
                       domNode.style.top = `${y - 40}px`;
                       domNode.style.display = 'flex';
                    } else {
                       domNode.style.display = 'none';
                    }
                 }
              }
           }
         });
      }

      if (previewGroupRef.current && window.attachedAsset && previewGroupRef.current.position.y !== -9999) {
          const isWallAsset = window.attachedAsset.isWallAsset;
          const targetY = isWallAsset ? 150 : 30;
          previewGroupRef.current.position.y += (targetY - previewGroupRef.current.position.y) * 0.15;
      }
      
      if (previewReflectionGroupRef.current && previewGroupRef.current) {
          previewReflectionGroupRef.current.position.copy(previewGroupRef.current.position);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      const asp = w / h;
      cameraRef.current.left = frustumSize * asp / -2;
      cameraRef.current.right = frustumSize * asp / 2;
      cameraRef.current.top = frustumSize / 2;
      cameraRef.current.bottom = frustumSize / -2;
      
      recalculateZoomFit();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('clinicMapUpdated', onClinicMapUpdated);
      cancelAnimationFrame(animationId);

      // Traverse and dispose everything in the scene
      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            const disposeMat = (mat) => {
              if (mat.map) mat.map.dispose();
              if (mat.lightMap) mat.lightMap.dispose();
              if (mat.bumpMap) mat.bumpMap.dispose();
              if (mat.normalMap) mat.normalMap.dispose();
              if (mat.specularMap) mat.specularMap.dispose();
              if (mat.envMap) mat.envMap.dispose();
              mat.dispose();
            };
            if (Array.isArray(child.material)) {
              child.material.forEach(disposeMat);
            } else {
              disposeMat(child.material);
            }
          }
        }
      });

      // Dispose cached models
      if (loadedModels.current) {
        Object.values(loadedModels.current).forEach((gltf) => {
          if (gltf && gltf.scene) {
            gltf.scene.traverse((child) => {
              if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                  const disposeMat = (mat) => {
                    if (mat.map) mat.map.dispose();
                    if (mat.lightMap) mat.lightMap.dispose();
                    if (mat.bumpMap) mat.bumpMap.dispose();
                    if (mat.normalMap) mat.normalMap.dispose();
                    if (mat.specularMap) mat.specularMap.dispose();
                    if (mat.envMap) mat.envMap.dispose();
                    mat.dispose();
                  };
                  if (Array.isArray(child.material)) {
                    child.material.forEach(disposeMat);
                  } else {
                    disposeMat(child.material);
                  }
                }
              }
            });
          }
        });
        loadedModels.current = {};
      }

      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [onAssetAction]); // Run once on mount

  const applyLockModelToGroup = (lockGroup, isUnlocked) => {
    const lockUrl = isUnlocked ? 'assets/clinic/Candado2.glb' : 'assets/clinic/Candado.glb';
    if (lockGroup.userData.currentModelUrl === lockUrl && lockGroup.children.length > 0) {
      return;
    }
    lockGroup.userData.currentModelUrl = lockUrl;

    const attachModel = (gltf) => {
      while (lockGroup.children.length > 0) {
        const c = lockGroup.children[0];
        lockGroup.remove(c);
      }

      const model = gltf.scene.clone(true);
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 100;
      const s = maxDim > 0 ? targetSize / maxDim : 1;
      model.scale.set(s, s, s);

      model.position.x = -center.x * s;
      model.position.y = -box.min.y * s;
      model.position.z = -center.z * s;

      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.layers.enable(1);
          child.userData = { isMapPiece: true };
        }
      });

      lockGroup.add(model);
    };

    if (loadedModels.current[lockUrl]) {
      attachModel(loadedModels.current[lockUrl]);
    } else if (gltfLoaderRef.current) {
      gltfLoaderRef.current.load(lockUrl, (gltf) => {
        loadedModels.current[lockUrl] = gltf;
        if (lockGroup.userData.currentModelUrl === lockUrl) {
          attachModel(gltf);
        }
      });
    }
  };

  // Build static map (floors, walls)
  const buildMap = (scene) => {
    wallMeshesRef.current = [];
    // Floor Material
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: '#FDFCF8', 
      roughness: 0.2, 
      metalness: 0.1,
      transparent: true,
      opacity: 0.93 // Hace el reflejo más sutil y degradado
    });
    const lockedFloorMat = new THREE.MeshStandardMaterial({ 
      color: '#b0c4de', 
      roughness: 0.9, 
      metalness: 0.0,
      transparent: true,
      opacity: 0.6
    });

    // Wall Material
    const wallMat = new THREE.MeshStandardMaterial({ 
      color: '#CADDFB', 
      roughness: 0.8, 
      metalness: 0.0 
    });
    const lockedWallMat = new THREE.MeshStandardMaterial({ 
      color: '#a0b4ce', 
      roughness: 0.9, 
      metalness: 0.0,
      transparent: true,
      opacity: 0.4
    });

    // Collect all valid tiles
    const allTiles = [...(window.CLINIC_MAP_TILES || [])];
    const areas = window.GAME_CONTENT?.clinicAreas || [];
    const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
    const purchasedAreas = latestState.current?.purchasedAreas || [];

    const newLockedAreas = [];
    const lockedAreaMeshes = [];

    mapAreas.forEach(inst => {
      const areaDef = areas.find(a => a.id === inst.areaId);
      const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
      
      if (areaDef && areaDef.tiles) {
        if (isUnlocked) {
          areaDef.tiles.forEach(t => {
            allTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true, isLocked: false });
          });
        } else {
          // Render flat reddish-grey unified area floor
          const dxs = areaDef.tiles.map(t => t.dx);
          const dys = areaDef.tiles.map(t => t.dy);
          const minX = Math.min(...dxs);
          const maxX = Math.max(...dxs);
          const minY = Math.min(...dys);
          const maxY = Math.max(...dys);

          const widthX = (maxX - minX + 1) * 200;
          const lengthZ = (maxY - minY + 1) * 200;

          const centerX = (inst.x + (minX + maxX) / 2) * 200;
          const centerZ = (inst.y + (minY + maxY) / 2) * 200;

          const lockedAreaGeo = new THREE.BoxGeometry(widthX, 10, lengthZ);
          const lockedAreaMat = new THREE.MeshStandardMaterial({
            color: '#3a2a2a', // Gris rojizo plano muy oscuro
            roughness: 0.8,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85
          });
          const lockedAreaMesh = new THREE.Mesh(lockedAreaGeo, lockedAreaMat);
          lockedAreaMesh.position.set(centerX, -5, centerZ);
          lockedAreaMesh.receiveShadow = true;
          lockedAreaMesh.userData = {
            isLockedArea: true,
            isMapPiece: true,
            instId: inst.id,
            areaDef,
            centerX,
            centerZ,
            originalColor: '#3a2a2a'
          };
          scene.add(lockedAreaMesh);
          lockedAreaMeshes.push(lockedAreaMesh);

          const isLevelReqMet = (latestState.current?.level || 1) >= (areaDef.reqLevel || 0);

          // Render 3D lock group floating at center
          const lockGroup = new THREE.Group();
          lockGroup.name = 'lockIcon_' + inst.id;
          
          lockGroup.userData = { 
            isMapPiece: true,
            instId: inst.id,
            areaDef: areaDef,
            baseY: 20,
            targetY: 20,
            currentModelUrl: ''
          };

          applyLockModelToGroup(lockGroup, isLevelReqMet);

          lockGroup.rotation.y = Math.PI / 4;
          lockGroup.position.set(centerX, 20, centerZ);
          scene.add(lockGroup);

          newLockedAreas.push({ id: inst.id, areaDef, px: centerX, pz: centerZ, isLevelReqMet });
        }
      }
    });

    lockedAreasRef.current = newLockedAreas;
    setLockedAreas(newLockedAreas);
    lockedAreaMeshesRef.current = lockedAreaMeshes;

    const floorMap = {};
    allTiles.forEach(t => {
      const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
      if (def && def.type === 'floor') {
        floorMap[`${t.x},${t.y}`] = true;
      }
    });

    const floorGeo = new THREE.BoxGeometry(200, 10, 200);
    const wallGeoX = new THREE.BoxGeometry(200, 300, 20); // Wall along X axis
    const wallGeoZ = new THREE.BoxGeometry(20, 300, 200); // Wall along Z axis

    const matsCache = {};
    const getMat = (t, def, isLocked, baseMat) => {
      const tileColor = t.colorTop || def.colorTop;
      const key = `${def.id}_${isLocked}_${tileColor || 'default'}`;
      if (matsCache[key]) return matsCache[key];
      const mat = baseMat.clone();
      if (!isLocked && tileColor) {
         mat.color.set(tileColor);
      }
      matsCache[key] = mat;
      return mat;
    };

    allTiles.forEach(t => {
      const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
      if (!def) return;

      const px = t.x * 200;
      const pz = t.y * 200;

      if (def.type === 'floor') {
        const mesh = new THREE.Mesh(floorGeo, getMat(t, def, t.isLocked, t.isLocked ? lockedFloorMat : floorMat));
        mesh.position.set(px, -5, pz);
        mesh.receiveShadow = true;
        mesh.userData = { isMapPiece: true };
        scene.add(mesh);
      } else if (def.type === 'wall') {
        let isY = t.id.includes('_y');
        
        // Wall Culling: if floor exists on both sides of the wall, don't render it.
        let shouldCull = false;
        if (isY && floorMap[`${t.x},${t.y}`] && floorMap[`${t.x - 1},${t.y}`]) shouldCull = true;
        if (!isY && floorMap[`${t.x},${t.y}`] && floorMap[`${t.x},${t.y - 1}`]) shouldCull = true;

        if (!shouldCull) {
          const mesh = new THREE.Mesh(isY ? wallGeoZ : wallGeoX, getMat(t, def, t.isLocked, t.isLocked ? lockedWallMat : wallMat));
          mesh.position.set(px, 150, pz);
          if (isY) mesh.position.x -= 90; // offset wall to edge
          else mesh.position.z -= 90; // offset wall to edge
          mesh.castShadow = false; // Paredes ya no generan sombras
          mesh.receiveShadow = true;
          mesh.userData = { isMapPiece: true, isWall: true, tileX: t.x, tileY: t.y, isY, tileDef: t };
          scene.add(mesh);
          wallMeshesRef.current.push(mesh);
        }
      }
    });

    // Removed second GridHelper to prevent duplication and misalignment
  };

  // Sync placed assets models
  useEffect(() => {
    if (!sceneRef.current) return;
    const group = assetsGroupRef.current;
    const refGroup = reflectionsGroupRef.current;
    if (!group || !refGroup) return;

    // Dispose old meshes and their geometries/materials
    group.children.forEach(child => disposeHierarchy(child, false));
    refGroup.children.forEach(child => disposeHierarchy(child, false));

    // Clear old meshes
    while(group.children.length > 0){ 
        group.remove(group.children[0]); 
    }
    while(refGroup.children.length > 0){ 
        refGroup.remove(refGroup.children[0]); 
    }

    const placedAssets = state.placedClinicAssets || {};
    
    Object.entries(placedAssets).forEach(([instId, inst]) => {
      const assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === inst.assetId);
      if (!assetDef) return;

      const modelUrl = assetDef.glbData || assetDef.modelUrl || assetDef.iconUrl;
      const is3DUrl = (url, is3DFlag) => url && !url.startsWith('data:image/') && (url.includes('.glb') || url.includes('.gltf') || url.startsWith('data:') || is3DFlag);
      if (!is3DUrl(modelUrl, assetDef.is3D)) return; // Ignore non-3D

      const isWallAsset = assetDef.type === 'wall' || assetDef.isWallAsset;

      const placeModel = (gltf) => {
        const model = gltf.scene.clone();
        
        // Convert backward-compatible SVG coords (inst.x, inst.y) back to 3D Grid coords
        const svgX = inst.x + 6144;
        const svgY = inst.y + 3429;
        const unscaledY = svgY / 0.57735;
        let gx = (svgX + unscaledY) * 0.70710678;
        let gy = (-svgX + unscaledY) * 0.70710678;
        const qx = Math.round((gx - 8400) / 200);
        const qy = Math.round((gy + 3200) / 200);
        const px = qx * 200;
        const pz = qy * 200;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        let s = assetDef.scale || 1;

        if (isWallAsset) {
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            const fitScale = (140 / maxDim) * s;
            model.scale.set(fitScale, fitScale, fitScale);
          } else {
            model.scale.set(s, s, s);
          }

          const allTiles = [...(window.CLINIC_MAP_TILES || [])];
          const areas = window.GAME_CONTENT?.clinicAreas || [];
          const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
          const purchasedAreas = latestState.current?.purchasedAreas || [];
          mapAreas.forEach(instArea => {
            const areaDef = areas.find(a => a.id === instArea.areaId);
            const isUnlocked = purchasedAreas.includes(instArea.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
            if (isUnlocked && areaDef && areaDef.tiles) {
              areaDef.tiles.forEach(t => allTiles.push({ ...t, x: instArea.x + t.dx, y: instArea.y + t.dy, isArea: true }));
            }
          });
          const wallTile = allTiles.find(t => t.x === qx && t.y === qy && (t.type === 'wall' || (window.CLINIC_TILES || []).find(d => d.id === t.id)?.type === 'wall'));
          const isWallY = wallTile ? (wallTile.id?.includes('_y') || wallTile.id === 'wall_custom_y') : !!inst.flipX;

          if (isWallY) {
            model.rotation.y = -Math.PI / 2;
            const scaledBox = new THREE.Box3().setFromObject(model);
            const centerY = (scaledBox.max.y + scaledBox.min.y) / 2;
            model.position.set(px - 78, 150 - centerY, pz);
          } else {
            model.rotation.y = Math.PI;
            const scaledBox = new THREE.Box3().setFromObject(model);
            const centerY = (scaledBox.max.y + scaledBox.min.y) / 2;
            model.position.set(px, 150 - centerY, pz - 78);
          }
        } else {
          const maxDim = Math.max(size.x, size.z);
          if (maxDim > 0) {
            const fitScale = (200 / maxDim) * s;
            model.scale.set(fitScale, fitScale, fitScale);
          } else {
            model.scale.set(s, s, s);
          }

          // Apply rotation (0 to 3, representing 0 to 270 degrees)
          const rotVal = inst.rotation !== undefined ? inst.rotation : (inst.flipX ? 2 : 0);
          model.rotation.y = rotVal * (-Math.PI / 2);

          // Adjust Y so it rests exactly on the floor
          const scaledBox = new THREE.Box3().setFromObject(model);
          model.position.set(px, -scaledBox.min.y, pz);
        }

        // Shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = !isWallAsset;
            child.receiveShadow = true;
            child.layers.enable(1); // Enable layer 1 so it receives the extra ambient light
          }
        });

        model.userData = { instanceId: instId, assetId: inst.assetId, baseY: model.position.y, isWallAsset };
        group.add(model);

        if (!isWallAsset) {
          const refModel = model.clone();
          refModel.traverse((child) => {
              if (child.isMesh) {
                  child.material = child.material.clone();
                  child.userData.materialCloned = true; // Mark as cloned
                  child.material.side = THREE.BackSide;
                  child.material.transparent = true;
                  child.material.opacity = 0.4;
                  child.material.depthTest = true;
                  child.material.depthWrite = false;
                  child.castShadow = false;
                  child.receiveShadow = false;
              }
          });
          refModel.renderOrder = -1;
          refModel.userData = { instanceId: instId, baseY: model.position.y, isWallAsset };
          refGroup.add(refModel);
        }
      };

      if (loadedModels.current[modelUrl]) {
        placeModel(loadedModels.current[modelUrl]);
      } else {
        gltfLoaderRef.current.load(modelUrl, (gltf) => {
          loadedModels.current[modelUrl] = gltf;
          placeModel(gltf);
        });
      }
    });

  }, [state.placedClinicAssets, state.purchasedAreas]);

  // Sync locked areas level requirements if level changes
  useEffect(() => {
    setLockedAreas(prev => prev.map(la => ({ ...la, isLevelReqMet: latestState.current?.level >= la.areaDef.reqLevel })));
    if (sceneRef.current) {
      sceneRef.current.traverse(child => {
        if (child.name && child.name.startsWith('lockIcon_') && child.userData.areaDef) {
          const isLevelReqMet = (state.level || 1) >= (child.userData.areaDef.reqLevel || 0);
          applyLockModelToGroup(child, isLevelReqMet);
        }
      });
    }
  }, [state.level]);


  // Provide getClinicMapParams for the global drag&drop overlay
  useEffect(() => {
    window.getClinicMapParams = () => {
      if (!containerRef.current) return null;
      return {
        rect: containerRef.current.getBoundingClientRect(),
        pos: { x: 0, y: 0 }, // Not strictly used for 3D snap
        scale: 1,
        snapAsset: (gx, gy, assetId) => {
          // This prevents 2D snapping logic from ruining the position
          return { gx, gy, flipX: null };
        },
        get3DSnappedCoords: (clientX, clientY) => {
          if (previewGroupRef.current && previewGroupRef.current.position.y !== -9999) {
             return { localX: previewGroupRef.current.position.x, localY: previewGroupRef.current.position.z };
          }
          if (!cameraRef.current || !dragPlaneRef.current || clientX == null) return null;
          const rect = containerRef.current.getBoundingClientRect();
          const mx = ((clientX - rect.left) / rect.width) * 2 - 1;
          const my = -((clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.current.setFromCamera({ x: mx, y: my }, cameraRef.current);
          const intersects = raycaster.current.intersectObject(dragPlaneRef.current);
          if (intersects.length > 0) {
             const pt = intersects[0].point;
             return { localX: Math.round(pt.x / 200) * 200, localY: Math.round(pt.z / 200) * 200 };
          }
          return null;
        },
        isTileValidLocal: (lx, ly, assetId, clientX, clientY) => {
          if (previewGroupRef.current && previewGroupRef.current.position.y !== -9999) {
             return true;
          }
          // Raycast from mouse to find the cell
          if (!cameraRef.current || !dragPlaneRef.current || clientX == null) return false;
          
          const rect = containerRef.current.getBoundingClientRect();
          const mx = ((clientX - rect.left) / rect.width) * 2 - 1;
          const my = -((clientY - rect.top) / rect.height) * 2 + 1;
          
          raycaster.current.setFromCamera({ x: mx, y: my }, cameraRef.current);
          const intersects = raycaster.current.intersectObject(dragPlaneRef.current);
          if (intersects.length > 0) {
             const pt = intersects[0].point;
             const gridX = Math.round(pt.x / 200);
             const gridZ = Math.round(pt.z / 200);
             
             const floorMap = {};
             const allTiles = [...(window.CLINIC_MAP_TILES || [])];
             const areas = window.GAME_CONTENT?.clinicAreas || [];
             const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
             const purchasedAreas = latestState.current?.purchasedAreas || [];
             mapAreas.forEach(inst => {
               const areaDef = areas.find(a => a.id === inst.areaId);
               const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
               if (isUnlocked && areaDef && areaDef.tiles) {
                 areaDef.tiles.forEach(t => allTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true }));
               }
             });

             allTiles.forEach(t => {
               const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
               if (def && def.type === 'floor') {
                 floorMap[`${t.x},${t.y}`] = true;
               }
             });

             const assetDef = assetId ? (window.CLINIC_ASSETS || []).find(a => a.id === assetId) : null;
             const isWallAsset = assetDef?.type === 'wall' || assetDef?.isWallAsset;

             const tile = allTiles.find(t => t.x === gridX && t.y === gridZ);
             if (!tile) return false;

             const tileDef = (window.CLINIC_TILES || []).find(d => d.id === tile.id);
             const tileType = tile.type || tileDef?.type || 'floor';

             if (isWallAsset) {
                if (tileType !== 'wall') return false;
                const isY = tile.id?.includes('_y') || tile.id === 'wall_custom_y';
                if (isY && floorMap[`${gridX},${gridZ}`] && floorMap[`${gridX - 1},${gridZ}`]) return false;
                if (!isY && floorMap[`${gridX},${gridZ}`] && floorMap[`${gridX},${gridZ - 1}`]) return false;
             } else {
                if (tileType !== 'floor') return false;
             }

             // Check if occupied
             const placed = latestState.current?.placedClinicAssets || {};
             const attachedId = window.attachedAsset?.isFromMap ? window.attachedAsset.id : null;
             const isOccupied = Object.entries(placed).some(([instId, inst]) => {
               if (instId === attachedId || instId === assetId) return false;
               const svgX = inst.x + 6144;
               const svgY = inst.y + 3429;
               const unscaledY = svgY / 0.57735;
               let igx = (svgX + unscaledY) * 0.70710678;
               let igy = (-svgX + unscaledY) * 0.70710678;
               const qx = Math.round((igx - 8400) / 200);
               const qy = Math.round((igy + 3200) / 200);
               return qx === gridX && qy === gridZ;
             });
             return !isOccupied;
          }
          return false;
        }
      };
    };

    const handleAttach = (e) => {
      window.attachedAsset = e.detail;
      // create preview
      if (previewGroupRef.current) {
         previewGroupRef.current.children.forEach(child => disposeHierarchy(child, false));
         while(previewGroupRef.current.children.length > 0) {
            previewGroupRef.current.remove(previewGroupRef.current.children[0]);
         }
      }
      if (previewReflectionGroupRef.current) {
         previewReflectionGroupRef.current.children.forEach(child => disposeHierarchy(child, false));
         while(previewReflectionGroupRef.current.children.length > 0) {
            previewReflectionGroupRef.current.remove(previewReflectionGroupRef.current.children[0]);
         }
      }

      if (previewGroupRef.current) {
         let assetDef;
         if (e.detail.assetId) {
             assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === e.detail.assetId);
         } else if (e.detail.isRecycledInst || e.detail.isFromMap) {
             const instId = e.detail.id;
             const inst = latestState.current.placedClinicAssets?.[instId] || latestState.current.recycledClinicAssets?.find(r => r.instanceId === instId);
             if (inst) assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === inst.assetId);
         } else {
             assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === e.detail.id);
         }
         
         if (assetDef) {
             const isWallAsset = assetDef.type === 'wall' || assetDef.isWallAsset;
             const modelUrl = assetDef.glbData || assetDef.modelUrl || assetDef.iconUrl;
             const is3DUrl = (url, is3DFlag) => url && !url.startsWith('data:image/') && (url.includes('.glb') || url.includes('.gltf') || url.startsWith('data:') || is3DFlag);
             if (is3DUrl(modelUrl, assetDef.is3D)) {
                 const loadPreview = (gltf) => {
                      const model = gltf.scene.clone();
                      const box = new THREE.Box3().setFromObject(model);
                      const size = box.getSize(new THREE.Vector3());
                      let s = assetDef.scale || 1;
                      
                      let rot = e.detail.rotation;
                      let flipped = e.detail.flipX;
                      if (e.detail.isRecycledInst || e.detail.isFromMap) {
                         const instId = e.detail.id;
                         const inst = latestState.current.placedClinicAssets?.[instId] || latestState.current.recycledClinicAssets?.find(r => r.instanceId === instId);
                         if (inst) {
                            if (rot === undefined) rot = inst.rotation;
                            if (flipped === undefined) flipped = inst.flipX;
                         }
                      }

                      if (isWallAsset) {
                         const maxDim = Math.max(size.x, size.y, size.z);
                         if (maxDim > 0) {
                             const fitScale = (140 / maxDim) * s;
                             model.scale.set(fitScale, fitScale, fitScale);
                         } else {
                             model.scale.set(s, s, s);
                         }
                         const scaledBox = new THREE.Box3().setFromObject(model);
                         const centerY = (scaledBox.max.y + scaledBox.min.y) / 2;
                         model.position.y = 150 - centerY;
                      } else {
                         const maxDim = Math.max(size.x, size.z);
                         if (maxDim > 0) {
                             const fitScale = (200 / maxDim) * s;
                             model.scale.set(fitScale, fitScale, fitScale);
                         } else {
                             model.scale.set(s, s, s);
                         }
                         const rotVal = rot !== undefined ? rot : (flipped ? 2 : 0);
                         model.rotation.y = rotVal * (-Math.PI / 2);
                         const scaledBox = new THREE.Box3().setFromObject(model);
                         model.position.y = -scaledBox.min.y;
                      }
                      
                      model.traverse((child) => {
                          if (child.isMesh) {
                              child.material = child.material.clone();
                              child.userData.materialCloned = true; // Mark as cloned
                              child.castShadow = !isWallAsset;
                              child.receiveShadow = true;
                              child.layers.enable(1); // Enable layer 1 so it receives the extra ambient light
                          }
                      });
                      
                      if (e.detail.isFromMap) {
                          const instId = e.detail.id;
                          const inst = latestState.current.placedClinicAssets?.[instId];
                          if (inst) {
                             const svgX = inst.x + 6144;
                             const svgY = inst.y + 3429;
                             const unscaledY = svgY / 0.57735;
                             let gx = (svgX + unscaledY) * 0.70710678;
                             let gy = (-svgX + unscaledY) * 0.70710678;
                             const qx = Math.round((gx - 8400) / 200);
                             const qy = Math.round((gy + 3200) / 200);
                             const px = qx * 200;
                             const pz = qy * 200;
                             if (isWallAsset) {
                                const allTiles = [...(window.CLINIC_MAP_TILES || [])];
                                const areas = window.GAME_CONTENT?.clinicAreas || [];
                                const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
                                const purchasedAreas = latestState.current?.purchasedAreas || [];
                                mapAreas.forEach(instArea => {
                                  const areaDef = areas.find(a => a.id === instArea.areaId);
                                  const isUnlocked = purchasedAreas.includes(instArea.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
                                  if (isUnlocked && areaDef && areaDef.tiles) {
                                    areaDef.tiles.forEach(t => allTiles.push({ ...t, x: instArea.x + t.dx, y: instArea.y + t.dy, isArea: true }));
                                  }
                                });
                                const wallTile = allTiles.find(t => t.x === qx && t.y === qy && (t.type === 'wall' || (window.CLINIC_TILES || []).find(d => d.id === t.id)?.type === 'wall'));
                                const isWallY = wallTile ? (wallTile.id?.includes('_y') || wallTile.id === 'wall_custom_y') : !!inst.flipX;
                                if (isWallY) {
                                   previewGroupRef.current.position.set(px - 78, 0, pz);
                                   previewGroupRef.current.rotation.y = -Math.PI / 2;
                                } else {
                                   previewGroupRef.current.position.set(px, 0, pz - 78);
                                   previewGroupRef.current.rotation.y = Math.PI;
                                }
                                previewGroupRef.current.userData = { gridX: qx, gridZ: qy, isWallY };
                             } else {
                                const rotVal = rot !== undefined ? rot : (flipped ? 2 : 0);
                                model.rotation.y = rotVal * (-Math.PI / 2);
                                previewGroupRef.current.position.set(px, 0, pz);
                                previewGroupRef.current.rotation.y = 0;
                                previewGroupRef.current.userData = { gridX: qx, gridZ: qy, isWallY: false };
                             }
                          } else {
                             previewGroupRef.current.position.set(0, -9999, 0);
                          }
                       } else {
                           previewGroupRef.current.position.set(0, -9999, 0);
                       }
                      previewGroupRef.current.add(model);

                      if (!isWallAsset) {
                        const refModel = model.clone();
                        refModel.traverse((child) => {
                            if (child.isMesh) {
                                child.material = child.material.clone();
                                child.userData.materialCloned = true; // Mark as cloned
                                child.material.side = THREE.BackSide;
                                child.material.transparent = true;
                                child.material.opacity = 0.4;
                                child.material.depthTest = true;
                                child.material.depthWrite = false;
                                child.castShadow = false;
                                child.receiveShadow = false;
                            }
                        });
                        refModel.renderOrder = -1;
                        previewReflectionGroupRef.current.add(refModel);
                      }
                  };
                 if (loadedModels.current[modelUrl]) {
                     loadPreview(loadedModels.current[modelUrl]);
                 } else {
                     gltfLoaderRef.current.load(modelUrl, (gltf) => {
                         loadedModels.current[modelUrl] = gltf;
                         if (window.attachedAsset && window.attachedAsset.id === e.detail.id) loadPreview(gltf);
                     });
                 }
             }
         }
      }
    };
    window.addEventListener('clinicAssetAttach', handleAttach);


    return () => {
      delete window.getClinicMapParams;
      window.removeEventListener('clinicAssetAttach', handleAttach);
    };
  }, [onAssetAction]);

  // Pan and Zoom controls (simple middle mouse or drag background)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const tryPlaceAttached = (clientX, clientY) => {
      if (!window.attachedAsset || !cameraRef.current || !dragPlaneRef.current || clientX == null) return false;
      const { id, isRecycledInst, flipX, isFromMap, isWallAsset } = window.attachedAsset;

      if (previewGroupRef.current && previewGroupRef.current.position.y !== -9999) {
         const gridX = previewGroupRef.current.userData?.gridX !== undefined 
            ? previewGroupRef.current.userData.gridX 
            : Math.round(previewGroupRef.current.position.x / 200);
         const gridZ = previewGroupRef.current.userData?.gridZ !== undefined 
            ? previewGroupRef.current.userData.gridZ 
            : Math.round(previewGroupRef.current.position.z / 200);
         const px = gridX * 200;
         const pz = gridZ * 200;
         
         const gx = px + 8400;
         const gy = pz - 3200;
         const svgX = Math.round((gx - gy) * 0.70710678 - 6144);
         const svgY = Math.round((gx + gy) * 0.408248 - 3429);

         let finalFlipX = flipX || false;
         if (isWallAsset) {
            finalFlipX = previewGroupRef.current.userData?.isWallY !== undefined
               ? previewGroupRef.current.userData.isWallY
               : (Math.abs(previewGroupRef.current.rotation.y - (-Math.PI / 2)) < 0.1);
         }

         if (isRecycledInst) {
           onAssetAction('place_recycle', id, svgX, svgY, finalFlipX);
           dropAnimRef.current[id] = 0;
           hoveredAssetRef.current = id;
         } else if (isFromMap) {
           onAssetAction('move', id, svgX, svgY, finalFlipX);
           dropAnimRef.current[id] = 0;
           hoveredAssetRef.current = id;
         } else {
           onAssetAction('place', id, svgX, svgY, finalFlipX);
         }
         
         window.attachedAsset = null;
         if (previewGroupRef.current) {
            previewGroupRef.current.children.forEach(child => disposeHierarchy(child, false));
            while(previewGroupRef.current.children.length > 0) previewGroupRef.current.remove(previewGroupRef.current.children[0]);
         }
         if (previewReflectionGroupRef.current) {
            previewReflectionGroupRef.current.children.forEach(child => disposeHierarchy(child, false));
            while(previewReflectionGroupRef.current.children.length > 0) previewReflectionGroupRef.current.remove(previewReflectionGroupRef.current.children[0]);
         }
         return true;
      }
      return false;
    };

    const onPointerDown = (e) => {
      // If left click, maybe we want to pick an object?
      if (e.button === 0) {
        if (window.attachedAsset) {
            tryPlaceAttached(e.clientX, e.clientY);
            return;
        }

        // Raycast to pick object or buy area
        const rect = el.getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        
        // Raycast against locked areas
        if (lockedAreaMeshesRef.current && lockedAreaMeshesRef.current.length > 0) {
          const intersects = raycaster.current.intersectObjects(lockedAreaMeshesRef.current);
          if (intersects.length > 0) {
            const mesh = intersects[0].object;
            const { instId, areaDef } = mesh.userData;
            const isLevelReqMet = latestState.current?.level >= areaDef.reqLevel;
            if (isLevelReqMet && onAssetAction) {
              onAssetAction('buy_area', instId, areaDef);
            }
            return;
          }
        }
        
        if (assetsGroupRef.current) {
          const intersects = raycaster.current.intersectObjects(assetsGroupRef.current.children, true);
          if (intersects.length > 0) {
            // Find root model
            let obj = intersects[0].object;
            while(obj.parent && obj.parent !== assetsGroupRef.current) {
              obj = obj.parent;
            }
            if (obj.userData && obj.userData.instanceId) {
              const instId = obj.userData.instanceId;
              const inst = latestState.current.placedClinicAssets[instId];
              const assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === inst.assetId);
              
              // Attach to cursor
              window.dispatchEvent(new CustomEvent('clinicAssetAttach', { 
                detail: { 
                  id: instId, 
                  isFromMap: true, 
                  flipX: inst.flipX,
                  rotation: inst.rotation,
                  isWallAsset: assetDef?.type === 'wall' || assetDef?.isWallAsset
                } 
              }));
              if (hoverHelperRef.current) hoverHelperRef.current.visible = false;
              hoveredAssetRef.current = null;
              return;
            }
          }
        }
      } else if (e.button === 2) {
         // Right click cancels attachment
         if (window.attachedAsset) {
            window.attachedAsset = null;
            if (previewGroupRef.current) {
               previewGroupRef.current.children.forEach(child => disposeHierarchy(child, false));
               while(previewGroupRef.current.children.length > 0) previewGroupRef.current.remove(previewGroupRef.current.children[0]);
            }
            if (previewReflectionGroupRef.current) {
               previewReflectionGroupRef.current.children.forEach(child => disposeHierarchy(child, false));
               while(previewReflectionGroupRef.current.children.length > 0) previewReflectionGroupRef.current.remove(previewReflectionGroupRef.current.children[0]);
            }
         }
      }

      isDragging = true;
      isPanDraggingRef.current = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onContextMenu = (e) => {
        if (window.attachedAsset) {
            e.preventDefault();
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape' && window.attachedAsset) {
            window.attachedAsset = null;
            if (previewGroupRef.current) {
               previewGroupRef.current.children.forEach(child => disposeHierarchy(child, false));
               while(previewGroupRef.current.children.length > 0) previewGroupRef.current.remove(previewGroupRef.current.children[0]);
            }
            if (previewReflectionGroupRef.current) {
               previewReflectionGroupRef.current.children.forEach(child => disposeHierarchy(child, false));
               while(previewReflectionGroupRef.current.children.length > 0) previewReflectionGroupRef.current.remove(previewReflectionGroupRef.current.children[0]);
            }
        }
    };

    const onPointerMove = (e) => {
      if (window.attachedAsset && cameraRef.current && dragPlaneRef.current && previewGroupRef.current) {
          const rect = el.getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.current.setFromCamera({ x: mx, y: my }, cameraRef.current);
          let gridX = 0;
          let gridZ = 0;
          let hitWallTile = null;

          if (window.attachedAsset.isWallAsset) {
              if (wallMeshesRef.current && wallMeshesRef.current.length > 0) {
                  const wallIntersects = raycaster.current.intersectObjects(wallMeshesRef.current);
                  if (wallIntersects.length > 0) {
                      const hitWall = wallIntersects[0].object;
                      gridX = hitWall.userData.tileX;
                      gridZ = hitWall.userData.tileY;
                      hitWallTile = hitWall.userData.tileDef;
                  }
              }

              if (!hitWallTile) {
                  const wallPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -150);
                  const targetPoint = new THREE.Vector3();
                  if (raycaster.current.ray.intersectPlane(wallPlane, targetPoint)) {
                      gridX = Math.round(targetPoint.x / 200);
                      gridZ = Math.round(targetPoint.z / 200);
                  }
              }
          } else {
              const intersects = raycaster.current.intersectObject(dragPlaneRef.current);
              if (intersects.length > 0) {
                  const pt = intersects[0].point;
                  gridX = Math.round(pt.x / 200);
                  gridZ = Math.round(pt.z / 200);
              } else {
                  return;
              }
          }

          // Validate to color red/green
          const floorMap = {};
          const allTiles = [...(window.CLINIC_MAP_TILES || [])];
          const areas = window.GAME_CONTENT?.clinicAreas || [];
          const mapAreas = window.GAME_CONTENT?.clinicMapAreas || [];
          const purchasedAreas = latestState.current?.purchasedAreas || [];
          mapAreas.forEach(inst => {
            const areaDef = areas.find(a => a.id === inst.areaId);
            const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
            if (isUnlocked && areaDef && areaDef.tiles) {
              areaDef.tiles.forEach(t => allTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true }));
            }
          });

          allTiles.forEach(t => {
            const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
            if (def && def.type === 'floor') {
              floorMap[`${t.x},${t.y}`] = true;
            }
          });

          const isWallAsset = window.attachedAsset?.isWallAsset;
          let wallTile = hitWallTile;
          const isValid = hitWallTile ? true : allTiles.some(t => {
              if (t.x !== gridX || t.y !== gridZ) return false;
              const actualType = t.type || window.CLINIC_TILES?.find(d => d.id === t.id)?.type || 'floor';
              if (isWallAsset) {
                 if (actualType === 'wall') {
                    const isY = t.id?.includes('_y') || t.id === 'wall_custom_y';
                    if (isY && floorMap[`${gridX},${gridZ}`] && floorMap[`${gridX - 1},${gridZ}`]) return false;
                    if (!isY && floorMap[`${gridX},${gridZ}`] && floorMap[`${gridX},${gridZ - 1}`]) return false;
                    wallTile = t;
                    return true;
                 }
                 return false;
              }
              return actualType === 'floor';
          });
          
          let isValidPlacement = isValid;
          if (isValidPlacement) {
              // Check if this grid cell already has another object placed on it
              const placed = latestState.current?.placedClinicAssets || {};
              const attachedId = window.attachedAsset?.isFromMap ? window.attachedAsset.id : null;
              const isOccupied = Object.entries(placed).some(([instId, inst]) => {
                  if (instId === attachedId) return false;
                  const svgX = inst.x + 6144;
                  const svgY = inst.y + 3429;
                  const unscaledY = svgY / 0.57735;
                  let igx = (svgX + unscaledY) * 0.70710678;
                  let igy = (-svgX + unscaledY) * 0.70710678;
                  const qx = Math.round((igx - 8400) / 200);
                  const qy = Math.round((igy + 3200) / 200);
                  return qx === gridX && qy === gridZ;
              });
              if (isOccupied) {
                  isValidPlacement = false;
              }
          }

          if (isValidPlacement) {
              if (isWallAsset && wallTile) {
                  const isWallY = wallTile.id?.includes('_y') || wallTile.id === 'wall_custom_y';
                  if (isWallY) {
                      previewGroupRef.current.position.set(gridX * 200 - 78, 0, gridZ * 200);
                      previewGroupRef.current.rotation.y = -Math.PI / 2;
                  } else {
                      previewGroupRef.current.position.set(gridX * 200, 0, gridZ * 200 - 78);
                      previewGroupRef.current.rotation.y = Math.PI;
                  }
                  previewGroupRef.current.userData = { gridX, gridZ, isWallY };
              } else {
                  const currentY = previewGroupRef.current.position.y;
                  previewGroupRef.current.position.set(gridX * 200, currentY === -9999 ? 0 : currentY, gridZ * 200);
                  previewGroupRef.current.rotation.y = 0;
                  previewGroupRef.current.userData = { gridX, gridZ, isWallY: false };
              }
          } else {
              previewGroupRef.current.position.y = -9999;
          }
          
          previewGroupRef.current.children.forEach(model => {
              model.traverse(child => {
                  if (child.isMesh && child.material) {
                      child.material.color.setHex(0xffffff);
                  }
              });
          });
          return;
      }

      if (isHoveringOverlayRef.current || (e.target && e.target.closest && e.target.closest('.asset-overlay-container'))) {
          // User is interacting with the UI overlay, do not clear hover
          return;
      }

      // Raycast against locked area meshes
      let hoveredLockedArea = null;
      if (!window.attachedAsset && cameraRef.current && lockedAreaMeshesRef.current && lockedAreaMeshesRef.current.length > 0) {
        const rect = el.getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        
        const intersects = raycaster.current.intersectObjects(lockedAreaMeshesRef.current);
        if (intersects.length > 0) {
          const mesh = intersects[0].object;
          hoveredLockedArea = mesh.userData;
        }
      }

      // Update lock hover target Y positions
      if (sceneRef.current) {
        sceneRef.current.traverse(child => {
          if (child.name && child.name.startsWith('lockIcon_')) {
            const instId = child.userData.instId;
            const isHovered = hoveredLockedArea && hoveredLockedArea.instId === instId;
            child.userData.targetY = isHovered ? (child.userData.baseY + 20) : child.userData.baseY;
          }
        });
      }

      // Update tooltip and opacity transitions
      if (hoveredLockedArea) {
        lockedAreaMeshesRef.current.forEach(mesh => {
          if (mesh.userData.instId === hoveredLockedArea.instId) {
            mesh.material.opacity = 0.95;
          } else {
            mesh.material.opacity = 0.6;
          }
        });
        
        const isLevelReqMet = latestState.current?.level >= hoveredLockedArea.areaDef.reqLevel;
        setAreaTooltip({
          x: e.clientX,
          y: e.clientY,
          name: hoveredLockedArea.areaDef.name,
          level: hoveredLockedArea.areaDef.reqLevel,
          price: hoveredLockedArea.areaDef.price,
          isLevelReqMet
        });
      } else {
        if (lockedAreaMeshesRef.current) {
          lockedAreaMeshesRef.current.forEach(mesh => {
            mesh.material.opacity = 0.85;
          });
        }
        setAreaTooltip(null);
      }

      if (!window.attachedAsset && cameraRef.current && assetsGroupRef.current) {
          const rect = el.getBoundingClientRect();
          mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.current.setFromCamera(mouse.current, cameraRef.current);
          const intersects = raycaster.current.intersectObjects(assetsGroupRef.current.children, true);
          if (intersects.length > 0) {
              let obj = intersects[0].object;
              while (obj.parent && obj.parent !== assetsGroupRef.current) {
                  obj = obj.parent;
              }
              if (obj.userData && obj.userData.instanceId) {
                  const instId = obj.userData.instanceId;
                  if (hoveredAssetRef.current !== instId) {
                      hoveredAssetRef.current = instId;
                      if (hoverHelperRef.current) {
                          hoverHelperRef.current.position.set(obj.position.x, 1, obj.position.z);
                          hoverHelperRef.current.visible = true;
                      }
                  }
                  if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                  }
              }
          } else {
              if (hoveredAssetRef.current !== null && !hoverTimeoutRef.current) {
                  hoverTimeoutRef.current = setTimeout(() => {
                      hoveredAssetRef.current = null;
                      if (hoverHelperRef.current) hoverHelperRef.current.visible = false;
                      hoverTimeoutRef.current = null;
                  }, 1000);
              }
          }
      }

      if (!isDragging || !cameraRef.current) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      const zoom = cameraRef.current.zoom;
      const panX = dx / zoom;
      const panY = dy / zoom;

      // Move camera so map tracks mouse perfectly
      const wdx = (-panX - panY) * 1.4;
      const wdz = (panX - panY) * 1.4;
      
      velocity.current.x = -wdx;
      velocity.current.y = -wdz;

      cameraRef.current.position.x += wdx;
      cameraRef.current.position.z += wdz;
      cameraRef.current.updateProjectionMatrix();
    };

    const onPointerUp = () => {
      isDragging = false;
      isPanDraggingRef.current = false;
    };
    
    const onWheel = (e) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      let nextLevel = zoomLevelRef.current;
      if (e.deltaY < 0) {
        nextLevel = Math.min(5, nextLevel + 1);
      } else {
        nextLevel = Math.max(-5, nextLevel - 1);
      }
      if (nextLevel !== zoomLevelRef.current) {
        zoomLevelRef.current = nextLevel;
        setZoomLevel(nextLevel);
        targetZoomRef.current = zoom0Ref.current * Math.pow(1.10, nextLevel);
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('wheel', onWheel);
    };
  }, [onAssetAction]);

  const handleZoom = (factor) => {
    if (!cameraRef.current) return;
    let nextLevel = zoomLevelRef.current;
    if (factor > 1) {
      nextLevel = Math.min(5, nextLevel + 1);
    } else {
      nextLevel = Math.max(-5, nextLevel - 1);
    }
    if (nextLevel !== zoomLevelRef.current) {
      zoomLevelRef.current = nextLevel;
      setZoomLevel(nextLevel);
      targetZoomRef.current = zoom0Ref.current * Math.pow(1.10, nextLevel);
    }
  };

  const btnStyle = {
    width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-1)',
    border: '1px solid var(--border)', color: 'var(--fg-1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontSize: 18
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @keyframes confettiExplosion {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(0.2) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>

      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          background: '#e8f2fb'
        }} 
      />
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          pointerEvents: 'none',
          fontFamily: 'monospace',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          Zoom: {zoomLevel > 0 ? `+${zoomLevel}` : zoomLevel}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => handleZoom(1.2)} style={btnStyle}><i className="fa-solid fa-plus"></i></button>
          <button onClick={() => handleZoom(1 / 1.2)} style={btnStyle}><i className="fa-solid fa-minus"></i></button>
        </div>
      </div>

      {/* Confetti particles */}
      {confettis.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: p.shape === 'circle' ? '50%' : '2px',
          pointerEvents: 'none',
          zIndex: 9999,
          animation: 'confettiExplosion 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
          '--dx': `${p.dx}px`,
          '--dy': `${p.dy}px`,
          '--rot': `${p.rot}deg`
        }} />
      ))}

      {/* Locked Area Tooltip */}
      {areaTooltip && (
        <div style={{
          position: 'fixed',
          left: areaTooltip.x + 15,
          top: areaTooltip.y + 15,
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          fontSize: '13px',
          zIndex: 10000,
          pointerEvents: 'none',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: '180px'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
            {areaTooltip.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ color: '#94a3b8' }}>{state.lang === 'es' ? 'Nivel req.' : 'Req. Level'}:</span>
            <span style={{ fontWeight: 'bold', color: areaTooltip.isLevelReqMet ? '#4ade80' : '#f87171' }}>
              {areaTooltip.level}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ color: '#94a3b8' }}>{state.lang === 'es' ? 'Precio' : 'Price'}:</span>
            <span style={{ fontWeight: 'bold', color: '#fcd34d' }}>
              {window.formatNum ? window.formatNum(areaTooltip.price) : areaTooltip.price} 🦷
            </span>
          </div>
          {!areaTooltip.isLevelReqMet && (
            <div style={{ color: '#f87171', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>
              ⚠️ {state.lang === 'es' ? 'Nivel insuficiente' : 'Insufficient level'}
            </div>
          )}
        </div>
      )}
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
        {Object.entries(state.placedClinicAssets || {}).map(([id, inst]) => {
           const assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === inst.assetId);
           const isWallAsset = assetDef?.type === 'wall' || assetDef?.isWallAsset;

           return (
           <div
              key={id}
              className="asset-overlay-container"
              ref={el => { if (el) assetButtonsRef.current[id] = el; else delete assetButtonsRef.current[id]; }}
              style={{
                 position: 'absolute', top: 0, left: 0, pointerEvents: 'auto',
                 display: 'none', alignItems: 'center', gap: 6,
                 transition: 'opacity 0.2s',
                 transform: 'translate(-50%, -50%)',
                 background: '#ffffff', border: '2px solid #000000',
                 borderRadius: '20px', padding: 4,
                 boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                 zIndex: 100
              }}
           >
             <button
                onClick={(e) => {
                   e.stopPropagation();
                   window.dispatchEvent(new CustomEvent('clinicAssetAttach', {
                      detail: {
                         id,
                         assetId: inst.assetId,
                         isFromMap: true,
                         flipX: inst.flipX,
                         rotation: inst.rotation,
                         isWallAsset
                      }
                   }));
                   hoveredAssetRef.current = null;
                   if (hoverHelperRef.current) hoverHelperRef.current.visible = false;
                }}
                title="Mover"
                style={{
                   all: 'unset', boxSizing: 'border-box',
                   width: 28, height: 28, borderRadius: '50%',
                   cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   color: 'var(--fg-2)', fontSize: 12, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--primary-i100)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-2)'; }}
             >
               <i className="fa-solid fa-arrows-up-down-left-right"></i>
             </button>
             {!isWallAsset && (
               <>
                 <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
                 <button
                    onClick={(e) => { e.stopPropagation(); onAssetAction('rotate', id); }}
                    title="Rotar"
                    style={{
                       all: 'unset', boxSizing: 'border-box',
                       width: 28, height: 28, borderRadius: '50%',
                       cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                       color: 'var(--fg-2)', fontSize: 12, transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--primary-i100)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-2)'; }}
                 >
                   <i className="fa-solid fa-rotate-right"></i>
                 </button>
               </>
             )}
             <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
             <button
                onClick={(e) => { e.stopPropagation(); onAssetAction('remove', id); }}
                title="Reciclar"
                style={{
                   all: 'unset', boxSizing: 'border-box',
                   width: 28, height: 28, borderRadius: '50%',
                   cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   color: 'var(--fg-2)', fontSize: 12, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--negative-i010)'; e.currentTarget.style.color = 'var(--negative-i100)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-2)'; }}
             >
               <i className="fa-solid fa-trash-can"></i>
             </button>
           </div>
           );
        })}
      </div>
    </div>
  );
}

window.ThreeClinicMap = ThreeClinicMap;

function ThreeAdminClinicMap({ tiles, areas, mapAreas, activeTool, isAreaColliding, onGridClick, onGridDragStart, onGridDragEnd }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const velocity = useRef({ x: 0, y: 0 });
  const isPanDraggingRef = useRef(false);
  const dragPlaneRef = useRef(null);
  
  const mapGroupRef = useRef(null);
  const ghostGroupRef = useRef(null);

  const dragStartRef = useRef(null);
  
  // Use a ref to always access latest props in event listeners without re-binding
  const latestProps = useRef({ tiles, areas, mapAreas, activeTool, isAreaColliding, onGridClick, onGridDragStart, onGridDragEnd });
  useEffect(() => {
    latestProps.current = { tiles, areas, mapAreas, activeTool, isAreaColliding, onGridClick, onGridDragStart, onGridDragEnd };
  }, [tiles, areas, mapAreas, activeTool, isAreaColliding, onGridClick, onGridDragStart, onGridDragEnd]);

  useEffect(() => {
    dragStartRef.current = null;
  }, [activeTool]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8f2fb');
    sceneRef.current = scene;

    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const frustumSize = 4000;
    const camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2,
      1, 10000
    );
    camera.position.set(4900, 2000, 4900);
    camera.lookAt(2900, 0, 2900);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4e2f5, 0.35);
    hemiLight.position.set(0, 5000, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.48);
    dirLight.position.set(1000, 2500, 500);
    dirLight.castShadow = true;
    dirLight.shadow.radius = 8;
    dirLight.shadow.bias = -0.0003;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -2000;
    dirLight.shadow.camera.right = 2000;
    dirLight.shadow.camera.top = 2000;
    dirLight.shadow.camera.bottom = -2000;
    dirLight.shadow.camera.far = 6000;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xf0f6ff, 0.24);
    fillLight.position.set(-1000, 1800, -500);
    scene.add(fillLight);

    const dragGeo = new THREE.PlaneGeometry(100000, 100000);
    dragGeo.rotateX(-Math.PI / 2);
    const dragMat = new THREE.MeshBasicMaterial({ visible: false });
    const dragPlane = new THREE.Mesh(dragGeo, dragMat);
    scene.add(dragPlane);
    dragPlaneRef.current = dragPlane;

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);
    mapGroupRef.current = mapGroup;

    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);
    ghostGroupRef.current = ghostGroup;

    const gridHelper = new THREE.GridHelper(6000, 30, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -0.5;
    gridHelper.position.x = 2900;
    gridHelper.position.z = 2900;
    scene.add(gridHelper);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isPanDraggingRef.current && (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.01)) {
        camera.position.x -= velocity.current.x;
        camera.position.z -= velocity.current.y;
        velocity.current.x *= 0.9;
        velocity.current.y *= 0.9;
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      const asp = w / h;
      cameraRef.current.left = frustumSize * asp / -2;
      cameraRef.current.right = frustumSize * asp / 2;
      cameraRef.current.top = frustumSize / 2;
      cameraRef.current.bottom = frustumSize / -2;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
      
      // Traverse and dispose everything in the scene
      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            const disposeMat = (mat) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            };
            if (Array.isArray(child.material)) {
              child.material.forEach(disposeMat);
            } else {
              disposeMat(child.material);
            }
          }
        }
      });

      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild map when tiles change
  useEffect(() => {
    if (!mapGroupRef.current) return;
    const group = mapGroupRef.current;
    
    // Dispose resources of old meshes
    group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const disposeMat = (mat) => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          };
          if (Array.isArray(child.material)) {
            child.material.forEach(disposeMat);
          } else {
            disposeMat(child.material);
          }
        }
      }
    });

    while(group.children.length > 0){ group.remove(group.children[0]); }

    const floorGeo = new THREE.BoxGeometry(200, 10, 200);
    const wallGeoX = new THREE.BoxGeometry(200, 300, 20);
    const wallGeoZ = new THREE.BoxGeometry(20, 300, 200);

    const allTiles = [...tiles];
    mapAreas.forEach(inst => {
      const areaDef = areas.find(a => a.id === inst.areaId);
      if (areaDef && areaDef.tiles) {
        areaDef.tiles.forEach(t => {
          allTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true, instId: inst.id });
        });
      }
    });

    const floorMap = {};
    allTiles.forEach(t => {
      const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
      if (def && def.type === 'floor') {
        floorMap[`${t.x},${t.y}`] = true;
      }
    });

    allTiles.forEach(t => {
      const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
      if (!def) return;
      const px = t.x * 200;
      const pz = t.y * 200;

      const mat = new THREE.MeshStandardMaterial({ 
        color: t.colorTop || def.colorTop || (def.type === 'floor' ? '#FDFCF8' : '#CADDFB'),
        roughness: def.type === 'wall' ? 0.8 : 0.1,
        metalness: def.type === 'floor' ? 0.1 : 0.0
      });

      if (def.type === 'floor') {
        const mesh = new THREE.Mesh(floorGeo, mat);
        mesh.position.set(px, -5, pz);
        mesh.receiveShadow = true;
        group.add(mesh);
      } else if (def.type === 'wall') {
        let isY = t.id.includes('_y');

        let shouldCull = false;
        if (isY && floorMap[`${t.x},${t.y}`] && floorMap[`${t.x - 1},${t.y}`]) shouldCull = true;
        if (!isY && floorMap[`${t.x},${t.y}`] && floorMap[`${t.x},${t.y - 1}`]) shouldCull = true;

        if (!shouldCull) {
          const mesh = new THREE.Mesh(isY ? wallGeoZ : wallGeoX, mat);
          mesh.position.set(px, 150, pz);
          if (isY) mesh.position.x -= 90;
          else mesh.position.z -= 90;
          mesh.castShadow = false;
          mesh.receiveShadow = true;
          mesh.userData = { instId: t.instId }; // Useful for area raycasting
          group.add(mesh);
        }
      }
    });
  }, [tiles, areas, mapAreas]);

  // Event handlers for drawing / panning
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isPanDragging = false;
    let isToolDragging = false;
    let hasPanned = false;
    let downPos = { x: 0, y: 0 };
    let prevMouse = { x: 0, y: 0 };

    const getGridPos = (clientX, clientY) => {
      const rect = el.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, cameraRef.current);
      const intersects = raycaster.current.intersectObject(dragPlaneRef.current);
      if (intersects.length > 0) {
        const pt = intersects[0].point;
        // Sub calculation: check if we are on the right half or left half of the isometric projection
        // x+z goes right-down, x-z goes right-up.
        const localX = pt.x % 200;
        const localZ = pt.z % 200;
        const sub = localX > localZ ? 'x' : 'y';

        return {
          x: Math.floor(pt.x / 200),
          y: Math.floor(pt.z / 200),
          sub
        };
      }
      return null;
    };

    const renderGhost = (gridPos) => {
      const group = ghostGroupRef.current;
      while(group.children.length > 0){ group.remove(group.children[0]); }
      if (!gridPos) {
          el.style.cursor = 'default';
          return;
      }

      const { activeTool, isAreaColliding, areas, mapAreas, tiles } = latestProps.current;
      
      // No active tool: hover areas or empty tile highlight
      if (!activeTool) {
          let hoverInstId = null;
          for (let i = mapAreas.length - 1; i >= 0; i--) {
            const inst = mapAreas[i];
            const areaDef = areas.find(a => a.id === inst.areaId);
            if (areaDef && gridPos.x >= inst.x && gridPos.x < inst.x + areaDef.width && gridPos.y >= inst.y && gridPos.y < inst.y + areaDef.length) {
              if (areaDef.tiles.some(t => t.dx === gridPos.x - inst.x && t.dy === gridPos.y - inst.y)) { 
                  hoverInstId = inst.id; 
                  break; 
              }
            }
          }
          if (hoverInstId) {
              const inst = mapAreas.find(a => a.id === hoverInstId);
              const areaDef = areas.find(a => a.id === inst.areaId);
              if (areaDef) {
                  const w = areaDef.width * 200;
                  const d = areaDef.length * 200;
                  const boxGeo = new THREE.BoxGeometry(w, 200, d);
                  const edgesGeo = new THREE.EdgesGeometry(boxGeo);
                  const lineMat = new THREE.LineDashedMaterial({ color: 0x3b82f6, dashSize: 20, gapSize: 10, linewidth: 2 });
                  const line = new THREE.LineSegments(edgesGeo, lineMat);
                  line.computeLineDistances();
                  line.position.set(inst.x * 200 + w/2 - 100, 100, inst.y * 200 + d/2 - 100);
                  group.add(line);
                  el.style.cursor = 'grab';
              }
          } else if (dragStartRef.current) {
              // First click already done, show selection preview
              const minX = Math.min(dragStartRef.current.x, gridPos.x) * 200;
              const maxX = Math.max(dragStartRef.current.x, gridPos.x) * 200;
              const minZ = Math.min(dragStartRef.current.y, gridPos.y) * 200;
              const maxZ = Math.max(dragStartRef.current.y, gridPos.y) * 200;
              const w = (maxX - minX) + 200;
              const d = (maxZ - minZ) + 200;
              const cx = minX + (maxX - minX) / 2;
              const cz = minZ + (maxZ - minZ) / 2;
              const selGeo = new THREE.BoxGeometry(w, 20, d);
              const selMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
              const mesh = new THREE.Mesh(selGeo, selMat);
              mesh.position.set(cx, 10, cz);
              group.add(mesh);
              el.style.cursor = 'crosshair';
          } else {
              // Empty tile hover: subtle grey highlight
              const px2 = gridPos.x * 200;
              const pz2 = gridPos.y * 200;
              const hoverGeo = new THREE.BoxGeometry(200, 8, 200);
              const hoverMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.35 });
              const hoverMesh = new THREE.Mesh(hoverGeo, hoverMat);
              hoverMesh.position.set(px2, 4, pz2);
              group.add(hoverMesh);
              el.style.cursor = 'crosshair';
          }
          return;
      }
      
      el.style.cursor = 'default';

      const px = gridPos.x * 200;
      const pz = gridPos.y * 200;

      // Select Area Box Render
      if (activeTool === 'select_area') {
        if (dragStartRef.current) {
          const minX = Math.min(dragStartRef.current.x, gridPos.x) * 200;
          const maxX = Math.max(dragStartRef.current.x, gridPos.x) * 200;
          const minZ = Math.min(dragStartRef.current.y, gridPos.y) * 200;
          const maxZ = Math.max(dragStartRef.current.y, gridPos.y) * 200;
          
          const w = (maxX - minX) + 200;
          const d = (maxZ - minZ) + 200;
          const cx = minX + (maxX - minX) / 2;
          const cz = minZ + (maxZ - minZ) / 2;

          const selGeo = new THREE.BoxGeometry(w, 20, d);
          const selMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
          const mesh = new THREE.Mesh(selGeo, selMat);
          mesh.position.set(cx, 10, cz);
          group.add(mesh);
        } else {
          // Hover effect when waiting for first click
          const w = 200, d = 200;
          const selGeo = new THREE.BoxGeometry(w, 20, d);
          const selMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 });
          const mesh = new THREE.Mesh(selGeo, selMat);
          mesh.position.set(px, 10, pz);
          group.add(mesh);
        }
        return;
      }

      // Ghost object render
      const selMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.7 });
      
      if (activeTool.startsWith('area_')) {
        const areaDef = areas.find(a => a.id === activeTool.replace('area_', ''));
        if (!areaDef) return;
        const w = areaDef.width * 200;
        const d = areaDef.length * 200;
        const targetX = gridPos.x - Math.floor(areaDef.width / 2);
        const targetZ = gridPos.y - Math.floor(areaDef.length / 2);
        
        const isColliding = isAreaColliding && isAreaColliding(areaDef.id, targetX, targetZ);
        if (isColliding) selMat.color.setHex(0xff0000);
        else selMat.color.setHex(0x3b82f6);

        const geo = new THREE.BoxGeometry(w, 20, d);
        const mesh = new THREE.Mesh(geo, selMat);
        mesh.position.set(targetX * 200 + w/2 - 100, 10, targetZ * 200 + d/2 - 100);
        group.add(mesh);
      } else {
        const def = (window.CLINIC_TILES || []).find(d => d.id === activeTool);
        if (!def) return;

        let isY = activeTool.includes('_y');
        if (def.id === 'wall_custom') { 
            isY = gridPos.sub === 'y'; // Auto-detect based on sub!
        }

        const geo = def.type === 'floor' ? new THREE.BoxGeometry(200, 10, 200) : (isY ? new THREE.BoxGeometry(20, 200, 200) : new THREE.BoxGeometry(200, 200, 20));
        const mesh = new THREE.Mesh(geo, selMat);
        mesh.position.set(px, def.type === 'floor' ? 5 : 100, pz);
        if (def.type === 'wall') {
            if (isY) mesh.position.x -= 90;
            else mesh.position.z -= 90;
        }
        group.add(mesh);
      }
    };

    const onPointerDown = (e) => {
      let handledDown = false;
      if (e.button === 0) {
        downPos = { x: e.clientX, y: e.clientY, handled: false };
      }
      
      if (e.metaKey || e.ctrlKey || e.button === 1 || e.button === 2) {
          isPanDragging = true;
      }
      
      prevMouse = { x: e.clientX, y: e.clientY };

      // Right click -> trigger delete
      if (e.button === 2) {
          const gPos = getGridPos(e.clientX, e.clientY);
          if (gPos && latestProps.current.onGridClick) {
              latestProps.current.onGridClick(gPos.x, gPos.y, true, gPos.sub);
          }
      } else if (e.button === 0 && !e.metaKey && !e.ctrlKey) {
        const { activeTool, onGridDragStart, onGridDragEnd, onGridClick, areas, mapAreas } = latestProps.current;

        if (!activeTool) {
            // No tool: area creation or area move/edit handled in onPointerUp (after confirming no drag)
            // We don't do anything on PointerDown for empty tiles — wait for PointerUp
        } else if (activeTool === 'select_area') {
            const gPos = getGridPos(e.clientX, e.clientY);
            if (gPos && !dragStartRef.current) {
                dragStartRef.current = gPos;
                downPos.handled = true;
                if (onGridDragStart) onGridDragStart(gPos.x, gPos.y);
            }
        } else {
            // Non-area tool (brush/stamp): apply on PointerDown
            isToolDragging = true;
            downPos.handled = true;
            const gPos = getGridPos(e.clientX, e.clientY);
            if (gPos && onGridClick) {
                onGridClick(gPos.x, gPos.y, false, gPos.sub);
            }
        }
      }
    };

    const onPointerMove = (e) => {
      // Pan camera if mouse button is held down
      if (isPanDragging && cameraRef.current && e.buttons > 0) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        
        prevMouse = { x: e.clientX, y: e.clientY };

        const zoom = cameraRef.current.zoom;
        const panX = dx / zoom;
        const panY = dy / zoom;

        const wdx = (-panX - panY) * 1.4;
        const wdz = (panX - panY) * 1.4;
        
        velocity.current.x = -wdx;
        velocity.current.y = -wdz;

        cameraRef.current.position.x += wdx;
        cameraRef.current.position.z += wdz;
        cameraRef.current.updateProjectionMatrix();
      }

      const gPos = getGridPos(e.clientX, e.clientY);
      
      // Brush dragging
      if (isToolDragging && gPos) {
          const { activeTool, onGridClick } = latestProps.current;
          if (activeTool && activeTool !== 'select_area' && onGridClick) {
              onGridClick(gPos.x, gPos.y, false, gPos.sub);
          }
      }

      // Render ghost always
      renderGhost(gPos);
      
      // If right click dragging (eraser)
      if (e.buttons === 2 && gPos) {
          latestProps.current.onGridClick(gPos.x, gPos.y, true, gPos.sub);
      }
    };

    const onPointerUp = (e) => {
      isPanDragging = false;
      isToolDragging = false;
      
      if (e.button === 0) {
        const dist = Math.abs(e.clientX - downPos.x) + Math.abs(e.clientY - downPos.y);
        const { activeTool, onGridDragStart, onGridDragEnd, onGridClick, areas, mapAreas } = latestProps.current;
        const gPos = getGridPos(e.clientX, e.clientY);
        const isPan = e.metaKey || e.ctrlKey;

        if (activeTool === 'select_area' && dragStartRef.current) {
            if (dist < 15 && gPos && !isPan) {
                if (onGridDragEnd) onGridDragEnd(gPos.x, gPos.y);
                dragStartRef.current = null;
            }
        } else if (!activeTool && !downPos.handled && dist < 15 && gPos && !isPan) {
            // Clean click with no tool: check if on area or empty tile
            let hitArea = null;
            for (let i = mapAreas.length - 1; i >= 0; i--) {
                const inst = mapAreas[i];
                const areaDef = areas.find(a => a.id === inst.areaId);
                if (areaDef && gPos.x >= inst.x && gPos.x < inst.x + areaDef.width && gPos.y >= inst.y && gPos.y < inst.y + areaDef.length) {
                    if (areaDef.tiles.some(t => t.dx === gPos.x - inst.x && t.dy === gPos.y - inst.y)) { hitArea = inst; break; }
                }
            }

            if (hitArea) {
                // Area click: delegate to onGridClick (move/edit)
                if (onGridClick) onGridClick(gPos.x, gPos.y, false, gPos.sub);
            } else if (!dragStartRef.current) {
                // Empty tile first click: start area creation
                dragStartRef.current = gPos;
                if (onGridDragStart) onGridDragStart(gPos.x, gPos.y);
            } else {
                // Empty tile second click: finalize area
                if (onGridDragEnd) onGridDragEnd(gPos.x, gPos.y);
                dragStartRef.current = null;
            }
        }
      }

      const finalPos = getGridPos(e.clientX, e.clientY);
      renderGhost(finalPos);
    };
    
    const onContextMenu = (e) => { e.preventDefault(); };

    const onWheel = (e) => {
      if (!e.metaKey && !e.ctrlKey) return;
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = 1.1;
      if (e.deltaY < 0) cameraRef.current.zoom *= zoomFactor;
      else cameraRef.current.zoom /= zoomFactor;
      cameraRef.current.updateProjectionMatrix();
    };

    const elRaw = containerRef.current;
    elRaw.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    elRaw.addEventListener('contextmenu', onContextMenu);
    elRaw.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      elRaw.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      elRaw.removeEventListener('contextmenu', onContextMenu);
      elRaw.removeEventListener('wheel', onWheel);
    };
  }, []);

  const handleZoom = (factor) => {
    if (!cameraRef.current) return;
    cameraRef.current.zoom *= factor;
    cameraRef.current.updateProjectionMatrix();
  };

  const btnStyle = {
    all: 'unset', boxSizing: 'border-box', width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', background: 'var(--bg-1)', color: 'var(--fg-1)',
    boxShadow: 'var(--elevation-30)', cursor: 'pointer', fontSize: 16,
    transition: 'all 0.2s', border: '1px solid var(--border-subtle)'
  };

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'none' }}>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', background: '#e8f2fb' }} 
      />
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

window.ThreeAdminClinicMap = ThreeAdminClinicMap;

window.GLBPreview = GLBPreview;
function GLBPreview({ url, flipX, size = 72, is3D = false, autoRotate = true, isometric = false, scaleMultiplier = 1 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const is3DUrl = (u, flag) => u && !u.startsWith('data:image/') && (u.includes('.glb') || u.includes('.gltf') || u.startsWith('data:') || flag);
    if (!containerRef.current || !url || !is3DUrl(url, is3D)) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('transparent');

    let camera;
    if (isometric) {
        camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
        camera.position.set(100, 100, 100);
        camera.lookAt(0, 0, 0);
    } else {
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(0, 50, 150);
        camera.lookAt(0, 0, 0);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4e2f5, 0.35);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xf0f6ff, 0.2);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    const loader = new THREE.GLTFLoader();
    if (window.THREE.DRACOLoader) {
      const dracoLoader = new window.THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
      loader.setDRACOLoader(dracoLoader);
    }
    let model;
    loader.load(url, (gltf) => {
      model = gltf.scene;
      
      // Compute bounding box to center and scale
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = (isometric ? 80 : 50) * scaleMultiplier / maxDim;
      model.scale.set(scale, scale, scale);
      
      const center = box.getCenter(new THREE.Vector3());
      model.position.x = -center.x * scale;
      model.position.y = -center.y * scale;
      model.position.z = -center.z * scale;

      model.rotation.y = flipX ? 0 : Math.PI;

      scene.add(model);
    });

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (model && autoRotate) model.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);

      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            const disposeMat = (mat) => {
              if (mat.map) mat.map.dispose();
              if (mat.lightMap) mat.lightMap.dispose();
              if (mat.bumpMap) mat.bumpMap.dispose();
              if (mat.normalMap) mat.normalMap.dispose();
              if (mat.specularMap) mat.specularMap.dispose();
              if (mat.envMap) mat.envMap.dispose();
              mat.dispose();
            };
            if (Array.isArray(child.material)) {
              child.material.forEach(disposeMat);
            } else {
              disposeMat(child.material);
            }
          }
        }
      });

      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [url, flipX]);

  const is3DUrl = (u, flag) => u && !u.startsWith('data:image/') && (u.includes('.glb') || u.includes('.gltf') || u.startsWith('data:') || flag);
  if (!url) return <i className="fa-solid fa-image" style={{ color: 'var(--fg-4)', fontSize: 24 }}></i>;
  if (!is3DUrl(url, is3D)) return <img src={url} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: flipX ? 'scaleX(-1)' : 'none' }} />;

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

window.GLBPreview = GLBPreview;

window.ThreeAreaPainter = function({ tiles, onTileClick, viewMode }) {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8f2fb');
    sceneRef.current = scene;

    let camera;
    if (viewMode === 'isometric') {
      const aspect = w / h;
      const d = 1000;
      camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 10000);
      camera.position.set(2000, 2000, 2000);
      camera.lookAt(0, 0, 0);
      camera.zoom = 0.8;
    } else {
      const aspect = w / h;
      const d = 1500;
      camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 10000);
      camera.position.set(0, 2000, 0);
      camera.lookAt(0, 0, 0);
      camera.zoom = 1;
    }
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4e2f5, 0.35);
    hemiLight.position.set(0, 5000, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.48);
    dirLight.position.set(1000, 2000, 1500);
    dirLight.castShadow = true;
    dirLight.shadow.radius = 8;
    dirLight.shadow.bias = -0.0003;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 100;
    dirLight.shadow.camera.far = 4000;
    dirLight.shadow.camera.left = -2000;
    dirLight.shadow.camera.right = 2000;
    dirLight.shadow.camera.top = 2000;
    dirLight.shadow.camera.bottom = -2000;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xf0f6ff, 0.24);
    fillLight.position.set(-1000, 1800, -1500);
    scene.add(fillLight);

    const resize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      rendererRef.current.setSize(nw, nh);
      const aspect = nw / nh;
      const d = viewMode === 'isometric' ? 1000 : 1500;
      cameraRef.current.left = -d * aspect;
      cameraRef.current.right = d * aspect;
      cameraRef.current.top = d;
      cameraRef.current.bottom = -d;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);

      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            const disposeMat = (mat) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            };
            if (Array.isArray(child.material)) {
              child.material.forEach(disposeMat);
            } else {
              disposeMat(child.material);
            }
          }
        }
      });

      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
         containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [viewMode]);

  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current) return;
    const scene = sceneRef.current;
    
    const existingGroup = scene.getObjectByName('tilesGroup');
    if (existingGroup) {
      existingGroup.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            const disposeMat = (mat) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            };
            if (Array.isArray(child.material)) {
              child.material.forEach(disposeMat);
            } else {
              disposeMat(child.material);
            }
          }
        }
      });
      scene.remove(existingGroup);
    }

    const group = new THREE.Group();
    group.name = 'tilesGroup';

    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;

    // Separate floors and walls
    const floorTiles = tiles.filter(t => {
      const def = window.CLINIC_TILES.find(d => d.id === t.id);
      return def && def.type === 'floor';
    });
    const wallTiles = tiles.filter(t => {
      const def = window.CLINIC_TILES.find(d => d.id === t.id);
      return def && def.type === 'wall';
    });

    if (viewMode === 'top') {
      // TOP VIEW: render floor tiles as flat colored quads, walls as colored borders
      floorTiles.forEach((t, i) => {
        const px = t.dx * 200;
        const pz = t.dy * 200;
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minZ = Math.min(minZ, pz); maxZ = Math.max(maxZ, pz);

        const color = t.colorTop || '#EAE4DC';
        const geom = new THREE.PlaneGeometry(198, 198);
        geom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(px, 0, pz);
        mesh.userData = { tileIndex: tiles.indexOf(t) };
        group.add(mesh);

        // Grid edge lines
        const edgeGeom = new THREE.EdgesGeometry(new THREE.PlaneGeometry(198, 198));
        edgeGeom.rotateX(-Math.PI / 2);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.12, transparent: true });
        const edges = new THREE.LineSegments(edgeGeom, edgeMat);
        edges.position.set(px, 1, pz);
        group.add(edges);
      });

      // Build a Set of floor tile positions for wall edge detection
      const floorSet = new Set(floorTiles.map(t => `${t.dx},${t.dy}`));

      // Draw walls as thick colored borders on the tile edges
      wallTiles.forEach(t => {
        const def = window.CLINIC_TILES.find(d => d.id === t.id);
        if (!def) return;
        const color = t.colorTop || def.colorTop || '#F2F8FF';
        const px = t.dx * 200;
        const pz = t.dy * 200;

        let bx = px, bz = pz, bw = 200, bd = 14;
        if (def.id === 'wall_custom_y') {
          // Left-side wall (X axis)
          bw = 14; bd = 200;
          const hasFloorLeft = floorSet.has(`${t.dx - 1},${t.dy}`);
          const hasFloorRight = floorSet.has(`${t.dx + 1},${t.dy}`);
          if (!hasFloorRight && hasFloorLeft) {
              bx = px + 93; // right edge wall
          } else {
              bx = px - 93; // left edge wall (default)
          }
        } else {
          // Top wall (Z axis)
          const hasFloorAbove = floorSet.has(`${t.dx},${t.dy - 1}`);
          const hasFloorBelow = floorSet.has(`${t.dx},${t.dy + 1}`);
          if (!hasFloorBelow && hasFloorAbove) {
              bz = pz + 93; // bottom edge wall
          } else {
              bz = pz - 93; // top edge wall (default)
          }
        }

        const wGeom = new THREE.PlaneGeometry(bw, bd);
        wGeom.rotateX(-Math.PI / 2);
        const wMat = new THREE.MeshBasicMaterial({ color });
        const wMesh = new THREE.Mesh(wGeom, wMat);
        wMesh.position.set(bx, 2, bz);
        group.add(wMesh);
      });

    } else {
      // ISOMETRIC VIEW: full 3D rendering
      // Build a Set of floor tile positions for wall edge detection
      const floorSet = new Set(floorTiles.map(t => `${t.dx},${t.dy}`));

      tiles.forEach((t, i) => {
        const def = window.CLINIC_TILES.find(d => d.id === t.id);
        if (!def) return;
        
        const width = def.width || 200;
        const length = def.length || 200;
        const height = def.height || 10;

        const px = t.dx * 200;
        const pz = t.dy * 200;
        
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minZ = Math.min(minZ, pz); maxZ = Math.max(maxZ, pz);

        const isWall = def.type === 'wall';
        const FLOOR_HEIGHT = 10;
        const EDGE_OFFSET = 90; // = 100 - thickness/2
        
        let finalPx = px;
        let finalPz = pz;
        let finalPy = 0;
        
        if (isWall) {
            if (def.id === 'wall_custom_y') {
                // Left wall: offset to left edge. Right wall: offset to right edge.
                // Detect: if there's NO floor tile to the left (dx-1), it's a left wall.
                // If there's NO floor tile to the right (dx+1), it's a right wall.
                const hasFloorLeft = floorSet.has(`${t.dx - 1},${t.dy}`);
                const hasFloorRight = floorSet.has(`${t.dx + 1},${t.dy}`);
                if (!hasFloorRight && hasFloorLeft) {
                    finalPx += EDGE_OFFSET; // right edge wall
                } else {
                    finalPx -= EDGE_OFFSET; // left edge wall (default)
                }
            } else {
                // Top wall: offset to top edge. Bottom wall: offset to bottom edge.
                const hasFloorAbove = floorSet.has(`${t.dx},${t.dy - 1}`);
                const hasFloorBelow = floorSet.has(`${t.dx},${t.dy + 1}`);
                if (!hasFloorBelow && hasFloorAbove) {
                    finalPz += EDGE_OFFSET; // bottom edge wall
                } else {
                    finalPz -= EDGE_OFFSET; // top edge wall (default)
                }
            }
            finalPy = FLOOR_HEIGHT / 2 + height / 2;
        } else {
            finalPy = 0;
        }

        const geom = new THREE.BoxGeometry(width, height, length);
        const matTop = new THREE.MeshStandardMaterial({ color: t.colorTop || def.colorTop, roughness: isWall ? 0.7 : 0.1 });
        const matSide1 = new THREE.MeshStandardMaterial({ color: t.colorLeft || def.colorLeft, roughness: isWall ? 0.7 : 0.1 });
        const matSide2 = new THREE.MeshStandardMaterial({ color: t.colorRight || def.colorRight, roughness: isWall ? 0.7 : 0.1 });
        const materials = [matSide1, matSide2, matTop, matSide1, matSide2, matSide1];

        const mesh = new THREE.Mesh(geom, materials);
        mesh.position.set(finalPx, finalPy, finalPz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { tileIndex: i, isWall };
        
        if (!isWall) {
           const edgeGeo = new THREE.EdgesGeometry(geom);
           const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.1, transparent: true });
           const edges = new THREE.LineSegments(edgeGeo, edgeMat);
           mesh.add(edges);
        }

        group.add(mesh);
      });
    }

    // Compute bounds from floor tiles for top view
    if (viewMode === 'top') {
      floorTiles.forEach(t => {
        const px = t.dx * 200; const pz = t.dy * 200;
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minZ = Math.min(minZ, pz); maxZ = Math.max(maxZ, pz);
      });
    }

    if (minX === Infinity) { minX = 0; maxX = 200; minZ = 0; maxZ = 200; }

    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    group.position.set(-cx, 0, -cz);
    scene.add(group);

    // Auto-fit camera zoom
    const spanX = (maxX - minX) + 200;
    const spanZ = (maxZ - minZ) + 200;
    const cam = cameraRef.current;
    if (cam) {
      const frustumW = cam.right - cam.left;
      const frustumH = cam.top - cam.bottom;

      if (viewMode === 'isometric') {
        // In isometric view, walls extend vertically — factor their projected height into the fit
        const maxWallHeight = 300; // max wall height in world units
        // In a (2000,2000,2000) isometric camera, Y maps roughly equally to screen Y
        // Add wall height to the effective Z span (Y projects to screen-Y similarly to Z)
        const effectiveSpanZ = spanZ + maxWallHeight * 0.7;
        const zoomX = frustumW / (spanX * 1.5);
        const zoomZ = frustumH / (effectiveSpanZ * 1.5);
        cam.zoom = Math.min(zoomX, zoomZ);
      } else {
        const zoomX = frustumW / (spanX * 1.15);
        const zoomZ = frustumH / (spanZ * 1.15);
        cam.zoom = Math.min(zoomX, zoomZ);
      }
      cam.updateProjectionMatrix();
    }

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [tiles, viewMode]);

  const handleClick = (e) => {
    if (!onTileClick || !containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const group = sceneRef.current.getObjectByName('tilesGroup');
    if (!group) return;

    const intersects = raycaster.current.intersectObjects(group.children);
    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.tileIndex;
      if (idx !== undefined) onTileClick(idx);
    }
  };

  return (
    <div 
       ref={containerRef} 
       onClick={handleClick} 
       style={{ width: '100%', height: '100%', cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}
    />
  );
}
