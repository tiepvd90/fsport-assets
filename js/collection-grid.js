/* ==========================================================
   📦 COLLECTION GRID — READ FROM window.collectionList
   ----------------------------------------------------------
   - Không chứa COLLECTIONS cứng trong file JS
   - Trang HTML tự khai báo window.collectionList = [...]
   - JS chỉ đọc và render
   ========================================================== */

(function () {
  "use strict";

  const COLLECTIONS = window.collectionList || [];

  if (!Array.isArray(COLLECTIONS) || COLLECTIONS.length === 0) {
    console.warn("⚠️ Không có window.collectionList trong trang HTML");
    return;
  }

  const container = document.getElementById("collectionContainer");
  if (!container) {
    console.warn("❌ Không tìm thấy #collectionContainer");
    return;
  }

  // Format tiền
  function formatPrice(v) {
    return v.toLocaleString("vi-VN") + "đ";
  }

  // Tách Shopee tag trong title → chuyển thành badge cam
  function renderTitle(rawTitle) {
    if (rawTitle.includes("| SHOPEE PRODUCT")) {
      const name = rawTitle.split("|")[0].trim();
      return `${name} <span class="tag-shopee">Shopee Product</span>`;
    }
    return rawTitle;
  }

  // Render từng block
  async function renderCollections() {
    for (const block of COLLECTIONS) {
      try {
        const res = await fetch(block.json);

        if (!res.ok) {
          console.warn("⚠️ Không tìm thấy JSON:", block.json);
          continue;
        }

        const data = await res.json();

        const blockEl = document.createElement("div");
        blockEl.className = "collection-block";

        blockEl.innerHTML = `
          <div class="collection-title">${renderTitle(block.title)}</div>
          <div class="art-grid"></div>
        `;

        const grid = blockEl.querySelector(".art-grid");

        data.forEach(item => {
          const hasPrice = item.price && item.price > 0;
          const hasOriginal = item.originalPrice && item.originalPrice > item.price;

          const priceHTML = hasPrice
            ? `
              <div class="art-price-wrap">
                <div class="art-price">${formatPrice(item.price)}</div>
                ${hasOriginal ? `<div class="art-original-price">${formatPrice(item.originalPrice)}</div>` : ""}
              </div>
            `
            : "";

          const card = document.createElement("div");
          card.className = "art-card";

          card.innerHTML = `
            <div class="art-item">
              <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="art-title">${item.title}</div>
            ${priceHTML}
          `;

          card.addEventListener("click", () => {
            window.location.href = item.link;
          });

          grid.appendChild(card);
        });

        container.appendChild(blockEl);

      } catch (err) {
        console.error("❌ Lỗi load JSON:", block.json, err);
      }
    }
  }

  renderCollections();
})();
