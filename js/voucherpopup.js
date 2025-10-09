/* =========================================================================
 * voucherpopup.js — FLASH SALE 10/10 (SMOOTH BLUE EDITION)
 * - Nền xanh blue siêu nhạt, chữ trắng
 * - Dòng đồng hồ cam nhẹ
 * - Hiệu ứng slide-up khi mở, fade-out khi tắt
 * - Có icon nổi góc phải
 * ========================================================================= */

(function () {
  "use strict";

  if (typeof fetchVoucherMap !== "function") {
    window.fetchVoucherMap = () => Promise.resolve({});
  }

  // ====== ⏰ Đếm ngược tới 16:00 hôm nay ======
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

  // ====== 🎁 Hiển thị popup ======
  function showVoucherPopup() {
    if (document.getElementById("voucherPopup")) return;

    const popup = document.createElement("div");
    popup.id = "voucherPopup";
    popup.innerHTML = `
      <div id="voucherOverlay" style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.5);
        z-index:9999;
        display:flex;
        justify-content:center;
        align-items:center;
        animation:fadeIn 0.3s ease-out forwards;
      ">
        <div id="voucherContent" style="
          background:linear-gradient(135deg,#7fc8ff,#2f80ed);
          color:#fff;
          padding:24px;
          border-radius:18px;
          width:90%;
          max-width:380px;
          box-shadow:0 6px 22px rgba(0,0,0,0.25);
          text-align:center;
          font-size:17px;
          font-family:'Be Vietnam Pro',sans-serif;
          position:relative;
          transform:translateY(40px);
          opacity:0;
          animation:slideUp 0.4s ease-out forwards;
        ">
          <div id="closeVoucherBtn" style="
            position:absolute;
            top:8px;
            right:12px;
            font-size:26px;
            cursor:pointer;
            color:#fff;
            font-weight:500;
          ">&times;</div>

          <h2 style="margin-bottom:10px;font-size:22px;font-weight:800;letter-spacing:0.5px;">
            💙 FLASH SALE 10/10 💙
          </h2>
          <p>Miễn phí vận chuyển toàn bộ đơn hàng 🎁</p>
          <p>Giảm <strong>5%</strong> toàn website</p>
          <p>Giảm <strong>8%</strong> cho đơn từ <strong>1.500.000₫</strong></p>
          <p id="voucherCountdown" style="font-style:italic;margin-top:10px;color:#ffd28a;"></p>

          <button id="applyVoucherBtn" style="
            margin-top:20px;
            background:#fff;
            color:#2f80ed;
            border:none;
            padding:12px 26px;
            border-radius:10px;
            font-size:17px;
            font-weight:600;
            cursor:pointer;
            transition:all 0.2s ease;
          ">ĐÃ HIỂU</button>
        </div>
      </div>

      <style>
        @keyframes slideUp {
          from {transform:translateY(60px);opacity:0;}
          to {transform:translateY(0);opacity:1;}
        }
        @keyframes fadeIn {
          from {opacity:0;}
          to {opacity:1;}
        }
        @keyframes fadeOut {
          from {opacity:1;transform:translateY(0);}
          to {opacity:0;transform:translateY(50px);}
        }
      </style>
    `;
    document.body.appendChild(popup);
    startCountdown();

    // ====== Hiệu ứng tắt mượt ======
    function closeWithAnimation() {
      const overlay = document.getElementById("voucherOverlay");
      const content = document.getElementById("voucherContent");
      if (!overlay || !content) return;
      content.style.animation = "fadeOut 0.4s ease-in forwards";
      overlay.style.animation = "fadeOut 0.4s ease-in forwards";
      setTimeout(() => popup.remove(), 400);
    }

    // ====== Sự kiện nút ======
    document.getElementById("closeVoucherBtn").addEventListener("click", closeWithAnimation);
    document.getElementById("applyVoucherBtn").addEventListener("click", () => {
      window.__voucherWaiting = {
        label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán",
      };
      localStorage.setItem(
        "savedVoucher",
        JSON.stringify({ label: "Voucher 10/10 Áp Dụng Ở Bước Thanh Toán" })
      );
      closeWithAnimation();
    });
  }

  // ====== 🌟 Icon nổi bên phải ======
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
          width:60px;
          height:auto;
          border-radius:12px;
          box-shadow:0 4px 10px rgba(0,0,0,0.3);
          transition:transform 0.2s ease;
        " id="voucherIconImg"/>
        <div id="closeVoucherIcon" style="
          position:absolute;
          top:-8px;
          right:-8px;
          background:#2f80ed;
          color:#fff;
          border-radius:50%;
          width:20px;
          height:20px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        ">×</div>
      </div>
    `;
    document.body.appendChild(icon);

    const iconImg = document.getElementById("voucherIconImg");
    iconImg.addEventListener("mouseenter", () => {
      iconImg.style.transform = "scale(1.08)";
    });
    iconImg.addEventListener("mouseleave", () => {
      iconImg.style.transform = "scale(1)";
    });

    icon.addEventListener("click", (e) => {
      if (e.target.id !== "closeVoucherIcon") showVoucherPopup();
    });
    document.getElementById("closeVoucherIcon").addEventListener("click", (e) => {
      e.stopPropagation();
      icon.remove();
    });
  }

  // ====== 🔄 Kích hoạt khi load trang ======
  function runFlashSaleVoucher() {
    createVoucherFloatingIcon();
    showVoucherPopup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFlashSaleVoucher);
  } else {
    runFlashSaleVoucher();
  }

  // ====== Sau khi đóng checkout, hiển thị lại ======
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
