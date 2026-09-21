/**
 * ── 3D Digital Twin Engine (WebGL / Three.js + URDFLoader) ───────────────────
 * Hardware-accelerated 3D view of xArm Lite 6 with real-time /joint_states mirroring.
 */

(function () {
  let scene, camera, renderer, controls;
  let robotModel = null;
  let gridHelper, axesHelper, shadowPlane;
  let container = null;
  let animId = null;
  let currentJoints = [0, 0, 0, 0, 0, 0];
  let linearShiftY = 0.0;
  let isGridVisible = true;
  let isEdgesVisible = true;
  let edgeLines = [];

  // ── Interactive 3D TCP Gizmo State ──
  let transformControls = null;
  let gizmoTarget = null;
  let ghostTCPGroup = null;
  let dashedLine = null;
  let isGizmoActive = true;
  let gizmoMode = 'translate'; // 'translate' | 'rotate'
  let isDraggingGizmo = false;
  let hasUserTargetOffset = false;

  // Safety & Warning State
  let allRobotMeshes = [];
  let linkMeshes = {};
  let safetyState = {
    collision: false,
    singularity: false,
    message: '',
    collidingLinks: [],
    singularityJoints: [],
    manipPct: 100,
    floorClearanceZ: null
  };

  const collisionMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.8,
    metalness: 0.35,
    roughness: 0.25
  });

  const singularityMaterial = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.7,
    metalness: 0.45,
    roughness: 0.25
  });

  // Initial camera perspective (ROS coordinates: Z is UP)
  const DEFAULT_CAM_POS = { x: 0.72, y: -0.82, z: 0.52 };
  const DEFAULT_TARGET = { x: 0.0, y: 0.0, z: 0.22 };

  function initDigitalTwin() {
    container = document.getElementById('digital-twin-viewport');
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);

    // 2. Camera (ROS convention: Z is up)
    camera = new THREE.PerspectiveCamera(42, width / height, 0.01, 20);
    camera.up.set(0, 0, 1);
    camera.position.set(DEFAULT_CAM_POS.x, DEFAULT_CAM_POS.y, DEFAULT_CAM_POS.z);

    // 3. Renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('[DigitalTwin] WebGL init fallback:', e);
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false });
      } catch (e2) {
        console.error('[DigitalTwin] WebGL completely unavailable:', e2);
        const badge = document.getElementById('twin-status-badge');
        if (badge) {
          badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> No WebGL';
          badge.className = 'badge badge-kill';
        }
        return;
      }
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = ''; // clear any placeholder
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(DEFAULT_TARGET.x, DEFAULT_TARGET.y, DEFAULT_TARGET.z);
      controls.minDistance = 0.2;
      controls.maxDistance = 3.0;
      controls.maxPolarAngle = Math.PI / 2 + 0.1; // don't go too far below floor
      controls.update();
    }

    // 5. Lighting Setup (Enhanced Ambient Occlusion & Dynamic Soft Shadows)
    // Hemisphere Light: Natural vertical shading gradient (cool bright sky to deep slate ground)
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x090d16, 0.45);
    scene.add(hemiLight);

    // Key Directional Light: Generates crisp highlights and soft dynamic drop shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(1.2, -1.0, 2.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 4.5;
    keyLight.shadow.camera.left = -0.6;
    keyLight.shadow.camera.right = 0.6;
    keyLight.shadow.camera.top = 0.6;
    keyLight.shadow.camera.bottom = -0.6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02; // Prevents shadow acne on curved cylinders
    keyLight.shadow.radius = 2.0;
    scene.add(keyLight);

    // Rim Light (Cyan): Highlights silhouettes of arm cylinders against dark viewport
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    rimLight.position.set(-1.2, 1.2, 1.0);
    scene.add(rimLight);

    // Fill Light: Soft front-fill so shaded sides remain clearly readable
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.25);
    fillLight.position.set(0.6, 1.0, 0.5);
    scene.add(fillLight);

    // 6. Grid, Helpers & Ground Shadow Receiver Plane
    gridHelper = new THREE.GridHelper(1.2, 24, 0x38bdf8, 0x1e293b);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.001;
    scene.add(gridHelper);

    axesHelper = new THREE.AxesHelper(0.12);
    axesHelper.position.set(0, 0, 0.001);
    scene.add(axesHelper);

    // Soft ground contact shadow plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.position.z = -0.0005;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 7. Interactive 3D TCP Gizmo (TransformControls)
    initTCPGizmo();

    // 8. Load URDF
    loadURDFModel();

    // 9. Animation Loop
    function animate() {
      animId = requestAnimationFrame(animate);
      if (controls) controls.update();
      updateSafetyVisuals();
      updateConnectingLine();
      renderer.render(scene, camera);
    }
    animate();

    // 9. Resize Observer
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => handleResize());
      ro.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }
  }

  function handleResize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  }

  function loadURDFModel() {
    const badge = document.getElementById('twin-status-badge');
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading URDF...';
      badge.className = 'badge badge-launch';
    }

    if (typeof URDFLoader === 'undefined') {
      console.error('[DigitalTwin] URDFLoader is not loaded');
      if (badge) {
        badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Loader Missing';
        badge.className = 'badge badge-kill';
      }
      return;
    }

    const loader = new URDFLoader();
    loader.packages = {
      '': 'models',
      'lite6': 'models/lite6',
      'xarm_description': 'models'
    };
    loader.load(
      'models/lite6.urdf',
      (robot) => {
        robotModel = robot;
        edgeLines = [];
        allRobotMeshes = [];
        linkMeshes = {};

        // Helper to resolve link name for each mesh by walking hierarchy
        function getLinkName(mesh) {
          let curr = mesh;
          while (curr && curr !== robot) {
            if (curr.isURDFLink || curr.urdfNode) {
              return (curr.name || (curr.urdfNode ? curr.urdfNode.getAttribute('name') : '')).toLowerCase();
            }
            if (curr.name && (curr.name.startsWith('link') || curr.name.includes('base') || curr.name.includes('gripper') || curr.name.includes('vacuum'))) {
              return curr.name.toLowerCase();
            }
            curr = curr.parent;
          }
          return (mesh.name || '').toLowerCase();
        }

        // Custom aesthetic material pass: Industrial Two-Tone Joint Contrast & CAD Edges
        robotModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const linkName = getLinkName(child);
            let material;
            let edgeColor = 0x334155;
            let edgeOpacity = 0.45;

            if (linkName.includes('gripper') || linkName.includes('vacuum')) {
              // Vacuum Gripper: Matte Dark Graphite
              material = new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                metalness: 0.4,
                roughness: 0.45
              });
              edgeColor = 0x64748b;
              edgeOpacity = 0.6;
            } else if (linkName.includes('link6')) {
              // Tool Flange: Precision Machined Steel / Silver
              material = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                metalness: 0.85,
                roughness: 0.2
              });
              edgeColor = 0x475569;
              edgeOpacity = 0.5;
            } else if (linkName.includes('link5')) {
              // Wrist Pitch Housing: Gunmetal Slate
              material = new THREE.MeshStandardMaterial({
                color: 0x475569,
                metalness: 0.6,
                roughness: 0.3
              });
              edgeColor = 0x94a3b8;
              edgeOpacity = 0.5;
            } else if (linkName.includes('link3')) {
              // Elbow Joint Housing: High-contrast Dark Gunmetal (clearly delineates elbow bending!)
              material = new THREE.MeshStandardMaterial({
                color: 0x334155,
                metalness: 0.55,
                roughness: 0.3
              });
              edgeColor = 0x94a3b8;
              edgeOpacity = 0.55;
            } else if (linkName.includes('base')) {
              // Base Link: Sturdy Technical Slate / Cast Iron Foundation
              material = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                metalness: 0.55,
                roughness: 0.35
              });
              edgeColor = 0x64748b;
              edgeOpacity = 0.5;
            } else if (linkName.includes('link1')) {
              // Joint 1 Turret: Titanium Light Grey / Silver (contrasts with dark base below)
              material = new THREE.MeshStandardMaterial({
                color: 0xe2e8f0,
                metalness: 0.35,
                roughness: 0.28
              });
              edgeColor = 0x334155;
              edgeOpacity = 0.45;
            } else {
              // Link 2 & Link 4 (Main Arm Tubes): Brilliant Gloss Robot White
              material = new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                metalness: 0.15,
                roughness: 0.25
              });
              edgeColor = 0x334155;
              edgeOpacity = 0.45;
            }

            child.material = material;
            child.userData.linkName = linkName;
            child.userData.originalMaterial = material;
            allRobotMeshes.push(child);
            if (!linkMeshes[linkName]) linkMeshes[linkName] = [];
            linkMeshes[linkName].push(child);

            // CAD Edge Contour Geometry (Edges > 26 deg get crisp architectural lines)
            if (child.geometry) {
              try {
                const edgeGeo = new THREE.EdgesGeometry(child.geometry, 26);
                const edgeMat = new THREE.LineBasicMaterial({
                  color: edgeColor,
                  transparent: true,
                  opacity: edgeOpacity
                });
                const edgeLineMesh = new THREE.LineSegments(edgeGeo, edgeMat);
                edgeLineMesh.visible = isEdgesVisible;
                child.add(edgeLineMesh);
                edgeLines.push(edgeLineMesh);
              } catch (err) {
                console.warn('[DigitalTwin] Error generating edge contours for mesh:', err);
              }
            }
          }
        });

        // Add robot to scene
        scene.add(robotModel);

        // Apply any cached joints or linear axis
        applyJointValues();
        syncTCPGizmoToRobot(true);

        if (badge) {
          badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Live Digital Twin';
          badge.className = 'badge badge-node';
        }
        console.log('[DigitalTwin] xArm Lite 6 URDF successfully loaded with enhanced shading.');
      },
      (progress) => {
        // loading progress
      },
      (error) => {
        console.error('[DigitalTwin] Error loading URDF:', error);
        if (badge) {
          badge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Load Error';
          badge.className = 'badge badge-kill';
        }
      }
    );
  }

  function applyJointValues() {
    if (!robotModel) return;
    const jointNames = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6'];
    for (let i = 0; i < 6; i++) {
      if (robotModel.joints && robotModel.joints[jointNames[i]]) {
        robotModel.setJointValue(jointNames[i], currentJoints[i]);
      }
    }
    // Update linear axis translation along Y axis
    if (robotModel.position) {
      robotModel.position.y = linearShiftY;
    }

    // Keep TCP Gizmo in sync if user is not actively dragging it
    if (isGizmoActive && !isDraggingGizmo && !hasUserTargetOffset) {
      syncTCPGizmoToRobot(false);
    } else {
      updateConnectingLine();
    }
  }

  // ── Safety & Warning Visual Loop (Collision: Red Glow, Singularity: Amber Glow)
  function updateSafetyVisuals() {
    if (!robotModel || allRobotMeshes.length === 0) return;
    const now = Date.now();

    if (safetyState.collision) {
      // Dynamic pulsating emissive red highlight
      const pulse = 0.55 + 0.45 * Math.sin(now * 0.012);
      collisionMaterial.emissiveIntensity = 0.5 + 0.6 * pulse;

      allRobotMeshes.forEach((mesh) => {
        const name = mesh.userData.linkName || '';
        const isTarget = safetyState.collidingLinks.length === 0 ||
                         safetyState.collidingLinks.some((l) => name.includes(l));
        if (isTarget) {
          mesh.material = collisionMaterial;
        } else {
          mesh.material = mesh.userData.originalMaterial;
        }
      });
    } else if (safetyState.singularity) {
      // Dynamic pulsating amber/gold highlight
      const pulse = 0.55 + 0.45 * Math.sin(now * 0.008);
      singularityMaterial.emissiveIntensity = 0.4 + 0.5 * pulse;

      allRobotMeshes.forEach((mesh) => {
        const name = mesh.userData.linkName || '';
        const isTarget = safetyState.singularityJoints.length === 0 ||
                         safetyState.singularityJoints.some((j) => name.includes(j));
        if (isTarget) {
          mesh.material = singularityMaterial;
        } else {
          mesh.material = mesh.userData.originalMaterial;
        }
      });
    } else {
      // Nominal: cleanly restore industrial two-tone materials
      allRobotMeshes.forEach((mesh) => {
        if (mesh.material !== mesh.userData.originalMaterial) {
          mesh.material = mesh.userData.originalMaterial;
        }
      });
    }
  }

  // ── Interactive 3D TCP Gizmo (TransformControls & Target Proxy) ─────────────
  function initTCPGizmo() {
    if (typeof THREE.TransformControls === 'undefined') {
      console.warn('[DigitalTwin] THREE.TransformControls is not loaded. Skipping TCP Gizmo.');
      return;
    }
    if (!scene || !camera || !renderer) return;

    try {
      transformControls = new THREE.TransformControls(camera, renderer.domElement);
      transformControls.size = 0.65;
      transformControls.setSpace('world');
      transformControls.setMode(gizmoMode);

      // Dummy target proxy object
      gizmoTarget = new THREE.Object3D();
      gizmoTarget.position.set(0.3, 0.0, 0.2);
      scene.add(gizmoTarget);

      // Ghost TCP Marker attached to gizmoTarget
      ghostTCPGroup = new THREE.Group();

      // Ghost Axes
      const ghostAxes = new THREE.AxesHelper(0.065);
      ghostAxes.material.depthTest = false;
      ghostAxes.material.transparent = true;
      ghostAxes.material.opacity = 0.85;
      ghostAxes.renderOrder = 999;
      ghostTCPGroup.add(ghostAxes);

      // Ghost suction cup / end flange disc (glowing cyan)
      const ghostDiscGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.005, 24);
      ghostDiscGeo.rotateX(Math.PI / 2);
      const ghostDiscMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.55,
        metalness: 0.3,
        roughness: 0.25
      });
      const ghostDiscMesh = new THREE.Mesh(ghostDiscGeo, ghostDiscMat);
      ghostDiscMesh.renderOrder = 999;
      ghostTCPGroup.add(ghostDiscMesh);

      gizmoTarget.add(ghostTCPGroup);
      transformControls.attach(gizmoTarget);
      scene.add(transformControls);

      // Dashed connecting line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.012,
        gapSize: 0.008,
        transparent: true,
        opacity: 0.8
      });
      dashedLine = new THREE.Line(lineGeo, lineMat);
      dashedLine.computeLineDistances();
      dashedLine.visible = false;
      scene.add(dashedLine);

      // Dragging events
      transformControls.addEventListener('dragging-changed', function (event) {
        isDraggingGizmo = Boolean(event.value);
        if (controls) controls.enabled = !isDraggingGizmo;

        if (isDraggingGizmo) {
          hasUserTargetOffset = true;
        } else {
          handleGizmoDragEnd();
        }
      });

      transformControls.addEventListener('change', function () {
        if (isDraggingGizmo) {
          handleGizmoChange(true);
        }
      });

      updateGizmoVisibility();
      console.log('[DigitalTwin] 3D TCP TransformControls initialized.');
    } catch (e) {
      console.error('[DigitalTwin] Error initializing TCP Gizmo:', e);
    }
  }

  function getRealRobotTCPPose() {
    if (!robotModel) return null;
    const linkTCP = robotModel.getObjectByName('link_tcp') ||
                     robotModel.getObjectByName('uflite_vacuum_gripper_link') ||
                     robotModel.getObjectByName('link6');
    if (!linkTCP) return null;

    robotModel.updateMatrixWorld(true);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    linkTCP.getWorldPosition(pos);
    linkTCP.getWorldQuaternion(quat);
    return { position: pos, quaternion: quat };
  }

  function syncTCPGizmoToRobot(resetOffset = true) {
    const realTCP = getRealRobotTCPPose();
    if (!realTCP || !gizmoTarget) return;

    if (resetOffset) {
      hasUserTargetOffset = false;
    }

    gizmoTarget.position.copy(realTCP.position);
    gizmoTarget.quaternion.copy(realTCP.quaternion);
    if (transformControls) transformControls.updateMatrixWorld();

    handleGizmoChange(resetOffset);
    if (dashedLine && !hasUserTargetOffset) dashedLine.visible = false;
  }

  function handleGizmoChange(updateInputs = true) {
    if (!gizmoTarget) return;

    // Convert to robot base frame coordinates (mm)
    const posX_mm = Math.round(gizmoTarget.position.x * 1000.0);
    const posY_mm = Math.round((gizmoTarget.position.y - linearShiftY) * 1000.0);
    const posZ_mm = Math.round(gizmoTarget.position.z * 1000.0);

    const euler = new THREE.Euler().setFromQuaternion(gizmoTarget.quaternion, 'XYZ');
    const roll = Number(euler.x.toFixed(2));
    const pitch = Number(euler.y.toFixed(2));
    const yaw = Number(euler.z.toFixed(2));

    if (updateInputs) {
      const inpX = document.getElementById('inp-x');
      const inpY = document.getElementById('inp-y');
      const inpZ = document.getElementById('inp-z');
      const inpR = document.getElementById('inp-r');
      const inpP = document.getElementById('inp-p');
      const inpYw = document.getElementById('inp-yw');

      if (inpX) inpX.value = posX_mm;
      if (inpY) inpY.value = posY_mm;
      if (inpZ) inpZ.value = posZ_mm;
      if (inpR) inpR.value = roll.toFixed(2);
      if (inpP) inpP.value = pitch.toFixed(2);
      if (inpYw) inpYw.value = yaw.toFixed(2);
    }

    // Distance delta to real robot TCP
    const realTCP = getRealRobotTCPPose();
    let deltaDist_mm = 0;
    if (realTCP) {
      deltaDist_mm = Math.round(gizmoTarget.position.distanceTo(realTCP.position) * 1000.0);
    }

    // Safety check on current gizmo coordinates
    const r_xy = Math.sqrt(posX_mm * posX_mm + posY_mm * posY_mm);
    const isInsideDeadzone = (r_xy < 125.0 && posZ_mm < 280.0);
    const isBelowFloor = (posZ_mm <= 15.0);

    // Update floating HUD in viewport
    const hudCoords = document.getElementById('gizmo-hud-coords');
    const hudDelta = document.getElementById('gizmo-hud-delta');
    const btnExecute = document.getElementById('btn-gizmo-execute');
    if (hudCoords) {
      hudCoords.innerText = `X: ${posX_mm} Y: ${posY_mm} Z: ${posZ_mm}`;
      if (isInsideDeadzone || isBelowFloor) {
        hudCoords.style.color = '#ef4444';
      } else if (r_xy < 140.0 || posZ_mm < 35.0) {
        hudCoords.style.color = '#f59e0b';
      } else {
        hudCoords.style.color = 'inherit';
      }
    }
    if (hudDelta) {
      if (isInsideDeadzone) {
        hudDelta.innerText = `⚠️ R: ${Math.round(r_xy)} < 125 mm`;
        hudDelta.style.color = '#ef4444';
        hudDelta.style.background = 'rgba(239, 68, 68, 0.25)';
      } else if (isBelowFloor) {
        hudDelta.innerText = `⚠️ Z: ${posZ_mm} ≤ 15 mm`;
        hudDelta.style.color = '#ef4444';
        hudDelta.style.background = 'rgba(239, 68, 68, 0.25)';
      } else {
        hudDelta.innerText = `Δ ${deltaDist_mm} mm`;
        if (deltaDist_mm > 4) {
          hudDelta.style.color = '#38bdf8';
          hudDelta.style.background = 'rgba(56, 189, 248, 0.2)';
        } else {
          hudDelta.style.color = 'var(--mut)';
          hudDelta.style.background = 'rgba(255, 255, 255, 0.06)';
        }
      }
    }
    if (btnExecute) {
      btnExecute.disabled = (isInsideDeadzone || isBelowFloor);
    }

    updateConnectingLine();
  }

  function handleGizmoDragEnd() {
    handleGizmoChange(true);

    const autoDrop = document.getElementById('chk-gizmo-auto-drop');
    const shouldAutoExecute = autoDrop ? autoDrop.checked : true;

    const posX_mm = Math.round(gizmoTarget.position.x * 1000.0);
    const posY_mm = Math.round((gizmoTarget.position.y - linearShiftY) * 1000.0);
    const posZ_mm = Math.round(gizmoTarget.position.z * 1000.0);
    const r_xy = Math.sqrt(posX_mm * posX_mm + posY_mm * posY_mm);
    const isInsideDeadzone = (r_xy < 125.0 && posZ_mm < 280.0);
    const isBelowFloor = (posZ_mm <= 15.0);

    if (isInsideDeadzone || isBelowFloor) {
      if (typeof logMsg === 'function') {
        logMsg('GIZMO', isInsideDeadzone 
          ? `⚠️ Ziel liegt im inneren Singularitäts-/Kollisionsbereich (r=${Math.round(r_xy)} mm < 125 mm). Auto-Fahrt blockiert!`
          : `⚠️ Ziel liegt in der Tischplatte (Z=${posZ_mm} mm). Auto-Fahrt blockiert!`, 'err');
      }
      return;
    }

    const realTCP = getRealRobotTCPPose();
    let deltaDist_mm = realTCP ? (gizmoTarget.position.distanceTo(realTCP.position) * 1000.0) : 999;

    // Trigger auto-move if offset is greater than 3 mm or orientation adjusted
    if (shouldAutoExecute && deltaDist_mm > 3.0) {
      if (typeof window.executeMoveToPoseFromGizmo === 'function') {
        window.executeMoveToPoseFromGizmo();
      }
    }
  }

  function updateConnectingLine() {
    if (!dashedLine || !gizmoTarget || !isGizmoActive) {
      if (dashedLine) dashedLine.visible = false;
      return;
    }
    const realTCP = getRealRobotTCPPose();
    if (!realTCP || !hasUserTargetOffset) {
      dashedLine.visible = false;
      return;
    }

    const dist = gizmoTarget.position.distanceTo(realTCP.position);
    if (dist > 0.003) {
      dashedLine.visible = true;
      const positions = dashedLine.geometry.attributes.position.array;
      positions[0] = realTCP.position.x;
      positions[1] = realTCP.position.y;
      positions[2] = realTCP.position.z;
      positions[3] = gizmoTarget.position.x;
      positions[4] = gizmoTarget.position.y;
      positions[5] = gizmoTarget.position.z;
      dashedLine.geometry.attributes.position.needsUpdate = true;
      dashedLine.computeLineDistances();
    } else {
      dashedLine.visible = false;
    }
  }

  function updateGizmoVisibility() {
    if (!transformControls) return;
    transformControls.visible = isGizmoActive;
    transformControls.enabled = isGizmoActive;
    if (ghostTCPGroup) ghostTCPGroup.visible = isGizmoActive;
    if (dashedLine) dashedLine.visible = isGizmoActive && hasUserTargetOffset;

    const btnGizmo = document.getElementById('btn-twin-gizmo');
    if (btnGizmo) {
      btnGizmo.style.color = isGizmoActive ? 'var(--cyan)' : 'var(--mut)';
      btnGizmo.classList.toggle('active', isGizmoActive);
    }

    const hud = document.getElementById('twin-gizmo-hud');
    if (hud) {
      if (isGizmoActive) hud.classList.remove('gizmo-hud-hidden');
      else hud.classList.add('gizmo-hud-hidden');
    }
  }

  // ── Public Global API ───────────────────────────────────────────────────────
  window.updateDigitalTwinSafety = function (state) {
    if (!state) return;
    safetyState.collision = Boolean(state.collision);
    safetyState.singularity = Boolean(state.singularity);
    safetyState.message = state.message || '';
    safetyState.collidingLinks = Array.isArray(state.collidingLinks) ? state.collidingLinks : [];
    safetyState.singularityJoints = Array.isArray(state.singularityJoints) ? state.singularityJoints : [];
    if (typeof state.manipPct === 'number') safetyState.manipPct = state.manipPct;
    if (state.floorClearanceZ !== undefined) safetyState.floorClearanceZ = state.floorClearanceZ;

    // 1. Update Warning Banner DOM in Viewport
    const banner = document.getElementById('twin-warning-banner');
    const bannerText = document.getElementById('twin-warning-text');
    const bannerIcon = document.getElementById('twin-warning-icon');
    const container = document.getElementById('digital-twin-container');

    if (banner && bannerText && bannerIcon) {
      if (safetyState.collision) {
        banner.className = 'twin-hud-banner banner-collision';
        bannerIcon.className = 'fa-solid fa-triangle-exclamation';
        bannerText.innerText = safetyState.message || 'COLLISION DETECTED';
        if (container) {
          container.classList.add('vignette-collision');
          container.classList.remove('vignette-singularity');
        }
      } else if (safetyState.singularity) {
        banner.className = 'twin-hud-banner banner-singularity';
        bannerIcon.className = 'fa-solid fa-bolt';
        bannerText.innerText = safetyState.message || 'SINGULARITY WARNING';
        if (container) {
          container.classList.add('vignette-singularity');
          container.classList.remove('vignette-collision');
        }
      } else {
        banner.className = 'twin-hud-banner banner-hidden';
        if (container) {
          container.classList.remove('vignette-collision', 'vignette-singularity');
        }
      }
    }

    // 2. Update Mini HUD Telemetry (Manipulability & Floor Clearance)
    const manipBar = document.getElementById('hud-manip-bar');
    const manipVal = document.getElementById('hud-manip-val');
    if (manipBar && manipVal) {
      const pct = Math.max(0, Math.min(100, Math.round(safetyState.manipPct)));
      manipBar.style.width = pct + '%';
      manipVal.innerText = pct + '%';
      if (pct > 50) {
        manipBar.style.backgroundColor = '#10b981';
        manipVal.style.color = '#38bdf8';
      } else if (pct > 20) {
        manipBar.style.backgroundColor = '#f59e0b';
        manipVal.style.color = '#f59e0b';
      } else {
        manipBar.style.backgroundColor = '#ef4444';
        manipVal.style.color = '#ef4444';
      }
    }

    const floorVal = document.getElementById('hud-floor-val');
    if (floorVal) {
      if (safetyState.floorClearanceZ !== null && !isNaN(safetyState.floorClearanceZ)) {
        const fz = safetyState.floorClearanceZ;
        floorVal.innerText = fz.toFixed(0) + ' mm';
        if (fz <= 15.0) {
          floorVal.style.color = '#ef4444';
        } else if (fz < 35.0) {
          floorVal.style.color = '#f59e0b';
        } else {
          floorVal.style.color = '#38bdf8';
        }
      } else {
        floorVal.innerText = '-- mm';
        floorVal.style.color = 'var(--mut)';
      }
    }
  };

  // Interactive Test & Demo Cycle
  let demoSafetyStep = 0;
  window.testDigitalTwinSafetyCycle = function () {
    demoSafetyStep = (demoSafetyStep + 1) % 4;
    const testBtn = document.getElementById('btn-twin-safety-test');
    if (demoSafetyStep === 1) {
      // 1. Singularity Warning: Wrist J5 alignment
      window.updateDigitalTwinSafety({
        collision: false,
        singularity: true,
        message: 'WRIST SINGULARITY (J5 = 1.8° ≈ 0°)',
        singularityJoints: ['link5', 'link4'],
        manipPct: 6,
        floorClearanceZ: 145
      });
      if (testBtn) testBtn.style.color = '#f59e0b';
      if (typeof logMsg === 'function') logMsg('Motion', '⚡ [DEMO] Singularity Warning active: Wrist alignment (J5 ≈ 0°)', 'warn');
    } else if (demoSafetyStep === 2) {
      // 2. Table / Plane Collision
      window.updateDigitalTwinSafety({
        collision: true,
        singularity: false,
        message: 'PLANE COLLISION (Z: 89.2 mm ≤ 91 mm)',
        collidingLinks: ['link6', 'vacuum', 'gripper'],
        manipPct: 84,
        floorClearanceZ: 89.2
      });
      if (testBtn) testBtn.style.color = '#ef4444';
      if (typeof logMsg === 'function') logMsg('Motion', '⚠ [DEMO] Collision Warning active: Ground limit exceeded (Z ≤ 91mm)', 'err');
    } else if (demoSafetyStep === 3) {
      // 3. MoveIt 3D Obstacle Collision
      window.updateDigitalTwinSafety({
        collision: true,
        singularity: false,
        message: 'MOVEIT COLLISION (link5 with obstacle)',
        collidingLinks: ['link5', 'link6'],
        manipPct: 45,
        floorClearanceZ: 180
      });
      if (testBtn) testBtn.style.color = '#ef4444';
      if (typeof logMsg === 'function') logMsg('Motion', '⚠ [DEMO] MoveIt 3D Obstacle Collision halt', 'err');
    } else {
      // 0. Nominal / Cleared
      window.updateDigitalTwinSafety({
        collision: false,
        singularity: false,
        message: '',
        manipPct: 100,
        floorClearanceZ: 185
      });
      if (testBtn) testBtn.style.color = 'var(--mut)';
      if (typeof logMsg === 'function') logMsg('Motion', '✓ [DEMO] Safety state cleared. Normal operation.', 'success');
    }
  };
  window.updateDigitalTwinJoints = function (jointVals, axisY) {
    if (Array.isArray(jointVals)) {
      for (let i = 0; i < Math.min(jointVals.length, 6); i++) {
        currentJoints[i] = Number(jointVals[i]) || 0;
      }
    }
    if (typeof axisY === 'number') {
      linearShiftY = axisY;
    }
    applyJointValues();
  };

  window.resetDigitalTwinView = function () {
    if (!camera || !controls) return;
    controls.target.set(DEFAULT_TARGET.x, DEFAULT_TARGET.y, DEFAULT_TARGET.z);
    camera.position.set(DEFAULT_CAM_POS.x, DEFAULT_CAM_POS.y, DEFAULT_CAM_POS.z);
    controls.update();
  };

  window.setDigitalTwinTopView = function () {
    if (!camera || !controls) return;
    controls.target.set(0, 0, 0.20);
    camera.position.set(0.001, 0, 1.15);
    controls.update();
  };

  window.toggleDigitalTwinGrid = function () {
    isGridVisible = !isGridVisible;
    if (gridHelper) gridHelper.visible = isGridVisible;
    if (axesHelper) axesHelper.visible = isGridVisible;
    if (shadowPlane) shadowPlane.visible = isGridVisible;
    const btn = document.getElementById('btn-twin-grid');
    if (btn) {
      btn.style.color = isGridVisible ? 'var(--cyan)' : 'var(--mut)';
    }
  };

  window.toggleDigitalTwinEdges = function () {
    isEdgesVisible = !isEdgesVisible;
    edgeLines.forEach((l) => {
      if (l) l.visible = isEdgesVisible;
    });
    const btn = document.getElementById('btn-twin-edges');
    if (btn) {
      btn.style.color = isEdgesVisible ? 'var(--cyan)' : 'var(--mut)';
    }
  };

  window.resizeDigitalTwin = function () {
    handleResize();
  };

  // ── Public TCP Gizmo APIs ──
  window.toggleTCPGizmo = function (forceState) {
    if (typeof forceState === 'boolean') isGizmoActive = forceState;
    else isGizmoActive = !isGizmoActive;
    updateGizmoVisibility();
    if (isGizmoActive && !hasUserTargetOffset) {
      syncTCPGizmoToRobot(false);
    }
  };

  window.cycleTCPGizmoMode = function () {
    if (gizmoMode === 'translate') {
      window.setTCPGizmoMode('rotate');
    } else {
      window.setTCPGizmoMode('translate');
    }
  };

  window.setTCPGizmoMode = function (mode) {
    if (mode !== 'translate' && mode !== 'rotate') return;
    gizmoMode = mode;
    if (transformControls) transformControls.setMode(gizmoMode);

    const btnMode = document.getElementById('btn-twin-gizmo-mode');
    if (btnMode) {
      if (gizmoMode === 'translate') {
        btnMode.innerHTML = '<i class="fa-solid fa-arrows-up-down-left-right"></i>';
        btnMode.title = 'Modus: Translation (X, Y, Z Pfeile) aktiv [Tasten: T / R]';
      } else {
        btnMode.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        btnMode.title = 'Modus: Rotation (Roll, Pitch, Yaw Ringe) aktiv [Tasten: T / R]';
      }
    }
  };

  window.syncTCPGizmoToRobot = function () {
    hasUserTargetOffset = false;
    syncTCPGizmoToRobot(true);
    if (typeof logMsg === 'function') {
      logMsg('GIZMO', '🎯 Gizmo auf aktuellen Roboter-TCP synchronisiert.', 'info');
    }
  };

  window.getTCPGizmoPose = function () {
    if (!gizmoTarget) return null;
    const posX_mm = Math.round(gizmoTarget.position.x * 1000.0);
    const posY_mm = Math.round((gizmoTarget.position.y - linearShiftY) * 1000.0);
    const posZ_mm = Math.round(gizmoTarget.position.z * 1000.0);
    const euler = new THREE.Euler().setFromQuaternion(gizmoTarget.quaternion, 'XYZ');
    return {
      x: posX_mm,
      y: posY_mm,
      z: posZ_mm,
      roll: Number(euler.x.toFixed(2)),
      pitch: Number(euler.y.toFixed(2)),
      yaw: Number(euler.z.toFixed(2))
    };
  };

  window.resetGizmoTargetOffset = function () {
    hasUserTargetOffset = false;
    syncTCPGizmoToRobot(false);
  };

  // ── 3D Scene Objects for TF Control Tuner ────────────────────────────────
  let tunerSceneObjects = {};

  function initTunerSceneObjects() {
    if (!scene || Object.keys(tunerSceneObjects).length > 0) return;

    // 1. Blue Cube (30mm x 30mm x 30mm)
    const blueGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.2, roughness: 0.3 });
    const blueMesh = new THREE.Mesh(blueGeo, blueMat);
    blueMesh.castShadow = true;
    blueMesh.receiveShadow = true;
    scene.add(blueMesh);
    tunerSceneObjects['Blue Cube'] = blueMesh;

    // 2. Red Rectangle (60mm x 30mm x 30mm)
    const redGeo = new THREE.BoxGeometry(0.06, 0.03, 0.03);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.2, roughness: 0.3 });
    const redMesh = new THREE.Mesh(redGeo, redMat);
    redMesh.castShadow = true;
    redMesh.receiveShadow = true;
    scene.add(redMesh);
    tunerSceneObjects['Red Rectangle'] = redMesh;

    // 3. Green Cylinder (diameter: 30mm, height: 30mm)
    const greenGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 24);
    greenGeo.rotateX(Math.PI / 2); // ROS Z is UP
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.2, roughness: 0.3 });
    const greenMesh = new THREE.Mesh(greenGeo, greenMat);
    greenMesh.castShadow = true;
    greenMesh.receiveShadow = true;
    scene.add(greenMesh);
    tunerSceneObjects['Green Cylinder'] = greenMesh;

    // 4. White Plane (210mm x 300mm x 2mm)
    const planeGeo = new THREE.BoxGeometry(0.21, 0.30, 0.002);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.85, roughness: 0.6 });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);
    tunerSceneObjects['White Plane'] = planeMesh;

    // 5. Safety Zone (Ring on ground)
    const safetyGeo = new THREE.RingGeometry(0.197, 0.203, 48);
    const safetyMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const safetyMesh = new THREE.Mesh(safetyGeo, safetyMat);
    safetyMesh.position.z = 0.0005;
    scene.add(safetyMesh);
    tunerSceneObjects['Safety Zone'] = safetyMesh;

    // 6. Zed M Camera
    const camGroup = new THREE.Group();
    const camBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.124, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
    );
    camBody.castShadow = true;
    camGroup.add(camBody);
    const camAxes = new THREE.AxesHelper(0.06);
    camGroup.add(camAxes);
    scene.add(camGroup);
    tunerSceneObjects['Zed M Camera'] = camGroup;
  }

  window.updateTunerSceneObjects = function (elements) {
    if (!elements || !scene) return;
    if (Object.keys(tunerSceneObjects).length === 0) {
      initTunerSceneObjects();
    }

    for (const [name, data] of Object.entries(elements)) {
      const obj = tunerSceneObjects[name];
      if (!obj) continue;

      obj.position.set(Number(data.x), Number(data.y), Number(data.z));

      // Euler (deg) to Quaternion
      const rollRad = (Number(data.roll) * Math.PI) / 180.0;
      const pitchRad = (Number(data.pitch) * Math.PI) / 180.0;
      const yawRad = (Number(data.yaw) * Math.PI) / 180.0;

      const cy = Math.cos(yawRad * 0.5);
      const sy = Math.sin(yawRad * 0.5);
      const cp = Math.cos(pitchRad * 0.5);
      const sp = Math.sin(pitchRad * 0.5);
      const cr = Math.cos(rollRad * 0.5);
      const sr = Math.sin(rollRad * 0.5);

      const qw = cr * cp * cy + sr * sp * sy;
      const qx = sr * cp * cy - cr * sp * sy;
      const qy = cr * sp * cy + sr * cp * sy;
      const qz = cr * cp * sy - sr * sp * cy;

      obj.quaternion.set(qx, qy, qz, qw);

      if (name === 'Safety Zone' && data.radius) {
        const scale = Number(data.radius) / 0.200;
        obj.scale.set(scale, scale, 1);
      }
    }
  };

  window.toggleDigitalTwinSection = function () {
    const content = document.getElementById('digital-twin-content');
    const icon = document.getElementById('btn-twin-collapse-icon');
    if (!content) return;

    if (content.style.display === 'none') {
      content.style.display = 'block';
      if (icon) icon.className = 'fa-solid fa-chevron-up';
      setTimeout(handleResize, 50);
    } else {
      content.style.display = 'none';
      if (icon) icon.className = 'fa-solid fa-chevron-down';
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDigitalTwin);
  } else {
    setTimeout(initDigitalTwin, 100);
  }
})();
