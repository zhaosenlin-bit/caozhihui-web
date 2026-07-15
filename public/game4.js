"use strict";
import * as THREE from "three";

// ----- DOM -----
const canvas = document.getElementById("stage");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const comboEl = document.getElementById("combo");
const timeEl = document.getElementById("time");
const bestEl = document.getElementById("best");
const bannerEl = document.getElementById("banner");
const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const btnReset = document.getElementById("btnReset");

// ----- renderer -----
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
const W = canvas.clientWidth || canvas.width;
const H = canvas.clientHeight || canvas.height;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(W, H, false);

// ----- scene + camera -----
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000010, 0.012);

const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 500);
camera.position.set(0, 1.6, 7);
camera.lookAt(0, 0, -5);

// ambient + key light
scene.add(new THREE.AmbientLight(0x404060, 1.0));
const key = new THREE.DirectionalLight(0xa6c8ff, 1.4);
key.position.set(4, 6, 5);
scene.add(key);
const rim = new THREE.PointLight(0xff9ffc, 1.2, 30);
rim.position.set(-5, 2, -3);
scene.add(rim);

// distant planet (decor)
const planetGeo = new THREE.IcosahedronGeometry(8, 2);
const planetMat = new THREE.MeshStandardMaterial({ color: 0x5227ff, emissive: 0x220066, emissiveIntensity: 0.4, flatShading: true });
const planet = new THREE.Mesh(planetGeo, planetMat);
planet.position.set(-14, 6, -40);
scene.add(planet);

// ----- starfield -----
function makeStars(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 80 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    const t = Math.random();
    colors[i*3] = 0.7 + 0.3 * t;
    colors[i*3+1] = 0.7 + 0.3 * t;
    colors[i*3+2] = 1.0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
  return new THREE.Points(geo, mat);
}
const stars = makeStars(400);
scene.add(stars);

// ----- ship -----
const ship = new THREE.Group();
// fuselage
const fusGeo = new THREE.ConeGeometry(0.35, 1.2, 12);
const fusMat = new THREE.MeshStandardMaterial({ color: 0xa6c8ff, emissive: 0x224488, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.3 });
const fus = new THREE.Mesh(fusGeo, fusMat);
fus.rotation.x = -Math.PI / 2;
ship.add(fus);
// wings
const wingMat = new THREE.MeshStandardMaterial({ color: 0x405080, metalness: 0.7, roughness: 0.4 });
const wingGeo = new THREE.BoxGeometry(1.4, 0.06, 0.4);
const wing = new THREE.Mesh(wingGeo, wingMat);
wing.position.set(0, -0.05, 0.3);
ship.add(wing);
// cockpit
const cockGeo = new THREE.SphereGeometry(0.18, 12, 8);
const cockMat = new THREE.MeshStandardMaterial({ color: 0xff9ffc, emissive: 0xff66cc, emissiveIntensity: 0.8 });
const cockpit = new THREE.Mesh(cockGeo, cockMat);
cockpit.position.set(0, 0.15, -0.15);
ship.add(cockpit);
// engine glow (cone behind, bright color)
const glowGeo = new THREE.ConeGeometry(0.25, 0.6, 12);
const glowMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
const glow = new THREE.Mesh(glowGeo, glowMat);
glow.rotation.x = Math.PI / 2;
glow.position.set(0, 0, 0.85);
ship.add(glow);
ship.position.set(0, 0, 5);
scene.add(ship);

// ----- state -----
const state = {
  running: false,
  paused: false,
  over: false,
  score: 0,
  combo: 1,
  comboTimer: 0,
  lives: 3,
  time: 60,
  lastT: 0,
  shipX: 0,          // current smoothed x
  shipTargetX: 0,    // input target
  shipRoll: 0,       // visual roll
  asteroids: [],
  bullets: [],
  spawnTimer: 0,
  bulletCooldown: 0,
  flash: 0,          // hit flash
  shake: 0,          // screen shake timer
  particles: [],      // explosion fragments
};

const BEST_KEY = "stellar_strike_best_v1";
const best = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
bestEl.textContent = best;

function updateHud() {
  scoreEl.textContent = state.score;
  livesEl.textContent = "\u2665".repeat(Math.max(0, state.lives));
  comboEl.textContent = "x" + state.combo;
  timeEl.textContent = Math.max(0, Math.ceil(state.time)) + "s";
}

// ----- asteroid factory -----
const asteroidMats = [
  new THREE.MeshStandardMaterial({ color: 0x8a6a4a, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x5a6a7a, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x4a3a2a, flatShading: true })
];

function spawnAsteroid() {
  const geo = new THREE.IcosahedronGeometry(0.45 + Math.random() * 0.5, 0);
  const mesh = new THREE.Mesh(geo, asteroidMats[Math.floor(Math.random() * asteroidMats.length)]);
  mesh.position.set(
    (Math.random() - 0.5) * 12,
    (Math.random() - 0.5) * 4 + 0.5,
    -50
  );
  const speed = 18 + Math.random() * 14 + state.time * 0.1; // ramps with time
  mesh.userData = {
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 0.8,
    vz: speed,
    rx: Math.random() * 2,
    ry: Math.random() * 2,
    rz: Math.random() * 2
  };
  scene.add(mesh);
  state.asteroids.push(mesh);
}

// ----- audio (synthesized, no files) -----
let audioCtx = null;
function ensureAudio() {
  if (audioCtx) return audioCtx;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  return audioCtx;
}
function beep(freq, dur, type, vol) {
  const ctx = ensureAudio(); if (!ctx) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type || "square"; o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
}
function noiseBurst(dur, vol) {
  const ctx = ensureAudio(); if (!ctx) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = vol || 0.12;
  src.connect(g).connect(ctx.destination); src.start();
}

// ----- bullet -----
const bulletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
const bulletMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
function fireBullet() {
  beep(880, 0.06, "square", 0.05);
  const b = new THREE.Mesh(bulletGeo, bulletMat);
  b.rotation.x = Math.PI / 2;
  b.position.set(ship.position.x, ship.position.y, ship.position.z - 0.6);
  b.userData = { vz: -50 };
  scene.add(b);
  state.bullets.push(b);
}

// ----- controls -----
function setTarget(dx) {
  state.shipTargetX = Math.max(-5, Math.min(5, state.shipTargetX + dx));
}
document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowleft" || k === "a") { setTarget(-1); e.preventDefault(); }
  else if (k === "arrowright" || k === "d") { setTarget(1); e.preventDefault(); }
  else if (k === " ") { if (state.running) fireBullet(); else if (!state.over) startGame(); e.preventDefault(); }
  else if (k === "p") { togglePause(); e.preventDefault(); }
  else if (k === "r") { restartGame(); e.preventDefault(); }
  else if (k === "enter") { if (!state.over) startGame(); e.preventDefault(); }
});

// continuous press: simple auto-repeat by key state
const keyState = { left: false, right: false, space: false };
document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowleft" || k === "a") keyState.left = true;
  if (k === " ") keyState.space = true;
  if (k === "arrowright" || k === "d") keyState.right = true;
});
document.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowleft" || k === "a") keyState.left = false;
  if (k === " ") keyState.space = false;
  if (k === "arrowright" || k === "d") keyState.right = false;
});

// click / tap on canvas = fire; horizontal drag = move ship
let pointerDragging = false;
let pointerStartX = 0;
let pointerStartShipX = 0;
canvas.addEventListener("pointerdown", (e) => {
  if (!state.running) { if (!state.over) startGame(); return; }
  pointerDragging = true;
  pointerStartX = e.clientX;
  pointerStartShipX = state.shipX;
  fireBullet();
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointerDragging || !state.running) return;
  const w = canvas.clientWidth || canvas.width;
  const dx = (e.clientX - pointerStartX) / w * 14;
  state.shipTargetX = Math.max(-5, Math.min(5, pointerStartShipX + dx));
});
canvas.addEventListener("pointerup", () => { pointerDragging = false; });
canvas.addEventListener("pointercancel", () => { pointerDragging = false; });

// ----- game flow -----
function startGame() {
  if (state.running) return;
  state.running = true;
  state.paused = false;
  state.over = false;
  state.score = 0;
  state.combo = 1;
  state.comboTimer = 0;
  state.lives = 3;
  state.time = 60;
  state.shipX = 0;
  state.shipTargetX = 0;
  state.spawnTimer = 0;
  state.bulletCooldown = 0;
  // clear leftovers
  for (const a of state.asteroids) scene.remove(a);
  for (const b of state.bullets) scene.remove(b);
  for (const p of state.particles) scene.remove(p);
  state.asteroids.length = 0;
  state.bullets.length = 0;
  state.particles.length = 0;
  state.shake = 0;
  ship.position.set(0, 0, 5);
  ship.visible = true;
  updateHud();
  bannerEl.classList.remove("blink");
  bannerEl.textContent = "\u5f00\u6218\u3002\u5c04\u51fb\u9668\u77f3\uff0c\u907f\u5f00\u649e\u51fb\u3002";
  btnStart.textContent = "\u8fd0\u884c\u4e2d";
  btnStart.classList.remove("cta");
}

function togglePause() {
  if (!state.running && !state.paused) return;
  state.paused = !state.paused;
  if (state.paused) {
    bannerEl.textContent = "\u5df2\u6682\u505c\u3002\u6309 P \u7ee7\u7eed\u3002";
    btnPause.textContent = "\u7ee7\u7eed";
  } else {
    bannerEl.textContent = "\u7ee7\u7eed\u4e2d\u3002";
    btnPause.textContent = "\u6682\u505c";
  }
}

function restartGame() {
  startGame();
}

function gameOver() {
  state.over = true;
  state.running = false;
  if (state.score > best) {
    localStorage.setItem(BEST_KEY, String(state.score));
    bestEl.textContent = state.score;
  }
  bannerEl.textContent = "\u6e38\u620f\u7ed3\u675f\u3002\u5f53\u524d " + state.score + " \u5206\u3002\u6309 R \u6216\u70b9\u91cd\u5f00\u3002";
  bannerEl.classList.add("blink");
  btnStart.textContent = "\u5f00\u59cb\u6e38\u620f";
  btnStart.classList.add("cta");
}

// ----- main loop -----
function explodeFragments(x, y, z, color) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const geo = new THREE.TetrahedronGeometry(0.12 + Math.random() * 0.08);
    const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;
    const speed = 3 + Math.random() * 5;
    m.userData = {
      vx: Math.cos(theta) * Math.cos(phi) * speed,
      vy: Math.sin(phi) * speed,
      vz: Math.sin(theta) * Math.cos(phi) * speed,
      rx: Math.random() * 8,
      ry: Math.random() * 8,
      t: 0,
      life: 0.6 + Math.random() * 0.3
    };
    scene.add(m);
    state.particles.push(m);
  }
}

function loop(now) {
  const dt = state.lastT ? Math.min(0.05, (now - state.lastT) / 1000) : 0.016;
  state.lastT = now;
  const tSec = now / 1000;

  // continuous input
  if (state.running && !state.paused) {
    if (keyState.left) setTarget(-0.08);
    if (keyState.right) setTarget(0.08);
  }

  // ship smoothing
  state.shipX += (state.shipTargetX - state.shipX) * Math.min(1, dt * 8);
  state.shipRoll = (state.shipTargetX - state.shipX) * 0.15;
  ship.position.x = state.shipX;
  ship.rotation.z = -state.shipRoll;
  ship.rotation.y = state.shipRoll * 0.5;
  // engine pulse
  glow.scale.y = 0.8 + 0.3 * Math.sin(tSec * 30);

  if (state.running && !state.paused) {
    state.time -= dt;
    if (state.time <= 0) { state.time = 0; updateHud(); win(); return requestAnimationFrame(loop); }

    // spawn asteroids faster over time
    state.spawnTimer -= dt;
    const spawnInterval = Math.max(0.35, 1.4 - state.time * 0.015);
    if (state.spawnTimer <= 0 && state.asteroids.filter(a => !a.isFx).length < 30) { spawnAsteroid(); state.spawnTimer = spawnInterval; }

    // particles (explosion fragments + confetti + muzzle flashes)
    for (let pi = state.particles.length - 1; pi >= 0; pi--) {
      const p = state.particles[pi];
      const ud = p.userData;
      ud.t += dt;
      const k = ud.t / ud.life;
      // gravity if confetti
      if (ud.gravity) ud.vy -= ud.gravity * dt;
      p.position.x += ud.vx * dt;
      p.position.y += ud.vy * dt;
      p.position.z += ud.vz * dt;
      p.rotation.x += ud.rx * dt;
      p.rotation.y += ud.ry * dt;
      // muzzle flash grows briefly then fades
      if (ud.life < 0.2) {
        var scale = 1 + k * 3;
        p.scale.setScalar(scale);
        p.material.opacity = Math.max(0, 1 - k);
      } else {
        p.material.opacity = Math.max(0, 1 - k);
        p.scale.setScalar(1 + k * 0.5);
      }
      if (k >= 1) { scene.remove(p); state.particles.splice(pi, 1); }
    }

    // bullets
    state.bulletCooldown = Math.max(0, state.bulletCooldown - dt);
    if (state.bulletCooldown <= 0 && keyState.space) { fireBullet(); state.bulletCooldown = 0.18; }
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.position.z += b.userData.vz * dt;
      if (b.position.z < -55) { scene.remove(b); state.bullets.splice(i, 1); }
    }

    // asteroids
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      if (a.isFx) {
        a.mesh.userData.t += dt;
        const k = a.mesh.userData.t / a.mesh.userData.life;
        a.mesh.scale.setScalar(1 + k * 4);
        a.mesh.material.opacity = Math.max(0, 1 - k);
        if (k >= 1) { scene.remove(a.mesh); state.asteroids.splice(i, 1); }
        continue;
      }
      const ud = a.userData;
      a.position.x += ud.vx * dt;
      a.position.y += ud.vy * dt;
      a.position.z += ud.vz * dt;
      a.rotation.x += ud.rx * dt;
      a.rotation.y += ud.ry * dt;
      a.rotation.z += ud.rz * dt;
      // ship hit
      const dx = a.position.x - ship.position.x;
      const dy = a.position.y - ship.position.y;
      const dz = a.position.z - ship.position.z;
      if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.5 && Math.abs(dz) < 0.8) {
        explodeFragments(a.position.x, a.position.y, a.position.z, 0xff8866);
        scene.remove(a); state.asteroids.splice(i, 1);
        state.lives--;
        state.combo = 1;
        state.flash = 0.25;
        state.shake = 0.35;
        noiseBurst(0.25, 0.18);
        beep(120, 0.3, "sawtooth", 0.1);
        updateHud();
        if (state.lives <= 0) return gameOver();
        continue;
      }

      // bullet hit
      for (let j = state.bullets.length - 1; j >= 0; j--) {
        const b = state.bullets[j];
        const ddx = a.position.x - b.position.x;
        const ddy = a.position.y - b.position.y;
        const ddz = a.position.z - b.position.z;
        if (Math.abs(ddx) < 0.7 && Math.abs(ddy) < 0.7 && Math.abs(ddz) < 0.7) {
          explodeFragments(a.position.x, a.position.y, a.position.z, 0xfde68a);
          state.shake = Math.max(state.shake, 0.12);
          beep(440, 0.08, "square", 0.04);
          beep(220, 0.12, "triangle", 0.03);
          scene.remove(a); state.asteroids.splice(i, 1);
          scene.remove(b); state.bullets.splice(j, 1);
          state.score += 10 * state.combo;
          state.comboTimer = 2.0;
          updateHud();
          break;
        }
      }
      // off-screen cleanup
      if (a.position.z > 10 || a.position.z < -60) { scene.remove(a); state.asteroids.splice(i, 1); }
    }

    // combo decay
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 1;
    }
    // combo grows with consecutive hits within window
    // (simple: bump combo whenever a hit happened recently; capped at 8)
    if (state.combo > 1 && state.comboTimer > 1.5) {
      // ramp
      state.combo = Math.min(8, state.combo + Math.floor(dt * 2));
      updateHud();
    }

    updateHud();
  }

  // hit flash (fade)
  if (state.flash > 0) {
    state.flash = Math.max(0, state.flash - dt);
    scene.fog.color.setRGB(state.flash * 4, state.flash * 0.5, state.flash * 0.5);
  } else {
    scene.fog.color.setRGB(0, 0, 0.06);
  }

  // screen shake (camera offset)
  if (state.shake > 0) {
    state.shake = Math.max(0, state.shake - dt * 1.5);
    const amp = state.shake * 0.4;
    camera.position.x = (Math.random() - 0.5) * amp;
    camera.position.y = 1.6 + (Math.random() - 0.5) * amp;
  } else {
    camera.position.x = 0;
    camera.position.y = 1.6;
  }

  // distant planet slow spin + parallax stars
  planet.rotation.y += dt * 0.05;
  stars.rotation.z += dt * 0.005;

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function win() {
  state.over = true;
  state.running = false;
  if (state.score > best) { localStorage.setItem(BEST_KEY, String(state.score)); bestEl.textContent = state.score; }
  spawnConfetti();
  bannerEl.textContent = "\u751f\u5b58\u6210\u529f\uff01\u5f53\u524d " + state.score + " \u5206\u3002\u6309 R \u6216\u70b9\u91cd\u5f00\u3002";
  bannerEl.classList.remove("blink");
  btnStart.textContent = "\u518d\u6765\u4e00\u5c40";
  btnStart.classList.add("cta");
}

// ----- boot -----
btnStart.addEventListener("click", () => { if (!state.running) startGame(); });
btnPause.addEventListener("click", () => togglePause());
btnReset.addEventListener("click", () => restartGame());

// resize
window.addEventListener("resize", () => {
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
});

// hud chip intro
setTimeout(() => {
  const chips = document.querySelectorAll(".hud-chip, .pill-btn");
  chips.forEach((el, i) => setTimeout(() => el.classList.add("in"), 80 + i * 60));
}, 60);

updateHud();
bannerEl.textContent = "\u6309\u5f00\u59cb\u6e38\u620f\u300260 \u79d2\u5185\u5c04\u51fb\u5c3d\u591a\u7684\u9668\u77f3\u3002";
// pause game when tab hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.running && !state.paused) togglePause();
});
requestAnimationFrame(loop);
