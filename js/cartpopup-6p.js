/* =========================================================================
 * cartpopup-6p.js — Bộ 6 tranh (size + upload optional + note)
 * - 1 nhóm upload multiple (tối đa 6 ảnh)
 * - Upload Cloudinary ngay khi chọn file → lưu secure_url vào selections
 * - Tính giá theo size (GiaOverride/GiaGocOverride) × quantity
 * - Voucher/Pixel/Make giữ pattern cũ
 * ========================================================================= */

(function () {
  "use strict";

  // ====== Cloudinary config ======
  const CLOUD_NAME = "dbtngymwh";
  const UPLOAD_PRESET = "unsigned_funsport";
  const CLOUD_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  // ====== State ======
  window.cart = window.cart || [];
  window.selectedVariant = null;
  window.currentSelections = {}; // { "Kích Thước": "...", "Uploads": [], "note": "" }
  let isCartEventBound = false;
  let isCartPopupOpen = false;

  // ====== DOM helpers ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ====== JSON path ======
  function resolveJsonUrl() {
    const container = $("#cartContainer");
    const attr = container?.getAttribute("data-json");
    if (attr) return attr;
    const page = (window.productPage || "default").toLowerCase();
    const cat = (window.productCategory || "art").toLowerCase();
    return `/json/${cat}/${page}.json`;
  }

  // ====== Init ======
  async function initCartPopup() {
    try {
      const jsonUrl = resolveJsonUrl();
      const res = await fetch(jsonUrl);
      if (!res.ok) throw new Error("JSON not found: " + jsonUrl);
      const data = await res.json();

      window.allAttributes = data["thuộc_tính"];
      window.baseVariant = data["biến_thể"][0];
      window.productCategory = data["category"] || window.baseVariant?.category || "art";

      // ✅ Main image mặc định
      const mainImage = $("#mainImage");
      if (mainImage) {
        const sizeAttr = (data["thuộc_tính"] || []).find(a => a.key === "Kích Thước");
        if (sizeAttr?.values?.[0]?.image) {
          mainImage.src = sizeAttr.values[0].image;
        } else {
          mainImage.src = window.baseVariant?.["Ảnh"] || "";
        }
      }

      renderOptions(window.allAttributes);
      updatePriceUI(window.baseVariant?.["Giá"] || 0, window.baseVariant?.["Giá gốc"] || 0);
      bindAddToCartButton();
    } catch (err) {
      console.warn("⚠️ initCartPopup error:", err);
    }
  }

  // ====== Render options ======
  function renderOptions(attributes) {
    const container = $("#variantList");
    if (!container) return;
    container.innerHTML = "";

    attributes.forEach((attr) => {
      const group = document.createElement("div");
      group.className = "variant-group";
      group.dataset.key = attr.key;

      const label = document.createElement("div");
      label.className = "variant-label";
      label.textContent = `${attr.label}:`;
      group.appendChild(label);

      // 1) Button group (size)
      if (attr.display === "button" && Array.isArray(attr.values)) {
        const wrapper = document.createElement("div");
        wrapper.className = "variant-buttons";

        attr.values.forEach((val) => {
          const text = typeof val === "string" ? val : val.text;
          const btn = document.createElement("button");
          btn.className = "variant-thumb";
          btn.dataset.key = attr.key;
          btn.dataset.value = text;
          btn.type = "button";
          btn.textContent = text;

          btn.addEventListener("click", () => {
            wrapper.querySelectorAll(".variant-thumb").forEach((el) => el.classList.remove("selected"));
            btn.classList.add("selected");
            window.currentSelections[attr.key] = text;

            if (val.image) {
              const mainImage = $("#mainImage");
              if (mainImage) mainImage.src = val.image;
            }

            const gia = val.GiaOverride ?? window.baseVariant?.["Giá"] || 0;
            const giaGoc = val.GiaGocOverride ?? window.baseVariant?.["Giá gốc"] || gia;
            applyPriceAndUI(gia, giaGoc);
          });

          wrapper.appendChild(btn);
        });

        group.appendChild(wrapper);
      }

      // 2) Upload (tối đa 6 ảnh)
      else if (attr.upload === true) {
        window.currentSelections["Uploads"] = [];

        const wrapper = document.createElement("div");
        wrapper.className = "upload-group";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;

        input.addEventListener("change", async (e) => {
          const files = Array.from(e.target.files).slice(0, 6);
          const urls = [];
          for (const f of files) {
            try {
              const url = await uploadToCloudinary(f);
              urls.push(url);
            } catch (err) {
              console.warn("⚠️ Upload lỗi:", err);
            }
          }
          window.currentSelections["Uploads"] = urls;
          console.log("✅ Uploaded:", urls);
        });

        wrapper.appendChild(input);
        group.appendChild(wrapper);
      }

      // 3) Text input (note optional)
      else if (attr.input === "text") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = `input-${attr.key}`;
        input.placeholder = attr.placeholder || "";
        input.style.cssText = "width:100%;padding:8px;font-size:14px;box-sizing:border-box;border:1px solid #ccc;border-radius:6px;";
        input.addEventListener("input", () => {
          window.currentSelections[attr.key] = input.value || "";
        });
        group.appendChild(input);
      }

      container.appendChild(group);
    });

    applyPriceAndUI(window.baseVariant?.["Giá"] || 0, window.baseVariant?.["Giá gốc"] || 0);
  }

  // ====== Upload helper ======
  async function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUD_UPLOAD_URL);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) {
              resolve(res.secure_url);
            } else reject(res);
          } catch (err) {
            reject(err);
          }
        }
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      xhr.send(formData);
    });
  }

  // ====== Giá & voucher ======
  function applyPriceAndUI(basePrice, basePriceOrig) {
    const qty = Math.max(1, parseInt($("#quantityInput")?.value || "1", 10));
    const price = Math.max(0, Number(basePrice || 0)) * qty;
    const priceOrig = Math.max(price, Number(basePriceOrig || 0) * qty);

    const sizeKey = "Kích Thước";
    const sizeVal = window.currentSelections[sizeKey] || null;

    const idBase = (window.baseVariant?.id || "set-tranh").replace(/\s+/g, "").toLowerCase();
    const id = sizeVal ? `${idBase}-${sizeVal.replace(/\s+/g, "")}`.toLowerCase() : idBase;

    const variant = {
      ...(window.baseVariant || {}),
      id,
      [sizeKey]: sizeVal,
      Uploads: window.currentSelections["Uploads"] || [],
      note: window.currentSelections["note"] || "",
      "Giá": price,
      "Giá gốc": priceOrig
    };

    const sizeAttr = (window.allAttributes || []).find(a => a.key === sizeKey);
    if (sizeVal && sizeAttr?.values) {
      const matched = sizeAttr.values.find(v => (typeof v === "object" ? v.text === sizeVal : v === sizeVal));
      if (matched && typeof matched === "object" && matched.image) {
        const mainImage = $("#mainImage");
        if (mainImage) mainImage.src = matched.image;
        variant["Ảnh"] = matched.image;
      } else if (!variant["Ảnh"]) {
        variant["Ảnh"] = window.baseVariant?.["Ảnh"] || "";
      }
    }

    renderPriceVoucherAndText(variant);
    window.selectedVariant = variant;
  }

  function renderPriceVoucherAndText(variant) {
    if (window.__voucherWaiting?.amount) {
      window.voucherByProduct = window.voucherByProduct || {};
      window.voucherByProduct[variant.id] = window.__voucherWaiting.amount;
    }

    const productPrice = $("#productPrice");
    const productOriginalPrice = $("#productOriginalPrice");
    const voucherLabel = $("#voucherLabel");

    const voucherAmount = window.voucherByProduct?.[variant.id] || 0;
    const finalPrice = Math.max(0, variant["Giá"] - voucherAmount);

    const oldFinal = $("#finalPriceLine");
    if (oldFinal) oldFinal.remove();

    if (voucherAmount > 0) {
      if (productPrice) {
        productPrice.textContent = variant["Giá"].toLocaleString() + "đ";
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
      finalLine.style.cssText = "color:#d0021b;font-weight:bold;margin-top:6px;font-size:21px;";
      voucherLabel?.parentElement?.appendChild(finalLine);
    } else {
      if (productPrice) {
        productPrice.textContent = variant["Giá"].toLocaleString() + "đ";
        productPrice.style.color = "#d0021b";
        productPrice.style.textDecoration = "none";
      }
      if (productOriginalPrice) {
        productOriginalPrice.textContent = variant["Giá gốc"].toLocaleString() + "đ";
        productOriginalPrice.style.display = "inline";
      }
      if (voucherLabel) voucherLabel.style.display = "none";
    }

    const productVariantText = $("#productVariantText");
    if (productVariantText) {
      productVariantText.textContent = variant["Kích Thước"] ? `${variant["Kích Thước"]}` : "";
      productVariantText.style.marginTop = "16px";
    }
  }

  // ====== Quantity ======
  function changeQuantity(delta) {
    const input = $("#quantityInput");
    const value = parseInt(input?.value || "1", 10);
    if (input) {
      const newVal = Math.max(1, value + delta);
      input.value = newVal;

      const sizeKey = "Kích Thước";
      const sizeVal = window.currentSelections[sizeKey];
      let basePrice = window.baseVariant?.["Giá"] || 0;
      let basePriceOrig = window.baseVariant?.["Giá gốc"] || basePrice;

      const sizeAttr = (window.allAttributes || []).find(a => a.key === sizeKey);
      if (sizeVal && sizeAttr?.values) {
        const matched = sizeAttr.values.find(v => (typeof v === "object" ? v.text === sizeVal : v === sizeVal));
        if (matched && typeof matched === "object") {
          basePrice = matched.GiaOverride ?? basePrice;
          basePriceOrig = matched.GiaGocOverride ?? basePriceOrig;
        }
      }
      applyPriceAndUI(basePrice, basePriceOrig);
    }
  }

  // ====== ATC / Cart / Make ======
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

        const sizeKey = "Kích Thước";
        const sizeSelected = window.currentSelections[sizeKey];
        if (!sizeSelected) {
          alert("Vui lòng chọn kích thước bộ tranh.");
          return;
        }

        const quantity = Math.max(1, parseInt($("#quantityInput")?.value || "1", 10));
        const product = { ...(window.selectedVariant || {}) };

        const loai = window.productCategory || "art";
        const voucherAmount = window.voucherByProduct?.[product.id] || 0;
        const phanLoaiText = sizeSelected;

        const cartItem = {
          ...product,
          quantity,
          loai,
          voucher: voucherAmount > 0 ? { amount: voucherAmount } : undefined
        };

        window.cart.push(cartItem);
        saveCart();
        updateCartIcon();

        if (typeof window.trackBothPixels === "function") {
          window.trackBothPixels("AddToCart", {
            content_id: product.id,
            content_name: phanLoaiText,
            content_category: product.category || loai,
            content_page: window.productPage || "unknown",
            value: product["Giá"],
            currency: "VND",
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
            value: product["Giá"],
            currency: "VND",
            uploads: window.currentSelections["Uploads"] || [],
            note: window.currentSelections["note"] || "",
            quantity,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => console.warn("⚠️ Không thể gửi Make:", err));

        toggleCartPopup(false);
        if (typeof window.showCheckoutPopup === "function") {
          window.showCheckoutPopup();
        }
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

  function updateCartIcon() {
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const icon = document.querySelector("#cartCount");
      if (icon) {
        icon.textContent = count;
        icon.style.display = count > 0 ? "inline-block" : "none";
      }
    } catch (e) {
      console.warn("⚠️ Không thể update cart icon:", e);
    }
  }

  function toggleCartPopup(show = true) {
    const popup = $("#cartPopup");
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
        updateCartIcon();
      }, 300);
      isCartPopupOpen = false;
    }
  }

  function updatePriceUI(price, priceOrig) {
    const p = Number(price || 0);
    const o = Number(priceOrig || p);
    renderPriceVoucherAndText({
      ...(window.baseVariant || {}),
      id: (window.baseVariant?.id || "set-tranh"),
      "Giá": p,
      "Giá gốc": o,
      "Kích Thước": window.currentSelections["Kích Thước"] || null
    });
  }

  // ====== Wireup ======
  document.addEventListener("DOMContentLoaded", () => {
    updateCartIcon();
    $$(".cart-popup-close, .cart-popup-overlay").forEach((btn) =>
      btn.addEventListener("click", () => toggleCartPopup(false))
    );
    window.toggleForm = () => toggleCartPopup(true);
    $("#quantityInput")?.addEventListener("input", () => {
      const v = Math.max(1, parseInt($("#quantityInput").value || "1", 10));
      $("#quantityInput").value = v;
      const sizeKey = "Kích Thước";
      const sizeVal = window.currentSelections[sizeKey];
      let basePrice = window.baseVariant?.["Giá"] || 0;
      let basePriceOrig = window.baseVariant?.["Giá gốc"] || basePrice;
      const sizeAttr = (window.allAttributes || []).find(a => a.key === sizeKey);
      if (sizeVal && sizeAttr?.values) {
        const matched = sizeAttr.values.find(v => (typeof v === "object" ? v.text === sizeVal : v === sizeVal));
        if (matched) {
          basePrice = matched.GiaOverride ?? basePrice;
          basePriceOrig = matched.GiaGocOverride ?? basePriceOrig;
        }
      }
      applyPriceAndUI(basePrice, basePriceOrig);
    });
    initCartPopup();
  });

  // Expose
  window.initCartPopup = initCartPopup;
  window.toggleCartPopup = toggleCartPopup;
  window.changeQuantity = changeQuantity;

})();
