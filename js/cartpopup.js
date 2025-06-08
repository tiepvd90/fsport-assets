window.selectedVariant = null;
let isCartEventBound = false;

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
  if (!container) return;
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
  window.selectedVariant = data;

  const mainImage = document.getElementById("mainImage");
  const productName = document.getElementById("productName");
  const productPrice = document.getElementById("productPrice");
  const productOriginalPrice = document.getElementById("productOriginalPrice");
  const productVariantText = document.getElementById("productVariantText");

  if (mainImage) mainImage.src = data.Ảnh;
  if (productName) productName.textContent = data["Phân loại"];
  if (productPrice) productPrice.textContent = data.Giá.toLocaleString() + "đ";
  if (productOriginalPrice) productOriginalPrice.textContent = data["Giá gốc"].toLocaleString() + "đ";

  const selectedText = [];
  for (let key in data) {
    if (["Ảnh", "Giá", "Giá gốc"].includes(key)) continue;
    selectedText.push(data[key]);
  }
  if (productVariantText) productVariantText.textContent = selectedText.join(", ");
}

function changeQuantity(delta) {
  const input = document.getElementById("quantityInput");
  let value = parseInt(input?.value || "1");
  if (input) input.value = Math.max(1, value + delta);
}

function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
  if (!popup) return;
  popup.classList.toggle("hidden", !show);
  popup.style.display = show ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  initCartPopup();

  const orderBtn = document.getElementById("cartSubmitBtn");
  const closeBtns = document.querySelectorAll(".cart-popup-close, .cart-popup-overlay");

  if (orderBtn && !isCartEventBound) {
    isCartEventBound = true;
    orderBtn.addEventListener("click", () => {
      const quantity = parseInt(document.getElementById("quantityInput")?.value) || 1;

      if (!window.selectedVariant) return alert("Vui lòng chọn phân loại sản phẩm.");

      const loai = "chair"; // có thể lấy động nếu cần

      window.cart = window.cart || [];
      window.cart.push({
        ...window.selectedVariant,
        quantity,
        loai
      });

      if (typeof showCheckoutPopup === "function") {
        showCheckoutPopup();
      }

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
