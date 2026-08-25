#!/usr/bin/env python3
import http.server
import ssl
import os
import sys

def main():
    server_address = ('0.0.0.0', 8443)
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    
    httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
    
    print("Serving HTTP on port 8443 (http://127.0.0.1:8443/controller_reader.html)...")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    main()
