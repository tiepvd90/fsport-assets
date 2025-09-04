(function () {
  const PAGE = (window.productPage || "").toLowerCase();
  const LOAI = (window.productCategory || "art").toLowerCase();
  const CONTAINER_ID = "lazySlideshow";
  const COUNTER_ID = "slideCounter";
  const ORIGIN = location.origin.replace("http://", "https://");

  // Config mặc định theo từng PAGE
  const IMAGE_CONFIG = {
    zen: { count: 10, format: "jpg" },
    girl: { count: 6, format: "jpg" },
    zen2: { count: 9, format: "jpg" },
    goku: { count: 7, format: "jpg" }, // chỉ giữ 1 key goku
    zen4: { count: 6, format: "jpg" },
    monk: { count: 7, format: "jpg" },
    blossom: { count: 7, format: "webp" },
    // thêm cấu hình khác nếu cần
  };

  // Ưu tiên lấy từ trang sản phẩm (window.imageCount, window.imageFormat)
  const config = {
    count: window.imageCount || (IMAGE_CONFIG[PAGE]?.count ?? 5),
    format: window.imageFormat || (IMAGE_CONFIG[PAGE]?.format ?? "jpg"),
  };

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

  // Tạo và gắn ảnh 1 → N
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

    container.insertBefore(img, counterEl);
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

  // Swipe support
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

  // ✅ Zoom toàn màn hình khi click
  const zoomOverlay = document.getElementById("fullscreenZoom");
  const zoomImg = document.getElementById("zoomedImg");
  const zoomClose = document.getElementById("zoomCloseBtn");

  container.addEventListener("click", () => {
    const currentSlide = slides[current];
    if (!currentSlide.classList.contains("show")) return;

    zoomImg.src = currentSlide.src;
    zoomOverlay.style.display = "flex";
    zoomImg.style.transform = "translate(0, 0)";
    originX = 0;
    originY = 0;
    document.body.style.overflow = "hidden";
  });

  zoomClose.addEventListener("click", () => {
    zoomOverlay.style.display = "none";
    zoomImg.src = "";
    zoomImg.style.transform = "translate(0, 0)";
    document.body.style.overflow = "";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && zoomOverlay.style.display === "flex") {
      zoomOverlay.style.display = "none";
      zoomImg.src = "";
      zoomImg.style.transform = "translate(0, 0)";
      document.body.style.overflow = "";
    }
  });

  // ✅ Kéo ảnh trong chế độ zoom
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

  // Helper: lấy giá trị transform hiện tại
  function getTranslate(el) {
    const style = window.getComputedStyle(el);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return { x: matrix.m41, y: matrix.m42 };
  }
})();
