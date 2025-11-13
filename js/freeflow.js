/* =============================================
   FREEFLOW v7.1 — NO ART / NO GALLERY
   ------------------------------------------------
   ✓ Không chứa logic ART
   ✓ Không load /css/art.css
   ✓ Không fetch /json/art/index.json
   ✓ FREEFLOW load xong → bắn event "freeflowReady" (1 lần)
   ✓ Sau freeflowReady → load /js/collection-grid.js (1 lần)
   ✓ Tự khai báo window.collectionList
   ============================================= */

// -------------- CONFIG ----------------
let fallbackUrl =
  "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";

const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 phút
const INITIAL_DELAY_MS_DEFAULT = 1000;
const FIRST_BATCH_SIZE = 4;
const BLOCK_SIZE = 12;
const FEED_ID = "freeflowFeed";

// -------------- STATE ----------------
let freeflowData = [];
let itemsLoaded = 0;
let productCategory = (window.productCategory || "0")
  .toString()
  .toLowerCase();
const renderedIds = new Set();
let dataReady = false;
let initialRendered = false;
let pagerObserver = null;
let bootstrapped = false;
let scrollTick = null;
let freeflowReadyFired = false;
let collectionGridLoaded = false;

/* ------------------------------------
   COLLECTION GRID CONFIG
------------------------------------ */
    window.collectionList = [
      {
        title: "TÚI, BALO PICKLEBALL | SHOPEE PRODUCT",
        json: "/json/aff/bag-collection.json"
      },
      {
        title: "QUẦN ÁO THỂ THAO | SHOPEE PRODUCT",
        json: "/json/aff/apparel-collection.json"
      }
    ];

/* ======================================
   CACHE
====================================== */
function loadCachedFreeFlow() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }
  } catch (e) {
    console.warn("⚠️ Lỗi đọc cache FREEFLOW:", e);
  }
  return null;
}

function saveCache(data) {
  try {
    const payload = { timestamp: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("⚠️ Lỗi ghi cache FREEFLOW:", e);
  }
}

/* ======================================
   PROCESS DATA
====================================== */
function processAndSortData(data) {
  const random = () => Math.floor(Math.random() * 10) + 1;

  const preferred = data
    .filter(
      (item) =>
        (item.productCategory || "").toString().toLowerCase() ===
        productCategory
    )
    .map((item) => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random()
    }))
    .sort((a, b) => b.finalPriority - a.finalPriority);

  const others = data
    .filter(
      (item) =>
        (item.productCategory || "").toString().toLowerCase() !==
        productCategory
    )
    .map((item) => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random()
    }))
    .sort((a, b) => b.finalPriority - a.finalPriority);

  // Gộp + dedupe theo itemId
  freeflowData = [...preferred, ...others].filter(
    (v, i, a) => a.findIndex((t) => t.itemId === v.itemId) === i
  );
}

/* ======================================
   RENDER ITEM
====================================== */
function renderFeedItem(item, container) {
  if (!item || renderedIds.has(item.itemId)) return;
  renderedIds.add(item.itemId);

  const div = document.createElement("div");
  div.className = `feed-item ${item.contentType || ""}`.trim();

  let mediaHtml = "";

  if (item.contentType === "image") {
    mediaHtml = `
      <img loading="lazy" src="${item.image}" alt="${item.title || ""}" />
      ${
        item.title
          ? `<h4 class="one-line-title">${item.title}</h4>`
          : ""
      }
      ${
        item.price
          ? `<div class="price-line">
               <span class="price">${Number(item.price).toLocaleString()}đ</span>
               ${
                 item.originalPrice > item.price
                   ? `<span class="original-price">${Number(
                       item.originalPrice
                     ).toLocaleString()}đ</span>`
                   : ""
               }
             </div>`
          : ""
      }
    `;
  } else if (item.contentType === "youtube") {
    // item.youtube được coi là ID video (hoặc chuỗi để đưa vào embed)
    mediaHtml = `
      <div class="video-wrapper" style="position: relative;">
        <img class="video-thumb"
          src="/assets/images/thumb/vid-thumb.webp"
          style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px;z-index:1;"
        />
        <iframe data-video-id="${item.youtube}"
          src=""
          allow="autoplay; encrypted-media"
          allowfullscreen muted playsinline
          style="width:100%;aspect-ratio:9/16;border-radius:8px;position:relative;z-index:2;">
        </iframe>
        <div class="video-overlay"
          data-video="${item.youtube}"
          style="position:absolute;inset:0;cursor:pointer;z-index:3;">
        </div>
      </div>

      <div class="video-info" style="display:flex;align-items:center;gap:8px;padding:4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}"
            style="width:36px;height:36px;object-fit:cover;border-radius:6px;" />
        </a>
        <div style="flex:1;min-width:0;">
          <h4 style="font-size:13px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${item.title || ""}
          </h4>
          <div style="font-size:13px;color:#f53d2d;font-weight:bold;">
            ${item.price ? Number(item.price).toLocaleString() + "đ" : ""}
          </div>
        </div>
      </div>
    `;
  }

  div.innerHTML = mediaHtml;

  if (item.contentType === "image" && item.productPage) {
    div.addEventListener("click", () => {
      window.location.href = item.productPage;
    });
  }

  if (item.contentType === "youtube") {
    // Gắn event mở popup video lớn
    setTimeout(() => {
      const overlay = div.querySelector(".video-overlay");
      if (!overlay) return;

      overlay.onclick = () => {
        const id = overlay.dataset.video;
        const popup = document.getElementById("videoOverlay");
        const frame = document.getElementById("videoFrame");

        if (frame) {
          frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
        }
        if (popup) popup.style.display = "flex";

        const viewBtn = document.getElementById("viewProductBtn");
        if (viewBtn && item.productPage) {
          viewBtn.onclick = () => (window.location.href = item.productPage);
        }
      };
    }, 0);
  }

  container.appendChild(div);
}

/* ======================================
   AUTOPLAY YOUTUBE
====================================== */
function ytCmd(ifr, func) {
  try {
    ifr.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*"
    );
  } catch (e) {
    console.warn("YT cmd error:", e);
  }
}

function ytPlay(ifr) {
  ytCmd(ifr, "playVideo");
}
function ytPause(ifr) {
  ytCmd(ifr, "pauseVideo");
}

function setupAutoplayObserver() {
  const iframes = document.querySelectorAll("iframe[data-video-id]");
  if (!iframes.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const ifr = entry.target;
        const id = ifr.dataset.videoId;

        // Lần đầu vào viewport: gắn src + enable JS API
        if (entry.isIntersecting && !ifr.dataset.inited) {
          ifr.src = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&mute=1&playsinline=1&controls=0&rel=0&origin=${location.origin}`;
          ifr.dataset.inited = "1";

          const onLoadOnce = () => {
            setTimeout(() => ytPlay(ifr), 80);
            ifr.removeEventListener("load", onLoadOnce);
          };
          ifr.addEventListener("load", onLoadOnce);
          return;
        }

        if (entry.isIntersecting) {
          ytPlay(ifr);
        } else if (ifr.dataset.inited) {
          ytPause(ifr);
        }
      });
    },
    { threshold: 0.75 }
  );

  iframes.forEach((ifr) => io.observe(ifr));
}

/* ======================================
   PAGER
====================================== */
function ensureSentinel(container) {
  let s = document.getElementById("freeflowSentinel");
  if (!s) {
    s = document.createElement("div");
    s.id = "freeflowSentinel";
    s.style.height = "1px";
    container.appendChild(s);
  }
  return s;
}

function renderNextBlock(blockSize = BLOCK_SIZE) {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  const slice = freeflowData.slice(itemsLoaded, itemsLoaded + blockSize);
  slice.forEach((item) => renderFeedItem(item, container));

  itemsLoaded += slice.length;
  setupAutoplayObserver();
}

function setupLazyPager() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  const sentinel = ensureSentinel(container);

  if (pagerObserver) {
    pagerObserver.disconnect();
  }

  pagerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          renderNextBlock(BLOCK_SIZE);
        }
      });
    },
    { rootMargin: "800px 0px" }
  );
  pagerObserver.observe(sentinel);
}

/* ======================================
   INITIAL RENDER
====================================== */
function renderInitialAndStartPager() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  // 🔒 Đảm bảo chỉ render initial 1 lần
  if (initialRendered) return;
  initialRendered = true;

  const firstBatch = freeflowData.slice(0, FIRST_BATCH_SIZE);
  firstBatch.forEach((item) => renderFeedItem(item, container));

  itemsLoaded = firstBatch.length;
  setupAutoplayObserver();
  setupLazyPager();

  // 🔥 freeflowReady chỉ bắn đúng 1 lần
  if (!freeflowReadyFired) {
    freeflowReadyFired = true;
    document.dispatchEvent(new Event("freeflowReady"));
  }
}

function maybeStartRender() {
  if (initialRendered || !dataReady) return;

  const container = document.getElementById(FEED_ID);
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;

  if (rect.top <= vh + 800) {
    renderInitialAndStartPager();
  }
}

/* ======================================
   FETCH FREEFLOW (NO ART)
====================================== */
async function fetchFreeFlowData(sheetOverride) {
  if (sheetOverride) {
    fallbackUrl = sheetOverride;
  }

  const cached = loadCachedFreeFlow();
  if (cached && Array.isArray(cached) && cached.length) {
    processAndSortData(cached);
    dataReady = true;
    maybeStartRender();
  }

  try {
    const res = await fetch("/json/freeflow.json", { cache: "no-cache" });
    const data = await res.json();

    const validData = Array.isArray(data) ? data : [];
    processAndSortData(validData);
    saveCache(validData);

    dataReady = true;
    maybeStartRender();
  } catch (err) {
    console.error("⚠️ Lỗi tải FREEFLOW /json/freeflow.json:", err);
    // Fallback qua Google Sheet, truyền freeflowData hiện tại để merge
    fetchFromGoogleSheet(freeflowData || []);
  }
}

/* ======================================
   FALLBACK GOOGLE SHEET
====================================== */
async function fetchFromGoogleSheet(existing) {
  try {
    const res = await fetch(fallbackUrl, { cache: "no-cache" });
    const sheet = await res.json();
    if (!Array.isArray(sheet)) return;

    const ids = new Set(existing.map((x) => x.itemId));
    const newItems = sheet.filter((i) => !ids.has(i.itemId));

    if (!newItems.length) return;

    const merged = [...existing, ...newItems];
    processAndSortData(merged);
    saveCache(merged);

    dataReady = true;
    maybeStartRender();
  } catch (e) {
    console.error("⚠️ Lỗi fallback Google Sheet FREEFLOW:", e);
  }
}

/* ======================================
   COLLECTION CONTAINER HELPER
====================================== */
function ensureCollectionContainer() {
  let container = document.getElementById("collectionContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "collectionContainer";

    const feed = document.getElementById(FEED_ID);
    if (feed && feed.parentNode) {
      if (feed.nextSibling) {
        feed.parentNode.insertBefore(container, feed.nextSibling);
      } else {
        feed.parentNode.appendChild(container);
      }
    } else {
      document.body.appendChild(container);
    }
  }
  return container;
}

/* ======================================
   BOOTSTRAP
====================================== */
function bootstrapFreeflow(options = {}) {
  if (bootstrapped) return;
  bootstrapped = true;

  const delay = options.startNow
    ? 0
    : options.initialDelayMs ?? INITIAL_DELAY_MS_DEFAULT;

  observeFeedApproach();

  setTimeout(() => {
    fetchFreeFlowData();
  }, delay);

  // Fallback ép render sau 2s nếu đã có data nhưng chưa render
  setTimeout(() => {
    if (!initialRendered && dataReady) {
      renderInitialAndStartPager();
    }
  }, 2000);

  // ⬇ TẢI JS COLLECTION-GRID SAU KHI FREEFLOW READY
  document.addEventListener("freeflowReady", () => {
    // Đảm bảo luôn có #collectionContainer trước khi load collection-grid.js
    ensureCollectionContainer();

    if (collectionGridLoaded) return; // tránh load trùng
    collectionGridLoaded = true;

    const script = document.createElement("script");
    script.src = "/js/collection-grid.js";
    script.async = true;
    document.body.appendChild(script);
  });
}

function observeFeedApproach() {
  const feed = document.getElementById(FEED_ID);
  if (!feed) return;

  const io = new IntersectionObserver(
    () => {
      // debounce nhẹ nếu cần
      if (scrollTick) cancelAnimationFrame(scrollTick);
      scrollTick = requestAnimationFrame(() => {
        maybeStartRender();
      });
    },
    { rootMargin: "800px 0px" }
  );
  io.observe(feed);
}

/* ======================================
   PUBLIC API
====================================== */
window.freeflowInit = bootstrapFreeflow;
window.fetchFreeFlowData = fetchFreeFlowData;

/* ======================================
   AUTO START
====================================== */
(function autoBootstrap() {
  const tryStart = () => {
    if (bootstrapped) return;
    if (document.getElementById(FEED_ID)) {
      bootstrapFreeflow();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryStart);
  } else {
    tryStart();
  }
})();

/* ======================================
   SAFARI BFCache FIX
====================================== */
window.addEventListener("pageshow", (e) => {
  try {
    const navEntries = performance.getEntriesByType("navigation");
    const navType = navEntries[0]?.type;
    if (e.persisted || navType === "back_forward") {
      location.reload();
    }
  } catch (_) {
    if (e.persisted) location.reload();
  }
});
