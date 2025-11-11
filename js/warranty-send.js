(function(){
  "use strict";

  // 🔹 Kiểm tra biến sản phẩm truyền vào
  const productName = typeof PRODUCT_NAME !== "undefined" ? PRODUCT_NAME : "Sản phẩm chưa xác định";

  // --- CSS ---
  const style = document.createElement("style");
  style.textContent = `
    .warranty-overlay {
      position: fixed; inset: 0;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(6px);
      display: flex; justify-content: center; align-items: center;
      z-index: 99999; animation: fadeIn .3s ease;
      font-family: 'Be Vietnam Pro', sans-serif;
    }
    @keyframes fadeIn {from{opacity:0;} to{opacity:1;}}
    .warranty-card {
      background: #fff; border-radius: 14px; padding: 28px 24px;
      width: 92%; max-width: 360px; text-align: center;
      box-shadow: 0 6px 24px rgba(0,0,0,0.15);
    }
    .warranty-card h2 { font-size: 18px; margin: 0 0 12px; color: #111; }
    .warranty-card p { font-size: 14px; color: #444; margin: 0 0 16px; }
    .warranty-card input {
      width:100%; border:1px solid #ccc; border-radius:6px;
      padding:10px; font-size:15px; margin-bottom:10px;
      box-sizing:border-box;
    }
    .warranty-card input:focus { outline:none; border-color:#000; }
    .warranty-card button {
      width:100%; background:#000; color:#fff; border:none;
      border-radius:6px; padding:12px; font-weight:600;
      cursor:pointer; transition:.25s;
    }
    .warranty-card button:hover { opacity:.85; }
    .warranty-close {
      position:absolute; top:12px; right:16px; font-size:22px;
      cursor:pointer; color:#666; transition:.25s;
    }
    .warranty-close:hover { color:#000; }
    .warranty-success {
      font-size:15px; color:#2e7d32; font-weight:600;
      margin-top:10px; display:none;
    }
  `;
  document.head.appendChild(style);

  // --- HTML ---
  const html = `
    <div class="warranty-overlay" id="warrantyOverlay">
      <div class="warranty-card">
        <div class="warranty-close" id="closeWarranty">&times;</div>
        <h2>Kích Hoạt Bảo Hành</h2>
        <p>Nhập thông tin của bạn để xác nhận chính hãng cho<br><strong>${productName}</strong></p>
        <form id="warrantyForm">
          <input type="tel" id="phone" name="phone" placeholder="Số điện thoại" required>
          <input type="email" id="email" name="email" placeholder="Email" required>
          <button type="submit">GỬI THÔNG TIN</button>
          <div class="warranty-success" id="successMsg">✅ Đã gửi thành công!</div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  // --- Logic JS ---
  const overlay = document.getElementById("warrantyOverlay");
  const closeBtn = document.getElementById("closeWarranty");
  const form = document.getElementById("warrantyForm");
  const successMsg = document.getElementById("successMsg");

  closeBtn.addEventListener("click", ()=> overlay.remove());

  form.addEventListener("submit", async e=>{
    e.preventDefault();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const payload = {
      type: "warranty",
      product: productName,
      phone,
      email,
      date: new Date().toLocaleString("vi-VN"),
      source: "Kích hoạt bảo hành - fun-sport.co"
    };

    try {
      const res = await fetch("https://hook.eu2.make.com/dxl7ngaypediyxwb8g7jir704356vhjt", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
      if(res.ok){
        successMsg.style.display = "block";
        form.querySelector("button").disabled = true;
        setTimeout(()=> overlay.remove(), 2000);
      } else {
        alert("Không thể gửi thông tin, vui lòng thử lại sau.");
      }
    } catch(err){
      alert("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.");
    }
  });

})();
