#!/usr/bin/env python3
"""Serve the /kilim preview straight from the repo, no Jekyll needed.

  GET  /  or  /kilim/    the page (front matter stripped, cache-buster resolved)
  GET  /assets/...       real files from the repo — edit & refresh
"""
import http.server, socketserver, re, sys, os, time, mimetypes

REPO = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4100


def build_page():
    with open(os.path.join(REPO, "_pages/kilim.html")) as fh:
        page = fh.read()
    page = re.sub(r"^---.*?---\n", "", page, flags=re.S)
    page = re.sub(r"\{\{\s*site\.time[^}]*\}\}", str(int(time.time())), page)
    return page.encode()


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if path.rstrip("/") in ("", "/kilim"):
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
    print("serving kilim on http://localhost:%d" % PORT, flush=True)
    httpd.serve_forever()
