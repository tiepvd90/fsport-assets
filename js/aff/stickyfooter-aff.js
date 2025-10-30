/* ======================================================
 * 🖼️ SLIDESHOW-AFF — Tự sinh HTML + render từ window.affImages
 * Dành cho trang Affiliate (AFF)
 * Tự động gọi đến /css/slideshow.css
 * ====================================================== */

(function () {
  // ====== Nhận dữ liệu ảnh ======
  const imageList = window.affImages || [];
  if (!imageList.length) {
    console.warn("⚠️ Không tìm thấy window.affImages");
    return;
  }

  // ====== Gọi CSS ngoài nếu chưa có ======
  if (!document.querySelector('link[href*="/css/slideshow.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/slideshow.css";
    document.head.appendChild(link);
  }

  // ====== Tạo HTML khung slideshow ======
  const html = `
    <div class="lazy-slideshow" id="lazySlideshow">
      <div class="slide-counter" id="slideCounter">1/${imageList.length}</div>
    </div>
    <div id="fullscreenZoom" style="display: none;">
      <div id="zoomWrapper">
        <img id="zoomedImg" src="" alt="Zoomed" />
        <button id="zoomCloseBtn">×</button>
      </div>
    </div>
  `;
  document.write(html); // inject trực tiếp vào DOM (nhanh gọn cho trang aff)

  // ====== Khi DOM đã sẵn sàng ======
  window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("lazySlideshow");
    const counterEl = document.getElementById("slideCounter");
    if (!container || !counterEl) return;

    let current = 0;
    const slides = [];

    // ===== Lazy load ảnh =====
    const io = new IntersectionObserver(
      (entries) => {
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
      },
      { rootMargin: "300px 0px", threshold: 0.01 }
    );

    // ===== Gắn ảnh =====
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

    updateCounter();

    // ===== Auto slideshow =====
    let interval = setInterval(nextSlide, 4000);

    function nextSlide() {
      slides[current].classList.remove("show");
      current = (current + 1) % slides.length;
      slides[current].classList.add("show");
      updateCounter();
    }

    function prevSlide() {
      slides[current].classList.remove("show");
      current = (current - 1 + slides.length) % slides.length;
      slides[current].classList.add("show");
      updateCounter();
    }

    function updateCounter() {
      counterEl.textContent = `${current + 1}/${slides.length}`;
    }

    // ===== Swipe support =====
    let startX = 0;
    let isDragging = false;

    container.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    container.addEventListener("touchend", (e) => {
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 50) {
        clearInterval(interval);
        delta < 0 ? nextSlide() : prevSlide();
        interval = setInterval(nextSlide, 4000);
      }
    });

    container.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
    });

    document.addEventListener("mouseup", (e) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      if (Math.abs(delta) > 50) {
        clearInterval(interval);
        delta < 0 ? nextSlide() : prevSlide();
        interval = setInterval(nextSlide, 4000);
      }
      isDragging = false;
    });

    // ===== Zoom overlay =====
    const zoomOverlay = document.getElementById("fullscreenZoom");
    const zoomImg = document.getElementById("zoomedImg");
    const zoomClose = document.getElementById("zoomCloseBtn");

    container.addEventListener("click", () => {
      const currentSlide = slides[current];
      zoomImg.src = currentSlide.src;
      zoomOverlay.style.display = "flex";
      zoomImg.style.transform = "translate(0, 0)";
      document.body.style.overflow = "hidden";
    });

    zoomClose.addEventListener("click", closeZoom);
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeZoom());

    function closeZoom() {
      zoomOverlay.style.display = "none";
      zoomImg.src = "";
      document.body.style.overflow = "";
    }

    // ===== Kéo ảnh khi zoom =====
    let isDraggingZoom = false;
    let startXZoom = 0;
    let startYZoom = 0;
    let originX = 0;
    let originY = 0;

    zoomImg.onmousedown = (e) => {
      isDraggingZoom = true;
      startXZoom = e.clientX;
      startYZoom = e.clientY;
      zoomImg.style.cursor = "grabbing";
      e.preventDefault();
    };

    document.onmouseup = () => {
      isDraggingZoom = false;
      zoomImg.style.cursor = "grab";
      originX = getTranslate(zoomImg).x;
      originY = getTranslate(zoomImg).y;
    };

    document.onmousemove = (e) => {
      if (!isDraggingZoom) return;
      const dx = e.clientX - startXZoom;
      const dy = e.clientY - startYZoom;
      zoomImg.style.transform = `translate(${originX + dx}px, ${originY + dy}px)`;
    };

    function getTranslate(el) {
      const style = window.getComputedStyle(el);
      const matrix = new DOMMatrixReadOnly(style.transform);
      return { x: matrix.m41, y: matrix.m42 };
    }
  });
})();
