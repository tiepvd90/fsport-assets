// ✅ FREEFLOW CONFIG
const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000;
const fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";

let freeflowData = [];
let itemsLoaded = 0;
let productCategory = window.productCategory || "0";
const renderedIds = new Set();

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

// ✅ Lưu cache dữ liệu gốc
function saveCache(data) {
  const payload = { timestamp: Date.now(), data };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

// ✅ Trộn & sắp xếp dữ liệu
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

  const combined = interleaveBalanced(preferred, others);
  combined.sort((a, b) => b.finalPriority - a.finalPriority);

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

// ✅ Tải dữ liệu chính
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
    setupAutoplayObserver();
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
  setupAutoplayObserver();

  setTimeout(() => {
    const remaining = freeflowData.slice(4);
    remaining.forEach(item => renderFeedItem(item, container));
    itemsLoaded = freeflowData.length;
    setupAutoplayObserver();
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
      <div class="video-wrapper" style="position: relative;">
        <img class="video-thumb" src="https://img.youtube.com/vi/${item.youtube}/hqdefault.jpg"
             data-video="${item.youtube}"
             style="width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 8px; cursor: pointer;" />
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
    const thumb = div.querySelector(".video-thumb");
    thumb.addEventListener("click", () => {
      const id = thumb.getAttribute("data-video");
      const popup = document.getElementById("videoOverlay");
      const frame = document.getElementById("videoFrame");
      frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
      popup.style.display = "flex";
      const viewBtn = document.getElementById("viewProductBtn");
      if (viewBtn) viewBtn.onclick = () => window.location.href = item.productPage;
    });
  }

  container.appendChild(div);
}

// ✅ Tự động phát video khi scroll đến (80%) → thay ảnh bằng iframe
function setupAutoplayObserver() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const img = entry.target;
      const videoId = img.getAttribute("data-video");
      const wrapper = img.parentElement;

      if (entry.isIntersecting) {
        if (!wrapper.querySelector("iframe")) {
          const iframe = document.createElement("iframe");
          iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${videoId}`;
          iframe.style = "width: 100%; aspect-ratio: 9/16; border-radius: 8px;";
          iframe.setAttribute("allow", "autoplay; encrypted-media");
          iframe.setAttribute("frameborder", "0");
          iframe.setAttribute("allowfullscreen", "true");
          wrapper.innerHTML = "";
          wrapper.appendChild(iframe);
        }
      } else {
        if (wrapper.querySelector("iframe")) {
          wrapper.innerHTML = `<img class="video-thumb" src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg"
  data-video="${videoId}"
  style="width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 8px; cursor: pointer;" />`;

const newThumb = wrapper.querySelector(".video-thumb");
observer.observe(newThumb);

// ✅ Gắn lại sự kiện click để mở popup khi người dùng bấm vào thumbnail
newThumb.addEventListener("click", () => {
  const popup = document.getElementById("videoOverlay");
  const frame = document.getElementById("videoFrame");
  frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&controls=1`;
  popup.style.display = "flex";

  const viewBtn = document.getElementById("viewProductBtn");
  if (viewBtn) viewBtn.onclick = () => window.location.href = item.productPage;
});

        }
      }
    });
  }, { threshold: 0.8 });

  document.querySelectorAll(".video-thumb").forEach(img => observer.observe(img));
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
