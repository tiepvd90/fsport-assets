(function () {
  let videoList = [];
  const initialLimit = 6;
  let expanded = false;

  function getYoutubeId(url) {
    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
    ];

    for (let p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }

    return null;
  }

  function autoplayEmbedUrl(id) {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${id}&enablejsapi=1&rel=0`;
  }

  function ensureAutoplay(iframe) {
    if (!iframe || !iframe.contentWindow) return;
    const command = JSON.stringify({
      event: "command",
      func: "playVideo",
      args: []
    });
    const mute = JSON.stringify({
      event: "command",
      func: "mute",
      args: []
    });
    function play() {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage(mute, "https://www.youtube.com");
      iframe.contentWindow.postMessage(command, "https://www.youtube.com");
    }
    iframe.addEventListener("load", function () {
      play();
      window.setTimeout(play, 350);
      window.setTimeout(play, 1200);
    }, { once: true });
  }

  function injectHTML(container) {
    container.innerHTML = `
      <div class="product-video-section">
        <h3 class="product-video-heading">VIDEO THỰC TẾ SẢN PHẨM</h3>

        <div class="video-grid" id="videoGrid"></div>

        <div class="video-load-more" id="videoLoadMoreWrap">
          <button class="video-load-more-btn" id="videoLoadMoreBtn">
            Xem Thêm Video ▼
          </button>
        </div>
      </div>

      <div id="videoPopup">
        <div class="popup-video-frame">
          <div class="popup-header">
            <button class="popup-buy" id="popupBuy">MUA NGAY</button>
            <button class="popup-close" id="popupClose">ĐÓNG</button>
          </div>

          <iframe
            id="popupIframe"
            allow="autoplay; encrypted-media"
            allowfullscreen>
          </iframe>
        </div>
      </div>
    `;
  }

  function openPopup(id) {
    if (typeof window.fsport !== 'undefined') {
      window.fsport.track('review_video', { video_id: id, product_id: window.productPage || null })
    }
    const popup = document.getElementById("videoPopup");
    const iframe = document.getElementById("popupIframe");

    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    popup.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closePopup() {
    const popup = document.getElementById("videoPopup");
    const iframe = document.getElementById("popupIframe");

    iframe.src = "";
    popup.classList.remove("show");
    document.body.style.overflow = "";
  }

  function addToCart() {
    const btn = document.getElementById("btn-atc");
    if (btn) btn.click();
    else console.warn("Không tìm thấy btn-atc");
  }

  function getVisibleList() {
    return expanded ? videoList : videoList.slice(0, initialLimit);
  }

  function updateToggleButton() {
    const wrap = document.getElementById("videoLoadMoreWrap");
    const btn = document.getElementById("videoLoadMoreBtn");

    if (!wrap || !btn) return;

    if (videoList.length <= initialLimit) {
      wrap.hidden = true;
      return;
    }

    wrap.hidden = false;
    btn.textContent = expanded ? "Ẩn Bớt Video ▲" : "Xem Thêm Video ▼";
  }

  function renderVideos() {
    const grid = document.getElementById("videoGrid");
    if (!grid) return;

    const visibleList = getVisibleList();
    grid.innerHTML = "";

    let renderedCount = 0;
    visibleList.forEach((item, index) => {
      const { url, title = "" } =
        typeof item === "string" ? { url: item, title: "" } : item;

      const id = getYoutubeId(url);
      if (!id) return;

      const card = document.createElement("div");
      card.className = "video-card";

      if (renderedCount === 0) {
  card.classList.add("is-live");

  card.innerHTML = `
    <iframe
      src="${autoplayEmbedUrl(id)}"
      title="${title || "Video sản phẩm"}"
      loading="eager"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen>
    </iframe>

    <div class="video-live-overlay" aria-label="Mở video lớn"></div>

    <div class="video-title-overlay">${title}</div>
  `;

  const overlay = card.querySelector(".video-live-overlay");
  ensureAutoplay(card.querySelector("iframe"));
  if (overlay) {
    overlay.onclick = () => openPopup(id);
  }
} else {
        const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

        card.classList.add("is-thumb");
        card.innerHTML = `
          <img src="${thumb}" loading="lazy" alt="${title || "Video sản phẩm"}">
          <div class="video-title-overlay">${title}</div>
        `;

        card.onclick = () => openPopup(id);
      }

      grid.appendChild(card);
      renderedCount += 1;
    });

    updateToggleButton();
  }

  function toggleExpand() {
    expanded = !expanded;
    renderVideos();

    const section = document.querySelector(".product-video-section");
    if (!expanded && section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function getAssignedVideos(productPage) {
    const base = window.FSPORT_SUPABASE_URL;
    const key = window.FSPORT_SUPABASE_ANON;
    if (!base || !key || !productPage) return null;
    const selectionRes = await fetch(`${base}/rest/v1/rpc/get_product_page_videos`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: productPage })
    });
    if (!selectionRes.ok) return null;
    const list = (await selectionRes.json()).map(video => ({ url: video.url, title: video.title || "" }));
    return list.length ? list : null;
  }

  window.initProductVideo = function () {
    const container = document.getElementById("video-placeholder");

    if (!container) {
      console.warn("Không tìm thấy video-placeholder");
      return;
    }

    injectHTML(container);

    const productPage = window.productPage || "default";

    const backendReady = window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || Promise.resolve(null);

    backendReady
      .catch(() => null)
      .then(config => {
        const page = window.FSPORT_PRODUCT_PAGE;
        const section = page && page.getSection ? page.getSection("product_video") : null;
        if (config) {
          if (!section || section.active === false) {
            container.innerHTML = "";
            return [];
          }
          return Array.isArray(section.items) ? section.items : [];
        }
        return getAssignedVideos(productPage).then(assigned => {
          if (assigned) return assigned;
        return fetch("/json/productvideo.json")
          .then(res => res.json())
          .then(data => data[productPage]);
        });
      })
      .then(list => {

        if (!Array.isArray(list)) {
          console.warn("Không có video cho", productPage);
          document.getElementById("videoLoadMoreWrap")?.setAttribute("hidden", "hidden");
          return;
        }

        videoList = list;
        expanded = false;
        renderVideos();

        const toggleBtn = document.getElementById("videoLoadMoreBtn");
        if (toggleBtn) {
          toggleBtn.onclick = toggleExpand;
        }

        const closeBtn = document.getElementById("popupClose");
        if (closeBtn) {
          closeBtn.onclick = closePopup;
        }

        const buyBtn = document.getElementById("popupBuy");
        if (buyBtn) {
          buyBtn.onclick = () => {
            closePopup();
            addToCart();
          };
        }
      })
      .catch(err => {
        console.error("Lỗi tải productvideo.json", err);
      });
  };
})();
