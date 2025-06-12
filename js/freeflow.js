// 🌀 FreeFlow v1.3 — Chuẩn popup video + bình đẳng ảnh & video
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
  const currentCategory = window.productCategory || "";
  const scored = freeflowData.map(item => {
    const base = item.basePriority || 0;
    const searchModifier = item.tags?.some(tag => tag.includes(searchTerm)) ? 10 : 0;
    const categoryBoost = item.tags?.some(tag => tag.includes(currentCategory)) ? 15 : 0;
    const random = Math.floor(Math.random() * (base * 0.3));
    item.finalPriority = base + searchModifier + categoryBoost + random;
    return item;
  });
  renderFeed(scored.sort((a, b) => b.finalPriority - a.finalPriority));
}

function renderFeed(feed) {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;
  container.innerHTML = "";

  feed.forEach(item => {
    const finalPrice = item.price ? Number(item.price).toLocaleString() + "đ" : "";
    const originalPrice = item.originalPrice > item.price
      ? `<span class="original-price">${Number(item.originalPrice).toLocaleString()}đ</span>` : "";

    const div = document.createElement("div");
    div.className = "feed-item";

    let html = "";
    if (item.contentType === "image") {
      html = `
        <img loading="lazy" src="${item.image}" alt="${item.title}" />
        <h4 class="one-line-title">${item.title}</h4>
        <div class="price-line"><span class="price">${finalPrice}</span> ${originalPrice}</div>
      `;
      div.onclick = () => window.location.href = item.productPage;
    } else if (item.contentType === "youtube") {
      html = `
        <div class="video-wrapper" style="position: relative;">
          <iframe 
            data-video-id="${item.youtube}"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen
            playsinline
            muted
          ></iframe>
          <div class="video-overlay" data-id="${item.youtube}" data-url="${item.productPage}" style="position:absolute;inset:0;cursor:pointer;"></div>
        </div>
        <div class="video-info" style="display: flex; gap: 8px; padding: 4px 8px 0;">
          <a href="${item.productPage}">
            <img src="${item.image}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;" />
          </a>
          <div style="flex: 1; overflow: hidden;">
            <h4 class="one-line-title">${item.title}</h4>
            <div style="font-size: 13px; color: #f53d2d; font-weight: bold;">${finalPrice}${originalPrice}</div>
          </div>
        </div>
      `;
    }

    div.innerHTML = html;
    container.appendChild(div);

    if (item.contentType === "youtube") {
      setTimeout(() => {
        const overlay = div.querySelector(".video-overlay");
        overlay.onclick = () => {
          const videoId = overlay.dataset.id;
          const productUrl = overlay.dataset.url;
          openFreeflowPopup(videoId, productUrl);
        };
      }, 0);
    }
  });

  observeYouTubeIframes();
}

function observeYouTubeIframes() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const iframe = entry.target;
      const id = iframe.dataset.videoId;
      if (entry.isIntersecting && !iframe.src) {
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${id}`;
      }
      if (!entry.isIntersecting && iframe.src) {
        iframe.src = "";
      }
    });
  }, { threshold: 0.75 });

  document.querySelectorAll('iframe[data-video-id]').forEach(iframe => observer.observe(iframe));
}

function openFreeflowPopup(videoId, productUrl) {
  const popup = document.getElementById("freeflowPopup");
  const iframe = document.getElementById("freeflowIframe");
  const btn = document.getElementById("freeflowBuyBtn");

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
  btn.onclick = () => window.open(productUrl, "_blank");

  popup.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeFreeflowPopup() {
  const iframe = document.getElementById("freeflowIframe");
  iframe.src = "";
  document.getElementById("freeflowPopup").style.display = "none";
  document.body.style.overflow = "";
}
