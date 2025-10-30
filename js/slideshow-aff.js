/* ======================================================
 * 🖼️ SLIDESHOW-AFF — Hiển thị ảnh từ mảng window.affImages
 * Sử dụng cho trang affiliate (aff)
 * ====================================================== */

(function () {
  const CONTAINER_ID = "lazySlideshow";
  const COUNTER_ID = "slideCounter";

  const container = document.getElementById(CONTAINER_ID);
  const counterEl = document.getElementById(COUNTER_ID);
  if (!container || !counterEl) return;

  // ✅ Nhận mảng ảnh từ trang product-aff
  const imageList = window.affImages || [];

  if (!imageList.length) {
    console.warn("⚠️ Không có ảnh nào trong window.affImages");
    return;
  }

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

  // ===== Tạo và gắn ảnh =====
  imageList.forEach((src, i) => {
    const img = document.createElement("img");
    img.className = "slide";
    img.alt = `Ảnh ${i + 1}`;
    img.decoding = "async";
    img.loading = i === 0 ? "eager" : "lazy";

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

  // ===== Zoom toàn màn hình =====
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

  // ===== Kéo ảnh trong chế độ zoom =====
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
})();
