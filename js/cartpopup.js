window.selectedVariant = null;
window.cart = window.cart || [];
let isCartEventBound = false;
let isCartPopupOpen = false;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const loai = window.productPage || "default";
  const jsonUrl = container?.getAttribute("data-json") || `/json/${loai}.json`;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      if (data["thuộc_tính"] && data["biến_thể"]) {
        window.allVariants = data["biến_thể"];
        window.allAttributes = data["thuộc_tính"];
        window.productCategory = data["category"]
  || (Array.isArray(data["biến_thể"]) ? data["biến_thể"][0]?.category : "unknown")
  || "unknown";


        data["biến_thể"].forEach(sp => {
  const id = sp.id;

  // ✅ Gán từ __voucherWaiting nếu có
  if (window.__voucherWaiting?.amount && id) {
    window.voucherByProduct[id] = window.__voucherWaiting.amount;
  }

  // ✅ Gán cứng voucher 200k nếu đúng biến thể Titan
  if (id === "pickleball-titan16") {
    window.voucherByProduct[id] = 200000;
  }
});


        renderOptions(data["thuộc_tính"]);
        bindAddToCartButton();
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
      const valText = typeof value === "string" ? value : value.text;
      const thumb = document.createElement("div");
      thumb.className = "variant-thumb";
      thumb.dataset.key = attr.key;
      thumb.dataset.value = valText;

      let imageUrl = "";

      const matchedVariant = window.allVariants.find(v => v[attr.key] === valText && v["Ảnh"]);
      if (matchedVariant?.["Ảnh"]) {
        imageUrl = matchedVariant["Ảnh"];
      } else {
        const matchedAttrValue = attr.values.find(v => typeof v === "object" && v.text === valText);
        imageUrl = matchedAttrValue?.image || "";
      }

      if (displayMode === "thumbnail") {
        thumb.innerHTML = `
          <img src="${imageUrl}" alt="${valText}" />
          <div class="variant-title">${valText}</div>
        `;
      } else {
        thumb.textContent = valText;
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

  if (matched) {
    const colorKey = Object.keys(selected).find(k => /màu/i.test(k));
    const colorVal = selected[colorKey];
    const colorAttr = window.allAttributes?.find(a => a.key === colorKey);
    const matchedColor = colorAttr?.values?.find(v => typeof v === "object" && v.text === colorVal);

    if (!matched["Ảnh"] && matchedColor?.image) matched["Ảnh"] = matchedColor.image;
    if (!matched["Giá"] && matchedColor?.Giá) matched["Giá"] = matchedColor.Giá;
    if (!matched["Giá gốc"] && matchedColor?.["Giá gốc"]) matched["Giá gốc"] = matchedColor["Giá gốc"];

    selectVariant(matched);
  }
}

function selectVariant(data) {
  window.selectedVariant = data;

  const mainImage = document.getElementById("mainImage");
  const productPrice = document.getElementById("productPrice");
  const productOriginalPrice = document.getElementById("productOriginalPrice");
  const productVariantText = document.getElementById("productVariantText");
  const voucherLabel = document.getElementById("voucherLabel");

  if (!data.Giá || !data["Giá gốc"]) {
    const colorKey = Object.keys(data).find(k => /màu/i.test(k));
    const colorVal = data[colorKey];
    const colorAttr = window.allAttributes?.find(a => a.key === colorKey);
    const matchedColor = colorAttr?.values?.find(v => typeof v === "object" && v.text === colorVal);

    if (matchedColor?.Giá) data.Giá = matchedColor.Giá;
    if (matchedColor?.["Giá gốc"]) data["Giá gốc"] = matchedColor["Giá gốc"];
  }

  if (mainImage) mainImage.src = data.Ảnh || "";

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

    if (productOriginalPrice) productOriginalPrice.style.display = "none";

    if (voucherLabel) {
      voucherLabel.textContent = `Voucher: ${voucherAmount.toLocaleString()}đ`;
      voucherLabel.style.display = "block";
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

    if (voucherLabel) voucherLabel.style.display = "none";
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
        toggleCartPopup(true);
      } else {
        const quantity = parseInt(document.getElementById("quantityInput")?.value) || 1;
        if (!window.selectedVariant) return alert("Vui lòng chọn phân loại sản phẩm.");

        const product = window.selectedVariant;
        const loai = window.productCategory || window.loai || "unknown";

        // ✅ Kiểm tra đã chọn đủ phân loại
        const requiredKeys = window.allAttributes.map(a => a.key);
        const selectedKeys = Object.keys(product);
        const isComplete = requiredKeys.every(k => selectedKeys.includes(k));
        if (!isComplete) {
          return alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
        }

        // ✅ Gán phân loại
        const phanLoaiText = requiredKeys.map(k => product[k]).join(" - ");
        product["Phân loại"] = phanLoaiText;

        const contentId = product.id || phanLoaiText;
        const voucherAmount = window.voucherByProduct?.[contentId] || 0;

        window.cart.push({
          ...product,
          quantity,
          loai,
          voucher: voucherAmount > 0 ? { amount: voucherAmount } : undefined
        });
        saveCart();

        if (typeof trackBothPixels === "function") {
          trackBothPixels("AddToCart", {
            content_id: contentId,
            content_name: phanLoaiText,
            content_category: window.productCategory || window.productCategory,
            content_page: window.productPage || "unknown",
            value: product.Giá || 0,
            currency: "VND"
          });
          // ✅ Gửi log về Make.com để kiểm tra sau
  fetch("https://hook.eu2.make.com/31c0jdh2vkvkjcnaenbm3kyze8fp3us3", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content_id: contentId,
      content_name: phanLoaiText,
      content_category: window.productCategory || window.productCategory,
      content_page: window.productPage || "unknown",
      value: product.Giá || 0,
      currency: "VND",
      timestamp: new Date().toISOString()
    })
  }).catch((err) => {
    console.warn("⚠️ Không thể gửi dữ liệu về Make:", err);
  });
// END Gửi log về Make.com để kiểm tra sau
          
        }
        toggleCartPopup(false);
        if (typeof showCheckoutPopup === "function") showCheckoutPopup();
      }
    });
  }
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
}

document.addEventListener("DOMContentLoaded", () => {
  const closeBtns = document.querySelectorAll(".cart-popup-close, .cart-popup-overlay");
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => toggleCartPopup(false));
  });

  window.toggleForm = () => toggleCartPopup(true);

  initCartPopup();
});
