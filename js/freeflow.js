/* =============================================
   FREEFLOW v7.2.1 — FAST LOAD / NO GAP / NO ART
   ------------------------------------------------
   ✓ Không chứa logic ART
   ✓ Không load /css/art.css
   ✓ Không fetch /json/art/index.json
   ✓ Tự khai báo window.collectionList
   ✓ FREEFLOW load xong → bắn event "freeflowReady" (1 lần)
   ✓ Sau freeflowReady → load /js/collection-grid.js (1 lần)
   ✓ Tăng tốc load: FIRST_BATCH 8 + BLOCK_SIZE 20
   ============================================= */

// -------------- CONFIG ----------------
let fallbackUrl =
  "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";

const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 phút

const FIRST_BATCH_SIZE = 8;   // load ngay 8 item đầu
const BLOCK_SIZE = 20;        // mỗi lần load thêm 20 item
const FEED_ID = "freeflowFeed";

// -------------- STATE ----------------
let freeflowData = [];
let itemsLoaded = 0;
const renderedIds = new Set();
let dataReady = false;
let initialRendered = false;
let pagerObserver = null;
let bootstrapped = false;
let freeflowReadyFired = false;
let collectionGridLoaded = false;

/* ------------------------------------
   COLLECTION GRID CONFIG
------------------------------------ */
window.collectionList = [
  {
    title: "TÚI, BALO | SHOPEE PRODUCT",
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
   UTILS
====================================== */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ======================================
   PROCESS DATA — NO CATEGORY SPLIT
====================================== */
function processAndSortData(data) {
  if (!Array.isArray(data)) {
    freeflowData = [];
    return;
  }

  // Tính finalPriority = basePriority + 1 chút random cho đỡ cứng
  const arr = data.map(item => ({
    ...item,
    finalPriority: (item.basePriority || 1) + Math.random() * 0.01
  }));

  // Sắp xếp đúng nguyên tắc: basePriority cao → lên trên
  arr.sort((a, b) => b.finalPriority - a.finalPriority);

  // Lưu vào freeflowData
  freeflowData = arr;
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
      ${item.title ? `<h4 class="one-line-title">${item.title}</h4>` : ""}
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
    mediaHtml = `
      <div class="video-wrapper" style="position:relative;">
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
        <div class="video-overlay" data-video="${item.youtube}"
             style="position:absolute;inset:0;cursor:pointer;z-index:3;"></div>
      </div>

      <div class="video-info" style="display:flex;align-items:center;gap:8px;padding:4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;" />
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

  // Click ảnh → sang trang sản phẩm
  if (item.contentType === "image" && item.productPage) {
    div.addEventListener("click", () => {
      window.location.href = item.productPage;
    });
  }

  // Overlay video → mở popup video lớn (tái dùng layout cũ)
  if (item.contentType === "youtube") {
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

        if (entry.isIntersecting && !ifr.dataset.inited) {
          ifr.src = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&mute=1&playsinline=1&controls=0&rel=0&origin=${location.origin}`;
          ifr.dataset.inited = "1";

          const onLoadOnce = () => {
            setTimeout(() => ytPlay(ifr), 50);
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
    { threshold: 0.5 }
  );

  iframes.forEach((ifr) => io.observe(ifr));
}

/* ======================================
   PAGER
====================================== */
function setupLazyPager() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  let sentinel = document.getElementById("freeflowSentinel");
  if (!sentinel) {
    sentinel = document.createElement("div");
    sentinel.id = "freeflowSentinel";
    sentinel.style.height = "1px";
    container.appendChild(sentinel);
  }

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
    { rootMargin: "1500px 0px" } // load sớm từ rất xa
  );

  pagerObserver.observe(sentinel);
}

function renderNextBlock(blockSize = BLOCK_SIZE) {
  const container = document.getElementById(FEED_ID);
  if (!container) return;

  const slice = freeflowData.slice(itemsLoaded, itemsLoaded + blockSize);
  slice.forEach((item) => renderFeedItem(item, container));

  itemsLoaded += slice.length;
  setupAutoplayObserver();
}

/* ======================================
   INITIAL RENDER
====================================== */
function renderInitial() {
  if (initialRendered) return;
  const container = document.getElementById(FEED_ID);
  if (!container || !freeflowData.length) return;

  initialRendered = true;

  const firstBatch = freeflowData.slice(0, FIRST_BATCH_SIZE);
  firstBatch.forEach((item) => renderFeedItem(item, container));
  itemsLoaded = firstBatch.length;

  setupAutoplayObserver();
  setupLazyPager();

  if (!freeflowReadyFired) {
    freeflowReadyFired = true;
    document.dispatchEvent(new Event("freeflowReady"));
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

    const ids = new Set((existing || []).map((x) => x.itemId));
    const newItems = sheet.filter((i) => !ids.has(i.itemId));

    if (!newItems.length) return;

    const merged = [...(existing || []), ...newItems];
    processAndSortData(merged);
    saveCache(merged);

    dataReady = true;
    renderInitial();
  } catch (e) {
    console.error("⚠️ Lỗi fallback Google Sheet FREEFLOW:", e);
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
    renderInitial();
  }

  try {
    const res = await fetch("/json/freeflow.json", { cache: "no-cache" });
    const data = await res.json();

    const validData = Array.isArray(data) ? data : [];
    processAndSortData(validData);
    saveCache(validData);

    dataReady = true;
    renderInitial();
  } catch (err) {
    console.error("⚠️ Lỗi tải FREEFLOW /json/freeflow.json:", err);
    fetchFromGoogleSheet(freeflowData || []);
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
function bootstrapFreeflow() {
  if (bootstrapped) return;
  bootstrapped = true;

  // Lắng nghe freeflowReady → đảm bảo container + load collection-grid.js
  document.addEventListener("freeflowReady", () => {
    if (collectionGridLoaded) return;
    collectionGridLoaded = true;

    ensureCollectionContainer();

    const script = document.createElement("script");
    script.src = "/js/collection-grid.js";
    script.async = true;
    document.body.appendChild(script);
  });

  fetchFreeFlowData();

  // Fallback ép render sau 2s nếu đã có data mà chưa render (trường hợp hiếm)
  setTimeout(() => {
    if (!initialRendered && dataReady) {
      renderInitial();
    }
  }, 2000);
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
