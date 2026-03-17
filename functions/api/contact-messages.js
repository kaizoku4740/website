// Cloudflare Pages Function — /api/contact-messages
// POST stores inbound contact submissions (via FormSubmit webhook).
// GET returns stored messages for admin panel (requires X-Admin-Key).

const ADMIN_PASSWORD = 'password';
const STORAGE_KEY = 'contact-messages';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key'
  };
}

async function parseBody(request) {
  const contentType = request.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      return await request.json();
    }
    // FormSubmit webhooks may send application/x-www-form-urlencoded
    const text = await request.text();
    // Try JSON first regardless of content-type
    try { return JSON.parse(text); } catch (_) {}
    // Fall back to URL-encoded parsing
    const params = new URLSearchParams(text);
    const obj = {};
    for (const [k, v] of params.entries()) obj[k] = v;
    return obj;
  } catch (_) {
    return {};
  }
}

function normalizeMessage(payload) {
  // FormSubmit webhook wraps fields under form_data; also handle flat payloads
  const fd = payload?.form_data || {};
  const name    = String(fd.name    || payload?.name    || '').trim();
  const email   = String(fd.email   || payload?.email   || '').trim();
  const message = String(fd.message || payload?.message || '').trim();

  return {
    id: Date.now().toString(),
    name:    name    || 'Unknown',
    email:   email   || 'Unknown',
    message: message || '(No message body)',
    ts: Date.now(),
    source: 'formsubmit'
  };
}

export async function onRequestGet({ request, env }) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (adminKey !== ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 403, headers: corsHeaders() });
  }

  try {
    const data = await env.REVIEWS.get(STORAGE_KEY);
    const messages = data ? JSON.parse(data) : [];
    return Response.json(messages, { headers: corsHeaders() });
  } catch (_) {
    return Response.json({ error: 'Failed to fetch contact messages' }, { status: 500, headers: corsHeaders() });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const payload = await parseBody(request);
    const message = normalizeMessage(payload);

    const existing = await env.REVIEWS.get(STORAGE_KEY);
    const messages = existing ? JSON.parse(existing) : [];
    messages.unshift(message);

    // Keep only the most recent 500 entries to prevent unbounded growth.
    const boundedMessages = messages.slice(0, 500);
    await env.REVIEWS.put(STORAGE_KEY, JSON.stringify(boundedMessages));

    return Response.json({ success: true }, { status: 201, headers: corsHeaders() });
  } catch (_) {
    return Response.json({ error: 'Failed to store contact message' }, { status: 500, headers: corsHeaders() });
  }
}

export async function onRequestDelete({ request, env }) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (adminKey !== ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 403, headers: corsHeaders() });
  }
  try {
    await env.REVIEWS.put(STORAGE_KEY, JSON.stringify([]));
    return Response.json({ success: true }, { headers: corsHeaders() });
  } catch (_) {
    return Response.json({ error: 'Failed to clear messages' }, { status: 500, headers: corsHeaders() });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
