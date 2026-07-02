(async function () {
  const PAGE = (window.productPage || "").toLowerCase();
  const LOAI = (window.productCategory || "art").toLowerCase();
  const CONTAINER_ID = "lazySlideshow";
  const COUNTER_ID = "slideCounter";
  // Production already uses HTTPS; local development must keep HTTP.
  const ORIGIN = location.origin;

  // Config mặc định theo từng PAGE
  const IMAGE_CONFIG = {
    zen: { count: 10, format: "jpg" },
    girl: { count: 6, format: "jpg" },
    zen2: { count: 9, format: "jpg" },
    goku: { count: 7, format: "jpg" }, // chỉ giữ 1 key goku
    zen4: { count: 6, format: "jpg" },
    monk: { count: 7, format: "jpg" },
    blossom: { count: 7, format: "webp" },
    chair001: { count: 14, format: "jpg" },
    sup001: { count: 14, format: "jpg" },
    ysandalbn68: { count: 9, format: "jpg" },
    "pickleball-airforce": { count: 9, format: "jpg" },
    ysandal5568: { count: 41, format: "jpg" },
    ysandal5560: { count: 14, format: "jpg" },
    meikan: { count: 9, format: "jpg" },
    // thêm cấu hình khác nếu cần
  };

  // Ưu tiên lấy từ trang sản phẩm (window.imageCount, window.imageFormat)
  const config = {
    count: window.imageCount || (IMAGE_CONFIG[PAGE]?.count ?? 5),
    format: window.imageFormat || (IMAGE_CONFIG[PAGE]?.format ?? "jpg"),
  };

  const FORMAT = config.format;
  const BASE_PATH = `${ORIGIN}/assets/images/gallery/${LOAI}/${PAGE}`;

  const container = document.getElementById(CONTAINER_ID);
  const counterEl = document.getElementById(COUNTER_ID);
  if (!container || !counterEl) return;

  // Paint the known local first image immediately. Previously the slideshow
  // stayed completely empty until the remote admin config request completed.
  const provisionalImage = window.FSPORT_DYNAMIC_PRODUCT_PAGE ? null : document.createElement("img");
  if (provisionalImage) {
    provisionalImage.className = "slide show fsport-provisional-slide";
    provisionalImage.alt = `${PAGE} - 1`;
    provisionalImage.decoding = "async";
    provisionalImage.loading = "eager";
    provisionalImage.fetchPriority = "high";
    provisionalImage.src = `${BASE_PATH}/1.${FORMAT}`;
    provisionalImage.addEventListener("error", () => provisionalImage.remove(), { once: true });
    container.insertBefore(provisionalImage, counterEl);
  }

  async function loadConfiguredImages() {
    const base = window.FSPORT_SUPABASE_URL || "https://xcigbbcpwfzluqazadez.supabase.co";
    const key = window.FSPORT_SUPABASE_ANON || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4";
    try {
      const response = await fetch(`${base}/rest/v1/rpc/get_product_page_slides`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_slug: PAGE }),
      });
      if (!response.ok) return [];
      const rows = await response.json();
      return Array.isArray(rows) ? rows.filter((row) => row.image_url) : [];
    } catch (_) {
      return [];
    }
  }

  const runtimeConfig = await (window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || Promise.resolve(null)).catch(() => null);
  const runtimeSection = runtimeConfig && window.FSPORT_PRODUCT_PAGE
    ? window.FSPORT_PRODUCT_PAGE.getSection("slideshow")
    : null;
  if (runtimeConfig && (!runtimeSection || runtimeSection.active === false)) {
    if (provisionalImage) provisionalImage.remove();
    return;
  }
  const configuredImages = runtimeConfig
    ? (Array.isArray(runtimeSection.items) ? runtimeSection.items : [])
    : await loadConfiguredImages();
  const imageList = configuredImages.length
    ? configuredImages.map((row) => ({ url: row.image_url, alt: row.alt_text || PAGE }))
    : (runtimeConfig ? [] : Array.from({ length: config.count }, (_, index) => ({
        url: `${BASE_PATH}/${index + 1}.${FORMAT}`,
        alt: `${PAGE} - ${index + 1}`,
      })));
  const TOTAL_IMAGES = imageList.length;
  if (!TOTAL_IMAGES) {
    if (provisionalImage) provisionalImage.remove();
    return;
  }

  let current = 0;
  const slides = [];
  if (provisionalImage) provisionalImage.remove();

  // Tạo và gắn ảnh 1 → N
  for (let i = 1; i <= TOTAL_IMAGES; i++) {
    const image = imageList[i - 1];
    const img = document.createElement("img");
    img.className = "slide";
    img.alt = image.alt;
    img.decoding = "async";
    img.loading = i === 1 ? "eager" : "lazy";
    img.fetchPriority = i === 1 ? "high" : "low";

    if (i === 1) {
      img.classList.add("show");
      img.src = image.url;
    } else {
      img.dataset.src = image.url;
    }

    container.insertBefore(img, counterEl);
    slides.push(img);
  }

  window.FSportSlideshowLazyLoader.loadSequentially(slides);

  updateCounter();

  // Auto slideshow
  let interval = setInterval(nextSlide, 4000);

  function nextSlide() {
    slides[current].classList.remove("show");
    current = (current + 1) % TOTAL_IMAGES;
    window.FSportSlideshowLazyLoader.reveal(slides[current]);
    slides[current].classList.add("show");
    updateCounter();
  }

  function prevSlide() {
    slides[current].classList.remove("show");
    current = (current - 1 + TOTAL_IMAGES) % TOTAL_IMAGES;
    window.FSportSlideshowLazyLoader.reveal(slides[current]);
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
      // Track manual swipe
      if (window.fsport) {
        window.fsport.track('slideshow_swipe', {
          product_id:   PAGE,
          product_name: window.productName || PAGE,
          slide_index:  current + 1,
          direction:    delta < 0 ? 'next' : 'prev'
        })
      }
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
      // Track manual swipe (desktop drag)
      if (window.fsport) {
        window.fsport.track('slideshow_swipe', {
          product_id:   PAGE,
          product_name: window.productName || PAGE,
          slide_index:  current + 1,
          direction:    delta < 0 ? 'next' : 'prev'
        })
      }
    }
    isDragging = false;
  });

  // ✅ Zoom toàn màn hình khi click
  const zoomOverlay = document.getElementById("fullscreenZoom");
  const zoomImg = document.getElementById("zoomedImg");
  const zoomClose = document.getElementById("zoomCloseBtn");
  window.FSportSlideshowLazyLoader.bindZoom({
    trigger: container,
    overlay: zoomOverlay,
    zoomImage: zoomImg,
    closeButton: zoomClose,
    getCurrentImage: () => slides[current],
  });

  if (false && zoomOverlay && zoomImg && zoomClose) container.addEventListener("click", () => {
    const currentSlide = slides[current];
    if (!currentSlide.classList.contains("show")) return;

    zoomImg.src = currentSlide.src;
    zoomOverlay.style.display = "flex";
    zoomImg.style.transform = "translate(0, 0)";
    originX = 0;
    originY = 0;
    document.body.style.overflow = "hidden";
  });

  if (zoomOverlay && zoomImg && zoomClose) zoomClose.addEventListener("click", () => {
    zoomOverlay.style.display = "none";
    zoomImg.src = "";
    zoomImg.style.transform = "translate(0, 0)";
    document.body.style.overflow = "";
  });

  if (zoomOverlay && zoomImg) document.addEventListener("keydown", (e) => {
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

  if (zoomImg) zoomImg.onmousedown = (e) => {
    isDraggingZoom = true;
    startXZoom = e.clientX;
    startYZoom = e.clientY;
    zoomImg.style.cursor = "grabbing";
    e.preventDefault();
  };

  document.onmouseup = () => {
    isDraggingZoom = false;
    if (!zoomImg) return;
    zoomImg.style.cursor = "grab";
    originX = getTranslate(zoomImg).x;
    originY = getTranslate(zoomImg).y;
  };

  document.onmousemove = (e) => {
    if (!isDraggingZoom || !zoomImg) return;
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
