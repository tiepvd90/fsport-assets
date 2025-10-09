/* =========================================================================
 * voucherpopup.js — FLASH SALE 10/10
 * - Hiển thị popup ở mọi trang, mọi lúc
 * - Có đếm ngược đến 4:00 PM hôm nay
 * - Truyền sang cartpopup: { label: "Voucher 10/10" }
 * ========================================================================= */

(function () {
  "use strict";

  // 🛡️ Fallback an toàn
  if (typeof fetchVoucherMap !== "function") {
    window.fetchVoucherMap = () => Promise.resolve({});
  }

  // 🔹 Tính thời gian còn lại đến 16:00 cùng ngày
  function getSecondsUntil4PM() {
    const now = new Date();
    const target = new Date();
    target.setHours(16, 0, 0, 0); // 16:00 hôm nay
    let diff = Math.floor((target - now) / 1000);
    if (diff < 0) diff = 0;
    return diff;
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function startCountdown() {
    const el = document.getElementById("voucherCountdown");
    if (!el) return;

    let remaining = getSecondsUntil4PM();
    el.textContent = `Flash Sale kết thúc sau: ${formatTime(remaining)}`;

    const interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        el.textContent = "⏰ Flash Sale đã kết thúc!";
      } else {
        el.textContent = `Flash Sale kết thúc sau: ${formatTime(remaining)}`;
      }
    }, 1000);
  }

  // 🔹 Hiển thị popup Flash Sale
  function showVoucherPopup() {
    if (document.getElementById("voucherPopup")) return;

    const popup = document.createElement("div");
    popup.className = "voucher-popup";
    popup.id = "voucherPopup";
    popup.innerHTML = `
      <div class="voucher-close" id="closeVoucherBtn">×</div>
      <h2>🔥 FLASH SALE 10/10 🔥</h2>
      <p>FreeShip toàn bộ đơn hàng 🎁</p>
      <p>Giảm <strong>5%</strong> toàn website</p>
      <p>Giảm <strong>8%</strong> cho đơn từ <strong>1.500.000₫</strong></p>
      <p>⏰ Trong phiên livestream từ <strong>11:00 AM</strong> hôm nay!</p>
      <p id="voucherCountdown" style="font-style: italic; margin-top: 8px; color:#e53935;"></p>
      <button id="applyVoucherBtn">ÁP DỤNG NGAY</button>
    `;
    document.body.appendChild(popup);

    // Bắt đầu đếm ngược
    startCountdown();

    // Đóng popup
    document.getElementById("closeVoucherBtn")?.addEventListener("click", () => popup.remove());

    // Áp dụng voucher
    document.getElementById("applyVoucherBtn")?.addEventListener("click", () => {
      window.__voucherWaiting = { label: "Voucher 10/10" };
      localStorage.setItem("savedVoucher", JSON.stringify({ label: "Voucher 10/10" }));
      popup.remove();
      document.querySelector("#btn-atc")?.click(); // mở cartpopup nếu có
    });
  }

  // 🔹 Icon nổi
  function createVoucherFloatingIcon() {
    if (document.getElementById("voucherFloatIcon")) return;

    const icon = document.createElement("div");
    icon.id = "voucherFloatIcon";
    icon.innerHTML = `
      <div class="voucher-float-img-wrapper" style="position:fixed;bottom:80px;right:16px;z-index:9999;cursor:pointer;">
        <img src="https://i.postimg.cc/pdNBDJ8B/voucher30k.png" alt="voucher" style="width:80px;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.2);" />
        <div class="voucher-float-close" id="closeVoucherIcon" style="position:absolute;top:-8px;right:-8px;background:#000;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:14px;">×</div>
      </div>
    `;
    document.body.appendChild(icon);

    icon.addEventListener("click", (e) => {
      if (e.target.id !== "closeVoucherIcon") {
        showVoucherPopup();
      }
    });

    document.getElementById("closeVoucherIcon")?.addEventListener("click", (e) => {
      e.stopPropagation();
      icon.remove();
    });
  }

  // 🔹 Hàm chính: luôn hiển thị popup ở mọi page
  function runFlashSaleVoucher() {
    createVoucherFloatingIcon();
    showVoucherPopup();
  }

  // 🔹 Chạy ngay khi trang load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFlashSaleVoucher);
  } else {
    runFlashSaleVoucher();
  }

  // 🔹 Hiện lại khi khách đóng checkout
  (function setupVoucherAfterCheckoutClose() {
    function waitForCloseButton(retries = 20) {
      const closeBtn = document.querySelector(".checkout-close");
      if (!closeBtn) {
        if (retries > 0) setTimeout(() => waitForCloseButton(retries - 1), 300);
        return;
      }

      closeBtn.addEventListener("click", () => {
        setTimeout(() => {
          window.__voucherWaiting = { label: "Voucher 10/10" };
          localStorage.setItem("savedVoucher", JSON.stringify({ label: "Voucher 10/10" }));
          createVoucherFloatingIcon();
          showVoucherPopup();
        }, 300);
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => waitForCloseButton());
    } else {
      waitForCloseButton();
    }
  })();
})();
