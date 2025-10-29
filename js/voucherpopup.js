/* ================================================
 * 🎾 FLOAT IMAGE — Pickleball Ball Shortcut
 * Hiển thị ở mọi trang, click → sang trang bóng
 * ================================================ */

(function () {
  const ICON_ID = "voucherFloatIcon";
  const TARGET_URL = "https://fun-sport.co/pickleball/ball";
  const IMG_SRC = "/assets/images/thumb/pickleball/ball/BONGPRO.webp";

  // Nếu đã tồn tại icon thì không tạo lại
  if (document.getElementById(ICON_ID)) return;

  // Tạo icon nổi
  const icon = document.createElement("div");
  icon.id = ICON_ID;
  icon.innerHTML = `
    <div class="voucher-float-img-wrapper">
      <img src="${IMG_SRC}" alt="Bóng Pickleball" />
      <div class="voucher-float-close" id="closeVoucherIcon">×</div>
    </div>
  `;

  // Thêm vào body
  document.body.appendChild(icon);

  // Khi click vào ảnh → chuyển trang
  icon.addEventListener("click", (e) => {
    if (e.target.id === "closeVoucherIcon") return;
    window.location.href = TARGET_URL;
  });

  // Khi bấm nút × → ẩn icon
  document.getElementById("closeVoucherIcon")?.addEventListener("click", (e) => {
    e.stopPropagation();
    icon.remove();
  });
})();
