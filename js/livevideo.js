// ===========================================================
// 📺 livevideo.js — Sticky mini popup livestream Facebook
// (Autoplay khi reload + nút X ra ngoài popup)
// ===========================================================

(function () {
  "use strict";

  if (document.getElementById("liveMiniPopup")) return;

  // ✅ Tạo container chính
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

  // ✅ Nút đóng (X) — nhô ra ngoài khung
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&#10005;";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "-10px"; // nhô ra ngoài
  closeBtn.style.right = "-10px";
  closeBtn.style.width = "22px";
  closeBtn.style.height = "22px";
  closeBtn.style.borderRadius = "50%";
  closeBtn.style.background = "rgba(0,0,0,0.8)";
  closeBtn.style.color = "#fff";
  closeBtn.style.fontSize = "13px";
  closeBtn.style.fontWeight = "bold";
  closeBtn.style.display = "flex";
  closeBtn.style.alignItems = "center";
  closeBtn.style.justifyContent = "center";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.zIndex = "10000";
  closeBtn.style.boxShadow = "0 0 4px rgba(0,0,0,0.4)";
  closeBtn.addEventListener("click", () => container.remove());

  // ✅ Iframe livestream Facebook (autoplay + muted)
  const iframe = document.createElement("iframe");
  iframe.src =
    "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=false&width=267&t=0&autoplay=true&mute=true";
  iframe.width = "80";
  iframe.height = "120";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  iframe.allow =
    "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allowfullscreen", "true");

  // ✅ Dòng chữ LIVE (phẳng, không bo góc)
  const liveLabel = document.createElement("div");
  liveLabel.textContent = "LIVE";
  liveLabel.style.background = "#d32f2f";
  liveLabel.style.color = "#fff";
  liveLabel.style.fontWeight = "bold";
  liveLabel.style.fontSize = "12px";
  liveLabel.style.padding = "2px 10px";
  liveLabel.style.marginTop = "3px";
  liveLabel.style.animation = "pulseLive 1.2s infinite";
  liveLabel.style.width = "100%";
  liveLabel.style.textAlign = "center";

  // ✅ Gắn tất cả vào DOM
  container.appendChild(closeBtn);
  container.appendChild(iframe);
  container.appendChild(liveLabel);
  document.body.appendChild(container);

  // ✅ CSS hiệu ứng nhấp nháy
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulseLive {
      0% { opacity: 1; }
      50% { opacity: 0.6; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // ✅ Đảm bảo autoplay khi reload
  window.addEventListener("load", () => {
    const iframeSrc = iframe.src;
    iframe.src = ""; // reset nhỏ để tránh cache
    setTimeout(() => {
      iframe.src = iframeSrc; // reload lại iframe để autoplay luôn
    }, 300);
  });
})();
