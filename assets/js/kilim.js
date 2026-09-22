/* Kilim — Anatolian kilim pattern generator.
 * Composes a rug as a raster of weave cells (frame bands tessellated around a
 * motif field), renders to SVG (run-length merged paths), exports SVG/PNG.
 */
(function () {
  'use strict';

  var LIB = window.KILIM;
  var $ = function (id) { return document.getElementById(id); };

  /* ================= state ================= */

  var DEF = {
    cols: 91, rows: 139,
    palette: 'anadolu',
    colors: null,              // {field:{g,c1,c2,c3}, border:{...}} — null = palette defaults
    fieldMotifs: [{ id: 'elibelinde', k: 1 }],   // {id, k} — each with its own scale
    mixMode: 'row',            // row | column | checker — how multiple motifs alternate
    layout: 'grid',            // grid | brick
    gapX: 2, gapY: 3,
    altColors: true,           // checkerboard colorway swap
    mirrorRows: false,         // flip motif vertically on alternate rows
    bands: [{ id: 'gozdizi', k: 1 }, { id: 'suyolu', k: 1 }],  // outer → inner, own scales
    bandGap: 1,
    texts: [],                      // inscriptions: {t, k, font, color} each its own block
    textGap: 2,                     // rows of ground between stacked text blocks
    guards: true,              // thin guard stripes between bands
    abrash: 0.5,               // 0..1 natural dye variation
    ridges: true,              // weft ridge texture
    linocut: 0,                // 0..1 two-tone print mode: ink & paper, carved edges
    jitter: 0,                 // 0..1 weft rows knocked sideways (drastic at the top)
    rgbShift: 0,               // 0..1 chromatic aberration
    seed: 1234567
  };

  var S = load();

  function load() {
    var s = null;
    if (location.hash.length > 1) {
      try { s = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1))))); } catch (e) { s = null; }
    }
    if (!s) {
      try { s = JSON.parse(localStorage.getItem('kilim:state')); } catch (e) { s = null; }
    }
    var out = {};
    for (var k in DEF) {
      out[k] = (s && s[k] !== undefined) ? s[k] :
        (Array.isArray(DEF[k]) ? DEF[k].slice() : DEF[k]);
    }
    if (s && s.fieldMotif && !s.fieldMotifs) out.fieldMotifs = [s.fieldMotif];  // pre-multi states
    if (!Array.isArray(out.fieldMotifs)) out.fieldMotifs = [{ id: 'elibelinde', k: 1 }];
    if (s && s.grunge !== undefined && s.linocut === undefined)                 // pre-split glitch states
      out.linocut = out.jitter = out.rgbShift = +s.grunge || 0;
    if (s && s.bandCount !== undefined && Array.isArray(s.bands))              // pre-selection states
      out.bands = s.bands.slice(0, s.bandCount);
    if (!Array.isArray(out.bands)) out.bands = [];
    // pre-per-motif-scale states: plain id strings + global scaleF/scaleB
    function normSel(arr, defK) {
      return arr.map(function (x) {
        return typeof x === 'string' ? { id: x, k: defK } : { id: x.id, k: +x.k || 1 };
      });
    }
    out.fieldMotifs = normSel(out.fieldMotifs, (s && +s.scaleF) || 1);
    out.bands = normSel(out.bands, (s && +s.scaleB) || 1);
    if (s && s.text && !s.texts)                   // pre-sections text states
      out.texts = [{ t: s.text, k: +s.scaleT || 2, font: s.font || 'blok',
                     color: s.textColor || null }];
    if (!Array.isArray(out.texts)) out.texts = [];
    return out;
  }
  function save() {
    try { localStorage.setItem('kilim:state', JSON.stringify(S)); } catch (e) {}
  }
  function stateUrl() {
    var h = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    return location.origin + location.pathname + '#' + h;
  }

  /* ================= motif utils ================= */

  /* custom motifs drawn in the atölye, persisted separately from the state */
  var CUSTOMS = [];
  try { CUSTOMS = JSON.parse(localStorage.getItem('kilim:motifs')) || []; } catch (e) {}
  function saveCustoms() {
    try { localStorage.setItem('kilim:motifs', JSON.stringify(CUSTOMS)); } catch (e) {}
  }
  /* built-ins the user has hidden from the pickers (restorable in the atölye) */
  var HIDDEN = [];
  try { HIDDEN = JSON.parse(localStorage.getItem('kilim:hidden')) || []; } catch (e) {}
  function saveHidden() {
    try { localStorage.setItem('kilim:hidden', JSON.stringify(HIDDEN)); } catch (e) {}
  }
  function hideBuiltin(id) {
    if (HIDDEN.indexOf(id) < 0) HIDDEN.push(id);
    S.fieldMotifs = S.fieldMotifs.filter(function (x) { return x.id !== id; });
    S.bands = S.bands.filter(function (x) { return x.id !== id; });
    saveHidden(); syncUI(); render();
  }
  function unhideBuiltin(id) {
    HIDDEN = HIDDEN.filter(function (x) { return x !== id; });
    saveHidden(); syncUI(); render();
  }
  function isHidden(m) { return !m.custom && HIDDEN.indexOf(m.id) >= 0; }
  function customAsMotif(c) {
    return { id: c.id, name: c.name, en: 'atölye', custom: true,
      meaning: 'Your own motif, drawn in the atölye.',
      field: c.field !== false, border: c.border !== false,
      grid: c.grid, w: c.grid[0].length, h: c.grid.length };
  }
  function allMotifs() {
    // a custom saved under a built-in id OVERRIDES it (delete the override to
    // get the original back); other customs are appended
    var byId = {};
    CUSTOMS.forEach(function (c) { byId[c.id] = customAsMotif(c); });
    var out = LIB.MOTIFS.map(function (m) { return byId[m.id] || m; });
    CUSTOMS.forEach(function (c) {
      if (!LIB.MOTIFS.some(function (m) { return m.id === c.id; })) out.push(byId[c.id]);
    });
    return out;
  }

  function motif(id) {
    var all = allMotifs();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return LIB.MOTIFS[0];
  }
  function palette(id) {
    for (var i = 0; i < LIB.PALETTES.length; i++) if (LIB.PALETTES[i].id === id) return LIB.PALETTES[i];
    return LIB.PALETTES[0];
  }
  function zoneColors() {
    if (S.colors) return S.colors;
    var p = palette(S.palette);
    return {
      field:  { g: p.field.g,  c1: p.field.c1,  c2: p.field.c2,  c3: p.field.c3 },
      border: { g: p.border.g, c1: p.border.c1, c2: p.border.c2, c3: p.border.c3 }
    };
  }
  function editColors() {           // materialize palette colors for editing
    if (!S.colors) S.colors = zoneColors();
    return S.colors;
  }

  function flipV(g) { return g.slice().reverse(); }
  function flipH(g) {
    return g.map(function (r) { return r.split('').reverse().join(''); });
  }
  function scaleGrid(g, k) {
    if (k <= 1) return g;
    var out = [];
    g.forEach(function (r) {
      var row = r.split('').map(function (c) { return new Array(k + 1).join(c); }).join('');
      for (var i = 0; i < k; i++) out.push(row);
    });
    return out;
  }
  // fractional nearest-neighbour scaling — the slightly uneven cell steps read
  // like hand-woven lettering. Below ×1 each output cell ORs its source block
  // so strokes survive the shrink.
  function resampleGrid(g, k) {
    if (k === Math.round(k)) return scaleGrid(g, k);
    var h = g.length, w = g[0].length;
    var H = Math.max(1, Math.round(h * k)), W = Math.max(1, Math.round(w * k));
    var out = [];
    for (var y = 0; y < H; y++) {
      var y0 = Math.min(h - 1, Math.floor(y / k));
      var y1 = k < 1 ? Math.min(h, Math.max(y0 + 1, Math.floor((y + 1) / k))) : y0 + 1;
      var r = '';
      for (var x = 0; x < W; x++) {
        var x0 = Math.min(w - 1, Math.floor(x / k));
        var x1 = k < 1 ? Math.min(w, Math.max(x0 + 1, Math.floor((x + 1) / k))) : x0 + 1;
        // majority woven colour in the source block (ground only if all ground)
        var counts = {}, best = '.', bc = 0;
        for (var yy = y0; yy < y1; yy++)
          for (var xx = x0; xx < x1; xx++) {
            var ch = g[yy][xx];
            if (ch === '.') continue;
            counts[ch] = (counts[ch] || 0) + 1;
            if (counts[ch] > bc) { bc = counts[ch]; best = ch; }
          }
        r += best;
      }
      out.push(r);
    }
    return out;
  }
  function rotCW(g) {
    var h = g.length, w = g[0].length, out = [];
    for (var x = 0; x < w; x++) {
      var r = '';
      for (var y = h - 1; y >= 0; y--) r += g[y][x];
      out.push(r);
    }
    return out;
  }
  function rotCCW(g) {
    var h = g.length, w = g[0].length, out = [];
    for (var x = w - 1; x >= 0; x--) {
      var r = '';
      for (var y = 0; y < h; y++) r += g[y][x];
      out.push(r);
    }
    return out;
  }

  /* ================= woven text ================= */

  // build a grid of '.'/'1' rows from text; '|' starts a new line and long
  // lines word-wrap to maxCols. glyphs: 7 rows = plain body (sits on rows 2–8
  // of a 10-row line), 10 rows = carries its own diacritic/cedilla.
  function fnt(id) { return LIB.FONTS[id] || LIB.FONTS.blok; }
  function lineWidth(str, FONT) {
    var w = 0;
    for (var i = 0; i < str.length; i++) {
      var g = FONT[str[i]];
      if (g) w += g[0].length + 1;
    }
    return w ? w - 1 : 0;
  }
  // k scales each line independently (identical sampling per line), then the
  // scaled lines are stacked and centered.
  function buildTextGrid(text, maxCols, k, fontId) {
    var FONT = fnt(fontId);
    var lines = [];
    text.split(/\r?\n|\|/).forEach(function (part) {
      var up = part.toLocaleUpperCase ? part.toLocaleUpperCase('tr-TR') : part.toUpperCase();
      var words = up.split(/\s+/).filter(Boolean);
      var cur = '';
      words.forEach(function (w) {
        var cand = cur ? cur + ' ' + w : w;
        if (cur && maxCols && lineWidth(cand, FONT) > maxCols) { lines.push(cur); cur = w; }
        else cur = cand;
      });
      if (cur) lines.push(cur);
    });
    var built = [];
    lines.forEach(function (up) {
      var rows = ['', '', '', '', '', '', '', '', '', ''];
      for (var i = 0; i < up.length; i++) {
        var g = FONT[up[i]];
        if (!g) continue;
        var off = g.length === 10 ? 0 : 2, w = g[0].length;
        var blank = new Array(w + 1).join('.');
        for (var r = 0; r < 10; r++)
          rows[r] += ((r >= off && r - off < g.length) ? g[r - off] : blank) + '.';
      }
      if (rows[0].length) built.push(rows.map(function (r) { return r.slice(0, -1); }));
    });
    if (!built.length) return null;
    if (k && k !== 1) built = built.map(function (l) { return resampleGrid(l, k); });
    // stack lines, centering each horizontally
    var W = 0, sep = Math.max(1, Math.round(2 * (k || 1)));
    built.forEach(function (l) { W = Math.max(W, l[0].length); });
    var out = [];
    built.forEach(function (l, li) {
      if (li) for (var s = 0; s < sep; s++) out.push(new Array(W + 1).join('.'));
      var padL = (W - l[0].length) >> 1, padR = W - l[0].length - padL;
      l.forEach(function (r) {
        out.push(new Array(padL + 1).join('.') + r + new Array(padR + 1).join('.'));
      });
    });
    // trim fully blank top/bottom rows
    function blankRow(r) { return r.indexOf('1') < 0; }
    while (out.length && blankRow(out[0])) out.shift();
    while (out.length && blankRow(out[out.length - 1])) out.pop();
    return out.length ? out : null;
  }

  /* ================= composer ================= */
  /* color indices: 0 field.g  1..3 field.c1..c3  4 border.g  5..7 border.c1..c3 */

  var MAP_A = { '1': 5, '2': 6, '3': 7 };   // border colorway a
  var MAP_B = { '1': 6, '2': 5, '3': 7 };   // border colorway b (alternating bands)
  var FMAP_A = { '1': 1, '2': 2, '3': 3 };  // field colorway a
  var FMAP_B = { '1': 2, '2': 1, '3': 3 };  // field colorway b

  function compose() {
    var W = S.cols, H = S.rows;
    var cells = new Uint8Array(W * H);      // 0 = field ground — everything flattened
    var ground = new Uint8Array(W * H);     // grounds/rings only (structured SVG base layer)
    var sprites = [];                        // every motif/text instance, for per-group SVG
    var b = { x0: 0, y0: 0, x1: W - 1, y1: H - 1 };

    function fill(x0, y0, x1, y1, v) {
      if (x1 < x0 || y1 < y0) return;
      for (var y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
        for (var x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
          cells[y * W + x] = v;
          ground[y * W + x] = v;
        }
    }
    function ring(t, v) {
      fill(b.x0, b.y0, b.x1, b.y0 + t - 1, v);
      fill(b.x0, b.y1 - t + 1, b.x1, b.y1, v);
      fill(b.x0, b.y0, b.x0 + t - 1, b.y1, v);
      fill(b.x1 - t + 1, b.y0, b.x1, b.y1, v);
      b.x0 += t; b.y0 += t; b.x1 -= t; b.y1 -= t;
    }
    function paint(g, px, py, map, clip, tag) {
      for (var y = 0; y < g.length; y++)
        for (var x = 0; x < g[y].length; x++) {
          var ch = g[y][x];
          if (ch === '.') continue;
          var X = px + x, Y = py + y;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          if (clip && (X < clip.x0 || X > clip.x1 || Y < clip.y0 || Y > clip.y1)) continue;
          cells[Y * W + X] = map[ch];
        }
      sprites.push({ g: g, x: px, y: py, map: map, clip: clip || null, tag: tag || 'motif' });
    }
    // tile grid g horizontally in [xa..xb] at row py.
    // flow motifs run unbroken edge to edge (clipped); discrete ones are centered.
    function tileH(g, xa, xb, py, map, gap, flow, tag) {
      var mw = g[0].length, len = xb - xa + 1;
      if (flow) {
        var clip = { x0: xa, x1: xb, y0: 0, y1: H - 1 };
        for (var x = xa; x <= xb; x += mw) paint(g, x, py, map, clip, tag);
        return;
      }
      var n = Math.floor((len + gap) / (mw + gap));
      if (n < 1) return;
      var total = n * mw + (n - 1) * gap;
      var off = xa + ((len - total) >> 1);
      for (var i = 0; i < n; i++) paint(g, off + i * (mw + gap), py, map, null, tag);
    }
    function tileV(g, ya, yb, px, map, gap, flow, tag) {
      var mh = g.length, len = yb - ya + 1;
      if (flow) {
        var clip = { x0: 0, x1: W - 1, y0: ya, y1: yb };
        for (var y = ya; y <= yb; y += mh) paint(g, px, y, map, clip, tag);
        return;
      }
      var n = Math.floor((len + gap) / (mh + gap));
      if (n < 1) return;
      var total = n * mh + (n - 1) * gap;
      var off = ya + ((len - total) >> 1);
      for (var i = 0; i < n; i++) paint(g, px, off + i * (mh + gap), map, null, tag);
    }
    function corner(cx, cy, t, map) {     // small stepped diamond in a t×t corner block
      var c = (t - 1) / 2, r = Math.max(1, Math.floor(t / 2) - 1), g = [];
      for (var y = 0; y < t; y++) {
        var row = '';
        for (var x = 0; x < t; x++) {
          var d = Math.abs(x - c) + Math.abs(y - c);
          row += d <= r ? (d <= r - 2 ? '2' : '1') : '.';
        }
        g.push(row);
      }
      paint(g, cx, cy, map, null, 'kose');
    }

    // --- frame ---
    ring(1, 4);                                    // selvedge
    if (S.guards) ring(1, 6);                      // outer guard stripe

    for (var i = 0; i < S.bands.length; i++) {
      var m = motif(S.bands[i].id);
      // per-band scale, dropped until the ring fits (min ×0.5);
      // skip the band if even the smallest won't fit
      var t = 0, bg = null;
      var wantB = Math.max(0.5, Math.min(3, +S.bands[i].k || 1));
      for (var ki = Math.round(wantB * 20); ki >= 10; ki--) {
        var kb = ki / 20;
        var g2 = kb === 1 ? m.grid : resampleGrid(m.grid, kb);
        var tt = g2.length + 2;
        if (b.x1 - b.x0 + 1 >= 2 * tt + 16 && b.y1 - b.y0 + 1 >= 2 * tt + 16) {
          t = tt; bg = g2; break;
        }
      }
      if (!t) break;
      var map = (i % 2 === 0) ? MAP_A : MAP_B;
      var bx0 = b.x0, by0 = b.y0, bx1 = b.x1, by1 = b.y1;
      ring(t, 4);                                  // band ground
      // motifs: top / bottom / left / right (mirrored so the frame is symmetric)
      var fl = !!m.flow;
      tileH(bg, bx0 + t, bx1 - t, by0 + 1, map, S.bandGap, fl, m.id);
      tileH(flipV(bg), bx0 + t, bx1 - t, by1 - t + 2, map, S.bandGap, fl, m.id);
      tileV(rotCCW(bg), by0 + t, by1 - t, bx0 + 1, map, S.bandGap, fl, m.id);
      tileV(rotCW(bg), by0 + t, by1 - t, bx1 - t + 2, map, S.bandGap, fl, m.id);
      if (t >= 5) {                                // corner blocks
        corner(bx0, by0, t, map); corner(bx1 - t + 1, by0, t, map);
        corner(bx0, by1 - t + 1, t, map); corner(bx1 - t + 1, by1 - t + 1, t, map);
      }
      if (S.guards) ring(1, 6);                    // stripe after each band
    }

    // --- field ---
    var nM = S.fieldMotifs.length;
    var fx0 = b.x0 + 1, fy0 = b.y0 + 1, fx1 = b.x1 - 1, fy1 = b.y1 - 1;   // breathing margin
    var fw = fx1 - fx0 + 1, fh = fy1 - fy0 + 1;
    // each motif scaled individually (clamped to fit the field), then all
    // share one slot grid sized by the largest, centered in their slots
    var items = S.fieldMotifs.map(function (e) {
      var m = motif(e.id);
      var k = Math.max(0.25, Math.min(+e.k || 1, fw / m.w, fh / m.h));
      return { m: m, g: k === 1 ? m.grid : resampleGrid(m.grid, k) };
    });
    var slotW = 1, slotH = 1;
    items.forEach(function (it) {
      slotW = Math.max(slotW, it.g[0].length);
      slotH = Math.max(slotH, it.g.length);
    });

    // --- woven inscriptions: sections stacked, centered as a block ---
    var tBlocks = [], tRects = [];
    (S.texts || []).forEach(function (sec) {
      if (!sec.t || !sec.t.trim()) return;
      // per-section size, wrapped to the field, shrunk in 0.05 steps to fit
      var g = null, want = Math.max(0.5, +sec.k || 1);
      for (var ti = Math.round(want * 20); ti >= 10; ti--) {
        var tk = ti / 20;
        g = buildTextGrid(sec.t, Math.floor(fw / tk), tk, sec.font);
        if (!g) break;
        if (ti === 10 || (g[0].length <= fw && g.length <= fh)) break;
      }
      if (g) tBlocks.push({ g: g, color: sec.color });
    });
    if (tBlocks.length) {
      var TGAP = Math.max(0, S.textGap | 0), totH = (tBlocks.length - 1) * TGAP;
      tBlocks.forEach(function (bl) { totH += bl.g.length; });
      var tyc = fy0 + Math.max(0, (fh - totH) >> 1);
      tBlocks.forEach(function (bl) {
        bl.x = fx0 + ((fw - bl.g[0].length) >> 1);
        bl.y = tyc;
        tyc += bl.g.length + TGAP;
        tRects.push({ x0: bl.x - 2, y0: bl.y - 2,
                      x1: bl.x + bl.g[0].length + 1, y1: bl.y + bl.g.length + 1 });
      });
    }
    if (!nM) {
      /* blank field — just ground (and the inscriptions, painted below) */
    } else {
      var stepX = slotW + S.gapX, stepY = slotH + S.gapY;
      var nY = Math.floor((fh + S.gapY) / stepY);
      var nX = Math.floor((fw + S.gapX) / stepX);
      var offY = fy0 + ((fh - (nY * slotH + (nY - 1) * S.gapY)) >> 1);
      var offX = fx0 + ((fw - (nX * slotW + (nX - 1) * S.gapX)) >> 1);
      for (var ry = 0; ry < nY; ry++) {
        var odd = ry % 2 === 1;
        var xs = offX, count = nX;
        if (S.layout === 'brick' && odd) {
          xs = offX + (stepX >> 1);
          count = (xs + (nX - 1) * stepX + slotW - 1 <= fx1) ? nX : nX - 1;
        }
        for (var rx = 0; rx < count; rx++) {
          var sx = xs + rx * stepX, sy = offY + ry * stepY, clear = false;
          for (var tr = 0; tr < tRects.length; tr++) {   // flow around inscriptions
            var R = tRects[tr];
            if (!(sx + slotW - 1 < R.x0 || sx > R.x1 ||
                  sy + slotH - 1 < R.y0 || sy > R.y1)) { clear = true; break; }
          }
          if (clear) continue;
          var mi = nM < 2 ? 0 :
            (S.mixMode === 'column' ? rx : S.mixMode === 'checker' ? rx + ry : ry) % nM;
          var it = items[mi], g = it.g;
          // directional creatures (birds, cars) mirror sideways so rows face
          // each other; abstract motifs invert, as on traditional kilims
          if (S.mirrorRows && odd) g = it.m.facing ? flipH(g) : flipV(g);
          var fmap = (S.altColors && (rx + ry) % 2 === 1) ? FMAP_B : FMAP_A;
          paint(g, sx + ((slotW - g[0].length) >> 1),
                sy + ((slotH - g.length) >> 1), fmap, null, it.m.id);
        }
      }
    }
    var zc = zoneColors();
    var colors = [zc.field.g, zc.field.c1, zc.field.c2, zc.field.c3,
                  zc.border.g, zc.border.c1, zc.border.c2, zc.border.c3];
    tBlocks.forEach(function (bl, bi) {           // each section gets its own colour slot
      colors.push(bl.color || zc.field.c3);
      paint(bl.g, bl.x, bl.y, { '1': 8 + bi }, { x0: fx0, y0: fy0, x1: fx1, y1: fy1 }, 'yazi');
    });
    return { W: W, H: H, cells: cells, ground: ground, sprites: sprites, colors: colors };
  }

  /* ================= SVG ================= */

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function toSVG(model, pxW, pxH) {
    var W = model.W, H = model.H, cells = model.cells, colors = model.colors;
    var eLino = +S.linocut || 0, eJit = +S.jitter || 0, eRgb = +S.rgbShift || 0;
    var rnd = (eLino || eJit) ? mulberry32((S.seed ^ 0x9e3779b9) >>> 0) : null;
    var rowShift = null;

    if (eLino > 0) {
      // linocut — the whole weave printed in two tones: the scheme's darkest
      // colour as ink, its lightest as paper, with carved edges and gouges
      cells = new Uint8Array(cells);
      function lum(hex) {
        var n = parseInt(hex.slice(1), 16);
        return 0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255);
      }
      var lums = colors.map(lum);
      var lo = Math.min.apply(null, lums), hi = Math.max.apply(null, lums);
      var mid = (lo + hi) / 2;
      var tone = lums.map(function (l) { return l >= mid ? 0 : 1; });   // 0 paper, 1 ink
      for (var ci = 0; ci < W * H; ci++) cells[ci] = tone[cells[ci]];
      colors = [colors[lums.indexOf(hi)], colors[lums.indexOf(lo)]];
      // carved edges — bites out of every tone boundary, weft-biased
      var nN = Math.round(W * H * 0.12 * eLino);
      for (var n = 0; n < nN; n++) {
        var cx = 1 + Math.floor(rnd() * (W - 2)), cy = 1 + Math.floor(rnd() * (H - 2));
        var d = rnd(), src;
        if (d < 0.35) src = cells[cy * W + cx - 1];
        else if (d < 0.7) src = cells[cy * W + cx + 1];
        else if (d < 0.85) src = cells[(cy - 1) * W + cx];
        else src = cells[(cy + 1) * W + cx];
        if (src !== cells[cy * W + cx]) cells[cy * W + cx] = src;
      }
      // gouge marks — short weft-wise carving strokes through the ink,
      // and the occasional stray ink flick on the paper
      var nG = Math.round(H * 2.2 * eLino);
      for (var gi = 0; gi < nG; gi++) {
        var gy = Math.floor(rnd() * H), gx = Math.floor(rnd() * W);
        var ink = cells[gy * W + gx] === 1;
        var len = ink ? 2 + Math.floor(rnd() * 5) : 1 + Math.floor(rnd() * 2);
        if (!ink && rnd() > 0.3 * eLino) continue;
        for (var gg = 0; gg < len && gx + gg < W; gg++)
          cells[gy * W + gx + gg] = ink ? 0 : 1;
      }
    }
    if (eJit > 0) {
      // jitter — bands of weft rows knocked sideways, tearing over black;
      // shift distance scales hard with the slider (whole slabs at the top)
      rowShift = new Int16Array(H);
      var nJ = Math.max(1, Math.round(H * (0.03 + 0.1 * eJit)));
      for (var j = 0; j < nJ; j++) {
        var y0 = Math.floor(rnd() * H), bh = 1 + Math.floor(rnd() * 4);
        var mag = 1 + rnd() * (1 + eJit * eJit * W * 0.3);
        var sh = Math.ceil(mag) * (rnd() < 0.5 ? -1 : 1);
        for (var yy = y0; yy < Math.min(H, y0 + bh); yy++) rowShift[yy] = sh;
      }
    }

    // structured output (a group per motif instance) unless a destructive
    // raster effect is on — linocut/jitter re-carve cells across motif borders
    var structured = eLino <= 0 && eJit <= 0 && model.sprites;
    var body = [];
    if (structured) {
      var g0 = model.ground;
      var gpaths = colors.map(function () { return []; });
      for (var y = 0; y < H; y++) {
        var x = 0;
        while (x < W) {
          var v = g0[y * W + x], x2 = x + 1;
          while (x2 < W && g0[y * W + x2] === v) x2++;
          gpaths[v].push('M' + x + ' ' + y + 'h' + (x2 - x) + 'v1h-' + (x2 - x) + 'z');
          x = x2;
        }
      }
      var gparts = [];
      for (var gc = 0; gc < colors.length; gc++)
        if (gpaths[gc].length) gparts.push('<path fill="' + colors[gc] + '" d="' + gpaths[gc].join('') + '"/>');
      body.push('<g id="ground">' + gparts.join('') + '</g>');
      var tagN = {};
      model.sprites.forEach(function (sp) {
        var per = {};
        for (var yy = 0; yy < sp.g.length; yy++) {
          var Y = sp.y + yy;
          if (Y < 0 || Y >= H) continue;
          if (sp.clip && (Y < sp.clip.y0 || Y > sp.clip.y1)) continue;
          var row = sp.g[yy], xx = 0;
          while (xx < row.length) {
            var ch = row[xx], X = sp.x + xx;
            if (ch === '.' || X < 0 || X >= W ||
                (sp.clip && (X < sp.clip.x0 || X > sp.clip.x1))) { xx++; continue; }
            var x3 = xx + 1;
            while (x3 < row.length && row[x3] === ch) {
              var X3 = sp.x + x3;
              if (X3 >= W || (sp.clip && X3 > sp.clip.x1)) break;
              x3++;
            }
            (per[ch] || (per[ch] = [])).push('M' + X + ' ' + Y + 'h' + (x3 - xx) + 'v1h-' + (x3 - xx) + 'z');
            xx = x3;
          }
        }
        var parts = [];
        for (var pc in per) parts.push('<path fill="' + colors[sp.map[pc]] + '" d="' + per[pc].join('') + '"/>');
        if (parts.length) {
          var n = tagN[sp.tag] = (tagN[sp.tag] || 0) + 1;
          body.push('<g id="' + sp.tag + '-' + n + '" class="motif" data-motif="' + sp.tag + '">' +
            parts.join('') + '</g>');
        }
      });
    } else {
      var paths = colors.map(function () { return []; });
      for (var fy = 0; fy < H; fy++) {
        var xo = rowShift ? rowShift[fy] : 0;
        var fx = 0;
        while (fx < W) {
          var fv = cells[fy * W + fx], fx2 = fx + 1;
          while (fx2 < W && cells[fy * W + fx2] === fv) fx2++;
          paths[fv].push('M' + (fx + xo) + ' ' + fy + 'h' + (fx2 - fx) + 'v1h-' + (fx2 - fx) + 'z');
          fx = fx2;
        }
      }
      for (var c = 0; c < colors.length; c++)
        if (paths[c].length) body.push('<path fill="' + colors[c] + '" d="' + paths[c].join('') + '"/>');
    }
    var out = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '"' +
      (pxW ? ' width="' + pxW + '" height="' + pxH + '"' : '') + ' shape-rendering="crispEdges">');
    var defs = '<pattern id="weft" width="1" height="1" patternUnits="userSpaceOnUse">' +
      '<rect y="0.72" width="1" height="0.14" fill="#000" opacity="0.10"/>' +
      '<rect y="0.06" width="1" height="0.10" fill="#fff" opacity="0.05"/></pattern>';
    if (eRgb > 0) {
      // rgb shift — split channels, slide red right and blue left, re-add
      var dx = (0.15 + 0.85 * eRgb).toFixed(2);
      defs += '<filter id="rgb" x="-5%" y="-5%" width="110%" height="110%">' +
        '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="R"/>' +
        '<feOffset in="R" dx="' + dx + '" dy="0" result="R2"/>' +
        '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="Gc"/>' +
        '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="B"/>' +
        '<feOffset in="B" dx="-' + dx + '" dy="0" result="B2"/>' +
        '<feComposite in="R2" in2="Gc" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="RG"/>' +
        '<feComposite in="RG" in2="B2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>' +
        '</filter>';
    }
    out.push('<defs>' + defs + '</defs>');
    if (eJit > 0 || eRgb > 0)
      out.push('<rect x="-2" y="-2" width="' + (W + 4) + '" height="' + (H + 4) + '" fill="#050404"/>');
    if (eRgb > 0) out.push('<g filter="url(#rgb)">');
    out.push(body.join(''));
    if (eRgb > 0) out.push('</g>');
    if (S.abrash > 0) {                         // weft-wise dye variation
      var rnd = mulberry32(S.seed), v = 0, ab = [];
      for (var ry = 0; ry < H; ry++) {
        v = v * 0.72 + (rnd() * 2 - 1) * 0.28;
        var o = Math.abs(v) * S.abrash * 0.22;
        if (o > 0.004) ab.push('<rect y="' + ry + '" width="' + W + '" height="1" fill="' +
          (v > 0 ? '#fff' : '#000') + '" opacity="' + o.toFixed(3) + '"/>');
      }
      out.push('<g>' + ab.join('') + '</g>');
    }
    if (S.ridges) out.push('<rect width="' + W + '" height="' + H + '" fill="url(#weft)"/>');
    out.push('</svg>');
    return out.join('');
  }

  /* ================= render ================= */

  var rugEl, lastFit = '';

  function fitSize() {
    var stage = $('stage');
    var maxW = stage.clientWidth - 8;
    var maxH = window.innerHeight - stage.getBoundingClientRect().top - 32;
    maxH = Math.max(maxH, 320);
    var k = Math.min(maxW / S.cols, maxH / S.rows);
    return { w: Math.max(120, Math.floor(S.cols * k)), h: Math.max(120, Math.floor(S.rows * k)) };
  }

  function render() {
    var model = compose();
    var fit = fitSize();
    lastFit = fit.w + 'x' + fit.h;
    rugEl.innerHTML = toSVG(model, fit.w, fit.h);
    save();
  }

  var refitT;
  function refit() {                 // re-render only if the stage box changed the fit
    clearTimeout(refitT);
    refitT = setTimeout(function () {
      var f = fitSize();
      if (f.w + 'x' + f.h !== lastFit) render();
    }, 100);
  }

  /* ================= exports ================= */

  function download(name, blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function exportSVG() {
    var model = compose();
    var svg = toSVG(model, model.W * 8, model.H * 8);
    download('kilim-' + S.cols + 'x' + S.rows + '.svg', new Blob([svg], { type: 'image/svg+xml' }));
  }
  function exportPNG() {
    var scale = parseInt($('pngScale').value, 10) || 8;
    var model = compose();
    var svg = toSVG(model, model.W * scale, model.H * scale);
    var img = new Image();
    var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = function () {
      var cv = document.createElement('canvas');
      cv.width = model.W * scale; cv.height = model.H * scale;
      var ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      cv.toBlob(function (b) { download('kilim-' + S.cols + 'x' + S.rows + '.png', b); }, 'image/png');
    };
    img.src = url;
  }
  function copyLink() {
    var url = stateUrl();
    history.replaceState(null, '', '#' + url.split('#')[1]);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
      flash($('btnLink'), 'copied');
    }, function () { prompt('link:', url); });
  }
  function flash(btn, txt) {
    var old = btn.textContent;
    btn.textContent = txt;
    setTimeout(function () { btn.textContent = old; }, 1200);
  }

  /* ================= atölye — motif editor ================= */

  var EM = { id: null, baseId: null, w: 13, h: 13, slot: '1', grid: null, painting: false };

  function emBlank(w, h) {
    var g = [];
    for (var y = 0; y < h; y++) { var r = []; for (var x = 0; x < w; x++) r.push('.'); g.push(r); }
    return g;
  }
  function emCellSize() { return Math.max(8, Math.min(26, Math.floor(440 / Math.max(EM.w, EM.h)))); }

  function openEditor(id) {
    var c = null, base = null;
    for (var i = 0; i < CUSTOMS.length; i++) if (CUSTOMS[i].id === id) c = CUSTOMS[i];
    if (!c && id) {                       // a built-in: edit a copy as a new custom
      var all = allMotifs();
      for (i = 0; i < all.length; i++) if (all[i].id === id) base = all[i];
    }
    var src = c ? c.grid : base ? base.grid : null;
    EM.id = c ? c.id : null;
    EM.baseId = base ? base.id : null;
    EM.w = src ? src[0].length : 13;
    EM.h = src ? src.length : 13;
    EM.grid = src ? src.map(function (r) { return r.split(''); }) : emBlank(EM.w, EM.h);
    EM.slot = '1';
    $('emName').value = c ? c.name : base ? base.name : '';
    $('emW').value = EM.w; $('emH').value = EM.h;
    $('emField').checked = c ? c.field !== false : base ? !!base.field : true;
    $('emBorder').checked = c ? c.border !== false : base ? !!base.border : true;
    $('emConfirm').hidden = true;
    $('editor').hidden = false;
    emBuildSlots(); emDraw();
  }
  function closeEditor() { $('editor').hidden = true; }

  function emBuildSlots() {
    var host = $('emSlots'), zc = zoneColors();
    var slots = [['.', zc.field.g, 'ground'], ['1', zc.field.c1, 'colour 1'],
                 ['2', zc.field.c2, 'colour 2'], ['3', zc.field.c3, 'colour 3']];
    host.innerHTML = '';
    slots.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'emslot' + (EM.slot === s[0] ? ' emslot--on' : '');
      b.style.background = s[1];
      b.title = s[2];
      b.onclick = function () { EM.slot = s[0]; emBuildSlots(); };
      host.appendChild(b);
    });
  }

  function emDraw() {
    var cs = emCellSize(), cv = $('emCanvas');
    cv.width = EM.w * cs; cv.height = EM.h * cs;
    var zc = zoneColors();
    var cols = { '.': zc.field.g, '1': zc.field.c1, '2': zc.field.c2, '3': zc.field.c3 };
    var ctx = cv.getContext('2d');
    for (var y = 0; y < EM.h; y++)
      for (var x = 0; x < EM.w; x++) {
        ctx.fillStyle = cols[EM.grid[y][x]] || cols['.'];
        ctx.fillRect(x * cs, y * cs, cs, cs);
      }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= EM.w; gx++) {
      ctx.beginPath(); ctx.moveTo(gx * cs + 0.5, 0); ctx.lineTo(gx * cs + 0.5, EM.h * cs); ctx.stroke();
    }
    for (var gy = 0; gy <= EM.h; gy++) {
      ctx.beginPath(); ctx.moveTo(0, gy * cs + 0.5); ctx.lineTo(EM.w * cs, gy * cs + 0.5); ctx.stroke();
    }
  }

  function emPaint(e) {
    var cv = $('emCanvas'), r = cv.getBoundingClientRect(), cs = emCellSize();
    var x = Math.floor((e.clientX - r.left) / cs), y = Math.floor((e.clientY - r.top) / cs);
    if (x < 0 || y < 0 || x >= EM.w || y >= EM.h) return;
    if (EM.grid[y][x] === EM.slot) return;
    EM.grid[y][x] = EM.slot;
    emDraw();
  }

  function emReshape(w, h, offX, offY) {
    var g = emBlank(w, h);
    for (var y = 0; y < EM.h; y++)
      for (var x = 0; x < EM.w; x++) {
        var ty = y + offY, tx = x + offX;
        if (tx >= 0 && ty >= 0 && tx < w && ty < h) g[ty][tx] = EM.grid[y][x];
      }
    EM.w = w; EM.h = h; EM.grid = g;
    $('emW').value = w; $('emH').value = h;
    emDraw();
  }
  function emResize() {     // w/h inputs grow/shrink evenly around the centre
    var w = Math.max(4, Math.min(41, +$('emW').value || 13));
    var h = Math.max(4, Math.min(41, +$('emH').value || 13));
    emReshape(w, h, Math.round((w - EM.w) / 2), Math.round((h - EM.h) / 2));
  }
  function emGrow(side, d) {  // edge arrows: add/remove a line on that edge
    var w = EM.w, h = EM.h, offX = 0, offY = 0;
    if (side === 'top') { h += d; offY = d; }
    else if (side === 'bottom') h += d;
    else if (side === 'left') { w += d; offX = d; }
    else w += d;
    if (w < 4 || h < 4 || w > 41 || h > 41) return;
    emReshape(w, h, offX, offY);
  }

  function emSave() {
    var rows = EM.grid.map(function (r) { return r.join(''); });
    if (!rows.join('').replace(/\./g, '').length) return;   // empty drawing
    if (!$('emField').checked && !$('emBorder').checked) {  // must live somewhere
      var ck = document.querySelector('.editor__foot .checks');
      ck.classList.add('checks--warn');
      setTimeout(function () { ck.classList.remove('checks--warn'); }, 900);
      return;
    }
    if (!EM.id && EM.baseId) {          // editing a built-in: overwrite or copy?
      $('emConfirmName').textContent = motif(EM.baseId).name;
      $('emConfirm').hidden = false;
      return;
    }
    emCommit(EM.id || ('ozel' + Date.now()));
  }
  function emCommit(id) {
    var entry = {
      id: id,
      name: $('emName').value.trim() || ('Özel ' + (CUSTOMS.length + 1)),
      field: $('emField').checked, border: $('emBorder').checked,
      grid: EM.grid.map(function (r) { return r.join(''); })
    };
    var replaced = false;
    for (var i = 0; i < CUSTOMS.length; i++)
      if (CUSTOMS[i].id === id) { CUSTOMS[i] = entry; replaced = true; }
    if (!replaced) CUSTOMS.push(entry);
    saveCustoms(); closeEditor(); syncUI(); render();
  }

  // image → weave cells: shrink to the grid, detect the background, then map
  // every cell to the nearest of the 3 dominant remaining colours
  function quantizeImage(img, gw, gh) {
    var cv = document.createElement('canvas');
    cv.width = gw; cv.height = gh;
    var ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, gw, gh);
    var d = ctx.getImageData(0, 0, gw, gh).data;
    var n = gw * gh, px = new Array(n), counts = {}, sums = {}, hasAlpha = false;
    for (var i = 0; i < n; i++) {
      var a = d[i * 4 + 3];
      if (a < 120) { px[i] = null; hasAlpha = true; continue; }
      var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      var k = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
      counts[k] = (counts[k] || 0) + 1;
      var s = sums[k] || (sums[k] = [0, 0, 0]);
      s[0] += r; s[1] += g; s[2] += b;
      px[i] = [r, g, b, k];
    }
    function rep(k) { var s = sums[k], c = counts[k]; return [s[0] / c, s[1] / c, s[2] / c]; }
    function dist(p, q) {
      var dr = p[0] - q[0], dg = p[1] - q[1], db = p[2] - q[2];
      return dr * dr + dg * dg + db * db;
    }
    var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    var bgRep = hasAlpha ? null : rep(+keys[0]);
    var reps = [];
    for (var ki = 0; ki < keys.length && reps.length < 3; ki++) {
      var kr = rep(+keys[ki]);
      if (bgRep && dist(kr, bgRep) < 2000) continue;
      var ok = true;
      for (var rj = 0; rj < reps.length; rj++) if (dist(kr, reps[rj]) < 5000) { ok = false; break; }
      if (ok) reps.push(kr);
    }
    if (!reps.length) reps.push([0, 0, 0]);
    var out = [];
    for (var y = 0; y < gh; y++) {
      var row = [];
      for (var x = 0; x < gw; x++) {
        var p = px[y * gw + x];
        if (!p) { row.push('.'); continue; }
        var best = '.', bd = bgRep ? dist(p, bgRep) : Infinity;
        for (var j = 0; j < reps.length; j++) {
          var dd = dist(p, reps[j]);
          if (dd < bd) { bd = dd; best = String(j + 1); }
        }
        row.push(best);
      }
      out.push(row);
    }
    return out;
  }

  function emLoadFile(file) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      EM.grid = quantizeImage(img, EM.w, EM.h);
      URL.revokeObjectURL(url);
      emDraw();
    };
    img.src = url;
  }

  /* ================= randomize ================= */

  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randomize() {
    var fields = LIB.MOTIFS.filter(function (m) { return m.field && !isHidden(m); });
    var borders = LIB.MOTIFS.filter(function (m) { return m.border && !isHidden(m); });
    if (!fields.length) fields = LIB.MOTIFS.filter(function (m) { return m.field; });
    if (!borders.length) borders = LIB.MOTIFS.filter(function (m) { return m.border; });
    S.palette = rnd(LIB.PALETTES).id;
    S.colors = null;
    S.fieldMotifs = [{ id: rnd(fields).id, k: Math.random() < 0.2 ? 2 : 1 }];
    if (Math.random() < 0.35) {                       // sometimes weave two motifs together
      var second = rnd(fields).id;
      if (second !== S.fieldMotifs[0].id) S.fieldMotifs.push({ id: second, k: 1 });
    }
    S.mixMode = rnd(['row', 'row', 'column', 'checker']);
    S.layout = Math.random() < 0.4 ? 'brick' : 'grid';
    S.gapX = 1 + Math.floor(Math.random() * 4);
    S.gapY = 1 + Math.floor(Math.random() * 4);
    S.altColors = Math.random() < 0.7;
    S.mirrorRows = Math.random() < 0.35;
    var nB = 1 + Math.floor(Math.random() * 3);
    var pool = borders.slice();
    S.bands = [];
    for (var i = 0; i < nB && pool.length; i++) {
      var pick = rnd(pool);
      S.bands.push({ id: pick.id, k: 1 });
      pool = pool.filter(function (m) { return m.id !== pick.id; });
    }
    S.bandGap = Math.floor(Math.random() * 3);
    S.guards = Math.random() < 0.8;
    S.abrash = 0.25 + Math.random() * 0.5;
    S.seed = Math.floor(Math.random() * 1e9);
    syncUI(); render();
  }

  /* ================= UI ================= */

  function thumbSVG(m, big) {
    var zc = zoneColors();
    var pad = 1, w = m.w + pad * 2, h = m.h + pad * 2;
    var isBorder = !m.field;
    var g = isBorder ? zc.border.g : zc.field.g;
    var cs = isBorder ? [0, zc.border.c1, zc.border.c2, zc.border.c3] : [0, zc.field.c1, zc.field.c2, zc.field.c3];
    var rects = ['<rect width="' + w + '" height="' + h + '" fill="' + g + '"/>'];
    for (var y = 0; y < m.h; y++)
      for (var x = 0; x < m.w; x++) {
        var ch = m.grid[y][x];
        if (ch === '.') continue;
        rects.push('<rect x="' + (x + pad) + '" y="' + (y + pad) + '" width="1" height="1" fill="' + cs[+ch] + '"/>');
      }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" class="thumb__svg' +
      (big ? ' thumb__svg--big' : '') + '">' + rects.join('') + '</svg>';
  }

  function customTools(btn, m) {
    var ed = document.createElement('i');
    ed.className = 'thumb__tool';
    ed.textContent = '✎';
    ed.title = m.custom ? 'edit in atölye' : 'edit a copy in atölye';
    ed.onclick = function (ev) { ev.stopPropagation(); openEditor(m.id); };
    btn.appendChild(ed);
    var del = document.createElement('i');
    del.className = 'thumb__tool thumb__tool--del';
    del.textContent = '×';
    del.title = m.custom ? 'delete motif' : 'hide motif (restore in atölye)';
    del.onclick = function (ev) {
      ev.stopPropagation();
      if (m.custom) deleteCustom(m.id); else hideBuiltin(m.id);
    };
    btn.appendChild(del);
  }

  function selIndex(arr, id) {
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return i;
    return -1;
  }
  function toggleSel(key, id, max) {
    var i = selIndex(S[key], id);
    if (i >= 0) S[key].splice(i, 1);
    else if (!max || S[key].length < max) S[key].push({ id: id, k: 1 });
    syncUI(); render();
  }

  function buildLibrary() {
    var host = $('motifLib');
    host.innerHTML = '';
    allMotifs().filter(function (m) { return !isHidden(m); }).forEach(function (m) {
      var zi = selIndex(S.fieldMotifs, m.id), bi = selIndex(S.bands, m.id);
      var btn = document.createElement('button');
      btn.className = 'thumb' + (zi >= 0 || bi >= 0 ? ' thumb--on' : '');
      btn.title = m.name + ' — ' + m.meaning;
      btn.innerHTML = thumbSVG(m) + '<span>' + m.name + '</span>';
      var where = document.createElement('span');
      where.className = 'thumb__where';
      var wz = document.createElement('i');
      wz.className = 'wchip wchip--z' + (zi >= 0 ? ' wchip--on' : '') + (m.field ? ' wchip--sug' : '');
      wz.textContent = zi >= 0 ? 'Z' + (zi + 1) : 'Z';
      wz.title = (zi >= 0 ? 'remove from' : 'add to') + ' the field (zemin)';
      wz.onclick = function (ev) { ev.stopPropagation(); toggleSel('fieldMotifs', m.id, 0); };
      var wb = document.createElement('i');
      wb.className = 'wchip wchip--b' + (bi >= 0 ? ' wchip--on' : '') + (m.border ? ' wchip--sug' : '');
      wb.textContent = bi >= 0 ? 'B' + (bi + 1) : 'B';
      wb.title = (bi >= 0 ? 'remove from' : 'add to') + ' the frame (bordür)';
      wb.onclick = function (ev) { ev.stopPropagation(); toggleSel('bands', m.id, 5); };
      where.appendChild(wz); where.appendChild(wb);
      btn.appendChild(where);
      btn.onclick = function () { toggleSel('fieldMotifs', m.id, 0); };
      customTools(btn, m);
      host.appendChild(btn);
    });
  }

  // paired full-width range slider + editable number box for a scale value
  function kControl(get, set, min, max) {
    var rg = document.createElement('input');
    rg.type = 'range'; rg.min = String(min); rg.max = String(max); rg.step = '0.05';
    rg.value = get();
    var num = document.createElement('input');
    num.type = 'number'; num.className = 'numk';
    num.min = String(min); num.max = String(max); num.step = '0.05';
    num.value = get();
    rg.oninput = function () { num.value = rg.value; set(+rg.value); };
    num.onchange = function () {
      var v = Math.min(max, Math.max(min, +num.value || min));
      num.value = v; rg.value = v; set(v);
    };
    return [rg, num];
  }
  function buildSelList(hostId, key, maxK) {
    var host = $(hostId);
    host.innerHTML = '';
    S[key].forEach(function (e, i) {
      var m = motif(e.id);
      var row = document.createElement('div');
      row.className = 'selrow';
      var th = document.createElement('span');
      th.className = 'selrow__th';
      th.innerHTML = thumbSVG(m);
      th.title = m.name;
      var nm = document.createElement('span');
      nm.className = 'selrow__nm';
      nm.textContent = m.name;
      var kc = kControl(function () { return e.k; },
                        function (v) { e.k = v; render(); }, 0.5, maxK);
      var up = document.createElement('button');
      up.className = 'selrow__x selrow__mv';
      up.textContent = '▲';
      up.title = key === 'bands' ? 'move outward' : 'move up';
      up.disabled = i === 0;
      up.onclick = function () {
        S[key][i] = S[key][i - 1]; S[key][i - 1] = e;
        syncUI(); render();
      };
      var dn = document.createElement('button');
      dn.className = 'selrow__x selrow__mv';
      dn.textContent = '▼';
      dn.title = key === 'bands' ? 'move inward' : 'move down';
      dn.disabled = i === S[key].length - 1;
      dn.onclick = function () {
        S[key][i] = S[key][i + 1]; S[key][i + 1] = e;
        syncUI(); render();
      };
      var del = document.createElement('button');
      del.className = 'selrow__x';
      del.textContent = '×';
      del.title = 'remove';
      del.onclick = function () { S[key].splice(i, 1); syncUI(); render(); };
      var hd = document.createElement('div');
      hd.className = 'selrow__hd';
      hd.appendChild(th); hd.appendChild(nm);
      hd.appendChild(up); hd.appendChild(dn); hd.appendChild(del);
      var sz = document.createElement('div');
      sz.className = 'selrow__sz';
      sz.appendChild(kc[0]); sz.appendChild(kc[1]);
      row.appendChild(hd); row.appendChild(sz);
      host.appendChild(row);
    });
  }

  var FONT_NAMES = { blok: 'blok', ince: 'ince', kalin: 'kalın' };
  function buildTextSecs() {
    var host = $('textSecs');
    host.innerHTML = '';
    S.texts.forEach(function (sec, i) {
      var box = document.createElement('div');
      box.className = 'textsec';
      var ta = document.createElement('textarea');
      ta.className = 'tinput'; ta.rows = 1; ta.maxLength = 160;
      ta.placeholder = 'inscription…'; ta.spellcheck = false;
      ta.value = sec.t || '';
      var taT;
      ta.oninput = function () {
        sec.t = ta.value;
        clearTimeout(taT); taT = setTimeout(render, 200);
      };
      var row = document.createElement('div');
      row.className = 'textsec__row';
      var sel = document.createElement('select');
      Object.keys(FONT_NAMES).forEach(function (f) {
        var o = document.createElement('option');
        o.value = f; o.textContent = FONT_NAMES[f];
        if ((sec.font || 'blok') === f) o.selected = true;
        sel.appendChild(o);
      });
      sel.onchange = function () { sec.font = sel.value; render(); };
      if (!sec.k) sec.k = 2;
      var kc = kControl(function () { return sec.k; },
                        function (v) { sec.k = v; render(); }, 0.5, 6);
      var cp = document.createElement('input');
      cp.type = 'color'; cp.className = 'cpick';
      cp.value = sec.color || zoneColors().field.c3;
      cp.oninput = function () { sec.color = cp.value; render(); };
      var del = document.createElement('button');
      del.className = 'selrow__x';
      del.textContent = '×'; del.title = 'remove text';
      del.onclick = function () { S.texts.splice(i, 1); syncUI(); render(); };
      row.appendChild(sel); row.appendChild(cp); row.appendChild(del);
      var sz = document.createElement('div');
      sz.className = 'selrow__sz';
      sz.appendChild(kc[0]); sz.appendChild(kc[1]);
      box.appendChild(ta); box.appendChild(row); box.appendChild(sz);
      host.appendChild(box);
    });
  }

  function buildAtolyeList() {
    var host = $('customList');
    host.innerHTML = '';
    CUSTOMS.forEach(function (c) {
      var m = customAsMotif(c);
      var btn = document.createElement('button');
      btn.className = 'thumb';
      var where = [];
      if (m.field) where.push('field');
      if (m.border) where.push('frame');
      btn.title = m.name + ' — in pickers: ' + (where.join(' + ') || 'none') + ' (click to edit)';
      btn.innerHTML = thumbSVG(m) + '<span>' + m.name + (where.length ? '' : ' ∅') + '</span>';
      btn.onclick = function () { openEditor(m.id); };
      customTools(btn, m);
      host.appendChild(btn);
    });
    var hh = $('hiddenList');
    hh.innerHTML = '';
    HIDDEN.forEach(function (id) {
      var m = motif(id);
      if (m.id !== id) return;             // stale id
      var btn = document.createElement('button');
      btn.className = 'thumb thumb--hidden';
      btn.title = m.name + ' — hidden; click to restore to the pickers';
      btn.innerHTML = thumbSVG(m) + '<span>' + m.name + ' ↺</span>';
      btn.onclick = function () { unhideBuiltin(id); };
      hh.appendChild(btn);
    });
  }

  function deleteCustom(id) {
    CUSTOMS = CUSTOMS.filter(function (c) { return c.id !== id; });
    // purge selections only if the id is truly gone (an override delete just
    // uncovers the built-in, which stays selected)
    if (!allMotifs().some(function (m) { return m.id === id; })) {
      S.fieldMotifs = S.fieldMotifs.filter(function (x) { return x.id !== id; });
      S.bands = S.bands.filter(function (x) { return x.id !== id; });
    }
    saveCustoms(); syncUI(); render();
  }

  function buildPalettes() {
    var host = $('palettes');
    host.innerHTML = '';
    LIB.PALETTES.forEach(function (p) {
      var btn = document.createElement('button');
      btn.className = 'pal' + (p.id === S.palette && !S.colors ? ' pal--on' : '');
      btn.title = p.name + ' — ' + p.note;
      var sw = [p.field.g, p.field.c1, p.field.c2, p.border.g, p.border.c1].map(function (c) {
        return '<i style="background:' + c + '"></i>';
      }).join('');
      btn.innerHTML = '<span class="pal__sw">' + sw + '</span><span>' + p.name + '</span>';
      btn.onclick = function () {
        S.palette = p.id; S.colors = null;
        S.texts.forEach(function (t) { t.color = null; });  // re-follow the palette
        syncUI(); render();
      };
      host.appendChild(btn);
    });
  }

  var COLOR_DEFS = [
    ['field', 'g', 'field ground'], ['field', 'c1', 'field 1'], ['field', 'c2', 'field 2'], ['field', 'c3', 'field 3'],
    ['border', 'g', 'frame ground'], ['border', 'c1', 'frame 1'], ['border', 'c2', 'frame 2'], ['border', 'c3', 'frame 3']
  ];
  function buildColorInputs() {
    var host = $('colorInputs');
    host.innerHTML = '';
    var zc = zoneColors();
    COLOR_DEFS.forEach(function (d) {
      var wrap = document.createElement('label');
      wrap.className = 'cinp';
      var inp = document.createElement('input');
      inp.type = 'color';
      inp.value = zc[d[0]][d[1]];
      inp.oninput = function () {
        editColors()[d[0]][d[1]] = inp.value;
        buildPalettes(); render();
      };
      wrap.appendChild(inp);
      var sp = document.createElement('span');
      sp.textContent = d[2];
      wrap.appendChild(sp);
      host.appendChild(wrap);
    });
  }

  function bindRange(id, key, fmt) {
    var el = $(id), out = $(id + 'Val');
    el.oninput = function () {
      S[key] = +el.value;
      if (out) out.textContent = fmt ? fmt(S[key]) : S[key];
      render();
    };
  }
  function bindCheck(id, key) {
    $(id).onchange = function () { S[key] = $(id).checked; render(); };
  }

  function syncUI() {
    $('cols').value = S.cols; $('colsVal').textContent = S.cols;
    $('rows').value = S.rows; $('rowsVal').textContent = S.rows;
    $('gapX').value = S.gapX; $('gapXVal').textContent = S.gapX;
    $('gapY').value = S.gapY; $('gapYVal').textContent = S.gapY;
    $('bandGap').value = S.bandGap; $('bandGapVal').textContent = S.bandGap;
    $('textGap').value = S.textGap; $('textGapVal').textContent = S.textGap;
    $('textGapRow').style.display = S.texts.length > 1 ? '' : 'none';
    $('abrash').value = Math.round(S.abrash * 100); $('abrashVal').textContent = Math.round(S.abrash * 100) + '%';
    ['linocut', 'jitter', 'rgbShift'].forEach(function (k) {
      $(k).value = Math.round(S[k] * 100);
      $(k + 'Val').textContent = Math.round(S[k] * 100) + '%';
    });
    $('altColors').checked = S.altColors;
    $('mirrorRows').checked = S.mirrorRows;
    $('guards').checked = S.guards;
    $('ridges').checked = S.ridges;
    document.querySelectorAll('.seg [data-layout]').forEach(function (b) {
      b.classList.toggle('seg--on', b.dataset.layout === S.layout);
    });
    document.querySelectorAll('.seg [data-mix]').forEach(function (b) {
      b.classList.toggle('seg--on', b.dataset.mix === S.mixMode);
    });
    $('mixRow').style.display = S.fieldMotifs.length > 1 ? '' : 'none';
    buildLibrary();
    buildSelList('fieldSel', 'fieldMotifs', 5);
    buildSelList('bandSel', 'bands', 3);
    buildTextSecs();
    buildAtolyeList(); buildPalettes(); buildColorInputs();
  }

  function init() {
    rugEl = $('rug');

    bindRange('cols', 'cols'); bindRange('rows', 'rows');
    bindRange('gapX', 'gapX'); bindRange('gapY', 'gapY');
    bindRange('bandGap', 'bandGap');
    bindRange('textGap', 'textGap');
    $('btnAddText').onclick = function () {
      S.texts.push({ t: '', k: 2, font: 'blok', color: null });
      syncUI();
      var tas = document.querySelectorAll('#textSecs textarea');
      if (tas.length) tas[tas.length - 1].focus();
    };
    $('abrash').oninput = function () {
      S.abrash = +this.value / 100; $('abrashVal').textContent = this.value + '%'; render();
    };
    ['linocut', 'jitter', 'rgbShift'].forEach(function (k) {
      $(k).oninput = function () {
        S[k] = +this.value / 100; $(k + 'Val').textContent = this.value + '%'; render();
      };
    });
    bindCheck('altColors', 'altColors');
    bindCheck('mirrorRows', 'mirrorRows');
    bindCheck('guards', 'guards');
    bindCheck('ridges', 'ridges');
    document.querySelectorAll('.seg [data-layout]').forEach(function (b) {
      b.onclick = function () { S.layout = b.dataset.layout; syncUI(); render(); };
    });
    document.querySelectorAll('.seg [data-mix]').forEach(function (b) {
      b.onclick = function () { S.mixMode = b.dataset.mix; syncUI(); render(); };
    });
    $('btnRandom').onclick = randomize;
    $('btnSvg').onclick = exportSVG;
    $('btnPng').onclick = exportPNG;
    $('btnLink').onclick = copyLink;

    // atölye
    $('btnNewMotif').onclick = function () { openEditor(null); };
    $('emClose').onclick = closeEditor;
    $('editor').onclick = function (e) { if (e.target === this) closeEditor(); };
    $('emSave').onclick = emSave;
    $('emOw').onclick = function () { $('emConfirm').hidden = true; emCommit(EM.baseId); };
    $('emCopy').onclick = function () { $('emConfirm').hidden = true; emCommit('ozel' + Date.now()); };
    $('emCancel').onclick = function () { $('emConfirm').hidden = true; };
    $('emClear').onclick = function () { EM.grid = emBlank(EM.w, EM.h); emDraw(); };
    $('emW').onchange = emResize; $('emH').onchange = emResize;
    document.querySelectorAll('[data-grow]').forEach(function (b) {
      b.onclick = function () {
        var p = b.dataset.grow.split(':');
        emGrow(p[0], +p[1]);
      };
    });
    $('emUpload').onclick = function () { $('fileIn').click(); };
    $('fileIn').onchange = function () {
      if (this.files && this.files[0]) emLoadFile(this.files[0]);
      this.value = '';
    };
    var emCv = $('emCanvas');
    emCv.onmousedown = function (e) { EM.painting = true; emPaint(e); e.preventDefault(); };
    emCv.onmousemove = function (e) { if (EM.painting) emPaint(e); };
    window.addEventListener('mouseup', function () { EM.painting = false; });

    window.addEventListener('resize', refit);
    if (window.ResizeObserver) new ResizeObserver(refit).observe($('stage'));

    syncUI(); render();
    requestAnimationFrame(refit);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
