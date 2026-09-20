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

    // 7. Load URDF
    loadURDFModel();

    // 8. Animation Loop
    function animate() {
      animId = requestAnimationFrame(animate);
      if (controls) controls.update();
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
  }

  // ── Public Global API ───────────────────────────────────────────────────────
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
