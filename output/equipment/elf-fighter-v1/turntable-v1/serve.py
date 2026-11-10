from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

HERE=Path(__file__).resolve().parent
os.chdir(HERE.parent)
class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path!='/save-render':
            self.send_error(404);return
        length=int(self.headers.get('Content-Length','0'))
        if not 0<length<100_000_000:
            self.send_error(413);return
        (HERE/'equipped-elf-turntable.webm').write_bytes(self.rfile.read(length))
        self.send_response(200);self.end_headers();self.wfile.write(b'Saved')
ThreadingHTTPServer(('127.0.0.1',8766),Handler).serve_forever()
