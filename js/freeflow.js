/* ============================== *
 *   FREEFLOW (lazy blocks)       *
 *  1s fetch-all (no render yet)  *
 *  Render 4 on approach, then    *
 *  lazy-load 12/item block       *
 *  Keep autoplay logic as-is     *
 * ============================== */

// ✅ FREEFLOW CONFIG
const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000;
const fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";

let freeflowData = [];
let itemsLoaded = 0;
let productCategory = window.productCategory || "0";
const renderedIds = new Set();

// trạng thái
let dataReady = false;        // đã có dữ liệu (đã process & cache)
let initialRendered = false;  // đã render đợt đầu (4 item) chưa
let pagerObserver = null;     // IO cho sentinel

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
  const random = () => Math.floor(Math.random() * 20) + 1;

  const preferred = data
    .filter(item => item.productCategory === productCategory)
    .map(item => ({ ...item, finalPriority: (item.basePriority || 0) + random() + 75 }));

  const others = data
    .filter(item => item.productCategory !== productCategory)
    .map(item => ({ ...item, finalPriority: (item.basePriority || 0) + random() }));

  function interleaveBalanced(preferred, others) {
    const result = [];
    let i = 0, j = 0;
    const total = preferred.length + others.length;
    for (let k = 0; k < total; k++) {
      if ((k % 2 === 0 && i < preferred.length) || j >= others.length) {
        result.push(preferred[i++]);
      } else {
        result.push(others[j++]);
      }
    }
    return result;
  }

  const combined = interleaveBalanced(preferred, others).sort((a, b) => b.finalPriority - a.finalPriority);

    const images = combined.filter(i => i.contentType === "image");
  const videos = combined.filter(i => i.contentType === "youtube");

  // ✅ Trộn theo tỷ lệ 10 ảnh : 1 video
  //    Nếu nhịp cuối <10 ảnh thì KHÔNG thêm video (video dư bỏ)
  const mixed = [];
  let imgIndex = 0, vidIndex = 0;

  while (imgIndex < images.length) {
    let added = 0;
    while (imgIndex < images.length && added < 10) {
      mixed.push(images[imgIndex++]);
      added++;
    }

    if (added === 10 && vidIndex < videos.length) {
      mixed.push(videos[vidIndex++]);
    }

    if (imgIndex >= images.length) break;
  }

  function reorderForVisualMasonry(data, columns = 2) {
    const rows = Math.ceil(data.length / columns);
    const reordered = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const index = c * rows + r;
        if (index < data.length) reordered.push(data[index]);
      }
    }
    return reordered;
  }

  freeflowData = reorderForVisualMasonry(mixed, 2);
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
      <img loading="lazy" src="${item.image}" alt="${item.title || ''}" />
      ${item.title ? `<h4 class="one-line-title">${item.title}</h4>` : ""}
      ${item.price ? `
        <div class="price-line">
          <span class="price">${Number(item.price).toLocaleString()}đ</span>
          ${item.originalPrice > item.price ? `<span class="original-price">${Number(item.originalPrice).toLocaleString()}đ</span>` : ""}
        </div>` : ""}
    `;
  } else if (item.contentType === "youtube") {
    mediaHtml = `
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
    div.onclick = () => window.location.href = item.productPage;
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

  container.appendChild(div);
}

// ▶️ YouTube autoplay (GIỮ NGUYÊN)
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

function renderNextBlock(blockSize = 12) {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  const slice = freeflowData.slice(itemsLoaded, itemsLoaded + blockSize);
  slice.forEach(item => renderFeedItem(item, container));
  itemsLoaded += slice.length;

  // Mỗi lần thêm block mới thì cập nhật observer autoplay cho các iframe mới
  setupAutoplayObserver();

  // Nếu đã hết dữ liệu thì ngắt pagerObserver
  if (itemsLoaded >= freeflowData.length && pagerObserver) {
    pagerObserver.disconnect();
    pagerObserver = null;
  }
}

function setupLazyPager() {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  const sentinel = ensureSentinel(container);
  if (pagerObserver) pagerObserver.disconnect();

  pagerObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Render thêm 1 block 12 item khi chạm sentinel
        renderNextBlock(12);
      }
    });
  }, { root: null, rootMargin: "800px 0px", threshold: 0 });

  pagerObserver.observe(sentinel);
}

// =================== Initial kick ===================
function isNearViewport(el, margin = 800) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top <= vh + margin && rect.bottom >= -margin;
}

function renderInitialAndStartPager() {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  // Render 4 item đầu (như cũ)
  const firstBatch = freeflowData.slice(0, 4);
  firstBatch.forEach(item => renderFeedItem(item, container));
  itemsLoaded = 4;
  setupAutoplayObserver();

  // Bắt đầu lazy pager (12/item block khi cuộn tới)
  setupLazyPager();
}

function maybeStartRender() {
  if (initialRendered) return;
  const container = document.getElementById("freeflowFeed");
  if (!container) return;
  if (dataReady && isNearViewport(container, 800)) {
    initialRendered = true;
    renderInitialAndStartPager();
  }
}

// =================== Data fetching ===================
async function fetchFreeFlowData() {
  const cached = loadCachedFreeFlow();
  if (cached) {
    processAndSortData(cached);
    dataReady = true;
    maybeStartRender();
  }

  try {
    const res = await fetch("/json/freeflow.json");
    const localData = await res.json();
    const validData = Array.isArray(localData) ? localData : [];

    processAndSortData(validData);
    saveCache(validData);
    dataReady = true;
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

    // Nếu đã render đợt đầu thì không “xả hết”; pager sẽ tự nạp block tiếp theo khi chạm sentinel
    if (!initialRendered) maybeStartRender();
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

// =================== Init ===================
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) closeBtn.onclick = () => {
    const popup = document.getElementById("videoOverlay");
    const frame = document.getElementById("videoFrame");
    if (popup) popup.style.display = "none";
    if (frame) frame.src = "";
  };

  // Chờ gần viewport mới render 4 item đầu
  const container = document.getElementById("freeflowFeed");
  if (container) {
    const io = new IntersectionObserver(() => {
      maybeStartRender();
    }, { root: null, rootMargin: "800px 0px", threshold: 0 });
    io.observe(container);
  }

  // Sau 1 giây mới bắt đầu fetch all (chỉ xử lý & cache, không render ngay)
  setTimeout(() => { fetchFreeFlowData(); }, 1000);

  // Fallback an toàn nếu vì lý do nào đó IO bị miss
  setTimeout(() => { maybeStartRender(); }, 5000);
});

// Safari back-forward cache: reload lại để đảm bảo init đúng
window.addEventListener("pageshow", function (event) {
  if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
    location.reload();
  }
});
