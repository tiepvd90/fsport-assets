// 🌀 FreeFlow v1.1 — Bình đẳng video & ảnh, video có thumbnail, tiêu đề gọn đẹp
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

  feed.forEach(item => {
    const finalPrice = item.price ? Number(item.price).toLocaleString() + "đ" : "";
    const originalPrice = item.originalPrice && item.originalPrice > item.price
      ? `<span class="original-price" style="color:#555; font-size:12px; margin-left:4px; text-decoration: line-through;">${Number(item.originalPrice).toLocaleString()}đ</span>` : "";

    const div = document.createElement("div");
    div.className = "feed-item";

    let mediaHtml = "";
    if (item.contentType === "image") {
      mediaHtml = `<img loading="lazy" src="${item.image}" alt="${item.title}" style="width: 100%; border-radius: 8px;" />`;
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
    <div style="flex: 1; min-width: 0;"> <!-- ❗ Giới hạn chiều ngang để ellipsis hoạt động -->
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

    if (item.contentType === "image") {
      mediaHtml += `
        <h4 class="one-line-title" style="margin: 4px 8px 0; font-size: 13px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${item.title}
        </h4>
        <div class="price-line" style="padding: 2px 8px 6px; font-size: 13px;">
          <span class="price" style="color: #f53d2d; font-weight: bold;">${finalPrice}</span> ${originalPrice}
        </div>
      `;
    }

    div.innerHTML = mediaHtml;

    if (item.contentType === "youtube") {
      setTimeout(() => {
        const overlay = div.querySelector(".video-overlay");
        overlay.onclick = () => {
          const id = overlay.getAttribute("data-video");
const productLink = feed.find(i => i.youtube === id)?.productPage || "#";
const popup = document.getElementById("videoOverlay");
const frame = document.getElementById("videoFrame");
const viewBtn = document.getElementById("viewProductBtn");

frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&controls=1`;
viewBtn.href = productLink;
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

  observeYouTubeIframes();
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const iframe = entry.target;
    const videoId = iframe.getAttribute("data-video-id");
    if (entry.isIntersecting && iframe.src === "") {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${videoId}`;
    }
    if (!entry.isIntersecting && iframe.src !== "") {
      iframe.src = "";
    }
  });
}, {
  threshold: 0.75
});

function observeYouTubeIframes() {
  const iframes = document.querySelectorAll('iframe[data-video-id]');
  iframes.forEach(iframe => observer.observe(iframe));
}

function closeVideoPopup() {
  const frame = document.getElementById("videoFrame");
  frame.src = "";
  document.getElementById("videoOverlay").style.display = "none";
}
