(function () {
  const input = document.getElementById("erpSearchInput");
  const clearBtn = document.getElementById("erpSearchClear");
  const listEl = document.getElementById("erpProductList");
  const countEl = document.getElementById("erpSearchCount");
  const searchBox = document.getElementById("erpSearchBox");

  function initSearch() {
    if (!input) return;

    input.addEventListener(
      "input",
      ERP_UTILS.debounce(() => {
        runSearch(input.value);
      }, ERP_CONFIG.app.searchDebounce)
    );

    clearBtn.addEventListener("click", () => {
      input.value = "";
      runSearch("");
      input.focus();
    });
  }

  function runSearch(keyword) {
    const value = (keyword || "").trim();

    if (value) {
      searchBox.classList.add("has-value");
    } else {
      searchBox.classList.remove("has-value");
    }

    const results = ERP_STATE.search(value);
    renderList(results, value);
  }

  function renderList(groups, keyword) {
    listEl.innerHTML = "";

    if (!groups || groups.length === 0) {
      countEl.innerText = "0 kết quả";
      listEl.innerHTML = `
        <div class="erp-empty">
          <div class="erp-empty-icon">🔍</div>
          <div class="erp-empty-title">Không có kết quả</div>
          <div class="erp-empty-text">Thử từ khóa khác</div>
        </div>
      `;
      return;
    }

    countEl.innerText = `${groups.length} kết quả`;

    listEl.innerHTML = groups.map(g => renderItem(g, keyword)).join("");
    bindItemEvents();
  }

  function renderItem(group, keyword) {
    const name = ERP_UTILS.highlight(group.name, keyword);
    const stock = ERP_UTILS.formatNumber(group.total_stock);

    return `
      <div class="erp-group-card" data-group="${group.group}">
        <div class="erp-group-thumb">
          ${group.image ? `<img src="${group.image}" alt="${group.name}">` : `<span>📦</span>`}
        </div>

        <div class="erp-group-body">
          <div class="erp-group-name">${name} <span class="erp-group-color">(${group.color})</span></div>
          <div class="erp-group-meta">
            <span class="erp-pill is-category">${group.category || ""}</span>
            <span class="erp-pill is-stock">Tồn: ${stock}</span>
          </div>
        </div>

        <div class="erp-group-right">
          <div class="erp-group-open">›</div>
        </div>
      </div>
    `;
  }

  function bindItemEvents() {
    const items = listEl.querySelectorAll(".erp-group-card");

    items.forEach(el => {
      el.addEventListener("click", () => {
        const groupId = el.dataset.group;
        const group = ERP_STATE.selectGroup(groupId);

        if (group && window.ERP_UI_PRODUCT_DETAIL) {
          window.ERP_UI_PRODUCT_DETAIL.open(group);
        }
      });
    });
  }

  window.ERP_SEARCH = {
    init: initSearch,
    run: runSearch
  };

  document.addEventListener("DOMContentLoaded", initSearch);
})();