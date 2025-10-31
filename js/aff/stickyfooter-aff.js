/* ======================================================
 * 🧪 STICKYFOOTER-AFF — TEST kiểu checkoutpopup
 * Gửi log click về Make.com bằng fetch (POST JSON)
 * ====================================================== */

(function () {
  const WEBHOOK_URL = "https://hook.eu2.make.com/lpksqwgx4jid73t2uewg6md9279h276y";

  function trackOutboundClick() {
    const payload = {
      productPage: window.productPage || "",
      productCategory: window.productCategory || "",
      destinationURL: window.shopeeLink || "",
      timestamp: new Date().toISOString(),
    };

    console.log("🧭 Sending payload:", payload);

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Webhook POST failed");
        console.log("✅ Webhook sent successfully");
        alert("✅ Gửi thành công tới Make!");
      })
      .catch((err) => {
        console.error("❌ Gửi thất bại:", err);
        alert("⚠️ Lỗi gửi dữ liệu, xem console để kiểm tra.");
      });
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else fn();
  }

  onReady(() => {
    if (document.querySelector(".sticky-footer")) return;

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

    const btn = footer.querySelector("#btnShopee");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🔗 Click TEST WEBHOOK → gửi dữ liệu");
      trackOutboundClick();
    });

    const home = footer.querySelector("#homeLink");
    home.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "https://fun-sport.co";
    });

    console.log("✅ stickyfooter-aff (TEST kiểu checkoutpopup) loaded");
  });
})();
