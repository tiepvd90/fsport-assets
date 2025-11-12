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

function renderProductVideos(videoList) {
  const slider = document.getElementById("videoSlider");
  if (!slider) {
    console.warn("❌ Không tìm thấy #videoSlider");
    return;
  }

  slider.innerHTML = ""; // reset trước khi render

  videoList.forEach((itemData, index) => {
    // ✅ Cho phép đọc cả kiểu string (URL cũ) hoặc object (có title)
    const { url, title } =
      typeof itemData === "string" ? { url: itemData, title: "" } : itemData;

    const id = extractVideoId(url);
    if (!id) return;

    const item = document.createElement("div");
    item.className = "video-item";

    // ✅ Nếu có title thì thêm tiêu đề in hoa, căn giữa
    const titleHTML = title
      ? `<h3 class="video-title">${title.toUpperCase()}</h3>`
      : "";

    if (index === 0) {
      // 🔴 Video đầu tiên: iframe autoplay
      item.innerHTML = `
        ${titleHTML}
        <div style="position: relative; width: 100%; aspect-ratio: 9/16; border-radius: 8px; overflow: hidden;">
          <iframe
            src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${id}"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen
            playsinline
            muted
            style="width: 100%; height: 100%;"
          ></iframe>
          <div onclick="openProductVideoPopup('${id}')" style="position: absolute; inset: 0; cursor: pointer;"></div>
        </div>
      `;
    } else {
      // 🟡 Các video khác: thumbnail
      const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      item.innerHTML = `
        ${titleHTML}
        <div class="video-thumb" onclick="openProductVideoPopup('${id}')">
          <img
            src="${thumb}"
            loading="lazy"
            alt="Video ${index + 1}"
            style="width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 8px;"
          />
        </div>
      `;
    }

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

// ✅ KHỞI TẠO TOÀN CỤC
window.initProductVideo = function () {
  const productPage = window.productPage || "default";
  const jsonUrl = "/json/productvideo.json";
  console.log("📦 Bắt đầu tải video cho:", productPage);

  fetch(jsonUrl)
    .then((res) => res.json())
    .then((data) => {
      const productData = data[productPage];
      if (!Array.isArray(productData)) {
        console.warn("⚠️ Không có video cho:", productPage);
        return;
      }
      renderProductVideos(productData);
    })
    .catch((err) => {
      console.error("❌ Lỗi khi tải productvideo.json:", err);
    });
};
