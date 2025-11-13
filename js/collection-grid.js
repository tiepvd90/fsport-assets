/* ==========================================================
   📦 COLLECTION GRID — Bản cập nhật FULL
   ----------------------------------------------------------
   - Đọc 4 file JSON
   - Nếu không tìm thấy JSON → chỉ log lỗi, không render block
   - Render gallery 2–3–6 cột theo art.css
   - Hiển thị giá sale + giá gốc (nếu có)
   - Tách token "| SHOPEE PRODUCT" → thành badge shopee
   ========================================================== */

(function () {
  "use strict";

  const COLLECTIONS = [
    {
      title: "VỢT VÀ BÓNG PICKLEBALL",
      json: "/json/pickleball-collection.json"
    },
    {
      title: "DÉP CHẠY Y-SANDAL ĐÀI LOAN",
      json: "/json/ysandal-collection.json"
    },
    {
      title: "TÚI, BALO PICKLEBALL | SHOPEE PRODUCT",
      json: "/json/aff/bag-collection.json"
    },
    {
      title: "QUẦN ÁO THỂ THAO | SHOPEE PRODUCT",
      json: "/json/aff/apparel-collection.json"
    }
  ];

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
          continue; // bỏ block
        }

        const data = await res.json();

        const blockEl = document.createElement("div");
        blockEl.className = "collection-block";

        blockEl.innerHTML = `
          <div class="collection-title">${renderTitle(block.title)}</div>
          <div class="art-grid"></div>
        `;

        const grid = blockEl.querySelector(".art-grid");

        // Render từng item
        data.forEach(item => {
          const hasPrice = item.price && item.price > 0;
          const hasOriginal =
            item.originalPrice &&
            item.originalPrice > item.price;

          // Giá sale + giá gốc gạch
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
