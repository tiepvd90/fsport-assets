window.selectedVariant = null;
window.cart = window.cart || [];
let isCartEventBound = false;
let isCartPopupOpen = false;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const loai = window.window.productPage || "default";
  const jsonUrl = container?.getAttribute("data-json") || `/json/${window.productPage}.json`;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      if (data["thuộc_tính"] && data["biến_thể"]) {
        window.allVariants = data["biến_thể"];
        window.productCategory = data["category"] || loai;

        if (window.__voucherWaiting?.amount) {
          data["biến_thể"].forEach(sp => {
            if (sp.id) window.voucherByProduct[sp.id] = window.__voucherWaiting.amount;
          });
        }

        renderOptions(data["thuộc_tính"]);
        bindAddToCartButton(); // ✅ Gắn nút sau khi đã render
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
  const productPrice = document.getElementById("productPrice");
  const productOriginalPrice = document.getElementById("productOriginalPrice");
  const productVariantText = document.getElementById("productVariantText");
  const voucherLabel = document.getElementById("voucherLabel");

  if (mainImage) mainImage.src = data.Ảnh;

  const voucherAmount = window.voucherByProduct?.[data.id] || 0;
  const finalPrice = Math.max(0, data.Giá - voucherAmount);

  const oldFinal = document.getElementById("finalPriceLine");
  if (oldFinal) oldFinal.remove();

  if (voucherAmount > 0) {
    if (productPrice) {
      productPrice.textContent = data.Giá.toLocaleString() + "đ";
      productPrice.style.color = "black";
      productPrice.style.textDecoration = "line-through";
    }

    if (productOriginalPrice) {
      productOriginalPrice.style.display = "none";
    }

    if (voucherLabel) {
      voucherLabel.textContent = `Voucher: ${voucherAmount.toLocaleString()}đ`;
      voucherLabel.style.display = "block";
      voucherLabel.style.borderRadius = "0px";
    }

    const finalLine = document.createElement("div");
    finalLine.id = "finalPriceLine";
    finalLine.textContent = finalPrice.toLocaleString() + "đ";
    finalLine.style.color = "#d0021b";
    finalLine.style.fontWeight = "bold";
    finalLine.style.marginTop = "6px";
    finalLine.style.fontSize = "21px";

    voucherLabel?.parentElement?.appendChild(finalLine);
  } else {
    if (productPrice) {
      productPrice.textContent = data.Giá.toLocaleString() + "đ";
      productPrice.style.color = "#d0021b";
      productPrice.style.textDecoration = "none";
    }

    if (productOriginalPrice) {
      productOriginalPrice.textContent = data["Giá gốc"].toLocaleString() + "đ";
      productOriginalPrice.style.display = "inline";
    }

    if (voucherLabel) {
      voucherLabel.style.display = "none";
    }
  }

  if (productVariantText) {
    const selectedText = [];
    for (let key in data) {
      if (["Ảnh", "Giá", "Giá gốc", "id", "category"].includes(key)) continue;
      selectedText.push(data[key]);
    }
    productVariantText.textContent = selectedText.join(", ");
    productVariantText.style.marginTop = "16px";
  }
}

function changeQuantity(delta) {
  const input = document.getElementById("quantityInput");
  let value = parseInt(input?.value || "1");
  if (input) input.value = Math.max(1, value + delta);
}

function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
  const content = popup?.querySelector(".cart-popup-content");
  if (!popup || !content) return;

  if (show) {
    popup.style.display = "flex";
    content.classList.remove("animate-slideup");
    void content.offsetWidth;
    content.classList.add("animate-slideup");
    popup.classList.remove("hidden");
    isCartPopupOpen = true;
  } else {
    content.classList.remove("animate-slideup");
    popup.classList.add("hidden");
    setTimeout(() => {
      popup.style.display = "none";
    }, 300);
    isCartPopupOpen = false;
  }
}


function bindAddToCartButton() {
  const atcBtn = document.getElementById("btn-atc");
  if (atcBtn && !isCartEventBound) {
    isCartEventBound = true;

    atcBtn.addEventListener("click", () => {
      if (!isCartPopupOpen) {
        // Bấm lần đầu: mở popup
        toggleCartPopup(true);
      } else {
        // Bấm lần hai: đã chọn xong → thêm vào giỏ
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
saveCart(); // ⬅️ Thêm dòng này để đảm bảo lưu ngay cả khi quantity = 1

        console.log("🔥 Gửi ATC:", {
  content_id: product.id || "unknown",
  content_name: product["Phân loại"] || "unknown",
  content_category: product.category || loai || "unknown",
  content_page: window.productPage || "unknown",
  value: product.Giá || 0
});

        if (typeof trackBothPixels === "function") {
  trackBothPixels("AddToCart", {
    content_id: product.id || "unknown",
    content_name: product["Phân loại"] || "unknown",
    content_category: product.category || loai || "unknown",
    content_page: window.productPage || "unknown",
    value: product.Giá || 0,
    currency: "VND"
  });
}


        toggleCartPopup(false);
        if (typeof showCheckoutPopup === "function") showCheckoutPopup();
      }
    });
  }
}



document.addEventListener("DOMContentLoaded", () => {
  const closeBtns = document.querySelectorAll(".cart-popup-close, .cart-popup-overlay");
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => toggleCartPopup(false));
  });

  window.toggleForm = function () {
    toggleCartPopup(true);
  };
});
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
}
