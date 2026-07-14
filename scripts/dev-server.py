#!/usr/bin/env python3
"""Serveur dev local Vircène — port 3000 (OAuth Supabase)."""
import http.server
import os
import socketserver

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", "3000"))


class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        local = super().translate_path(path)
        if not os.path.exists(local) and not os.path.splitext(local)[1]:
            html = local + ".html"
            if os.path.exists(html):
                return html
        return local

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), CleanUrlHandler) as httpd:
    print(f"Vircène dev — http://localhost:{PORT}")
    httpd.serve_forever()
