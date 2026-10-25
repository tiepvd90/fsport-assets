const SUPABASE_URL = 'https://xcigbbcpwfzluqazadez.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function parseImages(value) {
  let images = value;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = []; }
  }
  if (!Array.isArray(images)) return [];
  return images.map(image => typeof image === 'string' ? image : image && image.url).filter(Boolean);
}

function label(post) {
  if (post.category === 'pickleball') return 'Pickleball';
  if (post.category === 'ysandal' || post.category === 'running') return 'Chạy bộ';
  if (post.category === 'badminton') return 'Cầu lông';
  if (post.category === 'football') return 'Bóng đá';
  if (post.category === 'tennis') return 'Tennis';
  if (post.category === 'basketball') return 'Bóng rổ';
  if (post.category === 'fitness') return 'Fitness';
  return 'Thể thao';
}

function dateText(value) {
  if (!value) return '';
  try { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(value)); }
  catch { return ''; }
}

function storyHtml(post, side) {
  const image = parseImages(post.images)[0] || (post.video_id ? `https://img.youtube.com/vi/${encodeURIComponent(post.video_id)}/hqdefault.jpg` : '');
  const heading = side ? 'h3' : 'h2';
  const classes = `${side ? 'fn-side-story' : 'fn-hero'}${post.video_id ? ' fn-is-video' : ''}`;
  return `<a class="${classes}" href="/feed/${encodeURIComponent(post.slug)}" data-story-id="${escapeHtml(post.id)}" data-slug="${escapeHtml(post.slug)}" data-section="lead">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" width="1600" height="900" loading="${side ? 'lazy' : 'eager'}" fetchpriority="${side ? 'low' : 'high'}" decoding="async">` : ''}<span class="fn-story-shade"></span><div class="fn-story-copy"><span class="fn-label">${escapeHtml(label(post))}</span><${heading}>${escapeHtml(post.title)}</${heading}><div class="fn-story-meta"><span>${escapeHtml(dateText(post.published_at))}</span>${post.video_id ? '<span>Video</span>' : ''}</div></div></a>`;
}

async function fetchLead() {
  const baseParams = {
    status: 'eq.published',
    is_feed_visible: 'eq.true',
    select: 'id,slug,title,content_type,category,images,video_id,tags,published_at,feed_order_at',
    order: 'feed_order_at.desc.nullslast,published_at.desc.nullslast,id.desc',
  };
  const headers = { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, Accept: 'application/json' };
  const load = async extra => {
    const params = new URLSearchParams({ ...baseParams, ...extra });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/feed_posts?${params}`, { headers });
    if (!response.ok) return [];
    const rows = await response.json();
    return (Array.isArray(rows) ? rows : []).filter(post => post.slug && post.title && (parseImages(post.images)[0] || post.video_id));
  };
  const [selectedRows, newestRows] = await Promise.all([
    load({ tags: 'cs.["home-hot"]', limit: '5' }),
    load({ limit: '32' })
  ]);
  const position = post => {
    const tags = Array.isArray(post.tags) ? post.tags : [];
    for (let index = 1; index <= 5; index += 1) if (tags.includes(`home-hot-${index}`)) return index;
    return 99;
  };
  const selected = selectedRows.slice().sort((a, b) => position(a) - position(b));
  const selectedIds = new Set(selected.map(post => post.id));
  const fallbackRows = newestRows.filter(post => !selectedIds.has(post.id));
  const fallback = fallbackRows.filter(post => !post.video_id).concat(fallbackRows.filter(post => !!post.video_id));
  return selected.concat(fallback).slice(0, 5);
}

export async function onRequest(context) {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return context.env.ASSETS.fetch(context.request);
  }
  // Use a non-HTML asset path so Pages clean URLs cannot route this internal
  // shell request back through the /feed Function.
  const assetUrl = new URL('/feed/feed-shell.txt', context.request.url);
  const [asset, posts] = await Promise.all([
    context.env.ASSETS.fetch(new Request(assetUrl, context.request)),
    context.request.method === 'HEAD' ? Promise.resolve([]) : fetchLead()
  ]);
  if (context.request.method === 'HEAD') {
    const headers = new Headers(asset.headers);
    headers.delete('content-length'); headers.delete('content-encoding'); headers.delete('etag');
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=120, s-maxage=600');
    return new Response(null, { status: asset.status, headers });
  }
  if (!asset.ok || !posts.length) return asset;
  let html = await asset.text();
  const lead = `<section id="fn-lead" class="fn-lead-grid" aria-label="Bài nổi bật" aria-busy="false">${storyHtml(posts[0], false)}<div class="fn-lead-side">${posts.slice(1).map(post => storyHtml(post, true)).join('')}</div></section>`;
  html = html.replace(/<section id="fn-lead"[\s\S]*?<\/section>/i, lead);
  const headers = new Headers(asset.headers);
  headers.delete('content-length'); headers.delete('content-encoding'); headers.delete('etag');
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=120, s-maxage=600');
  return new Response(html, { status: 200, headers });
}
