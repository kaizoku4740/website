// ===== CLOUDFLARE WORKER FOR REVIEW MANAGEMENT =====
// This Worker handles:
// - GET /api/reviews/{taId} → fetch all reviews for a TA
// - POST /api/reviews/{taId} → add a new review
// - DELETE /api/reviews/{taId}/{reviewId} → delete a review (requires admin password in header)

const ADMIN_PASSWORD = 'password';

// ===== HELPER FUNCTIONS =====
// Parse URL to extract path segments
function parsePath(url) {
  const path = new URL(url).pathname;
  return path.split('/').filter(p => p);
}

// Generate a unique ID for reviews (timestamp-based)
function generateId() {
  return Date.now().toString();
}

// ===== MAIN HANDLER =====
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathParts = parsePath(url.toString());

    // ===== ROUTE: GET /api/reviews/{taId} =====
    // Fetch all reviews for a specific TA
    if (request.method === 'GET' && pathParts[0] === 'api' && pathParts[1] === 'reviews' && pathParts[2]) {
      const taId = pathParts[2];
      const key = `reviews-${taId}`;
      
      try {
        const data = await env.REVIEWS.get(key);
        const reviews = data ? JSON.parse(data) : [];
        return new Response(JSON.stringify(reviews), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to fetch reviews' }), { status: 500 });
      }
    }

    // ===== ROUTE: POST /api/reviews/{taId} =====
    // Add a new review for a TA
    if (request.method === 'POST' && pathParts[0] === 'api' && pathParts[1] === 'reviews' && pathParts[2]) {
      const taId = pathParts[2];
      const key = `reviews-${taId}`;
      
      try {
        const body = await request.json();
        // Validate review data
        if (!body.name || !body.rating || !body.text) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        // Fetch existing reviews
        const data = await env.REVIEWS.get(key);
        let reviews = data ? JSON.parse(data) : [];

        // Create new review object
        const review = {
          id: generateId(),
          name: body.name,
          rating: Number(body.rating),
          text: body.text,
          ts: Date.now()
        };

        // Add to front of array (newest first)
        reviews.unshift(review);

        // Save back to KV
        await env.REVIEWS.put(key, JSON.stringify(reviews));

        return new Response(JSON.stringify(review), {
          status: 201,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to add review' }), { status: 500 });
      }
    }

    // ===== ROUTE: DELETE /api/reviews/{taId}/{reviewId} =====
    // Delete a review (requires admin password in X-Admin-Key header)
    if (request.method === 'DELETE' && pathParts[0] === 'api' && pathParts[1] === 'reviews' && pathParts[2] && pathParts[3]) {
      const adminKey = request.headers.get('X-Admin-Key');
      
      // Verify admin password
      if (adminKey !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
      }

      const taId = pathParts[2];
      const reviewId = pathParts[3];
      const key = `reviews-${taId}`;

      try {
        const data = await env.REVIEWS.get(key);
        let reviews = data ? JSON.parse(data) : [];

        // Filter out the review to delete
        reviews = reviews.filter(r => r.id !== reviewId);

        // Save back to KV
        await env.REVIEWS.put(key, JSON.stringify(reviews));

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to delete review' }), { status: 500 });
      }
    }

    // ===== CORS PREFLIGHT =====
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key'
        }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
};
