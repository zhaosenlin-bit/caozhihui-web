"use strict";
(function () {
  var canvas = document.getElementById("stage");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;
  var H = canvas.height;
  var COLS = 22;
  var ROWS = 14;
  var CELL = Math.min(Math.floor(W / COLS), Math.floor(H / ROWS));
  var GRID_W = CELL * COLS;
  var GRID_H = CELL * ROWS;
  var OFFSET_X = Math.floor((W - GRID_W) / 2);
  var OFFSET_Y = Math.floor((H - GRID_H) / 2);

  var scoreEl = document.getElementById("score");
  var lengthEl = document.getElementById("length");
  var speedEl = document.getElementById("speed");
  var bestEl = document.getElementById("best");
  var bannerEl = document.getElementById("banner");
  var btnStart = document.getElementById("btnStart");
  var btnPause = document.getElementById("btnPause");
  var btnReset = document.getElementById("btnReset");

  var BEST_KEY = "stellar_serpent_best_v1";
  var best = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
  bestEl.textContent = best;


  // state
  var snake = [];
  var dir = { x: 1, y: 0 };
  var nextDir = { x: 1, y: 0 };
  var food = { x: 0, y: 0 };
  var score = 0;
  var speedLevel = 1;
  var lastStep = 0;
  var state = "idle"; // idle | running | paused | over
  var stars = []; // background particles
  var eatParticles = []; // food eat bursts

  // init background stars
  for (var i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.7 + 0.2,
      tw: Math.random() * 0.04 + 0.005,
      phase: Math.random() * Math.PI * 2
    });
  }

  function placeFood() {
    while (true) {
      var fx = Math.floor(Math.random() * COLS);
      var fy = Math.floor(Math.random() * ROWS);
      var onSnake = false;
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === fx && snake[i].y === fy) { onSnake = true; break; }
      }
      if (!onSnake) { food.x = fx; food.y = fy; return; }
    }
  }

  function reset() {
    var cx = Math.floor(COLS / 2);
    var cy = Math.floor(ROWS / 2);
    snake = [{ x: cx - 1, y: cy }, { x: cx, y: cy }, { x: cx + 1, y: cy }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    speedLevel = 1;
    lastStep = 0;
    placeFood();
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = score;
    lengthEl.textContent = snake.length;
    speedEl.textContent = speedLevel;
  }

  function spawnEatParticles(gx, gy) {
    for (var i = 0; i < 12; i++) {
      var ang = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      var speed = 1.2 + Math.random() * 1.8;
      eatParticles.push({
        x: OFFSET_X + gx * CELL + CELL / 2,
        y: OFFSET_Y + gy * CELL + CELL / 2,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r: 1.5 + Math.random() * 2,
        life: 0.5 + Math.random() * 0.2,
        t: 0
      });
    }
  }

  function step() {
    // commit queued direction (no 180° reversal)
    if (!(nextDir.x === -dir.x && nextDir.y === -dir.y)) {
      dir = nextDir;
    }
    var head = snake[snake.length - 1];
    var nx = head.x + dir.x;
    var ny = head.y + dir.y;
    // wall collision
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) { return gameOver(); }
    // self collision (skip tail because it will move)
    for (var i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === nx && snake[i].y === ny) { return gameOver(); }
    }
    snake.push({ x: nx, y: ny });
    if (nx === food.x && ny === food.y) {
      spawnEatParticles(food.x, food.y);
      score += 10;
      if (snake.length % 5 === 0 && speedLevel < 7) speedLevel++;
      placeFood();
      updateHud();
    } else {
      snake.shift();
    }
  }

  function gameOver() {
    state = "over";
    if (score > best) { best = score; localStorage.setItem(BEST_KEY, String(best)); bestEl.textContent = best; }
    bannerEl.textContent = "\u6e38\u620f\u7ed3\u675f\u3002\u5f53\u524d " + score + " \u5206\u3002\u6309 R \u6216\u70b9\u91cd\u5f00\u91cd\u65b0\u5f00\u59cb\u3002";
    bannerEl.classList.add("blink");
  }

  function stepInterval() {
    // 200ms at level 1, decreasing ~8ms per level, capped at 7 (100ms floor)
    return Math.max(100, 208 - speedLevel * 8);
  }

  function draw(now) {
    // bg
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, H);

    // twinkling background stars
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.phase += s.tw;
      var a = s.a * (0.6 + 0.4 * Math.sin(s.phase));
      ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // playfield border
    ctx.strokeStyle = "rgba(166,200,255,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(OFFSET_X - 1, OFFSET_Y - 1, GRID_W + 2, GRID_H + 2);

    // grid hint
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= COLS; gx++) {
      ctx.beginPath();
      ctx.moveTo(OFFSET_X + gx * CELL + 0.5, OFFSET_Y);
      ctx.lineTo(OFFSET_X + gx * CELL + 0.5, OFFSET_Y + GRID_H);
      ctx.stroke();
    }
    for (var gy = 0; gy <= ROWS; gy++) {
      ctx.beginPath();
      ctx.moveTo(OFFSET_X, OFFSET_Y + gy * CELL + 0.5);
      ctx.lineTo(OFFSET_X + GRID_W, OFFSET_Y + gy * CELL + 0.5);
      ctx.stroke();
    }

    // food (rotating star)
    var t = now * 0.003;
    var fx = OFFSET_X + food.x * CELL + CELL / 2;
    var fy = OFFSET_Y + food.y * CELL + CELL / 2;
    var fr = CELL * 0.36;
    var pulse = 1 + 0.12 * Math.sin(t * 3);
    var grad = ctx.createRadialGradient(fx, fy, 2, fx, fy, fr * pulse);
    grad.addColorStop(0, "rgba(255,250,200,1)");
    grad.addColorStop(0.4, "rgba(253,224,71,0.95)");
    grad.addColorStop(1, "rgba(253,224,71,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, fr * pulse, 0, Math.PI * 2);
    ctx.fill();
    // star spikes
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(t * 0.6);
    ctx.fillStyle = "rgba(255,250,200,0.9)";
    for (var k = 0; k < 4; k++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -fr * 0.8);
      ctx.lineTo(fr * 0.18, -fr * 0.18);
      ctx.lineTo(0, 0);
      ctx.lineTo(-fr * 0.18, -fr * 0.18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // snake body
    var n = snake.length;
    for (var j = 0; j < n; j++) {
      var seg = snake[j];
      var sx = OFFSET_X + seg.x * CELL + CELL / 2;
      var sy = OFFSET_Y + seg.y * CELL + CELL / 2;
      var isHead = (j === n - 1);
      var pad = CELL * 0.12;
      var size = CELL - pad * 2;
      var t01 = n > 1 ? j / (n - 1) : 0;
      var hue = isHead ? 195 : (170 - t01 * 70);
      var sat = isHead ? 90 : 80;
      var light = isHead ? 65 : (60 - t01 * 10);
      ctx.fillStyle = "hsla(" + hue + "," + sat + "%," + light + "%,0.95)";
      roundRect(ctx, sx - size / 2, sy - size / 2, size, size, Math.min(8, size * 0.3));
      ctx.fill();
      // glow on head
      if (isHead) {
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1.5;
        roundRect(ctx, sx - size / 2, sy - size / 2, size, size, Math.min(8, size * 0.3));
        ctx.stroke();
        // eyes
        ctx.fillStyle = "#0b0f1e";
        var eyeOff = CELL * 0.18;
        var eyeR = CELL * 0.07;
        var ex1 = sx + dir.x * eyeOff - dir.y * eyeOff * 0.6;
        var ey1 = sy + dir.y * eyeOff - dir.x * eyeOff * 0.6;
        var ex2 = sx + dir.x * eyeOff + dir.y * eyeOff * 0.6;
        var ey2 = sy + dir.y * eyeOff + dir.x * eyeOff * 0.6;
        ctx.beginPath(); ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2); ctx.fill();
      }
    }

    // eat particles
    for (var ei = eatParticles.length - 1; ei >= 0; ei--) {
      var ep = eatParticles[ei];
      ep.t += 1 / 60;
      var k = ep.t / ep.life;
      ep.x += ep.vx;
      ep.y += ep.vy;
      ep.vx *= 0.95;
      ep.vy *= 0.95;
      ctx.fillStyle = "rgba(253,224,71," + (1 - k).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, ep.r * (1 - k * 0.5), 0, Math.PI * 2);
      ctx.fill();
      if (k >= 1) eatParticles.splice(ei, 1);
    }

    // paused / over overlay
    if (state === "paused" || state === "over") {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(OFFSET_X, OFFSET_Y, GRID_W, GRID_H);
      ctx.fillStyle = "#fff";
      ctx.font = "italic 600 48px Instrument Serif, serif";
      ctx.textAlign = "center";
      ctx.fillText(state === "paused" ? "\u5df2\u6682\u505c" : "\u6e38\u620f\u7ed3\u675f", W / 2, H / 2 - 10);
      ctx.font = "300 22px Barlow, sans-serif";
      ctx.fillText(state === "paused" ? "\u6309 P \u7ee7\u7eed" : "\u5f53\u524d " + score + "  \u00b7  \u6700\u9ad8 " + best, W / 2, H / 2 + 28);
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function loop(now) {
    if (state === "running") {
      var interval = stepInterval();
      if (!lastStep) lastStep = now;
      if (now - lastStep >= interval) { step(); lastStep = now; }
    }
    draw(now || 0);
    requestAnimationFrame(loop);
  }

  function startGame() {
    if (state === "running") return;
    if (state === "over" || state === "idle") reset();
    state = "running";
    lastStep = 0;
    bannerEl.classList.remove("blink");
    bannerEl.textContent = "\u5403\u6389\u661f\u661f\u3002P \u6682\u505c\uff0cR \u91cd\u5f00\u3002";
    btnStart.textContent = "\u8fd0\u884c\u4e2d";
    btnStart.classList.remove("cta");
  }

  function pauseGame() {
    if (state !== "running" && state !== "paused") return;
    if (state === "running") { state = "paused"; bannerEl.textContent = "\u5df2\u6682\u505c\u3002\u6309 P \u7ee7\u7eed\u3002"; btnPause.textContent = "\u7ee7\u7eed"; }
    else { state = "running"; lastStep = 0; bannerEl.textContent = "\u7ee7\u7eed\u3002"; btnPause.textContent = "\u6682\u505c"; }
  }

  function restartGame() {
    reset();
    state = "running";
    lastStep = 0;
    bannerEl.classList.remove("blink");
    bannerEl.textContent = "\u5df2\u91cd\u5f00\u3002";
    btnStart.textContent = "\u8fd0\u884c\u4e2d";
    btnStart.classList.remove("cta");
    btnPause.textContent = "\u6682\u505c";
  }

  // input
  function setDir(x, y) {
    if (state !== "running") return;
    if (x === -dir.x && y === -dir.y) return; // no 180
    nextDir = { x: x, y: y };
  }

  document.addEventListener("keydown", function (e) {
    var k = e.key.toLowerCase();
    if (k === "arrowup" || k === "w") { setDir(0, -1); e.preventDefault(); }
    else if (k === "arrowdown" || k === "s") { setDir(0, 1); e.preventDefault(); }
    else if (k === "arrowleft" || k === "a") { setDir(-1, 0); e.preventDefault(); }
    else if (k === "arrowright" || k === "d") { setDir(1, 0); e.preventDefault(); }
    else if (k === "p") { pauseGame(); e.preventDefault(); }
    else if (k === "r") { restartGame(); e.preventDefault(); }
    else if (k === " " || k === "enter") {
      if (state === "idle" || state === "over") startGame();
      e.preventDefault();
    }
  });

  // touch swipe
  var touchStart = null;
  canvas.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) { touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
  }, { passive: true });
  canvas.addEventListener("touchmove", function (e) { if (e.touches.length === 1) touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  canvas.addEventListener("touchend", function (e) {
    if (!touchStart) return;
    var t = (e.changedTouches && e.changedTouches[0]) || null;
    if (!t) { touchStart = null; return; }
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) { touchStart = null; return; }
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
    else setDir(0, dy > 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });

  btnStart.addEventListener("click", startGame);
  btnPause.addEventListener("click", pauseGame);
  btnReset.addEventListener("click", restartGame);

  // hud chip intro
  setTimeout(function () {
    var chips = document.querySelectorAll(".hud-chip, .pill-btn");
    for (var i = 0; i < chips.length; i++) {
      (function (el, idx) {
        setTimeout(function () { el.classList.add("in"); }, 80 + idx * 60);
      })(chips[i], i);
    }
  }, 60);

  // boot
  reset();
  state = "idle";
  // pause when tab hidden (auto-resume via existing togglePause on visibility return)
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state === "running") pauseGame();
  });
  requestAnimationFrame(loop);
})();
