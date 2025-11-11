/* =========================================================
 * warranty-send.js — Gửi thông tin kích hoạt bảo hành F-Sport
 * ========================================================= */
(function () {
  "use strict";

  const WEBHOOK_URL = "https://hook.eu2.make.com/dxl7ngaypediyxwb8g7jir704356vhjt";
  const FORM_ID = "warrantyForm";
  const SUCCESS_POPUP_ID = "successPopup";

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById(FORM_ID);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const phone = form.phone.value.trim();
      const email = form.email.value.trim();

      if (!phone || !email) {
        alert("Vui lòng nhập đầy đủ SĐT và Email.");
        return;
      }

      const payload = {
        type: "warranty",
        product: "Vợt Pickleball F-Sport Active",
        name: "Khách hàng",
        phone,
        email,
        date: new Date().toLocaleString("vi-VN"),
        source: "Xác thực chính hãng - fun-sport.co",
      };

      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          document.getElementById(SUCCESS_POPUP_ID).style.display = "flex";
          form.reset();

          // ✅ Phát sự kiện để module khác (upsell) biết form đã gửi thành công
          document.dispatchEvent(new CustomEvent("warrantySuccess"));
        } else {
          throw new Error("Webhook lỗi");
        }
      } catch (err) {
        alert("Không thể gửi thông tin, vui lòng thử lại sau.");
      }
    });
  });
})();
