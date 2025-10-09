/* =========================================================================
 * voucherpopup.js — FLASH SALE 10/10 (CLEAN EDITION)
 * - Popup tone đỏ-cam, chữ trắng
 * - Font vừa phải, giảm size tiêu đề
 * - Float icon giữa màn hình, nhỏ hơn
 * ========================================================================= */

(function () {
  "use strict";

  if (typeof fetchVoucherMap !== "function") {
    window.fetchVoucherMap = () => Promise.resolve({});
  }

  function getSecondsUntil4PM() {
    const now = new Date();
    const target = new Date();
    target.setHours(16, 0, 0, 0);
    let diff = Math.floor((target - now) / 1000);
    return diff < 0 ? 0 : diff;
  }

  function formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }

  function startCountdown() {
    const el = document.getElementById("voucherCountdown");
    if (!el) return;
    let remain = getSecondsUntil4PM();
    el.textContent = `Flash Sale kết thúc sau: ${formatTime(remain)}`;
    const interval = setInterval(() => {
      remain--;
      if (remain <= 0) {
        clearInterval(interval);
        el.textContent = "⏰ Flash Sale đã kết thúc!";
      } else {
        el.textContent = `Flash Sale kết thúc sau: ${formatTime(remain)}`;
      }
    }, 1000);
  }

  function showVoucherPopup() {
    if (document.getElementById("voucherPopup")) return;
    const popup = document.createElement("div");
    popup.id = "voucherPopup";
    popup.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;justify-content:center;align-items:center;">
        <div style="
          background:linear-gradient(135deg,#ff5722,#d32f2f);
          color:#fff;
          padding:22px;
          border-radius:16px;
          width:90%;
          max-width:380px;
          box-shadow:0 4px 20px rgba(0,0,0,0.3);
          text-align:center;
          font-size:17px;
          font-family:'Be Vietnam Pro',sans-serif;
          position:relative;
        ">
          <div id="closeVoucherBtn" style="position:absolute;top:8px;right:12px;font-size:22px;cursor:pointer;color:#fff;">&times;</div>

          <h2 style="margin-bottom:10px;font-size:22px;font-weight:800;letter-spacing:0.5px;">🔥 FLASH SALE 10/10 🔥</h2>
          <p>FreeShip toàn bộ đơn hàng 🎁</p>
          <p>Giảm <strong>5%</strong> toàn website</p>
          <p>Giảm <strong>8%</strong> cho đơn từ <strong>1.500.000₫</strong></p>
          <p id="voucherCountdown" style="font-style:italic;margin-top:8px;color:#fff;"></p>

          <button id="applyVoucherBtn" style="
            margin-top:18px;
            background:#fff;
            color:#d32f2f;
            border:none;
            padding:12px 24px;
            border-radius:8px;
            font-size:17px;
            font-weight:600;
            cursor:pointer;
          ">ĐÃ HIỂU</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    startCountdown();

    document.getElementById("closeVoucherBtn").addEventListener("click", () => popup.remove());
    document.getElementById("applyVoucherBtn").addEventListener("click", () => {
      window.__voucherWaiting = {
        label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán",
      };
      localStorage.setItem(
        "savedVoucher",
        JSON.stringify({ label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán" })
      );
      popup.remove();
    });
  }

  function createVoucherFloatingIcon() {
    if (document.getElementById("voucherFloatIcon")) return;
    const icon = document.createElement("div");
    icon.id = "voucherFloatIcon";
    icon.innerHTML = `
      <div class="voucher-float-img-wrapper" style="
        position:fixed;
        top:50%;
        right:10px;
        transform:translateY(-50%);
        z-index:9999;
        cursor:pointer;
      ">
        <img src="https://i.postimg.cc/bvL7Lbvn/1010-2.jpg" alt="Flash Sale 10/10" style="
          width:60px;
          height:auto;
          border-radius:10px;
          box-shadow:0 4px 8px rgba(0,0,0,0.25);
        "/>
        <div id="closeVoucherIcon" style="
          position:absolute;
          top:-8px;
          right:-8px;
          background:#000;
          color:#fff;
          border-radius:50%;
          width:20px;
          height:20px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
        ">×</div>
      </div>
    `;
    document.body.appendChild(icon);

    icon.addEventListener("click", (e) => {
      if (e.target.id !== "closeVoucherIcon") showVoucherPopup();
    });
    document.getElementById("closeVoucherIcon").addEventListener("click", (e) => {
      e.stopPropagation();
      icon.remove();
    });
  }

  function runFlashSaleVoucher() {
    createVoucherFloatingIcon();
    showVoucherPopup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFlashSaleVoucher);
  } else {
    runFlashSaleVoucher();
  }

  (function setupVoucherAfterCheckoutClose() {
    function waitForCloseButton(retries = 20) {
      const closeBtn = document.querySelector(".checkout-close");
      if (!closeBtn) {
        if (retries > 0) setTimeout(() => waitForCloseButton(retries - 1), 300);
        return;
      }
      closeBtn.addEventListener("click", () => {
        setTimeout(() => {
          window.__voucherWaiting = {
            label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán",
          };
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
