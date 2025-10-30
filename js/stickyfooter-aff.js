/* ================================================
 * 🛒 STICKY FOOTER — AFFILIATE (Shopee)
 * Dùng chung /css/stickyfooter.css
 * ================================================ */

(function () {
  if (document.getElementById("stickyFooterAff")) return;

  // ====== Gọi CSS ngoài (nếu chưa có) ======
  if (!document.querySelector('link[href*="stickyfooter.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/stickyfooter.css";
    document.head.appendChild(link);
  }

  // ====== Lấy link Shopee ======
  const shopeeLink = window.shopeeLink || "https://shopee.vn";

  // ====== HTML cấu trúc ======
  const footer = document.createElement("div");
  footer.id = "stickyFooterAff";
  footer.className = "sticky-footer";
  footer.innerHTML = `
    <a href="https://fun-sport.co" class="footer-icon">
      <img src="https://img.icons8.com/ios-filled/20/000000/home.png" alt="Home">
      <span>Home</span>
    </a>
    <a href="https://m.me/funsport1" class="footer-icon" target="_blank">
      <img src="https://img.icons8.com/ios-filled/20/000000/facebook-messenger.png" alt="Mess">
      <span>Mess</span>
    </a>
    <a href="https://zalo.me/3913722836443497435" class="footer-icon" target="_blank">
      <img src="https://img.icons8.com/ios-filled/20/000000/zalo.png" alt="Zalo">
      <span>Zalo</span>
    </a>
    <a href="tel:0384735980" class="footer-icon">
      <img src="https://img.icons8.com/ios-filled/20/000000/phone.png" alt="Gọi">
      <span>Call</span>
    </a>
    <button id="btnShopeeAff" class="footer-btn-shopee">MUA TRÊN SHOPEE</button>
  `;
  document.body.appendChild(footer);

  // ====== Click mở Shopee ======
  document
    .getElementById("btnShopeeAff")
    .addEventListener("click", () => window.open(shopeeLink, "_blank"));
})();
