// ✅ Gọi API json sản phẩm từ Google Sheets hoặc file tĩnh
fetch("https://friendly-kitten-d760ff.netlify.app/json/chair.json")
  .then(res => res.json())
  .then(data => renderVariants(data))
  .catch(err => console.warn("Không thể tải chair.json", err));

// ✅ Hiển thị danh sách biến thể vào popup
function renderVariants(list) {
  const container = document.querySelector("#cartPopup .variant-list");
  if (!container || !Array.isArray(list)) return;

  container.innerHTML = "";
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
    container.appendChild(box);
  });
}

// ✅ Xử lý chọn variant
let selectedVariant = null;

function selectVariant(box, data) {
  document.querySelectorAll(".variant-box").forEach(b => b.classList.remove("selected"));
  box.classList.add("selected");
  selectedVariant = data;
}

// ✅ Đợi DOM sẵn sàng rồi mới gắn sự kiện
document.addEventListener("DOMContentLoaded", () => {
  const orderBtn = document.querySelector("#cartPopup .popup-footer button");
  const closeBtn = document.querySelector("#cartPopup .popup-close");

  if (orderBtn) {
    orderBtn.addEventListener("click", () => {
      if (!selectedVariant) {
        alert("Vui lòng chọn sản phẩm trước khi đặt hàng.");
        return;
      }

      // 👉 Tracking Facebook / TikTok Pixel nếu có
      if (typeof trackBothPixels === "function") {
        trackBothPixels('Subscribe', {
          content_name: selectedVariant.Tên,
          content_category: "chair"
        });
      }

      // 👉 Gửi đơn về webhook / Google Sheet (có thể sửa sau)
      alert("Đơn hàng đã được ghi nhận: " + selectedVariant.Tên);

      // 👉 Đóng popup
      toggleCartPopup(false);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => toggleCartPopup(false));
  }
});

// ✅ Hiển thị / Ẩn popup
function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
  if (popup) popup.style.display = show ? "flex" : "none";
}

// ✅ Gọi từ ngoài khi ấn nút "Thêm vào giỏ hàng"
window.toggleForm = function () {
  toggleCartPopup(true);
};
