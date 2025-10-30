/* ======================================================
 * 🖼️ SLIDESHOW-AFF — render từ window.affImages
 * Dành cho trang Affiliate (AFF)
 * KHÔNG tự gọi CSS (trang product đã có link).
 * ====================================================== */
(function () {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else fn();
  }

  onReady(function () {
    const imageList = Array.isArray(window.affImages) ? window.affImages : [];
    if (!imageList.length) {
      console.warn("⚠️ slideshow-aff: window.affImages trống.");
      return;
    }

    let container = document.getElementById("lazySlideshow");
    let counterEl = document.getElementById("slideCounter");

    if (!container) {
      console.warn("⚠️ slideshow-aff: thiếu khung #lazySlideshow trong HTML.");
      return;
    }

    let current = 0;
    const slides = [];

    // Lazy load
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.src && !el.src) {
          el.src = el.dataset.src;
          el.decode?.().catch(() => {});
          io.unobserve(el);
          delete el.dataset.src;
        }
      });
    }, { rootMargin: "300px 0px", threshold: 0.01 });

    // Thêm ảnh
    imageList.forEach((src, i) => {
      const img = document.createElement("img");
      img.className = "slide";
      img.alt = `Ảnh ${i + 1}`;
      img.decoding = "async";
      img.loading = i === 0 ? "eager" : "lazy";
      img.style.objectFit = "cover";
      if (i === 0) {
        img.classList.add("show");
        img.src = src;
      } else {
        img.dataset.src = src;
        io.observe(img);
      }
      container.insertBefore(img, counterEl);
      slides.push(img);
    });

    function updateCounter() {
      if (counterEl) counterEl.textContent = `${current + 1}/${slides.length}`;
    }
    updateCounter();

    // Auto slide
    let interval = setInterval(nextSlide, 4000);
    function nextSlide() {
      slides[current]?.classList.remove("show");
      current = (current + 1) % slides.length;
      slides[current]?.classList.add("show");
      updateCounter();
    }
    function prevSlide() {
      slides[current]?.classList.remove("show");
      current = (current - 1 + slides.length) % slides.length;
      slides[current]?.classList.add("show");
      updateCounter();
    }

    // Swipe support
    let startX = 0;
    container.addEventListener("touchstart", (e) => startX = e.touches[0].clientX);
    container.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { clearInterval(interval); dx < 0 ? nextSlide() : prevSlide(); interval = setInterval(nextSlide, 4000); }
    });

    // Zoom
    const zoomOverlay = document.getElementById("fullscreenZoom");
    const zoomImg = document.getElementById("zoomedImg");
    const zoomClose = document.getElementById("zoomCloseBtn");

    if (zoomOverlay && zoomImg && zoomClose) {
      container.addEventListener("click", () => {
        zoomImg.src = slides[current].src;
        zoomOverlay.style.display = "flex";
        document.body.style.overflow = "hidden";
      });
      zoomClose.addEventListener("click", closeZoom);
      document.addEventListener("keydown", (e) => e.key === "Escape" && closeZoom());

      function closeZoom() {
        zoomOverlay.style.display = "none";
        zoomImg.src = "";
        document.body.style.overflow = "";
      }
    }
  });
})();
