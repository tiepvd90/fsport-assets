// ✅ Gọi API json sản phẩm từ Google Sheets hoặc file tĩnh
fetch("https://friendly-kitten-d760ff.netlify.app/json/chair.json")
  .then(res => res.json())
  .then(data => {
    renderVariants(data);
    if (data.length > 0) selectVariant(0, data[0]);
  })
  .catch(err => console.warn("Không thể tải chair.json", err));

// ✅ Hiển thị danh sách phân loại vào popup
function renderVariants(list) {
  const container = document.getElementById("variantList");
  if (!container || !Array.isArray(list)) return;

  container.innerHTML = "";

  list.forEach((item, index) => {
    const thumb = document.createElement("div");
    thumb.className = "variant-thumb";
    thumb.innerHTML = `
  <img src="${item.Ảnh}" alt="${item.Tên}">
  <div class="variant-title">${item.Tên}</div>
`;

    thumb.addEventListener("click", () => selectVariant(index, item));
    container.appendChild(thumb);
  });
}

let selectedVariant = null;

function selectVariant(index, data) {
  selectedVariant = data;

  document.getElementById("mainImage").src = data.Ảnh;
  document.getElementById("productName").textContent = data.Tên;
  document.getElementById("productPrice").textContent = data.Giá.toLocaleString() + "đ";
  document.getElementById("productOriginalPrice").textContent = data["Giá gốc"].toLocaleString() + "đ";

  document.querySelectorAll(".variant-thumb").forEach((el, i) => {
    el.classList.toggle("selected", i === index);
  });
}

// ✅ Mở / đóng popup
function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
  console.log("📦 toggleCartPopup() được gọi với giá trị:", show);
  console.log("🔍 Phần tử #cartPopup:", popup);

  if (popup) {
    if (show) {
      popup.classList.remove("hidden");
      popup.style.display = "flex";
    } else {
      popup.classList.add("hidden");
      popup.style.display = "none";
    }
  } else {
    console.error("❌ Không tìm thấy phần tử #cartPopup");
  }
}
function changeQuantity(delta) {
  const input = document.getElementById("quantityInput");
  let value = parseInt(input.value || "1");
  value = Math.max(1, value + delta);
  input.value = value;
}

// ✅ Bắt sự kiện sau khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  const orderBtn = document.getElementById("cartSubmitBtn");
  const closeBtns = document.querySelectorAll(".cart-popup-close, .cart-popup-overlay");

  if (orderBtn) {
  orderBtn.addEventListener("click", () => {
    const fullname = document.getElementById("cartName").value.trim();
    const phone = document.getElementById("cartPhone").value.trim();
    const address = document.getElementById("cartAddress").value.trim();

    if (!selectedVariant) {
      alert("Vui lòng chọn sản phẩm.");
      return;
    }

    if (!fullname || !phone || !address) {
      alert("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.");
      return;
    }

    const loai = "chair";
    const product = selectedVariant.Tên;
    const codprice = selectedVariant.Giá;

    // Gửi về Make trước
    fetch("https://hook.eu2.make.com/m9o7boye6fl1hstehst7waysmt38b2ul", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loai, sanpham: product, phone, fullname, address, codprice })
    });

    // Gửi tracking
    if (typeof trackBothPixels === "function") {
      trackBothPixels("Subscribe", {
        content_name: product,
        content_category: loai,
      });
      trackBothPixels("Purchase", {
        content_name: product,
        content_category: loai,
        value: codprice,
        currency: "VND"
      });
    }

    alert("Funsport đã nhận được đơn hàng và sẽ sớm liên hệ lại.");
    toggleCartPopup(false);
  });
}


  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => toggleCartPopup(false));
  });

  // ✅ Gọi từ ngoài (sau khi đã có toggleCartPopup)
  window.toggleForm = function () {
    console.log("Gọi toggleForm()");
    toggleCartPopup(true);
  };
});
