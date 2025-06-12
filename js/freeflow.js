// 🌀 FreeFlow v1.3 — Phiên bản chuẩn popup video + ảnh, không chặn scroll, không lỗi layout
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
          <div class="video-overlay" data-video="${item.youtube}" data-url="${item.productPage}" style="position: absolute; inset: 0; cursor: pointer;"></div>
        </div>
        <div class="video-info">
          <a href="${item.productPage}">
            <img src="${item.image}" class="video-thumb" />
          </a>
          <div class="video-meta">
            <h4>${item.title}</h4>
            <div class="video-price">${finalPrice}${originalPrice}</div>
          </div>
        </div>
      `;
    }

    div.innerHTML = mediaHtml;

    if (item.contentType === "youtube") {
      setTimeout(() => {
        const overlay = div.querySelector(".video-overlay");
        overlay.onclick = () => {
          const videoId = overlay.getAttribute("data-video");
          const productUrl = overlay.getAttribute("data-url");
          openFreeflowPopup(videoId, productUrl);
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

function openFreeflowPopup(videoId, productUrl) {
  const popup = document.getElementById("freeflowPopup");
  const iframe = document.getElementById("freeflowIframe");
  const btn = document.getElementById("freeflowBuyBtn");

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
  btn.onclick = () => window.open(productUrl, "_blank");

  popup.style.display = "flex";
  document.body.classList.add("no-scroll");
}

function closeFreeflowPopup() {
  const iframe = document.getElementById("freeflowIframe");
  iframe.src = "";
  document.getElementById("freeflowPopup").style.display = "none";
  document.body.classList.remove("no-scroll");
}
