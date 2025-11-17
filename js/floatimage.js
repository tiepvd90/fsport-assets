/* ============================================================================
   MINI GAME 5 CARDS – FUNSPORT
   Full merged version (icon + popup + logic)
   ============================================================================ */

(function () {
  const ICON_ID = "voucherFloatIcon";
  const POPUP_ID = "voucherPopup";
  const CSS_POPUP = "/css/popupmessage.css";
  const CSS_GAME = "/css/minigame-5cards.css";
  const WEBHOOK = "https://hook.eu2.make.com/xcg5fqxpp9wnl0d9wiik9tgu5k85a7vc";
  const IMG_FLOAT = "https://i.postimg.cc/mrRwQS8h/cards.webp";

  /* -----------------------------------
     1) Inject CSS
  ----------------------------------- */
  function loadCss(url) {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = url;
      document.head.appendChild(css);
    }
  }

  loadCss(CSS_POPUP);
  loadCss(CSS_GAME);

  /* -----------------------------------
     2) FLOAT ICON
  ----------------------------------- */
  if (!document.getElementById(ICON_ID)) {
    const icon = document.createElement("div");
    icon.id = ICON_ID;

    icon.innerHTML = `
      <div class="float-img-wrapper" style="position:relative;">
        <img src="${IMG_FLOAT}" 
             alt="5 Cards Game" 
             style="width:80px; display:block; border-radius:0;">
        <div id="closeVoucherFloat"
             style="
               position:absolute; top:-10px; right:-10px;
               width:22px; height:22px;
               font-size:14px; line-height:22px;
               text-align:center;
               background:#000; color:#fff;
               border-radius:50%; cursor:pointer;
               z-index:20;
             ">×</div>
      </div>
    `;

    document.body.appendChild(icon);
  }

  /* -----------------------------------
     3) POPUP KHUNG TRỐNG
  ----------------------------------- */
  if (!document.getElementById(POPUP_ID)) {
    const popup = document.createElement("div");
    popup.className = "popup-message";
    popup.id = POPUP_ID;

    popup.innerHTML = `
      <div id="closeVoucherPopup"
           style="
             position:absolute; top:-4px; right:-4px;
             background:#000; color:#fff;
             width:34px; height:34px;
             border-radius:50%;
             font-size:20px; font-weight:bold;
             line-height:32px; text-align:center;
             cursor:pointer; z-index:20;
           ">×</div>

      <div id="gameContainer" style="padding:10px;">
        Đang tải mini game...
      </div>
    `;

    document.body.appendChild(popup);
  }

  /* -----------------------------------
     4) EVENT FLOAT ICON
  ----------------------------------- */
  document.getElementById("closeVoucherFloat").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById(ICON_ID)?.remove();
  });

  document.getElementById(ICON_ID).addEventListener("click", (e) => {
  if (e.target.id === "closeVoucherFloat") return;

  // mở popup
  document.getElementById(POPUP_ID).classList.add("show");

  // ẨN popup “Chúc mừng!” cho đến khi lật thẻ
  const inner = document.getElementById("fs-game-popup-inner");
  if (inner) inner.style.display = "none";
});


  document.getElementById("closeVoucherPopup").addEventListener("click", () => {
    document.getElementById(POPUP_ID).classList.remove("show");
  });

  /* -----------------------------------
     ⭐ 5) RENDER GAME VÀO POPUP
  ----------------------------------- */
  const gameHTML = `
    <section id="fs-5cards-game">
      <h1 class="fs-5cards-title">Mini Game 5 Cards – Ngũ Hành May Mắn</h1>
      <p class="fs-5cards-desc">
        Chọn 1 lá bài để mở quà dành riêng cho vợt <b>Active hoặc Fastblock</b>.
      </p>

      <div class="fs-card-wrap" id="fs-card-wrap"></div>

      <p class="fs-game-note" style="text-align:center; font-size:11px; color:#777; margin-top:14px;">
        Mỗi người nên chơi 1 lần để đảm bảo công bằng.
      </p>

      <div id="fs-game-popup-inner">
        <div class="fs-fireworks">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <h3 id="fs-popup-title">Chúc mừng!</h3>
        <p id="fs-popup-desc"></p>

        <!-- Step 1 -->
        <div id="fs-popup-step1">
          <p style="font-size:13px; color:#555;">Nhập tên của bạn để shop lưu quà:</p>

          <input id="fs-user-name"
                 type="text"
                 placeholder="VD: Minh Tùng"
                 style="width:96%; max-width:260px; padding:7px 9px; border-radius:6px; border:1px solid #ccc; font-size:13px; margin-bottom:10px;" />

          <button class="btn-ball" id="fs-confirm-btn">Xác nhận</button>
        </div>

        <!-- Step 2 -->
        <div id="fs-popup-step2" style="display:none;">
          <p style="font-size:13px; color:#555; margin-bottom:10px;">
            Quà đã được ghi nhận. Khi đặt vợt Active hoặc Fastblock, shop sẽ tự áp dụng ưu đãi.
          </p>

          <button class="btn-ball" style="margin-bottom:8px;"
                  onclick="window.location.href='https://fun-sport.co/pickleball/active'">
            Xem Vợt Active & Fastblock
          </button>

          <button class="btn-zalo" onclick="document.getElementById('${POPUP_ID}').classList.remove('show')">
            Đóng
          </button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("gameContainer").innerHTML = gameHTML;

  /* -----------------------------------
     6) GAME LOGIC
  ----------------------------------- */
  initMiniGame();

  function initMiniGame() {
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
      "Voucher 150.000đ",
      "Voucher 100.000đ"
    ];

    const wrap = document.getElementById("fs-card-wrap");

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

    let fsGameLocked = false;
    let fsChosenReward = "";

    const fsPopupDesc = document.getElementById("fs-popup-desc");
    const fsStep1 = document.getElementById("fs-popup-step1");
    const fsStep2 = document.getElementById("fs-popup-step2");
    const fsConfirmBtn = document.getElementById("fs-confirm-btn");
    const fsUserNameInput = document.getElementById("fs-user-name");

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

        setTimeout(() => showPopup(), 600);
      });
    });

    function showPopup() {
  // Hiện phần “Chúc mừng!”
  const inner = document.getElementById("fs-game-popup-inner");
  if (inner) inner.style.display = "block";

  fsPopupDesc.innerHTML = `<b>${fsChosenReward}</b>`;
  fsStep1.style.display = "block";
  fsStep2.style.display = "none";
  fsConfirmBtn.disabled = false;
}

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
      .then(() => gotoStep2())
      .catch(() => {
        alert("Lỗi kết nối. Hãy thử lại.");
        fsConfirmBtn.disabled = false;
      });
    });

    function gotoStep2() {
      fsStep1.style.display = "none";
      fsStep2.style.display = "block";
    }
  }
})();
