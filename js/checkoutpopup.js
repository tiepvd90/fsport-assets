// ✅ TẢI GIỎ HÀNG TỪ localStorage NGAY LÚC KHỞI TẠO
function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem("cart"));
    window.cart = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("Không thể load cart từ localStorage");
    window.cart = [];
  }
}
loadCart(); // ⬅️ Gọi ngay lập tức khi file được load

let shippingFee = 0;
let voucherValue = 0;

// ✅ HIỆN CHECKOUT POPUP
function showCheckoutPopup() {
  loadShippingFee();
  renderCheckoutCart();

  const popup = document.getElementById("checkoutPopup");
  popup.classList.remove("hidden");
  popup.style.display = "flex";
  document.body.style.overflow = "hidden";

  bindCheckoutEvents();
}

// ✅ ẨN CHECKOUT POPUP
function hideCheckoutPopup() {
  document.getElementById("checkoutPopup").classList.add("hidden");
  document.getElementById("checkoutPopup").style.display = "none";
  document.body.style.overflow = "auto";
}

// ✅ RENDER DANH SÁCH SẢN PHẨM
function renderCheckoutCart() {
  const list = document.getElementById("checkoutCartList");
  list.innerHTML = "";

  if (!window.cart.length) {
    list.innerHTML = '<div class="cart-empty">Giỏ hàng của bạn hiện đang trống</div>';
    return;
  }

  window.cart.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "cart-item";

    const hasVoucher = item.voucher?.amount;
    const priceText = item.Giá.toLocaleString() + "₫";
    const voucherHtml = hasVoucher
      ? `<span class="voucher-tag" style="background: rgba(0,160,230,0.6); color: white; font-size: 9px; padding: 2px 6px; margin-left: 6px; border-radius: 4px; vertical-align: middle;">Voucher: -${item.voucher.amount.toLocaleString()}₫</span>`
      : "";

    el.innerHTML = `
      <button class="remove-btn" onclick="removeItem(${index})">&times;</button>
      <img src="${item.Ảnh}" alt="img" />
      <div class="cart-item-details">
        <div class="cart-item-name">${item["Phân loại"]}</div>
        <div class="cart-item-price-qty">
          <div class="cart-item-price">
            ${priceText} ${voucherHtml}
          </div>
          <div class="cart-item-qty">
            <button onclick="changeItemQty(${index}, -1)">−</button>
            <span>${item.quantity}</span>
            <button onclick="changeItemQty(${index}, 1)">+</button>
          </div>
        </div>
      </div>
    `;
    list.appendChild(el);
  });

  updateCheckoutSummary();
}

// ✅ CẬP NHẬT TỔNG KẾT ĐƠN HÀNG
function updateCheckoutSummary(originalShipping = 0) {
  const subtotal = window.cart.reduce((sum, item) => sum + item.Giá * item.quantity, 0);
  const totalQty = window.cart.reduce((sum, item) => sum + item.quantity, 0);
  voucherValue = window.cart.reduce((sum, item) => sum + (item.voucher?.amount || 0) * item.quantity, 0);

  const total = subtotal + shippingFee - voucherValue;

  const qtyEl = document.getElementById("itemQuantityText");
  const subtotalEl = document.getElementById("subtotalText");
  if (qtyEl) qtyEl.textContent = `(${totalQty} sản phẩm)`;
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString()}₫`;

  document.getElementById("originalShippingFee").textContent = `${originalShipping.toLocaleString()}₫`;
  document.getElementById("shippingFeeText").textContent = `${shippingFee.toLocaleString()}₫`;

  const voucherEl = document.getElementById("voucherText");
  if (voucherEl) {
    if (voucherValue === 0) {
      voucherEl.parentElement.style.display = "none";
    } else {
      voucherEl.textContent = `-${voucherValue.toLocaleString()}₫`;
      voucherEl.parentElement.style.display = "flex";
    }
  }

  document.getElementById("totalText").textContent = `${total.toLocaleString()}₫`;
}

// ✅ THÊM / BỚT SỐ LƯỢNG
function changeItemQty(index, delta) {
  const item = window.cart[index];
  item.quantity = Math.max(1, item.quantity + delta);
  saveCart();
  renderCheckoutCart();
}

// ✅ XOÁ ITEM
function removeItem(index) {
  window.cart.splice(index, 1);
  saveCart();
  renderCheckoutCart();
}

// ✅ LƯU GIỎ HÀNG VÀO localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
}

// ✅ TẢI PHÍ VẬN CHUYỂN
function loadShippingFee() {
  fetch("https://friendly-kitten-d760ff.netlify.app/json/shippingfee.json")
    .then(res => res.json())
    .then(data => {
      const fees = window.cart.map(i => data[i.loai] || 0);
      const maxFee = Math.max(...fees, 0);
      shippingFee = Math.floor(maxFee * 0.4);
      updateCheckoutSummary(maxFee);
    })
    .catch(err => {
      console.warn("Không thể tải shippingfee.json:", err);
      shippingFee = 0;
      updateCheckoutSummary(0);
    });
}

// ✅ GỬI ĐƠN HÀNG
function submitOrder() {
  const name = document.getElementById("checkoutName")?.value.trim();
  const phone = document.getElementById("checkoutPhone")?.value.trim();
  const address = document.getElementById("checkoutAddress")?.value.trim();
  if (!name || !phone || !address) return alert("Vui lòng nhập đầy đủ thông tin.");

  const firstItem = window.cart[0] || {};
  const category = firstItem.category || "unknown";

  const orderData = {
    name,
    phone,
    address,
    category,
    items: window.cart.map(item => ({
      id: item.id || null,
      category: item.category || "unknown",
      "Phân loại": item["Phân loại"],
      Giá: item.Giá,
      Ảnh: item.Ảnh,
      quantity: item.quantity,
      voucher: item.voucher || null
    })),
    shippingFee,
    voucherValue,
    total: window.cart.reduce((sum, i) => sum + i.Giá * i.quantity, 0) + shippingFee - voucherValue
  };

  fetch("https://hook.eu2.make.com/m9o7boye6fl1hstehst7waysmt38b2ul", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  })
    .then(res => {
      if (!res.ok) throw new Error("Gửi đơn hàng thất bại");
      return res.text();
    })
    .then(() => {
      if (typeof trackBothPixels === "function" && firstItem) {
        trackBothPixels("Purchase", {
          content_id: firstItem.id || "unknown",
          content_name: firstItem["Phân loại"] || "unknown",
          content_category: firstItem.category || "unknown",
          content_page: window.productPage || "unknown",
          value: orderData.total,
          currency: "VND"
        });

        trackBothPixels("Subscribe", {
          content_id: firstItem.id || "unknown",
          content_name: firstItem["Phân loại"] || "unknown",
          content_category: firstItem.category || "unknown",
          content_page: window.productPage || "unknown",
          value: orderData.total,
          currency: "VND"
        });
      }

      alert("Cảm ơn bạn đã đặt hàng! Funsport sẽ sớm liên hệ.");
      window.cart = [];
      saveCart();
      hideCheckoutPopup();
    })
    .catch(err => {
      console.error("❌ Lỗi khi gửi về Make.com:", err);
      alert("Có lỗi xảy ra khi gửi đơn hàng, vui lòng thử lại sau.");
    });
}

// ✅ GẮN SỰ KIỆN CHO NÚT ĐẶT HÀNG
function bindCheckoutEvents() {
  const btn = document.getElementById("checkoutSubmitBtn");
  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", submitOrder);
    btn.dataset.bound = "true";
  }
}

// ✅ KHI LOAD TRANG
window.addEventListener("DOMContentLoaded", () => {
  loadCart();
  bindCheckoutEvents();
});
