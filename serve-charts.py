#!/usr/bin/env python3
"""Serve the /charts preview straight from the repo, no Jekyll needed.

  GET  /  or  /charts/   the page (front matter stripped, cache-buster resolved)
  GET  /assets/...       real files from the repo — edit & refresh
  POST /api/save         rewrite assets/js/charts-db.js from the browser's edits
"""
import http.server, socketserver, re, sys, os, time, json, mimetypes

REPO = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(REPO, "assets/js/charts-db.js")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4000

DB_HEADER = '''/* Charts — internal song database.
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
'''

FIELD_ORDER = ["id", "title", "artist", "key", "capo", "source", "video", "format", "body", "bars", "arrangement"]


def js_value(v):
    if isinstance(v, str) and "\n" in v:
        tpl = v.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
        if not tpl.startswith("\n"):
            tpl = "\n" + tpl
        if not tpl.endswith("\n"):
            tpl += "\n"
        return "`" + tpl + "`"
    return json.dumps(v, ensure_ascii=False)


def write_db(songs):
    entries = []
    for s in songs:
        keys = [k for k in FIELD_ORDER if k in s and s[k] not in (None, "", 0) or k == "id"]
        keys += sorted(k for k in s if k not in FIELD_ORDER)
        lines = ["    %s: %s" % (k, js_value(s[k])) for k in keys if k in s]
        entries.append("  {\n" + ",\n".join(lines) + "\n  }")
    out = DB_HEADER + "\nwindow.CHARTS_DB = [\n" + ",\n".join(entries) + "\n];\n"
    tmp = DB + ".tmp"
    with open(tmp, "w") as fh:
        fh.write(out)
    os.replace(tmp, DB)


def build_page():
    with open(os.path.join(REPO, "_pages/charts.html")) as fh:
        page = fh.read()
    page = re.sub(r"^---.*?---\n", "", page, flags=re.S)
    page = re.sub(r"\{\{\s*site\.time[^}]*\}\}", str(int(time.time())), page)
    return page.encode()


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if path.rstrip("/") in ("", "/charts"):
            self.reply(200, build_page(), "text/html; charset=utf-8")
            return
        if path.startswith("/assets/"):
            fp = os.path.realpath(os.path.join(REPO, path.lstrip("/")))
            if fp.startswith(REPO) and os.path.isfile(fp):
                ctype = mimetypes.guess_type(fp)[0] or "application/octet-stream"
                with open(fp, "rb") as fh:
                    self.reply(200, fh.read(), ctype)
                return
        self.send_error(404)

    def do_POST(self):
        if self.path.split("?")[0] != "/api/save":
            self.send_error(404)
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(n))
            songs = data["songs"]
            assert isinstance(songs, list) and all("id" in s for s in songs)
            write_db(songs)
            self.reply(200, b'{"ok":true}', "application/json")
        except Exception as e:
            self.reply(400, json.dumps({"ok": False, "error": str(e)}).encode(),
                       "application/json")

    def reply(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *a):
        sys.stderr.write("  %s\n" % (fmt % a))


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print("serving charts on http://localhost:%d" % PORT, flush=True)
    httpd.serve_forever()
