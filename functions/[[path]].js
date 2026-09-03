const PRODUCT_PAGE_CONFIG =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/product-page-config';
const POLICY_PATHS = new Set([
  '/thong-tin-phap-ly',
  '/quy-trinh-mua-hang',
  '/chinh-sach-van-chuyen',
  '/chinh-sach-doi-tra-hoan-tien',
  '/chinh-sach-bao-hanh',
  '/chinh-sach-bao-mat',
  '/dieu-khoan-giao-dich'
]);

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

  // Serve the submitted policy URLs directly with HTTP 200, without forcing
  // a trailing slash redirect from the static asset layer.
  const requestUrl = new URL(request.url);
  const normalizedRequestPath = normalizePath(requestUrl.pathname).toLowerCase();
  if (POLICY_PATHS.has(normalizedRequestPath)) {
    const policyUrl = new URL(request.url);
    policyUrl.pathname = normalizedRequestPath + '/index.html';
    const policyResponse = await env.ASSETS.fetch(new Request(policyUrl, request));
    if (policyResponse.ok) {
      return new Response(request.method === 'HEAD' ? null : policyResponse.body, {
        status: 200,
        headers: policyResponse.headers
      });
    }
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
  const requestPath = normalizedRequestPath;
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
