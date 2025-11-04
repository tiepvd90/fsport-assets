/* ============================================================
 * 🏐 POPUP MESSAGE — Pickleball Ball Promotion (Fun-Sport)
 * Hiển thị icon nổi + popup thông báo "Mua 4 bóng được tặng 6"
 * ============================================================ */

(function () {
  const ICON_ID = "ballPromoFloatIcon";
  const POPUP_ID = "ballPromoPopup";
  const CSS_PATH = "/css/popupmessage.css";
  const IMG_ICON = "/assets/images/thumb/pickleball/ball/MUA4DUOC6.webp";
  const IMG_QR = "/assets/images/zaloOA.webp";
  const ZALO_LINK = "https://zalo.me/3913722836443497435";

  // ====== Kiểm tra CSS popupmessage đã có chưa, nếu chưa thì chèn ======
  if (!document.querySelector(`link[href="${CSS_PATH}"]`)) {
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = CSS_PATH;
    document.head.appendChild(cssLink);
  }

  // ====== Thêm CSS riêng cho icon nổi ======
  const style = document.createElement("style");
  style.textContent = `
    #${ICON_ID} {
      position: fixed;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 9998;
      cursor: pointer;
      animation: floatBounce 2s infinite;
    }

    #${ICON_ID} img {
      width: 60px;
      height: auto;
      border-radius: 8px;
      transition: transform 0.2s ease;
    }

    #${ICON_ID} img:hover {
      transform: scale(1.05);
    }

    @keyframes floatBounce {
      0%, 100% { transform: translateY(-50%) translateY(0); }
      50% { transform: translateY(-50%) translateY(-8px); }
    }
  `;
  document.head.appendChild(style);

  // ====== Tạo icon nổi nếu chưa có ======
  if (!document.getElementById(ICON_ID)) {
    const icon = document.createElement("div");
    icon.id = ICON_ID;
    icon.innerHTML = `<img src="${IMG_ICON}" alt="Mua 4 được 6 bóng Pickleball">`;
    document.body.appendChild(icon);
  }

  // ====== Tạo popup HTML (ẩn sẵn) ======
  if (!document.getElementById(POPUP_ID)) {
    const popup = document.createElement("div");
    popup.className = "popup-message";
    popup.id = POPUP_ID;
    popup.innerHTML = `
      <div class="close-btn" id="closeBallPromo">×</div>
      <h3>🎁 Mua 4 bóng thi đấu được tặng thành 6</h3>
      <p>Quan tâm OA Fun-Sport và nhắn tin “Nhận Mã” để nhận ưu đãi.</p>
      <img src="${IMG_QR}" alt="QR Zalo OA">
      <button class="btn-zalo" id="openZaloOA">OA Fun-Sport</button>
    `;
    document.body.appendChild(popup);
  }

  const iconEl = document.getElementById(ICON_ID);
  const popupEl = document.getElementById(POPUP_ID);

  // ====== Sự kiện mở popup ======
  iconEl.addEventListener("click", () => {
    popupEl.classList.add("show");
  });

  // ====== Nút đóng popup ======
  document.getElementById("closeBallPromo").addEventListener("click", () => {
    popupEl.classList.remove("show");
  });

  // ====== Nút mở OA Fun-Sport ======
  document.getElementById("openZaloOA").addEventListener("click", () => {
    window.open(ZALO_LINK, "_blank");
  });
})();
