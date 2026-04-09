// ===== TOAST MODULE =====

(function () {

  const stack = document.getElementById("erpToastStack");

  if (!stack) return;



  function create(text, type = "info") {

    const el = document.createElement("div");

    el.className = `erp-toast is-${type}`;

    el.innerHTML = `
      <div class="erp-toast-icon">
        ${getIcon(type)}
      </div>
      <div class="erp-toast-text">
        ${text}
      </div>
    `;

    stack.appendChild(el);

    // auto remove
    setTimeout(() => {
      remove(el);
    }, ERP_CONFIG.ui.toastDuration);

  }



  function remove(el) {
    if (!el) return;

    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";

    setTimeout(() => {
      el.remove();
    }, 200);
  }



  function getIcon(type) {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      default:
        return "•";
    }
  }



  // ===== EXPORT =====
  window.ERP_TOAST = {

    success(text) {
      if (!ERP_CONFIG.ui.enableToast) return;
      create(text, "success");
    },

    error(text) {
      if (!ERP_CONFIG.ui.enableToast) return;
      create(text, "error");
    },

    info(text) {
      if (!ERP_CONFIG.ui.enableToast) return;
      create(text, "info");
    }

  };

})();