#!/usr/bin/env python3
"""
Perkfinity local dev server — port 8080
Handles extension-less URLs (e.g. /signup → /signup.html)
Usage: python3 serve.py
"""
import http.server
import os

PORT = 8080

class PerkfinityHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Strip query string for path resolution
        path = self.path.split('?')[0].split('#')[0]

        # If the path has no extension and doesn't end in '/', try adding .html
        _, ext = os.path.splitext(path)
        if not ext and path != '/':
            candidate = path.lstrip('/')
            if os.path.isfile(candidate + '.html'):
                self.path = path + '.html' + (self.path[len(path):] if len(self.path) > len(path) else '')
                print(f"  → Mapped {path} to {self.path}")

        return super().do_GET()

    def log_message(self, format, *args):
        # Colour-coded output: green for 2xx/3xx, red for 4xx/5xx
        code = args[1] if len(args) > 1 else '-'
        try:
            n = int(code)
            colour = '\033[92m' if n < 400 else '\033[91m'
        except ValueError:
            colour = ''
        reset = '\033[0m'
        print(f"{colour}{self.address_string()} [{self.log_date_time_string()}] {format % args}{reset}")

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with http.server.HTTPServer(('', PORT), PerkfinityHandler) as httpd:
        print(f"\n✅  Perkfinity local website running at http://localhost:{PORT}")
        print(f"   Serving: {os.getcwd()}")
        print(f"   Extension-less URLs (e.g. /signup) auto-mapped to .html\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nStopped.")
