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

  // Tính finalPriority
  const scored = freeflowData.map(item => {
    const base = item.basePriority || 0;
    const searchModifier = item.tags?.some(tag => tag.includes(searchTerm)) ? 10 : 0;
    const categoryBoost = item.tags?.some(tag => tag.includes(currentCategory)) ? 15 : 0;
    const randomPoint = Math.floor(Math.random() * (base * 0.3));
    item.finalPriority = base + searchModifier + categoryBoost + randomPoint;
    return item;
  });

  // Tách và sort riêng
  const images = scored
    .filter(item => item.contentType === "image")
    .sort((a, b) => b.finalPriority - a.finalPriority);

  const videos = scored
    .filter(item => item.contentType === "youtube")
    .sort((a, b) => b.finalPriority - a.finalPriority);

  // Ghép 8 ảnh + 1 video
  let finalDisplay = [];
  let imgIndex = 0;
  let vidIndex = 0;

  while (imgIndex < images.length) {
    for (let i = 0; i < 8 && imgIndex < images.length; i++) {
      finalDisplay.push(images[imgIndex++]);
    }
    if (vidIndex < videos.length) {
      finalDisplay.push(videos[vidIndex++]);
    }
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
        <iframe 
          data-video-id="${item.youtube}"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          playsinline
          muted
        ></iframe>
      `;
    }

    div.innerHTML = `
      ${mediaHtml}
      <h4 class="one-line-title">${item.title}</h4>
      <div class="price-line">
        <span class="price">${finalPrice}</span> ${originalPrice}
      </div>
    `;

    div.onclick = () => {
      if (item.contentType === "youtube") {
        // 👉 Mở video YouTube Shorts
        window.open(`https://www.youtube.com/shorts/${item.youtube}`, '_blank');
      } else {
        window.location.href = item.productPage;
      }
    };

    container.appendChild(div);
  });

  observeYouTubeIframes();
}

// 👁️ Auto-play video khi trong tầm nhìn
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const iframe = entry.target;
    const videoId = iframe.getAttribute("data-video-id");
    if (entry.isIntersecting) {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${videoId}`;
    } else {
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
