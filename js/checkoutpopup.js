// === CHECKOUT POPUP JS ===

// Biến giỏ hàng toàn cục
window.cart = window.cart || [];

function showCheckoutPopup() {
  renderCheckoutCart();
  document.getElementById("checkoutPopup").classList.remove("hidden");
  document.getElementById("checkoutPopup").style.display = "flex";
}

function hideCheckoutPopup() {
  document.getElementById("checkoutPopup").classList.add("hidden");
  document.getElementById("checkoutPopup").style.display = "none";
}

function renderCheckoutCart() {
  const list = document.getElementById("checkoutCartList");
  list.innerHTML = '';

  let subtotal = 0;
  let totalQuantity = 0;
  let maxShipping = 0;
  const shippingFeeMap = window.shippingFeeMap || {};

  window.cart.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "cart-item";
    
    const itemHtml = `
      <button class="remove-btn" onclick="removeCartItem(${index})">×</button>
      <img src="${item.Ảnh}" alt="">
      <div class="cart-item-details">
        <div class="cart-item-name">${item["Phân loại"]}</div>
        <div class="cart-item-price-qty">
          <div class="cart-item-price">${item.Giá.toLocaleString()}₫</div>
          <div class="cart-item-qty">
            <button onclick="changeItemQty(${index}, -1)">−</button>
            <span>${item.quantity}</span>
            <button onclick="changeItemQty(${index}, 1)">+</button>
          </div>
        </div>
      </div>
    `;
    itemDiv.innerHTML = itemHtml;
    list.appendChild(itemDiv);

    subtotal += item.Giá * item.quantity;
    totalQuantity += item.quantity;

    if (shippingFeeMap[item.loai] && shippingFeeMap[item.loai] > maxShipping) {
      maxShipping = shippingFeeMap[item.loai];
    }
  });

  const voucher = window.currentVoucherValue || 0;
  const total = subtotal + maxShipping - voucher;

  document.getElementById("subtotalText").textContent = subtotal.toLocaleString() + "₫";
  document.getElementById("shippingFeeText").textContent = maxShipping.toLocaleString() + "₫";
  document.getElementById("voucherText").textContent = "-" + voucher.toLocaleString() + "₫";
  document.getElementById("totalText").textContent = total.toLocaleString() + "₫";
}

function removeCartItem(index) {
  window.cart.splice(index, 1);
  renderCheckoutCart();
}

function changeItemQty(index, delta) {
  const item = window.cart[index];
  item.quantity = Math.max(1, item.quantity + delta);
  renderCheckoutCart();
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("/json/shippingfee.json")
    .then(res => res.json())
    .then(data => window.shippingFeeMap = data)
    .catch(() => window.shippingFeeMap = {});

  const submitBtn = document.getElementById("checkoutSubmitBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const fullname = document.getElementById("checkoutName")?.value.trim();
      const phone = document.getElementById("checkoutPhone")?.value.trim();
      const address = document.getElementById("checkoutAddress")?.value.trim();
      if (!fullname || !phone || !address) return alert("Vui lòng nhập đủ thông tin.");

      const dataToSend = {
        fullname,
        phone,
        address,
        cart: window.cart,
        voucher: window.currentVoucherValue || 0
      };

      // TODO: fetch gửi dữ liệu về make.com ở đây
      console.log("🛒 Gửi đơn hàng:", dataToSend);
      alert("Funsport đã nhận đơn, sẽ sớm liên hệ lại.");
      hideCheckoutPopup();
    });
  }
});
