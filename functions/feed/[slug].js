const FEED_SEO_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/feed-post-seo';

function forwardedHeaders(request) {
  const url = new URL(request.url);
  return {
    'accept': request.headers.get('accept') || 'text/html',
    'x-forwarded-host': url.host,
    'x-forwarded-proto': url.protocol.replace(':', '') || 'https'
  };
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const requestUrl = new URL(context.request.url);
  const slug = String(context.params.slug || '').replace(/\/+$/, '');
  if (!slug) return new Response('Missing feed slug', { status: 400 });
  if (requestUrl.pathname.endsWith('/')) {
    requestUrl.pathname = `/feed/${slug}`;
    return Response.redirect(requestUrl.toString(), 301);
  }

  const upstreamUrl = `${FEED_SEO_FUNCTION}?slug=${encodeURIComponent(slug)}`;
  const upstream = await fetch(upstreamUrl, {
    method: 'GET',
    headers: forwardedHeaders(context.request)
  });

  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', upstream.headers.get('cache-control') || 'public, max-age=300, s-maxage=3600');

  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers
  });
}
