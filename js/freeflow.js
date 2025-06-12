// 🌀 FreeFlow v1.2 — Sửa lỗi video trắng, autoplay, đóng popup
let freeflowData = [];

async function fetchFreeFlowData(jsonUrl) {
  try {
    const res = await fetch(jsonUrl);
    freeflowData = await res.json();
    updateFeed();
  } catch (err) {
    console.warn("❌ Không thể tải FreeFlow JSON:", err);
  }
}

function updateFeed(searchTerm = "") {
  const currentCategory = window.currentProductCategory || "";

  const scored = freeflowData.map(item => {
    const base = item.basePriority || 0;
    const searchModifier = item.tags?.some(tag => tag.includes(searchTerm)) ? 10 : 0;
    const categoryBoost = item.tags?.some(tag => tag.includes(currentCategory)) ? 15 : 0;
    const randomPoint = Math.floor(Math.random() * (base * 0.3));
    item.finalPriority = base + searchModifier + categoryBoost + randomPoint;
    return item;
  });

  const finalDisplay = [...scored].sort((a, b) => b.finalPriority - a.finalPriority);
  renderFeed(finalDisplay);
}

function renderFeed(feed) {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;
  container.innerHTML = "";

  feed.forEach((item, index) => {
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
            src="https://www.youtube.com/embed/${item.youtube}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${item.youtube}"
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
  });
}

function closeVideoPopup() {
  const frame = document.getElementById("videoFrame");
  if (frame) frame.src = "";
  const popup = document.getElementById("videoOverlay");
  if (popup) popup.style.display = "none";
}

// ✅ Gán sự kiện cho nút đóng popup video
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("videoCloseBtn");
  if (closeBtn) {
    closeBtn.onclick = closeVideoPopup;
  }
});
