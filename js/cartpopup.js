window.selectedVariant = null;
window.cart = window.cart || [];
let isCartEventBound = false;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const loai = window.loai || "default";
  const jsonUrl = container?.getAttribute("data-json") || `/json/${loai}.json`;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      if (data["thuộc_tính"] && data["biến_thể"]) {
        window.allVariants = data["biến_thể"];
        window.productCategory = data["category"] || loai;

        // Auto-apply voucher if available
        if (window.__voucherWaiting?.amount) {
          data["biến_thể"].forEach(sp => {
            if (sp.id) window.voucherByProduct[sp.id] = window.__voucherWaiting.amount;
          });
        }

        renderOptions(data["thuộc_tính"]);
      } else {
        console.error("❌ Dữ liệu JSON thiếu thuộc_tính hoặc biến_thể.");
      }
    })
    .catch(err => console.warn("Không thể tải JSON sản phẩm:", err));
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
        document.querySelectorAll(`.variant-thumb[data-key="${attr.key}"]`).forEach(el => el.classList.remove("selected"));
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
  const productPrice = document.getElementById("productPrice");
  const productOriginalPrice = document.getElementById("productOriginalPrice");
  const productVariantText = document.getElementById("productVariantText");
  const voucherLabel = document.getElementById("voucherLabel");

  if (mainImage) mainImage.src = data.Ảnh;

  const voucherAmount = window.voucherByProduct?.[data.id] || 0;
  const finalPrice = Math.max(0, data.Giá - voucherAmount);

  if (voucherAmount > 0) {
    productPrice.textContent = data.Giá.toLocaleString() + "đ";
    productPrice.style.color = "black";
    productPrice.style.textDecoration = "line-through";
    productOriginalPrice.style.display = "none";

    if (voucherLabel) {
      voucherLabel.textContent = `Voucher: ${voucherAmount.toLocaleString()}đ`;
      voucherLabel.style.display = "inline-block";
    }

    let finalLine = document.getElementById("finalPriceLine");
    if (!finalLine) {
      finalLine = document.createElement("div");
      finalLine.id = "finalPriceLine";
      voucherLabel.parentElement.appendChild(finalLine);
    }
    finalLine.textContent = finalPrice.toLocaleString() + "đ";
    finalLine.style.color = "#d0021b";
    finalLine.style.fontWeight = "bold";
    finalLine.style.marginTop = "4px";
    finalLine.style.fontSize = "16px";
  } else {
    productPrice.textContent = data.Giá.toLocaleString() + "đ";
    productPrice.style.color = "#d0021b";
    productPrice.style.textDecoration = "none";
    productOriginalPrice.style.display = "inline";
    voucherLabel.style.display = "none";

    const finalLine = document.getElementById("finalPriceLine");
    if (finalLine) finalLine.remove();
  }

  if (productOriginalPrice) productOriginalPrice.textContent = data["Giá gốc"].toLocaleString() + "đ";

  const selectedText = [];
  for (let key in data) {
    if (["Ảnh", "Giá", "Giá gốc", "id", "category"].includes(key)) continue;
    selectedText.push(data[key]);
  }
  if (productVariantText) {
    productVariantText.textContent = selectedText.join(", ");
    productVariantText.style.marginTop = "12px";
  }
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
  const orderBtn = document.getElementById("cartSubmitBtn");
  const closeBtns = document.querySelectorAll(".cart-popup-close, .cart-popup-overlay");

  if (orderBtn && !isCartEventBound) {
    isCartEventBound = true;
    orderBtn.addEventListener("click", () => {
      const quantity = parseInt(document.getElementById("quantityInput")?.value) || 1;
      if (!window.selectedVariant) return alert("Vui lòng chọn phân loại sản phẩm.");

      const product = window.selectedVariant;
      const loai = window.productCategory || window.loai || "unknown";
      const contentId = product.id || product["Phân loại"];
      const contentName = product["Phân loại"];
      const voucherAmount = window.voucherByProduct?.[contentId] || 0;

      window.cart.push({
        ...product,
        quantity,
        loai,
        voucher: voucherAmount > 0 ? { amount: voucherAmount } : undefined
      });

      if (typeof trackBothPixels === "function") {
        trackBothPixels("AddToCart", {
          content_id: contentId,
          content_name: contentName,
          content_category: loai,
          value: product.Giá,
          currency: "VND"
        });
      }

      if (typeof showCheckoutPopup === "function") showCheckoutPopup();
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
