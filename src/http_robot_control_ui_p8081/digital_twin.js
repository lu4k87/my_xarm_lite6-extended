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

  // Zwei verschiedene Dinge, die nicht verwechselt werden duerfen:
  //
  // 1) Gizmo-Deadzone: blockiert Auto-Move, wenn das Ziel zu nah an der Base
  //    UND zu tief liegt (r < 125 mm && z < 280 mm). Reine UI-Pruefung.
  const DEADZONE_RADIUS_MM = 125.0;
  const CAUTION_RADIUS_MM = 140.0;
  //
  // 2) Safety Zone: der Bereich, den robot_motion_handler_movegroup.py aktiv
  //    durchsetzt - liegt der TCP darin, wird er herausgeschoben
  //    ("if r_base < self.safe_radius: scale = self.safe_radius / r_base").
  //    Dort ist safe_radius = 0.20, also ist 200 mm der massgebliche Wert.
  //    Ueber /ui/safety_zone_params zur Laufzeit aenderbar.
  const SAFETY_ZONE_RADIUS_M = 0.20;
  let hasUserTargetOffset = false;

  // ── Viewport Navigation Gizmo State (Blender-style axis ball widget) ──
  let navCanvas = null;
  let navCtx = null;
  let navHoverAxis = -1;
  let navPressAxis = -1;
  let navPointerId = null;
  let navIsOrbiting = false;
  let navDownX = 0;
  let navDownY = 0;
  let navLastX = 0;
  let navLastY = 0;
  let navSnap = null; // { from, to, t0, dur } while an axis snap animates

  const NAV_ORBIT_SPEED = 0.011;   // radians per dragged pixel
  const NAV_ZOOM_STEP = 0.9;       // wheel dolly factor per notch
  const NAV_CLICK_SLOP = 4;        // px of movement still counted as a click
  const NAV_UP_Y = new THREE.Vector3(0, 1, 0);

  // ROS frame convention: X forward (red), Y left (green), Z up (blue)
  const NAV_AXES = [
    { label: 'X', rgb: '239, 68, 68',  positive: true,  dir: new THREE.Vector3(1, 0, 0) },
    { label: 'Y', rgb: '16, 185, 129', positive: true,  dir: new THREE.Vector3(0, 1, 0) },
    { label: 'Z', rgb: '56, 189, 248', positive: true,  dir: new THREE.Vector3(0, 0, 1) },
    { label: 'X', rgb: '239, 68, 68',  positive: false, dir: new THREE.Vector3(-1, 0, 0) },
    { label: 'Y', rgb: '16, 185, 129', positive: false, dir: new THREE.Vector3(0, -1, 0) },
    { label: 'Z', rgb: '56, 189, 248', positive: false, dir: new THREE.Vector3(0, 0, -1) }
  ];

  const navTmpQuat = new THREE.Quaternion();
  const navTmpVec = new THREE.Vector3();

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

    // 8. Viewport Navigation Gizmo (Blender-style axis ball widget)
    initNavGizmo();

    // 9. Load URDF
    loadURDFModel();

    // 10. Animation Loop
    function animate() {
      animId = requestAnimationFrame(animate);
      updateNavGizmo();
      if (controls) controls.update();
      updateSafetyVisuals();
      updateConnectingLine();
      renderer.render(scene, camera);
    }
    animate();

    // 11. Resize Observer
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
      // Keep the nav gizmo from ever squeezing the other viewport HUDs
      const hudHost = container.closest('.viewport-container');
      if (hudHost) {
        hudHost.classList.toggle('twin-viewport-short', h < 430);
        hudHost.classList.toggle('twin-viewport-tiny', h < 340);
      }
    }
  }


  /* ──────────────────────────────────────────────────────────────────────────
     Viewport Navigation Gizmo (Blender-style)
     Small canvas widget in the top-left corner of the 3D viewport:
       • drag anywhere on it      → orbit the camera around the current pivot
       • click an axis ball       → animated snap to that axis view
       • mouse wheel              → dolly in / out
     Purely 2D-projected from the live camera orientation, so it stays in sync
     with OrbitControls and the TCP gizmo without touching the WebGL scene.
     ────────────────────────────────────────────────────────────────────────── */

  function initNavGizmo() {
    navCanvas = document.getElementById('twin-nav-gizmo');
    if (!navCanvas) return;

    navCtx = navCanvas.getContext('2d');
    if (!navCtx) {
      navCanvas = null;
      return;
    }

    navCanvas.addEventListener('pointerdown', onNavPointerDown);
    navCanvas.addEventListener('pointermove', onNavPointerMove);
    navCanvas.addEventListener('pointerup', onNavPointerUp);
    navCanvas.addEventListener('pointercancel', onNavPointerUp);
    navCanvas.addEventListener('pointerleave', onNavPointerLeave);
    navCanvas.addEventListener('wheel', onNavWheel, { passive: false });
    navCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // A drag inside the 3D view takes over: drop any running snap animation
    if (controls) controls.addEventListener('start', () => { navSnap = null; });
  }

  // Projects the six world axes into the gizmo's 2D disc (camera space).
  function computeNavAxisPoints(size) {
    const center = size / 2;
    const radius = size * 0.335;
    navTmpQuat.copy(camera.quaternion).invert();

    return NAV_AXES.map((axis, index) => {
      navTmpVec.copy(axis.dir).applyQuaternion(navTmpQuat);
      return {
        index: index,
        axis: axis,
        x: center + navTmpVec.x * radius,
        y: center - navTmpVec.y * radius,
        depth: navTmpVec.z // camera looks down -Z: bigger means closer to the viewer
      };
    });
  }

  function navBallRadius(size) {
    return size * 0.105;
  }

  function navHitTest(px, py, size) {
    const points = computeNavAxisPoints(size);
    const grab = navBallRadius(size) * 1.25;
    let hit = -1;
    let hitDepth = -Infinity;

    for (const point of points) {
      const dx = px - point.x;
      const dy = py - point.y;
      if (dx * dx + dy * dy <= grab * grab && point.depth > hitDepth) {
        hit = point.index;
        hitDepth = point.depth;
      }
    }
    return hit;
  }

  function drawNavGizmo() {
    if (!navCanvas || !navCtx || !camera) return;

    const size = navCanvas.clientWidth;
    if (!size) return; // hidden (short viewport) — nothing to draw

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const backing = Math.round(size * dpr);
    if (navCanvas.width !== backing || navCanvas.height !== backing) {
      navCanvas.width = backing;
      navCanvas.height = backing;
    }

    const ctx = navCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    const ballR = navBallRadius(size);
    const points = computeNavAxisPoints(size).sort((a, b) => a.depth - b.depth);

    ctx.lineCap = 'round';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(size * 0.135)}px 'JetBrains Mono', monospace`;

    for (const point of points) {
      const axis = point.axis;
      const hovered = (point.index === navHoverAxis);
      // Balls pointing away from the viewer fade out slightly (depth cue)
      const fade = 0.45 + 0.55 * ((point.depth + 1) / 2);

      if (axis.positive) {
        ctx.strokeStyle = `rgba(${axis.rgb}, ${(0.85 * fade).toFixed(3)})`;
        ctx.lineWidth = Math.max(1.5, size * 0.023);
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(point.x, point.y, ballR, 0, Math.PI * 2);
      if (axis.positive || hovered) {
        ctx.fillStyle = `rgba(${axis.rgb}, ${Math.min(1, 0.55 + 0.45 * fade).toFixed(3)})`;
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
        ctx.fill();
        ctx.strokeStyle = `rgba(${axis.rgb}, ${(0.8 * fade).toFixed(3)})`;
        ctx.lineWidth = Math.max(1.2, size * 0.017);
        ctx.stroke();
      }

      if (hovered) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = Math.max(1.2, size * 0.018);
        ctx.beginPath();
        ctx.arc(point.x, point.y, ballR + ctx.lineWidth, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Positive axes are always labelled, negative ones only while hovered
      if (axis.positive || hovered) {
        ctx.fillStyle = '#0a0e17';
        ctx.fillText(axis.label, point.x, point.y + size * 0.005);
      }
    }
  }

  // Clamps an orbit offset to the OrbitControls polar/distance limits so a
  // snap always lands exactly where the camera is allowed to stay.
  function clampNavOffset(offset) {
    const upQuat = new THREE.Quaternion().setFromUnitVectors(camera.up, NAV_UP_Y);
    offset.applyQuaternion(upQuat);

    const spherical = new THREE.Spherical().setFromVector3(offset);
    const minPhi = Math.max(1e-4, controls ? controls.minPolarAngle : 0);
    const maxPhi = Math.min(Math.PI - 1e-4, controls ? controls.maxPolarAngle : Math.PI);
    spherical.phi = Math.min(maxPhi, Math.max(minPhi, spherical.phi));
    if (controls) {
      spherical.radius = Math.min(controls.maxDistance, Math.max(controls.minDistance, spherical.radius));
    }
    spherical.makeSafe();

    offset.setFromSpherical(spherical).applyQuaternion(upQuat.invert());
    return offset;
  }

  function orbitNavGizmo(dxPx, dyPx) {
    if (!camera || !controls) return;

    const offset = camera.position.clone().sub(controls.target);
    const upQuat = new THREE.Quaternion().setFromUnitVectors(camera.up, NAV_UP_Y);
    offset.applyQuaternion(upQuat);

    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta -= dxPx * NAV_ORBIT_SPEED;
    spherical.phi -= dyPx * NAV_ORBIT_SPEED;
    const minPhi = Math.max(1e-4, controls.minPolarAngle);
    const maxPhi = Math.min(Math.PI - 1e-4, controls.maxPolarAngle);
    spherical.phi = Math.min(maxPhi, Math.max(minPhi, spherical.phi));
    spherical.makeSafe();

    offset.setFromSpherical(spherical).applyQuaternion(upQuat.invert());
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
  }

  function snapNavViewToAxis(index) {
    if (!camera || !controls || !NAV_AXES[index]) return;

    const distance = camera.position.distanceTo(controls.target) || 1.0;
    const dir = NAV_AXES[index].dir.clone();
    // Pure top/bottom views are degenerate with a Z-up camera: nudge them
    if (Math.abs(dir.z) > 0.99) dir.x += 0.0015;

    const offset = clampNavOffset(dir.normalize().multiplyScalar(distance));
    navSnap = {
      from: camera.position.clone(),
      to: controls.target.clone().add(offset),
      t0: performance.now(),
      dur: 420
    };
  }

  function onNavPointerDown(e) {
    if (!camera || !controls) return;
    e.preventDefault();

    const rect = navCanvas.getBoundingClientRect();
    navPressAxis = navHitTest(e.clientX - rect.left, e.clientY - rect.top, rect.width);
    navPointerId = e.pointerId;
    navIsOrbiting = false;
    navDownX = navLastX = e.clientX;
    navDownY = navLastY = e.clientY;
    navSnap = null;

    if (navCanvas.setPointerCapture) navCanvas.setPointerCapture(e.pointerId);
  }

  function onNavPointerMove(e) {
    if (!navCanvas) return;
    const rect = navCanvas.getBoundingClientRect();

    if (navPointerId === null) {
      const hover = navHitTest(e.clientX - rect.left, e.clientY - rect.top, rect.width);
      if (hover !== navHoverAxis) {
        navHoverAxis = hover;
        navCanvas.style.cursor = (hover >= 0) ? 'pointer' : 'grab';
      }
      return;
    }

    if (navPointerId !== e.pointerId) return;
    e.preventDefault();

    if (!navIsOrbiting) {
      const movedX = Math.abs(e.clientX - navDownX);
      const movedY = Math.abs(e.clientY - navDownY);
      if (movedX > NAV_CLICK_SLOP || movedY > NAV_CLICK_SLOP) {
        navIsOrbiting = true;
        navHoverAxis = -1;
        navCanvas.style.cursor = 'grabbing';
      }
    }

    if (navIsOrbiting) {
      orbitNavGizmo(e.clientX - navLastX, e.clientY - navLastY);
      navLastX = e.clientX;
      navLastY = e.clientY;
    }
  }

  function onNavPointerUp(e) {
    if (navPointerId === null || (e && e.pointerId !== navPointerId)) return;

    if (!navIsOrbiting && navPressAxis >= 0) {
      snapNavViewToAxis(navPressAxis);
    }

    if (navCanvas) {
      if (navCanvas.releasePointerCapture && navCanvas.hasPointerCapture && navCanvas.hasPointerCapture(navPointerId)) {
        navCanvas.releasePointerCapture(navPointerId);
      }
      navCanvas.style.cursor = 'grab';
    }
    navPointerId = null;
    navPressAxis = -1;
    navIsOrbiting = false;
  }

  function onNavPointerLeave() {
    if (navPointerId !== null) return; // keep the highlight while dragging
    if (navHoverAxis !== -1) {
      navHoverAxis = -1;
      if (navCanvas) navCanvas.style.cursor = 'grab';
    }
  }

  function onNavWheel(e) {
    e.preventDefault();
    if (!camera || !controls) return;

    navSnap = null;
    const offset = camera.position.clone().sub(controls.target);
    const factor = (e.deltaY > 0) ? (1 / NAV_ZOOM_STEP) : NAV_ZOOM_STEP;
    const length = Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor));
    camera.position.copy(controls.target).add(offset.setLength(length));
    controls.update();
  }

  function updateNavGizmo() {
    if (!navCanvas) return;

    if (navSnap && camera && controls) {
      const t = Math.min(1, (performance.now() - navSnap.t0) / navSnap.dur);
      const eased = (t < 0.5) ? (4 * t * t * t) : (1 - Math.pow(-2 * t + 2, 3) / 2);
      camera.position.lerpVectors(navSnap.from, navSnap.to, eased);
      camera.lookAt(controls.target);
      controls.update();
      if (t >= 1) navSnap = null;
    }

    drawNavGizmo();
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
      transformControls.size = 1.0;
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
    const isInsideDeadzone = (r_xy < DEADZONE_RADIUS_MM && posZ_mm < 280.0);
    const isBelowFloor = (posZ_mm <= 15.0);

    // Update floating HUD in viewport
    const hudCoords = document.getElementById('gizmo-hud-coords');
    const hudDelta = document.getElementById('gizmo-hud-delta');
    const btnExecute = /** @type {HTMLButtonElement|null} */ (document.getElementById('btn-gizmo-execute'));
    if (hudCoords) {
      // Nur die Zahlen schreiben - die farbigen Achsen-Label (X/Y/Z) bleiben
      // als eigene Spans stehen. innerText wuerde sie ueberschreiben.
      const hudX = document.getElementById('gizmo-hud-x');
      const hudY = document.getElementById('gizmo-hud-y');
      const hudZ = document.getElementById('gizmo-hud-z');
      if (hudX) hudX.textContent = String(posX_mm);
      if (hudY) hudY.textContent = String(posY_mm);
      if (hudZ) hudZ.textContent = String(posZ_mm);
      // coords-alert laesst auch die farbigen Achsen-Label die Warnfarbe
      // uebernehmen, sonst bliebe die Warnung nur auf den Zahlen sichtbar.
      if (isInsideDeadzone || isBelowFloor) {
        hudCoords.style.color = '#ef4444';
        hudCoords.classList.add('coords-alert');
      } else if (r_xy < CAUTION_RADIUS_MM || posZ_mm < 35.0) {
        hudCoords.style.color = '#f59e0b';
        hudCoords.classList.add('coords-alert');
      } else {
        hudCoords.style.color = 'inherit';
        hudCoords.classList.remove('coords-alert');
      }
    }
    if (hudDelta) {
      if (isInsideDeadzone) {
        hudDelta.innerText = `⚠️ R: ${Math.round(r_xy)} < ${DEADZONE_RADIUS_MM} mm`;
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

    const autoDrop = /** @type {HTMLInputElement|null} */ (document.getElementById('chk-gizmo-auto-drop'));
    const shouldAutoExecute = autoDrop ? Boolean(autoDrop.checked) : true;

    const posX_mm = Math.round(gizmoTarget.position.x * 1000.0);
    const posY_mm = Math.round((gizmoTarget.position.y - linearShiftY) * 1000.0);
    const posZ_mm = Math.round(gizmoTarget.position.z * 1000.0);
    const r_xy = Math.sqrt(posX_mm * posX_mm + posY_mm * posY_mm);
    const isInsideDeadzone = (r_xy < DEADZONE_RADIUS_MM && posZ_mm < 280.0);
    const isBelowFloor = (posZ_mm <= 15.0);

    if (isInsideDeadzone || isBelowFloor) {
      if (typeof window.logMsg === 'function') {
        window.logMsg('GIZMO', isInsideDeadzone 
          ? `⚠️ Target lies inside the inner singularity / collision zone (r=${Math.round(r_xy)} mm < ${DEADZONE_RADIUS_MM} mm). Auto-move blocked!`
          : `⚠️ Target lies inside the table surface (Z=${posZ_mm} mm). Auto-move blocked!`, 'err');
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
    const twinContainer = document.getElementById('digital-twin-container');

    if (banner && bannerText && bannerIcon) {
      if (safetyState.collision) {
        banner.className = 'twin-hud-banner banner-collision';
        bannerIcon.className = 'fa-solid fa-triangle-exclamation';
        bannerText.innerText = safetyState.message || 'COLLISION DETECTED';
        if (twinContainer) {
          twinContainer.classList.add('vignette-collision');
          twinContainer.classList.remove('vignette-singularity');
        }
      } else if (safetyState.singularity) {
        banner.className = 'twin-hud-banner banner-singularity';
        bannerIcon.className = 'fa-solid fa-bolt';
        bannerText.innerText = safetyState.message || 'SINGULARITY WARNING';
        if (twinContainer) {
          twinContainer.classList.add('vignette-singularity');
          twinContainer.classList.remove('vignette-collision');
        }
      } else {
        banner.className = 'twin-hud-banner banner-hidden';
        if (twinContainer) {
          twinContainer.classList.remove('vignette-collision', 'vignette-singularity');
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
        floorVal.innerText = Number(fz).toFixed(0) + ' mm';
        if (Number(fz) <= 15.0) {
          floorVal.style.color = '#ef4444';
        } else if (Number(fz) < 35.0) {
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
      if (typeof window.logMsg === 'function') window.logMsg('Motion', '⚡ [DEMO] Singularity Warning active: Wrist alignment (J5 ≈ 0°)', 'warn');
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
      if (typeof window.logMsg === 'function') window.logMsg('Motion', '⚠ [DEMO] Collision Warning active: Ground limit exceeded (Z ≤ 91mm)', 'err');
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
      if (typeof window.logMsg === 'function') window.logMsg('Motion', '⚠ [DEMO] MoveIt 3D Obstacle Collision halt', 'err');
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
      if (typeof window.logMsg === 'function') window.logMsg('Motion', '✓ [DEMO] Safety state cleared. Normal operation.', 'success');
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
    navSnap = null;
    controls.target.set(DEFAULT_TARGET.x, DEFAULT_TARGET.y, DEFAULT_TARGET.z);
    camera.position.set(DEFAULT_CAM_POS.x, DEFAULT_CAM_POS.y, DEFAULT_CAM_POS.z);
    controls.update();
  };

  window.setDigitalTwinTopView = function () {
    if (!camera || !controls) return;
    navSnap = null;
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
        btnMode.title = 'Mode: Translation (X, Y, Z arrows) active [Keys: T / R]';
      } else {
        btnMode.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        btnMode.title = 'Mode: Rotation (Roll, Pitch, Yaw rings) active [Keys: T / R]';
      }
    }
  };

  window.syncTCPGizmoToRobot = function () {
    hasUserTargetOffset = false;
    syncTCPGizmoToRobot(true);
    if (typeof window.logMsg === 'function') {
      window.logMsg('GIZMO', '🎯 Gizmo synchronized to current robot TCP.', 'info');
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
  let areTunerSceneObjectsVisible = false;

  function initTunerSceneObjects() {
    if (!scene || Object.keys(tunerSceneObjects).length > 0) return;

    // 1. Blue Cube (30mm x 30mm x 30mm)
    const blueGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.2, roughness: 0.3 });
    const blueMesh = new THREE.Mesh(blueGeo, blueMat);
    blueMesh.castShadow = true;
    blueMesh.receiveShadow = true;
    blueMesh.visible = areTunerSceneObjectsVisible;
    scene.add(blueMesh);
    tunerSceneObjects['Blue Cube'] = blueMesh;

    // 2. Red Rectangle (60mm x 30mm x 30mm)
    const redGeo = new THREE.BoxGeometry(0.06, 0.03, 0.03);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.2, roughness: 0.3 });
    const redMesh = new THREE.Mesh(redGeo, redMat);
    redMesh.castShadow = true;
    redMesh.receiveShadow = true;
    redMesh.visible = areTunerSceneObjectsVisible;
    scene.add(redMesh);
    tunerSceneObjects['Red Rectangle'] = redMesh;

    // 3. Green Cylinder (diameter: 30mm, height: 30mm)
    const greenGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 24);
    greenGeo.rotateX(Math.PI / 2); // ROS Z is UP
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.2, roughness: 0.3 });
    const greenMesh = new THREE.Mesh(greenGeo, greenMat);
    greenMesh.castShadow = true;
    greenMesh.receiveShadow = true;
    greenMesh.visible = areTunerSceneObjectsVisible;
    scene.add(greenMesh);
    tunerSceneObjects['Green Cylinder'] = greenMesh;

    // 4. White Plane (210mm x 300mm x 2mm)
    const planeGeo = new THREE.BoxGeometry(0.21, 0.30, 0.002);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.85, roughness: 0.6 });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.receiveShadow = true;
    planeMesh.visible = areTunerSceneObjectsVisible;
    scene.add(planeMesh);
    tunerSceneObjects['White Plane'] = planeMesh;

    // 5. Safety Zone (gefuellte Flaeche am Boden)
    // Markiert den Bereich um die Base, den der Motion-Handler durchsetzt.
    // Gefuellte Scheibe statt Ring, damit die Flaeche als Sperrgebiet lesbar
    // ist. depthWrite aus, sonst flimmert sie gegen die Bodenebene.
    const safetyGeo = new THREE.CircleGeometry(SAFETY_ZONE_RADIUS_M, 64);
    const safetyMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const safetyMesh = new THREE.Mesh(safetyGeo, safetyMat);
    safetyMesh.position.z = 0.0005;
    safetyMesh.visible = areTunerSceneObjectsVisible;
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
    camGroup.visible = areTunerSceneObjectsVisible;
    scene.add(camGroup);
    tunerSceneObjects['Zed M Camera'] = camGroup;
  }

  // Mapping: node group key -> WebGL object names
  const sceneNodeGroups = {
    objects: ['Blue Cube', 'Red Rectangle', 'Green Cylinder'],
    plane:   ['White Plane'],
    safety:  ['Safety Zone'],
    zedm:    ['Zed M Camera']
  };
  // Per-group visibility state
  let sceneGroupVisible = { objects: false, plane: false, safety: false, zedm: false };

  window.setTunerSceneObjectsVisibility = function (visible) {
    areTunerSceneObjectsVisible = !!visible;
    if (areTunerSceneObjectsVisible && Object.keys(tunerSceneObjects).length === 0) {
      initTunerSceneObjects();
    }
    // When toggling ALL, set every group to the same state
    for (const key of Object.keys(sceneGroupVisible)) {
      sceneGroupVisible[key] = areTunerSceneObjectsVisible;
    }
    for (const obj of Object.values(tunerSceneObjects)) {
      if (obj) obj.visible = areTunerSceneObjectsVisible;
    }
  };

  window.setSceneGroupVisibility = function (groupKey, visible) {
    if (Object.keys(tunerSceneObjects).length === 0) {
      initTunerSceneObjects();
    }
    sceneGroupVisible[groupKey] = !!visible;
    const names = sceneNodeGroups[groupKey] || [];
    for (const name of names) {
      const obj = tunerSceneObjects[name];
      if (obj) obj.visible = !!visible;
    }
    // Update global flag: true if ANY group is visible
    areTunerSceneObjectsVisible = Object.values(sceneGroupVisible).some(v => v);
  };

  window.getSceneGroupVisibility = function (groupKey) {
    return !!sceneGroupVisible[groupKey];
  };

  window.getTunerSceneObjectsVisibility = function () {
    return areTunerSceneObjectsVisible;
  };

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


  // ── YOLO Detection Overlay ────────────────────────────────────────────────
  // Rendert die Marker von /zed/bboxes_3d direkt in die WebGL-Szene.
  //
  // Der Publisher (yolo_3d_bbox_for_zed_m.py) sendet pro erkanntem Objekt:
  //   yolo_bboxes                     LINE_LIST (5)  Drahtgitter, 24 Punkte
  //   yolo_object_grasp_center_point  SPHERE    (2)  roter Greifpunkt
  //   yolo_labels_{class,x,y,z}       TEXT      (9)  vier gestapelte Labels
  //
  // Alle Marker stehen im Frame "world" - die TF-Aufloesung passiert bereits
  // im Node. Die Szene hier laeuft ebenfalls in ROS-Konvention (Z oben, Meter),
  // deshalb werden Positionen 1:1 uebernommen, ohne Umrechnung.
  const MARKER_ADD = 0, MARKER_DELETE = 2, MARKER_DELETEALL = 3;
  const MARKER_SPHERE = 2, MARKER_LINE_LIST = 5, MARKER_TEXT = 9;

  // lifetime der Marker ist 2 s; etwas Reserve gegen Netzwerk-Jitter.
  const DETECTION_TTL_MS = 2600;
  // Label-Texturen nicht bei jeder Nachricht neu zeichnen - die mm-Werte
  // zittern sonst mit Kamerarate und erzeugen dauernd Canvas-Arbeit.
  const LABEL_REDRAW_MS = 200;

  let detectionGroup = null;
  let detectionObjects = {};            // "ns/id" -> { obj, lastSeen, ... }
  let detectionsVisible = true;

  function ensureDetectionGroup() {
    if (!scene) return null;
    if (!detectionGroup) {
      detectionGroup = new THREE.Group();
      detectionGroup.name = 'yolo-detections';
      detectionGroup.visible = detectionsVisible;
    }
    // Wird die Szene je neu aufgebaut, haengt die Gruppe sonst an der alten
    // und waere unsichtbar, ohne dass irgendetwas Fehler meldet.
    if (detectionGroup.parent !== scene) scene.add(detectionGroup);
    ensureDetectionPicking();
    return detectionGroup;
  }

  // Scratch-Instanz: markerColor() laeuft pro Marker und Nachricht, ein
  // new THREE.Color() je Aufruf waere unnoetiger GC-Druck bei Kamerarate.
  const _mColor = new THREE.Color();
  function markerColor(m) {
    const c = (m && m.color) || {};
    return _mColor.setRGB(c.r || 0, c.g || 0, c.b || 0);
  }

  function applyMarkerPose(obj, m) {
    const pos = (m.pose && m.pose.position) || { x: 0, y: 0, z: 0 };
    obj.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
    const q = (m.pose && m.pose.orientation) || null;
    if (q) obj.quaternion.set(q.x || 0, q.y || 0, q.z || 0, q.w === undefined ? 1 : q.w);
  }

  // Ein Sprite mit Canvas-Textur. Der Canvas wird wiederverwendet und nur neu
  // bezeichnet - sonst wuerde pro Aktualisierung eine neue GPU-Textur anfallen.
  function makeLabelSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;   // kein Mipmapping bei NPOT-Text
    texture.magFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,      // Label bleibt lesbar, auch hinter dem Roboter
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 999;
    return { sprite, canvas, texture, text: null, color: null, drawnAt: 0 };
  }

  const LABEL_FONT_PX = 72;

  // Verkleinert alle Labels gegenueber marker.scale.z (Klassenname wie auch
  // die X/Y/Z-Zeilen). 1.0 entspraeche exakt der RViz-Groesse, die im
  // Viewport zu wuchtig wirkt. Zur Laufzeit ueber
  // window.setDigitalTwinLabelScale() nachjustierbar.
  let labelScale = 0.6;

  function drawLabel(entry, text, color) {
    const cv = entry.canvas;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.font = `bold ${LABEL_FONT_PX}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Dunkler Umriss, damit der Text auf hellem wie dunklem Grund steht
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeText(text, cv.width / 2, cv.height / 2);
    ctx.fillStyle = color;
    ctx.fillText(text, cv.width / 2, cv.height / 2);
    entry.texture.needsUpdate = true;

    // Echte Glyphenhoehe messen statt zu schaetzen. RViz interpretiert
    // scale.z als Hoehe des Textes selbst - die vier Labels stehen nur 12 mm
    // auseinander, ein zu grosszuegig geschaetzter Faktor laesst sie
    // ineinanderlaufen. actualBoundingBox* fehlt in aelteren Engines,
    // deshalb ein Fallback ueber die Schriftgroesse.
    const mt = ctx.measureText(text);
    const asc = mt.actualBoundingBoxAscent;
    const desc = mt.actualBoundingBoxDescent;
    const glyphPx = (typeof asc === 'number' && typeof desc === 'number' && (asc + desc) > 0)
      ? (asc + desc)
      : LABEL_FONT_PX * 0.72;
    entry.glyphPx = glyphPx;
    entry.widthPx = Math.max(mt.width, 1);
  }

  function disposeDetection(rec) {
    const obj = rec.obj;
    if (!obj) return;
    if (detectionGroup) detectionGroup.remove(obj);
    // ACHTUNG: three.js legt die Sprite-Geometrie EINMAL modulweit an und
    // teilt sie unter allen Sprites (r128: "if (void 0 === Cs) Cs = new En").
    // Ein dispose() darauf wuerde saemtliche Labels zerstoeren, nicht nur
    // dieses. Nur eigene Geometrien freigeben.
    if (obj.geometry && !obj.isSprite) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  }

  function upsertDetection(m, now) {
    const group = ensureDetectionGroup();
    if (!group) return;

    const key = `${m.ns || ''}/${m.id || 0}`;
    let rec = detectionObjects[key];

    if (m.action === MARKER_DELETE) {
      if (rec) { disposeDetection(rec); delete detectionObjects[key]; }
      return;
    }
    if (m.action !== undefined && m.action !== MARKER_ADD) return;

    // ── LINE_LIST: Drahtgitter-Box ──
    if (m.type === MARKER_LINE_LIST) {
      const pts = m.points || [];
      if (pts.length < 2) return;

      if (!rec || rec.kind !== 'lines' || rec.count !== pts.length) {
        if (rec) disposeDetection(rec);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.length * 3), 3));
        const mat = new THREE.LineBasicMaterial({
          color: markerColor(m),
          transparent: true,
          opacity: (m.color && m.color.a !== undefined) ? m.color.a : 1.0,
        });
        const obj = new THREE.LineSegments(geo, mat);
        group.add(obj);
        rec = detectionObjects[key] = { obj, kind: 'lines', count: pts.length };
      } else {
        rec.obj.material.color.copy(markerColor(m));
      }

      // Punkte direkt in den bestehenden Puffer schreiben - kein
      // Zwischenarray je Nachricht.
      const attr = rec.obj.geometry.getAttribute('position');
      const buf = attr.array;
      for (let i = 0; i < pts.length; i++) {
        buf[i * 3] = pts[i].x; buf[i * 3 + 1] = pts[i].y; buf[i * 3 + 2] = pts[i].z;
      }
      attr.needsUpdate = true;
      rec.obj.geometry.computeBoundingSphere();
      applyMarkerPose(rec.obj, m);
      rec.lastSeen = now;
      return;
    }

    // ── SPHERE: roter Greifpunkt ──
    if (m.type === MARKER_SPHERE) {
      if (!rec || rec.kind !== 'sphere') {
        if (rec) disposeDetection(rec);
        const geo = new THREE.SphereGeometry(0.5, 20, 14);   // Einheitskugel
        const mat = new THREE.MeshStandardMaterial({
          color: markerColor(m),
          emissive: markerColor(m),
          emissiveIntensity: 0.55,
          metalness: 0.1,
          roughness: 0.4,
          transparent: true,
          opacity: (m.color && m.color.a !== undefined) ? m.color.a : 1.0,
        });
        const obj = new THREE.Mesh(geo, mat);
        group.add(obj);
        rec = detectionObjects[key] = { obj, kind: 'sphere' };
      } else {
        rec.obj.material.color.copy(markerColor(m));
        rec.obj.material.emissive.copy(markerColor(m));
      }
      const sc = m.scale || { x: 0.0125, y: 0.0125, z: 0.0125 };
      rec.obj.scale.set(sc.x || 0.0125, sc.y || 0.0125, sc.z || 0.0125);
      applyMarkerPose(rec.obj, m);
      rec.markerId = m.id || 0;   // Bruecke zum Klassen-Label gleicher id
      rec.lastSeen = now;
      return;
    }

    // ── TEXT_VIEW_FACING: Label ──
    if (m.type === MARKER_TEXT) {
      // Der Publisher ersetzt Leerzeichen durch "_" (RViz-Eigenheit) -
      // im Viewport ist die lesbare Schreibweise sinnvoller. Der ROHTEXT wird
      // aber gebraucht: die Liste "Detected Objects" und damit auch der
      // Grasp-Befehl nutzen genau ihn als Objektnamen.
      const rawText = String(m.text || '').trim();
      const text = rawText.replace(/_/g, ' ').trim();
      if (!text) return;
      const col = markerColor(m);
      const css = `rgb(${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)})`;

      if (!rec || rec.kind !== 'text') {
        if (rec) disposeDetection(rec);
        const made = makeLabelSprite();
        group.add(made.sprite);
        rec = detectionObjects[key] = { obj: made.sprite, kind: 'text', label: made };
      }
      const lbl = rec.label;
      const changed = (lbl.text !== text || lbl.color !== css);
      // Erstzeichnung greift hier ebenfalls: drawnAt startet bei 0, die
      // Throttle-Bedingung ist beim ersten Mal also immer erfuellt.
      if (changed && (now - lbl.drawnAt) >= LABEL_REDRAW_MS) {
        drawLabel(lbl, text, css);
        lbl.text = text; lbl.color = css; lbl.drawnAt = now;
      }

      // scale.z ist die Texthoehe in Metern. Das Sprite ist groesser als die
      // Glyphe (Leerraum im Canvas), deshalb wird ueber das gemessene
      // Verhaeltnis hochgerechnet - so entspricht die sichtbare Texthoehe
      // exakt scale.z und die vier Labels ueberlappen nicht.
      const textH = ((m.scale && m.scale.z) ? m.scale.z : 0.012) * labelScale;
      const glyphPx = lbl.glyphPx || (LABEL_FONT_PX * 0.72);
      const spriteH = textH * (rec.obj.material.map.image.height / glyphPx);
      const aspect = rec.obj.material.map.image.width / rec.obj.material.map.image.height;
      rec.obj.scale.set(spriteH * aspect, spriteH, 1);
      applyMarkerPose(rec.obj, m);
      rec.rawText = rawText;
      rec.lastSeen = now;
    }
  }

  // ── Klick auf die rote Greifkugel ─────────────────────────────────────────
  // Loest dasselbe aus wie ein Klick auf den Eintrag in "Detected Objects".
  const _ray = new THREE.Raycaster();
  const _ndc = new THREE.Vector2();
  let pickingWired = false;
  let pressX = 0, pressY = 0, pressT = 0;
  let hoveredKey = null;

  // Nur als Klick werten, wenn kaum bewegt und kurz gedrueckt wurde -
  // sonst wuerde jedes Orbit-Drag, das auf einer Kugel endet, ausloesen.
  const CLICK_MAX_MOVE_PX = 5;
  const CLICK_MAX_MS = 500;
  // Hover nicht bei jedem pointermove raycasten - das feuert mit
  // Bildwiederholrate und wuerde pro Ereignis ein Trefferarray erzeugen.
  const HOVER_THROTTLE_MS = 50;
  let lastHoverT = 0;

  function sphereRecords() {
    const out = [];
    for (const key of Object.keys(detectionObjects)) {
      const rec = detectionObjects[key];
      if (rec.kind === 'sphere' && rec.obj) out.push(rec);
    }
    return out;
  }

  // Objektname zur Kugel: gleiche id, Namespace der Klassen-Labels.
  function nameForSphere(rec) {
    const lbl = detectionObjects[`yolo_labels_class/${rec.markerId}`];
    return (lbl && lbl.rawText) || null;
  }

  function pickSphereAt(ev) {
    if (!renderer || !camera || !detectionGroup || !detectionsVisible) return null;
    const recs = sphereRecords();
    if (recs.length === 0) return null;

    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    _ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    _ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    _ray.setFromCamera(_ndc, camera);

    const hits = _ray.intersectObjects(recs.map(r => r.obj), false);
    if (hits.length === 0) return null;
    return recs.find(r => r.obj === hits[0].object) || null;
  }

  function setHover(rec) {
    const key = rec ? `${rec.markerId}` : null;
    if (key === hoveredKey) return;
    // Vorherige Hervorhebung zuruecknehmen
    for (const r of sphereRecords()) {
      if (r.obj.material && r.obj.userData.baseEmissive !== undefined) {
        r.obj.material.emissiveIntensity = r.obj.userData.baseEmissive;
      }
    }
    if (rec && rec.obj.material) {
      if (rec.obj.userData.baseEmissive === undefined) {
        rec.obj.userData.baseEmissive = rec.obj.material.emissiveIntensity;
      }
      rec.obj.material.emissiveIntensity = 1.4;
    }
    hoveredKey = key;
    if (renderer) renderer.domElement.style.cursor = rec ? 'pointer' : '';
  }

  function ensureDetectionPicking() {
    if (pickingWired || !renderer || !renderer.domElement) return;
    const el = renderer.domElement;

    el.addEventListener('pointerdown', (ev) => {
      pressX = ev.clientX; pressY = ev.clientY; pressT = Date.now();
    });

    el.addEventListener('pointerup', (ev) => {
      if (isDraggingGizmo) return;                       // TCP-Gizmo hat Vorrang
      const dx = ev.clientX - pressX, dy = ev.clientY - pressY;
      if (Math.hypot(dx, dy) > CLICK_MAX_MOVE_PX) return; // war ein Orbit-Drag
      if (Date.now() - pressT > CLICK_MAX_MS) return;

      const rec = pickSphereAt(ev);
      if (!rec) return;
      const name = nameForSphere(rec);
      if (!name) {
        if (typeof window.logMsg === 'function') {
          window.logMsg('GIZMO', '⚠ Grasp point clicked but its class label is missing - ignoring.', 'warn');
        }
        return;
      }
      // KEIN stopPropagation()/preventDefault() hier!
      // OrbitControls haengt pointermove/pointerup am ownerDocument (nicht am
      // Canvas) und entfernt den move-Listener erst in seinem pointerup.
      // Wird das Bubbling hier gestoppt, erreicht pointerup das Document nie,
      // der move-Listener bleibt haengen und der Viewport dreht sich danach
      // weiter, als haette man die Maustaste noch gedrueckt.
      // Ein Klick ohne Bewegung erzeugt in OrbitControls ohnehin keine
      // Rotation - es gibt also nichts zu unterdruecken.
      if (typeof window.graspDetectedObject === 'function') {
        window.graspDetectedObject(name, 'viewport');
      }
    });

    el.addEventListener('pointermove', (ev) => {
      if (isDraggingGizmo) return;
      const t = Date.now();
      if (t - lastHoverT < HOVER_THROTTLE_MS) return;
      lastHoverT = t;
      setHover(pickSphereAt(ev));
    });

    el.addEventListener('pointerleave', () => setHover(null));

    pickingWired = true;
  }

  function sweepDetections(now) {
    for (const key of Object.keys(detectionObjects)) {
      const rec = detectionObjects[key];
      if (now - (rec.lastSeen || 0) > DETECTION_TTL_MS) {
        disposeDetection(rec);
        delete detectionObjects[key];
      }
    }
  }

  function clearDetections() {
    for (const key of Object.keys(detectionObjects)) disposeDetection(detectionObjects[key]);
    detectionObjects = {};
  }

  // Wird von app.js mit dem kompletten MarkerArray gefuettert.
  window.updateDigitalTwinDetections = function (markers) {
    if (!scene || !Array.isArray(markers)) return;
    const now = Date.now();

    if (markers.some(m => m && m.action === MARKER_DELETEALL)) {
      clearDetections();
      return;
    }
    for (const m of markers) {
      if (m) upsertDetection(m, now);
    }
    sweepDetections(now);
  };

  window.setDigitalTwinDetectionsVisible = function (visible) {
    detectionsVisible = !!visible;
    if (detectionGroup) detectionGroup.visible = detectionsVisible;
    return detectionsVisible;
  };

  window.getDigitalTwinDetectionsVisible = function () {
    return detectionsVisible;
  };

  // Labelgroesse live nachregeln, z.B. window.setDigitalTwinLabelScale(0.45).
  // Wirkt beim naechsten eingehenden MarkerArray, da die Skalierung dort
  // gesetzt wird - bereits sichtbare Labels ziehen also innerhalb eines
  // Frames nach.
  window.setDigitalTwinLabelScale = function (factor) {
    const f = Number(factor);
    if (!isFinite(f) || f <= 0) return labelScale;
    labelScale = f;
    return labelScale;
  };

  window.getDigitalTwinLabelScale = function () {
    return labelScale;
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDigitalTwin);
  } else {
    setTimeout(initDigitalTwin, 100);
  }
})();
