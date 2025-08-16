// ===============================================
// ✅ CHECKOUT POPUP + AUTOSAVE THÔNG TIN NGƯỜI NHẬN
// ===============================================

// ✅ CẬP NHẬT BADGE SỐ LƯỢNG TRÊN ICON GIỎ HÀNG
function updateCartItemCount() {
  const badge = document.getElementById("cartItemCount");
  if (!badge) return;
  const cart = Array.isArray(window.cart) ? window.cart : [];
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  badge.textContent = totalQty;
}

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
loadCart();
updateCartItemCount();

let shippingFee = 0;
let shippingFeeOriginal = 0;
let voucherValue = 0;

// ------------------------
// 🔹 AUTOSAVE – TRỢ GIÚP
// ------------------------

// ✅ Điền lại form từ localStorage (nếu đã lưu)
function hydrateCheckoutInfo() {
  try {
    const saved = JSON.parse(localStorage.getItem("checkoutInfo") || "{}");
    const nameEl = document.getElementById("checkoutName");
    const phoneEl = document.getElementById("checkoutPhone");
    const addressEl = document.getElementById("checkoutAddress");

    if (nameEl && typeof saved.name === "string") nameEl.value = saved.name;
    if (phoneEl && typeof saved.phone === "string") phoneEl.value = saved.phone;
    if (addressEl && typeof saved.address === "string") addressEl.value = saved.address;
  } catch (e) {
    console.warn("Không parse được checkoutInfo:", e);
  }
}

// ✅ Gắn listener để lưu mỗi lần người dùng gõ / đổi
function setupLiveSaveCheckoutInfo() {
  const nameEl = document.getElementById("checkoutName");
  const phoneEl = document.getElementById("checkoutPhone");
  const addressEl = document.getElementById("checkoutAddress");

  [nameEl, phoneEl, addressEl].forEach((el) => {
    if (el && !el.dataset.autosaveBound) {
      const handler = () => {
        const newInfo = {
          name: (document.getElementById("checkoutName")?.value || "").trim(),
          phone: (document.getElementById("checkoutPhone")?.value || "").trim(),
          address: (document.getElementById("checkoutAddress")?.value || "").trim(),
        };
        localStorage.setItem("checkoutInfo", JSON.stringify(newInfo));
      };
      el.addEventListener("input", handler);
      el.addEventListener("change", handler); // backup khi user nhập xong
      el.dataset.autosaveBound = "1";
    }
  });
}

// ✅ Chờ khi input được inject vào DOM rồi mới hydrate + bind
function whenCheckoutInputsReady(run) {
  const ready = () =>
    document.getElementById("checkoutName") &&
    document.getElementById("checkoutPhone") &&
    document.getElementById("checkoutAddress");

  if (ready()) return run();

  const obs = new MutationObserver(() => {
    if (ready()) {
      obs.disconnect();
      run();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

// ------------------------
// 🔹 POPUP HIỂN/ẨN
// ------------------------

function showCheckoutPopup() {
  loadShippingFee();
  renderCheckoutCart();

  const popup = document.getElementById("checkoutPopup");
  popup.classList.remove("hidden");
  popup.style.display = "flex";
  document.body.style.overflow = "hidden";

  bindCheckoutEvents();

  // ✅ Điền lại trước rồi mới gắn listener (DOM đã sẵn vì popup vừa mở)
  hydrateCheckoutInfo();
  setupLiveSaveCheckoutInfo();
}

function hideCheckoutPopup() {
  const popup = document.getElementById("checkoutPopup");
  if (popup) {
    popup.classList.add("hidden");
    popup.style.display = "none";
  }
  document.body.style.overflow = "auto";
}

// ------------------------
// 🔹 RENDER GIỎ HÀNG + TỔNG KẾT
// ------------------------

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
  voucherValue = window.cart.reduce((sum, item) => sum + (item.voucher?.amount || 0) * item.quantity, 0);

  const shipping = shippingFee;
  const total = subtotal + shipping - voucherValue;

  const qtyEl = document.getElementById("itemQuantityText");
  const subtotalEl = document.getElementById("subtotalText");
  if (qtyEl) qtyEl.textContent = `${totalQty} sản phẩm`;
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString()}₫`;

  const shippingEl = document.getElementById("shippingFeeText");
  if (shippingEl) {
    if (shippingFeeOriginal > shippingFee) {
      shippingEl.innerHTML = `
        <span style="text-decoration: line-through; color: gray; margin-right: 6px;">
          ${shippingFeeOriginal.toLocaleString()}₫
        </span>
        <span style="color: red; font-weight: bold;">
          ${shippingFee.toLocaleString()}₫
        </span>
      `;
    } else {
      shippingEl.textContent = `${shippingFee.toLocaleString()}₫`;
    }
  }

  const voucherTextEl = document.getElementById("voucherText");
  if (voucherTextEl) {
    if (voucherValue > 0) {
      voucherTextEl.textContent = `-${voucherValue.toLocaleString()}₫`;
      voucherTextEl.style.display = "block";
    } else {
      voucherTextEl.style.display = "none";
    }
  }

  const totalEl = document.getElementById("totalText");
  if (totalEl) totalEl.textContent = `${total.toLocaleString()}₫`;
}

// ------------------------
// 🔹 SỬA SỐ LƯỢNG / XOÁ / LƯU CART
// ------------------------

function changeItemQty(index, delta) {
  const item = window.cart[index];
  item.quantity = Math.max(1, item.quantity + delta);
  saveCart();
  renderCheckoutCart();
}

function removeItem(index) {
  window.cart.splice(index, 1);
  saveCart();
  renderCheckoutCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
  updateCartItemCount();
}

// ------------------------
// 🔹 PHÍ VẬN CHUYỂN
// ------------------------

function loadShippingFee() {
  fetch("https://friendly-kitten-d760ff.netlify.app/json/shippingfee.json")
    .then(res => res.json())
    .then(data => {
      const fees = window.cart.map(i => data[i.loai] || 0);
      const maxFee = Math.max(...fees, 0);
      shippingFeeOriginal = maxFee;
      shippingFee = Math.round(maxFee * 0.4); // Giảm 60%
      updateCheckoutSummary();
    })
    .catch(err => {
      console.warn("Không thể tải shippingfee.json:", err);
      shippingFeeOriginal = 0;
      shippingFee = 0;
      updateCheckoutSummary();
    });
}

// ------------------------
// 🔹 GỬI ĐƠN HÀNG
// ------------------------

function submitOrder() {
  const name = document.getElementById("checkoutName")?.value.trim();
  const phone = document.getElementById("checkoutPhone")?.value.trim();
  const address = document.getElementById("checkoutAddress")?.value.trim();

  if (!name || !phone || !address) {
    return alert("Vui lòng nhập đầy đủ thông tin.");
  }
  if (!window.cart.length) {
    return alert("Giỏ hàng của bạn đang trống.");
  }

  const firstItem = window.cart[0] || {};
  const category = firstItem.category || "unknown";

  const orderData = {
    name,
    phone,
    address,
    category,
    items: window.cart.map(item => {
      const baseItem = {
        id: item.id || null,
        category: item.category || "unknown",
        "Phân loại": item["Phân loại"],
        Giá: item.Giá,
        Ảnh: item.Ảnh,
        quantity: item.quantity
      };
      if (item.voucher && typeof item.voucher.amount === "number" && item.voucher.amount > 0) {
        baseItem.voucher = {
          amount: item.voucher.amount,
          label: item.voucher.label || ""
        };
      }
      return baseItem;
    }),
    shippingFee,
    voucherValue,
    total: window.cart.reduce((sum, i) => sum + i.Giá * i.quantity, 0) + shippingFee - voucherValue
  };

  console.log("📦 Sending orderData:", orderData);

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
      }

      // ❗ KHÔNG xóa checkoutInfo — giữ lại cho lần sau
      showThankyouPopup();
      window.cart = [];
      saveCart();
      hideCheckoutPopup();
    })
    .catch(err => {
      console.error("❌ Lỗi khi gửi về Make.com:", err);
      alert("Có lỗi xảy ra khi gửi đơn hàng, vui lòng thử lại sau.");
    });
}

// ------------------------
// 🔹 GẮN SỰ KIỆN
// ------------------------

function bindCheckoutEvents() {
  const btn = document.getElementById("checkoutSubmitBtn");
  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", submitOrder);
    btn.dataset.bound = "true";
  }
}

// ------------------------
// 🔹 THANK YOU POPUP
// ------------------------

function showThankyouPopup() {
  const el = document.getElementById("thankyouPopup");
  if (el) {
    el.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}

function hideThankyouPopup() {
  const el = document.getElementById("thankyouPopup");
  if (el) {
    el.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
}

// ------------------------
// 🔹 KHI LOAD TRANG
// ------------------------

window.addEventListener("DOMContentLoaded", () => {
  loadCart();
  bindCheckoutEvents();

  // ✅ Nếu input đã có sẵn trong DOM: điền + gắn listener ngay
  hydrateCheckoutInfo();
  setupLiveSaveCheckoutInfo();

  // ✅ Nếu input được inject muộn (qua injectHTML): chờ xong rồi thực hiện
  whenCheckoutInputsReady(() => {
    hydrateCheckoutInfo();
    setupLiveSaveCheckoutInfo();
  });
});
