// 🛡️ Fallback nếu file cũ còn gọi fetchVoucherMap
if (typeof fetchVoucherMap !== "function") {
  window.fetchVoucherMap = () => Promise.resolve({});
}

// 🔍 Lấy tên productPage từ URL
function getProductPageFromUrl() {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf("/") + 1);
  return filename.split(".")[0];
}

// 🎯 Danh sách refCode hợp lệ
const simpleVoucherMap = {
  "30k": 30000,
};

// 🎯 Các productPage được phép áp dụng voucher qua ?ref=
const allowedPages = [
  "ysandal5568", "ysandalbn68", "firstpickleball",
  "secpickleball", "teflon", "gen4", "pickleball-airforce"
];

// 🎁 Tạo popup voucher chính
function showVoucherPopup(refCode, amount) {
  if (document.getElementById("voucherPopup")) return;

  const popup = document.createElement("div");
  popup.className = "voucher-popup";
  popup.id = "voucherPopup";
  popup.innerHTML = `
    <div class="voucher-close" id="closeVoucherBtn">×</div>
    <h2>🎉 Chúc Mừng!</h2>
    <p>Bạn đã nhận được <strong>voucher giảm ${amount.toLocaleString("vi-VN")}₫</strong> khi mua vợt Pickleball và Dép Chạy Bộ Ysandal.</p>
    <button id="applyVoucherBtn">SỬ DỤNG VOUCHER NGAY</button>
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
}

// 🖼️ Tạo ảnh nổi voucher nhỏ bên phải
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

// 🚀 Khởi động logic voucher
(function runVoucherImmediately() {
  const urlParams = new URLSearchParams(window.location.search);
  const refRaw = urlParams.get("ref") || "";
  const matchedCode = Object.keys(simpleVoucherMap).find(k => refRaw.startsWith(k));
  const amount = matchedCode ? simpleVoucherMap[matchedCode] : 0;
  const currentPage = getProductPageFromUrl();

  window.voucherByProduct = window.voucherByProduct || {};

  // ✅ Nếu có ref hợp lệ và đúng productPage
  if (amount > 0 && allowedPages.includes(currentPage)) {
    localStorage.setItem("savedVoucher", JSON.stringify({ code: refRaw, amount }));
    window.currentVoucherValue = amount;
    window.__voucherWaiting = { amount };

    // Nếu chưa có popup thì hiện ảnh nổi
    if (!document.getElementById("voucherPopup")) {
      createVoucherFloatingIcon(amount, refRaw);
    }

    showVoucherPopup(refRaw, amount);
  }

  // ✅ Nếu không có ref nhưng đã lưu voucher cũ → áp dụng ngầm
  else {
    const saved = JSON.parse(localStorage.getItem("savedVoucher") || "{}");
    const reusedAmount = saved?.amount;
    const reusedCode = saved?.code || "";

    if (reusedAmount > 0 && allowedPages.includes(currentPage)) {
      window.currentVoucherValue = reusedAmount;
      window.__voucherWaiting = { amount: reusedAmount };

      if (!document.getElementById("voucherPopup")) {
        createVoucherFloatingIcon(reusedAmount, reusedCode);
      }
    }
  }
})();
