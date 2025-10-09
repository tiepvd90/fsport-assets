/* =========================================================================
 * voucherpopup.js — FLASH SALE 10/10 FINAL
 * - Hiển thị ở mọi trang, mọi lúc
 * - Giao diện tone cam-đỏ flash sale
 * - Có đồng hồ đếm ngược đến 4PM hôm nay
 * - Truyền sang cartpopup: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán"
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
      <div style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.6);
        z-index:9999;
        display:flex;
        justify-content:center;
        align-items:center;
      ">
        <div style="
          background:linear-gradient(135deg, #ff5722, #d32f2f);
          color:#fff;
          padding:24px;
          border-radius:16px;
          width:90%;
          max-width:400px;
          box-shadow:0 4px 20px rgba(0,0,0,0.3);
          text-align:center;
          font-size:18px;
          position:relative;
          font-family:'Be Vietnam Pro', sans-serif;
        ">
          <div id="closeVoucherBtn" style="
            position:absolute;
            top:8px;
            right:12px;
            font-size:22px;
            cursor:pointer;
            color:#fff;
          ">&times;</div>

          <h2 style="margin-bottom:12px;font-size:26px;font-weight:800;letter-spacing:0.5px;">🔥 FLASH SALE 10/10 🔥</h2>
          <p>FreeShip toàn bộ đơn hàng 🎁</p>
          <p>Giảm <strong>5%</strong> toàn website</p>
          <p>Giảm <strong>8%</strong> cho đơn từ <strong>1.500.000₫</strong></p>

          <p id="voucherCountdown" style="font-style:italic;margin-top:8px;color:#fff;"></p>

          <button id="applyVoucherBtn" style="
            margin-top:20px;
            background:#fff;
            color:#d32f2f;
            border:none;
            padding:12px 24px;
            border-radius:8px;
            font-size:18px;
            font-weight:600;
            cursor:pointer;
          ">ĐÃ HIỂU</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    // Bắt đầu đếm ngược
    startCountdown();

    // Đóng popup
    document.getElementById("closeVoucherBtn")?.addEventListener("click", () => popup.remove());

    // Nút "ĐÃ HIỂU"
    document.getElementById("applyVoucherBtn")?.addEventListener("click", () => {
      window.__voucherWaiting = { label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán" };
      localStorage.setItem(
        "savedVoucher",
        JSON.stringify({ label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán" })
      );
      popup.remove();
    });
  }

  // 🔹 Icon nổi
  function createVoucherFloatingIcon() {
    if (document.getElementById("voucherFloatIcon")) return;

    const icon = document.createElement("div");
    icon.id = "voucherFloatIcon";
    icon.innerHTML = `
      <div class="voucher-float-img-wrapper" style="
        position:fixed;
        bottom:80px;
        right:16px;
        z-index:9999;
        cursor:pointer;
      ">
        <img src="https://i.postimg.cc/bvL7Lbvn/1010-2.jpg" alt="Flash Sale 10/10" style="
          width:90px;
          height:auto;
          border-radius:12px;
          box-shadow:0 4px 10px rgba(0,0,0,0.25);
        " />
        <div id="closeVoucherIcon" style="
          position:absolute;
          top:-8px;
          right:-8px;
          background:#000;
          color:#fff;
          border-radius:50%;
          width:22px;
          height:22px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
        ">×</div>
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

  // 🔹 Hiển thị popup & icon trên mọi trang
  function runFlashSaleVoucher() {
    createVoucherFloatingIcon();
    showVoucherPopup();
  }

  // 🔹 Kích hoạt khi load trang
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFlashSaleVoucher);
  } else {
    runFlashSaleVoucher();
  }

  // 🔹 Hiển lại khi đóng checkout (nếu có)
  (function setupVoucherAfterCheckoutClose() {
    function waitForCloseButton(retries = 20) {
      const closeBtn = document.querySelector(".checkout-close");
      if (!closeBtn) {
        if (retries > 0) setTimeout(() => waitForCloseButton(retries - 1), 300);
        return;
      }

      closeBtn.addEventListener("click", () => {
        setTimeout(() => {
          window.__voucherWaiting = { label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán" };
          localStorage.setItem(
            "savedVoucher",
            JSON.stringify({ label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán" })
          );
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
