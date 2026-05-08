// PROMO CODE - DÙNG promocode.json, KHÔNG ALERT, KHÔNG ICON, CỘNG DỒN
(function() {
  let currentPromo = null;   // { code, discountPerItem, applicableIds, totalDiscount }
  let promoConfig = [];

  // 1. Tải cấu hình từ file promocode.json (nội bộ)
  fetch("/json/promocode.json")
    .then(res => res.json())
    .then(data => {
      promoConfig = data.promoCodes || [];
      console.log("✅ Promo config loaded from promocode.json:", promoConfig);
      if (currentPromo) updatePromoDiscount();
    })
    .catch(err => console.error("❌ Không thể tải promocode.json:", err));

  // 2. Tính tổng tiền giảm theo số lượng sản phẩm hợp lệ
  function computeTotalDiscount(promoCode, cart) {
    const promo = promoConfig.find(p => p.code === promoCode);
    if (!promo) return 0;
    let totalQty = 0;
    cart.forEach(item => {
      if (promo.applicableProductIds.includes(item.id)) {
        totalQty += (item.quantity || 1);
      }
    });
    return totalQty * (promo.discount || 0);
  }

  // 3. Cập nhật lại tổng discount khi giỏ hàng thay đổi
  function updatePromoDiscount() {
    if (!currentPromo) return;
    const cart = window.cart || [];
    const totalDisc = computeTotalDiscount(currentPromo.code, cart);
    if (totalDisc === 0) {
      removePromoCode(); // tự động xóa nếu không còn sản phẩm hợp lệ
    } else {
      currentPromo.totalDiscount = totalDisc;
      updateTotalDisplay();
      renderAppliedUI();
    }
  }

  // 4. Cập nhật hiển thị tổng tiền (gộp voucher sản phẩm + promo)
  function updateTotalDisplay() {
    let subtotal = 0, voucherFromCart = 0;
    (window.cart || []).forEach(i => {
      subtotal += (i.Giá || 0) * (i.quantity || 1);
      voucherFromCart += (i.voucher?.amount || 0) * (i.quantity || 1);
    });
    let shipping = window.shippingFee || 0;
    let promoDiscount = currentPromo ? currentPromo.totalDiscount : 0;
    let totalDiscount = voucherFromCart + promoDiscount;
    let total = subtotal + shipping - totalDiscount;

    let voucherSpan = document.getElementById("voucherText");
    if (voucherSpan) {
      voucherSpan.innerHTML = `-${totalDiscount.toLocaleString()}₫`;
      voucherSpan.style.display = totalDiscount > 0 ? "block" : "none";
    }
    let totalSpan = document.getElementById("totalText");
    if (totalSpan) totalSpan.innerHTML = `${total.toLocaleString()}₫`;
  }

  // 5. Áp dụng mã (không alert, chỉ hiển thị message trong input area)
  window.applyPromoCode = function(code) {
    const msgDiv = document.getElementById("promoMessage");
    const promo = promoConfig.find(p => p.code.toUpperCase() === code.toUpperCase());
    if (!promo) {
      if (msgDiv) msgDiv.innerText = "❌ Mã không hợp lệ";
      return false;
    }
    const cart = window.cart || [];
    let applicableQty = 0;
    cart.forEach(item => {
      if (promo.applicableProductIds.includes(item.id)) {
        applicableQty += (item.quantity || 1);
      }
    });
    if (applicableQty === 0) {
      if (msgDiv) msgDiv.innerText = "❌ Mã không áp dụng được cho sản phẩm trong giỏ";
      return false;
    }
    currentPromo = {
      code: promo.code,
      discountPerItem: promo.discount,
      applicableIds: promo.applicableProductIds,
      totalDiscount: applicableQty * promo.discount
    };
    renderAppliedUI();
    updateTotalDisplay();
    return true;
  };

  // 6. Xóa mã
  window.removePromoCode = function() {
    currentPromo = null;
    renderButtonUI();
    updateTotalDisplay();
  };

  // 7. Giao diện nút ban đầu (chỉ text, không icon)
  function renderButtonUI() {
    const container = document.getElementById("promoCodeContainer");
    if (!container) return;
    container.innerHTML = `
      <button class="promo-toggle-btn" id="promoToggleBtn">Nhập Mã Khuyến Mãi</button>
    `;
    const btn = document.getElementById("promoToggleBtn");
    if (btn) btn.addEventListener("click", showInputMode);
  }

  // 8. Giao diện đã áp dụng (hiển thị tổng giảm)
  function renderAppliedUI() {
    const container = document.getElementById("promoCodeContainer");
    if (!container || !currentPromo) return;
    container.innerHTML = `
      <div class="promo-applied">
        <span>✅ ${currentPromo.code} - Giảm ${currentPromo.totalDiscount.toLocaleString()}₫ (${currentPromo.discountPerItem.toLocaleString()}₫/sp)</span>
        <button class="promo-remove-btn" onclick="removePromoCode()">✖</button>
      </div>
    `;
  }

  // 9. Hiển thị ô nhập mã + nút áp dụng (không icon, thông báo lỗi dưới input)
  function showInputMode() {
    const container = document.getElementById("promoCodeContainer");
    if (!container) return;
    container.innerHTML = `
      <div class="promo-input-group">
        <input type="text" id="promoInput" class="promo-input" placeholder="Nhập mã" autocomplete="off">
        <button id="applyGrayBtn" class="promo-apply-gray">Áp dụng</button>
      </div>
      <div id="promoMessage" class="promo-message"></div>
    `;
    const input = document.getElementById("promoInput");
    const applyBtn = document.getElementById("applyGrayBtn");
    const msgDiv = document.getElementById("promoMessage");

    const handleApply = () => {
      const code = input.value.trim();
      if (!code) {
        msgDiv.innerText = "Vui lòng nhập mã";
        return;
      }
      // Xóa message cũ
      msgDiv.innerText = "";
      const success = window.applyPromoCode(code);
      if (!success && msgDiv.innerText === "") {
        // Nếu không thành công mà message chưa được set (do lỗi khác)
        msgDiv.innerText = "Mã không hợp lệ hoặc không áp dụng được";
      }
    };
    applyBtn.addEventListener("click", handleApply);
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") handleApply(); });
    input.focus();
  }

  // 10. Khởi tạo: dùng container có sẵn trong HTML, patch các hàm cập nhật
  function init() {
    const container = document.getElementById("promoCodeContainer");
    if (!container) {
      setTimeout(init, 200);
      return;
    }
    // Nếu container chưa có nội dung thì vẽ button
    if (container.children.length === 0 || !container.querySelector(".promo-toggle-btn")) {
      renderButtonUI();
    }

    // Patch updateCheckoutSummary gốc để tính lại khi có thay đổi
    const origUpdate = window.updateCheckoutSummary;
    if (origUpdate) {
      window.updateCheckoutSummary = function() {
        origUpdate();
        if (currentPromo) updatePromoDiscount();
        else updateTotalDisplay();
      };
    } else {
      setTimeout(() => {
        if (window.updateCheckoutSummary) {
          const orig = window.updateCheckoutSummary;
          window.updateCheckoutSummary = function() {
            orig();
            if (currentPromo) updatePromoDiscount();
            else updateTotalDisplay();
          };
        }
      }, 500);
    }

    // Patch renderCheckoutCart để bắt sự kiện thay đổi giỏ hàng
    const origRender = window.renderCheckoutCart;
    if (origRender) {
      window.renderCheckoutCart = function() {
        origRender();
        if (currentPromo) updatePromoDiscount();
        else updateTotalDisplay();
      };
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();