/* =========================================================================
 * cartpopup-4p.js — v4 (multi-variant with conditional visibility)
 * - Hỗ trợ thuộc tính phụ thuộc "when"
 * - "when" có thể là object {Key:[...]} hoặc string "Key=Value"
 * - Chỉ bắt buộc chọn các nhóm đang hiển thị
 * - Giữ nguyên hành vi: voucher, pixel, Make webhook, ảnh theo mainImageKey
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
          bindAddToCartButtonV4();
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

          thumb.addEventListener("click", () => {
            $$('.variant-thumb[data-key="' + attr.key + '"]').forEach(el => el.classList.remove("selected"));
            thumb.classList.add("selected");
            updateSelectedVariant();
          });

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
    (window.allAttributes || []).forEach(attr => {
      if (!isAttrVisible(attr, selections)) return;

      // Chỉ auto-pick cho nhóm button/thumbnail, không auto cho input text
      if (attr.input === "text") return;

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
        const selEl = $(`.variant-group[data-key="${attr.key}"] .variant-thumb.selected`);
        if (selEl) out[attr.key] = selEl.dataset.value;
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
        if (data[key]) selectedText.push(data[key]);
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
      setTimeout(() => bindAddToCartButtonV4(), 100);
    } else {
      content.classList.remove("animate-slideup");
      popup.classList.add("hidden");
      setTimeout(() => { popup.style.display = "none"; }, 300);
      isCartPopupOpen = false;
    }
  }

  function bindAddToCartButtonV4() {
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
            // text: cho phép rỗng nếu không required? -> ở đây coi là required
            const v = window.currentSelections[key] ?? "";
            return typeof v === "string"; // có tồn tại (rỗng cũng là string)
          }
          return selectedKeys.includes(key);
        });
        if (!isComplete) {
          alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
          return;
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
        saveCartV4();

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

  function saveCartV4() {
    try {
      localStorage.setItem("cart", JSON.stringify(window.cart));
    } catch (e) {
      console.warn("⚠️ Lưu cart thất bại:", e);
    }
  }

  // ====== expose minimal APIs (tuỳ trang có thể gọi) ======
  window.cartpopupV4 = {
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
    initCartPopup();
  });
// --- Expose & auto-init ---
window.initCartPopup = initCartPopup; // cho phép trang gọi trực tiếp

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCartPopup());
} else {
  // Nếu file được nạp sau DOMContentLoaded, vẫn init được
  initCartPopup();
}

})();
