#!/usr/bin/env python3
"""Export every song in charts-db.js as one songbook PDF.

Songs are ordered alphabetically (Turkish collation); each song contributes
a lyrics page and an arrangement page, rendered by the real charts app.

Usage:  python3 serve-charts.py 4000   (in another terminal)
        python3 export-songbook.py [output.pdf]
"""
import os
import subprocess
import sys
import urllib.request

PORT = 4000
EDGE = "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
HARNESS_WIN = r"C:\temp\songbook-harness.html"
HARNESS = "/mnt/c/temp/songbook-harness.html"
OUT_WIN = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\kutay.sezginel\Downloads\charts-songbook.pdf"

page = urllib.request.urlopen(f"http://localhost:{PORT}/charts/").read().decode()
# absolute asset URLs so the harness works from file://, and no service worker
page = (page
        .replace('href="/assets/', f'href="http://localhost:{PORT}/assets/')
        .replace('src="/assets/', f'src="http://localhost:{PORT}/assets/')
        .replace("navigator.serviceWorker.register('/charts-sw.js').catch(() => {});", ""))

# style must live in <head>: the harness script replaces body.innerHTML
page = page.replace("</head>", """
<style>
  .psong__page { page-break-after: always; break-after: page; }
  .psong__title {
    margin: 0 0 14px;
    font-family: 'Marcellus', serif;
    font-weight: 400;
    font-size: 28px;
  }
  .psong__title span { font-size: 14px; margin-left: 12px; }
  .psong__title em { font-style: normal; font-size: 14px; margin-left: 12px; opacity: 0.7; }
  .psong__sub {
    margin: 0 0 16px;
    font-family: 'Marcellus', serif;
    font-weight: 400;
    font-size: 19px;
    letter-spacing: 0.06em;
  }
  /* same sizes on screen and print so measured bar widths hold */
  body { font-size: 13px; }
  .songbook .sheet { padding-top: 0; }
  .songbook .sheet--eqbars { font-size: 1.08rem; }
  .songbook .sheet--eqbars .barline { flex-wrap: nowrap; }
</style>
</head>""")

page = page.replace("</body>", """
<script>
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  await wait(500);
  const songs = [...window.CHARTS_DB].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  const out = [];
  for (const s of songs) {
    location.hash = '#/song/' + encodeURIComponent(s.id);
    await wait(300);
    document.querySelector('#viewToggle button[data-view=lyrics]').click();
    await wait(120);
    const lyr = document.getElementById('sheet').innerHTML;
    document.querySelector('#viewToggle button[data-view=parts]').click();
    await wait(120);
    const arr = document.getElementById('sheet').innerHTML;
    const head = `${s.title} <span>${s.artist || ''}</span><em>${s.key ? 'Key ' + s.key : ''}</em>`;
    out.push('<section class="psong">' +
      `<div class="psong__page"><h1 class="psong__title">${head}</h1><div class="sheet">${lyr}</div></div>` +
      `<div class="psong__page"><h2 class="psong__sub">${s.title} — arrangement</h2>` +
      `<div class="sheet sheet--eqbars" style="--barw:6em">${arr}</div></div>` +
      '</section>');
  }
  document.body.innerHTML = '<main class="songbook">' + out.join('') + '</main>';

  /* equal bar widths per part: measure the widest bar at its natural size,
     make every bar that wide, and shrink the part's font only if a full
     row of equal bars would overflow the printed line */
  const USABLE = 580; /* px of printable width available to a bar row */
  const parts = [...document.querySelectorAll('.songbook .sheet--eqbars .part')];
  for (const part of parts) part.style.setProperty('--barw', '0px');
  document.body.offsetHeight; /* flush layout before measuring */
  for (const part of parts) {
    let maxW = 0, maxN = 0;
    for (const row of part.querySelectorAll('.barline')) {
      const bars = row.querySelectorAll('.bar');
      maxN = Math.max(maxN, bars.length + row.querySelectorAll('.bargap').length * 0.3);
      for (const b of bars) maxW = Math.max(maxW, b.getBoundingClientRect().width);
    }
    if (!maxN || !maxW) continue;
    const scale = Math.min(1, USABLE / (maxN * maxW));
    if (scale < 1) part.style.fontSize = (scale * 100).toFixed(1) + '%';
    part.style.setProperty('--barw', (maxW * scale).toFixed(1) + 'px');
  }
  document.title = 'Charts songbook';
  document.body.dataset.ready = '1';
})();
</script></body>""")

os.makedirs("/mnt/c/temp", exist_ok=True)
open(HARNESS, "w", encoding="utf-8").write(page)

subprocess.run([
    EDGE, "--headless=new", "--disable-gpu",
    "--user-data-dir=C:\\temp\\edge-profile-songbook",
    "--virtual-time-budget=60000",
    "--no-pdf-header-footer",
    f"--print-to-pdf={OUT_WIN}",
    HARNESS_WIN,
], check=True, timeout=180)
print("songbook written to", OUT_WIN)
