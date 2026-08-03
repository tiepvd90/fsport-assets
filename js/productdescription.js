document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("productdescription-placeholder");
  if (!container) return;

  function getDescriptionItem() {
    const page = window.FSPORT_PRODUCT_PAGE;
    const section = page && page.getSection ? page.getSection("product_description") : null;
    return section && Array.isArray(section.items) ? section.items[0] : null;
  }

  function getBackendDescription() {
    const item = getDescriptionItem();
    if (!item) return null;

    if (item.html_content) return { type: "html", value: item.html_content };

    const blocks = Array.isArray(item.blocks) ? item.blocks : [];
    const external = blocks.find(block => block && block.type === "external_html" && block.src);
    if (external) return { type: "url", value: external.src };

    return null;
  }

  function getFallbackUrl() {
    const page = window.FSPORT_PRODUCT_PAGE;
    const section = page && page.getSection ? page.getSection("product_description") : null;
    return (section && section.settings && section.settings.fallbackSrc) ||
      container.getAttribute("data-src") ||
      "";
  }

  function loadHtml() {
    const runtimeConfig = window.FSPORT_PRODUCT_PAGE && window.FSPORT_PRODUCT_PAGE.getConfig
      ? window.FSPORT_PRODUCT_PAGE.getConfig()
      : null;
    const runtimeSection = window.FSPORT_PRODUCT_PAGE && window.FSPORT_PRODUCT_PAGE.getSection
      ? window.FSPORT_PRODUCT_PAGE.getSection("product_description")
      : null;
    if (runtimeConfig && (!runtimeSection || runtimeSection.active === false)) {
      container.innerHTML = "";
      return Promise.resolve("");
    }
    const backendDescription = getBackendDescription();
    if (backendDescription && backendDescription.type === "html") {
      return Promise.resolve(backendDescription.value);
    }

    const url = backendDescription && backendDescription.type === "url"
      ? backendDescription.value
      : getFallbackUrl();

    if (!url) {
      if (runtimeConfig) return Promise.resolve("");
      return Promise.reject(new Error("Missing product description source"));
    }
    return fetch(url).then(res => {
      if (!res.ok) throw new Error("Cannot load product description: " + res.status);
      return res.text();
    });
  }

  function setupToggle() {
    const toggleBtn = container.querySelector("#toggleDesc");
    const descFull = container.querySelector("#descFull");
    const descFade = container.querySelector("#descFade");
    const descMedia = container.querySelector("#descContainer");

    if (!toggleBtn || !descFull || !descFade) return;

    const expandLabel = toggleBtn.dataset.expandLabel || "XEM THÊM MÔ TẢ";
    const collapseLabel = toggleBtn.dataset.collapseLabel || "ẨN BỚT MÔ TẢ";
    const description = getDescriptionItem() || {};
    const configuredPreview = parseFloat(description.preview_images);
    const previewImages = Number.isFinite(configuredPreview)
      ? configuredPreview
      : (descMedia ? parseFloat(descMedia.dataset.previewImages || "") : NaN);
    const useMediaPreview = descMedia && Number.isFinite(previewImages) && previewImages > 0;
    let mediaPreviewExpanded = false;

    function applyMediaPreview() {
      if (!useMediaPreview || mediaPreviewExpanded) return;

      const images = Array.from(descMedia.querySelectorAll("img"));
      if (!images.length) return;

      const style = window.getComputedStyle(descMedia);
      const gap = parseFloat(style.rowGap || style.gap || "0") || 0;
      let remaining = previewImages;
      let height = 0;

      for (let i = 0; i < images.length && remaining > 0; i += 1) {
        const ratio = Math.min(1, remaining);
        const imageHeight = images[i].getBoundingClientRect().height;
        if (!imageHeight) continue;
        if (i > 0) height += gap;
        height += imageHeight * ratio;
        remaining -= ratio;
      }

      if (!height) return;
      descMedia.style.maxHeight = `${height}px`;
      descMedia.style.overflow = "hidden";
    }

    function expandMediaPreview() {
      if (!useMediaPreview) return;
      mediaPreviewExpanded = true;
      descMedia.style.maxHeight = "none";
      descMedia.style.overflow = "visible";
    }

    function trackDescExpand(attempt = 0) {
      if (toggleBtn._tracked) return;
      if (window.fsport && typeof window.fsport.track === "function") {
        toggleBtn._tracked = true;
        window.fsport.track("description_read", {
          product_id: window.productPage || window.productCategory || "",
          product_name: window.productName || "",
          action: "expand"
        });
        return;
      }
      if (attempt < 20) setTimeout(() => trackDescExpand(attempt + 1), 500);
    }

    if (useMediaPreview) {
      applyMediaPreview();
      descMedia.querySelectorAll("img").forEach(img => {
        if (!img.complete) img.addEventListener("load", applyMediaPreview, { once: true });
      });
      window.addEventListener("resize", applyMediaPreview);
    }

    toggleBtn.addEventListener("click", () => {
      const isHidden = descFull.classList.contains("hidden");

      if (isHidden) {
        descFull.classList.remove("hidden");
        expandMediaPreview();
        descFade.style.display = "none";
        toggleBtn.innerHTML = `${collapseLabel} <span class="arrow">&#x25B2;</span>`;
        trackDescExpand();
      } else {
        descFull.classList.add("hidden");
        mediaPreviewExpanded = false;
        applyMediaPreview();
        descFade.style.display = "block";
        toggleBtn.innerHTML = `${expandLabel} <span class="arrow">&#x25BC;</span>`;
      }
    });
  }

  function normalizeDescriptionMedia() {
    container.querySelectorAll("img").forEach(img => {
      img.classList.add("desc-img");
      img.removeAttribute("width");
      img.removeAttribute("height");
      img.loading = img.loading || "lazy";
      img.decoding = "async";

      const parent = img.parentElement;
      if (parent && parent.children.length === 1 && !parent.textContent.trim()) {
        parent.classList.add("desc-media-block");
      }
    });
  }

  function ensureDescriptionMedia() {
    const description = getDescriptionItem() || {};
    const previewImages = parseFloat(description.preview_images);
    const toggle = container.querySelector("#toggleDesc");
    if (toggle && description.expand_label) toggle.dataset.expandLabel = description.expand_label;
    if (toggle && description.collapse_label) toggle.dataset.collapseLabel = description.collapse_label;
    const existing = container.querySelector("#descContainer");
    if (existing) {
      if (Number.isFinite(previewImages) && previewImages > 0) {
        existing.dataset.previewImages = String(previewImages);
      }
      return existing;
    }

    const leadingNodes = [];
    let hasImage = false;
    for (const node of Array.from(container.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.trim()) break;
        leadingNodes.push(node);
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (["descFull", "descFade", "toggleDesc"].includes(node.id)) break;
      if (node.textContent.trim()) break;
      if (node.matches("img") || node.querySelector("img")) hasImage = true;
      leadingNodes.push(node);
    }
    if (!hasImage || !leadingNodes.length) return null;

    const media = document.createElement("div");
    media.id = "descContainer";
    media.className = "desc-img-grid";
    if (Number.isFinite(previewImages) && previewImages > 0) {
      media.dataset.previewImages = String(previewImages);
    }
    container.insertBefore(media, leadingNodes[0]);
    leadingNodes.forEach(node => media.appendChild(node));
    return media;
  }

  const ready = window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || Promise.resolve(null);
  ready
    .catch(() => null)
    .then(loadHtml)
    .then(html => {
      container.innerHTML = html;
      normalizeDescriptionMedia();
      ensureDescriptionMedia();
      setupToggle();
    })
    .catch(err => {
      console.error("[ProductDescription] Cannot load product description", err);
    });
});
