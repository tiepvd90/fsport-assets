/* =========================================================================
 * cartpopup-5p.js — multi-variant (exact-count multiselect + priceMatrix)
 * - Hỗ trợ thuộc tính phụ thuộc "when" (chuẩn 4p) và "whenIncludes" (mở rộng)
 * - Multi-select bắt buộc chọn đúng số lượng (exactCountFrom)
 * - Giá theo priceMatrix.base (Số Tranh x Kích Thước) + surcharge (includes)
 * - "Tên Bạn" bật input text & bắt buộc nhập nếu có trong danh sách chọn
 * - Ảnh chính đổi theo bức vừa click gần nhất (mainImageKey)
 * - Giữ nguyên: voucher, pixel, Make webhook, localStorage, API public
 * ========================================================================= */

(function () {
  "use strict";

  // ====== Public-ish state (tương thích cũ) ======
  window.selectedVariant = null;
  window.cart = window.cart || [];
  window.currentSelections = {}; // selections sạch sau khi ẩn/hiện
  let isCartEventBound = false;
  let isCartPopupOpen = false;

  // ====== JSON url (ưu tiên từ #cartContainer[data-json]) ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const container = $("#cartContainer");
  const dataJsonAttr = container?.getAttribute("data-json");
  const page = (window.productPage || "default").toLowerCase();
  const cat = (window.productCategory || "tshirt").toLowerCase();
  const jsonUrl = dataJsonAttr || `/json/${cat}/${page}.json`;

  // ====== Runtime holders ======
  let ALL_ATTRS = [];
  let BASE_VARIANT = null;
  let MAIN_IMAGE_KEY = null;
  let PRICE_MATRIX = null; // { currency, base:[], surcharge:[] }
  let RULES = { multiSelect: null, requireTextIf: [], visibility: [] };

  // ====== Utils: parse when / whenIncludes ======
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
  function getSel(selections, key) {
    return selections ? selections[key] : undefined;
  }
  function isAttrVisible(attr, selections) {
    // 4p: "when"
    const rule = normalizeWhen(attr.when);
    let ok = true;
    if (rule) {
      ok = Object.entries(rule).every(([depKey, allowed]) => {
        const sel = getSel(selections, depKey);
        if (Array.isArray(allowed)) return allowed.includes(sel);
        return sel === allowed;
      });
    }
    // 5p mở rộng: RULES.visibility (whenIncludes)
    if (ok && RULES?.visibility?.length) {
      // Nếu có item visibility nhắm tới attr.key → áp tiếp (nếu khớp)
      const visRules = RULES.visibility.filter(v => v.show === attr.key && v.whenIncludes);
      if (visRules.length) {
        // Nếu KHÔNG đạt bất kỳ whenIncludes nào thì ẩn
        const anyPass = visRules.some(v => matchWhenIncludes(v.whenIncludes, selections));
        ok = anyPass;
      }
    }
    return ok;
  }
  function matchWhenIncludes(whenIncludes, selections) {
    // { Key:[values] } → đúng nếu selections[Key] chứa ÍT NHẤT MỘT value
    if (!whenIncludes || typeof whenIncludes !== "object") return false;
    return Object.entries(whenIncludes).every(([k, includes]) => {
      const sel = getSel(selections, k);
      if (Array.isArray(sel)) {
        // multi-select (danh sách)
        return sel.some(s => includes.includes(s));
      }
      // đơn trị
      return includes.includes(sel);
    });
  }

  // ====== Fetch JSON & init ======
  function initCartPopup() {
    fetch(jsonUrl)
      .then(res => res.json())
      .then(data => {
        if (data["thuộc_tính"] && data["biến_thể"]?.length === 1) {
          ALL_ATTRS = data["thuộc_tính"];
          BASE_VARIANT = data["biến_thể"][0];
          window.productCategory = data["category"] || BASE_VARIANT?.category || cat;

          MAIN_IMAGE_KEY =
            data["mainImageKey"] ||
            ALL_ATTRS.find(a => a.display === "thumbnail")?.key || null;

          PRICE_MATRIX = data["priceMatrix"] || null;
          RULES = data["rules"] || { multiSelect: null, requireTextIf: [], visibility: [] };

          renderOptions(ALL_ATTRS);
          bindAddToCartButton();
          refreshActionState(); // đầu tiên
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

      // input text
      if (attr.input === "text") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = `input-${attr.key}`;
        input.placeholder = attr.placeholder || "Nhập nội dung...";
        input.addEventListener("input", () => {
          // clear lỗi nếu có
          input.classList.remove("input-error");
          updateStateFromDOM();
        });
        group.appendChild(input);
      }
      // button / thumbnail
      else if (Array.isArray(attr.values)) {
        const displayMode = attr.display || "button";
        const isThumb = displayMode === "thumbnail";
        const isMulti = !!(attr.multiple || attr.multi); // hỗ trợ cả "multiple" & "multi"

        const wrapper = document.createElement("div");
        wrapper.className = isThumb ? "variant-thumbnails grid" : "variant-buttons";

        attr.values.forEach(val => {
          const value = typeof val === "string" ? val : val.text;
          const image = typeof val === "object" ? val.image : null;

          const thumb = document.createElement("div");
          thumb.className = "variant-thumb";
          thumb.dataset.key = attr.key;
          thumb.dataset.value = value;
          if (isThumb) {
            thumb.innerHTML = `
              <img src="${image || ""}" alt="${value || ""}" loading="lazy" />
              <div class="variant-title">${value}</div>
            `;
          } else {
            thumb.textContent = value;
          }

          thumb.addEventListener("click", () => {
            if (isMulti) {
              toggleMulti(attr.key, value, image);
            } else {
              // single-select
              $$('.variant-thumb[data-key="' + attr.key + '"]').forEach(el => el.classList.remove("selected"));
              thumb.classList.add("selected");
              window.currentSelections[attr.key] = value;
              // cập nhật main image nếu là nhóm chính
              if (MAIN_IMAGE_KEY === attr.key) setMainImageFromValue(attr.key, value);
              postChange();
            }
          });

          wrapper.appendChild(thumb);
        });

        group.appendChild(wrapper);
      }

      container.appendChild(group);
    });

    // Gọi 1 lần để tính visible + auto init state rỗng
    window.currentSelections = {};
    applyVisibility(window.currentSelections);
    // Auto-pick cho mainImageKey (chỉ nếu single-select và chưa có gì)
    autoPickFirstOfMainKey();
    // Sau render lần đầu → đồng bộ UI
    updateVariantAndUI();
  }

  // ====== Multi-select manager ("Chọn Tranh") ======
  const selectionOrder = []; // nhớ thứ tự click gần nhất (để chọn ảnh & fallback)
  function toggleMulti(key, value, imageUrl) {
    const list = ensureArray(window.currentSelections[key]);
    const idx = list.indexOf(value);

    // exact count rule
    const exactRule = RULES?.multiSelect;
    const limitFromKey = exactRule?.exactCountFrom;
    const limit =
      limitFromKey ? toIntSafe(window.currentSelections[limitFromKey]) : null;

    if (idx >= 0) {
      // bỏ chọn
      list.splice(idx, 1);
      removeSelectionOrder(key, value);
      // cập nhật main image nếu bỏ đúng ảnh đang hiển thị
      if (MAIN_IMAGE_KEY === key) {
        // nếu vừa bỏ ảnh đang hiển thị → lấy ảnh của mục được chọn gần nhất còn lại
        const fallback = getLastClickedChosen(key);
        setMainImageFromValue(key, fallback || "");
      }
    } else {
      // chọn thêm
      if (typeof limit === "number" && list.length >= limit) {
        // đã đủ → không cho chọn thêm
        // (JS có thể hiển thị lỗi/counter; ở đây chỉ bỏ qua click)
        flashLimit();
        return;
      }
      list.push(value);
      pushSelectionOrder(key, value);
      // luôn đổi main image sang bức vừa click
      if (MAIN_IMAGE_KEY === key) setMainImage(imageUrl);
    }

    window.currentSelections[key] = list;
    postChange();
  }
  function ensureArray(val) { return Array.isArray(val) ? val.slice() : (val ? [val] : []); }
  function pushSelectionOrder(key, value) {
    const k = `${key}::${value}`;
    const i = selectionOrder.indexOf(k);
    if (i >= 0) selectionOrder.splice(i, 1);
    selectionOrder.push(k);
  }
  function removeSelectionOrder(key, value) {
    const k = `${key}::${value}`;
    const i = selectionOrder.indexOf(k);
    if (i >= 0) selectionOrder.splice(i, 1);
  }
  function getLastClickedChosen(key) {
    // từ cuối mảng selectionOrder tìm mục còn đang được chọn
    const chosen = new Set(ensureArray(window.currentSelections[key]));
    for (let i = selectionOrder.length - 1; i >= 0; i--) {
      const item = selectionOrder[i];
      const [k, v] = item.split("::");
      if (k === key && chosen.has(v)) return v;
    }
    return null;
  }

  // ====== Visibility / Auto pick main image key ======
  function applyVisibility(selections) {
    (ALL_ATTRS || []).forEach(attr => {
      const groupEl = $(`.variant-group[data-key="${attr.key}"]`);
      if (!groupEl) return;

      const visible = isAttrVisible(attr, selections);
      groupEl.style.display = visible ? "" : "none";

      if (!visible) {
        // dọn chọn cũ nếu ẩn
        $$('.variant-thumb.selected', groupEl).forEach(el => el.classList.remove("selected"));
        if (selections && selections[attr.key] != null) delete selections[attr.key];
        const input = $(`#input-${attr.key}`);
        if (input && selections) {
          input.value = "";
          delete selections[attr.key];
        }
      }
    });
  }
  function autoPickFirstOfMainKey() {
    if (!MAIN_IMAGE_KEY) return;
    const mainAttr = (ALL_ATTRS || []).find(a => a.key === MAIN_IMAGE_KEY);
    if (!mainAttr || mainAttr.multiple || mainAttr.multi) return; // chỉ auto-pick với single
    const groupEl = $(`.variant-group[data-key="${MAIN_IMAGE_KEY}"]`);
    const firstBtn = groupEl?.querySelector(".variant-thumb");
    if (firstBtn) {
      firstBtn.classList.add("selected");
      window.currentSelections[MAIN_IMAGE_KEY] = firstBtn.dataset.value;
      setMainImageFromValue(MAIN_IMAGE_KEY, firstBtn.dataset.value);
    }
  }

  // ====== DOM → state sync ======
  function updateStateFromDOM() {
    // text inputs
    (ALL_ATTRS || []).forEach(attr => {
      if (attr.input === "text") {
        window.currentSelections[attr.key] = $(`#input-${attr.key}`)?.value || "";
      }
    });
    postChange();
  }

  // ====== Hậu thay đổi: enforce rules + update UI ======
  function postChange() {
    enforceExactCount();
    enforceRequireText();
    updateVariantAndUI();
    refreshActionState();
  }

  // ----- exact count -----
  function enforceExactCount() {
    const rule = RULES?.multiSelect;
    if (!rule || !rule.key || !rule.exactCountFrom) return;

    const targetKey = rule.key;               // "Chọn Tranh"
    const countKey = rule.exactCountFrom;     // "Số Tranh"
    const limit = toIntSafe(window.currentSelections[countKey]);
    const list = ensureArray(window.currentSelections[targetKey]);

    // Khoá các thumb chưa chọn khi đủ số
    const groupEl = $(`.variant-group[data-key="${targetKey}"]`);
    if (groupEl) {
      const allThumbs = $$('.variant-thumb', groupEl);
      const chosenSet = new Set(list);
      allThumbs.forEach(el => {
        const val = el.dataset.value;
        const isChosen = chosenSet.has(val);
        el.classList.toggle("selected", isChosen);
        // locked nếu đã đủ số và item chưa được chọn
        const lock = typeof limit === "number" && list.length >= limit && !isChosen;
        el.classList.toggle("locked", !!lock);
      });
    }

    // Nếu vượt quá (có thể do thay "Số Tranh" nhỏ lại) → cắt giữ N đầu
    if (typeof limit === "number" && list.length > limit) {
      window.currentSelections[targetKey] = list.slice(0, limit);
      // cũng cần bỏ thứ tự click của phần dư
      list.slice(limit).forEach(v => removeSelectionOrder(targetKey, v));
    }

    // Cập nhật counter
    const counter = $("#designCounter");
    if (counter && typeof limit === "number") {
      counter.textContent = `Đã chọn ${ensureArray(window.currentSelections[targetKey]).length}/${limit}`;
    } else if (counter) {
      counter.textContent = "";
    }
  }

  // ----- require text if includes -----
  function enforceRequireText() {
    // Hiển thị/ẩn input theo RULES.visibility (đã xử lý ở isAttrVisible) + when (cũ)
    applyVisibility(window.currentSelections);
    // Không xử lý lỗi ngay ở đây; lỗi hiển thị trong refreshActionState()
  }

  // ====== Tính giá (priceMatrix + surcharge + fallback 4p) ======
  function computePricing(clean) {
    let price = Number(BASE_VARIANT?.["Giá"]) || 0;
    let orig = Number(BASE_VARIANT?.["Giá gốc"]) || price || 0;

    // Ưu tiên priceMatrix nếu có đủ dữ liệu
    if (PRICE_MATRIX?.base?.length) {
      const n = toIntSafe(clean["Số Tranh"]);
      const size = clean["Kích Thước"] || clean["Kích Cỡ"] || clean["Kích cỡ"] || clean["Kích thước"];
      if (isFinite(n) && size) {
        const row = PRICE_MATRIX.base.find(r => Number(r["Số Tranh"]) === Number(n) && String(r["Kích Thước"]) === String(size));
        if (row) {
          price = Number(row["Giá"]) || price;
          orig  = Number(row["Giá gốc"]) || orig || price;
        }
      }
      // surcharge (mỗi rule tính 1 lần nếu includes khớp)
      if (PRICE_MATRIX?.surcharge?.length) {
        PRICE_MATRIX.surcharge.forEach(s => {
          const key = s.appliesTo;
          const includes = s.includes || [];
          const delta = Number(s.priceDelta) || 0;
          const cur = clean[key];
          if (Array.isArray(cur)) {
            if (cur.some(v => includes.includes(v))) price += delta;
          } else if (typeof cur === "string") {
            if (includes.includes(cur)) price += delta;
          }
        });
      }
    } else {
      // Fallback 4p: lấy GiaOverride từ option nếu có
      (ALL_ATTRS || []).forEach(attr => {
        if (!isAttrVisible(attr, clean)) return;
        const selVal = clean[attr.key];
        if (!selVal || !Array.isArray(attr?.values)) return;
        const matched = attr.values.find(v => (typeof v === "object" ? v.text === selVal : v === selVal));
        if (matched && typeof matched === "object") {
          if (typeof matched.GiaOverride === "number") price = matched.GiaOverride;
          if (typeof matched.GiaGocOverride === "number") orig = matched.GiaGocOverride;
          if (typeof matched.priceDelta === "number") price += matched.priceDelta;
          if (typeof matched.priceOrigDelta === "number") orig += matched.priceOrigDelta;
        }
      });
    }

    price = Math.max(0, price);
    orig = Math.max(price, orig);
    return { price, orig };
  }

  // ====== Tạo variant + cập nhật UI ======
  function updateVariantAndUI() {
    const clean = collectCleanSelections();
    window.currentSelections = clean;

    const variant = { ...(BASE_VARIANT || {}), ...clean };

    // Ảnh theo mainImageKey:
    if (MAIN_IMAGE_KEY) {
      const val = clean[MAIN_IMAGE_KEY];
      // single: val là string; multi: val là array → lấy "bức chọn gần nhất"
      if (Array.isArray(val)) {
        const last = getLastClickedChosen(MAIN_IMAGE_KEY);
        if (last) {
          const img = findImageOfValue(MAIN_IMAGE_KEY, last);
          variant["Ảnh"] = img || variant["Ảnh"] || "";
        } else {
          variant["Ảnh"] = variant["Ảnh"] || "";
        }
      } else if (typeof val === "string") {
        const img = findImageOfValue(MAIN_IMAGE_KEY, val);
        variant["Ảnh"] = img || variant["Ảnh"] || "";
      }
    }

    // Giá
    const { price, orig } = computePricing(clean);
    variant["Giá"] = price;
    variant["Giá gốc"] = orig;

    // SKU id (thêm cả số tranh + kích thước nếu có)
    const sizeKey = (window.sizeKeyOverride || "Kích Thước");
    const n = clean["Số Tranh"];
    const sizeVal = clean[sizeKey] || clean["Kích Cỡ"] || clean["Kích cỡ"] || clean["Kích thước"];
    const baseId = (BASE_VARIANT?.id || "item");
    variant.id = [baseId, n, sizeVal].filter(Boolean).join("-").replace(/\s+/g, "").toLowerCase();

    // Render giá/ảnh/nhãn voucher
    selectVariant(variant);

    // Render text phân loại (hiển thị ngắn gọn)
    const productVariantText = $("#productVariantText");
    if (productVariantText) {
      const parts = [];
      if (n) parts.push(`Số Tranh: ${n}`);
      if (sizeVal) parts.push(`Kích Thước: ${sizeVal}`);
      const designs = clean["Chọn Tranh"];
      if (Array.isArray(designs) && designs.length) {
        const name = (clean["Tên"] || "").trim();
        const showDesigns = designs.map(d => (d === "Tên Bạn" && name ? `Tên Bạn (${name})` : d));
        parts.push(`Tranh: ${showDesigns.join(" | ")}`);
      }
      productVariantText.textContent = parts.join(" - ");
    }
  }

  function collectCleanSelections() {
    const out = {};
    (ALL_ATTRS || []).forEach(attr => {
      if (!isAttrVisible(attr, window.currentSelections)) return;

      if (attr.input === "text") {
        out[attr.key] = $(`#input-${attr.key}`)?.value || "";
      } else {
        const isMulti = !!(attr.multiple || attr.multi);
        if (isMulti) {
          const chosen = [];
          $$('.variant-group[data-key="' + attr.key + '"] .variant-thumb.selected').forEach(el => chosen.push(el.dataset.value));
          out[attr.key] = chosen;
        } else {
          const selEl = $(`.variant-group[data-key="${attr.key}"] .variant-thumb.selected`);
          if (selEl) out[attr.key] = selEl.dataset.value;
        }
      }
    });
    return out;
  }

  // ====== UI: giá/ảnh/voucher ======
  function selectVariant(data) {
    // Voucher waiting → attach vào voucherByProduct
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
    const voucherLabel = $("#voucherLabel");
    const finalLine = $("#finalPriceLine");

    if (mainImage) mainImage.src = data.Ảnh || "";

    const voucherAmount = window.voucherByProduct?.[data.id] || 0;
    const finalPrice = Math.max(0, data.Giá - voucherAmount);

    if (voucherAmount > 0) {
      if (productPrice) {
        productPrice.textContent = Number(data.Giá).toLocaleString() + "đ";
        productPrice.style.color = "black";
        productPrice.style.textDecoration = "line-through";
      }
      if (productOriginalPrice) productOriginalPrice.style.display = "none";
      if (voucherLabel) {
        voucherLabel.textContent = `Voucher: ${voucherAmount.toLocaleString()}đ`;
        voucherLabel.style.display = "block";
      }
      if (finalLine) {
        finalLine.style.display = "block";
        finalLine.textContent = finalPrice.toLocaleString() + "đ";
      }
    } else {
      if (productPrice) {
        productPrice.textContent = Number(data.Giá).toLocaleString() + "đ";
        productPrice.style.color = "#d0021b";
        productPrice.style.textDecoration = "none";
      }
      if (productOriginalPrice) {
        productOriginalPrice.textContent = Number(data["Giá gốc"]).toLocaleString() + "đ";
        productOriginalPrice.style.display = "inline";
      }
      if (voucherLabel) voucherLabel.style.display = "none";
      if (finalLine) finalLine.style.display = "none";
    }
  }

  // ====== Main image helpers ======
  function setMainImage(url) {
    const mainImage = $("#mainImage");
    if (mainImage) mainImage.src = url || "";
  }
  function setMainImageFromValue(key, value) {
    if (!value) { setMainImage(""); return; }
    const img = findImageOfValue(key, value);
    setMainImage(img);
  }
  function findImageOfValue(key, value) {
    const attr = (ALL_ATTRS || []).find(a => a.key === key);
    if (!attr || !Array.isArray(attr.values)) return "";
    const matched = attr.values.find(v => (typeof v === "object" ? v.text === value : v === value));
    return (matched && typeof matched === "object" && matched.image) ? matched.image : "";
  }

  // ====== Enable/disable nút ATC + hiển thị lỗi form ======
  function refreshActionState() {
    const btn = $("#btn-atc");
    const err = $("#formError");

    const requiredOk = validateRequiredVisibleGroups();
    const exactOk = validateExactCount();
    const textOk = validateRequiredText();

    const allOk = requiredOk && exactOk && textOk;

    if (btn) btn.disabled = !allOk;

    if (err) {
      const msgs = [];
      if (!exactOk) msgs.push(RULES?.multiSelect?.errorText || "Vui lòng chọn đúng số tranh theo số lượng đã chọn.");
      if (!textOk) {
        const r = RULES?.requireTextIf?.[0];
        msgs.push(r?.errorText || "Vui lòng nhập tên để in lên tranh.");
      }
      if (!requiredOk) msgs.push("Vui lòng chọn đầy đủ phân loại đang hiển thị.");
      err.textContent = msgs.join(" ");
      err.style.display = msgs.length ? "block" : "none";
    }
  }
  function validateRequiredVisibleGroups() {
    const selected = window.currentSelections || {};
    const visibleKeys = (ALL_ATTRS || []).filter(a => isAttrVisible(a, selected)).map(a => a.key);
    // với input text, không bắt buộc nếu không có rule (đã check riêng)
    return visibleKeys.every(k => {
      const attr = (ALL_ATTRS || []).find(a => a.key === k);
      const v = selected[k];
      if (attr?.input === "text") return true; // không check ở đây
      if (Array.isArray(v)) return v.length > 0;
      return !!v;
    });
  }
  function validateExactCount() {
    const rule = RULES?.multiSelect;
    if (!rule || !rule.key || !rule.exactCountFrom) return true;
    const list = ensureArray(window.currentSelections[rule.key]);
    const limit = toIntSafe(window.currentSelections[rule.exactCountFrom]);
    if (typeof limit !== "number") return false;
    return list.length === limit;
  }
  function validateRequiredText() {
    // true nếu: không có rule hoặc rule không match; false nếu match nhưng text rỗng
    const rules = RULES?.requireTextIf || [];
    if (!rules.length) return true;
    return rules.every(r => {
      const shouldRequire = matchWhenIncludes(r.whenIncludes, window.currentSelections);
      if (!shouldRequire) return true;
      const val = (window.currentSelections[r.key] || "").trim();
      const input = $(`#input-${r.key}`);
      if (!val) { input?.classList.add("input-error"); return false; }
      input?.classList.remove("input-error");
      return true;
    });
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
      setTimeout(() => bindAddToCartButton(), 60);
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

        // Chặn nếu chưa hợp lệ
        refreshActionState();
        if (atcBtn.disabled) return;

        const quantity = parseInt($("#quantityInput")?.value || "1", 10) || 1;
        if (!window.selectedVariant) {
          alert("Vui lòng chọn phân loại sản phẩm.");
          return;
        }

        const product = window.selectedVariant;
        const loai = window.productCategory || "unknown";
        const voucherAmount = window.voucherByProduct?.[product.id] || 0;

        // Text phân loại đẹp
        const n = window.currentSelections["Số Tranh"];
        const size = window.currentSelections["Kích Thước"] || window.currentSelections["Kích Cỡ"] || window.currentSelections["Kích cỡ"] || window.currentSelections["Kích thước"];
        const designs = ensureArray(window.currentSelections["Chọn Tranh"]);
        const name = (window.currentSelections["Tên"] || "").trim();
        const showDesigns = designs.map(d => (d === "Tên Bạn" && name ? `Tên Bạn (${name})` : d));
        const phanLoaiText = [
          n ? `Số Tranh: ${n}` : null,
          size ? `Kích Thước: ${size}` : null,
          showDesigns.length ? `Tranh: ${showDesigns.join(" | ")}` : null,
        ].filter(Boolean).join(" - ");
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

  // ====== Helpers ======
  function toIntSafe(v) {
    if (v == null) return NaN;
    if (Array.isArray(v)) return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }
  function flashLimit() {
    const err = $("#formError");
    if (!err) return;
    const old = err.textContent;
    err.textContent = RULES?.multiSelect?.errorText || "Vui lòng chọn đúng số tranh theo số lượng đã chọn.";
    err.style.display = "block";
    setTimeout(() => {
      // không xoá lỗi nếu các điều kiện vẫn chưa đúng; để refreshActionState xử lý
      refreshActionState();
    }, 800);
  }

  // ====== expose minimal APIs (giữ tương thích) ======
  function refresh() { updateVariantAndUI(); refreshActionState(); }
  window.cartpopup = {
    changeQuantity: changeQuantity,
    toggle: toggleCartPopup,
    refresh: refresh,
    init: initCartPopup,
    qty: changeQuantity,
  };

  // ====== Wireup ======
  document.addEventListener("DOMContentLoaded", () => {
    $$(".cart-popup-close, .cart-popup-overlay").forEach(btn =>
      btn.addEventListener("click", () => toggleCartPopup(false))
    );
    window.toggleForm = () => toggleCartPopup(true);
    initCartPopup();
  });

  // Expose aliases (nếu file nạp sau DOMContentLoaded vẫn init)
  window.initCartPopup = initCartPopup;
  window.toggleCartPopup = toggleCartPopup;
  window.changeQuantity = changeQuantity;
})();
