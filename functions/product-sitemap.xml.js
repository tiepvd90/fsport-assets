const SITE_URL = 'https://www.fun-sport.co';
const PRODUCT_PATHS = [
  '/product/gaiter',
  '/product/sportcap',
  '/product/ysandal5560',
  '/product/ysandal5568',
  '/product/ysandalbn68',
  '/pickleball/active',
  '/pickleball/bag',
  '/pickleball/ball',
  '/pickleball/cover',
  '/pickleball/foam',
  '/pickleball/fullfoam-vietnam',
  '/pickleball/fullfoam',
  '/pickleball/gen4',
  '/pickleball/panther',
  '/pickleball/phantom',
  '/ysandal/bcu5206',
  '/ysandal/bn520',
  '/ysandal/carbon',
  '/giadung/batmattroi'
];

function escXml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xml() {
  const urls = PRODUCT_PATHS.map((path) => [
    '  <url>',
    `    <loc>${escXml(SITE_URL + path)}</loc>`,
    '  </url>'
  ].join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    ''
  ].join('\n');
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  return new Response(method === 'HEAD' ? null : xml(), {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
}
