// ===============================================
// ✅ CHECKOUT POPUP + AUTOSAVE THÔNG TIN NGƯỜI NHẬN
// ===============================================
// ------------------------
// 🔹 CART STATE
// ------------------------
function updateCartItemCount() {
  const badge = document.getElementById("cartItemCount");
  if (!badge) return;
  const cart = Array.isArray(window.cart) ? window.cart : [];
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  badge.textContent = totalQty;
}
// ✅ Tự động cập nhật số lượng trên icon giỏ hàng mỗi khi giỏ thay đổi
(function autoUpdateCartBadge() {
  const _setItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    const result = _setItem.apply(this, arguments);
    if (key === "cart") {
      try {
        const data = JSON.parse(value || "[]");
        window.cart = Array.isArray(data) ? data : [];
        updateCartItemCount();
      } catch (e) {
        console.warn("Không thể cập nhật cart badge:", e);
      }
    }
    return result;
  };
})();
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
// 🔹 AUTOSAVE – THÔNG TIN NGƯỜI NHẬN
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
    const hasVoucher = item.voucher?.amount;
    const priceText = Number(item.Giá || 0).toLocaleString() + "₫";
    const voucherHtml = hasVoucher
      ? `<span class="voucher-tag" style="background: rgba(0,160,230,0.6); color: white; font-size: 9px; padding: 2px 6px; margin-left: 6px; border-radius: 4px; vertical-align: middle;">Voucher: -${Number(item.voucher.amount).toLocaleString()}₫</span>`
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
  const subtotal = window.cart.reduce((sum, item) => sum + (item.Giá || 0) * (item.quantity || 1), 0);
  const totalQty = window.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  voucherValue = window.cart.reduce((sum, item) => sum + (item.voucher?.amount || 0) * (item.quantity || 1), 0);
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
// 🔹 PHÍ VẬN CHUYỂN
// ------------------------
function loadShippingFee() {
  fetch("https://friendly-kitten-d760ff.netlify.app/json/shippingfee.json")
    .then(res => res.json())
    .then(data => {
      const fees = window.cart.map(i => {
        if (i.id && data.byId && data.byId.hasOwnProperty(i.id)) {
          return data.byId[i.id];
        }
        if (i.category && data.byCategory && data.byCategory.hasOwnProperty(i.category)) {
          return data.byCategory[i.category];
        }
        return 0;
      });
      const maxFee = Math.max(...fees, 0);
      shippingFeeOriginal = maxFee;
      shippingFee = Math.round(maxFee * 0.4);
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
async function submitOrder() {
  const btn = document.getElementById("checkoutSubmitBtn");
  if (!btn) return;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Đang gửi...";
  const name = document.getElementById("checkoutName")?.value.trim();
  const phone = document.getElementById("checkoutPhone")?.value.trim();
  const address = document.getElementById("checkoutAddress")?.value.trim();
  if (!name || !phone || !address) {
    alert("Vui lòng nhập đầy đủ thông tin.");
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }
  if (!window.cart.length) {
    alert("Giỏ hàng của bạn đang trống.");
    btn.disabled = false;
    btn.textContent = originalText;
    return;
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
    promoDiscount: window.promoCodeDiscount || 0,
    total: window.cart.reduce((sum, i) => sum + (i.Giá || 0) * (i.quantity || 1), 0)
       + shippingFee
       - voucherValue
       - (window.promoCodeDiscount || 0)
  };
  // 🔵 Tạo orderId + orderCode TRƯỚC — dùng chung cho ERP và chatbox
  var _orderId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  var _now = new Date(Date.now() + 7 * 3600 * 1000);
  var _mm  = String(_now.getUTCMonth() + 1).padStart(2, "0");
  var _dd  = String(_now.getUTCDate()).padStart(2, "0");
  var _yy  = String(_now.getUTCFullYear()).slice(-2);
  var _seq = String(Date.now()).slice(-4);
  var _orderCode = "#" + _mm + _dd + _yy + "-" + _seq;

  console.log("📦 Sending orderData:", orderData, "orderId:", _orderId, "orderCode:", _orderCode);

  // 🔵 Gửi vào Supabase ERP song song (non-blocking, không ảnh hưởng Make.com flow)
  if (typeof sendOrderToERP === "function") {
    sendOrderToERP(orderData, _orderId, _orderCode).catch(function(e) {
      console.warn("⚠ ERP error (non-critical):", e.message);
    });
  }

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
      if (typeof trackBothPixels === "function" && orderData.total > 0) {
        trackBothPixels("Purchase", {
          content_ids: window.cart.map(i => i.id).filter(Boolean),
          contents: window.cart.map(i => ({
            id: i.id || "",
            quantity: i.quantity || 1,
            item_price: Number(i.Giá || 0)
          })),
          content_type: "product",
          value: orderData.total,
          currency: "VND"
        });
        console.log("✅ Purchase tracked");
      }
      window.cart = [];
      saveCart();
      hideCheckoutPopup();
      // 🟢 Mở chatbox xác nhận đơn (nếu feature bật)
      // OC_CHAT.open() tự kiểm tra enabled; nếu OFF sẽ tự gọi showThankyouPopup()
      if (window.OC_CHAT && typeof OC_CHAT.open === "function") {
        OC_CHAT.open({
          orderId:         _orderId,
          orderCode:       _orderCode,
          customerName:    orderData.name,
          customerPhone:   orderData.phone,
          customerAddress: orderData.address,
          items:           orderData.items,
          total:           orderData.total
        });
      } else {
        showThankyouPopup();
      }
    })
    .catch(err => {
      console.error("❌ Lỗi khi gửi về Make.com:", err);
      alert("Có lỗi xảy ra khi gửi đơn hàng, vui lòng thử lại sau.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = originalText;
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
// Load promo code module
const promoScript = document.createElement("script");
promoScript.src = "/js/promocode.js";
document.head.appendChild(promoScript);

// Load chatbox xác nhận đơn (lazy — chỉ cần khi đặt hàng xong)
const ocChatScript = document.createElement("script");
ocChatScript.src = "/js/order-confirm-chat.js";
document.head.appendChild(ocChatScript);
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
// ✅ Inject HTML thankyouPopup
fetch("/html/thanks-afterpurchase.html")
  .then(res => {
    if (!res.ok) throw new Error("Không load được thanks-afterpurchase.html");
    return res.text();
  })
  .then(html => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    temp.querySelectorAll("style").forEach(styleTag => {
      document.head.appendChild(styleTag.cloneNode(true));
    });
    const popup = temp.querySelector("#thankyouPopup");
    if (popup) {
      document.body.appendChild(popup);
    } else {
      console.warn("⚠ Không tìm thấy #thankyouPopup trong thanks-afterpurchase.html");
    }
    temp.querySelectorAll("script").forEach(s => {
      const newScript = document.createElement("script");
      if (s.src) {
        newScript.src = s.src;
      } else {
        newScript.textContent = s.textContent;
      }
      document.body.appendChild(newScript);
    });
    console.log("✅ Đã inject thankyou popup");
  })
  .catch(err => console.warn("Không load được thankyouPopup:", err));

// ============================================================
// 🔹 SUPABASE ERP — Gửi đơn hàng + tạo/cập nhật khách hàng
// Chạy song song với Make.com, non-blocking
// ============================================================
window.FSPORT_SUPABASE_URL  = "https://xcigbbcpwfzluqazadez.supabase.co";
window.FSPORT_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4";

// XHR POST helper
function _erpPost(url, anon, body) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("apikey", anon);
    xhr.setRequestHeader("Authorization", "Bearer " + anon);
    xhr.setRequestHeader("Prefer", "return=minimal");
    xhr.onload = function() {
      resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, text: xhr.responseText });
    };
    xhr.onerror = function() { reject(new Error("Network error")); };
    xhr.send(JSON.stringify(body));
  });
}

// XHR GET helper
function _erpGet(url, anon) {
  return new Promise(function(resolve) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("apikey", anon);
    xhr.setRequestHeader("Authorization", "Bearer " + anon);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = function() { resolve({ ok: xhr.status >= 200 && xhr.status < 300, text: xhr.responseText }); };
    xhr.onerror = function() { resolve({ ok: false, text: "network error" }); };
    xhr.send();
  });
}

// XHR PATCH helper
function _erpPatch(url, anon, body) {
  return new Promise(function(resolve) {
    var xhr = new XMLHttpRequest();
    xhr.open("PATCH", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("apikey", anon);
    xhr.setRequestHeader("Authorization", "Bearer " + anon);
    xhr.setRequestHeader("Prefer", "return=minimal");
    xhr.onload = function() { resolve({ ok: xhr.status >= 200 && xhr.status < 300, text: xhr.responseText }); };
    xhr.onerror = function() { resolve({ ok: false, text: "network error" }); };
    xhr.send(JSON.stringify(body));
  });
}

// Upsert customer theo phone: tạo mới hoặc cập nhật nếu đã có
async function _erpUpsertCustomer(url, anon, opts) {
  var phone       = String(opts.phone || "").trim();
  var name        = opts.name || "Khách";
  var address     = opts.address || "";
  var order_total = Number(opts.order_total || 0);
  var order_id    = opts.order_id || null;
  if (!phone) return null;

  // GET customer by phone
  var getRes = await _erpGet(
    url + "/rest/v1/customers?phone=eq." + encodeURIComponent(phone) + "&select=id,total_orders,total_spent,customer_addresses(address)",
    anon
  );
  var existing = null;
  if (getRes.ok) {
    try {
      var arr = JSON.parse(getRes.text);
      if (arr && arr.length > 0) existing = arr[0];
    } catch(e) {}
  }

  var customerId = null;

  if (!existing) {
    // Tạo customer mới
    var tier = "normal";
    if (order_total >= 30000000) tier = "vip";
    else if (order_total >= 10000000) tier = "gold";
    else if (order_total >= 2000000) tier = "silver";

    var insRes = await _erpPost(url + "/rest/v1/customers", anon, {
      phone: phone, name: name, type: "retail", tier: tier,
      total_orders: 1, total_spent: order_total
    });
    console.log("🔵 ERP: INSERT customer status =", insRes.status);

    // GET lại để lấy id
    var getRes2 = await _erpGet(
      url + "/rest/v1/customers?phone=eq." + encodeURIComponent(phone) + "&select=id&limit=1",
      anon
    );
    if (getRes2.ok) {
      try {
        var arr2 = JSON.parse(getRes2.text);
        if (arr2 && arr2.length > 0) customerId = arr2[0].id;
      } catch(e) {}
    }

    // Thêm địa chỉ mặc định
    if (customerId && address) {
      await _erpPost(url + "/rest/v1/customer_addresses", anon, {
        customer_id: customerId, label: "Mặc định", address: address, is_default: true
      });
    }
    console.log("✅ ERP: tạo customer mới", phone, "id:", customerId);

  } else {
    // Cập nhật customer đã có
    customerId = existing.id;
    var newOrders = Number(existing.total_orders || 0) + 1;
    var newSpent  = Number(existing.total_spent  || 0) + order_total;
    var tier = "normal";
    if (newSpent >= 30000000) tier = "vip";
    else if (newSpent >= 10000000) tier = "gold";
    else if (newSpent >= 2000000) tier = "silver";

    await _erpPatch(
      url + "/rest/v1/customers?id=eq." + customerId,
      anon,
      { name: name, total_orders: newOrders, total_spent: newSpent, tier: tier }
    );

    // Thêm địa chỉ mới nếu chưa có
    if (address) {
      var existingAddrs = (existing.customer_addresses || []).map(function(a) { return a.address; });
      if (!existingAddrs.includes(address)) {
        await _erpPost(url + "/rest/v1/customer_addresses", anon, {
          customer_id: customerId,
          label: "Địa chỉ " + (existingAddrs.length + 1),
          address: address, is_default: false
        });
      }
    }
    console.log("✅ ERP: cập nhật customer", phone, "id:", customerId);
  }

  // Gắn customer_id vào order
  if (customerId && order_id) {
    await _erpPatch(
      url + "/rest/v1/orders?id=eq." + order_id,
      anon,
      { customer_id: customerId }
    );
  }
  return customerId;
}

// Gửi đơn hàng vào Supabase ERP (chạy song song Make.com, non-blocking)
// orderId và orderCode được tạo trong submitOrder() và truyền vào đây
// để chatbox và ERP dùng cùng 1 ID
async function sendOrderToERP(orderData, orderId, orderCode) {
  try {
    var _url  = window.FSPORT_SUPABASE_URL;
    var _anon = window.FSPORT_SUPABASE_ANON;
    console.log("🔵 ERP: bắt đầu gửi đơn về Supabase...");

    var subtotal = (orderData.items || []).reduce(function(s, i) {
      return s + (i.Giá || 0) * (i.quantity || 1);
    }, 0);

    // orderId và orderCode nhận từ submitOrder() — không tạo lại ở đây
    // (giữ nguyên định dạng: #MMDDYY-XXXX)

    // 1. INSERT order — chỉ gửi các cột thực sự có trong schema
    var orderRes = await _erpPost(_url + "/rest/v1/orders", _anon, {
      id:               orderId,
      order_code:       orderCode,
      customer_name:    orderData.name,
      customer_phone:   orderData.phone,
      customer_address: orderData.address,
      customer_note:    orderData.note || null,
      category:         orderData.category || null,
      subtotal:         subtotal,
      shipping_fee:     orderData.shippingFee || 0,
      voucher_value:    orderData.voucherValue || 0,
      promo_discount:   orderData.promoDiscount || 0,
      total:            orderData.total || subtotal,
      payment_method:   "cod",
      source:           "website",
      status:           "new"
    });
    if (!orderRes.ok) {
      console.error("🔴 ERP: INSERT order thất bại", orderRes.text);
      return;
    }
    console.log("✅ ERP: tạo đơn", orderCode, orderId);

    // 2. INSERT order_items
    var itemsPayload = (orderData.items || []).map(function(item) {
      return {
        order_id:       orderId,
        product_id:     item.id || null,
        category:       item.category || orderData.category || "",
        unit_price:     Number(item.Giá || 0),
        voucher_amount: Number(item.voucher && item.voucher.amount || 0),
        voucher_label:  item.voucher && item.voucher.label || null,
        quantity:       Number(item.quantity || 1)
      };
    });
    if (itemsPayload.length) {
      var itemsRes = await _erpPost(_url + "/rest/v1/order_items", _anon, itemsPayload);
      if (!itemsRes.ok) {
        console.error("🔴 ERP: INSERT order_items thất bại", itemsRes.text);
      } else {
        console.log("✅ ERP: lưu", itemsPayload.length, "sản phẩm");
      }
    }

    // 3. Upsert customer (non-critical, không block)
    try {
      await _erpUpsertCustomer(_url, _anon, {
        phone:       orderData.phone,
        name:        orderData.name,
        address:     orderData.address,
        order_total: orderData.total || subtotal,
        order_id:    orderId
      });
    } catch (custErr) {
      console.warn("⚠ ERP customer upsert failed (non-critical):", custErr.message);
    }

  } catch (err) {
    console.warn("⚠ ERP sendOrderToERP error:", err.message || err);
  }
}
