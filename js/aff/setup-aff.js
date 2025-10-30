/* =====================================================
 * 🧩 setup-aff.js — Dùng chung cho toàn bộ trang Affiliate
 * ===================================================== */

(function () {
  // ===== Helper: tải JS động =====
  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve(); // tránh load trùng
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  // ===== Helper: inject file HTML vào placeholder =====
  async function injectHTML(file, placeholderId) {
    try {
      const res = await fetch(file);
      const html = await res.text();
      const container = document.getElementById(placeholderId);
      if (!container) return;
      const temp = document.createElement("div");
      temp.innerHTML = html;

      Array.from(temp.children).forEach(el => {
        if (el.tagName === "SCRIPT") {
          const script = document.createElement("script");
          if (el.src) script.src = el.src;
          else script.textContent = el.textContent;
          document.body.appendChild(script);
        } else {
          container.appendChild(el);
        }
      });
    } catch (err) {
      console.warn("⚠️ Lỗi injectHTML:", file, err);
    }
  }

  // ===== Hàm chính =====
  async function setupAffiliatePage() {
    // 🧱 Inject popup & icon
    await injectHTML("/html/cartpopup.html", "cartPopup-placeholder");
    await injectHTML("/html/checkoutpopup.html", "checkoutPopup-placeholder");

    // 🧠 Load các JS cần thiết
    await loadScript("https://friendly-kitten-d760ff.netlify.app/js/checkoutpopup.js");
    await loadScript("/js/aff/stickyfooter-aff.js");
    await loadScript("/js/base.js");

    // 🧭 Tracking (Meta + TikTok)
    await loadScript("https://friendly-kitten-d760ff.netlify.app/js/tracking.js");

    // 🧩 Inject base.html để có icon giỏ hàng
    try {
      const res = await fetch("/html/base.html");
      const html = await res.text();
      const basePlaceholder = document.getElementById("base-placeholder");
      if (basePlaceholder) basePlaceholder.outerHTML = html;
    } catch (e) {
      console.warn("⚠️ Lỗi khi inject base.html:", e);
    }

    // 🎯 Gửi sự kiện ViewContent nếu tracking có sẵn
    setTimeout(() => {
      if (typeof trackBothPixels === "function") {
        trackBothPixels("ViewContent", {
          content_id: window.productPage || "unknown",
          content_name: window.productPage || "unknown",
          content_category: window.productCategory || "affiliate",
          value: 0,
          currency: "VND",
        });
      }
    }, 800);
  }

  // 🚀 Chạy tự động khi DOM sẵn sàng
  document.addEventListener("DOMContentLoaded", setupAffiliatePage);
})();
