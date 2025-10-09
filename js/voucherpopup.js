/* =========================================================================
 * voucherpopup.js — FLASH SALE 10/10 (hiển thị theo style cũ)
 * - Giao diện nền xanh & chữ trắng (giống bản voucher 30K cũ)
 * - Hiệu ứng slide-up khi mở
 * - Giữ nguyên logic mới (đếm ngược đến 4PM, label truyền sang cartpopup)
 * ========================================================================= */

(function () {
  "use strict";

  if (typeof fetchVoucherMap !== "function") {
    window.fetchVoucherMap = () => Promise.resolve({});
  }

  // Countdown tới 16:00 hôm nay
  function getSecondsUntil4PM() {
    const now = new Date();
    const target = new Date();
    target.setHours(16, 0, 0, 0);
    return Math.max(0, Math.floor((target - now) / 1000));
  }

  function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

  // Popup Flash Sale 10/10
  function showVoucherPopup() {
    if (document.getElementById("voucherPopup")) return;

    const popup = document.createElement("div");
    popup.className = "voucher-popup";
    popup.id = "voucherPopup";
    popup.innerHTML = `
      <div class="voucher-overlay"></div>
      <div class="voucher-content">
        <div class="voucher-close" id="closeVoucherBtn">×</div>
        <h2>🔥 FLASH SALE 10/10 🔥</h2>
        <p>FreeShip toàn bộ đơn hàng 🎁</p>
        <p>Giảm <strong>5%</strong> toàn website</p>
        <p>Giảm <strong>8%</strong> cho đơn từ <strong>1.500.000₫</strong></p>
        <p><em id="voucherCountdown"></em></p>
        <button id="applyVoucherBtn">ĐÃ HIỂU</button>
      </div>
    `;
    document.body.appendChild(popup);

    // Thêm CSS style giống bản cũ
    const style = document.createElement("style");
    style.innerHTML = `
      .voucher-popup {
        position: fixed;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        z-index: 9999;
        animation: slideUp 0.35s ease-out forwards;
      }
      .voucher-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.4);
      }
      .voucher-content {
        position: relative;
        background: linear-gradient(160deg, #1565c0, #1e88e5);
        color: #fff;
        padding: 24px 20px 28px;
        width: 90%;
        max-width: 400px;
        margin-bottom: 8%;
        border-radius: 12px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.3);
        text-align: center;
        font-family: "Be Vietnam Pro", sans-serif;
        transform: translateY(50px);
        opacity: 0;
        animation: popupFadeIn 0.4s ease-out forwards;
      }
      .voucher-close {
        position: absolute;
        top: 8px;
        right: 12px;
        font-size: 22px;
        font-weight: bold;
        cursor: pointer;
      }
      .voucher-content h2 {
        font-size: 22px;
        margin-bottom: 10px;
        font-weight: 800;
      }
      .voucher-content p {
        margin: 6px 0;
        font-size: 16px;
      }
      #voucherCountdown {
        font-style: italic;
        color: #fff;
        font-weight: 500;
      }
      #applyVoucherBtn {
        margin-top: 14px;
        background: #fff;
        color: #1565c0;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        padding: 10px 22px;
        font-size: 16px;
        cursor: pointer;
      }
      @keyframes popupFadeIn {
        from { opacity: 0; transform: translateY(50px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideUp {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

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

  // Icon nổi
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
        cursor:pointer;">
        <img src="https://i.postimg.cc/bvL7Lbvn/1010-2.jpg" alt="Flash Sale 10/10" style="
          width:60px;
          height:auto;
          border-radius:8px;
          box-shadow:0 4px 8px rgba(0,0,0,0.25);" />
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
          font-size:13px;">×</div>
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

  // Hiển thị popup & icon ngay khi load
  function runFlashSaleVoucher() {
    createVoucherFloatingIcon();
    showVoucherPopup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFlashSaleVoucher);
  } else {
    runFlashSaleVoucher();
  }

  // Khi đóng checkout → hiện lại popup
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
