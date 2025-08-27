(function () {
  const PAGE = (window.productPage || "").toLowerCase();
  const LOAI = (window.productCategory || "art").toLowerCase();
  const CONTAINER_ID = "lazySlideshow";
  const COUNTER_ID = "slideCounter";
  const ORIGIN = location.origin.replace("http://", "https://");

  const IMAGE_CONFIG = {
    zen: { count: 10, format: "jpg" },
    // thêm cấu hình khác nếu cần
  };

  const config = IMAGE_CONFIG[PAGE] || { count: 5, format: "jpg" };
  const TOTAL_IMAGES = config.count;
  const FORMAT = config.format;
  const BASE_PATH = `${ORIGIN}/assets/images/gallery/${LOAI}/${PAGE}`;

  const container = document.getElementById(CONTAINER_ID);
  const counterEl = document.getElementById(COUNTER_ID);
  if (!container || !counterEl) return;

  let current = 0;
  const slides = [];

  // IntersectionObserver for lazy load
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
  }, {
    root: null,
    rootMargin: "300px 0px",
    threshold: 0.01,
  });

  // Tạo và gắn tất cả ảnh 1 → N
  for (let i = 1; i <= TOTAL_IMAGES; i++) {
    const img = document.createElement("img");
    img.className = "slide";
    img.alt = `${PAGE} - ${i}`;
    img.decoding = "async";
    img.loading = i === 1 ? "eager" : "lazy";

    if (i === 1) {
      img.classList.add("show");
      img.src = `${BASE_PATH}/${i}.${FORMAT}`;
    } else {
      img.dataset.src = `${BASE_PATH}/${i}.${FORMAT}`;
      io.observe(img);
    }

    container.insertBefore(img, counterEl); // gắn trước counter
    slides.push(img);
  }

  updateCounter();

  // Auto slideshow
  let interval = setInterval(nextSlide, 4000);

  function nextSlide() {
    slides[current].classList.remove("show");
    current = (current + 1) % TOTAL_IMAGES;
    slides[current].classList.add("show");
    updateCounter();
  }

  function prevSlide() {
    slides[current].classList.remove("show");
    current = (current - 1 + TOTAL_IMAGES) % TOTAL_IMAGES;
    slides[current].classList.add("show");
    updateCounter();
  }

  function updateCounter() {
    counterEl.textContent = `${current + 1}/${TOTAL_IMAGES}`;
  }

  // Swipe support (touch & mouse)
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
  // ✅ Zoom tại chỗ + nút đóng "×"
const zoomBtn = document.getElementById("zoomCloseBtn");

container.addEventListener("click", (e) => {
  // Click vào ảnh hiện tại => toggle zoom
  const currentSlide = slides[current];
  if (!currentSlide.classList.contains("show")) return;

  const isZoomed = currentSlide.classList.toggle("zoomed");
  if (isZoomed) {
    zoomBtn.classList.add("show");
  } else {
    zoomBtn.classList.remove("show");
  }
});

// ✅ Nút đóng zoom
zoomBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // không lan sang container click
  const currentSlide = slides[current];
  currentSlide.classList.remove("zoomed");
  zoomBtn.classList.remove("show");
});

})();
