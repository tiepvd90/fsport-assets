/* ======================================================
 * 🛒 STICKYFOOTER-AFF — Bản sao layout cũ, dùng cho Affiliate
 * Giao diện giống hệt sticky footer gốc, chỉ đổi nút thành MUA TRÊN SHOPEE
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

    if (document.querySelector(".sticky-footer")) return;

    const footer = document.createElement("div");
    footer.className = "sticky-footer";
    footer.style.cssText = `
      display:flex;align-items:center;justify-content:space-between;
      padding:8px 12px;background:#fff;border-top:1px solid #ddd;
      position:fixed;bottom:0;left:0;right:0;width:100%;max-width:100vw;
      z-index:9999;box-sizing:border-box;
      font-family:'Be Vietnam Pro',sans-serif;
    `;

    footer.innerHTML = `
      <!-- ✅ Nhóm nút: Home - Mess - Zalo - Call -->
      <div style="display:flex;gap:20px;">
        <a href="https://fun-sport.co" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:black;font-size:11px;">
          <img src="https://img.icons8.com/ios-filled/20/000000/home.png" alt="Trang chủ">
          <span>Home</span>
        </a>

        <a href="https://m.me/funsport1" target="_blank" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:black;font-size:11px;">
          <img src="https://img.icons8.com/ios-filled/20/000000/facebook-messenger.png" alt="Chat">
          <span>Mess</span>
        </a>

        <a href="https://zalo.me/3913722836443497435" target="_blank" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:black;font-size:11px;">
          <img src="https://img.icons8.com/ios-filled/20/000000/zalo.png" alt="Zalo" style="width:20px;height:20px;">
          <span>Zalo</span>
        </a>

        <a href="tel:0384735980" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:black;font-size:11px;">
          <img src="https://img.icons8.com/ios-filled/20/000000/phone.png" alt="Gọi">
          <span>Call</span>
        </a>
      </div>

      <!-- 🛒 Nút Mua Trên Shopee -->
      <button class="footer-btn"
        style="background:#ee4d2d;color:white;font-weight:bold;padding:8px 12px;
               border:none;border-radius:8px;font-size:13px;white-space:nowrap;
               display:flex;align-items:center;gap:6px;cursor:pointer;"
        onclick="window.open('${link}','_blank')">
        🛒 MUA TRÊN SHOPEE
      </button>
    `;

    document.body.appendChild(footer);
  });
})();
