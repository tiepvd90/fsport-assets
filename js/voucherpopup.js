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
// ==========================================
// 🔴 MINI LIVESTREAM (GÓC PHẢI, TOP 80PX) + POPUP 2 NÚT
// ==========================================
(function () {
  // Link plugin + link xem trực tiếp trên Facebook
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
      top: 80px;             /* ✅ đúng yêu cầu */
      right: 10px;
      width: 80px;           /* ✅ nhỏ lại */
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      z-index: 9998;
      overflow: hidden;
      border: 1px solid #ddd;
      transition: transform 0.25s ease;
    }
    #fbLiveMini:hover { transform: scale(1.03); }
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
    #fbLiveMini .frame-wrap { position: relative; }
    #fbLiveMini iframe {
      width: 100%;
      height: 112px;         /* tỉ lệ gọn cho width 80 */
      display: block;
      border: none;
    }
    /* ✅ Nút X trắng nền đen, đặt lệch ra ngoài để không đè chữ LIVE */
    #fbLiveMini .close-mini {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 22px; height: 22px;
      background: #000;
      color: #fff;
      border-radius: 50%;
      text-align: center;
      line-height: 22px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,.35);
      z-index: 5;
    }
    /* Lớp trong suốt bắt click để mở popup */
    #fbLiveMini .click-layer {
      position: absolute; inset: 0;
      cursor: pointer;
      z-index: 4;
      background: rgba(0,0,0,0);
    }

    /* ===== Popup ===== */
    #fbLiveOverlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: none;
      align-items: center; justify-content: center;
      z-index: 10000;
    }
    #fbLivePopup {
      background: #fff;
      width: 90%;            /* ✅ 90% chiều rộng điện thoại */
      max-width: 500px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 25px rgba(0,0,0,0.4);
      animation: scaleIn .25s ease;
    }
    @keyframes scaleIn { from {transform:scale(.92);opacity:0} to {transform:scale(1);opacity:1} }

    /* Header 2 nút */
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
    #fbLivePopup .btn-viewfb { background: #1877F2; color: #fff; }  /* ✅ xanh Facebook */
    #fbLivePopup .btn-close  { background: #000;    color: #fff; }

    #fbLivePopup iframe {
      width: 100%;
      height: 70vh;
      display: block;
      border: none;
    }

    @media (max-width: 768px) {
      #fbLiveMini { width: 80px; top: 80px; right: 8px; }
      #fbLiveMini iframe { height: 112px; }
      #fbLivePopup iframe { height: 70vh; }
    }
  `;
  document.head.appendChild(style);

  // ===== MINI KHUNG NHỎ =====
  const mini = document.createElement("div");
  mini.id = "fbLiveMini";
  mini.innerHTML = `
    <div class="live-label">🔴 LIVE</div>
    <div class="frame-wrap">
      <iframe
        title="FB Live"
        src="about:blank"
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowfullscreen
        scrolling="no"
        frameborder="0"></iframe>
      <div class="click-layer"></div>
      <div class="close-mini">&times;</div>
    </div>
  `;
  document.body.appendChild(mini);

  // ===== OVERLAY POPUP =====
  const overlay = document.createElement("div");
  overlay.id = "fbLiveOverlay";
  overlay.innerHTML = `
    <div id="fbLivePopup">
      <div class="pop-header">
        <button class="btn btn-viewfb">XEM TRÊN FB</button>
        <button class="btn btn-close">ĐÓNG</button>
      </div>
      <iframe
        title="FB Live Big"
        src="about:blank"
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowfullscreen
        scrolling="no"
        frameborder="0"></iframe>
    </div>
  `;
  document.body.appendChild(overlay);

  // ===== Autoplay chắc chắn khi reload =====
  const miniIframe = mini.querySelector("iframe");
  const bigIframe  = overlay.querySelector("iframe");

  function setAutoplay(iframeEl) {
    // đảm bảo luôn có autoplay=1 & mute=1
    let url = fbLiveUrl;
    if (!/autoplay=1/.test(url)) url += (url.includes("?") ? "&" : "?") + "autoplay=1";
    if (!/mute=1/.test(url))     url += "&mute=1";
    iframeEl.src = url;

    // Fallback iOS: reload lại sau 800ms nếu bị block
    setTimeout(() => {
      try {
        // chỉ reload nếu vẫn là about:blank (trường hợp hiếm)
        if (iframeEl.contentWindow == null) iframeEl.src = url;
      } catch (_) { /* cross-origin, bỏ qua */ }
    }, 800);
  }

  // Gán src sau khi DOM sẵn sàng + sau khi window load (double ensure)
  setAutoplay(miniIframe);
  window.addEventListener("load", () => setAutoplay(miniIframe));

  // ===== SỰ KIỆN =====
  // mở popup
  mini.querySelector(".click-layer").addEventListener("click", () => {
    overlay.style.display = "flex";
    setAutoplay(bigIframe);   // gán src vào khung to
  });

  // đóng mini
  mini.querySelector(".close-mini").addEventListener("click", (e) => {
    e.stopPropagation();
    mini.remove();
  });

  // nút xem trên FB (mở tab mới/app FB)
  overlay.querySelector(".btn-viewfb").addEventListener("click", () => {
    window.open(fbDirectUrl, "_blank");
  });

  // nút đóng popup
  overlay.querySelector(".btn-close").addEventListener("click", () => {
    overlay.style.display = "none";
    bigIframe.src = "about:blank"; // dừng phát khi đóng
  });

  // chạm ra ngoài không đóng (để tránh tắt nhầm), nếu muốn đóng ngoài khung thì bật đoạn dưới:
  // overlay.addEventListener("click", (e) => {
  //   if (e.target.id === "fbLiveOverlay") overlay.style.display = "none";
  // });
})();



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
