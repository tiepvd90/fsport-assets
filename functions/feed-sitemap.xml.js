const FEED_SITEMAP_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/feed-sitemap';
const SITE_URL = 'https://fun-sport.co';
const FEED_HUBS = [
  '/feed',
  '/feed/running',
  '/feed/pickleball',
  '/feed/badminton',
  '/feed/football',
  '/feed/tennis',
  '/feed/basketball',
  '/feed/fitness',
  '/feed/other-sports'
];

function forwardedHeaders(request) {
  return {
    accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
    'x-forwarded-host': 'fun-sport.co',
    'x-forwarded-proto': 'https'
  };
}

function normalizeSitemap(source) {
  let body = source
    .replace(/https:\/\/\/+www\.fun-sport\.co/g, SITE_URL)
    .replace(/https:\/\/\/+fun-sport\.co/g, SITE_URL)
    .replace(/https:\/\/www\.fun-sport\.co/g, SITE_URL)
    .replace(/https:\/\/fsport\.vn/g, SITE_URL)
    .replace(/(<loc>https:\/\/fun-sport\.co\/feed\/[^<]+?)\/(<\/loc>)/g, '$1$2')
    .replace(/\n\s*<changefreq>[^<]*<\/changefreq>/g, '')
    .replace(/\n\s*<priority>[^<]*<\/priority>/g, '');

  const missingHubs = FEED_HUBS.filter(path => !body.includes(`<loc>${SITE_URL}${path}</loc>`));
  if (missingHubs.length) {
    const entries = missingHubs.map(path => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n');
    body = body.replace(/(<urlset[^>]*>)/i, `$1\n${entries}`);
  }
  return body;
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const upstream = await fetch(FEED_SITEMAP_FUNCTION, {
    method,
    headers: forwardedHeaders(context.request)
  });
  const body = method === 'HEAD'
    ? null
    : normalizeSitemap(await upstream.text());

  const headers = new Headers();
  headers.set('content-type', 'application/xml; charset=utf-8');
  headers.set('cache-control', upstream.headers.get('cache-control') || 'public, max-age=300');

  return new Response(body, {
    status: upstream.ok ? upstream.status : 502,
    headers
  });
}
