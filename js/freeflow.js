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
let ytApiReady = false;

(function loadYouTubeAPI() {
  if (!window.YT || !window.YT.Player) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }
})();

window.onYouTubeIframeAPIReady = function () {
  ytApiReady = true;
  initializeYouTubePlayers();
};

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

function processAndSortData(data, isInitialLoad = false) {
  const random = () => Math.floor(Math.random() * 20) + 1;

  const enriched = data.map(item => ({
    ...item,
    finalPriority: (item.basePriority || 0) + random() + (item.productCategory === productCategory ? 75 : 0)
  }));

  let sorted = enriched;
  if (!isInitialLoad) {
    sorted = enriched.sort((a, b) => {
      const pDiff = b.finalPriority - a.finalPriority;
      return pDiff !== 0 ? pDiff : (a.itemId || "").localeCompare(b.itemId || "");
    }).map((item, index) => ({ ...item, displayIndex: index }));
  }

  const images = sorted.filter(i => i.contentType === "image");
  const videos = sorted.filter(i => i.contentType === "youtube");

  const mixed = [];
  let imgIndex = 0, vidIndex = 0, totalCount = 0;

  while (imgIndex < images.length && totalCount < 1000) {
    if (!isInitialLoad && (totalCount % 12 === 0) && vidIndex < videos.length) {
      mixed.push(videos[vidIndex++]);
      totalCount++;
    }
    if (imgIndex < images.length) {
      mixed.push(images[imgIndex++]);
      totalCount++;
    }
  }

  freeflowData = mixed;
}

async function fetchFreeFlowData() {
  try {
    const res = await fetch("/json/freeflow.json");
    const localData = await res.json();
    const validLocal = Array.isArray(localData) ? localData : [];

    processAndSortData(validLocal, true);
    renderInitialItems();
    saveCache(validLocal);

    fetchFromGoogleSheet(validLocal);
  } catch (e) {
    console.warn("Lỗi khi tải local JSON:", e);
    fetchFromGoogleSheet([]);
  }
}

async function fetchFromGoogleSheet(existingData) {
  try {
    const res = await fetch(fallbackUrl);
    const raw = await res.json();
    const sheetData = [];

    if (Array.isArray(raw)) {
      for (const row of raw) {
        try {
          if (!row.itemId || !row.contentType) continue;
          sheetData.push(row);
        } catch (e) {
          continue;
        }
      }
    }

    const map = new Map();
    existingData.forEach(i => map.set(i.itemId, i));
    sheetData.forEach(i => map.set(i.itemId, i));
    const merged = Array.from(map.values());

    processAndSortData(merged, false);
    saveCache(merged);

    const container = document.getElementById("freeflowFeed");
    const moreItems = freeflowData.slice(itemsLoaded);
    moreItems.forEach(item => renderFeedItem(item, container));
    itemsLoaded = freeflowData.length;
    if (ytApiReady) initializeYouTubePlayers();
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

function renderInitialItems() {
  const container = document.getElementById("freeflowFeed");
  const firstBatch = freeflowData.slice(0, 4);
  firstBatch.forEach(item => renderFeedItem(item, container));
  itemsLoaded = 4;
}

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
        style="width: 100%; aspect-ratio: 9/16; border-radius: 8px; cursor: pointer;">
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

function initializeYouTubePlayers() {
  document.querySelectorAll('iframe[data-video-id]').forEach(iframe => {
    const id = iframe.getAttribute("data-video-id");
    if (ytPlayers[id]) return;

    ytPlayers[id] = new YT.Player(iframe, {
      events: {
        'onReady': () => {
          iframe.setAttribute("data-ready", "1");

          iframe.onclick = () => {
            const popup = document.getElementById("videoOverlay");
            const frame = document.getElementById("videoFrame");
            frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
            popup.style.display = "flex";

            const product = freeflowData.find(i => i.youtube === id);
            const viewBtn = document.getElementById("viewProductBtn");
            if (viewBtn && product?.productPage) {
              viewBtn.onclick = () => window.location.href = product.productPage;
            }
          };
        }
      }
    });
  });

  setupAutoplayObserver();
}

function setupAutoplayObserver() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const iframe = entry.target;
      const id = iframe.getAttribute('data-video-id');
      const player = ytPlayers[id];
      if (!player || iframe.getAttribute("data-ready") !== "1") return;

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
