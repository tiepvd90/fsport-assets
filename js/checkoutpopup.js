// ===============================================
// ✅ CHECKOUT POPUP + AUTOSAVE THÔNG TIN NGƯỜI NHẬN
// ===============================================
// ------------------------
// 🔹 CART STATE
// ------------------------
function updateCartItemCount() {
  const badge = document.getElementById("cartItemCount");
  const cart = Array.isArray(window.cart) ? window.cart : [];
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  if (badge) badge.textContent = totalQty;
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = totalQty;
    el.hidden = false;
  });
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
const trackedPurchaseOrderIds = new Set();
const GA4_PURCHASED_ORDERS_KEY = "fsport_ga4_purchased_orders";
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

function cartItemName(item) {
  return item["Ph\u00e2n lo\u1ea1i"] ||
    item["Ph\u00c3\u00a2n lo\u00e1\u00ba\u00a1i"] ||
    item.product_name ||
    item.name ||
    item.feed_product_code ||
    item.id ||
    "S\u1ea3n ph\u1ea9m";
}

function cartItemPrice(item) {
  return Number(item["Gi\u00e1"] || item["Gi\u00c3\u00a1"] || item.price || item.product_price || 0);
}

function cartItemImage(item) {
  return item["\u1ea2nh"] || item["\u00e1\u00ba\u00a2nh"] || item.image || item.image_url || item.product_image_url || "";
}

function hasTrackedGA4Purchase(orderId) {
  if (!orderId || trackedPurchaseOrderIds.has("ga4:" + orderId)) return true;
  try {
    const ids = JSON.parse(localStorage.getItem(GA4_PURCHASED_ORDERS_KEY) || "[]");
    return Array.isArray(ids) && ids.includes(orderId);
  } catch (e) {
    return false;
  }
}

function markGA4PurchaseTracked(orderId) {
  if (!orderId) return;
  trackedPurchaseOrderIds.add("ga4:" + orderId);
  try {
    const ids = JSON.parse(localStorage.getItem(GA4_PURCHASED_ORDERS_KEY) || "[]");
    const next = Array.isArray(ids) ? ids.filter(Boolean) : [];
    if (!next.includes(orderId)) next.push(orderId);
    localStorage.setItem(GA4_PURCHASED_ORDERS_KEY, JSON.stringify(next.slice(-100)));
  } catch (e) {}
}

function trackGA4PurchaseOnce(orderData, orderId) {
  if (!orderData || !orderId || hasTrackedGA4Purchase(orderId)) return;
  if (typeof window.trackGA4EcommerceEvent !== "function") return;
  if (!orderData.total || orderData.total <= 0) return;

  window.trackGA4EcommerceEvent("purchase", {
    transaction_id: orderId,
    currency: "VND",
    value: orderData.total,
    shipping: orderData.shippingFee || 0,
    items: (orderData.items || []).map(item => ({
      item_id: item.id || item.feed_product_code || "",
      item_name: item.product_name || cartItemName(item),
      price: cartItemPrice(item),
      quantity: item.quantity || 1
    }))
  });
  markGA4PurchaseTracked(orderId);
}
// ------------------------
// 🔹 RENDER GIỎ HÀNG + TỔNG KẾT
// ------------------------
function renderCheckoutCart() {
  const list = document.getElementById("checkoutCartList");
  if (!list) return;
  list.innerHTML = "";
  if (!window.cart.length) {
    list.innerHTML = '<div class="cart-empty">Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n hi\u1ec7n \u0111ang tr\u1ed1ng</div>';
    updateCheckoutSummary();
    return;
  }
  window.cart.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "cart-item";
    const hasVoucher = item.voucher?.amount;
    const priceText = cartItemPrice(item).toLocaleString("vi-VN") + "\u0111";
    const voucherHtml = hasVoucher
      ? `<span class="voucher-tag" style="background: rgba(0,160,230,0.6); color: white; font-size: 9px; padding: 2px 6px; margin-left: 6px; border-radius: 4px; vertical-align: middle;">Voucher: -${Number(item.voucher.amount).toLocaleString("vi-VN")}\u0111</span>`
      : "";
    el.innerHTML = `
      <button class="remove-btn" onclick="removeItem(${index})">&times;</button>
      <img src="${cartItemImage(item)}" alt="img" />
      <div class="cart-item-details">
        <div class="cart-item-name">${cartItemName(item)}</div>
        <div class="cart-item-price-qty">
          <div class="cart-item-price">
            ${priceText} ${voucherHtml}
          </div>
          <div class="cart-item-qty">
            <button onclick="changeItemQty(${index}, -1)">&minus;</button>
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
  const subtotal = window.cart.reduce((sum, item) => sum + cartItemPrice(item) * (item.quantity || 1), 0);
  const totalQty = window.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  voucherValue = window.cart.reduce((sum, item) => sum + (item.voucher?.amount || 0) * (item.quantity || 1), 0);
  const shipping = shippingFee;
  const total = subtotal + shipping - voucherValue;
  const qtyEl = document.getElementById("itemQuantityText");
  const subtotalEl = document.getElementById("subtotalText");
  if (qtyEl) qtyEl.textContent = `${totalQty} s\u1ea3n ph\u1ea9m`;
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString("vi-VN")}\u0111`;
  const shippingEl = document.getElementById("shippingFeeText");
  if (shippingEl) {
    if (shippingFeeOriginal > shippingFee) {
      shippingEl.innerHTML = `
        <span style="text-decoration: line-through; color: gray; margin-right: 6px;">
          ${shippingFeeOriginal.toLocaleString("vi-VN")}\u0111
        </span>
        <span style="color: red; font-weight: bold;">
          ${shippingFee.toLocaleString("vi-VN")}\u0111
        </span>
      `;
    } else {
      shippingEl.textContent = `${shippingFee.toLocaleString("vi-VN")}\u0111`;
    }
  }
  const voucherTextEl = document.getElementById("voucherText");
  if (voucherTextEl) {
    if (voucherValue > 0) {
      voucherTextEl.textContent = `-${voucherValue.toLocaleString("vi-VN")}\u0111`;
      voucherTextEl.style.display = "block";
    } else {
      voucherTextEl.style.display = "none";
    }
  }
  const totalEl = document.getElementById("totalText");
  if (totalEl) totalEl.textContent = `${total.toLocaleString("vi-VN")}\u0111`;
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
  fetch("/json/shippingfee.json")
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
  btn.textContent = "\u0110ang g\u1eedi...";
  const name = document.getElementById("checkoutName")?.value.trim();
  const phone = document.getElementById("checkoutPhone")?.value.trim();
  const address = document.getElementById("checkoutAddress")?.value.trim();
  if (!name || !phone || !address) {
    alert("Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 th\u00f4ng tin.");
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }
  if (!window.cart.length) {
    alert("Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n \u0111ang tr\u1ed1ng.");
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
        product_name: cartItemName(item),
        product_image_url: cartItemImage(item),
        feed_source: item.feed_source || null,
        feed_post_id: item.feed_post_id || null,
        feed_product_code: item.feed_product_code || null,
        quantity: item.quantity
      };
      baseItem["Ph\u00e2n lo\u1ea1i"] = cartItemName(item);
      baseItem["Gi\u00e1"] = cartItemPrice(item);
      baseItem["\u1ea2nh"] = cartItemImage(item);
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
    total: window.cart.reduce((sum, i) => sum + cartItemPrice(i) * (i.quantity || 1), 0)
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
  var _seq = String(Date.now()).slice(-4) + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  var _orderCode = "#" + _mm + _dd + _yy + "-" + _seq;

  console.log("📦 Sending orderData:", orderData, "orderId:", _orderId, "orderCode:", _orderCode);

  var erpPromise = typeof sendOrderToERP === "function"
    ? sendOrderToERP(orderData, _orderId, _orderCode)
    : Promise.reject(new Error("ERP sender is unavailable"));

  if (!trackedPurchaseOrderIds.has(_orderId) && typeof trackBothPixels === "function" && orderData.total > 0) {
    trackedPurchaseOrderIds.add(_orderId);
    trackBothPixels("Purchase", {
      content_ids: window.cart.map(i => i.id).filter(Boolean),
      contents: window.cart.map(i => ({
        id: i.id || "",
        quantity: i.quantity || 1,
        item_price: cartItemPrice(i)
      })),
      content_type: "product",
      value: orderData.total,
      currency: "VND"
    }, {
      eventID: _orderId
    });
    console.log("✅ Purchase tracked before Make.com");
  }

  var makePromise = fetch("https://hook.eu2.make.com/m9o7boye6fl1hstehst7waysmt38b2ul", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  })
    .then(res => {
      if (!res.ok) throw new Error("Gửi đơn hàng thất bại");
      return res.text();
    });

  Promise.allSettled([makePromise, erpPromise])
    .then(results => {
      var failed = results.find(function(result) { return result.status === "rejected"; });
      if (failed) throw failed.reason;
      // Analytics nội bộ
      if (typeof window.fsport !== 'undefined') {
        var feedPostIds = Array.from(new Set((orderData.items || [])
          .map(function(i) { return i.feed_post_id || null })
          .filter(Boolean)))
        window.fsport.track('purchase', {
          order_id:   _orderId,
          order_code: _orderCode,
          total:      orderData.total,
          source:     feedPostIds.length ? 'feed' : 'checkout',
          feed_post_ids: feedPostIds,
          products:   (orderData.items || []).map(function(i) {
            return { id: i.id, name: i.product_name || i["T\u00ean"] || i.name || '', qty: i.quantity || 1, price: cartItemPrice(i), feed_post_id: i.feed_post_id || null }
          })
        })
      }
      trackGA4PurchaseOnce(orderData, _orderId);
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
      alert("C\u00f3 l\u1ed7i x\u1ea3y ra khi g\u1eedi \u0111\u01a1n h\u00e0ng, vui l\u00f2ng th\u1eed l\u1ea1i sau.");
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
function _erpPost(url, anon, body, prefer) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("apikey", anon);
    xhr.setRequestHeader("Authorization", "Bearer " + anon);
    xhr.setRequestHeader("Prefer", prefer || "return=minimal");
    xhr.onload = function() {
      resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, text: xhr.responseText });
    };
    xhr.onerror = function() { reject(new Error("Network error")); };
    xhr.send(JSON.stringify(body));
  });
}

function _erpSleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function _erpPostWithRetry(url, anon, body, prefer, maxAttempts) {
  var attempts = maxAttempts || 3;
  var lastResult = null;
  var lastError = null;
  for (var attempt = 1; attempt <= attempts; attempt++) {
    try {
      lastResult = await _erpPost(url, anon, body, prefer);
      if (lastResult.ok) return lastResult;
      if (lastResult.status < 500 && lastResult.status !== 408 && lastResult.status !== 429) return lastResult;
    } catch (err) {
      lastError = err;
    }
    if (attempt < attempts) await _erpSleep(500 * attempt);
  }
  if (lastError && !lastResult) throw lastError;
  return lastResult || { status: 0, ok: false, text: "ERP request failed" };
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
  var name        = opts.name || "Kh\u00e1ch";
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
        customer_id: customerId, label: "M\u1eb7c \u0111\u1ecbnh", address: address, is_default: true
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
          label: "\u0110\u1ecba ch\u1ec9 " + (existingAddrs.length + 1),
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
      return s + cartItemPrice(i) * (i.quantity || 1);
    }, 0);

    // orderId và orderCode nhận từ submitOrder() — không tạo lại ở đây
    // (giữ nguyên định dạng: #MMDDYY-XXXX)

    // 1. INSERT order — chỉ gửi các cột thực sự có trong schema
    var orderRes = await _erpPostWithRetry(_url + "/rest/v1/orders", _anon, {
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
      carrier_fee:      null,
      accessory_fee:    null,
      payment_method:   "cod",
      source:           "website",
      status:           "new"
    }, "return=minimal", 3);
    if (!orderRes.ok) {
      console.error("🔴 ERP: INSERT order thất bại", orderRes.text);
      throw new Error("ERP order insert failed (" + orderRes.status + "): " + orderRes.text);
    }
    console.log("✅ ERP: tạo đơn", orderCode, orderId);

    // 2. INSERT order_items
    var itemsPayload = (orderData.items || []).map(function(item) {
      return {
        order_id:       orderId,
        product_id:     item.id || null,
        category:       item.category || orderData.category || "",
        unit_price:     cartItemPrice(item),
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

    return { created: true, orderId: orderId, orderCode: orderCode };
  } catch (err) {
    console.warn("⚠ ERP sendOrderToERP error:", err.message || err);
    throw err;
  }
}
