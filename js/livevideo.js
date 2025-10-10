// ===========================================================
// 🔴 MINI LIVESTREAM FACEBOOK + POPUP FULL 2 NÚT (giữ nguyên giao diện)
// ===========================================================

(function () {
  "use strict";

  // ✅ KHAI BÁO LINK FACEBOOK CHỈ MỘT LẦN Ở ĐÂY
  const FB_VIDEO_ID = "2579888902356798"; // 👉 chỉ cần thay ID reel/video
  const fbDirectUrl = `https://www.facebook.com/reel/${FB_VIDEO_ID}/`;
  const fbEmbedUrl =
    "https://www.facebook.com/plugins/video.php?href=" +
    encodeURIComponent(fbDirectUrl) +
    "&show_text=false&autoplay=1&mute=1&width=267&height=476";

  // ✅ CSS (giữ nguyên)
  const style = document.createElement("style");
  style.textContent = `
    #fbLiveMini {
      position: fixed;
      top: 140px;
      right: 10px;
      width: 80px;
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
    @keyframes blink {
      0%,100% { opacity: 1; }
      50% { opacity: .3; }
    }
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
    }
    #fbLivePopup {
      background: #fff;
      width: 90%;
      max-width: 500px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 25px rgba(0,0,0,0.4);
      animation: scaleIn .25s ease;
    }
    @keyframes scaleIn {
      from { transform: scale(.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    #fbLivePopup .pop-header {
      display: flex;
      gap: 10px;
      padding: 10px;
      background: #f6f6f6;
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
    #fbLivePopup iframe {
      width: 100%;
      height: 70vh;
      display: block;
      border: none;
    }

    @media (max-width: 768px) {
      #fbLiveMini {
        width: 80px;
        top: 80px;
        right: 8px;
      }
      #fbLiveMini iframe { height: 112px; }
      #fbLivePopup iframe { height: 70vh; }
    }
  `;
  document.head.appendChild(style);

  // ✅ TẠO MINI LIVESTREAM (iframe nhỏ)
  const mini = document.createElement("div");
  mini.id = "fbLiveMini";
  mini.innerHTML = `
    <iframe src="about:blank" allow="autoplay; encrypted-media; picture-in-picture; web-share"
      allowfullscreen scrolling="no" frameborder="0"></iframe>
    <div class="live-label">🔴 LIVE</div>
    <div class="click-layer"></div>
  `;
  document.body.appendChild(mini);

  // ✅ TẠO POPUP FULL LIVESTREAM
  const overlay = document.createElement("div");
  overlay.id = "fbLiveOverlay";
  overlay.innerHTML = `
    <div id="fbLivePopup">
      <div class="pop-header">
        <button class="btn btn-viewfb">XEM TRÊN FB</button>
        <button class="btn btn-close">ĐÓNG</button>
      </div>
      <iframe src="about:blank" allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowfullscreen scrolling="no" frameborder="0"></iframe>
    </div>
  `;
  document.body.appendChild(overlay);

  // ✅ LẤY CÁC THÀNH PHẦN CẦN DÙNG
  const miniIframe = mini.querySelector("iframe");
  const bigIframe = overlay.querySelector("iframe");
  const clickLayer = mini.querySelector(".click-layer");
  const btnViewFb = overlay.querySelector(".btn-viewfb");
  const btnClose = overlay.querySelector(".btn-close");

  // ✅ HÀM GÁN AUTOPLAY (đảm bảo luôn mute)
  function setAutoplay(iframe) {
    iframe.src = fbEmbedUrl.includes("autoplay=1")
      ? fbEmbedUrl
      : fbEmbedUrl + "&autoplay=1&mute=1";
  }

  // ✅ LOAD MINI IFRAME NGAY KHI TẢI TRANG
  window.addEventListener("load", () => setAutoplay(miniIframe));

  // ✅ SỰ KIỆN CLICK VÀO MINI VIDEO → MỞ POPUP FULL
  clickLayer.addEventListener("click", () => {
    overlay.style.display = "flex";
    setAutoplay(bigIframe); // video lớn autoplay
  });

  // ✅ SỰ KIỆN CLICK "XEM TRÊN FB" → MỞ LINK GỐC
  btnViewFb.addEventListener("click", () => {
    window.open(fbDirectUrl, "_blank");
  });

  // ✅ SỰ KIỆN CLICK "ĐÓNG" → ẨN POPUP & DỪNG VIDEO
  btnClose.addEventListener("click", () => {
    overlay.style.display = "none";
    bigIframe.src = "about:blank";
  });
})();
