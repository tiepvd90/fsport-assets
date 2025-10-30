/* =====================================================
 * 🧩 setup-aff.js — Dùng chung cho toàn bộ trang Affiliate (fix stable)
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

  // ===== Helper: inject file HTML =====
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
    console.log("🧩 setup-aff.js đang khởi tạo...");

    // 1️⃣ Load CSS nền sớm để tránh icon nhảy
    if (!document.querySelector('link[href*="/css/base.css"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/css/base.css";
      document.head.appendChild(css);
    }

    // 2️⃣ Inject popup + base.html
    await injectHTML("/html/cartpopup.html", "cartPopup-placeholder");
    await injectHTML("/html/checkoutpopup.html", "checkoutPopup-placeholder");

    // Inject base.html để có icon giỏ hàng
    try {
      const res = await fetch("/html/base.html");
      const html = await res.text();
      const basePlaceholder = document.getElementById("base-placeholder");
      if (basePlaceholder) basePlaceholder.outerHTML = html;
    } catch (e) {
      console.warn("⚠️ Lỗi khi inject base.html:", e);
    }

    // 3️⃣ Load các JS nền
    await loadScript("https://friendly-kitten-d760ff.netlify.app/js/checkoutpopup.js");
    await loadScript("/js/base.js");

    // 4️⃣ Đợi CSS ổn định, rồi mới load sticky footer
    setTimeout(async () => {
      await loadScript("/js/aff/stickyfooter-aff.js");
      console.log("✅ Sticky footer đã khởi tạo");
    }, 300);

    // 5️⃣ Tracking (Meta + TikTok)
    setTimeout(async () => {
      await loadScript("https://friendly-kitten-d760ff.netlify.app/js/tracking.js");
      if (typeof trackBothPixels === "function") {
        trackBothPixels("ViewContent", {
          content_id: window.productPage || "unknown",
          content_name: window.productPage || "unknown",
          content_category: window.productCategory || "affiliate",
          value: 0,
          currency: "VND",
        });
        console.log("📈 Gửi event ViewContent");
      }
    }, 800);
  }

  // 🚀 Tự động chạy khi DOM sẵn sàng
  document.addEventListener("DOMContentLoaded", setupAffiliatePage);
})();
