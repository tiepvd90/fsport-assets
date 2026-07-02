(function () {
  const category = (window.productCategory || "").toLowerCase();
  const reviewDataKey = String(
    window.reviewDataKey || window.productPage || category
  )
    .trim()
    .toLowerCase();

  if (!reviewDataKey || !/^[a-z0-9_-]+$/.test(reviewDataKey)) {
    console.warn("Không có mã dữ liệu review hợp lệ.");
    return;
  }

  const placeholder = document.getElementById("review-placeholder");
  if (!placeholder || placeholder.dataset.reviewInitialized === "true") return;

  placeholder.dataset.reviewInitialized = "true";
  const container = document.createElement("section");
  container.className = "fs-product-reviews";
  container.innerHTML = `
    <h2 class="fs-product-reviews__title">Review Sản Phẩm</h2>
    <div class="fs-product-reviews__list"></div>
  `;
  placeholder.replaceChildren(container);
  const list = container.querySelector(".fs-product-reviews__list");

  async function fetchAndRenderReviews() {
    try {
      const res = await fetch(`/json/reviewblock/${reviewDataKey}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length < 4) {
        console.error("Không đủ review để hiển thị.");
        return;
      }

      const indices = getUniqueRandomIndices(4, data.length);
      indices.forEach(index => renderReview(data[index]));
    } catch (err) {
      console.error("Lỗi khi tải review JSON:", err);
    }
  }

  function getUniqueRandomIndices(count, max) {
    const set = new Set();
    while (set.size < count) {
      set.add(Math.floor(Math.random() * max));
    }
    return Array.from(set);
  }

  function renderReview(reviewData) {
    const { reviewName, reviewText, reviewImages } = reviewData;
    const item = document.createElement("article");
    item.className = "fs-product-review";
    item.innerHTML = `
      <div class="fs-product-review__header">
        <span class="fs-product-review__name"></span>
      </div>
      <div class="fs-product-review__stars" aria-label="5 trên 5 sao">★★★★★</div>
      <div class="fs-product-review__text"></div>
      <div class="fs-product-review__images"></div>
    `;

    item.querySelector(".fs-product-review__name").textContent = reviewName || "";
    item.querySelector(".fs-product-review__text").textContent = reviewText || "";

    const images = item.querySelector(".fs-product-review__images");
    (reviewImages || []).forEach(url => {
      const image = document.createElement("img");
      image.src = url;
      image.alt = "Ảnh review";
      image.className = "fs-product-review__image";
      image.loading = "lazy";
      images.appendChild(image);
    });

    list.appendChild(item);
  }

  fetchAndRenderReviews();
})();
