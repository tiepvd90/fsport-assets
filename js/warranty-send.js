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

      // ✅ Lấy sản phẩm từ biến toàn cục
      const authProduct = window.authProduct || "Không xác định";

      const payload = {
        type: "warranty",
        authProduct, // chỉ cần 1 trường duy nhất
        phone,
        email,
        date: new Date().toLocaleString("vi-VN"),
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
          document.dispatchEvent(new CustomEvent("warrantySuccess", { detail: payload }));
        } else {
          throw new Error("Webhook lỗi");
        }
      } catch (err) {
        alert("Không thể gửi thông tin, vui lòng thử lại sau.");
      }
    });
  });
})();
