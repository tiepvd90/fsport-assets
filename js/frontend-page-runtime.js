(function () {
  "use strict";
  if (window.__fsportFrontendPageRuntimeLoaded) return;
  window.__fsportFrontendPageRuntimeLoaded = true;

  var endpoint = window.FSPORT_FRONTEND_PAGE_CONFIG_URL ||
    "https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/frontend-page-config";

  function applySeo(config) {
    if (config.seo && config.seo.title) document.title = config.seo.title;
    if (config.seo && config.seo.description) {
      var meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
      meta.name = "description";
      meta.content = config.seo.description;
      if (!meta.parentNode) document.head.appendChild(meta);
    }
  }

  function renderSlideshow(config) {
    var host = document.getElementById("homepageSlideshow");
    if (!host) return;
    var slides = Array.isArray(config.slideshow) ? config.slideshow : [];
    if (!slides.length) {
      host.hidden = true;
      return;
    }
    host.innerHTML = '<div class="homepage-slides">' + slides.map(function(slide, index) {
      var url = String(slide.image_url || '').replace(/"/g, '&quot;');
      var image = '<img class="homepage-slide' + (index === 0 ? ' is-active' : '') + '"' +
        (index === 0
          ? ' src="' + url + '" loading="eager" fetchpriority="high"'
          : ' data-src="' + url + '" loading="lazy" fetchpriority="low"') +
        ' decoding="async" alt="' +
        String(slide.alt_text || '').replace(/"/g, '&quot;') + '">';
      return slide.link_url ? '<a href="' + String(slide.link_url).replace(/"/g, '&quot;') + '">' + image + '</a>' : image;
    }).join('') + '<div class="slide-counter" id="homepageSlideCounter">1/' + slides.length + '</div></div>' +
      (slides.length > 1 ? '<div class="homepage-slide-dots">' + slides.map(function(_, index) {
        return '<button type="button" data-slide="' + index + '" class="' + (index === 0 ? 'is-active' : '') + '" aria-label="Slide ' + (index + 1) + '"></button>';
      }).join('') + '</div>' : '') +
      '<div id="fullscreenZoom" class="fs-hidden-initial"><div id="zoomWrapper">' +
      '<img id="zoomedImg" src="" alt="Ảnh phóng to">' +
      '<button id="zoomCloseBtn" type="button" aria-label="Đóng">×</button></div></div>';
    var current = 0;
    var images = host.querySelectorAll('.homepage-slide');
    var dots = host.querySelectorAll('[data-slide]');
    var counter = host.querySelector('#homepageSlideCounter');
    window.FSportSlideshowLazyLoader.loadSequentially(images);
    function show(index) {
      window.FSportSlideshowLazyLoader.reveal(images[index]);
      current = index;
      images.forEach(function(image, i) { image.classList.toggle('is-active', i === index); });
      dots.forEach(function(dot, i) { dot.classList.toggle('is-active', i === index); });
      if (counter) counter.textContent = (index + 1) + '/' + images.length;
    }
    window.FSportSlideshowLazyLoader.bindZoom({
      trigger: host.querySelector('.homepage-slides'),
      overlay: host.querySelector('#fullscreenZoom'),
      zoomImage: host.querySelector('#zoomedImg'),
      closeButton: host.querySelector('#zoomCloseBtn'),
      getCurrentImage: function() { return images[current]; }
    });
    dots.forEach(function(dot) { dot.addEventListener('click', function() { show(Number(dot.dataset.slide)); }); });
    if (slides.length > 1) setInterval(function() { show((current + 1) % slides.length); }, 5000);
  }

  function renderBanner(config) {
    var host = document.getElementById("homepageBanner");
    if (!host) return;
    var banner = config.banner || (config.settings && config.settings.banner);
    if (!banner || banner.enabled === false || !banner.image_url) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    var image = '<img src="' + String(banner.image_url).replace(/"/g, '&quot;') +
      '" alt="' + String(banner.alt_text || "Fun Sport Cover").replace(/"/g, '&quot;') +
      '" class="cover-img">';
    host.innerHTML = banner.link_url
      ? '<a href="' + String(banner.link_url).replace(/"/g, '&quot;') + '">' + image + '</a>'
      : image;
  }

  function renderStaticFallback() {
    function render() {
      var host = document.getElementById("homepageBanner");
      if (!host) return;
      host.hidden = false;
      if (host.querySelector("img")) return;
      host.innerHTML = '<img src="/assets/images/F-SPORT COVER.webp" alt="Fun Sport Cover" class="cover-img">';
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once:true });
    else render();
  }

  // The static cover is useful content, not a loading screen. Keep it visible
  // while the admin configuration request is in flight, then replace or hide
  // it when renderBanner() receives the current configuration.
  renderStaticFallback();

  function applySectionOrder(settings) {
    var order = Array.isArray(settings.sectionOrder)
      ? settings.sectionOrder
      : ["banner", "slideshow", "collection", "ai", "gallery", "about"];
    var target = document.getElementById("checkoutPopup-placeholder");
    if (!target || !target.parentNode) return;
    var elements = {
      banner: document.getElementById("homepageBanner"),
      slideshow: document.getElementById("homepageSlideshow"),
      collection: document.getElementById("collectionContainer"),
      ai: document.getElementById("aic-container"),
      gallery: document.getElementById("photo-gallery-container"),
      about: document.querySelector(".fsport-about") || document.getElementById("about-placeholder")
    };
    order.forEach(function(id) {
      if (elements[id]) target.parentNode.insertBefore(elements[id], target);
    });
  }

  function applySections(config) {
    var settings = config.settings || {};
    var ai = document.getElementById('aic-container');
    if (ai && settings.aiChat && settings.aiChat.enabled === false) ai.style.display = 'none';
    var gallery = document.getElementById('photo-gallery-container');
    if (gallery && settings.photoGallery && settings.photoGallery.enabled === false) gallery.style.display = 'none';
    var about = document.querySelector('.fsport-about') || document.getElementById('about-placeholder');
    if (about && settings.about && settings.about.enabled === false) about.style.display = 'none';
    renderBanner(config);
    renderSlideshow(config);
    applySectionOrder(settings);
    window.setTimeout(function() { applySectionOrder(settings); }, 100);
  }

  function apply(config) {
    window.__fsportFrontendPageConfig = config;
    applySeo(config);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() { applySections(config); }, { once:true });
    } else {
      applySections(config);
    }
    return config;
  }

  window.FSPORT_FRONTEND_PAGE_CONFIG_PROMISE = fetch(endpoint + "?slug=index", {
    headers: { Accept:"application/json" }
  }).then(function(response) {
    if (!response.ok) throw new Error("Frontend page config HTTP " + response.status);
    return response.json();
  }).then(function(config) {
    if (config.settings && config.settings.useAdminData === false) {
      renderStaticFallback();
      return null;
    }
    return apply(config);
  }).catch(function(error) {
    console.warn("[FrontendPageRuntime] Using static Index fallback", error);
    renderStaticFallback();
    return null;
  });
})();
