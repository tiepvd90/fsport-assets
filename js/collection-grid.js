/* ==========================================================
   COLLECTION GRID
   ----------------------------------------------------------
   - Supports flat JSON arrays and grouped arrays: { groupName, items }
   - Each page declares window.collectionList entries.
   - Each entry can call Admin/Supabase by slug and fallback to its own JSON.
   ========================================================== */

(function () {
  "use strict";

  var lazyImages = window.FSPORT_LAZY_IMAGES || (window.FSPORT_LAZY_IMAGES = (function () {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    var slow = connection.saveData || /(^|-)2g$|3g/.test(connection.effectiveType || "");
    var maxConcurrent = slow ? 2 : 4;
    var active = 0;
    var queue = [];
    function pump() {
      while (active < maxConcurrent && queue.length) {
        var image = queue.shift();
        if (!image || image.dataset.lazyStarted === "1") continue;
        image.dataset.lazyStarted = "1";
        active++;
        var done = function () {
          active = Math.max(0, active - 1);
          image.removeEventListener("load", done);
          image.removeEventListener("error", done);
          pump();
        };
        image.addEventListener("load", done);
        image.addEventListener("error", done);
        image.src = image.dataset.src || "";
        image.removeAttribute("data-src");
      }
    }
    var observer = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        queue.push(entry.target);
      });
      pump();
    }, { rootMargin: slow ? "120px 0px" : "400px 0px", threshold: 0.01 }) : null;
    return {
      observe: function (image, src) {
        if (!src) return;
        image.loading = "lazy";
        image.decoding = "async";
        image.fetchPriority = "low";
        image.dataset.src = src || "";
        if (observer) observer.observe(image);
        else { queue.push(image); pump(); }
      }
    };
  })());

  (function loadCSS() {
    var cssURL = "/css/collection-grid.css?v=20260702-discount-badge-1";
    if (!document.querySelector('link[href^="/css/collection-grid.css"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssURL;
      document.head.appendChild(link);
    }
  })();

  var DEFAULT_COLLECTIONS = [
    { title: "PICKLEBALL", slug: "pickleball-collection", json: "/json/pickleball-collection.json" },
    { title: "YSANDAL", slug: "ysandal-collection", json: "/json/ysandal-collection.json" }
  ];
  var COLLECTIONS = Array.isArray(window.collectionList) && window.collectionList.length
    ? window.collectionList
    : DEFAULT_COLLECTIONS;
  var SUPABASE_URL = "https://xcigbbcpwfzluqazadez.supabase.co";
  var SUPABASE_ANON_KEY = window.FSPORT_SUPABASE_ANON || "sb_publishable_yZKMMfjz_wk6sYOoqaAPnw_DwOa9yNU";
  var COLLECTION_API = "https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/product-collection-config";

  var container = document.getElementById("collectionContainer");
  if (!container) return;
  var catalogFallbackPromise = null;

  function formatPrice(v) {
    if (v == null || isNaN(v) || v <= 0) return "";
    return Number(v).toLocaleString("vi-VN") + "đ";
  }

  function discountAmount(item) {
    var salePrice = Number(item && item.price);
    var originalPrice = Number(item && item.originalPrice);
    if (!Number.isFinite(salePrice) || !Number.isFinite(originalPrice)) return 0;
    if (salePrice <= 0 || originalPrice <= salePrice) return 0;
    return originalPrice - salePrice;
  }

  function formatDiscount(v) {
    if (!Number.isFinite(v) || v <= 0) return "";
    return Number(v).toLocaleString("vi-VN") + "Đ";
  }

  function isPickleballCollection(collection, title) {
    var slug = String(collection && collection.slug || "").toLowerCase();
    var category = String(collection && collection.category || "").toLowerCase();
    var name = String(title || collection && collection.title || "").toLowerCase();
    return slug === "pickleball-collection" ||
      category === "pickleball" ||
      name.indexOf("pickleball") >= 0;
  }

  function getItemsFromData(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  function supabaseHeaders() {
    return {
      Accept: "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY
    };
  }

  function parseMaybeJsonArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];
    try {
      var parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function firstProductImage(product) {
    if (!product) return "";
    if (product.image_url) return product.image_url;
    var images = parseMaybeJsonArray(product.image_urls);
    return images[0] || "";
  }

  function normalizeImageUrl(src) {
    var value = String(src || "").trim();
    if (!value) return "";
    if (value.indexOf("//") === 0) return "https:" + value;
    if (value.indexOf("http://fun-sport.co") === 0) return value.replace("http://", "https://");
    return value;
  }

  function cleanCollectionItem(item) {
    var image = normalizeImageUrl(item && item.image);
    return Object.assign({}, item, { image: image });
  }

  function loadCatalogFallback() {
    if (catalogFallbackPromise) return catalogFallbackPromise;
    catalogFallbackPromise = fetch("/json/collection.json")
      .then(function (response) {
        if (!response.ok) throw new Error("Catalog fallback HTTP " + response.status);
        return response.json();
      })
      .then(function (data) {
        var map = {};
        getItemsFromData(data).forEach(function (item) {
          var key = item.productCode || item.product_code || item.id;
          if (key) map[String(key)] = item;
        });
        return map;
      })
      .catch(function () { return {}; });
    return catalogFallbackPromise;
  }

  async function fillMissingProductImages(collections) {
    var needsFallback = (collections || []).some(function (collection) {
      return getItemsFromData(collection).some(function (item) { return !item.image; });
    });
    if (!needsFallback) return collections || [];
    var catalog = await loadCatalogFallback();
    (collections || []).forEach(function (collection) {
      getItemsFromData(collection).forEach(function (item) {
        if (item.image) return;
        var key = item.productCode || item.product_code || item.id;
        var fallback = key ? catalog[String(key)] : null;
        if (fallback && fallback.image) item.image = normalizeImageUrl(fallback.image);
      });
    });
    return collections || [];
  }

  function isGroupStructure(items) {
    return Array.isArray(items) && items.length > 0 && items[0].hasOwnProperty("groupName") && items[0].hasOwnProperty("items");
  }

  function slugFromCollection(col) {
    if (col.slug) return col.slug;
    if (col.json && col.json.indexOf("pickleball-collection") >= 0) return "pickleball-collection";
    if (col.json && col.json.indexOf("ysandal-collection") >= 0) return "ysandal-collection";
    return "main-product-collection";
  }

  function createCard(item, showDiscountBadge) {
    var price = formatPrice(item.price);
    var original = formatPrice(item.originalPrice);
    var showOriginal = original && item.originalPrice && Number(item.originalPrice) > Number(item.price);
    var discount = showDiscountBadge ? formatDiscount(discountAmount(item)) : "";
    var div = document.createElement("div");
    div.className = "cgrid-card";
    div.innerHTML =
      '<div class="cgrid-thumb">' +
        (discount ? '<span class="cgrid-discount-badge">Giảm ' + discount + '</span>' : '') +
        '<img alt="' + (item.title || "") + '">' +
      '</div>' +
      '<div class="cgrid-name">' + (item.title || "") + '</div>' +
      (price ? '<div class="cgrid-price-wrap"><div class="cgrid-price">' + price + '</div>' + (showOriginal ? '<div class="cgrid-original">' + original + '</div>' : '') + '</div>' : '');
    var image = div.querySelector(".cgrid-thumb img");
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", function () {
      image.classList.add("cgrid-img-error");
      image.removeAttribute("src");
      image.removeAttribute("data-src");
    }, { once: true });
    lazyImages.observe(image, normalizeImageUrl(item.image) || "");
    div.addEventListener("click", function () {
      if (item.link) window.location.href = item.link;
    });
    return div;
  }

  function renderGroup(groupName, items, showDiscountBadge) {
    if (!items || items.length === 0) return null;
    var block = document.createElement("div");
    block.className = "cgrid-block";
    block.innerHTML = '<div class="cgrid-group-title">' + groupName + '</div><div class="cgrid-grid"></div>';
    var grid = block.querySelector(".cgrid-grid");
    items.forEach(function (item) { grid.appendChild(createCard(item, showDiscountBadge)); });
    return block;
  }

  function renderFlat(items, title, showDiscountBadge) {
    var block = document.createElement("div");
    block.className = "cgrid-block";
    block.innerHTML = '<div class="cgrid-title">' + (title || "Collection") + '</div><div class="cgrid-grid"></div>';
    var grid = block.querySelector(".cgrid-grid");
    items.forEach(function (item) { grid.appendChild(createCard(item, showDiscountBadge)); });
    return block;
  }

  function renderItems(rawItems, title, collection) {
    var showDiscountBadge = isPickleballCollection(collection, title);
    if (isGroupStructure(rawItems)) {
      rawItems.forEach(function (group) {
        var groupItems = Array.isArray(group.items) ? group.items.map(cleanCollectionItem) : [];
        var groupBlock = renderGroup(group.groupName, groupItems, showDiscountBadge);
        if (groupBlock) container.appendChild(groupBlock);
      });
    } else if (Array.isArray(rawItems) && rawItems.some(function (item) { return item && item.groupName; })) {
      var groups = [];
      var groupMap = {};
      rawItems.forEach(function (item) {
        var groupName = item.groupName || title || "Collection";
        if (!groupMap[groupName]) {
          groupMap[groupName] = { groupName: groupName, items: [] };
          groups.push(groupMap[groupName]);
        }
        groupMap[groupName].items.push(cleanCollectionItem(item));
      });
      groups.forEach(function (group) {
        var groupBlock = renderGroup(group.groupName, group.items, showDiscountBadge);
        if (groupBlock) container.appendChild(groupBlock);
      });
    } else {
      container.appendChild(renderFlat(rawItems.map(cleanCollectionItem), title, showDiscountBadge));
    }
  }

  async function fetchJson(url, options) {
    var response = await fetch(url, options || {});
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }

  async function fetchAdminCollectionViaFunction(slug) {
    return fetchJson(COLLECTION_API + "?slug=" + encodeURIComponent(slug), {
      headers: { Accept: "application/json" }
    });
  }

  async function fetchAdminCollectionViaRest(slug) {
    var collectionUrl = SUPABASE_URL +
      "/rest/v1/product_collections?select=id,slug,title&slug=eq." +
      encodeURIComponent(slug) + "&is_active=eq.true&limit=1";
    var collections = await fetchJson(collectionUrl, { headers: supabaseHeaders() });
    var collection = collections && collections[0];
    if (!collection || !collection.id) throw new Error("Admin collection not found");

    var itemUrl = SUPABASE_URL +
      "/rest/v1/product_collection_items?select=product_code,group_name,title_override,price_override,original_price,image_override,link_override,display_order&collection_id=eq." +
      encodeURIComponent(collection.id) + "&is_active=eq.true&order=display_order.asc";
    var rows = await fetchJson(itemUrl, { headers: supabaseHeaders() });
    if (!Array.isArray(rows) || !rows.length) throw new Error("Admin collection is empty");

    var codes = rows.map(function (row) { return row.product_code; }).filter(Boolean);
    var productMap = {};
    if (codes.length) {
      var uniqueCodes = codes.filter(function (code, index, arr) { return arr.indexOf(code) === index; });
      var productUrl = SUPABASE_URL +
        "/rest/v1/products?select=product_code,product_name,image_url,image_urls,price,original_price,compare_at_price,category&product_code=in.(" +
        uniqueCodes.map(encodeURIComponent).join(",") + ")";
      var products = await fetchJson(productUrl, { headers: supabaseHeaders() });
      (products || []).forEach(function (product) {
        productMap[product.product_code] = product;
      });
    }

    var items = rows.map(function (row) {
      var product = productMap[row.product_code] || {};
      var price = row.price_override != null ? row.price_override : product.price;
      var originalPrice = row.original_price != null ? row.original_price : (product.original_price || product.compare_at_price);
      return cleanCollectionItem({
        id: row.product_code,
        productCode: row.product_code,
        title: row.title_override || product.product_name || row.product_code,
        price: price,
        originalPrice: originalPrice,
        image: row.image_override || firstProductImage(product),
        link: row.link_override || (row.product_code ? "/product/" + row.product_code + ".html" : ""),
        groupName: row.group_name || ""
      });
    });

    if (items.some(function (item) { return item.groupName; })) {
      var groups = [];
      var groupMap = {};
      items.forEach(function (item) {
        var groupName = item.groupName || collection.title || "Collection";
        if (!groupMap[groupName]) {
          groupMap[groupName] = { groupName: groupName, items: [] };
          groups.push(groupMap[groupName]);
        }
        groupMap[groupName].items.push(item);
      });
      return { slug: collection.slug, title: collection.title, items: groups };
    }

    return { slug: collection.slug, title: collection.title, items: items };
  }

  async function loadJsonCollection(col) {
    var res = await fetch(col.json);
    if (!res.ok) throw new Error("HTTP " + res.status);
    var data = await res.json();
    var rawItems = getItemsFromData(data);
    if (!rawItems.length) throw new Error("JSON collection is empty");
    renderItems(rawItems, col.title, col);
  }

  async function loadAdminCollection(col) {
    var slug = slugFromCollection(col);
    var collection;
    try {
      collection = await fetchAdminCollectionViaFunction(slug);
    } catch (functionError) {
      console.warn("[Collection] Edge Function unavailable, trying Supabase REST fallback.", slug, functionError);
      collection = await fetchAdminCollectionViaRest(slug);
    }
    var apiItems = getItemsFromData(collection);
    if (!apiItems.length) throw new Error("Admin collection is empty");
    renderItems(apiItems, collection.title || col.title || "Collection", {
      slug: slug,
      title: collection.title || col.title
    });
  }

  async function renderCollections() {
    var frontendConfig = await (window.FSPORT_FRONTEND_PAGE_CONFIG_PROMISE || Promise.resolve(null)).catch(function () { return null; });
    if (frontendConfig) {
      if (frontendConfig.settings && frontendConfig.settings.collectionGrid && frontendConfig.settings.collectionGrid.enabled === false) {
        container.innerHTML = "";
        return;
      }
      var homepageCollections = Array.isArray(frontendConfig.collections) ? frontendConfig.collections : [];
      homepageCollections = await fillMissingProductImages(homepageCollections);
      homepageCollections.forEach(function (collection, index) {
        renderItems(getItemsFromData(collection), collection.title || "Collection", collection);
        if (index < homepageCollections.length - 1) {
          var homepageDivider = document.createElement("div");
          homepageDivider.className = "cgrid-divider";
          container.appendChild(homepageDivider);
        }
      });
      return;
    }
    var runtimeConfig = await (window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || Promise.resolve(null)).catch(function () { return null; });
    var page = window.FSPORT_PRODUCT_PAGE;
    var runtimeSection = page && page.getSection ? page.getSection("collection_grid") : null;
    if (runtimeConfig) {
      if (!runtimeSection || runtimeSection.active === false) {
        container.innerHTML = "";
        return;
      }
      var configuredCollections = Array.isArray(runtimeSection.content) ? runtimeSection.content : [];
      configuredCollections = await fillMissingProductImages(configuredCollections);
      configuredCollections.forEach(function (collection, index) {
        renderItems(getItemsFromData(collection), collection.title || "Collection", collection);
        if (index < configuredCollections.length - 1) {
          var configuredDivider = document.createElement("div");
          configuredDivider.className = "cgrid-divider";
          container.appendChild(configuredDivider);
        }
      });
      return;
    }
    if (!Array.isArray(COLLECTIONS) || COLLECTIONS.length === 0) {
      console.warn("No collection configured.");
      return;
    }
    for (var i = 0; i < COLLECTIONS.length; i++) {
      var col = COLLECTIONS[i];
      try {
        await loadAdminCollection(col);
      } catch (error) {
        console.warn("[Collection] Admin data unavailable, using JSON fallback.", col, error);
        try {
          await loadJsonCollection(col);
        } catch (fallbackError) {
          console.error("[Collection] JSON fallback failed:", col, fallbackError);
        }
      }
      var divider = document.createElement("div");
      divider.className = "cgrid-divider";
      container.appendChild(divider);
    }
  }

  renderCollections();
})();
