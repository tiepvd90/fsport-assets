// ✅ Gọi API json sản phẩm từ Google Sheets hoặc file tĩnh
fetch("https://friendly-kitten-d760ff.netlify.app/json/chair.json")
  .then(res => res.json())
  .then(data => {
    renderVariants(data);
    if (data.length > 0) selectVariant(0, data[0]);
  })
  .catch(err => console.warn("Không thể tải chair.json", err));

// ✅ Hiển thị danh sách phân loại vào popup
type Variant = {
  Ảnh: string;
  Tên: string;
  Giá: number;
  "Giá gốc": number;
};

function renderVariants(list) {
  const container = document.getElementById("variantList");
  if (!container || !Array.isArray(list)) return;

  container.innerHTML = "";

  list.forEach((item, index) => {
    const thumb = document.createElement("div");
    thumb.className = "variant-thumb";
    thumb.innerHTML = `<img src="${item.Ảnh}" alt="${item.Tên}">`;
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
        trackBothPixels("Subscribe", {
          content_name: selectedVariant.Tên,
          content_category: "chair",
        });
      }

      alert("Đơn hàng đã được ghi nhận: " + selectedVariant.Tên);
      toggleCartPopup(false);
    });
  }

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => toggleCartPopup(false));
  });
});

// ✅ Mở / đóng popup
function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
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

// ✅ Gọi từ ngoài
window.toggleForm = function () {
  toggleCartPopup(true);
};
