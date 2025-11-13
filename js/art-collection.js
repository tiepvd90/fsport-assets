/* ============================================================
   art-collection.js
   — Hiển thị gallery bộ sưu tập tranh từ /json/art/index.json
   — Tự động render vào #collectionContainer
   — Độc lập, tái dùng cho mọi trang
   ============================================================ */

(function () {
  "use strict";

  // Chờ DOM load xong
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('collectionContainer');
    if (!container) {
      console.warn("❌ Không tìm thấy #collectionContainer");
      return;
    }
    loadCollections(container);
  });

  /* --------------------------
     LOAD JSON
  --------------------------- */
  async function loadCollections(container) {
    try {
      const res = await fetch('/json/art/index.json');
      const data = await res.json();
      renderCollections(data, container);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
    }
  }

  /* --------------------------
     RENDER GALLERY
  --------------------------- */
  function renderCollections(data, container) {
    if (!data || !data.collections) return;

    data.collections.forEach(col => {
      const block = document.createElement('div');
      block.className = 'collection-block';

      // Tiêu đề chủ đề
      const title = document.createElement('div');
      title.className = 'collection-title';
      title.textContent = col.title;
      block.appendChild(title);

      // Grid ảnh
      const grid = document.createElement('div');
      grid.className = 'art-grid';

      col.images.forEach(imgObj => {
        const card = document.createElement('div');
        card.className = 'art-card';

        const item = document.createElement('div');
        item.className = 'art-item';

        const img = document.createElement('img');
        img.src = imgObj.image;
        img.alt = col.title;

        item.appendChild(img);
        card.appendChild(item);

        // Click đi đến trang tranh chi tiết
        card.onclick = () => window.location.href = imgObj.slug;

        grid.appendChild(card);
      });

      block.appendChild(grid);

      // Nút xem thêm
      const moreBtn = document.createElement('a');
      moreBtn.className = 'view-more';
      moreBtn.href = col.slug;
      moreBtn.innerHTML = `Xem Thêm Tranh ${col.title} <span>▼</span>`;
      block.appendChild(moreBtn);

      // Gắn block vào giao diện
      container.appendChild(block);

      // Gạch ngăn cách
      const divider = document.createElement('div');
      divider.className = 'divider';
      container.appendChild(divider);
    });
  }

})();
