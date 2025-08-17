/* ============================== *
 *        FREEFLOW vNEW           *
 *  Lazy gate + paging + 10:1     *
 *  90% viewport autoplay         *
 * ============================== */

/** CONFIG */
const CONFIG = {
  CACHE_KEY: "freeflowCache",
  CACHE_DURATION_MS: 30 * 60 * 1000,

  // Data & render
  PAGE_SIZE: 24,           // số item mỗi "trang" feed
  CHUNK_SIZE: 12,          // số item render mỗi đợt (nhàn rỗi)
  VIDEO_RATIO: 10,         // 10 ảnh : 1 video
  MAX_VIDEOS_PER_PAGE: 3,  // giới hạn video/trang

  // Gate & paging triggers
  FEED_ENTER_ROOT_MARGIN: "1200px 0px", // prefetch trước khi feed chạm viewport
  NEXT_PAGE_ROOT_MARGIN: "800px 0px",   // nạp trang tiếp trước khi chạm đáy

  // Autoplay
  AUTOPLAY_INIT_THRESHOLD: 0.2, // lúc gán src lần đầu (để player kịp sẵn sàng)
  AUTOPLAY_THRESHOLD: 0.9,      // phát khi ≥90% trong viewport
  AUTOPLAY_ROOT_MARGIN: "0px",

  // Sources
  LOCAL_JSON: "/json/freeflow.json",
  SHEET_URL: "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec",
};

/** STATE */
let productCategory = window.productCategory || "0";
let renderedIds = new Set();

let pages = [];               // mảng các trang (mỗi trang là mảng item)
let currentPage = 0;          // chỉ số trang đã render xong
let dataLoaded = false;       // đã load dữ liệu đợt đầu chưa
let gateObserver = null;      // observer cho sentinel gate trước #freeflowFeed
let sentinelObserver = null;  // observer cho sentinel đáy để nạp trang

// Autoplay observers
let initObserver = null;      // gán src lần đầu khi ~0.2
let playObserver = null;      // play/pause khi vượt ngưỡng 0.9

// Abort fetch nếu rời trang
let localFetchAbort = null;
let sheetFetchAbort = null;

/* -------------------- UTIL: Cache -------------------- */
function loadCached() {
  try {
    const cached = JSON.parse(localStorage.getItem(CONFIG.CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION_MS) {
      return Array.isArray(cached.data) ? cached.data : [];
    }
  } catch (_) {}
  return [];
}

function saveCache(data) {
  try {
    const payload = { timestamp: Date.now(), data };
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

/* -------------------- DATA PIPELINE -------------------- *
 *  - Rank theo ưu tiên (category + basePriority + ngẫu nhiên nhỏ)
 *  - Mix tỷ lệ 10 ảnh : 1 video (bỏ video dư)
 *  - Paginate + cap MAX_VIDEOS_PER_PAGE
 */
function rankAndMix(raw) {
  const rnd = () => Math.floor(Math.random() * 20) + 1;

  const preferred = [];
  const others = [];

  for (const it of raw) {
    const z = { ...it };
    z.finalPriority = (z.basePriority || 0) + rnd() + (z.productCategory === productCategory ? 75 : 0);
    if (z.productCategory === productCategory) preferred.push(z);
    else others.push(z);
  }

  // Trộn xen kẽ preferred/others theo priority
  preferred.sort((a, b) => b.finalPriority - a.finalPriority);
  others.sort((a, b) => b.finalPriority - a.finalPriority);

  const combined = [];
  let i = 0, j = 0;
  const total = preferred.length + others.length;
  for (let k = 0; k < total; k++) {
    if ((k % 2 === 0 && i < preferred.length) || j >= others.length) combined.push(preferred[i++]);
    else combined.push(others[j++]);
  }

  // Chia images/videos
  const images = combined.filter(x => x.contentType === "image");
  const videos = combined.filter(x => x.contentType === "youtube");

  // Mix theo VIDEO_RATIO (ví dụ 10 ảnh : 1 video), video dư bỏ luôn
  const mixed = [];
  let imgIdx = 0, vidIdx = 0;
  while (imgIdx < images.length) {
    for (let c = 0; c < CONFIG.VIDEO_RATIO && imgIdx < images.length; c++) mixed.push(images[imgIdx++]);
    if (vidIdx < videos.length) mixed.push(videos[vidIdx++]); // chỉ thêm 1 video mỗi block 10 ảnh
  }

  // Fallback: nếu không có ảnh mà có video, vẫn cho hiện một ít video để feed không rỗng
  if (mixed.length === 0 && videos.length) {
    const keep = Math.min(videos.length, CONFIG.MAX_VIDEOS_PER_PAGE);
    for (let v = 0; v < keep; v++) mixed.push(videos[v]);
  }

  return mixed;
}

function reorderForMasonry(arr, columns = 2) {
  const rows = Math.ceil(arr.length / columns);
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const idx = c * rows + r;
      if (idx < arr.length) out.push(arr[idx]);
    }
  }
  return out;
}

function paginateWithVideoCap(mixed) {
  const pagesOut = [];
  let page = [];
  let videosInPage = 0;

  const pushPage = () => {
    if (!page.length) return;
    pagesOut.push(reorderForMasonry(page, 2));
    page = [];
    videosInPage = 0;
  };

  for (const item of mixed) {
    if (page.length >= CONFIG.PAGE_SIZE) pushPage();

    if (item.contentType === "youtube") {
      if (videosInPage >= CONFIG.MAX_VIDEOS_PER_PAGE) continue; // bỏ video thừa trong trang
      page.push(item);
      videosInPage++;
    } else {
      page.push(item);
    }
  }
  pushPage();
  return pagesOut;
}

/* -------------------- FETCHERS -------------------- */
async function fetchLocalJSON() {
  localFetchAbort?.abort();
  localFetchAbort = new AbortController();

  const res = await fetch(CONFIG.LOCAL_JSON, { signal: localFetchAbort.signal });
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

async function fetchGoogleSheet() {
  sheetFetchAbort?.abort();
  sheetFetchAbort = new AbortController();

  const res = await fetch(CONFIG.SHEET_URL, { signal: sheetFetchAbort.signal });
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

/* -------------------- RENDERING (chunk) -------------------- */
function renderItem(item, container) {
  if (!item || renderedIds.has(item.itemId)) return; // chống trùng & null-check
  renderedIds.add(item.itemId);

  const div = document.createElement("div");
  div.className = `feed-item ${item.contentType || ""}`;

  if (item.contentType === "image") {
    div.innerHTML = `
      <img loading="lazy" decoding="async"
           src="${item.image}" alt="${item.title || ""}"
           style="width:100%; aspect-ratio: 9/16; object-fit: cover; border-radius:8px;" />
      ${item.title ? `<h4 class="one-line-title">${item.title}</h4>` : ""}
      ${item.price ? `
        <div class="price-line">
          <span class="price">${Number(item.price).toLocaleString()}đ</span>
          ${item.originalPrice > item.price ? `<span class="original-price">${Number(item.originalPrice).toLocaleString()}đ</span>` : ""}
        </div>` : ""}
    `;
    div.addEventListener("click", () => (window.location.href = item.productPage), { passive: true });
  } else {
    // youtube
    div.innerHTML = `
      <div class="video-wrapper" style="position:relative;">
        <img class="video-thumb" src="https://fun-sport.co/assets/images/thumb/vid-thumb.webp"
             style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:8px; z-index:1;" />
        <iframe
          data-video-id="${item.youtube}"
          data-observed="0"
          data-inited="0"
          src=""
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          playsinline
          muted
          style="width:100%; aspect-ratio:9/16; border-radius:8px; position:relative; z-index:2; pointer-events:none;">
        </iframe>
        <div class="video-overlay" data-video="${item.youtube}"
             style="position:absolute; inset:0; cursor:pointer; z-index:3;"></div>
      </div>
      <div class="video-info" style="display:flex; align-items:center; gap:8px; padding:4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}" style="width:36px; height:36px; object-fit:cover; border-radius:6px;" />
        </a>
        <div style="flex:1; min-width:0;">
          <h4 style="font-size:13px; line-height:1.3; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${item.title || ""}
          </h4>
          ${item.price ? `<div style="font-size:13px; color:#f53d2d; font-weight:bold;">${Number(item.price).toLocaleString()}đ</div>` : ""}
        </div>
      </div>
    `;
    // mở popup có âm thanh
    const overlay = div.querySelector(".video-overlay");
    overlay.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const id = overlay.getAttribute("data-video");
      const popup = document.getElementById("videoOverlay");
      const frame = document.getElementById("videoFrame");
      if (frame) frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1&rel=0`;
      if (popup) popup.style.display = "flex";
      const viewBtn = document.getElementById("viewProductBtn");
      if (viewBtn) viewBtn.onclick = () => (window.location.href = item.productPage);
    }, { passive: true });
  }

  container.appendChild(div);
}

function renderPageByChunk(pageItems, container, done) {
  const total = pageItems.length;
  let start = 0;
  const CHUNK = CONFIG.CHUNK_SIZE;

  const step = () => {
    const end = Math.min(start + CHUNK, total);
    for (let i = start; i < end; i++) renderItem(pageItems[i], container);
    // gắn observers cho iframes mới
    attachVideoObservers(container);
    start = end;

    if (start < total) {
      if (window.requestIdleCallback) {
        requestIdleCallback(step, { timeout: 500 });
      } else {
        setTimeout(step, 50);
      }
    } else {
      done && done();
    }
  };

  // bắt đầu khi rảnh để không chặn TTI
  if (window.requestIdleCallback) {
    requestIdleCallback(step, { timeout: 500 });
  } else {
    setTimeout(step, 50);
  }
}

/* -------------------- AUTOPLAY (postMessage) -------------------- */
function ytCmd(iframe, func) {
  try {
    iframe.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
  } catch (_) {}
}
function ytPlay(iframe) { ytCmd(iframe, "playVideo"); }
function ytPause(iframe) { ytCmd(iframe, "pauseVideo"); }

function ensureInitObserver() {
  if (initObserver) return;
  initObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const iframe = entry.target;
      if (iframe.dataset.inited === "1") { initObserver.unobserve(iframe); return; }
      if (entry.isIntersecting && entry.intersectionRatio >= CONFIG.AUTOPLAY_INIT_THRESHOLD) {
        const id = iframe.getAttribute("data-video-id");
        const initSrc =
          `https://www.youtube.com/embed/${id}` +
          `?enablejsapi=1&autoplay=0&mute=1&playsinline=1&controls=0&rel=0&origin=${location.origin}`;
        iframe.src = initSrc;
        iframe.dataset.inited = "1";
        iframe.addEventListener("load", function onLoadOnce() {
          iframe.removeEventListener("load", onLoadOnce);
        });
        initObserver.unobserve(iframe);
      }
    });
  }, {
    threshold: [0, 0.1, 0.2, 0.3],
    rootMargin: CONFIG.AUTOPLAY_ROOT_MARGIN
  });
}

function ensurePlayObserver() {
  if (playObserver) return;

  function pauseOthers(active) {
    document.querySelectorAll('iframe[data-video-id][data
