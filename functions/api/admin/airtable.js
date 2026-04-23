/**
 * Finally Settled — Admin Airtable Proxy
 * GET  /api/admin/airtable — search records
 * PATCH /api/admin/airtable — update a record
 *
 * Protected by X-Admin-Auth header matching required ADMIN_PASSWORD env var
 */

const AIRTABLE_BASE = 'appLmQyh1ov0NDQ58';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Auth',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

function getAdminPassword(env) {
  const password = typeof env.ADMIN_PASSWORD === 'string' ? env.ADMIN_PASSWORD.trim() : '';
  return password || null;
}

function checkAuth(request, password) {
  const pw = request.headers.get('X-Admin-Auth');
  return !!password && pw === password;
}

function requireConfiguredAdminPassword(env) {
  const password = getAdminPassword(env);
  if (!password) return { response: json({ error: 'server_misconfigured', detail: 'ADMIN_PASSWORD is required' }, 503) };
  return { password };
}

function requireAirtableKey(env) {
  const apiKey = typeof env.AIRTABLE_API_KEY === 'string' ? env.AIRTABLE_API_KEY.trim() : '';
  if (!apiKey) return { response: json({ error: 'server_misconfigured', detail: 'AIRTABLE_API_KEY is required' }, 503) };
  return { apiKey };
}

export async function onRequestGet({ request, env }) {
  const auth = requireConfiguredAdminPassword(env);
  if (auth.response) return auth.response;
  if (!checkAuth(request, auth.password)) return json({ error: 'unauthorized' }, 401);
  const airtable = requireAirtableKey(env);
  if (airtable.response) return airtable.response;

  const url = new URL(request.url);
  const table  = url.searchParams.get('table');
  const filter = url.searchParams.get('filter');
  const max    = url.searchParams.get('max') || '10';

  if (!table) return json({ error: 'table required' }, 400);

  const atUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}` +
    `?maxRecords=${max}` +
    (filter ? `&filterByFormula=${encodeURIComponent(filter)}` : '');

  const r = await fetch(atUrl, {
    headers: { Authorization: `Bearer ${airtable.apiKey}` },
  });
  const d = await r.json();
  return json(d, r.ok ? 200 : r.status);
}

export async function onRequestPatch({ request, env }) {
  const auth = requireConfiguredAdminPassword(env);
  if (auth.response) return auth.response;
  if (!checkAuth(request, auth.password)) return json({ error: 'unauthorized' }, 401);
  const airtable = requireAirtableKey(env);
  if (airtable.response) return airtable.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'invalid_payload' }, 400);
  }
  const { table, id, fields } = body;

  if (!table || !id || !fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return json({ error: 'table, id, fields required' }, 400);
  }

  const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${airtable.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  const d = await r.json();
  return json(d, r.ok ? 200 : r.status);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
