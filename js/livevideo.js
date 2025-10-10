// ===========================================================
// 📺 LIVE ICON + POPUP VIDEO FACEBOOK
// ===========================================================
(function () {
  "use strict";

  if (document.getElementById("liveIconContainer")) return;

  // === CONFIG ===
  const IMAGE_URL = "https://i.postimg.cc/0NThGSDz/LIVE.webp";
  const FB_VIDEO_URL =
    "https://www.facebook.com/plugins/video.php?height=476&href=" +
    encodeURIComponent("https://web.facebook.com/funsport1/videos/1506865553689608/") +
    "&show_text=false&autoplay=1&mute=1&width=267&height=476";

  // === TẠO CONTAINER CHÍNH ===
  const container = document.createElement("div");
  container.id = "liveIconContainer";
  container.style.position = "fixed";
  container.style.top = "140px";
  container.style.right = "10px";
  container.style.width = "70px";
  container.style.zIndex = "9999";
  container.style.textAlign = "center";
  container.style.fontFamily = "Be Vietnam Pro, sans-serif";

  // === CHỮ LIVE NHẤP NHÁY ===
  const liveLabel = document.createElement("div");
  liveLabel.textContent = "LIVE";
  liveLabel.style.color = "#ff0000";
  liveLabel.style.fontWeight = "900";
  liveLabel.style.fontSize = "14px";
  liveLabel.style.animation = "blink 1s infinite";
  liveLabel.style.marginBottom = "4px";
  liveLabel.style.textShadow = "0 0 4px #fff";

  // === ẢNH ICON ===
  const img = document.createElement("img");
  img.src = IMAGE_URL;
  img.style.width = "70px";
  img.style.cursor = "pointer";
  img.style.borderRadius = "8px";
  img.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
  img.title = "Xem livestream";

  // === NÚT X CLOSE ===
  const closeBtn = document.createElement("div");
  closeBtn.textContent = "×";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "-10px";
  closeBtn.style.right = "-8px";
  closeBtn.style.width = "20px";
  closeBtn.style.height = "20px";
  closeBtn.style.borderRadius = "50%";
  closeBtn.style.background = "#000";
  closeBtn.style.color = "#fff";
  closeBtn.style.fontSize = "14px";
  closeBtn.style.display = "flex";
  closeBtn.style.alignItems = "center";
  closeBtn.style.justifyContent = "center";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.boxShadow = "0 0 4px rgba(0,0,0,0.4)";
  closeBtn.title = "Đóng";

  closeBtn.addEventListener("click", () => {
    container.remove();
  });

  // === POPUP VIDEO FULL ===
  function openLivePopup() {
    if (document.getElementById("liveVideoPopup")) return;

    const overlay = document.createElement("div");
    overlay.id = "liveVideoPopup";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0,0,0,0.7)";
    overlay.style.zIndex = "10000";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const popup = document.createElement("div");
    popup.style.background = "#000";
    popup.style.borderRadius = "8px";
    popup.style.overflow = "hidden";
    popup.style.width = "90%";
    popup.style.maxWidth = "400px";
    popup.style.aspectRatio = "9 / 16";
    popup.innerHTML = `<iframe src="${FB_VIDEO_URL}" width="100%" height="100%" style="border:none;overflow:hidden" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;

    // Nút đóng popup
    const closeFull = document.createElement("div");
    closeFull.textContent = "×";
    closeFull.style.position = "absolute";
    closeFull.style.top = "10px";
    closeFull.style.right = "15px";
    closeFull.style.fontSize = "28px";
    closeFull.style.color = "#fff";
    closeFull.style.cursor = "pointer";
    closeFull.style.fontWeight = "bold";
    closeFull.addEventListener("click", () => overlay.remove());

    overlay.appendChild(popup);
    overlay.appendChild(closeFull);
    document.body.appendChild(overlay);
  }

  img.addEventListener("click", openLivePopup);

  // === THÊM TẤT CẢ VÀO TRANG ===
  container.appendChild(liveLabel);
  container.appendChild(img);
  container.appendChild(closeBtn);
  document.body.appendChild(container);

  // === TẠO CSS ANIMATION ===
  const style = document.createElement("style");
  style.textContent = `
    @keyframes blink {
      0%, 50%, 100% { opacity: 1; }
      25%, 75% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();
