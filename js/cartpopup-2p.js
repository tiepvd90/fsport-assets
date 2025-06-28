// ✅ cartpopup-2p.js: Dùng cho sản phẩm có 2 phân loại (ví dụ Màu & Size)

window.selectedVariant = null;
window.cart = window.cart || [];
let isCartEventBound = false;
let isCartPopupOpen = false;

function initCartPopup() {
  const container = document.getElementById("cartContainer");
  const productPage = window.productPage || "default";
  const category = window.productCategory || "tshirt";
  console.log("📝 [cartpopup-2p.js] window.productCategory:", category);
  const primaryUrl = container?.getAttribute("data-json") || `/json/${productPage}.json`;
  const fallbackUrl = `/json/${category}/${productPage}.json`;

  fetch(primaryUrl)
    .then(res => {
      if (!res.ok) throw new Error("Primary JSON not found");
      return res.json();
    })
    .catch(() => fetch(fallbackUrl).then(res => res.json()))
    .then(data => {
      if (data["thuộc_tính"] && data["biến_thể"]?.length === 1) {
        window.allAttributes = data["thuộc_tính"];
        window.baseVariant = data["biến_thể"][0];
        window.productCategory = data["category"]
          || (Array.isArray(data["biến_thể"]) ? data["biến_thể"][0]?.category : "unknown")
          || "unknown";

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
    let noteText = "";
if (attr.key.toLowerCase().includes("size")) {
  const noteMap = {
    "ysandal5568": "Trừ 2 size so với giày thể thao, ví dụ: hàng ngày đi giày thể thao size 40 => Chọn dép này size 38",
    "ysandal5560": "Trừ 2 size so với giày thể thao, ví dụ: hàng ngày đi giày thể thao size 42 => Chọn dép này size 40",
    "ysandalbn68": "Trừ 1 size so với giày thể thao, ví dụ: hàng ngày đi giày thể thao size 40 => Chọn dép này size 39",
  };
  const currentPage = window.productPage || "";
  if (noteMap[currentPage]) {
    noteText = ` <span class="sizenote">${noteMap[currentPage]}</span>`;
  }
}

group.innerHTML = `<div class="variant-label">${attr.label}:${noteText}</div>`;


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

  const firsts = container.querySelectorAll(".variant-thumb");
  if (firsts[0]) firsts[0].click();
}

function updateSelectedVariant() {
  const selected = {};
  document.querySelectorAll(".variant-thumb.selected").forEach(btn => {
    selected[btn.dataset.key] = btn.dataset.value;
  });

  const variant = {
    ...window.baseVariant,
    ...selected
  };

  const colorKey = Object.keys(selected).find(k => /màu/i.test(k));
  const colorVal = selected[colorKey];
  const colorOptions = window.allAttributes?.find(a => a.key === colorKey)?.values || [];
  const matchedColor = colorOptions.find(v => typeof v === "object" && v.text === colorVal);
  variant["Ảnh"] = matchedColor?.image || "";

  selectVariant(variant);
}

function selectVariant(data) {
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

    // ✅ Thêm dòng này để tránh lỗi lần đầu
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

        // ✅ Kiểm tra đã chọn đủ tất cả thuộc tính chưa
        const requiredKeys = window.allAttributes.map(a => a.key);
        const selectedKeys = Object.keys(window.selectedVariant);
        const isComplete = requiredKeys.every(key => selectedKeys.includes(key));
        if (!isComplete) {
          return alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
        }

        const product = window.selectedVariant;
        const loai = window.productCategory || "unknown";
        const voucherAmount = window.voucherByProduct?.[product.id] || 0;

        // ✅ Gộp phân loại
        const phanLoaiText = requiredKeys.map(key => product[key]).join(" - ");
        product["Phân loại"] = phanLoaiText;

        // ✅ Thêm vào giỏ
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
// ✅ Gửi log về Make.com
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
  console.warn("⚠️ Không thể gửi dữ liệu về Make:", err);
});
// END Gửi log về Make.com
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
