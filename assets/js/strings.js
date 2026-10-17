/* Strings — string tension calculator
   T = μ · (2·L·f)²   with μ from gauge + material (plain steel) or from
   published unit-weight tables (nylon & wound strings), log-log interpolated.
*/
(function () {
  "use strict";

  const DB = window.STRINGS_DB;
  const $ = (id) => document.getElementById(id);

  /* ================= i18n ================= */

  const I18N = {
    en: {
      brand: "Strings",
      tagline: "string tension calculator",
      scale: "scale length",
      reset: "reset",
      "col.note": "note",
      "col.type": "type",
      addString: "＋ add string",
      target: "target",
      fit: "set gauges",
      fitTitle: "pick the gauge (nearest .001 in) that brings every string closest to the target tension",
      unverified: "default set — tuning and gauges are a reasonable starting point, edit freely",
      "card.tensions": "Tensions",
      "card.chart": "String vs tension",
      "how.title": "How is the tension calculated?",
      "source.sheet": "instrument data from the shared Google Sheet",
      "source.builtin": "instrument data: built-in defaults (sheet not reachable)",
      "source.link": "open sheet ↗",
      total: "total",
      strings: "strings",
      new: "＋ new",
      newName: "New instrument",
      newSub: "only in this browser — add it to the sheet to keep it",
      discard: "discard",
      empty: "no strings yet — add one below",
      th: { str: "#", note: "note", freq: "Hz", type: "type", gauge: "gauge", tension: "tension" },
      types: {
        steel: "steel", "wound-steel": "wound steel", "wound-bronze": "bronze wound",
        nylon: "nylon", "wound-nylon": "wound nylon"
      },
      noteNames: { C: "C", D: "D", E: "E", F: "F", G: "G", A: "A", B: "B" },
      how: `
<p>Every string is an ideal vibrating string. Its fundamental frequency depends on
its speaking length <var>L</var> (the scale length), its tension <var>T</var> and its
mass per unit length <var>μ</var>. Solving Mersenne's law for tension gives:</p>
<span class="formula"><var>T</var> = <var>μ</var> · (2 · <var>L</var> · <var>f</var>)²</span>
<p><var>f</var> is the frequency of the note the string is tuned to
(A4 = 440&nbsp;Hz, equal temperament), <var>L</var> is the scale length in metres, and
<var>μ</var> is in kg/m. The result is in newtons; kgf and lb are simple conversions
(1&nbsp;kgf = 9.807&nbsp;N, 1&nbsp;lb = 4.448&nbsp;N).</p>
<p><b>Plain steel strings</b> are solid cylinders, so
<var>μ</var>&nbsp;=&nbsp;<var>ρ</var>&nbsp;·&nbsp;π&nbsp;·&nbsp;(<var>d</var>/2)²
from the gauge <var>d</var> and the density of music wire (7850&nbsp;kg/m³) —
this matches published string data to better than 1%.</p>
<p><b>Nylon and wound strings</b> use unit-weight data published by D'Addario for
each construction (clear nylon, silver-plated copper on nylon, nickel-plated
steel wound, phosphor bronze wound). Wound strings are a core wrapped in metal,
so their mass can't be computed from the gauge alone. Between published gauges
the unit weight is interpolated in log-log space; outside the published range an
effective density is used. Expect real strings to differ by a few percent —
core-to-wrap ratios vary between makers.</p>
<p>Rule of thumb: doubling a gauge quadruples the tension; one octave up at the
same gauge also quadruples it; longer scale raises it with the square of the length.</p>`
    },

    tr: {
      brand: "Strings",
      tagline: "tel gerginliği hesaplayıcı",
      scale: "tel boyu",
      reset: "sıfırla",
      "col.note": "nota",
      "col.type": "tür",
      addString: "＋ tel ekle",
      target: "hedef",
      fit: "kalınlıkları ayarla",
      fitTitle: "her tel için hedef gerginliğe en yakın kalınlığı seçer (en yakın .001 inç)",
      unverified: "varsayılan takım — akort ve kalınlıklar makul bir başlangıçtır, dilediğiniz gibi değiştirin",
      "card.tensions": "Gerginlikler",
      "card.chart": "Tel — gerginlik grafiği",
      "how.title": "Gerginlik nasıl hesaplanıyor?",
      "source.sheet": "enstrüman verileri paylaşılan Google Sheet'ten",
      "source.builtin": "enstrüman verileri: yerleşik varsayılanlar (sheet'e ulaşılamadı)",
      "source.link": "tabloyu aç ↗",
      total: "toplam",
      strings: "tel",
      new: "＋ yeni",
      newName: "Yeni enstrüman",
      newSub: "yalnız bu tarayıcıda — kalıcı olması için tabloya ekleyin",
      discard: "vazgeç",
      empty: "henüz tel yok — aşağıdan ekleyin",
      th: { str: "#", note: "nota", freq: "Hz", type: "tür", gauge: "kalınlık", tension: "gerginlik" },
      types: {
        steel: "çelik", "wound-steel": "sargılı çelik", "wound-bronze": "bronz sargı",
        nylon: "naylon", "wound-nylon": "sargılı naylon"
      },
      noteNames: { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" },
      how: `
<p>Her tel ideal bir titreşen tel olarak modellenir. Temel frekansı; titreşen boyuna
<var>L</var> (tel boyu), gerginliğine <var>T</var> ve birim uzunluk başına kütlesine
<var>μ</var> bağlıdır. Mersenne yasası gerginlik için çözülürse:</p>
<span class="formula"><var>T</var> = <var>μ</var> · (2 · <var>L</var> · <var>f</var>)²</span>
<p><var>f</var> telin akortlandığı notanın frekansı (La4 = 440&nbsp;Hz, eşit
tampereman), <var>L</var> metre cinsinden tel boyu, <var>μ</var> ise kg/m cinsindendir.
Sonuç newton çıkar; kgf ve lb basit çevrimlerdir
(1&nbsp;kgf = 9,807&nbsp;N, 1&nbsp;lb = 4,448&nbsp;N).</p>
<p><b>Düz çelik teller</b> içi dolu silindirlerdir:
<var>μ</var>&nbsp;=&nbsp;<var>ρ</var>&nbsp;·&nbsp;π&nbsp;·&nbsp;(<var>d</var>/2)² —
kalınlık <var>d</var> ve müzik teli çeliğinin yoğunluğundan (7850&nbsp;kg/m³)
hesaplanır; yayımlanmış tel verileriyle %1'den iyi örtüşür.</p>
<p><b>Naylon ve sargılı teller</b> için D'Addario'nun her yapı türü için yayımladığı
birim ağırlık verileri kullanılır (şeffaf naylon, naylon üzerine gümüş kaplama
bakır, nikel kaplama çelik sargı, fosfor bronz sargı). Sargılı teller bir çekirdek
üzerine metal sargıdan oluşur; kütleleri yalnız kalınlıktan hesaplanamaz.
Yayımlanan kalınlıklar arasında log-log uzayında ara değerleme yapılır; aralık
dışında etkin yoğunluk kullanılır. Gerçek teller yüzde birkaç farklı çıkabilir —
çekirdek/sargı oranı markadan markaya değişir.</p>
<p>Pratik kural: kalınlığı iki katına çıkarmak gerginliği dört katlar; aynı kalınlıkta
bir oktav tiz akort da dört katlar; tel boyu uzadıkça gerginlik boyun karesiyle artar.</p>`
    }
  };

  /* ================= notes & physics ================= */

  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function parseNote(n) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
    if (!m) return null;
    const s = SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    return { letter: m[1], acc: m[2] || "", oct: +m[3], midi: (+m[3] + 1) * 12 + s };
  }
  const freq = (note) => {
    const p = parseNote(note);
    return p ? 440 * Math.pow(2, (p.midi - 69) / 12) : NaN;
  };

  const LB_IN_TO_KG_M = 0.45359237 / 0.0254;

  /* linear mass density μ in kg/m for a string: published unit-weight data
     when the gauge is in a table's range, density formula otherwise */
  function linearDensity(type, gaugeMM) {
    const mat = DB.materials[type];
    if (!mat) return NaN;
    const gIn = gaugeMM / 25.4;
    for (const name of mat.tables || []) {
      const tbl = DB.unitWeights[name];
      if (!tbl || tbl.length < 2 || gIn < tbl[0][0] || gIn > tbl[tbl.length - 1][0]) continue;
      for (let i = 1; i < tbl.length; i++) {
        if (gIn <= tbl[i][0]) {
          const [g0, w0] = tbl[i - 1], [g1, w1] = tbl[i];
          const t = g1 === g0 ? 0 :
            (Math.log(gIn) - Math.log(g0)) / (Math.log(g1) - Math.log(g0));
          const uw = Math.exp(Math.log(w0) + t * (Math.log(w1) - Math.log(w0)));
          return uw * LB_IN_TO_KG_M;
        }
      }
    }
    const r = gaugeMM / 2000; /* radius in m */
    return (mat.wound ? mat.rho : mat.density) * Math.PI * r * r;
  }

  /* tension in newtons */
  function tensionN(s, scaleMM) {
    const f = freq(s.note);
    const mu = linearDensity(s.type, s.gauge);
    const L = scaleMM / 1000;
    return mu * Math.pow(2 * L * f, 2);
  }

  /* gauge (mm) that brings a string closest to a target tension, picked
     from whole thousandths of an inch (.004–.250) — tension isn't strictly
     monotonic across table seams, so search them all rather than bisect */
  function fitGauge(s, scaleMM, targetN) {
    let best = null, bestErr = Infinity;
    for (let k = 4; k <= 250; k++) {
      const mm = k * 0.0254;
      const err = Math.abs(Math.log(tensionN({ ...s, gauge: mm }, scaleMM) / targetN));
      if (err < bestErr) { bestErr = err; best = mm; }
    }
    return best === null ? s.gauge : +best.toFixed(4);
  }

  /* ================= state ================= */

  const LS_KEY = "strings:v1";

  const state = {
    lang: null,
    units: "si",           /* si | imp */
    instId: "baglama-kisa",
    targets: {},           /* instId -> target tension (N) for "set gauges" */
    overrides: {}          /* instId -> {scale, strings} for edited setups */
  };

  function detectLang() {
    const langs = navigator.languages || [navigator.language || "en"];
    return langs.some((l) => /^tr\b/i.test(l)) ? "tr" : "en";
  }

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY));
      if (s && typeof s === "object") Object.assign(state, s);
    } catch (e) {}
    const q = new URLSearchParams(location.search);
    if (q.get("inst")) state.instId = q.get("inst");
    if (/^(en|tr)$/.test(q.get("lang") || "")) state.lang = q.get("lang");
    if (/^(si|imp)$/.test(q.get("units") || "")) state.units = q.get("units");
    if (!state.lang) state.lang = detectLang();
    if (!instOf(state.instId)) state.instId = DB.instruments[0].id;
    delete state.overrides.custom;
  }

  const dbInst = (id) => DB.instruments.find((i) => i.id === id);

  /* a scratch instrument built from the "new" button lives only in overrides */
  const NEW_ID = "new";
  const instOf = (id) => dbInst(id) || (id === NEW_ID && state.overrides[NEW_ID]
    ? { id: NEW_ID, name: { en: I18N.en.newName, tr: I18N.tr.newName }, sub: { en: I18N.en.newSub, tr: I18N.tr.newSub } }
    : null);

  /* the currently effective setup {scale, strings[]} */
  function current() {
    const ov = state.overrides[state.instId];
    if (ov) return ov;
    const inst = dbInst(state.instId);
    return { scale: inst.scale, strings: inst.strings.map((s) => ({ ...s })) };
  }
  function isEdited() { return !!state.overrides[state.instId]; }

  /* make the current instrument editable (copy-on-write) and return the copy */
  function editable() {
    if (!state.overrides[state.instId]) {
      const cur = current();
      state.overrides[state.instId] = { scale: cur.scale, strings: cur.strings.map((s) => ({ ...s })) };
    }
    return state.overrides[state.instId];
  }

  /* ================= units ================= */

  const fmt = (v, d) => v.toLocaleString(state.lang === "tr" ? "tr-TR" : "en-US",
    { minimumFractionDigits: d, maximumFractionDigits: d });

  const U = {
    scaleOut: (mm) => state.units === "si" ? (mm / 10).toFixed(1) : (mm / 25.4).toFixed(2),
    scaleIn:  (v)  => state.units === "si" ? v * 10 : v * 25.4,
    scaleUnit: () => state.units === "si" ? "cm" : "in",
    gaugeOut: (mm) => state.units === "si" ? mm.toFixed(2) : (mm / 25.4).toFixed(3),
    gaugeIn:  (v)  => state.units === "si" ? v : v * 25.4,
    gaugeUnit: () => state.units === "si" ? "mm" : "in",
    gaugeStep: () => state.units === "si" ? 0.01 : 0.001,
    tensOut: (n) => state.units === "si" ? fmt(n, 1) : fmt(n / 4.4482216, 1),
    tensSub: (n) => fmt(n / 9.80665, 1) + " kg",
    tensUnit: () => state.units === "si" ? "N" : "lb",
    tensIn:  (v)  => state.units === "si" ? v : v * 4.4482216
  };

  const TYPE_COLOR = {
    steel: "var(--gold)", "wound-steel": "var(--red)", "wound-bronze": "var(--bronze)",
    nylon: "var(--ink)", "wound-nylon": "var(--teal)"
  };

  /* ================= rendering ================= */

  const T = () => I18N[state.lang];

  function applyI18n() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (T()[k]) el.textContent = T()[k];
    });
    $("howBody").innerHTML = T().how;
    $("gaugeHead").textContent = `${T().th.gauge} ${U.gaugeUnit()}`;
    $("tensHead").textContent = `${T().th.tension} ${U.tensUnit()}`;
    $("targetUnit").textContent = U.tensUnit();
    $("btnFit").title = T().fitTitle;
    document.querySelectorAll("#langSeg button").forEach((b) =>
      b.classList.toggle("seg--on", b.dataset.lang === state.lang));
    document.querySelectorAll("#unitSeg button").forEach((b) =>
      b.classList.toggle("seg--on", b.dataset.units === state.units));
  }

  function noteLabel(note) {
    const p = parseNote(note);
    if (!p) return note;
    return `${T().noteNames[p.letter]}${p.acc}${p.oct}`;
  }

  /* note select options C0..B5 */
  let NOTE_OPTS = [];
  function buildNoteOpts() {
    NOTE_OPTS = [];
    for (let oct = 0; oct <= 5; oct++)
      for (const l of ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])
        NOTE_OPTS.push(l + oct);
  }
  function noteOptHtml(sel) {
    return NOTE_OPTS.map((n) => {
      const label = state.lang === "tr" ? `${noteLabel(n)} · ${n}` : n;
      return `<option value="${n}" ${n === sel ? "selected" : ""}>${label}</option>`;
    }).join("");
  }

  /* instrument picker: the name is the button, a dark menu opens beneath */
  let pickOpen = false;

  function renderPick() {
    const inst = instOf(state.instId);
    $("pickName").textContent = inst.name[state.lang];
    const items = DB.instruments.map((i) => ({
      id: i.id, name: i.name[state.lang], sub: i.sub ? i.sub[state.lang] : ""
    }));
    if (state.overrides[NEW_ID]) items.push({ id: NEW_ID, name: T().newName, sub: T().newSub });
    $("pickMenu").innerHTML = items.map((it) => `
      <button class="pick__opt ${it.id === state.instId ? "pick__opt--on" : ""}" type="button"
              role="option" aria-selected="${it.id === state.instId}" data-inst="${it.id}">
        ${it.name}${state.overrides[it.id] ? " *" : ""}
        <small>${it.sub}</small>
      </button>`).join("");
    $("pickDrawer").classList.toggle("drawer--open", pickOpen);
    $("pick").classList.toggle("pick--open", pickOpen);
    $("pickBtn").setAttribute("aria-expanded", String(pickOpen));
  }

  function setPick(open) {
    pickOpen = open;
    renderPick();
  }

  /* compact string icon: thickness = gauge, colour = material,
     wound strings show their windings */
  function stringIcon(s) {
    const h = Math.min(10, 1.2 + s.gauge * 3.4);
    const c = TYPE_COLOR[s.type] || "var(--gold)";
    const wound = DB.materials[s.type] && DB.materials[s.type].wound;
    const coil = wound ? `<line x1="4" y1="6" x2="44" y2="6" stroke="var(--bg)" stroke-opacity=".75"
        stroke-width="${(h * 0.7).toFixed(1)}" stroke-dasharray="${(h * 0.28).toFixed(1)} ${(h * 0.62).toFixed(1)}"/>` : "";
    return `<svg viewBox="0 0 48 12" aria-hidden="true">
      <line x1="2" y1="6" x2="46" y2="6" stroke="${c}" stroke-width="${h.toFixed(1)}" stroke-linecap="round"/>${coil}
    </svg>`;
  }

  function courseLabels(strings) {
    /* "3a","3b" for multi-string courses, plain "3" otherwise */
    const count = {};
    strings.forEach((s) => { count[s.c] = (count[s.c] || 0) + 1; });
    const seen = {};
    return strings.map((s) => {
      if (count[s.c] === 1) return String(s.c);
      seen[s.c] = (seen[s.c] || 0) + 1;
      return s.c + String.fromCharCode(96 + seen[s.c]);
    });
  }

  function renderHead() {
    const inst = instOf(state.instId);
    const cur = current();
    $("instSub").textContent = inst.sub ? inst.sub[state.lang] : "";
    $("scaleIn").value = U.scaleOut(cur.scale);
    $("scaleUnit").textContent = U.scaleUnit();
    $("btnReset").hidden = !isEdited();
    $("btnReset").textContent = state.instId === NEW_ID ? T().discard : T().reset;
    $("instNote").hidden = !(inst && inst.unverified && !isEdited());
  }

  /* the editor: one row per physical string, drawn as a line whose
     thickness is the gauge and colour the material */
  function renderEditor(tens) {
    const cur = current();
    const labels = courseLabels(cur.strings);
    const typeOpts = (sel) => Object.keys(DB.materials).map((t) =>
      `<option value="${t}" ${t === sel ? "selected" : ""}>${T().types[t]}</option>`).join("");

    $("strList").innerHTML = cur.strings.length ? "" : `<p class="note">${T().empty}</p>`;
    $("strList").innerHTML += cur.strings.map((s, i) => {
      const first = i === 0 || cur.strings[i - 1].c !== s.c;
      const last = i === cur.strings.length - 1 || cur.strings[i + 1].c !== s.c;
      return `<div class="srow ${first ? "srow--first" : ""} ${last ? "srow--last" : ""}" data-i="${i}">
        <span class="srow__c">${labels[i]}</span>
        <span class="sline">${stringIcon(s)}</span>
        <div class="srow__f">
          <select data-f="note" aria-label="${T().th.note}">${noteOptHtml(s.note)}</select>
          <select data-f="type" aria-label="${T().th.type}">${typeOpts(s.type)}</select>
          <input data-f="gauge" type="number" min="${U.gaugeStep()}" step="${U.gaugeStep()}"
                 value="${U.gaugeOut(s.gauge)}" aria-label="${T().th.gauge}">
          <span class="srow__t">${U.tensOut(tens[i])}<small>${U.tensSub(tens[i])}</small></span>
        </div>
        <button class="srow__del" title="remove" aria-label="remove">×</button>
      </div>`;
    }).join("");

    const total = tens.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
    /* target defaults to the current mean until the user sets one */
    const finite = tens.filter(isFinite);
    const targetN = state.targets[state.instId] ||
      (finite.length ? finite.reduce((a, b) => a + b, 0) / finite.length : 0);
    $("targetIn").value = targetN ? (state.units === "si" ? targetN : targetN / 4.4482216).toFixed(1) : "";
    $("btnFit").disabled = !cur.strings.length;
    $("total").innerHTML =
      `${cur.strings.length} ${T().strings} · ${T().total}<b>${U.tensOut(total)} ${U.tensUnit()}</b>${U.tensSub(total)}`;
  }

  function renderResults(tens) {
    const cur = current();
    const labels = courseLabels(cur.strings);
    const total = tens.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
    const th = T().th;

    /* ---- table ---- */
    $("tensTable").innerHTML = `
      <thead><tr>
        <th>${th.str}</th><th>${th.note}</th><th>${th.freq}</th>
        <th>${th.type}</th><th>${th.gauge}</th><th>${th.tension} (${U.tensUnit()})</th>
      </tr></thead>
      <tbody>
        ${cur.strings.map((s, i) => `
          <tr>
            <td>${labels[i]}</td>
            <td class="t-note">${noteLabel(s.note)}${state.lang === "tr" ? ` <span class="sub">${s.note}</span>` : ""}</td>
            <td>${fmt(freq(s.note), 1)}</td>
            <td>${T().types[s.type]}</td>
            <td>${U.gaugeOut(s.gauge)}</td>
            <td class="t-val">${U.tensOut(tens[i])} <span class="sub">· ${U.tensSub(tens[i])}</span></td>
          </tr>`).join("")}
        <tr class="t-total">
          <td colspan="5">${T().total}</td>
          <td class="t-val">${U.tensOut(total)} <span class="sub">· ${U.tensSub(total)}</span></td>
        </tr>
      </tbody>`;

    /* ---- chart: line plot, string index on x, tension on y ---- */
    const W = 420, H = 230, padL = 42, padR = 14, padT = 18, padB = 34;
    const dispT = tens.map((t) => state.units === "si" ? t : t / 4.4482216);
    const maxT = Math.max(...dispT.filter(isFinite), 1);
    const step = niceStep(maxT);
    const ymax = Math.ceil(maxT / step) * step;
    const n = cur.strings.length;
    const x = (i) => padL + ((i + 0.5) / n) * (W - padL - padR);
    const y = (v) => H - padB - (v / ymax) * (H - padT - padB);

    let grid = "";
    for (let v = 0; v <= ymax + 1e-9; v += step) {
      grid += `<line x1="${padL}" y1="${y(v)}" x2="${W - padR}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/>
        <text x="${padL - 6}" y="${y(v) + 3}" fill="var(--dim)" font-size="9" text-anchor="end">${fmtNum(v)}</text>`;
    }
    const pts = cur.strings.map((s, i) => `${x(i)},${y(dispT[i])}`).join(" ");
    const line = n > 1 ?
      `<polyline points="${pts}" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-opacity="0.55"/>` : "";
    const marks = cur.strings.map((s, i) => `
      <circle cx="${x(i)}" cy="${y(dispT[i])}" r="4" fill="${TYPE_COLOR[s.type] || "var(--gold)"}"/>
      <text x="${x(i)}" y="${y(dispT[i]) - 8}" fill="var(--ink)" font-size="9" text-anchor="middle">${fmtNum(dispT[i])}</text>
      <text x="${x(i)}" y="${H - padB + 12}" fill="var(--dim)" font-size="9" text-anchor="middle">${labels[i]}</text>
      <text x="${x(i)}" y="${H - padB + 23}" fill="var(--dim)" font-size="8" text-anchor="middle">${noteLabel(s.note)}</text>`
    ).join("");

    const typesUsed = [...new Set(cur.strings.map((s) => s.type))];
    const legend = `<div class="legend">${typesUsed.map((t) =>
      `<span><i style="background:${TYPE_COLOR[t]}"></i>${T().types[t]}</span>`).join("")}</div>`;

    $("chart").innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img"
        font-family="IBM Plex Mono, monospace">${grid}${line}${marks}
        <text x="${padL - 6}" y="${padT - 8}" fill="var(--dim)" font-size="9" text-anchor="end">${U.tensUnit()}</text>
      </svg>${legend}`;
  }

  function fmtNum(v) { return v >= 100 ? Math.round(v) : Math.round(v * 10) / 10; }
  function niceStep(max) {
    const raw = max / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * mag) return m * mag;
    return 10 * mag;
  }

  function renderAll() {
    const cur = current();
    const tens = cur.strings.map((s) => tensionN(s, cur.scale));
    applyI18n();
    renderPick();
    renderHead();
    renderEditor(tens);
    renderResults(tens);
    if (typeof renderSource === "function") renderSource();
    save();
  }

  /* ================= events ================= */

  function bind() {
    $("pickBtn").addEventListener("click", () => setPick(!pickOpen));

    $("pickMenu").addEventListener("click", (e) => {
      const opt = e.target.closest("[data-inst]");
      if (!opt) return;
      const id = opt.dataset.inst;
      state.instId = id;
      pickOpen = false;
      renderAll();
      $("pickBtn").focus();
    });

    /* Escape closes; arrow keys walk the options */
    document.addEventListener("keydown", (e) => {
      if (!pickOpen) return;
      if (e.key === "Escape") { setPick(false); $("pickBtn").focus(); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const opts = [...$("pickMenu").querySelectorAll(".pick__opt")];
        const i = opts.indexOf(document.activeElement);
        const j = (i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
        opts[j].focus();
        e.preventDefault();
      }
    });

    $("scaleIn").addEventListener("change", () => {
      const v = parseFloat($("scaleIn").value);
      if (v > 0) { editable().scale = U.scaleIn(v); renderAll(); }
    });

    $("btnReset").addEventListener("click", () => {
      delete state.overrides[state.instId];
      if (state.instId === NEW_ID) state.instId = DB.instruments[0].id;
      renderAll();
    });

    $("btnNew").addEventListener("click", () => {
      state.overrides[NEW_ID] = { scale: current().scale, strings: [] };
      state.instId = NEW_ID;
      pickOpen = false;
      renderAll();
    });

    $("strList").addEventListener("change", (e) => {
      const row = e.target.closest(".srow");
      if (!row) return;
      const i = +row.dataset.i, f = e.target.dataset.f;
      const setup = editable(), s = setup.strings[i];
      if (f === "note") s.note = e.target.value;
      else if (f === "type") s.type = e.target.value;
      else if (f === "gauge") {
        const v = parseFloat(e.target.value);
        if (v > 0) s.gauge = U.gaugeIn(v);
      }
      renderAll();
    });

    $("strList").addEventListener("click", (e) => {
      const del = e.target.closest(".srow__del");
      if (!del) return;
      const i = +del.closest(".srow").dataset.i;
      const setup = editable();
      setup.strings.splice(i, 1);
      renderAll();
    });

    $("btnAddStr").addEventListener("click", () => {
      const setup = editable();
      const last = setup.strings[setup.strings.length - 1] ||
        { c: 0, note: "E2", type: "steel", gauge: 0.25 };
      setup.strings.push({ ...last, c: last.c + 1 });
      renderAll();
    });

    const readTarget = () => {
      const v = parseFloat($("targetIn").value);
      if (v > 0) state.targets[state.instId] = U.tensIn(v);
      return state.targets[state.instId];
    };
    $("targetIn").addEventListener("change", () => { readTarget(); save(); });
    $("targetIn").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btnFit").click(); });

    $("btnFit").addEventListener("click", () => {
      const targetN = readTarget();
      if (!(targetN > 0)) return;
      const setup = editable();
      setup.strings.forEach((s) => {
        if (isFinite(freq(s.note))) s.gauge = fitGauge(s, setup.scale, targetN);
      });
      renderAll();
    });

    $("langSeg").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-lang]");
      if (b) { state.lang = b.dataset.lang; renderAll(); }
    });
    $("unitSeg").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-units]");
      if (b) { state.units = b.dataset.units; renderAll(); }
    });
  }

  /* ================= Google Sheet source =================
     The sheet overrides built-in instruments with the same id and adds new
     ones. Cached in localStorage so the page renders instantly and refreshes
     in the background. */

  const SHEET_KEY = "strings:sheet";
  const BUILTIN = DB.instruments.slice();
  let sourceState = "builtin";

  const sheetUrl = (tab) =>
    `https://docs.google.com/spreadsheets/d/${DB.sheet.id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const sheetLink = () => `https://docs.google.com/spreadsheets/d/${DB.sheet.id}/edit`;

  function parseCSV(text) {
    const rows = [], row = []; let cell = "", q = false;
    const push = () => { row.push(cell); cell = ""; };
    const endRow = () => { push(); if (row.some((c) => c !== "")) rows.push(row.slice()); row.length = 0; };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") push();
      else if (ch === "\n") endRow();
      else if (ch !== "\r") cell += ch;
    }
    if (cell !== "" || row.length) endRow();
    return rows;
  }

  const norm = (s) => String(s || "").toLowerCase().trim();
  const key = (s) => norm(s).replace(/[^a-z0-9]/g, "");
  const slug = (s) => norm(s)
    .replace(/[çÇ]/g, "c").replace(/[ğĞ]/g, "g").replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s").replace(/[öÖ]/g, "o").replace(/[üÜ]/g, "u")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* "wound steel", "sargılı çelik", "silver wound steel core", "naylon" … */
  function normType(s) {
    const t = norm(s);
    const wound = /wound|sarg|silver|nickel|nikel|copper|bakır/.test(t);
    if (/bronz/.test(t)) return "wound-bronze";
    if (/nylon|naylon|nylgut|fluoro|carbon|gut/.test(t)) return wound ? "wound-nylon" : "nylon";
    return wound ? "wound-steel" : "steel";
  }

  /* "D3", "Re3", "F#2", "Fa#2", "Bb2" */
  const TR_NOTES = { do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", si: "B" };
  function normNote(s) {
    const m = /^([A-Za-z]+)\s*([#♯b♭]?)\s*(-?\d)$/.exec(String(s || "").trim());
    if (!m) return null;
    let letter = m[1].toUpperCase();
    if (letter.length > 1) letter = TR_NOTES[m[1].toLowerCase()] || null;
    if (!letter || !(letter in SEMI)) return null;
    const acc = m[2] === "♯" ? "#" : m[2] === "♭" ? "b" : m[2];
    return `${letter}${acc}${m[3]}`;
  }

  /* one instrument tab → strings[] */
  function parseStrings(rows) {
    if (!rows.length) return [];
    const head = rows[0].map(key);
    const col = (names) => head.findIndex((h) => names.some((n) => h.startsWith(n)));
    const iStr = col(["string", "tel", "course", "sira", "no"]);
    const iNote = col(["note", "nota"]);
    const iType = col(["type", "tur", "material", "malzeme"]);
    const iGauge = col(["gauge", "kalinlik", "diameter", "cap"]);
    if (iNote < 0 || iGauge < 0) return [];

    const gaugeHead = norm(rows[0][iGauge]);
    const body = rows.slice(1).filter((r) => normNote(r[iNote]));
    const gauges = body.map((r) => parseFloat(String(r[iGauge]).replace(",", ".")));
    let inches = /\bin\b|inch|"/.test(gaugeHead) ? true :
                 /mm/.test(gaugeHead) ? false :
                 Math.max(...gauges) < 0.2; /* no string is thinner than 0.2 mm */

    let auto = 0;
    return body.map((r, i) => {
      const lab = iStr >= 0 ? String(r[iStr]).trim() : "";
      const cm = /^(\d+)/.exec(lab);
      const c = cm ? +cm[1] : ++auto;
      return {
        c,
        note: normNote(r[iNote]),
        type: iType >= 0 ? normType(r[iType]) : "steel",
        gauge: +(inches ? gauges[i] * 25.4 : gauges[i]).toFixed(3)
      };
    }).filter((s) => s.gauge > 0);
  }

  /* index tab → [{tab,id,name,sub,scale}] */
  function parseIndex(rows) {
    if (!rows.length) return [];
    const head = rows[0].map(key);
    const col = (...names) => head.findIndex((h) => names.includes(h));
    const iTab = col("tab", "sheet", "sekme");
    const iId = col("id");
    const iNameEn = col("nameen", "name", "isim", "ad");
    const iNameTr = col("nametr", "isimtr", "adtr");
    const iSubEn = col("tuningen", "tuning", "sub", "akort");
    const iSubTr = col("tuningtr", "subtr", "akorttr");
    const iScale = head.findIndex((h) => h.startsWith("scale") || h.startsWith("telboyu"));
    if (iTab < 0 || iScale < 0) return [];
    const scaleHead = head[iScale];
    const toMM = (v) => {
      const n = parseFloat(String(v).replace(",", "."));
      if (!(n > 0)) return NaN;
      if (/mm/.test(scaleHead)) return n;
      if (/in/.test(scaleHead)) return n * 25.4;
      return n * 10; /* cm by default */
    };
    return rows.slice(1).map((r) => {
      const tab = String(r[iTab] || "").trim();
      const nameEn = (iNameEn >= 0 && r[iNameEn]) || tab;
      return {
        tab,
        id: (iId >= 0 && r[iId] && slug(r[iId])) || slug(tab),
        name: { en: nameEn, tr: (iNameTr >= 0 && r[iNameTr]) || nameEn },
        sub: { en: (iSubEn >= 0 && r[iSubEn]) || "", tr: (iSubTr >= 0 && r[iSubTr]) || (iSubEn >= 0 && r[iSubEn]) || "" },
        scale: toMM(r[iScale])
      };
    }).filter((m) => m.tab && m.scale > 0);
  }

  function applySheet(list) {
    if (!list || !list.length) return;
    const byId = new Map(list.map((i) => [i.id, i]));
    const merged = BUILTIN.map((b) => byId.get(b.id) || b);
    list.forEach((i) => { if (!BUILTIN.some((b) => b.id === i.id)) merged.push(i); });
    DB.instruments = merged;
  }

  async function fetchSheet() {
    const idxRows = parseCSV(await (await fetch(sheetUrl(DB.sheet.index), { cache: "no-store" })).text());
    const meta = parseIndex(idxRows);
    if (!meta.length) throw new Error("index tab missing or empty");
    const idxText = JSON.stringify(idxRows);
    const tabs = await Promise.all(meta.map(async (m) => {
      const rows = parseCSV(await (await fetch(sheetUrl(m.tab), { cache: "no-store" })).text());
      /* a missing tab name makes Google return the first tab (the index) */
      if (JSON.stringify(rows) === idxText) { console.warn(`strings: tab "${m.tab}" not found`); return null; }
      const strings = parseStrings(rows);
      if (!strings.length) { console.warn(`strings: tab "${m.tab}" has no readable strings`); return null; }
      return { id: m.id, name: m.name, sub: m.sub, scale: m.scale, strings, fromSheet: true };
    }));
    return tabs.filter(Boolean);
  }

  function renderSource() {
    const t = T();
    $("source").innerHTML = sourceState === "sheet"
      ? `${t["source.sheet"]} · <a href="${sheetLink()}" target="_blank" rel="noopener">${t["source.link"]}</a>`
      : `${t["source.builtin"]} · <a href="${sheetLink()}" target="_blank" rel="noopener">${t["source.link"]}</a>`;
  }

  async function loadSheet() {
    if (!DB.sheet || !DB.sheet.id) return;
    try {
      const cached = JSON.parse(localStorage.getItem(SHEET_KEY));
      if (cached && cached.list) { applySheet(cached.list); sourceState = "sheet"; renderAll(); }
    } catch (e) {}
    try {
      const list = await fetchSheet();
      applySheet(list);
      sourceState = "sheet";
      try { localStorage.setItem(SHEET_KEY, JSON.stringify({ at: Date.now(), list })); } catch (e) {}
    } catch (err) {
      console.warn("strings: sheet unavailable, using built-in data", err);
      if (sourceState !== "sheet") sourceState = "builtin";
    }
    renderAll();
  }

  /* ================= boot ================= */

  load();
  buildNoteOpts();
  bind();
  renderAll();
  loadSheet();
})();
