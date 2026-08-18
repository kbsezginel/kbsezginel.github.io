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
    fieldMotifs: ['elibelinde'],
    mixMode: 'row',            // row | column | checker — how multiple motifs alternate
    layout: 'grid',            // grid | brick
    scaleF: 1,                 // field motif magnification (integer cell doubling)
    gapX: 2, gapY: 3,
    altColors: true,           // checkerboard colorway swap
    mirrorRows: false,         // flip motif vertically on alternate rows
    bands: ['gozdizi', 'suyolu'],   // selection order = outer → inner band order
    scaleB: 1,                      // band motif magnification
    bandGap: 1,
    text: '',                       // woven inscription, centered in the field ('|' = new line)
    scaleT: 2,                      // text magnification
    guards: true,              // thin guard stripes between bands
    abrash: 0.5,               // 0..1 natural dye variation
    ridges: true,              // weft ridge texture
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
    if (!Array.isArray(out.fieldMotifs) || !out.fieldMotifs.length) out.fieldMotifs = ['elibelinde'];
    if (s && s.bandCount !== undefined && Array.isArray(s.bands))              // pre-selection states
      out.bands = s.bands.slice(0, s.bandCount);
    if (!Array.isArray(out.bands)) out.bands = [];
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

  function motif(id) {
    for (var i = 0; i < LIB.MOTIFS.length; i++) if (LIB.MOTIFS[i].id === id) return LIB.MOTIFS[i];
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
  function lineWidth(str) {
    var w = 0;
    for (var i = 0; i < str.length; i++) {
      var g = LIB.FONT[str[i]];
      if (g) w += g[0].length + 1;
    }
    return w ? w - 1 : 0;
  }
  function buildTextGrid(text, maxCols) {
    var lines = [];
    text.split('|').forEach(function (part) {
      var up = part.toLocaleUpperCase ? part.toLocaleUpperCase('tr-TR') : part.toUpperCase();
      var words = up.split(/\s+/).filter(Boolean);
      var cur = '';
      words.forEach(function (w) {
        var cand = cur ? cur + ' ' + w : w;
        if (cur && maxCols && lineWidth(cand) > maxCols) { lines.push(cur); cur = w; }
        else cur = cand;
      });
      if (cur) lines.push(cur);
    });
    var built = [];
    lines.forEach(function (up) {
      var rows = ['', '', '', '', '', '', '', '', '', ''];
      for (var i = 0; i < up.length; i++) {
        var g = LIB.FONT[up[i]];
        if (!g) continue;
        var off = g.length === 10 ? 0 : 2, w = g[0].length;
        var blank = new Array(w + 1).join('.');
        for (var r = 0; r < 10; r++)
          rows[r] += ((r >= off && r - off < g.length) ? g[r - off] : blank) + '.';
      }
      if (rows[0].length) built.push(rows.map(function (r) { return r.slice(0, -1); }));
    });
    if (!built.length) return null;
    // stack lines (2 blank rows between), centering each horizontally
    var W = 0;
    built.forEach(function (l) { W = Math.max(W, l[0].length); });
    var out = [];
    built.forEach(function (l, li) {
      if (li) { out.push(new Array(W + 1).join('.')); out.push(new Array(W + 1).join('.')); }
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
    var cells = new Uint8Array(W * H);      // 0 = field ground
    var b = { x0: 0, y0: 0, x1: W - 1, y1: H - 1 };

    function fill(x0, y0, x1, y1, v) {
      if (x1 < x0 || y1 < y0) return;
      for (var y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
        for (var x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++)
          cells[y * W + x] = v;
    }
    function ring(t, v) {
      fill(b.x0, b.y0, b.x1, b.y0 + t - 1, v);
      fill(b.x0, b.y1 - t + 1, b.x1, b.y1, v);
      fill(b.x0, b.y0, b.x0 + t - 1, b.y1, v);
      fill(b.x1 - t + 1, b.y0, b.x1, b.y1, v);
      b.x0 += t; b.y0 += t; b.x1 -= t; b.y1 -= t;
    }
    function paint(g, px, py, map, clip) {
      for (var y = 0; y < g.length; y++)
        for (var x = 0; x < g[y].length; x++) {
          var ch = g[y][x];
          if (ch === '.') continue;
          var X = px + x, Y = py + y;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          if (clip && (X < clip.x0 || X > clip.x1 || Y < clip.y0 || Y > clip.y1)) continue;
          cells[Y * W + X] = map[ch];
        }
    }
    // tile grid g horizontally in [xa..xb] at row py.
    // flow motifs run unbroken edge to edge (clipped); discrete ones are centered.
    function tileH(g, xa, xb, py, map, gap, flow) {
      var mw = g[0].length, len = xb - xa + 1;
      if (flow) {
        var clip = { x0: xa, x1: xb, y0: 0, y1: H - 1 };
        for (var x = xa; x <= xb; x += mw) paint(g, x, py, map, clip);
        return;
      }
      var n = Math.floor((len + gap) / (mw + gap));
      if (n < 1) return;
      var total = n * mw + (n - 1) * gap;
      var off = xa + ((len - total) >> 1);
      for (var i = 0; i < n; i++) paint(g, off + i * (mw + gap), py, map);
    }
    function tileV(g, ya, yb, px, map, gap, flow) {
      var mh = g.length, len = yb - ya + 1;
      if (flow) {
        var clip = { x0: 0, x1: W - 1, y0: ya, y1: yb };
        for (var y = ya; y <= yb; y += mh) paint(g, px, y, map, clip);
        return;
      }
      var n = Math.floor((len + gap) / (mh + gap));
      if (n < 1) return;
      var total = n * mh + (n - 1) * gap;
      var off = ya + ((len - total) >> 1);
      for (var i = 0; i < n; i++) paint(g, px, off + i * (mh + gap), map);
    }
    function corner(cx, cy, t, map) {     // small stepped diamond in a t×t corner block
      var c = (t - 1) / 2, r = Math.max(1, Math.floor(t / 2) - 1);
      for (var y = 0; y < t; y++)
        for (var x = 0; x < t; x++) {
          var d = Math.abs(x - c) + Math.abs(y - c);
          if (d <= r) cells[(cy + y) * W + (cx + x)] = d <= r - 2 ? map['2'] : map['1'];
        }
    }

    // --- frame ---
    ring(1, 4);                                    // selvedge
    if (S.guards) ring(1, 6);                      // outer guard stripe

    for (var i = 0; i < S.bands.length; i++) {
      var m = motif(S.bands[i]);
      // desired band scale, dropped per band until the ring fits; skip if even ×1 won't
      var t = 0, bg = null;
      for (var kb = Math.max(1, S.scaleB | 0); kb >= 1; kb--) {
        var tt = m.h * kb + 2;
        if (b.x1 - b.x0 + 1 >= 2 * tt + 16 && b.y1 - b.y0 + 1 >= 2 * tt + 16) {
          t = tt; bg = scaleGrid(m.grid, kb); break;
        }
      }
      if (!t) break;
      var map = (i % 2 === 0) ? MAP_A : MAP_B;
      var bx0 = b.x0, by0 = b.y0, bx1 = b.x1, by1 = b.y1;
      ring(t, 4);                                  // band ground
      // motifs: top / bottom / left / right (mirrored so the frame is symmetric)
      var fl = !!m.flow;
      tileH(bg, bx0 + t, bx1 - t, by0 + 1, map, S.bandGap, fl);
      tileH(flipV(bg), bx0 + t, bx1 - t, by1 - t + 2, map, S.bandGap, fl);
      tileV(rotCCW(bg), by0 + t, by1 - t, bx0 + 1, map, S.bandGap, fl);
      tileV(rotCW(bg), by0 + t, by1 - t, bx1 - t + 2, map, S.bandGap, fl);
      if (t >= 5) {                                // corner blocks
        corner(bx0, by0, t, map); corner(bx1 - t + 1, by0, t, map);
        corner(bx0, by1 - t + 1, t, map); corner(bx1 - t + 1, by1 - t + 1, t, map);
      }
      if (S.guards) ring(1, 6);                    // stripe after each band
    }

    // --- field ---
    var fms = S.fieldMotifs.map(motif);
    var nM = fms.length;
    var fx0 = b.x0 + 1, fy0 = b.y0 + 1, fx1 = b.x1 - 1, fy1 = b.y1 - 1;   // breathing margin
    var fw = fx1 - fx0 + 1, fh = fy1 - fy0 + 1;
    // all motifs share one slot grid sized by the largest, each centered in its slot
    var maxW = 0, maxH = 0;
    fms.forEach(function (m) { maxW = Math.max(maxW, m.w); maxH = Math.max(maxH, m.h); });
    var fk = Math.max(1, S.scaleF | 0);
    // desired scale, clamped to the largest that still fits the field
    fk = Math.max(1, Math.min(fk, Math.floor(fw / maxW), Math.floor(fh / maxH)));
    var grids = fms.map(function (m) { return scaleGrid(m.grid, fk); });
    var slotW = maxW * fk, slotH = maxH * fk;

    // --- woven inscription, centered; motifs tessellate around it ---
    var tGrid = null, tx = 0, ty = 0, tRect = null;
    if (S.text && S.text.trim()) {
      // try the desired size first; wrap words to the field, then shrink if
      // the wrapped block still overflows
      for (var tk = Math.max(1, S.scaleT | 0); tk >= 1; tk--) {
        tGrid = buildTextGrid(S.text, Math.floor(fw / tk));
        if (!tGrid) break;
        if (tk === 1 || (tGrid[0].length * tk <= fw && tGrid.length * tk <= fh)) {
          tGrid = scaleGrid(tGrid, tk);
          break;
        }
      }
    }
    if (tGrid) {
      tx = fx0 + ((fw - tGrid[0].length) >> 1);
      ty = fy0 + ((fh - tGrid.length) >> 1);
      var tp = 2;                                  // breathing room around the letters
      tRect = { x0: tx - tp, y0: ty - tp, x1: tx + tGrid[0].length - 1 + tp, y1: ty + tGrid.length - 1 + tp };
    }
    if (fw < slotW || fh < slotH) {
      // motif larger than the field: weave a single one, centered and clipped
      if (fw > 2 && fh > 2) paint(grids[0], fx0 + ((fw - slotW) >> 1), fy0 + ((fh - slotH) >> 1),
        FMAP_A, { x0: fx0, y0: fy0, x1: fx1, y1: fy1 });
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
          if (tRect) {                             // leave the inscription's clearing open
            var sx = xs + rx * stepX, sy = offY + ry * stepY;
            if (!(sx + slotW - 1 < tRect.x0 || sx > tRect.x1 ||
                  sy + slotH - 1 < tRect.y0 || sy > tRect.y1)) continue;
          }
          var mi = nM < 2 ? 0 :
            (S.mixMode === 'column' ? rx : S.mixMode === 'checker' ? rx + ry : ry) % nM;
          var m = fms[mi], g = grids[mi];
          // directional creatures (birds, cars) mirror sideways so rows face
          // each other; abstract motifs invert, as on traditional kilims
          if (S.mirrorRows && odd) g = m.facing ? flipH(g) : flipV(g);
          var fmap = (S.altColors && (rx + ry) % 2 === 1) ? FMAP_B : FMAP_A;
          paint(g, xs + rx * stepX + ((slotW - g[0].length) >> 1),
                offY + ry * stepY + ((slotH - g.length) >> 1), fmap);
        }
      }
    }
    if (tGrid) paint(tGrid, tx, ty, { '1': 3 }, { x0: fx0, y0: fy0, x1: fx1, y1: fy1 });

    var zc = zoneColors();
    return {
      W: W, H: H, cells: cells,
      colors: [zc.field.g, zc.field.c1, zc.field.c2, zc.field.c3,
               zc.border.g, zc.border.c1, zc.border.c2, zc.border.c3]
    };
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
    var paths = colors.map(function () { return []; });
    for (var y = 0; y < H; y++) {
      var x = 0;
      while (x < W) {
        var v = cells[y * W + x], x2 = x + 1;
        while (x2 < W && cells[y * W + x2] === v) x2++;
        paths[v].push('M' + x + ' ' + y + 'h' + (x2 - x) + 'v1h-' + (x2 - x) + 'z');
        x = x2;
      }
    }
    var out = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '"' +
      (pxW ? ' width="' + pxW + '" height="' + pxH + '"' : '') + ' shape-rendering="crispEdges">');
    out.push('<defs><pattern id="weft" width="1" height="1" patternUnits="userSpaceOnUse">' +
      '<rect y="0.72" width="1" height="0.14" fill="#000" opacity="0.10"/>' +
      '<rect y="0.06" width="1" height="0.10" fill="#fff" opacity="0.05"/></pattern></defs>');
    for (var c = 0; c < colors.length; c++)
      if (paths[c].length) out.push('<path fill="' + colors[c] + '" d="' + paths[c].join('') + '"/>');
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

  var rugEl, legendEl, lastFit = '';

  function fitSize() {
    var stage = $('stage');
    var maxW = stage.clientWidth - 8;
    var maxH = window.innerHeight - stage.getBoundingClientRect().top - 88;
    maxH = Math.max(maxH, 320);
    var k = Math.min(maxW / S.cols, maxH / S.rows);
    return { w: Math.max(120, Math.floor(S.cols * k)), h: Math.max(120, Math.floor(S.rows * k)) };
  }

  function render() {
    var model = compose();
    var fit = fitSize();
    lastFit = fit.w + 'x' + fit.h;
    rugEl.innerHTML = toSVG(model, fit.w, fit.h);
    renderLegend();
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

  function renderLegend() {
    var used = S.fieldMotifs.concat(S.bands);
    var seen = {}, html = [];
    used.forEach(function (id) {
      if (seen[id]) return; seen[id] = 1;
      var m = motif(id);
      html.push('<div class="legend__item"><b>' + m.name + '</b> <i>' + m.en + '</i><span>' +
        m.meaning + '</span></div>');
    });
    var p = palette(S.palette);
    legendEl.innerHTML = html.join('') +
      '<div class="legend__meta">' + S.cols + ' × ' + S.rows + ' ilmek · ' +
      (S.colors ? 'custom colours' : p.name + ' — ' + p.note) + '</div>';
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

  /* ================= randomize ================= */

  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randomize() {
    var fields = LIB.MOTIFS.filter(function (m) { return m.field; });
    var borders = LIB.MOTIFS.filter(function (m) { return m.border; });
    S.palette = rnd(LIB.PALETTES).id;
    S.colors = null;
    S.fieldMotifs = [rnd(fields).id];
    if (Math.random() < 0.35) {                       // sometimes weave two motifs together
      var second = rnd(fields).id;
      if (second !== S.fieldMotifs[0]) S.fieldMotifs.push(second);
    }
    S.mixMode = rnd(['row', 'row', 'column', 'checker']);
    S.scaleF = Math.random() < 0.2 ? 2 : 1;
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
      S.bands.push(pick.id);
      pool = pool.filter(function (m) { return m.id !== pick.id; });
    }
    S.scaleB = 1;
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

  function buildFieldPicker() {
    var host = $('fieldPicker');
    host.innerHTML = '';
    LIB.MOTIFS.filter(function (m) { return m.field; }).forEach(function (m) {
      var sel = S.fieldMotifs.indexOf(m.id);
      var btn = document.createElement('button');
      btn.className = 'thumb' + (sel >= 0 ? ' thumb--on' : '');
      btn.title = m.name + ' — ' + m.meaning + ' (click to add/remove)';
      btn.innerHTML = thumbSVG(m) + '<span>' + m.name + '</span>' +
        (sel >= 0 && S.fieldMotifs.length > 1 ? '<i class="thumb__n">' + (sel + 1) + '</i>' : '');
      btn.onclick = function () {
        var i = S.fieldMotifs.indexOf(m.id);
        if (i >= 0) { if (S.fieldMotifs.length > 1) S.fieldMotifs.splice(i, 1); }
        else S.fieldMotifs.push(m.id);
        syncUI(); render();
      };
      host.appendChild(btn);
    });
  }

  function buildBandPicker() {
    var host = $('bandPicker');
    host.innerHTML = '';
    LIB.MOTIFS.filter(function (m) { return m.border; }).forEach(function (m) {
      var sel = S.bands.indexOf(m.id);
      var btn = document.createElement('button');
      btn.className = 'thumb' + (sel >= 0 ? ' thumb--on' : '');
      btn.title = m.name + ' — ' + m.meaning + ' (click to add/remove; order = outer to inner)';
      btn.innerHTML = thumbSVG(m) + '<span>' + m.name + '</span>' +
        (sel >= 0 ? '<i class="thumb__n">' + (sel + 1) + '</i>' : '');
      btn.onclick = function () {
        var i = S.bands.indexOf(m.id);
        if (i >= 0) S.bands.splice(i, 1);
        else if (S.bands.length < 5) S.bands.push(m.id);
        syncUI(); render();
      };
      host.appendChild(btn);
    });
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
      btn.onclick = function () { S.palette = p.id; S.colors = null; syncUI(); render(); };
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
    $('scaleF').value = S.scaleF; $('scaleFVal').textContent = S.scaleF;
    $('gapX').value = S.gapX; $('gapXVal').textContent = S.gapX;
    $('gapY').value = S.gapY; $('gapYVal').textContent = S.gapY;
    $('bandGap').value = S.bandGap; $('bandGapVal').textContent = S.bandGap;
    $('scaleB').value = S.scaleB; $('scaleBVal').textContent = S.scaleB;
    $('scaleT').value = S.scaleT; $('scaleTVal').textContent = S.scaleT;
    if ($('textIn').value !== S.text) $('textIn').value = S.text;
    $('abrash').value = Math.round(S.abrash * 100); $('abrashVal').textContent = Math.round(S.abrash * 100) + '%';
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
    buildFieldPicker(); buildBandPicker(); buildPalettes(); buildColorInputs();
  }

  function init() {
    rugEl = $('rug'); legendEl = $('legend');

    bindRange('cols', 'cols'); bindRange('rows', 'rows');
    bindRange('scaleF', 'scaleF');
    bindRange('gapX', 'gapX'); bindRange('gapY', 'gapY');
    bindRange('bandGap', 'bandGap');
    bindRange('scaleB', 'scaleB');
    bindRange('scaleT', 'scaleT');
    var tT;
    $('textIn').oninput = function () {
      S.text = this.value;
      clearTimeout(tT); tT = setTimeout(render, 200);
    };
    $('abrash').oninput = function () {
      S.abrash = +this.value / 100; $('abrashVal').textContent = this.value + '%'; render();
    };
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
    document.querySelectorAll('[data-size]').forEach(function (b) {
      b.onclick = function () {
        var wh = b.dataset.size.split('x');
        S.cols = +wh[0]; S.rows = +wh[1]; syncUI(); render();
      };
    });
    $('btnRandom').onclick = randomize;
    $('btnSvg').onclick = exportSVG;
    $('btnPng').onclick = exportPNG;
    $('btnLink').onclick = copyLink;

    window.addEventListener('resize', refit);
    if (window.ResizeObserver) new ResizeObserver(refit).observe($('stage'));

    syncUI(); render();
    requestAnimationFrame(refit);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
