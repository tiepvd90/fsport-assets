/* ================================================
 * 🎾 FLOAT IMAGE — Pickleball Ball Shortcut
 * Tự chèn CSS + hiển thị ở mọi trang
 * ================================================ */

(function () {
  const ICON_ID = "voucherFloatIcon";
  const TARGET_URL = "https://fun-sport.co/pickleball/ball";
  const IMG_SRC = "/assets/images/thumb/pickleball/ball/MUA4DUOC6.webp";

  // Nếu đã tồn tại icon thì không tạo lại
  if (document.getElementById(ICON_ID)) return;

  // ====== Thêm CSS vào trang ======
  const style = document.createElement("style");
  style.textContent = `
    /* 🎾 Pickleball Floating Icon */
    #${ICON_ID} {
      position: fixed;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 9998;
      cursor: pointer;
      animation: bounce 2s infinite;
    }

    .voucher-float-img-wrapper {
      position: relative;
      display: inline-block;
    }

    .voucher-float-img-wrapper img {
      width: 60px;
      height: auto;
      display: block;
      border: none;
      box-shadow: none;
      border-radius: 0;
      transition: transform 0.2s ease;
    }

    .voucher-float-img-wrapper img:hover {
      transform: scale(1.05);
    }

    .voucher-float-close {
      position: absolute;
      top: -8px;
      right: -8px;
      background: black;
      color: white;
      font-weight: bold;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      line-height: 18px;
      font-size: 14px;
      text-align: center;
      cursor: pointer;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(-50%) translateY(0); }
      50% { transform: translateY(-50%) translateY(-8px); }
    }
  `;
  document.head.appendChild(style);

  // ====== Tạo icon nổi ======
  const icon = document.createElement("div");
  icon.id = ICON_ID;
  icon.innerHTML = `
    <div class="voucher-float-img-wrapper">
      <img src="${IMG_SRC}" alt="Bóng Pickleball" />
      <div class="voucher-float-close" id="closeVoucherIcon">×</div>
    </div>
  `;

  document.body.appendChild(icon);

  // ====== Logic xử lý click ======
  icon.addEventListener("click", (e) => {
    if (e.target.id === "closeVoucherIcon") return;
    window.location.href = TARGET_URL;
  });

  document.getElementById("closeVoucherIcon")?.addEventListener("click", (e) => {
    e.stopPropagation();
    icon.remove();
  });
})();
