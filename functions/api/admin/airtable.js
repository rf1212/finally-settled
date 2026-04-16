/**
 * Finally Settled — Admin Airtable Proxy
 * GET  /api/admin/airtable — search records
 * PATCH /api/admin/airtable — update a record
 *
 * Protected by X-Admin-Auth header matching ADMIN_PASSWORD env var
 */

const AIRTABLE_BASE = 'appLmQyh1ov0NDQ58';
const ADMIN_PW_DEFAULT = 'FS2026Admin';

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

function checkAuth(request, env) {
  const pw = request.headers.get('X-Admin-Auth');
  const correct = env.ADMIN_PASSWORD || ADMIN_PW_DEFAULT;
  return pw === correct;
}

export async function onRequestGet({ request, env }) {
  if (!checkAuth(request, env)) return json({ error: 'unauthorized' }, 401);

  const url = new URL(request.url);
  const table  = url.searchParams.get('table');
  const filter = url.searchParams.get('filter');
  const max    = url.searchParams.get('max') || '10';

  if (!table) return json({ error: 'table required' }, 400);

  const atUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}` +
    `?maxRecords=${max}` +
    (filter ? `&filterByFormula=${encodeURIComponent(filter)}` : '');

  const r = await fetch(atUrl, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` },
  });
  const d = await r.json();
  return json(d, r.ok ? 200 : r.status);
}

export async function onRequestPatch({ request, env }) {
  if (!checkAuth(request, env)) return json({ error: 'unauthorized' }, 401);

  const body = await request.json();
  const { table, id, fields } = body;

  if (!table || !id || !fields) return json({ error: 'table, id, fields required' }, 400);

  const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
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
