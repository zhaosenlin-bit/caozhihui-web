// Cosmic BGM - synthesized ambient music (no audio files, no deps)
// Drone + slow arpeggio + soft pad, runs after user clicks play (browser autoplay policy)

(function () {
  "use strict";

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) { console.warn("WebAudio not supported, BGM disabled"); return; }

  // ----- state -----
  var ctx = null;
  var masterGain = null;
  var nodes = [];          // oscillator/gain nodes we will stop on pause
  var isPlaying = false;
  var lfo = null;          // global slow modulation

  // ----- helpers -----
  function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function makeReverb() {
    // Fake reverb via a long noise impulse + convolver
    var len = ctx.sampleRate * 3.5;
    var impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var data = impulse.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    var conv = ctx.createConvolver();
    conv.buffer = impulse;
    return conv;
  }

  function startNote(midi, when, dur, gain, type) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.value = midiToHz(midi);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain || 0.06, when + 0.4);
    g.gain.linearRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(masterGain);
    o.start(when);
    o.stop(when + dur + 0.1);
    nodes.push(o, g);
    return o;
  }

  function startDrone() {
    // Base drone: 2 detuned sine oscillators around A2 (MIDI 45)
    var base = 45;
    var freqs = [base, base - 7, base + 12]; // root, fifth up an octave, octave
    freqs.forEach(function (m) {
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = midiToHz(m);
      o.detune.value = (Math.random() - 0.5) * 8;
      var g = ctx.createGain();
      g.gain.value = m === base ? 0.10 : 0.05;
      o.connect(g).connect(masterGain);
      o.start();
      nodes.push(o, g);
    });

    // Sub bass (low triangle, very quiet)
    var sub = ctx.createOscillator();
    sub.type = "triangle";
    sub.frequency.value = midiToHz(base - 12);
    var subG = ctx.createGain();
    subG.gain.value = 0.06;
    sub.connect(subG).connect(masterGain);
    sub.start();
    nodes.push(sub, subG);
  }

  // Cosmic pad - slow arpeggio in A minor pentatonic
  // A2 C3 D3 E3 G3 A3 C4 D4 E4
  var arp = [45, 48, 50, 52, 55, 57, 60, 62, 64, 67];

  function startArp() {
    // Walk the arpeggio, 8 notes per cycle, 1.5s per note
    var step = 0;
    function tick() {
      if (!isPlaying) return;
      var i = step % arp.length;
      // Pick mostly root / fifth / octave, occasionally higher
      var idx = (i < 4) ? [0, 2, 4, 5][i] : (i < 8) ? [3, 5, 0, 2][i - 4] : (i < 12) ? [4, 6, 1, 3][i - 8] : (i < 16) ? [2, 4, 5, 7][i - 12] : (i < 20) ? [5, 0, 3, 6][i - 16] : [0, 4, 2, 5][i - 20];
      startNote(arp[idx], ctx.currentTime, 1.3, 0.045, i % 3 === 0 ? "triangle" : "sine");
      step++;
      setTimeout(tick, 1500);
    }
    tick();
  }

  // Shimmer - occasional high bell-like note
  function startShimmer() {
    function tick() {
      if (!isPlaying) return;
      var m = 72 + Math.floor(Math.random() * 12); // C5..B5
      startNote(m, ctx.currentTime, 2.0, 0.022, "sine");
      setTimeout(tick, 7000 + Math.random() * 4000);
    }
    tick();
  }

  // Slow global filter sweep via LFO
  function startLFO() {
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.7;
    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08; // 12s cycle
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    nodes.push(lfo, lfoGain);
    return filter;
  }

  function play() {
    if (isPlaying) return;
    if (!ctx) {
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      var filter = startLFO();
      var reverb = makeReverb();
      var reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.35;
      masterGain.connect(filter);
      filter.connect(ctx.destination);
      filter.connect(reverb);
      reverb.connect(reverbGain).connect(ctx.destination);
      nodes.push(masterGain, filter, reverb, reverbGain);
    }
    if (ctx.state === "suspended") ctx.resume();
    isPlaying = true;
    // Fade in
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 1.5);
    startDrone();
    startArp();
    startShimmer();
  }

  function pause() {
    if (!isPlaying || !ctx) return;
    isPlaying = false;
    // Fade out then stop everything
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    setTimeout(function () {
      // Stop & disconnect all nodes
      nodes.forEach(function (n) {
        try { if (n.stop) n.stop(); } catch (e) {}
        try { n.disconnect(); } catch (e) {}
      });
      nodes = [];
      if (lfo) { try { lfo.stop(); } catch (e) {} lfo = null; }
    }, 600);
  }

  // Expose API
  window.CosmicBGM = { play: play, pause: pause, isPlaying: function () { return isPlaying; } };

  // ----- UI: floating music button (right-bottom corner) -----
  function ensureButton() {
    if (document.getElementById("cosmic-bgm-btn")) return;
    var btn = document.createElement("button");
    btn.id = "cosmic-bgm-btn";
    btn.setAttribute("aria-label", "Toggle background music");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:18px;height:18px;display:block;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    Object.assign(btn.style, {
      position: "fixed", right: "20px", bottom: "20px", zIndex: "9999",
      width: "44px", height: "44px", borderRadius: "9999px",
      background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer",
      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background .2s ease, transform .15s ease", opacity: "0.85"
    });
    btn.addEventListener("mouseenter", function () { btn.style.background = "rgba(255,255,255,0.12)"; btn.style.opacity = "1"; });
    btn.addEventListener("mouseleave", function () { btn.style.background = "rgba(255,255,255,0.06)"; btn.style.opacity = "0.85"; });
    btn.addEventListener("mousedown", function () { btn.style.transform = "scale(0.94)"; });
    btn.addEventListener("mouseup", function () { btn.style.transform = "scale(1)"; });
    btn.addEventListener("click", function () {
      if (isPlaying) { pause(); btn.dataset.playing = "0"; }
      else { play(); btn.dataset.playing = "1"; }
    });
    document.body.appendChild(btn);
  }

  // Boot
  function boot() {
    ensureButton();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
