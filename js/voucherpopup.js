/* =========================================================================
 * voucherpopup-1010.js — FLASH SALE 10/10
 * - Hiển thị ở mọi trang (chỉ giới hạn cooldown)
 * - Popup nền trắng, chữ đen, dòng cuối màu cam đậm
 * - Countdown đến 16:00 hôm nay
 * - Icon nổi = ảnh mới https://i.postimg.cc/bvL7Lbvn/1010-2.jpg
 * ========================================================================= */

(function () {
  "use strict";

  const COOLDOWN_MINUTES = 60; // thời gian không hiển thị lại (phút)
  const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;
  const ICON_IMG = "https://i.postimg.cc/bvL7Lbvn/1010-2.jpg";

  // ===================== COUNTDOWN =====================
  function getSecondsUntil4PM() {
    const now = new Date();
    const target = new Date();
    target.setHours(16, 0, 0, 0);
    return Math.max(0, Math.floor((target - now) / 1000));
  }

  function startCountdown() {
    const el = document.getElementById("voucherCountdown");
    if (!el) return;
    let seconds = getSecondsUntil4PM();

    function formatTime(s) {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return `${h > 0 ? h + " giờ " : ""}${m} phút ${sec < 10 ? "0" : ""}${sec} giây`;
    }

    el.textContent = `SẼ HẾT SAU ${formatTime(seconds)}`;
    const interval = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(interval);
        el.textContent = "ĐÃ KẾT THÚC!";
        el.style.color = "#e53935";
      } else {
        el.textContent = `SẼ HẾT SAU ${formatTime(seconds)}`;
      }
    }, 1000);
  }

  // ===================== POPUP =====================
  function showVoucherPopup() {
    if (document.getElementById("voucherPopup")) return;

    const popup = document.createElement("div");
    popup.id = "voucherPopup";
    popup.className = "voucher-popup";

    popup.innerHTML = `
      <div class="voucher-content">
        <div class="voucher-close" id="closeVoucherBtn">×</div>
        <h2>FLASH SALE 10/10</h2>
        <ul>
          <li>FREESHIP TOÀN BỘ ĐƠN HÀNG</li>
          <li>GIẢM GIÁ 5% TOÀN BỘ WEBSITE</li>
          <li>GIẢM 8% VỚI ĐƠN HÀNG TRÊN 1.500.000Đ</li>
        </ul>
        <p id="voucherCountdown" style="color:#e53935; font-weight:bold; margin-top:8px;">...</p>
        <button id="applyVoucherBtn">LẤY VOUCHER</button>
      </div>
    `;

    document.body.appendChild(popup);
    document.getElementById("closeVoucherBtn").addEventListener("click", () => popup.remove());
    document.getElementById("applyVoucherBtn").addEventListener("click", () => {
      popup.remove();
      localStorage.setItem("voucher1010Shown", String(Date.now()));
    });

    startCountdown();
  }

  // ===================== FLOAT ICON =====================
  function createFloatingIcon() {
    if (document.getElementById("voucherFloatIcon")) return;

    const icon = document.createElement("div");
    icon.id = "voucherFloatIcon";
    icon.innerHTML = `
      <div class="voucher-float-img-wrapper">
        <img src="${ICON_IMG}" alt="voucher flash sale" />
        <div class="voucher-float-close" id="closeVoucherIcon">×</div>
      </div>
    `;
    document.body.appendChild(icon);

    icon.addEventListener("click", (e) => {
      if (e.target.id !== "closeVoucherIcon") {
        showVoucherPopup();
      }
    });

    document.getElementById("closeVoucherIcon").addEventListener("click", (e) => {
      e.stopPropagation();
      icon.remove();
    });
  }

  // ===================== STYLE =====================
  const style = document.createElement("style");
  style.textContent = `
    .voucher-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      color: #000;
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 20px 24px;
      width: 90%;
      max-width: 340px;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      font-family: "Be Vietnam Pro", sans-serif;
      text-align: left;
      text-transform: uppercase;
    }
    .voucher-content h2 {
      text-align: center;
      font-size: 20px;
      margin-bottom: 12px;
    }
    .voucher-content ul {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }
    .voucher-content ul li::before {
      content: "• ";
      color: #000;
      font-weight: bold;
    }
    .voucher-content ul li {
      margin: 4px 0;
      font-size: 15px;
    }
    #voucherCountdown {
      text-align: center;
      font-size: 15px;
      margin-top: 10px;
    }
    #applyVoucherBtn {
      display: block;
      margin: 12px auto 0;
      background: orange;
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 15px;
    }
    .voucher-close {
      position: absolute;
      top: 6px;
      right: 10px;
      cursor: pointer;
      font-size: 20px;
      color: #666;
    }
    #voucherFloatIcon {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9998;
      cursor: pointer;
    }
    .voucher-float-img-wrapper {
      position: relative;
      display: inline-block;
    }
    .voucher-float-img-wrapper img {
      width: 120px;
      height: auto;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    .voucher-float-close {
      position: absolute;
      top: 2px;
      right: 6px;
      font-size: 18px;
      color: #fff;
      background: rgba(0,0,0,0.5);
      border-radius: 50%;
      width: 22px;
      height: 22px;
      text-align: center;
      line-height: 20px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // ===================== KHỞI CHẠY =====================
  function initVoucherPopup() {
    const lastShown = Number(localStorage.getItem("voucher1010Shown") || 0);
    if (Date.now() - lastShown < COOLDOWN_MS) {
      console.log("⏳ Trong thời gian cooldown, chưa hiển lại popup.");
      return;
    }
    createFloatingIcon();
    showVoucherPopup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVoucherPopup);
  } else {
    initVoucherPopup();
  }
})();
