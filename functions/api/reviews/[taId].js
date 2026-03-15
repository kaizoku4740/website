// Cloudflare Pages Function — /api/reviews/:taId
// GET  → fetch all reviews for a TA
// POST → add a new review

const ADMIN_PASSWORD = 'password';

export async function onRequestGet({ params, env }) {
  try {
    const key = `reviews-${params.taId}`;
    const data = await env.REVIEWS.get(key);
    const reviews = data ? JSON.parse(data) : [];
    return Response.json(reviews);
  } catch (e) {
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function onRequestPost({ params, env, request }) {
  try {
    const body = await request.json();
    if (!body.name || !body.rating || !body.text) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const key = `reviews-${params.taId}`;
    const data = await env.REVIEWS.get(key);
    let reviews = data ? JSON.parse(data) : [];

    const review = {
      id: Date.now().toString(),
      name: body.name,
      rating: Number(body.rating),
      text: body.text,
      ts: Date.now()
    };
    reviews.unshift(review);
    await env.REVIEWS.put(key, JSON.stringify(reviews));

    return Response.json(review, { status: 201 });
  } catch (e) {
    return Response.json({ error: 'Failed to add review' }, { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key'
    }
  });
}
