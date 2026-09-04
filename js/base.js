// ✅ Fix iOS zoom khi focus input
document.querySelectorAll("input, select, textarea").forEach((el) => {
  el.addEventListener("touchstart", () => {
    document.documentElement.style.fontSize = "16px";
  });
});

// ✅ Scroll to top khi mở popup (tuỳ lúc gọi thêm)
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ✅ Hiện/ẩn popup form (giỏ hàng)
function toggleForm(show = true) {
  const form = document.getElementById("slideForm");
  if (!form) return;

  if (show) {
    form.classList.remove("hidden");
    form.style.bottom = "0"; // ✅ Trượt lên
    scrollToTop();
  } else {
    form.style.bottom = "-100%"; // ✅ Trượt xuống
    setTimeout(() => form.classList.add("hidden"), 400); // Delay để ẩn sau animation
  }
}

// ✅ Gắn sự kiện đóng popup cho nút có class "close-popup"
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".close-popup").forEach((btn) => {
    btn.addEventListener("click", () => toggleForm(false));
  });
});

// ✅ Theo dõi popup để ẩn mascot nếu đang hiển thị popup
const observer = new MutationObserver(() => {
  const popup = document.getElementById("slideForm");
  const mascot = document.getElementById("mascot-container");
  if (popup && mascot) {
    const isVisible = !popup.classList.contains("hidden");
    mascot.style.display = isVisible ? "none" : "block";
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// ✅ Format tiền VND
function formatPrice(vnd) {
  return vnd.toLocaleString("vi-VN") + "đ";
}

// ✅ Chặn pinch zoom và double tap zoom trên mobile
document.addEventListener('touchstart', function (event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);
// ✅ Tự động đóng popup khi người dùng ấn nút Back
window.onpopstate = function () {
  // Đóng các popup nếu đang mở
  document.getElementById("cartPopup")?.classList.add("hidden");
  document.getElementById("checkoutPopup")?.classList.add("hidden");
  document.getElementById("voucherPopup")?.classList.add("hidden");
  document.getElementById("productVideoPopup")?.classList.remove("show");
  document.getElementById("slideForm")?.classList.add("hidden"); // nếu đang dùng popup trượt
};

// Fake purchase/cart notifications are intentionally disabled.
window.disableFakeNotify = true;
document.getElementById("fakeNotification")?.remove();

// ✅ KEEP TAB ALIVE – tránh Safari unload tab gây about:blank (tuỳ chọn)
setInterval(() => {
  fetch('/favicon.ico', { cache: "no-store" }).catch(() => {});
}, 5 * 60 * 1000);
/* ===========================
   ✅ COLLECTION ICON LOADER
   =========================== */
(function loadCollectionIcon() {
  if (window.__collectionIconInjected) return;
  window.__collectionIconInjected = true;

  const s = document.createElement('script');
  s.src = '/js/collectionIcon.js?v=2';
  s.defer = true;
  s.onerror = (e) => console.warn('Không load được collectionIcon.js', e);
  document.head.appendChild(s);
})();

// ✅ FSPORT ANALYTICS — load sau khi credentials sẵn sàng
;(function loadAnalytics() {
  if (window.__analyticsInjected) return
  window.__analyticsInjected = true

  function inject() {
    var s = document.createElement('script')
    s.src = '/js/analytics.js?v=20260904-always-on-1'
    s.async = true
    s.onerror = function() { console.warn('[Analytics] Không load được /js/analytics.js') }
    document.head.appendChild(s)
  }

  // Đợi FSPORT_SUPABASE_URL (cùng pattern với AI chat)
  var _att = 0
  function wait() {
    if (window.FSPORT_SUPABASE_URL) { inject() }
    else if (_att < 30) { _att++; setTimeout(wait, 200) }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wait)
  else wait()
})()

// Hiển thị lựa chọn trước khi các công cụ đo lường không thiết yếu được kích hoạt.
;(function loadTrackingConsent() {
  if (window.FSPORT_TRACKING_CONSENT || document.querySelector('script[data-fsport-tracking-consent]')) return
  var script = document.createElement('script')
  script.src = '/js/tracking-consent.js?v=20260904-admin-message-1'
  script.dataset.fsportTrackingConsent = 'true'
  document.head.appendChild(script)
})()

// ✅ Gọi supportchat nếu có
//const sc = document.createElement("script");
//sc.src = "/js/supportchat.js";
//document.body.appendChild(sc);
// ============================================

// ================================================================
// AI TƯ VẤN — Auto inject (không cần động vào từng trang product)
// ================================================================
;(function () {
  var slug = window.location.pathname.replace(/^.*\//, '') // 'panther.html'
  // Nếu không có slug .html, vẫn tiếp tục nếu #aic-container đã được đặt sẵn trong HTML
  var hasPrePlaced = !!document.getElementById('aic-container')
  if ((!slug || slug.indexOf('.html') < 0) && !hasPrePlaced) return
  if (!slug) slug = 'index.html' // trường hợp truy cập qua /

  function injectWidget () {
    var existing = document.getElementById('aic-container')

    if (!existing) {
      // Tìm điểm chèn: SAU .product-hero chứa productdescription-placeholder
      var descEl = document.querySelector('[data-src*="productdescription"]')
      if (!descEl) return
      var descWrapper = descEl.closest('.product-hero') || descEl.parentElement

      var container = document.createElement('div')
      container.id = 'aic-container'
      container.style.margin = '16px 0'
      // Chèn SAU descWrapper (không phải trước)
      descWrapper.parentNode.insertBefore(container, descWrapper.nextSibling)
    }

    // Gọi init — dù tự tạo hay đã có sẵn trong HTML
    if (window.AiChat) {
      window.AiChat.init({ slug: slug, productGroup: '' })
    }
  }

  function loadAiChat () {
    if (window.AiChat) { injectWidget(); return }
    var s = document.createElement('script')
    s.src = '/js/ai-chat.js?v=20260806-active-products-only-1'
    s.onload = function () { injectWidget() }
    s.onerror = function () { console.warn('[AiChat] Không load được /js/ai-chat.js') }
    document.head.appendChild(s)
  }

  // Poll chờ FSPORT_SUPABASE_URL được set bởi checkoutpopup.js (tối đa 6s)
  var _attempts = 0
  function waitForCredentials () {
    if (window.FSPORT_SUPABASE_URL) {
      var ready = window.FSPORT_FRONTEND_PAGE_CONFIG_PROMISE || window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || Promise.resolve(null)
      ready.catch(function () { return null }).then(function (config) {
        if (config && config.schema === 'fsport-frontend-page-v1') {
          if (config.settings && config.settings.aiChat && config.settings.aiChat.enabled === false) return
          loadAiChat()
          return
        }
        var page = window.FSPORT_PRODUCT_PAGE
        var section = page && page.getSection ? page.getSection('ai_chat') : null
        if (config && (!section || section.active === false)) return
        loadAiChat()
      })
    } else if (_attempts < 30) {
      _attempts++
      setTimeout(waitForCredentials, 200)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForCredentials)
  } else {
    waitForCredentials()
  }
})()

// Thông tin giao dịch dùng chung trên các trang sản phẩm.
;(function applyCommercePolicyLinks() {
  function apply() {
    document.querySelectorAll('.shipping-info').forEach(function (box) {
      var lines = box.querySelectorAll('.shipping-line')
      if (lines[0]) lines[0].innerHTML = '<span class="icon">🚚</span>Giao toàn quốc từ Hà Nội: miền Bắc 1–2 ngày, miền Trung 2–3 ngày, miền Nam 3–4 ngày.'
      if (lines[1]) lines[1].innerHTML = '<span class="icon">🔍</span>Được kiểm tra, thử sản phẩm theo điều kiện công bố và thanh toán COD.'
      if (!box.querySelector('.fs-policy-inline-links')) {
        var links = document.createElement('p')
        links.className = 'fs-policy-inline-links'
        links.innerHTML = '<a href="/chinh-sach-van-chuyen">Vận chuyển</a> · <a href="/chinh-sach-doi-tra-hoan-tien">Đổi trả</a> · <a href="/chinh-sach-bao-hanh">Bảo hành</a>'
        box.appendChild(links)
      }
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply)
  else apply()
})()

// Một footer pháp lý dùng chung; sticky navigation hiện tại vẫn được giữ nguyên.
;(function loadLegalFooter() {
  if (document.querySelector('script[data-fsport-legal-footer]')) return
  var script = document.createElement('script')
  script.src = '/js/legal-footer.js?v=20260903-1'
  script.defer = true
  script.dataset.fsportLegalFooter = 'true'
  document.head.appendChild(script)
})()
