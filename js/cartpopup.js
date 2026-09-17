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
    chooseAll: "Vui l\u00f2ng ch\u1ecdn \u0111\u1ea7y \u0111\u1ee7 ph\u00e2n lo\u1ea1i s\u1ea3n ph\u1ea9m.",
    outOfStock: "Ph\u00e2n lo\u1ea1i n\u00e0y t\u1ea1m h\u1ebft h\u00e0ng.",
    unavailable: "Ph\u00e2n lo\u1ea1i n\u00e0y kh\u00f4ng c\u00f2n kinh doanh."
  };

  var state = {
    data: null,
    attributes: [],
    base: {},
    variants: [],
    availability: null,
    selections: {},
    isBound: false,
    isOpen: false,
    scrollLocked: false,
    scrollLockY: 0,
    scrollLockStyles: null,
    scrollUnlockTimer: 0,
    sheetDrag: null,
    noticeTimer: 0,
    voucherConfigLoaded: false,
    voucherConfig: null
  };

  var BACKEND_CONFIG_BASE_URL = window.FSPORT_CARTPOPUP_CONFIG_URL ||
    "https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/cart-popup-config";
  var SUPABASE_URL = "https://xcigbbcpwfzluqazadez.supabase.co";
  var SUPABASE_ANON_KEY = window.FSPORT_SUPABASE_ANON || "sb_publishable_yZKMMfjz_wk6sYOoqaAPnw_DwOa9yNU";
  var PRODUCT_AVAILABILITY_URL = SUPABASE_URL + "/functions/v1/product-availability";

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

      return fetch(url, { cache: "no-store" }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
        return res.json();
      }).catch(function (err) {
        if (index >= urls.length) throw err;
        return next();
      });
    }

    return next();
  }

  function shouldUseBackendConfig() {
    return true;
  }

  function getBackendConfigUrl() {
    var sep = BACKEND_CONFIG_BASE_URL.indexOf("?") >= 0 ? "&" : "?";
    return BACKEND_CONFIG_BASE_URL + sep + "slug=" + encodeURIComponent(getProductPage());
  }

  function isValidCartSchema(data) {
    return data && typeof data === "object" &&
      (data.cartSchema === "fsport-product-v1" || data.cartSchema === "fsport-product-v2") &&
      (Array.isArray(data.attributes) || Array.isArray(data[KEY.attrs]));
  }

  function fetchBackendConfig() {
    if (window.__fsportProductPageConfig && window.__fsportProductPageConfig.slug === getProductPage()) {
      if (isValidCartSchema(window.__fsportProductPageConfig)) {
        return Promise.resolve(window.__fsportProductPageConfig);
      }
    }

    return fetch(getBackendConfigUrl(), { method: "GET" })
      .then(function (res) {
        if (!res.ok) throw new Error("Backend config HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        if (!isValidCartSchema(json)) throw new Error("Invalid backend cart schema");
        return json;
      });
  }

  function fetchCartPopupData() {
    if (!shouldUseBackendConfig()) return fetchFirstJson(getJsonCandidates()).then(applyLiveSkuStatus);

    return fetchBackendConfig().catch(function (err) {
      console.warn("[CartPopup] Backend config fallback to static JSON", err);
      return fetchFirstJson(getJsonCandidates()).then(applyLiveSkuStatus);
    });
  }

  function applyLiveSkuStatus(data) {
    // Historical template pages generate a synthetic SKU only after selections;
    // their single base variant is not an inventory code. Preserve that proven
    // legacy behavior until the page is explicitly migrated to catalog_model.
    if (data && data.sku && data.sku.mode === "template") return Promise.resolve(data);
    var variantsKey = Array.isArray(data.variants) ? "variants" : (Array.isArray(data[KEY.variants]) ? KEY.variants : null);
    var variants = variantsKey ? data[variantsKey] : [];
    var codes = variants.map(function (variant) { return variant.product_code || variant.id; }).filter(Boolean);
    codes = codes.filter(function (code, index) { return codes.indexOf(code) === index; });
    if (!codes.length) return Promise.resolve(data);
    var url = PRODUCT_AVAILABILITY_URL + "?codes=" + encodeURIComponent(codes.join(","));
    return fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    }).then(function (response) {
      if (!response.ok) throw new Error("Cannot verify live SKU status");
      return response.json();
    }).then(function (payload) {
      var products = payload && Array.isArray(payload.products) ? payload.products : [];
      var productMap = {};
      (products || []).forEach(function (product) { productMap[product.product_code] = product; });
      var activeVariants = variants.filter(function (variant) {
        var live = productMap[variant.product_code || variant.id];
        return !!live && live.is_active !== false;
      }).map(function (variant) {
        var product = productMap[variant.product_code || variant.id];
        return Object.assign({}, variant, {
          product_code: product.product_code,
          inventory_product_id: product.id,
          stock_qty: toNumber(product.stock_qty, 0),
          is_active: true
        });
      });
      var copy = Object.assign({}, data);
      copy[variantsKey] = activeVariants;
      if (Array.isArray(copy.attributes)) {
        copy.attributes = copy.attributes.map(function (attribute) {
          return Object.assign({}, attribute, {
            values: (attribute.values || []).filter(function (value) {
              var directCode = value.product_code || value.id;
              if (directCode && productMap[directCode]) return true;
              return activeVariants.some(function (variant) {
                return String(variant[attribute.key] || "") === String(value.text || "");
              });
            })
          });
        });
      }
      return copy;
    });
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
    ["product_code", "inventory_product_id", "product_name", "category", "color", "size", "stock_qty", "is_active", "image_urls"].forEach(function (key) {
      if (value[key] !== undefined) out[key] = value[key];
    });

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
    var legacyVariants = Array.isArray(data.variants)
      ? data.variants
      : (Array.isArray(data[KEY.variants]) ? data[KEY.variants] : []);
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
      availability: data.availability || null,
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

  function usesLiveInventory() {
    return state.variants.some(function (variant) {
      return variant && (variant.stock_qty !== undefined || variant.is_active !== undefined);
    });
  }

  function isExplicitlyOutOfStock(selections) {
    var availability = state.availability;
    if (!availability || availability.mode !== "out-of-stock-matrix" || !availability.outOfStock) return false;
    var optionKeys = Array.isArray(availability.options) && availability.options.length
      ? availability.options
      : state.attributes.filter(function (attr) { return attr.input !== "text"; }).map(function (attr) { return attr.key; });
    if (optionKeys.length < 2 || optionKeys.some(function (key) { return !selections[key]; })) return false;
    var sizes = availability.outOfStock[selections[optionKeys[0]]] || [];
    return sizes.map(String).indexOf(String(selections[optionKeys[1]])) >= 0;
  }

  function hasAvailableCompletion(candidate, index) {
    var attrs = state.attributes.filter(function (attr) { return attr.input !== "text"; });
    index = index || 0;
    if (index >= attrs.length) return !isExplicitlyOutOfStock(candidate);
    var attr = attrs[index];
    if (candidate[attr.key]) return hasAvailableCompletion(candidate, index + 1);
    return (attr.values || []).some(function (value) {
      var next = Object.assign({}, candidate);
      next[attr.key] = value.text;
      return hasAvailableCompletion(next, index + 1);
    });
  }

  function variantMatchesSelections(variant, selections, ignoredKey) {
    return getVisibleAttributes(selections).every(function (attr) {
      if (attr.key === ignoredKey || attr.input === "text" || !selections[attr.key]) return true;
      return String(variant[attr.key] || "") === String(selections[attr.key]);
    });
  }

  function choiceIsInStock(attr, value, selections) {
    var candidate = Object.assign({}, selections);
    candidate[attr.key] = value.text;
    if (getProductPage() === "carbon2" && attr.key === "color") {
      // Let customers switch models even when their previous size is sold out
      // in the new model. The size selection is cleared on color change.
      delete candidate.size;
    }
    if (!hasAvailableCompletion(candidate)) return false;
    if (!usesLiveInventory()) return true;
    return state.variants.some(function (variant) {
      return variant && variant.is_active !== false && toNumber(variant.stock_qty, 0) > 0 &&
        String(variant[attr.key] || "") === String(value.text) &&
        variantMatchesSelections(variant, candidate, null);
    });
  }

  function updateOptionAvailability(selections) {
    state.attributes.forEach(function (attr) {
      if (attr.input === "text") return;
      var group = $('.variant-group[data-key="' + cssEscape(attr.key) + '"]');
      if (!group) return;
      attr.values.forEach(function (value) {
        var selector = '.variant-thumb[data-key="' + cssEscape(attr.key) + '"][data-value="' + cssEscape(value.text) + '"]';
        var thumb = group.querySelector(selector);
        if (!thumb) return;
        var enabled = choiceIsInStock(attr, value, selections || {});
        thumb.classList.toggle("is-disabled", !enabled);
        thumb.setAttribute("aria-disabled", enabled ? "false" : "true");
        if (enabled) {
          thumb.removeAttribute("title");
          thumb.removeAttribute("data-stock-label");
          thumb.setAttribute("aria-label", value.text);
        } else {
          thumb.title = "H\u1ebft H\u00e0ng";
          thumb.setAttribute("data-stock-label", "H\u1ebft H\u00e0ng");
          thumb.setAttribute("aria-label", value.text + " - H\u1ebft H\u00e0ng");
        }
      });
    });
  }

  function updateVariantScrollbar() {
    var list = $("#variantList");
    var wrap = $("#variantListWrap");
    var thumb = $("#variantScrollbarThumb");
    if (!list || !wrap) return;

    var scrollHeight = list.scrollHeight || 0;
    var clientHeight = list.clientHeight || 0;
    var content = wrap.closest(".cart-popup-content");
    var hadLongOptions = !!(content && content.classList.contains("has-long-options"));
    var hasLongOptions = scrollHeight > 380;
    if (content) content.classList.toggle("has-long-options", hasLongOptions);
    if (content && hadLongOptions !== hasLongOptions) {
      window.requestAnimationFrame(updateVariantScrollbar);
      return;
    }
    var scrollable = scrollHeight - clientHeight > 8;
    wrap.classList.toggle("has-scroll", scrollable);
    if (!scrollable || !thumb) return;

    var trackHeight = Math.max(0, wrap.clientHeight - 8);
    var thumbHeight = Math.max(26, Math.round(trackHeight * clientHeight / scrollHeight));
    var maxTop = Math.max(0, trackHeight - thumbHeight);
    var maxScroll = Math.max(1, scrollHeight - clientHeight);
    var top = Math.round(maxTop * list.scrollTop / maxScroll);
    thumb.style.height = thumbHeight + "px";
    thumb.style.top = top + "px";
  }

  function bindVariantScrollbar() {
    var list = $("#variantList");
    if (!list || list.dataset.scrollbarBound === "1") return;
    list.dataset.scrollbarBound = "1";
    list.addEventListener("scroll", updateVariantScrollbar, { passive: true });
    window.addEventListener("resize", updateVariantScrollbar, { passive: true });
  }

  function renderOptions() {
    var container = $("#variantList");
    if (!container) return;
    bindVariantScrollbar();
    container.innerHTML = "";

    state.attributes.forEach(function (attr, attrIndex) {
      var group = document.createElement("div");
      group.className = "variant-group";
      group.setAttribute("data-key", attr.key);

      var label = document.createElement("div");
      label.className = "variant-label";
      label.textContent = attr.label + ":";
      group.appendChild(label);

      if (attr.input === "text") {
        var input = document.createElement("input");
        input.type = "text";
        input.id = "input-" + attr.key;
        input.placeholder = attr.placeholder || "Nh\u1eadp n\u1ed9i dung...";
        input.style.cssText = "width:100%;padding:8px;font-size:14px;box-sizing:border-box;border:1px solid #ccc;border-radius:6px;";
        input.addEventListener("input", function () {
          group.classList.remove("selection-required");
          updateSelectedVariant(false);
        });
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
            if (thumb.classList.contains("is-disabled") || thumb.getAttribute("aria-disabled") === "true") return;
            // Carbon 1 and Carbon 2 share sizes but have separate inventory.
            // A size selected for the previous color must be chosen again.
            if (getProductPage() === "carbon2" && attr.key === "color" &&
                state.selections.color !== value.text) {
              $$('.variant-thumb[data-key="size"].selected').forEach(function (el) {
                el.classList.remove("selected");
              });
              delete state.selections.size;
            }
            $$('.variant-thumb[data-key="' + cssEscape(attr.key) + '"]').forEach(function (el) {
              el.classList.remove("selected");
            });
            thumb.classList.add("selected");
            group.classList.remove("selection-required");
            updateSelectedVariant(false);
            requestAnimationFrame(updateVariantScrollbar);
          });

          wrapper.appendChild(thumb);
        });

        group.appendChild(wrapper);
      }

      container.appendChild(group);
      if (attrIndex === 0 && state.attributes.length > 1) {
        var note = getCartNote();
        if (note) {
          var noteElement = document.createElement("div");
          noteElement.className = "cart-option-note sizenote";
          noteElement.textContent = note;
          container.appendChild(noteElement);
        }
      }
    });

    updateSelectedVariant(true);
    requestAnimationFrame(updateVariantScrollbar);
  }

  function getConfiguredCartNote() {
    var raw = state.data && state.data.raw || {};
    var ui = raw.ui && typeof raw.ui === "object" ? raw.ui : {};
    var configured = String(ui.note || raw.note || "").trim();
    if (configured) return configured;
    var oldNotes = ui.optionNotes || raw.optionNotes || {};
    if (Array.isArray(oldNotes)) {
      var oldRow = oldNotes.find(function (row) { return String(row && row.text || "").trim(); });
      return String(oldRow && oldRow.text || "").trim();
    }
    if (!oldNotes || typeof oldNotes !== "object") return "";
    var oldKey = Object.keys(oldNotes).find(function (key) { return String(oldNotes[key] || "").trim(); });
    return oldKey ? String(oldNotes[oldKey] || "").trim() : "";
  }

  function getCartNote() {
    var configured = getConfiguredCartNote();
    if (configured) return configured;
    var notes = {
      ysandal5568: "Tr\u1eeb 2 size so v\u1edbi gi\u00e0y th\u1ec3 thao, v\u00ed d\u1ee5: h\u00e0ng ng\u00e0y \u0111i gi\u00e0y th\u1ec3 thao size 40 \u21d2 ch\u1ecdn d\u00e9p n\u00e0y size 38",
      ysandal5560: "Tr\u1eeb 2 size so v\u1edbi gi\u00e0y th\u1ec3 thao, v\u00ed d\u1ee5: h\u00e0ng ng\u00e0y \u0111i gi\u00e0y th\u1ec3 thao size 42 \u21d2 ch\u1ecdn d\u00e9p n\u00e0y size 40",
      carbon: "Tr\u1eeb 1 size so v\u1edbi gi\u00e0y th\u1ec3 thao, v\u00ed d\u1ee5: h\u00e0ng ng\u00e0y \u0111i gi\u00e0y th\u1ec3 thao size 42 \u21d2 ch\u1ecdn d\u00e9p n\u00e0y size 41",
      ysandalbn68: "Tr\u1eeb 1 size so v\u1edbi gi\u00e0y th\u1ec3 thao, v\u00ed d\u1ee5: h\u00e0ng ng\u00e0y \u0111i gi\u00e0y th\u1ec3 thao size 40 \u21d2 ch\u1ecdn d\u00e9p n\u00e0y size 39"
    };

    return notes[getProductPage()] || "";
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
    var first = group ? group.querySelector('.variant-thumb:not(.is-disabled)') : null;
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
    updateOptionAvailability(raw);
    if (allowAutoPick) {
      autoPickMain(raw);
      applyVisibility(raw);
      updateOptionAvailability(raw);
    }

    state.selections = cleanVisibleSelections(raw);
    var variant = buildVariant(state.selections);
    selectVariant(variant);
    updateOptionAvailability(state.selections);
    requestAnimationFrame(updateVariantScrollbar);
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

  function matchExactVariant(selections) {
    var attrs = getRequiredAttributes().filter(function (attr) { return attr.input !== "text"; });
    return (state.variants || []).find(function (variant) {
      return variant && variant.is_active !== false && attrs.every(function (attr) {
        return selections[attr.key] && String(variant[attr.key] || "") === String(selections[attr.key]);
      });
    }) || null;
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

  function isVariantListTarget(target) {
    var list = $("#variantList");
    return !!(list && target && list.contains(target));
  }

  function preventBackgroundScroll(event) {
    if (!state.isOpen) return;
    if (isVariantListTarget(event.target)) return;
    event.preventDefault();
  }

  function lockPageScroll() {
    if (state.scrollLocked) return;

    var body = document.body;
    var html = document.documentElement;
    state.scrollLockY = window.scrollY || html.scrollTop || body.scrollTop || 0;
    state.scrollLockStyles = {
      htmlOverflow: html.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow
    };

    html.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = "-" + state.scrollLockY + "px";
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    state.scrollLocked = true;
  }

  function unlockPageScroll() {
    if (!state.scrollLocked) return;

    var body = document.body;
    var html = document.documentElement;
    var styles = state.scrollLockStyles || {};
    document.removeEventListener("touchmove", preventBackgroundScroll);
    document.removeEventListener("wheel", preventBackgroundScroll);

    html.style.overflow = styles.htmlOverflow || "";
    body.style.position = styles.bodyPosition || "";
    body.style.top = styles.bodyTop || "";
    body.style.left = styles.bodyLeft || "";
    body.style.right = styles.bodyRight || "";
    body.style.width = styles.bodyWidth || "";
    body.style.overflow = styles.bodyOverflow || "";

    window.scrollTo(0, state.scrollLockY || 0);
    state.scrollLocked = false;
    state.scrollLockStyles = null;
  }

  function clearSheetDragStyles(content) {
    if (!content) return;
    content.style.transition = "";
    content.style.transform = "";
    content.style.opacity = "";
    var overlay = $("#cartPopup .cart-popup-overlay");
    if (overlay) {
      overlay.style.transition = "";
      overlay.style.opacity = "";
    }
  }

  function bindSheetSwipeToClose() {
    var content = $("#cartPopup .cart-popup-content");
    if (!content || content.dataset.swipeCloseBound === "1") return;
    content.dataset.swipeCloseBound = "1";

    content.addEventListener("touchstart", function (event) {
      if (!state.isOpen || event.touches.length !== 1) return;
      var target = event.target;
      if (target && target.closest("button, input, select, textarea, a")) return;

      var list = target && target.closest("#variantList");
      if (list && list.scrollTop > 0) return;

      var touch = event.touches[0];
      state.sheetDrag = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentY: touch.clientY,
        startedAt: Date.now(),
        active: false,
        distance: 0,
        frame: 0
      };
      content.style.transition = "none";
      var overlay = $("#cartPopup .cart-popup-overlay");
      if (overlay) overlay.style.transition = "none";
    }, { passive: true });

    content.addEventListener("touchmove", function (event) {
      var drag = state.sheetDrag;
      if (!drag || event.touches.length !== 1) return;
      var touch = event.touches[0];
      var dx = touch.clientX - drag.startX;
      var dy = touch.clientY - drag.startY;

      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) return;
      drag.active = true;
      drag.currentY = touch.clientY;
      drag.distance = Math.min(dy, content.offsetHeight);
      event.preventDefault();
      if (drag.frame) return;
      drag.frame = window.requestAnimationFrame(function () {
        drag.frame = 0;
        var distance = drag.distance;
        var progress = distance / Math.max(content.offsetHeight, 1);
        content.style.transform = "translate3d(0," + distance + "px,0)";
        var overlay = $("#cartPopup .cart-popup-overlay");
        if (overlay) overlay.style.opacity = String(Math.max(0.12, 1 - progress * 0.9));
      });
    }, { passive: false });

    function finishDrag() {
      var drag = state.sheetDrag;
      state.sheetDrag = null;
      if (drag && drag.frame) window.cancelAnimationFrame(drag.frame);
      if (!drag || !drag.active) {
        clearSheetDragStyles(content);
        return;
      }

      var distance = Math.max(0, drag.distance || drag.currentY - drag.startY);
      var elapsed = Math.max(1, Date.now() - drag.startedAt);
      var velocity = distance / elapsed;
      var shouldClose = distance >= Math.min(110, content.offsetHeight * 0.2) ||
        (distance >= 42 && velocity >= 0.65);

      var overlay = $("#cartPopup .cart-popup-overlay");
      if (shouldClose) {
        content.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";
        content.style.transform = "translate3d(0,100%,0)";
        if (overlay) {
          overlay.style.transition = "opacity 260ms cubic-bezier(0.32, 0.72, 0, 1)";
          overlay.style.opacity = "0";
        }
        window.setTimeout(function () {
          toggleCartPopup(false);
          clearSheetDragStyles(content);
        }, 300);
      } else {
        content.style.transition = "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
        content.style.transform = "translate3d(0,0,0)";
        if (overlay) {
          overlay.style.transition = "opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)";
          overlay.style.opacity = "1";
        }
        window.setTimeout(function () { clearSheetDragStyles(content); }, 260);
      }
    }

    content.addEventListener("touchend", finishDrag, { passive: true });
    content.addEventListener("touchcancel", finishDrag, { passive: true });
  }

  function toggleCartPopup(show) {
    if (show === undefined) show = true;

    var popup = $("#cartPopup");
    var content = popup ? popup.querySelector(".cart-popup-content") : null;
    if (!popup || !content) return;

    if (show) {
      if (!state.isOpen) trackAddToWishlist();
      // Không để thông báo cookie che nút mua hoặc các lựa chọn phân loại.
      var trackingNotice = document.getElementById("fsTrackingConsent");
      if (trackingNotice) trackingNotice.remove();
      var trackingPreferences = document.getElementById("fsCookiePreferences");
      if (trackingPreferences) trackingPreferences.remove();
      window.clearTimeout(state.scrollUnlockTimer);
      state.sheetDrag = null;
      clearSheetDragStyles(content);
      lockPageScroll();
      popup.style.display = "flex";
      content.classList.remove("animate-slideup");
      void content.offsetWidth;
      content.classList.add("animate-slideup");
      popup.classList.remove("hidden");
      state.isOpen = true;
      if (window.FSPORT_FAKE_NOTIFY && typeof window.FSPORT_FAKE_NOTIFY.hide === "function") {
        window.FSPORT_FAKE_NOTIFY.hide();
      }
      bindAddToCartButton();
      bindSheetSwipeToClose();
      requestAnimationFrame(updateVariantScrollbar);
    } else {
      content.classList.remove("animate-slideup");
      popup.classList.add("hidden");
      window.clearTimeout(state.scrollUnlockTimer);
      state.scrollUnlockTimer = setTimeout(function () {
        popup.style.display = "none";
        unlockPageScroll();
      }, 300);
      state.isOpen = false;
    }
  }

  function trackAddToWishlist() {
    var loai = window.productCategory || window.loai || state.category || "unknown";
    var productId = window.productPage || getProductPage();

    trackPixelEvent("AddToWishlist", {
      content_name: "click_btn_atc_" + loai,
      content_category: loai
    });

    trackInternalEvent("wishlist_add", {
      page_slug: productId,
      product_id: productId,
      product_name: window.productName || null
    });
  }

  function trackPixelEvent(name, params, options) {
    if (typeof window.trackBothPixels === "function") {
      window.trackBothPixels(name, params || {}, options || {});
      return;
    }
    window.__fsportPendingTrackingEvents = window.__fsportPendingTrackingEvents || [];
    window.__fsportPendingTrackingEvents.push({
      name: name,
      params: params || {},
      options: options || {}
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

  function trackGA4ViewItem() {
    if (state.ga4ViewItemTracked) return;
    state.ga4ViewItemTracked = true;
    if (typeof window.trackGA4EcommerceEvent !== "function") return;

    var base = state.base || {};
    var price = toNumber(base.price || base[KEY.price], 0);
    window.trackGA4EcommerceEvent("view_item", {
      currency: "VND",
      value: price,
      items: [{
        item_id: base.id || window.productPage || getProductPage(),
        item_name: window.productName || base.name || base.title || document.title || window.productPage || getProductPage(),
        price: price,
        quantity: 1
      }]
    });
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

  function showCartNotice(message, duration) {
    var content = $("#cartPopup .cart-popup-content");
    if (!content) return;
    var toast = $("#cartOptionToast", content);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cartOptionToast";
      toast.className = "cart-option-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      content.appendChild(toast);
    }

    window.clearTimeout(state.noticeTimer);
    toast.textContent = message;
    toast.classList.remove("is-visible");
    void toast.offsetWidth;
    toast.classList.add("is-visible");
    state.noticeTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, duration || 2200);
  }

  function focusMissingOption(attr) {
    if (!attr) return;
    var list = $("#variantList");
    var group = $('.variant-group[data-key="' + cssEscape(attr.key) + '"]');
    if (!list || !group) return;

    $$(".variant-group.selection-required", list).forEach(function (el) {
      el.classList.remove("selection-required");
    });
    group.classList.add("selection-required");

    var targetTop = group.offsetTop - Math.max(8, (list.clientHeight - group.offsetHeight) / 2);
    list.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    window.setTimeout(updateVariantScrollbar, 320);

    var label = String(attr.label || attr.key || "phân loại").replace(/\s*:\s*$/, "");
    showCartNotice("Vui lòng chọn " + label, 2400);
  }

  function addSelectedToCart() {
    var quantity = parseInt($("#quantityInput") && $("#quantityInput").value ? $("#quantityInput").value : "1", 10) || 1;
    var product = window.selectedVariant;
    if (!product) {
      focusMissingOption(getRequiredAttributes()[0]);
      return;
    }

    var requiredAttrs = getRequiredAttributes();
    var missingAttr = requiredAttrs.find(function (attr) {
      return String(state.selections[attr.key] || "").trim().length === 0;
    });

    if (missingAttr) {
      focusMissingOption(missingAttr);
      return;
    }

    if (isExplicitlyOutOfStock(state.selections)) {
      showCartNotice(MSG.outOfStock);
      return;
    }

    if (usesLiveInventory()) {
      var exactVariant = matchExactVariant(state.selections);
      if (!exactVariant) {
        showCartNotice(MSG.unavailable);
        return;
      }
      if (toNumber(exactVariant.stock_qty, 0) <= 0) {
        showCartNotice(MSG.outOfStock);
        return;
      }
      if (quantity > toNumber(exactVariant.stock_qty, 0)) {
        showCartNotice("Ch\u1ec9 c\u00f2n " + toNumber(exactVariant.stock_qty, 0) + " s\u1ea3n ph\u1ea9m trong kho.");
        return;
      }
      product = Object.assign({}, product, exactVariant, state.selections);
      window.selectedVariant = product;
      verifySkuBeforeCart(product, quantity).then(function (liveProduct) {
        completeAddToCart(Object.assign({}, product, {
          inventory_product_id: liveProduct.id,
          product_code: liveProduct.product_code,
          stock_qty: toNumber(liveProduct.stock_qty, 0),
          is_active: true
        }), quantity, requiredAttrs);
      }).catch(function (error) {
        showCartNotice(error && error.message ? error.message : MSG.unavailable);
      });
      return;
    }

    completeAddToCart(product, quantity, requiredAttrs);
  }

  function verifySkuBeforeCart(product, quantity) {
    var code = String(product.product_code || product.id || "").trim();
    if (!code) return Promise.reject(new Error(MSG.unavailable));
    var url = PRODUCT_AVAILABILITY_URL + "?codes=" + encodeURIComponent(code);
    return fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    }).then(function (response) {
      if (!response.ok) throw new Error(MSG.unavailable);
      return response.json();
    }).then(function (payload) {
      var liveProduct = payload && payload.products && payload.products[0];
      if (!liveProduct || liveProduct.is_active === false) throw new Error(MSG.unavailable);
      var stock = toNumber(liveProduct.stock_qty, 0);
      if (stock <= 0) throw new Error(MSG.outOfStock);
      if (quantity > stock) throw new Error("Ch\u1ec9 c\u00f2n " + stock + " s\u1ea3n ph\u1ea9m trong kho.");
      return liveProduct;
    });
  }

  function completeAddToCart(product, quantity, requiredAttrs) {
    var phanLoaiText = getVariantText(product, requiredAttrs).join(" - ");
    product[KEY.variantText] = phanLoaiText;

    var loai = window.productCategory || window.loai || product.category || "unknown";
    var voucherAmount = window.voucherByProduct && product.id ? (window.voucherByProduct[product.id] || 0) : 0;
    var cartItem = Object.assign({}, product, {
      quantity: quantity,
      loai: loai,
      page_slug: window.productPage || getProductPage(),
      product_name: getProductPage() === "carbon2"
        ? (product.product_name || window.productName || document.title || product.id)
        : (window.productName || document.title || window.productPage || product.id),
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

    trackPixelEvent("AddToCart", {
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
        page_slug: window.productPage || getProductPage(),
        product_id: window.productPage || null,
        product_name: window.productName || null,
        variant: phanLoaiText,
        quantity: quantity,
        price: price
      });
    }

    if (typeof window.trackGA4EcommerceEvent === "function") {
      window.trackGA4EcommerceEvent("add_to_cart", {
        currency: "VND",
        value: price * quantity,
        items: [{
          item_id: product.id || window.productPage || getProductPage(),
          item_name: window.productName || document.title || product.name || phanLoaiText || product.id || window.productPage || getProductPage(),
          price: price,
          quantity: quantity
        }]
      });
    }
  }

  function initCartPopup() {
    if (state.initialized) return;
    state.initialized = true;

    fetchCartPopupData()
      .then(function (json) {
        state.data = normalizeData(json);
        state.attributes = state.data.attributes;
        state.base = state.data.base;
        state.variants = state.data.variants;
        state.availability = state.data.availability;
        state.mainImageKey = state.data.mainImageKey;
        state.sku = state.data.sku;
        state.category = state.data.category;
        window.productCategory = state.category || window.productCategory;
        window.allAttributes = state.attributes;
        window.baseVariant = state.base;
        window.allVariants = state.variants;
        window.mainImageKey = state.mainImageKey;
        trackGA4ViewItem();
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

  if (!document.querySelector('script[data-product-sticky-footer-config]')) {
    var stickyFooterConfigScript = document.createElement('script');
    stickyFooterConfigScript.src = '/js/product-sticky-footer-config.js?v=20260905-desktop-layout-1';
    stickyFooterConfigScript.dataset.productStickyFooterConfig = 'true';
    document.body.appendChild(stickyFooterConfigScript);
  }

  function wire() {
    $$(".cart-popup-close, .cart-popup-overlay").forEach(function (btn) {
      btn.addEventListener("click", function () { toggleCartPopup(false); });
    });
    window.toggleForm = function () { toggleCartPopup(true); };
    bindSheetSwipeToClose();
    initCartPopup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
