// ===========================================================
// 🔴 MINI LIVESTREAM FACEBOOK + POPUP FULL 2 NÚT
// (fix: click Play trong popup full hoạt động bình thường)
// ===========================================================
(function () {
  "use strict";

  // ✅ THAY LINK VIDEO Ở ĐÂY
  const FB_VIDEO_URL = "https://web.facebook.com/funsport1/videos/1506865553689608/";
  const fbDirectUrl = FB_VIDEO_URL;

  // Mini (autoplay muted) — dùng cho click lần đầu để play
  const fbEmbedUrlMini =
    "https://www.facebook.com/plugins/video.php?href=" +
    encodeURIComponent(fbDirectUrl) +
    "&show_text=false&autoplay=1&mute=1&width=267&height=476";

  // Full — để Play trong popup vẫn bấm được: không autoplay (để hiện nút Play)
  // Nếu bạn muốn tự phát luôn trong popup, đổi autoplay=1&mute=1
  const fbEmbedUrlFull =
    "https://www.facebook.com/plugins/video.php?href=" +
    encodeURIComponent(fbDirectUrl) +
    "&show_text=false&autoplay=0&mute=0&width=540&height=960";

  // ✅ CSS
  const style = document.createElement("style");
  style.textContent = `
    #fbLiveMini {
      position: fixed;
      top: 140px;
      right: 10px;
      width: 90px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      z-index: 9998;
      overflow: hidden;
      border: 1px solid #ddd;
      transition: transform 0.25s ease;
    }
    #fbLiveMini:hover { transform: scale(1.03); }
    #fbLiveMini iframe {
      width: 100%;
      height: 112px;
      display: block;
      border: none;
    }
    #fbLiveMini .live-label {
      background: #e60000;
      color: #fff;
      text-align: center;
      font-weight: 700;
      font-size: 11px;
      padding: 2px 0;
      animation: blink 1s infinite;
      letter-spacing: 1px;
    }
    @keyframes blink { 0%,100% {opacity:1;} 50% {opacity:.3;} }
    #fbLiveMini .click-layer {
      position: absolute;
      inset: 0;
      cursor: pointer;
      z-index: 4;
      background: rgba(0,0,0,0);
    }

    /* Popup full */
    #fbLiveOverlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      /* ❗ Quan trọng: nền không bắt sự kiện, tránh "ăn" click */
      pointer-events: none;
    }
    #fbLivePopup {
      background: #fff;
      width: 90%;
      max-width: 500px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 25px rgba(0,0,0,0.4);
      animation: scaleIn .25s ease;
      /* Cho phép bắt sự kiện trong popup */
      pointer-events: auto;
      position: relative;
      z-index: 10001;
    }
    @keyframes scaleIn { from {transform:scale(.92);opacity:0;} to {transform:scale(1);opacity:1;} }
    #fbLivePopup .pop-header {
      display: flex;
      gap: 10px;
      padding: 10px;
      background: #f6f6f6;
      position: relative;
      z-index: 2; /* header nằm trên iframe ở vùng header */
    }
    #fbLivePopup .btn {
      flex: 1;
      padding: 10px 12px;
      border-radius: 999px;
      text-align: center;
      font-weight: 700;
      font-size: 14px;
      border: none;
      cursor: pointer;
    }
    #fbLivePopup .btn-viewfb { background: #1877F2; color: #fff; }
    #fbLivePopup .btn-close { background: #000; color: #fff; }
    #fbLivePopup .player-wrap {
      position: relative;
      width: 100%;
      height: 70vh;
      overflow: hidden;
      background: #000;
      z-index: 1;
    }
    #fbLivePopup iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      border: none;
      /* ❗ Quan trọng: đảm bảo iframe nhận click */
      pointer-events: auto;
      z-index: 1;
    }

    @media (max-width: 768px) {
      #fbLiveMini { width: 80px; top: 80px; right: 8px; }
      #fbLiveMini iframe { height: 112px; }
      #fbLivePopup .player-wrap { height: 70vh; }
    }
  `;
  document.head.appendChild(style);

  // ✅ MINI
  const mini = document.createElement("div");
  mini.id = "fbLiveMini";
  mini.innerHTML = `
    <iframe src="about:blank"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowfullscreen scrolling="no" frameborder="0"></iframe>
    <div class="live-label">🔴 LIVE</div>
    <div class="click-layer"></div>
  `;
  document.body.appendChild(mini);

  // ✅ POPUP FULL
  const overlay = document.createElement("div");
  overlay.id = "fbLiveOverlay";
  overlay.innerHTML = `
    <div id="fbLivePopup">
      <div class="pop-header">
        <button class="btn btn-viewfb">XEM TRÊN FB</button>
        <button class="btn btn-close">ĐÓNG</button>
      </div>
      <div class="player-wrap">
        <iframe src="about:blank"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowfullscreen scrolling="no" frameborder="0"></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // ✅ DOM refs
  const miniIframe = mini.querySelector("iframe");
  const bigIframe = overlay.querySelector("iframe");
  const clickLayer = mini.querySelector(".click-layer");
  const btnViewFb = overlay.querySelector(".btn-viewfb");
  const btnClose = overlay.querySelector(".btn-close");

  let miniPlayed = false;

  // ✅ helper
  function setSrc(iframe, url) {
    // delay nhỏ để chắc chắn mount xong rồi mới set src (iOS FB in-app đôi khi cần)
    setTimeout(() => { iframe.src = url; }, 0);
  }

  // ✅ mini: lần 1 play, lần 2 mở full
  function onMiniTap() {
    if (!miniPlayed) {
      setSrc(miniIframe, fbEmbedUrlMini); // autoplay + mute trong mini
      miniPlayed = true;
    } else {
      overlay.style.display = "flex";
      // 🟦 Ở full, để người dùng tự bấm Play => không autoplay
      setSrc(bigIframe, fbEmbedUrlFull);
    }
  }

  clickLayer.addEventListener("click", onMiniTap);
  clickLayer.addEventListener("touchstart", (e) => { e.preventDefault(); onMiniTap(); }, {passive:false});

  // ✅ nút xem FB
  btnViewFb.addEventListener("click", () => window.open(fbDirectUrl, "_blank"));

  // ✅ đóng popup
  btnClose.addEventListener("click", () => {
    overlay.style.display = "none";
    bigIframe.src = "about:blank"; // stop video
  });
})();
