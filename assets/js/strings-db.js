/* Strings — instrument & string-material database
   ------------------------------------------------
   Scale lengths in mm, gauges in mm, notes in scientific pitch (A4 = 440 Hz).
   Strings are listed course by course, low course → high course, each physical
   string separately (octave pairs spelled out). `c` groups strings into courses.

   Types: steel | wound-steel | wound-bronze | nylon | wound-nylon
   (wound-bronze = phosphor-bronze wound steel, used on acoustic guitars)
*/
window.STRINGS_DB = {

  /* Public Google Sheet that overrides / extends the built-in instruments.
     First tab must be `index` (tab | id | name_en | name_tr | tuning_en |
     tuning_tr | scale_cm); every other tab named in it holds one
     instrument's strings (string | note | type | gauge). */
  sheet: {
    id: "1zcMBCHwV91peMvZYRsWhvnm-d8nfWD4yjh4j6WavI_c",
    index: "index"
  },

  instruments: [

    {
      id: "baglama-kisa",
      svg: "baglama",
      name: { en: "Bağlama — short neck", tr: "Kısa Sap Bağlama" },
      sub:  { en: "bağlama düzeni · A–D–E", tr: "bağlama düzeni · La–Re–Mi" },
      scale: 740,
      unverified: true,
      strings: [
        { c: 1, note: "E3", type: "steel",       gauge: 0.30 },
        { c: 1, note: "E2", type: "wound-steel", gauge: 0.60 },
        { c: 2, note: "D3", type: "steel",       gauge: 0.25 },
        { c: 2, note: "D2", type: "wound-steel", gauge: 0.60 },
        { c: 3, note: "A3", type: "steel",       gauge: 0.20 },
        { c: 3, note: "A3", type: "steel",       gauge: 0.20 }
      ]
    },

    {
      id: "baglama-uzun",
      svg: "baglama-uzun",
      name: { en: "Bağlama — long neck", tr: "Uzun Sap Bağlama" },
      sub:  { en: "kara düzen · G–D–A", tr: "kara düzen · Sol–Re–La" },
      scale: 880,
      unverified: true,
      strings: [
        { c: 1, note: "G3", type: "steel",       gauge: 0.20 },
        { c: 1, note: "G2", type: "wound-steel", gauge: 0.50 },
        { c: 2, note: "D3", type: "steel",       gauge: 0.25 },
        { c: 2, note: "D2", type: "wound-steel", gauge: 0.50 },
        { c: 3, note: "A3", type: "steel",       gauge: 0.20 },
        { c: 3, note: "A3", type: "steel",       gauge: 0.20 }
      ]
    },

    {
      id: "caglama",
      svg: "caglama",
      name: { en: "Çağlama", tr: "Çağlama" },
      sub:  { en: "octave pairs · D–A–D", tr: "oktav çiftli · Re–La–Re" },
      scale: 700,
      strings: [
        { c: 1, note: "D3", type: "steel",       gauge: 0.30 },
        { c: 1, note: "D2", type: "wound-steel", gauge: 0.60 },
        { c: 2, note: "A3", type: "steel",       gauge: 0.20 },
        { c: 2, note: "A2", type: "wound-steel", gauge: 0.40 },
        { c: 3, note: "D4", type: "steel",       gauge: 0.18 },
        { c: 3, note: "D3", type: "wound-steel", gauge: 0.35 }
      ]
    },

    {
      id: "ud",
      svg: "ud",
      name: { en: "Ud (oud)", tr: "Ud" },
      sub:  { en: "Turkish tuning", tr: "Türk akordu" },
      scale: 585,
      strings: [
        { c: 1, note: "C#2", type: "wound-nylon", gauge: 0.90 },
        { c: 2, note: "F#2", type: "wound-nylon", gauge: 0.75 },
        { c: 2, note: "F#2", type: "wound-nylon", gauge: 0.75 },
        { c: 3, note: "B2",  type: "wound-nylon", gauge: 0.65 },
        { c: 3, note: "B2",  type: "wound-nylon", gauge: 0.65 },
        { c: 4, note: "E3",  type: "nylon",       gauge: 0.85 },
        { c: 4, note: "E3",  type: "nylon",       gauge: 0.85 },
        { c: 5, note: "A3",  type: "nylon",       gauge: 0.70 },
        { c: 5, note: "A3",  type: "nylon",       gauge: 0.70 },
        { c: 6, note: "D4",  type: "nylon",       gauge: 0.60 },
        { c: 6, note: "D4",  type: "nylon",       gauge: 0.60 }
      ]
    },

    {
      id: "lavta",
      svg: "lavta",
      name: { en: "İstanbul lavta", tr: "İstanbul Lavtası" },
      sub:  { en: "D–A–D–G", tr: "Re–La–Re–Sol" },
      scale: 575,
      strings: [
        { c: 1, note: "D2", type: "wound-nylon", gauge: 0.85 },
        { c: 1, note: "D2", type: "wound-nylon", gauge: 0.85 },
        { c: 2, note: "A2", type: "wound-nylon", gauge: 0.65 },
        { c: 2, note: "A2", type: "wound-nylon", gauge: 0.65 },
        { c: 3, note: "D3", type: "nylon",       gauge: 1.00 },
        { c: 3, note: "D3", type: "nylon",       gauge: 1.00 },
        { c: 4, note: "G3", type: "nylon",       gauge: 0.75 },
        { c: 4, note: "G3", type: "nylon",       gauge: 0.75 }
      ]
    },

    {
      id: "cumbus",
      svg: "cumbus",
      name: { en: "Cümbüş", tr: "Cümbüş" },
      sub:  { en: "E–F#–B–E–A–D", tr: "Mi–Fa#–Si–Mi–La–Re" },
      scale: 600,
      strings: [
        { c: 1, note: "E2",  type: "wound-steel", gauge: 0.86 },
        { c: 1, note: "E2",  type: "wound-steel", gauge: 0.86 },
        { c: 2, note: "F#2", type: "wound-steel", gauge: 0.75 },
        { c: 2, note: "F#2", type: "wound-steel", gauge: 0.75 },
        { c: 3, note: "B2",  type: "wound-steel", gauge: 0.60 },
        { c: 3, note: "B2",  type: "wound-steel", gauge: 0.60 },
        { c: 4, note: "E3",  type: "wound-steel", gauge: 0.44 },
        { c: 4, note: "E3",  type: "wound-steel", gauge: 0.44 },
        { c: 5, note: "A3",  type: "steel",       gauge: 0.30 },
        { c: 5, note: "A3",  type: "steel",       gauge: 0.30 },
        { c: 6, note: "D4",  type: "steel",       gauge: 0.22 },
        { c: 6, note: "D4",  type: "steel",       gauge: 0.22 }
      ]
    },

    {
      id: "guitar-classical",
      svg: "classical",
      name: { en: "Classical guitar", tr: "Klasik Gitar" },
      sub:  { en: "normal tension set", tr: "normal tansiyon takım" },
      scale: 650,
      strings: [
        { c: 1, note: "E2", type: "wound-nylon", gauge: 1.09 },
        { c: 2, note: "A2", type: "wound-nylon", gauge: 0.89 },
        { c: 3, note: "D3", type: "wound-nylon", gauge: 0.74 },
        { c: 4, note: "G3", type: "nylon",       gauge: 1.02 },
        { c: 5, note: "B3", type: "nylon",       gauge: 0.82 },
        { c: 6, note: "E4", type: "nylon",       gauge: 0.71 }
      ]
    },

    {
      id: "guitar-acoustic",
      svg: "acoustic",
      name: { en: "Acoustic guitar", tr: "Akustik Gitar" },
      sub:  { en: "12–53 phosphor bronze", tr: "12–53 fosfor bronz" },
      scale: 648,
      strings: [
        { c: 1, note: "E2", type: "wound-bronze", gauge: 1.35 },
        { c: 2, note: "A2", type: "wound-bronze", gauge: 1.07 },
        { c: 3, note: "D3", type: "wound-bronze", gauge: 0.81 },
        { c: 4, note: "G3", type: "wound-bronze", gauge: 0.61 },
        { c: 5, note: "B3", type: "steel",        gauge: 0.41 },
        { c: 6, note: "E4", type: "steel",        gauge: 0.30 }
      ]
    },

    {
      id: "guitar-electric",
      svg: "electric",
      name: { en: "Electric guitar", tr: "Elektro Gitar" },
      sub:  { en: "10–46 nickel wound", tr: "10–46 nikel sargı" },
      scale: 648,
      strings: [
        { c: 1, note: "E2", type: "wound-steel", gauge: 1.17 },
        { c: 2, note: "A2", type: "wound-steel", gauge: 0.91 },
        { c: 3, note: "D3", type: "wound-steel", gauge: 0.66 },
        { c: 4, note: "G3", type: "steel",       gauge: 0.43 },
        { c: 5, note: "B3", type: "steel",       gauge: 0.33 },
        { c: 6, note: "E4", type: "steel",       gauge: 0.25 }
      ]
    },

    {
      id: "bass",
      svg: "bass",
      name: { en: "Bass guitar", tr: "Bas Gitar" },
      sub:  { en: "34\" · 45–105 nickel", tr: "34\" · 45–105 nikel" },
      scale: 864,
      strings: [
        { c: 1, note: "E1", type: "wound-steel", gauge: 2.67 },
        { c: 2, note: "A1", type: "wound-steel", gauge: 2.16 },
        { c: 3, note: "D2", type: "wound-steel", gauge: 1.65 },
        { c: 4, note: "G2", type: "wound-steel", gauge: 1.14 }
      ]
    }
  ],

  /* ---- string materials ----------------------------------------------
     Plain strings: linear density from gauge and material density.
     Wound strings: unit-weight tables (D'Addario published data,
     [gauge_in, lb/in]) interpolated in log-log space; `rho` is the
     effective-density fallback used outside the table range.           */
  materials: {
    "steel":        { density: 7850, wound: false },
    "nylon":        { density: 1020, wound: false, tables: ["nylonPlain"] },
    "wound-steel":  { rho: 6600, wound: true, tables: ["nickelWound", "bassNickelWound"] },
    "wound-bronze": { rho: 7300, wound: true, tables: ["phosphorBronze"] },
    "wound-nylon":  { rho: 5800, wound: true, tables: ["silverWoundNylon"] }
  },

  /* ---- unit-weight tables --------------------------------------------
     [gauge_inches, unit_weight_lb_per_inch] from the official D'Addario
     tension chart (tension_chart_13934.pdf), cross-checked against
     jsantell/string-gauges, kyletaylorlange/StringTensionCalculator and
     the EverTune tension chart. plainSteel is kept for reference — plain
     steel is computed from density (matches the table to <1%).
     silverWoundNylon: the chart's duplicated .019 row and the .025 row
     (printed lighter than .024) are omitted to keep the curve monotonic. */
  unitWeights: {
    plainSteel: [
      [0.007, 0.00001085], [0.008, 0.00001418], [0.0085, 0.00001601], [0.009, 0.00001794],
      [0.0095, 0.00001999], [0.010, 0.00002215], [0.0105, 0.00002442], [0.011, 0.00002680],
      [0.0115, 0.00002930], [0.012, 0.00003190], [0.013, 0.00003744], [0.0135, 0.00004037],
      [0.014, 0.00004342], [0.015, 0.00004984], [0.016, 0.00005671], [0.017, 0.00006402],
      [0.018, 0.00007177], [0.019, 0.00007997], [0.020, 0.00008861], [0.022, 0.00010722],
      [0.024, 0.00012760], [0.026, 0.00014975]
    ],
    nickelWound: [
      [0.017, 0.00005524], [0.018, 0.00006215], [0.019, 0.00006947], [0.020, 0.00007495],
      [0.021, 0.00008293], [0.022, 0.00009184], [0.024, 0.00010857], [0.026, 0.00012671],
      [0.028, 0.00014666], [0.030, 0.00017236], [0.032, 0.00019347], [0.034, 0.00021590],
      [0.036, 0.00023964], [0.038, 0.00026471], [0.039, 0.00027932], [0.042, 0.00032279],
      [0.044, 0.00035182], [0.046, 0.00038216], [0.048, 0.00041382], [0.049, 0.00043014],
      [0.052, 0.00048109], [0.054, 0.00053838], [0.056, 0.00057598], [0.059, 0.00064191],
      [0.060, 0.00066542], [0.062, 0.00070697], [0.064, 0.00074984], [0.066, 0.00079889],
      [0.068, 0.00084614], [0.070, 0.00089304], [0.072, 0.00094124], [0.074, 0.00098869],
      [0.080, 0.00115011]
    ],
    phosphorBronze: [
      [0.020, 0.00008106], [0.021, 0.00008944], [0.022, 0.00009876], [0.023, 0.00010801],
      [0.024, 0.00011682], [0.025, 0.00012686], [0.026, 0.00013640], [0.027, 0.00014834],
      [0.029, 0.00017381], [0.030, 0.00018660], [0.032, 0.00021018], [0.034, 0.00023887],
      [0.035, 0.00025365], [0.036, 0.00026830], [0.039, 0.00031125], [0.042, 0.00036722],
      [0.045, 0.00041751], [0.047, 0.00045289], [0.049, 0.00049151], [0.052, 0.00055223],
      [0.053, 0.00056962], [0.056, 0.00063477], [0.059, 0.00070535], [0.060, 0.00073039],
      [0.062, 0.00077682], [0.064, 0.00082780], [0.066, 0.00087718], [0.070, 0.00096833]
    ],
    nylonPlain: [
      [0.0275, 0.00002024], [0.0280, 0.00002092], [0.0285, 0.00002161], [0.0290, 0.00002243],
      [0.0317, 0.00002729], [0.0322, 0.00002827], [0.0327, 0.00002924], [0.0333, 0.00003046],
      [0.0397, 0.00004525], [0.0403, 0.00004679], [0.0410, 0.00004795], [0.0416, 0.00004989]
    ],
    silverWoundNylon: [
      [0.020, 0.00005341], [0.022, 0.00006498], [0.024, 0.00007408],
      [0.026, 0.00009438], [0.028, 0.00010511], [0.029, 0.00011667],
      [0.030, 0.00012419], [0.031, 0.00012821], [0.033, 0.00017913], [0.034, 0.00019270],
      [0.035, 0.00020667], [0.036, 0.00022105], [0.040, 0.00028260], [0.041, 0.00028319],
      [0.042, 0.00030466], [0.043, 0.00033302], [0.045, 0.00036470], [0.048, 0.00041400],
      [0.050, 0.00045369], [0.052, 0.00049500], [0.054, 0.00053793], [0.056, 0.00059624]
    ],
    bassNickelWound: [
      [0.028, 0.00015433], [0.032, 0.00019000], [0.035, 0.00022362], [0.040, 0.00029322],
      [0.042, 0.00032252], [0.045, 0.00037240], [0.050, 0.00046463], [0.052, 0.00051322],
      [0.055, 0.00054816], [0.060, 0.00066540], [0.065, 0.00079569], [0.070, 0.00093218],
      [0.075, 0.00104973], [0.080, 0.00116023], [0.085, 0.00133702], [0.090, 0.00150277],
      [0.095, 0.00169349], [0.100, 0.00179687], [0.105, 0.00198395], [0.110, 0.00227440],
      [0.120, 0.00250280], [0.125, 0.00274810], [0.130, 0.00301941], [0.135, 0.00315944],
      [0.145, 0.00363204]
    ]
  }
};
