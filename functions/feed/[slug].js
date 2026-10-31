const FEED_SEO_FUNCTION =
  'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/feed-post-seo';
const SUPABASE_REST = 'https://xcigbbcpwfzluqazadez.supabase.co/rest/v1';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4';
const SIZE_FINDER_SLUG = 'chon-size-dep-chay-bo-ysandal-ung-chuan-huong-dan-chi-tiet-cho-nguoi-moi-va-chuyen-nghiep-20260724';
const FEED_DETAIL_RENDER_VERSION = 'newsroom-mvp-v3-video-stream';
const SITE_URL = 'https://fun-sport.co';

const HUBS = {
  'running': {
    section: 'running', title: 'Chạy bộ | F-SPORT Feed',
    description: 'Bài viết, hình ảnh và video về Chạy bộ dành cho runner ở mọi trình độ.',
    canonical: '/feed/running', category: 'running', label: 'Chạy bộ'
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
// Legacy running articles used the product category `ysandal`.
CATEGORY_HUBS.ysandal = HUBS.running;

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
  if (post && post.category === 'ysandal') return 'running';
  if (post && CATEGORY_HUBS[post.category]) return post.category;
  const text = `${post && post.title || ''} ${(post && post.tags || []).join(' ')}`.toLowerCase();
  if (/pickleball|kitchen|dink|vợt/.test(text)) return 'pickleball';
  return 'running';
}

function hubForCategory(category) {
  const hub = CATEGORY_HUBS[category] || HUBS.running;
  return { label: hub.label, url: hub.canonical, section: hub.section, category: hub.category };
}

async function relatedFor(slug) {
  const currentRows = await restRows(`feed_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=id,slug,title,category,tags,images,video_id,published_at,created_at,feed_order_at&limit=1`);
  const current = currentRows[0];
  if (!current) return { current: null, items: [], latest: [], previous: null, next: null };
  const category = inferredCategory(current);
  const select = 'id,slug,title,category,tags,images,video_id,published_at,feed_order_at';
  const categoryFilter = category === 'running' ? 'category=in.(running,ysandal)' : `category=eq.${encodeURIComponent(category)}`;
  const [categoryRows, latestRows] = await Promise.all([
    restRows(`feed_posts?status=eq.published&is_feed_visible=eq.true&${categoryFilter}&select=${select}&order=feed_order_at.desc.nullslast,published_at.desc.nullslast,id.desc&limit=60`),
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
  return `<a class="fn-skip" href="#main-content">Đi tới nội dung</a><header class="fn-header fn-article-site-header"><div class="fn-container fn-masthead"><a class="fn-brand" href="/feed" aria-label="F-SPORT Feed - Trang nhất"><span>F-SPORT <b>FEED</b></span></a></div><nav class="fn-primary-nav" aria-label="Môn thể thao"><div class="fn-container fn-nav-inner"><a href="/feed">Trang nhất</a>${sportLinks}<a class="fn-shop-link" href="/">Cửa hàng</a></div></nav><nav class="fn-topic-bar" aria-label="Môn thể thao trên di động"><div class="fn-container fn-topic-scroll"><a href="/feed">Tất cả</a>${sportLinks}</div></nav></header><div class="fn-back-sticky"><button class="fn-back-button" type="button" data-feed-back aria-label="Quay lại"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button></div>`;
}

function detailRailHtml(data, commerceCategory = '') {
  if (!data.current) return '';
  const hub = hubForCategory(data.current.category);
  const links = data.items.slice(0, 2).map((item, index) => `<li><a href="/feed/${encodeURIComponent(item.slug)}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(item.title)}</strong></a></li>`).join('');
  const commerce = commerceCategory ? `<div class="fn-feed-commerce fn-feed-commerce-rail" data-feed-commerce="${escapeHtml(commerceCategory)}" aria-label="Sản phẩm gợi ý từ F-SPORT"></div>` : '';
  const related = links ? `<div class="fn-detail-related"><div class="fn-detail-rail-head"><h2 id="fn-detail-rail-title">Trong ${escapeHtml(hub.label)}</h2><a href="${hub.url}">Xem tất cả →</a></div><ol>${links}</ol></div>` : '';
  if (!commerce && !related) return '';
  return `<aside class="fn-detail-rail" aria-labelledby="fn-detail-rail-title">${related}${commerce}</aside>`;
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

export function transformBodyMarkdownMedia(html) {
  return String(html || '').replace(
    /<p>\s*!\[([^\]]*)\]\((https:\/\/[^\s<>"]+)\)\s*<\/p>/gi,
    (_, alt, encodedUrl) => {
      const url = String(encodedUrl || '').replace(/&amp;/g, '&');
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return _;
      } catch { return _; }
      const caption = String(alt || '').trim();
      return `<figure class="fn-article-body-media"><img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" loading="lazy" decoding="async">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
    }
  );
}

export function transformBodyMarkdownLinks(html) {
  return String(html || '').replace(
    /(?<!!)\[([^\]<>]+)\]\s*\((\/(?!\/)[^)\s<>]+|https?:\/\/[^)\s<>]+)\)/gi,
    (source, label, href) => {
      const target = String(href || '').replace(/&amp;/g, '&');
      if (target.startsWith('/')) {
        if (!/^\/[a-z0-9][a-z0-9/_?=&.%~-]*$/i.test(target)) return source;
      } else {
        try {
          const parsed = new URL(target);
          if (!/^https?:$/.test(parsed.protocol)) return source;
        } catch { return source; }
      }
      const text = String(label || '').replace(/&amp;/g, '&').trim();
      return `<a href="${escapeHtml(target)}">${escapeHtml(text)}</a>`;
    }
  );
}

function removeEagerExtras(html) {
  html = html.replace(/\s*<link[^>]+href=["']\/css\/checkoutpopup\.css[^"']*["'][^>]*>/i, '');
  html = html.replace(/\s*<script[^>]+src=["']\/js\/homepage-footer\.js[^"']*["'][^>]*><\/script>/i, '');
  html = html.replace(/\s*<script[^>]+src=["']\/js\/legal-footer\.js[^"']*["'][^>]*><\/script>/i, '');
  html = html.replace(/\s*<section class="feed-collection"[\s\S]*?<\/section>/i, '');
  html = html.replace(/\s*<section class="products"[\s\S]*?<\/section>/i, '');
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

function sizeFinderMarkup() {
  return `<section class="fs-size-finder" id="fs-size-finder" aria-label="F-SPORT Size Finder">
    <div class="fsf-frame">
      <div class="fsf-brandbar"><img src="/assets/brand/fsport-logo.png" alt="F-SPORT" width="2000" height="580"><div class="fsf-brandbar-copy"><strong>F-SPORT Size Finder</strong><span class="fsf-brandbar-tool">Công cụ quy đổi size đa thương hiệu</span></div></div>
      <div class="fsf-layout">
        <div class="fsf-card fsf-form">
          <div class="fsf-segmented" role="tablist" aria-label="Cách nhập thông tin"><button id="fsf-tab-size" class="is-active" type="button" role="tab" aria-selected="true">Theo size đang đi</button><button id="fsf-tab-foot" type="button" role="tab" aria-selected="false">Theo số đo chân</button></div>
          <div id="fsf-size-fields">
            <div class="fsf-step"><span>1</span>Chọn thông tin đôi giày hiện tại</div>
            <div class="fsf-field"><label for="fsf-source-picker">Thương hiệu đôi giày bạn đang sử dụng</label><div class="fsf-source-picker-wrap"><button class="fsf-control fsf-source-picker is-placeholder" id="fsf-source-picker" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="fsf-source-options" aria-describedby="fsf-source-error"><span id="fsf-source-current">—</span></button><div class="fsf-source-options" id="fsf-source-options" role="listbox" hidden></div><select class="fsf-visually-hidden" id="fsf-source-brand" tabindex="-1" aria-hidden="true"></select></div><p id="fsf-source-error" class="fsf-source-error" role="alert" aria-live="polite"></p></div>
            <div class="fsf-field"><label>Hệ size</label><div class="fsf-pills" id="fsf-system-pills"><button type="button" class="is-active" data-fsf-system="EU" aria-pressed="true">Việt Nam (EU)</button><button type="button" data-fsf-system="US" aria-pressed="false">US</button><button type="button" data-fsf-system="UK" aria-pressed="false">UK</button></div></div>
            <div class="fsf-field"><label for="fsf-shoe-size">Size đang đi</label><select class="fsf-control" id="fsf-shoe-size"></select></div>
          </div>
          <div id="fsf-foot-fields" hidden>
            <div class="fsf-step"><span>1</span>Nhập số đo bàn chân</div><div class="fsf-measure-grid"><div class="fsf-field"><label for="fsf-foot-length">Chiều dài chân</label><div class="fsf-unit"><input class="fsf-control" id="fsf-foot-length" type="text" inputmode="decimal" autocomplete="off" placeholder="26,0" aria-describedby="fsf-foot-length-error"><span>cm</span></div><p id="fsf-foot-length-error" class="fsf-field-error" role="alert" aria-live="polite"></p></div><div class="fsf-field"><label for="fsf-foot-width">Chiều ngang <small>không bắt buộc</small></label><div class="fsf-unit"><input class="fsf-control" id="fsf-foot-width" type="text" inputmode="decimal" autocomplete="off" placeholder="10,2"><span>cm</span></div></div></div>
            <button id="fsf-measure-help" class="fsf-help" type="button" aria-expanded="false">Cách đo bàn chân chính xác</button><p id="fsf-measure-text" class="fsf-helptext" hidden><span>Đặt gót chân sát tường, đứng thẳng trên tờ giấy rồi đánh dấu đầu ngón dài nhất.</span><span>Đo cả hai chân và dùng số đo của chân dài hơn. Chiều ngang chỉ dùng để tham khảo độ rộng.</span></p>
          </div>
          <div class="fsf-step"><span>2</span>Chọn giới tính theo bảng hãng</div><div class="fsf-pills fsf-two" id="fsf-gender-pills"><button type="button" class="is-active" data-fsf-gender="men" aria-pressed="true">Nam</button><button type="button" data-fsf-gender="women" aria-pressed="false">Nữ</button></div>
          <div class="fsf-step"><span>3</span>Muốn đổi sang</div><div class="fsf-brand-grid" id="fsf-brand-grid"></div>
          <button id="fsf-submit" class="fsf-submit" type="button">Tìm size phù hợp</button><p id="fsf-error" class="fsf-error" role="alert"></p>
        </div>
        <div class="fsf-card fsf-results" id="fsf-results"><div class="fsf-results-head"><p>Kết quả quy đổi</p><h3 id="fsf-result-title"></h3><span id="fsf-result-sub">Chọn thông tin bên trái để xem đề xuất.</span></div><div id="fsf-output" class="fsf-output"><div class="fsf-empty"><div><i>↗</i><strong>Kết quả sẽ xuất hiện tại đây</strong><p>Bạn sẽ nhận được size đề xuất, công thức quy đổi và sản phẩm B&amp;M đúng với catalog.</p></div></div></div></div>
      </div>
      <div class="fsf-share"><span class="fsf-share-label"><i aria-hidden="true">↗</i>Chia sẻ</span><div class="fsf-share-actions"><button id="fsf-share-copy" type="button" aria-label="Copy link công cụ"><i aria-hidden="true">⧉</i><b>Copy link</b></button><a id="fsf-share-facebook" class="is-facebook" href="#" target="_blank" rel="noopener noreferrer" aria-label="Chia sẻ lên Facebook" title="Facebook"><i aria-hidden="true"><img src="https://cdn.simpleicons.org/facebook/1877F2" alt=""></i><b>Facebook</b></a><button id="fsf-share-instagram" class="is-instagram" type="button" aria-label="Chia sẻ lên Instagram" title="Instagram"><i aria-hidden="true"><img src="https://cdn.simpleicons.org/instagram/E4405F" alt=""></i><b>Instagram</b></button><a id="fsf-share-threads" class="is-threads" href="#" target="_blank" rel="noopener noreferrer" aria-label="Chia sẻ lên Threads" title="Threads"><i aria-hidden="true"><img src="https://cdn.simpleicons.org/threads/000000" alt=""></i><b>Threads</b></a></div><small id="fsf-share-status" role="status" aria-live="polite"></small></div>
      <p class="fsf-disclaimer">Kết quả là gợi ý từ bảng size chính hãng và công thức B&amp;M do F-SPORT áp dụng. Form bàn chân, tất và cảm giác mang có thể làm lựa chọn thực tế khác nhau.</p>
    </div>
  </section>`;
}

function sizeFinderEditorialHtml() {
  return `<div class="body fsf-editorial">
    <h2>Công cụ chuyển đổi size giày dép đa thương hiệu</h2>
    <p>Mỗi thương hiệu có cách xây dựng bảng size riêng, vì vậy cùng một con số EU chưa chắc đại diện cho cùng chiều dài bàn chân. F-SPORT Size Finder giúp bạn đối chiếu nhanh giữa những hệ size phổ biến mà không phải mở nhiều bảng thông số. Bạn có thể chọn thương hiệu và size đôi giày đang mang, hoặc nhập trực tiếp chiều dài bàn chân. Kết quả được trình bày theo định dạng Việt Nam (EU), đồng thời hiển thị bảng size lân cận để người mới dễ đọc và người có kinh nghiệm tiện kiểm tra.</p>
    <p>Công cụ hiện hỗ trợ các thương hiệu quen thuộc như Adidas, Nike, New Balance, ASICS, HOKA, ANTA, Li-Ning, Mizuno, Puma, Skechers và On. Việc quy đổi ưu tiên Foot Length trong bảng hướng dẫn chính hãng; liên kết nguồn được đặt ngay trong kết quả để bạn có thể đối chiếu. Khi một hãng chỉ công bố mã CM/JP mà chưa xác nhận đó là chiều dài bàn chân, công cụ vẫn đưa ra gợi ý theo size EU gần nhất nhưng đánh dấu rõ đây là kết quả tham khảo.</p>
    <h2>Chọn size dép chạy bộ YSandal đúng chuẩn</h2>
    <p>Đối với YSandal B&amp;M Taiwan, từng dòng sản phẩm có quy tắc chọn size riêng. BAL5617 Carbon Version 1, BAL5638 Carbon Version 2, BN68, BCU188, BN520, BCU5206 và BCU5555 thường chọn giảm 1 size; BCU5568 và BCU5560 thường chọn giảm 2 size. Riêng BCU7712 đi bằng size giày thể thao thông thường, người có bàn chân dày có thể cân nhắc tăng 1 size. Công cụ tự xử lý khác biệt này và hiển thị đề xuất riêng trên từng thẻ sản phẩm.</p>
    <figure class="fsf-editorial-cover"><img src="/assets/feed/covers/size-finder/cong-cu-quy-doi-size-da-thuong-hieu-16x9.webp" width="1672" height="941" loading="lazy" decoding="async" alt="Công cụ quy đổi size đa thương hiệu"></figure>
    <p>Để có kết quả tốt hơn, hãy đo cả hai bàn chân vào cuối ngày, đứng thẳng và dùng số đo của chân dài hơn. Chiều ngang chỉ là thông tin tham khảo để nhận biết số đo bất thường hoặc cân nhắc độ ôm; nó không tự động làm thay đổi size khi hãng không có hướng dẫn chính thức. Nếu số đo nằm ngoài khoảng hợp lý, công cụ sẽ yêu cầu kiểm tra lại thay vì trả về một kết quả thiếu an toàn.</p>
    <h2>Từ kết quả chọn size đến sản phẩm phù hợp</h2>
    <p>Sau khi bấm <strong>Tìm size phù hợp</strong>, bạn sẽ thấy size đề xuất và ảnh màu thực tế. Nút <strong>Mua hàng</strong> mở bảng chọn size, màu và số lượng ngay trong công cụ trước khi thêm đúng variant vào giỏ. Danh sách gồm đủ 10 dòng YSandal đang bán: BAL5617, BAL5638, BN68, BCU188, BN520, BCU5206, BCU5555, BCU7712, BCU5568 và BCU5560. Dữ liệu variant được lấy từ catalog F-SPORT để quá trình từ tham khảo size đến mua hàng liền mạch hơn.</p>
  </div>`;
}

function replaceArticleBody(html, replacement) {
  const start = html.indexOf('<div class="body">');
  if (start < 0) return html;
  const candidates = ['<section class="products"', '<section class="feed-collection"', '<a class="back"']
    .map(marker => html.indexOf(marker, start))
    .filter(index => index > start);
  if (!candidates.length) return html;
  return html.slice(0, start) + replacement + html.slice(Math.min(...candidates));
}

function enhanceSizeFinderArticle(html) {
  html = html.replace(/<body([^>]*)>/i, (match, attrs) => /class=/i.test(attrs)
    ? `<body${attrs.replace(/class=(["'])(.*?)\1/i, 'class=$1$2 fs-size-finder-page$1')}>`
    : `<body${attrs} class="fs-size-finder-page">`);
  html = html.replace(/<figure class="media">[\s\S]*?<\/figure>/i, '');
  html = html.replace(/<h1>Chọn Size Dép Chạy Bộ YSandal Đúng Chuẩn: Hướng Dẫn Chi Tiết Cho Người Mới và Chuyên Nghiệp<\/h1>/i, '');
  html = html.replace(/(<article[^>]*>[\s\S]*?<\/header>)/i, `$1${sizeFinderMarkup()}`);
  html = replaceArticleBody(html, sizeFinderEditorialHtml());
  html = html.replace('</head>', '  <link rel="stylesheet" href="/css/fsport-size-finder.css?v=20261030-product-cart-label-11">\n</head>');
  return html.replace('</body>', '  <script src="/js/fsport-size-finder.js?v=20261031-sizefinder-report-12" defer></script>\n</body>');
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
    html = transformBodyMarkdownLinks(transformBodyMarkdownMedia(removeCollectionSchema(removeEagerExtras(transformVideo(html)))));
    if (slug === SIZE_FINDER_SLUG) html = enhanceSizeFinderArticle(html);
    html = html.replace(/<title>([\s\S]*?)(?:\s*\|\s*F-SPORT(?:\s+Play|\s+Feed)?)?<\/title>/i, '<title>$1 | F-SPORT Feed</title>');
    const hub = hubForCategory(related.current && related.current.category);
    html = html.replace(/(<body[^>]*>)/i, `$1${articleHeaderHtml(hub)}`);
    html = html.replace(/<main(\s|>)/i, '<main id="main-content"$1');
    html = html.replace('<div class="brand">F-SPORT</div>', `<nav class="fn-article-breadcrumb" aria-label="Breadcrumb"><a href="/feed">F-SPORT Feed</a><span>›</span><a href="${hub.url}">${hub.label}</a></nav>`);
    const commerceCategory = slug !== SIZE_FINDER_SLUG && related.current && /^(running|pickleball)$/.test(related.current.category)
      ? related.current.category
      : '';
    const detailRail = detailRailHtml(related, commerceCategory);
    if (detailRail) html = html.replace(/(<article[^>]*>[\s\S]*?<\/header>)/i, `$1${detailRail}`);
    const relatedBlock = relatedHtml(related);
    const continuation = `${relatedBlock}<div id="fn-article-after-category" hidden>${latestHtml(related)}<nav class="fn-article-return" aria-label="Quay lại chuyên mục"><a href="${hub.url}">← Trở lại ${escapeHtml(hub.label)}</a><a href="/feed">Trang nhất F-SPORT Feed →</a></nav></div>`;
    html = html.replace(/<a class="back"[^>]*>[\s\S]*?<\/a>/i, continuation);
    html = html.replace(/\s*<time\b[^>]*>[\s\S]*?<\/time>/i, '');
    html = html.replace('</head>', '  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n  <link rel="stylesheet" href="/css/feed-newsroom.css?v=20261030-sticky-back-3">\n  <link rel="stylesheet" href="/css/feed-article.css?v=20261031-sticky-rail-4">\n  <link rel="stylesheet" href="/css/feed-commerce.css?v=20261031-lazy-products-4">\n</head>');
    html = html.replace('</body>', `  <script src="/js/tracking-consent.js?v=20260905-once-delayed-1"></script>\n  <script src="/js/tracking.js?v=20260925-openai-ads-1"></script>\n  <script src="/js/analytics.js?v=20261028-feed-session-2"></script>\n  <script src="/js/feed-commerce.js?v=20261031-lazy-products-4" defer></script>\n  <script src="/js/feed-article.js?v=20261028-feed-content-1" defer></script>\n  <script src="/js/homepage-footer.js?v=20261025-feed-flow-1" defer></script>\n  <script src="/js/legal-footer.js?v=20261024-feed-sync-1" defer></script>\n</body>`);
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
