/* ======================================================
 * 🛒 STICKYFOOTER-AFF — fun-sport.co
 * Gồm:
 *  - Hiển thị icon Home / Mess / Zalo / Call
 *  - Nút MUA TRÊN SHOPEE (chuyển thẳng)
 *  - Gửi log click về Make.com webhook
 * ====================================================== */

(function () {
  const WEBHOOK_URL = "https://hook.eu2.make.com/47xaye20idohgs8qts584amkh6yjacmn";

  // ===== Hàm gửi log về Make.com =====
  function trackOutboundClick() {
    const payload = {
      productPage: window.productPage || "",
      productCategory: window.productCategory || "",
      destinationURL: window.shopeeLink || "",
      timestamp: new Date().toISOString(),
    };

    // ✅ Gửi log bằng sendBeacon hoặc fetch
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      if (!navigator.sendBeacon(WEBHOOK_URL, blob)) throw new Error("Beacon failed");
      console.log("✅ Outbound click: beacon sent");
    } catch (err) {
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => console.log("✅ Outbound click: fetch sent"))
        .catch((e) => console.warn("⚠️ Outbound click error:", e));
    }

    // ✅ Chuyển hướng thẳng sang Shopee (không mở tab mới)
    if (window.shopeeLink) {
      window.location.href = window.shopeeLink;
    } else {
      console.warn("⚠️ Không tìm thấy window.shopeeLink");
    }
  }

  // ===== Helper khi DOM sẵn sàng =====
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else fn();
  }

  // ===== Khởi tạo Footer =====
  onReady(() => {
    const link = window.shopeeLink || "";
    if (!link) {
      console.warn("⚠️ stickyfooter-aff: thiếu window.shopeeLink");
      return;
    }

    // Nếu đã có footer thì bỏ qua
    if (document.querySelector(".sticky-footer")) {
      console.log("ℹ️ stickyfooter-aff: footer đã tồn tại");
      return;
    }

    // ✅ Tạo footer HTML
    const footer = document.createElement("div");
    footer.className = "sticky-footer";
    footer.innerHTML = `
      <div class="footer-left">
        <a href="https://fun-sport.co" target="_blank" class="footer-icon">
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

    // ✅ Gắn event click
    const btn = footer.querySelector("#btnShopee");
    btn.addEventListener("click", () => {
      console.log("🔗 Gửi log outbound + chuyển đến Shopee");
      trackOutboundClick();
    });

    console.log("✅ stickyfooter-aff loaded");
  });
})();
