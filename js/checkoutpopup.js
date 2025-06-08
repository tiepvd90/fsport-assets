// ✅ BIẾN TOÀN CỤC
window.cart = window.cart || [];
let shippingFee = 0;
let voucherValue = 0;

// ✅ HIỆN CHECKOUT POPUP
function showCheckoutPopup() {
  loadShippingFee();
  renderCheckoutCart();
  document.getElementById("checkoutPopup").classList.remove("hidden");
  document.getElementById("checkoutPopup").style.display = "flex";
  document.body.style.overflow = "hidden";
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

function updateCheckoutSummary() {
  const subtotal = window.cart.reduce((sum, item) => sum + item.Giá * item.quantity, 0);
  const totalQty = window.cart.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ Tính tổng giảm từ voucher
  voucherValue = window.cart.reduce((sum, item) => sum + (item.voucher?.amount || 0) * item.quantity, 0);

  const shipping = shippingFee;
  const total = subtotal + shipping - voucherValue;

  const qtyEl = document.getElementById("itemQuantityText");
  const subtotalEl = document.getElementById("subtotalText");
  if (qtyEl) qtyEl.textContent = `(${totalQty} sản phẩm)`;
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString()}₫`;

  document.getElementById("shippingFeeText").textContent = `${shipping.toLocaleString()}₫`;
  document.getElementById("voucherText").textContent = `-${voucherValue.toLocaleString()}₫`;
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

// ✅ LOAD GIỎ HÀNG KHI MỞ TRANG
function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem("cart"));
    if (Array.isArray(data)) window.cart = data;
  } catch (e) {
    console.warn("Không thể load cart từ localStorage");
  }
}

// ✅ TẢI PHÍ VẬN CHUYỂN
function loadShippingFee() {
  fetch("https://friendly-kitten-d760ff.netlify.app/json/shippingfee.json")
    .then(res => res.json())
    .then(data => {
      const fees = window.cart.map(i => data[i.loai] || 0);
      shippingFee = Math.max(...fees, 0);
      updateCheckoutSummary();
    })
    .catch(err => {
      console.warn("Không thể tải shippingfee.json:", err);
      shippingFee = 0;
      updateCheckoutSummary();
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

  // ✅ GỬI ĐƠN HÀNG VỀ MAKE.COM
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
    // ✅ TRACKING: Purchase & Subscribe
    const contentId = firstItem.id || "";
    const contentName = firstItem["Phân loại"] || "";

    if (typeof trackBothPixels === "function") {
      trackBothPixels("Purchase", {
        content_id: contentId,
        content_name: contentName,
        content_category: category,
        value: orderData.total,
        currency: "VND"
      });

      trackBothPixels("Subscribe", {
        content_id: contentId,
        content_name: contentName,
        content_category: category,
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


// ✅ BIND SỰ KIỆN KHI LOAD
window.addEventListener("DOMContentLoaded", () => {
  loadCart();
  document.getElementById("checkoutSubmitBtn")?.addEventListener("click", submitOrder);
});
