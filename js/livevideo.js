// ===========================================================
// 📺 livevideo.js — Mini popup livestream + mở to 90% màn hình
// ===========================================================

(function () {
  "use strict";

  if (document.getElementById("liveMiniPopup")) return;

  const fbVideoLink =
    "https://www.facebook.com/reel/2579888902356798"; // link thật Facebook

  // ✅ MINI POPUP (góc phải)
  const mini = document.createElement("div");
  mini.id = "liveMiniPopup";
  mini.style.position = "fixed";
  mini.style.top = "120px";
  mini.style.right = "10px";
  mini.style.width = "90px";
  mini.style.height = "150px";
  mini.style.zIndex = "9999";
  mini.style.background = "#000";
  mini.style.display = "flex";
  mini.style.flexDirection = "column";
  mini.style.overflow = "hidden";
  mini.style.boxShadow = "0 0 8px rgba(0,0,0,0.4)";
  mini.style.borderRadius = "0";

  // 🔴 Header: LIVE + X
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "2px 5px";
  header.style.background = "#000";

  const live = document.createElement("div");
  live.textContent = "LIVE";
  live.style.background = "#d32f2f";
  live.style.color = "#fff";
  live.style.fontSize = "11px";
  live.style.fontWeight = "bold";
  live.style.padding = "2px 6px";
  live.style.animation = "pulseLive 1.2s infinite";

  const closeMini = document.createElement("div");
  closeMini.innerHTML = "&#10005;";
  closeMini.style.color = "#fff";
  closeMini.style.fontSize = "12px";
  closeMini.style.cursor = "pointer";
  closeMini.addEventListener("click", () => mini.remove());

  header.appendChild(live);
  header.appendChild(closeMini);

  // 🎥 Video (iframe nhỏ)
  const iframeMini = document.createElement("iframe");
  iframeMini.src =
    "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=false&width=267&t=0&autoplay=true&mute=true";
  iframeMini.width = "90";
  iframeMini.height = "130";
  iframeMini.style.border = "none";
  iframeMini.allow =
    "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";

  // 🖱️ Khi click → mở popup to
  iframeMini.style.cursor = "pointer";
  iframeMini.addEventListener("click", openFullPopup);

  mini.appendChild(header);
  mini.appendChild(iframeMini);
  document.body.appendChild(mini);

  // 🔵 Popup to (ẩn mặc định)
  function openFullPopup() {
    const overlay = document.createElement("div");
    overlay.id = "liveFullOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.7)";
    overlay.style.zIndex = "10000";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const popup = document.createElement("div");
    popup.style.background = "#fff";
    popup.style.border = "1px solid #ccc";
    popup.style.borderRadius = "8px";
    popup.style.overflow = "hidden";
    popup.style.width =
      window.innerWidth < 768
        ? "90%" // mobile
        : "70%"; // desktop
    popup.style.maxWidth = "700px";
    popup.style.aspectRatio = "9 / 16";
    popup.style.position = "relative";

    // Header của popup to
    const topBar = document.createElement("div");
    topBar.style.display = "flex";
    topBar.style.justifyContent = "space-between";
    topBar.style.padding = "8px";
    topBar.style.background = "#fff";
    topBar.style.position = "absolute";
    topBar.style.top = "0";
    topBar.style.left = "0";
    topBar.style.width = "100%";
    topBar.style.zIndex = "2";

    // 🔵 Nút XEM TRÊN FB
    const fbBtn = document.createElement("button");
    fbBtn.textContent = "XEM TRÊN FB";
    fbBtn.style.background = "#1877f2";
    fbBtn.style.color = "#fff";
    fbBtn.style.fontWeight = "bold";
    fbBtn.style.border = "none";
    fbBtn.style.padding = "6px 12px";
    fbBtn.style.borderRadius = "6px";
    fbBtn.style.cursor = "pointer";
    fbBtn.addEventListener("click", () => {
      window.open(fbVideoLink, "_blank");
    });

    // ⚫ Nút ĐÓNG
    const closeBig = document.createElement("button");
    closeBig.textContent = "ĐÓNG";
    closeBig.style.background = "#000";
    closeBig.style.color = "#fff";
    closeBig.style.fontWeight = "bold";
    closeBig.style.border = "none";
    closeBig.style.padding = "6px 12px";
    closeBig.style.borderRadius = "6px";
    closeBig.style.cursor = "pointer";
    closeBig.addEventListener("click", () => overlay.remove());

    topBar.appendChild(fbBtn);
    topBar.appendChild(closeBig);

    // Video lớn
    const iframeBig = document.createElement("iframe");
    iframeBig.src =
      "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=false&width=267&t=0&autoplay=true&mute=true";
    iframeBig.style.width = "100%";
    iframeBig.style.height = "100%";
    iframeBig.style.border = "none";
    iframeBig.allow =
      "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";

    popup.appendChild(iframeBig);
    popup.appendChild(topBar);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  // 🔄 Hiệu ứng LIVE
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
