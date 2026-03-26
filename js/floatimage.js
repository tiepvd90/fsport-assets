/* ============================================================
 * 🎯 FLOAT IMAGE + POPUP VOUCHER 150K
 * ============================================================ */

(function () {
  document.addEventListener("DOMContentLoaded", function () {

    // ✅ Điều kiện hiển thị
    if (window.productCategory !== "pickleball") return;

    const ICON_ID = "ffFloatIcon";
    const POPUP_ID = "ffPopup";

    const ICON_SRC = "/assets/images/gallery/pickleball/fullfoam/temp/icon-to.webp";
    const POPUP_SRC = "/assets/images/gallery/pickleball/fullfoam/temp/150k-voucher2.webp";

    // ====== CSS ======
    if (!document.getElementById("ffFloatStyle")) {
      const style = document.createElement("style");
      style.id = "ffFloatStyle";

      style.innerHTML = `
      
      /* FLOAT ICON */
      #${ICON_ID} {
        position: fixed;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 100px;
        height: 82px;
        z-index: 9999;
        cursor: pointer;
        animation: ffShake 2s infinite;
      }

      #${ICON_ID} img {
        width: 100%;
        height: 100%;
        border-radius: 10px;
        object-fit: cover;
      }

      @keyframes ffShake {
        0% { transform: translateY(-50%) translateX(0); }
        25% { transform: translateY(-50%) translateX(-3px); }
        50% { transform: translateY(-50%) translateX(3px); }
        75% { transform: translateY(-50%) translateX(-2px); }
        100% { transform: translateY(-50%) translateX(0); }
      }

      /* POPUP */
      #${POPUP_ID} {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }

      #${POPUP_ID}.show {
        display: flex;
      }

      .ff-popup-content {
        position: relative;
        max-width: 90%;
      }

      .ff-popup-content img {
        width: 100%;
        height: auto;
        display: block;
        border-radius: 12px;
      }

      /* CLOSE BUTTON */
      .ff-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        background: rgba(200,200,200,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        color: black;
        cursor: pointer;
      }

      `;
      document.head.appendChild(style);
    }

    // ====== FLOAT ICON ======
    if (!document.getElementById(ICON_ID)) {
      const icon = document.createElement("div");
      icon.id = ICON_ID;

      icon.innerHTML = `<img src="${ICON_SRC}" alt="Voucher 150K">`;

      document.body.appendChild(icon);
    }

    // ====== POPUP ======
    if (!document.getElementById(POPUP_ID)) {
      const popup = document.createElement("div");
      popup.id = POPUP_ID;

      popup.innerHTML = `
        <div class="ff-popup-content">
          <div class="ff-close" id="ffCloseBtn">✕</div>
          <img src="${POPUP_SRC}" alt="Voucher FullFoam 150K">
        </div>
      `;

      document.body.appendChild(popup);
    }

    // ====== EVENTS ======
    const iconEl = document.getElementById(ICON_ID);
    const popupEl = document.getElementById(POPUP_ID);

    // 👉 Click icon → mở popup
    iconEl.addEventListener("click", () => {
      popupEl.classList.add("show");
      iconEl.style.display = "none";
    });

    // 👉 Click X → đóng popup
    document.getElementById("ffCloseBtn").addEventListener("click", () => {
      popupEl.classList.remove("show");
      iconEl.style.display = "block";
    });

  });
})();
