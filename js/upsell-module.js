/* =========================================================
 * upsell-module.js — Xử lý combo upsell sau khi kích hoạt bảo hành
 * ========================================================= */
(function () {
  "use strict";

  const WEBHOOK_URL = "https://hook.eu2.make.com/dxl7ngaypediyxwb8g7jir704356vhjt";
  let selectedCombo = null;

  // Hàm khởi tạo upsell sau khi bảo hành thành công
  function initUpsell() {
    const confirmBtn = document.getElementById("confirmUpsell");
    const closeBtn = document.querySelector(".close-btn");
    const comboButtons = document.querySelectorAll(".combo-btn");

    if (!confirmBtn || !comboButtons.length) return;

    // --- Chọn combo ---
    comboButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        comboButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        selectedCombo = {
          label: btn.querySelector(".combo-label").innerText,
          oldPrice: btn.querySelector(".old").innerText.replace(/[^\d]/g, ""),
          newPrice: btn.querySelector(".new").innerText.replace(/[^\d]/g, ""),
        };

        confirmBtn.disabled = false;
        confirmBtn.classList.add("enabled");
      });
    });

    // --- Gửi upsell ---
    confirmBtn.addEventListener("click", () => {
      if (!selectedCombo) return alert("Vui lòng chọn combo trước.");

      const payload = {
        type: "upsell",
        product: "Bóng F-Sport Pro",
        combo: selectedCombo.label,
        original_price: selectedCombo.oldPrice,
        price: selectedCombo.newPrice,
        date: new Date().toLocaleString("vi-VN"),
        source: "Kích hoạt bảo hành - upsell fun-sport.co",
      };

      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => {
          alert("✅ Cảm ơn anh/chị! Ưu đãi đã được ghi nhận.");
          document.getElementById("successPopup").style.display = "none";
        })
        .catch(() => alert("Lỗi mạng, vui lòng thử lại sau."));
    });

    // --- Đóng popup ---
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("successPopup").style.display = "none";
      });
    }
  }

  // Chỉ chạy upsell sau khi bảo hành gửi thành công
  document.addEventListener("warrantySuccess", initUpsell);
})();
