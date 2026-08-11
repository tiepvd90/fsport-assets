const SUPABASE_URL = 'https://xcigbbcpwfzluqazadez.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yZKMMfjz_wk6sYOoqaAPnw_DwOa9yNU';

function pageSlug(value) {
  return String(value || '').replace(/\.html$/i, '').trim().toLowerCase();
}

async function isManagedNfcPage(slug) {
  if (!slug || slug === 'nfc') return false;
  const url = `${SUPABASE_URL}/rest/v1/nfc_auth_pages?select=slug&slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!response.ok) return false;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return env.ASSETS.fetch(request);
  }

  // Existing HTML files in html/auth are legacy pages and must remain untouched.
  const staticResponse = await env.ASSETS.fetch(request);
  if (staticResponse.status !== 404) return staticResponse;

  const slug = pageSlug(params.slug);
  if (!await isManagedNfcPage(slug)) return staticResponse;

  const templateUrl = new URL(request.url);
  // Use the clean asset path internally so Cloudflare does not return its
  // automatic .html -> extensionless redirect to the public NFC URL.
  templateUrl.pathname = '/html/auth/nfc';
  templateUrl.search = '';
  const templateResponse = await env.ASSETS.fetch(new Request(templateUrl, request));

  if (request.method !== 'HEAD') return templateResponse;
  return new Response(null, {
    status: templateResponse.status,
    headers: templateResponse.headers
  });
}
