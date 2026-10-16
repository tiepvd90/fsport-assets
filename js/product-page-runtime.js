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
    var pageTitle = String(config.title || "").trim();
    if (pageTitle) document.title = pageTitle;

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

    window.productName = config.productName || pageTitle || config.slug;
    window.productPageTitle = pageTitle || window.productName;
    function applyVisibleTitle() {
      var dynamicTitle = document.getElementById("dynamicProductTitle");
      if (dynamicTitle) {
        dynamicTitle.textContent = window.productPageTitle;
        return;
      }
      // Older pages put the title directly after the Mall/official badges.
      // Keep those badges, but let the Page title setting own the visible text.
      var heading = document.querySelector(".page-container .product-hero h1");
      if (!heading) return;
      var titleText = Array.prototype.filter.call(heading.childNodes, function(node) {
        return node.nodeType === 3 && node.textContent.trim();
      }).pop();
      if (titleText) titleText.textContent = " " + window.productPageTitle;
      else heading.appendChild(document.createTextNode(" " + window.productPageTitle));
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyVisibleTitle, { once: true });
    } else {
      applyVisibleTitle();
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
    if (window.FSPORT_PRODUCT_STICKY_FOOTER && typeof window.FSPORT_PRODUCT_STICKY_FOOTER.apply === "function") {
      window.FSPORT_PRODUCT_STICKY_FOOTER.apply(footer);
      return;
    }
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
    apply("zalo-link", "https://zalo.me/0384735980", footer.zalo_label, footer.zalo_icon_url);
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

  function renderPurchaseButtons(config) {
    var purchase = config && config.purchaseButtons;
    if (!purchase) return;

    var host = document.getElementById("fsPurchaseChannelButtons");

    if (!purchase.enabled || !purchase.preset || !purchase.preset.config) {
      if (host) host.hidden = true;
      return;
    }

    if (!host) {
      host = document.createElement("div");
      host.className = "product-hero fs-purchase-channel-buttons";
    }
    host.id = "fsPurchaseChannelButtons";
    host.classList.add("fs-purchase-channel-buttons");
    host.hidden = false;
    host.innerHTML = "";

    var buttonRow = document.createElement("div");
    buttonRow.className = "btn-block";
    var buttons = Array.isArray(purchase.preset.config.buttons)
      ? purchase.preset.config.buttons.slice(0, 3)
      : [];

    function trackClick(button, buttonKey) {
      var metadata = {
        page_slug: String(config.slug || window.productPage || window.location.pathname.split("/").pop().replace(/\.html?$/i, "")),
        page_title: String(config.title || window.productName || document.title || ""),
        button_key: buttonKey,
        button_text: String(button.text || "PURCHASE"),
        action: button.action === "cart" ? "cart" : "marketplace"
      };
      if (window.fsport && typeof window.fsport.track === "function") {
        window.fsport.track("purchase_button_click", metadata);
      }
      window.dispatchEvent(new CustomEvent("fsport:purchase-button-click", { detail:metadata }));
    }

    buttons.forEach(function(button) {
      var element = document.createElement("button");
      element.type = "button";
      element.className = "footer-btn " + (button.action === "cart" ? "atc-btn" : "marketplace-btn");
      element.textContent = String(button.text || "PURCHASE");
      element.style.backgroundColor = String(button.backgroundColor || "#111111");
      element.style.color = String(button.textColor || "#ffffff");
      var buttonKey = String(button.key || button.marketplace || "button").toLowerCase();
      if (button.action === "cart") {
        element.addEventListener("click", function() {
          if (typeof window.toggleCartPopup === "function") {
            window.toggleCartPopup(true);
            return;
          }
          var stickyCartButton = document.getElementById("btn-atc");
          if (stickyCartButton) stickyCartButton.click();
          else console.warn("[PurchaseButtons] CartPopup is not ready");
        });
      } else {
        var destination = String((purchase.links || {})[buttonKey] || "").trim();
        if (!destination) return;
        try {
          if (new URL(destination).protocol !== "https:") return;
        } catch (_) {
          return;
        }
        element.dataset.purchaseButtonKey = buttonKey;
        element.addEventListener("click", function() {
          trackClick(button, buttonKey);
          window.dispatchEvent(new CustomEvent("fsport:outbound-purchase", {
            detail: { buttonKey:buttonKey, buttonText:button.text, url:destination, product:config.slug }
          }));
          var outboundTab = window.open(destination, "_blank", "noopener,noreferrer");
          if (outboundTab) outboundTab.opener = null;
        });
      }
      buttonRow.appendChild(element);
    });
    buttonRow.dataset.buttonCount = String(buttonRow.children.length);

    if (!buttonRow.children.length) {
      host.hidden = true;
      return;
    }
    host.appendChild(buttonRow);
    var note = String(purchase.preset.config.note || "").trim();
    if (note) {
      var noteElement = document.createElement("div");
      noteElement.className = "btn-note";
      noteElement.textContent = note;
      host.appendChild(noteElement);
    }

    var description = document.querySelector('[data-fsport-section="product_description"]');
    if (!description) {
      var placeholder = document.getElementById("productdescription-placeholder");
      description = placeholder && (placeholder.closest(".product-hero") || placeholder);
    }
    if (description && description.parentNode) description.insertAdjacentElement("afterend", host);
  }

  function applyLegacyLayout(config) {
    var root = document.querySelector(".page-container");
    if (!root) return;
    var description = document.getElementById("productdescription-placeholder");
    var collection = document.getElementById("ysandalRelatedCollections");
    var sections = config.sections.slice().sort(function(a, b) {
      return Number(a.order || 0) - Number(b.order || 0);
    });
    var aiSection = sections.find(function(section) { return section.type === "ai_chat"; });
    if (aiSection && aiSection.active !== false && !document.getElementById("aic-container")) {
      var ai = document.createElement("div");
      ai.setAttribute("data-fsport-section", "ai_chat");
      ai.innerHTML = '<div id="aic-container"></div>';
      var descriptionWrapper = description && (description.closest(".product-hero") || description);
      root.insertBefore(ai, collection || (descriptionWrapper && descriptionWrapper.nextSibling) || null);
    }
    var gallerySection = sections.find(function(section) { return section.type === "photo_gallery"; });
    if (gallerySection && gallerySection.active !== false && !document.getElementById("photo-gallery-container")) {
      var gallery = document.createElement("div");
      gallery.setAttribute("data-fsport-section", "photo_gallery");
      gallery.className = "product-hero";
      gallery.innerHTML = '<div id="photo-gallery-container"></div>';
      root.insertBefore(gallery, collection || null);
      if (!document.querySelector('script[src*="/js/photo-gallery.js"]')) {
        var galleryScript = document.createElement("script");
        galleryScript.src = "/js/photo-gallery.js?v=20260904-lightbox-navigation-1";
        document.body.appendChild(galleryScript);
      }
    }
    var nodes = {
      slideshow: document.getElementById("lazySlideshow"),
      flash_banner: document.getElementById("flashbanner-placeholder"),
      product_video: root.querySelector('[data-fsport-section="product_video"]'),
      product_description: description && (description.closest(".product-hero") || description),
      ai_chat: root.querySelector('[data-fsport-section="ai_chat"]'),
      photo_gallery: root.querySelector('[data-fsport-section="photo_gallery"]'),
      collection_grid: collection
    };
    sections.forEach(function(section) {
      var node = nodes[section.type];
      if (!node) return;
      node.hidden = section.active === false;
      node.style.display = section.active === false ? "none" : "";
      if (section.type === "slideshow") {
        var zoom = document.getElementById("fullscreenZoom");
        if (zoom) zoom.hidden = section.active === false;
      }
    });
    // Keep legacy review/CTA blocks in place. Only move managed sections when
    // an administrator actually changes their relative order in the template.
    var orderedNodes = sections.map(function(section) { return nodes[section.type]; })
      .filter(function(node) { return node && node.parentNode === root; });
    for (var i = orderedNodes.length - 2; i >= 0; i--) {
      var node = orderedNodes[i];
      var next = orderedNodes[i + 1];
      if (node.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_PRECEDING) {
        root.insertBefore(node, next);
      }
    }
  }

  function applyLayout(config) {
    if (!config || !Array.isArray(config.sections)) return;
    var host = document.getElementById("productPageSections");
    if (!host) {
      applyLegacyLayout(config);
      renderFlashBanner(config);
      applyStickyFooter(config);
      renderPurchaseButtons(config);
      return;
    }
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
    renderPurchaseButtons(config);
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
