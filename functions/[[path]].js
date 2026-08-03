const PRODUCT_PAGE_CONFIG =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/product-page-config';

function normalizePath(path) {
  const value = String(path || '').split('?')[0].split('#')[0];
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, '').replace(/\.html?$/i, '') || '/';
}

function pageSlug(value) {
  return String(value || '').replace(/\.html?$/i, '').trim().toLowerCase();
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return env.ASSETS.fetch(request);
  }

  // Preserve every real static asset/page before trying Product Pages.
  const staticResponse = await env.ASSETS.fetch(request);
  if (staticResponse.status !== 404) return staticResponse;

  const pathParts = Array.isArray(params.path) ? params.path : [params.path];
  const slug = pageSlug(pathParts[pathParts.length - 1]);
  if (!slug) return staticResponse;

  const configResponse = await fetch(
    `${PRODUCT_PAGE_CONFIG}?slug=${encodeURIComponent(slug)}`,
    { headers: { accept: 'application/json' } }
  );
  if (!configResponse.ok) return staticResponse;

  const config = await configResponse.json();
  const requestPath = normalizePath(new URL(request.url).pathname).toLowerCase();
  const configuredPath = normalizePath(config.frontendPath).toLowerCase();
  const legacyAlias = String(pathParts[0] || '').toLowerCase() === 'p';
  if (!legacyAlias && configuredPath !== requestPath) return staticResponse;

  const dynamicUrl = new URL(request.url);
  dynamicUrl.pathname = '/dynamic-product';
  dynamicUrl.search = '';
  const dynamicResponse = await env.ASSETS.fetch(new Request(dynamicUrl, request));

  if (request.method !== 'HEAD') return dynamicResponse;
  return new Response(null, {
    status: dynamicResponse.status,
    headers: dynamicResponse.headers
  });
}
