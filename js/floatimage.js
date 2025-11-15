/* ============================================================
 * 🎉 POPUP VOUCHER 200K — Chủ Nhật 16/11/2025
 * Dự đoán số cuối giải đặc biệt — gửi webhook Make.com
 * CSS dùng: popupmessage.css
 * ============================================================ */

(function () {
  const ICON_ID = "voucherFloatIcon";
  const POPUP_ID = "voucherPopup";
  const CSS_PATH = "/css/popupmessage.css";
  const WEBHOOK = "https://hook.eu2.make.com/xcg5fqxpp9wnl0d9wiik9tgu5k85a7vc";
  const IMG_FLOAT = "https://i.postimg.cc/YSFkqGRX/voucher200k.webp";

  /* -----------------------------------
     Inject CSS nếu chưa có
  ----------------------------------- */
  if (!document.querySelector(`link[href="${CSS_PATH}"]`)) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = CSS_PATH;
    document.head.appendChild(css);
  }

  /* -----------------------------------
     FLOAT ICON
  ----------------------------------- */
  if (!document.getElementById(ICON_ID)) {
    const icon = document.createElement("div");
    icon.id = ICON_ID;
    icon.innerHTML = `
      <div class="float-img-wrapper" style="position:relative;">
        <img src="${IMG_FLOAT}" alt="Voucher 200k" 
             style="width:65px; border-radius:0; display:block;">
        <div id="closeVoucherFloat"
             style="
               position:absolute; top:-10px; right:-10px;
               width:22px; height:22px;
               font-size:14px; line-height:22px;
               text-align:center; background:#000; color:#fff;
               border-radius:50%; cursor:pointer; z-index:20;
             ">×</div>
      </div>
    `;
    document.body.appendChild(icon);
  }

  /* -----------------------------------
     POPUP FORM
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
             border-radius:50%; font-size:20px;
             font-weight:bold; line-height:32px;
             text-align:center; cursor:pointer; z-index:20;
           ">×</div>

      <h3 style="margin-top:10px;">🎉 CHỦ NHẬT 16/11 – VOUCHER 200K</h3>

      <p>
        Chọn 1 số (0–9) dự đoán số cuối giải đặc biệt <b>18:30</b> – Xổ Số Miền Bắc.
        Nếu trúng → giảm ngay <b>200.000đ</b> khi mua vợt <b>F-SPORT ACTIVE</b>.
      </p>

      <!-- SỐ ĐIỆN THOẠI -->
      <input id="vPhone" type="tel" placeholder="Số điện thoại"
             style="
               width:100%; padding:10px; margin:10px 0;
               border:1px solid #ccc; border-radius:6px;
               font-size:14px; box-sizing:border-box;
             ">

      <!-- LỰA CHỌN SỐ -->
      <p style="font-weight:600; font-size:13px; margin-top:10px;">
        Chọn số may mắn (0–9)
      </p>

      <div id="vNumberGrid"
           style="
             display:grid;
             grid-template-columns: repeat(5,1fr);
             gap:8px; margin-bottom:14px;
           ">
      </div>

      <button id="vSubmitBtn"
              style="
                width:100%; padding:10px;
                background:#d32f2f; color:#fff;
                border:none; border-radius:6px;
                font-size:14px; font-weight:600;
                cursor:pointer; margin-top:6px;
              ">
        THAM GIA NGAY
      </button>

      <!-- LUẬT -->
      <div style="text-align:left; margin-top:14px;
                  font-size:12px; color:#444;">
        <b>📜 Thể lệ:</b>
        <ul style="padding-left:18px; margin:6px 0;">
          <li>Đóng form lúc <b>18:25 – 16/11/2025</b></li>
          <li>Mỗi SĐT = 1 lượt dự đoán</li>
          <li>Trùng SĐT dự đoán nhiều lần sẽ tính lần dự đoán cuối cùng</li>
          <li>Chỉ áp dụng cho đơn đặt trước khi đóng form</li>
        </ul>
      </div>
    `;
    document.body.appendChild(popup);
  }

  /* -----------------------------------
     EVENT
  ----------------------------------- */
  const icon = document.getElementById(ICON_ID);
  const popup = document.getElementById(POPUP_ID);

  // đóng icon
  document.getElementById("closeVoucherFloat").addEventListener("click", (e) => {
    e.stopPropagation();
    icon.remove();
  });

  // mở popup khi click icon
  icon.addEventListener("click", (e) => {
    if (e.target.id === "closeVoucherFloat") return;
    popup.classList.add("show");
  });

  // đóng popup
  document.getElementById("closeVoucherPopup").addEventListener("click", () => {
    popup.classList.remove("show");
  });

  /* -----------------------------------
     GRID 0–9
  ----------------------------------- */
  const numberGrid = document.getElementById("vNumberGrid");
  let selectedNumber = null;

  for (let i = 0; i <= 9; i++) {
    const btn = document.createElement("div");
    btn.textContent = i;
    btn.style.cssText = `
      padding:10px 0;
      background:#f5f5f5;
      border-radius:6px;
      text-align:center;
      font-weight:600;
      font-size:14px;
      cursor:pointer;
    `;
    btn.addEventListener("click", () => {
      numberGrid.querySelectorAll("div").forEach(b => b.style.background = "#f5f5f5");
      btn.style.background = "#ffd4d4";
      selectedNumber = i;
    });
    numberGrid.appendChild(btn);
  }

  /* -----------------------------------
     DISABLE FORM SAU 18:25
  ----------------------------------- */
  function checkDeadline() {
    const now = new Date();
    const deadline = new Date("2025-11-16T18:25:00+07:00");

    if (now > deadline) {
      const submit = document.getElementById("vSubmitBtn");
      submit.disabled = true;
      submit.innerText = "ĐÃ HẾT THỜI GIAN";
      submit.style.background = "#999";
    }
  }

  checkDeadline();
  setInterval(checkDeadline, 15000);

  /* -----------------------------------
     SUBMIT → WEBHOOK
  ----------------------------------- */
  document.getElementById("vSubmitBtn").addEventListener("click", async () => {
    const phone = document.getElementById("vPhone").value.trim();

    if (!phone || phone.length < 8) return alert("SĐT không hợp lệ");
    if (selectedNumber === null) return alert("Vui lòng chọn số dự đoán");

    const payload = {
      event: "voucher200k_16_11_2025",
      phone,
      number: selectedNumber,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      alert("Đăng ký thành công! Chúc bạn may mắn lúc 18:30!");
      popup.classList.remove("show");
    } catch (e) {
      alert("Không gửi được dữ liệu, vui lòng thử lại!");
    }
  });
})();
