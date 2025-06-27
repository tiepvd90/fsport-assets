// ✅ cartpopup-3p.js: Dùng cho sản phẩm có 3 phân loại (vd: Design, Color, Size)

window.selectedVariant = null;
window.cart = window.cart || [];
let isCartEventBound = false;
let isCartPopupOpen = false;

function initCartPopup() {
  const jsonUrl = `json/${window.category}/${window.productPage}.json`;
  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      window.allAttributes = data["thuộc_tính"];
      window.allVariants = data["biến_thể"];
      window.productCategory = data["category"] || "unknown";
      renderOptions(window.allAttributes);
      bindAddToCartButton();
    });
}

// Giữ nguyên các hàm còn lại như cũ


function renderOptions(attributes) {
  const container = document.getElementById("variantList");
  if (!container) return;
  container.innerHTML = "";

  attributes.forEach(attr => {
    const group = document.createElement("div");
    group.className = "variant-group";
    let noteText = "";

    group.innerHTML = `<div class="variant-label">${attr.label || attr.key}:${noteText}</div>`;

    if (attr.key === "ff_text") {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Nhập text in áo (tuỳ chọn)";
      input.id = "ff_text_input";
      input.className = "variant-input";
      input.addEventListener("input", () => updateSelectedVariant());
      group.appendChild(input);
    } else {
      attr.values.forEach(val => {
        const value = typeof val === "string" ? val : val.text;
        const btn = document.createElement("div");
        btn.className = "variant-btn";
        btn.textContent = value;
        btn.dataset.key = attr.key;
        btn.dataset.value = value;

        btn.addEventListener("click", () => {
          document.querySelectorAll(`.variant-btn[data-key='${attr.key}']`).forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          updateSelectedVariant();
        });

        group.appendChild(btn);
      });
    }

    container.appendChild(group);
  });

  const firsts = container.querySelectorAll(".variant-btn");
  if (firsts[0]) firsts[0].click();
}

function updateSelectedVariant() {
  const selected = {};
  document.querySelectorAll(".variant-btn.selected").forEach(btn => {
    selected[btn.dataset.key] = btn.dataset.value;
  });
  const text = document.getElementById("ff_text_input")?.value || "";
  selected["ff_text"] = text;

  const variant = window.allVariants.find(v => {
    return v.ff_design === selected["ff_design"] && v.ff_color === selected["ff_color"] && v.ff_size === selected["ff_size"];
  });

  if (variant) {
    window.selectedVariant = { ...variant, ...selected };
    selectVariant(window.selectedVariant);
  } else {
    window.selectedVariant = null;
  }
}

function selectVariant(data) {
  const mainImage = document.getElementById("mainImage");
  const productPrice = document.getElementById("productPrice");
  const productOriginalPrice = document.getElementById("productOriginalPrice");
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
}

function bindAddToCartButton() {
  const btn = document.getElementById("btn-atc");
  if (btn && !isCartEventBound) {
    isCartEventBound = true;

    btn.addEventListener("click", () => {
      const product = window.selectedVariant;
      if (!product || !product.ff_design || !product.ff_color || !product.ff_size) {
        alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
        return;
      }

      const quantity = parseInt(document.getElementById("quantityInput")?.value) || 1;
      const requiredKeys = window.allAttributes.map(a => a.key);
      const selectedKeys = Object.keys(product);
      const isComplete = requiredKeys.every(key => selectedKeys.includes(key));

      if (!isComplete) {
        alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
        return;
      }

      const phanLoaiText = requiredKeys.filter(k => k !== "ff_text").map(k => product[k]).join(" - ");
      product["Phân loại"] = phanLoaiText;

      window.cart.push({
        ...product,
        quantity,
        loai: window.productCategory,
        voucher: window.voucherByProduct?.[product.id] > 0 ? { amount: window.voucherByProduct[product.id] } : undefined
      });
      saveCart();

      if (typeof trackBothPixels === "function") {
        trackBothPixels("AddToCart", {
          content_id: product.id,
          content_name: phanLoaiText,
          content_category: product.category || window.productCategory,
          content_page: window.productPage || "unknown",
          value: product.Giá,
          currency: "VND"
        });
      }

      fetch("https://hook.eu2.make.com/your-make-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: product.id,
          content_name: phanLoaiText,
          content_category: product.category || window.productCategory,
          content_page: window.productPage || "unknown",
          ff_text: product.ff_text || "",
          ff_color: product.ff_color,
          ff_size: product.ff_size,
          quantity,
          value: product.Giá,
          currency: "VND",
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        console.warn("⚠️ Không thể gửi dữ liệu về Make:", err);
      });

      if (typeof showCheckoutPopup === "function") showCheckoutPopup();
    });
  }
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
}

document.addEventListener("DOMContentLoaded", () => {
  initCartPopup();
});
