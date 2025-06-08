function showCheckoutPopup() {
  renderCheckoutPopup();
  document.getElementById("checkoutPopup").classList.remove("hidden");
  document.getElementById("checkoutPopup").style.display = "flex";
}

function hideCheckoutPopup() {
  document.getElementById("checkoutPopup").classList.add("hidden");
  document.getElementById("checkoutPopup").style.display = "none";
}

async function calculateShippingFee() {
  const res = await fetch("/json/shippingfee.json");
  const feeData = await res.json();
  let maxFee = 0;
  const seenTypes = new Set();

  window.cart.forEach(item => {
    const loai = item.loai;
    if (!seenTypes.has(loai)) {
      seenTypes.add(loai);
      const fee = feeData[loai] || 0;
      if (fee > maxFee) maxFee = fee;
    }
  });

  return maxFee;
}

function updateQuantity(index, delta) {
  const item = window.cart[index];
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  renderCheckoutPopup();
}

function removeItem(index) {
  window.cart.splice(index, 1);
  renderCheckoutPopup();
}

async function renderCheckoutPopup() {
  const list = document.getElementById("checkoutCartList");
  list.innerHTML = "";
  let subtotal = 0;

  window.cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "checkout-item";

    row.innerHTML = `
      <button class="remove-btn" onclick="removeItem(${index})">×</button>
      <img src="${item.Ảnh}" class="item-thumb" alt="Sản phẩm">
      <div class="item-info">
        <div class="item-name">${item["Phân loại"]}</div>
        <div class="item-price">${(item.Giá).toLocaleString()}₫</div>
        <div class="item-qty">
          <button onclick="updateQuantity(${index}, -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantity(${index}, 1)">+</button>
        </div>
      </div>
    `;
    list.appendChild(row);
    subtotal += item.Giá * item.quantity;
  });

  const voucher = window.currentVoucherValue || 0;
  const shipping = await calculateShippingFee();
  const total = subtotal + shipping - voucher;

  document.getElementById("subtotalText").textContent = subtotal.toLocaleString() + "₫";
  document.getElementById("shippingFeeText").textContent = shipping.toLocaleString() + "₫";
  document.getElementById("voucherText").textContent = "-"+voucher.toLocaleString() + "₫";
  document.getElementById("totalText").textContent = total.toLocaleString() + "₫";
  document.querySelector(".checkout-title").textContent = `Giỏ Hàng Của Bạn (${window.cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)`;
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("checkoutSubmitBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const name = document.getElementById("checkoutName")?.value.trim();
      const phone = document.getElementById("checkoutPhone")?.value.trim();
      const address = document.getElementById("checkoutAddress")?.value.trim();

      if (!name || !phone || !address) {
        alert("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.");
        return;
      }

      const data = {
        cart: window.cart,
        name,
        phone,
        address,
        voucher: window.currentVoucherValue || 0,
      };

      // 📦 Gửi dữ liệu về Make hoặc nơi khác
      fetch("URL_CUA_BAN_TAI_DAY", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      alert("Đặt hàng thành công. Chúng tôi sẽ sớm liên hệ với bạn!");
      hideCheckoutPopup();
    });
  }
});
