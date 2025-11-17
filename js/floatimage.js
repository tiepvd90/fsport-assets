/* ============================================================
 * 🎮 GAME 5 CARDS — CALL EXTERNAL JS
 * Dùng popupmessage.css
 * Float icon: cards.webp (80px)
 * ============================================================ */

(function () {
  const ICON_ID = "voucherFloatIcon";
  const POPUP_ID = "voucherPopup";
  const CSS_PATH = "/css/popupmessage.css";
  const GAME_JS = "/js/game/5cards.js";
  const IMG_FLOAT = "https://i.postimg.cc/mrRwQS8h/cards.webp";

  /* -----------------------------------
     Inject CSS nếu chưa có
  ----------------------------------- */
  if (!document.querySelector(`link[href="${CSS_PATH}"]`)) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = CSS_PATH;
    document.head.appendChild(css);
  }

  /* -----------------------------------
     FLOAT ICON
  ----------------------------------- */
  if (!document.getElementById(ICON_ID)) {
    const icon = document.createElement("div");
    icon.id = ICON_ID;

    icon.innerHTML = `
      <div class="float-img-wrapper" style="position:relative;">
        <img src="${IMG_FLOAT}" 
             alt="5 Cards Game" 
             style="width:80px; display:block; border-radius:0;">
        <div id="closeVoucherFloat"
             style="
               position:absolute; top:-10px; right:-10px;
               width:22px; height:22px;
               font-size:14px; line-height:22px;
               text-align:center;
               background:#000; color:#fff;
               border-radius:50%; cursor:pointer;
               z-index:20;
             ">×</div>
      </div>
    `;

    document.body.appendChild(icon);
  }

  /* -----------------------------------
     POPUP HOLDER (TRỐNG)
     Nội dung sẽ được 5cards.js render vào
  ----------------------------------- */
  if (!document.getElementById(POPUP_ID)) {
    const popup = document.createElement("div");
    popup.className = "popup-message";
    popup.id = POPUP_ID;

    popup.innerHTML = `
      <div id="closeVoucherPopup"
           style="
             position:absolute; top:-4px; right:-4px;
             background:#000; color:#fff;
             width:34px; height:34px;
             border-radius:50%;
             font-size:20px; font-weight:bold;
             line-height:32px; text-align:center;
             cursor:pointer; z-index:20;
           ">×</div>

      <!-- Nội dung thật của game sẽ được render bởi /js/game/5cards.js -->
      <div id="gameContainer" style="padding:10px;">
        Đang tải mini game...
      </div>
    `;

    document.body.appendChild(popup);
  }

  /* -----------------------------------
     EVENT: đóng icon
  ----------------------------------- */
  document.getElementById("closeVoucherFloat").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById(ICON_ID)?.remove();
  });

  /* -----------------------------------
     EVENT: bấm icon → mở popup
  ----------------------------------- */
  document.getElementById(ICON_ID).addEventListener("click", (e) => {
    if (e.target.id === "closeVoucherFloat") return;
    document.getElementById(POPUP_ID).classList.add("show");
  });

  /* -----------------------------------
     EVENT: đóng popup
  ----------------------------------- */
  document.getElementById("closeVoucherPopup").addEventListener("click", () => {
    document.getElementById(POPUP_ID).classList.remove("show");
  });

  /* -----------------------------------
     LOAD FILE GAME /js/game/5cards.js
  ----------------------------------- */
  function loadGameJS() {
    const s = document.createElement("script");
    s.src = GAME_JS + "?v=" + Date.now(); // tránh cache
    document.body.appendChild(s);
  }

  loadGameJS();
})();
