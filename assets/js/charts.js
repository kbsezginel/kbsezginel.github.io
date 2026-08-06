/* Charts — chord chart viewer & editor
   Parsing (chords-over-lyrics + inline ChordPro + bar rows), transposition,
   lyric & bar views, in-browser editing, chord shape solver + SVG diagrams,
   search, import. Edits save to /api/save (local preview server) or fall
   back to this browser's storage. */

(() => {
'use strict';

/* ================= notes & chords ================= */

const NOTE_INDEX = {
  'C': 0, 'B#': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'Fb': 4,
  'E#': 5, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
  'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11
};
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
/* major-key pitch classes that conventionally spell with flats */
const FLAT_MAJOR = new Set([1, 3, 5, 8, 10]);

const CHORD_RE = /^([A-G][#b]?)((?:maj|min|dim|aug|sus|add|m|M|°|ø|Δ|\+|-|\d|#|b|\(|\))*)(?:\/([A-G][#b]?))?$/;

function parseChord(tok) {
  const m = CHORD_RE.exec(tok);
  if (!m) return null;
  return { root: m[1], qual: m[2] || '', bass: m[3] || null };
}

function transposeNote(name, steps, preferFlat) {
  const i = NOTE_INDEX[name];
  if (i === undefined) return name;
  const j = ((i + steps) % 12 + 12) % 12;
  return preferFlat ? FLAT[j] : SHARP[j];
}

function transposeChordSym(sym, steps, preferFlat) {
  const c = parseChord(sym);
  if (!c || steps === 0) return sym;
  let out = transposeNote(c.root, steps, preferFlat) + c.qual;
  if (c.bass) out += '/' + transposeNote(c.bass, steps, preferFlat);
  return out;
}

/* Given a key like "Cm" and a shift, return {name, preferFlat} for the new key */
function shiftKey(key, steps) {
  const m = /^([A-G][#b]?)(m|min)?/.exec(key || '');
  if (!m) return { name: '', preferFlat: false };
  const minor = !!m[2];
  const pc = ((NOTE_INDEX[m[1]] + steps) % 12 + 12) % 12;
  const relMajor = minor ? (pc + 3) % 12 : pc;
  /* Gb major is a toss-up (F# vs Gb) but its relative minor reads far
     better as Ebm than D#m */
  const preferFlat = FLAT_MAJOR.has(relMajor) || (minor && relMajor === 6);
  return { name: (preferFlat ? FLAT[pc] : SHARP[pc]) + (minor ? 'm' : ''), preferFlat };
}

/* ================= body parsing =================

   Model lines:
     {type:'blank'}
     {type:'section', name}
     {type:'lyric', text, chords:[{sym,col}], repeat, instrumental}

   The canonical stored format is "over": a chord line whose symbols are
   column-aligned above the lyric line below it. */

const DECOR = new Set(['|', '||', '|:', ':|', ':||', '-', '.', '·', '%', 'N.C.', 'n.c.']);
const isDecor = (t) => DECOR.has(t) || /^\(?[x×]\d+\)?$/i.test(t);

function isChordLine(line) {
  const toks = line.trim().split(/\s+/).filter(Boolean);
  if (!toks.length) return false;
  let chords = 0;
  for (const t of toks) {
    if (parseChord(t)) chords++;
    else if (!isDecor(t)) return false;
  }
  return chords > 0;
}

function sectionName(line) {
  const m = /^\[([^\]]+)\]\s*$/.exec(line.trim());
  if (m && !parseChord(m[1])) return m[1];
  return null;
}

/* positioned tokens from a chord line: chords plus decorations like "|",
   so they survive edit/re-key round-trips; xN repeats are handled separately */
function chordTokens(line) {
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(line))) {
    if (/^\(?[x×]\d+\)?$/i.test(m[0])) continue;
    if (parseChord(m[0]) || isDecor(m[0])) out.push({ sym: m[0], col: m.index });
  }
  return out;
}

/* strip trailing "x2" → [cleanText, repeat] */
function stripRepeat(text) {
  let rep = null;
  const clean = text.replace(/(?:\s|^)[x×](\d+)\s*$/i, (m, n) => { rep = +n; return ''; });
  return [rep === null ? text : clean.replace(/\s+$/, ''), rep];
}

function repeatFromDecor(line) {
  const m = /[x×](\d+)/i.exec(line);
  return m ? +m[1] : null;
}

function parseOver(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) { out.push({ type: 'blank' }); continue; }
    const sec = sectionName(raw);
    if (sec) { out.push({ type: 'section', name: sec }); continue; }
    if (isChordLine(raw)) {
      const next = lines[i + 1];
      if (next && next.trim() && !isChordLine(next) && !sectionName(next)) {
        const [clean, rep] = stripRepeat(next);
        out.push({ type: 'lyric', text: clean, chords: chordTokens(raw), repeat: rep });
        i++;
      } else {
        out.push({
          type: 'lyric', text: '', chords: chordTokens(raw),
          repeat: repeatFromDecor(raw), instrumental: true
        });
      }
    } else {
      const [clean, rep] = stripRepeat(raw);
      out.push({ type: 'lyric', text: clean, chords: [], repeat: rep });
    }
  }
  return trimBlanks(out);
}

function parseInline(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const out = [];
  for (const raw of lines) {
    if (!raw.trim()) { out.push({ type: 'blank' }); continue; }
    const sec = sectionName(raw);
    if (sec) { out.push({ type: 'section', name: sec }); continue; }
    const chords = [];
    let plain = '';
    let last = 0, m;
    const re = /\[([^\]\s]+)\]/g;
    while ((m = re.exec(raw))) {
      plain += raw.slice(last, m.index);
      if (parseChord(m[1])) chords.push({ sym: m[1], col: plain.length });
      else plain += m[0];
      last = re.lastIndex;
    }
    plain += raw.slice(last);
    const [clean, rep] = stripRepeat(plain);
    out.push({
      type: 'lyric', text: clean, chords, repeat: rep,
      instrumental: chords.length > 0 && !clean.trim()
    });
  }
  return trimBlanks(out);
}

function trimBlanks(lines) {
  while (lines.length && lines[0].type === 'blank') lines.shift();
  while (lines.length && lines[lines.length - 1].type === 'blank') lines.pop();
  return lines;
}

function parseSong(song) {
  const fmt = song.format || (/\[[A-G][#b]?[^\]]*\]/.test(song.body) ? 'inline' : 'over');
  return fmt === 'inline' ? parseInline(song.body) : parseOver(song.body);
}

function serializeBody(lines) {
  const out = [];
  for (const l of lines) {
    if (l.type === 'blank') { out.push(''); continue; }
    if (l.type === 'section') { out.push('[' + l.name + ']'); continue; }
    if (l.chords.length) {
      let row = '';
      for (const c of [...l.chords].sort((a, b) => a.col - b.col)) {
        const at = Math.max(c.col, row.length ? row.length + 1 : 0);
        row = row.padEnd(at, ' ') + c.sym;
      }
      if (l.instrumental && l.repeat) row += '  x' + l.repeat;
      out.push(row);
    }
    if (!l.instrumental) out.push(l.text + (l.repeat ? '  x' + l.repeat : ''));
  }
  return out.join('\n');
}

/* ================= bars parsing =================

   Bar chart text: one row per line, bars separated by "|", several chords
   in one bar separated by spaces, "·" = empty bar, trailing "x2" = repeat.
   A plain text line right after a row is that row's lyric caption.

   Model: {type:'blank'} | {type:'section',name} | {type:'note',text}
        | {type:'row', bars:[[tok,...],...], caption, repeat}          */

/* Split a bar row on "|", honoring "|:" / ":|" repeat signs: they attach to
   the adjacent bar as '|:' / ':|' tokens (and act as the barline themselves).
   Bare empty cells are syntax artifacts and dropped — "·" is the hold bar. */
const GAP = [' ']; /* sentinel bar: a visual gap between bars (no barline) */
const isGap = (ts) => ts.length === 1 && ts[0] === ' ';

function splitBarRow(body) {
  const s = body.replace(/\|:/g, '|\u0001').replace(/:\|/g, '\u0002|');
  const out = [];
  for (const c of s.split('|')) {
    const start = c.includes('\u0001');
    const end = c.includes('\u0002');
    const t = c.replace(/[\u0001\u0002]/g, '');
    if (!t.trim() && !start && !end) {
      /* pure-whitespace cell: 3+ spaces means an intentional gap */
      if (/ {3,}/.test(t) && out.length) out.push(GAP.slice());
      continue;
    }
    /* a 3+ space run inside a cell is also a gap (no pipe needed) */
    const pieces = t.trim().split(/ {3,}/);
    pieces.forEach((piece, pi) => {
      if (pi > 0) out.push(GAP.slice());
      const toks = (piece === '' || piece === '·') ? [] : piece.split(/\s+/);
      if (start && pi === 0) toks.unshift('|:');
      if (end && pi === pieces.length - 1) toks.push(':|');
      out.push(toks);
    });
  }
  while (out.length && isGap(out[0])) out.shift();
  while (out.length && isGap(out[out.length - 1])) out.pop();
  return out;
}

function joinBarRow(bars) {
  let out = null, prev = null, gap = false;
  for (const ts of bars) {
    if (isGap(ts)) { gap = true; continue; }
    const cell = ts.length ? ts.join(' ') : '·';
    if (out === null) out = cell;
    else if (gap) out += '    ' + cell;
    else {
      const noPipe = (prev.length && prev[prev.length - 1] === ':|') || ts[0] === '|:';
      out += (noPipe ? ' ' : ' | ') + cell;
    }
    prev = ts;
    gap = false;
  }
  return out || '';
}

function parseBars(text) {
  const out = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) { out.push({ type: 'blank' }); continue; }
    const sec = sectionName(line);
    if (sec) { out.push({ type: 'section', name: sec }); continue; }
    if (line.includes('|') || isChordLine(line)) {
      const [body, rep] = stripRepeat(line);
      const bars = splitBarRow(body);
      out.push({ type: 'row', bars: bars.length ? bars : [[]], caption: '', repeat: rep });
    } else {
      const prev = out[out.length - 1];
      if (prev && prev.type === 'row' && !prev.caption) prev.caption = line;
      else out.push({ type: 'note', text: line });
    }
  }
  return trimBlanks(out);
}

function serializeBars(model) {
  const out = [];
  for (const l of model) {
    if (l.type === 'blank') { out.push(''); continue; }
    if (l.type === 'section') { out.push('[' + l.name + ']'); continue; }
    if (l.type === 'note') { out.push(l.text); continue; }
    let row = joinBarRow(l.bars);
    if (l.repeat) row += '   x' + l.repeat;
    out.push(row);
    if (l.caption) out.push(l.caption);
  }
  return out.join('\n');
}

/* ================= arrangement parsing =================

   Arrangement text: "Name: <bars>" lines define parts (same bar syntax:
   "|" splits bars, spaces split chords in a bar, trailing xN repeats),
   and an "order:" line (or any line without a colon) lists the play
   order as comma-separated part names with optional xN counts.

   Model: {parts: [{name, bars:[[tok,...],...], repeat}],
           order: [{name, times}]}                                  */

/* a colon-less line that looks like chords/bars is a continuation row of
   the previous part; anything else is play order */
function isBarRowLike(line) {
  return /[|·%]|\|:/.test(line) || isChordLine(line);
}

function parseArrangement(text) {
  const parts = [], order = [];
  let cur = null;
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^([^:|]+?)(?:\s+[x×](\d+))?:\s*(.*)$/.exec(line);
    if (m && !/^(order|s[ıi]ra)$/i.test(m[1].trim())) {
      const [body, rep] = stripRepeat(m[3]);
      cur = {
        name: m[1].trim(),
        repeat: m[2] ? +m[2] : null, /* whole-part repeat: "Verse x2:" */
        rows: [{ bars: splitBarRow(body), repeat: rep }]
      };
      parts.push(cur);
    } else if (!m && cur && isBarRowLike(line)) {
      const [body, rep] = stripRepeat(line);
      cur.rows.push({ bars: splitBarRow(body), repeat: rep });
    } else {
      cur = null;
      const items = (m ? m[3] : line).split(/,|→|>/).map(s => s.trim()).filter(Boolean);
      for (const it of items) {
        const mm = /^(.*?)(?:\s*[x×](\d+))?$/.exec(it);
        order.push({ name: mm[1].trim(), times: mm[2] ? +mm[2] : 1 });
      }
    }
  }
  return { parts, order };
}

function serializeArrangement(arr) {
  const lines = [];
  const rowText = (r) => joinBarRow(r.bars) + (r.repeat ? '   x' + r.repeat : '');
  for (const p of arr.parts) {
    const head = p.name + (p.repeat ? ' x' + p.repeat : '') + ': ';
    lines.push(head + (p.rows.length ? rowText(p.rows[0]) : ''));
    const pad = ' '.repeat(head.length);
    for (let i = 1; i < p.rows.length; i++) lines.push(pad + rowText(p.rows[i]));
  }
  if (arr.order.length) {
    lines.push('');
    lines.push('order: ' + arr.order.map(o => o.name + (o.times > 1 ? ' x' + o.times : '')).join(', '));
  }
  return lines.join('\n');
}

/* first-pass bar chart derived from the lyric chords: one bar per chord */
function deriveBars(lines) {
  const out = [];
  for (const l of lines) {
    if (l.type === 'blank') { out.push({ type: 'blank' }); continue; }
    if (l.type === 'section') { out.push({ type: 'section', name: l.name }); continue; }
    if (!l.chords.length) continue;
    out.push({
      type: 'row',
      bars: [...l.chords].sort((a, b) => a.col - b.col)
        .map(c => (c.sym === '|' || c.sym === '·' ? [] : [c.sym])),
      caption: l.text.trim(),
      repeat: l.repeat
    });
  }
  return trimBlanks(out);
}

/* ---------- auto-arrangement ----------
   Predict parts from the bar chart: consecutive rows form blocks (split on
   blank lines / section labels), identical chord sequences merge into one
   part, and the block order becomes the play order. */

function generateArrangement() {
  const blocks = [];
  let cur = null, label = null;
  for (const l of currentBars()) {
    if (l.type === 'blank') { cur = null; continue; }
    if (l.type === 'section') { cur = null; label = l.name; continue; }
    if (l.type !== 'row') continue;
    if (!cur) { cur = { label, rows: [] }; blocks.push(cur); label = null; }
    cur.rows.push(l);
  }

  const parts = [], order = [], bySig = new Map();
  const SUNG = ['Verse', 'Chorus', 'Bridge'];
  let sungCount = 0;

  for (const b of blocks) {
    const sig = b.rows.map(r => r.bars.map(ts => ts.join(' ')).join('|')).join('//');
    let part = bySig.get(sig);
    if (!part) {
      const sung = b.rows.some(r => r.caption);
      let name = b.label ? b.label.replace(/\s*\d+$/, '')
        : sung ? (SUNG[sungCount] || 'Part ' + (parts.length + 1))
        : (parts.length === 0 ? 'Intro' : 'Ara');
      if (sung && !b.label) sungCount++;
      const base = name;
      let k = 2;
      while (parts.some(p => p.name === name)) name = base + ' ' + (k++);

      /* one progression row per source row, "%" for held/repeated bars */
      const rows = [];
      let lastKey = null, any = false;
      for (const r of b.rows) {
        const row = [];
        for (const ts of r.bars) {
          const key = ts.join(' ');
          if (any && (!ts.length || key === lastKey)) row.push(['%']);
          else { row.push(ts.slice()); if (ts.length) lastKey = key; }
          any = true;
        }
        rows.push({ bars: row, repeat: r.repeat });
      }
      part = { name, rows };
      parts.push(part);
      bySig.set(sig, part);
    }
    const last = order[order.length - 1];
    if (last && last.name === part.name) last.times++;
    else order.push({ name: part.name, times: 1 });
  }
  return { parts, order };
}

/* ================= chord shapes ================= */

const INSTRUMENTS = {
  guitar:   { label: 'Guitar',   tuning: [40, 45, 50, 55, 59, 64] },
  ukulele:  { label: 'Ukulele',  tuning: [67, 60, 64, 69] },
  mandolin: { label: 'Mandolin', tuning: [55, 62, 69, 76] }
};

const QUALITIES = [
  [/^(maj7|M7|Δ7?)/,      [0, 4, 7, 11]],
  [/^(m7b5|ø7?|m7\(b5\))/, [0, 3, 6, 10]],
  [/^(dim7|°7)/,          [0, 3, 6, 9]],
  [/^(dim|°)/,            [0, 3, 6]],
  [/^(aug|\+)/,           [0, 4, 8]],
  [/^(m9|min9)/,          [0, 3, 7, 10, 2]],
  [/^(m6|min6)/,          [0, 3, 7, 9]],
  [/^(m7|min7|-7)/,       [0, 3, 7, 10]],
  [/^(m|min|-)/,          [0, 3, 7]],
  [/^(9)/,                [0, 4, 7, 10, 2]],
  [/^(7sus4)/,            [0, 5, 7, 10]],
  [/^(7)/,                [0, 4, 7, 10]],
  [/^(6)/,                [0, 4, 7, 9]],
  [/^(sus2)/,             [0, 2, 7]],
  [/^(sus4?)/,            [0, 5, 7]],
  [/^(add9)/,             [0, 4, 7, 2]],
  [/^(5)/,                [0, 7]]
];

function chordIntervals(qual) {
  for (const [re, iv] of QUALITIES) if (re.test(qual)) return iv;
  return qual.startsWith('m') && !qual.startsWith('maj') ? [0, 3, 7] : [0, 4, 7];
}

/* hand-picked open shapes (guitar) keyed by "rootPc:intervals" */
const GUITAR_OPENS = {
  '0:0,4,7':  [-1, 3, 2, 0, 1, 0],   // C
  '7:0,4,7':  [3, 2, 0, 0, 0, 3],    // G
  '2:0,4,7':  [-1, -1, 0, 2, 3, 2],  // D
  '9:0,4,7':  [-1, 0, 2, 2, 2, 0],   // A
  '4:0,4,7':  [0, 2, 2, 1, 0, 0],    // E
  '9:0,3,7':  [-1, 0, 2, 2, 1, 0],   // Am
  '4:0,3,7':  [0, 2, 2, 0, 0, 0],    // Em
  '2:0,3,7':  [-1, -1, 0, 2, 3, 1],  // Dm
  '0:0,4,7,11': [-1, 3, 2, 0, 0, 0], // Cmaj7
  '7:0,4,7,10': [3, 2, 0, 0, 0, 1],  // G7
  '4:0,4,7,10': [0, 2, 0, 1, 0, 0],  // E7
  '9:0,4,7,10': [-1, 0, 2, 0, 2, 0], // A7
  '2:0,4,7,10': [-1, -1, 0, 2, 1, 2],// D7
  '11:0,4,7,10': [-1, 2, 1, 2, 0, 2],// B7
  '4:0,3,7,10': [0, 2, 0, 0, 0, 0],  // Em7
  '9:0,3,7,10': [-1, 0, 2, 0, 1, 0], // Am7
  '2:0,3,7,10': [-1, -1, 0, 2, 1, 1] // Dm7
};

/* movable barre templates: offsets from the barre fret (E- and A-shapes) */
const BARRE_E = {
  '0,4,7':    [0, 2, 2, 1, 0, 0],
  '0,3,7':    [0, 2, 2, 0, 0, 0],
  '0,4,7,10': [0, 2, 0, 1, 0, 0],
  '0,3,7,10': [0, 2, 0, 0, 0, 0]
};
const BARRE_A = {
  '0,4,7':    [-1, 0, 2, 2, 2, 0],
  '0,3,7':    [-1, 0, 2, 2, 1, 0],
  '0,4,7,10': [-1, 0, 2, 0, 2, 0],
  '0,3,7,10': [-1, 0, 2, 0, 1, 0]
};

function guitarBarre(rootPc, intervals) {
  const key = intervals.join(',');
  const fE = ((rootPc - 4) % 12 + 12) % 12;  // root on low E string
  const fA = ((rootPc - 9) % 12 + 12) % 12;  // root on A string
  const useA = fA < fE && BARRE_A[key];
  const tpl = useA ? BARRE_A[key] : BARRE_E[key];
  const f = useA ? fA : fE;
  if (!tpl || f < 1) return null;
  return tpl.map(o => (o < 0 ? -1 : o + f));
}

const shapeCache = new Map();

function solveShape(instKey, rootPc, intervals) {
  const cacheKey = instKey + ':' + rootPc + ':' + intervals.join(',');
  if (shapeCache.has(cacheKey)) return shapeCache.get(cacheKey);

  let result = null;
  if (instKey === 'guitar') {
    result = GUITAR_OPENS[rootPc + ':' + intervals.join(',')] ||
             guitarBarre(rootPc, intervals);
  }
  if (!result) result = searchShape(INSTRUMENTS[instKey].tuning, rootPc, intervals);
  shapeCache.set(cacheKey, result);
  return result;
}

function searchShape(tuning, rootPc, intervals) {
  const pcs = intervals.map(iv => (rootPc + iv) % 12);
  const need = new Set(pcs);
  const optionalFifth = pcs.length >= 4 ? (rootPc + 7) % 12 : -1;
  let best = null, bestScore = Infinity;

  for (let pos = 0; pos <= 9; pos++) {
    const lo = Math.max(1, pos), hi = pos + 3;
    const cands = tuning.map(open => {
      const list = [-1];
      for (let f = 0; f <= hi; f++) {
        if (f !== 0 && f < lo) continue;
        if (need.has((open + f) % 12)) list.push(f);
      }
      return list;
    });
    const frets = new Array(tuning.length);
    (function dfs(s) {
      if (s === tuning.length) {
        const score = scoreShape(tuning, frets, rootPc, need, optionalFifth, pos);
        if (score !== null && score < bestScore) { bestScore = score; best = frets.slice(); }
        return;
      }
      for (const f of cands[s]) { frets[s] = f; dfs(s + 1); }
    })(0);
  }
  return best;
}

function scoreShape(tuning, frets, rootPc, need, optionalFifth, pos) {
  const sounded = [];
  frets.forEach((f, s) => { if (f >= 0) sounded.push(s); });
  if (sounded.length < Math.min(3, tuning.length)) return null;

  const covered = new Set(sounded.map(s => (tuning[s] + frets[s]) % 12));
  for (const pc of need) {
    if (!covered.has(pc) && pc !== optionalFifth) return null;
  }
  let score = 0;
  if (optionalFifth >= 0 && !covered.has(optionalFifth)) score += 2;

  /* inner mutes are ugly; edge mutes are fine */
  const first = sounded[0], last = sounded[sounded.length - 1];
  for (let s = first; s <= last; s++) if (frets[s] < 0) score += 10;
  score += (tuning.length - sounded.length);

  /* root-in-bass only makes sense on non-reentrant tunings */
  const reentrant = tuning.some((t, i) => i && t < tuning[i - 1]);
  if (!reentrant) {
    let bassNote = Infinity;
    for (const s of sounded) bassNote = Math.min(bassNote, tuning[s] + frets[s]);
    if (bassNote % 12 !== rootPc) score += 3;
  }

  let fretted = 0, sum = 0;
  for (const s of sounded) if (frets[s] > 0) { fretted++; sum += frets[s]; }
  score += fretted * 0.4 + sum * 0.12 + pos * 0.8;
  return score;
}

/* ================= SVG diagram ================= */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function diagramSVG(frets) {
  const n = frets.length;
  const fretted = frets.filter(f => f > 0);
  const maxF = fretted.length ? Math.max(...fretted) : 3;
  const base = maxF <= 4 ? 1 : Math.min(...fretted);
  const rows = Math.max(4, maxF - base + 1);
  const sw = 13, fh = 15, x0 = 12, y0 = 14;
  const w = x0 * 2 + sw * (n - 1), h = y0 + fh * rows + 8;
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">`;
  if (base === 1) {
    s += `<line x1="${x0}" y1="${y0}" x2="${x0 + sw * (n - 1)}" y2="${y0}" class="dg-nut"/>`;
  } else {
    s += `<text x="${x0 - 9}" y="${y0 + fh * 0.68}" class="dg-pos">${base}</text>`;
  }
  for (let r = 0; r <= rows; r++) {
    const y = y0 + r * fh;
    s += `<line x1="${x0}" y1="${y}" x2="${x0 + sw * (n - 1)}" y2="${y}" class="dg-fret"/>`;
  }
  for (let i = 0; i < n; i++) {
    const x = x0 + i * sw;
    s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + fh * rows}" class="dg-str"/>`;
    const f = frets[i];
    if (f < 0) s += `<text x="${x}" y="${y0 - 4}" class="dg-mark">×</text>`;
    else if (f === 0) s += `<circle cx="${x}" cy="${y0 - 7}" r="2.6" class="dg-open"/>`;
    else {
      const y = y0 + (f - base + 0.5) * fh;
      s += `<circle cx="${x}" cy="${y}" r="4.4" class="dg-dot"/>`;
    }
  }
  return s + '</svg>';
}

function tabString(frets) {
  return frets.map(f => (f < 0 ? 'x' : f)).join('–');
}

/* ================= state ================= */

const state = {
  song: null,      // raw song object
  model: null,     // parsed body lines
  bars: null,      // parsed bars model (null → derive from body)
  barsExplicit: false,
  arr: null,       // parsed arrangement model
  stripOpen: localStorage.getItem('charts:strip') === '1',
  steps: 0,
  view: 'lyrics',  // 'lyrics' | 'bars'
  edit: false,
  dirty: false,
  showLyrics: true,
  instrument: localStorage.getItem('charts:instrument') || 'guitar',
  scale: parseFloat(localStorage.getItem('charts:scale') || '1'),
  barw: parseFloat(localStorage.getItem('charts:barw') || '0'), /* 0 = auto */
  charW: 8
};

const $ = (sel) => document.querySelector(sel);

function localSongs() {
  try { return JSON.parse(localStorage.getItem('charts:songs') || '[]'); }
  catch { return []; }
}
function saveLocalSongs(list) {
  localStorage.setItem('charts:songs', JSON.stringify(list));
}
function overrides() {
  try { return JSON.parse(localStorage.getItem('charts:overrides') || '{}'); }
  catch { return {}; }
}
function saveOverrides(ov) {
  localStorage.setItem('charts:overrides', JSON.stringify(ov));
}
function allSongs() {
  const ov = overrides();
  return [...(window.CHARTS_DB || []).map(s => (ov[s.id] ? { ...s, ...ov[s.id] } : s)),
          ...localSongs()];
}

const foldMap = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' };
function fold(s) {
  return s.replace(/[ıİşŞğĞüÜöÖçÇ]/g, c => foldMap[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* ================= saving ================= */

/* the save endpoint only exists on the local preview server (same origin);
   on the deployed site every save falls back to browser storage */
let serverOk = false;

async function apiPost(payload) {
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) { serverOk = true; return true; }
  } catch { /* no server */ }
  return false;
}

async function probeServer() {
  try {
    const res = await fetch('/api/ping');
    if (res.ok) { serverOk = true; return true; }
  } catch { /* not reachable */ }
  return false;
}

let saveTimer = null;
let statTimer = null;

function status(msg, hold) {
  const el = $('#saveStat');
  el.textContent = msg;
  clearTimeout(statTimer);
  if (!hold) statTimer = setTimeout(() => { el.textContent = ''; }, 3000);
}

function markDirty() {
  state.dirty = true;
  status('…', true);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSong, 700);
}

function applyModelToSong() {
  state.song.body = serializeBody(state.model);
  state.song.format = 'over';
  if (state.barsExplicit) state.song.bars = serializeBars(state.bars);
  if (state.arr) {
    if (state.arr.parts.length || state.arr.order.length) {
      state.song.arrangement = serializeArrangement(state.arr);
    } else {
      delete state.song.arrangement;
    }
  }
}

async function saveSong() {
  if (!state.song || !state.dirty) return;
  applyModelToSong();
  state.dirty = false;

  const locals = localSongs();
  if (locals.some(s => s.id === state.song.id)) {
    saveLocalSongs(locals.map(s => (s.id === state.song.id ? state.song : s)));
    status('saved in browser ✓');
    return;
  }

  const idx = (window.CHARTS_DB || []).findIndex(s => s.id === state.song.id);
  if (idx >= 0) window.CHARTS_DB[idx] = state.song;
  /* merge-save just this song so a stale page can't clobber other entries */
  if (await apiPost({ songs: [state.song], merge: true })) {
    const ov = overrides();
    if (ov[state.song.id]) { delete ov[state.song.id]; saveOverrides(ov); }
    status('saved to charts-db.js ✓');
  } else {
    const ov = overrides();
    ov[state.song.id] = state.song;
    saveOverrides(ov);
    status('no server — saved in browser ✓');
  }
}

/* the full charts-db.js content with this browser's edits applied — paste
   it over the file on GitHub to publish the changes */
const DB_HEADER = `/* Charts — internal song database.
   This file is rewritten by the local preview server when songs are edited
   in the browser, and is meant to stay hand-editable.

   body   "over" format: chord symbols on their own line, column-aligned
          above the lyric line below. "inline" format: [Cm] markers in the
          text. Lines like [Verse] that aren't a chord are section labels.
          A trailing "x2" on a lyric line becomes a repeat badge.
   bars   optional bar chart: bars split by "|", several chords in one bar
          split by spaces, "·" = empty bar, "|: ... :|" marks a repeated
          span, trailing "x2" = repeat. A plain
          text line right after a row is that row's lyric caption.
          If missing, bars are derived from the body (one bar per chord). */
`;

function buildDbFile() {
  const ov = overrides();
  const entries = (window.CHARTS_DB || [])
    .map(s => songEntryJS(ov[s.id] ? { ...s, ...ov[s.id] } : s));
  return DB_HEADER + '\nwindow.CHARTS_DB = [\n' + entries.join(',\n') + '\n];\n';
}

/* canonical charts-db.js entry text, for hand-merging from another device */
function songEntryJS(s) {
  const ORDER = ['id', 'title', 'artist', 'key', 'capo', 'source', 'video', 'format', 'body', 'bars', 'arrangement'];
  const keys = ORDER.filter(k => k in s && s[k] !== '' && s[k] != null && !(k !== 'id' && s[k] === 0));
  for (const k of Object.keys(s).sort()) {
    if (!ORDER.includes(k) && s[k]) keys.push(k);
  }
  const val = (v) => {
    if (typeof v === 'string' && v.includes('\n')) {
      let t = v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
      if (!t.startsWith('\n')) t = '\n' + t;
      if (!t.endsWith('\n')) t += '\n';
      return '`' + t + '`';
    }
    return JSON.stringify(v);
  };
  return '  {\n' + keys.map(k => `    ${k}: ${val(s[k])}`).join(',\n') + '\n  }';
}

async function mergeOverrides() {
  const ov = overrides();
  const merged = [];
  for (const s of (window.CHARTS_DB || [])) {
    if (ov[s.id]) merged.push({ ...s, ...ov[s.id] });
  }
  if (!merged.length) return;
  if (await apiPost({ songs: merged, merge: true })) {
    for (const s of merged) delete ov[s.id];
    saveOverrides(ov);
    status(`merged ${merged.length} song${merged.length > 1 ? 's' : ''} into charts-db.js ✓`);
  } else {
    status('server unreachable — start serve-charts.py first');
  }
  renderHome($('#searchInput').value);
}

/* ================= rendering: sheet ================= */

function displayChord(sym, preferFlat) {
  return transposeChordSym(sym, state.steps, preferFlat);
}

function songKey() {
  if (state.song.key) return state.song.key;
  for (const l of state.model) {
    if (l.type === 'lyric' && l.chords.length) return l.chords[0].sym;
  }
  return 'C';
}

function segmentsFor(line) {
  const chords = [...line.chords].sort((a, b) => a.col - b.col);
  if (!chords.length) return [{ chord: null, text: line.text }];
  const segs = [];
  if (chords[0].col > 0) {
    segs.push({ chord: null, text: line.text.slice(0, Math.min(chords[0].col, line.text.length)) });
  }
  chords.forEach((c, i) => {
    const end = i + 1 < chords.length ? chords[i + 1].col : Infinity;
    const text = c.col < line.text.length ? line.text.slice(c.col, Math.min(end, line.text.length)) : '';
    segs.push({ chord: c.sym, text });
  });
  return segs;
}

function measureCharW(sheet) {
  const p = document.createElement('span');
  p.className = 't';
  p.style.position = 'absolute';
  p.style.visibility = 'hidden';
  p.style.whiteSpace = 'pre';
  p.textContent = '0'.repeat(40);
  sheet.appendChild(p);
  const w = p.getBoundingClientRect().width / 40;
  p.remove();
  return w || 8;
}

function currentBars() {
  return state.bars || deriveBars(state.model);
}

/* one token inside a bar cell: chord button or plain token */
function tokMarkup(t, preferFlat) {
  if (parseChord(t)) {
    const d = displayChord(t, preferFlat);
    return `<button class="c" data-ch="${esc(d)}">${esc(d)}</button>`;
  }
  return `<span class="tok${t === '%' ? ' tok--pct' : ''}">${esc(t)}</span>`;
}

/* render one row of bars; |: :| repeat signs draw as barline decorations
   on the edge bars, and the enclosed span gets a highlight class. Pass a
   shared repState object to let a |: ... :| span continue across rows. */
function barCells(bars, preferFlat, extra, repState) {
  const rs = repState || { on: false };
  return bars.map((toks, bi) => {
    if (isGap(toks)) return '<span class="bargap"></span>';
    const starts = toks[0] === '|:';
    const ends = toks[toks.length - 1] === ':|';
    if (starts) rs.on = true;
    const rep = rs.on;
    if (ends) rs.on = false;
    const inner = toks.filter(t => t !== '|:' && t !== ':|');
    const html = inner.length
      ? inner.map(t => tokMarkup(t, preferFlat)).join('')
      : '<span class="tok tok--empty">·</span>';
    const cls = (rep ? ' bar--rep' : '') + (starts ? ' bar--rstart' : '') +
      (ends ? ' bar--rend' : '') + (bi === bars.length - 1 ? ' bar--last' : '');
    const ex = extra ? extra(bi) : { cls: '', attrs: '' };
    return `<span class="bar${cls}${ex.cls}"${ex.attrs}>${html}</span>`;
  }).join('');
}

function ensureBarsEditable() {
  if (!state.bars) {
    state.bars = deriveBars(state.model);
    state.barsExplicit = true;
  }
}

function repBadge(rep, kind, idx) {
  if (state.edit) {
    return `<button class="rep rep--edit${rep ? ' is-on' : ''}" data-rep="${kind}" data-i="${idx}"
      title="Cycle repeat">×${rep || 1}</button>`;
  }
  return rep ? `<span class="rep">×${rep}</span>` : '';
}

function renderSheet() {
  const sheet = $('#sheet');
  const scrollY = window.scrollY; /* full re-render must not move the page */
  sheet.style.fontSize = state.scale + 'rem';
  sheet.classList.toggle('sheet--edit', state.edit);
  sheet.classList.toggle('sheet--eqbars', state.barw > 0);
  sheet.style.setProperty('--barw', (state.barw || 4.6) + 'em');
  const { preferFlat } = shiftKey(songKey(), state.steps);
  state.charW = measureCharW(sheet);
  const html = [];

  if (state.view === 'lyrics') {
    state.model.forEach((line, li) => {
      if (line.type === 'blank') { html.push('<div class="gap"></div>'); return; }
      if (line.type === 'section') { html.push(`<h3 class="secname">${esc(line.name)}</h3>`); return; }
      const rep = repBadge(line.repeat, 'line', li);

      if (state.edit) {
        const chords = line.chords.map((c, ci) =>
          `<button class="c c--abs${parseChord(c.sym) ? '' : ' c--tok'}" data-li="${li}" data-ci="${ci}"
             style="left:${(c.col * state.charW).toFixed(1)}px">${esc(displayChord(c.sym, preferFlat))}</button>`
        ).join('');
        const pad = Math.max(...line.chords.map(c => c.col + c.sym.length + 2), 0);
        html.push(`<div class="eline" data-li="${li}"><span class="t" data-li="${li}">${esc(line.text.padEnd(pad, ' ')) || '&nbsp;'}</span>${chords}${rep}</div>`);
        return;
      }

      const hasChords = line.chords.length > 0;
      const segs = segmentsFor(line).map(s => {
        let c;
        if (!s.chord) c = hasChords ? '<span class="c c--pad"></span>' : '';
        else if (parseChord(s.chord)) {
          const d = displayChord(s.chord, preferFlat);
          c = `<button class="c" data-ch="${esc(d)}">${esc(d)}</button>`;
        } else c = `<span class="c c--tok">${esc(s.chord)}</span>`;
        return `<span class="seg">${c}<span class="t">${esc(s.text)}</span></span>`;
      }).join('');
      html.push(`<div class="line${hasChords ? '' : ' line--bare'}">${segs}${rep}</div>`);
    });
  } else if (state.view === 'parts') {
    renderParts(html, preferFlat);
  } else {
    const rs = { on: false };
    currentBars().forEach((line, ri) => {
      if (line.type === 'blank') { rs.on = false; html.push('<div class="gap"></div>'); return; }
      if (line.type === 'section') { rs.on = false; html.push(`<h3 class="secname">${esc(line.name)}</h3>`); return; }
      if (line.type === 'note') { html.push(`<div class="line line--bare">${esc(line.text)}</div>`); return; }

      const cells = barCells(line.bars, preferFlat, (bi) => ({
        cls: state.edit ? ' bar--edit' : '',
        attrs: ` data-ri="${ri}" data-bi="${bi}"`
      }), rs);
      const add = state.edit ? `<button class="bar bar--plus" data-addbar="${ri}" title="Add bar">+</button>` : '';
      html.push(`<div class="barline">${cells}${add}${repBadge(line.repeat, 'row', ri)}</div>`);
      if (state.showLyrics && (line.caption || state.edit)) {
        html.push(`<div class="barcaption${state.edit ? ' barcaption--edit' : ''}" data-cap="${ri}">${esc(line.caption) || (state.edit ? '<i>add lyric…</i>' : '')}</div>`);
      }
    });
    if (state.edit) html.push('<button class="addrow" data-addrow>+ row</button>');
  }
  sheet.innerHTML = html.join('');
  window.scrollTo(0, scrollY);
}

/* ---------- parts (arrangement) view ---------- */

const PART_HUES = [45, 190, 145, 275, 205, 320, 90, 230];
const SOLO_HUE = 12; /* muted orange-red, reserved for solo sections */

function renderParts(html, preferFlat) {
  const arr = state.arr || { parts: [], order: [] };
  const hueOf = (name) => {
    if (/solo/i.test(name)) return SOLO_HUE;
    const i = arr.parts.findIndex(p => p.name === name);
    return i >= 0 ? PART_HUES[i % PART_HUES.length] : null;
  };

  if (arr.order.length || state.edit) {
    const pills = arr.order.map(o => {
      const h = hueOf(o.name);
      return `<span class="opill${h === null ? ' opill--unk' : ''}"${h !== null ? ` style="--h:${h}"` : ''}>` +
        `${esc(o.name)}${o.times > 1 ? ` <b>×${o.times}</b>` : ''}</span>`;
    }).join('<span class="order__sep">→</span>');
    html.push(`<div class="order${state.edit ? ' order--edit' : ''}" data-order title="${state.edit ? 'Click to edit the play order' : ''}">` +
      `<span class="order__label">order</span>${pills || '<i class="order__hint">add play order…</i>'}</div>`);
  }

  const partCells = arr.parts.map((p, pi) => {
    const h = hueOf(p.name);

    /* a |: :| span covering complete rows renders as a bracket beside that
       row group — its length is simply the rows you enclose */
    const groups = [];
    for (let i = 0; i < p.rows.length; i++) {
      const first = p.rows[i].bars[0];
      if (!first || first[0] !== '|:') continue;
      for (let j = i; j < p.rows.length; j++) {
        const bars = p.rows[j].bars;
        const last = bars[bars.length - 1];
        if (last && last[last.length - 1] === ':|') {
          if (j > i) groups.push({ from: i, to: j });
          i = j;
          break;
        }
      }
    }
    const groupOf = (ri) => groups.find(g => ri >= g.from && ri <= g.to);
    const stripSigns = (bars) => bars.map(ts => ts.filter(t => t !== '|:' && t !== ':|'));

    const rs = { on: false }; /* remaining |: :| spans still cross rows */
    const rowHtml = (r, ri, inGroup) => {
      /* inside a group the closing row's repeat is shown on the bracket;
         other grouped rows only show a badge when one is actually set */
      const badge = inGroup
        ? (ri !== groupOf(ri).to && r.repeat ? repBadge(r.repeat, 'prow', pi + ':' + ri) : '')
        : repBadge(r.repeat, 'prow', pi + ':' + ri);
      return `<div class="barline">${barCells(inGroup ? stripSigns(r.bars) : r.bars, preferFlat, null, inGroup ? { on: false } : rs)}${badge}</div>`;
    };

    let rows = '';
    for (let ri = 0; ri < p.rows.length; ri++) {
      const g = groupOf(ri);
      if (!g) { rows += rowHtml(p.rows[ri], ri, false); continue; }
      const inner = [];
      for (let k = g.from; k <= g.to; k++) inner.push(rowHtml(p.rows[k], k, true));
      const times = p.rows[g.to].repeat;
      const on = times || !state.edit; /* |: :| implies ×2 even when unlabeled */
      rows += `<div class="rowgroup"><div class="rowgroup__rows">${inner.join('')}</div>` +
        `<span class="part__rep${state.edit ? ' part__rep--edit' : ''}${on ? ' part__rep--on' : ''}"` +
        ` data-rep="prow" data-i="${pi}:${g.to}" title="Repeat these rows${state.edit ? ' — click to cycle' : ''}">` +
        `<i class="part__repbr"></i><b class="prep">×${times || 2}</b></span></div>`;
      ri = g.to;
    }
    const del = state.edit
      ? `<button class="part__del" data-pdel="${pi}" title="Delete this part">×</button>` : '';
    /* whole-part repeat: bracket spanning all rows, badge centered on it */
    const prep = (p.repeat || state.edit)
      ? `<span class="part__rep${state.edit ? ' part__rep--edit' : ''}${p.repeat ? ' part__rep--on' : ''}" data-rep="part" data-i="${pi}"
           title="Whole-part repeat${state.edit ? ' — click to cycle' : ''}">
           <i class="part__repbr"></i><b class="prep">×${p.repeat || 1}</b></span>`
      : '';
    return `<div class="part" style="--h:${h}">` +
      `<span class="part__namecell"><button class="part__name${state.edit ? ' part__name--edit' : ''}" data-pname="${pi}">${esc(p.name)}</button>${del}</span>` +
      `<div class="part__bars${state.edit ? ' part__bars--edit' : ''}" data-pbars="${pi}">` +
      `<div class="part__rows">${rows}</div>${prep}</div></div>`;
  });
  if (partCells.length) html.push(`<div class="partgrid">${partCells.join('')}</div>`);

  if (state.edit) {
    html.push('<div class="parts__tools"><button class="addrow" data-addpart>+ part</button>' +
      '<button class="addrow" data-genparts title="Predict parts and play order from the chart">⚡ generate from chart</button></div>');
  }
  if (!arr.parts.length && !state.edit) {
    html.push('<p class="parts__empty">No arrangement yet — use ✎ edit to add parts, or generate them from the chart.</p>');
  }
}

/* ================= rendering: chord strip ================= */

function usedChords() {
  const { preferFlat } = shiftKey(songKey(), state.steps);
  const seen = new Set(), out = [];
  const push = (sym) => {
    const d = displayChord(sym, preferFlat);
    if (!seen.has(d)) { seen.add(d); out.push(d); }
  };
  for (const l of state.model) {
    if (l.type === 'lyric') l.chords.forEach(c => { if (parseChord(c.sym)) push(c.sym); });
  }
  for (const r of currentBars()) {
    if (r.type === 'row') r.bars.forEach(ts => ts.forEach(t => { if (parseChord(t)) push(t); }));
  }
  if (state.arr) {
    for (const p of state.arr.parts) p.rows.forEach(r => r.bars.forEach(ts => ts.forEach(t => { if (parseChord(t)) push(t); })));
  }
  return out;
}

function renderStrip() {
  const strip = $('#chordStrip');
  const chords = usedChords();
  strip.hidden = !state.stripOpen;
  $('#stripFoot').hidden = !state.stripOpen;
  $('#stripToggle').textContent = state.stripOpen ? 'chord shapes ▾' : `chord shapes ▸ ${chords.length}`;
  if (!state.stripOpen) { strip.innerHTML = ''; return; }
  const items = chords.map(sym => {
    const c = parseChord(sym);
    const frets = c ? solveShape(state.instrument, NOTE_INDEX[c.root], chordIntervals(c.qual)) : null;
    const body = frets
      ? diagramSVG(frets) + `<span class="shape__tab">${tabString(frets)}</span>`
      : '<span class="shape__tab shape__tab--none">no shape</span>';
    return `<figure class="shape" data-ch="${esc(sym)}"><figcaption>${esc(sym)}</figcaption>${body}</figure>`;
  });
  strip.innerHTML = items.join('');
}

/* ================= rendering: song view ================= */

function renderSongMeta() {
  $('#songTitle').textContent = state.song.title;
  $('#songArtist').textContent = state.song.artist || '';
  const key0 = songKey();
  const meta = [];
  if (state.song.capo) meta.push(`<span>${esc(`Capo ${state.song.capo}`)}</span>`);
  $('#songMeta').innerHTML = meta.join('<i>·</i>');
  const t = $('#transVal');
  const disp = shiftKey(key0, state.steps).name || '·';
  t.textContent = state.steps === 0 ? disp : `${disp} ${state.steps > 0 ? '+' : ''}${state.steps}`;
  t.classList.toggle('is-on', state.steps !== 0);
  t.title = state.edit
    ? 'Type a key or offset — re-keys the saved chart'
    : 'Type a key (Gm) or offset (+2, 0) to transpose';
}

function renderSong() {
  renderSongMeta();
  renderStrip();
  renderSheet();
  $('#lyricsToggle').hidden = state.view !== 'bars';
  $('#barwCtl').hidden = state.view === 'lyrics';
  const bw = $('#barwVal');
  bw.textContent = state.barw ? state.barw + 'em' : 'auto';
  bw.classList.toggle('is-on', state.barw > 0);
  document.querySelectorAll('#viewToggle button').forEach(b =>
    b.classList.toggle('is-on', b.dataset.view === state.view));
  $('#lyricsToggle').classList.toggle('is-on', state.showLyrics);
  $('#editToggle').classList.toggle('is-on', state.edit);
  $('#transDown').title = state.edit ? 'Re-key the saved chart down a semitone' : 'Transpose view down';
  $('#transUp').title = state.edit ? 'Re-key the saved chart up a semitone' : 'Transpose view up';
  syncVideoToSong();
}

/* ================= rendering: home ================= */

function renderHome(query) {
  const q = fold(query || '');
  const local = new Set(localSongs().map(s => s.id));
  const ov = overrides();
  const items = allSongs().filter(s => !q || fold(s.title + ' ' + (s.artist || '')).includes(q));

  const list = items.map(s => {
    const edited = !local.has(s.id) && !!ov[s.id];
    let tools = '';
    if (local.has(s.id)) {
      tools = `<span class="songrow__tools">
        <button class="mini" data-copy="${esc(s.id)}" title="Copy JSON for charts-db.js">copy json</button>
        <button class="mini mini--x" data-del="${esc(s.id)}" title="Delete">×</button>
      </span>`;
    } else if (edited) {
      tools = `<span class="songrow__tools">
        <button class="mini" data-centry="${esc(s.id)}" title="Copy this song as a charts-db.js entry">copy entry</button>
        <button class="mini mini--x" data-drop="${esc(s.id)}" title="Discard the browser edits, back to the published version">discard</button>
      </span>`;
    }
    return `
    <li>
      <a class="songrow" href="#/song/${encodeURIComponent(s.id)}">
        <span class="songrow__names"><b>${esc(s.title)}</b><span>${esc(s.artist || '')}</span></span>
        <span class="songrow__side">${local.has(s.id) ? '<em class="tag">local</em>' : ''}${edited ? '<em class="tag">edited here</em>' : ''}<span class="keytag">${esc(s.key || '')}</span></span>
      </a>
      ${tools}
    </li>`;
  }).join('');

  $('#songList').innerHTML = list;
  $('#homeCount').textContent = `${items.length} song${items.length === 1 ? '' : 's'}`;

  const pending = (window.CHARTS_DB || []).filter(s => ov[s.id]).length;
  const bar = $('#mergeBar');
  bar.hidden = !pending;
  if (pending) {
    $('#mergeMsg').textContent =
      `${pending} song${pending > 1 ? 's differ' : ' differs'} from the published version (edited in this browser)`;
    $('#mergeBtn').hidden = !serverOk;
    $('#copyDbBtn').hidden = serverOk;
    $('#prLink').hidden = serverOk;
  }

  const web = $('#webSearch');
  web.hidden = !(q && items.length === 0);
  if (!web.hidden) {
    $('#webQuery').textContent = query;
    const enc = encodeURIComponent(query);
    $('#webGoogle').href = `https://www.google.com/search?q=${enc}+akor+OR+chords`;
    $('#webUG').href = `https://www.google.com/search?q=${enc}+site%3Atabs.ultimate-guitar.com`;
  }
}

/* ================= routing ================= */

function route() {
  const h = location.hash || '#/';
  const m = /^#\/song\/([^?]+)(?:\?t=(-?\d+))?/.exec(h);
  if (m) {
    const song = allSongs().find(s => s.id === decodeURIComponent(m[1]));
    if (song) {
      if (state.song && state.dirty) { clearTimeout(saveTimer); saveSong(); }
      state.song = song;
      state.model = parseSong(song);
      state.bars = song.bars ? parseBars(song.bars) : null;
      state.barsExplicit = !!song.bars;
      state.arr = song.arrangement ? parseArrangement(song.arrangement) : null;
      state.steps = m[2] ? +m[2] : 0;
      state.edit = false;
      state.dirty = false;
      $('#homeView').hidden = true;
      $('#songView').hidden = false;
      renderSong();
      window.scrollTo(0, 0);
      return;
    }
  }
  if (state.song && state.dirty) { clearTimeout(saveTimer); saveSong(); }
  state.song = null;
  closeVideo();
  $('#songView').hidden = true;
  $('#homeView').hidden = false;
  renderHome($('#searchInput').value);
}

function setSteps(n) {
  if (state.edit) return;
  state.steps = ((n % 12) + 18) % 12 - 6; /* keep in −6..+5 */
  if (state.song) {
    const url = `#/song/${encodeURIComponent(state.song.id)}` + (state.steps ? `?t=${state.steps}` : '');
    history.replaceState(null, '', url);
    renderSong();
  }
}

/* ================= editing ================= */

/* re-key the whole saved chart: transpose every stored chord so the song's
   default key becomes `input` (label-only fixes go through the source modal) */
function changeKey(input) {
  const nk = input[0].toUpperCase() + input.slice(1);
  const m = /^([A-G][#b]?)(m|min)?$/.exec(nk);
  if (!m) { status('key? e.g. Em, Bb, F#m'); renderSongMeta(); return; }
  const old = /^([A-G][#b]?)/.exec(songKey());
  const steps = ((NOTE_INDEX[m[1]] - NOTE_INDEX[old[1]]) % 12 + 12) % 12;
  const { preferFlat } = shiftKey(nk, 0);
  if (steps) {
    for (const l of state.model) {
      if (l.type === 'lyric') {
        l.chords.forEach(c => { c.sym = transposeChordSym(c.sym, steps, preferFlat); });
      }
    }
    if (state.bars) {
      for (const r of state.bars) {
        if (r.type === 'row') {
          r.bars = r.bars.map(ts => ts.map(t => (parseChord(t) ? transposeChordSym(t, steps, preferFlat) : t)));
        }
      }
    }
    if (state.arr) {
      for (const p of state.arr.parts) {
        p.rows.forEach(r => { r.bars = r.bars.map(ts => ts.map(t => (parseChord(t) ? transposeChordSym(t, steps, preferFlat) : t))); });
      }
    }
  }
  state.song.key = nk;
  markDirty();
  renderSong();
}

/* parse "Gm" / "+2" / "0" into a view transpose */
function viewKeyChange(v) {
  if (/^[+-]?\d+$/.test(v)) { setSteps(parseInt(v, 10)); return; }
  const nk = v[0].toUpperCase() + v.slice(1);
  const m = /^([A-G][#b]?)(m|min)?$/.exec(nk);
  if (!m) { status('key? e.g. Gm, +2, 0'); return; }
  const old = /^([A-G][#b]?)/.exec(songKey());
  setSteps(((NOTE_INDEX[m[1]] - NOTE_INDEX[old[1]]) % 12 + 12) % 12);
}

/* temporarily swap a button for a small input */
function keyPrompt(btn, onVal) {
  if (btn.nextElementSibling && btn.nextElementSibling.classList.contains('cinput')) return;
  const inp = document.createElement('input');
  inp.className = 'cinput cinput--key';
  inp.placeholder = shiftKey(songKey(), state.steps).name;
  btn.style.display = 'none';
  btn.after(inp);
  inp.focus();
  let done = false;
  const commit = (ok) => {
    if (done) return;
    done = true;
    const v = inp.value.trim();
    inp.remove();
    btn.style.display = '';
    if (ok && v) onVal(v);
  };
  inp.addEventListener('blur', () => commit(true));
  inp.addEventListener('keydown', (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Enter') commit(true);
    if (ev.key === 'Escape') commit(false);
  });
}

/* small floating input; commit(null)=cancel, commit('')=delete, else value.
   multiline=true swaps in a textarea (Enter = newline, Ctrl/⌘+Enter or blur
   commits) */
function inlineInput(host, styles, initial, onCommit, multiline) {
  const inp = document.createElement(multiline ? 'textarea' : 'input');
  inp.className = 'cinput' + (multiline ? ' cinput--area' : '');
  Object.assign(inp.style, styles);
  inp.value = initial;
  if (multiline) inp.rows = Math.max(2, initial.split('\n').length + 1);
  host.appendChild(inp);
  inp.focus({ preventScroll: true });
  inp.select();
  let done = false;
  const commit = (ok) => {
    if (done) return;
    done = true;
    inp.remove();
    onCommit(ok ? inp.value.trim() : null);
  };
  inp.addEventListener('blur', () => commit(true));
  inp.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) commit(true);
    if (e.key === 'Escape') commit(false);
  });
}

function lyricLine(li) { return state.model[li]; }

function editChordAt(li, ci, host, col) {
  const line = lyricLine(li);
  const initial = ci === null ? '' : line.chords[ci].sym;
  inlineInput(host, { left: (col * state.charW) + 'px', top: '0px' }, initial, (val) => {
    if (val === null) { renderSheet(); return; }
    if (ci === null) {
      if (val) line.chords.push({ sym: val, col });
    } else if (val === '') {
      line.chords.splice(ci, 1);
    } else {
      line.chords[ci].sym = val;
    }
    markDirty();
    renderSong();
  });
}

function initLyricEditing() {
  const sheet = $('#sheet');

  /* drag chords / click to edit / click lyric to add */
  sheet.addEventListener('pointerdown', (e) => {
    if (!state.edit || state.view !== 'lyrics') return;
    const btn = e.target.closest('.c--abs');
    if (!btn) return;
    e.preventDefault();
    const li = +btn.dataset.li, ci = +btn.dataset.ci;
    const line = lyricLine(li);
    const startX = e.clientX;
    const startLeft = parseFloat(btn.style.left);
    let moved = false;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      if (moved) btn.style.left = Math.max(0, startLeft + dx) + 'px';
    };
    const onUp = (ev) => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      if (moved) {
        const col = Math.max(0, Math.round((startLeft + (ev.clientX - startX)) / state.charW));
        line.chords[ci].col = Math.min(col, line.text.length + 40);
        markDirty();
        renderSheet();
      } else {
        editChordAt(li, ci, btn.parentElement, line.chords[ci].col);
      }
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });

  sheet.addEventListener('click', (e) => {
    if (!state.edit || state.view !== 'lyrics') return;
    if (e.target.closest('.c--abs') || e.target.closest('.cinput') || e.target.closest('.rep')) return;
    const eline = e.target.closest('.eline');
    if (!eline) return;
    const li = +eline.dataset.li;
    const t = eline.querySelector('.t');
    const col = Math.max(0, Math.round((e.clientX - t.getBoundingClientRect().left) / state.charW));
    editChordAt(li, null, eline, col);
  });
}

function initBarEditing() {
  const sheet = $('#sheet');
  sheet.addEventListener('click', (e) => {
    if (!state.edit) {
      /* view mode: chord tap highlights its diagram */
      const b = e.target.closest('.c[data-ch]');
      if (!b) return;
      document.querySelectorAll('#chordStrip .shape').forEach(el => {
        const hot = el.dataset.ch === b.dataset.ch;
        el.classList.toggle('is-hot', hot);
        if (hot) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      return;
    }
    const rep = e.target.closest('[data-rep]');
    if (rep) {
      let obj;
      if (rep.dataset.rep === 'part') {
        obj = state.arr.parts[+rep.dataset.i];
      } else if (rep.dataset.rep === 'prow') {
        const [pi, ri] = rep.dataset.i.split(':').map(Number);
        obj = state.arr.parts[pi].rows[ri];
      } else if (rep.dataset.rep === 'row') {
        ensureBarsEditable();
        obj = state.bars[+rep.dataset.i];
      } else {
        obj = state.model[+rep.dataset.i];
      }
      obj.repeat = (obj.repeat || 1) >= 4 ? null : (obj.repeat || 1) + 1;
      markDirty();
      renderSheet();
      return;
    }

    if (state.view === 'parts') {
      const ensureArr = () => { if (!state.arr) state.arr = { parts: [], order: [] }; };

      if (e.target.closest('[data-genparts]')) {
        if (state.arr && state.arr.parts.length &&
            !confirm('Replace the existing arrangement with a generated one?')) return;
        state.arr = generateArrangement();
        markDirty();
        renderSheet();
        return;
      }
      if (e.target.closest('[data-addpart]')) {
        ensureArr();
        state.arr.parts.push({ name: 'Part ' + (state.arr.parts.length + 1), rows: [{ bars: [[]], repeat: null }] });
        markDirty();
        renderSheet();
        return;
      }
      const pdel = e.target.closest('[data-pdel]');
      if (pdel) {
        const pi = +pdel.dataset.pdel;
        const part = state.arr.parts[pi];
        if (!confirm(`Delete part “${part.name}”?`)) return;
        state.arr.order = state.arr.order.filter(o => o.name !== part.name);
        state.arr.parts.splice(pi, 1);
        markDirty();
        renderSheet();
        return;
      }
      const pname = e.target.closest('[data-pname]');
      if (pname && !pname.querySelector('.cinput')) {
        const part = state.arr.parts[+pname.dataset.pname];
        pname.innerHTML = '';
        inlineInput(pname, { position: 'static', width: '8em' }, part.name, (val) => {
          if (val) {
            state.arr.order.forEach(o => { if (o.name === part.name) o.name = val; });
            part.name = val;
            markDirty();
          }
          renderSheet();
        });
        return;
      }
      const pbars = e.target.closest('[data-pbars]');
      if (pbars && !pbars.querySelector('.cinput')) {
        const pi = +pbars.dataset.pbars;
        const part = state.arr.parts[pi];
        const cur = part.rows
          .map(r => joinBarRow(r.bars) + (r.repeat ? '   x' + r.repeat : ''))
          .join('\n');
        pbars.innerHTML = '';
        inlineInput(pbars, { position: 'static', width: '100%' }, cur, (val) => {
          if (val !== null) {
            if (val === '') {
              state.arr.order = state.arr.order.filter(o => o.name !== part.name);
              state.arr.parts.splice(pi, 1);
            } else {
              part.rows = val.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
                const [body, r] = stripRepeat(line);
                return { bars: splitBarRow(body), repeat: r };
              });
            }
            markDirty();
          }
          renderSong();
        }, true);
        return;
      }
      const ord = e.target.closest('[data-order]');
      if (ord && !ord.querySelector('.cinput')) {
        ensureArr();
        const cur = state.arr.order.map(o => o.name + (o.times > 1 ? ' x' + o.times : '')).join(', ');
        ord.innerHTML = '';
        inlineInput(ord, { position: 'static', width: '100%' }, cur, (val) => {
          if (val !== null) {
            state.arr.order = !val ? [] : val.split(/,|→|>/).map(s => s.trim()).filter(Boolean).map(it => {
              const mm = /^(.*?)(?:\s*[x×](\d+))?$/.exec(it);
              return { name: mm[1].trim(), times: mm[2] ? +mm[2] : 1 };
            });
            markDirty();
          }
          renderSheet();
        });
        return;
      }
      return;
    }

    if (state.view !== 'bars') return;

    const addbar = e.target.closest('[data-addbar]');
    if (addbar) {
      ensureBarsEditable();
      const row = state.bars[+addbar.dataset.addbar];
      row.bars.push([]);
      markDirty();
      renderSheet();
      return;
    }

    if (e.target.closest('[data-addrow]')) {
      ensureBarsEditable();
      state.bars.push({ type: 'row', bars: [[]], caption: '', repeat: null });
      markDirty();
      renderSheet();
      return;
    }

    const cap = e.target.closest('[data-cap]');
    if (cap && !cap.querySelector('.cinput')) {
      ensureBarsEditable();
      const ri = +cap.dataset.cap;
      const row = state.bars[ri];
      cap.innerHTML = '';
      inlineInput(cap, { position: 'static', width: '100%' }, row.caption, (val) => {
        if (val !== null) { row.caption = val; markDirty(); }
        renderSheet();
      });
      return;
    }

    const bar = e.target.closest('.bar--edit');
    if (bar && !bar.querySelector('.cinput')) {
      ensureBarsEditable();
      const ri = +bar.dataset.ri, bi = +bar.dataset.bi;
      const row = state.bars[ri];
      bar.innerHTML = '';
      bar.classList.add('bar--typing');
      inlineInput(bar, { position: 'static' }, row.bars[bi].join(' '), (val) => {
        if (val !== null) {
          if (val === '') {
            row.bars.splice(bi, 1);
            if (!row.bars.length) state.bars.splice(ri, 1);
          } else {
            row.bars[bi] = val.split(/\s+/);
          }
          markDirty();
        }
        renderSong();
      });
    }
  });
}

/* ================= video player ================= */

let ytPlayer = null, ytReady = false, ytApiLoading = false;

function videoId(song) {
  const m = /(?:v=|youtu\.be\/|embed\/)([\w-]{11})/.exec((song && song.video) || '');
  return m ? m[1] : null;
}

function videoOpen() { return !$('#vdock').hidden; }

function openVideo() {
  const id = videoId(state.song);
  if (!id) return;
  $('#vdock').hidden = false;
  $('#videoBtn').classList.add('is-on');
  if (ytPlayer && ytReady) {
    const cur = ytPlayer.getVideoData && ytPlayer.getVideoData().video_id;
    if (cur !== id) ytPlayer.cueVideoById(id);
    return;
  }
  if (!ytApiLoading) {
    ytApiLoading = true;
    window.onYouTubeIframeAPIReady = () => {
      ytPlayer = new YT.Player('ytplayer', {
        width: '320', height: '180', videoId: id,
        playerVars: { playsinline: 1, rel: 0 },
        events: { onReady: () => { ytReady = true; } }
      });
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
}

function closeVideo() {
  $('#vdock').hidden = true;
  $('#videoBtn').classList.remove('is-on');
  if (ytPlayer && ytReady) ytPlayer.pauseVideo();
}

function syncVideoToSong() {
  const vid = state.song ? videoId(state.song) : null;
  $('#videoBtn').hidden = !vid;
  if (!vid) { if (videoOpen()) closeVideo(); return; }
  if (videoOpen() && ytPlayer && ytReady) {
    const cur = ytPlayer.getVideoData && ytPlayer.getVideoData().video_id;
    if (cur !== vid) ytPlayer.cueVideoById(vid);
  }
}

function videoKeys(e) {
  if (!videoOpen() || !ytPlayer || !ytReady) return false;
  const step = e.shiftKey ? 15 : 5;
  if (e.key === 'ArrowLeft') {
    ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - step), true);
  } else if (e.key === 'ArrowRight') {
    ytPlayer.seekTo(ytPlayer.getCurrentTime() + step, true);
  } else if (e.key === ' ') {
    ytPlayer.getPlayerState() === 1 ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
  } else {
    return false;
  }
  e.preventDefault();
  return true;
}

/* ---------- drag-reorder (parts view, edit mode) ----------
   Drag order pills to resequence the play order; drag a part's name pill
   up/down to reorder the part list. A <5px move is still a click. */

let suppressClick = false;

function initPartsReorder() {
  const sheet = $('#sheet');

  /* swallow the click that follows a completed drag, before the editors see it */
  sheet.addEventListener('click', (e) => {
    if (suppressClick) {
      suppressClick = false;
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  sheet.addEventListener('pointerdown', (e) => {
    if (!state.edit || state.view !== 'parts' || e.target.closest('.cinput')) return;
    const pill = e.target.closest('.opill');
    const namebtn = e.target.closest('[data-pname]');
    if (!pill && !namebtn) return;
    const isOrder = !!pill;
    const el = pill || namebtn;
    const src = isOrder
      ? [...sheet.querySelectorAll('.opill')].indexOf(pill)
      : +namebtn.dataset.pname;
    const startX = e.clientX, startY = e.clientY;
    let moved = false, target = -1, after = false, marker = null;

    const clearMarker = () => {
      if (marker) marker.classList.remove('drop-before', 'drop-after');
      marker = null;
    };
    const onMove = (ev) => {
      if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 5) moved = true;
      if (!moved) return;
      ev.preventDefault();
      el.classList.add('dragging');
      document.body.classList.add('noselect');
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      clearMarker();
      target = -1;
      if (!under) return;
      if (isOrder) {
        const t = under.closest('.opill');
        if (t && t !== el) {
          target = [...sheet.querySelectorAll('.opill')].indexOf(t);
          const r = t.getBoundingClientRect();
          after = ev.clientX > r.left + r.width / 2;
          t.classList.add(after ? 'drop-after' : 'drop-before');
          marker = t;
        }
      } else {
        const cell = under.closest('.part__namecell, .part__bars');
        const partEl = cell && cell.closest('.part');
        if (partEl) {
          const ti = +partEl.querySelector('[data-pname]').dataset.pname;
          if (ti !== src) {
            target = ti;
            const r = partEl.querySelector('.part__bars').getBoundingClientRect();
            after = ev.clientY > r.top + r.height / 2;
            const nc = partEl.querySelector('.part__namecell');
            nc.classList.add(after ? 'drop-after' : 'drop-before');
            marker = nc;
          }
        }
      }
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      el.classList.remove('dragging');
      document.body.classList.remove('noselect');
      clearMarker();
      if (!moved) return;
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 150);
      if (target < 0 || target === src) { renderSheet(); return; }
      const list = isOrder ? state.arr.order : state.arr.parts;
      const item = list.splice(src, 1)[0];
      let ins = target + (after ? 1 : 0);
      if (src < ins) ins--;
      list.splice(ins, 0, item);
      markDirty();
      renderSheet();
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}

/* ================= source modal ================= */

function openSource() {
  $('#srcTitle').value = state.song.title || '';
  $('#srcArtist').value = state.song.artist || '';
  $('#srcKey').value = state.song.key || '';
  $('#srcCapo').value = state.song.capo || '';
  applyModelToSong();
  $('#srcBody').value = state.song.body;
  $('#srcBars').value = state.song.bars || serializeBars(deriveBars(state.model));
  $('#srcArr').value = state.song.arrangement || '';
  $('#srcModal').hidden = false;
}

function saveSource() {
  state.song.title = $('#srcTitle').value.trim() || state.song.title;
  state.song.artist = $('#srcArtist').value.trim();
  state.song.key = $('#srcKey').value.trim();
  state.song.capo = +$('#srcCapo').value || 0;
  state.song.body = $('#srcBody').value;
  state.song.format = /\[[A-G][#b]?[^\]]*\]/.test(state.song.body) ? 'inline' : 'over';
  const barsText = $('#srcBars').value.trim();
  state.song.bars = barsText || undefined;
  const arrText = $('#srcArr').value.trim();
  if (arrText) state.song.arrangement = arrText;
  else delete state.song.arrangement;
  state.model = parseSong(state.song);
  state.bars = barsText ? parseBars(barsText) : null;
  state.barsExplicit = !!barsText;
  state.arr = arrText ? parseArrangement(arrText) : null;
  $('#srcModal').hidden = true;
  state.dirty = true;
  saveSong();
  renderSong();
}

/* ================= import ================= */

function slug(s) {
  return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function openImport(prefillTitle) {
  $('#importModal').hidden = false;
  if (prefillTitle) $('#impTitle').value = prefillTitle;
  $('#impTitle').focus();
}
function closeImport() {
  $('#importModal').hidden = true;
  ['#impTitle', '#impArtist', '#impKey', '#impCapo', '#impBody'].forEach(s => { $(s).value = ''; });
}

function saveImport() {
  const title = $('#impTitle').value.trim();
  const body = $('#impBody').value;
  if (!title || !body.trim()) { $('#impBody').focus(); return; }
  const song = {
    id: slug(title + '-' + ($('#impArtist').value || 'local')) || 'song-' + Math.random().toString(36).slice(2, 7),
    title,
    artist: $('#impArtist').value.trim(),
    key: $('#impKey').value.trim(),
    capo: +$('#impCapo').value || 0,
    body
  };
  const list = localSongs().filter(s => s.id !== song.id);
  list.push(song);
  saveLocalSongs(list);
  closeImport();
  location.hash = '#/song/' + encodeURIComponent(song.id);
}

/* ================= events ================= */

function init() {
  const instSel = $('#instrument');
  instSel.innerHTML = Object.entries(INSTRUMENTS)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
  instSel.value = state.instrument;

  instSel.addEventListener('change', () => {
    state.instrument = instSel.value;
    localStorage.setItem('charts:instrument', state.instrument);
    if (state.song) renderStrip();
  });

  $('#searchInput').addEventListener('input', () => {
    if (state.song) { location.hash = '#/'; }
    renderHome($('#searchInput').value);
  });
  $('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = fold($('#searchInput').value);
      const hit = allSongs().filter(s => fold(s.title + ' ' + (s.artist || '')).includes(q));
      if (q && hit.length === 1) location.hash = '#/song/' + encodeURIComponent(hit[0].id);
    }
    if (e.key === 'Escape') { $('#searchInput').value = ''; renderHome(''); }
  });

  const bump = (d) => {
    if (state.edit) changeKey(shiftKey(songKey(), d).name);
    else setSteps(state.steps + d);
  };
  $('#transDown').addEventListener('click', () => bump(-1));
  $('#transUp').addEventListener('click', () => bump(1));
  $('#transVal').addEventListener('click', () => {
    if (!state.song) return;
    keyPrompt($('#transVal'), (v) => {
      if (state.edit) {
        if (/^[+-]?\d+$/.test(v)) v = shiftKey(songKey(), parseInt(v, 10)).name;
        changeKey(v);
      } else {
        viewKeyChange(v);
      }
    });
  });

  $('#viewToggle').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b) return;
    state.view = b.dataset.view;
    renderSong();
  });
  $('#lyricsToggle').addEventListener('click', () => {
    state.showLyrics = !state.showLyrics;
    renderSong();
  });

  $('#editToggle').addEventListener('click', () => {
    if (!state.edit) setSteps(0);
    state.edit = !state.edit;
    if (!state.edit && state.dirty) { clearTimeout(saveTimer); saveSong(); }
    renderSong();
  });
  $('#stripToggle').addEventListener('click', () => {
    state.stripOpen = !state.stripOpen;
    localStorage.setItem('charts:strip', state.stripOpen ? '1' : '0');
    renderStrip();
  });

  $('#srcBtn').addEventListener('click', openSource);
  $('#srcCancel').addEventListener('click', () => { $('#srcModal').hidden = true; });
  $('#srcSave').addEventListener('click', saveSource);
  $('#srcModal').addEventListener('click', (e) => {
    if (e.target === $('#srcModal')) $('#srcModal').hidden = true;
  });

  function setBarw(v) {
    state.barw = v;
    localStorage.setItem('charts:barw', v);
    renderSong();
  }
  $('#barwUp').addEventListener('click', () => setBarw(state.barw ? Math.min(14, state.barw + 1) : 6));
  $('#barwDown').addEventListener('click', () => setBarw(state.barw <= 4 ? 0 : state.barw - 1));
  $('#barwVal').addEventListener('click', () => setBarw(0));

  $('#fontDown').addEventListener('click', () => setScale(state.scale - 0.08));
  $('#fontUp').addEventListener('click', () => setScale(state.scale + 0.08));
  function setScale(v) {
    state.scale = Math.min(1.5, Math.max(0.7, Math.round(v * 100) / 100));
    localStorage.setItem('charts:scale', state.scale);
    if (state.song) renderSheet();
  }

  initLyricEditing();
  initBarEditing();
  initPartsReorder();

  /* local song + browser-edit tools */
  $('#songList').addEventListener('click', (e) => {
    const copy = e.target.closest('[data-copy]');
    const del = e.target.closest('[data-del]');
    const centry = e.target.closest('[data-centry]');
    const drop = e.target.closest('[data-drop]');
    if (copy) {
      const song = localSongs().find(s => s.id === copy.dataset.copy);
      if (song) navigator.clipboard.writeText(JSON.stringify(song, null, 2)).then(() => {
        copy.textContent = 'copied ✓';
        setTimeout(() => { copy.textContent = 'copy json'; }, 1200);
      });
    }
    if (del) {
      saveLocalSongs(localSongs().filter(s => s.id !== del.dataset.del));
      renderHome($('#searchInput').value);
    }
    if (centry) {
      const song = allSongs().find(s => s.id === centry.dataset.centry);
      if (song) navigator.clipboard.writeText(songEntryJS(song)).then(() => {
        centry.textContent = 'copied ✓';
        setTimeout(() => { centry.textContent = 'copy entry'; }, 1200);
      });
    }
    if (drop) {
      if (!confirm('Discard the edits made in this browser and go back to the published version?')) return;
      const ov = overrides();
      delete ov[drop.dataset.drop];
      saveOverrides(ov);
      renderHome($('#searchInput').value);
    }
  });

  $('#mergeBtn').addEventListener('click', mergeOverrides);
  $('#copyDbBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(buildDbFile()).then(() => {
      $('#copyDbBtn').textContent = 'copied ✓ — paste it over the file on GitHub';
      setTimeout(() => { $('#copyDbBtn').textContent = 'copy updated charts-db.js'; }, 4000);
    });
  });
  probeServer().then(() => {
    if (!state.song) renderHome($('#searchInput').value);
  });

  $('#addBtn').addEventListener('click', () => openImport(''));
  $('#webImport').addEventListener('click', () => openImport($('#searchInput').value));
  $('#impCancel').addEventListener('click', closeImport);
  $('#impSave').addEventListener('click', saveImport);
  $('#importModal').addEventListener('click', (e) => {
    if (e.target === $('#importModal')) closeImport();
  });

  $('#videoBtn').addEventListener('click', () => (videoOpen() ? closeVideo() : openVideo()));
  $('#vdockClose').addEventListener('click', closeVideo);
  $('#vdockToggle').addEventListener('click', () => {
    const min = $('#vdock').classList.toggle('vdock--min');
    $('#vdockToggle').textContent = min ? '▴' : '▾';
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'Escape') {
      if (!$('#importModal').hidden) { closeImport(); return; }
      if (!$('#srcModal').hidden) { $('#srcModal').hidden = true; return; }
    }
    if (!state.song) return;
    if (videoKeys(e)) return;
    if (state.edit) return;
    if (e.key === '+' || e.key === '=') setSteps(state.steps + 1);
    if (e.key === '-') setSteps(state.steps - 1);
    if (e.key === '0') setSteps(0);
  });

  window.addEventListener('hashchange', route);
  route();
}

init();
})();
