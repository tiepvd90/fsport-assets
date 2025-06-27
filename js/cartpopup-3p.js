window.selectedVariant = {};
window.cart = window.cart || [];
let isCartEventBound = false;
let isCartPopupOpen = false;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const productPage = window.productPage || "default";
  const jsonUrl = container?.getAttribute("data-json") || `/json/${window.productCategory}/${window.productPage}.json`;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      if (data["thuộc_tính"] && data["biến_thể"]?.length === 1) {
        window.allAttributes = data["thuộc_tính"];
        window.baseVariant = data["biến_thể"][0];
        window.productCategory = data["category"] || data["biến_thể"][0]?.category || "unknown";

        renderOptions(window.allAttributes);
        bindAddToCartButton();
      } else {
        console.error("❌ JSON không đúng định dạng đơn giản (1 biến thể).", data);
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

    // 👉 Nếu là text input
    if (attr.input === "text") {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "variant-text-input";
      input.placeholder = "Nhập nội dung in lên áo...";
      input.dataset.key = attr.key;
      input.addEventListener("input", (e) => {
        window.selectedVariant[attr.key] = e.target.value;
      });
      group.appendChild(input);
      container.appendChild(group);
      return;
    }

    // 👉 Nếu là chọn button hoặc thumbnail
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
    container.appendChild(group);
  });

  // 👉 Auto chọn lựa chọn đầu tiên của từng nhóm
  container.querySelectorAll(".variant-thumb").forEach((el, i) => {
    if (i === 0 || el.dataset.key.toLowerCase() === "design") el.click();
  });
}

function updateSelectedVariant() {
  const selected = { ...window.selectedVariant };
  document.querySelectorAll(".variant-thumb.selected").forEach(btn => {
    selected[btn.dataset.key] = btn.dataset.value;
  });

  const variant = {
    ...window.baseVariant,
    ...selected
  };

  // ✅ Lấy ảnh theo design
  const designKey = "design";
  const designVal = selected[designKey];
  const designOptions = window.allAttributes.find(a => a.key === designKey)?.values || [];
  const matchedDesign = designOptions.find(v => typeof v === "object" && v.text === designVal);
  variant["Ảnh"] = matchedDesign?.image || "";

  selectVariant(variant);
}

function selectVariant(data) {
  window.selectedVariant = data;

  const mainImage = document.getElementById("mainImage");
  const productPrice = document.getElementById("productPrice");
  const productOriginalPrice = document.getElementById("productOriginalPrice");
  const productVariantText = document.getElementById("productVariantText");

  if (mainImage) mainImage.src = data.Ảnh || "";

  const voucherAmount = window.voucherByProduct?.[data.id] || 0;
  const finalPrice = Math.max(0, data.Giá - voucherAmount);

  const oldFinal = document.getElementById("finalPriceLine");
  if (oldFinal) oldFinal.remove();

  if (voucherAmount > 0) {
    productPrice.textContent = data.Giá.toLocaleString() + "đ";
    productPrice.style.color = "black";
    productPrice.style.textDecoration = "line-through";

    productOriginalPrice.style.display = "none";
    document.getElementById("voucherLabel").textContent = `Voucher: ${voucherAmount.toLocaleString()}đ`;

    const finalLine = document.createElement("div");
    finalLine.id = "finalPriceLine";
    finalLine.textContent = finalPrice.toLocaleString() + "đ";
    finalLine.style.color = "#d0021b";
    finalLine.style.fontWeight = "bold";
    finalLine.style.fontSize = "21px";
    document.getElementById("voucherLabel")?.parentElement?.appendChild(finalLine);
  } else {
    productPrice.textContent = data.Giá.toLocaleString() + "đ";
    productPrice.style.color = "#d0021b";
    productPrice.style.textDecoration = "none";

    productOriginalPrice.textContent = data["Giá gốc"].toLocaleString() + "đ";
    productOriginalPrice.style.display = "inline";
    document.getElementById("voucherLabel").style.display = "none";
  }

  if (productVariantText) {
    const selectedText = [];
    for (let key in data) {
      if (["Ảnh", "Giá", "Giá gốc", "id", "category"].includes(key)) continue;
      selectedText.push(data[key]);
    }
    productVariantText.textContent = selectedText.join(", ");
  }
}

function bindAddToCartButton() {
  const atcBtn = document.getElementById("btn-atc");
  if (atcBtn && !isCartEventBound) {
    isCartEventBound = true;

    atcBtn.addEventListener("click", () => {
      const quantity = parseInt(document.getElementById("quantityInput")?.value) || 1;
      const requiredKeys = window.allAttributes.map(a => a.key);
      const selectedKeys = Object.keys(window.selectedVariant);
      const isComplete = requiredKeys.every(key => {
        const val = window.selectedVariant[key];
        return val !== undefined && val !== "";
      });
      if (!isComplete) return alert("Vui lòng chọn và nhập đầy đủ phân loại sản phẩm.");

      const product = { ...window.selectedVariant };
      const loai = window.productCategory || "unknown";
      const voucherAmount = window.voucherByProduct?.[product.id] || 0;

      product["Phân loại"] = requiredKeys.map(k => product[k]).join(" - ");

      window.cart.push({
        ...product,
        quantity,
        loai,
        voucher: voucherAmount > 0 ? { amount: voucherAmount } : undefined
      });
      saveCart();
      toggleCartPopup(false);
      if (typeof showCheckoutPopup === "function") showCheckoutPopup();
    });
  }
}

function toggleCartPopup(show = true) {
  const popup = document.getElementById("cartPopup");
  const content = popup?.querySelector(".cart-popup-content");
  if (!popup || !content) return;

  popup.style.display = show ? "flex" : "none";
  popup.classList.toggle("hidden", !show);
  isCartPopupOpen = show;
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".cart-popup-close, .cart-popup-overlay").forEach(btn =>
    btn.addEventListener("click", () => toggleCartPopup(false))
  );
  initCartPopup();
});
