# server.py

import http.server
import socketserver

PORT = 8080


pd = __file__.rfind('/')
if pd == -1:
    pd = __file__.rfind('\\')
dir = __file__[:pd]


handler = lambda *args, **kwargs: http.server.SimpleHTTPRequestHandler(*args, directory=dir, **kwargs)

with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"Serving on port {PORT}, {dir}")
    httpd.serve_forever()
