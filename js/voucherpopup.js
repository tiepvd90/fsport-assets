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
// 🔴 POPUP LIVESTREAM FACEBOOK MINI + FULL
// ==========================================
(function () {
  const fbLiveUrl = "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=false&autoplay=1&mute=1&width=267";

  // ===== CSS =====
  const style = document.createElement("style");
  style.textContent = `
    /* Mini khung nổi bên trái */
    #fbLiveMini {
      position: fixed;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 110px;
      background: #fff;
      border: 1px solid #ccc;
      border-left: none;
      border-radius: 0 10px 10px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9998;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    #fbLiveMini:hover { transform: translateY(-50%) scale(1.03); }

    #fbLiveMini iframe {
      width: 100%;
      height: 180px;
      display: block;
    }

    /* Dòng chữ LIVE đỏ phía trên */
    .live-label {
      background: #ff0000;
      color: #fff;
      text-align: center;
      font-weight: 900;
      font-size: 14px;
      padding: 3px 0;
      letter-spacing: 1px;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.3; }
      100% { opacity: 1; }
    }

    /* Popup phóng to */
    #fbLivePopupLarge {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 480px;
      height: auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.3);
      z-index: 10000;
      display: none;
      overflow: hidden;
    }

    #fbLivePopupLarge iframe {
      width: 100%;
      height: 80vh;
      border: none;
      display: block;
    }

    #fbLivePopupLarge .close-btn {
      position: absolute;
      top: 5px;
      right: 10px;
      font-size: 24px;
      color: #000;
      background: rgba(255,255,255,0.8);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      line-height: 28px;
      text-align: center;
      cursor: pointer;
      font-weight: bold;
      z-index: 10001;
    }

    @media (max-width: 768px) {
      #fbLiveMini { width: 90px; }
      #fbLiveMini iframe { height: 150px; }
      #fbLivePopupLarge { width: 90%; }
    }
  `;
  document.head.appendChild(style);

  // ===== Tạo khung mini =====
  const mini = document.createElement("div");
  mini.id = "fbLiveMini";
  mini.innerHTML = `
    <div class="live-label">🔴 LIVE</div>
    <iframe
      src="${fbLiveUrl}"
      scrolling="no"
      frameborder="0"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowfullscreen="true">
    </iframe>
  `;
  document.body.appendChild(mini);

  // ===== Tạo popup lớn (ẩn ban đầu) =====
  const popup = document.createElement("div");
  popup.id = "fbLivePopupLarge";
  popup.innerHTML = `
    <div class="close-btn">&times;</div>
    <iframe
      src="${fbLiveUrl}"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowfullscreen="true">
    </iframe>
  `;
  document.body.appendChild(popup);

  // ===== Sự kiện mở/đóng =====
  mini.addEventListener("click", () => {
    popup.style.display = "block";
  });
  popup.querySelector(".close-btn").addEventListener("click", () => {
    popup.style.display = "none";
  });
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
