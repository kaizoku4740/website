// Cloudflare Pages Function — /api/reviews/:taId/:reviewId
// DELETE → remove a specific review (requires X-Admin-Key header)

const ADMIN_PASSWORD = 'password';

export async function onRequestDelete({ params, env, request }) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (adminKey !== ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const key = `reviews-${params.taId}`;
    const data = await env.REVIEWS.get(key);
    let reviews = data ? JSON.parse(data) : [];
    reviews = reviews.filter(r => r.id !== params.reviewId);
    await env.REVIEWS.put(key, JSON.stringify(reviews));
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: 'Failed to delete review' }, { status: 500 });
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
