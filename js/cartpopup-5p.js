// cartpopup-5p.js — dành cho set tranh chọn 2–6 tranh với kiểm tra bắt buộc số tranh được chọn
(function () {
  "use strict";

  function injectCartPopupHTML() {
    if (document.getElementById("cartPopup")) return;
    const div = document.createElement("div");
    div.innerHTML = `...`; // ✅ dùng HTML từ file cartpopup-art.html như bạn đã cấu hình
    document.body.appendChild(div);
  }

  window.selectedVariant = null;
  window.cart = window.cart || [];
  window.currentSelections = {};

  const productPage = (window.productPage || "default").toLowerCase();
  const category = (window.productCategory || "art").toLowerCase();
  const jsonUrl = `/json/${category}/${productPage}.json`;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function normalizeWhen(when) {
    if (!when) return null;
    if (typeof when === "string") {
      const idx = when.indexOf("=");
      if (idx === -1) return null;
      return { [when.slice(0, idx).trim()]: when.slice(idx + 1).trim() };
    }
    return typeof when === "object" ? when : null;
  }

  function isAttrVisible(attr, selections) {
    const rule = normalizeWhen(attr.when);
    if (!rule) return true;
    return Object.entries(rule).every(([depKey, allowed]) => {
      const sel = selections?.[depKey];
      return Array.isArray(allowed) ? allowed.includes(sel) : sel === allowed;
    });
  }

  function initCartPopup() {
    injectCartPopupHTML();
    fetch(jsonUrl)
      .then(res => res.json())
      .then(data => {
        if (data["thuộc_tính"] && data["biến_thể"]?.length === 1) {
          window.allAttributes = data["thuộc_tính"];
          window.baseVariant = data["biến_thể"][0];
          window.mainImageKey = data["mainImageKey"] || null;
          renderOptions(window.allAttributes);
          bindAddToCartButton();
        } else {
          console.error("❌ JSON không đúng định dạng.", data);
        }
      });
  }

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
        input.addEventListener("input", updateSelectedVariant);
        group.appendChild(input);
      } else if (Array.isArray(attr.values)) {
        const wrapper = document.createElement("div");
        wrapper.className = attr.display === "thumbnail" ? "variant-thumbnails" : "variant-buttons";

        attr.values.forEach(val => {
          const value = typeof val === "string" ? val : val.text;
          const image = typeof val === "object" ? val.image : null;

          const thumb = document.createElement("div");
          thumb.className = "variant-thumb";
          thumb.dataset.key = attr.key;
          thumb.dataset.value = value;

          if (attr.display === "thumbnail") {
            thumb.innerHTML = `<img src="${image || ''}" alt="${value}"><div class="variant-title">${value}</div>`;
          } else {
            thumb.textContent = value;
          }

          thumb.addEventListener("click", () => {
            if (attr.multiple) {
              const selected = wrapper.querySelectorAll(".variant-thumb.selected");
              const max = parseInt(window.currentSelections["Số Tranh"] || "0", 10);
              if (!thumb.classList.contains("selected")) {
                if (selected.length >= max) return;
              }
              thumb.classList.toggle("selected");
            } else {
              wrapper.querySelectorAll(".variant-thumb").forEach(el => el.classList.remove("selected"));
              thumb.classList.add("selected");
            }
            updateSelectedVariant();
          });

          wrapper.appendChild(thumb);
        });

        group.appendChild(wrapper);
      }

      container.appendChild(group);
    });

    updateSelectedVariant(true);
  }

  function collectCleanSelections() {
    const out = {};
    (window.allAttributes || []).forEach(attr => {
      if (!isAttrVisible(attr, window.currentSelections)) return;

      if (attr.input === "text") {
        out[attr.key] = $(`#input-${attr.key}`)?.value || "";
      } else {
        const group = $(`.variant-group[data-key='${attr.key}']`);
        if (!group) return;
        const selected = group.querySelectorAll(".variant-thumb.selected");
        out[attr.key] = attr.multiple ? Array.from(selected).map(el => el.dataset.value) : selected[0]?.dataset.value;
      }
    });
    return out;
  }

  function updateSelectedVariant() {
    const raw = collectCleanSelections();
    applyVisibility(raw);
    window.currentSelections = raw;

    if (raw["Chọn Tranh"]?.includes("Tên Bạn")) {
      $(`.variant-group[data-key='Tên']`)?.classList.remove("hidden");
    } else {
      $(`.variant-group[data-key='Tên']`)?.classList.add("hidden");
    }

    const variant = { ...(window.baseVariant || {}), ...raw };
    window.selectedVariant = variant;
    renderVariantUI(variant);
  }

  function applyVisibility(selections) {
    (window.allAttributes || []).forEach(attr => {
      const group = $(`.variant-group[data-key='${attr.key}']`);
      if (!group) return;
      const visible = isAttrVisible(attr, selections);
      group.style.display = visible ? "" : "none";
    });
  }

  function renderVariantUI(data) {
    const mainImage = $("#mainImage");
    const productPrice = $("#productPrice");
    const productOriginalPrice = $("#productOriginalPrice");
    const productVariantText = $("#productVariantText");

    if (mainImage && data.Ảnh) mainImage.src = data.Ảnh;
    if (productPrice) productPrice.textContent = (data.Giá || 0).toLocaleString() + "đ";
    if (productOriginalPrice) productOriginalPrice.textContent = (data["Giá gốc"] || 0).toLocaleString() + "đ";

    if (productVariantText) {
      const ignore = new Set(["Ảnh", "Giá", "Giá gốc", "id", "category"]);
      const parts = [];
      for (let key in data) {
        if (!ignore.has(key)) parts.push(data[key]);
      }
      productVariantText.textContent = parts.join(", ");
    }
  }

  function bindAddToCartButton() {
    const btn = $("#btn-atc");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const v = window.selectedVariant;
      if (!v) return alert("Vui lòng chọn đầy đủ phân loại");

      const q = parseInt($("#quantityInput")?.value || "1") || 1;
      const required = (window.allAttributes || []).filter(a => isAttrVisible(a, window.currentSelections));
      const ok = required.every(attr => {
        const val = window.currentSelections[attr.key];
        if (attr.input === "text" && attr.key === "Tên" && v["Chọn Tranh"]?.includes("Tên Bạn")) {
          return val?.trim().length > 0;
        }
        if (attr.key === "Chọn Tranh" && Array.isArray(val)) {
          const expect = parseInt(window.currentSelections["Số Tranh"] || "0", 10);
          return val.length === expect;
        }
        return val && (Array.isArray(val) ? val.length > 0 : true);
      });

      if (!ok) return alert("⚠️ Vui lòng chọn đúng số thiết kế và điền đủ thông tin!");

      const item = { ...v, quantity: q };
      window.cart.push(item);
      localStorage.setItem("cart", JSON.stringify(window.cart));

      if (typeof window.showCheckoutPopup === "function") window.showCheckoutPopup();
    });
  }

  function changeQuantity(delta) {
    const input = $("#quantityInput");
    const value = parseInt(input?.value || "1", 10);
    if (input) input.value = Math.max(1, value + delta);
  }

  document.addEventListener("DOMContentLoaded", initCartPopup);
  window.initCartPopup = initCartPopup;
  window.toggleCartPopup = (show = true) => {
    const popup = $("#cartPopup");
    if (popup) popup.style.display = show ? "flex" : "none";
  };
  window.changeQuantity = changeQuantity;
})();
