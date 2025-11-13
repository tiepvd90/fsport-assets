/* ==========================================================
   📦 COLLECTION GRID — V3 (TỰ ĐỘNG LOAD CSS)
   ----------------------------------------------------------
   - Đọc window.collectionList
   - Fetch JSON & render grid
   - CSS được inject tự động => không bị ảnh hưởng bởi art.css
   ========================================================== */

(function () {
  "use strict";

  /* --------------------------------------------------------
     1) TỰ ĐỘNG NẠP CSS RIÊNG CHO COLLECTION GRID
  -------------------------------------------------------- */
  (function loadCSS() {
    const cssURL = "/css/collection-grid.css";
    if (!document.querySelector('link[href="' + cssURL + '"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssURL;
      document.head.appendChild(link);
    }
  })();

  /* --------------------------------------------------------
     2) LẤY LIST COLLECTION
  -------------------------------------------------------- */
  const COLLECTIONS = window.collectionList || [];

  if (!Array.isArray(COLLECTIONS) || COLLECTIONS.length === 0) {
    console.warn("⚠️ Không có window.collectionList trong HTML");
    return;
  }

  const container = document.getElementById("collectionContainer");
  if (!container) {
    console.warn("❌ Không tìm thấy #collectionContainer");
    return;
  }

  /* --------------------------------------------------------
     3) FORMAT GIÁ TIỀN
  -------------------------------------------------------- */
  function formatPrice(v) {
    if (v === undefined || v === null) return "";
    if (isNaN(v)) return "";
    v = Number(v);
    if (v <= 0) return "";
    return v.toLocaleString("vi-VN") + "đ";
  }

  /* --------------------------------------------------------
     4) CHUẨN HOÁ JSON ITEMS
  -------------------------------------------------------- */
  function extractItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  /* --------------------------------------------------------
     5) TẠO TIÊU ĐỀ COLLECTION
  -------------------------------------------------------- */
  function renderTitle(title) {
    if (typeof title !== "string") return "";

    if (title.includes("| SHOPEE PRODUCT")) {
      const name = title.split("|")[0].trim();
      return `
        ${name}
        <span class="cgrid-tag-shopee">Shopee Product</span>
      `;
    }
    return title;
  }

  /* --------------------------------------------------------
     6) TẠO 1 CARD SẢN PHẨM
  -------------------------------------------------------- */
  function createCard(item) {
    const price = formatPrice(item.price);
    const original = formatPrice(item.originalPrice);

    const showOriginal =
      original &&
      item.originalPrice &&
      Number(item.originalPrice) > Number(item.price);

    const div = document.createElement("div");
    div.className = "cgrid-card";

    div.innerHTML = `
      <div class="cgrid-thumb">
        <img src="${item.image || ""}" alt="${item.title || ""}">
      </div>

      <div class="cgrid-name">${item.title || ""}</div>

      ${
        price
          ? `
        <div class="cgrid-price-wrap">
          <div class="cgrid-price">${price}</div>
          ${
            showOriginal
              ? `<div class="cgrid-original">${original}</div>`
              : ""
          }
        </div>
      `
          : ""
      }
    `;

    div.addEventListener("click", () => {
      if (item.link) window.location.href = item.link;
    });

    return div;
  }

  /* --------------------------------------------------------
     7) RENDER TẤT CẢ COLLECTION
  -------------------------------------------------------- */
  async function renderCollections() {
    for (const col of COLLECTIONS) {
      try {
        const res = await fetch(col.json);

        if (!res.ok) {
          console.warn("⚠️ Không fetch được JSON:", col.json);
          continue;
        }

        const data = await res.json();
        const items = extractItems(data);

        if (!items || items.length === 0) {
          console.warn("⚠️ JSON rỗng:", col.json);
          continue;
        }

        const block = document.createElement("div");
        block.className = "cgrid-block";

        block.innerHTML = `
          <div class="cgrid-title">${renderTitle(col.title)}</div>
          <div class="cgrid-grid"></div>
        `;

        const grid = block.querySelector(".cgrid-grid");

        items.forEach((item) => {
          grid.appendChild(createCard(item));
        });

        container.appendChild(block);

        const divider = document.createElement("div");
        divider.className = "cgrid-divider";
        container.appendChild(divider);
      } catch (err) {
        console.error("❌ Lỗi đọc JSON:", col.json, err);
      }
    }
  }

  /* --------------------------------------------------------
     8) KHỞI CHẠY
  -------------------------------------------------------- */
  renderCollections();
})();
