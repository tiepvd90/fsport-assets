/* =========================================================================
 * cartpopup-6p.js — Bộ 6 tranh (size + 6 upload optional + note)
 * - Đọc JSON từ #cartContainer[data-json] (fallback từ productPage/category)
 * - Render: Kích Thước (button), Upload 6 ảnh (optional), Ghi chú (optional)
 * - Upload Cloudinary ngay khi chọn file → lưu secure_url vào selections
 * - Tính giá theo size (GiaOverride/GiaGocOverride) × quantity
 * - Voucher/Pixel/Make giữ pattern cũ
 * ========================================================================= */

(function () {
  "use strict";

  // ====== Cloudinary config (đổi sang của anh) ======
  const CLOUD_NAME = "dbtngymwh";
  const UPLOAD_PRESET = "unsigned_funsport";
  const CLOUD_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  // ====== Public-ish state ======
  window.cart = window.cart || [];
  window.selectedVariant = null;
  window.currentSelections = {}; // { "Kích Thước": "...", "Uploads": [url1..url6], "note": "" }
  let isCartEventBound = false;
  let isCartPopupOpen = false;

  // ====== DOM helpers ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ====== JSON path resolve ======
  function resolveJsonUrl() {
    const container = $("#cartContainer");
    const attr = container?.getAttribute("data-json");
    if (attr) return attr;

    const page = (window.productPage || "default").toLowerCase();
    const cat = (window.productCategory || "art").toLowerCase();
    // fallback: /json/{category}/{page}.json
    return `/json/${cat}/${page}.json`;
  }

  // ====== Init ======
  async function initCartPopup() {
    try {
      const jsonUrl = resolveJsonUrl();
      const res = await fetch(jsonUrl);
      if (!res.ok) throw new Error("JSON not found: " + jsonUrl);
      const data = await res.json();

      // basic validate
      if (!Array.isArray(data["thuộc_tính"]) || !Array.isArray(data["biến_thể"]) || data["biến_thể"].length < 1) {
        console.error("❌ JSON sai định dạng", data);
        return;
      }

      window.allAttributes = data["thuộc_tính"];
      window.baseVariant = data["biến_thể"][0];
      window.productCategory = data["category"] || window.baseVariant?.category || "art";

      // Main image mặc định (ảnh layout)
      const mainImage = $("#mainImage");
      if (mainImage) {
        mainImage.src = window.baseVariant?.["Ảnh"] || "";
      }

      // Render UI từ thuộc tính
      renderOptions(window.allAttributes);

      // Giá ban đầu từ base
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

      // 1) Button group (ví dụ: Kích Thước)
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
            // toggle single select
            wrapper.querySelectorAll(".variant-thumb").forEach((el) => el.classList.remove("selected"));
            btn.classList.add("selected");

            // save selection
            window.currentSelections[attr.key] = text;

            // price override from size
            const gia = typeof val === "object" && typeof val.GiaOverride === "number" ? val.GiaOverride : (window.baseVariant?.["Giá"] || 0);
            const giaGoc = typeof val === "object" && typeof val.GiaGocOverride === "number" ? val.GiaGocOverride : (window.baseVariant?.["Giá gốc"] || gia);
            applyPriceAndUI(gia, giaGoc);
          });

          wrapper.appendChild(btn);
        });

        group.appendChild(wrapper);
      }

      // 2) Upload group (optional) — uploadCount slots
      else if (attr.upload === true && Number(attr.uploadCount) > 0) {
        const count = Number(attr.uploadCount) || 6;
        const grid = document.createElement("div");
        grid.className = "upload-grid";
        // init uploads array
        if (!Array.isArray(window.currentSelections["Uploads"])) {
          window.currentSelections["Uploads"] = new Array(count).fill(null);
        }

        for (let i = 0; i < count; i++) {
          const slot = document.createElement("div");
          slot.className = "upload-slot";

          const lb = document.createElement("label");
          lb.textContent = `Tranh ${i + 1}`;
          slot.appendChild(lb);

          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";

          const preview = document.createElement("img");
          preview.className = "upload-preview";
          preview.style.display = "none";

          const hint = document.createElement("div");
          hint.style.fontSize = "12px";
          hint.style.color = "#666";
          hint.textContent = "JPG/PNG tối đa ~10MB";

          const bar = document.createElement("div");
          bar.style.cssText = "height:4px;background:#eee;border-radius:3px;overflow:hidden;display:none;";
          const barFill = document.createElement("div");
          barFill.style.cssText = "height:100%;width:0%;background:#000;";
          bar.appendChild(barFill);

          input.addEventListener("change", async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            // Preview ngay
            const reader = new FileReader();
            reader.onload = (evt) => {
              preview.src = evt.target.result;
              preview.style.display = "block";
            };
            reader.readAsDataURL(file);

            // Upload Cloudinary
            try {
              bar.style.display = "block";
              await uploadToCloudinary(file, (progress) => {
                barFill.style.width = `${Math.max(3, Math.min(100, progress))}%`;
              }).then((url) => {
                window.currentSelections["Uploads"][i] = url;
              });
            } catch (err) {
              console.warn("⚠️ Upload lỗi:", err);
              alert("Upload ảnh thất bại, thử lại giúp em nhé.");
            } finally {
              setTimeout(() => { bar.style.display = "none"; }, 500);
            }
          });

          slot.appendChild(input);
          slot.appendChild(preview);
          slot.appendChild(bar);
          slot.appendChild(hint);
          grid.appendChild(slot);
        }

        group.appendChild(grid);
      }

      // 3) Text input (ghi chú optional)
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

    // Sau render, set giá base lần đầu
    applyPriceAndUI(window.baseVariant?.["Giá"] || 0, window.baseVariant?.["Giá gốc"] || 0);
  }

  // ====== Upload helper ======
  async function uploadToCloudinary(file, onProgress) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error("Thiếu CLOUD_NAME/UPLOAD_PRESET của Cloudinary.");
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUD_UPLOAD_URL);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && typeof onProgress === "function") {
          const pct = (e.loaded / e.total) * 100;
          onProgress(pct);
        }
      });

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) {
              resolve(res.secure_url);
            } else {
              reject(res);
            }
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
    // quantity factor
    const qty = Math.max(1, parseInt($("#quantityInput")?.value || "1", 10));
    const price = Math.max(0, Number(basePrice || 0)) * qty;
    const priceOrig = Math.max(price, Number(basePriceOrig || 0) * qty);

    // Tạo variant current để render giá & text
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

    renderPriceVoucherAndText(variant);
    window.selectedVariant = variant;
  }

  function renderPriceVoucherAndText(variant) {
    // Auto-attach waiting voucher (giữ hành vi cũ)
    if (window.__voucherWaiting?.amount) {
      window.voucherByProduct = window.voucherByProduct || {};
      window.voucherByProduct[variant.id] = window.__voucherWaiting.amount;
    }

    const productPrice = $("#productPrice");
    const productOriginalPrice = $("#productOriginalPrice");
    const voucherLabel = $("#voucherLabel");

    // Voucher
    const voucherAmount = window.voucherByProduct?.[variant.id] || 0;
    const finalPrice = Math.max(0, variant["Giá"] - voucherAmount);

    // Clear old final line
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

    // Variant text gọn: chỉ hiển thị Kích Thước
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
      // re-apply price
      // giữ giá hiện tại của size (nếu có)
      const sizeKey = "Kích Thước";
      const sizeVal = window.currentSelections[sizeKey];
      let basePrice = window.baseVariant?.["Giá"] || 0;
      let basePriceOrig = window.baseVariant?.["Giá gốc"] || basePrice;

      // nếu đang có button chọn size → tìm override
      const sizeAttr = (window.allAttributes || []).find(a => a.key === sizeKey);
      if (sizeVal && sizeAttr && Array.isArray(sizeAttr.values)) {
        const matched = sizeAttr.values.find(v => (typeof v === "object" ? v.text === sizeVal : v === sizeVal));
        if (matched && typeof matched === "object") {
          basePrice = typeof matched.GiaOverride === "number" ? matched.GiaOverride : basePrice;
          basePriceOrig = typeof matched.GiaGocOverride === "number" ? matched.GiaGocOverride : basePriceOrig;
        }
      }
      applyPriceAndUI(basePrice, basePriceOrig);
    }
  }

  // ====== ATC / Cart / Popup / Pixel / Make ======
  function bindAddToCartButton() {
    const atcBtn = $("#btn-atc");
    if (atcBtn && !isCartEventBound) {
      isCartEventBound = true;

      atcBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        // Nếu popup chưa mở => mở
        if (!isCartPopupOpen) {
          toggleCartPopup(true);
          return;
        }

        // Validate size bắt buộc
        const sizeKey = "Kích Thước";
        const sizeSelected = window.currentSelections[sizeKey];
        if (!sizeSelected) {
          alert("Vui lòng chọn kích thước bộ tranh.");
          return;
        }

        // uploads optional + note optional
        const quantity = Math.max(1, parseInt($("#quantityInput")?.value || "1", 10));
        const product = { ...(window.selectedVariant || {}) };

        // Build minimal clean object
        const loai = window.productCategory || "art";
        const voucherAmount = window.voucherByProduct?.[product.id] || 0;
        const phanLoaiText = sizeSelected;

        const cartItem = {
          ...product,
          quantity,
          loai,
          voucher: voucherAmount > 0 ? { amount: voucherAmount } : undefined
        };

        // Save cart
        window.cart.push(cartItem);
        saveCart();
        updateCartIcon();

        // Pixel
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

        // Make webhook
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

        // Close & chuyển checkout
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
      void content.offsetWidth; // reflow
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

    // Close buttons
    $$(".cart-popup-close, .cart-popup-overlay").forEach((btn) =>
      btn.addEventListener("click", () => toggleCartPopup(false))
    );

    // Form toggle alias
    window.toggleForm = () => toggleCartPopup(true);

    // Quantity change live (manual typing)
    $("#quantityInput")?.addEventListener("input", () => {
      const v = Math.max(1, parseInt($("#quantityInput").value || "1", 10));
      $("#quantityInput").value = v;
      // giữ size override hiện tại
      const sizeKey = "Kích Thước";
      const sizeVal = window.currentSelections[sizeKey];
      let basePrice = window.baseVariant?.["Giá"] || 0;
      let basePriceOrig = window.baseVariant?.["Giá gốc"] || basePrice;

      const sizeAttr = (window.allAttributes || []).find(a => a.key === sizeKey);
      if (sizeVal && sizeAttr && Array.isArray(sizeAttr.values)) {
        const matched = sizeAttr.values.find(v => (typeof v === "object" ? v.text === sizeVal : v === sizeVal));
        if (matched && typeof matched === "object") {
          basePrice = typeof matched.GiaOverride === "number" ? matched.GiaOverride : basePrice;
          basePriceOrig = typeof matched.GiaGocOverride === "number" ? matched.GiaGocOverride : basePriceOrig;
        }
      }
      applyPriceAndUI(basePrice, basePriceOrig);
    });

    // Init
    initCartPopup();
  });

  // Expose
  window.initCartPopup = initCartPopup;
  window.toggleCartPopup = toggleCartPopup;
  window.changeQuantity = changeQuantity;

  window.cartpopup6p = {
    init: initCartPopup,
    toggle: toggleCartPopup,
    qty: changeQuantity
  };
})();
