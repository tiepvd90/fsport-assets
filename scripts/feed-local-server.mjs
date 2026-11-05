import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { onRequest as feedIndex } from '../functions/feed/index.js';
import { onRequest as feedSlug } from '../functions/feed/[slug].js';

const root = join(import.meta.dirname, '..');
const port = Number(process.env.FSPORT_FEED_PORT || 8792);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function assetResponse(request) {
  const url = new URL(request.url);
  const file = join(root, decodeURIComponent(url.pathname).replace(/^\/+/, ''));
  try {
    return new Response(await readFile(file), {
      status: 200,
      headers: { 'content-type': types[extname(file).toLowerCase()] || 'application/octet-stream' }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

const assets = { fetch: assetResponse };

async function send(response, webResponse) {
  response.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()));
  response.end(webResponse.body ? Buffer.from(await webResponse.arrayBuffer()) : undefined);
}

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    const webRequest = new Request(url, { method: request.method });
    if (url.pathname === '/feed' || url.pathname === '/feed/') {
      return send(response, await feedIndex({ request: webRequest, env: { ASSETS: assets }, params: {} }));
    }
    const match = url.pathname.match(/^\/feed\/([^/]+)\/?$/);
    if (match && match[1] !== 'feed-shell.txt') {
      return send(response, await feedSlug({ request: webRequest, env: { ASSETS: assets }, params: { slug: match[1] } }));
    }
    return send(response, await assetResponse(webRequest));
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(error.stack || String(error));
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`F-SPORT Feed local ready: http://127.0.0.1:${port}/feed`);
});
