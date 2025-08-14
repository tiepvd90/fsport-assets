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
    const atcBtn = document.querySelector("#btn-atc");
    if (atcBtn) {
      atcBtn.click();
    } else {
      popup.remove();
    }
  });

  startVoucherCountdown(600); // 10 phút
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

// 🚀 Khởi động: luôn chạy khi DOM đã sẵn
function runVoucherImmediately() {
  const urlParams = new URLSearchParams(window.location.search);
  const refRaw = urlParams.get("ref") || "";
  const matchedCode = Object.keys(simpleVoucherMap).find(k => refRaw.startsWith(k));
  const amount = matchedCode ? simpleVoucherMap[matchedCode] : 0;
  const currentPage = getProductPageFromUrl();

  console.log("🎯 Voucher script running", { refRaw, amount, currentPage });

  window.voucherByProduct = window.voucherByProduct || {};

  if (amount > 0 && allowedPages.includes(currentPage)) {
    // ✅ Áp dụng voucher mới
    localStorage.setItem("savedVoucher", JSON.stringify({ code: refRaw, amount }));
    window.currentVoucherValue = amount;
    window.__voucherWaiting = { amount };

    createVoucherFloatingIcon(amount, refRaw);
    showVoucherPopup(refRaw, amount);
  } else {
    // ✅ Tải lại voucher cũ nếu có
    const saved = JSON.parse(localStorage.getItem("savedVoucher") || "{}");
    const reusedAmount = saved?.amount;
    const reusedCode = saved?.code || "";

    if (reusedAmount > 0 && allowedPages.includes(currentPage)) {
      window.currentVoucherValue = reusedAmount;
      window.__voucherWaiting = { amount: reusedAmount };

      createVoucherFloatingIcon(reusedAmount, reusedCode);
    }
  }
}

// ✅ Đảm bảo chỉ chạy sau khi DOM và window.productPage sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runVoucherImmediately);
} else {
  runVoucherImmediately();
}
