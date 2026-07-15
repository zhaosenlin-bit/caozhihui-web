"""Static server that adds Cache-Control: no-store so the browser always
re-fetches. Run with: python serve_nocache.py [port]"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    import os
    os.chdir(r"D:\曹智晖\space-travel\public")
    print(f"serving with no-cache on http://127.0.0.1:{port}/")
    HTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()