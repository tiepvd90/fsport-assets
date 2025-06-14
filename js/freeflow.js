// 🌀 FreeFlow v1.3 — Lazy Load + Autoplay + Fallback Google Sheet
let freeflowData = [];
let itemsLoaded = 0;
const BATCH_SIZE = 4;

async function fetchFreeFlowData() {
  const localUrl = "/json/freeflow.json";
  const fallbackUrl = "https://script.google.com/macros/s/AKfycbwu.../exec"; // 🔁 thay bằng link Google Sheet thật

  try {
    const res = await fetch(localUrl);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      freeflowData = data;
      lazyRenderNextBatch();
    } else {
      console.warn("⚠️ JSON nội bộ rỗng, chuyển sang Google Sheet...");
      await fetchFromGoogleSheet(fallbackUrl);
    }
  } catch (e) {
    console.warn("❌ Lỗi tải JSON nội bộ:", e);
    await fetchFromGoogleSheet(fallbackUrl);
  }
}

async function fetchFromGoogleSheet(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      freeflowData = data;
      lazyRenderNextBatch();
    } else {
      console.error("❌ Google Sheet cũng rỗng hoặc lỗi dữ liệu.");
    }
  } catch (e) {
    console.error("❌ Không thể tải từ Google Sheet:", e);
  }
}

function lazyRenderNextBatch() {
  const container = document.getElementById("freeflowFeed");
  if (!container || itemsLoaded >= freeflowData.length) return;

  const batch = freeflowData.slice(itemsLoaded, itemsLoaded + BATCH_SIZE);
  batch.forEach(item => renderFeedItem(item, container));
  itemsLoaded += BATCH_SIZE;
  setupAutoplayObserver();
}

function renderFeedItem(item, container) {
  const finalPrice = item.price ? Number(item.price).toLocaleString() + "đ" : "";
  const originalPrice =
    item.originalPrice && item.originalPrice > item.price
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
        <iframe 
          data-video-id="${item.youtube}"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          playsinline
          muted
          style="width: 100%; aspect-ratio: 9/16; border-radius: 8px;"
        ></iframe>
        <div class="video-overlay" data-video="${item.youtube}" style="position: absolute; inset: 0; cursor: pointer;"></div>
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
      };
    }, 0);
  } else {
    div.onclick = () => {
      window.location.href = item.productPage;
    };
  }

  container.appendChild(div);
}

function setupAutoplayObserver() {
  const iframes = document.querySelectorAll('iframe[data-video-id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const iframe = entry.target;
      const id = iframe.getAttribute('data-video-id');
      if (entry.isIntersecting) {
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${id}`;
      } else {
        iframe.src = "";
      }
    });
  }, { threshold: 0.5 });

  iframes.forEach(iframe => observer.observe(iframe));
}

function closeVideoPopup() {
  const frame = document.getElementById("videoFrame");
  if (frame) frame.src = "";
  const popup = document.getElementById("videoOverlay");
  if (popup) popup.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) closeBtn.onclick = closeVideoPopup;
  fetchFreeFlowData();

  // ➕ Lazy load thêm khi scroll chạm cuối
  window.addEventListener("scroll", () => {
    const scrollBottom = window.innerHeight + window.scrollY;
    if (scrollBottom >= document.body.offsetHeight - 300) {
      lazyRenderNextBatch();
    }
  });
});
