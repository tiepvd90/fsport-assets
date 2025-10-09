// ===========================================================
// 📺 livevideo.js — Mini popup livestream Facebook (Fixed)
// - Autoplay thật sự khi reload
// - Nút X nổi ra ngoài, dễ thấy và hoạt động chuẩn
// ===========================================================

(function () {
  "use strict";

  // Ngăn tạo trùng nhiều lần
  if (document.getElementById("liveMiniPopup")) return;

  // ✅ Container chính
  const container = document.createElement("div");
  container.id = "liveMiniPopup";
  Object.assign(container.style, {
    position: "fixed",
    top: "140px",
    right: "10px",
    width: "80px",
    height: "150px",
    zIndex: "99999",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px rgba(0,0,0,0.4)",
  });

  // ✅ Nút đóng (X) — hiển thị rõ ràng
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&#10005;";
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "-14px",
    right: "-14px",
    width: "26px",
    height: "26px",
    background: "rgba(0,0,0,0.85)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "bold",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: "100000",
    boxShadow: "0 0 4px rgba(255,255,255,0.5)",
  });
  closeBtn.addEventListener("click", () => container.remove());

  // ✅ Facebook iframe (autoplay + muted)
  const iframe = document.createElement("iframe");
  iframe.width = "80";
  iframe.height = "120";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allowfullscreen", "true");
  iframe.allow =
    "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";

  // Trick: autoplay thực sự → thêm &autoplay=1&mute=1&show_text=false
  iframe.src =
    "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&autoplay=1&mute=1&show_text=false&width=267&height=476&t=0";

  // ✅ Label LIVE (phẳng, nhấp nháy nhẹ)
  const liveLabel = document.createElement("div");
  liveLabel.textContent = "LIVE";
  Object.assign(liveLabel.style, {
    background: "#d32f2f",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "12px",
    padding: "3px 0",
    width: "100%",
    textAlign: "center",
    animation: "pulseLive 1.2s infinite",
  });

  // ✅ Gắn vào DOM
  container.appendChild(closeBtn);
  container.appendChild(iframe);
  container.appendChild(liveLabel);
  document.body.appendChild(container);

  // ✅ CSS hiệu ứng
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulseLive {
      0% { opacity: 1; }
      50% { opacity: 0.6; }
      100% { opacity: 1; }
    }
    #liveMiniPopup iframe {
      pointer-events: none; /* không cần click, auto play luôn */
    }
  `;
  document.head.appendChild(style);

  // ✅ Đảm bảo autoplay reload (force refresh 1 lần nhỏ)
  window.addEventListener("load", () => {
    setTimeout(() => {
      iframe.src = iframe.src; // reload lại chính nó
    }, 800);
  });
})();
