// Lightfall - real WebGL/ogl port of the React Bits <Lightfall /> component.
// Plain DOM + ogl. No React, no htm, no JSX. <script type="module">.
//
// Public API:
//   window.Lightfall.mount(containerEl, options) -> { unmount() }
//   window.Lightfall.version
//
// options mirror the React Bits props:
//   colors, backgroundColor, speed, streakCount, streakWidth, streakLength,
//   glow, density, twinkle, zoom, backgroundGlow, opacity, mouseInteraction,
//   mouseStrength, mouseRadius, mouseDampening, paused, dpr, className, mixBlendMode

import { Renderer, Program, Mesh, Triangle } from './vendor/ogl.mjs';

const MAX_COLORS = 8;

function hexToRGB(hex) {
  const c = String(hex || '#000000').replace('#', '').padEnd(6, '0');
  return [
    parseInt(c.slice(0, 2), 16) / 255,
    parseInt(c.slice(2, 4), 16) / 255,
    parseInt(c.slice(4, 6), 16) / 255,
  ];
}

function prepColors(input) {
  const base = (input && input.length ? input : ['#A6C8FF', '#5227FF', '#FF9FFC']).slice(0, MAX_COLORS);
  const arr = [];
  for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
  const count = base.length;
  const avg = [0, 0, 0];
  for (let i = 0; i < count; i++) { avg[0] += arr[i][0]; avg[1] += arr[i][1]; avg[2] += arr[i][2]; }
  if (count) { avg[0] /= count; avg[1] /= count; avg[2] /= count; }
  return { arr, count, avg };
}

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Fragment shader mirrors the React Bits source.
// Up to 16 streak layers, per-streak color (evenly picked from uColor0..uColor7),
// per-streak twinkle, mouse light + mouse flare.
const fragment = `
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uBgColor;
uniform vec3  uMouseColor;
uniform float uSpeed;
uniform int   uStreakCount;
uniform float uStreakWidth;
uniform float uStreakLength;
uniform float uGlow;
uniform float uDensity;
uniform float uTwinkle;
uniform float uZoom;
uniform float uBgGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

// hash + PRNG seeded by streak index
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= iResolution.x / iResolution.y;
  uv /= max(0.1, uZoom * 0.5);

  float t = iTime * 0.3 * max(0.0, uSpeed);

  // Mouse position in same space as uv
  vec2 mp = vec2(0.0);
  bool hasMouse = uMouseEnabled > 0.5;
  if (hasMouse) {
    mp = (iMouse / iResolution.xy) * 2.0 - 1.0;
    mp.x *= iResolution.x / iResolution.y;
    mp /= max(0.1, uZoom * 0.5);
  }

  // Background ambient glow (radial-ish, tinted by uBgColor)
  float bgR = length(uv) * 0.6;
  vec3 col = uBgColor * (1.0 - bgR) * 0.25 * uBgGlow;

  // Streaks
  for (int s = 0; s < 16; s++) {
    if (s >= uStreakCount) break;
    float seed = float(s) * 7.31 + 1.7;

    // Deterministic per-streak parameters
    float xPos = (hash11(seed * 1.0) * 2.0 - 1.0) * 1.4;
    float speedMul = 0.5 + hash11(seed * 2.0) * 1.5;
    float widthMul = 0.5 + hash11(seed * 3.0) * 1.5;
    float twinklePhase = hash11(seed * 5.0) * 6.2831;
    float twinkleRate = 0.6 + hash11(seed * 7.0) * 2.5;
    float colorPick = hash11(seed * 11.0);

    vec2 p = uv;
    p.x -= xPos;
    p.y -= t * speedMul * 0.4;
    // vertical wrap
    p.y = mod(p.y + 2.0, 4.0) - 2.0;

    float dx = abs(p.x);
    float core = 1.0 - smoothstep(0.0, 0.005 * uStreakWidth * widthMul, dx);
    float tail = 1.0 - smoothstep(0.0, 0.5 * uStreakLength, max(0.0, p.y));
    float body = core * tail;

    // Twinkle
    float tw = 0.55 + 0.45 * sin(t * twinkleRate + twinklePhase) * min(1.5, uTwinkle);
    float intensity = body * tw * uGlow * 0.6;

    // Mouse flare
    if (hasMouse) {
      vec2 streakPos = vec2(xPos, p.y);
      float md = length(uv - mp);
      float flare = 1.0 - smoothstep(0.0, uMouseRadius * 1.5, md);
      intensity += body * flare * uMouseStrength * 0.8;
    }

    // Density packing
    intensity *= clamp(uDensity, 0.2, 3.0);

    vec3 streakColor = palette(colorPick);
    col += streakColor * intensity;
  }

  // Soft mouse light
  if (hasMouse) {
    float md = length(uv - mp);
    float m = 1.0 - smoothstep(0.0, uMouseRadius * 1.2, md);
    col += uMouseColor * m * uMouseStrength * 0.25;
  }

  col *= uOpacity;
  gl_FragColor = vec4(col, 1.0);
}
`;

function mount(container, options) {
  if (!container || container.nodeType !== 1) {
    throw new Error('Lightfall.mount: container must be a DOM element');
  }
  options = options || {};
  const colors = prepColors(options.colors);
  const backgroundColor = options.backgroundColor || '#0A29FF';
  const speed = options.speed != null ? options.speed : 1;
  const streakCount = Math.max(1, Math.min(16, Math.round(options.streakCount != null ? options.streakCount : 8)));
  const streakWidth = options.streakWidth != null ? options.streakWidth : 1;
  const streakLength = options.streakLength != null ? options.streakLength : 1;
  const glow = options.glow != null ? options.glow : 1;
  const density = options.density != null ? options.density : 1;
  const twinkle = options.twinkle != null ? options.twinkle : 1;
  const zoom = options.zoom != null ? options.zoom : 2;
  const backgroundGlow = options.backgroundGlow != null ? options.backgroundGlow : 1;
  const opacity = options.opacity != null ? options.opacity : 1;
  const mouseInteraction = options.mouseInteraction !== false;
  const mouseStrength = options.mouseStrength != null ? options.mouseStrength : 1;
  const mouseRadius = options.mouseRadius != null ? options.mouseRadius : 0.6;
  const mouseDampening = options.mouseDampening != null ? options.mouseDampening : 0.15;
  const paused = !!options.paused;
  const dpr = options.dpr || (window.devicePixelRatio || 1);

  // Style the container.
  const prevPos = container.style.position;
  if (!prevPos) container.style.position = 'relative';
  const prevOverflow = container.style.overflow;
  container.style.overflow = 'hidden';
  if (options.className) container.classList.add(...options.className.split(/\s+/).filter(Boolean));
  if (options.mixBlendMode) container.style.mixBlendMode = options.mixBlendMode;

  const renderer = new Renderer({ dpr, alpha: true });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const uniforms = {
    iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
    iMouse:       { value: [0, 0] },
    iTime:        { value: 0 },
    uColor0: { value: colors.arr[0] },
    uColor1: { value: colors.arr[1] },
    uColor2: { value: colors.arr[2] },
    uColor3: { value: colors.arr[3] },
    uColor4: { value: colors.arr[4] },
    uColor5: { value: colors.arr[5] },
    uColor6: { value: colors.arr[6] },
    uColor7: { value: colors.arr[7] },
    uColorCount: { value: colors.count },
    uBgColor:     { value: hexToRGB(backgroundColor) },
    uMouseColor:  { value: colors.avg },
    uSpeed:       { value: speed },
    uStreakCount: { value: streakCount },
    uStreakWidth: { value: streakWidth },
    uStreakLength:{ value: streakLength },
    uGlow:        { value: glow },
    uDensity:     { value: density },
    uTwinkle:     { value: twinkle },
    uZoom:        { value: zoom },
    uBgGlow:      { value: backgroundGlow },
    uOpacity:     { value: opacity },
    uMouseEnabled:{ value: mouseInteraction ? 1 : 0 },
    uMouseStrength:{ value: mouseStrength },
    uMouseRadius: { value: mouseRadius },
  };

  const program = new Program(gl, { vertex, fragment, uniforms });
  const geometry = new Triangle(gl);
  const mesh = new Mesh(gl, { geometry, program });

  const canvas = gl.canvas;
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  const resize = () => {
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const mouseTarget = [0, 0];
  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scale = renderer.dpr || 1;
    mouseTarget[0] = (e.clientX - rect.left) * scale;
    mouseTarget[1] = (rect.height - (e.clientY - rect.top)) * scale;
    if (mouseDampening <= 0) {
      uniforms.iMouse.value = [mouseTarget[0], mouseTarget[1]];
    }
  };
  if (mouseInteraction) {
    canvas.style.pointerEvents = 'auto';
    canvas.addEventListener('pointermove', onPointerMove);
  }

  let lastT = 0;
  let raf = 0;
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    uniforms.iTime.value = t * 0.001;
    if (mouseInteraction && mouseDampening > 0) {
      if (!lastT) lastT = t;
      const dt = (t - lastT) / 1000;
      lastT = t;
      const tau = Math.max(1e-4, mouseDampening);
      const factor = Math.min(1, 1 - Math.exp(-dt / tau));
      const cur = uniforms.iMouse.value;
      cur[0] += (mouseTarget[0] - cur[0]) * factor;
      cur[1] += (mouseTarget[1] - cur[1]) * factor;
    } else {
      lastT = t;
    }
    if (!paused) {
      try { renderer.render({ scene: mesh }); } catch (e) { console.error(e); }
    }
  };
  raf = requestAnimationFrame(loop);

  const callIfFn = (obj, key) => {
    if (obj && typeof obj[key] === 'function') obj[key].call(obj);
  };

  return {
    unmount() {
      cancelAnimationFrame(raf);
      if (mouseInteraction) canvas.removeEventListener('pointermove', onPointerMove);
      ro.disconnect();
      if (canvas.parentElement === container) container.removeChild(canvas);
      callIfFn(program, 'remove');
      callIfFn(geometry, 'remove');
      callIfFn(mesh, 'remove');
      callIfFn(renderer, 'destroy');
      container.style.overflow = prevOverflow;
      if (!prevPos) container.style.position = '';
    },
  };
}

window.Lightfall = {
  mount,
  version: 'webgl-ogl-1.0.0',
};