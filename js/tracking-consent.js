(function () {
  "use strict";
  if (window.FSPORT_TRACKING_CONSENT) return;

  var key = "fsport_tracking_consent_v1";
  var noticeSeenKey = "fsport_tracking_notice_seen_v1";
  var settingsUrl = "https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/website-settings";
  var defaultMessage = "F-SPORT sử dụng cookie và công cụ đo lường để ghi nhớ trải nghiệm mua sắm, hiểu cách website được sử dụng và cải thiện nội dung, quảng cáo phù hợp hơn.";
  var value = "";
  var noticeSeen = false;
  var knownProfileAtEntry = false;
  try {
    value = localStorage.getItem(key) || "";
    noticeSeen = localStorage.getItem(noticeSeenKey) === "1";
    knownProfileAtEntry = Boolean(
      localStorage.getItem("fsport_profile_token") ||
      localStorage.getItem("fsport_profile_id") ||
      localStorage.getItem("fsport_uid")
    );
  } catch (_) {}

  function dispatch(next) {
    window.dispatchEvent(new CustomEvent("fsport:tracking-consent", { detail: { status: next } }));
  }

  function save(next) {
    value = next;
    try { localStorage.setItem(key, next); } catch (_) {}
    var banner = document.getElementById("fsTrackingConsent");
    if (banner) banner.remove();
    dispatch(next);
  }

  function closePreferences() {
    var modal = document.getElementById("fsCookiePreferences");
    if (modal) modal.remove();
  }

  function openPreferences() {
    if (document.getElementById("fsCookiePreferences")) return;
    var modal = document.createElement("div");
    modal.id = "fsCookiePreferences";
    modal.innerHTML =
      '<section class="fs-cookie-modal" role="dialog" aria-modal="true" aria-labelledby="fsCookiePreferencesTitle">' +
        '<div class="fs-cookie-modal__accent"></div>' +
        '<div class="fs-cookie-modal__head">' +
          '<div><span class="fs-cookie-modal__brand">F-SPORT</span><h2 id="fsCookiePreferencesTitle">Tùy chọn cookie</h2></div>' +
          '<button type="button" class="fs-cookie-modal__close" data-cookie-close aria-label="Đóng">×</button>' +
        '</div>' +
        '<p class="fs-cookie-modal__intro">Chọn cách bạn muốn sử dụng cookie khi trải nghiệm website.</p>' +
        '<div class="fs-cookie-options">' +
          '<label class="fs-cookie-option"><span><strong>Cần thiết</strong><small>Giỏ hàng và các chức năng cơ bản của website</small></span><input type="checkbox" checked disabled><i aria-hidden="true"></i></label>' +
          '<label class="fs-cookie-option"><span><strong>Đo lường</strong><small>Giúp F-SPORT hiểu lượt xem và hiệu quả website</small></span><input type="checkbox" checked><i aria-hidden="true"></i></label>' +
          '<label class="fs-cookie-option"><span><strong>Trải nghiệm</strong><small>Ghi nhớ lựa chọn để việc mua sắm thuận tiện hơn</small></span><input type="checkbox" checked><i aria-hidden="true"></i></label>' +
          '<label class="fs-cookie-option"><span><strong>Marketing</strong><small>Đo lường và tối ưu nội dung quảng cáo phù hợp</small></span><input type="checkbox" checked><i aria-hidden="true"></i></label>' +
        '</div>' +
        '<div class="fs-cookie-modal__actions">' +
          '<button type="button" data-cookie-save>Lưu tùy chọn</button>' +
          '<button type="button" data-cookie-essential>Chỉ cần thiết</button>' +
          '<button type="button" class="is-primary" data-cookie-all>Cho phép tất cả</button>' +
        '</div>' +
      '</section>';
    document.body.appendChild(modal);
    modal.querySelector("[data-cookie-close]").addEventListener("click", closePreferences);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closePreferences();
    });
    modal.querySelector("[data-cookie-save]").addEventListener("click", function () {
      closePreferences();
      save("customized");
    });
    modal.querySelector("[data-cookie-essential]").addEventListener("click", function () {
      modal.querySelectorAll('input:not(:disabled)').forEach(function (input) { input.checked = false; });
      closePreferences();
      save("denied");
    });
    modal.querySelector("[data-cookie-all]").addEventListener("click", function () {
      modal.querySelectorAll("input").forEach(function (input) { input.checked = true; });
      closePreferences();
      save("granted");
    });
    modal.querySelector(".fs-cookie-modal__close").focus();
  }

  function loadBannerSetting(callback) {
    if (typeof fetch !== "function") { callback({ enabled: true, message: defaultMessage }); return; }
    fetch(settingsUrl, { method: "GET", cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (settings) {
        callback({
          enabled: settings.trackingConsentBannerEnabled !== false,
          message: String(settings.trackingConsentBannerMessage || "").trim() || defaultMessage
        });
      })
      .catch(function () { callback({ enabled: true, message: defaultMessage }); });
  }

  function afterBasicPageReady(callback) {
    function schedule() {
      window.setTimeout(callback, 3000);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", schedule, { once: true });
    } else schedule();
  }

  function renderWhenEnabled(options) {
    options = options || {};
    loadBannerSetting(function (config) {
      if (!config.enabled) {
        var existing = document.getElementById("fsTrackingConsent");
        if (existing) existing.remove();
        return;
      }
      if (options.immediate) {
        render(config.message, options.force);
        return;
      }
      afterBasicPageReady(function () { render(config.message, options.force); });
    });
  }

  function render(message, force) {
    if (document.getElementById("fsTrackingConsent") || (value && !force)) return;
    var banner = document.createElement("section");
    banner.id = "fsTrackingConsent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Lựa chọn cookie và đo lường");
    banner.innerHTML =
      '<div class="fs-consent__body"><strong>Cookie và đo lường</strong>' +
      '<p data-consent-message></p>' +
      '<a href="/chinh-sach-bao-mat">Xem Chính sách bảo mật</a></div>' +
      '<div class="fs-consent__actions"><button type="button" data-consent-customize>Tùy chỉnh</button>' +
      '<button type="button" class="is-primary" data-consent="granted">Chấp nhận</button></div>';
    var style = document.createElement("style");
    style.id = "fsTrackingConsentStyle";
    style.textContent =
      "#fsTrackingConsent{position:fixed;z-index:30000;top:50%;left:50%;width:calc(100% - 32px);max-width:900px;max-height:calc(100dvh - 32px);overflow:auto;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0;padding:18px 20px;border:1px solid #d8dde6;border-radius:14px;background:#fff;color:#172033;box-shadow:0 16px 45px rgba(15,23,42,.24);font:14px/1.55 \"Be Vietnam Pro\",system-ui,sans-serif;transform:translate(-50%,-50%)}" +
      ".fs-consent__body strong{font-size:16px}.fs-consent__body p{margin:5px 0}.fs-consent__body a{color:#9f1239;font-weight:700}.fs-consent__actions{display:flex;gap:8px;flex:0 0 auto}.fs-consent__actions button{min-width:0;padding:10px 15px;border:1px solid #aeb5c0;border-radius:8px;background:#fff;font:700 14px \"Be Vietnam Pro\",system-ui,sans-serif;white-space:nowrap;cursor:pointer}.fs-consent__actions .is-primary{border-color:#b91c1c;background:#b91c1c;color:#fff}" +
      "#fsCookiePreferences{position:fixed;z-index:31000;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(8,10,14,.76);backdrop-filter:blur(5px);font-family:\"Be Vietnam Pro\",system-ui,sans-serif}.fs-cookie-modal{position:relative;width:min(100%,520px);max-height:calc(100vh - 36px);overflow:auto;box-sizing:border-box;padding:0 24px 22px;border:1px solid rgba(255,255,255,.18);border-radius:18px;background:#fff;color:#16181d;box-shadow:0 24px 70px rgba(0,0,0,.42)}.fs-cookie-modal__accent{height:5px;margin:0 -24px 22px;background:linear-gradient(90deg,#050505 0 66%,#b91c1c 66%)}.fs-cookie-modal__head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.fs-cookie-modal__brand{display:inline-block;margin-bottom:5px;color:#b91c1c;font-size:11px;font-weight:900;letter-spacing:.16em}.fs-cookie-modal h2{margin:0;font-size:23px;line-height:1.25}.fs-cookie-modal__close{width:34px;height:34px;border:1px solid #dde1e7;border-radius:50%;background:#f7f7f8;color:#222;font-size:23px;line-height:1;cursor:pointer}.fs-cookie-modal__intro{margin:9px 0 18px;color:#626875;font-size:13px;line-height:1.55}.fs-cookie-options{display:grid;gap:9px}.fs-cookie-option{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 14px;border:1px solid #e0e3e8;border-radius:11px;background:#fafafa;cursor:pointer}.fs-cookie-option span{display:grid;gap:3px}.fs-cookie-option strong{font-size:14px}.fs-cookie-option small{color:#6b7280;font-size:11px;line-height:1.4}.fs-cookie-option input{position:absolute;opacity:0;pointer-events:none}.fs-cookie-option i{position:relative;width:38px;height:22px;flex:0 0 auto;border-radius:99px;background:#c7cbd2;transition:.18s}.fs-cookie-option i:after{content:\"\";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:.18s}.fs-cookie-option input:checked+i{background:#111}.fs-cookie-option input:checked+i:after{transform:translateX(16px);background:#fff}.fs-cookie-option input:disabled+i{background:#b91c1c;opacity:.82}.fs-cookie-modal__actions{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:8px;margin-top:20px;padding-top:18px;border-top:1px solid #e1e4e8}.fs-cookie-modal__actions button{padding:11px 9px;border:1px solid #cfd4dc;border-radius:8px;background:#fff;color:#20242c;font:700 12px \"Be Vietnam Pro\",system-ui,sans-serif;cursor:pointer}.fs-cookie-modal__actions .is-primary{border-color:#b91c1c;background:#b91c1c;color:#fff}" +
      "@media(max-width:640px){#fsTrackingConsent{width:calc(100% - 20px);display:block;padding:16px}.fs-consent__actions{width:100%;margin-top:14px}.fs-consent__actions button{flex:1}.fs-cookie-modal{padding:0 16px 16px;border-radius:15px}.fs-cookie-modal__accent{margin:0 -16px 18px}.fs-cookie-modal h2{font-size:20px}.fs-cookie-modal__actions{grid-template-columns:1fr 1fr}.fs-cookie-modal__actions .is-primary{grid-column:1/-1}.fs-cookie-option{padding:11px 12px}}";
    document.head.appendChild(style);
    document.body.appendChild(banner);
    noticeSeen = true;
    try { localStorage.setItem(noticeSeenKey, "1"); } catch (_) {}
    banner.querySelector("[data-consent-message]").textContent = message || defaultMessage;
    banner.querySelector("[data-consent-customize]").addEventListener("click", openPreferences);
    banner.querySelectorAll("[data-consent]").forEach(function (button) {
      button.addEventListener("click", function () { save(button.dataset.consent); });
    });
  }

  window.FSPORT_TRACKING_CONSENT = {
    status: function () { return value; },
    isGranted: function () { return value === "granted"; },
    open: function () {
      value = "";
      try { localStorage.removeItem(key); } catch (_) {}
      renderWhenEnabled({ immediate: true, force: true });
    }
  };

  if (!value && !noticeSeen && !knownProfileAtEntry) {
    renderWhenEnabled();
  } else if (value) {
    window.setTimeout(function () { dispatch(value); }, 0);
  }
})();
