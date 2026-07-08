const FEED_SEO_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/feed-post-seo';

const FEED_SITEMAP_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/feed-sitemap';

function forwardedHeaders(request, accept) {
  const url = new URL(request.url);
  return {
    'accept': request.headers.get('accept') || accept,
    'x-forwarded-host': url.host,
    'x-forwarded-proto': url.protocol.replace(':', '') || 'https'
  };
}

function proxyResponse(method, upstream, fallbackType) {
  const headers = new Headers();
  headers.set('content-type', upstream.headers.get('content-type') || fallbackType);
  headers.set('cache-control', upstream.headers.get('cache-control') || 'public, max-age=300, s-maxage=3600');

  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers
  });
}

async function proxyFeedPost(request, slug) {
  const upstream = await fetch(`${FEED_SEO_FUNCTION}?slug=${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: forwardedHeaders(request, 'text/html')
  });

  return proxyResponse(request.method, upstream, 'text/html; charset=utf-8');
}

async function proxyFeedSitemap(request) {
  const upstream = await fetch(FEED_SITEMAP_FUNCTION, {
    method: 'GET',
    headers: forwardedHeaders(request, 'application/xml,text/xml')
  });

  return proxyResponse(request.method, upstream, 'application/xml; charset=utf-8');
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return context.next();
  }

  const path = new URL(context.request.url).pathname;

  if (path === '/feed-sitemap.xml') {
    return proxyFeedSitemap(context.request);
  }

  const feedMatch = path.match(/^\/feed\/([^/]+)\/?$/);
  if (feedMatch) {
    return proxyFeedPost(context.request, feedMatch[1]);
  }

  return context.next();
}
