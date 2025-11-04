/* ============================================================
 * 🏐 POPUP MESSAGE — Pickleball Ball Promotion (Fun-Sport)
 * Hiển thị chỉ khi category = "pickleball" và productPage ≠ "pickleball-ball"
 * ============================================================ */

(function () {
  const category = window.productCategory || "";
  const productPage = window.productPage || "";

  // ✅ Điều kiện hiển thị
  if (category !== "pickleball" || productPage === "pickleball-ball") return;

  const ICON_ID = "ballPromoFloatIcon";
  const POPUP_ID = "ballPromoPopup";
  const CSS_PATH = "/css/popupmessage.css";
  const IMG_ICON = "/assets/images/thumb/pickleball/ball/MUA4DUOC6.webp";
  const IMG_QR = "/assets/images/zaloOA.webp";
  const IMG_BALL = "/assets/images/gallery/pickleball/pickleball-ball/2.webp";
  const ZALO_LINK = "https://zalo.me/3913722836443497435";
  const BALL_LINK = "https://fun-sport.co/pickleball/ball";

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
      <h3>🎁 Ưu đãi Bóng Thi Đấu Dạ Quang F-Sport Pro</h3>
      <p>Ấn “Quan Tâm” Zalo OA Fun-Sport và nhắn “<b>Bóng Pro</b>” để nhận ưu đãi <b>Mua 4 được 6 bóng thi đấu Dạ Quang Pro</b>.</p>

      <div class="promo-row">
        <div class="promo-col">
          <img src="${IMG_QR}" alt="QR Zalo OA Fun-Sport" class="promo-img">
          <button class="btn-zalo" id="openZaloOA">ZALO OA Fun-Sport</button>
        </div>
        <div class="promo-col">
          <img src="${IMG_BALL}" alt="Bóng Pickleball F-Sport Pro" class="promo-img">
          <button class="btn-ball" id="viewBallDetail">XEM CHI TIẾT BÓNG</button>
        </div>
      </div>
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

  // mở OA Zalo (trong tab hiện tại)
  document.getElementById("openZaloOA").addEventListener("click", () => {
    window.location.href = ZALO_LINK;
  });

  // mở chi tiết bóng (trong tab hiện tại)
  document.getElementById("viewBallDetail").addEventListener("click", () => {
    window.location.href = BALL_LINK;
  });

  // đóng icon nổi
  document.getElementById("closeFloatIcon").addEventListener("click", (e) => {
    e.stopPropagation();
    iconEl.remove();
  });
})();
