const FEED_SEO_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/feed-post-seo';
const SUPABASE_REST = 'https://xcigbbcpwfzluqazadez.supabase.co/rest/v1';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4';
const FEED_DETAIL_RENDER_VERSION = 'newsroom-mvp-v3-video-stream';
const SITE_URL = 'https://fun-sport.co';

const HUBS = {
  'running': {
    section: 'running', title: 'Chạy bộ | F-SPORT Feed',
    description: 'Bài viết, hình ảnh và video về Chạy bộ dành cho runner ở mọi trình độ.',
    canonical: '/feed/running', category: 'ysandal', label: 'Chạy bộ'
  },
  'pickleball': {
    section: 'pickleball', title: 'Pickleball | F-SPORT Feed',
    description: 'Bài viết, hình ảnh và video Pickleball trong một chuyên mục thống nhất.',
    canonical: '/feed/pickleball', category: 'pickleball', label: 'Pickleball'
  },
  'badminton': {
    section: 'badminton', title: 'Cầu lông | F-SPORT Feed',
    description: 'Tin tức, hướng dẫn và câu chuyện về Cầu lông.',
    canonical: '/feed/badminton', category: 'badminton', label: 'Cầu lông'
  },
  'football': { section: 'football', title: 'Bóng đá | F-SPORT Feed', description: 'Tin tức và câu chuyện về Bóng đá.', canonical: '/feed/football', category: 'football', label: 'Bóng đá' },
  'tennis': { section: 'tennis', title: 'Tennis | F-SPORT Feed', description: 'Tin tức, hướng dẫn và câu chuyện về Tennis.', canonical: '/feed/tennis', category: 'tennis', label: 'Tennis' },
  'basketball': { section: 'basketball', title: 'Bóng rổ | F-SPORT Feed', description: 'Tin tức, hướng dẫn và câu chuyện về Bóng rổ.', canonical: '/feed/basketball', category: 'basketball', label: 'Bóng rổ' },
  'fitness': { section: 'fitness', title: 'Fitness | F-SPORT Feed', description: 'Nội dung tập luyện và câu chuyện Fitness.', canonical: '/feed/fitness', category: 'fitness', label: 'Fitness' },
  'other-sports': { section: 'other-sports', title: 'Thể thao khác | F-SPORT Feed', description: 'Những môn thể thao và câu chuyện vận động khác.', canonical: '/feed/other-sports', category: 'other-sports', label: 'Thể thao khác' }
};

const CATEGORY_HUBS = Object.values(HUBS).reduce((result, hub) => {
  result[hub.category] = hub;
  return result;
}, {});

function forwardedHeaders(request) {
  const url = new URL(request.url);
  return {
    accept: request.headers.get('accept') || 'text/html',
    'x-forwarded-host': url.host,
    'x-forwarded-proto': url.protocol.replace(':', '') || 'https'
  };
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function replaceMeta(html, name, content) {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, 'i');
  const tag = `<meta name="${name}" content="${escaped}">`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function replaceCanonical(html, url) {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
  const pattern = /<link\s+rel=["']canonical["'][^>]*>/i;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

async function renderHub(context, hub) {
  const requestUrl = new URL(context.request.url);
  // Keep the shared shell outside Pages' clean-URL routing to avoid recursion.
  const assetUrl = new URL('/feed/feed-shell.txt', requestUrl);
  const asset = await context.env.ASSETS.fetch(new Request(assetUrl, context.request));
  if (context.request.method === 'HEAD') {
    const headers = new Headers(asset.headers);
    headers.delete('content-length'); headers.delete('content-encoding'); headers.delete('etag');
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=300, s-maxage=1800');
    return new Response(null, { status: asset.status, headers });
  }
  if (!asset.ok) return asset;
  let html = await asset.text();
  const canonical = `${SITE_URL}${hub.canonical}`;
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(hub.title)}</title>`)
    .replace('data-feed-section="home"', `data-feed-section="${hub.section}"`);
  html = replaceMeta(html, 'description', hub.description);
  html = replaceCanonical(html, canonical);
  html = html.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(canonical)}">`);
  const headers = new Headers(asset.headers);
  headers.delete('content-length'); headers.delete('content-encoding'); headers.delete('etag');
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=1800');
  return new Response(html, { status: 200, headers });
}

async function restRows(path) {
  const response = await fetch(`${SUPABASE_REST}/${path}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, Accept: 'application/json' }
  });
  if (!response.ok) return [];
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

function parseImages(value) {
  let images = value;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = []; }
  }
  if (!Array.isArray(images)) return [];
  return images.map(image => typeof image === 'string' ? image : image && image.url).filter(Boolean);
}

function inferredCategory(post) {
  if (post && CATEGORY_HUBS[post.category]) return post.category;
  const text = `${post && post.title || ''} ${(post && post.tags || []).join(' ')}`.toLowerCase();
  if (/pickleball|kitchen|dink|vợt/.test(text)) return 'pickleball';
  return 'ysandal';
}

function hubForCategory(category) {
  const hub = CATEGORY_HUBS[category] || HUBS.running;
  return { label: hub.label, url: hub.canonical, section: hub.section, category: hub.category };
}

async function relatedFor(slug) {
  const currentRows = await restRows(`feed_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=id,slug,title,category,tags,images,video_id,published_at,feed_order_at&limit=1`);
  const current = currentRows[0];
  if (!current) return { current: null, items: [], latest: [], previous: null, next: null };
  const category = inferredCategory(current);
  const select = 'id,slug,title,category,tags,images,video_id,published_at,feed_order_at';
  const [categoryRows, latestRows] = await Promise.all([
    restRows(`feed_posts?status=eq.published&is_feed_visible=eq.true&category=eq.${encodeURIComponent(category)}&select=${select}&order=feed_order_at.desc.nullslast,published_at.desc.nullslast,id.desc&limit=60`),
    restRows(`feed_posts?status=eq.published&is_feed_visible=eq.true&select=${select}&order=feed_order_at.desc.nullslast,published_at.desc.nullslast,id.desc&limit=60`)
  ]);
  const currentIndex = categoryRows.findIndex(item => item.slug === slug);
  const items = categoryRows.filter(item => item.slug !== slug).slice(0, 6);
  const usedIds = new Set(categoryRows.map(item => item.id));
  const latest = latestRows.filter(item => item.slug !== slug && !usedIds.has(item.id)).slice(0, 10);
  return {
    current: { ...current, category }, items, latest,
    previous: currentIndex >= 0 ? categoryRows[currentIndex + 1] || null : null,
    next: currentIndex > 0 ? categoryRows[currentIndex - 1] || null : null
  };
}

function itemImage(item) {
  return parseImages(item && item.images)[0] || (item && item.video_id ? `https://img.youtube.com/vi/${encodeURIComponent(item.video_id)}/hqdefault.jpg` : '');
}

function itemDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(value));
  } catch { return ''; }
}

function articleHeaderHtml(hub) {
  const active = hub.section;
  const current = name => name === active ? ' aria-current="page"' : '';
  const sportLinks = Object.values(HUBS).map(item => `<a href="${item.canonical}"${current(item.section)}>${escapeHtml(item.label)}</a>`).join('');
  return `<a class="fn-skip" href="#main-content">Đi tới nội dung</a><header class="fn-header fn-article-site-header"><div class="fn-container fn-masthead"><button class="fn-back-button" type="button" data-feed-back aria-label="Quay lại"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><a class="fn-brand" href="/feed" aria-label="F-SPORT Feed - Trang nhất"><span>F-SPORT <b>FEED</b></span></a></div><nav class="fn-primary-nav" aria-label="Môn thể thao"><div class="fn-container fn-nav-inner"><a href="/feed">Trang nhất</a>${sportLinks}<a class="fn-shop-link" href="/">Cửa hàng</a></div></nav><nav class="fn-topic-bar" aria-label="Môn thể thao trên di động"><div class="fn-container fn-topic-scroll"><a href="/feed">Tất cả</a>${sportLinks}</div></nav></header>`;
}

function detailRailHtml(data) {
  if (!data.current || data.items.length < 3) return '';
  const hub = hubForCategory(data.current.category);
  const links = data.items.slice(2, 6).map((item, index) => `<li><a href="/feed/${encodeURIComponent(item.slug)}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(item.title)}</strong></a></li>`).join('');
  return `<aside class="fn-detail-rail" aria-labelledby="fn-detail-rail-title"><div class="fn-detail-rail-head"><h2 id="fn-detail-rail-title">Trong ${escapeHtml(hub.label)}</h2><a href="${hub.url}">Xem tất cả →</a></div><ol>${links}</ol></aside>`;
}

function pagerHtml(data) {
  if (!data.previous && !data.next) return '';
  const card = (item, label, side) => item ? `<a class="fn-pager-card fn-pager-${side}" href="/feed/${encodeURIComponent(item.slug)}"><span>${label}</span><strong>${escapeHtml(item.title)}</strong></a>` : '<span></span>';
  return `<nav class="fn-article-pager" aria-label="Bài trước và bài tiếp theo">${card(data.previous, '← Bài trước', 'previous')}${card(data.next, 'Bài tiếp theo →', 'next')}</nav>`;
}

function latestHtml(data) {
  if (!data.latest || !data.latest.length) return '';
  const rows = data.latest.map(item => {
    const image = itemImage(item);
    const videoClass = item.video_id ? ' fn-article-latest-video' : '';
    const itemHub = hubForCategory(inferredCategory(item));
    const dimensions = 'width="320" height="180"';
    return `<article class="fn-article-latest-item${videoClass}"><a href="/feed/${encodeURIComponent(item.slug)}">${image ? `<span class="fn-latest-media"><img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" ${dimensions} loading="lazy" decoding="async">${item.video_id ? '<i aria-hidden="true">▶</i>' : ''}</span>` : ''}<span class="fn-latest-copy"><small>${escapeHtml(itemHub.label)} · ${escapeHtml(itemDate(item.published_at))}</small><strong>${escapeHtml(item.title)}</strong></span></a></article>`;
  }).join('');
  return `<section class="fn-article-latest" aria-labelledby="fn-article-latest-title"><div class="fn-related-head"><h2 id="fn-article-latest-title">Mới nhất trên F-SPORT Feed</h2><a href="/feed">Trang nhất →</a></div><div class="fn-article-latest-grid">${rows}</div></section>`;
}

function relatedHtml(data) {
  if (!data.current) return '';
  const hub = hubForCategory(data.current.category);
  const cards = data.items.map(item => {
    const image = itemImage(item);
    const videoClass = item.video_id ? ' fn-related-video' : '';
    const dimensions = 'width="360" height="203"';
    return `<article class="fn-related-card${videoClass}" data-post-id="${escapeHtml(item.id)}"><a href="/feed/${encodeURIComponent(item.slug)}">${image ? `<span class="fn-related-media"><img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" ${dimensions} loading="lazy" decoding="async">${item.video_id ? '<i aria-hidden="true">▶</i>' : ''}</span>` : ''}<strong>${escapeHtml(item.title)}</strong></a></article>`;
  }).join('');
  return `<section id="fn-article-category-stream" class="fn-article-related" aria-labelledby="fn-related-title" data-category="${escapeHtml(data.current.category)}" data-current-id="${escapeHtml(data.current.id)}" data-current-slug="${escapeHtml(data.current.slug)}"><div class="fn-related-head"><h2 id="fn-related-title">Bài mới về ${escapeHtml(hub.label)}</h2><a href="${hub.url}">Xem chuyên mục →</a></div><div class="fn-related-grid">${cards}</div><div class="fn-infinite-sentinel" role="status" aria-live="polite"><span></span><small>Đang chờ tải thêm bài…</small></div></section>`;
}

function transformVideo(html) {
  return html.replace(/<iframe\s+src="https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})"[^>]*title="([^"]*)"[^>]*><\/iframe>/gi,
    (_, id, title) => `<button class="fn-article-video" type="button" data-video-id="${escapeHtml(id)}" data-video-title="${escapeHtml(title)}" aria-label="Mở video: ${escapeHtml(title)}"><img src="https://img.youtube.com/vi/${escapeHtml(id)}/hqdefault.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async"><span aria-hidden="true">▶</span></button>`);
}

function removeEagerExtras(html) {
  html = html.replace(/\s*<link[^>]+href=["']\/css\/checkoutpopup\.css[^"']*["'][^>]*>/i, '');
  html = html.replace(/\s*<script[^>]+src=["']\/js\/homepage-footer\.js[^"']*["'][^>]*><\/script>/i, '');
  html = html.replace(/\s*<script[^>]+src=["']\/js\/legal-footer\.js[^"']*["'][^>]*><\/script>/i, '');
  html = html.replace(/\s*<section class="feed-collection"[\s\S]*?<\/section>/i, '');
  html = html.replace(/<div id="checkoutPopup-placeholder"><\/div>/i, '');
  html = html.replace(/<script>\s*\(function \(\) \{[\s\S]*?fetch\('\/html\/checkoutpopup\.html'\)[\s\S]*?<\/script>/i, '');
  html = html.replace(/<style>\s*#aic-container[\s\S]*?<\/style>\s*<div id="aic-container"><\/div>/i, '');
  html = html.replace(/<script src="\/js\/ai-chat\.js[^>]*><\/script>\s*<script>[\s\S]*?AiChat\.init[\s\S]*?<\/script>/i, '');
  return html;
}

function removeCollectionSchema(html) {
  return html.replace(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi, (block, source) => {
    try {
      const data = JSON.parse(source);
      if (Array.isArray(data['@graph'])) {
        data['@graph'] = data['@graph'].filter(node => !(
          node && node['@type'] === 'ItemList' && String(node['@id'] || '').endsWith('#collection')
        ));
      }
      return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
    } catch {
      return block;
    }
  });
}

async function renderDetail(context, slug) {
  const upstreamUrl = `${FEED_SEO_FUNCTION}?slug=${encodeURIComponent(slug)}&render=${FEED_DETAIL_RENDER_VERSION}`;
  const [upstream, related] = await Promise.all([
    fetch(upstreamUrl, { method: 'GET', headers: forwardedHeaders(context.request) }),
    relatedFor(slug)
  ]);
  if (context.request.method === 'HEAD') {
    return new Response(null, { status: upstream.status, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
  let html = await upstream.text();
  if (upstream.ok) {
    html = html.replace(/https:\/\/www\.fun-sport\.co/g, SITE_URL);
    html = removeCollectionSchema(removeEagerExtras(transformVideo(html)));
    html = html.replace(/<title>([\s\S]*?)(?:\s*\|\s*F-SPORT(?:\s+Play|\s+Feed)?)?<\/title>/i, '<title>$1 | F-SPORT Feed</title>');
    const hub = hubForCategory(related.current && related.current.category);
    html = html.replace(/(<body[^>]*>)/i, `$1${articleHeaderHtml(hub)}`);
    html = html.replace(/<main(\s|>)/i, '<main id="main-content"$1');
    html = html.replace('<div class="brand">F-SPORT</div>', `<nav class="fn-article-breadcrumb" aria-label="Breadcrumb"><a href="/feed">F-SPORT Feed</a><span>›</span><a href="${hub.url}">${hub.label}</a></nav>`);
    const detailRail = detailRailHtml(related);
    if (detailRail) html = html.replace(/(<article[^>]*>[\s\S]*?<\/header>)/i, `$1${detailRail}`);
    const relatedBlock = relatedHtml(related);
    const continuation = `${pagerHtml(related)}${relatedBlock}<div id="fn-article-after-category" hidden>${latestHtml(related)}<nav class="fn-article-return" aria-label="Quay lại chuyên mục"><a href="${hub.url}">← Trở lại ${escapeHtml(hub.label)}</a><a href="/feed">Trang nhất F-SPORT Feed →</a></nav></div>`;
    html = html.replace(/<a class="back"[^>]*>[\s\S]*?<\/a>/i, continuation);
    html = html.replace('</head>', '  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n  <link rel="stylesheet" href="/css/feed-newsroom.css?v=20261025-feed-flow-1">\n  <link rel="stylesheet" href="/css/feed-article.css?v=20261028-feed-content-1">\n</head>');
    html = html.replace('</body>', `  <script src="/js/tracking-consent.js?v=20260905-once-delayed-1"></script>\n  <script src="/js/tracking.js?v=20260925-openai-ads-1"></script>\n  <script src="/js/analytics.js?v=20260914-page-view-1"></script>\n  <script src="/js/feed-article.js?v=20261028-feed-content-1" defer></script>\n  <script src="/js/homepage-footer.js?v=20261025-feed-flow-1" defer></script>\n  <script src="/js/legal-footer.js?v=20261024-feed-sync-1" defer></script>\n</body>`);
  }
  const headers = new Headers(upstream.headers);
  headers.delete('content-length'); headers.delete('content-encoding'); headers.delete('etag');
  headers.delete('content-security-policy'); headers.delete('set-cookie');
  headers.delete('server'); headers.delete('cf-ray'); headers.delete('cf-cache-status');
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', upstream.headers.get('cache-control') || 'public, max-age=300, s-maxage=1800');
  return new Response(html, { status: upstream.status, headers });
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 });
  const requestUrl = new URL(context.request.url);
  const slug = String(context.params.slug || '').replace(/\/+$/, '');
  if (!slug) return new Response('Missing feed slug', { status: 400 });
  if (slug === 'chay-bo' || slug === 'suc-khoe' || slug === 'video') {
    requestUrl.pathname = slug === 'chay-bo' ? '/feed/running' : '/feed';
    return Response.redirect(requestUrl.toString(), 301);
  }
  if (requestUrl.pathname.endsWith('/')) {
    requestUrl.pathname = `/feed/${slug}`;
    return Response.redirect(requestUrl.toString(), 301);
  }
  if (HUBS[slug]) return renderHub(context, HUBS[slug]);
  return renderDetail(context, slug);
}
