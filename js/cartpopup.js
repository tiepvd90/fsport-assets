// ✅ Gọi API json sản phẩm từ Google Sheets hoặc file tĩnh
fetch("https://friendly-kitten-d760ff.netlify.app/json/chair.json")
  .then(res => res.json())
  .then(data => renderVariants(data))
  .catch(err => console.warn("Không thể tải chair.json", err));

// ✅ Hiển thị danh sách biến thể vào popup
function renderVariants(list) {
  const container = document.querySelector("#cartPopup .cart-variant-info");
  if (!container || !Array.isArray(list)) return;

  const variantList = document.createElement("div");
  variantList.className = "variant-list";

  list.forEach((item, index) => {
    const box = document.createElement("div");
    box.className = "variant-box";
    box.dataset.index = index;

    box.innerHTML = `
      <img src="${item.Ảnh}" alt="${item.Tên}">
      <div class="variant-info">
        <div class="variant-name">${item.Tên}</div>
        <div>
          <span class="variant-price">${item.Giá.toLocaleString()}đ</span>
          <span class="variant-original-price">${item["Giá gốc"].toLocaleString()}đ</span>
        </div>
      </div>
    `;

    box.addEventListener("click", () => selectVariant(box, item));
    variantList.appendChild(box);
  });

  container.appendChild(variantList);
}

let selectedVariant = null;

function selectVariant(box, data) {
  document.querySelectorAll(".variant-box").forEach(b => b.classList.remove("selected"));
  box.classList.add("selected");
  selectedVariant = data;

  // Cập nhật ảnh và tên trong form
  document.getElementById("variantImage").src = data.Ảnh;
  document.getElementById("variantName").textContent = data.Tên;
  document.getElementById("variantPrice").textContent = data.Giá.toLocaleString() + "đ";
  document.getElementById("variantOriginalPrice").textContent = data["Giá gốc"].toLocaleString() + "đ";
}

// ✅ Bắt sự kiện sau khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  const orderBtn = document.getElementById("cartSubmitBtn");
  const closeBtns = document.querySelectorAll(".cart-popup-close, .cart-popup-overlay");

  if (orderBtn) {
    orderBtn.addEventListener("click", () => {
      if (!selectedVariant) {
        alert("Vui lòng chọn sản phẩm trước khi đặt hàng.");
        return;
      }

      if (typeof trackBothPixels === "function") {
        trackBothPixels('Subscribe', {
          content_name: selectedVariant.Tên,
          content_category: "chair"
        });
      }

      alert("Đơn hàng đã được ghi nhận: " + selectedVariant.Tên);
      toggleCartPopup(false);
    });
  }

  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => toggleCartPopup(false));
  });
});

// ✅ Mở / đóng popup
function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
  if (popup) popup.style.display = show ? "flex" : "none";
}

// ✅ Gọi từ ngoài
window.toggleForm = function () {
  toggleCartPopup(true);
};
