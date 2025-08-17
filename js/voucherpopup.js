// 🛡️ Fallback nếu file cũ còn gọi fetchVoucherMap
if (typeof fetchVoucherMap !== "function") {
  window.fetchVoucherMap = () => Promise.resolve({});
}

function getProductPageFromUrl() {
  if (typeof window.productPage === "string" && window.productPage.trim() !== "") {
    return window.productPage.trim().toLowerCase();
  }

  const path = window.location.pathname.toLowerCase();
  const filename = path.substring(path.lastIndexOf("/") + 1);
  return filename.split(".")[0] || "homepage";
}

const simpleVoucherMap = {
  "30k": 30000,
};

const allowedPages = [
  "ysandal5568", "ysandalbn68", "firstpickleball",
  "secpickleball", "teflon", "phantom", "gen4", "tera", "ysandal5560", "bcu5206", "bn520",
  "collection", "pickleball-airforce", "homepage"
];

function showVoucherPopup(refCode, amount) {
  if (document.getElementById("voucherPopup")) return;

  const popup = document.createElement("div");
  popup.className = "voucher-popup";
  popup.id = "voucherPopup";
  popup.innerHTML = `
    <div class="voucher-close" id="closeVoucherBtn">×</div>
    <h2>🎉 Chúc Mừng!</h2>
    <p>Bạn đã nhận được <strong>voucher giảm ${amount.toLocaleString("vi-VN")}₫</strong> khi mua vợt Pickleball và Dép Chạy Bộ Ysandal.</p>
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

  startVoucherCountdown(600); // 600 giây = 10 phút
}

function createVoucherFloatingIcon(amount, refCode) {
  if (document.getElementById("voucherFloatIcon")) return;

  const icon = document.createElement("div");
  icon.id = "voucherFloatIcon";
  icon.innerHTML = `
    <div class="voucher-float-img-wrapper">
      <img src="https://i.postimg.cc/pdNBDJ8B/voucher30k.png" alt="voucher" />
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
  const urlParams = new URLSearchParams(window.location.search);
  const refRaw = urlParams.get("ref") || "";
  const matchedCode = Object.keys(simpleVoucherMap).find(k => refRaw.startsWith(k));
  const amount = matchedCode ? simpleVoucherMap[matchedCode] : 0;
  const currentPage = getProductPageFromUrl();

  console.log("🎯 Voucher check:", {
    refRaw, amount, currentPage, productPage: window.productPage
  });

  window.voucherByProduct = window.voucherByProduct || {};

  if (amount > 0 && allowedPages.includes(currentPage)) {
    console.log("✅ Áp dụng voucher mới", amount);

    localStorage.setItem("savedVoucher", JSON.stringify({ code: refRaw, amount }));
    window.currentVoucherValue = amount;
    window.__voucherWaiting = { amount };

    createVoucherFloatingIcon(amount, refRaw);
    showVoucherPopup(refRaw, amount);
  } else {
    const saved = JSON.parse(localStorage.getItem("savedVoucher") || "{}");
    const reusedAmount = saved?.amount;
    const reusedCode = saved?.code || "";

    if (reusedAmount > 0 && allowedPages.includes(currentPage)) {
      console.log("♻️ Tái sử dụng voucher đã lưu:", reusedAmount);

      window.currentVoucherValue = reusedAmount;
      window.__voucherWaiting = { amount: reusedAmount };

      createVoucherFloatingIcon(reusedAmount, reusedCode);
    } else {
      console.log("🚫 Không đủ điều kiện hiển thị voucher.");
    }
  }
}

// ✅ Đảm bảo chạy đúng thời điểm
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runVoucherImmediately);
} else {
  runVoucherImmediately();
}
// ✅ nếu khách hàng đã checkout nhưng không mua mà ấn close checkout thì hiện voucher
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.querySelector(".checkout-close");
  if (!closeBtn) return;

  closeBtn.addEventListener("click", () => {
    setTimeout(() => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!cart.length) {
        console.log("❌ Giỏ hàng trống – không hiển thị voucher khi đóng.");
        return;
      }

      const lastShown = Number(sessionStorage.getItem("voucherShownAfterClose") || 0);
      const COOLDOWN_MS = 1 * 60 * 60 * 1000;
      if (Date.now() - lastShown < COOLDOWN_MS) {
        console.log("⏳ Trong cooldown – không hiện lại voucher.");
        return;
      }

      const currentPage = getProductPageFromUrl();
      if (!allowedPages.includes(currentPage)) {
        console.log("🚫 Không nằm trong allowedPages.");
        return;
      }

      // ✅ Mặc định tặng voucher 30K khi ấn X lần đầu
      const refCode = "30k";
      const amount = 30000;

      // 👉 Ghi nhận vào session để tránh lặp
      sessionStorage.setItem("voucherShownAfterClose", String(Date.now()));
      localStorage.setItem("savedVoucher", JSON.stringify({ code: refCode, amount }));
      window.currentVoucherValue = amount;
      window.__voucherWaiting = { amount };

      console.log("🎉 Hiện popup voucher 30K sau khi đóng checkoutpopup.");
      showVoucherPopup(refCode, amount);
    }, 300);
  });
});

