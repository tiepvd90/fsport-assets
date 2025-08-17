// supportchat.js – Tự động hiện popup tư vấn khi khách đóng giỏ hàng
(function supportChatInit() {
  const WEBHOOK_URL = "https://hook.eu2.make.com/jxjqljoheym4735mevg8fedk93x74301";
  //const COOLDOWN_MS = 10 * 1000;
  const COOLDOWN_MS = 1 * 60 * 60 * 1000;
  const MAX_RETRIES = 20;

  let retryCount = 0;

  function waitForCloseButton() {
    const btn = document.querySelector(".checkout-close");
    if (btn) {
      console.log("✅ Found .checkout-close, binding click handler");
      btn.addEventListener("click", onCloseClicked);
    } else if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log("🔄 Waiting for .checkout-close… retry", retryCount);
      setTimeout(waitForCloseButton, 500);
    } else {
      console.warn("❌ Could not find .checkout-close after retries.");
    }
  }

  function onCloseClicked() {
    console.log("🛑 User clicked close on checkoutpopup");

    setTimeout(() => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      console.log("🧾 Current cart:", cart);

      if (!cart.length) {
        console.log("❌ Cart is empty – not showing support popup.");
        return;
      }

      const lastShown = Number(sessionStorage.getItem("supportLastShown") || 0);
      const timeSince = Date.now() - lastShown;

      console.log("⏱ Last shown", timeSince / 1000, "seconds ago");

      if (timeSince < COOLDOWN_MS) {
        console.log("⏳ Still within 4h cooldown.");
        return;
      }

      sessionStorage.setItem("supportLastShown", String(Date.now()));
      showSupportChatPopup();
    }, 300);
  }

  function showSupportChatPopup() {
    if (document.getElementById("supportChatPopup")) return;

    const style = document.createElement("style");
    style.textContent = `
      #supportChatPopup {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: rgba(255,255,255,0.95);
        border-radius: 12px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.15);
        z-index: 9999;
        font-family: 'Be Vietnam Pro', sans-serif;
        overflow: hidden;
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }

      #supportChatPopupHeader {
        background: #f2f2f2;
        padding: 10px 12px;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #supportChatPopup textarea,
      #supportChatPopup input {
        width: 100%;
        box-sizing: border-box;
        font-size: 14px;
        margin: 8px 0;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        resize: none;
      }

      #supportChatPopup .btnRow {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 10px;
      }

      #supportChatPopup button {
        padding: 8px 12px;
        font-size: 13px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: 600;
      }

      #supportChatPopup .sendBtn {
        background: #111;
        color: #fff;
      }

      #supportChatPopup .closeBtn {
        background: #eee;
        color: #333;
      }
    `;
    document.head.appendChild(style);

    const box = document.createElement("div");
    box.id = "supportChatPopup";
    box.innerHTML = `
      <div id="supportChatPopupHeader">
        <span>💬 Anh/chị cần hỗ trợ gì không ạ?</span>
        <button onclick="document.getElementById('supportChatPopup').remove()" style="background: none; border: none; font-size: 16px;">×</button>
      </div>
      <div style="padding: 10px 12px;">
        <textarea id="supportMessage" rows="3" placeholder="Câu hỏi của anh/chị..."></textarea>
        <input id="supportPhone" type="tel" placeholder="SĐT/Email(không bắt buộc)">
      </div>
      <div class="btnRow">
        <button class="closeBtn" onclick="document.getElementById('supportChatPopup').remove()">Đóng</button>
        <button class="sendBtn" onclick="sendSupportMessage()">GỬI</button>
      </div>
    `;
    document.body.appendChild(box);
  }

  // Gửi về Make.com webhook
  window.sendSupportMessage = function () {
    const msg = (document.getElementById("supportMessage")?.value || "").trim();
    const phone = (document.getElementById("supportPhone")?.value || "").trim();

    if (!msg) {
      alert("Vui lòng nhập nội dung hỗ trợ!");
      return;
    }

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "checkout_close_support",
        message: msg,
        phone: phone,
        cart: JSON.parse(localStorage.getItem("cart") || "[]"),
        timestamp: new Date().toLocaleString()
      })
    });

    // Thông báo đã gửi
    const box = document.getElementById("supportChatPopup");
    if (box) {
      box.innerHTML = `
        padding: 16px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 10px;
  background: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          ✅ Bên em đã nhận được câu hỏi và sẽ phản hồi sớm ạ.<br>
          Nếu cần gấp, vui lòng gọi <strong>038.4735.980</strong>
        </div>
      `;
      setTimeout(() => box.remove(), 6000);
    }
  };

  // Bắt đầu tìm nút
  waitForCloseButton();
})();
