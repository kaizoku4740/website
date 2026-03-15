#!/usr/bin/env python3
"""
Simple mock API server for testing reviews functionality locally.
Simulates the Cloudflare Worker API behavior.
Run this alongside the HTTP server to test the full system.
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from datetime import datetime
import uuid

# In-memory review storage (simulates Cloudflare KV)
reviews_store = {
    'teacher': [
        {
            'id': '1709897400000',
            'name': 'John Smith',
            'rating': 5,
            'text': 'Ms. Garg is an amazing teacher! Very patient and explains concepts clearly.',
            'ts': 1709897400000
        },
        {
            'id': '1709811000000',
            'name': 'Sarah Lee',
            'rating': 5,
            'text': 'Best math tutor I\'ve had. Highly recommend!',
            'ts': 1709811000000
        }
    ],
    'ta1': [
        {
            'id': '1709725600000',
            'name': 'Mike Chen',
            'rating': 4,
            'text': 'Great tutor, very helpful with homework.',
            'ts': 1709725600000
        }
    ],
    'ta2': [],
    'ta3': [],
    'ta4': [],
    'ta5': []
}

ADMIN_PASSWORD = 'password'

class APIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests to fetch reviews"""
        # Parse URL path
        path_parts = self.path.strip('/').split('/')
        
        # GET /api/reviews/{taId}
        if len(path_parts) >= 3 and path_parts[0] == 'api' and path_parts[1] == 'reviews':
            ta_id = path_parts[2]
            
            if ta_id in reviews_store:
                reviews = reviews_store[ta_id]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(reviews).encode())
            else:
                self.send_response(404)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        """Handle POST requests to add reviews"""
        path_parts = self.path.strip('/').split('/')
        
        # POST /api/reviews/{taId}
        if len(path_parts) >= 3 and path_parts[0] == 'api' and path_parts[1] == 'reviews':
            ta_id = path_parts[2]
            
            if ta_id not in reviews_store:
                self.send_response(400)
                self.end_headers()
                return
            
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode()
            
            try:
                data = json.loads(body)
                # Validate review data
                if not data.get('name') or not data.get('text') or not data.get('rating'):
                    self.send_response(400)
                    self.end_headers()
                    return
                
                # Create review with ID and timestamp
                review = {
                    'id': str(int(datetime.now().timestamp() * 1000)),
                    'name': data['name'],
                    'rating': int(data['rating']),
                    'text': data['text'],
                    'ts': int(datetime.now().timestamp() * 1000)
                }
                
                # Add to store
                reviews_store[ta_id].insert(0, review)
                
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(review).encode())
            except Exception as e:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_DELETE(self):
        """Handle DELETE requests to remove reviews (admin only)"""
        path_parts = self.path.strip('/').split('/')
        
        # DELETE /api/reviews/{taId}/{reviewId}
        if len(path_parts) >= 4 and path_parts[0] == 'api' and path_parts[1] == 'reviews':
            ta_id = path_parts[2]
            review_id = path_parts[3]
            
            # Check admin password
            admin_key = self.headers.get('X-Admin-Key', '')
            if admin_key != ADMIN_PASSWORD:
                self.send_response(403)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode())
                return
            
            if ta_id in reviews_store:
                # Find and remove review
                reviews = reviews_store[ta_id]
                original_len = len(reviews)
                reviews_store[ta_id] = [r for r in reviews if r['id'] != review_id]
                
                if len(reviews_store[ta_id]) < original_len:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode())
                else:
                    self.send_response(404)
                    self.end_headers()
            else:
                self.send_response(404)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key')
        self.end_headers()

    def log_message(self, format, *args):
        """Suppress logging"""
        pass

if __name__ == '__main__':
    server_address = ('', 9999)
    httpd = HTTPServer(server_address, APIHandler)
    print('🚀 Mock API server running on http://localhost:9999')
    print('   Simulates Cloudflare Worker endpoints')
    print('   Admin password: password')
    print('\nTip: Update review pages to use http://localhost:9999 instead of 8888')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n✅ Mock API server stopped')
