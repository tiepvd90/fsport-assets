// 🛡️ Dự phòng cũ (giữ cho an toàn)
if (typeof fetchVoucherMap !== "function") {
  window.fetchVoucherMap = () => Promise.resolve({});
}

// 🎉 Hiển thị popup voucher
function showVoucherPopup() {
  if (document.getElementById("voucherPopup")) return;

  const popup = document.createElement("div");
  popup.className = "voucher-popup";
  popup.id = "voucherPopup";
  popup.innerHTML = `
    <div class="voucher-close" id="closeVoucherBtn">×</div>
    <h2>🎉 FLASH SALE <strong style="font-weight:900; color:#d32f2f;">10/10</strong></h2>
    <p>MIỄN PHÍ SHIP TOÀN BỘ ĐƠN HÀNG</p>
    <p>GIẢM 5% TOÀN BỘ WEBSITE</p>
    <p>GIẢM 8% ĐƠN HÀNG TRÊN <strong style="font-weight:900; color:#d32f2f;">1.500.000 </strong> ĐỒNG</p>
    <p><span id="voucherCountdown" style="font-weight:bold; color:#e53935;"></span></p>
    <button id="applyVoucherBtn">LẤY VOUCHER</button>
  `;
  document.body.appendChild(popup);

  document.getElementById("closeVoucherBtn")?.addEventListener("click", () => popup.remove());
  document.getElementById("applyVoucherBtn")?.addEventListener("click", () => popup.remove());
  startVoucherCountdown(getSecondsUntil4PM());
}

// 🔹 Đếm ngược tới 16:00
function getSecondsUntil4PM() {
  const now = new Date();
  const target = new Date();
  target.setHours(16, 0, 0, 0);
  const diff = Math.floor((target - now) / 1000);
  return diff > 0 ? diff : 0;
}

// ===============================================
// ✅ MINI LIVESTREAM FACEBOOK FIXED VERSION
// ===============================================
(function () {
  const fbLiveUrl =
    "https://www.facebook.com/plugins/video.php?href=" +
    encodeURIComponent("https://www.facebook.com/reel/2579888902356798/") +
    "&show_text=false&autoplay=1&mute=1&width=267&height=476";
  const fbDirectUrl = "https://www.facebook.com/reel/2579888902356798/";

  const style = document.createElement("style");
  style.textContent = `
    #fbLiveMini {
      position: fixed;
      top: 80px;
      right: 10px;
      width: 90px;
      background: #000;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      z-index: 9998;
      overflow: hidden;
      border: 1px solid #444;
      transition: transform 0.25s ease;
    }
    #fbLiveMini:hover { transform: scale(1.05); }
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
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
    #fbLiveMini iframe {
      width: 100%;
      height: 120px;
      display: block;
      border: none;
    }
    #fbLiveMini .click-layer {
      position: absolute; inset: 0;
      cursor: pointer;
      z-index: 4;
      background: rgba(0,0,0,0);
    }
    #fbLiveOverlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: none;
      align-items: center; justify-content: center;
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
    @keyframes scaleIn { from {transform:scale(.92);opacity:0} to {transform:scale(1);opacity:1} }
    #fbLivePopup .pop-header {
      display: flex; gap: 10px;
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
    #fbLivePopup .btn-close  { background: #000; color: #fff; }
    #fbLivePopup iframe {
      width: 100%;
      height: 70vh;
      display: block;
      border: none;
    }
    @media (max-width: 768px) {
      #fbLiveMini { width: 80px; top: 80px; right: 8px; }
      #fbLiveMini iframe { height: 110px; }
      #fbLivePopup iframe { height: 70vh; }
    }
  `;
  document.head.appendChild(style);

  const mini = document.createElement("div");
  mini.id = "fbLiveMini";
  mini.innerHTML = `
    <div class="live-label">🔴 LIVE</div>
    <iframe
      src="${fbLiveUrl}"
      allow="autoplay; encrypted-media; picture-in-picture; web-share"
      allowfullscreen
      scrolling="no"
      frameborder="0"
      muted
    ></iframe>
    <div class="click-layer"></div>
  `;
  document.body.appendChild(mini);

  const overlay = document.createElement("div");
  overlay.id = "fbLiveOverlay";
  overlay.innerHTML = `
    <div id="fbLivePopup">
      <div class="pop-header">
        <button class="btn btn-viewfb">XEM TRÊN FB</button>
        <button class="btn btn-close">ĐÓNG</button>
      </div>
      <iframe
        src="about:blank"
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowfullscreen
        scrolling="no"
        frameborder="0"
      ></iframe>
    </div>
  `;
  document.body.appendChild(overlay);

  const miniIframe = mini.querySelector("iframe");
  const bigIframe  = overlay.querySelector("iframe");

  const setAutoplay = (iframe, muted = true) => {
    const url = muted
      ? fbLiveUrl + "&autoplay=1&mute=1"
      : fbLiveUrl.replace("&mute=1", "") + "&autoplay=1";
    iframe.src = url;
  };

  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => setAutoplay(miniIframe, true), 500);
  });

  mini.querySelector(".click-layer").addEventListener("click", () => {
    overlay.style.display = "flex";
    setAutoplay(bigIframe, false);
  });

  overlay.querySelector(".btn-viewfb").addEventListener("click", () => {
    window.open(fbDirectUrl, "_blank");
  });
  overlay.querySelector(".btn-close").addEventListener("click", () => {
    overlay.style.display = "none";
    bigIframe.src = "about:blank";
  });
})();

// 🕒 Đếm ngược voucher
function startVoucherCountdown(seconds) {
  const countdownEl = document.getElementById("voucherCountdown");
  if (!countdownEl) return;
  function formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m}:${sec < 10 ? "0":""}${sec}`;
  }
  countdownEl.textContent = `⏰ FLASH SALE END: ${formatTime(seconds)}`;
  const interval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(interval);
      countdownEl.textContent = "FLASH SALE ĐÃ KẾT THÚC!";
    } else {
      countdownEl.textContent = `⏰ FLASH SALE END: ${formatTime(seconds)}`;
    }
  }, 1000);
}
