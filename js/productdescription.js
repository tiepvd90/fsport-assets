document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("productdescription-placeholder");
  if (!container) {
    console.warn("⚠️ Không tìm thấy #productdescription-placeholder trong DOM.");
    return;
  }

  const url = container.getAttribute("data-src");
  if (!url) {
    console.warn("⚠️ Thiếu thuộc tính data-src trên #productdescription-placeholder.");
    return;
  }

  console.log("📦 Bắt đầu fetch mô tả sản phẩm từ:", url);

  fetch(url)
    .then(res => {
      console.log("📥 Phản hồi fetch:", res.status, res.ok);
      if (!res.ok) throw new Error("Không tải được mô tả: " + res.status);
      return res.text();
    })
    .then(html => {
      console.log("✅ Thành công, đang chèn HTML mô tả...");
      container.innerHTML = html;

      // ✅ Kích hoạt nút Xem thêm sau khi HTML được render
      const toggleBtn = container.querySelector("#toggleDesc");
      const descFull = container.querySelector("#descFull");
      const descFade = container.querySelector("#descFade");
      const descMedia = container.querySelector("#descContainer");

      if (!toggleBtn || !descFull || !descFade) return;

      const previewImages = descMedia ? parseFloat(descMedia.dataset.previewImages || "") : NaN;
      const useMediaPreview = descMedia && Number.isFinite(previewImages) && previewImages > 0;
      let mediaPreviewExpanded = false;

      function applyMediaPreview() {
        if (!useMediaPreview) return;
        if (mediaPreviewExpanded) return;

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

      if (useMediaPreview) {
        applyMediaPreview();
        descMedia.querySelectorAll("img").forEach(img => {
          if (!img.complete) img.addEventListener("load", applyMediaPreview, { once: true });
        });
        window.addEventListener("resize", applyMediaPreview);
      }

      function trackDescExpand(attempt = 0) {
        if (toggleBtn._tracked) return;

        if (window.fsport && typeof window.fsport.track === "function") {
          toggleBtn._tracked = true;
          window.fsport.track('description_read', {
            product_id:   window.productPage || window.productCategory || '',
            product_name: window.productName || '',
            action:       'expand'
          });
          return;
        }

        if (attempt < 20) {
          setTimeout(() => trackDescExpand(attempt + 1), 500);
        }
      }

      toggleBtn.addEventListener("click", () => {
        const isHidden = descFull.classList.contains("hidden");

        if (isHidden) {
          descFull.classList.remove("hidden");
          expandMediaPreview();
          descFade.style.display = "none";
          toggleBtn.innerHTML = `Thu Gọn <span class="arrow">&#x25B2;</span>`;
          // Track expand (chỉ 1 lần)
          trackDescExpand();
        } else {
          descFull.classList.add("hidden");
          mediaPreviewExpanded = false;
          applyMediaPreview();
          descFade.style.display = "block";
          toggleBtn.innerHTML = `Xem Thêm <span class="arrow">&#x25BC;</span>`;
        }
      });
    })
    .catch(err => {
      console.error("❌ Lỗi khi fetch mô tả sản phẩm:", err);
    });
});
