/* ============================================================
   ✅ base-aff.js — Dùng chung cho toàn bộ trang Affiliate
   ------------------------------------------------------------
   • Load /html/base.html (footer + pixel)
   • Gọi trackBothPixels("ViewContent") tự động
   • Gọi tracking.js (nếu có)
   ============================================================ */

(function () {
  "use strict";

  // --- 1️⃣ Inject tracking script nếu chưa có ---
  const trackingUrl = "https://friendly-kitten-d760ff.netlify.app/js/tracking.js";
  if (!document.querySelector(`script[src="${trackingUrl}"]`)) {
    const script = document.createElement("script");
    script.src = trackingUrl;
    script.async = true;
    document.head.appendChild(script);
  }

  // --- 2️⃣ Tạo placeholder cho base.html nếu chưa có ---
  let basePlaceholder = document.getElementById("base-placeholder");
  if (!basePlaceholder) {
    basePlaceholder = document.createElement("div");
    basePlaceholder.id = "base-placeholder";
    document.body.appendChild(basePlaceholder);
  }

  // --- 3️⃣ Load nội dung base.html (chứa pixel, footer, v.v.) ---
  fetch("/html/base.html")
    .then((r) => r.text())
    .then((html) => {
      basePlaceholder.outerHTML = html;

      // --- 4️⃣ Khi base đã load, gửi event Pixel (ViewContent) ---
      const sendViewContent = () => {
        if (typeof trackBothPixels === "function") {
          trackBothPixels("ViewContent", {
            content_id: window.productPage || "",
            content_name: window.productTitle || document.title,
            content_category: window.productCategory || "",
            value: 0,
            currency: "VND",
          });
        } else {
          // Nếu tracking chưa sẵn, thử lại sau
          setTimeout(sendViewContent, 300);
        }
      };
      sendViewContent();
    })
    .catch((err) => console.warn("⚠️ Lỗi load base.html:", err));
})();
