/* ======================================================
 * 🛒 STICKYFOOTER-AFF — Bản ép inline CSS (ổn định tuyệt đối)
 * Hiển thị icon Home / Mess / Zalo / Call + nút MUA TRÊN SHOPEE
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

    // Nếu đã có footer thì không tạo thêm
    if (document.querySelector(".sticky-footer")) return;

    const footer = document.createElement("div");
    footer.className = "sticky-footer";
    footer.style.cssText = `
      position: fixed;
      bottom: 0; left: 0; right: 0;
      width: 100%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #ddd;
      z-index: 9999;
      padding: 6px 10px;
      font-family: 'Be Vietnam Pro', sans-serif;
      box-sizing: border-box;
    `;

    footer.innerHTML = `
      <!-- ✅ Nhóm icon -->
      <div style="display:flex;align-items:center;gap:18px;">
        <a href="https://fun-sport.co" target="_blank"
           style="text-decoration:none;color:black;text-align:center;font-size:12px;display:flex;flex-direction:column;align-items:center;">
          <img src="https://img.icons8.com/ios-filled/22/000000/home.png" style="width:22px;height:22px;margin-bottom:3px;">
          <span>Home</span>
        </a>

        <a href="https://m.me/funsport1" target="_blank"
           style="text-decoration:none;color:black;text-align:center;font-size:12px;display:flex;flex-direction:column;align-items:center;">
          <img src="https://img.icons8.com/ios-filled/22/000000/facebook-messenger.png" style="width:22px;height:22px;margin-bottom:3px;">
          <span>Mess</span>
        </a>

        <a href="https://zalo.me/3913722836443497435" target="_blank"
           style="text-decoration:none;color:black;text-align:center;font-size:12px;display:flex;flex-direction:column;align-items:center;">
          <img src="https://img.icons8.com/ios-filled/22/000000/zalo.png" style="width:22px;height:22px;margin-bottom:3px;">
          <span>Zalo</span>
        </a>

        <a href="tel:0384735980"
           style="text-decoration:none;color:black;text-align:center;font-size:12px;display:flex;flex-direction:column;align-items:center;">
          <img src="https://img.icons8.com/ios-filled/22/000000/phone.png" style="width:22px;height:22px;margin-bottom:3px;">
          <span>Call</span>
        </a>
      </div>

      <!-- 🛒 Nút Shopee -->
      <button onclick="window.open('${link}','_blank')"
        style="
          flex:1;
          margin-left:10px;
          margin-bottom:4px;
          height:40px;
          background:linear-gradient(90deg,#ff7b00,#ff4400);
          color:#fff;
          font-weight:bold;
          font-size:14px;
          border:none;
          padding:0 16px;
          cursor:pointer;
          border-radius:8px;
          align-self:center;
          white-space:nowrap;
          box-shadow:0 2px 6px rgba(255,68,0,0.3);
          transition:0.2s;
        "
        onmouseover="this.style.opacity='0.9';this.style.transform='scale(1.03)'"
        onmouseout="this.style.opacity='1';this.style.transform='scale(1)'">
        MUA TRÊN SHOPEE
      </button>
    `;

    document.body.appendChild(footer);
  });
})();
