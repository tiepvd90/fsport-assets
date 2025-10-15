// ===========================================================
// 📺 LIVE ICON HÌNH CHỮ NHẬT — CLICK MỞ THẲNG VIDEO FACEBOOK
// ===========================================================
(function () {
  "use strict";

  if (document.getElementById("liveIconContainer")) return;

  // === CONFIG ===
  const IMAGE_URL = "https://i.postimg.cc/0NThGSDz/LIVE.webp";
  const FB_DIRECT_URL = "https://www.facebook.com/funsport1/videos/1506865553689608/";

  // === CONTAINER CHÍNH ===
  const container = document.createElement("div");
  container.id = "liveIconContainer";
  container.style.position = "fixed";
  container.style.top = "140px";
  container.style.right = "10px";
  container.style.width = "70px";
  container.style.background = "#fff";
  container.style.zIndex = "7999";
  container.style.textAlign = "center";
  container.style.fontFamily = "Be Vietnam Pro, sans-serif";
  container.style.border = "1px solid #ccc";
  container.style.boxShadow = "0 0 8px rgba(0,0,0,0.25)";
  container.style.cursor = "pointer";

  // === CHỮ LIVE (bọc trong hình chữ nhật nền trắng) ===
  const liveWrapper = document.createElement("div");
  liveWrapper.style.background = "#fff";
  liveWrapper.style.borderBottom = "1px solid #ccc";
  liveWrapper.style.padding = "2px 0";
  liveWrapper.style.fontWeight = "900";
  liveWrapper.style.fontSize = "13px";
  liveWrapper.style.color = "#ff0000";
  liveWrapper.style.animation = "blink 1s infinite";
  liveWrapper.textContent = "LIVE";

  // === ẢNH LIVESTREAM ===
  const img = document.createElement("img");
  img.src = IMAGE_URL;
  img.style.width = "100%";
  img.style.display = "block";
  img.style.border = "none";
  img.style.margin = "0";
  img.title = "Xem livestream trên Facebook";

  // Khi click vào ảnh → mở thẳng Facebook
  img.addEventListener("click", () => {
    window.open(FB_DIRECT_URL, "_blank"); // mở tab mới
  });

  // === NÚT X CLOSE ===
  const closeBtn = document.createElement("div");
  closeBtn.textContent = "×";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "-10px";
  closeBtn.style.right = "-8px";
  closeBtn.style.width = "20px";
  closeBtn.style.height = "20px";
  closeBtn.style.background = "#000";
  closeBtn.style.color = "#fff";
  closeBtn.style.fontSize = "14px";
  closeBtn.style.display = "flex";
  closeBtn.style.alignItems = "center";
  closeBtn.style.justifyContent = "center";
  closeBtn.style.cursor = "pointer";
  closeBtn.title = "Đóng";

  closeBtn.addEventListener("click", () => container.remove());

  // === GẮN TẤT CẢ VÀO TRANG ===
  container.appendChild(liveWrapper);
  container.appendChild(img);
  container.appendChild(closeBtn);
  document.body.appendChild(container);

  // === CSS hiệu ứng nhấp nháy ===
  const style = document.createElement("style");
  style.textContent = `
    @keyframes blink {
      0%, 50%, 100% { opacity: 1; }
      25%, 75% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();
