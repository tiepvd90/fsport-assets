// ===========================================================
// 📺 livevideo.js — Mini livestream + popup to (fix click)
// ===========================================================

(function () {
  "use strict";

  if (document.getElementById("liveMiniPopup")) return;

  const fbVideoLink = "https://www.facebook.com/reel/2579888902356798";

  // ✅ MINI POPUP
  const mini = document.createElement("div");
  mini.id = "liveMiniPopup";
  Object.assign(mini.style, {
    position: "fixed",
    top: "120px",
    right: "10px",
    width: "90px",
    height: "150px",
    zIndex: "9999",
    background: "#000",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 0 8px rgba(0,0,0,0.4)",
    borderRadius: "0",
  });

  // 🔴 HEADER
  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "2px 5px",
    background: "#000",
  });

  const live = document.createElement("div");
  live.textContent = "LIVE";
  Object.assign(live.style, {
    background: "#d32f2f",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 6px",
    animation: "pulseLive 1.2s infinite",
  });

  const closeMini = document.createElement("div");
  closeMini.innerHTML = "&#10005;";
  Object.assign(closeMini.style, {
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
  });
  closeMini.addEventListener("click", () => mini.remove());

  header.appendChild(live);
  header.appendChild(closeMini);

  // 🎥 VIDEO MINI (iframe)
  const iframeMini = document.createElement("iframe");
  iframeMini.src =
    "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=false&width=267&t=0&autoplay=true&mute=true";
  Object.assign(iframeMini.style, {
    width: "90px",
    height: "130px",
    border: "none",
  });
  iframeMini.allow =
    "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";

  // ⚡ Lớp overlay để bắt click
  const clickOverlay = document.createElement("div");
  Object.assign(clickOverlay.style, {
    position: "absolute",
    top: "20px",
    left: "0",
    width: "90px",
    height: "130px",
    cursor: "pointer",
    zIndex: "2",
  });
  clickOverlay.addEventListener("click", openFullPopup);

  // Đặt container có position relative để overlay hoạt động
  mini.style.position = "fixed";
  mini.style.overflow = "hidden";
  mini.style.boxSizing = "border-box";
  mini.style.position = "fixed";
  mini.style.background = "#000";
  mini.style.borderRadius = "0";
  mini.style.cursor = "pointer";
  mini.style.position = "fixed";
  mini.style.zIndex = "9999";
  mini.style.display = "flex";
  mini.style.flexDirection = "column";
  mini.style.overflow = "hidden";
  mini.style.position = "fixed";
  mini.style.right = "10px";
  mini.style.top = "120px";
  mini.style.width = "90px";
  mini.style.height = "150px";
  mini.style.position = "fixed";
  mini.style.position = "relative";

  mini.appendChild(header);
  mini.appendChild(iframeMini);
  mini.appendChild(clickOverlay);
  document.body.appendChild(mini);

  // 🖼️ POPUP TO
  function openFullPopup() {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.7)",
      zIndex: "10000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    const popup = document.createElement("div");
    Object.assign(popup.style, {
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "6px",
      overflow: "hidden",
      width: window.innerWidth < 768 ? "90%" : "70%",
      maxWidth: "700px",
      aspectRatio: "9 / 16",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    });

    // 2 nút phía trên
    const topBar = document.createElement("div");
    Object.assign(topBar.style, {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px",
      background: "#fff",
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      zIndex: "2",
    });

    const fbBtn = document.createElement("button");
    fbBtn.textContent = "XEM TRÊN FB";
    Object.assign(fbBtn.style, {
      background: "#1877f2",
      color: "#fff",
      fontWeight: "bold",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
    });
    fbBtn.addEventListener("click", () => window.open(fbVideoLink, "_blank"));

    const closeBig = document.createElement("button");
    closeBig.textContent = "ĐÓNG";
    Object.assign(closeBig.style, {
      background: "#000",
      color: "#fff",
      fontWeight: "bold",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
    });
    closeBig.addEventListener("click", () => overlay.remove());

    topBar.appendChild(fbBtn);
    topBar.appendChild(closeBig);

    const iframeBig = document.createElement("iframe");
    iframeBig.src =
      "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=false&width=267&t=0&autoplay=true&mute=true";
    Object.assign(iframeBig.style, {
      width: "100%",
      height: "100%",
      border: "none",
    });
    iframeBig.allow =
      "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";

    popup.appendChild(iframeBig);
    popup.appendChild(topBar);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  // 🔴 Hiệu ứng LIVE
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulseLive {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();
