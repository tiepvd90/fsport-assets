let freeflowData = [];
let itemsLoaded = 0;
const BATCH_SIZE = 4;
let sheetLoaded = false;
let isLoadingSheet = false;

async function fetchFreeFlowData() {
  const localUrl = "/json/freeflow.json";
  const fallbackUrl = "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec"; // Thay bằng link thật

  try {
    const res = await fetch(localUrl);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      processAndSortData(data);
    }
  } catch (e) {
    console.warn("⚠️ Lỗi tải JSON nội bộ:", e);
  }
}

async function fetchFromGoogleSheet(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      sheetLoaded = true;
      processAndSortData(data);
    }
  } catch (e) {
    console.error("❌ Không thể tải từ Google Sheet:", e);
  }
}

function processAndSortData(newData) {
  const currentCategory = (window.productCategory || "").toLowerCase();

  const processed = newData.map(item => {
    const base = Number(item.basePriority) || 0;
    const random = Math.floor(Math.random() * 20) + 1;
    const category = (item.productCategory || "").toLowerCase();
    const categoryScore = currentCategory && category === currentCategory ? 60 : 0;
    const finalPriority = base + random + categoryScore;
    return { ...item, finalPriority };
  });

  freeflowData = [...freeflowData, ...processed];
  freeflowData.sort((a, b) => (b.finalPriority || 0) - (a.finalPriority || 0));
  lazyRenderNextBatch();
}

function lazyRenderNextBatch() {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  if (itemsLoaded < freeflowData.length) {
    const batch = freeflowData.slice(itemsLoaded, itemsLoaded + BATCH_SIZE);
    batch.forEach(item => renderFeedItem(item, container));
    itemsLoaded += BATCH_SIZE;
    setupAutoplayObserver();
  }

  if (itemsLoaded >= freeflowData.length && !sheetLoaded && !isLoadingSheet) {
    isLoadingSheet = true;
    fetchFromGoogleSheet("https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec");
  }
}

function renderFeedItem(item, container) {
  const finalPrice = item.price ? Number(item.price).toLocaleString() + "đ" : "";
  const originalPrice = item.originalPrice && item.originalPrice > item.price
    ? `<span style="color:#555; font-size:12px; margin-left:4px; text-decoration: line-through;">
         ${Number(item.originalPrice).toLocaleString()}đ
       </span>` : "";

  const div = document.createElement("div");
  div.className = "feed-item";

  let mediaHtml = "";

  if (item.contentType === "image") {
    mediaHtml = `
      <img loading="lazy" src="${item.image}" alt="${item.title}" style="width: 100%; border-radius: 8px;" />
      <h4 style="margin: 4px 8px 0; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${item.title}
      </h4>
      <div style="padding: 2px 8px 6px; font-size: 13px;">
        <span style="color: #f53d2d; font-weight: bold;">${finalPrice}</span> ${originalPrice}
      </div>
    `;
  } else if (item.contentType === "youtube") {
    mediaHtml = `
      <div style="position: relative;">
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
      <div style="display: flex; align-items: center; gap: 8px; padding: 4px 8px 0;">
        <a href="${item.productPage}">
          <img src="${item.image}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px;" />
        </a>
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 13px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.title}
          </h4>
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
      const id = iframe.getAttribute("data-video-id");

      if (!iframe.src) {
        iframe.src = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&mute=1&playsinline=1&controls=0&loop=1&playlist=${id}`;
      }

      const command = entry.isIntersecting ? "playVideo" : "pauseVideo";
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: command, args: [] }),
        "*"
      );
    });
  }, { threshold: 0.6 });

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

  window.addEventListener("scroll", () => {
    const scrollBottom = window.innerHeight + window.scrollY;
    if (scrollBottom >= document.body.offsetHeight - 300) {
      lazyRenderNextBatch();
    }
  });
});
