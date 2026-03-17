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
  // Read raw text first so we can store it for debugging and try multiple formats
  let rawText = '';
  try { rawText = await request.text(); } catch (_) {}

  let parsed = {};
  // Try JSON parse
  try { parsed = JSON.parse(rawText); } catch (_) {
    // Try URL-encoded
    try {
      const params = new URLSearchParams(rawText);
      for (const [k, v] of params.entries()) parsed[k] = v;
    } catch (_) {}
  }
  return { parsed, rawText };
}

function normalizeMessage(parsed, rawText) {
  // FormSubmit sends form_data as a JSON *string* — parse it first
  let fd = {};
  try {
    fd = typeof parsed?.form_data === 'string'
      ? JSON.parse(parsed.form_data)
      : (parsed?.form_data || {});
  } catch (_) {}
  const name    = String(fd.name    || parsed?.name    || '').trim();
  const email   = String(fd.email   || parsed?.email   || '').trim();
  const message = String(fd.message || parsed?.message || '').trim();

  return {
    id: Date.now().toString(),
    name:    name    || '(none)',
    email:   email   || '(none)',
    message: message || '(none)',
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
    const { parsed, rawText } = await parseBody(request);
    const message = normalizeMessage(parsed, rawText);

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
