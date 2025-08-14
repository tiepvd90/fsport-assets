// ✅ FREEFLOW CONFIG
const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000;
const fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";

let freeflowData = [];
let itemsLoaded = 0;
let productCategory = window.productCategory || "0";
const renderedIds = new Set();

let _autoplayObserver = null;

// ──────────────────────────────────────────────────────────────
// Helpers: cache
function loadCachedFreeFlow() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) return cached.data;
  } catch (e) {}
  return null;
}
function saveCache(data) {
  const payload = { timestamp: Date.now(), data };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

// ──────────────────────────────────────────────────────────────
// Process & sort (giữ nguyên logic)
function processAndSortData(data) {
  const random = () => Math.floor(Math.random() * 20) + 1;

  const preferred = data.filter(i => i.productCategory === productCategory)
    .map(i => ({ ...i, finalPriority: (i.basePriority || 0) + random() + 75 }));
  const others = data.filter(i => i.productCategory !== productCategory)
    .map(i => ({ ...i, finalPriority: (i.basePriority || 0) + random() }));

  function interleaveBalanced(a, b) {
    const out = []; let i = 0, j = 0; const total = a.length + b.length;
    for (let k = 0; k < total; k++) {
      if ((k % 2 === 0 && i < a.length) || j >= b.length) out.push(a[i++]);
      else out.push(b[j++]);
    }
    return out;
  }

  const combined = interleaveBalanced(preferred, others).sort((x, y) => y.finalPriority - x.finalPriority);
  const images = combined.filter(i => i.contentType === "image");
  const videos = combined.filter(i => i.contentType === "youtube");

  const mixed = [];
  let img = 0, vid = 0;
  while (img < images.length) {
    for (let k = 0; k < 6 && img < images.length; k++) mixed.push(images[img++]);
    if (vid < videos.length) mixed.push(videos[vid++]);
  }

  function reorderForVisualMasonry(arr, cols = 2) {
    const rows = Math.ceil(arr.length / cols);
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const idx = c * rows + r; if (idx < arr.length) out.push(arr[idx]);
    }
    return out;
  }
  freeflowData = reorderForVisualMasonry(mixed, 2);
}

// ──────────────────────────────────────────────────────────────
// Fetch pipeline
async function fetchFreeFlowData() {
  const cached = loadCachedFreeFlow();
  if (cached) { processAndSortData(cached); renderInitialAndLoadRest(); }

  try {
    const res = await fetch("/json/freeflow.json");
    const localData = await res.json();
    const valid = Array.isArray(localData) ? localData : [];
    processAndSortData(valid);
    saveCache(valid);
    renderInitialAndLoadRest();
    fetchFromGoogleSheet(valid);
  } catch (e) {
    console.warn("Lỗi local JSON:", e);
    fetchFromGoogleSheet([]);
  }
}

async function fetchFromGoogleSheet(existing) {
  try {
    const res = await fetch(fallbackUrl);
    const sheet = await res.json();
    if (!Array.isArray(sheet)) return;
    const existingIds = new Set(existing.map(i => i.itemId));
    const newItems = sheet.filter(i => !existingIds.has(i.itemId));
    if (!newItems.length) return;

    const combined = [...existing, ...newItems];
    processAndSortData(combined);
    saveCache(combined);

    const container = document.getElementById("freeflowFeed");
    freeflowData.slice(itemsLoaded).forEach(it => renderFeedItem(it, container));
    itemsLoaded = freeflowData.length;
    setupAutoplayObserver();
  } catch (e) {
    console.error("Sheet fetch fail:", e);
  }
}

// ──────────────────────────────────────────────────────────────
// Render
function renderInitialAndLoadRest() {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  freeflowData.slice(0, 4).forEach(i => renderFeedItem(i, container));
  itemsLoaded = 4;
  setupAutoplayObserver();

  setTimeout(() => {
    freeflowData.slice(4).forEach(i => renderFeedItem(i, container));
    itemsLoaded = freeflowData.length;
    setupAutoplayObserver();
  }, 300);
}

function renderFeedItem(item, container) {
  if (renderedIds.has(item.itemId)) return;
  renderedIds.add(item.itemId);

  const div = document.createElement("div");
  div.className = `feed-item ${item.contentType || ""}`;
  div.style.position = "relative"; // đảm bảo overlay con không “tràn” ra ngoài

  let html = "";
  if (item.contentType === "image") {
    html = `
      <img loading="lazy" src="${item.image}" alt="${item.title || ""}" />
      ${item.title ? `<h4 class="one-line-title">${item.title}</h4>` : ""}
      ${item.price ? `
        <div class="price-line">
          <span class="price">${Number(item.price).toLocaleString()}đ</span>
          ${item.originalPrice > item.price ? `<span class="original-price">${Number(item.originalPrice).toLocaleString()}đ</span>` : ""}
        </div>` : ""}
    `;
  } else if (item.contentType === "youtube") {
    html = `
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
        <!-- ⛑ Overlay CHỈ nằm trong card, không full page -->
        <div class="video-overlay"
             data-video="${item.youtube}"
             style="position: absolute; inset: 0; cursor: pointer; z-index: 3; pointer-events: auto;"></div>
      </div>
      <div class="video-info" style="display: flex; align-items: center; gap: 8px; padding: 4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px;" />
        </a>
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 13px; line-height: 1.3; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title || ""}</h4>
          ${item.price ? `<div style="font-size: 13px; color: #f53d2d; font-weight: bold;">${Number(item.price).toLocaleString()}đ</div>` : ""}
        </div>
      </div>
    `;
  }

  div.innerHTML = html;

  if (item.contentType === "image") {
    div.addEventListener("click", () => (window.location.href = item.productPage), { passive: true });
  } else if (item.contentType === "youtube") {
    const overlay = div.querySelector(".video-overlay");
    overlay.addEventListener("click", (ev) => {
      ev.stopPropagation();
      // 🚪 Mở popup video cục bộ, KHÔNG tạo overlay toàn trang “vĩnh viễn”
      const id = overlay.getAttribute("data-video");
      const popup = document.getElementById("videoOverlay");
      const frame = document.getElementById("videoFrame");
      if (frame) frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
      if (popup) {
        popup.style.display = "flex";
        popup.setAttribute("aria-hidden", "false");
      }
      const viewBtn = document.getElementById("viewProductBtn");
      if (viewBtn) viewBtn.onclick = () => (window.location.href = item.productPage);

      // 🧹 Khi mở popup, đảm bảo BODY không bị lock vĩnh viễn
      document.body.style.overflow = "hidden";
      setTimeout(() => { document.body.style.overflow = ""; }, 400); // auto-unlock an toàn
    }, { passive: true });
  }

  container.appendChild(div);
}

// ──────────────────────────────────────────────────────────────
// Autoplay
function setupAutoplayObserver() {
  if (_autoplayObserver) { _autoplayObserver.disconnect(); _autoplayObserver = null; }
  const iframes = document.querySelectorAll('iframe[data-video-id]');
  if (!iframes.length) return;

  _autoplayObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const iframe = entry.target;
      const id = iframe.getAttribute("data-video-id");
      const target = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${id}`;
      if (entry.isIntersecting) {
        if (iframe.src !== target) iframe.src = target;
      } else {
        if (iframe.src) iframe.src = "";
      }
    });
  }, { threshold: 0.75 });

  iframes.forEach((iframe) => _autoplayObserver.observe(iframe));
}

// ──────────────────────────────────────────────────────────────
// ⛑ Cleanup cứng tay để không còn “lá chắn vô hình”
function hideGlobalVideoOverlay() {
  const popup = document.getElementById("videoOverlay");
  if (popup) {
    popup.style.display = "none";
    popup.setAttribute("aria-hidden", "true");
  }
  const frame = document.getElementById("videoFrame");
  if (frame) frame.src = "";
}
function stopAllIframes() {
  document.querySelectorAll('iframe[data-video-id]').forEach(ifr => { if (ifr.src) ifr.src = ""; });
}
function teardownAutoplayObserver() {
  if (_autoplayObserver) { _autoplayObserver.disconnect(); _autoplayObserver = null; }
}

// Dọn khi rời trang (bfcache-friendly)
window.addEventListener("pagehide", () => {
  hideGlobalVideoOverlay();
  stopAllIframes();
  teardownAutoplayObserver();
}, { passive: true });

// Khi tab ẩn: dọn tối thiểu
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hideGlobalVideoOverlay();
    stopAllIframes();
  }
}, { passive: true });

// Khi trang quay lại từ bfcache: chỉ cleanup overlay, KHÔNG reload
window.addEventListener("pageshow", () => {
  hideGlobalVideoOverlay();
}, { passive: true });

// Popstate (ấn Back trong lịch sử): đóng overlay thay vì cản trở
window.addEventListener("popstate", () => {
  hideGlobalVideoOverlay();
}, { passive: true });

// ──────────────────────────────────────────────────────────────
// Init an toàn
document.addEventListener("DOMContentLoaded", () => {
  const hasFeed = !!document.getElementById("freeflowFeed");
  if (!hasFeed) return;

  // đảm bảo overlay toàn trang có thể đóng được bất cứ lúc nào
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) closeBtn.onclick = () => hideGlobalVideoOverlay();

  // tránh overlay toàn trang che vĩnh viễn
  const globalOverlay = document.getElementById("videoOverlay");
  if (globalOverlay) {
    globalOverlay.style.pointerEvents = "none"; // lớp nền không ăn click
    // chỉ bật pointer-events cho hộp nội dung bên trong
    const content = globalOverlay.querySelector(".overlay-content, .content, .inner, .modal");
    if (content) content.style.pointerEvents = "auto";
    globalOverlay.style.zIndex = "9999"; // vẫn nổi trên freeflow nhưng không che UI ngoài khi ẩn
  }

  fetchFreeFlowData();
}, { passive: true });

// ❌ Không còn bất kỳ reload cưỡng bức nào ở pageshow
