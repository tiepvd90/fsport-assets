// ===========================================================
// 📺 livevideo.js — Sticky mini popup livestream Facebook
// (LIVE ở trên trái, nút X bên phải, khung chữ nhật)
// ===========================================================

(function () {
  "use strict";

  if (document.getElementById("liveMiniPopup")) return;

  // ✅ Tạo container chính (popup mini)
  const container = document.createElement("div");
  container.id = "liveMiniPopup";
  container.style.position = "fixed";
  container.style.top = "140px";
  container.style.right = "10px";
  container.style.width = "90px";
  container.style.height = "150px";
  container.style.zIndex = "9999";
  container.style.background = "#000";
  container.style.boxShadow = "0 0 8px rgba(0,0,0,0.3)";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.overflow = "hidden";
  container.style.borderRadius = "0"; // bỏ bo góc

  // ✅ Thanh header (chứa chữ LIVE và nút X)
  const headerBar = document.createElement("div");
  headerBar.style.width = "100%";
  headerBar.style.height = "20px";
  headerBar.style.background = "#000";
  headerBar.style.display = "flex";
  headerBar.style.alignItems = "center";
  headerBar.style.justifyContent = "space-between";
  headerBar.style.padding = "0 4px";
  headerBar.style.boxSizing = "border-box";
  headerBar.style.position = "relative";

  // 🔴 Chữ LIVE bên trái
  const liveLabel = document.createElement("div");
  liveLabel.textContent = "LIVE";
  liveLabel.style.background = "#d32f2f";
  liveLabel.style.color = "#fff";
  liveLabel.style.fontWeight = "bold";
  liveLabel.style.fontSize = "11px";
  liveLabel.style.padding = "1px 6px";
  liveLabel.style.animation = "pulseLive 1.2s infinite";
  liveLabel.style.borderRadius = "0";
  liveLabel.style.margin = "0";

  // ❌ Nút đóng bên phải
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&#10005;"; // ký tự ×
  closeBtn.style.color = "#fff";
  closeBtn.style.fontSize = "12px";
  closeBtn.style.fontWeight = "bold";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.marginRight = "2px";
  closeBtn.addEventListener("click", () => {
    container.remove();
  });

  // ✅ Thêm LIVE và X vào header
  headerBar.appendChild(liveLabel);
  headerBar.appendChild(closeBtn);

  // ✅ Iframe livestream Facebook
  const iframe = document.createElement("iframe");
  iframe.src =
    "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=false&width=267&t=0&autoplay=true&mute=true";
  iframe.width = "90";
  iframe.height = "130";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allowfullscreen", "true");
  iframe.setAttribute(
    "allow",
    "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
  );

  // ✅ Thêm vào DOM
  container.appendChild(headerBar);
  container.appendChild(iframe);
  document.body.appendChild(container);

  // ✅ Hiệu ứng nhấp nháy nhẹ cho chữ LIVE
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulseLive {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();
