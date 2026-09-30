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
let voucherValue = 0;
let checkoutQuote = null;
let checkoutQuoteRequestId = 0;
let checkoutPolicyConsentRequired = true;
const WEBSITE_SETTINGS_URL =
  "https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/website-settings";

function applyCheckoutConsentVisibility() {
  const box = document.querySelector(".checkout-consent");
  const consent = document.getElementById("checkoutPolicyConsent");
  const error = document.getElementById("checkoutConsentError");
  if (box) box.hidden = !checkoutPolicyConsentRequired;
  if (!checkoutPolicyConsentRequired) {
    if (consent) consent.checked = false;
    if (error) error.hidden = true;
  }
}

function loadWebsiteCheckoutSettings() {
  fetch(WEBSITE_SETTINGS_URL, { cache: "no-store", headers: { accept: "application/json" } })
    .then(function(response) {
      if (!response.ok) throw new Error("Website settings HTTP " + response.status);
      return response.json();
    })
    .then(function(settings) {
      checkoutPolicyConsentRequired = settings.checkoutPolicyConsentEnabled !== false;
      applyCheckoutConsentVisibility();
    })
    .catch(function(error) {
      console.warn("[Checkout] Không tải được cài đặt website, giữ checkbox mặc định.", error);
    });
}

loadWebsiteCheckoutSettings();
// Promo code is temporarily disabled.
window.promoCodeDiscount = 0;
const trackedPurchaseOrderIds = new Set();
const GA4_PURCHASED_ORDERS_KEY = "fsport_ga4_purchased_orders";
const PURCHASED_ORDERS_KEY = "fsport_purchased_orders";
const CHECKOUT_ATTEMPT_KEY = "fsport_pending_checkout";
const SPECIFIC_PHONE_CORRECTION_KEY = "fsport_phone_correction_092926_14961584";
const SPECIFIC_PHONE_CORRECTION_OLD_PHONE = "035323889";

function readStoredOrderIds(key) {
  try {
    const ids = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(ids) ? ids.filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

function hasTrackedPurchase(orderId) {
  return !orderId || trackedPurchaseOrderIds.has(orderId) || readStoredOrderIds(PURCHASED_ORDERS_KEY).includes(orderId);
}

function markPurchaseTracked(orderId) {
  if (!orderId) return;
  trackedPurchaseOrderIds.add(orderId);
  const ids = readStoredOrderIds(PURCHASED_ORDERS_KEY);
  if (!ids.includes(orderId)) ids.push(orderId);
  try {
    localStorage.setItem(PURCHASED_ORDERS_KEY, JSON.stringify(ids.slice(-100)));
  } catch (e) {}
}

function newCheckoutUuid() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function newCheckoutCode() {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const date = String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    String(now.getUTCFullYear()).slice(-2);
  const suffix = String(Date.now()).slice(-4) + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return "#" + date + "-" + suffix;
}

function checkoutFingerprint(orderData) {
  const source = JSON.stringify({
    name: orderData.name,
    phone: orderData.phone,
    address: orderData.address,
    total: orderData.total,
    items: (orderData.items || []).map(function(item) {
      return [item.inventory_product_id, item.product_code, item.quantity, cartItemPrice(item)];
    })
  });
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function getCheckoutAttempt(orderData) {
  const fingerprint = checkoutFingerprint(orderData);
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKOUT_ATTEMPT_KEY) || "null");
    // Keep the same idempotency key until the server-confirmed success path
    // clears it. Expiring an uncertain request could create a second order.
    if (saved && saved.fingerprint === fingerprint && saved.orderId && saved.orderCode) {
      return saved;
    }
  } catch (e) {}
  const attempt = {
    fingerprint,
    orderId: newCheckoutUuid(),
    orderCode: newCheckoutCode(),
    createdAt: Date.now()
  };
  try { localStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify(attempt)); } catch (e) {}
  return attempt;
}

function clearCheckoutAttempt(orderId) {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKOUT_ATTEMPT_KEY) || "null");
    if (saved && saved.orderId === orderId) localStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
  } catch (e) {}
}
// ------------------------
// 🔹 AUTOSAVE – THÔNG TIN NGƯỜI NHẬN
// ------------------------
function parseVietnamCheckoutPhone(rawPhone) {
  const raw = String(rawPhone || "").trim();
  if (!raw) {
    return { normalized: null, message: "Vui lòng nhập số điện thoại." };
  }

  // Customers may use spaces, dots, hyphens or parentheses for readability.
  const compact = raw.replace(/[\s.()\-]/g, "");
  if (!/^\+?\d+$/.test(compact)) {
    return { normalized: null, message: "Số điện thoại chứa ký tự không hợp lệ." };
  }

  let nationalNumber;
  if (compact.startsWith("+84")) {
    nationalNumber = compact.slice(3);
  } else if (compact.startsWith("84")) {
    nationalNumber = compact.slice(2);
  } else if (compact.startsWith("0")) {
    nationalNumber = compact.slice(1);
  } else {
    return {
      normalized: null,
      message: "Số điện thoại phải bắt đầu bằng 0, 84 hoặc +84."
    };
  }

  if (nationalNumber.length < 9) {
    const missing = 9 - nationalNumber.length;
    return {
      normalized: null,
      message: `Số điện thoại đang thiếu ${missing} chữ số.`
    };
  }
  if (nationalNumber.length > 9) {
    const extra = nationalNumber.length - 9;
    return {
      normalized: null,
      message: `Số điện thoại đang thừa ${extra} chữ số.`
    };
  }

  return { normalized: "0" + nationalNumber, message: "" };
}

function formatVietnamCheckoutPhone(normalizedPhone) {
  return String(normalizedPhone || "").replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}

function setCheckoutPhoneError(message) {
  const input = document.getElementById("checkoutPhone");
  const error = document.getElementById("checkoutPhoneError");
  if (input) {
    input.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
  if (error) {
    error.textContent = message || "";
    error.hidden = !message;
  }
}

function validateAndFormatCheckoutPhone(showError) {
  const input = document.getElementById("checkoutPhone");
  if (!input) return { normalized: null, message: "Vui lòng nhập số điện thoại." };
  const result = parseVietnamCheckoutPhone(input.value);
  if (result.normalized) input.value = formatVietnamCheckoutPhone(result.normalized);
  if (showError || result.normalized) setCheckoutPhoneError(result.message);
  return result;
}

function readSpecificPhoneCorrectionState() {
  try {
    const state = JSON.parse(localStorage.getItem(SPECIFIC_PHONE_CORRECTION_KEY) || "null");
    return state && typeof state === "object" ? state : null;
  } catch (e) {
    return null;
  }
}

function cachedPhoneForSpecificCorrection(rawPhone) {
  const compact = String(rawPhone || "").replace(/[^0-9+]/g, "");
  if (compact.startsWith("+84")) return "0" + compact.slice(3);
  if (compact.startsWith("84")) return "0" + compact.slice(2);
  return compact;
}

function shouldShowSpecificPhoneCorrection() {
  const state = readSpecificPhoneCorrectionState();
  if (state && state.status === "completed") return false;
  try {
    const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo") || "{}");
    return cachedPhoneForSpecificCorrection(checkoutInfo.phone) === SPECIFIC_PHONE_CORRECTION_OLD_PHONE;
  } catch (e) {
    return false;
  }
}

function setSpecificPhoneCorrectionError(message) {
  const input = document.getElementById("specificPhoneCorrectionInput");
  const error = document.getElementById("specificPhoneCorrectionError");
  if (input) {
    input.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
  if (error) {
    error.textContent = message || "";
    error.hidden = !message;
  }
}

function closeSpecificPhoneCorrection() {
  const notice = document.getElementById("specificPhoneCorrection");
  if (notice) notice.hidden = true;
  document.body.style.overflow = "auto";
}

async function findEligibleSpecificPhoneCorrectionOrder() {
  const baseUrl = window.FSPORT_SUPABASE_URL || "https://xcigbbcpwfzluqazadez.supabase.co";
  const anonKey = window.FSPORT_SUPABASE_ANON || "";
  const state = readSpecificPhoneCorrectionState();
  const cachedOrderIds = readStoredOrderIds(PURCHASED_ORDERS_KEY).slice().reverse();
  if (state && state.originalOrderId && !cachedOrderIds.includes(state.originalOrderId)) {
    cachedOrderIds.unshift(state.originalOrderId);
  }

  for (const originalOrderId of cachedOrderIds) {
    try {
      const response = await fetch(
        baseUrl + "/rest/v1/rpc/get_specific_checkout_phone_recovery_context",
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            "apikey": anonKey,
            "authorization": "Bearer " + anonKey
          },
          body: JSON.stringify({ p_original_order_id: originalOrderId })
        }
      );
      if (!response.ok) continue;
      const context = await response.json();
      if (context && context.eligible === true) {
        return { originalOrderId, context };
      }
    } catch (error) {
      console.warn("Specific phone correction eligibility check failed:", error);
      return null;
    }
  }
  return null;
}

function formatSpecificCorrectionOldPhone(rawPhone) {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (digits.length === 9) return digits.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
  return rawPhone || "—";
}

function renderSpecificPhoneCorrectionContext(context) {
  const itemsEl = document.getElementById("specificPhoneCorrectionItems");
  const phoneEl = document.getElementById("specificPhoneCorrectionOldPhone");
  const addressEl = document.getElementById("specificPhoneCorrectionAddress");
  if (phoneEl) phoneEl.textContent = formatSpecificCorrectionOldPhone(context.customer_phone);
  if (addressEl) addressEl.textContent = context.customer_address || "Chưa có địa chỉ";
  if (!itemsEl) return;

  itemsEl.replaceChildren();
  const items = Array.isArray(context.items) ? context.items : [];
  items.forEach(function (item) {
    const row = document.createElement("div");
    row.className = "phone-correction-item";

    const media = document.createElement("div");
    if (item.product_image) {
      const image = document.createElement("img");
      image.className = "phone-correction-item-image";
      image.src = item.product_image;
      image.alt = item.product_name || "Sản phẩm đã đặt";
      image.loading = "lazy";
      image.addEventListener("error", function () {
        media.className = "phone-correction-item-image-placeholder";
        media.textContent = "Ảnh sản phẩm";
        media.replaceChildren(document.createTextNode("Ảnh sản phẩm"));
      }, { once: true });
      media.appendChild(image);
    } else {
      media.className = "phone-correction-item-image-placeholder";
      media.textContent = "Ảnh sản phẩm";
    }

    const details = document.createElement("div");
    details.className = "phone-correction-item-details";
    const name = document.createElement("div");
    name.className = "phone-correction-item-name";
    name.textContent = item.product_name || "Sản phẩm đã đặt";
    const meta = document.createElement("div");
    meta.className = "phone-correction-item-meta";
    const classification = [item.color, item.size].filter(Boolean).join(" / ");
    const metaParts = [];
    if (classification) metaParts.push("Phân loại: " + classification);
    metaParts.push("Số lượng: " + Number(item.quantity || 1));
    meta.textContent = metaParts.join(" · ");
    details.append(name, meta);
    row.append(media, details);
    itemsEl.appendChild(row);
  });
}

async function requestSpecificPhoneCorrection(originalOrderId, state, correctedPhone) {
  const baseUrl = window.FSPORT_SUPABASE_URL || "https://xcigbbcpwfzluqazadez.supabase.co";
  const anonKey = window.FSPORT_SUPABASE_ANON || "";
  const response = await fetch(baseUrl + "/rest/v1/rpc/recover_specific_checkout_phone", {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "apikey": anonKey,
      "authorization": "Bearer " + anonKey
    },
    body: JSON.stringify({
      p_original_order_id: originalOrderId,
      p_replacement_order_id: state.replacementOrderId,
      p_replacement_order_code: state.replacementOrderCode,
      p_new_phone: correctedPhone
    })
  });
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text || "null"); } catch (e) {}
  if (!response.ok) {
    const error = new Error(payload && (payload.message || payload.error) || text || "Không thể tạo đơn thay thế.");
    error.status = response.status;
    throw error;
  }
  return payload || {};
}

async function submitSpecificPhoneCorrection() {
  const input = document.getElementById("specificPhoneCorrectionInput");
  const button = document.getElementById("specificPhoneCorrectionSubmit");
  const status = document.getElementById("specificPhoneCorrectionStatus");
  if (!input || !button) return;

  const phoneResult = parseVietnamCheckoutPhone(input.value);
  if (!phoneResult.normalized) {
    setSpecificPhoneCorrectionError(phoneResult.message);
    input.focus();
    return;
  }

  input.value = formatVietnamCheckoutPhone(phoneResult.normalized);
  setSpecificPhoneCorrectionError("");
  if (status) status.hidden = true;
  button.disabled = true;
  button.textContent = "ĐANG TẠO LẠI ĐƠN...";

  let state = readSpecificPhoneCorrectionState();
  if (!state || state.status === "completed") state = {};
  state.status = "pending";
  if (!state.replacementOrderId) state.replacementOrderId = newCheckoutUuid();
  if (!state.replacementOrderCode) state.replacementOrderCode = newCheckoutCode();
  if (!state.createdAt) state.createdAt = Date.now();
  state.correctedPhone = phoneResult.normalized;
  localStorage.setItem(SPECIFIC_PHONE_CORRECTION_KEY, JSON.stringify(state));

  const cachedOrderIds = readStoredOrderIds(PURCHASED_ORDERS_KEY).slice().reverse();
  if (state.originalOrderId && !cachedOrderIds.includes(state.originalOrderId)) {
    cachedOrderIds.unshift(state.originalOrderId);
  }

  if (!cachedOrderIds.length) {
    setSpecificPhoneCorrectionError("Không tìm thấy dữ liệu đơn hàng trên trình duyệt này.");
    button.disabled = false;
    button.textContent = "CẬP NHẬT SỐ ĐIỆN THOẠI";
    return;
  }

  let result = null;
  let lastError = null;
  for (const originalOrderId of cachedOrderIds) {
    try {
      result = await requestSpecificPhoneCorrection(originalOrderId, state, phoneResult.normalized);
      state.originalOrderId = originalOrderId;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!result || !result.replacement_order_id) {
    console.warn("Specific phone correction failed:", lastError);
    setSpecificPhoneCorrectionError("Chưa thể cập nhật đơn hàng. Vui lòng thử lại sau.");
    button.disabled = false;
    button.textContent = "CẬP NHẬT SỐ ĐIỆN THOẠI";
    return;
  }

  state.status = "completed";
  state.completedAt = Date.now();
  state.correctedPhone = result.customer_phone || phoneResult.normalized;
  state.replacementOrderId = result.replacement_order_id;
  state.replacementOrderCode = result.replacement_order_code;
  localStorage.setItem(SPECIFIC_PHONE_CORRECTION_KEY, JSON.stringify(state));

  try {
    const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo") || "{}");
    checkoutInfo.phone = state.correctedPhone;
    localStorage.setItem("checkoutInfo", JSON.stringify(checkoutInfo));
  } catch (e) {}

  const checkoutPhone = document.getElementById("checkoutPhone");
  if (checkoutPhone) checkoutPhone.value = formatVietnamCheckoutPhone(state.correctedPhone);
  input.value = formatVietnamCheckoutPhone(state.correctedPhone);
  markPurchaseTracked(state.replacementOrderId);
  button.textContent = "ĐÃ CẬP NHẬT";
  if (status) {
    status.textContent = "Đã cập nhật số điện thoại và tạo lại đơn hàng. Shop sẽ liên hệ theo số mới.";
    status.hidden = false;
  }
}

async function maybeShowSpecificPhoneCorrection() {
  const notice = document.getElementById("specificPhoneCorrection");
  const input = document.getElementById("specificPhoneCorrectionInput");
  const button = document.getElementById("specificPhoneCorrectionSubmit");
  const close = document.getElementById("specificPhoneCorrectionClose");
  if (!notice || !input || !button || !close || !shouldShowSpecificPhoneCorrection()) return;
  if (notice.dataset.eligibilityChecking === "true" || notice.dataset.eligibilityChecked === "true") return;

  notice.dataset.eligibilityChecking = "true";
  const eligibility = await findEligibleSpecificPhoneCorrectionOrder();
  notice.dataset.eligibilityChecking = "false";
  notice.dataset.eligibilityChecked = "true";
  if (!eligibility || !shouldShowSpecificPhoneCorrection()) return;

  const currentState = readSpecificPhoneCorrectionState() || {};
  currentState.status = "eligible";
  currentState.originalOrderId = eligibility.originalOrderId;
  localStorage.setItem(SPECIFIC_PHONE_CORRECTION_KEY, JSON.stringify(currentState));
  renderSpecificPhoneCorrectionContext(eligibility.context);

  if (!notice.dataset.bound) {
    input.addEventListener("input", function () {
      setSpecificPhoneCorrectionError("");
    });
    input.addEventListener("blur", function () {
      const result = parseVietnamCheckoutPhone(input.value);
      if (result.normalized) input.value = formatVietnamCheckoutPhone(result.normalized);
      setSpecificPhoneCorrectionError(result.message);
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") submitSpecificPhoneCorrection();
    });
    button.addEventListener("click", submitSpecificPhoneCorrection);
    close.addEventListener("click", closeSpecificPhoneCorrection);
    notice.dataset.bound = "true";
  }

  const state = readSpecificPhoneCorrectionState();
  if (state && state.correctedPhone) {
    input.value = formatVietnamCheckoutPhone(state.correctedPhone);
  }
  notice.hidden = false;
  document.body.style.overflow = "hidden";
  window.setTimeout(function () { input.focus(); }, 0);
}

function hydrateCheckoutInfo() {
  try {
    const saved = JSON.parse(localStorage.getItem("checkoutInfo") || "{}");
    const nameEl = document.getElementById("checkoutName");
    const phoneEl = document.getElementById("checkoutPhone");
    const addressEl = document.getElementById("checkoutAddress");
    if (nameEl && typeof saved.name === "string") nameEl.value = saved.name;
    if (phoneEl && typeof saved.phone === "string") {
      const parsedPhone = parseVietnamCheckoutPhone(saved.phone);
      phoneEl.value = parsedPhone.normalized
        ? formatVietnamCheckoutPhone(parsedPhone.normalized)
        : saved.phone;
      if (parsedPhone.normalized && saved.phone !== parsedPhone.normalized) {
        saved.phone = parsedPhone.normalized;
        localStorage.setItem("checkoutInfo", JSON.stringify(saved));
      }
    }
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
        const phoneValue = document.getElementById("checkoutPhone")?.value || "";
        const parsedPhone = parseVietnamCheckoutPhone(phoneValue);
        const newInfo = {
          name: (document.getElementById("checkoutName")?.value || "").trim(),
          phone: parsedPhone.normalized || "",
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
  checkoutQuote = null;
  shippingFee = 0;
  renderCheckoutCart();
  loadShippingFee();
  const consent = document.getElementById("checkoutPolicyConsent");
  const consentError = document.getElementById("checkoutConsentError");
  if (checkoutPolicyConsentRequired && consent) consent.checked = true;
  if (consentError) consentError.hidden = true;
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
  const localSubtotal = window.cart.reduce((sum, item) => sum + cartItemPrice(item) * (item.quantity || 1), 0);
  const totalQty = window.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const localVoucherValue = window.cart.reduce((sum, item) => sum + (item.voucher?.amount || 0) * (item.quantity || 1), 0);
  const subtotal = checkoutQuote ? Number(checkoutQuote.subtotal || 0) : localSubtotal;
  voucherValue = checkoutQuote ? Number(checkoutQuote.voucherValue || 0) : localVoucherValue;
  const shipping = shippingFee;
  const total = checkoutQuote ? Number(checkoutQuote.total || 0) : subtotal + shipping - voucherValue;
  const qtyEl = document.getElementById("itemQuantityText");
  const subtotalEl = document.getElementById("subtotalText");
  if (qtyEl) qtyEl.textContent = `${totalQty} s\u1ea3n ph\u1ea9m`;
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString("vi-VN")}\u0111`;
  const shippingEl = document.getElementById("shippingFeeText");
  if (shippingEl) shippingEl.textContent = `${shippingFee.toLocaleString("vi-VN")}\u0111`;
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
  checkoutQuote = null;
  renderCheckoutCart();
  loadShippingFee();
}
function removeItem(index) {
  window.cart.splice(index, 1);
  saveCart();
  checkoutQuote = null;
  renderCheckoutCart();
  loadShippingFee();
}
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
  updateCartItemCount();
}
// ------------------------
// 🔹 PHÍ VẬN CHUYỂN
// ------------------------
async function loadShippingFee() {
  const requestId = ++checkoutQuoteRequestId;
  if (!window.cart.length) {
    checkoutQuote = null;
    shippingFee = 0;
    updateCheckoutSummary();
    return null;
  }
  const baseUrl = window.FSPORT_SUPABASE_URL || "https://xcigbbcpwfzluqazadez.supabase.co";
  const anonKey = window.FSPORT_SUPABASE_ANON || "";
  try {
    const response = await fetch(baseUrl + "/functions/v1/checkout-quote", {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "apikey": anonKey,
        "authorization": "Bearer " + anonKey
      },
      body: JSON.stringify({
        items: window.cart.map(item => ({
          inventory_product_id: item.inventory_product_id || null,
          product_code: item.product_code || item.id || item.feed_product_code || null,
          unit_price: cartItemPrice(item),
          voucher_amount: Number(item.voucher && item.voucher.amount || 0),
          quantity: Number(item.quantity || 1)
        })),
        promo_discount: Number(window.promoCodeDiscount || 0)
      })
    });
    if (!response.ok) throw new Error("Checkout quote HTTP " + response.status);
    const quote = await response.json();
    if (requestId !== checkoutQuoteRequestId) return null;
    checkoutQuote = quote;
    shippingFee = Math.max(0, Number(quote.shippingFee || 0));
    updateCheckoutSummary();
    return quote;
  } catch (error) {
    if (requestId !== checkoutQuoteRequestId) return null;
    console.warn("Không thể tải báo giá checkout từ backend:", error);
    checkoutQuote = null;
    shippingFee = 0;
    updateCheckoutSummary();
    return null;
  }
}
// ------------------------
// 🔹 GỬI ĐƠN HÀNG
// ------------------------
async function validateManagedCartInventory() {
  const managed = (window.cart || []).filter(item => item && item.inventory_product_id);
  if (!managed.length) return;
  const ids = [...new Set(managed.map(item => String(item.inventory_product_id)))];
  const url = (window.FSPORT_SUPABASE_URL || "https://xcigbbcpwfzluqazadez.supabase.co") +
    "/functions/v1/product-availability?ids=" + encodeURIComponent(ids.join(","));
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Không thể kiểm tra trạng thái sản phẩm. Vui lòng thử lại.");
  const payload = await response.json();
  const rows = payload && Array.isArray(payload.products) ? payload.products : [];
  const byId = Object.fromEntries((rows || []).map(product => [String(product.id), product]));
  for (const item of managed) {
    const product = byId[String(item.inventory_product_id)];
    if (!product || product.is_active === false) throw new Error("Một sản phẩm trong giỏ không còn kinh doanh. Vui lòng xóa sản phẩm đó khỏi giỏ.");
    const stock = Number(product.stock_qty || 0);
    if (stock <= 0) throw new Error((item.product_name || product.product_code) + " đang tạm hết hàng.");
    if (Number(item.quantity || 1) > stock) throw new Error((item.product_name || product.product_code) + " chỉ còn " + stock + " sản phẩm.");
  }
}

async function submitOrder() {
  const btn = document.getElementById("checkoutSubmitBtn");
  if (!btn) return;
  const originalText = btn.textContent;
  const consent = document.getElementById("checkoutPolicyConsent");
  const consentBox = consent && consent.closest(".checkout-consent");
  const consentError = document.getElementById("checkoutConsentError");
  if (checkoutPolicyConsentRequired && (!consent || !consent.checked)) {
    if (consentBox) {
      consentBox.classList.remove("has-error");
      void consentBox.offsetWidth;
      consentBox.classList.add("has-error");
      window.clearTimeout(consentBox._attentionTimer);
      consentBox._attentionTimer = window.setTimeout(function () {
        consentBox.classList.remove("has-error");
      }, 1800);
      consentBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (consentError) consentError.hidden = false;
    if (consent) consent.focus({ preventScroll: true });
    return;
  }
  btn.disabled = true;
  btn.textContent = "\u0110ang g\u1eedi...";
  const name = document.getElementById("checkoutName")?.value.trim();
  const phoneInput = document.getElementById("checkoutPhone");
  const phoneResult = validateAndFormatCheckoutPhone(true);
  const phone = phoneResult.normalized;
  const address = document.getElementById("checkoutAddress")?.value.trim();
  if (!phone) {
    if (phoneInput) phoneInput.focus();
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }
  if (!name || !address) {
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
  try {
    await validateManagedCartInventory();
  } catch (inventoryError) {
    alert(inventoryError && inventoryError.message ? inventoryError.message : "Sản phẩm không còn khả dụng.");
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }
  await loadShippingFee();
  const firstItem = window.cart[0] || {};
  const category = firstItem.category || "unknown";
  const orderData = {
    name,
    phone,
    address,
    policyConsent: checkoutPolicyConsentRequired ? {
      acceptedAt: new Date().toISOString(),
      termsVersion: "2026-09-03",
      privacyVersion: "2026-09-03"
    } : null,
    category,
    items: window.cart.map(item => {
      const baseItem = {
        page_slug: item.page_slug || null,
        id: item.id || null,
        product_code: item.product_code || item.id || item.feed_product_code || null,
        inventory_product_id: item.inventory_product_id || null,
        category: item.category || "unknown",
        product_name: cartItemName(item),
        variant: item["Ph\u00e2n lo\u1ea1i"] || item["Ph\u00c3\u00a2n lo\u00e1\u00ba\u00a1i"] || cartItemName(item),
        product_image_url: cartItemImage(item),
        color: item.color || item["M\u00e0u S\u1eafc"] || null,
        size: item.size || item.Size || null,
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
  // Persist one checkout ID across network retries/reloads. The backend uses
  // this UUID as the idempotency key for both the order and its item rows.
  var checkoutAttempt = getCheckoutAttempt(orderData);
  var _orderId = checkoutAttempt.orderId;
  var _orderCode = checkoutAttempt.orderCode;

  console.log("📦 Sending orderData:", orderData, "orderId:", _orderId, "orderCode:", _orderCode);

  var erpPromise = typeof sendOrderToERP === "function"
    ? sendOrderToERP(orderData, _orderId, _orderCode)
    : Promise.reject(new Error("ERP sender is unavailable"));

  async function trackPurchaseAfterERP(erpResult) {
    var confirmedOrderId = erpResult && erpResult.orderId || _orderId;
    var confirmedOrderCode = erpResult && erpResult.orderCode || _orderCode;
    var confirmedTotal = Number(erpResult && erpResult.total != null ? erpResult.total : orderData.total);
    if (!confirmedOrderId || confirmedTotal <= 0 || hasTrackedPurchase(confirmedOrderId)) return;
    orderData.total = confirmedTotal;

    var identifyPromise = Promise.resolve();
    if (window.fsport && typeof window.fsport.identifyCustomer === 'function') {
      identifyPromise = Promise.resolve(window.fsport.identifyCustomer({
          phone: orderData.phone,
          name: orderData.name,
          customerId: erpResult && erpResult.customerId,
          orderId: confirmedOrderId
        })).catch(function(err) {
        console.warn("Profile customer identify failed; purchase tracking will continue:", err && (err.message || err));
      });
    }
    if (window.fsport && typeof window.fsport.track === "function") {
      var feedPostIds = Array.from(new Set((orderData.items || [])
        .map(function(i) { return i.feed_post_id || null })
        .filter(Boolean)))
      window.fsport.track('purchase', {
        order_id:   confirmedOrderId,
        order_code: confirmedOrderCode,
        customer_phone: orderData.phone,
        customer_name:  orderData.name,
        total:      orderData.total,
        source:     feedPostIds.length ? 'feed' : 'checkout',
        feed_post_ids: feedPostIds,
        products:   (orderData.items || []).map(function(i) {
          return { page_slug: i.page_slug || null, id: i.id, name: i.product_name || i["T\u00ean"] || i.name || '', variant: i.variant || i["Ph\u00e2n lo\u1ea1i"] || '', qty: i.quantity || 1, price: cartItemPrice(i), feed_post_id: i.feed_post_id || null }
        })
      })
    }
    trackGA4PurchaseOnce(orderData, confirmedOrderId);

    if (typeof trackBothPixels === "function") {
      trackBothPixels("Purchase", {
        content_ids: (orderData.items || []).map(function(item) {
          return item.product_code || item.id;
        }).filter(Boolean),
        contents: (orderData.items || []).map(function(item) {
          return {
            id: item.product_code || item.id || "",
            quantity: item.quantity || 1,
            item_price: cartItemPrice(item)
          };
        }),
        content_type: "product",
        value: confirmedTotal,
        currency: "VND"
      }, {
        eventID: confirmedOrderId
      });
    }

    if (typeof window.trackOpenAIPurchase === "function") {
      window.trackOpenAIPurchase();
    }

    markPurchaseTracked(confirmedOrderId);
    await identifyPromise;
  }

  // Purchase chỉ được ghi khi ERP đã tạo đơn; không phụ thuộc Make webhook.
  var purchasePromise = erpPromise.then(trackPurchaseAfterERP).catch(function(error) {
    console.warn("Purchase tracking failed after confirmed ERP order:", error);
  });

  var makePromise = erpPromise.then(function() {
    return fetch("https://hook.eu1.make.com/e4orsidpvfuofls24k4a78msst7qgr2r", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({}, orderData, { orderId: _orderId, orderCode: _orderCode }))
    });
  }).then(res => {
      if (!res.ok) throw new Error("Gửi đơn hàng thất bại");
      return res.text();
    });

  Promise.allSettled([makePromise, erpPromise, purchasePromise])
    .then(results => {
      var makeResult = results[0];
      var erpResult = results[1];
      if (erpResult.status === "rejected") throw erpResult.reason;
      if (makeResult.status === "rejected") {
        console.warn("⚠ Make webhook thất bại nhưng ERP đã tạo đơn:", makeResult.reason);
      }
      var confirmedOrder = erpResult.value || {};
      _orderId = confirmedOrder.orderId || _orderId;
      _orderCode = confirmedOrder.orderCode || _orderCode;
      orderData.total = Number(confirmedOrder.total != null ? confirmedOrder.total : orderData.total);
      orderData.shippingFee = Number(confirmedOrder.shippingFee != null ? confirmedOrder.shippingFee : orderData.shippingFee);
      clearCheckoutAttempt(_orderId);
      window.cart = [];
      saveCart();
      if (consent) consent.checked = false;
      if (consentError) consentError.hidden = true;
      hideCheckoutPopup();
      window.__fsportLastOrderSummary = {
        orderId: _orderId,
        orderCode: _orderCode,
        items: orderData.items,
        total: orderData.total
      };
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
  showThankyouPopup(window.__fsportLastOrderSummary);
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
  applyCheckoutConsentVisibility();
  const btn = document.getElementById("checkoutSubmitBtn");
  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", submitOrder);
    btn.dataset.bound = "true";
  }
  const consent = document.getElementById("checkoutPolicyConsent");
  if (consent && !consent.dataset.bound) {
    consent.addEventListener("change", function () {
      if (!consent.checked) return;
      const box = consent.closest(".checkout-consent");
      const error = document.getElementById("checkoutConsentError");
      if (box) box.classList.remove("has-error");
      if (error) error.hidden = true;
    });
    consent.dataset.bound = "true";
  }
  const phone = document.getElementById("checkoutPhone");
  if (phone && !phone.dataset.phoneValidationBound) {
    phone.addEventListener("input", function () {
      setCheckoutPhoneError("");
    });
    phone.addEventListener("blur", function () {
      validateAndFormatCheckoutPhone(true);
    });
    phone.dataset.phoneValidationBound = "true";
  }
}
// ------------------------
// 🔹 THANK YOU POPUP
// ------------------------
function showThankyouPopup(summary) {
  const el = document.getElementById("thankyouPopup");
  if (!el) return;
  summary = summary || window.__fsportLastOrderSummary || {};
  const code = el.querySelector("#thankyouOrderCode");
  const items = el.querySelector("#thankyouOrderItems");
  const total = el.querySelector("#thankyouOrderTotal");
  if (code) code.textContent = summary.orderCode || summary.orderId || "Đang cập nhật";
  if (items) items.textContent = (summary.items || []).map(function(item) {
    return cartItemName(item) + " × " + (item.quantity || 1);
  }).join(", ") || "Thông tin đơn hàng đã được tiếp nhận";
  if (total) total.textContent = Number(summary.total || 0).toLocaleString("vi-VN") + "đ";
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
    maybeShowSpecificPhoneCorrection();
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

    var rpcItems = (orderData.items || []).map(function(item) {
      return {
        page_slug: item.page_slug || null,
        product_id: item.product_code || item.id || item.feed_product_code || null,
        product_code: item.product_code || item.id || item.feed_product_code || null,
        inventory_product_id: item.inventory_product_id || null,
        product_name: item.product_name || cartItemName(item),
        product_image: cartItemImage(item),
        category: item.category || orderData.category || "",
        color: item.color || null,
        size: item.size || null,
        unit_price: cartItemPrice(item),
        voucher_amount: Number(item.voucher && item.voucher.amount || 0),
        voucher_label: item.voucher && item.voucher.label || null,
        quantity: Number(item.quantity || 1)
      };
    });

    // One database transaction owns the order header and every item. Retrying
    // this RPC with the same orderId is safe and returns the original order.
    var orderRes = await _erpPostWithRetry(_url + "/rest/v1/rpc/create_website_order", _anon, {
      p_order: {
        id: orderId,
        order_code: orderCode,
        customer_name: orderData.name,
        customer_phone: orderData.phone,
        customer_address: orderData.address,
        customer_note: orderData.note || null,
        category: orderData.category || null,
        shipping_fee: orderData.shippingFee || 0,
        voucher_value: orderData.voucherValue || 0,
        promo_discount: orderData.promoDiscount || 0,
        items: rpcItems
      }
    }, "return=representation", 3);
    if (!orderRes.ok) {
      console.error("🔴 ERP: create_website_order thất bại", orderRes.text);
      throw new Error("ERP atomic order failed (" + orderRes.status + "): " + orderRes.text);
    }
    var rpcResult;
    try {
      rpcResult = JSON.parse(orderRes.text || "{}");
    } catch (parseError) {
      throw new Error("ERP returned an invalid order confirmation");
    }
    if (!rpcResult || rpcResult.order_id !== orderId || Number(rpcResult.item_count || 0) !== rpcItems.length) {
      throw new Error("ERP order confirmation does not match the submitted checkout");
    }
    console.log("✅ ERP: đơn và SKU đã được xác nhận", rpcResult.order_code, rpcResult.order_id);

    // 3. Upsert customer (non-critical, không block)
    var customerId = null;
    if (rpcResult.created === true) {
      try {
        customerId = await _erpUpsertCustomer(_url, _anon, {
          phone:       orderData.phone,
          name:        orderData.name,
          address:     orderData.address,
          order_total: Number(rpcResult.total || orderData.total || subtotal),
          order_id:    orderId
        });
      } catch (custErr) {
        console.warn("⚠ ERP customer upsert failed (non-critical):", custErr.message);
      }
    }

    return {
      created: rpcResult.created === true,
      orderId: rpcResult.order_id,
      orderCode: rpcResult.order_code,
      total: Number(rpcResult.total || 0),
      shippingFee: Number(rpcResult.shipping_fee || 0),
      itemCount: Number(rpcResult.item_count || 0),
      customerId: customerId
    };
  } catch (err) {
    console.warn("⚠ ERP sendOrderToERP error:", err.message || err);
    throw err;
  }
}

// Most product pages inject checkoutpopup.html and this script after
// DOMContentLoaded. Run this after the Supabase configuration above exists.
whenCheckoutInputsReady(maybeShowSpecificPhoneCorrection);
