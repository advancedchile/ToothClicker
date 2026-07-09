const { useEffect, useRef, useState } = React;

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
  const uiElementsRef = useRef([]);

  // Refs for tracking drag logic
  const dragPlaneRef = useRef(null);
  const gridHelperRef = useRef(null);
  const assetsGroupRef = useRef(null);
  const previewGroupRef = useRef(null);
  const gltfLoaderRef = useRef(new THREE.GLTFLoader());
  const loadedModels = useRef({});

  // Latest state for event handlers
  const latestState = useRef(state);
  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    if (latestState.current?.purchasedAreas?.length > 0) {
      window.dispatchEvent(new Event('clinicMapUpdated'));
    }
  }, [state.purchasedAreas]);

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
    // Isometric angle: rotate 45 degrees around Y, then atan(1/sqrt(2)) (~35.264 deg) around X
    camera.position.set(4900, 2000, 4900);
    camera.lookAt(2900, 0, 2900);
    cameraRef.current = camera;

    // 3. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1000, 2000, 500);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -2000;
    dirLight.shadow.camera.right = 2000;
    dirLight.shadow.camera.top = 2000;
    dirLight.shadow.camera.bottom = -2000;
    dirLight.shadow.camera.far = 5000;
    scene.add(dirLight);

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

    const previewGroup = new THREE.Group();
    scene.add(previewGroup);
    previewGroupRef.current = previewGroup;

    // Grid helper
    const gridHelper = new THREE.GridHelper(6000, 30, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.position.y = 0.5;
    gridHelper.position.x = 2900;
    gridHelper.position.z = 2900;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const onClinicMapUpdated = () => {
      // Clear old map
      for (let i = scene.children.length - 1; i >= 0; i--) {
        const obj = scene.children[i];
        if (obj.userData && obj.userData.isMapPiece) {
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
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('clinicMapUpdated', onClinicMapUpdated);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []); // Run once on mount

  // Build static map (floors, walls)
  const buildMap = (scene) => {
    // Floor Material
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: '#FDFCF8', 
      roughness: 0.1, 
      metalness: 0.1 
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

    mapAreas.forEach(inst => {
      const areaDef = areas.find(a => a.id === inst.areaId);
      const isUnlocked = purchasedAreas.includes(inst.id) || (areaDef && (!areaDef.price || areaDef.price <= 0) && (!areaDef.reqLevel || areaDef.reqLevel <= 0));
      
      if (areaDef && areaDef.tiles) {
        areaDef.tiles.forEach(t => {
          allTiles.push({ ...t, x: inst.x + t.dx, y: inst.y + t.dy, isArea: true, isLocked: !isUnlocked });
        });
      }

      if (!isUnlocked && areaDef) {
        const centerX = inst.x + areaDef.width / 2 - 0.5;
        const centerY = inst.y + areaDef.length / 2 - 0.5;
        const px = centerX * 200;
        const pz = centerY * 200;
        newLockedAreas.push({ id: inst.id, areaDef, px, pz, isLevelReqMet: latestState.current?.level >= areaDef.reqLevel });
      }
    });

    lockedAreasRef.current = newLockedAreas;
    setLockedAreas(newLockedAreas);

    const floorMap = {};
    allTiles.forEach(t => {
      const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
      if (def && def.type === 'floor') {
        floorMap[`${t.x},${t.y}`] = true;
      }
    });

    const floorGeo = new THREE.BoxGeometry(200, 10, 200);
    const wallGeoX = new THREE.BoxGeometry(200, 200, 20); // Wall along X axis
    const wallGeoZ = new THREE.BoxGeometry(20, 200, 200); // Wall along Z axis

    allTiles.forEach(t => {
      const def = (window.CLINIC_TILES || []).find(d => d.id === t.id);
      if (!def) return;

      const px = t.x * 200;
      const pz = t.y * 200;

      if (def.type === 'floor') {
        const mesh = new THREE.Mesh(floorGeo, t.isLocked ? lockedFloorMat : floorMat);
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
          const mesh = new THREE.Mesh(isY ? wallGeoZ : wallGeoX, t.isLocked ? lockedWallMat : wallMat);
          mesh.position.set(px, 100, pz);
          if (isY) mesh.position.x -= 90; // offset wall to edge
          else mesh.position.z -= 90; // offset wall to edge
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { isMapPiece: true };
          scene.add(mesh);
        }
      }
    });

    // Add a grid helper
    const gridHelper = new THREE.GridHelper(10000, 50, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.05;
    gridHelper.material.transparent = true;
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;
  };

  // Sync assets
  const loadedModels = useRef({}); // Cache for models
  useEffect(() => {
    if (!assetsGroupRef.current) return;
    const group = assetsGroupRef.current;
    
    // Clear old meshes
    while(group.children.length > 0){ 
        group.remove(group.children[0]); 
    }

    const placedAssets = state.placedClinicAssets || {};
    
    Object.entries(placedAssets).forEach(([instId, inst]) => {
      const assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === inst.assetId);
      if (!assetDef) return;

      const modelUrl = assetDef.glbData || assetDef.modelUrl || assetDef.iconUrl;
      if (!modelUrl || (!modelUrl.includes('.glb') && !modelUrl.includes('.gltf') && !modelUrl.startsWith('data:'))) return; // Ignore non-3D

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

        // Apply position
        model.position.set(px, 0, pz); // using X and Z

        // Apply scale based on bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.z); // use floor footprint
        let s = assetDef.scale || 1;
        // If the model is tiny (e.g., 1 unit), scale it up so 1 unit = 200 grid units.
        // If we want it to fit the tile roughly, we can normalize its size to 200 * s
        if (maxDim > 0) {
            const fitScale = (200 / maxDim) * s;
            model.scale.set(fitScale, fitScale, fitScale);
        } else {
            model.scale.set(s, s, s);
        }

        // Apply rotation (flipX in 2D is handled by rotating 180 deg in Y)
        if (inst.flipX) {
            model.rotation.y = Math.PI;
        }

        // Adjust Y so it rests exactly on the floor
        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.y = -scaledBox.min.y;

        // Shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        model.userData = { instanceId: instId, assetId: inst.assetId };
        group.add(model);
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
             // Return true if there's a floor at gridX, gridZ
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
             return allTiles.some(t => t.x === gridX && t.y === gridZ && (!t.type || t.type === 'floor' || window.CLINIC_TILES?.find(d => d.id === t.id)?.type === 'floor'));
          }
           return false;
        }
      };
    };

    const handleAttach = (e) => {
      window.attachedAsset = e.detail;
      // create preview
      if (previewGroupRef.current) {
         while(previewGroupRef.current.children.length > 0) {
            previewGroupRef.current.remove(previewGroupRef.current.children[0]);
         }
         let assetDef;
         if (e.detail.isRecycledInst || e.detail.isFromMap) {
             const instId = e.detail.id;
             const inst = latestState.current.placedClinicAssets?.[instId] || latestState.current.recycledClinicAssets?.find(r => r.instanceId === instId);
             if (inst) assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === inst.assetId);
         } else {
             assetDef = (window.CLINIC_ASSETS || []).find(a => a.id === e.detail.id);
         }
         
         if (assetDef) {
             const modelUrl = assetDef.glbData || assetDef.modelUrl || assetDef.iconUrl;
             if (modelUrl && (modelUrl.includes('.glb') || modelUrl.includes('.gltf') || modelUrl.startsWith('data:'))) {
                 const loadPreview = (gltf) => {
                     const model = gltf.scene.clone();
                     const box = new THREE.Box3().setFromObject(model);
                     const size = box.getSize(new THREE.Vector3());
                     const maxDim = Math.max(size.x, size.z);
                     let s = assetDef.scale || 1;
                     if (maxDim > 0) {
                         const fitScale = (200 / maxDim) * s;
                         model.scale.set(fitScale, fitScale, fitScale);
                     } else {
                         model.scale.set(s, s, s);
                     }
                     const scaledBox = new THREE.Box3().setFromObject(model);
                     model.position.y = -scaledBox.min.y;
                     if (e.detail.flipX) model.rotation.y = Math.PI;
                     
                     model.traverse((child) => {
                         if (child.isMesh) {
                             child.material = child.material.clone();
                             child.material.transparent = true;
                             child.material.opacity = 0.6;
                         }
                     });
                     previewGroupRef.current.add(model);
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

    const tryPlaceAttached = (clientX, clientY) => {
      if (!window.attachedAsset || !cameraRef.current || !dragPlaneRef.current || clientX == null) return false;
      const { id, isRecycledInst, flipX, isFromMap } = window.attachedAsset;

      if (!cameraRef.current || !dragPlaneRef.current || clientX == null) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const mx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.current.setFromCamera({ x: mx, y: my }, cameraRef.current);
      const intersects = raycaster.current.intersectObject(dragPlaneRef.current);
      
      if (intersects.length > 0) {
         const pt = intersects[0].point;
         const gridX = Math.round(pt.x / 200);
         const gridZ = Math.round(pt.z / 200);

         // Return true if there's a floor at gridX, gridZ
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
         const isValid = allTiles.some(t => t.x === gridX && t.y === gridZ && (!t.type || t.type === 'floor' || window.CLINIC_TILES?.find(d => d.id === t.id)?.type === 'floor'));
         if (!isValid) return;

         // CONVERT TO SVG
         const px = gridX * 200;
         const pz = gridZ * 200;
         const gx = px + 8400;
         const gy = pz - 3200;
         const svgX = Math.round((gx - gy) * 0.70710678 - 6144);
         const svgY = Math.round((gx + gy) * 0.408248 - 3429);

         const finalFlipX = flipX || false;

          if (isRecycledInst) {
            onAssetAction('place_recycle', id, svgX, svgY, finalFlipX);
          } else if (isFromMap) {
            onAssetAction('move', id, svgX, svgY, finalFlipX);
          } else {
            onAssetAction('place', id, svgX, svgY, finalFlipX);
          }
          
          window.attachedAsset = null;
          if (previewGroupRef.current) {
             while(previewGroupRef.current.children.length > 0) previewGroupRef.current.remove(previewGroupRef.current.children[0]);
          }
          return true;
      }
      return false;
    };

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

    const onPointerDown = (e) => {
      // If left click, maybe we want to pick an object?
      if (e.button === 0) {
        // Raycast to pick object
        const rect = el.getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        
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
              
              // Attach to cursor
              window.dispatchEvent(new CustomEvent('clinicAssetAttach', { 
                detail: { 
                  id: instId, 
                  isFromMap: true, 
                  flipX: inst.flipX,
                  isWallAsset: false
                } 
              }));
              return;
            }
          }
        }
      } else if (e.button === 2) {
         // Right click cancels attachment
         if (window.attachedAsset) {
            window.attachedAsset = null;
            if (previewGroupRef.current) {
               while(previewGroupRef.current.children.length > 0) previewGroupRef.current.remove(previewGroupRef.current.children[0]);
            }
         }
      }

      if (window.attachedAsset) {
          if (e.button === 0) {
              tryPlaceAttached(e.clientX, e.clientY);
          }
          return;
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
               while(previewGroupRef.current.children.length > 0) previewGroupRef.current.remove(previewGroupRef.current.children[0]);
            }
        }
    };

    const onPointerMove = (e) => {
      if (window.attachedAsset && cameraRef.current && dragPlaneRef.current && previewGroupRef.current) {
          const rect = el.getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.current.setFromCamera({ x: mx, y: my }, cameraRef.current);
          const intersects = raycaster.current.intersectObject(dragPlaneRef.current);
          if (intersects.length > 0) {
              const pt = intersects[0].point;
              const gridX = Math.round(pt.x / 200);
              const gridZ = Math.round(pt.z / 200);
              previewGroupRef.current.position.set(gridX * 200, 0, gridZ * 200);
              
              // Validate to color red/green
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
              const isValid = allTiles.some(t => t.x === gridX && t.y === gridZ && (!t.type || t.type === 'floor' || window.CLINIC_TILES?.find(d => d.id === t.id)?.type === 'floor'));
              
              previewGroupRef.current.children.forEach(model => {
                  model.traverse(child => {
                      if (child.isMesh && child.material) {
                          child.material.color.setHex(isValid ? 0xaaffaa : 0xffaaaa);
                      }
                  });
              });
          }
          return;
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
      if (!e.metaKey && !e.ctrlKey) return;
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = 1.1;
      if (e.deltaY < 0) {
        cameraRef.current.zoom *= zoomFactor;
      } else {
        cameraRef.current.zoom /= zoomFactor;
      }
      cameraRef.current.updateProjectionMatrix();
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
  }, []);

  const handleZoom = (factor) => {
    if (!cameraRef.current) return;
    cameraRef.current.zoom *= factor;
    cameraRef.current.updateProjectionMatrix();
  };

  const btnStyle = {
    width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-1)',
    border: '1px solid var(--border)', color: 'var(--fg-1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontSize: 18
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          background: '#e8f2fb'
        }} 
      />
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => handleZoom(1.2)} style={btnStyle}><i className="fa-solid fa-plus"></i></button>
        <button onClick={() => handleZoom(1 / 1.2)} style={btnStyle}><i className="fa-solid fa-minus"></i></button>
      </div>
      
      {/* Locked Areas UI Overlay */}
      {lockedAreas.map((la, index) => (
        <div 
          key={`lock_${la.id}`} 
          ref={el => uiElementsRef.current[index] = el}
          onClick={() => onAssetAction && onAssetAction('buy_area', la.id, la.areaDef)}
          onPointerDown={(e) => e.stopPropagation()} 
          style={{ 
            position: 'absolute', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 10, 
            cursor: la.isLevelReqMet ? 'pointer' : 'not-allowed', 
            background: 'rgba(0,0,0,0.7)', 
            borderRadius: 12, 
            padding: '12px 20px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            color: '#fff', 
            border: '2px solid rgba(255,255,255,0.2)', 
            backdropFilter: 'blur(4px)', 
            pointerEvents: 'auto', 
            transition: 'transform 0.2s', 
            opacity: la.isLevelReqMet ? 1 : 0.8
          }} 
          onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05)'} 
          onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
        >
          <i className={`fa-solid ${la.isLevelReqMet ? 'fa-unlock' : 'fa-lock'}`} style={{ fontSize: 24, marginBottom: 8, color: la.isLevelReqMet ? 'var(--positive-i100)' : 'var(--warning-i100)' }}></i>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{la.areaDef.name}</div>
          {!la.isLevelReqMet ? (
            <div style={{ fontSize: 13, color: 'var(--warning-i100)', marginTop: 4 }}>Req Nivel {la.areaDef.reqLevel}</div>
          ) : (
            <div style={{ fontSize: 14, color: '#fef08a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-tooth"></i> {window.formatNum ? window.formatNum(la.areaDef.price) : la.areaDef.price}</div>
          )}
        </div>
      ))}
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
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1000, 2000, 500);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -2000;
    dirLight.shadow.camera.right = 2000;
    dirLight.shadow.camera.top = 2000;
    dirLight.shadow.camera.bottom = -2000;
    dirLight.shadow.camera.far = 5000;
    scene.add(dirLight);

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
    gridHelper.position.y = 0.5;
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
    while(group.children.length > 0){ group.remove(group.children[0]); }

    const floorGeo = new THREE.BoxGeometry(200, 10, 200);
    const wallGeoX = new THREE.BoxGeometry(200, 200, 20);
    const wallGeoZ = new THREE.BoxGeometry(20, 200, 200);

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
          mesh.position.set(px, 100, pz);
          if (isY) mesh.position.x -= 90;
          else mesh.position.z -= 90;
          mesh.castShadow = true;
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
      
      // Hover an Area
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
          } else {
              el.style.cursor = 'default';
          }
          return;
      }
      
      el.style.cursor = 'default';

      const px = gridPos.x * 200;
      const pz = gridPos.y * 200;

      // Select Area Box Render
      if (activeTool === 'select_area' && dragStartRef.current) {
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
      e.currentTarget.setPointerCapture(e.pointerId);
      const { activeTool, onGridClick, onGridDragStart } = latestProps.current;
      
      if (e.button === 0 && activeTool) { // Left click = use tool
        isToolDragging = true;
        const gPos = getGridPos(e.clientX, e.clientY);
        if (gPos) {
            if (activeTool === 'select_area') {
                dragStartRef.current = gPos;
                if (onGridDragStart) onGridDragStart(gPos.x, gPos.y);
            } else {
                if (onGridClick) onGridClick(gPos.x, gPos.y, false, gPos.sub); // false = not right click
            }
        }
      } else { // Right click or middle click or no tool = pan
        isPanDragging = true;
        isPanDraggingRef.current = true;
        prevMouse = { x: e.clientX, y: e.clientY };
        
        if (e.button === 0) {
            el.dataset.downX = e.clientX;
            el.dataset.downY = e.clientY;
        }

        // If right click, also trigger delete
        if (e.button === 2) {
          const gPos = getGridPos(e.clientX, e.clientY);
          if (gPos && onGridClick) onGridClick(gPos.x, gPos.y, true, gPos.sub); // true = right click (delete)
        }
      }
    };

    const onPointerMove = (e) => {
      if (isPanDragging && cameraRef.current && (e.buttons === 2 || e.buttons === 4 || (!latestProps.current.activeTool && e.buttons === 1))) {
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

      // Render ghost always
      const gPos = getGridPos(e.clientX, e.clientY);
      renderGhost(gPos);

      // If tool dragging (brush)
      if (isToolDragging && gPos && latestProps.current.activeTool && latestProps.current.activeTool !== 'select_area') {
          latestProps.current.onGridClick(gPos.x, gPos.y, false, gPos.sub);
      }
      
      // If right click dragging (eraser)
      if (e.buttons === 2 && gPos) {
          latestProps.current.onGridClick(gPos.x, gPos.y, true, gPos.sub);
      }
    };

    const onPointerUp = (e) => {
      const { activeTool, onGridDragEnd, onGridClick } = latestProps.current;
      isPanDragging = false;
      isPanDraggingRef.current = false;
      if (isToolDragging && activeTool === 'select_area') {
          const gPos = getGridPos(e.clientX, e.clientY);
          if (gPos && dragStartRef.current && onGridDragEnd) {
              onGridDragEnd(gPos.x, gPos.y);
          }
          dragStartRef.current = null;
          renderGhost(gPos);
      }
      isToolDragging = false;

      // Detect click on area
      if (e.button === 0 && !activeTool) {
          const downX = parseFloat(el.dataset.downX);
          const downY = parseFloat(el.dataset.downY);
          if (!isNaN(downX) && !isNaN(downY)) {
             const dist = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
             if (dist < 5) {
                 const gPos = getGridPos(e.clientX, e.clientY);
                 if (gPos && onGridClick) onGridClick(gPos.x, gPos.y, false, gPos.sub);
             }
          }
      }
      el.dataset.downX = '';
      el.dataset.downY = '';
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

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('wheel', onWheel);
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
function GLBPreview({ url, flipX, size = 72 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !url || (!url.includes('.glb') && !url.includes('.gltf') && !url.startsWith('data:'))) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('transparent');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 50, 150);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    const loader = new THREE.GLTFLoader();
    let model;
    loader.load(url, (gltf) => {
      model = gltf.scene;
      
      // Compute bounding box to center and scale
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;
      model.scale.set(scale, scale, scale);
      
      const center = box.getCenter(new THREE.Vector3());
      model.position.x = -center.x * scale;
      model.position.y = -center.y * scale;
      model.position.z = -center.z * scale;

      if (flipX) model.rotation.y = Math.PI;

      scene.add(model);
    });

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (model) model.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [url, flipX]);

  if (!url) return <i className="fa-solid fa-image" style={{ color: 'var(--fg-4)', fontSize: 24 }}></i>;
  if (!url.includes('.glb') && !url.includes('.gltf') && !url.startsWith('data:')) return <img src={url} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: flipX ? 'scaleX(-1)' : 'none' }} />;

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

window.GLBPreview = GLBPreview;
