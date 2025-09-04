/* ==============================
 * FREEFLOW (stable, no-jank)
 *
 * - One-time sort (deterministic)
 * - Append-only when new data arrives
 * - Render by queue (no index drift)
 * - Masonry via CSS columns + aspect-ratio placeholders
 * - Single autoplay IntersectionObserver
 * - Lazy pager via sentinel (no scattered autofill)
 * ============================== */

// ====== CONFIG (override via freeflowInit) ======
let fallbackUrl =
  "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";
const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 phút
const INITIAL_DELAY_MS_DEFAULT = 1000; // 1 giây
const FIRST_BATCH_SIZE = 4;
const BLOCK_SIZE = 8; // nạp nhẹ hơn cho mượt
const FEED_ID = "freeflowFeed";

// ====== State ======
let freeflowData = [];       // mảng item đã có finalPriority
let renderQueue = [];        // hàng đợi itemId theo thứ tự hiển thị
const renderedIds = new Set();
let dataReady = false;
let initialRendered = false;
let pagerObserver = null;
let bootstrapped = false;
let ioAutoplay = null;       // singleton IntersectionObserver cho iframe
let renderLock = false;      // chống render đồng thời

// =================== Cache helpers ===================
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
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (e) {}
}

// =================== Deterministic randomness ===================
function seededHash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededRand01(id) {
  return (seededHash(id) % 1000) / 1000; // 0..0.999
}

// =================== Process & sort (ONE-TIME) ===================
let productCategory = (window.productCategory || "0").toLowerCase();

function processAndSortData(data) {
  const preferred = data
    .filter((it) => (it.productCategory || "").toLowerCase() === productCategory)
    .map((it) => ({
      ...it,
      finalPriority:
        (Number(it.basePriority) || 0) +
        75 +
        Math.floor(seededRand01(it.itemId) * 20),
    }));

  const others = data
    .filter((it) => (it.productCategory || "").toLowerCase() !== productCategory)
    .map((it) => ({
      ...it,
      finalPriority:
        (Number(it.basePriority) || 0) +
        Math.floor(seededRand01(it.itemId) * 20),
    }));

  // Interleave nhẹ rồi sort ổn định theo finalPriority
  function interleaveBalanced(a, b) {
    const result = [];
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if ((result.length % 2 === 0 && i < a.length) || j >= b.length) {
        result.push(a[i++]);
      } else {
        result.push(b[j++]);
      }
    }
    return result;
  }

  const combined = interleaveBalanced(preferred, others)
    .sort((x, y) => y.finalPriority - x.finalPriority);

  freeflowData = combined;
  renderQueue = freeflowData.map((it) => it.itemId);
}

// =================== Append new data (NO resort) ===================
function appendNewItems(newItems) {
  if (!Array.isArray(newItems) || newItems.length === 0) return;

  const known = new Set(freeflowData.map((x) => x.itemId));
  const fresh = newItems.filter((x) => !known.has(x.itemId));
  if (fresh.length === 0) return;

  fresh.forEach((it) => {
    const isPreferred = (it.productCategory || "").toLowerCase() === productCategory;
    it.finalPriority =
      (Number(it.basePriority) || 0) +
      (isPreferred ? 75 : 0) +
      Math.floor(seededRand01(it.itemId) * 20);
  });

  freeflowData.push(...fresh);
  fresh.forEach((it) => renderQueue.push(it.itemId));
}

// =================== DOM Helpers ===================
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

function findItemById(id) {
  // Tìm theo id trong freeflowData (số lượng không quá lớn)
  for (let i = 0; i < freeflowData.length; i++) {
    if (freeflowData[i].itemId === id) return freeflowData[i];
  }
  return null;
}

// =================== Rendering ===================
function renderFeedItem(item, container) {
  if (!item || renderedIds.has(item.itemId)) return;
  renderedIds.add(item.itemId);

  const div = document.createElement("div");
  div.className = `feed-item ${item.contentType || ""}`;

  const titleHtml = item.title
    ? `<h4 class="one-line-title" style="font-size:14px;line-height:1.3;margin:6px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</h4>`
    : "";

  const priceHtml = item.price
    ? `<div class="price-line" style="display:flex;gap:8px;align-items:center;">
         <span class="price" style="color:#f53d2d;font-weight:700;">${Number(item.price).toLocaleString()}đ</span>
         ${
           item.originalPrice > item.price
             ? `<span class="original-price" style="color:#999;text-decoration:line-through;">${Number(
                 item.originalPrice
               ).toLocaleString()}đ</span>`
             : ""
         }
       </div>`
    : "";

  let mediaHtml = "";

  if (item.contentType === "image") {
    const ratio = item.ratio || "3/4"; // có thể khai báo ratio trong JSON
    mediaHtml = `
      <div class="media-box" style="position:relative;aspect-ratio:${ratio};border-radius:8px;overflow:hidden;">
        <img loading="lazy" src="${item.image}" alt="${item.title || ""}"
             style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
      </div>
      ${titleHtml}
      ${priceHtml}
    `;
  } else if (item.contentType === "youtube") {
    // thumbnail che iframe (đã có sẵn ảnh đại diện item.image)
    mediaHtml = `
      <div class="video-wrapper" style="position:relative;border-radius:8px;overflow:hidden;">
        <img class="video-thumb" src="https://fun-sport.co/assets/images/thumb/vid-thumb.webp"
             style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;" />
        <iframe data-video-id="${item.youtube}" src="" frameborder="0"
          allow="autoplay; encrypted-media" allowfullscreen playsinline muted
          style="width:100%;aspect-ratio:9/16;position:relative;z-index:2;border:0;border-radius:8px;">
        </iframe>
        <div class="video-overlay" data-video="${item.youtube}"
          style="position:absolute;inset:0;cursor:pointer;z-index:3;"></div>
      </div>
      <div class="video-info" style="display:flex;align-items:center;gap:8px;padding:4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}"
               style="width:36px;height:36px;object-fit:cover;border-radius:6px;" />
        </a>
        <div style="flex:1;min-width:0;">
          <h4 style="font-size:13px;line-height:1.3;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${item.title || ""}
          </h4>
          ${
            item.price
              ? `<div style="font-size:13px;color:#f53d2d;font-weight:bold;">
                   ${Number(item.price).toLocaleString()}đ
                 </div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  div.innerHTML = mediaHtml;

  // Hành vi click
  if (item.contentType === "image") {
    div.onclick = () => (window.location.href = item.productPage);
  } else if (item.contentType === "youtube") {
    const overlay = div.querySelector(".video-overlay");
    if (overlay) {
      overlay.onclick = () => {
        const id = overlay.getAttribute("data-video");
        const popup = document.getElementById("videoOverlay");
        const frame = document.getElementById("videoFrame");
        if (frame)
          frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
        if (popup) popup.style.display = "flex";
        const viewBtn = document.getElementById("viewProductBtn");
        if (viewBtn) viewBtn.onclick = () => (window.location.href = item.productPage);
      };
    }
  }

  container.appendChild(div);

  // Không gọi autofill ở đây để tránh “bơm trùng”
}

// ▶️ YouTube autoplay (singleton IO)
function ytCmd(iframe, func) {
  try {
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*"
    );
  } catch (e) {}
}
function ytPlay(iframe) { ytCmd(iframe, "playVideo"); }
function ytPause(iframe) { ytCmd(iframe, "pauseVideo"); }

function setupAutoplayObserver() {
  if (!ioAutoplay) {
    ioAutoplay = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const iframe = entry.target;
          const id = iframe.getAttribute("data-video-id");
          if (entry.isIntersecting && !iframe.dataset.inited) {
            const initSrc = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&mute=1&playsinline=1&controls=0&rel=0&origin=${location.origin}`;
            iframe.src = initSrc;
            iframe.dataset.inited = "1";
            const onLoadOnce = () => {
              setTimeout(() => { ytPlay(iframe); }, 50);
              iframe.removeEventListener("load", onLoadOnce);
            };
            iframe.addEventListener("load", onLoadOnce);
            setTimeout(() => { ytPlay(iframe); }, 300);
            return;
          }
          if (entry.isIntersecting) ytPlay(iframe);
          else if (iframe.dataset.inited === "1") ytPause(iframe);
        });
      },
      { threshold: 0.75 }
    );
  }

  // Observe các iframe mới
  document
    .querySelectorAll("iframe[data-video-id]:not([data-observed])")
    .forEach((el) => {
      ioAutoplay.observe(el);
      el.dataset.observed = "1";
    });
}

// =================== Lazy pager (sentinel only) ===================
function renderNextBlock(blockSize = BLOCK_SIZE) {
  if (renderLock) return;
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  renderLock = true;
  try {
    let rendered = 0;
    while (rendered < blockSize && renderQueue.length > 0) {
      const id = renderQueue.shift();
      const item = findItemById(id);
      if (!item || renderedIds.has(id)) continue;
      renderFeedItem(item, container);
      rendered++;
    }

    setupAutoplayObserver();

    if (renderQueue.length === 0 && pagerObserver) {
      pagerObserver.disconnect();
      pagerObserver = null;
    }
  } finally {
    renderLock = false;
  }
}

function setupLazyPager() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;
  const sentinel = ensureSentinel(container);
  if (pagerObserver) pagerObserver.disconnect();

  pagerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) renderNextBlock(BLOCK_SIZE);
      });
    },
    { root: null, rootMargin: "600px 0px", threshold: 0 }
  );

  pagerObserver.observe(sentinel);
}

// =================== Initial render gating ===================
function isNearViewport(el, margin = 800) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top <= vh + margin && rect.bottom >= -margin;
}

function renderInitialAndStartPager() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  let rendered = 0;
  while (rendered < FIRST_BATCH_SIZE && renderQueue.length > 0) {
    const id = renderQueue.shift();
    const item = findItemById(id);
    if (!item || renderedIds.has(id)) continue;
    renderFeedItem(item, container);
    rendered++;
  }

  setupAutoplayObserver();
  setupLazyPager();
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

// =================== Data fetching ===================
async function fetchFreeFlowData(sheetUrlOverride) {
  if (sheetUrlOverride) fallbackUrl = sheetUrlOverride; // cho loader override

  // 1) Từ cache
  const cached = loadCachedFreeFlow();
  if (cached) {
    processAndSortData(cached); // ONE-TIME sort
    dataReady = true;
    maybeStartRender();
  }

  // 2) Từ local JSON
  try {
    const res = await fetch("/json/freeflow.json");
    const localData = await res.json();
    const validData = Array.isArray(localData) ? localData : [];
    processAndSortData(validData); // ONE-TIME (ghi đè thứ tự cache trước khi render nếu có)
    saveCache(validData);
    dataReady = true;
    maybeStartRender();

    // 3) Bổ sung Google Sheet (append-only)
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

    // Chỉ append phần mới so với existingData (lấy theo itemId)
    const existingIds = new Set((existingData || []).map((i) => i.itemId));
    const newItems = sheetData.filter((i) => !existingIds.has(i.itemId));

    if (newItems.length > 0) {
      appendNewItems(newItems);
      saveCache(freeflowData);
      dataReady = true;
      if (!initialRendered) {
        maybeStartRender();
      }
      // Không autofill ở đây để tránh “bơm trùng” — sentinel sẽ xử lý.
    }
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

// =================== Bootstrap & UI bindings ===================
function bindClosePopup() {
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn)
    closeBtn.onclick = () => {
      const popup = document.getElementById("videoOverlay");
      const frame = document.getElementById("videoFrame");
      if (popup) popup.style.display = "none";
      if (frame) frame.src = "";
    };
}

function observeFeedApproach() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;
  const io = new IntersectionObserver(
    () => {
      maybeStartRender();
    },
    { root: null, rootMargin: "800px 0px", threshold: 0 }
  );
  io.observe(container);
}

/**
 * Bootstrap UI & (optionally) start fetching
 * options:
 * - sheetUrl: string (override Google Sheet URL)
 * - startNow: boolean (bắt đầu fetch ngay, bỏ delay 1s)
 * - initialDelayMs: number (ms) (mặc định 1000)
 */
function bootstrapFreeflow(options = {}) {
  if (bootstrapped) return; // tránh gắn 2 lần
  bootstrapped = true;

  if (options.sheetUrl) fallbackUrl = options.sheetUrl;

  bindClosePopup();
  observeFeedApproach();

  const delay = options.startNow
    ? 0
    : options.initialDelayMs ?? INITIAL_DELAY_MS_DEFAULT;

  setTimeout(() => {
    fetchFreeFlowData();
  }, delay);

  // Fallback nếu IO bị miss
  setTimeout(() => {
    maybeStartRender();
  }, 5000);
}

// ✅ Public API cho loader
window.freeflowInit = bootstrapFreeflow;
// ✅ Tương thích loader cũ
window.fetchFreeFlowData = fetchFreeFlowData;

// ✅ Auto-bootstrap nếu file được nhúng trực tiếp (không qua loader)
(function autoBootstrapIfNeeded() {
  const tryStart = () => {
    if (bootstrapped) return;
    if (document.getElementById(FEED_ID)) {
      bootstrapFreeflow(); // dùng delay mặc định 1s
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(tryStart, 0));
  } else {
    setTimeout(tryStart, 0);
  }
})();

// ✅ Safari back-forward cache: reload để dọn iframe/observer treo
window.addEventListener("pageshow", function (event) {
  try {
    const nav = performance.getEntriesByType("navigation")[0];
    if (event.persisted || nav?.type === "back_forward") {
      location.reload();
    }
  } catch (e) {}
});
