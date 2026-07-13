const SITE_URL = 'https://www.fun-sport.co';

function xml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <sitemap>',
    `    <loc>${SITE_URL}/page-sitemap.xml</loc>`,
    '  </sitemap>',
    '  <sitemap>',
    `    <loc>${SITE_URL}/product-sitemap.xml</loc>`,
    '  </sitemap>',
    '  <sitemap>',
    `    <loc>${SITE_URL}/feed-sitemap.xml</loc>`,
    '  </sitemap>',
    '</sitemapindex>',
    ''
  ].join('\n');
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  return new Response(method === 'HEAD' ? null : xml(), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
}
