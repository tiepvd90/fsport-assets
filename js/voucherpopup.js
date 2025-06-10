// 🔁 Fetch JSON voucher theo loại sản phẩm từ Netlify
function fetchVoucherMap() {
  const jsonUrl = "https://friendly-kitten-d760ff.netlify.app/json/voucherpopup.json";
  return fetch(jsonUrl)
    .then(res => res.ok ? res.json() : {})
    .catch(err => {
      console.warn("❌ Không thể tải voucher JSON:", err);
      return {};
    });
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

function launchFireworks(cx, cy) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 50 + Math.random() * 50;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    createFirework(x, y);
  }
}

// 🧨 Popup voucher
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
    popup.remove();
    document.querySelector("#btn-atc")?.click();
  });
}

// ✅ Lấy voucher từ URL hoặc localStorage
function getVoucherFromUrlOrStorage(vouchers) {
  const refCode = new URLSearchParams(window.location.search).get("ref");

  if (refCode && vouchers[refCode]) {
    const { amount } = vouchers[refCode];
    localStorage.setItem("savedVoucher", JSON.stringify({ code: refCode, amount }));
    return { code: refCode, amount, from: "url" };
  }

  // Nếu không có trong URL → kiểm tra localStorage
  try {
    const saved = JSON.parse(localStorage.getItem("savedVoucher"));
    if (saved && saved.code && vouchers[saved.code]) {
      return { ...saved, from: "storage" };
    }
  } catch (e) {}

  return null;
}


// 🚀 Khởi động voucher
window.addEventListener("DOMContentLoaded", async () => {
  const loai = window.loai || "chair";
  const voucherData = await fetchVoucherMap();
  const vouchers = voucherData?.[loai] || {};
  window.__vouchersRaw = vouchers;
  window.voucherByProduct = {};

  const voucherInfo = getVoucherFromUrlOrStorage(vouchers);
  if (!voucherInfo) return;

  const { code, amount, from } = voucherInfo;
  const appliesTo = vouchers[code]?.appliesTo || [];

  if (appliesTo.includes("*")) {
    window.__voucherWaiting = { amount };
  } else {
    appliesTo.forEach(id => {
      window.voucherByProduct[id] = amount;
    });
  }

  window.currentVoucherValue = amount;

  if (from === "url") {
    showVoucherPopup(code, amount);
  }
});
