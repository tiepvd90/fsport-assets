/* ======================================================
 * 🧪 STICKYFOOTER-AFF — TEST FULL (fun-sport.co)
 * Mục tiêu: test webhook Make.com (chỉ gửi dữ liệu, không chuyển Shopee)
 * ====================================================== */

(function () {
  // ===== Webhook Make.com (mới) =====
  const WEBHOOK_URL = "https://hook.eu2.make.com/lpksqwgx4jid73t2uewg6md9279h276y";

  // ===== Hàm gửi log về Make.com =====
  function trackOutboundClick() {
    const payload = {
      productPage: window.productPage || "",
      productCategory: window.productCategory || "",
      destinationURL: window.shopeeLink || "",
      timestamp: new Date().toISOString(),
    };

    console.log("🧭 Gửi dữ liệu test tới webhook:", payload);

    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const ok = navigator.sendBeacon(WEBHOOK_URL, blob);
      if (ok) {
        console.log("✅ Gửi thành công bằng sendBeacon");
        alert("✅ Đã gửi dữ liệu test về Make (sendBeacon)");
      } else {
        console.warn("⚠️ sendBeacon trả về false (trình duyệt không hỗ trợ?)");
        alert("⚠️ Không gửi được dữ liệu (sendBeacon)");
      }
    } catch (err) {
      console.error("❌ Lỗi khi gửi beacon:", err);
      alert("❌ Lỗi khi gửi dữ liệu! Xem console để kiểm tra chi tiết.");
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
    if (document.querySelector(".sticky-footer")) {
      console.log("ℹ️ stickyfooter-aff: footer đã tồn tại");
      return;
    }

    // ✅ Tạo footer HTML
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

      <button id="btnShopee" class="footer-btn-shopee">TEST WEBHOOK</button>
    `;

    document.body.appendChild(footer);

    // ✅ Khi bấm TEST WEBHOOK → gửi dữ liệu đến Make
    const btn = footer.querySelector("#btnShopee");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🔗 [TEST] Click nút TEST WEBHOOK");
      trackOutboundClick();
    });

    // ✅ Nút Home → không mở tab mới
    const home = footer.querySelector("#homeLink");
    home.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "https://fun-sport.co";
    });

    console.log("✅ stickyfooter-aff (TEST FULL) loaded");
  });
})();
