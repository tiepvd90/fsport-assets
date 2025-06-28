const CACHE_KEY = "freeflowCache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 phút
const fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec";
let freeflowData = [];
let itemsLoaded = 0;
let productCategory = window.productCategory || "0";

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

// ✅ Sắp xếp và tính điểm ưu tiên
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

  // ✅ Gộp lại
  const combined = [...preferred, ...others];

  // ✅ Phân loại image và youtube
  const images = combined.filter(i => i.contentType === "image");
  const videos = combined.filter(i => i.contentType === "youtube");

  const mixed = [];
  let imgIndex = 0, vidIndex = 0;

  while (imgIndex < images.length) {
    // Thêm tối đa 6 ảnh
    for (let k = 0; k < 6 && imgIndex < images.length; k++) {
      mixed.push(images[imgIndex++]);
    }

    // Sau đó chèn 1 video (nếu còn)
    if (vidIndex < videos.length) {
      mixed.push(videos[vidIndex++]);
    }
  }

  // Nếu còn video dư, thêm cuối cùng
  while (vidIndex < videos.length) {
    mixed.push(videos[vidIndex++]);
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

    // Nối thêm từ Google Sheet
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

    // Render các item mới sau khi tải xong
    const container = document.getElementById("freeflowFeed");
    const moreItems = freeflowData.slice(itemsLoaded);
    moreItems.forEach(item => renderFeedItem(item, container));
    itemsLoaded = freeflowData.length;
    setupAutoplayObserver();
  } catch (e) {
    console.error("Không thể fetch từ Google Sheet:", e);
  }
}

// ✅ Render 4 item đầu → sau 300ms render hết
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

// ✅ Render item đơn
function renderFeedItem(item, container) {
  const finalPrice = item.price ? Number(item.price).toLocaleString() + "đ" : "";
  const originalPrice = (item.originalPrice && item.originalPrice > item.price)
    ? `<span class="original-price" style="color:#555; font-size:12px; margin-left:4px; text-decoration: line-through;">
         ${Number(item.originalPrice).toLocaleString()}đ
       </span>` : "";

  const div = document.createElement("div");
  div.className = "feed-item";

  let mediaHtml = "";

  if (item.contentType === "image") {
    mediaHtml = `
      <img loading="lazy" src="${item.image}" alt="${item.title}" style="width: 100%; border-radius: 8px;" />
      <h4 class="one-line-title" style="margin: 4px 8px 0; font-size: 13px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${item.title}
      </h4>
      <div class="price-line" style="padding: 2px 8px 6px; font-size: 13px;">
        <span class="price" style="color: #f53d2d; font-weight: bold;">${finalPrice}</span> ${originalPrice}
      </div>
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
          style="width: 100%; aspect-ratio: 9/16; border-radius: 8px; position: relative; z-index: 2;"
        ></iframe>
        <div class="video-overlay" data-video="${item.youtube}" style="position: absolute; inset: 0; cursor: pointer; z-index: 3;"></div>
      </div>
      <div class="video-info" style="display: flex; align-items: center; gap: 8px; padding: 4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px;" />
        </a>
        <div style="flex: 1; min-width: 0;">
          <h4 style="
            font-size: 13px;
            line-height: 1.3;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${item.title}</h4>
          <div style="font-size: 13px; color: #f53d2d; font-weight: bold;">
            ${finalPrice}${originalPrice}
          </div>
        </div>
      </div>
    `;
  }

  div.innerHTML = mediaHtml;

  if (item.contentType === "youtube") {
    setTimeout(() => {
      const overlay = div.querySelector(".video-overlay");
      overlay.onclick = () => {
        const id = overlay.getAttribute("data-video");
        const popup = document.getElementById("videoOverlay");
        const frame = document.getElementById("videoFrame");
        frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
        popup.style.display = "flex";
        const viewBtn = document.getElementById("viewProductBtn");
if (viewBtn) {
  viewBtn.onclick = () => window.location.href = item.productPage;
}
      };
    }, 0);
  } else {
    div.onclick = () => {
      window.location.href = item.productPage;
    };
  }

  container.appendChild(div);
}

// ✅ Autoplay cho iframe YouTube
function setupAutoplayObserver() {
  const iframes = document.querySelectorAll('iframe[data-video-id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const iframe = entry.target;
      const id = iframe.getAttribute('data-video-id');
      if (!id) return;

      const targetSrc = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${id}`;
      if (entry.isIntersecting) {
        if (iframe.src !== targetSrc) iframe.src = targetSrc;
      } else {
        if (iframe.src !== "") iframe.src = "";
      }
    });
  }, { threshold: 0.5 });

  iframes.forEach(iframe => observer.observe(iframe));
}

// ✅ Đóng popup
function closeVideoPopup() {
  const frame = document.getElementById("videoFrame");
  if (frame) frame.src = "";
  const popup = document.getElementById("videoOverlay");
  if (popup) popup.style.display = "none";
}

// ✅ Khởi động
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) closeBtn.onclick = closeVideoPopup;

  fetchFreeFlowData();
});
