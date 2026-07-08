const FEED_SITEMAP_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/feed-sitemap';

function forwardedHeaders(request) {
  const url = new URL(request.url);
  return {
    'accept': request.headers.get('accept') || 'application/xml,text/xml',
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
    method: 'GET',
    headers: forwardedHeaders(context.request)
  });

  const headers = new Headers();
  headers.set('content-type', upstream.headers.get('content-type') || 'application/xml; charset=utf-8');
  headers.set('cache-control', upstream.headers.get('cache-control') || 'public, max-age=300, s-maxage=3600');

  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers
  });
}
