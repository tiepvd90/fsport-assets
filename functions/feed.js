const SUPABASE_URL = 'https://xcigbbcpwfzluqazadez.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4';
const SITE_URL = 'https://www.fun-sport.co';
const PAGE_SIZE = 10;

function esc(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripText(input) {
  return String(input || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(input, max) {
  const text = stripText(input);
  if (text.length <= max) return text;
  return text.slice(0, max - 3).replace(/\s+\S*$/, '') + '...';
}

function pageNumber(request) {
  const value = Number(new URL(request.url).searchParams.get('page') || '1');
  return Number.isFinite(value) && value > 1 ? Math.floor(value) : 1;
}

function canonicalForPage(page) {
  return page > 1 ? `${SITE_URL}/feed?page=${page}` : `${SITE_URL}/feed`;
}

async function loadFeedPage(page) {
  const offset = (page - 1) * PAGE_SIZE;
  const endpoint = `${SUPABASE_URL}/rest/v1/rpc/get_public_feed_posts?select=id,slug,title,body,published_at,created_at,updated_at`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ p_limit: PAGE_SIZE + 1, p_offset: offset })
  });
  if (!response.ok) return [];
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

function renderSeoFeed(rows, page) {
  const visibleRows = rows.slice(0, PAGE_SIZE).filter((row) => row && row.slug);
  const hasNext = rows.length > PAGE_SIZE;
  const items = visibleRows.map((row) => {
    const url = `/feed/${encodeURIComponent(row.slug)}`;
    const description = truncate(row.body, 150);
    const date = row.published_at || row.created_at || row.updated_at || '';
    return `<article class="feed-seo-item">
      <h2><a href="${esc(url)}">${esc(row.title || 'Bai viet F-SPORT')}</a></h2>
      ${date ? `<time datetime="${esc(date)}">${esc(new Date(date).toLocaleDateString('vi-VN'))}</time>` : ''}
      ${description ? `<p>${esc(description)}</p>` : ''}
      <a href="${esc(url)}">Xem bai</a>
    </article>`;
  }).join('');

  const prev = page > 1 ? `<a href="/feed${page === 2 ? '' : `?page=${page - 1}`}">Trang truoc</a>` : '';
  const next = hasNext ? `<a href="/feed?page=${page + 1}">Trang tiep theo</a>` : '';

  return `<section class="feed-seo-page" aria-label="Danh sach bai Feed">
    <style>
      .feed-seo-page{padding:10px 14px 18px;background:#fff;color:#111}
      .feed-seo-page h1{font-size:18px;line-height:1.3;margin:0 0 10px}
      .feed-seo-item{border-top:1px solid #e4e6eb;padding:10px 0}
      .feed-seo-item h2{font-size:15px;line-height:1.35;margin:0 0 4px}
      .feed-seo-item a{color:#111;text-decoration:none;font-weight:700}
      .feed-seo-item p{font-size:13px;line-height:1.45;margin:6px 0;color:#555}
      .feed-seo-item time{font-size:12px;color:#777}
      .feed-seo-nav{display:flex;gap:14px;border-top:1px solid #e4e6eb;padding-top:12px}
      .feed-seo-nav a{color:#1877f2;font-size:13px;font-weight:700}
    </style>
    <h1>F-SPORT Feed${page > 1 ? ` - Trang ${page}` : ''}</h1>
    ${items}
    <nav class="feed-seo-nav" aria-label="Phan trang Feed">${prev}${next}</nav>
  </section>`;
}

function injectSeo(html, rows, page) {
  const canonical = canonicalForPage(page);
  let output = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>F-SPORT Feed${page > 1 ? ` - Trang ${page}` : ''}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonical}" />`);

  output = output.replace('<div id="feed-list"></div>', `<div id="feed-list">${renderSeoFeed(rows, page)}</div>`);
  return output;
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const assetUrl = new URL(context.request.url);
  assetUrl.pathname = '/feed.html';
  assetUrl.search = '';
  const asset = await context.env.ASSETS.fetch(assetUrl.toString(), context.request);
  let html = await asset.text();

  const page = pageNumber(context.request);
  const rows = await loadFeedPage(page);
  html = injectSeo(html, rows, page);

  return new Response(method === 'HEAD' ? null : html, {
    status: asset.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=120, s-maxage=300'
    }
  });
}
