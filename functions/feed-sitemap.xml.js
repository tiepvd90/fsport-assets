const FEED_SITEMAP_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/feed-sitemap';

function forwardedHeaders(request) {
  const url = new URL(request.url);
  return {
    accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
    'x-forwarded-host': url.host,
    'x-forwarded-proto': url.protocol.replace(':', '') || 'https'
  };
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
    : (await upstream.text())
        .replace(/https:\/\/fsport\.vn/g, 'https://www.fun-sport.co')
        .replace(/https:\/\/fun-sport\.co/g, 'https://www.fun-sport.co')
        .replace(/(<loc>https:\/\/www\.fun-sport\.co\/feed\/[^<]+?)\/(<\/loc>)/g, '$1$2')
        .replace(/\n\s*<changefreq>[^<]*<\/changefreq>/g, '')
        .replace(/\n\s*<priority>[^<]*<\/priority>/g, '');

  const headers = new Headers();
  headers.set('content-type', 'application/xml; charset=utf-8');
  headers.set('cache-control', upstream.headers.get('cache-control') || 'public, max-age=300');

  return new Response(body, {
    status: upstream.ok ? upstream.status : 502,
    headers
  });
}
