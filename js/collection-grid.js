/* ==========================================================
   📦 COLLECTION GRID — Render 4 nhóm sản phẩm
   ----------------------------------------------------------
   - Đọc 4 file JSON
   - Nếu không tìm thấy JSON → chỉ log lỗi, bỏ qua block
   - Hiển thị grid 2–3–6 cột theo CSS art.css
   - Item: ảnh + title rút gọn + giá (nếu price > 0)
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

  // Render các block
  async function renderCollections() {
    for (const block of COLLECTIONS) {
      try {
        const res = await fetch(block.json);

        // Nếu file JSON không tồn tại → bỏ qua block này
        if (!res.ok) {
          console.warn("⚠️ Không tìm thấy JSON:", block.json);
          continue;
        }

        const data = await res.json();

        // Tạo block
        const blockEl = document.createElement("div");
        blockEl.className = "collection-block";

        blockEl.innerHTML = `
          <div class="collection-title">${block.title}</div>
          <div class="art-grid"></div>
        `;

        const grid = blockEl.querySelector(".art-grid");

        // Render từng item
        data.forEach(item => {
          const hasPrice = item.price && item.price > 0;

          const priceHTML = hasPrice
            ? `<div class="art-price">${formatPrice(item.price)}</div>`
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

          // Click mở product page
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
