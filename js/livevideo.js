// ===========================================================
// 📺 livevideo.js — Sticky mini popup livestream Facebook
// - Vị trí: góc phải, cách top 140px
// - Rộng 80px, autoplay, muted
// - Có chữ LIVE đỏ nhấp nháy bên dưới video
// ===========================================================

(function () {
  "use strict";

  // ✅ Tránh tạo trùng nhiều lần
  if (document.getElementById("liveMiniPopup")) return;

  // ✅ Tạo container
  const container = document.createElement("div");
  container.id = "liveMiniPopup";
  container.style.position = "fixed";
  container.style.top = "140px";
  container.style.right = "10px";
  container.style.width = "80px";
  container.style.height = "150px";
  container.style.zIndex = "9999";
  container.style.borderRadius = "8px";
  container.style.overflow = "hidden";
  container.style.boxShadow = "0 0 8px rgba(0,0,0,0.3)";
  container.style.background = "#000";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";

  // ✅ Thêm iframe livestream Facebook
  const iframe = document.createElement("iframe");
  iframe.src =
    "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=false&width=267&t=0&autoplay=true&mute=true";
  iframe.width = "80";
  iframe.height = "120";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allowfullscreen", "true");
  iframe.setAttribute(
    "allow",
    "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
  );

  // ✅ Tạo dòng chữ LIVE bên dưới
  const liveLabel = document.createElement("div");
  liveLabel.textContent = "LIVE";
  liveLabel.style.background = "#d32f2f";
  liveLabel.style.color = "#fff";
  liveLabel.style.fontWeight = "bold";
  liveLabel.style.fontSize = "12px";
  liveLabel.style.padding = "3px 8px";
  liveLabel.style.borderRadius = "10px";
  liveLabel.style.marginTop = "4px";
  liveLabel.style.animation = "pulseLive 1.2s infinite";

  // ✅ Gắn tất cả vào DOM
  container.appendChild(iframe);
  container.appendChild(liveLabel);
  document.body.appendChild(container);

  // ✅ Hiệu ứng nhấp nháy chữ LIVE
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulseLive {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
})();
