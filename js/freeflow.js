// 🌀 FreeFlow v1.0 — Feed với ảnh + video + popup fullscreen
let freeflowData = [];
let filteredFeed = [];

// 🔁 Fetch JSON từ Google Sheet
async function fetchFreeFlowData(jsonUrl) {
  try {
    const res = await fetch(jsonUrl);
    freeflowData = await res.json();
    updateFeed();
  } catch (err) {
    console.warn("❌ Không thể tải FreeFlow JSON:", err);
  }
}

// 🔍 Tính điểm và ghép 8 ảnh → 1 video
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

  const images = scored.filter(i => i.contentType === "image").sort((a, b) => b.finalPriority - a.finalPriority);
  const videos = scored.filter(i => i.contentType === "youtube").sort((a, b) => b.finalPriority - a.finalPriority);

  let finalDisplay = [], imgIndex = 0, vidIndex = 0;
  while (imgIndex < images.length) {
    for (let i = 0; i < 8 && imgIndex < images.length; i++) finalDisplay.push(images[imgIndex++]);
    if (vidIndex < videos.length) finalDisplay.push(videos[vidIndex++]);
  }

  renderFeed(finalDisplay);
}

// 🎨 Hiển thị ra HTML
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
      mediaHtml = `<img loading="lazy" src="${item.image}" alt="${item.title}">`;
    } else if (item.contentType === "youtube") {
      mediaHtml = `
        <div class="video-wrapper">
          <iframe 
            data-video-id="${item.youtube}"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen
            playsinline
            muted
          ></iframe>
          <div class="video-overlay" data-video="${item.youtube}"></div>
        </div>
      `;
    }

    div.innerHTML = `
      ${mediaHtml}
      <h4 class="one-line-title">${item.title}</h4>
      <div class="price-line">
        <span class="price">${finalPrice}</span> ${originalPrice}
      </div>
    `;

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

  observeYouTubeIframes();
}

// 👁️ Auto-play video khi trong tầm nhìn
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

// ❌ Đóng video popup khi ấn nút X
function closeVideoPopup() {
  const frame = document.getElementById("videoFrame");
  frame.src = "";
  document.getElementById("videoOverlay").style.display = "none";
}
