window.selectedVariant = null;
window.cart = window.cart || [];
let isCartEventBound = false;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const jsonUrl = container?.getAttribute("data-json");
  if (!jsonUrl) return;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      window.allAttributes = data["thuộc_tính"];
      window.allVariants = data["biến_thể"];
      renderOptions(window.allAttributes);
      bindAddToCartButton();
    });
}

function renderOptions(attributes) {
  const container = document.getElementById("variantList");
  container.innerHTML = "";

  attributes.forEach(attr => {
    const group = document.createElement("div");
    group.className = "variant-group";
    group.innerHTML = `<div class="variant-label">${attr.key}</div>`;

    if (attr.key === "ff_text") {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Nhập text in áo (tuỳ chọn)";
      input.id = "ff_text_input";
      input.className = "variant-input";
      group.appendChild(input);
    } else {
      attr.values.forEach(val => {
        const btn = document.createElement("div");
        btn.className = "variant-btn";
        btn.textContent = val;
        btn.dataset.key = attr.key;
        btn.dataset.value = val;

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
}

function updateSelectedVariant() {
  const selected = {};
  document.querySelectorAll(".variant-btn.selected").forEach(btn => {
    selected[btn.dataset.key] = btn.dataset.value;
  });
  const text = document.getElementById("ff_text_input")?.value || "";
  selected["ff_text"] = text;

  const variant = window.allVariants.find(v => v.ff_design === selected["ff_design"]);
  window.selectedVariant = { ...variant, ...selected };

  selectVariant(window.selectedVariant);
}

function selectVariant(data) {
  const mainImage = document.getElementById("mainImage");
  if (mainImage) mainImage.src = data.Ảnh || "";

  const productPrice = document.getElementById("productPrice");
  const voucherAmount = window.voucherByProduct?.[data.id] || 0;
  const finalPrice = Math.max(0, data.Giá - voucherAmount);

  if (productPrice) productPrice.textContent = finalPrice.toLocaleString() + "đ";
}

function bindAddToCartButton() {
  const btn = document.getElementById("btn-atc");
  if (btn && !isCartEventBound) {
    isCartEventBound = true;

    btn.addEventListener("click", () => {
      if (!window.selectedVariant || !window.selectedVariant.ff_design || !window.selectedVariant.ff_color || !window.selectedVariant.ff_size) {
        alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
        return;
      }
      const product = window.selectedVariant;
      window.cart.push({ ...product, quantity: 1 });
      saveCart();

      if (typeof trackBothPixels === "function") {
        trackBothPixels("AddToCart", {
          content_id: product.id,
          content_name: product.ff_design,
          value: product.Giá,
          currency: "VND"
        });
      }

      fetch("https://hook.eu2.make.com/your-make-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: product.id,
          content_name: product.ff_design,
          content_category: product.category || "unknown",
          content_page: window.productPage || "unknown",
          ff_text: product.ff_text || "",
          ff_color: product.ff_color,
          ff_size: product.ff_size,
          quantity: 1,
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
