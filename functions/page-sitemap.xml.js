const SITE_URL = 'https://www.fun-sport.co';
const PAGE_PATHS = [
  '',
  '/feed',
  '/pickleball/collection',
  '/ysandal/collection'
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
  const urls = PAGE_PATHS.map((path) => [
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
