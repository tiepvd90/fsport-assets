/* ============================================================
 * 🎯 FLOAT IMAGE + POPUP VOUCHER (FINAL FIX)
 * ============================================================ */

(function () {
  document.addEventListener("DOMContentLoaded", function () {

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
        top: 55%;
        transform: translateY(-50%);
        z-index: 9999;
        cursor: pointer;
        animation: ffShake 2s infinite;
      }

      #${ICON_ID} img {
        width: 100px;
        height: 82px;
        border-radius: 10px;
        object-fit: cover;
      }

      /* 👉 MOBILE */
      @media (max-width: 768px) {
        #${ICON_ID} img {
          width: 50px;
          height: 41px;
        }
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
        padding: 20px;
      }

      #${POPUP_ID}.show {
        display: flex;
      }

      .ff-popup-content {
        position: relative;
        width: 100%;
        max-width: 90vw;
      }

      /* 👉 FIX CHỈ DESKTOP */
      @media (min-width: 1024px) {
        .ff-popup-content {
          max-width: 500px;
        }
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
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        background: rgba(200,200,200,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        color: black;
        cursor: pointer;
        z-index: 10;
      }

      `;
      document.head.appendChild(style);
    }

    // ====== FLOAT ICON ======
    if (!document.getElementById(ICON_ID)) {
      const icon = document.createElement("div");
      icon.id = ICON_ID;
      icon.innerHTML = `<img src="${ICON_SRC}">`;
      document.body.appendChild(icon);
    }

    // ====== POPUP ======
    if (!document.getElementById(POPUP_ID)) {
      const popup = document.createElement("div");
      popup.id = POPUP_ID;

      popup.innerHTML = `
        <div class="ff-popup-content">
          <div class="ff-close" id="ffCloseBtn">✕</div>
          <img src="${POPUP_SRC}">
        </div>
      `;

      document.body.appendChild(popup);
    }

    const iconEl = document.getElementById(ICON_ID);
    const popupEl = document.getElementById(POPUP_ID);

    // 👉 Click icon
    iconEl.addEventListener("click", () => {
      popupEl.classList.add("show");
      iconEl.style.display = "none";
    });

    // 👉 Close popup
    document.getElementById("ffCloseBtn").addEventListener("click", () => {
      popupEl.classList.remove("show");
      iconEl.style.display = "block";
    });

    // ====== ẨN ICON KHI CART MỞ ======
    const observer = new MutationObserver(() => {
      const cart = document.getElementById("cartPopup");

      if (cart && window.getComputedStyle(cart).display !== "none") {
        iconEl.style.display = "none";
      } else {
        if (!popupEl.classList.contains("show")) {
          iconEl.style.display = "block";
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

  });
})();
