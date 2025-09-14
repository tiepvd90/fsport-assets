/* =========================================================================
 * cartpopup-5p.js — (multi-variant + multi-select + conditional input)
 * 
 * ✅ Hỗ trợ chọn nhiều giá trị (multi-select) trong 1 thuộc tính (ví dụ: chọn 2–10 tranh)
 * ✅ Tự động tính giá = số lựa chọn × giá của từng lựa chọn (theo kích cỡ)
 * ✅ Hỗ trợ thuộc tính phụ thuộc (sử dụng "when")
 * ✅ Hỗ trợ text input riêng cho từng giá trị nếu có "textinput": true (ví dụ: "Tên Bạn")
 * ✅ Chỉ bắt buộc chọn các nhóm đang hiển thị (ẩn thì không cần)
 * ✅ Giữ nguyên các hành vi cũ: 
 *    - Gắn voucher riêng từng sản phẩm (voucherByProduct)
 *    - Tự động hiển thị ảnh theo mainImageKey
 *    - Pixel Facebook (AddToCart), Make.com webhook
 * ========================================================================= */


(function () {
  "use strict";

  // ====== Public-ish state (giữ tương thích cũ) ======
  window.selectedVariant = null;
  window.cart = window.cart || [];
  window.currentSelections = {}; // selections sạch sau khi ẩn/hiện
  let isCartEventBound = false;
  let isCartPopupOpen = false;

  // ====== Config đường dẫn JSON ======
  const productPage = (window.productPage || "default").toLowerCase();
  const category = (window.productCategory || "tshirt").toLowerCase();
  const jsonUrl = `/json/${category}/${productPage}.json`;

  // ====== DOM helpers ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ====== Utils: parse when ======
  // - Nếu when là string: "Key=Value" -> { Key: "Value" }
  // - Nếu when là object: giữ nguyên { Key: "Value" | [values] }
  function normalizeWhen(when) {
    if (!when) return null;
    if (typeof when === "string") {
      const idx = when.indexOf("=");
      if (idx === -1) return null;
      const k = when.slice(0, idx).trim();
      const v = when.slice(idx + 1).trim();
      return { [k]: v };
    }
    if (typeof when === "object") return when;
    return null;
  }

  function getSelectionValue(selections, key) {
    return selections ? selections[key] : undefined;
  }

  // Kiểm tra thuộc tính có hiển thị với selections hiện tại hay không
  function isAttrVisible(attr, selections) {
    const rule = normalizeWhen(attr.when);
    if (!rule) return true;
    // Tất cả điều kiện trong "when" phải đúng
    return Object.entries(rule).every(([depKey, allowed]) => {
      const sel = getSelectionValue(selections, depKey);
      if (Array.isArray(allowed)) return allowed.includes(sel);
      return sel === allowed;
    });
  }

  // ====== Fetch JSON & khởi tạo ======
  function initCartPopup() {
    fetch(jsonUrl)
      .then(res => res.json())
      .then(data => {
        // Validate định dạng
        if (data["thuộc_tính"] && data["biến_thể"]?.length === 1) {
          window.allAttributes = data["thuộc_tính"];
          window.baseVariant = data["biến_thể"][0];
          window.productCategory = data["category"] || data["biến_thể"][0]?.category || category;
          window.mainImageKey = data["mainImageKey"] || (
            data["thuộc_tính"].find(a => a.display === "thumbnail")?.key || null
          );

          renderOptions(window.allAttributes);
          bindAddToCartButton();
        } else {
          console.error("❌ JSON không đúng định dạng.", data);
        }
      })
      .catch(err => console.warn("⚠️ Không thể tải JSON:", err));
  }

  // ====== Render nhóm thuộc tính ======
  function renderOptions(attributes) {
    const container = $("#variantList");
    if (!container) return;
    container.innerHTML = "";

    attributes.forEach(attr => {
      const group = document.createElement("div");
      group.className = "variant-group";
      group.setAttribute("data-key", attr.key);

      const label = document.createElement("div");
      label.className = "variant-label";
      label.textContent = `${attr.label}:`;
      group.appendChild(label);

      if (attr.input === "text") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = `input-${attr.key}`;
        input.placeholder = attr.placeholder || "Nhập nội dung...";
        input.style.cssText = "width:100%;padding:8px;font-size:14px;box-sizing:border-box;border:1px solid #ccc;border-radius:6px;";
        input.addEventListener("input", () => updateSelectedVariant());
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

          if (displayMode === "thumbnail") {
            thumb.innerHTML = `
              <img src="${image || ""}" alt="${value}" />
              <div class="variant-title">${value}</div>
            `;
          } else {
            thumb.textContent = value;
          }

          if (attr.multiSelect) {
  // MULTI SELECT: toggle nhiều lựa chọn
  thumb.addEventListener("click", () => {
    thumb.classList.toggle("selected");
    updateSelectedVariant();
  });
} else {
  // SINGLE SELECT: giữ như cũ
  thumb.addEventListener("click", () => {
    $$('.variant-thumb[data-key="' + attr.key + '"]').forEach(el => el.classList.remove("selected"));
    thumb.classList.add("selected");
    updateSelectedVariant();
  });
}


          wrapper.appendChild(thumb);
        });

        group.appendChild(wrapper);
      }

      container.appendChild(group);
    });

    // Gọi 1 lần để tính visible & auto-pick cho nhóm đang hiện
    updateSelectedVariant(true); // true = allowAutoPickFirst
  }

  // ====== Áp visibility + dọn selections không hợp lệ ======
  function applyVisibility(selections) {
    (window.allAttributes || []).forEach(attr => {
      const groupEl = $(`.variant-group[data-key="${attr.key}"]`);
      if (!groupEl) return;

      const visible = isAttrVisible(attr, selections);
      groupEl.style.display = visible ? "" : "none";

      if (!visible) {
        // Xoá chọn cũ nếu có
        groupEl.querySelectorAll(".variant-thumb.selected").forEach(el => el.classList.remove("selected"));
        if (selections && selections[attr.key] != null) delete selections[attr.key];
        // Nếu input text
        const input = $(`#input-${attr.key}`);
        if (input && selections) {
          input.value = "";
          delete selections[attr.key];
        }
      }
    });
  }

  // ====== Auto pick lựa chọn đầu tiên cho nhóm đang hiển thị (nếu chưa chọn) ======
  function autoPickFirstForVisible(selections) {
  const mainKey = window.mainImageKey;

  (window.allAttributes || []).forEach(attr => {
    if (!isAttrVisible(attr, selections)) return;

    // ✅ Chỉ auto-pick nếu là nhóm chính (mainImageKey)
    if (attr.key !== mainKey) return;

    const already = selections[attr.key];
    if (already) return;

    const groupEl = $(`.variant-group[data-key="${attr.key}"]`);
    if (!groupEl) return;
    const firstBtn = groupEl.querySelector(".variant-thumb");
    if (firstBtn) {
      firstBtn.classList.add("selected");
      selections[attr.key] = firstBtn.dataset.value;
    }
  });
}

  // ====== Thu thập selections sạch từ DOM (chỉ nhóm đang hiển thị) ======
  function collectCleanSelections() {
    const out = {};
    (window.allAttributes || []).forEach(attr => {
      if (!isAttrVisible(attr, window.currentSelections)) return;

      if (attr.input === "text") {
        out[attr.key] = $(`#input-${attr.key}`)?.value || "";
      } else {
        if (attr.multiSelect) {
  const selectedEls = $$(`.variant-group[data-key="${attr.key}"] .variant-thumb.selected`);
  const values = selectedEls.map(el => el.dataset.value);
  if (values.length > 0) out[attr.key] = values;
} else {
  const selEl = $(`.variant-group[data-key="${attr.key}"] .variant-thumb.selected`);
  if (selEl) out[attr.key] = selEl.dataset.value;
}

      }
    });
    return out;
  }

  // ====== Main update: selections → visibility → variant → render ======
  function updateSelectedVariant(allowAutoPickFirst = false) {
    // 1) Thu thập các chọn hiện tại (thô)
    const raw = {};
    $$(".variant-thumb.selected").forEach(btn => {
      raw[btn.dataset.key] = btn.dataset.value;
    });
    (window.allAttributes || []).forEach(attr => {
      if (attr.input === "text") {
        raw[attr.key] = $(`#input-${attr.key}`)?.value || "";
      }
    });

    // 2) Áp điều kiện hiển thị & dọn selections ẩn
    applyVisibility(raw);

    // 3) Auto pick cho nhóm đang hiển thị nhưng chưa có chọn (tuỳ chọn)
    if (allowAutoPickFirst) {
      autoPickFirstForVisible(raw);
      // Sau auto pick cần re-apply visibility (phòng nhóm con phụ thuộc)
      applyVisibility(raw);
    }

    // 4) Lấy selections sạch theo nhóm đang hiển thị
    const clean = collectCleanSelections();
    window.currentSelections = clean;

    // 5) Tạo variant từ base + selections
    const variant = { ...(window.baseVariant || {}), ...clean };

    // 6) Ảnh theo mainImageKey
    if (window.mainImageKey) {
      const mainVal = clean[window.mainImageKey];
      const mainAttr = (window.allAttributes || []).find(a => a.key === window.mainImageKey);
      const matchedValue = mainAttr?.values?.find(v => (typeof v === "object" ? v.text === mainVal : v === mainVal));
      if (matchedValue && typeof matchedValue === "object" && matchedValue.image) {
        variant["Ảnh"] = matchedValue.image;
      } else if (!variant["Ảnh"]) {
        variant["Ảnh"] = "";
      }
    }

    // 7) Tính giá (giữ nguyên hành vi + override)
    let price = Number((window.baseVariant || {})["Giá"]) || 0;
    let priceOrig = Number((window.baseVariant || {})["Giá gốc"]) || price || 0;
    // Nếu có multi-select (ví dụ: Thiết Kế), thì nhân số lựa chọn
const mainAttr = window.allAttributes.find(a => a.multiSelect);
let numTranh = 1;

if (mainAttr) {
  const selectedTranh = clean[mainAttr.key];
  if (Array.isArray(selectedTranh)) numTranh = selectedTranh.length;
}

// Áp dụng lại giá sau khi lấy giá từ size
price = price * numTranh;
priceOrig = priceOrig * numTranh;

    (window.allAttributes || []).forEach(attr => {
      if (!isAttrVisible(attr, clean)) return; // chỉ tính những nhóm đang hiển thị
      const selVal = clean[attr.key];
      if (!selVal || !Array.isArray(attr?.values)) return;

      const matched = attr.values.find(v => (typeof v === "object" ? v.text === selVal : v === selVal));
      if (matched && typeof matched === "object") {
        if (typeof matched.GiaOverride === "number") price = matched.GiaOverride;
        if (typeof matched.GiaGocOverride === "number") priceOrig = matched.GiaGocOverride;
        if (typeof matched.priceDelta === "number") price += matched.priceDelta;
        if (typeof matched.priceOrigDelta === "number") priceOrig += matched.priceOrigDelta;
        if (matched.priceMap && typeof matched.priceMap === "object") {
          const mapKey = matched.priceKey || selVal;
          if (typeof matched.priceMap[mapKey] === "number") price = matched.priceMap[mapKey];
        }
      }
    });

    price = Math.max(0, price);
    priceOrig = Math.max(price, priceOrig);
    variant["Giá"] = price;
    variant["Giá gốc"] = priceOrig;

    // 8) SKU id theo 1 key tuỳ chọn (ví dụ "Kích cỡ")
    const sizeKey = (window.sizeKeyOverride || "Kích cỡ");
    if (clean[sizeKey]) {
      variant.id = `${(window.baseVariant?.id || "item")}-${clean[sizeKey]}`
        .replace(/\s+/g, "")
        .toLowerCase();
    }

    // 9) Render ra UI (giá, ảnh, text…)
    selectVariant(variant);
  }

  // ====== Render giá/ảnh/nhãn voucher ======
  function selectVariant(data) {
    // ✅ Nếu có __voucherWaiting → gán vào voucherByProduct
    if (window.__voucherWaiting?.amount) {
      window.voucherByProduct = window.voucherByProduct || {};
      if (!window.voucherByProduct[data.id]) {
        window.voucherByProduct[data.id] = window.__voucherWaiting.amount;
      }
    }

    window.selectedVariant = data;

    const mainImage = $("#mainImage");
    const productPrice = $("#productPrice");
    const productOriginalPrice = $("#productOriginalPrice");
    const productVariantText = $("#productVariantText");
    const voucherLabel = $("#voucherLabel");

    if (mainImage) mainImage.src = data.Ảnh || "";

    const voucherAmount = window.voucherByProduct?.[data.id] || 0;
    const finalPrice = Math.max(0, data.Giá - voucherAmount);

    const oldFinal = $("#finalPriceLine");
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
      const ignore = new Set(["Ảnh", "Giá", "Giá gốc", "id", "category"]);
      const selectedText = [];
      for (let key in data) {
  if (ignore.has(key)) continue;
  const val = data[key];
  if (Array.isArray(val)) {
    selectedText.push(val.join(", "));
  } else if (val) {
    selectedText.push(val);
  }
}

      productVariantText.textContent = selectedText.join(", ");
      productVariantText.style.marginTop = "16px";
    }
  }

  // ====== ATC / Cart / Popup ======
  function changeQuantity(delta) {
    const input = $("#quantityInput");
    const value = parseInt(input?.value || "1", 10);
    if (input) input.value = Math.max(1, value + delta);
  }

  function toggleCartPopup(show = true) {
    const popup = $("#cartPopup");
    const content = popup?.querySelector(".cart-popup-content");
    if (!popup || !content) return;

    if (show) {
      popup.style.display = "flex";
      content.classList.remove("animate-slideup");
      void content.offsetWidth; // reflow
      content.classList.add("animate-slideup");
      popup.classList.remove("hidden");
      isCartPopupOpen = true;
      setTimeout(() => bindAddToCartButton(), 100);
    } else {
      content.classList.remove("animate-slideup");
      popup.classList.add("hidden");
      setTimeout(() => { popup.style.display = "none"; }, 300);
      isCartPopupOpen = false;
    }
  }

  function bindAddToCartButton() {

    const atcBtn = $("#btn-atc");
    if (atcBtn && !isCartEventBound) {
      isCartEventBound = true;

      atcBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (!isCartPopupOpen) {
          toggleCartPopup(true);
          return;
        }

        const quantity = parseInt($("#quantityInput")?.value || "1", 10) || 1;
        if (!window.selectedVariant) {
          alert("Vui lòng chọn phân loại sản phẩm.");
          return;
        }

        // Chỉ bắt buộc những nhóm đang hiển thị
        const requiredKeys = (window.allAttributes || [])
          .filter(a => isAttrVisible(a, window.currentSelections))
          .map(a => a.key);

        const selectedKeys = Object.keys(window.selectedVariant);
        const isComplete = requiredKeys.every(key => {
  const attr = (window.allAttributes || []).find(a => a.key === key);
  if (attr?.input === "text") {
    const v = window.currentSelections[key]?.trim() || "";
    return v.length > 0; // ✅ bắt buộc phải có nội dung
  }
  return selectedKeys.includes(key);
});
        const attrMulti = window.allAttributes.find(a => a.multiSelect);
if (attrMulti) {
  const selected = window.currentSelections[attrMulti.key] || [];
  const count = Array.isArray(selected) ? selected.length : 0;
  if (count < attrMulti.minSelect) {
    alert(`Vui lòng chọn ít nhất ${attrMulti.minSelect} tranh.`);
    return;
  }
  if (count > attrMulti.maxSelect) {
    alert(`Chỉ được chọn tối đa ${attrMulti.maxSelect} tranh.`);
    return;
  }
}

        if (!isComplete) {
          alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
          return;
        }

        const product = window.selectedVariant;
// Kiểm tra nếu người dùng chọn "Tên Bạn"
const attrMulti = window.allAttributes.find(a => a.multiSelect);
if (attrMulti && Array.isArray(window.currentSelections[attrMulti.key])) {
  const hasTenBan = window.currentSelections[attrMulti.key].includes("Tên Bạn");

  if (hasTenBan) {
    const input = document.querySelector(`#input-Tên Bạn`);
    const value = input?.value?.trim();
    if (!value) {
      alert("Vui lòng nhập tên để in lên tranh.");
      return;
    }
    product["Tên In"] = value;
  }
}
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

        // Pixels (nếu có)
        if (typeof window.trackBothPixels === "function") {
          window.trackBothPixels("AddToCart", {
            content_id: product.id,
            content_name: phanLoaiText,
            content_category: product.category || loai,
            content_page: window.productPage || "unknown",
            value: product.Giá,
            currency: "VND"
          });
        }

        // Make webhook (nếu có)
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
        }).catch(err => console.warn("⚠️ Không thể gửi Make:", err));

        toggleCartPopup(false);
        if (typeof window.showCheckoutPopup === "function") window.showCheckoutPopup();
      });
    }
  }

  function saveCart() {
    try {
      localStorage.setItem("cart", JSON.stringify(window.cart));
    } catch (e) {
      console.warn("⚠️ Lưu cart thất bại:", e);
    }
  }

  // ====== expose minimal APIs (tuỳ trang có thể gọi) ======
  window.cartpopup = {
    changeQuantity: changeQuantity,
    toggle: toggleCartPopup,
    refresh: updateSelectedVariant
  };

  // ====== Wireup ======
  document.addEventListener("DOMContentLoaded", () => {
    // Close buttons
    $$(".cart-popup-close, .cart-popup-overlay").forEach(btn =>
      btn.addEventListener("click", () => toggleCartPopup(false))
    );

    // Form toggle alias
    window.toggleForm = () => toggleCartPopup(true);

    // Init
    <script>
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof initCartPopup === "function") {
      initCartPopup();
    } else {
      console.warn("⚠️ initCartPopup chưa sẵn sàng.");
    }
  });
</script>

  });
// --- Expose & auto-init ---
window.initCartPopup = initCartPopup; // cho phép trang gọi trực tiếp

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCartPopup());
} else {
  // Nếu file được nạp sau DOMContentLoaded, vẫn init được
  initCartPopup();
}
// ✓ Cho HTML gọi được các hàm cũ
window.initCartPopup = initCartPopup;
window.toggleCartPopup = toggleCartPopup;
window.changeQuantity = changeQuantity;

// (tuỳ chọn) expose object tiện dùng
window.cartpopup = {
  init: initCartPopup,
  toggle: toggleCartPopup,
  qty: changeQuantity,
};

})();
