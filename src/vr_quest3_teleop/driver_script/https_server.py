#!/usr/bin/env python3
import http.server
import ssl
import os
import sys
import time

class ReusableHTTPServer(http.server.HTTPServer):
    allow_reuse_address = True

def main():
    server_address = ('0.0.0.0', 8443)
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    
    httpd = None
    for attempt in range(5):
        try:
            httpd = ReusableHTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
            break
        except OSError as e:
            print(f"Port 8443 in use (attempt {attempt+1}/5). Retrying in 1s...")
            time.sleep(1)
            
    if not httpd:
        print("ERROR: Could not bind HTTPServer to port 8443 after 5 attempts.")
        sys.exit(1)
    
    cert_path = os.path.expanduser('~/dev_ws/certs/cert.pem')
    key_path = os.path.expanduser('~/dev_ws/certs/key.pem')
    
    if os.path.exists(cert_path) and os.path.exists(key_path):
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        print(f"Serving HTTPS on https://0.0.0.0:8443/controller_reader.html")
    else:
        print(f"WARNING: cert.pem or key.pem not found at {cert_path}. Serving plain HTTP on port 8443.")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    main()
