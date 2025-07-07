// ✅ Lấy tên trang hiện tại từ URL
function getProductPageFromUrl() {
  const path = window.location.pathname;
  const parts = path.split("/");
  const file = parts[parts.length - 1];
  return file.split(".")[0]; // ví dụ: ysandal5568.html → ysandal5568
}

// 🧾 Mã giảm giá đơn giản: refCode → amount
const simpleVoucherMap = {
  "20k": 20000,
  "30k": 30000,
  "50k": 50000
};

// ✅ Danh sách productPage được áp dụng
const allowedPages = ["ysandal5568", "ysandalbn68", "supblue", "chair001"];

// 🎆 Hiệu ứng pháo hoa
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

// 🚀 Khởi động sau khi DOM load xong
window.addEventListener("DOMContentLoaded", () => {
  const refCode = new URLSearchParams(window.location.search).get("ref");
  const amount = simpleVoucherMap[refCode];
  if (!amount) return;

  const currentPage = getProductPageFromUrl();
  if (!allowedPages.includes(currentPage)) return;

  localStorage.setItem("savedVoucher", JSON.stringify({ code: refCode, amount }));
  window.currentVoucherValue = amount;
  window.__voucherWaiting = { amount };

  showVoucherPopup(refCode, amount);
});
