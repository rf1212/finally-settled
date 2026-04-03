/**
 * Finally Settled — Image Proxy
 * GET /api/image?key=[32-char hex key]
 *
 * Fetches property photos server-side and serves them through CF CDN.
 * The browser never sees or constructs the upstream source URL.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://homes.finallysettled.com',
};

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  // Validate: must be exactly 32 hex characters
  if (!key || !/^[a-f0-9]{32}$/.test(key)) {
    return placeholder();
  }

  // Source URL reconstructed server-side — never exposed to browser
  const sourceUrl = `https://photos.zillowstatic.com/fp/${key}-p_e.jpg`;

  try {
    const resp = await fetch(sourceUrl, {
      headers: {
        'Referer': 'https://www.google.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
      },
    });

    if (!resp.ok) return placeholder();

    return new Response(resp.body, {
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        ...CORS_HEADERS,
        // No upstream headers pass through
      },
    });
  } catch {
    return placeholder();
  }
}

function placeholder() {
  // 1×1 transparent GIF
  const gif = Uint8Array.from(
    atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
    c => c.charCodeAt(0)
  );
  return new Response(gif, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'public, max-age=60',
      ...CORS_HEADERS,
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://homes.finallysettled.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
