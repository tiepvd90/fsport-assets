/* ============================== *
 *   FREEFLOW (stable ordering)   *
 *  Placeholders + slot rendering *
 *  1–10 random, strong cat boost *
 *  10 images : 1 video           *
 * ============================== */

/* ====== CONFIG (override via freeflowInit) ====== */
let fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";
const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 phút
const INITIAL_DELAY_MS_DEFAULT = 1000;    // 1 giây
const FIRST_BATCH_SIZE = 4;
const BLOCK_SIZE = 12;
const FEED_ID = "freeflowFeed";
const CAT_BOOST = 75; // giữ nguyên như bản cũ (có thể tăng nếu muốn “đè” mạnh hơn)

/* ====== State ====== */
let freeflowData = [];
let itemsLoaded = 0;
let renderedIds = new Set();
let productCategory = (window.productCategory ?? "0").toString().trim().toLowerCase();

let dataReady = false;
let initialRendered = false;
let pagerObserver = null;
let bootstrapped = false;
let scrollTick = null;

// map: itemId -> slot index (giữ vị trí cố định trong DOM)
let positionById = Object.create(null);

/* =================== Helpers =================== */
function loadCachedFreeFlow() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }
  } catch (e) {}
  return null;
}
function saveCache(data) {
  const payload = { timestamp: Date.now(), data };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}
function normCat(val) {
  return (val ?? "").toString().trim().toLowerCase();
}
function random10() {
  // 1..10
  return Math.floor(Math.random() * 10) + 1;
}

/* =================== Process & sort =================== */
function processAndSortData(data) {
  // Chuẩn hóa category hiện tại
  productCategory = normCat(window.productCategory ?? productCategory);

  // Tính finalPriority (giảm random còn 1..10)
  const preferred = data
    .filter(item => normCat(item.productCategory) === productCategory)
    .map(item => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random10() + CAT_BOOST
    }));

  const others = data
    .filter(item => normCat(item.productCategory) !== productCategory)
    .map(item => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random10()
    }));

  // Trộn nhóm (có thể bỏ interleave nếu muốn ưu tiên thuần)
  function interleaveBalanced(a, b) {
    const result = [];
    let i = 0, j = 0;
    const total = a.length + b.length;
    for (let k = 0; k < total; k++) {
      if ((k % 2 === 0 && i < a.length) || j >= b.length) result.push(a[i++]);
      else result.push(b[j++]);
    }
    return result;
  }

  const combined = interleaveBalanced(preferred, others)
    .sort((x, y) =>
      (y.finalPriority - x.finalPriority) ||
      ((y.basePriority || 0) - (x.basePriority || 0)) ||
      (x.title || "").localeCompare(y.title || "") ||
      (x.itemId || "").localeCompare(y.itemId || "")
    );

  // 10 ảnh : 1 video
  const images = combined.filter(i => i.contentType === "image");
  const videos = combined.filter(i => i.contentType === "youtube");

  const mixed = [];
  let imgIndex = 0, vidIndex = 0;
  while (imgIndex < images.length) {
    let added = 0;
    while (imgIndex < images.length && added < 10) {
      mixed.push(images[imgIndex++]);
      added++;
    }
    if (added === 10 && vidIndex < videos.length) mixed.push(videos[vidIndex++]);
  }

  // Không reorder nữa để giữ đúng thứ tự ưu tiên
  freeflowData = mixed;

  // Map vị trí cố định theo slot
  positionById = Object.create(null);
  freeflowData.forEach((item, idx) => { positionById[item.itemId] = idx; });
}

/* =================== Placeholders =================== */
function ensurePlaceholders() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  // Nếu đã có đủ placeholder rồi thì bỏ qua
  if (container.dataset.placeholders === "1" && container.children.length >= freeflowData.length) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < freeflowData.length; i++) {
    const ph = document.createElement("div");
    ph.className = "feed-item placeholder";
    ph.dataset.slot = i.toString();
    ph.innerHTML = `<span class="skeleton"></span>`;
    frag.appendChild(ph);
  }
  container.innerHTML = "";
  container.appendChild(frag);
  container.dataset.placeholders = "1";
}

/* =================== Rendering =================== */
function buildMediaHtml(item) {
  if (item.contentType === "image") {
    return `
      <img loading="lazy" src="${item.image}" alt="${item.title || ""}" />
      ${item.title ? `<h4 class="one-line-title">${item.title}</h4>` : ""}
      ${item.price ? `
        <div class="price-line">
          <span class="price">${Number(item.price).toLocaleString()}đ</span>
          ${item.originalPrice > item.price ? `<span class="original-price">${Number(item.originalPrice).toLocaleString()}đ</span>` : ""}
        </div>` : ""}
    `;
  }
  if (item.contentType === "youtube") {
    return `
      <div class="video-wrapper" style="position: relative;">
        <img class="video-thumb" src="https://fun-sport.co/assets/images/thumb/vid-thumb.webp"
             style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 8px; z-index: 1;" />
        <iframe
          data-video-id="${item.youtube}"
          src=""
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          playsinline
          muted
          style="width: 100%; aspect-ratio: 9/16; border-radius: 8px; position: relative; z-index: 2;">
        </iframe>
        <div class="video-overlay" data-video="${item.youtube}" style="position: absolute; inset: 0; cursor: pointer; z-index: 3;"></div>
      </div>
      <div class="video-info" style="display: flex; align-items: center; gap: 8px; padding: 4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px;" />
        </a>
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 13px; line-height: 1.3; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.title || ""}
          </h4>
          ${item.price ? `<div style="font-size: 13px; color: #f53d2d; font-weight: bold;">${Number(item.price).toLocaleString()}đ</div>` : ""}
        </div>
      </div>
    `;
  }
  return "";
}

function renderFeedItemToSlot(item) {
  if (renderedIds.has(item.itemId)) return;
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  const idx = positionById[item.itemId];
  const slot = container.querySelector(`.feed-item.placeholder[data-slot="${idx}"]`);
  if (!slot) return;

  const div = document.createElement("div");
  div.className = `feed-item ${item.contentType || ""}`;
  div.innerHTML = buildMediaHtml(item);

  // gắn hành vi
  if (item.contentType === "image") {
    div.onclick = () => { window.location.href = item.productPage; };
  } else if (item.contentType === "youtube") {
    setTimeout(() => {
      const overlay = div.querySelector(".video-overlay");
      if (overlay) {
        overlay.onclick = () => {
          const id = overlay.getAttribute("data-video");
          const popup = document.getElementById("videoOverlay");
          const frame = document.getElementById("videoFrame");
          if (frame) frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
          if (popup) popup.style.display = "flex";
          const viewBtn = document.getElementById("viewProductBtn");
          if (viewBtn) viewBtn.onclick = () => window.location.href = item.productPage;
        };
      }
    }, 0);
  }

  // thay placeholder bằng item thực
  container.replaceChild(div, slot);
  renderedIds.add(item.itemId);

  // ảnh load xong → autofill để lấp viewport
  if (item.contentType === "image") {
    const img = div.querySelector("img");
    if (img) {
      const onDone = () => { setTimeout(() => { autofillToViewport(); }, 20); };
      if (img.complete) onDone();
      else {
        img.addEventListener("load", onDone, { once: true });
        img.addEventListener("error", onDone, { once: true });
      }
    }
  }
}

/* =================== YouTube autoplay (GIỮ NGUYÊN) =================== */
function ytCmd(iframe, func) {
  try {
    iframe.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
  } catch (e) {}
}
function ytPlay(iframe) { ytCmd(iframe, "playVideo"); }
function ytPause(iframe) { ytCmd(iframe, "pauseVideo"); }
function setupAutoplayObserver() {
  const iframes = document.querySelectorAll('iframe[data-video-id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const iframe = entry.target;
      const id = iframe.getAttribute('data-video-id');

      if (entry.isIntersecting && !iframe.dataset.inited) {
        const initSrc = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&mute=1&playsinline=1&controls=0&rel=0&origin=${location.origin}`;
        iframe.src = initSrc;
        iframe.dataset.inited = "1";
        const onLoadOnce = () => { setTimeout(() => { ytPlay(iframe); }, 50); iframe.removeEventListener("load", onLoadOnce); };
        iframe.addEventListener("load", onLoadOnce);
        setTimeout(() => { ytPlay(iframe); }, 300);
        return;
      }
      if (entry.isIntersecting) ytPlay(iframe);
      else if (iframe.dataset.inited === "1") ytPause(iframe);
    });
  }, { threshold: 0.75 });
  iframes.forEach(iframe => observer.observe(iframe));
}

/* =================== Lazy pager =================== */
function ensureSentinel(container) {
  let sentinel = document.getElementById("freeflowSentinel");
  if (!sentinel) {
    sentinel = document.createElement("div");
    sentinel.id = "freeflowSentinel";
    sentinel.style.width = "100%";
    sentinel.style.height = "1px";
    sentinel.style.opacity = "0";
    container.appendChild(sentinel);
  }
  return sentinel;
}

function renderNextBlock(blockSize = BLOCK_SIZE) {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  const slice = freeflowData.slice(itemsLoaded, itemsLoaded + blockSize);
  slice.forEach(item => renderFeedItemToSlot(item));
  itemsLoaded += slice.length;

  setupAutoplayObserver();

  if (itemsLoaded >= freeflowData.length && pagerObserver) {
    pagerObserver.disconnect();
    pagerObserver = null;
  } else {
    setTimeout(() => { autofillToViewport(); }, 30);
  }
}

function setupLazyPager() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  const sentinel = ensureSentinel(container);
  if (pagerObserver) pagerObserver.disconnect();

  pagerObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) renderNextBlock(BLOCK_SIZE);
    });
  }, { root: null, rootMargin: "800px 0px", threshold: 0 });

  pagerObserver.observe(sentinel);
  setTimeout(() => { autofillToViewport(); }, 30);
}

/* =================== Auto-fill helpers =================== */
function nearBottom(offset = 900) {
  const doc = document.documentElement;
  const scrollY = window.scrollY || doc.scrollTop || 0;
  const vh = window.innerHeight || doc.clientHeight || 0;
  const docH = Math.max(
    doc.scrollHeight, doc.offsetHeight, doc.clientHeight,
    document.body?.scrollHeight || 0,
    document.body?.offsetHeight || 0
  );
  return (scrollY + vh) >= (docH - offset);
}

function autofillToViewport(maxPasses = 3) {
  let passes = 0;
  while (
    passes < maxPasses &&
    itemsLoaded < freeflowData.length &&
    nearBottom(900)
  ) {
    renderNextBlock(BLOCK_SIZE);
    passes++;
  }
}

/* =================== Kick & gating =================== */
function isNearViewport(el, margin = 800) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top <= vh + margin && rect.bottom >= -margin;
}

function renderInitialAndStartPager() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  // tạo placeholder TRƯỚC khi render
  ensurePlaceholders();

  const firstBatch = freeflowData.slice(0, FIRST_BATCH_SIZE);
  firstBatch.forEach(item => renderFeedItemToSlot(item));
  itemsLoaded = Math.min(FIRST_BATCH_SIZE, freeflowData.length);

  setupAutoplayObserver();
  setupLazyPager();
  setTimeout(() => { autofillToViewport(); }, 30);
}

function maybeStartRender() {
  if (initialRendered) return;
  const container = document.getElementById(FEED_ID);
  if (!container) return;
  if (dataReady && isNearViewport(container, 800)) {
    initialRendered = true;
    renderInitialAndStartPager();
  }
}

/* =================== Data fetching =================== */
async function fetchFreeFlowData(sheetUrlOverride) {
  if (sheetUrlOverride) fallbackUrl = sheetUrlOverride;

  const cached = loadCachedFreeFlow();
  if (cached) {
    processAndSortData(cached);
    dataReady = true;
    ensurePlaceholders();
    maybeStartRender();
  }

  try {
    const res = await fetch("/json/freeflow.json");
    const localData = await res.json();
    const validData = Array.isArray(localData) ? localData : [];

    processAndSortData(validData);
    saveCache(validData);
    dataReady = true;
    ensurePlaceholders();
    maybeStartRender();

    fetchFromGoogleSheet(validData);
  } catch (e) {
    console.warn("Lỗi khi tải local JSON:", e);
    fetchFromGoogleSheet([]);
  }
}

async function fetchFromGoogleSheet(existingData) {
  try {
    const res = await fetch(fallbackUrl);
    const sheetData = await res.json();
    if (!Array.isArray(sheetData)) return;

    const existingIds = new Set(existingData.map(i => i.itemId));
    const newItems = sheetData.filter(i => !existingIds.has(i.itemId));
    if (newItems.length === 0) return;

    const combined = [...existingData, ...newItems];
    processAndSortData(combined);
    saveCache(combined);
    dataReady = true;

    ensurePlaceholders();
    if (!initialRendered) maybeStartRender();
    else setTimeout(() => { autofillToViewport(); }, 30);
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

/* =================== Bootstrap (works with loader) =================== */
function bindClosePopup() {
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) closeBtn.onclick = () => {
    const popup = document.getElementById("videoOverlay");
    const frame = document.getElementById("videoFrame");
    if (popup) popup.style.display = "none";
    if (frame) frame.src = "";
  };
}

function observeFeedApproach() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;
  const io = new IntersectionObserver(() => { maybeStartRender(); }, { root: null, rootMargin: "800px 0px", threshold: 0 });
  io.observe(container);
}

function attachScrollAutofill() {
  window.addEventListener('scroll', () => {
    if (!initialRendered) return;
    if (scrollTick) return;
    scrollTick = setTimeout(() => {
      scrollTick = null;
      autofillToViewport();
    }, 120);
  }, { passive: true });
}

/**
 * Bootstrap UI & (optionally) start fetching
 * options:
 *  - sheetUrl: string (override Google Sheet URL)
 *  - startNow: boolean (bắt đầu fetch ngay, bỏ delay 1s)
 *  - initialDelayMs: number (ms) (mặc định 1000)
 */
function bootstrapFreeflow(options = {}) {
  if (bootstrapped) return;
  bootstrapped = true;

  if (options.sheetUrl) fallbackUrl = options.sheetUrl;

  // Cập nhật lại productCategory nếu trang set sau
  productCategory = normCat(window.productCategory ?? productCategory);

  bindClosePopup();
  observeFeedApproach();
  attachScrollAutofill();

  const delay = options.startNow ? 0 : (options.initialDelayMs ?? INITIAL_DELAY_MS_DEFAULT);
  setTimeout(() => { fetchFreeFlowData(); }, delay);

  // Fallback nếu IO bị miss
  setTimeout(() => { maybeStartRender(); }, 5000);
}

/* ✅ Public API cho loader */
window.freeflowInit = bootstrapFreeflow;
window.fetchFreeFlowData = fetchFreeFlowData;

/* ✅ Auto-bootstrap nếu được nhúng trực tiếp và DOM đã sẵn */
(function autoBootstrapIfNeeded() {
  const tryStart = () => {
    if (bootstrapped) return;
    if (document.getElementById(FEED_ID)) {
      bootstrapFreeflow(); // delay mặc định 1s
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(tryStart, 0));
  } else {
    setTimeout(tryStart, 0);
  }
})();

/* ✅ Safari back-forward cache: reload lại để đảm bảo init đúng */
window.addEventListener("pageshow", function (event) {
  if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
    location.reload();
  }
});
