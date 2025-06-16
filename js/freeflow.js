const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 phút
const fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";
const BATCH_SIZE = 4;

let freeflowData = [];
let itemsLoaded = 0;
const renderedItemIds = new Set();
const productCategory = window.productCategory || "0";

// ✅ Load cache
function loadCachedFreeFlow() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }
  } catch (e) {}
  return null;
}

// ✅ Save cache
function saveCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    data: data
  }));
}

// ✅ Fetch từ local + Google Sheet
async function fetchFreeFlowData() {
  const cached = loadCachedFreeFlow();
  if (cached) {
    processAndSortData(cached);
    lazyRenderNextBatch();
    return;
  }

  try {
    const res = await fetch("/json/freeflow.json");
    const localData = await res.json();
    const validData = Array.isArray(localData) ? localData : [];
    processAndSortData(validData);
    saveCache(validData);
    lazyRenderNextBatch();
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
    const combined = [...existingData, ...newItems];
    processAndSortData(combined);
    saveCache(combined);
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

// ✅ Tính điểm ưu tiên & sort
function processAndSortData(data) {
  freeflowData = data.map(item => {
    const match = (item.productCategory === productCategory) ? 60 : 0;
    return {
      ...item,
      finalPriority: (item.basePriority || 0) + Math.floor(Math.random() * 20) + match
    };
  }).sort((a, b) => b.finalPriority - a.finalPriority);
}

// ✅ Hiển thị batch tiếp theo
function lazyRenderNextBatch() {
  const container = document.getElementById("freeflowFeed");
  if (!container || itemsLoaded >= freeflowData.length) return;

  let rendered = 0;
  let index = itemsLoaded;

  while (rendered < BATCH_SIZE && index < freeflowData.length) {
    const item = freeflowData[index++];
    if (!renderedItemIds.has(item.itemId)) {
      renderFeedItem(item, container);
      renderedItemIds.add(item.itemId);
      rendered++;
    }
  }

  itemsLoaded = index;
  setupAutoplayObserver();
}

// ✅ Render từng item
function renderFeedItem(item, container) {
  const finalPrice = item.price ? Number(item.price).toLocaleString() + "đ" : "";
  const originalPrice = item.originalPrice > item.price
    ? `<span class="original-price" style="color:#999; font-size:13px; text-decoration: line-through; margin-left:6px;">
         ${Number(item.originalPrice).toLocaleString()}đ
       </span>` : "";

  const div = document.createElement("div");
  div.className = "feed-item";

  if (item.contentType === "image") {
    div.innerHTML = `
      <img loading="lazy" src="${item.image}" alt="${item.title}" />
      <h4 class="one-line-title">${item.title}</h4>
      <div class="price-line">
        <span class="price">${finalPrice}</span> ${originalPrice}
      </div>
    `;
    div.onclick = () => window.location.href = item.productPage;
  }

  else if (item.contentType === "youtube") {
    const videoSrc = `https://www.youtube.com/embed/${item.youtube}?enablejsapi=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${item.youtube}`;
    div.innerHTML = `
      <div class="video-wrapper">
        <img src="https://img.youtube.com/vi/${item.youtube}/hqdefault.jpg"
             class="youtube-thumb" />
        <iframe data-video-id="${item.youtube}" src="${videoSrc}"></iframe>
        <div class="video-overlay" data-video="${item.youtube}"></div>
      </div>
      <div class="video-info">
        <a href="${item.productPage}">
          <img src="${item.image}" class="product-thumb" />
        </a>
        <div class="info-text">
          <h4>${item.title}</h4>
          <div class="price">${finalPrice}${originalPrice}</div>
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
      };
    }, 0);
  }

  container.appendChild(div);
}

// ✅ Autoplay mượt bằng postMessage
function setupAutoplayObserver() {
  const iframes = document.querySelectorAll("iframe[data-video-id]");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const iframe = entry.target;
      const win = iframe.contentWindow;
      const thumb = iframe.previousElementSibling;

      if (entry.isIntersecting) {
        win?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        if (thumb) thumb.style.display = "none";
      } else {
        win?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        if (thumb) thumb.style.display = "block";
      }
    });
  }, { threshold: 0.5 });

  iframes.forEach(iframe => observer.observe(iframe));
}

// ✅ Đóng popup video
function closeVideoPopup() {
  const frame = document.getElementById("videoFrame");
  if (frame) frame.src = "";
  const popup = document.getElementById("videoOverlay");
  if (popup) popup.style.display = "none";
}

// ✅ Khởi tạo
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) closeBtn.onclick = closeVideoPopup;

  fetchFreeFlowData();

  window.addEventListener("scroll", () => {
    const scrollBottom = window.innerHeight + window.scrollY;
    if (scrollBottom >= document.body.offsetHeight - 300) {
      lazyRenderNextBatch();
    }
  });
});
