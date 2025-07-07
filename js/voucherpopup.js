// 🛡️ Fallback nếu file cũ còn gọi fetchVoucherMap
if (typeof fetchVoucherMap !== "function") {
  window.fetchVoucherMap = () => {
    return Promise.resolve({});
  };
}

// 🔍 Lấy tên productPage từ URL
function getProductPageFromUrl() {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf("/") + 1);
  return filename.split(".")[0];
}

// 🎯 Danh sách refCode hợp lệ
const simpleVoucherMap = {
  "20k": 20000,
  "30k": 30000,
  "50k": 50000
};

// 🎯 Các productPage được phép áp dụng voucher qua ?ref=
const allowedPages = ["ysandal5568", "ysandalbn68", "firstpickleball", "secpickleball", "chair001"];

// 🎆 Tạo hiệu ứng pháo hoa
function createFirework(x, y) {
  const fw = document.createElement("div");
  fw.className = "firework";
  fw.style.left = `${x}px`;
  fw.style.top = `${y}px`;
  document.body.appendChild(fw);
  setTimeout(() => fw.remove(), 1000);
}

function launchFireworks(cx, cy) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 50 + Math.random() * 50;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    createFirework(x, y);
  }
}

// 🧨 Hiển thị popup voucher
function showVoucherPopup(refCode, amount) {
  if (document.getElementById("voucherPopup")) return;

  const popup = document.createElement("div");
  popup.className = "voucher-popup";
  popup.id = "voucherPopup";
  popup.innerHTML = `
    <div class="voucher-close" id="closeVoucherBtn">×</div>
    <h2>🎉 Chúc mừng!</h2>
    <p>Bạn đã nhận được <strong>voucher giảm ${amount.toLocaleString("vi-VN")}₫</strong> từ Funsport.</p>
    <button id="applyVoucherBtn">SỬ DỤNG VOUCHER NGAY</button>
  `;
  document.body.appendChild(popup);

  const rect = popup.getBoundingClientRect();
  launchFireworks(rect.left + rect.width / 2, rect.top + rect.height / 2);

  document.getElementById("closeVoucherBtn")?.addEventListener("click", () => popup.remove());

  document.getElementById("applyVoucherBtn")?.addEventListener("click", () => {
    localStorage.setItem("savedVoucher", JSON.stringify({ code: refCode, amount }));
    window.currentVoucherValue = amount;
    window.__voucherWaiting = { amount };
    popup.remove();
    document.querySelector("#btn-atc")?.click();
  });
}

// 🚀 KHỞI ĐỘNG NGAY
(function runVoucherImmediately() {
  const urlParams = new URLSearchParams(window.location.search);
  const refRaw = urlParams.get("ref") || "";
  const matchedCode = Object.keys(simpleVoucherMap).find(k => refRaw.startsWith(k));
  const amount = matchedCode ? simpleVoucherMap[matchedCode] : 0;
  const currentPage = getProductPageFromUrl();

  // ✅ Titan luôn được giảm 200K
  window.voucherByProduct = window.voucherByProduct || {};
  window.voucherByProduct["pickleball-titan16"] = 200000;

  // ✅ Nếu có ref + trang nằm trong danh sách cho phép
  if (amount > 0 && allowedPages.includes(currentPage)) {
    localStorage.setItem("savedVoucher", JSON.stringify({ code: refRaw, amount }));
    window.currentVoucherValue = amount;
    window.__voucherWaiting = { amount };
    showVoucherPopup(refRaw, amount);
  }
})();
