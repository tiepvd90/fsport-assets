// ===============================================
// ✅ CHECKOUT POPUP + VOUCHER 10/10 (FREE SHIP + GIẢM GIÁ)
// ===============================================

function updateCartItemCount() {
  const badge = document.getElementById("cartItemCount");
  if (!badge) return;
  const cart = Array.isArray(window.cart) ? window.cart : [];
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  badge.textContent = totalQty;
}

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
// 🔹 AUTOSAVE THÔNG TIN NGƯỜI NHẬN
// ------------------------

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

function setupLiveSaveCheckoutInfo() {
  const els = [
    document.getElementById("checkoutName"),
    document.getElementById("checkoutPhone"),
    document.getElementById("checkoutAddress"),
  ];
  els.forEach((el) => {
    if (el && !el.dataset.autosaveBound) {
      const handler = () => {
        const info = {
          name: (document.getElementById("checkoutName")?.value || "").trim(),
          phone: (document.getElementById("checkoutPhone")?.value || "").trim(),
          address: (document.getElementById("checkoutAddress")?.value || "").trim(),
        };
        localStorage.setItem("checkoutInfo", JSON.stringify(info));
      };
      el.addEventListener("input", handler);
      el.addEventListener("change", handler);
      el.dataset.autosaveBound = "1";
    }
  });
}

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
// 🔹 POPUP CHECKOUT HIỂN/ẨN
// ------------------------

function showCheckoutPopup() {
  loadShippingFee();
  renderCheckoutCart();
  const popup = document.getElementById("checkoutPopup");
  if (popup) {
    popup.classList.remove("hidden");
    popup.style.display = "flex";
  }
  document.body.style.overflow = "hidden";
  bindCheckoutEvents();
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
  if (!list) return;
  list.innerHTML = "";

  if (!window.cart.length) {
    list.innerHTML = '<div class="cart-empty">Giỏ hàng của bạn hiện đang trống</div>';
    updateCheckoutSummary();
    return;
  }

  window.cart.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "cart-item";
    const priceText = Number(item.Giá || 0).toLocaleString() + "₫";
    el.innerHTML = `
      <button class="remove-btn" onclick="removeItem(${index})">&times;</button>
      <img src="${item.Ảnh}" alt="img" />
      <div class="cart-item-details">
        <div class="cart-item-name">${item["Phân loại"]}</div>
        <div class="cart-item-price-qty">
          <div class="cart-item-price">${priceText}</div>
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

// ------------------------
// 🔹 ÁP DỤNG VOUCHER 10/10 (FREE SHIP + % GIẢM)
// ------------------------

function updateCheckoutSummary() {
  const subtotal = window.cart.reduce(
    (sum, i) => sum + (i.Giá || 0) * (i.quantity || 1),
    0
  );
  const totalQty = window.cart.reduce((s, i) => s + (i.quantity || 1), 0);

  // 🎁 Free Ship
  shippingFeeOriginal = 0;
  shippingFee = 0;

  // 🎫 Voucher 10/10: 5% < 1.5tr, 8% >= 1.5tr
  if (subtotal > 0 && subtotal < 1500000) {
    voucherValue = Math.round(subtotal * 0.05);
  } else if (subtotal >= 1500000) {
    voucherValue = Math.round(subtotal * 0.08);
  } else {
    voucherValue = 0;
  }

  const total = subtotal - voucherValue + shippingFee;

  const qtyEl = document.getElementById("itemQuantityText");
  const subtotalEl = document.getElementById("subtotalText");
  if (qtyEl) qtyEl.textContent = `${totalQty} sản phẩm`;
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString()}₫`;

  const shippingEl = document.getElementById("shippingFeeText");
  if (shippingEl) shippingEl.textContent = "MIỄN PHÍ";

  const voucherTextEl = document.getElementById("voucherText");
  if (voucherTextEl) {
    if (voucherValue > 0) {
      voucherTextEl.style.display = "block";
      voucherTextEl.textContent = `Voucher 10/10: -${voucherValue.toLocaleString()}₫`;
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
  item.quantity = Math.max(1, (item.quantity || 1) + delta);
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
// 🔹 PHÍ VẬN CHUYỂN (FREE SHIP)
// ------------------------

function loadShippingFee() {
  shippingFeeOriginal = 0;
  shippingFee = 0;
  updateCheckoutSummary();
}

// ------------------------
// 🔹 GỬI ĐƠN HÀNG
// ------------------------

function submitOrder() {
  const name = document.getElementById("checkoutName")?.value.trim();
  const phone = document.getElementById("checkoutPhone")?.value.trim();
  const address = document.getElementById("checkoutAddress")?.value.trim();
  if (!name || !phone || !address) return alert("Vui lòng nhập đầy đủ thông tin.");
  if (!window.cart.length) return alert("Giỏ hàng của bạn đang trống.");

  const subtotal = window.cart.reduce(
    (sum, i) => sum + (i.Giá || 0) * (i.quantity || 1),
    0
  );
  const total = subtotal - voucherValue + shippingFee;

  const orderData = {
    name,
    phone,
    address,
    voucherLabel: "Voucher 10/10",
    voucherValue,
    shippingFee,
    items: window.cart,
    total,
  };

  console.log("📦 Sending orderData:", orderData);

  fetch("https://hook.eu2.make.com/m9o7boye6fl1hstehst7waysmt38b2ul", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Gửi đơn hàng thất bại");
      return res.text();
    })
    .then(() => {
      if (typeof trackBothPixels === "function" && window.cart[0]) {
        const f = window.cart[0];
        trackBothPixels("Purchase", {
          content_id: f.id || "unknown",
          content_name: f["Phân loại"] || "unknown",
          content_category: f.category || "unknown",
          value: total,
          currency: "VND",
        });
      }
      showThankyouPopup();
      window.cart = [];
      saveCart();
      hideCheckoutPopup();
    })
    .catch((err) => {
      console.error("❌ Lỗi gửi Make.com:", err);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    });
}

// ------------------------
// 🔹 SỰ KIỆN
// ------------------------

function bindCheckoutEvents() {
  const btn = document.getElementById("checkoutSubmitBtn");
  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", submitOrder);
    btn.dataset.bound = "true";
  }
}

// ------------------------
// 🔹 POPUP CẢM ƠN
// ------------------------

function showThankyouPopup() {
  const el = document.getElementById("thankyouPopup");
  if (!el) return;
  el.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function hideThankyouPopup() {
  const el = document.getElementById("thankyouPopup");
  if (!el) return;
  el.style.display = "none";
  document.body.style.overflow = "auto";
}

// ------------------------
// 🔹 KHI LOAD TRANG
// ------------------------

window.addEventListener("DOMContentLoaded", () => {
  loadCart();
  bindCheckoutEvents();
  const ty = document.getElementById("thankyouPopup");
  if (ty) {
    ty.style.display = "none";
    if (ty.classList) ty.classList.remove("hidden");
  }
  hydrateCheckoutInfo();
  setupLiveSaveCheckoutInfo();
  whenCheckoutInputsReady(() => {
    hydrateCheckoutInfo();
    setupLiveSaveCheckoutInfo();
  });
});
