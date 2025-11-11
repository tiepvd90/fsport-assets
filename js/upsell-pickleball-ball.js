(function () {
  "use strict";

  // === Inject CSS ===
  const style = document.createElement("style");
  style.textContent = `
  /* === Upsell Pickleball Ball CSS === */
  .popup-success {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  }
  .popup-box {
    background:#fff;
    border-radius:14px;
    text-align:center;
    max-width:360px;
    width:92%;
    box-shadow:0 6px 24px rgba(0,0,0,0.25);
    overflow:hidden;
    animation:fadeInUp .4s ease;
  }
  @keyframes fadeInUp {
    from{transform:translateY(10px);opacity:0;}
    to{transform:translateY(0);opacity:1;}
  }
  .popup-top {
    padding:20px 18px 16px;
    background:#f9f9f9;
    border-bottom:1px solid #eee;
  }
  .popup-top h4 {
    margin:0 0 8px;
    font-size:17px;
    color:#111;
  }
  .popup-top p {
    font-size:14px;
    color:#444;
    margin:0;
  }
  .popup-bottom {
    padding:18px 20px 22px;
  }
  .upsell-combined {
    font-size:14px;
    color:#111;
    font-weight:500;
    margin-bottom:10px;
  }
  .popup-bottom img {
    width:110px;
    margin:0 auto 10px;
    border-radius:10px;
    display:block;
  }
  .combo-grid {
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:8px;
    margin-bottom:14px;
  }
  .combo-btn {
    background:#fdfdfd;
    border:1px solid #ccc;
    border-radius:8px;
    padding:10px 0;
    font-size:13px;
    cursor:pointer;
    transition:.25s;
    color:#111;
  }
  .combo-btn.active {
    border:2px solid #e53935;
    background:#fff5f5;
  }
  .combo-label {
    font-weight:600;
    display:block;
    margin-bottom:2px;
  }
  .combo-btn .old {
    font-size:12px;
    color:#666;
    text-decoration:line-through;
    margin-right:4px;
  }
  .combo-btn .new {
    font-size:14px;
    color:#e53935;
    font-weight:600;
  }
  .action-row {
    display:flex;
    gap:8px;
  }
  .confirm-btn,
  .close-btn {
    flex:1;
    border:none;
    border-radius:6px;
    padding:10px 0;
    font-weight:600;
    cursor:pointer;
    font-size:14px;
  }
  .confirm-btn {
    background:#e53935;
    color:#fff;
    opacity:.6;
  }
  .confirm-btn.enabled {opacity:1;}
  .close-btn {
    background:#000;
    color:#fff;
  }
  .close-btn:hover,
  .confirm-btn:hover {opacity:.85;}
  `;
  document.head.appendChild(style);

  // === Inject HTML ===
  const popupHTML = `
  <div class="popup-success" id="upsellBallPopup">
    <div class="popup-box">
      <div class="popup-top">
        <h4>🎁 Ưu đãi đặc biệt cho khách hàng F-SPORT</h4>
        <p>Giảm <strong>10%</strong> khi mua thêm bóng thi đấu <strong>F-SPORT PRO</strong></p>
      </div>
      <div class="popup-bottom">
        <img src="/assets/images/gallery/pickleball/pickleball-ball/2.webp" alt="Bóng Pickleball F-Sport Pro">
        <div class="combo-grid">
          <button class="combo-btn" data-label="3 quả" data-old="87000" data-new="78300">
            <span class="combo-label">Mua 3 quả</span><span class="old">87.000đ</span><span class="new">78.300đ</span>
          </button>
          <button class="combo-btn" data-label="6 quả" data-old="156000" data-new="140400">
            <span class="combo-label">Mua 6 quả</span><span class="old">156.000đ</span><span class="new">140.400đ</span>
          </button>
          <button class="combo-btn" data-label="9 quả" data-old="210000" data-new="189000">
            <span class="combo-label">Mua 9 quả</span><span class="old">210.000đ</span><span class="new">189.000đ</span>
          </button>
          <button class="combo-btn" data-label="12 quả" data-old="252000" data-new="226800">
            <span class="combo-label">Mua 12 quả</span><span class="old">252.000đ</span><span class="new">226.800đ</span>
          </button>
        </div>
        <div class="action-row">
          <button class="confirm-btn" id="confirmUpsellBall" disabled>XÁC NHẬN</button>
          <button class="close-btn" id="closeUpsellBall">ĐÓNG</button>
        </div>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML("beforeend", popupHTML);

  // === JS Logic ===
  let selectedCombo = null;
  const popup = document.getElementById("upsellBallPopup");
  const confirmBtn = document.getElementById("confirmUpsellBall");
  const closeBtn = document.getElementById("closeUpsellBall");

  // Xử lý chọn combo
  document.querySelectorAll(".combo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".combo-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCombo = {
        label: btn.dataset.label,
        oldPrice: parseFloat(btn.dataset.old),
        newPrice: parseFloat(btn.dataset.new)
      };
      confirmBtn.disabled = false;
      confirmBtn.classList.add("enabled");
    });
  });

  // Xử lý xác nhận mua upsell
  confirmBtn.addEventListener("click", () => {
    if (!selectedCombo) return alert("Vui lòng chọn combo trước.");
    const payload = {
      type: "upsell",
      product: "Bóng F-Sport Pro",
      combo: selectedCombo.label,
      original_price: selectedCombo.oldPrice,
      price: selectedCombo.newPrice,
      date: new Date().toLocaleString("vi-VN"),
      source: "Kích hoạt bảo hành - upsell fun-sport.co"
    };
    fetch("https://hook.eu2.make.com/dxl7ngaypediyxwb8g7jir704356vhjt", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    })
      .then(() => {
        alert("✅ Cảm ơn anh/chị! Ưu đãi đã được ghi nhận.");
        popup.style.display = "none";
      })
      .catch(() => alert("Lỗi mạng, vui lòng thử lại sau."));
  });

  // Nút đóng
  closeBtn.addEventListener("click", () => popup.style.display = "none");

  // Hàm public để gọi hiển thị popup
  window.showUpsellPickleballBall = function () {
    popup.style.display = "flex";
  };
})();
