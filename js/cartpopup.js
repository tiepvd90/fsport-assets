let selectedVariant = null;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const jsonUrl = container?.getAttribute("data-json") || "/json/chair.json";

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      if (data["thuộc_tính"] && data["biến_thể"]) {
        renderOptions(data["thuộc_tính"]);
        renderVariants(data["biến_thể"], data["thuộc_tính"]);
      } else {
        console.error("❌ JSON không đúng định dạng mở rộng.");
      }
    })
    .catch(err => console.warn("Không thể tải JSON:", err));
}

// ✅ Dựng nút chọn phân loại
function renderOptions(attributes) {
  const container = document.getElementById("variantList");
  container.innerHTML = "";

  attributes.forEach(attr => {
    const group = document.createElement("div");
    group.className = "variant-group";
    group.innerHTML = `<div class="variant-label">${attr.label}:</div>`;

    attr.values.forEach((value, i) => {
      const btn = document.createElement("button");
      btn.className = "variant-thumb";
      btn.textContent = value;
      btn.dataset.key = attr.key;
      btn.dataset.value = value;

      btn.addEventListener("click", () => {
        document.querySelectorAll(`.variant-thumb[data-key="${attr.key}"]`).forEach(el => {
          el.classList.remove("selected");
        });
        btn.classList.add("selected");
        updateSelectedVariant();
      });

      group.appendChild(btn);
    });

    container.appendChild(group);
  });
}

// ✅ Khi user chọn biến thể → tìm đúng combo trong danh sách
function updateSelectedVariant() {
  const selected = {};
  document.querySelectorAll(".variant-thumb.selected").forEach(btn => {
    const key = btn.dataset.key;
    const value = btn.dataset.value;
    selected[key] = value;
  });

  const allVariants = window.allVariants || [];
  const found = allVariants.find(v => {
    return Object.keys(selected).every(key => v[key] === selected[key]);
  });

  if (found) selectVariant(found);
}

function renderVariants(variants, attributes) {
  window.allVariants = variants; // dùng để tra sau

  // Tự động chọn cái đầu tiên
  if (variants.length > 0) {
    const firstVal = variants[0][attributes[0].key];
    const btn = [...document.querySelectorAll(`.variant-thumb[data-value="${firstVal}"]`)][0];
    if (btn) btn.click();
  }
}

function selectVariant(data) {
  selectedVariant = data;

  document.getElementById("mainImage").src = data.Ảnh;
  document.getElementById("productName").textContent = data["Phân loại"];
  document.getElementById("productPrice").textContent = data.Giá.toLocaleString() + "đ";
  document.getElementById("productOriginalPrice").textContent = data["Giá gốc"].toLocaleString() + "đ";
}

// ✅ Mở / đóng popup
function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
  if (!popup) return;

  popup.classList.toggle("hidden", !show);
  popup.style.display = show ? "flex" : "none";
}

function changeQuantity(delta) {
  const input = document.getElementById("quantityInput");
  let value = parseInt(input.value || "1");
  input.value = Math.max(1, value + delta);
}

// ✅ Gửi đơn hàng
document.addEventListener("DOMContentLoaded", () => {
  const orderBtn = document.getElementById("cartSubmitBtn");
  const closeBtns = document.querySelectorAll(".cart-popup-close, .cart-popup-overlay");

  if (orderBtn) {
    orderBtn.addEventListener("click", () => {
      const fullname = document.getElementById("cartName").value.trim();
      const phone = document.getElementById("cartPhone").value.trim();
      const address = document.getElementById("cartAddress").value.trim();

      if (!selectedVariant) return alert("Vui lòng chọn phân loại sản phẩm.");
      if (!fullname || !phone || !address) return alert("Vui lòng nhập đủ họ tên, sđt và địa chỉ.");

      const loai = "chair";
      const product = selectedVariant["Phân loại"];
      const codprice = selectedVariant.Giá;
const quantity = parseInt(document.getElementById("quantityInput").value) || 1;

     fetch("https://hook.eu2.make.com/m9o7boye6fl1hstehst7waysmt38b2ul", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    loai,
    sanpham: product,
    phone,
    fullname,
    address,
    codprice,
    quantity  // ✅ Gửi về Make
  })
});


      if (typeof trackBothPixels === "function") {
        trackBothPixels("Subscribe", { content_name: product, content_category: loai });
        trackBothPixels("Purchase", {
          content_name: product,
          content_category: loai,
          value: codprice,
          currency: "VND"
        });
      }

      alert("Funsport đã nhận đơn, sẽ sớm liên hệ lại.");
      toggleCartPopup(false);
    });
  }

  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => toggleCartPopup(false));
  });

  window.toggleForm = function () {
    toggleCartPopup(true);
  };
});
