const PRODUCT_SITEMAP_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/product-sitemap';

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const upstream = await fetch(PRODUCT_SITEMAP_FUNCTION, {
    method,
    headers: { accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8' }
  });

  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': upstream.headers.get('cache-control') || 'public, max-age=300'
    }
  });
}
