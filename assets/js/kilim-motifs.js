/* Kilim motif library — traditional Anatolian motifs drawn on a weave-cell grid.
 * Each motif is a matrix of cells: '.' = ground, '1'/'2'/'3' = color slots.
 * The stepped geometry mirrors how slit-weave kilims actually build shapes,
 * one weft row at a time. Motif meanings follow the traditional canon
 * (elibelinde, koçboynuzu, göz, pıtrak, su yolu...).
 */
window.KILIM = (function () {
  'use strict';

  /* ---------- procedural helpers ---------- */

  // 8-pointed Seljuk star: union of a square and a diagonal square (diamond).
  function star8(n, sq, di) {
    var c = (n - 1) / 2, rows = [];
    for (var y = 0; y < n; y++) {
      var r = '';
      for (var x = 0; x < n; x++) {
        var d = Math.abs(x - c) + Math.abs(y - c);
        var inSq = Math.abs(x - c) <= sq && Math.abs(y - c) <= sq;
        var ch = '.';
        if (inSq || d <= di) ch = '1';
        if (d <= 3) ch = '2';
        if (d <= 1) ch = '3';
        r += ch;
      }
      rows.push(r);
    }
    return rows;
  }

  // mirror a half-grid to the right / a top-half down, sharing the center column/row
  function mx(rows) {
    return rows.map(function (r) { return r + r.split('').reverse().slice(1).join(''); });
  }
  function my(rows) {
    return rows.concat(rows.slice(0, -1).reverse());
  }

  // sawtooth of solid triangles (kurt ağzı — reciprocal teeth against the ground)
  function teeth(p, h) {
    var c = (p - 1) / 2, rows = [];
    for (var y = 0; y < h; y++) {
      var r = '';
      for (var x = 0; x < p; x++) r += (h - 1 - y) <= (c - Math.abs(x - c)) ? '1' : '.';
      rows.push(r);
    }
    return rows;
  }

  /* ---------- motifs ---------- */

  var MOTIFS = [
    {
      id: 'elibelinde', name: 'Elibelinde', en: 'Hands on Hips',
      meaning: 'The mother goddess — motherhood, fertility and abundance.',
      field: true,
      grid: [
        '.22.......22.',
        '.2.........2.',
        '.2....1....2.',
        '.2...111...2.',
        '.2..11111..2.',
        '.2...111...2.',
        '.22...1...22.',
        '..22..1..22..',
        '...2.111.2...',
        '...2111112...',
        '..111121111..',
        '.11112221111.',
        '.11111211111.',
        '.11111111111.'
      ]
    },
    {
      id: 'kocboynuzu', name: 'Koçboynuzu', en: 'Ram’s Horn',
      meaning: 'Power, heroism and male fertility; horns curling from the medallion.',
      field: true,
      grid: [
        '11.........11',
        '.1.........1.',
        '.1....1....1.',
        '.1...111...1.',
        '.1..11211..1.',
        '.11112221111.',
        '....11211....',
        '.....111.....',
        '......1......'
      ]
    },
    {
      id: 'goz', name: 'Göz', en: 'Eye',
      meaning: 'A quartered eye that reflects the evil gaze away from the household.',
      field: true, border: true,
      grid: [
        '....1....',
        '...111...',
        '..11211..',
        '.1122211.',
        '112232211',
        '.1122211.',
        '..11211..',
        '...111...',
        '....1....'
      ]
    },
    {
      id: 'yildiz', name: 'Yıldız', en: 'Star',
      meaning: 'The eight-pointed Seljuk star — happiness, fate and the wheel of life.',
      field: true,
      grid: star8(15, 5, 7)
    },
    {
      id: 'pitrak', name: 'Pıtrak', en: 'Burdock',
      meaning: 'A burr that clings — abundance, and a spiked charm against the evil eye.',
      field: true, border: true,
      grid: [
        '1....1....1',
        '.1...1...1.',
        '..1..1..1..',
        '....111....',
        '...11211...',
        '11112221111',
        '...11211...',
        '....111....',
        '..1..1..1..',
        '.1...1...1.',
        '1....1....1'
      ]
    },
    {
      id: 'muska', name: 'Muska', en: 'Amulet',
      meaning: 'A folded triangular charm carrying a prayer; protection from harm.',
      field: true, border: true,
      grid: [
        '111111111',
        '.1222221.',
        '..12221..',
        '...121...',
        '....1....',
        '....2....'
      ]
    },
    {
      id: 'tarak', name: 'Tarak', en: 'Comb',
      meaning: 'The weaver’s comb — marriage, birth, and protection of both.',
      field: true, border: true,
      grid: [
        '1.1.1.1.1',
        '1.1.1.1.1',
        '1.1.1.1.1',
        '111111111',
        '122222221',
        '111111111'
      ]
    },
    {
      id: 'hayat', name: 'Hayat Ağacı', en: 'Tree of Life',
      meaning: 'The tree joining earth and sky — immortality and the soul’s ascent.',
      field: true,
      grid: [
        '......1......',
        '.....111.....',
        '....11111....',
        '......1......',
        '.2....1....2.',
        '..2...1...2..',
        '...2..1..2...',
        '....2.1.2....',
        '.2....1....2.',
        '..2...1...2..',
        '...2..1..2...',
        '....2.1.2....',
        '......1......',
        '..111111111..'
      ]
    },
    {
      id: 'bukagi', name: 'Bukağı', en: 'Fetter',
      meaning: 'Two lozenges bound together — family unity and lasting devotion.',
      field: true,
      grid: [
        '...1.......1...',
        '..111.....111..',
        '.11111...11111.',
        '.1121111111211.',
        '.11111...11111.',
        '..111.....111..',
        '...1.......1...'
      ]
    },
    {
      id: 'akrep', name: 'Akrep', en: 'Scorpion',
      meaning: 'Woven so the scorpion itself keeps scorpions away.',
      field: true,
      grid: [
        '.11.......11.',
        '.1.........1.',
        '.1..11111..1.',
        '.11111211111.',
        '....11111....',
        '......1......',
        '.....11......',
        '......11.....',
        '.....111.....'
      ]
    },
    {
      id: 'kus', name: 'Kuş', en: 'Bird',
      meaning: 'Happiness, joy and love; the bird is also the soul of the departed on its way.',
      field: true, facing: true,
      grid: [
        '..........11.',
        '..........211',
        '..........11.',
        '..........11.',
        '........1111.',
        '11....111111.',
        '11..11111111.',
        '..1111111111.',
        '111111111111.'
      ]
    },
    {
      id: 'ciftkus', name: 'Çift Başlı Kuş', en: 'Double-Headed Bird',
      meaning: 'The two-headed bird of the Seljuks — power, and vigilance in both directions.',
      field: true,
      grid: mx([
        '...11....',
        '..111....',
        '..1..1...',
        '......1..',
        '.......1.',
        '.111....1',
        '..111..11',
        '...11.112',
        '.......11',
        '........1',
        '......111',
        '.......11'
      ])
    },
    {
      id: 'ejder', name: 'Ejder', en: 'Dragon',
      meaning: 'Master of air and water, guardian of treasures; a lozenge fringed with dragon hooks.',
      field: true,
      grid: my(mx([
        '..........1',
        '......1..11',
        '......1111.',
        '.......11..',
        '...1..11..2',
        '...1111..22',
        '....11..22.',
        '1..11..22..',
        '1111..22..3',
        '.11..22..33',
        '11..22..333'
      ]))
    },
    {
      id: 'sahin', name: 'Şahin', en: 'Retro Car',
      meaning: 'The falcon of the highway — a modern nomad’s steed, woven with a wink.',
      field: true, facing: true,
      grid: [
        '.........111111111...........',
        '........12222122221..........',
        '.......11222212222111........',
        '.111111111111111111111111111.',
        '.311111111311111311111111333.',
        '.111111111111111111111111111.',
        '33111111111111111111111111133',
        '.....33333111111111133333....',
        '.....33233..........33233....',
        '......333............333.....'
      ]
    },
    {
      id: 'sahinon', name: 'Şahin (önden)', en: 'Retro Car · Front',
      meaning: 'The Şahin head-on — twin lamps like eyes, grille like a woven comb.',
      field: true,
      grid: mx([
        '...111111',
        '..1222222',
        '1.1222222',
        '.11111111',
        '.11111111',
        '.13331223',
        '.11111111',
        '332233333',
        '.333.....'
      ])
    },
    /* ---------- border bands ---------- */
    {
      id: 'suyolu', name: 'Su Yolu', en: 'Running Water',
      meaning: 'The zigzag of running water — life, renewal, and flow.',
      border: true, flow: true,
      grid: [
        '...1..',
        '..111.',
        '.11.11',
        '11.2.1',
        '1.....'
      ]
    },
    {
      id: 'cengel', name: 'Çengel', en: 'Hook',
      meaning: 'A running hook that snags the evil eye before it lands.',
      border: true,
      grid: [
        '.111..',
        '...1..',
        '.11111',
        '...1..',
        '...111'
      ]
    },
    {
      id: 'gozdizi', name: 'Göz Dizisi', en: 'Eye Chain',
      meaning: 'A chain of eyes standing guard along the frame.',
      border: true,
      grid: [
        '...1...',
        '..111..',
        '.11211.',
        '1122211',
        '.11211.',
        '..111..',
        '...1...'
      ]
    },
    {
      id: 'kurtagzi', name: 'Kurt Ağzı', en: 'Wolf’s Mouth',
      meaning: 'Teeth of the wolf, turned outward to protect the flock.',
      border: true, flow: true,
      grid: teeth(7, 4)
    },
    {
      id: 'kivrim', name: 'Kıvrım', en: 'Running Scroll',
      meaning: 'An endless scroll — continuity of life and lineage.',
      border: true, flow: true,
      grid: [
        '1.....',
        '1.111.',
        '1.1.1.',
        '1...1.',
        '111111'
      ]
    },
    /* ---------- minor guards (thin, intricate stripes) ---------- */
    {
      id: 'boncuk', name: 'Boncuk', en: 'Beads',
      meaning: 'A string of nazar beads — small blue eyes against the evil gaze.',
      border: true, flow: true,
      grid: [
        '.1..',
        '121.',
        '.1..'
      ]
    },
    {
      id: 'capraz', name: 'Çapraz', en: 'Diagonal Stripes',
      meaning: 'A slanted guard path — motion, water, the road travelled.',
      border: true, flow: true,
      grid: [
        '11..',
        '.11.',
        '..11'
      ]
    },
    {
      id: 'zincir', name: 'Zincir', en: 'Chain',
      meaning: 'Linked S-hooks — bonds that hold, luck that does not break.',
      border: true, flow: true,
      grid: [
        '.11.',
        '.1..',
        '..1.',
        '.11.'
      ]
    },
    {
      id: 'dama', name: 'Dama', en: 'Checker',
      meaning: 'Alternating light and dark — day and night in balance.',
      border: true, flow: true,
      grid: [
        '12',
        '21'
      ]
    }
  ];

  /* ---------- palettes (natural-dye colorways) ---------- */
  /* g = ground, c1..c3 = motif slots. Field and border are separate zones. */

  var PALETTES = [
    {
      id: 'anadolu', name: 'Anadolu', note: 'madder ground, indigo & ivory',
      field:  { g: '#8a2b26', c1: '#e9dcc2', c2: '#2c4a6e', c3: '#d69a3f' },
      border: { g: '#2f2018', c1: '#d69a3f', c2: '#e9dcc2', c3: '#8a2b26' }
    },
    {
      id: 'konya', name: 'Konya', note: 'ivory ground, walnut & madder',
      field:  { g: '#e7d9b9', c1: '#9e2b25', c2: '#31517a', c3: '#5a4632' },
      border: { g: '#9e2b25', c1: '#e7d9b9', c2: '#c9973f', c3: '#31517a' }
    },
    {
      id: 'ege', name: 'Ege', note: 'deep indigo, teal & ochre',
      field:  { g: '#22384f', c1: '#e8ddc4', c2: '#cf9a44', c3: '#a8322c' },
      border: { g: '#a8322c', c1: '#e8ddc4', c2: '#3f6f6a', c3: '#22384f' }
    },
    {
      id: 'van', name: 'Van', note: 'dark brown, ember red & camel',
      field:  { g: '#2e2015', c1: '#c96f2e', c2: '#8f2a23', c3: '#e3d3ae' },
      border: { g: '#8f2a23', c1: '#e3d3ae', c2: '#c96f2e', c3: '#3a5875' }
    },
    {
      id: 'dogal', name: 'Doğal', note: 'undyed wools — camel, cream, walnut',
      field:  { g: '#d9cbb0', c1: '#4a3a2c', c2: '#a98d63', c3: '#8a8478' },
      border: { g: '#4a3a2c', c1: '#d9cbb0', c2: '#a98d63', c3: '#efe6d2' }
    }
  ];

  /* ---------- weave font (5×7 body on a 10-row line) ----------
   * 7-row glyphs sit on rows 2–8 of the line; 10-row glyphs carry their own
   * diacritic (row 0) or cedilla (row 9). '1' = woven cell. */
  var F = {
    'A': '.111./1...1/1...1/11111/1...1/1...1/1...1',
    'B': '1111./1...1/1...1/1111./1...1/1...1/1111.',
    'C': '.111./1...1/1..../1..../1..../1...1/.111.',
    'D': '1111./1...1/1...1/1...1/1...1/1...1/1111.',
    'E': '11111/1..../1..../1111./1..../1..../11111',
    'F': '11111/1..../1..../1111./1..../1..../1....',
    'G': '.111./1...1/1..../1.111/1...1/1...1/.1111',
    'H': '1...1/1...1/1...1/11111/1...1/1...1/1...1',
    'I': '11111/..1../..1../..1../..1../..1../11111',
    'J': '..111/...1./...1./...1./...1./1..1./.11..',
    'K': '1...1/1..1./1.1../11.../1.1../1..1./1...1',
    'L': '1..../1..../1..../1..../1..../1..../11111',
    'M': '1...1/11.11/1.1.1/1.1.1/1...1/1...1/1...1',
    'N': '1...1/11..1/1.1.1/1..11/1...1/1...1/1...1',
    'O': '.111./1...1/1...1/1...1/1...1/1...1/.111.',
    'P': '1111./1...1/1...1/1111./1..../1..../1....',
    'Q': '.111./1...1/1...1/1...1/1.1.1/1..1./.11.1',
    'R': '1111./1...1/1...1/1111./1.1../1..1./1...1',
    'S': '.1111/1..../1..../.111./....1/....1/1111.',
    'T': '11111/..1../..1../..1../..1../..1../..1..',
    'U': '1...1/1...1/1...1/1...1/1...1/1...1/.111.',
    'V': '1...1/1...1/1...1/1...1/.1.1./.1.1./..1..',
    'W': '1...1/1...1/1...1/1.1.1/1.1.1/11.11/1...1',
    'X': '1...1/1...1/.1.1./..1../.1.1./1...1/1...1',
    'Y': '1...1/1...1/.1.1./..1../..1../..1../..1..',
    'Z': '11111/....1/...1./..1../.1.../1..../11111',
    'Ç': '...../...../.111./1...1/1..../1..../1..../1...1/.111./..1..',
    'Ğ': '.111./...../.111./1...1/1..../1.111/1...1/1...1/.1111/.....',
    'İ': '..1../...../11111/..1../..1../..1../..1../..1../11111/.....',
    'Ö': '.1.1./...../.111./1...1/1...1/1...1/1...1/1...1/.111./.....',
    'Ş': '...../...../.1111/1..../1..../.111./....1/....1/1111./..1..',
    'Ü': '.1.1./...../1...1/1...1/1...1/1...1/1...1/1...1/.111./.....',
    '0': '.111./1...1/1..11/1.1.1/11..1/1...1/.111.',
    '1': '..1../.11../..1../..1../..1../..1../.111.',
    '2': '.111./1...1/....1/...1./..1../.1.../11111',
    '3': '11111/...1./..1../...1./....1/1...1/.111.',
    '4': '...1./..11./.1.1./1..1./11111/...1./...1.',
    '5': '11111/1..../1111./....1/....1/1...1/.111.',
    '6': '..11./.1.../1..../1111./1...1/1...1/.111.',
    '7': '11111/....1/...1./..1../.1.../.1.../.1...',
    '8': '.111./1...1/1...1/.111./1...1/1...1/.111.',
    '9': '.111./1...1/1...1/.1111/....1/...1./.11..',
    ' ': '.../.../.../.../.../.../...',
    '.': '../../../../../11/11',
    '-': '..../..../..../1111/..../..../....',
    '!': '1/1/1/1/1/./1',
    '?': '.111./1...1/....1/...1./..1../...../..1..',
    '♥': '.11.11./1111111/1111111/.11111./..111../...1.../.......'
  };
  var FONT = {};
  Object.keys(F).forEach(function (k) { FONT[k] = F[k].split('/'); });

  /* ---------- sanity: equal row lengths ---------- */
  MOTIFS.forEach(function (m) {
    var w = m.grid[0].length;
    m.grid.forEach(function (r, i) {
      if (r.length !== w) console.warn('kilim motif ' + m.id + ' row ' + i + ' length ' + r.length + ' != ' + w);
    });
    m.w = w; m.h = m.grid.length;
  });

  return { MOTIFS: MOTIFS, PALETTES: PALETTES, FONT: FONT };
})();
