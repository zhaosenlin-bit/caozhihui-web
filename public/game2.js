// Cosmic Defender - vanilla JS canvas shooter
(() => {
  'use strict';

  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');

  // Logical (canvas internal) size; CSS scales it.
  const W = canvas.width;
  const H = canvas.height;

  // HUD
  const $score = document.getElementById('score');
  const $lives = document.getElementById('lives');
  const $combo = document.getElementById('combo');
  const $time  = document.getElementById('time');
  const $best  = document.getElementById('best');
  const $banner= document.getElementById('banner');

  const $btnStart = document.getElementById('btnStart');
  const $btnPause = document.getElementById('btnPause');
  const $btnReset = document.getElementById('btnReset');

  // ----- Intro: HUD fade-in (one-shot, no gameplay change) -----
  (function introHUD() {
    const chips = Array.from(document.querySelectorAll('.hud-chip, .pill-btn'));
    chips.forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 120 + i * 70);
    });
  })();

  // ----- Audio (synthesized, no network) -----
  let actx = null;
  function audio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = null; }
    }
    return actx;
  }
  function beep(freq, dur=0.08, type='square', vol=0.06) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(a.destination);
    const t = a.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const sfx = {
    shoot:  () => beep(880, 0.05, 'square', 0.05),
    hit:    () => beep(220, 0.12, 'sawtooth', 0.07),
    boom:   () => { beep(140, 0.18, 'sawtooth', 0.08); setTimeout(()=>beep(80, 0.25, 'triangle', 0.06), 30); },
    hurt:   () => beep(120, 0.30, 'sawtooth', 0.10),
    win:    () => { [523, 659, 784].forEach((f,i)=>setTimeout(()=>beep(f,0.18,'triangle',0.07), i*120)); },
    lose:   () => { [392, 311, 233].forEach((f,i)=>setTimeout(()=>beep(f,0.22,'sawtooth',0.08), i*140)); },
  };

  // ----- State -----
  const STATE = { IDLE:'idle', PLAY:'play', PAUSE:'pause', OVER:'over' };
  let state = STATE.IDLE;

  const ROUND_SECONDS = 60;
  const MAX_LIVES = 3;

  let score = 0;
  let lives = MAX_LIVES;
  let combo = 1;       // multiplier
  let comboTimer = 0;  // seconds remaining before combo resets
  let best = 0;
  try { best = parseInt(localStorage.getItem('cosmic_defender_best') || '0', 10) || 0; } catch(e){}
  $best.textContent = best;

  let timeLeft = ROUND_SECONDS;
  let spawnTimer = 0;
  let shootCooldown = 0;
  let invuln = 0;       // seconds of i-frames after hit
  let shake = 0;        // screen shake

  const player = { x: W/2, y: H - 70, w: 36, h: 40, speed: 380 };
  const bullets = [];
  const asteroids = [];
  const particles = [];
  const stars = makeStars();

  function makeStars() {
    const arr = [];
    for (let layer = 0; layer < 3; layer++) {
      const count = 60 + layer * 40;
      const speed = 18 + layer * 28;   // px/sec
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.4 + Math.random() * (1.4 + layer * 0.3),
          s: speed,
        });
      }
    }
    return arr;
  }

  // ----- Intro animation state (visual only) -----
  // Runs once on load. Does not affect gameplay rules/state machine.
  const intro = (function makeIntro() {
    const DURATION = 1.6;            // seconds total
    const startTs = performance.now();
    return {
      done: false,
      elapsed() { return Math.min(DURATION, (performance.now() - startTs) / 1000); },
      t() { return Math.min(1, (performance.now() - startTs) / 1000 / DURATION); },
      finishIfDone() {
        if (!this.done && this.elapsed() >= DURATION) {
          this.done = true;
          // Subtle title sheen passes across "Cosmic Defender" once during intro.
        }
      },
    };
  })();

  // ----- Input -----
  const keys = Object.create(null);
  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft','ArrowRight','Space','KeyA','KeyD','KeyP','KeyR'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    if (e.code === 'KeyP' && state === STATE.PLAY) pauseGame();
    else if (e.code === 'KeyP' && state === STATE.PAUSE) resumeGame();
    if (e.code === 'KeyR') resetGame();
  }, { passive: false });
  window.addEventListener('keyup',   (e) => { keys[e.code] = false; });

  // Mouse / touch fire
  function fireFromPointer(e) {
    if (state !== STATE.PLAY) return;
    fireBullet();
  }
  canvas.addEventListener('mousedown', fireFromPointer);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); fireFromPointer(e); }, { passive: false });

  // ----- Buttons -----
  $btnStart.addEventListener('click', () => { if (state === STATE.IDLE || state === STATE.OVER) startGame(); });
  $btnPause.addEventListener('click', () => {
    if (state === STATE.PLAY) pauseGame();
    else if (state === STATE.PAUSE) resumeGame();
  });
  $btnReset.addEventListener('click', resetGame);

  // ----- Game lifecycle -----
  function startGame() {
    // audio context unlock on user gesture
    const a = audio(); if (a && a.state === 'suspended') a.resume();
    score = 0; lives = MAX_LIVES; combo = 1; comboTimer = 0;
    timeLeft = ROUND_SECONDS; spawnTimer = 0; shootCooldown = 0; invuln = 0; shake = 0;
    bullets.length = 0; asteroids.length = 0; particles.length = 0;
    player.x = W/2;
    state = STATE.PLAY;
    $banner.textContent = 'Defend the cosmos. Use ← → or A/D to move, Space or click to fire.';
    // Stop the CTA pulse while playing.
    $btnStart.classList.remove('cta');
    updateHUD();
    lastTs = performance.now();
  }
  function pauseGame()  { state = STATE.PAUSE; $banner.textContent = 'Paused. Press P or Resume to continue.'; }
  function resumeGame() { state = STATE.PLAY;  $banner.textContent = 'Defend the cosmos.'; lastTs = performance.now(); }
  function resetGame()  {
    state = STATE.IDLE;
    score = 0; lives = MAX_LIVES; combo = 1; comboTimer = 0;
    timeLeft = ROUND_SECONDS; bullets.length = 0; asteroids.length = 0; particles.length = 0;
    player.x = W/2;
    $banner.textContent = 'Press Start Game to begin the 60 second round.';
    // Re-enable CTA pulse on idle.
    $btnStart.classList.add('cta');
    updateHUD();
  }
  function endGame(won) {
    state = STATE.OVER;
    if (score > best) {
      best = score;
      try { localStorage.setItem('cosmic_defender_best', String(best)); } catch(e){}
      $best.textContent = best;
    }
    if (won) { sfx.win(); $banner.textContent = `Round complete! Final score: ${score}. Press Start to play again.`; }
    else     { sfx.lose(); $banner.textContent = `You were destroyed. Final score: ${score}. Press Start to try again.`; }
  }

  // ----- HUD -----
  function updateHUD() {
    $score.textContent = score;
    $lives.textContent = '♥'.repeat(Math.max(0, lives)) + '<span class="opacity-30">♥</span>'.repeat(Math.max(0, MAX_LIVES - lives));
    $combo.textContent = 'x' + combo;
    $time.textContent  = Math.max(0, Math.ceil(timeLeft)) + 's';
  }
  function popCombo() {
    $combo.classList.remove('combo-pop');
    void $combo.offsetWidth;
    $combo.classList.add('combo-pop');
  }

  // ----- Spawning -----
  function spawnAsteroid() {
    const r = 14 + Math.random() * 22;
    const speed = 90 + Math.random() * 60 + (ROUND_SECONDS - timeLeft) * 4; // ramps up
    asteroids.push({
      x: r + Math.random() * (W - 2 * r),
      y: -r,
      r,
      vx: (Math.random() - 0.5) * 40,
      vy: speed,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 2.4,
      verts: makeAsteroidShape(r),
    });
  }
  function makeAsteroidShape(r) {
    const n = 8 + Math.floor(Math.random() * 4);
    const v = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.78 + Math.random() * 0.35);
      v.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
    }
    return v;
  }

  function fireBullet() {
    if (shootCooldown > 0) return;
    shootCooldown = 0.18;
    bullets.push({ x: player.x, y: player.y - player.h/2, vy: -560, w: 4, h: 12 });
    sfx.shoot();
  }

  function explode(x, y, color='#fde68a', n=18) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 220;
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.5 + Math.random() * 0.4,
        max:  0.5 + Math.random() * 0.4,
        color,
        r: 1 + Math.random() * 2.4,
      });
    }
  }

  // ----- Update -----
  let lastTs = performance.now();
  function loop(ts) {
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;

    if (state === STATE.PLAY) {
      // input
      const left  = keys['ArrowLeft']  || keys['KeyA'];
      const right = keys['ArrowRight'] || keys['KeyD'];
      if (left)  player.x -= player.speed * dt;
      if (right) player.x += player.speed * dt;
      player.x = Math.max(player.w/2, Math.min(W - player.w/2, player.x));
      if (keys['Space']) fireBullet();

      shootCooldown = Math.max(0, shootCooldown - dt);
      comboTimer = Math.max(0, comboTimer - dt);
      if (comboTimer === 0 && combo !== 1) { combo = 1; updateHUD(); }
      invuln = Math.max(0, invuln - dt);
      shake = Math.max(0, shake - dt * 4);

      // time
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; updateHUD(); endGame(true); }
      else { $time.textContent = Math.ceil(timeLeft) + 's'; }

      // spawn
      spawnTimer -= dt;
      const spawnInterval = Math.max(0.35, 1.1 - (ROUND_SECONDS - timeLeft) * 0.012);
      if (spawnTimer <= 0) { spawnAsteroid(); spawnTimer = spawnInterval; }

      // bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y += b.vy * dt;
        if (b.y < -20) bullets.splice(i, 1);
      }

      // asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.rot += a.vr * dt;
        if (a.y - a.r > H + 30) {
          // missed: combo breaks
          asteroids.splice(i, 1);
          if (combo > 1) { combo = 1; updateHUD(); }
          continue;
        }
        // collision: bullet
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + 6) {
            bullets.splice(j, 1);
            const gained = Math.round(50 * combo);
            score += gained;
            combo = Math.min(8, combo + 1);
            comboTimer = 2.5;
            explode(a.x, a.y, '#fde68a', 22);
            sfx.hit();
            asteroids.splice(i, 1);
            updateHUD();
            popCombo();
            break;
          }
        }
        if (!asteroids[i]) continue;
        // collision: player
        if (invuln <= 0) {
          const dx = a.x - player.x, dy = a.y - player.y;
          if (Math.hypot(dx, dy) < a.r + player.w * 0.45) {
            lives -= 1;
            invuln = 1.2;
            shake = 1;
            explode(player.x, player.y, '#fca5a5', 28);
            sfx.hurt();
            asteroids.splice(i, 1);
            updateHUD();
            if (lives <= 0) endGame(false);
          }
        }
      }

      // particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.985;    p.vy *= 0.985;
      }
    }

    // stars drift always
    for (const s of stars) {
      s.y += s.s * dt;
      if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
    }

    // ----- Render -----
    let sx = 0, sy = 0;
    if (shake > 0) { sx = (Math.random() - 0.5) * 10 * shake; sy = (Math.random() - 0.5) * 10 * shake; }
    ctx.save();
    ctx.translate(sx, sy);

    // bg
    ctx.fillStyle = '#000';
    ctx.fillRect(-20, -20, W + 40, H + 40);

    // stars
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 + s.r * 0.18})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    // Intro-only "warp" overlay: dark vignette + pulling star streaks.
    if (!intro.done) {
      const p = intro.t();
      const cx = W / 2, cy = H / 2;
      ctx.save();
      // dark vignette fades from 1 -> 0
      const vig = 1 - p;
      if (vig > 0) {
        const vg = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(W, H) * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, `rgba(0,0,0,${0.85 * vig})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }
      // inward streaks (only first half of intro)
      if (p < 0.7) {
        const sp = p / 0.7;
        const streaks = 36;
        for (let i = 0; i < streaks; i++) {
          const a = (i / streaks) * Math.PI * 2 + sp * 1.2;
          const inner = Math.max(8, 40 * (1 - sp));
          const outer = Math.max(W, H) * 0.6 * (1 - sp * 0.6);
          const sx0 = cx + Math.cos(a) * inner;
          const sy0 = cy + Math.sin(a) * inner;
          const sx1 = cx + Math.cos(a) * outer;
          const sy1 = cy + Math.sin(a) * outer;
          ctx.strokeStyle = `rgba(180,200,255,${0.55 * (1 - sp)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(sx0, sy0);
          ctx.lineTo(sx1, sy1);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // asteroids
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.beginPath();
      const v = a.verts;
      ctx.moveTo(v[0].x, v[0].y);
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
      ctx.closePath();
      const grd = ctx.createRadialGradient(-a.r*0.3, -a.r*0.3, a.r*0.1, 0, 0, a.r);
      grd.addColorStop(0, '#9aa3b2');
      grd.addColorStop(1, '#3b4252');
      ctx.fillStyle = grd; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }

    // bullets
    for (const b of bullets) {
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
      ctx.fillStyle = 'rgba(253,230,138,0.25)';
      ctx.fillRect(b.x - 1, b.y, 2, 14);
    }

    // particles
    for (const p of particles) {
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + a * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // player (with intro fly-in offset on Y)
    let py = player.y;
    if (!intro.done) {
      const tp = Math.min(1, intro.elapsed() / 1.2);
      // ease-out cubic
      const e = 1 - Math.pow(1 - tp, 3);
      py = (H + 80) + (player.y - (H + 80)) * e;
    }
    const blink = invuln > 0 && Math.floor(invuln * 12) % 2 === 0;
    if (!blink) {
      ctx.save();
      ctx.translate(player.x, py);
      // body
      ctx.beginPath();
      ctx.moveTo(0, -player.h/2);
      ctx.lineTo(player.w/2, player.h/2);
      ctx.lineTo(0, player.h/2 - 8);
      ctx.lineTo(-player.w/2, player.h/2);
      ctx.closePath();
      const pgrd = ctx.createLinearGradient(0, -player.h/2, 0, player.h/2);
      pgrd.addColorStop(0, '#cbd5e1');
      pgrd.addColorStop(1, '#475569');
      ctx.fillStyle = pgrd; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();
      // cockpit
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath(); ctx.arc(0, -2, 4, 0, Math.PI*2); ctx.fill();
      // thrust
      ctx.fillStyle = 'rgba(251,191,36,0.85)';
      ctx.beginPath();
      ctx.moveTo(-6, player.h/2);
      ctx.lineTo( 0, player.h/2 + 10 + Math.random()*8);
      ctx.lineTo( 6, player.h/2);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // Idle overlay (title + subtitle + CTA)
    if (state === STATE.IDLE) {
      const tp = Math.min(1, intro.elapsed() / 1.6); // 0..1 across intro
      ctx.save();
      ctx.globalAlpha = Math.min(1, 0.6 + tp * 0.4);
      ctx.fillStyle = `rgba(0,0,0,${0.55 - tp * 0.55})`;
      ctx.fillRect(0, 0, W, H);

      // Title with diagonal sheen sweep
      ctx.textAlign = 'center';
      const titleY = H/2 - 10;
      ctx.font = "italic 56px 'Instrument Serif', serif";
      ctx.fillStyle = '#fff';
      ctx.fillText('Cosmic Defender', W/2, titleY);
      // sheen
      if (tp > 0.15 && tp < 0.95) {
        const sheen = (tp - 0.15) / 0.8;     // 0..1
        const sx2 = -W * 0.5 + sheen * (W * 2);
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx2 - 80, titleY - 70, 160, 110);
        ctx.clip();
        const grd = ctx.createLinearGradient(sx2 - 80, titleY - 70, sx2 + 80, titleY + 40);
        grd.addColorStop(0, 'rgba(255,255,255,0)');
        grd.addColorStop(0.5, 'rgba(255,255,255,0.55)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(sx2 - 80, titleY - 70, 160, 110);
        ctx.restore();
      }

      // Subtitle (delayed)
      if (tp > 0.35) {
        ctx.globalAlpha = Math.min(1, (tp - 0.35) / 0.25);
        ctx.font = "16px Barlow, sans-serif";
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('60-second round · 3 lives · combo multiplier', W/2, H/2 + 22);
      }

      // CTA (more delayed, pulsing while intro)
      if (tp > 0.55) {
        ctx.globalAlpha = Math.min(1, (tp - 0.55) / 0.25);
        ctx.font = "14px Barlow, sans-serif";
        ctx.fillStyle = '#fde68a';
        ctx.fillText('Press Start Game', W/2, H/2 + 56);
      }
      ctx.restore();
    } else if (state === STATE.PAUSE) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = "italic 48px 'Instrument Serif', serif";
      ctx.fillText('Paused', W/2, H/2);
    } else if (state === STATE.OVER) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = "italic 44px 'Instrument Serif', serif";
      ctx.fillText(lives > 0 ? 'Round Complete' : 'Destroyed', W/2, H/2 - 10);
      ctx.font = "18px Barlow, sans-serif";
      ctx.fillText(`Final score: ${score}    Best: ${best}`, W/2, H/2 + 22);
    }

    ctx.restore();

    // mark intro done after first paint past duration
    intro.finishIfDone();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // expose for quick debugging in console
  window.__cosmic = { player, bullets, asteroids, particles, get score(){return score}, get lives(){return lives} };
})();