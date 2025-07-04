// ✅ FREEFLOW CONFIG
const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000;
const fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";

let freeflowData = [];
let itemsLoaded = 0;
let productCategory = window.productCategory || "0";
const renderedIds = new Set();
const ytPlayers = {};
const activePlayers = new Set();

// ✅ Load cache nếu còn hạn
function loadCachedFreeFlow() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }
  } catch (e) {}
  return null;
}

// ✅ Lưu cache
function saveCache(data) {
  const payload = { timestamp: Date.now(), data };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

// ✅ Sắp xếp và trộn nội dung
function processAndSortData(data) {
  const random = () => Math.floor(Math.random() * 20) + 1;

  const preferred = data
    .filter(item => item.productCategory === productCategory)
    .map(item => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random() + 75
    }))
    .sort((a, b) => b.finalPriority - a.finalPriority);

  const others = data
    .filter(item => item.productCategory !== productCategory)
    .map(item => ({
      ...item,
      finalPriority: (item.basePriority || 0) + random()
    }))
    .sort((a, b) => b.finalPriority - a.finalPriority);

  const combined = [...preferred, ...others];

  const images = combined.filter(i => i.contentType === "image");
  const videos = combined.filter(i => i.contentType === "youtube");

  const mixed = [];
  let imgIndex = 0, vidIndex = 0;

  while (imgIndex < images.length) {
    for (let k = 0; k < 6 && imgIndex < images.length; k++) {
      mixed.push(images[imgIndex++]);
    }
    if (vidIndex < videos.length) mixed.push(videos[vidIndex++]);
  }

  freeflowData = mixed;
}

// ✅ Tải dữ liệu chính
async function fetchFreeFlowData() {
  const cached = loadCachedFreeFlow();
  if (cached) {
    processAndSortData(cached);
    renderInitialAndLoadRest();
    return;
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

// ✅ Gọi Google Sheet
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
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

// ✅ Render ban đầu
function renderInitialAndLoadRest() {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  const firstBatch = freeflowData.slice(0, 4);
  firstBatch.forEach(item => renderFeedItem(item, container));
  itemsLoaded = 4;

  setTimeout(() => {
    const remaining = freeflowData.slice(4);
    remaining.forEach(item => renderFeedItem(item, container));
    itemsLoaded = freeflowData.length;
  }, 300);
}

// ✅ Render từng item
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
      <iframe
        data-video-id="${item.youtube}"
        src="https://www.youtube.com/embed/${item.youtube}?enablejsapi=1&mute=1&playsinline=1&controls=1"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen
        playsinline
        style="width: 100%; aspect-ratio: 9/16; border-radius: 8px;">
      </iframe>
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
  }

  container.appendChild(div);
}

// ✅ Tự động phát video (max 2 video cùng lúc)
function setupAutoplayObserver() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const iframe = entry.target;
      const id = iframe.getAttribute('data-video-id');
      const player = ytPlayers[id];
      if (!player) return;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
        if (!activePlayers.has(id)) {
          if (activePlayers.size >= 2) {
            const oldest = [...activePlayers][0];
            ytPlayers[oldest]?.pauseVideo();
            activePlayers.delete(oldest);
          }
          activePlayers.add(id);
        }
        player.playVideo();
      } else {
        if (activePlayers.has(id)) {
          player.pauseVideo();
          activePlayers.delete(id);
        }
      }
    });
  }, {
    threshold: [0.9]
  });

  document.querySelectorAll('iframe[data-video-id]').forEach(iframe => {
    observer.observe(iframe);
  });
}

// ✅ Khởi tạo YouTube Player
function onYouTubeIframeAPIReady() {
  document.querySelectorAll('iframe[data-video-id]').forEach(iframe => {
    const id = iframe.getAttribute("data-video-id");
    ytPlayers[id] = new YT.Player(iframe, {
      events: {
        'onReady': () => {
          iframe.setAttribute("data-ready", "1");
        }
      }
    });
  });

  setupAutoplayObserver();
}

// ✅ Init
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) closeBtn.onclick = () => {
    const popup = document.getElementById("videoOverlay");
    const frame = document.getElementById("videoFrame");
    if (popup) popup.style.display = "none";
    if (frame) frame.src = "";
  };

  fetchFreeFlowData();
});
