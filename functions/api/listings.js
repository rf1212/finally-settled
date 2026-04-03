/**
 * Finally Settled — Listings API
 * GET /api/listings
 *
 * Fetches active listings from Airtable, caches in CF KV (5 min TTL),
 * and returns clean JSON. Never exposes upstream photo URLs or source names.
 */

const AIRTABLE_BASE  = 'appLmQyh1ov0NDQ58';
const AIRTABLE_TABLE = 'tblJBrj6XNjap4wQb';
const CACHE_KEY      = 'listings_v1';
const CACHE_TTL      = 300; // seconds

// Field IDs — keyed by their role
const F = {
  id:           'fldNYnIZnQzwIRoDr',
  address:      'fldJ1MoKriw2aRmGh',
  street:       'fldMzHMiPE6No4y7N',
  city:         'fldFPDUXq9AxAvrdO',
  state:        'fldjc13LDUlqOEUgc',
  zip:          'fldGVFasLdVJhGxrM',
  beds:         'fldInDKIkBtURyyOA',
  baths:        'fldNK77Wj6DqfZyxl',
  sqft:         'fldk2RjgnBvqwu36S',
  lotAcres:     'fld9IwAmF73xYbKqO',
  status:       'fldTs13pt84AlOQYm',
  listPrice:    'fldjcHm04IUft78CD',
  photoKeys:    'fldAv5I8yOuWZSiPG',
  primaryPhoto: 'fldQx0K4sOMa95oHQ',
  monthlyTaxes: 'fldDSPULkWVlGRNm1',
  monthlyIns:   'fldci7qEHyWjWFiX2',
  listingAgent: 'fldlN63KQantdKUpS',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://homes.finallysettled.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/* ── Airtable fetch (handles pagination) ─────────────────────── */

async function fetchAllFromAirtable(apiKey) {
  const fieldParams = Object.values(F)
    .map(id => `fields[]=${id}`)
    .join('&');

  const baseUrl =
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}` +
    `?filterByFormula={${F.status}}="ForSale"` +
    `&${fieldParams}` +
    `&returnFieldsByFieldId=true` +
    `&sort[0][field]=${F.beds}&sort[0][direction]=asc` +
    `&pageSize=100`;

  let allRecords = [];
  let offset = null;

  do {
    const url = offset ? `${baseUrl}&offset=${offset}` : baseUrl;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      throw new Error(`Airtable ${resp.status}: ${await resp.text()}`);
    }

    const data = await resp.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);

  return allRecords;
}

/* ── Transform Airtable record → clean listing object ────────── */

function extractPhotoKeys(fields) {
  // Primary source: comma-separated photo keys field
  const raw = fields[F.photoKeys];
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    return raw.split(',').map(k => k.trim()).filter(Boolean);
  }

  // Fallback: extract key from primary photo URL
  const fallbackUrl = fields[F.primaryPhoto];
  if (fallbackUrl && typeof fallbackUrl === 'string') {
    const match = fallbackUrl.match(/fp\/([a-f0-9]+)-/);
    if (match) return [match[1]];
  }

  return [];
}

function transformRecord(record) {
  const f = record.fields;
  return {
    id:           String(f[F.id] || ''),
    address:      f[F.address] || '',
    street:       f[F.street] || '',
    city:         f[F.city] || '',
    state:        f[F.state] || '',
    zip:          String(f[F.zip] || ''),
    beds:         Number(f[F.beds]) || 0,
    baths:        Number(f[F.baths]) || 0,
    sqft:         Number(f[F.sqft]) || 0,
    lotAcres:     Number(f[F.lotAcres]) || 0,
    listPrice:    Number(f[F.listPrice]) || 0,
    photoKeys:    extractPhotoKeys(f),
    monthlyTaxes: Number(f[F.monthlyTaxes]) || 0,
    monthlyIns:   Number(f[F.monthlyIns]) || 0,
    listingAgent: f[F.listingAgent] || '',
  };
}

/* ── Main handler ────────────────────────────────────────────── */

export async function onRequestGet({ env }) {
  try {
    // Check KV cache first
    if (env.FS_CACHE) {
      const cached = await env.FS_CACHE.get(CACHE_KEY);
      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
            ...CORS_HEADERS,
          },
        });
      }
    }

    // Fetch from Airtable
    const apiKey = env.AIRTABLE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'listings_unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const records = await fetchAllFromAirtable(apiKey);
    const listings = records.map(transformRecord).filter(l => l.id);

    const json = JSON.stringify(listings);

    // Write to KV cache
    if (env.FS_CACHE) {
      await env.FS_CACHE.put(CACHE_KEY, json, { expirationTtl: CACHE_TTL });
    }

    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error('Listings API error:', err.message);
    return new Response(
      JSON.stringify({ error: 'listings_unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
}

/* ── CORS preflight ──────────────────────────────────────────── */

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
