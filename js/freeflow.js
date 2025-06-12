// 🌀 FreeFlow v1.2 — Popup video chuẩn productvideo, bình đẳng ảnh & video
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
      ? `<span class="original-price">${Number(item.originalPrice).toLocaleString()}đ</span>` : "";

    const div = document.createElement("div");
    div.className = "feed-item";

    let mediaHtml = "";
    if (item.contentType === "image") {
      mediaHtml = `
        <img loading="lazy" src="${item.image}" alt="${item.title}" />
        <h4 class="one-line-title">${item.title}</h4>
        <div class="price-line">
          <span class="price">${finalPrice}</span> ${originalPrice}
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
          ></iframe>
          <div class="video-overlay" data-video="${item.youtube}" style="position: absolute; inset: 0; cursor: pointer;"></div>
        </div>
        <div class="video-info" style="display: flex; align-items: center; gap: 8px; padding: 4px 8px 0;">
          <a href="${item.productPage}">
            <img src="${item.image}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px;" />
          </a>
          <div style="flex: 1; min-width: 0;">
            <h4 style="font-size: 13px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
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
          const productLink = item.productPage || "#";
          openVideoPopup(id, productLink);
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

function observeYouTubeIframes() {
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
  }, { threshold: 0.75 });

  const iframes = document.querySelectorAll('iframe[data-video-id]');
  iframes.forEach(iframe => observer.observe(iframe));
}

// ✅ Mở popup kiểu productvideo
function openVideoPopup(videoId, productUrl) {
  const popup = document.getElementById("videoPopup");
  const iframe = document.getElementById("popupIframe");
  const btn = document.getElementById("popupBuyBtn");

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
  btn.onclick = () => window.open(productUrl, "_blank");

  popup.style.display = "flex";
  document.body.style.overflow = "hidden";
}

// ✅ Đóng popup
function closeVideoPopup() {
  const iframe = document.getElementById("popupIframe");
  iframe.src = "";
  document.getElementById("videoPopup").style.display = "none";
  document.body.style.overflow = "";
}
