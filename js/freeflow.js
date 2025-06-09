let freeflowData = [];
let filteredFeed = [];

// 🔁 Fetch JSON từ Google Sheet hoặc URL đầu vào
async function fetchFreeFlowData(jsonUrl) {
  try {
    const res = await fetch(jsonUrl);
    freeflowData = await res.json();
    updateFeed();
  } catch (err) {
    console.warn("Không thể tải FreeFlow JSON:", err);
  }
}

// 🔍 Lọc + Tính độ ưu tiên
function updateFeed(searchTerm = "") {
  filteredFeed = freeflowData.map(item => {
    let searchModifier = item.tags?.some(tag => tag.includes(searchTerm)) ? 10 : 0;
    item.finalPriority = item.basePriority + searchModifier;
    return item;
  }).sort((a, b) => b.finalPriority - a.finalPriority);

  renderFeed(filteredFeed);
}

// 🎨 Render giao diện
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

    div.onclick = () => window.location.href = item.productPage;
    container.appendChild(div);
  });

  // Sau khi render xong → quan sát video
  observeYouTubeIframes();
}

// 👁️ Tự động autoplay video trong tầm nhìn
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const iframe = entry.target;
    const videoId = iframe.getAttribute("data-video-id");
    if (entry.isIntersecting) {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${videoId}`;
    } else {
      iframe.src = ""; // Dừng video khi ra khỏi vùng nhìn
    }
  });
}, {
  threshold: 0.75
});

function observeYouTubeIframes() {
  const iframes = document.querySelectorAll('iframe[data-video-id]');
  iframes.forEach(iframe => observer.observe(iframe));
}
