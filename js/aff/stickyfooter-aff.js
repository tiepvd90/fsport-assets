/* ======================================================
 * 🧪 STICKYFOOTER-AFF — TEST MODE (fun-sport.co)
 * Gửi dữ liệu click về Make.com để test
 * -> KHÔNG chuyển trang Shopee
 * ====================================================== */

(function () {
  const WEBHOOK_URL = "https://hook.eu2.make.com/lpksqwgx4jid73t2uewg6md9279h276y";

  // ===== Hàm gửi log về Make.com =====
  async function trackOutboundClick() {
    const payload = {
      productPage: window.productPage || "",
      productCategory: window.productCategory || "",
      destinationURL: window.shopeeLink || "",
      timestamp: new Date().toISOString(),
    };

    console.log("🧭 TEST Sending payload to webhook:", payload);

    let sent = false;

    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      sent = navigator.sendBeacon(WEBHOOK_URL, blob);
      if (sent) {
        console.log("✅ Outbound click: beacon sent to Make");
        alert("✅ Gửi dữ liệu thành công (sendBeacon)!");
        return;
      }
    } catch (err) {
      sent = false;
    }

    // ✅ fallback fetch nếu beacon không hoạt động
    if (!sent) {
      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
        console.log("✅ Outbound click: fetch sent to Make");
        alert("✅ Gửi dữ liệu thành công (fetch)!");
      } catch (e) {
        console.warn("⚠️ Outbound click error:", e);
        alert("⚠️ Lỗi gửi dữ liệu, xem Console để kiểm tra!");
      }
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

    // ✅ Nút TEST WEBHOOK — chỉ gửi log, không redirect
    const btn = footer.querySelector("#btnShopee");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🔗 TEST click: gửi dữ liệu về webhook Make");
      trackOutboundClick();
    });

    // ✅ Nút Home — không mở tab mới
    const home = footer.querySelector("#homeLink");
    home.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "https://fun-sport.co";
    });

    console.log("✅ stickyfooter-aff (TEST MODE) loaded");
  });
})();
