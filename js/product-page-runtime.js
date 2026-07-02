/* ==========================================================================
 * F-Sport product page runtime config
 * Backend owns content/config/order; frontend keeps renderers and fallbacks.
 * ========================================================================== */
(function () {
  "use strict";

  if (window.__fsportProductPageRuntimeLoaded) return;
  window.__fsportProductPageRuntimeLoaded = true;

  var baseUrl = window.FSPORT_PRODUCT_PAGE_CONFIG_URL ||
    "https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/product-page-config";

  function slugFromPath(path) {
    var clean = String(path || "").split("?")[0].split("#")[0].replace(/\/+$/, "");
    var last = clean.split("/").filter(Boolean).pop() || "";
    return last.replace(/\.html?$/i, "").trim().toLowerCase();
  }

  function getSlug() {
    return String(window.productPage || slugFromPath(window.location.pathname) || "").toLowerCase();
  }

  function configUrl() {
    var sep = baseUrl.indexOf("?") >= 0 ? "&" : "?";
    return baseUrl + sep + "slug=" + encodeURIComponent(getSlug());
  }

  function applySeo(config) {
    if (!config || typeof config !== "object") return;
    if (config.title) document.title = config.title;

    var description = config.seo && config.seo.description;
    if (description) {
      var meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
  }

  function cacheCartConfig(config) {
    if (config && config.cartpopup && config.cartpopup.cartSchema === "fsport-product-v1") {
      window.__fsportProductPageConfig = Object.assign({}, config.cartpopup, {
        slug: config.slug,
        frontendPath: config.frontendPath,
        title: config.title,
        productName: config.productName,
        seo: config.seo || {}
      });
    }
  }

  function findSection(type) {
    var config = window.__fsportCompiledProductPageConfig;
    var sections = config && Array.isArray(config.sections) ? config.sections : [];
    return sections.find(function (section) { return section.type === type; }) || null;
  }

  function isSectionEnabled(type) {
    var section = findSection(type);
    return !!(section && section.active !== false);
  }

  function applyStickyFooter(config) {
    var footer = config && config.stickyFooter && config.stickyFooter.config;
    if (!footer) return;
    window.__fsportStickyFooterConfig = footer;
    function apply(id, href, label, icon) {
      var anchor = document.getElementById(id);
      if (!anchor) return;
      if (href) anchor.href = href;
      var span = anchor.querySelector("span");
      var image = anchor.querySelector("img");
      if (span && label) span.textContent = label;
      if (image && icon) image.src = icon;
    }
    apply("home-link", footer.home_url, footer.home_label, footer.home_icon_url);
    apply("messenger-link", footer.messenger_url, footer.messenger_label, footer.messenger_icon_url);
    apply("zalo-link", footer.zalo_url, footer.zalo_label, footer.zalo_icon_url);
    apply("call-link", footer.phone ? "tel:" + String(footer.phone).replace(/\s+/g, "") : "", footer.phone_label, footer.phone_icon_url);
    var cart = document.getElementById("btn-atc");
    if (cart && footer.cart_label) cart.textContent = footer.cart_label;
  }

  function renderFlashBanner(config) {
    var section = config && Array.isArray(config.sections)
      ? config.sections.find(function(row) { return row.type === "flash_banner"; })
      : null;
    var host = document.getElementById("flashbanner-placeholder");
    if (!host || !section || section.active === false) return;
    var banner = section.content;
    if (!banner) {
      host.innerHTML = "";
      return;
    }
    if (banner.html) {
      host.innerHTML = banner.html;
      return;
    }
    host.innerHTML =
      '<div class="freeship-banner" style="width:100%;height:' + Number(banner.height || 48) + 'px;background:' + (banner.color || "#ff4b0b") + ';overflow:hidden">' +
        '<div class="freeship-inner" style="height:100%;display:flex;align-items:center;justify-content:center;padding:0 16px;color:#fff;font-weight:800;letter-spacing:.3px;text-transform:uppercase">' +
          '<span class="freeship-text">' + String(banner.text || banner.name || "") + '</span>' +
        '</div>' +
      '</div>';
  }

  function applyLayout(config) {
    if (!config || !Array.isArray(config.sections)) return;
    var host = document.getElementById("productPageSections");
    if (!host) return;
    config.sections
      .slice()
      .sort(function(a, b) { return Number(a.order || 0) - Number(b.order || 0); })
      .forEach(function(section) {
        var node = host.querySelector('[data-fsport-section="' + section.type + '"]');
        if (!node) return;
        node.hidden = section.active === false;
        node.style.display = section.active === false ? "none" : "";
        host.appendChild(node);
      });
    var hero = Array.prototype.find.call(host.children, function(node) {
      return node.classList && node.classList.contains("product-hero") && !node.hasAttribute("data-fsport-section");
    });
    var slideshow = host.querySelector('[data-fsport-section="slideshow"]');
    var flashBanner = host.querySelector('[data-fsport-section="flash_banner"]:not([hidden])');
    if (hero && (flashBanner || slideshow)) (flashBanner || slideshow).insertAdjacentElement("afterend", hero);
    renderFlashBanner(config);
    applyStickyFooter(config);
  }

  function applyWhenDomReady(config) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() { applyLayout(config); }, { once: true });
    } else {
      applyLayout(config);
    }
  }

  function load() {
    var slug = getSlug();
    if (!slug) return Promise.resolve(null);

    return fetch(configUrl())
      .then(function (res) {
        if (!res.ok) throw new Error("Product page config HTTP " + res.status);
        return res.json();
      })
      .then(function (config) {
        window.__fsportCompiledProductPageConfig = config;
        applySeo(config);
        cacheCartConfig(config);
        applyWhenDomReady(config);
        return config;
      })
      .catch(function (err) {
        console.warn("[ProductPageRuntime] Backend config fallback to static frontend", err);
        return null;
      });
  }

  window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE = window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || load();
  window.FSPORT_PRODUCT_PAGE = {
    getConfig: function () { return window.__fsportCompiledProductPageConfig || null; },
    getSection: findSection,
    isSectionEnabled: isSectionEnabled,
    applyLayout: applyLayout,
    ready: function () { return window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE; }
  };
})();
