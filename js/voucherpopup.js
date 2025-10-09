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
    <p>GIẢM 8% ĐƠN HÀNG TRÊN <strong style="font-weight:900; color:#d32f2f;">1.500.000 </strong> ĐỒNG</p>
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
    return `${h}:${m}:${sec < 10 ? "0" : ""}${sec}`;
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
