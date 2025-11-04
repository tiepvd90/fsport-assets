/* ============================================================
 * 🏐 POPUP MESSAGE — Pickleball Ball Promotion (Fun-Sport)
 * Dùng CSS từ /css/popupmessage.css
 * ============================================================ */

(function () {
  const ICON_ID = "ballPromoFloatIcon";
  const POPUP_ID = "ballPromoPopup";
  const CSS_PATH = "/css/popupmessage.css";
  const IMG_ICON = "/assets/images/thumb/pickleball/ball/MUA4DUOC6.webp";
  const IMG_QR = "/assets/images/zaloOA.webp";
  const ZALO_LINK = "https://zalo.me/3913722836443497435";

  // ====== Đảm bảo CSS được load ======
  if (!document.querySelector(`link[href="${CSS_PATH}"]`)) {
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = CSS_PATH;
    document.head.appendChild(cssLink);
  }

  // ====== Tạo icon nổi ======
  if (!document.getElementById(ICON_ID)) {
    const icon = document.createElement("div");
    icon.id = ICON_ID;
    icon.innerHTML = `
      <div class="float-img-wrapper">
        <img src="${IMG_ICON}" alt="Mua 4 được 6 bóng Pickleball">
        <div class="close-float" id="closeFloatIcon">×</div>
      </div>
    `;
    document.body.appendChild(icon);
  }

  // ====== Tạo popup ======
  if (!document.getElementById(POPUP_ID)) {
    const popup = document.createElement("div");
    popup.className = "popup-message";
    popup.id = POPUP_ID;
    popup.innerHTML = `
      <div class="close-btn" id="closeBallPromo">×</div>
      <h3>🎁 Ưu đãi Bóng Thi Đấu Dạ Quang F-Sport Pro Tại Zalo OA</h3>
      <p>Chỉ cần ấn nút <b>“Quan Tâm”</b> Zalo OA <b>Fun-Sport</b> và nhắn tin “<b>Bóng Pro</b>” – bạn sẽ nhận ngay mã ưu đãi <b>Mua 4 được 6 bóng thi đấu Dạ Quang Pro</b>.</p>
      <div class="qr-box">
        <img src="${IMG_QR}" alt="QR Zalo OA Fun-Sport">
      </div>
      <button class="btn-zalo" id="openZaloOA">ZALO OA Fun-Sport</button>
    `;
    document.body.appendChild(popup);
  }

  // ====== Gán sự kiện ======
  const iconEl = document.getElementById(ICON_ID);
  const popupEl = document.getElementById(POPUP_ID);

  // mở popup khi click icon
  iconEl.addEventListener("click", (e) => {
    if (e.target.id === "closeFloatIcon") return;
    popupEl.classList.add("show");
  });

  // đóng popup
  document.getElementById("closeBallPromo").addEventListener("click", () => {
    popupEl.classList.remove("show");
  });

  // mở OA Zalo
  document.getElementById("openZaloOA").addEventListener("click", () => {
    window.open(ZALO_LINK, "_blank");
  });

  // đóng icon nổi
  document.getElementById("closeFloatIcon").addEventListener("click", (e) => {
    e.stopPropagation();
    iconEl.remove();
  });
})();
