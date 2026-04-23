/* ==========================================================
   📦 COLLECTION GRID — V4 (HỖ TRỢ NHÓM SẢN PHẨM)
   ----------------------------------------------------------
   - Tự động nhận diện: mảng sản phẩm phẳng hoặc mảng nhóm (groupName + items)
   - Hiển thị tiêu đề nhóm nếu có
   - Grid responsive: 2 cột mobile, tối đa 5 cột desktop
   ========================================================== */

(function () {
  "use strict";

  // 1) Tự động nạp CSS (đảm bảo grid responsive)
  (function loadCSS() {
    const cssURL = "/css/collection-grid.css";
    if (!document.querySelector('link[href="' + cssURL + '"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssURL;
      document.head.appendChild(link);
    }
  })();

  const COLLECTIONS = window.collectionList || [];
  if (!Array.isArray(COLLECTIONS) || COLLECTIONS.length === 0) {
    console.warn("⚠️ Không có window.collectionList");
    return;
  }

  const container = document.getElementById("collectionContainer");
  if (!container) return;

  function formatPrice(v) {
    if (v == null || isNaN(v) || v <= 0) return "";
    return Number(v).toLocaleString("vi-VN") + "đ";
  }

  // Lấy items từ JSON (hỗ trợ cả dạng phẳng và dạng nhóm)
  function getItemsFromData(data) {
    if (Array.isArray(data)) return data; // dạng cũ: mảng sản phẩm
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  // Kiểm tra có phải cấu trúc nhóm không (phần tử đầu tiên có groupName)
  function isGroupStructure(items) {
    return (
      Array.isArray(items) &&
      items.length > 0 &&
      items[0].hasOwnProperty("groupName") &&
      items[0].hasOwnProperty("items")
    );
  }

  function createCard(item) {
    const price = formatPrice(item.price);
    const original = formatPrice(item.originalPrice);
    const showOriginal = original && item.originalPrice && Number(item.originalPrice) > Number(item.price);

    const div = document.createElement("div");
    div.className = "cgrid-card";
    div.innerHTML = `
      <div class="cgrid-thumb">
        <img src="${item.image || ""}" alt="${item.title || ""}">
      </div>
      <div class="cgrid-name">${item.title || ""}</div>
      ${price ? `<div class="cgrid-price-wrap">
          <div class="cgrid-price">${price}</div>
          ${showOriginal ? `<div class="cgrid-original">${original}</div>` : ""}
        </div>` : ""}
    `;
    div.addEventListener("click", () => {
      if (item.link) window.location.href = item.link;
    });
    return div;
  }

  // Render một nhóm (có tiêu đề)
  function renderGroup(groupName, items) {
    if (!items || items.length === 0) return null;

    const block = document.createElement("div");
    block.className = "cgrid-block";

    // Hiển thị tên nhóm (tầng)
    block.innerHTML = `
      <div class="cgrid-group-title">${groupName}</div>
      <div class="cgrid-grid"></div>
    `;
    const grid = block.querySelector(".cgrid-grid");
    items.forEach(item => grid.appendChild(createCard(item)));
    return block;
  }

  // Render danh sách phẳng (không nhóm)
  function renderFlat(items, title) {
    const block = document.createElement("div");
    block.className = "cgrid-block";
    block.innerHTML = `
      <div class="cgrid-title">${title}</div>
      <div class="cgrid-grid"></div>
    `;
    const grid = block.querySelector(".cgrid-grid");
    items.forEach(item => grid.appendChild(createCard(item)));
    return block;
  }

  async function renderCollections() {
    for (const col of COLLECTIONS) {
      try {
        const res = await fetch(col.json);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        let rawItems = getItemsFromData(data);

        if (!rawItems || rawItems.length === 0) {
          console.warn("⚠️ JSON rỗng:", col.json);
          continue;
        }

        // 🔥 Phân biệt cấu trúc: có nhóm hay không?
        if (isGroupStructure(rawItems)) {
          // Dạng mới: mảng các nhóm
          for (const group of rawItems) {
            const groupBlock = renderGroup(group.groupName, group.items);
            if (groupBlock) container.appendChild(groupBlock);
          }
        } else {
          // Dạng cũ: mảng sản phẩm phẳng
          const flatBlock = renderFlat(rawItems, col.title);
          container.appendChild(flatBlock);
        }

        // Thêm đường kẻ ngăn cách giữa các collection (nếu cần)
        const divider = document.createElement("div");
        divider.className = "cgrid-divider";
        container.appendChild(divider);
      } catch (err) {
        console.error("❌ Lỗi load collection:", col.json, err);
      }
    }
  }

  renderCollections();
})();
