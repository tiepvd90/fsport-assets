/* ======================================================
 * 🛒 STICKYFOOTER-AFF — Dành cho trang Affiliate
 * Tự render footer Shopee (không tự gọi CSS)
 * ====================================================== */
(function () {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else fn();
  }

  onReady(() => {
    // ---- Kiểm tra biến Shopee link ----
    const link = window.shopeeLink || "";
    if (!link) {
      console.warn("⚠️ stickyfooter-aff: thiếu window.shopeeLink");
      return;
    }

    // ---- Kiểm tra xem đã có sticky chưa ----
    if (document.querySelector(".sticky-footer")) {
      console.warn("ℹ️ stickyfooter-aff: đã tồn tại sticky-footer, bỏ qua render lại.");
      return;
    }

    // ---- Tạo phần HTML sticky footer ----
    const footer = document.createElement("div");
    footer.className = "sticky-footer";
    footer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div style="display: flex; gap: 20px;">
          <a href="https://fun-sport.co" class="footer-icon" style="text-decoration: none;">
            <img src="https://img.icons8.com/ios-filled/20/000000/home.png" alt="Trang chủ" />
            <span>Home</span>
          </a>
          <a href="https://m.me/funsport1" target="_blank" class="footer-icon" style="text-decoration: none;">
            <img src="https://img.icons8.com/ios-filled/20/000000/facebook-messenger.png" alt="Chat" />
            <span>Mess</span>
          </a>
          <a href="https://zalo.me/3913722836443497435" target="_blank" class="footer-icon" style="text-decoration: none;">
            <img src="https://img.icons8.com/ios-filled/20/000000/zalo.png" alt="Zalo" />
            <span>Zalo</span>
          </a>
          <a href="tel:0384735980" class="footer-icon" style="text-decoration: none;">
            <img src="https://img.icons8.com/ios-filled/20/000000/phone.png" alt="Gọi" />
            <span>Call</span>
          </a>
        </div>

        <button class="footer-btn" style="background: #ee4d2d; color: white;"
          onclick="window.open('${link}', '_blank')">
          🛒 MUA TRÊN SHOPEE
        </button>
      </div>
    `;

    // ---- Gắn footer vào cuối body ----
    document.body.appendChild(footer);
  });
})();
