function extractVideoId(url) {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
  ];
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function renderProductVideos(videoUrls) {
  const slider = document.getElementById("videoSlider");
  if (!slider) {
    console.warn("❌ Không tìm thấy #videoSlider");
    return;
  }

  videoUrls.forEach((url, index) => {
    const id = extractVideoId(url);
    if (!id) return;

    const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    const item = document.createElement("div");
    item.className = "video-item";

    item.innerHTML = `
      <div class="video-thumb" onclick="openProductVideoPopup('${id}')">
        <img src="${thumb}" loading="lazy" alt="Video ${index + 1}">
      </div>
      <button class="atc-button" onclick="addToCart()">THÊM VÀO GIỎ</button>
    `;

    slider.appendChild(item);
  });
}

function openProductVideoPopup(id) {
  const popup = document.getElementById("videoPopup");
  const iframe = document.getElementById("popupIframe");
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  popup.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeProductVideoPopup() {
  const popup = document.getElementById("videoPopup");
  const iframe = document.getElementById("popupIframe");
  iframe.src = "";
  popup.style.display = "none";
  document.body.style.overflow = "";
}

function addToCart() {
  const atc = document.getElementById("btn-atc");
  if (atc) atc.click();
  else alert("❌ Không tìm thấy nút btn-atc");
}

function buyNow() {
  closeProductVideoPopup();
  addToCart();
}

// ✅ HÀM TOÀN CỤC KHỞI TẠO VIDEO
window.initProductVideo = function () {
  const productPage = window.productPage || "default";
  const jsonUrl = "/json/productvideo.json";

  console.log("📦 Bắt đầu tải video cho:", productPage);

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      const productData = data[productPage];
      if (!Array.isArray(productData)) {
        console.warn("⚠️ Không có video cho:", productPage);
        return;
      }
      renderProductVideos(productData);
    })
    .catch(err => {
      console.error("❌ Lỗi khi tải productvideo.json:", err);
    });
};
