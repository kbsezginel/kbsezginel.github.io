/* Polyrhythm — orbital rhythm machine.
   Pure Web Audio: a lookahead scheduler drives synthesized percussion,
   and the renderer reads the audio clock so sight and sound never drift.
   One revolution = one bar of four beats at the shown BPM. */

(() => {
  'use strict';

  // ---------------- constants ----------------

  const PALETTE = ['#f4c15d', '#62cdbb', '#e4785a', '#a08bf5', '#e183a8', '#6faee3', '#7ddb7d', '#d78ce6'];
  const SOUNDS = [
    ['click', 'Click'],
    ['wood', 'Woodblock'],
    ['drum', 'Drum'],
    ['hat', 'Hi-hat'],
    ['rim', 'Rim'],
    ['chime', 'Chime'],
    ['clave', 'Clave'],
    ['cowbell', 'Cowbell'],
    ['shaker', 'Shaker'],
    ['snare', 'Snare'],
    ['tom', 'Tom'],
    ['bell', 'Bell'],
    ['sonar', 'Sonar'],
  ];
  const NEW_BEATS = [5, 7, 2, 6, 8, 9, 10, 11];
  const MAX_LAYERS = 8;
  const MAX_BEATS = 16;
  const HORIZON = 0.12;   // s scheduled ahead
  const TICK = 25;        // ms scheduler interval

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  // ---------------- state ----------------

  const state = {
    bpm: 90,
    view: 'orbit',    // 'orbit' | 'linear'
    started: false,   // has the transport ever run
    playing: false,
    phase0: 0,        // audio-clock time at cycle position 0
    layers: [],
  };

  let layerSeq = 0;

  const cycleLen = () => 240 / state.bpm; // one bar of four beats

  // ---------------- audio ----------------

  const audio = { ctx: null, master: null, noise: null };
  let schedTimer = null;
  let pendingHits = [];   // { t, layer, node }

  function ensureAudio() {
    if (audio.ctx) return;
    // iOS: route as media playback so the ring/silent switch doesn't mute us
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    master.connect(limiter).connect(ctx.destination);

    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    audio.ctx = ctx;
    audio.master = master;
    audio.noise = noise;
    state.layers.forEach(attachGain);
  }

  function attachGain(layer) {
    if (!audio.ctx || layer.gain) return;
    layer.gain = audio.ctx.createGain();
    layer.gain.gain.value = layer.muted ? 0 : levelToGain(layer.level);
    layer.gain.connect(audio.master);
  }

  const levelToGain = (level) => Math.pow(level / 100, 2);

  // --- synthesized voices: fn(t, out, vel) ---

  function tone(t, out, { freq, freqEnd, type = 'sine', peak, decay }) {
    const ctx = audio.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + decay);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  }

  function burst(t, out, { filter, freq, q = 1, peak, decay }) {
    const ctx = audio.ctx;
    const src = ctx.createBufferSource();
    src.buffer = audio.noise;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + decay + 0.05);
  }

  const VOICES = {
    click(t, out, v) {
      tone(t, out, { freq: 1850, peak: 0.5 * v, decay: 0.03 });
      tone(t, out, { freq: 3700, peak: 0.15 * v, decay: 0.015 });
    },
    wood(t, out, v) {
      tone(t, out, { freq: 820, peak: 0.6 * v, decay: 0.07 });
      tone(t, out, { freq: 1250, peak: 0.35 * v, decay: 0.045 });
      burst(t, out, { filter: 'highpass', freq: 2000, peak: 0.12 * v, decay: 0.01 });
    },
    drum(t, out, v) {
      tone(t, out, { freq: 165, freqEnd: 48, peak: 0.9 * v, decay: 0.32 });
      burst(t, out, { filter: 'lowpass', freq: 900, peak: 0.15 * v, decay: 0.008 });
    },
    hat(t, out, v) {
      burst(t, out, { filter: 'highpass', freq: 7500, peak: 0.35 * v, decay: 0.05 });
    },
    rim(t, out, v) {
      burst(t, out, { filter: 'bandpass', freq: 3400, q: 9, peak: 0.5 * v, decay: 0.06 });
      tone(t, out, { freq: 1650, peak: 0.2 * v, decay: 0.02 });
    },
    chime(t, out, v) {
      tone(t, out, { freq: 880, peak: 0.3 * v, decay: 0.5 });
      tone(t, out, { freq: 1760, peak: 0.12 * v, decay: 0.3 });
      tone(t, out, { freq: 2637, peak: 0.06 * v, decay: 0.25 });
    },
    clave(t, out, v) {
      tone(t, out, { freq: 2500, peak: 0.45 * v, decay: 0.05 });
      tone(t, out, { freq: 1667, peak: 0.15 * v, decay: 0.03 });
    },
    cowbell(t, out, v) { // two detuned squares, the 808 recipe
      tone(t, out, { freq: 540, type: 'square', peak: 0.2 * v, decay: 0.15 });
      tone(t, out, { freq: 835, type: 'square', peak: 0.2 * v, decay: 0.1 });
    },
    shaker(t, out, v) {
      burst(t, out, { filter: 'bandpass', freq: 4500, q: 2, peak: 0.3 * v, decay: 0.1 });
    },
    snare(t, out, v) {
      burst(t, out, { filter: 'bandpass', freq: 1800, q: 0.8, peak: 0.5 * v, decay: 0.16 });
      burst(t, out, { filter: 'highpass', freq: 5000, peak: 0.2 * v, decay: 0.1 });
      tone(t, out, { freq: 185, peak: 0.35 * v, decay: 0.1 });
    },
    tom(t, out, v) {
      tone(t, out, { freq: 260, freqEnd: 110, peak: 0.8 * v, decay: 0.28 });
      burst(t, out, { filter: 'lowpass', freq: 1200, peak: 0.1 * v, decay: 0.01 });
    },
    bell(t, out, v) { // inharmonic partials read as metal
      tone(t, out, { freq: 660, peak: 0.22 * v, decay: 0.7 });
      tone(t, out, { freq: 1822, peak: 0.12 * v, decay: 0.5 });
      tone(t, out, { freq: 3564, peak: 0.05 * v, decay: 0.35 });
    },
    sonar(t, out, v) { // ping plus a quieter echo
      tone(t, out, { freq: 1175, peak: 0.3 * v, decay: 0.3 });
      tone(t + 0.13, out, { freq: 1175, peak: 0.12 * v, decay: 0.25 });
    },
  };

  // --- lookahead scheduler ---
  // layer.step counts beats as integers: hit time = phase0 + (step / beats) * cycleLen.

  // hidden tabs throttle timers to >=1s, so schedule further ahead there
  let horizon = HORIZON;
  document.addEventListener('visibilitychange', () => {
    horizon = document.hidden ? 1.5 : HORIZON;
    if (state.playing) schedule();
  });

  function schedule() {
    const ctx = audio.ctx;
    if (!ctx || !state.playing) return;
    const until = ctx.currentTime + horizon;
    for (const layer of state.layers) {
      let t = state.phase0 + (layer.step / layer.beats) * cycleLen();
      while (t < until) {
        if (!layer.muted) {
          const node = layer.step % layer.beats;
          const vel = node === 0 ? 1.15 : 1; // gentle downbeat accent
          VOICES[layer.sound](t, layer.gain, vel);
          pendingHits.push({ t, layer, node });
        }
        layer.step++; // keep counting while muted so unmute rejoins in phase
        t = state.phase0 + (layer.step / layer.beats) * cycleLen();
      }
    }
  }

  function currentUnits() {
    return (audio.ctx.currentTime - state.phase0) / cycleLen();
  }

  function realignStep(layer) {
    if (!state.started || !audio.ctx) { layer.step = 0; return; }
    layer.step = Math.max(0, Math.ceil(currentUnits() * layer.beats - 1e-9));
  }

  // ---------------- transport ----------------

  const playBtn = document.getElementById('playBtn');

  function setPlaying(playing) {
    state.playing = playing;
    document.body.classList.toggle('playing', playing);
    playBtn.setAttribute('aria-pressed', String(playing));
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    clearInterval(schedTimer);
    if (playing) {
      schedule();
      schedTimer = setInterval(schedule, TICK);
    }
  }

  function togglePlay() {
    ensureAudio();
    const ctx = audio.ctx;
    if (!state.started) {
      // init synchronously so a rapid second press can't race the resume promise
      state.started = true;
      state.phase0 = ctx.currentTime + 0.06;
      state.layers.forEach((l) => { l.step = 0; });
      ctx.resume();
      setPlaying(true);
    } else if (state.playing) {
      ctx.suspend(); // freezes the audio clock: sound, satellites and hits all pause in place
      setPlaying(false);
    } else {
      ctx.resume();
      setPlaying(true);
    }
  }

  playBtn.addEventListener('click', togglePlay);

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.target.tagName)) return;
    e.preventDefault();
    togglePlay();
  });

  // ---------------- layers & rack ----------------

  const layersEl = document.getElementById('layers');
  const addBtn = document.getElementById('addBtn');
  const ratioEl = document.getElementById('ratioVal');
  const periodEl = document.getElementById('periodVal');
  const bpmRange = document.getElementById('bpmRange');
  const bpmVal = document.getElementById('bpmVal');

  function nextDefault() {
    const usedBeats = state.layers.map((l) => l.beats);
    const usedColors = state.layers.map((l) => l.color);
    const usedSounds = state.layers.map((l) => l.sound);
    return {
      beats: NEW_BEATS.find((b) => !usedBeats.includes(b)) || 5,
      color: PALETTE.find((c) => !usedColors.includes(c)) || PALETTE[state.layers.length % PALETTE.length],
      sound: (SOUNDS.find(([id]) => !usedSounds.includes(id)) ||
              SOUNDS[state.layers.length % SOUNDS.length])[0],
    };
  }

  function addLayer(opts = {}) {
    if (state.layers.length >= MAX_LAYERS) return;
    const def = nextDefault();
    const layer = {
      id: layerSeq++,
      beats: opts.beats ?? def.beats,
      sound: opts.sound ?? def.sound,
      level: opts.level ?? 70,
      color: opts.color ?? def.color,
      muted: false,
      step: 0,
      lastHit: [],
      gain: null,
      stripEl: null,
      muteBtn: null,
    };
    layer.lastHit = new Array(layer.beats).fill(-1);
    attachGain(layer);
    realignStep(layer);
    state.layers.push(layer);
    layersEl.appendChild(buildStrip(layer));
    syncRack();
  }

  function removeLayer(layer, el) {
    state.layers = state.layers.filter((l) => l !== layer);
    if (layer.gain) layer.gain.disconnect();
    el.remove();
    syncRack();
  }

  // single source of truth for mute, shared by the strip button and orbit clicks
  function setMuted(layer, muted) {
    layer.muted = muted;
    if (layer.muteBtn) {
      layer.muteBtn.setAttribute('aria-pressed', String(muted));
      layer.muteBtn.setAttribute('aria-label', muted ? 'Unmute orbit' : 'Mute orbit');
      layer.muteBtn.title = muted ? 'Unmute' : 'Mute';
    }
    if (layer.stripEl) layer.stripEl.classList.toggle('is-muted', muted);
    // zero the channel gain too, so hits already scheduled go silent at once
    if (layer.gain) layer.gain.gain.value = muted ? 0 : levelToGain(layer.level);
    syncRack();
  }

  function buildStrip(layer) {
    const el = document.createElement('div');
    el.className = 'strip';
    el.style.setProperty('--c', layer.color);
    el.innerHTML =
      '<div class="strip__row">' +
        '<span class="strip__dot"></span>' +
        '<button class="stepper" data-act="dec" aria-label="Fewer beats">&minus;</button>' +
        '<span class="strip__count">' + layer.beats + '</span>' +
        '<button class="stepper" data-act="inc" aria-label="More beats">+</button>' +
        '<select class="strip__sound" aria-label="Sound">' +
          SOUNDS.map(([id, label]) =>
            '<option value="' + id + '"' + (id === layer.sound ? ' selected' : '') + '>' + label + '</option>'
          ).join('') +
        '</select>' +
        '<button class="strip__remove" aria-label="Remove orbit">&times;</button>' +
      '</div>' +
      '<div class="strip__level">' +
        '<span class="strip__level-label">level</span>' +
        '<input type="range" min="0" max="100" value="' + layer.level + '" aria-label="Level">' +
        '<button class="strip__mute" aria-label="Mute orbit" aria-pressed="false" title="Mute">' +
          '<svg class="ico-on" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M4 9v6h4l5 4V5L8 9H4z"/>' +
            '<path class="ico-wave" d="M16.5 8.5a5 5 0 0 1 0 7"/>' +
          '</svg>' +
          '<svg class="ico-off" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M4 9v6h4l5 4V5L8 9H4z"/>' +
            '<path class="ico-x" d="M16.5 9.5l5 5m0-5l-5 5"/>' +
          '</svg>' +
        '</button>' +
      '</div>';

    const countEl = el.querySelector('.strip__count');
    el.querySelectorAll('.stepper').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.act === 'inc' ? 1 : -1;
        layer.beats = Math.min(MAX_BEATS, Math.max(1, layer.beats + delta));
        layer.lastHit = new Array(layer.beats).fill(-1);
        realignStep(layer);
        countEl.textContent = layer.beats;
        syncRack();
      });
    });
    el.querySelector('.strip__sound').addEventListener('change', (e) => {
      layer.sound = e.target.value;
    });
    el.querySelector('input[type="range"]').addEventListener('input', (e) => {
      layer.level = +e.target.value;
      if (layer.gain && !layer.muted) layer.gain.gain.value = levelToGain(layer.level);
    });
    layer.stripEl = el;
    layer.muteBtn = el.querySelector('.strip__mute');
    layer.muteBtn.addEventListener('click', () => setMuted(layer, !layer.muted));
    el.querySelector('.strip__remove').addEventListener('click', () => removeLayer(layer, el));
    return el;
  }

  function syncRack() {
    ratioEl.innerHTML = state.layers.length
      ? state.layers
          .map((l) => (l.muted ? '<span class="dim">' + l.beats + '</span>' : l.beats))
          .join(' : ')
      : '&mdash;';
    periodEl.textContent = cycleLen().toFixed(2) + ' s';
    addBtn.disabled = state.layers.length >= MAX_LAYERS;
    let empty = layersEl.querySelector('.rack__empty');
    if (!state.layers.length && !empty) {
      empty = document.createElement('p');
      empty.className = 'rack__empty';
      empty.textContent = 'No orbits. Add one to begin.';
      layersEl.appendChild(empty);
    } else if (state.layers.length && empty) {
      empty.remove();
    }
  }

  addBtn.addEventListener('click', () => addLayer());

  // --- view toggle: orbital or linear ---

  const viewButtons = {
    orbit: document.getElementById('viewOrbit'),
    linear: document.getElementById('viewLinear'),
  };

  function setView(view) {
    state.view = view;
    document.body.classList.toggle('view-linear', view === 'linear');
    viewButtons.orbit.setAttribute('aria-pressed', String(view === 'orbit'));
    viewButtons.linear.setAttribute('aria-pressed', String(view === 'linear'));
    try { localStorage.setItem('polyrhythm-view', view); } catch (e) { /* private mode */ }
  }

  viewButtons.orbit.addEventListener('click', () => setView('orbit'));
  viewButtons.linear.addEventListener('click', () => setView('linear'));

  bpmRange.addEventListener('input', (e) => {
    const newBpm = +e.target.value;
    if (state.started && audio.ctx) {
      // preserve the current cycle position across the tempo change
      const now = audio.ctx.currentTime;
      const p = (now - state.phase0) / cycleLen();
      state.bpm = newBpm;
      state.phase0 = now - p * cycleLen();
    } else {
      state.bpm = newBpm;
    }
    bpmVal.textContent = newBpm;
    syncRack();
  });

  // ---------------- renderer ----------------

  const stage = document.querySelector('.stage');
  const canvas = document.getElementById('sky');
  const g2d = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let stars = [];
  let ripples = []; // { t0 }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // 3x rendering isn't worth the mobile GPU cost
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    stars = [];
    const n = Math.round((W * H) / 9000);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 0.7,
        a: 0.15 + Math.random() * 0.45,
      });
    }
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // orbit geometry, shared by the renderer and canvas hit-testing
  function orbitGeometry() {
    const cx = W / 2, cy = H / 2;
    // adapt the orbit band to the stage so small/landscape phones don't clip rings
    const rMax = Math.max(60, Math.min(cx, cy) - 24);
    const rMin = Math.max(44, Math.min(86, rMax - 110));
    return { cx, cy, rMin, rMax };
  }

  function orbitRadius(i, n, geo) {
    return n === 1 ? (geo.rMin + geo.rMax) / 2 : geo.rMin + ((geo.rMax - geo.rMin) * i) / (n - 1);
  }

  // linear-view geometry: paths span nearly the full width. The play button
  // sits at bottom-center (see `.view-linear .star` in CSS), so padBot
  // reserves a band above it that the paths never enter.
  const mobileMQ = window.matchMedia('(max-width: 880px)');

  function laneGeometry() {
    const m = mobileMQ.matches;
    const padTop = 30;
    const padBot = m ? 92 : 100; // clears the bottom-center play button
    return {
      x0: m ? 40 : 44,          // left pad for the beat-count ruler
      xEnd: W - (m ? 20 : 28),
      padTop,
      padBot,
      midY: (padTop + (H - padBot)) / 2,
    };
  }

  function laneY(i, n) {
    const geo = laneGeometry();
    if (n === 1) return geo.midY;
    const span = (H - geo.padBot) - geo.padTop;
    const gap = Math.min(64, span / (n - 1));
    return geo.midY - (gap * (n - 1)) / 2 + gap * i;
  }

  // clicking a layer's orbit or path (ring, nodes or satellite) mutes / unmutes it
  function layerAt(x, y) {
    const n = state.layers.length;
    let best = null, bestGap = coarsePointer ? 20 : 14; // px tolerance, wider for fingers
    if (state.view === 'linear') {
      const geo = laneGeometry();
      if (x < geo.x0 - 12 || x > geo.xEnd + 12) return null;
      state.layers.forEach((layer, i) => {
        const gap = Math.abs(y - laneY(i, n));
        if (gap < bestGap) { best = layer; bestGap = gap; }
      });
    } else {
      const geo = orbitGeometry();
      const dist = Math.hypot(x - geo.cx, y - geo.cy);
      state.layers.forEach((layer, i) => {
        const gap = Math.abs(dist - orbitRadius(i, n, geo));
        if (gap < bestGap) { best = layer; bestGap = gap; }
      });
    }
    return best;
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const layer = layerAt(e.clientX - rect.left, e.clientY - rect.top);
    if (layer) setMuted(layer, !layer.muted);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    canvas.style.cursor = layerAt(e.clientX - rect.left, e.clientY - rect.top) ? 'pointer' : 'default';
  });

  function consumeHits(now) {
    if (!pendingHits.length) return;
    const due = [];
    pendingHits = pendingHits.filter((h) => (h.t <= now ? (due.push(h), false) : true));
    const buckets = new Map();
    for (const h of due) {
      if (h.layer.lastHit.length === h.layer.beats) h.layer.lastHit[h.node] = h.t;
      const key = h.t.toFixed(3);
      buckets.set(key, (buckets.get(key) || new Set()).add(h.layer.id));
    }
    if (!reducedMotion) {
      for (const [key, set] of buckets) {
        if (set.size >= 2) ripples.push({ t0: parseFloat(key) });
      }
    }
  }

  // --- drawing helpers shared by both views ---

  function hitFlash(layer, k, now) {
    const hit = layer.lastHit[k];
    if (!layer.muted && hit >= 0 && now >= hit) return Math.exp(-(now - hit) / 0.12);
    return 0;
  }

  // glow = layered translucent discs; shadowBlur is too slow on mobile
  function drawNode(x, y, layer, k, f, dim) {
    const base = k === 0 ? 4 : 3;
    const rad = base + 6 * f;
    if (f > 0.02) {
      g2d.fillStyle = rgba(layer.color, 0.16 * f);
      g2d.beginPath();
      g2d.arc(x, y, rad * 2.4, 0, 7);
      g2d.fill();
    }
    g2d.fillStyle = rgba(layer.color, (0.45 + 0.55 * f) * dim);
    g2d.beginPath();
    g2d.arc(x, y, rad, 0, 7);
    g2d.fill();
    if (k === 0) { // downbeat marker
      g2d.strokeStyle = rgba(layer.color, 0.5 * dim);
      g2d.lineWidth = 1;
      g2d.beginPath();
      g2d.arc(x, y, rad + 3, 0, 7);
      g2d.stroke();
    }
  }

  function drawSatellite(x, y, layer, dim) {
    if (!layer.muted) {
      g2d.fillStyle = rgba(layer.color, 0.14);
      g2d.beginPath();
      g2d.arc(x, y, 10, 0, 7);
      g2d.fill();
      g2d.fillStyle = rgba(layer.color, 0.3);
      g2d.beginPath();
      g2d.arc(x, y, 6.5, 0, 7);
      g2d.fill();
    }
    g2d.fillStyle = rgba(layer.color, dim);
    g2d.beginPath();
    g2d.arc(x, y, 4.5, 0, 7);
    g2d.fill();
  }

  function drawHalo(x, y) {
    const halo = g2d.createRadialGradient(x, y, 20, x, y, 120);
    halo.addColorStop(0, 'rgba(244,193,93,0.10)');
    halo.addColorStop(1, 'rgba(244,193,93,0)');
    g2d.fillStyle = halo;
    g2d.beginPath();
    g2d.arc(x, y, 120, 0, 7);
    g2d.fill();
  }

  function drawRipples(now, cx, cy, maxR) {
    ripples = ripples.filter((rp) => now - rp.t0 < 0.9);
    for (const rp of ripples) {
      const dt = (now - rp.t0) / 0.9;
      if (dt < 0) continue;
      g2d.strokeStyle = 'rgba(233,238,247,' + 0.14 * (1 - dt) + ')';
      g2d.lineWidth = 1;
      g2d.beginPath();
      g2d.arc(cx, cy, 30 + (maxR - 30) * dt, 0, 7);
      g2d.stroke();
    }
  }

  // --- orbital view ---

  function renderOrbits(now, phase) {
    const geo = orbitGeometry();
    const cx = geo.cx, cy = geo.cy;
    const n = state.layers.length;
    const satAngle = -Math.PI / 2 + phase * 2 * Math.PI;

    drawHalo(cx, cy);

    state.layers.forEach((layer, i) => {
      const r = orbitRadius(i, n, geo);
      const dim = layer.muted ? 0.3 : 1; // muted orbits recede but keep moving

      // orbit ring
      g2d.strokeStyle = rgba(layer.color, 0.22 * dim);
      g2d.lineWidth = 1;
      g2d.beginPath();
      g2d.arc(cx, cy, r, 0, 7);
      g2d.stroke();

      // satellite trail
      g2d.strokeStyle = rgba(layer.color, 0.1 * dim);
      g2d.lineWidth = 1.5;
      g2d.beginPath();
      g2d.arc(cx, cy, r, satAngle - 0.5, satAngle);
      g2d.stroke();
      g2d.strokeStyle = rgba(layer.color, 0.24 * dim);
      g2d.beginPath();
      g2d.arc(cx, cy, r, satAngle - 0.18, satAngle);
      g2d.stroke();

      // beat nodes
      for (let k = 0; k < layer.beats; k++) {
        const a = -Math.PI / 2 + (2 * Math.PI * k) / layer.beats;
        drawNode(cx + r * Math.cos(a), cy + r * Math.sin(a), layer, k, hitFlash(layer, k, now), dim);
      }

      drawSatellite(cx + r * Math.cos(satAngle), cy + r * Math.sin(satAngle), layer, dim);

      // beat count, stacked above the rings like a ruler
      g2d.fillStyle = rgba(layer.color, 0.85 * dim);
      g2d.font = '10px "IBM Plex Mono", monospace';
      g2d.textAlign = 'center';
      g2d.textBaseline = 'bottom';
      g2d.fillText(layer.beats, cx, cy - r - 6);
    });

    drawRipples(now, cx, cy, geo.rMax + 30);
  }

  // --- linear view: rhythms unroll into stacked flight paths ---

  function renderLinear(now, phase) {
    const geo = laneGeometry();
    const n = state.layers.length;

    if (n) {
      // cycle boundary ticks: the right edge is the same instant as the left
      const yTop = laneY(0, n) - 16;
      const yBot = laneY(n - 1, n) + 16;
      g2d.strokeStyle = 'rgba(143,163,191,0.15)';
      g2d.lineWidth = 1;
      for (const x of [geo.x0, geo.xEnd]) {
        g2d.beginPath();
        g2d.moveTo(x, yTop);
        g2d.lineTo(x, yBot);
        g2d.stroke();
      }
    }

    const sx = geo.x0 + phase * (geo.xEnd - geo.x0);

    state.layers.forEach((layer, i) => {
      const y = laneY(i, n);
      const dim = layer.muted ? 0.3 : 1;

      // path line
      g2d.strokeStyle = rgba(layer.color, 0.22 * dim);
      g2d.lineWidth = 1;
      g2d.beginPath();
      g2d.moveTo(geo.x0, y);
      g2d.lineTo(geo.xEnd, y);
      g2d.stroke();

      // satellite trail (clipped at the cycle start)
      g2d.strokeStyle = rgba(layer.color, 0.1 * dim);
      g2d.lineWidth = 1.5;
      g2d.beginPath();
      g2d.moveTo(Math.max(geo.x0, sx - 44), y);
      g2d.lineTo(sx, y);
      g2d.stroke();
      g2d.strokeStyle = rgba(layer.color, 0.24 * dim);
      g2d.beginPath();
      g2d.moveTo(Math.max(geo.x0, sx - 16), y);
      g2d.lineTo(sx, y);
      g2d.stroke();

      // beat nodes
      for (let k = 0; k < layer.beats; k++) {
        const x = geo.x0 + ((geo.xEnd - geo.x0) * k) / layer.beats;
        drawNode(x, y, layer, k, hitFlash(layer, k, now), dim);
      }

      drawSatellite(sx, y, layer, dim);

      // beat count, a ruler column at the path origin
      g2d.fillStyle = rgba(layer.color, 0.85 * dim);
      g2d.font = '10px "IBM Plex Mono", monospace';
      g2d.textAlign = 'right';
      g2d.textBaseline = 'middle';
      g2d.fillText(layer.beats, geo.x0 - 12, y);
    });

    // coincidence pulse from the left origin, where downbeats align
    drawRipples(now, geo.x0, geo.midY, geo.xEnd - geo.x0 + 30);
  }

  function draw() {
    requestAnimationFrame(draw);
    const now = audio.ctx ? audio.ctx.currentTime : 0;
    consumeHits(now);

    g2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    g2d.clearRect(0, 0, W, H);

    // starfield
    g2d.fillStyle = '#e9eef7';
    for (const s of stars) {
      g2d.globalAlpha = s.a;
      g2d.beginPath();
      g2d.arc(s.x, s.y, s.r, 0, 7);
      g2d.fill();
    }
    g2d.globalAlpha = 1;

    let phase = 0;
    if (state.started) {
      phase = ((now - state.phase0) / cycleLen()) % 1;
      if (phase < 0) phase += 1;
    }

    if (state.view === 'linear') renderLinear(now, phase);
    else renderOrbits(now, phase);
  }

  // ---------------- init ----------------

  addLayer({ beats: 3, sound: 'wood', level: 85 });
  addLayer({ beats: 4, sound: 'drum', level: 75 });
  syncRack();
  let savedView = 'orbit';
  try { savedView = localStorage.getItem('polyrhythm-view') || 'orbit'; } catch (e) { /* private mode */ }
  setView(savedView === 'linear' ? 'linear' : 'orbit');
  requestAnimationFrame(draw);
})();
