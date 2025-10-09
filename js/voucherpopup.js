/* =========================================================================
 * flashsale-popup.js — MINI WHITE EDITION (DISPLAY ONLY)
 * - Popup nhỏ ở giữa, nền trắng tinh, viền xám nhạt
 * - Toàn bộ text ĐEN + UPPERCASE, căn trái, dạng bullet
 * - Dòng cuối (countdown) cam đậm
 * - KHÔNG truyền bất kỳ dữ liệu nào sang cartpopup/localStorage
 * - Hiệu ứng mở (fade+slide) và tắt (fadeOut)
 * ========================================================================= */

(function () {
  "use strict";

  // ========== COUNTDOWN TỚI 16:00 HÔM NAY ==========
  function secondsUntil4PM() {
    const now = new Date();
    const target = new Date();
    target.setHours(16, 0, 0, 0);
    const diff = Math.floor((target - now) / 1000);
    return diff > 0 ? diff : 0;
  }

  function fmt(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function startCountdown() {
    const el = document.getElementById("fsCountdown");
    if (!el) return;
    let remain = secondsUntil4PM();
    el.textContent = `FLASH SALE KẾT THÚC SAU: ${fmt(remain)}`;
    const timer = setInterval(() => {
      remain--;
      if (remain <= 0) {
        clearInterval(timer);
        el.textContent = "FLASH SALE ĐÃ KẾT THÚC";
      } else {
        el.textContent = `FLASH SALE KẾT THÚC SAU: ${fmt(remain)}`;
      }
    }, 1000);
  }

  // ========== POPUP ==========
  function showFlashSalePopup() {
    if (document.getElementById("fsPopupRoot")) return;

    const root = document.createElement("div");
    root.id = "fsPopupRoot";
    root.innerHTML = `
      <div id="fsOverlay" style="
        position:fixed; inset:0; z-index:9999;
        background:rgba(0,0,0,0.35);
        display:flex; align-items:center; justify-content:center;
        animation:fsFadeIn 0.25s ease-out forwards;
      ">
        <div id="fsCard" style="
          background:#ffffff;
          border:1px solid #e5e7eb;
          border-radius:14px;
          width:88%;
          max-width:280px;         /* nhỏ gọn chiều ngang */
          max-height:70vh;         /* co chiều dọc */
          padding:16px 16px 14px;
          box-shadow:0 6px 18px rgba(0,0,0,0.12);
          font-family:'Be Vietnam Pro',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
          color:#111827;
          text-transform:uppercase;  /* tất cả chữ uppercase */
          text-align:left;           /* căn trái */
          position:relative;
          transform:translateY(28px);
          opacity:0;
          animation:fsSlideUp 0.32s ease-out forwards;
        ">
          <button id="fsClose" aria-label="Đóng" style="
            position:absolute; top:6px; right:8px;
            width:28px; height:28px; line-height:28px;
            background:transparent; border:none; cursor:pointer;
            color:#6b7280; font-size:22px; font-weight:600;
          ">&times;</button>

          <div style="font-weight:800; font-size:14px; letter-spacing:0.3px; margin:2px 0 10px;">
            💙 FLASH SALE 10/10 💙
          </div>

          <ul style="
            margin:0; padding-left:18px;
            list-style: disc; 
            font-size:13px; line-height:1.55;
          ">
            <li>Miễn phí vận chuyển toàn bộ đơn hàng</li>
            <li>Giảm 5% toàn website</li>
            <li>Giảm 8% cho đơn từ 1.500.000₫</li>
          </ul>

          <div id="fsCountdown" style="
            margin-top:12px; 
            font-size:12.5px; 
            font-weight:700; 
            color:#d97706; /* cam đậm */
            letter-spacing:0.2px;
          "></div>

          <button id="fsOk" style="
            margin-top:12px;
            background:#111827; color:#ffffff;
            border:1px solid #111827;
            padding:8px 12px; border-radius:8px;
            font-size:12px; font-weight:700; cursor:pointer;
            letter-spacing:0.3px;
          ">ĐÓNG</button>
        </div>
      </div>

      <style>
        @keyframes fsSlideUp {
          from { transform:translateY(40px); opacity:0; }
          to   { transform:translateY(0);     opacity:1; }
        }
        @keyframes fsFadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes fsFadeOut {
          from { opacity:1; transform:translateY(0); }
          to   { opacity:0; transform:translateY(30px); }
        }
      </style>
    `;

    document.body.appendChild(root);
    startCountdown();

    function closeWithAnim() {
      const overlay = document.getElementById("fsOverlay");
      const card = document.getElementById("fsCard");
      if (!overlay || !card) return;
      card.style.animation = "fsFadeOut 0.28s ease-in forwards";
      overlay.style.animation = "fsFadeOut 0.28s ease-in forwards";
      setTimeout(() => root.remove(), 280);
    }

    document.getElementById("fsClose").addEventListener("click", closeWithAnim);
    document.getElementById("fsOk").addEventListener("click", closeWithAnim);
    // đóng khi click nền mờ (ngoại trừ click vào card)
    document.getElementById("fsOverlay").addEventListener("click", (e) => {
      if (e.target.id === "fsOverlay") closeWithAnim();
    });
  }

  // ========== KHỞI CHẠY ==========
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showFlashSalePopup);
  } else {
    showFlashSalePopup();
  }
})();
