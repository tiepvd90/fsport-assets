// js/pages/order-history.js - Order History page logic
import CONFIG from "../../config.js";
import UI from "../utils/ui.js";
import Auth from "../modules/auth.js";
import Orders from "../modules/orders.js";
import BrandingUtils from "../utils/branding.js";

// ============ Render ============

function statusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("ship") && !s.includes("shipped") && !s.includes("đã")) return "badge-shipping";
  if (s.includes("shipped") || s.includes("đã giao")) return "badge-shipped";
  if (s.includes("cancelled") || s.includes("canceled") || s.includes("hủy")) return "badge-cancelled";
  return "badge-confirmed";
}

function translateStatus(status) {
  // Không dịch, chỉ trả về status nguyên bản từ webhook
  return status || "Pending";
}

function canCancelOrder(status) {
  // Chỉ cho phép hủy nếu trạng thái là NEW (hoặc chưa được cập nhật)
  const s = (status || "").toLowerCase();
  // Cho phép hủy nếu: trạng thái chứa "new" hoặc không chứa các trạng thái khác
  const isCancellable = s === "" || s === "new" || s === "pending" || !s;
  return isCancellable;
}

function renderOrderHistory(orders) {
  const tbody = UI.$("#orderHistoryBody");
  const emptyEl = UI.$("#orderHistoryEmpty");
  if (!tbody) return;

  if (!orders || !orders.length) {
    tbody.innerHTML = "";
    if (emptyEl) emptyEl.classList.remove("hidden");
    return;
  }

  if (emptyEl) emptyEl.classList.add("hidden");

  tbody.innerHTML = orders
    .map(
      (o) => {
        // Format items display
        let itemsDisplay = "-";
        if (o.items && Array.isArray(o.items) && o.items.length > 0) {
          itemsDisplay = o.items
            .map(item => {
              const name = item.productName || item.name || "Sản phẩm";
              const qty = item.quantity || 0;
              const price = item.price || 0;
              return `${UI.escapeHtml(name)} (${qty} × ${UI.formatCurrency(price)})`;
            })
            .join("<br>");
        }

        // Xác định nút hành động
        // TODO: Tạm thời ẩn nút hủy đơn - chưa có webhook xử lý
        const canCancel = false; // canCancelOrder(o.status);
        let actionHtml = "-";
        if (canCancel) {
          actionHtml = `<button class="btn btn-sm btn-danger cancel-order-btn" data-order-id="${UI.escapeHtml(o.orderId || "")}" type="button">Hủy Đơn</button>`;
        }

        return `
          <tr class="order-row" data-order-id="${UI.escapeHtml(o.orderId || "")}">
            <td data-label="Mã đơn">${UI.escapeHtml(o.orderId || "-")}</td>
            <td data-label="Ngày">${UI.formatDate(o.createdAt)}</td>
            <td data-label="Sản phẩm" class="order-items-cell">${itemsDisplay}</td>
            <td data-label="SL">${UI.escapeHtml(o.totalQuantity ?? "-")}</td>
            <td data-label="Tổng tiền">${UI.formatCurrency(Number(o.totalPrice) || 0)}</td>
            <td data-label="Trạng thái">
              <span class="badge ${statusBadgeClass(o.status)}">
                ${UI.escapeHtml(translateStatus(o.status))}
              </span>
            </td>
            <td data-label="Hành động" class="order-action-cell">
              ${actionHtml}
            </td>
          </tr>
        `;
      }
    )
    .join("");

  // Attach event listeners to cancel buttons
  document.querySelectorAll(".cancel-order-btn").forEach((btn) => {
    btn.addEventListener("click", handleCancelOrder);
  });
}

// ============ Event handlers ============

async function handleCancelOrder(e) {
  const orderId = e.target.dataset.orderId;
  if (!orderId) {
    UI.toast("Không tìm thấy mã đơn", "error");
    return;
  }

  // Confirm trước khi hủy
  const confirmed = confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${orderId}? Hành động này không thể hoàn tác.`);
  if (!confirmed) return;

  const btn = e.target;
  UI.setButtonLoading(btn, true, "Đang hủy...");

  try {
    const dealer = Auth.getCurrentDealer();
    const result = await Orders.cancelOrder(dealer.email, orderId);

    if (result.success) {
      UI.toast("Hủy đơn hàng thành công", "success");
      // Reload lịch sử
      await refreshHistory();
    } else {
      UI.toast(result.message || "Hủy đơn thất bại", "error");
    }
  } catch (err) {
    console.error("[handleCancelOrder] error:", err);
    UI.toast("Lỗi khi hủy đơn: " + err.message, "error");
  } finally {
    UI.setButtonLoading(btn, false, "Hủy Đơn");
  }
}

async function refreshHistory() {
  const refreshBtn = UI.$("#refreshHistoryBtn");
  if (refreshBtn) UI.setButtonLoading(refreshBtn, true, "Đang tải...");
  try {
    const dealer = Auth.getCurrentDealer();
    console.log("[refreshHistory] Dealer:", dealer);
    const res = await Orders.fetchHistory(dealer.email);
    console.log("[refreshHistory] Response:", res);
    console.log("[refreshHistory] Orders:", res.orders);
    renderOrderHistory(res.orders || []);
  } catch (err) {
    console.error("[refreshHistory] error:", err);
    UI.toast("Không tải được lịch sử đơn hàng: " + err.message, "danger");
  } finally {
    if (refreshBtn) UI.setButtonLoading(refreshBtn, false);
  }
}

function logout() {
  Auth.logout();
  window.location.href = `${CONFIG.paths.login}?loggedout=1`;
}

// ============ Init ============

async function init() {
  console.log("[init] Starting order-history page...");

  // Inject logo từ config
  try {
    const logoElement = document.getElementById("headerLogo");
    if (logoElement) {
      logoElement.innerHTML = BrandingUtils.getLogoBrandingHTML(CONFIG.paths.dashboard);
      console.log("[Order History] ✅ Logo injected");
    }
  } catch (err) {
    console.error("[Order History] ❌ Logo injection failed:", err);
  }

  if (!Auth.requireAuth()) {
    console.error("[init] Auth failed, redirecting to login");
    return;
  }

  const dealer = Auth.getCurrentDealer();
  console.log("[init] Current dealer:", dealer);

  const dashboardWelcome = UI.$("#dashboardWelcome");
  if (dashboardWelcome) {
    if (dealer && dealer.fullname) {
      dashboardWelcome.innerHTML = `Xin chào, <strong>${UI.escapeHtml(dealer.fullname)}</strong>`;
    } else if (dealer && dealer.email) {
      dashboardWelcome.innerHTML = `Xin chào, <strong>${UI.escapeHtml(dealer.email)}</strong>`;
    } else {
      dashboardWelcome.innerHTML = `Xin chào`;
    }
  }

  const refreshHistoryBtn = UI.$("#refreshHistoryBtn");
  const logoutBtn = UI.$("#logoutBtn");

  if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener("click", refreshHistory);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      console.log("[logout] Logging out...");
      logout();
    });
  }

  // Auto-load order history on page load
  console.log("[init] Loading cached history...");
  const cached = Orders.getCachedHistory();
  console.log("[init] Cached orders:", cached);
  renderOrderHistory(cached);

  console.log("[init] Fetching fresh history...");
  await refreshHistory();
}

// NOTE: init() is called by app.js router, not here
// Remove DOMContentLoaded listener to avoid duplicate/race condition calls

export default { init };
