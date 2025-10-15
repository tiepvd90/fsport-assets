// ✅ cartpopup-3p.js: Dùng cho sản phẩm nhiều phân loại (hỗ trợ input text)

window.selectedVariant = null;
window.cart = window.cart || [];
let isCartEventBound = false;
let isCartPopupOpen = false;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const productPage = window.productPage || "default";
  const category = window.productCategory || "tshirt";
  const jsonUrl = `/json/${category}/${productPage}.json`;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      console.log("✅ DEBUG DATA:", data);
      if (data["thuộc_tính"] && data["biến_thể"]?.length === 1) {
        window.allAttributes = data["thuộc_tính"];
        window.baseVariant = data["biến_thể"][0];
        window.productCategory = data["category"] || data["biến_thể"][0]?.category || "unknown";
        window.mainImageKey = data["mainImageKey"] || (
          data["thuộc_tính"].find(a => a.display === "thumbnail")?.key || null
        );

        renderOptions(window.allAttributes);
        bindAddToCartButton();
      } else {
        console.error("❌ JSON không đúng định dạng.", data);
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

    if (attr.input === "text") {
      const input = document.createElement("input");
      input.type = "text";
      input.id = `input-${attr.key}`;
      input.placeholder = "Tên hoặc năm sinh bạn muốn in lên áo...";
      input.style = "width: 100%; padding: 8px; font-size: 14px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 6px;";
      input.addEventListener("input", () => {
        updateSelectedVariant();
      });
      group.appendChild(input);
    } else if (Array.isArray(attr.values)) {
      const displayMode = attr.display || "button";
      const wrapper = document.createElement("div");
      wrapper.className = displayMode === "thumbnail" ? "variant-thumbnails" : "variant-buttons";

      attr.values.forEach(val => {
        const value = typeof val === "string" ? val : val.text;
        const image = typeof val === "object" ? val.image : null;

        const thumb = document.createElement("div");
        thumb.className = "variant-thumb";
        thumb.dataset.key = attr.key;
        thumb.dataset.value = value;

        thumb.innerHTML = displayMode === "thumbnail"
          ? `<img src="${image || ""}" alt="${value}" /><div class="variant-title">${value}</div>`
          : value;

        thumb.addEventListener("click", () => {
          document.querySelectorAll(`.variant-thumb[data-key="${attr.key}"]`).forEach(el => el.classList.remove("selected"));
          thumb.classList.add("selected");
          updateSelectedVariant();
        });

        wrapper.appendChild(thumb);
      });

      group.appendChild(wrapper);
    }

    container.appendChild(group);
  });

  const firsts = container.querySelectorAll(".variant-thumb");
  if (firsts[0]) firsts[0].click();
}

function updateSelectedVariant() {
  // 1) Thu thập lựa chọn hiện tại
  const selected = {};
  document.querySelectorAll(".variant-thumb.selected").forEach(btn => {
    selected[btn.dataset.key] = btn.dataset.value;
  });

  // Thu thập input text (nếu có)
  (window.allAttributes || []).forEach(attr => {
    if (attr.input === "text") {
      const val = document.getElementById(`input-${attr.key}`)?.value || "";
      selected[attr.key] = val;
    }
  });

  // 2) Tạo variant tạm từ baseVariant + selections
  const variant = {
    ...(window.baseVariant || {}),
    ...selected
  };

  // 3) Ảnh chính theo mainImageKey (giữ nguyên hành vi cũ)
  if (window.mainImageKey) {
    const mainVal = selected[window.mainImageKey];
    const mainAttr = (window.allAttributes || []).find(a => a.key === window.mainImageKey);
    const matchedValue = mainAttr?.values?.find(v => {
      if (typeof v === "object") return v.text === mainVal;
      return v === mainVal;
    });
    // Ưu tiên image trong value object; nếu không có giữ nguyên hoặc rỗng
    if (matchedValue && typeof matchedValue === "object" && matchedValue.image) {
      variant["Ảnh"] = matchedValue.image;
    } else if (!variant["Ảnh"]) {
      variant["Ảnh"] = "";
    }
  }

  // 4) Tính giá: mặc định lấy từ baseVariant (giữ tương thích cũ)
  let price = Number((window.baseVariant || {})["Giá"]) || 0;
  let priceOrig = Number((window.baseVariant || {})["Giá gốc"]) || price || 0;

  // 5) Áp override giá theo từng thuộc tính (nếu có)
  (window.allAttributes || []).forEach(attr => {
    const selVal = selected[attr.key];
    if (!selVal || !Array.isArray(attr?.values)) return;

    const matched = attr.values.find(v => {
      if (typeof v === "object") return v.text === selVal;
      return v === selVal;
    });

    if (matched && typeof matched === "object") {
      // Cách 1: set giá tuyệt đối
      if (typeof matched.GiaOverride === "number") price = matched.GiaOverride;
      if (typeof matched.GiaGocOverride === "number") priceOrig = matched.GiaGocOverride;

      // Cách 2: cộng/trừ chênh lệch
      if (typeof matched.priceDelta === "number") price += matched.priceDelta;
      if (typeof matched.priceOrigDelta === "number") priceOrig += matched.priceOrigDelta;

      // Cách 3: map theo key (ví dụ size S/M/L)
      if (matched.priceMap && typeof matched.priceMap === "object") {
        const mapKey = matched.priceKey || selVal;
        if (typeof matched.priceMap[mapKey] === "number") {
          price = matched.priceMap[mapKey];
        }
      }
    }
  });

  // Đảm bảo không âm & gán lại vào variant để selectVariant() hiển thị đúng
  price = Math.max(0, price);
  priceOrig = Math.max(price, priceOrig); // giá gốc >= giá bán (an toàn)
  variant["Giá"] = price;
  variant["Giá gốc"] = priceOrig;

  // 6) (Tuỳ chọn) cập nhật id theo thuộc tính phân biệt (ví dụ Kích cỡ) để tách SKU
  // Giữ nguyên nếu không muốn đổi
  const sizeKey = (window.sizeKeyOverride || "Kích cỡ");
  if (selected[sizeKey]) {
    variant.id = `${(window.baseVariant?.id || "item")}-${selected[sizeKey]}`
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  // 7) Kết thúc: chuyển cho renderer
  selectVariant(variant);
}


function selectVariant(data) {
    // ✅ Nếu có __voucherWaiting → gán vào voucherByProduct
  if (window.__voucherWaiting?.amount) {
  window.voucherByProduct = window.voucherByProduct || {};
  if (!window.voucherByProduct[data.id]) {
    window.voucherByProduct[data.id] = window.__voucherWaiting.amount;
  }
}

// ✅ Phantom mặc định giảm 300k
if (["phantom","omeage"].includes(data.id)) {
  window.voucherByProduct[data.id] = 300000;
}
  window.selectedVariant = data;

  const mainImage = document.getElementById("mainImage");
  const productPrice = document.getElementById("productPrice");
  const productOriginalPrice = document.getElementById("productOriginalPrice");
  const productVariantText = document.getElementById("productVariantText");
  const voucherLabel = document.getElementById("voucherLabel");

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
      if (data[key]) selectedText.push(data[key]);
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
    setTimeout(() => bindAddToCartButton(), 100);
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

    atcBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (!isCartPopupOpen) {
        toggleCartPopup(true);
      } else {
        const quantity = parseInt(document.getElementById("quantityInput")?.value) || 1;
        if (!window.selectedVariant) {
          return alert("Vui lòng chọn phân loại sản phẩm.");
        }

        const requiredKeys = window.allAttributes.map(a => a.key);
        const selectedKeys = Object.keys(window.selectedVariant);
        const isComplete = requiredKeys.every(key => selectedKeys.includes(key));
        if (!isComplete) {
          return alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
        }

        const product = window.selectedVariant;
        const loai = window.productCategory || "unknown";
        const voucherAmount = window.voucherByProduct?.[product.id] || 0;
        const phanLoaiText = requiredKeys.map(key => product[key]).join(" - ");
        product["Phân loại"] = phanLoaiText;

        window.cart.push({
          ...product,
          quantity,
          loai,
          voucher: voucherAmount > 0 ? { amount: voucherAmount } : undefined
        });
        saveCart();

        if (typeof trackBothPixels === "function") {
          trackBothPixels("AddToCart", {
            content_id: product.id,
            content_name: phanLoaiText,
            content_category: product.category || loai,
            content_page: window.productPage || "unknown",
            value: product.Giá,
            currency: "VND"
          });
        }

        fetch("https://hook.eu2.make.com/31c0jdh2vkvkjcnaenbm3kyze8fp3us3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_id: product.id,
            content_name: phanLoaiText,
            content_category: product.category || loai,
            content_page: window.productPage || "unknown",
            value: product.Giá,
            currency: "VND",
            timestamp: new Date().toISOString()
          })
        }).catch(err => {
          console.warn("⚠️ Không thể gửi Make:", err);
        });

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
  closeBtns.forEach(btn => btn.addEventListener("click", () => toggleCartPopup(false)));
  window.toggleForm = () => toggleCartPopup(true);
  initCartPopup();
});
