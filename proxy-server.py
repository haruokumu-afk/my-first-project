#!/usr/bin/env python3
"""
ローカルCORSプロキシ & 静的ファイルサーバー

使い方:
  python3 proxy-server.py

ブラウザで http://localhost:8888 を開いてください。
- 静的ファイル（index.html, app.js 等）をローカル配信
- /v1/messages へのリクエストを https://api.anthropic.com へプロキシ（CORS回避）
"""

import http.server
import json
import os
import sys
import urllib.request
import urllib.error

PORT = 8888
ANTHROPIC_API = 'https://api.anthropic.com'


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path.startswith('/v1/'):
            self._proxy_to_anthropic()
        else:
            self.send_error(404, 'Not Found')

    def _proxy_to_anthropic(self):
        target_url = ANTHROPIC_API + self.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b''

        # ブラウザからのヘッダーを転送
        proxy_headers = {}
        for key in ('content-type', 'x-api-key', 'anthropic-version'):
            val = self.headers.get(key)
            if val:
                proxy_headers[key] = val

        req = urllib.request.Request(
            target_url,
            data=body,
            headers=proxy_headers,
            method='POST',
        )

        try:
            with urllib.request.urlopen(req) as resp:
                resp_body = resp.read()
                self.send_response(resp.status)
                self.send_header('Content-Type', resp.getheader('Content-Type', 'application/json'))
                self.end_headers()
                self.wfile.write(resp_body)
        except urllib.error.HTTPError as e:
            resp_body = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(resp_body)
        except Exception as e:
            error_msg = json.dumps({'error': {'message': str(e)}}).encode()
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(error_msg)

    def log_message(self, format, *args):
        method = args[0].split()[0] if args else ''
        path = args[0].split()[1] if args and len(args[0].split()) > 1 else ''
        status = args[1] if len(args) > 1 else ''
        if path.startswith('/v1/'):
            print(f'  [PROXY] {method} {path} -> {status}')
        elif method in ('GET',) and not path.startswith('/v1/'):
            print(f'  [FILE]  {path} -> {status}')


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    server = http.server.HTTPServer(('', PORT), ProxyHandler)
    print(f'=== タロット鑑定サポート ローカルサーバー ===')
    print(f'  http://localhost:{PORT}')
    print(f'  Ctrl+C で停止')
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nサーバーを停止しました。')
        server.server_close()


if __name__ == '__main__':
    main()
