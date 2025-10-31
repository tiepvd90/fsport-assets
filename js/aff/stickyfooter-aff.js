/* ======================================================
 * 🛒 STICKYFOOTER-AFF — fun-sport.co (FINAL PRODUCTION)
 * Hiển thị icon Home / Mess / Zalo / Call
 * Nút "MUA TRÊN SHOPEE" → gửi log về Make.com → chuyển sang Shopee
 * ====================================================== */

(function () {
  // ===== Webhook Make.com =====
  const WEBHOOK_URL = "https://hook.eu2.make.com/lpksqwgx4jid73t2uewg6md9279h276y";

  // ===== Hàm gửi log click về Make.com =====
  function trackOutboundClickAndRedirect() {
    const payload = {
      productPage: window.productPage || "",
      productCategory: window.productCategory || "",
      destinationURL: window.shopeeLink || "",
      timestamp: new Date().toISOString(),
    };

    console.log("🧭 Gửi dữ liệu click:", payload);

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Webhook POST failed");
        console.log("✅ Đã gửi log click thành công về Make.com");
      })
      .catch((err) => {
        console.warn("⚠️ Lỗi khi gửi log:", err);
      })
      .finally(() => {
        // ✅ Chuyển hướng sang Shopee trong cùng tab
        if (window.shopeeLink) {
          window.location.href = window.shopeeLink;
        } else {
          alert("⚠️ Thiếu window.shopeeLink — không thể mở Shopee!");
        }
      });
  }

  // ===== Helper: chạy khi DOM sẵn sàng =====
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else fn();
  }

  // ===== Khởi tạo Footer =====
  onReady(() => {
    if (document.querySelector(".sticky-footer")) {
      console.log("ℹ️ stickyfooter-aff: footer đã tồn tại");
      return;
    }

    const footer = document.createElement("div");
    footer.className = "sticky-footer";
    footer.innerHTML = `
      <div class="footer-left">
        <a href="https://fun-sport.co" class="footer-icon" id="homeLink">
          <img src="https://img.icons8.com/ios-filled/22/000000/home.png" alt="Home" />
          <span>Home</span>
        </a>
        <a href="https://m.me/funsport1" target="_blank" class="footer-icon">
          <img src="https://img.icons8.com/ios-filled/22/000000/facebook-messenger.png" alt="Mess" />
          <span>Mess</span>
        </a>
        <a href="https://zalo.me/0978585804" target="_blank" class="footer-icon">
          <img src="https://img.icons8.com/ios-filled/22/000000/zalo.png" alt="Zalo" />
          <span>Zalo</span>
        </a>
        <a href="tel:0384735980" class="footer-icon">
          <img src="https://img.icons8.com/ios-filled/22/000000/phone.png" alt="Call" />
          <span>Call</span>
        </a>
      </div>

      <button id="btnShopee" class="footer-btn-shopee">MUA TRÊN SHOPEE</button>
    `;

    document.body.appendChild(footer);

    // ✅ Khi bấm nút Shopee
    const btn = footer.querySelector("#btnShopee");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🔗 Click MUA TRÊN SHOPEE → gửi log + chuyển sang Shopee");
      trackOutboundClickAndRedirect();
    });

    // ✅ Nút Home → không mở tab mới
    const home = footer.querySelector("#homeLink");
    home.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "https://fun-sport.co";
    });

    console.log("✅ stickyfooter-aff (FINAL) loaded");
  });
})();
