/* ==============================
 *
 * FREEFLOW (loader-friendly)
 *
 * 1s fetch-all (no render yet)
 * Render 4 on approach, then
 * lazy-load 12/item block + AF
 * Keep autoplay logic as-is
 *
 * ============================== */

// ====== CONFIG (override via freeflowInit) ======
let fallbackUrl =
  "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";
const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 phút
const INITIAL_DELAY_MS_DEFAULT = 1000; // 1 giây
const FIRST_BATCH_SIZE = 4;
const BLOCK_SIZE = 12;
const FEED_ID = "freeflowFeed";

// ====== State ======
let freeflowData = [];
let itemsLoaded = 0;
let productCategory = (window.productCategory || "0").toString().toLowerCase();
const renderedIds = new Set();
let dataReady = false; // dữ liệu đã process xong
let initialRendered = false; // đã render 4 item đầu chưa
let pagerObserver = null; // IO cho sentinel
let bootstrapped = false; // đã init UI chưa
let scrollTick = null; // throttle scroll

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
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

// =================== Process & sort ===================
function processAndSortData(data) {
  // random nhẹ để tránh thứ tự cứng ngắc
  const random = () => Math.floor(Math.random() * 10) + 1;

  // --- 1. Chia preferred (cùng category) và others (khác category) ---
  const preferred = data
  .filter((item) => (item.productCategory || "").toString().toLowerCase() === productCategory)
    .map((item) => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random()
    }))
    .sort((a, b) => b.finalPriority - a.finalPriority);

  const others = data
  .filter((item) => (item.productCategory || "").toString().toLowerCase() !== productCategory)
    .map((item) => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random()
    }))
    .sort((a, b) => b.finalPriority - a.finalPriority);

  // --- 2. Gộp lại: ưu tiên category hiện tại lên đầu ---
  freeflowData = [...(freeflowData || []), ...preferred, ...others]
  .filter((v,i,a) => a.findIndex(t=>t.itemId===v.itemId)===i); // loại trùng
}



// =================== Rendering ===================
function renderFeedItem(item, container) {
  if (renderedIds.has(item.itemId)) return;
  renderedIds.add(item.itemId);

  const div = document.createElement("div");
  div.className = `feed-item ${item.contentType || ""}`;

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
    mediaHtml = `
      <div class="video-wrapper" style="position: relative;">
        <img class="video-thumb" src="https://fun-sport.co/assets/images/thumb/vid-thumb.webp"
          style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 8px; z-index: 1;" />
        <iframe data-video-id="${item.youtube}" src="" frameborder="0"
          allow="autoplay; encrypted-media" allowfullscreen playsinline muted
          style="width: 100%; aspect-ratio: 9/16; border-radius: 8px; position: relative; z-index: 2;">
        </iframe>
        <div class="video-overlay" data-video="${item.youtube}"
          style="position: absolute; inset: 0; cursor: pointer; z-index: 3;"></div>
      </div>
      <div class="video-info" style="display: flex; align-items: center; gap: 8px; padding: 4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}"
            style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px;" />
        </a>
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 13px; line-height: 1.3; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.title}
          </h4>
          <div style="font-size: 13px; color: #f53d2d; font-weight: bold;">
            ${Number(item.price).toLocaleString()}đ
          </div>
        </div>
      </div>
    `;
  }

  div.innerHTML = mediaHtml;

  if (item.contentType === "image") {
    div.onclick = () => (window.location.href = item.productPage);
  } else if (item.contentType === "youtube") {
    setTimeout(() => {
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
    }, 0);
  }

  container.appendChild(div);

  // 🔁 Ảnh load xong có thể giãn layout → auto-fill nếu gần đáy
  if (item.contentType === "image") {
    const img = div.querySelector("img");
    if (img) {
      const onDone = () => {
        setTimeout(() => {
          autofillToViewport();
        }, 20);
      };
      if (img.complete) onDone();
      else {
        img.addEventListener("load", onDone, { once: true });
        img.addEventListener("error", onDone, { once: true });
      }
    }
  }
}

// ▶️ YouTube autoplay (GIỮ NGUYÊN)
function ytCmd(iframe, func) {
  try {
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*"
    );
  } catch (e) {}
}
function ytPlay(iframe) {
  ytCmd(iframe, "playVideo");
}
function ytPause(iframe) {
  ytCmd(iframe, "pauseVideo");
}

function setupAutoplayObserver() {
  const iframes = document.querySelectorAll("iframe[data-video-id]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const iframe = entry.target;
        const id = iframe.getAttribute("data-video-id");
        if (entry.isIntersecting && !iframe.dataset.inited) {
          const initSrc = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&mute=1&playsinline=1&controls=0&rel=0&origin=${location.origin}`;
          iframe.src = initSrc;
          iframe.dataset.inited = "1";
          const onLoadOnce = () => {
            setTimeout(() => {
              ytPlay(iframe);
            }, 50);
            iframe.removeEventListener("load", onLoadOnce);
          };
          iframe.addEventListener("load", onLoadOnce);
          setTimeout(() => {
            ytPlay(iframe);
          }, 300);
          return;
        }
        if (entry.isIntersecting) ytPlay(iframe);
        else if (iframe.dataset.inited === "1") ytPause(iframe);
      });
    },
    { threshold: 0.75 }
  );
  iframes.forEach((iframe) => observer.observe(iframe));
}

// =================== Lazy pager ===================
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
  slice.forEach((item) => renderFeedItem(item, container));
  itemsLoaded += slice.length;
  setupAutoplayObserver();
  if (itemsLoaded >= freeflowData.length && pagerObserver) {
    pagerObserver.disconnect();
    pagerObserver = null;
  } else {
    setTimeout(() => {
      autofillToViewport();
    }, 30);
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
    { root: null, rootMargin: "800px 0px", threshold: 0 }
  );
  pagerObserver.observe(sentinel);
  setTimeout(() => {
    autofillToViewport();
  }, 30);
}

// =================== Auto-fill helpers ===================
function nearBottom(offset = 900) {
  const doc = document.documentElement;
  const scrollY = window.scrollY || doc.scrollTop || 0;
  const vh = window.innerHeight || doc.clientHeight || 0;
  const docH = Math.max(
    doc.scrollHeight,
    doc.offsetHeight,
    doc.clientHeight,
    document.body?.scrollHeight || 0,
    document.body?.offsetHeight || 0
  );
  return scrollY + vh >= docH - offset;
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

// =================== Kick & gating ===================
function isNearViewport(el, margin = 800) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top <= vh + margin && rect.bottom >= -margin;
}

function renderInitialAndStartPager() {
  const container = document.getElementById(FEED_ID);
  if (!container) return;
  const firstBatch = freeflowData.slice(0, FIRST_BATCH_SIZE);
  firstBatch.forEach((item) => renderFeedItem(item, container));
  itemsLoaded = FIRST_BATCH_SIZE;
  setupAutoplayObserver();
  setupLazyPager();
  setTimeout(() => {
    autofillToViewport();
  }, 30);

  // 🔹 Báo hiệu FreeFlow đã sẵn sàng
  document.dispatchEvent(new Event("freeflowReady"));
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
  if (sheetUrlOverride) fallbackUrl = sheetUrlOverride;

  const cached = loadCachedFreeFlow();
  if (cached) {
    processAndSortData(cached);
  }

  // =========================================
  // 🧩 Nếu category là ART → load ART trước rồi tới freeflow
  // =========================================
  if (productCategory === "art") {
    try {
      console.log("🎨 ART mode: load art trước, rồi freeflow");

      loadArtCSS();

      // 1️⃣ Load ART trước
      const resArt = await fetch("/json/art/index.json");
      const dataArt = await resArt.json();
      renderCollectionsInline(dataArt);

      // 2️⃣ Tiếp theo load FREEFLOW
      const res = await fetch("/json/freeflow.json");
      const data = await res.json();
      const validData = Array.isArray(data) ? data : [];
      processAndSortData(validData);
      saveCache(validData);
      dataReady = true;
      maybeStartRender();

    } catch (err) {
      console.error("⚠️ Lỗi khi tải ART hoặc FREEFLOW:", err);
    }
    return;
  }

  // =========================================
  // 🧩 Ngược lại: category KHÔNG phải ART → load FREEFLOW trước, rồi ART sau
  // =========================================
  try {
    console.log("🪶 Normal mode: load freeflow trước, rồi art sau");

    // 1️⃣ Load FREEFLOW trước
    const res = await fetch("/json/freeflow.json");
    const data = await res.json();
    const validData = Array.isArray(data) ? data : [];
    processAndSortData(validData);
    saveCache(validData);
    dataReady = true;
    maybeStartRender();

    // 2️⃣ Khi FreeFlow sẵn sàng → load thêm ART
    document.addEventListener("freeflowReady", async () => {
      try {
        loadArtCSS();
        const resArt = await fetch("/json/art/index.json");
        const dataArt = await resArt.json();
        renderCollectionsInline(dataArt);
      } catch (err) {
        console.error("⚠️ Lỗi khi tải /json/art/index.json:", err);
      }
    });
  } catch (err) {
    console.error("⚠️ Lỗi khi tải FREEFLOW:", err);
    fetchFromGoogleSheet([]);
  }
}




async function fetchFromGoogleSheet(existingData) {
  try {
    const res = await fetch(fallbackUrl);
    const sheetData = await res.json();
    if (!Array.isArray(sheetData)) return;
    const existingIds = new Set(existingData.map((i) => i.itemId));
    const newItems = sheetData.filter((i) => !existingIds.has(i.itemId));
    if (newItems.length === 0) return;
    const combined = [...existingData, ...newItems];
    processAndSortData(combined);
    saveCache(combined);
    dataReady = true;
    if (!initialRendered) maybeStartRender();
    else
      setTimeout(() => {
        autofillToViewport();
      }, 30);
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

// =================== Bootstrap (works with loader) ===================
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

function attachScrollAutofill() {
  window.addEventListener(
    "scroll",
    () => {
      if (!initialRendered) return;
      if (scrollTick) return;
      scrollTick = setTimeout(() => {
        scrollTick = null;
        autofillToViewport();
      }, 120);
    },
    { passive: true }
  );
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
  attachScrollAutofill();

  const delay = options.startNow
    ? 0
    : options.initialDelayMs ?? INITIAL_DELAY_MS_DEFAULT;

  setTimeout(() => {
    fetchFreeFlowData();
  }, delay);

  // Fallback sau 2 giây, nếu chưa render thì ép render
setTimeout(() => {
  if (!initialRendered && dataReady) renderInitialAndStartPager();
}, 2000);

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
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(tryStart, 0)
    );
  } else {
    setTimeout(tryStart, 0);
  }
})();
// =====================================================
// 🖼️ SAU KHI FREEFLOW LOAD XONG → GỌI /art.html
// =====================================================
// =====================================================
// 🎨 SAU KHI FREEFLOW LOAD XONG → GỌI /css/art.css + render JSON
// =====================================================

// 🧩 Hàm load file CSS ngoài
function loadArtCSS() {
  if (document.querySelector('link[href="/css/art.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/css/art.css";
  link.type = "text/css";
  link.onload = () => console.log("🎨 Đã load /css/art.css");
  link.onerror = () => console.warn("⚠️ Không thể tải /css/art.css");
  document.head.appendChild(link);
}

// 🧱 Hàm hiển thị gallery từ JSON
function renderCollectionsInline(data) {
  if (!data || !Array.isArray(data.collections)) return;

  const wrapper = document.createElement("section");
  wrapper.className = "art-section-wrapper";
  wrapper.style.marginTop = "40px";

  const h1 = document.createElement("h1");
  h1.textContent = "BỘ SƯU TẬP TRANH DECOR";
  h1.style.textAlign = "center";
  h1.style.margin = "24px 0 16px";
  wrapper.appendChild(h1);

  const container = document.createElement("div");
  container.className = "collection-container";
  wrapper.appendChild(container);

  data.collections.forEach(col => {
    const block = document.createElement("div");
    block.className = "collection-block";

    const title = document.createElement("div");
    title.className = "collection-title";
    title.textContent = col.title;
    block.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "art-grid";

    (col.images || []).forEach(imgObj => {
      const item = document.createElement("div");
      item.className = "art-item";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = imgObj.image;
      img.alt = col.title;

      item.appendChild(img);
      item.onclick = () =>
        (window.location.href = imgObj.slug || col.slug || "#");
      grid.appendChild(item);
    });

    block.appendChild(grid);

    const moreBtn = document.createElement("a");
    moreBtn.className = "view-more";
    moreBtn.href = col.slug || "#";
    moreBtn.innerHTML = `Xem Thêm Tranh ${col.title} <span>▼</span>`;
    block.appendChild(moreBtn);

    container.appendChild(block);

    const divider = document.createElement("div");
    divider.className = "divider";
    container.appendChild(divider);
  });

  const feed = document.getElementById("freeflowFeed");
const isArt = (window.productCategory || "").toString().toLowerCase() === "art";

if (feed && feed.parentNode) {
  if (isArt) {
    // ✅ ART đứng TRƯỚC feed
    feed.parentNode.insertBefore(wrapper, feed);
  } else {
    // các category khác: gắn sau như cũ
    feed.parentNode.appendChild(wrapper);
  }
} else {
  (document.body).appendChild(wrapper);
}

}




// ✅ Safari back-forward cache
window.addEventListener("pageshow", function (event) {
  if (
    event.persisted ||
    performance.getEntriesByType("navigation")[0]?.type === "back_forward"
  ) {
    location.reload();
  }
});
