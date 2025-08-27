(function () {
  const category = (window.productCategory || "").toLowerCase();
  if (!category) {
    console.warn("Không có giá trị productCategory.");
    return;
  }

  // ✅ Inject HTML review vào vị trí placeholder (nếu có), nếu không thì gắn vào cuối body
  const placeholder = document.getElementById("review-placeholder");
  const container = document.createElement("div");
  container.innerHTML = `
    <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">
      Review Sản Phẩm
    </h2>

    <div id="review1" class="review-item"></div>
    <div id="review2" class="review-item"></div>
    <div id="review3" class="review-item"></div>
    <div id="review4" class="review-item"></div>
  `;
  (placeholder || document.body).appendChild(container);

  // ✅ Gọi JSON theo category
  async function fetchAndRenderReviews() {
    try {
      const res = await fetch(`/json/reviewblock/${category}.json`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length < 4) {
        console.error("Không đủ review để hiển thị.");
        return;
      }

      const indices = getUniqueRandomIndices(4, data.length);
      for (let i = 0; i < 4; i++) {
        renderReview(`review${i + 1}`, data[indices[i]]);
      }
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

  function renderReview(containerId, reviewData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { reviewName, reviewText, reviewImages } = reviewData;

    const imagesHTML = (reviewImages || [])
      .map(
        url => `<img src="${url}" alt="Ảnh review" class="review-image">`
      )
      .join("");

    container.innerHTML = `
      <div class="review-header">
        <span class="review-name">${reviewName}</span>
      </div>
      <div class="review-stars">★★★★★</div>
      <div class="review-text">${reviewText}</div>
      <div class="review-images">${imagesHTML}</div>
    `;
  }

  fetchAndRenderReviews();
})();
