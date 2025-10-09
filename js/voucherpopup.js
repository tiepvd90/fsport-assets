// 🛡️ Dự phòng cũ (giữ cho an toàn, không cần gọi gì thêm)
if (typeof fetchVoucherMap !== "function") {
  window.fetchVoucherMap = () => Promise.resolve({});
}

// 🎉 Hiển thị popup
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
    <p>GIẢM 8% ĐƠN HÀNG TRÊN <strong style="font-weight:900; color:#d32f2f;">1.500.000 </strong> ĐỒNG
    <p><span id="voucherCountdown" style="font-weight:bold; color:#e53935;"></span></p>
    <button id="applyVoucherBtn">LẤY VOUCHER</button>
  `;
  document.body.appendChild(popup);

  // Đóng popup
  document.getElementById("closeVoucherBtn")?.addEventListener("click", () => popup.remove());
  // Nút bấm chỉ đóng popup
  document.getElementById("applyVoucherBtn")?.addEventListener("click", () => popup.remove());

  startVoucherCountdown(getSecondsUntil4PM());
}

// 🔹 Đếm ngược tới 16:00 hôm nay
function getSecondsUntil4PM() {
  const now = new Date();
  const target = new Date();
  target.setHours(16, 0, 0, 0);
  const diff = Math.floor((target - now) / 1000);
  return diff > 0 ? diff : 0;
}
<!-- ✅ MINI LIVESTREAM FACEBOOK FIXED VERSION -->
<script>
(function () {
  const fbLiveUrl =
    "https://www.facebook.com/plugins/video.php?href=" +
    encodeURIComponent("https://www.facebook.com/reel/2579888902356798/") +
    "&show_text=false&autoplay=1&mute=1&width=267&height=476";
  const fbDirectUrl = "https://www.facebook.com/reel/2579888902356798/";

  // ===== CSS =====
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

    /* Popup full */
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

  // ===== MINI LIVESTREAM =====
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

  // ===== POPUP =====
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

  // ✅ Hàm set autoplay (muted hay không)
  const setAutoplay = (iframe, muted = true) => {
    const url = muted
      ? fbLiveUrl + "&autoplay=1&mute=1"
      : fbLiveUrl.replace("&mute=1", "") + "&autoplay=1";
    iframe.src = url;
  };

  // ✅ Autoplay mini sau khi load (muted)
  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => setAutoplay(miniIframe, true), 500);
  });

  // ✅ Khi click mini → mở popup (unmuted)
  mini.querySelector(".click-layer").addEventListener("click", () => {
    overlay.style.display = "flex";
    setAutoplay(bigIframe, false);
  });

  // ✅ Nút XEM TRÊN FB
  overlay.querySelector(".btn-viewfb").addEventListener("click", () => {
    window.open(fbDirectUrl, "_blank");
  });

  // ✅ Nút ĐÓNG
  overlay.querySelector(".btn-close").addEventListener("click", () => {
    overlay.style.display = "none";
    bigIframe.src = "about:blank"; // dừng video khi đóng
  });
})();
</script>


// 🪄 Icon nổi góc màn hình
function createVoucherFloatingIcon() {
  if (document.getElementById("voucherFloatIcon")) return;

  const icon = document.createElement("div");
  icon.id = "voucherFloatIcon";
  icon.innerHTML = `
    <div class="voucher-float-img-wrapper">
      <img src="https://i.postimg.cc/bvL7Lbvn/1010-2.jpg" alt="voucher" />
      <div class="voucher-float-close" id="closeVoucherIcon">×</div>
    </div>
  `;
  document.body.appendChild(icon);

  icon.addEventListener("click", (e) => {
    if (e.target.id !== "closeVoucherIcon") showVoucherPopup();
  });

  document.getElementById("closeVoucherIcon")?.addEventListener("click", (e) => {
    e.stopPropagation();
    icon.remove();
  });
}

// 🕒 Đếm ngược dạng giờ-phút-giây
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

// ✅ Hàm chính: hiển thị icon và popup (mỗi 1 tiếng mới tự bật lại)
function runVoucherImmediately() {
  createVoucherFloatingIcon();

  const lastShown = Number(sessionStorage.getItem("voucherShownGlobal") || 0);
  const COOLDOWN_MS = 60 * 60 * 1000;

  if (Date.now() - lastShown < COOLDOWN_MS) {
    console.log("⏳ Cooldown: chỉ hiển thị icon, không bật popup.");
    return;
  }

  sessionStorage.setItem("voucherShownGlobal", String(Date.now()));
  showVoucherPopup();
}

// ✅ Gọi khi load trang
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runVoucherImmediately);
} else {
  runVoucherImmediately();
}

// ✅ Sau khi đóng giỏ hàng thì cũng hiển thị lại popup (như flash sale)
(function setupVoucherAfterCheckoutClose() {
  function waitForCloseButton(retries = 20) {
    const closeBtn = document.querySelector(".checkout-close");
    if (!closeBtn) {
      if (retries > 0) return setTimeout(() => waitForCloseButton(retries - 1), 300);
      return;
    }

    closeBtn.addEventListener("click", () => {
      setTimeout(() => {
        const lastShown = Number(sessionStorage.getItem("voucherShownAfterClose") || 0);
        const COOLDOWN_MS = 60 * 60 * 1000;
        if (Date.now() - lastShown < COOLDOWN_MS) return;

        sessionStorage.setItem("voucherShownAfterClose", String(Date.now()));
        console.log("🎉 Hiển thị popup FLASH SALE khi đóng giỏ hàng.");
        createVoucherFloatingIcon();
        showVoucherPopup();
      }, 300);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => waitForCloseButton());
  } else {
    waitForCloseButton();
  }
})();
