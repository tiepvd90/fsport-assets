/* =========================================================================
 * voucherpopup.js — FLASH SALE 10/10 (CLEAN BLUE MINI EDITION)
 * - Popup nhỏ gọn giữa màn hình
 * - Nền xanh nhạt gần trắng
 * - Text đen, dòng đếm ngược màu cam
 * - Auto truyền voucher sang cartpopup khi load
 * - Hiệu ứng mở / tắt mượt
 * ========================================================================= */

(function () {
  "use strict";

  if (typeof fetchVoucherMap !== "function") {
    window.fetchVoucherMap = () => Promise.resolve({});
  }

  // 🔹 Gán voucher tự động ngay khi load
  function applyVoucherAuto() {
    const voucherObj = {
      label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán",
      amount: 0,
    };
    window.__voucherWaiting = voucherObj;
    localStorage.setItem("savedVoucher", JSON.stringify(voucherObj));
  }

  // 🔸 Countdown
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
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
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

  // 🔹 Hiển thị popup
  function showVoucherPopup() {
    if (document.getElementById("voucherPopup")) return;

    const popup = document.createElement("div");
    popup.id = "voucherPopup";
    popup.innerHTML = `
      <div id="voucherOverlay" style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.3);
        z-index:9999;
        display:flex;
        justify-content:center;
        align-items:center;
        animation:fadeIn 0.3s ease-out forwards;
      ">
        <div id="voucherContent" style="
          background:linear-gradient(135deg,#f7fbff,#dbefff);
          color:#111;
          padding:24px 26px;
          border-radius:18px;
          width:90%;
          max-width:320px;
          box-shadow:0 6px 18px rgba(0,0,0,0.15);
          text-align:center;
          font-size:16px;
          font-family:'Be Vietnam Pro',sans-serif;
          position:relative;
          transform:translateY(30px);
          opacity:0;
          animation:slideUp 0.4s ease-out forwards;
        ">
          <div id="closeVoucherBtn" style="
            position:absolute;
            top:8px;
            right:12px;
            font-size:24px;
            cursor:pointer;
            color:#333;
            font-weight:500;
          ">&times;</div>

          <h2 style="margin-bottom:10px;font-size:20px;font-weight:800;letter-spacing:0.3px;color:#1a237e;">
            💙 FLASH SALE 10/10 💙
          </h2>
          <p>Miễn phí vận chuyển toàn bộ đơn hàng</p>
          <p style="font-size:20px; margin:6px 0;">🎁</p>
          <p>Giảm <strong>5%</strong> toàn website</p>
          <p>Giảm <strong>8%</strong> cho đơn từ <strong>1.500.000₫</strong></p>
          <p id="voucherCountdown" style="font-style:italic;margin-top:10px;color:#f59e0b;"></p>

          <button id="applyVoucherBtn" style="
            margin-top:18px;
            background:#1e40af;
            color:#fff;
            border:none;
            padding:10px 24px;
            border-radius:8px;
            font-size:16px;
            font-weight:600;
            cursor:pointer;
            transition:all 0.2s ease;
          ">ĐÃ HIỂU</button>
        </div>
      </div>

      <style>
        @keyframes slideUp {
          from {transform:translateY(50px);opacity:0;}
          to {transform:translateY(0);opacity:1;}
        }
        @keyframes fadeIn {
          from {opacity:0;}
          to {opacity:1;}
        }
        @keyframes fadeOut {
          from {opacity:1;transform:translateY(0);}
          to {opacity:0;transform:translateY(40px);}
        }
      </style>
    `;
    document.body.appendChild(popup);
    startCountdown();

    // 🔸 Hiệu ứng tắt
    function closeWithAnimation() {
      const overlay = document.getElementById("voucherOverlay");
      const content = document.getElementById("voucherContent");
      if (!overlay || !content) return;
      content.style.animation = "fadeOut 0.4s ease-in forwards";
      overlay.style.animation = "fadeOut 0.4s ease-in forwards";
      setTimeout(() => popup.remove(), 400);
    }

    // Nút đóng / Đã hiểu
    document.getElementById("closeVoucherBtn").addEventListener("click", closeWithAnimation);
    document.getElementById("applyVoucherBtn").addEventListener("click", closeWithAnimation);
  }

  // 🔹 Icon nổi góc phải
  function createVoucherFloatingIcon() {
    if (document.getElementById("voucherFloatIcon")) return;
    const icon = document.createElement("div");
    icon.id = "voucherFloatIcon";
    icon.innerHTML = `
      <div style="
        position:fixed;
        top:50%;
        right:10px;
        transform:translateY(-50%);
        z-index:9999;
        cursor:pointer;
      ">
        <img src="https://i.postimg.cc/bvL7Lbvn/1010-2.jpg" alt="Flash Sale 10/10" style="
          width:55px;
          height:auto;
          border-radius:10px;
          box-shadow:0 4px 10px rgba(0,0,0,0.25);
          transition:transform 0.2s ease;
        " id="voucherIconImg"/>
        <div id="closeVoucherIcon" style="
          position:absolute;
          top:-8px;
          right:-8px;
          background:#1e3a8a;
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

    const iconImg = document.getElementById("voucherIconImg");
    iconImg.addEventListener("mouseenter", () => (iconImg.style.transform = "scale(1.08)"));
    iconImg.addEventListener("mouseleave", () => (iconImg.style.transform = "scale(1)"));

    icon.addEventListener("click", (e) => {
      if (e.target.id !== "closeVoucherIcon") showVoucherPopup();
    });
    document.getElementById("closeVoucherIcon").addEventListener("click", (e) => {
      e.stopPropagation();
      icon.remove();
    });
  }

  // 🔸 Khởi chạy
  function runFlashSaleVoucher() {
    applyVoucherAuto(); // Gán voucher tự động
    createVoucherFloatingIcon();
    showVoucherPopup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFlashSaleVoucher);
  } else {
    runFlashSaleVoucher();
  }
})();
