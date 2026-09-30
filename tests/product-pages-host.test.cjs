const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function loadWorker() {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'functions', '[[path]].js'),
    'utf8'
  );
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

function assetResponse(request) {
  const url = new URL(request.url);
  if (url.pathname === '/dynamic-product') {
    return new Response(
      '<!doctype html><html><head><title>F-Sport</title></head><body>Product</body></html>',
      { status: 200, headers: { 'content-type': 'text/html' } }
    );
  }
  return new Response('Not found', { status: 404 });
}

async function run() {
  const { onRequest } = await loadWorker();
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    const slug = new URL(url).searchParams.get('slug');
    return new Response(JSON.stringify({
      slug,
      frontendPath: `/ysandal/${slug}`,
      title: `Product ${slug}`
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    for (const host of ['fun-sport.co', 'www.fun-sport.co']) {
      const request = new Request(`https://${host}/ysandal/carbon2?utm_source=test`);
      const response = await onRequest({
        request,
        env: { ASSETS: { fetch: assetResponse } },
        params: { path: ['ysandal', 'carbon2'] }
      });
      const html = await response.text();

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('location'), null, 'Product Page must not redirect');
      assert.match(html, new RegExp(`<link rel="canonical" href="https://${host}/ysandal/carbon2">`));
      assert.match(html, new RegExp(`<meta property="og:url" content="https://${host}/ysandal/carbon2">`));
      assert.doesNotMatch(
        html,
        host === 'fun-sport.co' ? /https:\/\/www\.fun-sport\.co\/ysandal\/carbon2/ : /$a/,
        'Apex HTML must not introduce the www host'
      );
    }
  } finally {
    global.fetch = originalFetch;
  }

  console.log('product-pages host preservation: ok');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
