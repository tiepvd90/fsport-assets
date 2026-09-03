(function () {
  "use strict";
  if (window.FSPORT_TRACKING_CONSENT) return;

  var key = "fsport_tracking_consent_v1";
  var value = "";
  try { value = localStorage.getItem(key) || ""; } catch (_) {}
  if (value === "denied") window["ga-disable-G-RXC205951M"] = true;

  function dispatch(next) {
    window.dispatchEvent(new CustomEvent("fsport:tracking-consent", { detail: { status: next } }));
  }

  function save(next) {
    value = next;
    try { localStorage.setItem(key, next); } catch (_) {}
    window["ga-disable-G-RXC205951M"] = next !== "granted";
    if (next === "denied" && typeof window.fbq === "function") window.fbq("consent", "revoke");
    if (next === "denied" && window.ttq && typeof window.ttq.revokeConsent === "function") window.ttq.revokeConsent();
    var banner = document.getElementById("fsTrackingConsent");
    if (banner) banner.remove();
    dispatch(next);
  }

  function render() {
    if (document.getElementById("fsTrackingConsent") || value) return;
    var banner = document.createElement("section");
    banner.id = "fsTrackingConsent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Lựa chọn cookie và đo lường");
    banner.innerHTML =
      '<div class="fs-consent__body"><strong>Cookie và đo lường</strong>' +
      '<p>F-SPORT sử dụng Meta Pixel để đo lường hiệu quả website và quảng cáo. Bạn có thể chấp nhận hoặc từ chối.</p>' +
      '<a href="/chinh-sach-bao-mat">Xem Chính sách bảo mật</a></div>' +
      '<div class="fs-consent__actions"><button type="button" data-consent="denied">Từ chối</button>' +
      '<button type="button" class="is-primary" data-consent="granted">Chấp nhận</button></div>';
    var style = document.createElement("style");
    style.id = "fsTrackingConsentStyle";
    style.textContent =
      "#fsTrackingConsent{position:fixed;z-index:30000;bottom:16px;left:50%;width:calc(100% - 32px);max-width:900px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0;padding:18px 20px;border:1px solid #d8dde6;border-radius:14px;background:#fff;color:#172033;box-shadow:0 16px 45px rgba(15,23,42,.24);font:14px/1.55 \"Be Vietnam Pro\",system-ui,sans-serif;transform:translateX(-50%)}" +
      ".fs-consent__body strong{font-size:16px}.fs-consent__body p{margin:5px 0}.fs-consent__body a{color:#9f1239;font-weight:700}.fs-consent__actions{display:flex;gap:8px;flex:0 0 auto}.fs-consent__actions button{min-width:0;padding:10px 15px;border:1px solid #aeb5c0;border-radius:8px;background:#fff;font:700 14px \"Be Vietnam Pro\",system-ui,sans-serif;white-space:nowrap;cursor:pointer}.fs-consent__actions .is-primary{border-color:#b91c1c;background:#b91c1c;color:#fff}" +
      "@media(max-width:640px){#fsTrackingConsent{bottom:10px;width:calc(100% - 20px);display:block;padding:16px}.fs-consent__actions{width:100%;margin-top:14px}.fs-consent__actions button{flex:1}}";
    document.head.appendChild(style);
    document.body.appendChild(banner);
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
      render();
    }
  };

  if (!value) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
    else render();
  } else {
    window.setTimeout(function () { dispatch(value); }, 0);
  }
})();
