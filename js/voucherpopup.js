// 🔁 Hàm fetch file JSON chứa danh sách voucher theo loại sản phẩm
function fetchVoucherMap(jsonUrl = "/json/voucherpopup.json") {
  return fetch(jsonUrl)
    .then(res => res.json())
    .catch(err => {
      console.warn("Không thể tải voucher JSON:", err);
      return {};
    });
}

// 🔍 Lấy mã voucher từ URL
function getVoucherCodeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
}

// 🎆 Pháo hoa
function createFirework(x, y) {
  const fw = document.createElement('div');
  fw.className = 'firework';
  fw.style.left = `${x}px`;
  fw.style.top = `${y}px`;
  document.body.appendChild(fw);
  setTimeout(() => fw.remove(), 1000);
}
function launchFireworks(centerX, centerY) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 50 + Math.random() * 50;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    createFirework(x, y);
  }
}

// 🎁 Hiển thị popup
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
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  launchFireworks(centerX, centerY);

  document.getElementById("closeVoucherBtn")?.addEventListener("click", () => popup.remove());

  document.getElementById("applyVoucherBtn")?.addEventListener("click", () => {
    localStorage.setItem("useVoucherCode", refCode);
    localStorage.setItem("useVoucherAmount", amount);
    popup.remove();
    document.querySelector("#btn-atc")?.click(); // Giả lập mở giỏ hàng
  });
}

// 🚀 Tự động bật nếu đúng mã
window.addEventListener("DOMContentLoaded", async () => {
  if (typeof loai === "undefined") {
    console.warn("⚠ Không tìm thấy biến 'loai'. Không thể kiểm tra voucher.");
    return;
  }

  const voucherData = await fetchVoucherMap();
  const refCode = getVoucherCodeFromURL();

  if (refCode && voucherData[loai] && voucherData[loai][refCode]) {
    const amount = voucherData[loai][refCode];
    showVoucherPopup(refCode, amount);
  }
});
