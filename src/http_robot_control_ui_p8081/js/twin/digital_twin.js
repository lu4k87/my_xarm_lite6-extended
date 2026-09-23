/**
 * ── 3D Digital Twin Engine (WebGL / Three.js + URDFLoader) ───────────────────
 * Hardware-accelerated 3D view of xArm Lite 6 with real-time /joint_states mirroring.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import URDFLoader from 'urdf-loader';
import { ROBOT_LIMITS } from '../robot_limits.js';
import { logMsg } from '../log.js';
import { floorGuard } from '../util.js';

// Farben wie unter r128: Hex-Werte gelten als linear, erst die Ausgabe wird
// nach sRGB gewandelt. Mit dem seit r152 aktiven Color Management wuerden alle
// Materialfarben des Twins sichtbar dunkler.
THREE.ColorManagement.enabled = false;

// Rueckrufe in die restliche UI. Der Twin importiert bewusst nichts aus den
// Feature-Modulen (kein Importzyklus) - die setzen ihre Funktionen hier ein.
export const twinHooks = {
  executeMoveToPoseFromGizmo: null,
  openDetectedObjectMenu: null,
  graspDetectedObject: null,
};

// ── Rendern nur bei Bedarf ──────────────────────────────────────────────────
// Statt jedes Frame zu zeichnen, rendert der Loop nur, wenn sich etwas
// geaendert hat (requestRender) oder gerade etwas animiert (Kamera-Daempfung,
// Warn-Puls, Greifpunkt-Auswahl, Pfad-Vorschau, Wand-Naehe).
let renderRequested = true;
export function requestRender() {
  renderRequested = true;
}

// Icon + Text setzen, ohne innerHTML.
function setIconLabel(el, iconClass, text) {
  if (!el) return;
  const i = document.createElement('i');
  i.className = iconClass;
  el.replaceChildren(i);
  if (text) el.append(' ' + text);
}

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
// Nutzerschalter fuer die gestrichelte Distanzlinie TCP -> Gizmo-Ziel.
// Gatet jede Stelle, die sie sichtbar schalten wuerde.
let distanceLineEnabled = true;
let isGizmoActive = true;
let gizmoMode = 'translate'; // 'translate' | 'rotate'
let isDraggingGizmo = false;

// Grenzwerte kommen aus robot_limits.js, damit UI und Twin nicht
// auseinanderlaufen. Der Fallback greift nur, falls die Datei fehlt.
const LIM = ROBOT_LIMITS || {
  HARD_BLOCK_MM: 125.0, CAUTION_MM: 140.0, LOW_Z_MM: 280.0,
  FLOOR_WARN_MM: 35.0, SAFETY_ZONE_M: 0.138,
};

// Zwei verschiedene Dinge, die nicht verwechselt werden duerfen:
//
// 1) Gizmo-Deadzone: blockiert Auto-Move, wenn das Ziel zu nah an der Base
//    UND zu tief liegt. Reine UI-Pruefung, die der harten Ablehnung in
//    robot_motion_handler_movegroup.py:1041 vorgreift.
const DEADZONE_RADIUS_MM = LIM.HARD_BLOCK_MM;
const CAUTION_RADIUS_MM = LIM.CAUTION_MM;
//
// 2) Safety Zone: der Bereich um die Base, der wegen Singularitaet /
//    Eigenkollision NICHT anfahrbar ist. Die frueheren 200 mm waren KEINE
//    Reichweitengrenze, sondern nur der Bahnabstand, den
//    generate_single_object_trajectory() einhaelt.
//    Ueber /ui/safety_zone_params zur Laufzeit aenderbar.
const SAFETY_ZONE_RADIUS_M = LIM.SAFETY_ZONE_M;
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
        setIconLabel(badge, 'fa-solid fa-triangle-exclamation', 'No WebGL');
        badge.className = 'badge badge-kill';
      }
      return;
    }
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  // PCFSoftShadowMap gibt es seit r18x nicht mehr; PCF mit shadow.radius
  // liefert die weichen Kanten.
  renderer.shadowMap.type = THREE.PCFShadowMap;

  container.replaceChildren(); // clear any placeholder
  container.appendChild(renderer.domElement);

  // 4. OrbitControls
  {
    controls = new OrbitControls(camera, renderer.domElement);
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
  // Lichtstaerken: seit r155 physikalische Einheiten. Faktor PI entspricht
  // der Helligkeit der bisherigen (legacy) Werte.
  const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x090d16, 0.45 * Math.PI);
  scene.add(hemiLight);

  // Key Directional Light: Generates crisp highlights and soft dynamic drop shadows
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.95 * Math.PI);
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
  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45 * Math.PI);
  rimLight.position.set(-1.2, 1.2, 1.0);
  scene.add(rimLight);

  // Fill Light: Soft front-fill so shaded sides remain clearly readable
  const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.25 * Math.PI);
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
  // Lief bisher bedingungslos mit voller Bildrate weiter - auch wenn das
  // Panel eingeklappt oder auf den RViz-Tab umgeschaltet war. Ist der
  // Container nicht dargestellt, hat er weder Breite noch offsetParent;
  // dann wird der ganze Block uebersprungen. requestAnimationFrame laeuft
  // weiter, damit der Loop beim Wiederaufklappen von allein anspringt.
  function isViewportVisible() {
    if (!container) return false;
    if (document.hidden) return false;
    if (container.offsetParent === null) return false;
    return container.clientWidth > 0 && container.clientHeight > 0;
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    if (!isViewportVisible()) return;
    // Jede Funktion meldet, ob sie gerade animiert - dann wird weiter
    // gezeichnet. Steht alles still, bleibt die GPU unbeschaeftigt.
    let animating = updateNavSnap();
    if (controls && controls.update()) animating = true;   // Daempfung laeuft
    if (updateSafetyVisuals()) animating = true;
    if (updateGraspSelection()) animating = true;
    if (updatePathPreview()) animating = true;
    if (updateWallProximity()) animating = true;
    if (!animating && !renderRequested) return;
    renderRequested = false;
    updateConnectingLine();
    drawNavGizmo();
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
  requestRender();
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
  requestRender();
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
  requestRender();
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
  requestRender();
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
  requestRender();
  if (navPointerId !== null) return; // keep the highlight while dragging
  if (navHoverAxis !== -1) {
    navHoverAxis = -1;
    if (navCanvas) navCanvas.style.cursor = 'grab';
  }
}

function onNavWheel(e) {
  requestRender();
  e.preventDefault();
  if (!camera || !controls) return;

  navSnap = null;
  const offset = camera.position.clone().sub(controls.target);
  const factor = (e.deltaY > 0) ? (1 / NAV_ZOOM_STEP) : NAV_ZOOM_STEP;
  const length = Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor));
  camera.position.copy(controls.target).add(offset.setLength(length));
  controls.update();
}

// Kamera-Fahrt nach Klick auf eine Achskugel. true, solange sie laeuft.
function updateNavSnap() {
  if (!navSnap || !camera || !controls) return false;
  const t = Math.min(1, (performance.now() - navSnap.t0) / navSnap.dur);
  const eased = (t < 0.5) ? (4 * t * t * t) : (1 - Math.pow(-2 * t + 2, 3) / 2);
  camera.position.lerpVectors(navSnap.from, navSnap.to, eased);
  camera.lookAt(controls.target);
  controls.update();
  if (t >= 1) navSnap = null;
  return true;
}

function loadURDFModel() {
  const badge = document.getElementById('twin-status-badge');
  if (badge) {
    setIconLabel(badge, 'fa-solid fa-circle-notch fa-spin', 'Loading URDF...');
    badge.className = 'badge badge-launch';
  }

  if (typeof URDFLoader !== 'function') {
    console.error('[DigitalTwin] URDFLoader is not loaded');
    if (badge) {
      setIconLabel(badge, 'fa-solid fa-triangle-exclamation', 'Loader Missing');
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
      requestRender();
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
      syncGizmoToRealTCP(true);

      if (badge) {
        setIconLabel(badge, 'fa-solid fa-circle-check', 'Live Digital Twin');
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
        setIconLabel(badge, 'fa-solid fa-circle-xmark', 'Load Error');
        badge.className = 'badge badge-kill';
      }
    }
  );
}

function applyJointValues() {
  requestRender();
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
    syncGizmoToRealTCP(false);
  } else {
    updateConnectingLine();
  }
}

// ── Safety & Warning Visual Loop (Collision: Red Glow, Singularity: Amber Glow)
function updateSafetyVisuals() {
  if (!robotModel || allRobotMeshes.length === 0) return false;
  applySafetyVisuals();
  // Kollision und Singularitaet pulsieren - solange weiterzeichnen.
  return safetyState.collision || safetyState.singularity;
}

function applySafetyVisuals() {
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
  if (!scene || !camera || !renderer) return;

  try {
    transformControls = new TransformControls(camera, renderer.domElement);
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
    // Seit r169 ist TransformControls kein Object3D mehr - in die Szene
    // kommt der Helper.
    scene.add(transformControls.getHelper());

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
        const mp = document.getElementById('moveit-popup');
        if (mp) mp.classList.remove('mp-hidden');
      } else {
        handleGizmoDragEnd();
      }
    });

    transformControls.addEventListener('change', function () {
      requestRender();   // auch Hover-Hervorhebung der Achsen
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

function syncGizmoToRealTCP(resetOffset = true) {
  const realTCP = getRealRobotTCPPose();
  if (!realTCP || !gizmoTarget) return;

  if (resetOffset) {
    hasUserTargetOffset = false;
  }

  gizmoTarget.position.copy(realTCP.position);
  gizmoTarget.quaternion.copy(realTCP.quaternion);
  if (transformControls) transformControls.getHelper().updateMatrixWorld();

  handleGizmoChange(resetOffset);
  updateConnectingLine();
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
  const isInsideDeadzone = (r_xy < DEADZONE_RADIUS_MM && posZ_mm < LIM.LOW_Z_MM);
  const isBelowFloor = floorGuard.enabled && (posZ_mm <= 15.0);

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
    } else if (r_xy < CAUTION_RADIUS_MM || posZ_mm < LIM.FLOOR_WARN_MM) {
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
  const isInsideDeadzone = (r_xy < DEADZONE_RADIUS_MM && posZ_mm < LIM.LOW_Z_MM);
  const isBelowFloor = floorGuard.enabled && (posZ_mm <= 15.0);

  if (isInsideDeadzone || isBelowFloor) {
    if (typeof logMsg === 'function') {
      logMsg('GIZMO', isInsideDeadzone 
        ? `⚠️ Target lies inside the inner singularity / collision zone (r=${Math.round(r_xy)} mm < ${DEADZONE_RADIUS_MM} mm). Auto-move blocked!`
        : `⚠️ Target lies inside the table surface (Z=${posZ_mm} mm). Auto-move blocked!`, 'err');
    }
    return;
  }

  const realTCP = getRealRobotTCPPose();
  let deltaDist_mm = realTCP ? (gizmoTarget.position.distanceTo(realTCP.position) * 1000.0) : 999;

  // Trigger auto-move if offset is greater than 3 mm or orientation adjusted
  if (shouldAutoExecute && deltaDist_mm > 3.0) {
    if (typeof twinHooks.executeMoveToPoseFromGizmo === 'function') {
      twinHooks.executeMoveToPoseFromGizmo();
    }
  } else if (!shouldAutoExecute) {
    const mp = document.getElementById('moveit-popup');
    if (mp) {
      mp.classList.remove('mp-hidden');
      mp.classList.add('mp-phase-confirm');
      const phaseEl = document.getElementById('mp-phase');
      if (phaseEl) phaseEl.textContent = 'GIZMO TARGET';
      const detailEl = document.getElementById('mp-detail');
      if (detailEl) detailEl.textContent = 'Target pose set. Click "Execute path" to plan and move.';
    }
  }
}

// Die Linie laeuft vom echten TCP zur naechstgelegenen roten Greifkugel.
// Ist gerade kein Objekt erkannt, faellt sie auf das Gizmo-Ziel zurueck -
// dann zeigt sie wie frueher den Versatz zum gezogenen Ziel.
function pickDistanceLineTarget(tcpPos) {
  let target = null;
  let best = Infinity;

  if (detectionsVisible) {
    for (const rec of sphereRecords()) {
      if (!rec.obj || !rec.obj.parent) continue;
      const d = tcpPos.distanceTo(rec.obj.position);
      if (d < best) { best = d; target = rec.obj.position; }
    }
  }

  if (!target && gizmoTarget && isGizmoActive && hasUserTargetOffset) {
    target = gizmoTarget.position;
    best = tcpPos.distanceTo(target);
  }
  return target ? { position: target, dist: best } : null;
}

function updateConnectingLine() {
  if (!dashedLine || !distanceLineEnabled) {
    if (dashedLine) dashedLine.visible = false;
    return;
  }
  const realTCP = getRealRobotTCPPose();
  if (!realTCP) {
    dashedLine.visible = false;
    return;
  }

  const target = pickDistanceLineTarget(realTCP.position);
  // Klebt der TCP praktisch auf dem Ziel, waere die Linie nur ein Punkt.
  if (!target || target.dist <= 0.003) {
    dashedLine.visible = false;
    return;
  }

  dashedLine.visible = true;
  const positions = dashedLine.geometry.attributes.position.array;
  positions[0] = realTCP.position.x;
  positions[1] = realTCP.position.y;
  positions[2] = realTCP.position.z;
  positions[3] = target.position.x;
  positions[4] = target.position.y;
  positions[5] = target.position.z;
  dashedLine.geometry.attributes.position.needsUpdate = true;
  dashedLine.computeLineDistances();
}

function updateGizmoVisibility() {
  if (!transformControls) return;
  transformControls.getHelper().visible = isGizmoActive;
  transformControls.enabled = isGizmoActive;
  if (ghostTCPGroup) ghostTCPGroup.visible = isGizmoActive;
  // Die Linie haengt nicht mehr am Gizmo: ihr Ziel ist in der Regel die
  // naechste Greifkugel, die es auch ohne aktives Gizmo gibt.
  updateConnectingLine();

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
export function updateDigitalTwinSafety(state) {
  requestRender();
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
}

// Interactive Test & Demo Cycle
let demoSafetyStep = 0;
export function testDigitalTwinSafetyCycle() {
  requestRender();
  demoSafetyStep = (demoSafetyStep + 1) % 4;
  const testBtn = document.getElementById('btn-twin-safety-test');
  if (demoSafetyStep === 1) {
    // 1. Singularity Warning: Wrist J5 alignment
    updateDigitalTwinSafety({
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
    updateDigitalTwinSafety({
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
    updateDigitalTwinSafety({
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
    updateDigitalTwinSafety({
      collision: false,
      singularity: false,
      message: '',
      manipPct: 100,
      floorClearanceZ: 185
    });
    if (testBtn) testBtn.style.color = 'var(--mut)';
    if (typeof logMsg === 'function') logMsg('Motion', '✓ [DEMO] Safety state cleared. Normal operation.', 'success');
  }
}
export function updateDigitalTwinJoints(jointVals, axisY) {
  requestRender();
  if (Array.isArray(jointVals)) {
    for (let i = 0; i < Math.min(jointVals.length, 6); i++) {
      currentJoints[i] = Number(jointVals[i]) || 0;
    }
  }
  if (typeof axisY === 'number') {
    linearShiftY = axisY;
  }
  applyJointValues();
}

export function resetDigitalTwinView() {
  requestRender();
  if (!camera || !controls) return;
  navSnap = null;
  controls.target.set(DEFAULT_TARGET.x, DEFAULT_TARGET.y, DEFAULT_TARGET.z);
  camera.position.set(DEFAULT_CAM_POS.x, DEFAULT_CAM_POS.y, DEFAULT_CAM_POS.z);
  controls.update();
}

export function setDigitalTwinTopView() {
  requestRender();
  if (!camera || !controls) return;
  navSnap = null;
  controls.target.set(0, 0, 0.20);
  camera.position.set(0.001, 0, 1.15);
  controls.update();
}

export function toggleDigitalTwinGrid() {
  requestRender();
  isGridVisible = !isGridVisible;
  if (gridHelper) gridHelper.visible = isGridVisible;
  if (axesHelper) axesHelper.visible = isGridVisible;
  if (shadowPlane) shadowPlane.visible = isGridVisible;
  const btn = document.getElementById('btn-twin-grid');
  if (btn) {
    btn.style.color = isGridVisible ? 'var(--cyan)' : 'var(--mut)';
  }
}

export function toggleDigitalTwinEdges() {
  requestRender();
  isEdgesVisible = !isEdgesVisible;
  edgeLines.forEach((l) => {
    if (l) l.visible = isEdgesVisible;
  });
  const btn = document.getElementById('btn-twin-edges');
  if (btn) {
    btn.style.color = isEdgesVisible ? 'var(--cyan)' : 'var(--mut)';
  }
}


export function resizeDigitalTwin() {
  requestRender();
  handleResize();
}

// ── Public TCP Gizmo APIs ──
export function toggleTCPGizmo(forceState) {
  requestRender();
  if (typeof forceState === 'boolean') isGizmoActive = forceState;
  else isGizmoActive = !isGizmoActive;
  updateGizmoVisibility();
  if (isGizmoActive && !hasUserTargetOffset) {
    syncGizmoToRealTCP(false);
  }
}

export function cycleTCPGizmoMode() {
  requestRender();
  if (gizmoMode === 'translate') {
    setTCPGizmoMode('rotate');
  } else {
    setTCPGizmoMode('translate');
  }
}

export function setTCPGizmoMode(mode) {
  requestRender();
  if (mode !== 'translate' && mode !== 'rotate') return;
  gizmoMode = mode;
  if (transformControls) transformControls.setMode(gizmoMode);

  const btnMode = document.getElementById('btn-twin-gizmo-mode');
  if (btnMode) {
    if (gizmoMode === 'translate') {
      setIconLabel(btnMode, 'fa-solid fa-arrows-up-down-left-right');
      btnMode.title = 'Mode: Translation (X, Y, Z arrows) active [Keys: T / R]';
    } else {
      setIconLabel(btnMode, 'fa-solid fa-rotate');
      btnMode.title = 'Mode: Rotation (Roll, Pitch, Yaw rings) active [Keys: T / R]';
    }
  }
}

export function syncTCPGizmoToRobot() {
  requestRender();
  hasUserTargetOffset = false;
  syncGizmoToRealTCP(true);
  if (typeof logMsg === 'function') {
    logMsg('GIZMO', '🎯 Gizmo synchronized to current robot TCP.', 'info');
  }
}

export function getTCPGizmoPose() {
  requestRender();
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
}

export function resetGizmoTargetOffset() {
  requestRender();
  hasUserTargetOffset = false;
  syncGizmoToRealTCP(false);
}

// ── 3D Scene Objects for TF Control Tuner ────────────────────────────────
let tunerSceneObjects = {};
let areTunerSceneObjectsVisible = false;

// Der TF-Tuner-Wert z ist die UNTERKANTE des Objekts, nicht seine Mitte -
// so haelt es auch rviz_marker_3d_scene_objects.py: die Hohlkoerper-Linien
// laufen dort von z = 0 bis z = dim_z, und der gefuellte Marker wird um
// +dim_z/2 versetzt, weil eine RViz-Marker-Pose die Mitte meint.
// Three.js-Geometrien sind ebenfalls um ihren Mittelpunkt zentriert, also
// braucht es denselben Versatz - sonst steckt das halbe Objekt im Boden.
// Der Versatz wird in Weltrichtung Z addiert, genau wie in RViz, damit
// Drehungen weiterhin um den Objektmittelpunkt laufen.
function groundOffsetOf(obj) {
  return (obj && obj.userData && obj.userData.groundOffset) || 0;
}

function initTunerSceneObjects() {
  if (!scene || Object.keys(tunerSceneObjects).length > 0) return;

  // 1. Blue Cube (30mm x 30mm x 30mm)
  const blueGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.2, roughness: 0.3 });
  const blueMesh = new THREE.Mesh(blueGeo, blueMat);
  blueMesh.castShadow = true;
  blueMesh.receiveShadow = true;
  blueMesh.visible = areTunerSceneObjectsVisible;
  blueMesh.userData.groundOffset = 0.015;   // halbe Hoehe (30 mm)
  scene.add(blueMesh);
  tunerSceneObjects['Blue Cube'] = blueMesh;

  // 2. Red Rectangle (60mm x 30mm x 30mm)
  const redGeo = new THREE.BoxGeometry(0.06, 0.03, 0.03);
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.2, roughness: 0.3 });
  const redMesh = new THREE.Mesh(redGeo, redMat);
  redMesh.castShadow = true;
  redMesh.receiveShadow = true;
  redMesh.visible = areTunerSceneObjectsVisible;
  redMesh.userData.groundOffset = 0.015;    // halbe Hoehe (30 mm)
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
  greenMesh.userData.groundOffset = 0.015;  // halbe Hoehe (30 mm)
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

export function setTunerSceneObjectsVisibility(visible) {
  requestRender();
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
}

export function setSceneGroupVisibility(groupKey, visible) {
  requestRender();
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
}

export function getSceneGroupVisibility(groupKey) {
  requestRender();
  return !!sceneGroupVisible[groupKey];
}

export function getTunerSceneObjectsVisibility() {
  requestRender();
  return areTunerSceneObjectsVisible;
}

export function updateTunerSceneObjects(elements) {
  requestRender();
  if (!elements || !scene) return;

  if (Object.keys(tunerSceneObjects).length === 0) {
    initTunerSceneObjects();
  }

  for (const [name, data] of Object.entries(elements)) {
    const obj = tunerSceneObjects[name];
    if (!obj) continue;

    obj.position.set(Number(data.x), Number(data.y), Number(data.z) + groundOffsetOf(obj));

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
      const scale = Number(data.radius) / SAFETY_ZONE_RADIUS_M;
      obj.scale.set(scale, scale, 1);
    }
  }
}

export function toggleDigitalTwinSection() {
  requestRender();
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
}


// ── YOLO Detection Overlay ────────────────────────────────────────────────
// Rendert die Marker von /zed/bboxes_3d direkt in die WebGL-Szene.
//
// Der Publisher (yolo_3d_bbox_for_zed_m.py) sendet pro erkanntem Objekt:
//   yolo_bboxes                     LINE_LIST (5)  Drahtgitter, 24 Punkte
//   yolo_object_grasp_center_point  SPHERE    (2)  roter Greifpunkt
//   yolo_labels_{class,x,y,z}       TEXT      (9)  vier gestapelte Labels
//
// Dazu kommen von yolo_moveit_collision.py (/zed/yolo_collision_markers):
//   yolo_collision_vis              TRIANGLE_LIST (11) Kollisionswaende,
//                                   oben offen, nur bei aktiver Kollision
//
// Alle Marker stehen im Frame "world" - die TF-Aufloesung passiert bereits
// im Node. Die Szene hier laeuft ebenfalls in ROS-Konvention (Z oben, Meter),
// deshalb werden Positionen 1:1 uebernommen, ohne Umrechnung.
const MARKER_ADD = 0, MARKER_DELETE = 2, MARKER_DELETEALL = 3;
const MARKER_SPHERE = 2, MARKER_LINE_LIST = 5, MARKER_TEXT = 9, MARKER_TRIANGLE_LIST = 11;

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

// ── Spiegelung der YOLO-Detections ────────────────────────────────────
// STANDARDMAESSIG AUS. Der Viewport hat die Detections eine Zeit lang
// zurueckgespiegelt, weil yolo_3d_bbox_for_zed_m.py sie mit mirror_y=True
// seitenverkehrt publizierte. Das ist jetzt an der Quelle abgestellt
// (mirror_y=False), damit RViz, die Collision-Objekte und das Greifziel
// dieselbe Seite meinen - hier darf also nichts mehr gedreht werden.
//   'none' Rohdaten unveraendert                          [Standard]
//   'y'    an der XZ-Ebene spiegeln (links <-> rechts)
//   'x'    an der YZ-Ebene spiegeln (vorne <-> hinten)
//   'xy'   beides, entspricht 180 Grad um Z
// Zur Laufzeit umschaltbar: setDigitalTwinDetectionFlip('y').
let detectionFlip = 'none';

function flipX() { return (detectionFlip === 'x' || detectionFlip === 'xy') ? -1 : 1; }
function flipY() { return (detectionFlip === 'y' || detectionFlip === 'xy') ? -1 : 1; }

function applyMarkerPose(obj, m) {
  const pos = (m.pose && m.pose.position) || { x: 0, y: 0, z: 0 };
  const fx = flipX(), fy = flipY();
  obj.position.set((pos.x || 0) * fx, (pos.y || 0) * fy, pos.z || 0);
  const q = (m.pose && m.pose.orientation) || null;
  if (q) {
    // Eine Spiegelung ist selbst keine Drehung - die gespiegelte Lage
    // ergibt sich aus der Konjugation M*R*M. In Quaternionen heisst das:
    // an der XZ-Ebene kippen x und z das Vorzeichen, an der YZ-Ebene y und z.
    let qx = q.x || 0, qy = q.y || 0, qz = q.z || 0;
    const qw = (q.w === undefined) ? 1 : q.w;
    if (fy < 0) { qx = -qx; qz = -qz; }
    if (fx < 0) { qy = -qy; qz = -qz; }
    obj.quaternion.set(qx, qy, qz, qw);
  }
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
// setDigitalTwinLabelScale() nachjustierbar.
let labelScale = 0.45;

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
    // Liegen die Punkte lokal zur Pose (symmetrische Box), aendert das
    // Spiegeln nichts; liegen sie absolut im Frame, wirkt genau hier der
    // Flip. Beide Faelle sind damit abgedeckt.
    const lfx = flipX(), lfy = flipY();
    for (let i = 0; i < pts.length; i++) {
      buf[i * 3] = pts[i].x * lfx; buf[i * 3 + 1] = pts[i].y * lfy; buf[i * 3 + 2] = pts[i].z;
    }
    attr.needsUpdate = true;
    rec.obj.geometry.computeBoundingSphere();
    applyMarkerPose(rec.obj, m);
    rec.lastSeen = now;
    return;
  }

  // ── TRIANGLE_LIST: Kollisionswaende (rot transparent) ──
  // Kommt nur, solange die MoveIt-Objektkollision aktiv ist. Ist sie aus,
  // loescht der Node den Marker und es bleibt allein der Rahmen stehen.
  if (m.type === MARKER_TRIANGLE_LIST) {
    const pts = m.points || [];
    if (pts.length < 3) return;
    const opacity = (m.color && m.color.a !== undefined) ? m.color.a : 1.0;

    if (!rec || rec.kind !== 'walls' || rec.count !== pts.length) {
      if (rec) disposeDetection(rec);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.length * 3), 3));
      const mat = new THREE.MeshBasicMaterial({
        color: markerColor(m),
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,   // Rahmen und Greifkugel bleiben dahinter sichtbar
      });
      const obj = new THREE.Mesh(geo, mat);
      group.add(obj);
      rec = detectionObjects[key] = { obj, kind: 'walls', count: pts.length, baseColor: new THREE.Color() };
    }
    // Die eigentliche Farbe setzt updateWallProximity() je Frame - hier nur
    // die Grundfarbe aus dem Marker merken.
    rec.baseColor.copy(markerColor(m));
    rec.baseOpacity = opacity;

    const attr = rec.obj.geometry.getAttribute('position');
    const buf = attr.array;
    const lfx = flipX(), lfy = flipY();
    const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity };
    for (let i = 0; i < pts.length; i++) {
      const x = pts[i].x * lfx, y = pts[i].y * lfy, z = pts[i].z;
      buf[i * 3] = x; buf[i * 3 + 1] = y; buf[i * 3 + 2] = z;
      if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x;
      if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
      if (z < b.z0) b.z0 = z; if (z > b.z1) b.z1 = z;
    }
    // Die Waende sind eine oben offene Kiste: Boden + vier Seiten.
    rec.bounds = b;
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
      rec.obj.material.opacity = (m.color && m.color.a !== undefined) ? m.color.a : 1.0;
    }
    const sc = m.scale || { x: 0.0125, y: 0.0125, z: 0.0125 };
    rec.obj.scale.set(sc.x || 0.0125, sc.y || 0.0125, sc.z || 0.0125);
    // Ausgangswerte festhalten: die Auswahl-Animation moduliert Groesse,
    // Deckkraft und Glut und muss sie danach wieder herstellen koennen.
    // Die Marker kommen mit 10 Hz herein und wuerden sonst gegen die
    // Animation anschreiben.
    rec.baseScale = rec.obj.scale.x;
    rec.baseOpacity = rec.obj.material.opacity;
    rec.baseEmissiveIntensity = 0.55;
    applyMarkerPose(rec.obj, m);
    rec.markerId = m.id || 0;   // Bruecke zum Klassen-Label gleicher id
    rec.lastSeen = now;
    if (selectedGraspName && nameForSphere(rec) === selectedGraspName) {
      selectedGraspRec = rec;
    }
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

// ── Kollisionswaende: Servo-Haltabstand sichtbar machen ─────────────────────
// MoveIt Servo haelt 2 cm vor jeder Kollisionsgeometrie an
// (min_allowable_collision_distance). Kommt der TCP einer Wand naeher,
// leuchten die Waende dieses Objekts gelb-orange und pulsieren - so ist
// sofort zu sehen, warum der Arm gerade stehen bleibt.
const WALL_HALT_DISTANCE_M = 0.02;
const WALL_WARN_COLOR = new THREE.Color(0xf59e0b);

// Abstand eines Punkts zu einem achsparallelen Rechteck.
function distToRect(px, py, pz, x0, x1, y0, y1, z0, z1) {
  const dx = Math.max(x0 - px, 0, px - x1);
  const dy = Math.max(y0 - py, 0, py - y1);
  const dz = Math.max(z0 - pz, 0, pz - z1);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Kleinster Abstand zu Boden und vier Seitenwaenden (Deckel gibt es nicht).
function distToOpenBox(p, b) {
  return Math.min(
    distToRect(p.x, p.y, p.z, b.x0, b.x1, b.y0, b.y1, b.z0, b.z0),   // Boden
    distToRect(p.x, p.y, p.z, b.x0, b.x0, b.y0, b.y1, b.z0, b.z1),   // -X
    distToRect(p.x, p.y, p.z, b.x1, b.x1, b.y0, b.y1, b.z0, b.z1),   // +X
    distToRect(p.x, p.y, p.z, b.x0, b.x1, b.y0, b.y0, b.z0, b.z1),   // -Y
    distToRect(p.x, p.y, p.z, b.x0, b.x1, b.y1, b.y1, b.z0, b.z1)    // +Y
  );
}

let wallsWereNear = false;

function updateWallProximity() {
  let tcp = null;
  let anyNear = false;
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 110);
  for (const key of Object.keys(detectionObjects)) {
    const rec = detectionObjects[key];
    if (rec.kind !== 'walls' || !rec.bounds) continue;
    if (tcp === null) {
      const pose = getRealRobotTCPPose();
      tcp = pose ? pose.position : false;
    }
    const near = tcp && distToOpenBox(tcp, rec.bounds) < WALL_HALT_DISTANCE_M;
    const mat = rec.obj.material;
    if (near) {
      mat.color.copy(WALL_WARN_COLOR);
      mat.opacity = 0.45 + 0.35 * pulse;
    } else {
      mat.color.copy(rec.baseColor);
      mat.opacity = rec.baseOpacity;
    }
    rec.near = !!near;
    if (near) anyNear = true;
  }
  // Puls laeuft nur, solange der TCP nah ist - plus ein Frame beim Wechsel,
  // damit die Waende wieder ihre Grundfarbe bekommen.
  const changed = anyNear !== wallsWereNear;
  wallsWereNear = anyNear;
  return anyNear || changed;
}

// ── MoveTo Pfad-Vorschau (Geisterroboter) ──────────────────────────────────
// robot_motion_handler_movegroup plant bei aktiver Vorschau nur und schickt
// den Pfad ueber /ui/moveto_preview_path. Hier faehrt ein halbtransparenter
// Klon des Roboters den Pfad in Echtzeit in einer Schleife ab, dazu zeigt
// eine Linie die Bahn des TCP. Ausgefuehrt wird erst nach Bestaetigung.
const PREVIEW_HOLD_S = 0.8;   // Pause am Ziel, bevor die Schleife neu startet
let previewGhost = null;
let previewPath = null;       // { names, points, times, duration }
let previewLine = null;
let previewEndMarker = null;
let previewT0 = 0;
let previewLineBuilt = false;

const previewGhostMat = new THREE.MeshStandardMaterial({
  color: 0x22d3ee,
  emissive: 0x0891b2,
  emissiveIntensity: 0.45,
  metalness: 0.1,
  roughness: 0.5,
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
});
const previewGhostEdgeMat = new THREE.LineBasicMaterial({
  color: 0x67e8f9, transparent: true, opacity: 0.35, depthWrite: false,
});

function ensurePreviewGhost() {
  if (previewGhost || !robotModel || !scene) return previewGhost;
  // URDFRobot.copy() baut die joints-Tabelle fuer den Klon neu auf,
  // setJointValue wirkt also auf den Geist und nicht auf den echten Arm.
  // Geometrien bleiben geteilt - deshalb beim Entfernen nie dispose().
  previewGhost = robotModel.clone(true);
  previewGhost.name = 'moveto-preview-ghost';
  previewGhost.traverse((child) => {
    if (child.isMesh) {
      child.material = previewGhostMat;
      child.castShadow = false;
      child.receiveShadow = false;
      child.renderOrder = 5;
    } else if (child.isLineSegments) {
      child.material = previewGhostEdgeMat;
      child.visible = true;
    }
  });
  previewGhost.visible = false;
  scene.add(previewGhost);
  return previewGhost;
}

function setGhostJoints(values) {
  const names = previewPath.names;
  for (let i = 0; i < names.length; i++) {
    if (previewGhost.joints && previewGhost.joints[names[i]]) {
      previewGhost.setJointValue(names[i], values[i]);
    }
  }
}

function ghostTCPPosition() {
  const tcp = previewGhost.getObjectByName('link_tcp') ||
              previewGhost.getObjectByName('uflite_vacuum_gripper_link') ||
              previewGhost.getObjectByName('link6');
  if (!tcp) return null;
  previewGhost.updateMatrixWorld(true);
  return tcp.getWorldPosition(new THREE.Vector3());
}

function disposePreviewLine() {
  [previewLine, previewEndMarker].forEach((o) => {
    if (!o) return;
    if (o.parent) o.parent.remove(o);
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  previewLine = null;
  previewEndMarker = null;
}

// Bahn des TCP: jeden Wegpunkt einmal am Geist einstellen und die
// TCP-Position ablesen. Laeuft nur einmal je Pfad.
function buildPreviewLine() {
  disposePreviewLine();
  const pts = [];
  for (const p of previewPath.points) {
    setGhostJoints(p);
    const pos = ghostTCPPosition();
    if (pos) pts.push(pos);
  }
  if (pts.length === 0) return;
  const geo = new THREE.BufferGeometry().setFromPoints(pts.length > 1 ? pts : [pts[0], pts[0]]);
  previewLine = new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: 0x22d3ee, transparent: true, opacity: 0.95, depthTest: false,
  }));
  previewLine.renderOrder = 998;
  scene.add(previewLine);

  previewEndMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9, depthTest: false })
  );
  previewEndMarker.position.copy(pts[pts.length - 1]);
  previewEndMarker.renderOrder = 998;
  scene.add(previewEndMarker);
}

function updatePathPreview() {
  if (!previewPath) return false;
  applyPathPreview();
  return !!previewPath;
}

function applyPathPreview() {
  if (!ensurePreviewGhost()) return;   // URDF noch nicht geladen
  previewGhost.position.copy(robotModel.position);
  if (!previewLineBuilt) {
    buildPreviewLine();
    previewLineBuilt = true;
    previewT0 = performance.now();
  }
  previewGhost.visible = true;

  const { points, times, duration } = previewPath;
  const cycle = duration + PREVIEW_HOLD_S;
  const t = Math.min(duration, ((performance.now() - previewT0) / 1000) % cycle);

  // Wegpunkt-Paar zum Zeitpunkt t suchen und linear interpolieren.
  let i = 0;
  while (i < times.length - 2 && times[i + 1] < t) i++;
  const a = points[i];
  const b = points[Math.min(i + 1, points.length - 1)];
  const span = (times[i + 1] !== undefined ? times[i + 1] : times[i]) - times[i];
  const f = span > 1e-6 ? Math.min(1, Math.max(0, (t - times[i]) / span)) : 1;
  setGhostJoints(a.map((v, k) => v + (b[k] - v) * f));
}

export function showDigitalTwinPathPreview(data) {
  requestRender();
  if (!data || !Array.isArray(data.points) || data.points.length === 0) {
    clearDigitalTwinPathPreview();
    return;
  }
  const names = Array.isArray(data.joint_names) ? data.joint_names : [];
  const times = Array.isArray(data.times) && data.times.length === data.points.length
    ? data.times.map(Number)
    : data.points.map((_, i) => i * 0.1);
  previewPath = {
    names,
    points: data.points.map(p => p.map(Number)),
    times,
    duration: Math.max(0, times[times.length - 1] || 0),
  };
  previewLineBuilt = false;
}

export function clearDigitalTwinPathPreview() {
  requestRender();
  previewPath = null;
  previewLineBuilt = false;
  disposePreviewLine();
  if (previewGhost) previewGhost.visible = false;
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

// Alles, was das Kontextmenue zu einem Objekt braucht. Der Greifpunkt
// kommt in link_base-Koordinaten [mm] zurueck (Linearachse herausgerechnet),
// genau wie getTCPGizmoPose() - so passt er direkt in einen MoveTo-Befehl.
// collisionName folgt yolo_moveit_collision.py: "<Label>_<Marker-ID>".
function objectInfoForSphere(rec, name) {
  const p = rec.obj.position;
  return {
    name,
    markerId: rec.markerId,
    collisionName: `${name}_${rec.markerId}`.replace(/ /g, '_'),
    grasp: {
      x: Math.round(p.x * 1000),
      y: Math.round((p.y - linearShiftY) * 1000),
      z: Math.round(p.z * 1000),
    },
  };
}

export function getDetectedObjectInfo(name) {
  requestRender();
  for (const rec of sphereRecords()) {
    if (nameForSphere(rec) === name) return objectInfoForSphere(rec, name);
  }
  return null;
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

// ── Puls-Cursor ueber der Greifkugel ──────────────────────────────────
// Ein CSS-Cursor kann nicht animiert werden, deshalb ein eigenes Element,
// das dem Zeiger folgt. Der echte Zeiger wird solange ausgeblendet.
let hoverCursorEl = null;

function ensureHoverCursor() {
  if (!hoverCursorEl) {
    hoverCursorEl = document.createElement('div');
    hoverCursorEl.className = 'twin-hover-cursor';
    document.body.appendChild(hoverCursorEl);
  }
  return hoverCursorEl;
}

// Wird bei JEDEM pointermove aufgerufen, nicht nur im Hover-Takt: sonst
// ruckelte der Kreis im 50-ms-Raster des Raycasts hinterher. Kostet zwei
// Style-Zuweisungen, und nur solange der Cursor sichtbar ist.
function moveHoverCursor(ev) {
  if (!hoverCursorEl || !hoverCursorEl.classList.contains('is-active')) return;
  hoverCursorEl.style.left = ev.clientX + 'px';
  hoverCursorEl.style.top = ev.clientY + 'px';
}

function showHoverCursor(on, ev) {
  const el = ensureHoverCursor();
  el.classList.toggle('is-active', !!on);
  if (on && ev) {
    el.style.left = ev.clientX + 'px';
    el.style.top = ev.clientY + 'px';
  }
}

function setHover(rec, ev) {
  requestRender();
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
  // Echten Zeiger ausblenden, solange der Puls-Kreis ihn ersetzt.
  if (renderer) renderer.domElement.style.cursor = rec ? 'none' : '';
  showHoverCursor(!!rec, ev);
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
      if (typeof logMsg === 'function') {
        logMsg('GIZMO', '⚠ Grasp point clicked but its class label is missing - ignoring.', 'warn');
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
    // Kontextmenue (Approach / Grasp / Collision) statt sofort zu greifen.
    if (typeof twinHooks.openDetectedObjectMenu === 'function') {
      twinHooks.openDetectedObjectMenu(objectInfoForSphere(rec, name), ev.clientX, ev.clientY);
    } else if (typeof twinHooks.graspDetectedObject === 'function') {
      twinHooks.graspDetectedObject(name, 'viewport');
    }
  });

  el.addEventListener('pointermove', (ev) => {
    if (isDraggingGizmo) return;
    moveHoverCursor(ev);                                // jedes Mal
    const t = Date.now();
    if (t - lastHoverT < HOVER_THROTTLE_MS) return;     // Raycast gedrosselt
    lastHoverT = t;
    setHover(pickSphereAt(ev), ev);
  });

  el.addEventListener('pointerleave', () => setHover(null));

  pickingWired = true;
}

// ── Ausgewaehltes Greifziel: pulsierende, glimmende Kugel ─────────────
// Klickt jemand ein Objekt an (Liste oder Viewport), bleibt seine
// Greifkugel markiert, bis der echte TCP sie erreicht hat. Ein Halo aus
// zwei transparenten Huellen macht den Glow auch vor hellem Grund sichtbar.
let selectedGraspName = null;
let selectedGraspRec = null;
let selectedGraspSince = 0;
let graspHalo = null;

// Abstand, ab dem das Ziel als erreicht gilt, und Notbremse, falls die
// Fahrt scheitert - sonst pulste die Kugel bis zum Reload weiter.
const GRASP_REACHED_M = 0.035;
const GRASP_SELECT_TIMEOUT_MS = 120000;

// Cyan wie der UI-Akzent fuer die Ringe, Rot wie die Kugel fuer die Glut -
// der Kontrast laesst das Ziel auch vor dem weissen Roboter stehen.
const GRASP_ACCENT = 0x38bdf8;
const GRASP_CORE = 0xff3b30;
const GRASP_PING_COUNT = 2;
const GRASP_PING_MS = 1400;
const GRASP_LOCK_MS = 380;        // Dauer des Einrastens beim Anklicken

function graspRingMaterial(color) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,             // Markierung bleibt vor dem Roboter lesbar
    blending: THREE.AdditiveBlending
  });
}

// Alle Teile sind in Kugelradien modelliert (Radius 1 = Radius der roten
// Kugel); skaliert wird die Gruppe, nicht jede Geometrie.
function ensureGraspHalo() {
  if (graspHalo || !scene || typeof THREE === 'undefined') return graspHalo;
  graspHalo = new THREE.Group();

  // 1) Weiche Glut direkt an der Kugel - gibt dem Ziel Volumen.
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 14),
    new THREE.MeshBasicMaterial({
      color: GRASP_CORE,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.BackSide,       // Huelle von innen: kein harter Rand
      blending: THREE.AdditiveBlending
    })
  );
  core.name = 'core';
  core.renderOrder = 997;
  graspHalo.add(core);

  // 2) Radar-Pings: duenne Ringe, die nach aussen laufen und verblassen.
  //    Zwei Stueck mit halbem Phasenversatz ergeben einen stetigen Takt.
  for (let i = 0; i < GRASP_PING_COUNT; i++) {
    const ping = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.0, 64),
      graspRingMaterial(GRASP_ACCENT)
    );
    ping.name = 'ping' + i;
    ping.renderOrder = 999;
    graspHalo.add(ping);
  }

  // 3) Zielkreuz: vier 60-Grad-Boegen mit Luecken, die langsam kreisen.
  const reticle = new THREE.Group();
  reticle.name = 'reticle';
  const arc = Math.PI / 3;
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.16, 24, 1, i * (Math.PI / 2) - arc / 2, arc),
      graspRingMaterial(GRASP_ACCENT)
    );
    seg.renderOrder = 999;
    reticle.add(seg);
  }
  graspHalo.add(reticle);

  graspHalo.visible = false;
  scene.add(graspHalo);
  return graspHalo;
}

// Ringe sind flach - ohne Ausrichtung zur Kamera waeren sie von der Seite
// nur ein Strich. Die Gruppe selbst wird nicht gedreht, deshalb genuegt es,
// die Kameradrehung zu uebernehmen.
function faceCamera(obj) {
  if (camera) obj.quaternion.copy(camera.quaternion);
}

function restoreSphereLook(rec) {
  if (!rec || !rec.obj || !rec.obj.material) return;
  if (rec.baseScale) rec.obj.scale.setScalar(rec.baseScale);
  if (rec.baseOpacity !== undefined) rec.obj.material.opacity = rec.baseOpacity;
  rec.obj.material.emissiveIntensity = rec.baseEmissiveIntensity || 0.55;
}

function clearGraspSelection(reason) {
  if (!selectedGraspName) return;
  const name = selectedGraspName;
  restoreSphereLook(selectedGraspRec);
  selectedGraspName = null;
  selectedGraspRec = null;
  if (graspHalo) graspHalo.visible = false;
  if (reason && typeof logMsg === 'function') {
    logMsg('WebGL 3D', `Grasp target "${name}": ${reason}`);
  }
}

// Kugel zum Namen suchen - die Marker-Ids wechseln zwischen zwei
// Erkennungen, der Klassenname ist die stabilere Bruecke.
function findSphereByName(name) {
  for (const rec of sphereRecords()) {
    if (nameForSphere(rec) === name) return rec;
  }
  return null;
}

function updateGraspSelection() {
  if (!selectedGraspName) return false;
  applyGraspSelection();
  return true;
}

function applyGraspSelection() {
  if (!selectedGraspName) return;

  const now = Date.now();
  if (now - selectedGraspSince > GRASP_SELECT_TIMEOUT_MS) {
    clearGraspSelection('selection timed out');
    return;
  }

  if (!selectedGraspRec || !selectedGraspRec.obj || !selectedGraspRec.obj.parent) {
    selectedGraspRec = findSphereByName(selectedGraspName);
  }
  const rec = selectedGraspRec;
  if (!rec || !rec.obj || !rec.obj.material) {
    // Objekt gerade nicht erkannt: Halo aus, Auswahl bleibt bestehen -
    // die Erkennung flackert gelegentlich fuer einzelne Frames.
    if (graspHalo) graspHalo.visible = false;
    return;
  }

  // Erreicht? Dann ist die Markierung ihre Aufgabe los.
  const tcp = getRealRobotTCPPose();
  if (tcp && tcp.position.distanceTo(rec.obj.position) <= GRASP_REACHED_M) {
    clearGraspSelection('reached');
    return;
  }

  // 0 -> 1 -> 0 in 1.1 s, dieselbe Taktung wie der Hover-Ring in der UI.
  const k = 0.5 - 0.5 * Math.cos((now % 1100) / 1100 * Math.PI * 2);
  const base = rec.baseScale || rec.obj.scale.x || 0.0125;

  // Die Kugel selbst bleibt ruhig - das Auffaellige machen die Ringe.
  rec.obj.scale.setScalar(base * (1.0 + 0.08 * k));
  rec.obj.material.transparent = true;
  rec.obj.material.opacity = 0.60 + 0.30 * k;      // transparent schwebend
  rec.obj.material.emissiveIntensity = 1.0 + 1.4 * k;

  const halo = ensureGraspHalo();
  if (!halo) return;

  halo.visible = true;
  halo.position.copy(rec.obj.position);
  // Radius der Kugel: die Geometrie ist eine Einheitskugel mit r = 0.5,
  // skaliert auf den Marker-Durchmesser.
  halo.scale.setScalar(base * 0.5);

  // Einrasten: beim Anklicken faehrt das Zielkreuz von weit aussen auf die
  // Kugel zu und blendet dabei ein - kubisch ausklingend, damit es am Ende
  // sanft andockt.
  const lockT = Math.min(1, (now - selectedGraspSince) / GRASP_LOCK_MS);
  const lock = 1 - Math.pow(1 - lockT, 3);

  const core = halo.getObjectByName('core');
  if (core) {
    core.scale.setScalar(1.7 + 0.3 * k);
    core.material.opacity = (0.22 + 0.2 * k) * lock;
  }

  for (let i = 0; i < GRASP_PING_COUNT; i++) {
    const ping = halo.getObjectByName('ping' + i);
    if (!ping) continue;
    faceCamera(ping);
    // Phasenversatz je Ring: 0, 1/2 - so laeuft immer eine Welle nach aussen.
    const phase = ((now % GRASP_PING_MS) / GRASP_PING_MS + i / GRASP_PING_COUNT) % 1;
    ping.scale.setScalar(2.0 + 7.5 * phase);
    // Quadratisch ausblenden: die Welle verliert sich zum Rand hin, statt
    // abrupt zu verschwinden.
    ping.material.opacity = 0.85 * Math.pow(1 - phase, 2) * lock;
  }

  const reticle = halo.getObjectByName('reticle');
  if (reticle) {
    faceCamera(reticle);
    // Kreisen um die Sichtachse. faceCamera() hat die Drehung gerade neu
    // gesetzt, also wird hier der absolute Winkel aufgesetzt - ein Delta
    // waere im naechsten Frame wieder weg.
    reticle.rotateZ((now % 12000) / 12000 * Math.PI * 2);
    const r = 4.6 + 9.0 * (1 - lock) + 0.35 * k;
    reticle.scale.setScalar(r);
    reticle.children.forEach(seg => {
      seg.material.opacity = (0.55 + 0.35 * k) * lock;
    });
  }
}

// Von grasp.js aufgerufen, sobald ein Objekt angeklickt wurde.
export function setDigitalTwinSelectedGrasp(name) {
  requestRender();
  const clean = String(name || '').trim();
  if (!clean) { clearGraspSelection(null); return null; }
  if (selectedGraspName && selectedGraspName !== clean) {
    restoreSphereLook(selectedGraspRec);
  }
  selectedGraspName = clean;
  selectedGraspRec = findSphereByName(clean);
  selectedGraspSince = Date.now();
  ensureGraspHalo();
  return selectedGraspName;
}

export function clearDigitalTwinSelectedGrasp() {
  requestRender();
  clearGraspSelection(null);
}

export function getDigitalTwinSelectedGrasp() {
  requestRender();
  return selectedGraspName;
}

function sweepDetections(now) {
  for (const key of Object.keys(detectionObjects)) {
    const rec = detectionObjects[key];
    if (now - (rec.lastSeen || 0) > DETECTION_TTL_MS) {
      disposeDetection(rec);
      delete detectionObjects[key];
    }
  }
  // Verschwindet gerade die Kugel, ueber der die Maus steht, bliebe der
  // Puls-Cursor sonst stehen, bis die Maus wieder bewegt wird - und der
  // Canvas-Zeiger bliebe auf 'none'.
  if (hoveredKey !== null &&
      !sphereRecords().some(r => `${r.markerId}` === hoveredKey)) {
    setHover(null);
  }
  // Die markierte Kugel kann beim Aufraeumen verschwunden sein - der
  // Datensatz zeigt dann ins Leere und wird beim naechsten Frame neu
  // gesucht.
  if (selectedGraspRec && !selectedGraspRec.obj.parent) selectedGraspRec = null;
}

function clearDetections() {
  for (const key of Object.keys(detectionObjects)) disposeDetection(detectionObjects[key]);
  detectionObjects = {};
}

// Wird von grasp.js mit dem kompletten MarkerArray gefuettert.
export function updateDigitalTwinDetections(markers) {
  requestRender();
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
}

export function setDigitalTwinDetectionsVisible(visible) {
  requestRender();
  detectionsVisible = !!visible;
  if (detectionGroup) detectionGroup.visible = detectionsVisible;
  // Werden die Erkennungen ausgeblendet, waehrend die Maus ueber einer
  // Kugel steht, gibt es nichts mehr zu treffen - Hover sofort aufloesen,
  // statt bis zur naechsten Mausbewegung zu warten.
  if (!detectionsVisible) setHover(null);
  return detectionsVisible;
}

export function getDigitalTwinDetectionsVisible() {
  requestRender();
  return detectionsVisible;
}

// Distanzlinie (gestrichelt, TCP -> naechste Greifkugel) ein-/ausschalten.
// Beim Einschalten wird nicht blind sichtbar geschaltet: updateConnectingLine
// entscheidet anhand von Gizmo-Zustand und Abstand, ob es etwas zu zeigen gibt.
export function setDigitalTwinDistanceLine(visible) {
  requestRender();
  distanceLineEnabled = !!visible;
  if (!distanceLineEnabled) {
    if (dashedLine) dashedLine.visible = false;
  } else {
    updateConnectingLine();
  }
  return distanceLineEnabled;
}

export function getDigitalTwinDistanceLine() {
  requestRender();
  return distanceLineEnabled;
}

// Spiegelung der Detections umschalten: 'y' (Standard), 'x', 'xy', 'none'.
// Wirkt ab dem naechsten MarkerArray, also nach Bruchteilen einer Sekunde.
export function setDigitalTwinDetectionFlip(mode) {
  requestRender();
  const m = String(mode || '').toLowerCase();
  if (['x', 'y', 'xy', 'none'].indexOf(m) === -1) return detectionFlip;
  detectionFlip = m;
  if (typeof logMsg === 'function') {
    logMsg('WebGL 3D', `Detection flip: ${m}`);
  }
  return detectionFlip;
}

export function getDigitalTwinDetectionFlip() {
  requestRender();
  return detectionFlip;
}

// Labelgroesse live nachregeln, z.B. setDigitalTwinLabelScale(0.45).
// Wirkt beim naechsten eingehenden MarkerArray, da die Skalierung dort
// gesetzt wird - bereits sichtbare Labels ziehen also innerhalb eines
// Frames nach.
export function setDigitalTwinLabelScale(factor) {
  requestRender();
  const f = Number(factor);
  if (!isFinite(f) || f <= 0) return labelScale;
  labelScale = f;
  return labelScale;
}

export function getDigitalTwinLabelScale() {
  requestRender();
  return labelScale;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDigitalTwin);
} else {
  setTimeout(initDigitalTwin, 100);
}
