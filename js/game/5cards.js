/* ============================================================================
   MINI GAME 5 CARDS – FUNSPORT
   Full standalone module: inject HTML + load CSS + run game logic
   ============================================================================ */

(function () {
  const CSS_PATH = "/css/minigame-5cards.css";
  const POPUP_CSS = "/css/popupmessage.css";
  const WEBHOOK = "https://hook.eu2.make.com/xcg5fqxpp9wnl0d9wiik9tgu5k85a7vc";

  /* ------------------------------------------------------
     1) AUTO-LOAD CSS (popupmessage + game CSS)
  ------------------------------------------------------ */
  function loadCss(url) {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  }

  loadCss(POPUP_CSS);
  loadCss(CSS_PATH);

  /* ------------------------------------------------------
     2) HTML TEMPLATE – Inject FULL Markup
  ------------------------------------------------------ */
  const gameHTML = `
    <section id="fs-5cards-game">
      <h1 class="fs-5cards-title">Mini Game 5 Cards – Ngũ Hành May Mắn</h1>
      <p class="fs-5cards-desc">
        Chọn 1 lá bài bất kỳ để mở quà dành riêng cho vợt F-Sport Active & Fastblock.
      </p>

      <div class="fs-card-wrap" id="fs-card-wrap"></div>

      <p class="fs-game-note" style="text-align:center; font-size:11px; color:#777; margin-top:14px;">
        Mỗi người nên chơi 1 lần để đảm bảo công bằng.
      </p>

      <!-- POPUP -->
      <div id="fs-game-popup" class="popup-message">
        <div class="close-btn" onclick="fsClosePopup()">×</div>

        <div class="fs-fireworks">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <h3 id="fs-popup-title">Chúc mừng!</h3>
        <p id="fs-popup-desc"></p>

        <!-- Step 1 -->
        <div id="fs-popup-step1">
          <p style="font-size:13px; color:#555;">
            Nhập tên của bạn để shop lưu quà:
          </p>

          <input id="fs-user-name"
                 type="text"
                 placeholder="VD: Minh Tùng"
                 style="width:96%; max-width:260px; padding:7px 9px; border-radius:6px; border:1px solid #ccc; font-size:13px; margin-bottom:10px;" />

          <button class="btn-ball" id="fs-confirm-btn">Xác nhận</button>
        </div>

        <!-- Step 2 -->
        <div id="fs-popup-step2" style="display:none;">
          <p style="font-size:13px; color:#555; margin-bottom:10px;">
            Quà đã được ghi nhận. Khi đặt vợt Active hoặc Fastblock, shop sẽ tự động áp dụng ưu đãi.
          </p>

          <button class="btn-ball" style="margin-bottom:8px;"
                  onclick="window.location.href='https://fun-sport.co/pickleball/active'">
            Xem Vợt Active & Fastblock
          </button>

          <button class="btn-zalo" onclick="fsClosePopup()">Đóng</button>
        </div>
      </div>
    </section>
  `;

  /* Inject HTML vào cuối body */
  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("fs-5cards");
    document.body.insertAdjacentHTML("beforeend", gameHTML);
    initMiniGame();
  });

  /* ------------------------------------------------------
     3) GAME LOGIC
  ------------------------------------------------------ */
  function initMiniGame() {
    /* ----- DATA ----- */
    const CARD_DATA = [
      { element:"Kim",  label:"KIM",  icon:"⚪", sub:"Sáng, sắc, quyết đoán" },
      { element:"Mộc",  label:"MỘC",  icon:"❃", sub:"Tăng trưởng & linh hoạt" },
      { element:"Thủy", label:"THỦY", icon:"💧", sub:"Mềm mại nhưng mạnh mẽ" },
      { element:"Hỏa",  label:"HỎA",  icon:"🔥", sub:"Nhiệt huyết & bùng nổ" },
      { element:"Thổ",  label:"THỔ",  icon:"⬛", sub:"Vững vàng & ổn định" }
    ];

    const FS_REWARDS = [
      "Combo 6 Bóng PRO Dạ Quang",
      "Túi Pickleball Cao Cấp 270K",
      "Voucher 120.000đ",
      "Voucher 150.000đ"
    ];

    const wrap = document.getElementById("fs-card-wrap");

    /* ----- CARD TEMPLATE ----- */
    CARD_DATA.forEach(c => {
      wrap.insertAdjacentHTML(
        "beforeend",
        `
        <div class="fs-card" data-element="${c.element}">
          <div class="fs-card-inner">
            <div class="fs-card-face fs-card-front">
              <div class="fs-element-label">${c.label}</div>
              <div class="fs-element-icon">${c.icon}</div>
              <div class="fs-element-sub">${c.sub}</div>
            </div>
            <div class="fs-card-face fs-card-back">
              <div class="fs-prize-text"></div>
            </div>
          </div>
        </div>
        `
      );
    });

    /* GAME VARIABLES */
    let fsGameLocked = false;
    let fsChosenReward = "";
    let fsWebhookSent = false;

    const fsPopup = document.getElementById("fs-game-popup");
    const fsPopupDesc = document.getElementById("fs-popup-desc");
    const fsStep1 = document.getElementById("fs-popup-step1");
    const fsStep2 = document.getElementById("fs-popup-step2");
    const fsConfirmBtn = document.getElementById("fs-confirm-btn");
    const fsUserNameInput = document.getElementById("fs-user-name");

    /* ----- CARD CLICK ----- */
    document.querySelectorAll(".fs-card").forEach(card => {
      card.addEventListener("click", () => {
        if (fsGameLocked) return;
        fsGameLocked = true;

        fsChosenReward = FS_REWARDS[Math.floor(Math.random() * FS_REWARDS.length)];
        card.querySelector(".fs-prize-text").textContent = fsChosenReward;

        card.classList.add("flipped");

        document.querySelectorAll(".fs-card").forEach(c => {
          if (c !== card) {
            c.style.pointerEvents = "none";
            c.style.opacity = "0.5";
          }
        });

        setTimeout(() => fsShowPopup(), 600);
      });
    });

    /* ----- POPUP ACTIONS ----- */
    window.fsClosePopup = function() {
      fsPopup.classList.remove("show");
    };

    function fsShowPopup() {
      fsPopupDesc.innerHTML = `<b>${fsChosenReward}</b>`;
      fsStep1.style.display = "block";
      fsStep2.style.display = "none";
      fsConfirmBtn.disabled = false;
      fsPopup.classList.add("show");
    }

    /* ----- CONFIRM NAME → WEBHOOK ----- */
    fsConfirmBtn.addEventListener("click", () => {
      const name = fsUserNameInput.value.trim();
      if (!name) return alert("Bạn chưa nhập tên!");

      fsConfirmBtn.disabled = true;

      fetch(WEBHOOK, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          game: "5cards",
          reward: fsChosenReward,
          name: name,
          ts: new Date().toISOString(),
          ua: navigator.userAgent
        })
      })
      .then(() => fsGoToStep2())
      .catch(() => {
        alert("Lỗi kết nối. Hãy thử lại.");
        fsConfirmBtn.disabled = false;
      });
    });

    function fsGoToStep2() {
      fsStep1.style.display = "none";
      fsStep2.style.display = "block";
    }
  }
})();
