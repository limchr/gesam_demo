# server.py

import http.server
import socketserver

PORT = 8080

handler = lambda *args, **kwargs: http.server.SimpleHTTPRequestHandler(*args, directory=__file__[:__file__.rfind('/')], **kwargs)

with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"Serving on port {PORT}")
    httpd.serve_forever()
