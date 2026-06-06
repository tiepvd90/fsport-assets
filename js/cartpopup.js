/* ==========================================================================
 * F-Sport unified cart popup
 * Reads cartSchema=fsport-product-v1 and keeps a legacy fallback for old JSON.
 * Public globals kept for current HTML:
 *   initCartPopup(), toggleCartPopup(show), changeQuantity(delta)
 * ========================================================================== */
(function () {
  "use strict";

  if (window.__fsportUnifiedCartLoaded) return;
  window.__fsportUnifiedCartLoaded = true;

  var KEY = {
    attrs: "thu\u1ed9c_t\u00ednh",
    variants: "bi\u1ebfn_th\u1ec3",
    price: "Gi\u00e1",
    originalPrice: "Gi\u00e1 g\u1ed1c",
    image: "\u1ea2nh",
    variantText: "Ph\u00e2n lo\u1ea1i"
  };

  var MSG = {
    chooseVariant: "Vui l\u00f2ng ch\u1ecdn ph\u00e2n lo\u1ea1i s\u1ea3n ph\u1ea9m.",
    chooseAll: "Vui l\u00f2ng ch\u1ecdn \u0111\u1ea7y \u0111\u1ee7 ph\u00e2n lo\u1ea1i s\u1ea3n ph\u1ea9m."
  };

  var state = {
    data: null,
    attributes: [],
    base: {},
    variants: [],
    selections: {},
    isBound: false,
    isOpen: false,
    voucherConfigLoaded: false,
    voucherConfig: null
  };

  window.selectedVariant = null;
  window.cart = window.cart || [];
  window.voucherByProduct = window.voucherByProduct || {};

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function toNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function formatPrice(value) {
    return toNumber(value, 0).toLocaleString("vi-VN") + "\u0111";
  }

  function foldVN(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u0111\u0110]/g, "d")
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/\//g, "-")
      .replace(/[^A-Z0-9-]/g, "");
  }

  function getProductPage() {
    if (window.productPage) return String(window.productPage).toLowerCase();
    var name = window.location.pathname.split("/").pop() || "";
    return name.replace(/\.html$/i, "").toLowerCase() || "default";
  }

  function getCategory() {
    return String(window.productCategory || window.loai || "default").toLowerCase();
  }

  function getJsonCandidates() {
    var container = $("#cartContainer");
    var productPage = getProductPage();
    var category = getCategory();
    var urls = [];

    if (container && container.getAttribute("data-json")) {
      urls.push(container.getAttribute("data-json"));
    }

    urls.push("/json/" + productPage + ".json");
    urls.push("/json/" + category + "/" + productPage + ".json");

    return urls.filter(function (url, index) {
      return url && urls.indexOf(url) === index;
    });
  }

  function fetchFirstJson(urls) {
    var index = 0;

    function next() {
      var url = urls[index++];
      if (!url) throw new Error("No product JSON found");

      return fetch(url).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
        return res.json();
      }).catch(function (err) {
        if (index >= urls.length) throw err;
        return next();
      });
    }

    return next();
  }

  function pickPrice(obj) {
    if (!obj || typeof obj !== "object") return undefined;
    if (typeof obj.price === "number") return obj.price;
    if (typeof obj[KEY.price] === "number") return obj[KEY.price];
    if (typeof obj.GiaOverride === "number") return obj.GiaOverride;
    return undefined;
  }

  function pickOriginalPrice(obj) {
    if (!obj || typeof obj !== "object") return undefined;
    if (typeof obj.originalPrice === "number") return obj.originalPrice;
    if (typeof obj[KEY.originalPrice] === "number") return obj[KEY.originalPrice];
    if (typeof obj.GiaGocOverride === "number") return obj.GiaGocOverride;
    return undefined;
  }

  function normalizeValue(value) {
    if (typeof value === "string") return { text: value };

    var out = {
      text: value.text || ""
    };

    if (value.image) out.image = value.image;
    if (value.id) out.id = value.id;

    var price = pickPrice(value);
    var originalPrice = pickOriginalPrice(value);
    if (typeof price === "number") out.price = price;
    if (typeof originalPrice === "number") out.originalPrice = originalPrice;

    ["priceDelta", "priceOrigDelta", "priceMap", "priceKey"].forEach(function (key) {
      if (value[key] !== undefined) out[key] = value[key];
    });

    return out;
  }

  function normalizeAttribute(attr) {
    return {
      key: attr.key,
      label: attr.label || attr.key,
      type: attr.type || "option",
      display: attr.display || "button",
      input: attr.input || null,
      placeholder: attr.placeholder || "",
      when: attr.when || null,
      values: Array.isArray(attr.values) ? attr.values.map(normalizeValue) : []
    };
  }

  function normalizeData(data) {
    var legacyAttrs = Array.isArray(data[KEY.attrs]) ? data[KEY.attrs] : [];
    var legacyVariants = Array.isArray(data[KEY.variants]) ? data[KEY.variants] : [];
    var attrs = Array.isArray(data.attributes) && data.attributes.length
      ? data.attributes.map(normalizeAttribute)
      : legacyAttrs.map(normalizeAttribute);
    var firstVariant = legacyVariants[0] || {};
    var base = data.base || {};
    var category = data.category || base.category || firstVariant.category || getCategory();

    if (!base.id) base.id = firstVariant.id || getProductPage();
    if (!base.category) base.category = category;
    if (base.price == null) {
      var basePrice = pickPrice(firstVariant);
      if (typeof basePrice === "number") base.price = basePrice;
    }
    if (base.originalPrice == null) {
      var baseOriginal = pickOriginalPrice(firstVariant);
      if (typeof baseOriginal === "number") base.originalPrice = baseOriginal;
    }
    if (!base.image && firstVariant[KEY.image]) base.image = firstVariant[KEY.image];

    return {
      raw: data,
      category: category,
      base: base,
      attributes: attrs,
      variants: legacyVariants,
      mainImageKey: data.mainImageKey || (attrs.find(function (a) { return a.display === "thumbnail"; }) || {}).key || null,
      sku: data.sku || inferSku(attrs, legacyVariants, category)
    };
  }

  function inferSku(attrs, variants, category) {
    var hasOptionId = attrs.some(function (a) {
      return a.values.some(function (v) { return !!v.id; });
    });
    if (hasOptionId) return { mode: "option-id", idFrom: "selectedOption" };

    var colorKey = (attrs.find(function (a) { return /mau|m\u00e0u/i.test(foldVN(a.key).toLowerCase()); }) || {}).key;
    var sizeKey = (attrs.find(function (a) { return /SIZE/i.test(foldVN(a.key)); }) || {}).key;
    if (category === "ysandal" && colorKey && sizeKey) {
      return { mode: "template", parts: ["baseId", colorKey, sizeKey], normalize: "vn-ascii-uppercase" };
    }

    if (variants.length > 1) return { mode: "variant-match" };
    return { mode: "base-id" };
  }

  function normalizeWhen(when) {
    if (!when) return null;
    if (typeof when === "string") {
      var idx = when.indexOf("=");
      if (idx === -1) return null;
      var key = when.slice(0, idx).trim();
      var val = when.slice(idx + 1).trim();
      var obj = {};
      obj[key] = val;
      return obj;
    }
    return typeof when === "object" ? when : null;
  }

  function isAttrVisible(attr, selections) {
    var rule = normalizeWhen(attr.when);
    if (!rule) return true;

    return Object.keys(rule).every(function (depKey) {
      var allowed = rule[depKey];
      var selected = selections[depKey];
      return Array.isArray(allowed) ? allowed.indexOf(selected) >= 0 : selected === allowed;
    });
  }

  function getValueObject(attr, selectedText) {
    if (!attr || !Array.isArray(attr.values)) return null;
    return attr.values.find(function (v) { return v.text === selectedText; }) || null;
  }

  function getVisibleAttributes(selections) {
    return state.attributes.filter(function (attr) {
      return isAttrVisible(attr, selections || state.selections);
    });
  }

  function renderOptions() {
    var container = $("#variantList");
    if (!container) return;
    container.innerHTML = "";

    state.attributes.forEach(function (attr) {
      var group = document.createElement("div");
      group.className = "variant-group";
      group.setAttribute("data-key", attr.key);

      var label = document.createElement("div");
      label.className = "variant-label";
      label.innerHTML = escapeHtml(attr.label) + ":" + getSizeNote(attr);
      group.appendChild(label);

      if (attr.input === "text") {
        var input = document.createElement("input");
        input.type = "text";
        input.id = "input-" + attr.key;
        input.placeholder = attr.placeholder || "Nh\u1eadp n\u1ed9i dung...";
        input.style.cssText = "width:100%;padding:8px;font-size:14px;box-sizing:border-box;border:1px solid #ccc;border-radius:6px;";
        input.addEventListener("input", function () { updateSelectedVariant(false); });
        group.appendChild(input);
      } else {
        var wrapper = document.createElement("div");
        wrapper.className = attr.display === "thumbnail" ? "variant-thumbnails" : "variant-buttons";

        attr.values.forEach(function (value) {
          var thumb = document.createElement("div");
          thumb.className = "variant-thumb";
          thumb.dataset.key = attr.key;
          thumb.dataset.value = value.text;

          if (attr.display === "thumbnail") {
            thumb.innerHTML = '<img src="' + escapeAttr(value.image || "") + '" alt="' + escapeAttr(value.text) + '" />' +
              '<div class="variant-title">' + escapeHtml(value.text) + '</div>';
          } else {
            thumb.textContent = value.text;
          }

          thumb.addEventListener("click", function () {
            $$('.variant-thumb[data-key="' + cssEscape(attr.key) + '"]').forEach(function (el) {
              el.classList.remove("selected");
            });
            thumb.classList.add("selected");
            updateSelectedVariant(false);
          });

          wrapper.appendChild(thumb);
        });

        group.appendChild(wrapper);
      }

      container.appendChild(group);
    });

    updateSelectedVariant(true);
  }

  function getSizeNote(attr) {
    if (!/size/i.test(attr.key || "")) return "";

    var notes = {
      ysandal5568: "Tr\u1eeb 2 size so v\u1edbi gi\u00e0y th\u1ec3 thao, v\u00ed d\u1ee5: h\u00e0ng ng\u00e0y \u0111i gi\u00e0y th\u1ec3 thao size 40 \u21d2 ch\u1ecdn d\u00e9p n\u00e0y size 38",
      ysandal5560: "Tr\u1eeb 2 size so v\u1edbi gi\u00e0y th\u1ec3 thao, v\u00ed d\u1ee5: h\u00e0ng ng\u00e0y \u0111i gi\u00e0y th\u1ec3 thao size 42 \u21d2 ch\u1ecdn d\u00e9p n\u00e0y size 40",
      carbon: "Tr\u1eeb 2 size so v\u1edbi gi\u00e0y th\u1ec3 thao, v\u00ed d\u1ee5: h\u00e0ng ng\u00e0y \u0111i gi\u00e0y th\u1ec3 thao size 42 \u21d2 ch\u1ecdn d\u00e9p n\u00e0y size 40",
      ysandalbn68: "Tr\u1eeb 1 size so v\u1edbi gi\u00e0y th\u1ec3 thao, v\u00ed d\u1ee5: h\u00e0ng ng\u00e0y \u0111i gi\u00e0y th\u1ec3 thao size 40 \u21d2 ch\u1ecdn d\u00e9p n\u00e0y size 39"
    };

    var note = notes[getProductPage()];
    return note ? ' <span class="sizenote">' + escapeHtml(note) + "</span>" : "";
  }

  function collectSelections(raw) {
    var out = raw ? Object.assign({}, raw) : {};

    $$(".variant-thumb.selected").forEach(function (btn) {
      out[btn.dataset.key] = btn.dataset.value;
    });

    state.attributes.forEach(function (attr) {
      if (attr.input === "text") {
        var input = $("#input-" + attr.key);
        out[attr.key] = input ? input.value : "";
      }
    });

    return out;
  }

  function applyVisibility(selections) {
    state.attributes.forEach(function (attr) {
      var group = $('.variant-group[data-key="' + cssEscape(attr.key) + '"]');
      if (!group) return;

      var visible = isAttrVisible(attr, selections);
      group.style.display = visible ? "" : "none";

      if (!visible) {
        group.querySelectorAll(".variant-thumb.selected").forEach(function (el) {
          el.classList.remove("selected");
        });
        var input = $("#input-" + attr.key);
        if (input) input.value = "";
        delete selections[attr.key];
      }
    });
  }

  function autoPickMain(selections) {
    var mainKey = state.mainImageKey || (state.attributes[0] || {}).key;
    if (!mainKey || selections[mainKey]) return;

    var group = $('.variant-group[data-key="' + cssEscape(mainKey) + '"]');
    var first = group ? group.querySelector(".variant-thumb") : null;
    if (first && group.style.display !== "none") {
      first.classList.add("selected");
      selections[mainKey] = first.dataset.value;
    }
  }

  function cleanVisibleSelections(selections) {
    var clean = {};
    getVisibleAttributes(selections).forEach(function (attr) {
      if (attr.input === "text") {
        clean[attr.key] = selections[attr.key] || "";
      } else if (selections[attr.key]) {
        clean[attr.key] = selections[attr.key];
      }
    });
    return clean;
  }

  function updateSelectedVariant(allowAutoPick) {
    var raw = collectSelections(state.selections);
    applyVisibility(raw);
    if (allowAutoPick) {
      autoPickMain(raw);
      applyVisibility(raw);
    }

    state.selections = cleanVisibleSelections(raw);
    var variant = buildVariant(state.selections);
    selectVariant(variant);
  }

  function buildVariant(selections) {
    var variant = Object.assign({}, state.base);
    var matchedVariant = matchLegacyVariant(selections);
    if (matchedVariant) variant = Object.assign(variant, matchedVariant);

    Object.keys(selections).forEach(function (key) {
      variant[key] = selections[key];
    });

    var price = firstNumber(pickPrice(matchedVariant), state.base.price, 0);
    var originalPrice = firstNumber(pickOriginalPrice(matchedVariant), state.base.originalPrice, price);
    var image = state.base.image || (matchedVariant && matchedVariant[KEY.image]) || "";

    getVisibleAttributes(selections).forEach(function (attr) {
      var selectedText = selections[attr.key];
      if (!selectedText || !Array.isArray(attr.values)) return;

      var value = getValueObject(attr, selectedText);
      if (!value) return;

      if (value.image && attr.key === state.mainImageKey) image = value.image;
      if (value.id && state.sku && state.sku.mode === "option-id") variant.id = value.id;

      if (typeof value.price === "number") price = value.price;
      if (typeof value.originalPrice === "number") originalPrice = value.originalPrice;
      if (typeof value.priceDelta === "number") price += value.priceDelta;
      if (typeof value.priceOrigDelta === "number") originalPrice += value.priceOrigDelta;
      if (value.priceMap && typeof value.priceMap === "object") {
        var mapKey = value.priceKey || selectedText;
        if (typeof value.priceMap[mapKey] === "number") price = value.priceMap[mapKey];
      }
    });

    if (!image && state.mainImageKey) {
      var mainAttr = state.attributes.find(function (attr) { return attr.key === state.mainImageKey; });
      var mainVal = mainAttr ? getValueObject(mainAttr, selections[state.mainImageKey]) : null;
      if (mainVal && mainVal.image) image = mainVal.image;
    }

    variant.id = buildSkuId(variant, selections);
    variant.category = variant.category || state.category;
    variant[KEY.price] = Math.max(0, price);
    variant[KEY.originalPrice] = Math.max(price, originalPrice);
    variant[KEY.image] = image;

    return variant;
  }

  function matchLegacyVariant(selections) {
    if (!state.variants || !state.variants.length) return null;
    return state.variants.find(function (variant) {
      return Object.keys(selections).every(function (key) {
        if (!selections[key]) return true;
        return variant[key] === selections[key];
      });
    }) || (state.variants.length === 1 ? state.variants[0] : null);
  }

  function firstNumber() {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === "number" && Number.isFinite(arguments[i])) return arguments[i];
    }
    return 0;
  }

  function buildSkuId(variant, selections) {
    var sku = state.sku || {};
    if (sku.mode === "option-id" && variant.id) return variant.id;

    if (sku.mode === "template" && Array.isArray(sku.parts)) {
      return sku.parts.map(function (part) {
        if (part === "baseId") return state.base.id || variant.id || "item";
        return foldVN(selections[part] || "");
      }).filter(Boolean).join("-");
    }

    if (sku.mode === "variant-match" && variant.id) return variant.id;

    var sizeKey = window.sizeKeyOverride || "\u004b\u00ed\u0063\u0068 \u0063\u1ee1";
    if (selections[sizeKey]) {
      return String(state.base.id || variant.id || "item") + "-" + foldVN(selections[sizeKey]).toLowerCase();
    }

    return variant.id || state.base.id || getProductPage();
  }

  function selectVariant(data) {
    if (!data) return;
    window.selectedVariant = data;

    if (window.__voucherWaiting && window.__voucherWaiting.amount && data.id && !window.voucherByProduct[data.id]) {
      window.voucherByProduct[data.id] = window.__voucherWaiting.amount;
    }

    applyVoucherFromSettings(data);
    renderSelectedVariant(data);
  }

  function applyVoucherFromSettings(data) {
    if (!data || !data.id) return;

    if (state.voucherConfigLoaded) {
      var match = (state.voucherConfig || []).find(function (v) { return v.id === data.id; });
      if (match && typeof match.amount === "number") {
        window.voucherByProduct[data.id] = match.amount;
      }
      return;
    }

    state.voucherConfigLoaded = true;
    fetch("/json/settings.json")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (cfg) {
        state.voucherConfig = cfg && Array.isArray(cfg.vouchers) ? cfg.vouchers : [];
        var before = window.voucherByProduct[data.id] || 0;
        var match = state.voucherConfig.find(function (v) { return v.id === data.id; });
        if (match && typeof match.amount === "number") {
          window.voucherByProduct[data.id] = match.amount;
        }
        if ((window.voucherByProduct[data.id] || 0) !== before && window.selectedVariant && window.selectedVariant.id === data.id) {
          renderSelectedVariant(window.selectedVariant);
        }
      })
      .catch(function () {});
  }

  function renderSelectedVariant(data) {
    var mainImage = $("#mainImage");
    var productPrice = $("#productPrice");
    var productOriginalPrice = $("#productOriginalPrice");
    var productVariantText = $("#productVariantText");
    var voucherLabel = $("#voucherLabel");
    var voucherAmount = window.voucherByProduct && data.id ? (window.voucherByProduct[data.id] || 0) : 0;
    var finalPrice = Math.max(0, toNumber(data[KEY.price], 0) - voucherAmount);
    var oldFinal = $("#finalPriceLine");

    if (mainImage) mainImage.src = data[KEY.image] || "";
    if (oldFinal) oldFinal.remove();

    if (voucherAmount > 0) {
      if (productPrice) {
        productPrice.textContent = formatPrice(data[KEY.price]);
        productPrice.style.color = "black";
        productPrice.style.textDecoration = "line-through";
      }
      if (productOriginalPrice) productOriginalPrice.style.display = "none";
      if (voucherLabel) {
        voucherLabel.textContent = "Voucher: " + formatPrice(voucherAmount);
        voucherLabel.style.display = "block";
      }

      var finalLine = document.createElement("div");
      finalLine.id = "finalPriceLine";
      finalLine.textContent = formatPrice(finalPrice);
      finalLine.style.color = "#d0021b";
      finalLine.style.fontWeight = "bold";
      finalLine.style.marginTop = "6px";
      finalLine.style.fontSize = "21px";
      if (voucherLabel && voucherLabel.parentElement) voucherLabel.parentElement.appendChild(finalLine);
    } else {
      if (productPrice) {
        productPrice.textContent = formatPrice(data[KEY.price]);
        productPrice.style.color = "#d0021b";
        productPrice.style.textDecoration = "none";
      }
      if (productOriginalPrice) {
        productOriginalPrice.textContent = formatPrice(data[KEY.originalPrice]);
        productOriginalPrice.style.display = "inline";
      }
      if (voucherLabel) voucherLabel.style.display = "none";
    }

    if (productVariantText) {
      productVariantText.textContent = getVariantText(data, getRequiredAttributes()).join(", ");
      productVariantText.style.marginTop = "16px";
    }
  }

  function getRequiredAttributes() {
    return getVisibleAttributes(state.selections);
  }

  function getVariantText(data, attrs) {
    return attrs.map(function (attr) {
      return data[attr.key];
    }).filter(function (value) {
      return value != null && String(value).trim() !== "";
    });
  }

  function changeQuantity(delta) {
    var input = $("#quantityInput");
    var value = parseInt(input && input.value ? input.value : "1", 10);
    if (input) input.value = Math.max(1, value + delta);
  }

  function toggleCartPopup(show) {
    if (show === undefined) show = true;

    var popup = $("#cartPopup");
    var content = popup ? popup.querySelector(".cart-popup-content") : null;
    if (!popup || !content) return;

    if (show) {
      if (!state.isOpen) trackAddToWishlist();
      popup.style.display = "flex";
      content.classList.remove("animate-slideup");
      void content.offsetWidth;
      content.classList.add("animate-slideup");
      popup.classList.remove("hidden");
      state.isOpen = true;
      bindAddToCartButton();
    } else {
      content.classList.remove("animate-slideup");
      popup.classList.add("hidden");
      setTimeout(function () { popup.style.display = "none"; }, 300);
      state.isOpen = false;
    }
  }

  function trackAddToWishlist() {
    var loai = window.productCategory || window.loai || state.category || "unknown";
    var productId = window.productPage || getProductPage();

    if (typeof window.trackBothPixels === "function") {
      window.trackBothPixels("AddToWishlist", {
        content_name: "click_btn_atc_" + loai,
        content_category: loai
      });
    }

    trackInternalEvent("wishlist_add", {
      product_id: productId,
      product_name: window.productName || null
    });
  }

  function trackInternalEvent(eventType, metadata, attempt) {
    attempt = attempt || 0;
    if (window.fsport && typeof window.fsport.track === "function") {
      window.fsport.track(eventType, metadata);
      return;
    }
    if (attempt < 30) {
      setTimeout(function () {
        trackInternalEvent(eventType, metadata, attempt + 1);
      }, 200);
    }
  }

  function bindAddToCartButton() {
    var atcBtn = $("#btn-atc");
    if (!atcBtn || state.isBound) return;

    state.isBound = true;
    atcBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!state.isOpen) {
        toggleCartPopup(true);
        return;
      }

      addSelectedToCart();
    });
  }

  function addSelectedToCart() {
    var quantity = parseInt($("#quantityInput") && $("#quantityInput").value ? $("#quantityInput").value : "1", 10) || 1;
    var product = window.selectedVariant;
    if (!product) {
      alert(MSG.chooseVariant);
      return;
    }

    var requiredAttrs = getRequiredAttributes();
    var complete = requiredAttrs.every(function (attr) {
      if (attr.input === "text") return String(state.selections[attr.key] || "").trim().length > 0;
      return product[attr.key] != null && String(product[attr.key]).trim() !== "";
    });

    if (!complete) {
      alert(MSG.chooseAll);
      return;
    }

    var phanLoaiText = getVariantText(product, requiredAttrs).join(" - ");
    product[KEY.variantText] = phanLoaiText;

    var loai = window.productCategory || window.loai || product.category || "unknown";
    var voucherAmount = window.voucherByProduct && product.id ? (window.voucherByProduct[product.id] || 0) : 0;
    var cartItem = Object.assign({}, product, {
      quantity: quantity,
      loai: loai,
      voucher: voucherAmount > 0 ? { amount: voucherAmount } : undefined
    });

    window.cart.push(cartItem);
    saveCart();
    trackAddToCart(product, phanLoaiText, quantity, loai);

    toggleCartPopup(false);
    if (typeof window.showCheckoutPopup === "function") window.showCheckoutPopup();
  }

  function saveCart() {
    try {
      localStorage.setItem("cart", JSON.stringify(window.cart));
    } catch (err) {
      console.warn("[CartPopup] Cannot save cart", err);
    }
  }

  function trackAddToCart(product, phanLoaiText, quantity, loai) {
    var price = toNumber(product[KEY.price], 0);

    if (typeof window.trackBothPixels === "function") {
      window.trackBothPixels("AddToCart", {
        content_id: product.id,
        content_name: phanLoaiText,
        content_category: product.category || loai,
        content_page: window.productPage || "unknown",
        content_type: "product",
        contents: [{
          content_id: product.id,
          content_name: phanLoaiText,
          content_category: product.category || loai,
          quantity: quantity,
          price: price
        }],
        value: price * quantity,
        currency: "VND"
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
        value: price,
        currency: "VND",
        timestamp: new Date().toISOString()
      })
    }).catch(function (err) {
      console.warn("[CartPopup] Cannot send Make add_to_cart log", err);
    });

    if (window.fsport && typeof window.fsport.track === "function") {
      window.fsport.track("add_to_cart", {
        product_id: window.productPage || null,
        product_name: window.productName || null,
        variant: phanLoaiText,
        quantity: quantity,
        price: price
      });
    }
  }

  function initCartPopup() {
    if (state.initialized) return;
    state.initialized = true;

    fetchFirstJson(getJsonCandidates())
      .then(function (json) {
        state.data = normalizeData(json);
        state.attributes = state.data.attributes;
        state.base = state.data.base;
        state.variants = state.data.variants;
        state.mainImageKey = state.data.mainImageKey;
        state.sku = state.data.sku;
        state.category = state.data.category;
        window.productCategory = state.category || window.productCategory;
        window.allAttributes = state.attributes;
        window.baseVariant = state.base;
        window.allVariants = state.variants;
        window.mainImageKey = state.mainImageKey;
        renderOptions();
        bindAddToCartButton();
      })
      .catch(function (err) {
        console.warn("[CartPopup] Cannot load product JSON", err);
      });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }

  window.initCartPopup = initCartPopup;
  window.toggleCartPopup = toggleCartPopup;
  window.changeQuantity = changeQuantity;
  window.cartpopup = {
    init: initCartPopup,
    toggle: toggleCartPopup,
    qty: changeQuantity,
    refresh: function () { updateSelectedVariant(false); }
  };

  function wire() {
    $$(".cart-popup-close, .cart-popup-overlay").forEach(function (btn) {
      btn.addEventListener("click", function () { toggleCartPopup(false); });
    });
    window.toggleForm = function () { toggleCartPopup(true); };
    initCartPopup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
