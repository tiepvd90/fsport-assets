// ✅ Tự động render giỏ hàng từ window.cart
function renderCheckoutCart() {
  const list = document.getElementById("checkoutCartList");
  list.innerHTML = "";

  let subtotal = 0;
  let highestShippingFee = 0;
  const typeSet = new Set();

  window.cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "item";

    row.innerHTML = `
      <img src="${item.Ảnh}" alt="Ảnh">
      <div class="info">
        <div>${item["Phân loại"]}</div>
        <div>${item.Giá.toLocaleString()}đ x ${item.quantity}</div>
      </div>
      <div class="remove-btn" onclick="removeCartItem(${index})">×</div>
    `;

    list.appendChild(row);

    subtotal += item.Giá * item.quantity;
    typeSet.add(item.loai);
  });

  document.getElementById("subtotalText").textContent = subtotal.toLocaleString() + "đ";
  loadShippingFee([...typeSet]).then(fee => {
    document.getElementById("shippingFeeText").textContent = fee.toLocaleString() + "đ";
    const voucher = window.currentVoucherValue || 0;
    document.getElementById("voucherText").textContent = "-" + voucher.toLocaleString() + "đ";
    const total = subtotal + fee - voucher;
    document.getElementById("totalText").textContent = total.toLocaleString() + "đ";
  });
}

function removeCartItem(index) {
  window.cart.splice(index, 1);
  renderCheckoutCart();
}

function showCheckoutPopup() {
  renderCheckoutCart();
  document.getElementById("checkoutPopup").classList.remove("hidden");
  document.getElementById("checkoutPopup").style.display = "flex";
}

function hideCheckoutPopup() {
  document.getElementById("checkoutPopup").classList.add("hidden");
  document.getElementById("checkoutPopup").style.display = "none";
}

function loadShippingFee(types) {
  return fetch("/json/shippingfee.json")
    .then(res => res.json())
    .then(map => {
      let max = 0;
      types.forEach(type => {
        if (map[type] && map[type] > max) max = map[type];
      });
      return max;
    })
    .catch(() => 0);
}

// ✅ Gửi đơn
function setupCheckoutSubmit() {
  document.getElementById("checkoutSubmitBtn").addEventListener("click", () => {
    const fullname = document.getElementById("checkoutName").value.trim();
    const phone = document.getElementById("checkoutPhone").value.trim();
    const address = document.getElementById("checkoutAddress").value.trim();

    if (!fullname || !phone || !address) return alert("Vui lòng nhập đầy đủ thông tin.");

    window.cart.forEach(item => {
      fetch("https://hook.eu2.make.com/m9o7boye6fl1hstehst7waysmt38b2ul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loai: item.loai,
          sanpham: item["Phân loại"],
          codprice: item.Giá,
          quantity: item.quantity,
          fullname,
          phone,
          address
        })
      });
    });

    alert("Funsport đã nhận đơn hàng, sẽ sớm liên hệ lại!");
    hideCheckoutPopup();
    window.cart = [];
  });
}

document.addEventListener("DOMContentLoaded", setupCheckoutSubmit);
