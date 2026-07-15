import { Renderer, Triangle, Program, Mesh } from './vendor/ogl.mjs';

function setMat3FromEuler(yawY, pitchX, rollZ, out) {
  const cy = Math.cos(yawY);
  const sy = Math.sin(yawY);
  const cx = Math.cos(pitchX);
  const sx = Math.sin(pitchX);
  const cz = Math.cos(rollZ);
  const sz = Math.sin(rollZ);
  out[0] = cy * cz + sy * sx * sz;
  out[1] = cx * sz;
  out[2] = -sy * cz + cy * sx * sz;
  out[3] = -cy * sz + sy * sx * cz;
  out[4] = cx * cz;
  out[5] = sy * sz + cy * sx * cz;
  out[6] = sy * cx;
  out[7] = -sx;
  out[8] = cy * cx;
  return out;
}

function mount(container, options = {}) {
  if (!container || container.nodeType !== 1) {
    throw new Error('Prism.mount: container must be a DOM element');
  }

  const height = Math.max(0.001, options.height ?? 3.5);
  const baseWidth = Math.max(0.001, options.baseWidth ?? 5.5);
  const baseHalf = baseWidth * 0.5;
  const animationType = options.animationType ?? 'rotate';
  const glow = Math.max(0, options.glow ?? 1);
  const noise = Math.max(0, options.noise ?? 0.5);
  const scale = Math.max(0.001, options.scale ?? 3.6);
  const hueShift = options.hueShift ?? 0;
  const colorFrequency = Math.max(0, options.colorFrequency ?? 1);
  const bloom = Math.max(0, options.bloom ?? 1);
  const hoverStrength = Math.max(0, options.hoverStrength ?? 2);
  const inertia = Math.max(0, Math.min(1, options.inertia ?? 0.05));
  const timeScale = Math.max(0, options.timeScale ?? 0.5);
  const transparent = options.transparent !== false;
  const suspendWhenOffscreen = !!options.suspendWhenOffscreen;
  const offsetX = options.offset?.x ?? 0;
  const offsetY = options.offset?.y ?? 0;

  const renderer = new Renderer({
    dpr: Math.min(2, window.devicePixelRatio || 1),
    alpha: transparent,
    antialias: false,
  });
  const gl = renderer.gl;
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);

  const canvas = gl.canvas;
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const vertex = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragment = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uHeight;
    uniform float uBaseHalf;
    uniform mat3 uRot;
    uniform int uUseBaseWobble;
    uniform float uGlow;
    uniform vec2 uOffsetPx;
    uniform float uNoise;
    uniform float uSaturation;
    uniform float uScale;
    uniform float uHueShift;
    uniform float uColorFreq;
    uniform float uBloom;
    uniform float uCenterShift;
    uniform float uInvBaseHalf;
    uniform float uInvHeight;
    uniform float uMinAxis;
    uniform float uPxScale;
    uniform float uTimeScale;

    vec4 tanh4(vec4 x) {
      vec4 e2x = exp(2.0 * x);
      return (e2x - 1.0) / (e2x + 1.0);
    }

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float sdOctaAnisoInv(vec3 p) {
      vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
      float m = q.x + q.y + q.z - 1.0;
      return m * uMinAxis * 0.5773502691896258;
    }

    float sdPyramidUpInv(vec3 p) {
      return max(sdOctaAnisoInv(p), -p.y);
    }

    mat3 hueRotation(float a) {
      float c = cos(a), s = sin(a);
      mat3 W = mat3(
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114
      );
      mat3 U = mat3(
         0.701, -0.587, -0.114,
        -0.299,  0.413, -0.114,
        -0.300, -0.588,  0.886
      );
      mat3 V = mat3(
         0.168, -0.331,  0.500,
         0.328,  0.035, -0.500,
        -0.497,  0.296,  0.201
      );
      return W + U * c + V * s;
    }

    void main() {
      vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;
      float z = 5.0;
      float d = 0.0;
      vec3 p;
      vec4 o = vec4(0.0);
      mat2 wob = mat2(1.0);

      if (uUseBaseWobble == 1) {
        float t = iTime * uTimeScale;
        float c0 = cos(t + 0.0);
        float c1 = cos(t + 33.0);
        float c2 = cos(t + 11.0);
        wob = mat2(c0, c1, c2, c0);
      }

      for (int i = 0; i < 100; i++) {
        p = vec3(f, z);
        p.xz = p.xz * wob;
        p = uRot * p;
        vec3 q = p;
        q.y += uCenterShift;
        d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
        z -= d;
        o += (sin((p.y + z) * uColorFreq + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
      }

      o = tanh4(o * o * (uGlow * uBloom) / 1e5);
      vec3 col = o.rgb;
      float n = rand(gl_FragCoord.xy + vec2(iTime));
      col += (n - 0.5) * uNoise;
      col = clamp(col, 0.0, 1.0);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = clamp(mix(vec3(l), col, uSaturation), 0.0, 1.0);
      if (abs(uHueShift) > 0.0001) {
        col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
      }
      gl_FragColor = vec4(col, o.a);
    }
  `;

  const geometry = new Triangle(gl);
  const iResolution = new Float32Array(2);
  const offsetPx = new Float32Array(2);
  const rotation = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      iResolution: { value: iResolution },
      iTime: { value: 0 },
      uHeight: { value: height },
      uBaseHalf: { value: baseHalf },
      uRot: { value: rotation },
      uUseBaseWobble: { value: animationType === 'rotate' ? 1 : 0 },
      uGlow: { value: glow },
      uOffsetPx: { value: offsetPx },
      uNoise: { value: noise },
      uSaturation: { value: transparent ? 1.5 : 1 },
      uScale: { value: scale },
      uHueShift: { value: hueShift },
      uColorFreq: { value: colorFrequency },
      uBloom: { value: bloom },
      uCenterShift: { value: height * 0.25 },
      uInvBaseHalf: { value: 1 / baseHalf },
      uInvHeight: { value: 1 / height },
      uMinAxis: { value: Math.min(baseHalf, height) },
      uPxScale: { value: 1 },
      uTimeScale: { value: timeScale },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    const width = container.clientWidth || 1;
    const heightPx = container.clientHeight || 1;
    renderer.setSize(width, heightPx);
    iResolution[0] = gl.drawingBufferWidth;
    iResolution[1] = gl.drawingBufferHeight;
    offsetPx[0] = offsetX * (renderer.dpr || 1);
    offsetPx[1] = offsetY * (renderer.dpr || 1);
    program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * scale);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const wobbleX = 0.3 + Math.random() * 0.6;
  const wobbleY = 0.2 + Math.random() * 0.7;
  const wobbleZ = 0.1 + Math.random() * 0.5;
  const phaseX = Math.random() * Math.PI * 2;
  const phaseZ = Math.random() * Math.PI * 2;

  let yaw = 0;
  let pitch = 0;
  let roll = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let raf = 0;
  const startedAt = performance.now();
  const pointer = { x: 0, y: 0, inside: true };

  const onPointerMove = (event) => {
    const ww = Math.max(1, window.innerWidth);
    const wh = Math.max(1, window.innerHeight);
    pointer.x = Math.max(-1, Math.min(1, (event.clientX - ww * 0.5) / (ww * 0.5)));
    pointer.y = Math.max(-1, Math.min(1, (event.clientY - wh * 0.5) / (wh * 0.5)));
    pointer.inside = true;
  };
  const onPointerLeave = () => { pointer.inside = false; };

  if (animationType === 'hover') {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);
  }

  let io = null;
  const render = (timeNow) => {
    program.uniforms.iTime.value = (timeNow - startedAt) * 0.001;
    if (animationType === 'hover') {
      targetYaw = (pointer.inside ? -pointer.x : 0) * 0.6 * hoverStrength;
      targetPitch = (pointer.inside ? pointer.y : 0) * 0.6 * hoverStrength;
      yaw += (targetYaw - yaw) * inertia;
      pitch += (targetPitch - pitch) * inertia;
      roll += (0 - roll) * 0.1;
    } else if (animationType === '3drotate') {
      const tScaled = ((timeNow - startedAt) * 0.001) * timeScale;
      yaw = tScaled * wobbleY;
      pitch = Math.sin(tScaled * wobbleX + phaseX) * 0.6;
      roll = Math.sin(tScaled * wobbleZ + phaseZ) * 0.5;
    } else {
      yaw = 0;
      pitch = 0;
      roll = 0;
    }

    setMat3FromEuler(yaw, pitch, roll, rotation);
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(render);
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  if (suspendWhenOffscreen) {
    io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start();
      else stop();
    });
    io.observe(container);
  }
  start();

  return {
    unmount() {
      stop();
      ro.disconnect();
      if (io) io.disconnect();
      if (animationType === 'hover') {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('mouseleave', onPointerLeave);
        window.removeEventListener('blur', onPointerLeave);
      }
      if (canvas.parentElement === container) container.removeChild(canvas);
    },
  };
}

window.Prism = { mount };

