// js/utils/ui.js - DOM helpers, modals, alerts, toasts

const UI = {
  /**
   * Get element by selector (returns null if not found)
   */
  $(selector, root = document) {
    return root.querySelector(selector);
  },

  /**
   * Get all elements
   */
  $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  },

  /**
   * Toggle visibility (uses .hidden class)
   */
  show(el) {
    if (typeof el === "string") el = this.$(el);
    if (el) el.classList.remove("hidden");
  },

  hide(el) {
    if (typeof el === "string") el = this.$(el);
    if (el) el.classList.add("hidden");
  },

  /**
   * Format VND currency
   */
  formatCurrency(amount) {
    if (typeof amount !== "number" || isNaN(amount)) amount = 0;
    return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
  },

  /**
   * Format date (locale-friendly)
   */
  formatDate(isoString) {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  },

  /**
   * Show inline form field error
   */
  setFieldError(fieldName, message, formSelector = "form") {
    const form = typeof formSelector === "string" ? this.$(formSelector) : formSelector;
    if (!form) return;
    const input = form.querySelector(`[name="${fieldName}"]`);
    const errorEl = form.querySelector(`[data-error="${fieldName}"]`);
    if (input) {
      if (message) {
        input.classList.add("is-invalid");
      } else {
        input.classList.remove("is-invalid");
      }
    }
    if (errorEl) {
      errorEl.textContent = message || "";
    }
  },

  /**
   * Clear all errors in a form
   */
  clearFormErrors(formSelector = "form") {
    const form = typeof formSelector === "string" ? this.$(formSelector) : formSelector;
    if (!form) return;
    this.$$(".is-invalid", form).forEach((el) => el.classList.remove("is-invalid"));
    this.$$("[data-error]", form).forEach((el) => (el.textContent = ""));
  },

  /**
   * Apply error map to form
   */
  applyFormErrors(errors, formSelector = "form") {
    this.clearFormErrors(formSelector);
    Object.entries(errors).forEach(([field, message]) => {
      this.setFieldError(field, message, formSelector);
    });
  },

  /**
   * Set loading state on a button (adds spinner, disables)
   */
  setButtonLoading(btn, loading = true, loadingText) {
    if (typeof btn === "string") btn = this.$(btn);
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span><span>${loadingText || "Đang xử lý..."}</span>`;
    } else {
      btn.disabled = false;
      if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
      }
    }
  },

  /**
   * Show modal
   */
  showModal({ title, body, buttons = [], closeOnBackdrop = true, autoCloseMs = 0 } = {}) {
    // Remove any existing modal first
    this.closeModal();

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "appModal";

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const buttonsHtml = buttons
      .map(
        (btn, i) =>
          `<button type="button" class="btn ${btn.className || "btn-primary"}" data-modal-action="${i}">${btn.label}</button>`
      )
      .join("");

    modal.innerHTML = `
      ${
        title
          ? `<div class="modal-header">
              <h3 class="modal-title">${title}</h3>
              <button type="button" class="modal-close" aria-label="Đóng">&times;</button>
            </div>`
          : ""
      }
      <div class="modal-body">${body || ""}</div>
      ${buttonsHtml ? `<div class="modal-footer">${buttonsHtml}</div>` : ""}
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const close = () => this.closeModal();

    modal.querySelector(".modal-close")?.addEventListener("click", close);
    if (closeOnBackdrop) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
      });
    }
    buttons.forEach((btn, i) => {
      modal.querySelector(`[data-modal-action="${i}"]`)?.addEventListener("click", () => {
        const result = btn.onClick ? btn.onClick() : undefined;
        if (result !== false) close();
      });
    });

    if (autoCloseMs > 0) {
      setTimeout(close, autoCloseMs);
    }

    return overlay;
  },

  closeModal() {
    const existing = document.getElementById("appModal");
    if (existing) existing.remove();
    document.body.style.overflow = "";
  },

  /**
   * Show toast notification (auto-dismisses)
   */
  toast(message, type = "info", duration = 3500) {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Show full-page loader
   */
  showLoader() {
    if (document.getElementById("appLoader")) return;
    const loader = document.createElement("div");
    loader.id = "appLoader";
    loader.className = "loader-overlay";
    loader.innerHTML = '<div class="loader"></div>';
    document.body.appendChild(loader);
  },

  hideLoader() {
    const loader = document.getElementById("appLoader");
    if (loader) loader.remove();
  },

  /**
   * Escape HTML to prevent injection
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  /**
   * Build DOM element from HTML string
   */
  fromHtml(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    return tpl.content.firstChild;
  },
};

export default UI;
