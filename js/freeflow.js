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
// ✅ Helpers: cache
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

// ──────────────────────────────────────────────────────────────
// ✅ Xử lý & sắp xếp dữ liệu (masonry + 6 ảnh : 1 video)
function processAndSortData(data) {
  const random = () => Math.floor(Math.random() * 20) + 1;

  const preferred = data
    .filter(item => item.productCategory === productCategory)
    .map(item => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random() + 75
    }));

  const others = data
    .filter(item => item.productCategory !== productCategory)
    .map(item => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random()
    }));

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
    .sort((x, y) => y.finalPriority - x.finalPriority);

  const images = combined.filter(i => i.contentType === "image");
  const videos = combined.filter(i => i.contentType === "youtube");

  const mixed = [];
  let imgIndex = 0, vidIndex = 0;
  while (imgIndex < images.length) {
    for (let k = 0; k < 6 && imgIndex < images.length; k++) mixed.push(images[imgIndex++]);
    if (vidIndex < videos.length) mixed.push(videos[vidIndex++]);
  }

  function reorderForVisualMasonry(arr, columns = 2) {
    const rows = Math.ceil(arr.length / columns);
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const index = c * rows + r;
        if (index < arr.length) out.push(arr[index]);
      }
    }
    return out;
  }

  freeflowData = reorderForVisualMasonry(mixed, 2);
}

// ──────────────────────────────────────────────────────────────
// ✅ Fetch data: local → render → sheet (merge)
async function fetchFreeFlowData() {
  const cached = loadCachedFreeFlow();
  if (cached) {
    processAndSortData(cached);
    renderInitialAndLoadRest();
  }

  try {
    const res = await fetch("/json/freeflow.json");
    const localData = await res.json();
    const validData = Array.isArray(localData) ? localData : [];

    processAndSortData(validData);
    saveCache(validData);
    renderInitialAndLoadRest();

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

    const container = document.getElementById("freeflowFeed");
    const moreItems = freeflowData.slice(itemsLoaded);
    moreItems.forEach(item => renderFeedItem(item, container));
    itemsLoaded = freeflowData.length;
    setupAutoplayObserver();
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

// ──────────────────────────────────────────────────────────────
// ✅ Render
function renderInitialAndLoadRest() {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  const firstBatch = freeflowData.slice(0, 4);
  firstBatch.forEach(item => renderFeedItem(item, container));
  itemsLoaded = 4;
  setupAutoplayObserver();

  setTimeout(() => {
    const remaining = freeflowData.slice(4);
    remaining.forEach(item => renderFeedItem(item, container));
    itemsLoaded = freeflowData.length;
    setupAutoplayObserver();
  }, 300);
}

function renderFeedItem(item, container) {
  if (renderedIds.has(item.itemId)) return;
  renderedIds.add(item.itemId);

  const div = document.createElement("div");
  div.className = `feed-item ${item.contentType || ""}`;

  let mediaHtml = "";

  if (item.contentType === "image") {
    mediaHtml = `
      <img loading="lazy" src="${item.image}" alt="${item.title || ""}" />
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
          <h4 style="font-size: 13px; line-height: 1.3; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title || ""}</h4>
          ${item.price ? `<div style="font-size: 13px; color: #f53d2d; font-weight: bold;">${Number(item.price).toLocaleString()}đ</div>` : ""}
        </div>
      </div>
    `;
  }

  div.innerHTML = mediaHtml;

  if (item.contentType === "image") {
    div.addEventListener("click", () => (window.location.href = item.productPage));
  } else if (item.contentType === "youtube") {
    // đảm bảo overlay chỉ click video popup, không chặn các vùng khác
    const overlay = div.querySelector(".video-overlay");
    overlay.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const id = overlay.getAttribute("data-video");
      const popup = document.getElementById("videoOverlay");
      const frame = document.getElementById("videoFrame");
      if (frame) frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
      if (popup) popup.style.display = "flex";
      const viewBtn = document.getElementById("viewProductBtn");
      if (viewBtn) viewBtn.onclick = () => (window.location.href = item.productPage);
    });
  }

  container.appendChild(div);
}

// ──────────────────────────────────────────────────────────────
// ✅ Autoplay khi thấy 75% khung hình
function setupAutoplayObserver() {
  // Hủy observer cũ (nếu có) để tránh leak & nhân bản callback
  if (_autoplayObserver) {
    _autoplayObserver.disconnect();
    _autoplayObserver = null;
  }

  const iframes = document.querySelectorAll('iframe[data-video-id]');
  if (!iframes.length) return;

  _autoplayObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const iframe = entry.target;
      const id = iframe.getAttribute("data-video-id");
      const targetSrc = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${id}`;
      if (entry.isIntersecting) {
        if (iframe.src !== targetSrc) iframe.src = targetSrc;
      } else {
        if (iframe.src) iframe.src = "";
      }
    });
  }, { threshold: 0.75 });

  iframes.forEach((iframe) => _autoplayObserver.observe(iframe));
}

// ──────────────────────────────────────────────────────────────
// ✅ Cleanup (thay cho reload pageshow)
// Ngăn đơ back/next do reload cưỡng bức
function stopAllIframes() {
  document.querySelectorAll('iframe[data-video-id]').forEach(ifr => {
    if (ifr.src) ifr.src = "";
  });
}

function teardownAutoplayObserver() {
  if (_autoplayObserver) {
    _autoplayObserver.disconnect();
    _autoplayObserver = null;
  }
}

// Safari bfcache: dùng pagehide để dọn dẹp, KHÔNG reload
window.addEventListener("pagehide", () => {
  stopAllIframes();
  teardownAutoplayObserver();
});

// Khi tab ẩn đi cũng dọn dẹp
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAllIframes();
  }
});

// ──────────────────────────────────────────────────────────────
// ✅ Init an toàn: chỉ chạy trên trang có #freeflowFeed
document.addEventListener("DOMContentLoaded", () => {
  const hasFeed = !!document.getElementById("freeflowFeed");
  // Đừng chạm trang khác – tránh ảnh hưởng back/next ở toàn site
  if (!hasFeed) return;

  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) closeBtn.onclick = () => {
    const popup = document.getElementById("videoOverlay");
    const frame = document.getElementById("videoFrame");
    if (popup) popup.style.display = "none";
    if (frame) frame.src = "";
  };

  fetchFreeFlowData();
});

// ❌ ĐÃ GỠ bỏ hoàn toàn đoạn gây lỗi back/next:
// window.addEventListener("pageshow", function (event) {
//   if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
//     location.reload();
//   }
// });
