#!/usr/bin/env python3
import http.server
import ssl
import os
import sys

def main():
    server_address = ('localhost', 8443)
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    
    httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
    
    cert_file = os.path.expanduser('~/dev_ws/certs/cert.pem')
    key_file = os.path.expanduser('~/dev_ws/certs/key.pem')
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=cert_file, keyfile=key_file)
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        print("Serving HTTPS on port 8443 (https://localhost:8443/controller_reader.html)...")
    else:
        print("WARNING: Certificates not found in ~/dev_ws/certs/. Serving HTTP on port 8443...")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    main()
