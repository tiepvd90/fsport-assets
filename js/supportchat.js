// ✅ supportchat.js - hỗ trợ khách khi đóng checkoutpopup

(function () {
  const WEBHOOK_URL = "https://hook.eu2.make.com/jxjqljoheym4735mevg8fedk93x74301";
  const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 giờ

  // Lắng sự kiện đóng checkoutpopup
  document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.querySelector(".checkout-close");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        setTimeout(() => {
          if (shouldShowSupportPopup()) {
            showSupportChatPopup();
            markSupportPopupShown();
          }
        }, 300);
      });
    }
  });

  function shouldShowSupportPopup() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!cart.length) return false;

    const lastShown = Number(sessionStorage.getItem("supportLastShown") || 0);
    return Date.now() - lastShown > COOLDOWN_MS;
  }

  function markSupportPopupShown() {
    sessionStorage.setItem("supportLastShown", String(Date.now()));
  }

  // Tạo và hiển thị popup hỗ trợ
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
        animation: slideUp 0.4s ease;
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
        <input id="supportPhone" type="tel" placeholder="SĐT (không bắt buộc)">
      </div>
      <div class="btnRow">
        <button class="closeBtn" onclick="document.getElementById('supportChatPopup').remove()">Đóng</button>
        <button class="sendBtn" onclick="sendSupportMessage()">GỬI</button>
      </div>
    `;
    document.body.appendChild(box);
  }

  // Gửi dữ liệu về Make.com
  window.sendSupportMessage = function () {
    const msg = (document.getElementById("supportMessage")?.value || "").trim();
    const phone = (document.getElementById("supportPhone")?.value || "").trim();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (!msg) {
      alert("Anh/chị vui lòng nhập nội dung cần hỗ trợ!");
      return;
    }

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "checkout_close_support",
        message: msg,
        phone: phone,
        cart: cart,
        timestamp: new Date().toLocaleString()
      })
    });

    // Cảm ơn và đóng
    document.getElementById("supportChatPopup").innerHTML = `
      <div style="padding: 16px; font-size: 14px; text-align: center;">
        ✅ Bên em đã nhận được câu hỏi và sẽ phản hồi sớm ạ.<br>
        Nếu cần gấp, anh/chị có thể gọi trực tiếp: <strong>0868.xxx.xxx</strong>
      </div>
    `;
    setTimeout(() => {
      document.getElementById("supportChatPopup")?.remove();
    }, 6000);
  };
})();
