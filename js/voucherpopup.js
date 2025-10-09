// 🛡️ Fallback nếu file cũ còn gọi fetchVoucherMap
if (typeof fetchVoucherMap !== "function") {
  window.fetchVoucherMap = () => Promise.resolve({});
}


const simpleVoucherMap = {
  "30k": 30000,
};

function showVoucherPopup(refCode, amount) {
  if (document.getElementById("voucherPopup")) return;

  const popup = document.createElement("div");
  popup.className = "voucher-popup";
  popup.id = "voucherPopup";
  popup.innerHTML = `
    <div class="voucher-close" id="closeVoucherBtn">×</div>
    <h2>🎉 FLASH SALE 10.10!</h2>
    <p>MIỄN PHÍ SHIP TOÀN BỘ ĐƠN HÀNG</p>
    <p>GIẢM 5% TOÀN BỘ WEBSIE</p>
    <p>GIẢM 8% ĐƠN HÀNG TRÊN 1.500.000 ĐỒNG</p>
    <p><span id="voucherCountdown" style="font-weight:bold; color:#e53935;"></span></p>
    <button id="applyVoucherBtn">LẤY MÃ GIẢM GIÁ NGAY</button>
  `;
  document.body.appendChild(popup);

  document.getElementById("closeVoucherBtn")?.addEventListener("click", () => popup.remove());

  document.getElementById("applyVoucherBtn")?.addEventListener("click", () => {
    localStorage.setItem("savedVoucher", JSON.stringify({ code: refCode, amount }));
    window.currentVoucherValue = amount;
    window.__voucherWaiting = { amount };

    popup.remove();
    document.querySelector("#btn-atc")?.click();
  });

  startVoucherCountdown(600);
}

function createVoucherFloatingIcon(amount, refCode) {
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
    if (e.target.id !== "closeVoucherIcon") {
      showVoucherPopup(refCode, amount);
    }
  });

  document.getElementById("closeVoucherIcon")?.addEventListener("click", (e) => {
    e.stopPropagation();
    icon.remove();
  });
}

function startVoucherCountdown(seconds) {
  const countdownEl = document.getElementById("voucherCountdown");
  if (!countdownEl) return;

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m} phút ${sec < 10 ? "0" : ""}${sec} giây`;
  }

  countdownEl.textContent = `Voucher sẽ hết hạn sau: ${formatTime(seconds)}`;
  const interval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(interval);
      countdownEl.textContent = "Voucher đã hết hạn!";
    } else {
      countdownEl.textContent = `Voucher sẽ hết hạn sau: ${formatTime(seconds)}`;
    }
  }, 1000);
}

// ✅ Hàm chính
function runVoucherImmediately() {
  const refCode = "30k";
  const amount = 30000;

  const lastShown = Number(sessionStorage.getItem("voucherShownGlobal") || 0);
  const COOLDOWN_MS = 60 * 60 * 1000; // 1 tiếng không hiện lại
  if (Date.now() - lastShown < COOLDOWN_MS) {
    console.log("⏳ Đang trong cooldown – không hiện lại popup voucher.");
    return;
  }

  localStorage.setItem("savedVoucher", JSON.stringify({ code: refCode, amount }));
  window.currentVoucherValue = amount;
  window.__voucherWaiting = { amount };

  sessionStorage.setItem("voucherShownGlobal", String(Date.now()));
  console.log("🎉 Hiển thị voucher popup mặc định 30K ở mọi trang.");
  createVoucherFloatingIcon(amount, refCode);
  showVoucherPopup(refCode, amount);
}

// ✅ Đảm bảo chạy đúng thời điểm
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runVoucherImmediately);
} else {
  runVoucherImmediately();
}

// ✅ nếu khách hàng đã checkout nhưng không mua mà ấn close checkout thì hiện voucher 30k
(function setupVoucherAfterCheckoutClose() {
  function waitForCloseButton(retries = 20) {
    const closeBtn = document.querySelector(".checkout-close");
    if (!closeBtn) {
      if (retries > 0) {
        setTimeout(() => waitForCloseButton(retries - 1), 300);
      } else {
        console.warn("❌ Không tìm thấy .checkout-close sau nhiều lần thử.");
      }
      return;
    }

    closeBtn.addEventListener("click", () => {
      setTimeout(() => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");

        const lastPurchaseTime = Number(localStorage.getItem("lastPurchaseTime") || 0);
        const recentPurchaseWithin24h = Date.now() - lastPurchaseTime < 24 * 60 * 60 * 1000;
        if (recentPurchaseWithin24h) {
          console.log("⏳ Khách mới mua hàng – không hiển popup.");
          return;
        }

        const lastShown = Number(sessionStorage.getItem("voucherShownAfterClose") || 0);
        const COOLDOWN_MS = 60 * 60 * 1000;
        if (Date.now() - lastShown < COOLDOWN_MS) {
          console.log("⏳ Đang trong cooldown – không hiện lại.");
          return;
        }

        const refCode = "30k";
        const amount = 30000;

        localStorage.setItem("savedVoucher", JSON.stringify({ code: refCode, amount }));
        sessionStorage.setItem("voucherShownAfterClose", String(Date.now()));
        window.currentVoucherValue = amount;
        window.__voucherWaiting = { amount };

        console.log("🎉 Hiển thị voucher popup 30K khi đóng giỏ hàng.");
        createVoucherFloatingIcon(amount, refCode);
        showVoucherPopup(refCode, amount);
      }, 300);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => waitForCloseButton());
  } else {
    waitForCloseButton();
  }
})();
