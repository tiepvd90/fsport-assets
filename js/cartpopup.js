let selectedVariant = null;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const jsonUrl = container?.getAttribute("data-json") || "/json/chair.json";

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      if (data["thuộc_tính"] && data["biến_thể"]) {
        window.allVariants = data["biến_thể"];
        renderOptions(data["thuộc_tính"]);
      } else {
        console.error("❌ Dữ liệu JSON thiếu thuộc_tính hoặc biến_thể.");
      }
    })
    .catch(err => console.warn("Không thể tải JSON:", err));
}

function renderOptions(attributes) {
  const container = document.getElementById("variantList");
  container.innerHTML = "";

  attributes.forEach(attr => {
    const group = document.createElement("div");
    group.className = "variant-group";
    group.innerHTML = `<div class="variant-label">${attr.label}:</div>`;

    const displayMode = attr.display || "button";
    const thumbWrapper = document.createElement("div");
    thumbWrapper.className = displayMode === "thumbnail" ? "variant-thumbnails" : "variant-buttons";

    attr.values.forEach(value => {
      const thumb = document.createElement("div");
      thumb.className = "variant-thumb";
      thumb.dataset.key = attr.key;
      thumb.dataset.value = value;

      if (displayMode === "thumbnail") {
        const matched = window.allVariants.find(v => v[attr.key] === value && v["Ảnh"]);
        thumb.innerHTML = `
          <img src="${matched?.Ảnh || ''}" alt="${value}" />
          <div class="variant-title">${value}</div>
        `;
      } else {
        thumb.textContent = value;
      }

      thumb.addEventListener("click", () => {
        document.querySelectorAll(`.variant-thumb[data-key="${attr.key}"]`).forEach(el => {
          el.classList.remove("selected");
        });
        thumb.classList.add("selected");
        updateSelectedVariant();
      });

      thumbWrapper.appendChild(thumb);
    });

    group.appendChild(thumbWrapper);
    container.appendChild(group);
  });

  // ✅ Auto chọn cái đầu tiên
  const first = container.querySelector(".variant-thumb");
  if (first) first.click();
}

function updateSelectedVariant() {
  const selected = {};
  document.querySelectorAll(".variant-thumb.selected").forEach(btn => {
    selected[btn.dataset.key] = btn.dataset.value;
  });

  const matched = window.allVariants.find(variant =>
    Object.keys(selected).every(key => variant[key] === selected[key])
  );

  if (matched) selectVariant(matched);
}

function selectVariant(data) {
  selectedVariant = data;

  document.getElementById("mainImage").src = data.Ảnh;
  document.getElementById("productName").textContent = data["Phân loại"];
  document.getElementById("productPrice").textContent = data.Giá.toLocaleString() + "đ";
  document.getElementById("productOriginalPrice").textContent = data["Giá gốc"].toLocaleString() + "đ";

  // ✅ Thêm đoạn này ngay bên dưới
  const selectedText = [];
  for (let key in data) {
    if (["Ảnh", "Giá", "Giá gốc"].includes(key)) continue;
    selectedText.push(data[key]);
  }
  document.getElementById("productVariantText").textContent = selectedText.join(", ");
}


// ✅ Số lượng
function changeQuantity(delta) {
  const input = document.getElementById("quantityInput");
  let value = parseInt(input.value || "1");
  input.value = Math.max(1, value + delta);
}

// ✅ Mở / đóng popup
function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
  if (!popup) return;
  popup.classList.toggle("hidden", !show);
  popup.style.display = show ? "flex" : "none";
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
      const quantity = parseInt(document.getElementById("quantityInput").value) || 1;

      if (!selectedVariant) return alert("Vui lòng chọn phân loại sản phẩm.");
      if (!fullname || !phone || !address) return alert("Vui lòng nhập đủ họ tên, sđt và địa chỉ.");

      const loai = "chair";
      const product = selectedVariant["Phân loại"];
      const codprice = selectedVariant.Giá;

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
          quantity
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
