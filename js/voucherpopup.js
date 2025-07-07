// 🛡️ Fallback nếu file cũ còn gọi fetchVoucherMap
if (typeof fetchVoucherMap !== "function") {
  window.fetchVoucherMap = () => Promise.resolve({});
}

// 🔍 Lấy tên productPage từ URL (vd: /ysandal5568.html → ysandal5568)
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
    window.__voucherWaiting = { amount };
    popup.remove();
    document.querySelector("#btn-atc")?.click();
  });
}

// 🚀 KHỞI ĐỘNG NGAY
(function runVoucherImmediately() {
  const refCode = new URLSearchParams(window.location.search).get("ref");
  const amount = simpleVoucherMap[refCode];

  // ✅ Gán thẳng vào window.voucherByProduct
  window.voucherByProduct = window.voucherByProduct || {};

  // ✅ Titan luôn được giảm 200K
  const titanId = "pickleball-titan16";
  window.voucherByProduct[titanId] = 200000;

  // ✅ Nếu có refCode → tất cả sản phẩm sẽ được giảm thêm amount
  if (amount) {
    window.__voucherWaiting = { amount }; // Dành cho các file khác đọc nếu cần

    // 🎁 Gán giảm thêm cho toàn bộ sản phẩm sau này (nếu có logic dùng)
    localStorage.setItem("savedVoucher", JSON.stringify({ code: refCode, amount }));
    showVoucherPopup(refCode, amount);
  }
})();
