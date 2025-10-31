/* ======================================================
 * 🛒 COLLECTION-SLIDER — Horizontal Product Slider
 * Dữ liệu: /json/collection.json
 * CSS: /css/collection-slider.css
 * ====================================================== */

(function () {
  // Hàm render slider
  function renderSliderItems(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    data.forEach((item) => {
      const el = document.createElement("a");
      el.className = "cps-item";
      el.href = item.link;
      el.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="cps-info">
          <div class="cps-title">${item.title}</div>
          <div class="cps-price">${Number(item.price).toLocaleString()}đ</div>
        </div>
      `;
      container.appendChild(el);
    });
  }

  // Hàm load dữ liệu JSON
  async function loadCollectionSliders() {
    try {
      const res = await fetch("/json/collection.json");
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const pickleballItems = data.filter((p) => p.category === "pickleball");
      const ysandalItems = data.filter((p) => p.category === "ysandal");

      renderSliderItems(pickleballItems, "slider-pickleball");
      renderSliderItems(ysandalItems, "slider-ysandal");
    } catch (err) {
      console.error("⚠️ Lỗi khi tải collection:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", loadCollectionSliders);
})();
