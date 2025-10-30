/* ======================================================
 * 🛒 STICKYFOOTER-AFF — Dùng chung CSS sticky-footer gốc
 * Chỉ đổi nút thành "MUA TRÊN SHOPEE"
 * ====================================================== */
(function () {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else fn();
  }

  onReady(() => {
    const link = window.shopeeLink || "";
    if (!link) {
      console.warn("⚠️ stickyfooter-aff: thiếu window.shopeeLink");
      return;
    }

    // Nếu đã có footer thì không thêm nữa
    if (document.querySelector(".sticky-footer")) return;

    // ✅ Tạo footer
    const footer = document.createElement("div");
    footer.className = "sticky-footer";

    footer.innerHTML = `
      <!-- ✅ Nhóm icon -->
      <a href="https://fun-sport.co" class="footer-icon">
        <img src="https://img.icons8.com/ios-filled/20/000000/home.png" alt="Home">
        <span>Home</span>
      </a>

      <a href="https://m.me/funsport1" class="footer-icon" target="_blank">
        <img src="https://img.icons8.com/ios-filled/20/000000/facebook-messenger.png" alt="Messenger">
        <span>Mess</span>
      </a>

      <a href="https://zalo.me/3913722836443497435" class="footer-icon" target="_blank">
        <img src="https://img.icons8.com/ios-filled/20/000000/zalo.png" alt="Zalo">
        <span>Zalo</span>
      </a>

      <a href="tel:0384735980" class="footer-icon">
        <img src="https://img.icons8.com/ios-filled/20/000000/phone.png" alt="Call">
        <span>Call</span>
      </a>

      <!-- 🛒 Nút Mua Trên Shopee -->
      <button class="footer-btn-shopee" onclick="window.open('${link}','_blank')">
        MUA TRÊN SHOPEE
      </button>
    `;

    document.body.appendChild(footer);
  });
})();
