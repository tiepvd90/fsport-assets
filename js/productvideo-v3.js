(function () {

let videoList = [];
let rendered = 0;
const batchSize = 6;

/* ===== LẤY VIDEO ID ===== */

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


/* ===== HTML TEMPLATE ===== */

function injectHTML(container) {

container.innerHTML = `

<div class="product-video-section">

  <h3 class="product-video-heading">
    VIDEO THỰC TẾ SẢN PHẨM
  </h3>

  <div class="video-grid" id="videoGrid"></div>

  <div class="video-load-more" id="videoLoadMoreWrap">
    <button class="video-load-more-btn" id="videoLoadMoreBtn">
      ▶ Xem thêm video
    </button>
  </div>

</div>

<div id="videoPopup">

  <div class="popup-video-frame">

    <div class="popup-header">
      <button class="popup-buy" id="popupBuy">MUA NGAY</button>
      <button class="popup-close" id="popupClose">ĐÓNG</button>
    </div>

    <iframe id="popupIframe"
      allow="autoplay; encrypted-media"
      allowfullscreen>
    </iframe>

  </div>

</div>

`;

}


/* ===== RENDER VIDEO ===== */

function renderBatch() {

const grid = document.getElementById("videoGrid");

const next = videoList.slice(rendered, rendered + batchSize);

next.forEach((item, index) => {

  const { url, title = "" } =
    typeof item === "string" ? { url: item, title: "" } : item;

  const id = getYoutubeId(url);
  if (!id) return;

  const card = document.createElement("div");
  card.className = "video-card";

  /* ===== VIDEO ĐẦU AUTOPLAY ===== */

  if (rendered === 0 && index === 0) {

    card.classList.add("is-live");

    card.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${id}"
        allow="autoplay; encrypted-media"
        allowfullscreen>
      </iframe>

      <div class="video-title-overlay">
        ${title}
      </div>
    `;

  } else {

    const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

    card.classList.add("is-thumb");

    card.innerHTML = `
      <img src="${thumb}" loading="lazy">

      <div class="video-title-overlay">
        ${title}
      </div>
    `;

    card.onclick = () => openPopup(id);

  }

  grid.appendChild(card);

});

rendered += next.length;


/* ===== HẾT VIDEO → ẨN NÚT ===== */

if (rendered >= videoList.length) {

  const wrap = document.getElementById("videoLoadMoreWrap");
  if (wrap) wrap.hidden = true;

}

}


/* ===== POPUP VIDEO ===== */

function openPopup(id) {

const popup = document.getElementById("videoPopup");
const iframe = document.getElementById("popupIframe");

iframe.src =
  `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;

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


/* ===== ADD TO CART ===== */

function addToCart() {

const btn = document.getElementById("btn-atc");

if (btn) btn.click();
else console.warn("Không tìm thấy btn-atc");

}


/* ===== INIT ===== */

window.initProductVideo = function () {

const container = document.getElementById("video-placeholder");

if (!container) {
  console.warn("Không tìm thấy video-placeholder");
  return;
}

injectHTML(container);


/* ===== LOAD JSON ===== */

const productPage = window.productPage || "default";

fetch("/json/productvideo.json")
  .then(res => res.json())
  .then(data => {

    const list = data[productPage];

    if (!Array.isArray(list)) {
      console.warn("Không có video cho", productPage);
      return;
    }

    videoList = list;

    renderBatch();


    /* ===== LOAD MORE ===== */

    const loadBtn =
      document.getElementById("videoLoadMoreBtn");

    if (loadBtn) {
      loadBtn.onclick = renderBatch;
    }


    /* ===== POPUP BUTTON ===== */

    const closeBtn =
      document.getElementById("popupClose");

    if (closeBtn) {
      closeBtn.onclick = closePopup;
    }

    const buyBtn =
      document.getElementById("popupBuy");

    if (buyBtn) {

      buyBtn.onclick = () => {

        closePopup();
        addToCart();

      };

    }

  })
  .catch(err =>
    console.error("Lỗi tải productvideo.json", err)
  );

};

})();
