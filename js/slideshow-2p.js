<script>
/* ===========================
 *  GALLERY đa cấu hình (map)
 *  - Mỗi page khai báo total + format
 *  - Ví dụ: zen: {count:10, format:"jpg"}
 *           dragon: {count:15, format:"webp"}
 *  - Fallback = 5 ảnh jpg
 * ===========================
 */

const PAGE = (window.productPage || "").toLowerCase();
const LOAI = (window.loai || "").toLowerCase(); // thư mục cha
const CONTAINER_ID = "lazySlideshow";

// Map cấu hình từng page
const IMAGE_CONFIG = {
  zen:    { count: 8, format: "jpg" },
  dragon: { count: 15, format: "webp" },
  // thêm page khác ở đây...
};

// Nếu page không khai báo thì fallback
const TOTAL_IMAGES = IMAGE_CONFIG[PAGE]?.count || 5;
const IMAGE_FORMAT = IMAGE_CONFIG[PAGE]?.format || "jpg";

const BASE_PATH = `/assets/images/gallery/${LOAI}/${PAGE}`;

(function initGallery() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) {
    console.warn(`❌ Không tìm thấy #${CONTAINER_ID}`);
    return;
  }

  ensureZoomOverlay();

  const io = new IntersectionObserver(onIntersect, {
    root: null,
    rootMargin: "300px 0px",
    threshold: 0.01,
  });

  for (let i = 1; i <= TOTAL_IMAGES; i++) {
    const img = document.createElement("img");
    img.className = "gallery-img";
    img.alt = `${PAGE} - ${i}`;
    img.decoding = "async";

    if (i === 1) {
      img.loading = "eager";
      img.src = `${BASE_PATH}/${i}.${IMAGE_FORMAT}`;
      img.decode?.().catch(() => {});
    } else {
      img.loading = "lazy";
      img.dataset.src = `${BASE_PATH}/${i}.${IMAGE_FORMAT}`;
      io.observe(img);
    }

    img.addEventListener("click", () => openZoom(i));
    container.appendChild(img);
  }

  function onIntersect(entries) {
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
  }
})();

/** ====== ZOOM OVERLAY ====== */
function ensureZoomOverlay() {
  if (document.getElementById("imageZoomOverlay")) return;

  const style = document.createElement("style");
  style.textContent = `
    #imageZoomOverlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.9);
      display: none; align-items: center; justify-content: center;
      z-index: 9999;
    }
    #imageZoomOverlay.show { display: flex; }
    #zoomImg {
      max-width: 90vw; max-height: 90vh; object-fit: contain;
      box-shadow: 0 8px 30px rgba(0,0,0,.6);
      border-radius: 8px; cursor: zoom-out;
    }
    .zoom-btn {
      position: absolute; top: 50%; transform: translateY(-50%);
      font-size: 28px; font-weight: 700; padding: 12px 14px;
      background: rgba(255,255,255,.15); color: #fff;
      border: 0; border-radius: 10px; cursor: pointer;
    }
    .zoom-prev { left: 16px; }
    .zoom-next { right: 16px; }
    .zoom-close {
      position: absolute; top: 14px; right: 14px;
      font-size: 24px; font-weight: 700; padding: 10px 12px;
      background: rgba(255,255,255,.15); color: #fff;
      border: 0; border-radius: 10px; cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "imageZoomOverlay";
  overlay.innerHTML = `
    <button class="zoom-close">✕</button>
    <button class="zoom-btn zoom-prev">‹</button>
    <img id="zoomImg" alt="zoom">
    <button class="zoom-btn zoom-next">›</button>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target.id === "imageZoomOverlay" || e.target.classList.contains("zoom-close") || e.target.id === "zoomImg") {
      closeZoom();
    }
  });
  overlay.querySelector(".zoom-prev").addEventListener("click", (e) => {
    e.stopPropagation(); stepZoom(-1);
  });
  overlay.querySelector(".zoom-next").addEventListener("click", (e) => {
    e.stopPropagation(); stepZoom(1);
  });
  document.addEventListener("keydown", (e) => {
    const isOpen = document.getElementById("imageZoomOverlay").classList.contains("show");
    if (!isOpen) return;
    if (e.key === "Escape") closeZoom();
    if (e.key === "ArrowLeft") stepZoom(-1);
    if (e.key === "ArrowRight") stepZoom(1);
  });
}

let _zoomIndex = 1;

function openZoom(index) {
  _zoomIndex = index;
  const overlay = document.getElementById("imageZoomOverlay");
  const img = document.getElementById("zoomImg");
  img.src = `${BASE_PATH}/${_zoomIndex}.${IMAGE_FORMAT}`;
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeZoom() {
  const overlay = document.getElementById("imageZoomOverlay");
  overlay.classList.remove("show");
  document.getElementById("zoomImg").src = "";
  document.body.style.overflow = "";
}

function stepZoom(dir) {
  _zoomIndex += dir;
  if (_zoomIndex < 1) _zoomIndex = TOTAL_IMAGES;
  if (_zoomIndex > TOTAL_IMAGES) _zoomIndex = 1;
  const img = document.getElementById("zoomImg");
  img.src = `${BASE_PATH}/${_zoomIndex}.${IMAGE_FORMAT}`;
}
</script>
