// Cloudflare Pages Function — /api/contact-messages
// POST stores inbound contact submissions (via FormSubmit webhook).
// GET returns stored messages for admin panel (requires X-Admin-Key).

const ADMIN_PASSWORD = 'password';
const STORAGE_KEY = 'contact-messages';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key'
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (_) {
    return null;
  }
}

function normalizeMessage(payload) {
  const formData = payload?.form_data || payload || {};
  const name = String(formData.name || payload?.name || '').trim();
  const email = String(formData.email || payload?.email || '').trim();
  const message = String(formData.message || payload?.message || '').trim();

  return {
    id: Date.now().toString(),
    name: name || 'Unknown',
    email: email || 'Unknown',
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
    const payload = await readJsonBody(request);
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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
