/* ============================================================
   ✅ productvideo-2.js — Hiển thị video sản phẩm dạng 2 hàng
   ------------------------------------------------------------
   • Tự động đọc dữ liệu từ /json/productvideo.json
   • Chia video làm 2 hàng song song, vuốt ngang được
   • Hàng 1 autoplay video đầu tiên
   • Click từng video => mở popup xem lớn
   • Popup có nút "MUA NGAY" & "ĐÓNG" (giữ nguyên logic cũ)
   • CSS được load từ /css/productvideo-2.css
   ============================================================ */

(function () {
  "use strict";

  /* --- Inject HTML khối video + popup --- */
  const container = document.createElement("div");
  container.innerHTML = `
    <!-- ✅ KHỐI VIDEO 2 HÀNG -->
    <div class="video-slider-wrapper">
      <div class="video-slider" id="videoSlider"></div>
    </div>

    <!-- ✅ POPUP VIDEO -->
    <div id="videoPopup">
      <div class="popup-video-frame">
        <div class="popup-header">
          <button class="popup-buy" onclick="buyNow()">MUA NGAY</button>
          <button class="popup-close" onclick="closeProductVideoPopup()">ĐÓNG</button>
        </div>
        <iframe id="popupIframe" src="" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  /* --- Inject CSS --- */
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/css/productvideo-2.css";
  document.head.appendChild(css);

  /* --- HÀM TÁCH VIDEO ID --- */
  function extractVideoId(url) {
    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
    ];
    for (let p of patterns) {
      const match = url.match(p);
      if (match) return match[1];
    }
    return null;
  }

  /* --- RENDER 2 HÀNG VIDEO --- */
  function renderProductVideos(videoList) {
    const slider = document.getElementById("videoSlider");
    if (!slider) return console.warn("❌ Không tìm thấy #videoSlider");

    slider.innerHTML = "";

    const half = Math.ceil(videoList.length / 2);
    const topRow = videoList.slice(0, half);
    const bottomRow = videoList.slice(half);

    const row1 = document.createElement("div");
    const row2 = document.createElement("div");
    row1.className = "video-row";
    row2.className = "video-row";

    // --- Duyệt từng hàng ---
    [topRow, bottomRow].forEach((arr, rowIndex) => {
      const row = rowIndex === 0 ? row1 : row2;

      arr.forEach((itemData, index) => {
        const { url, title } =
          typeof itemData === "string" ? { url: itemData, title: "" } : itemData;
        const id = extractVideoId(url);
        if (!id) return;

        const item = document.createElement("div");
        item.className = "video-item";

        const titleHTML = title
          ? `<div class="video-title">${title.toUpperCase()}</div>`
          : `<div class="video-title"></div>`;

        // Hàng 1 - video đầu tiên autoplay
        if (rowIndex === 0 && index === 0) {
          item.innerHTML = `
            ${titleHTML}
            <iframe
              src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${id}"
              allow="autoplay; encrypted-media"
              frameborder="0"
              playsinline
              muted
            ></iframe>
          `;
          item.onclick = () => openProductVideoPopup(id);
        } else {
          const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
          item.innerHTML = `
            ${titleHTML}
            <div class="video-thumb">
              <img src="${thumb}" alt="Video thumbnail" loading="lazy" />
            </div>
          `;
          item.onclick = () => openProductVideoPopup(id);
        }

        row.appendChild(item);
      });

      slider.appendChild(row);
    });
  }

  /* --- POPUP LOGIC --- */
  window.openProductVideoPopup = function (id) {
    const popup = document.getElementById("videoPopup");
    const iframe = document.getElementById("popupIframe");
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    popup.style.display = "flex";
    document.body.style.overflow = "hidden";
  };

  window.closeProductVideoPopup = function () {
    const popup = document.getElementById("videoPopup");
    const iframe = document.getElementById("popupIframe");
    iframe.src = "";
    popup.style.display = "none";
    document.body.style.overflow = "";
  };

  window.buyNow = function () {
    closeProductVideoPopup();
    const atc = document.getElementById("btn-atc");
    if (atc) atc.click();
    else console.warn("⚠️ Không tìm thấy nút btn-atc");
  };

  /* --- KHỞI TẠO TOÀN CỤC --- */
  window.initProductVideo = function () {
    const productPage = window.productPage || "default";
    const jsonUrl = "/json/productvideo.json";

    console.log("🎬 Tải video cho:", productPage);

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
      .catch(err => console.error("❌ Lỗi tải productvideo.json:", err));
  };

  // --- Tự khởi động sau khi DOM sẵn ---
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.initProductVideo === "function") {
      window.initProductVideo();
    }
  });
})();
