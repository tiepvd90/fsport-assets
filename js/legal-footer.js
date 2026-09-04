(function () {
  "use strict";
  if (window.__fsportLegalFooterLoaded) return;
  window.__fsportLegalFooterLoaded = true;

  var links = [
    ["Thông tin pháp lý", "/thong-tin-phap-ly"],
    ["Quy trình mua hàng", "/quy-trinh-mua-hang"],
    ["Vận chuyển và giao nhận", "/chinh-sach-van-chuyen"],
    ["Đổi trả và hoàn tiền", "/chinh-sach-doi-tra-hoan-tien"],
    ["Chính sách bảo hành", "/chinh-sach-bao-hanh"],
    ["Chính sách bảo mật", "/chinh-sach-bao-mat"],
    ["Điều khoản giao dịch", "/dieu-khoan-giao-dich"]
  ];

  function ensureStyles() {
    if (document.getElementById("fs-legal-footer-style")) return;
    var style = document.createElement("style");
    style.id = "fs-legal-footer-style";
    style.textContent =
      ".fs-legal-footer{margin-top:36px;padding:30px max(16px,calc((100% - 1168px)/2)) calc(96px + env(safe-area-inset-bottom,0px));background:#111827;color:#f9fafb;font:14px/1.65 \"Be Vietnam Pro\",system-ui,sans-serif;box-sizing:border-box}" +
      ".fs-legal-footer__inner{display:grid;grid-template-columns:minmax(260px,1.15fr) minmax(240px,.85fr);gap:28px;max-width:1168px;margin:auto}" +
      ".fs-legal-footer h2{margin:0 0 10px;color:#fff;font-size:17px}.fs-legal-footer p{margin:3px 0}" +
      ".fs-legal-footer a{color:#f9fafb;text-decoration:none}.fs-legal-footer a:hover,.fs-legal-footer a:focus-visible{text-decoration:underline;outline-offset:3px}" +
      ".fs-legal-footer__cookie{padding:0;border:0;background:transparent;color:#f9fafb;font:inherit;text-decoration:underline;cursor:pointer}" +
      ".fs-legal-footer__links{display:grid;gap:7px}.fs-legal-footer__notice{display:none;margin-top:16px}" +
      "@media(max-width:700px){.fs-legal-footer__inner{grid-template-columns:1fr}.fs-legal-footer{padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))}}";
    document.head.appendChild(style);
  }

  function render() {
    ensureStyles();
    document.querySelectorAll(".site-footer[data-fsport-replace],#fs-legal-footer").forEach(function (node) { node.remove(); });
    var footer = document.createElement("footer");
    footer.id = "fs-legal-footer";
    footer.className = "fs-legal-footer";
    footer.innerHTML =
      '<div class="fs-legal-footer__inner"><section><h2>F-SPORT – HỘ KINH DOANH HUYỀN 1191</h2>' +
      '<p>MST: 001191024905</p><p>Chủ hộ: Lê Thị Huyền</p>' +
      '<p>Địa chỉ: Thôn Đông, Xã Vĩnh Thanh, TP. Hà Nội, Việt Nam</p>' +
      '<p>Hotline/Zalo: <a href="tel:0384735980">0384 735 980</a></p>' +
      '<p>Email: <a href="mailto:huyenle221191@gmail.com">huyenle221191@gmail.com</a></p>' +
      '<p><button type="button" class="fs-legal-footer__cookie" data-cookie-settings>Tùy chọn cookie</button></p>' +
      '<div class="fs-legal-footer__notice" data-bct-verification></div></section>' +
      '<nav class="fs-legal-footer__links" aria-label="Chính sách bán hàng">' +
      links.map(function (item) { return '<a href="' + item[1] + '">' + item[0] + '</a>'; }).join("") +
      "</nav></div>";
    document.body.appendChild(footer);
    var cookieButton = footer.querySelector("[data-cookie-settings]");
    if (cookieButton) cookieButton.addEventListener("click", function () {
      if (window.FSPORT_TRACKING_CONSENT) {
        window.FSPORT_TRACKING_CONSENT.open();
        return;
      }
      var script = document.createElement("script");
      script.src = "/js/tracking-consent.js?v=20260904-atc-unblocked-1";
      script.onload = function () { window.FSPORT_TRACKING_CONSENT.open(); };
      document.head.appendChild(script);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
})();
