const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000;
const fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";
const CHUNK_SIZE = 8;

let freeflowData = [];
let itemsLoaded = 0;
const renderedIds = new Set();
const productCategory = window.productCategory || "0";

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

  const mixed = [];
  let imgIndex = 0, vidIndex = 0;
  while (imgIndex < images.length) {
    for (let k = 0; k < 6 && imgIndex < images.length; k++) {
      mixed.push(images[imgIndex++]);
    }
    if (vidIndex < videos.length) mixed.push(videos[vidIndex++]);
  }

  function reorderForMasonry(data, columns = 2) {
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

  freeflowData = reorderForMasonry(mixed);
}

async function fetchFreeFlowData() {
  const cached = loadCachedFreeFlow();
  if (cached) {
    processAndSortData(cached);
    setupFeedTrigger();
  }

  try {
    const res = await fetch("/json/freeflow.json");
    const localData = await res.json();
    const validData = Array.isArray(localData) ? localData : [];
    processAndSortData(validData);
    saveCache(validData);
    setupFeedTrigger();
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
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

function renderNextChunk() {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  const nextItems = freeflowData.slice(itemsLoaded, itemsLoaded + CHUNK_SIZE);
  nextItems.forEach(item => renderFeedItem(item, container));
  itemsLoaded += nextItems.length;
  setupAutoplayObserver();
}

function setupFeedTrigger() {
  const feedContainer = document.getElementById("freeflowFeed");
  if (!feedContainer) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        renderNextChunk(); // lô đầu tiên
        setupNextPageObserver(); // bắt đầu trigger cuộn tiếp
      }
    });
  }, { rootMargin: "800px 0px" });

  observer.observe(feedContainer);
}

function setupNextPageObserver() {
  const sentinel = document.createElement("div");
  sentinel.style.height = "1px";
  document.getElementById("freeflowFeed")?.appendChild(sentinel);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        renderNextChunk();
        setupNextPageObserver();
      }
    });
  }, { rootMargin: "800px 0px" });

  observer.observe(sentinel);
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
      ${item.price ? `<div class="price-line">
        <span class="price">${Number(item.price).toLocaleString()}đ</span>
        ${item.originalPrice > item.price ? `<span class="original-price">${Number(item.originalPrice).toLocaleString()}đ</span>` : ""}
      </div>` : ""}
    `;
    div.onclick = () => window.location.href = item.productPage;
  } else if (item.contentType === "youtube") {
    mediaHtml = `
      <div class="video-wrapper">
        <img class="video-thumb" src="https://fun-sport.co/assets/images/thumb/vid-thumb.webp" />
        <iframe
          data-video-id="${item.youtube}"
          src=""
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          playsinline
          muted>
        </iframe>
        <div class="video-overlay" data-video="${item.youtube}"></div>
      </div>
      <div class="video-info">
        <a href="${item.productPage}">
          <img src="${item.image}" />
        </a>
        <div style="flex:1; min-width:0">
          <h4>${item.title}</h4>
          <div class="price">${Number(item.price).toLocaleString()}đ</div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const overlay = div.querySelector(".video-overlay");
      overlay.onclick = () => {
        const id = overlay.getAttribute("data-video");
        const popup = document.getElementById("videoOverlay");
        const frame = document.getElementById("videoFrame");
        frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
        popup.style.display = "flex";
        const viewBtn = document.getElementById("viewProductBtn");
        if (viewBtn) viewBtn.onclick = () => window.location.href = item.productPage;
      };
    }, 0);
  }

  div.innerHTML = mediaHtml;
  container.appendChild(div);
}

// ✅ YouTube autoplay
function ytCmd(iframe, func) {
  try {
    iframe.contentWindow?.postMessage(JSON.stringify({
      event: "command",
      func,
      args: []
    }), "*");
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

        const onLoadOnce = () => {
          setTimeout(() => { ytPlay(iframe); }, 50);
          iframe.removeEventListener("load", onLoadOnce);
        };
        iframe.addEventListener("load", onLoadOnce);
        setTimeout(() => { ytPlay(iframe); }, 300);
        return;
      }

      if (entry.isIntersecting) {
        ytPlay(iframe);
      } else if (iframe.dataset.inited === "1") {
        ytPause(iframe);
      }
    });
  }, { threshold: 0.75 });

  iframes.forEach(iframe => observer.observe(iframe));
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

window.addEventListener("pageshow", function (event) {
  if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
    location.reload();
  }
});
