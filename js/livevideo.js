<script>
(function () {
  "use strict";

  if (document.getElementById("liveMiniYoutube")) return;

  // === CONFIG ===
  const YT_EMBED_URL = "https://www.youtube.com/embed/US43FaNJ-v0?autoplay=1&mute=1&playsinline=1";

  // === MINI LIVESTREAM (autoplay muted) ===
  const mini = document.createElement("div");
  mini.id = "liveMiniYoutube";
  mini.style.position = "fixed";
  mini.style.top = "120px";
  mini.style.right = "10px";
  mini.style.width = "120px";
  mini.style.height = "213px"; // tỷ lệ 9:16
  mini.style.zIndex = "7999";
  mini.style.border = "2px solid #fff";
  mini.style.boxShadow = "0 0 8px rgba(0,0,0,0.3)";
  mini.style.overflow = "hidden";
  mini.style.borderRadius = "4px";
  mini.style.cursor = "pointer";
  mini.style.background = "#000";

  // iframe YouTube mini
  const iframeMini = document.createElement("iframe");
  iframeMini.src = YT_EMBED_URL;
  iframeMini.width = "100%";
  iframeMini.height = "100%";
  iframeMini.allow = "autoplay; encrypted-media; picture-in-picture";
  iframeMini.frameBorder = "0";
  iframeMini.style.display = "block";

  // Khi click → mở popup to
  mini.addEventListener("click", () => {
    showYoutubePopup();
  });

  mini.appendChild(iframeMini);
  document.body.appendChild(mini);

  // === POPUP FULL ===
  function showYoutubePopup() {
    if (document.getElementById("youtubePopup")) return;

    const overlay = document.createElement("div");
    overlay.id = "youtubePopup";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0,0,0,0.85)";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube.com/embed/US43FaNJ-v0?autoplay=1&mute=0";
    iframe.style.width = "90%";
    iframe.style.maxWidth = "800px";
    iframe.style.aspectRatio = "16/9";
    iframe.style.border = "none";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "20px";
    closeBtn.style.right = "30px";
    closeBtn.style.fontSize = "36px";
    closeBtn.style.color = "#fff";
    closeBtn.style.cursor = "pointer";
    closeBtn.addEventListener("click", () => overlay.remove());

    overlay.appendChild(iframe);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
  }
})();
</script>
