/**
 * ── 3D Digital Twin Engine (WebGL / Three.js + URDFLoader) ───────────────────
 * Hardware-accelerated 3D view of xArm Lite 6 with real-time /joint_states mirroring.
 */

(function () {
  let scene, camera, renderer, controls;
  let robotModel = null;
  let gridHelper, axesHelper;
  let container = null;
  let animId = null;
  let currentJoints = [0, 0, 0, 0, 0, 0];
  let linearShiftY = 0.0;
  let isGridVisible = true;

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

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight1.position.set(1.2, -1.0, 2.0);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.35); // cyan accent rim light
    dirLight2.position.set(-1.0, 1.2, 0.8);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.25); // bottom fill
    dirLight3.position.set(0, 0, -1.0);
    scene.add(dirLight3);

    // 6. Grid & Helpers (Grid in XY plane: rotate from XZ to XY)
    gridHelper = new THREE.GridHelper(1.2, 24, 0x38bdf8, 0x1e293b);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.001; // slightly below 0
    scene.add(gridHelper);

    axesHelper = new THREE.AxesHelper(0.12);
    axesHelper.position.set(0, 0, 0.001);
    scene.add(axesHelper);

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

        // Custom aesthetic material pass for robot links
        robotModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            const isGripper = child.name && (child.name.includes('gripper') || child.name.includes('vacuum'));
            const isWrist = child.name && (child.name.includes('link6') || child.name.includes('link5'));
            
            if (isGripper) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                metalness: 0.6,
                roughness: 0.35
              });
            } else if (isWrist) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                metalness: 0.5,
                roughness: 0.3
              });
            } else {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xf1f5f9,
                metalness: 0.15,
                roughness: 0.4
              });
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
        console.log('[DigitalTwin] xArm Lite 6 URDF successfully loaded.');
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
    const btn = document.getElementById('btn-twin-grid');
    if (btn) {
      btn.style.color = isGridVisible ? 'var(--cyan)' : 'var(--mut)';
    }
  };

  window.resizeDigitalTwin = function () {
    handleResize();
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
