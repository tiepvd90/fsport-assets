/* =========================================
 *  GALLERY đa cấu hình (page map)
 *  - Mỗi page có: count + format
 *  - Fallback: 5 ảnh .jpg
 *  - Ép dùng HTTPS/đường dẫn tuyệt đối từ origin
 *  - Lazy load + Zoom prev/next
 * ========================================= */

const PAGE = (window.productPage || "").toLowerCase();   // ví dụ: "zen"
const LOAI = (window.loai || "art").toLowerCase();       // ví dụ: "art"
const CONTAINER_ID = "lazySlideshow";
const ORIGIN = location.origin.replace("http://", "https://");

// Khai báo map cấu hình tại đây
const IMAGE_CONFIG = {
  zen:    { count: 8, format: "jpg" },
  // ví dụ sau này:
  // dragon: { count: 15, format: "webp" },
};

// Fallback nếu không có trong map
const TOTAL_IMAGES = IMAGE_CONFIG[PAGE]?.count  || 5;
const IMAGE_FORMAT = IMAGE_CONFIG[PAGE]?.format || "jpg";

// Base path: luôn dùng https cùng origin để tránh mixed content
const BASE_PATH = `${ORIGIN}/assets/images/gallery/${LOAI}/${PAGE}`;

(function initGallery() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) {
    console.warn(`❌ Không tìm thấy #${CONTAINER_ID}`);
    return;
  }

  // Kiểm tra nhanh ảnh đầu tiên: nếu 404 → log chỉ đường
  const testImg = new Image();
  testImg.onload = () => renderAll();
  testImg.onerror = () => {
    console.warn(`⚠️ Không tìm thấy ảnh đầu: ${BASE_PATH}/1.${IMAGE_FORMAT}`);
    renderAll(); // vẫn render để bạn nhìn đường dẫn cụ thể trên network
  };
  testImg.src = `${BASE_PATH}/1.${IMAGE_FORMAT}`;

  function renderAll() {
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
  }
})();

/* ========== ZOOM OVERLAY ========== */
function ensureZoomOverlay() {
  if (document.getElementById("imageZoomOverlay")) return;

  const style = document.createElement("style");
  style.textContent = `
    #imageZoomOverlay { position: fixed; inset: 0; background: rgba(0,0,0,.9);
      display: none; align-items: center; justify-content: center; z-index: 9999; }
    #imageZoomOverlay.show { display: flex; }
    #zoomImg { max-width: 90vw; max-height: 90vh; object-fit: contain;
      box-shadow: 0 8px 30px rgba(0,0,0,.6); border-radius: 8px; cursor: zoom-out; }
    .zoom-btn { position: absolute; top: 50%; transform: translateY(-50%);
      font-size: 28px; font-weight: 700; padding: 12px 14px; background: rgba(255,255,255,.15);
      color: #fff; border: 0; border-radius: 10px; cursor: pointer; }
    .zoom-prev { left: 16px; } .zoom-next { right: 16px; }
    .zoom-close { position: absolute; top: 14px; right: 14px; font-size: 24px; font-weight: 700;
      padding: 10px 12px; background: rgba(255,255,255,.15); color: #fff; border: 0; border-radius: 10px; cursor: pointer; }
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
  overlay.querySelector(".zoom-prev").addEventListener("click", (e) => { e.stopPropagation(); stepZoom(-1); });
  overlay.querySelector(".zoom-next").addEventListener("click", (e) => { e.stopPropagation(); stepZoom(1); });
  document.addEventListener("keydown", (e) => {
    const open = overlay.classList.contains("show");
    if (!open) return;
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
  const PAGE = (window.productPage || "").toLowerCase();
  const LOAI = (window.loai || "art").toLowerCase();
  const cfg = IMAGE_CONFIG[PAGE] || { count: 5, format: "jpg" };
  img.src = `${ORIGIN}/assets/images/gallery/${LOAI}/${PAGE}/${_zoomIndex}.${cfg.format}`;
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeZoom() {
  document.getElementById("imageZoomOverlay").classList.remove("show");
  document.getElementById("zoomImg").src = "";
  document.body.style.overflow = "";
}
function stepZoom(dir) {
  const PAGE = (window.productPage || "").toLowerCase();
  const cfg = IMAGE_CONFIG[PAGE] || { count: 5, format: "jpg" };
  const LOAI = (window.loai || "art").toLowerCase();
  _zoomIndex += dir;
  if (_zoomIndex < 1) _zoomIndex = cfg.count;
  if (_zoomIndex > cfg.count) _zoomIndex = 1;
  document.getElementById("zoomImg").src =
    `${ORIGIN}/assets/images/gallery/${LOAI}/${PAGE}/${_zoomIndex}.${cfg.format}`;
}
