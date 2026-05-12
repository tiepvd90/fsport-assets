// js/pages/dashboard.js - Dashboard page logic
import CONFIG from "../../config.js";
import UI from "../utils/ui.js";
import Validation from "../utils/validation.js";
import Auth from "../modules/auth.js";
import Products from "../modules/products.js";
import Cart from "../modules/cart.js";
import Orders from "../modules/orders.js";
import API from "../utils/api.js";
import BrandingUtils from "../utils/branding.js";

let dealer = null;
let allProducts = []; // Store all products for search

// ============ DEBUG FUNCTIONS (available in console) ============

window.DEBUG = {
  async testProductsLoad() {
    console.log("\n========== TESTING PRODUCTS.LOAD() ==========");
    const result = await Products.load(true);
    console.log("Products loaded:", result.length, "items");
    if (result.length > 0) {
      console.log("First product:", result[0]);
      console.log("First product image URL:", result[0].image);
    }
    return result;
  },

  showStorageProducts() {
    console.log("\n========== CHECKING LOCALSTORAGE ==========");
    const stored = localStorage.getItem("fsport_products");
    if (stored) {
      const products = JSON.parse(stored);
      console.log("Stored products count:", products.length);
      if (products.length > 0) {
        console.log("First stored product:", products[0]);
      }
    } else {
      console.log("No products in localStorage");
    }
  },

  clearProducts() {
    console.log("\n========== CLEARING PRODUCTS CACHE ==========");
    localStorage.removeItem("fsport_products");
    Products._cache = null;
    console.log("✅ Products cache cleared");
  },

  showConfig() {
    console.log("\n========== CONFIG PATHS ==========");
    console.log("CONFIG.paths.products:", CONFIG.paths.products);
    console.log("Full path would be:", new URL(CONFIG.paths.products, window.location.href).href);
  },
};

console.log("[Dashboard] Debug functions available: window.DEBUG.testProductsLoad(), window.DEBUG.showStorageProducts(), window.DEBUG.clearProducts(), window.DEBUG.showConfig()");

// ============ Tab Management ============

function switchTab(tabName) {
  UI.$$(".tab-content").forEach(tab => tab.classList.remove("active"));
  const selectedTab = UI.$("#" + tabName);
  if (selectedTab) selectedTab.classList.add("active");
}

// ============ Account Functions ============

function loadAccountInfo() {
  if (!dealer) dealer = Auth.getCurrentDealer();
  if (!dealer) {
    console.warn("[loadAccountInfo] No dealer found");
    return;
  }

  console.log("[loadAccountInfo] Loading info for dealer:", {
    email: dealer.email,
    fullname: dealer.fullname,
    phone: dealer.phone,
    address: dealer.address,
  });
  const accountEmail = UI.$("#accountEmail"); 
  const accountFullname = UI.$("#accountFullname");
  const accountPhone = UI.$("#accountPhone");
  const accountAddress = UI.$("#accountAddress");

   if (accountEmail) accountEmail.value = dealer.email || "";
  if (accountFullname) accountFullname.value = dealer.fullname || "";
  if (accountPhone) accountPhone.value = dealer.phone || "";
  if (accountAddress) accountAddress.value = dealer.address || "";
}

async function handleUpdateProfile() {
  const fullnameInput = UI.$("#accountFullname");
  const phoneInput = UI.$("#accountPhone");
  const addressInput = UI.$("#accountAddress");
  const updateBtn = UI.$("#updateProfileBtn");

  const fullname = fullnameInput?.value.trim() || "";
  const phone = phoneInput?.value.trim() || "";
  const address = addressInput?.value.trim() || "";

  if (!fullname || !phone || !address) {
    UI.toast("Vui lòng điền đầy đủ tất cả thông tin", "error");
    return;
  }

  UI.setButtonLoading(updateBtn, true, "Đang cập nhật...");

  const result = await Auth.updateProfile({ fullname, phone, address });

  if (result.success) {
    UI.toast(result.message, "success");
    dealer = Auth.getCurrentDealer();
    const dashboardWelcome = UI.$("#dashboardWelcome");
    if (dashboardWelcome && dealer) {
      const displayName = dealer.fullname || dealer.email;
      dashboardWelcome.innerHTML = `Xin chào, <strong>${UI.escapeHtml(displayName)}</strong>`;
    }
    loadAccountInfo();
  } else {
    UI.toast(result.message, "error");
  }

  UI.setButtonLoading(updateBtn, false, "Cập nhật thông tin");
}

async function handleChangePassword() {
  const currentPasswordInput = UI.$("#currentPassword");
  const newPasswordInput = UI.$("#newPassword");
  const confirmPasswordInput = UI.$("#confirmPassword");
  const changeBtn = UI.$("#changePasswordBtn");

  const currentPassword = currentPasswordInput?.value || "";
  const newPassword = newPasswordInput?.value || "";
  const confirmPassword = confirmPasswordInput?.value || "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    UI.toast("Vui lòng nhập đầy đủ mật khẩu", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    UI.toast("Mật khẩu mới không khớp", "error");
    return;
  }
  if (newPassword.length < 6) {
    UI.toast("Mật khẩu mới phải có ít nhất 6 ký tự", "error");
    return;
  }

  UI.setButtonLoading(changeBtn, true, "Đang đổi...");

  const result = await Auth.changePassword(dealer.email, currentPassword, newPassword);

  UI.setButtonLoading(changeBtn, false, "Đổi mật khẩu");

  if (result.success) {
    UI.toast(result.message, "success");
    if (currentPasswordInput) currentPasswordInput.value = "";
    if (newPasswordInput) newPasswordInput.value = "";
    if (confirmPasswordInput) confirmPasswordInput.value = "";
    // Không reload trang, chỉ xóa mật khẩu trong form
  } else {
    UI.toast(result.message, "error");
  }
}

// ============ Render Products & Cart ============

function renderProducts(products) {
  console.log("[renderProducts] ===== RENDER START =====");
  const grid = UI.$("#productGrid");
  console.log("[renderProducts] productGrid element found:", !!grid);

  if (!grid) {
    console.error("[renderProducts] ❌ productGrid not found in DOM");
    return;
  }

  if (!products || !Array.isArray(products)) {
    console.error("[renderProducts] ❌ Invalid products data:", products);
    return;
  }

  if (!products.length) {
    console.log("[renderProducts] ⚠️ No products, showing empty state");
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><p>Không có sản phẩm.</p></div>`;
    return;
  }

  console.log("[renderProducts] 🎯 Rendering", products.length, "products");

  const htmlContent = products
    .map((p, idx) => {
      const qty = Cart.getQuantity(p.id);
      const dealerPrice = p.dealerPrice || p.price;
      const minRetailPrice = p.minRetailPrice || dealerPrice;
      const hasDescription = p.description && p.description.trim() !== "";

      console.log(`[renderProducts] Product ${idx + 1}/${products.length}:`);
      console.log(`  - id: ${p.id}`);
      console.log(`  - name: ${p.name}`);
      console.log(`  - image: ${p.image}`);
      console.log(`  - dealerPrice: ${dealerPrice}`);
      console.log(`  - minRetailPrice: ${minRetailPrice}`);
      console.log(`  - category: ${p.category || "FOAM"}`);
      console.log(`  - description: ${p.description || "none"}`);

      const descriptionLabel = hasDescription ? `<span class="product-description-label">${UI.escapeHtml(p.description)}</span>` : "";

      return `
        <article class="product-card ${qty > 0 ? "has-quantity" : ""}" data-product-id="${UI.escapeHtml(p.id)}">
          <div class="product-image-wrapper">
            <img class="product-image"
                 src="${UI.escapeHtml(p.image)}"
                 alt="${UI.escapeHtml(p.name)}"
                 onerror="console.warn('[renderProducts] Image failed to load:', this.src); this.src='./assets/images/placeholder.svg'; this.style.backgroundColor='#f3f4f6';"
                 loading="lazy"
                 style="background-color: #f3f4f6;">
            ${descriptionLabel}
          </div>
          <div class="product-body">
            <h3 class="product-name">${UI.escapeHtml(p.name)}</h3>
            <div class="product-prices">
              <div class="product-price-row">
                <div class="product-price-label product-price-label-dealer">Giá nhập:</div>
                <div class="product-price">${UI.formatCurrency(dealerPrice)}</div>
              </div>
              <div class="product-price-row">
                <div class="product-price-label product-price-label-retail">Giá bán lẻ tối thiểu:</div>
                <div class="product-price-min">${UI.formatCurrency(minRetailPrice)}</div>
              </div>
            </div>
            <div class="qty-controls">
              <button type="button" class="qty-btn" data-action="decrement" aria-label="Giảm">−</button>
              <input type="number" class="qty-input" data-action="quantity" value="${qty}" min="0" inputmode="numeric" aria-label="Số lượng">
              <button type="button" class="qty-btn" data-action="increment" aria-label="Tăng">+</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.innerHTML = htmlContent;
  console.log("[renderProducts] ✅ Finished rendering", products.length, "products");
  console.log("[renderProducts] ===== RENDER COMPLETE =====");
}

// ============ Order History ============

function statusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("ship") && !s.includes("shipped") && !s.includes("đã")) return "badge-shipping";
  if (s.includes("shipped") || s.includes("đã giao")) return "badge-shipped";
  if (s.includes("cancelled") || s.includes("canceled") || s.includes("hủy")) return "badge-cancelled";
  return "badge-confirmed";
}

function translateStatus(status) {
  return status || "Pending";
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

  // Limit to 5 most recent orders
  const limitedOrders = orders.slice(0, 5);

  tbody.innerHTML = limitedOrders
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
          </tr>
        `;
      }
    )
    .join("");
}

async function loadOrderHistory() {
  try {
    const res = await Orders.fetchHistory(dealer.email);
    console.log("[Dashboard] Order history loaded:", res.orders);
    renderOrderHistory(res.orders || []);
  } catch (err) {
    console.error("[Dashboard] Error loading order history:", err);
    renderOrderHistory([]);
  }
}

// ============ Product Search ============

function searchProducts(keyword) {
  if (!keyword || keyword.trim() === "") {
    renderProducts(allProducts);
    return;
  }

  const searchTerm = keyword.trim().toLowerCase();
  const filtered = allProducts.filter(p => {
    const name = (p.name || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    return name.includes(searchTerm) || category.includes(searchTerm);
  });

  renderProducts(filtered);

  // Show "no results" message if needed
  if (filtered.length === 0) {
    const grid = UI.$("#productGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <p>Không tìm thấy sản phẩm nào với từ khóa "<strong>${UI.escapeHtml(keyword)}</strong>"</p>
        </div>
      `;
    }
  }
}

function onProductSearchInput(e) {
  const keyword = e.target.value;
  searchProducts(keyword);
}

function renderCart() {
  const items = Cart.getItems();
  const totalQty = Cart.totalQuantity();
  const totalPrice = Cart.totalPrice();
  const min = dealer?.minOrderQuantity || CONFIG.app?.minOrderQuantity || 10;

  const itemsList = UI.$("#cartItemsList");
  if (itemsList) {
    if (!items.length) {
      itemsList.innerHTML = `<p class="text-muted text-sm">Chưa có sản phẩm trong giỏ.</p>`;
    } else {
      itemsList.innerHTML = items
        .map(i => `<div class="cart-line"><span class="cart-line-name">${UI.escapeHtml(i.productName)}</span><span class="cart-line-qty">${i.quantity} × ${UI.formatCurrency(i.price)}</span></div>`)
        .join("");
    }
  }

  const totalQtyEl = UI.$("#cartTotalQty");
  const totalPriceEl = UI.$("#cartTotalPrice");
  if (totalQtyEl) totalQtyEl.textContent = `${totalQty} sản phẩm`;
  if (totalPriceEl) totalPriceEl.textContent = UI.formatCurrency(totalPrice);

  const warning = UI.$("#cartWarning");
  const placeBtn = UI.$("#placeOrderBtn");
  const meetsMin = totalQty >= min;

  if (warning) {
    if (!meetsMin) {
      warning.innerHTML = `⚠️ Đơn hàng tối thiểu là ${min} sản phẩm. Hiện tại: ${totalQty}/${min}`;
      warning.classList.remove("hidden");
    } else {
      warning.classList.add("hidden");
    }
  }
  if (placeBtn) placeBtn.disabled = !meetsMin || totalQty === 0;

  UI.$$(".product-card").forEach((card) => {
    const id = card.dataset.productId;
    const q = Cart.getQuantity(id);
    card.classList.toggle("has-quantity", q > 0);
    const input = card.querySelector('[data-action="quantity"]');
    if (input && Number(input.value) !== q) input.value = q;
  });
}

// ============ Order ============

async function placeOrder() {
  const min = dealer?.minOrderQuantity || CONFIG.app?.minOrderQuantity || 10;
  const totalQty = Cart.totalQuantity();

  if (totalQty < min) {
    UI.toast(`Đơn hàng tối thiểu là ${min} sản phẩm. Hiện tại: ${totalQty}`, "warning");
    return;
  }

  const placeBtn = UI.$("#placeOrderBtn");
  UI.setButtonLoading(placeBtn, true, "Đang đặt hàng...");

  try {
    const res = await Orders.create(dealer, Cart.toOrderItems());
    if (res.success) {
      const successMsg = UI.$("#orderSuccessMessage");
      const successDetail = UI.$("#successOrderId");
      if (successMsg && successDetail) {
        successDetail.textContent = `Mã đơn: ${res.orderId || "..."}`;
        successMsg.classList.remove("hidden");
        setTimeout(() => successMsg.classList.add("hidden"), 4000);
      }
      Cart.clear();
      renderCart();
      // Không gọi refreshHistory ở đây vì dashboard không hiển thị lịch sử
      UI.toast("Đặt hàng thành công! Mã đơn: " + (res.orderId || "..."), "success");
    } else {
      UI.toast(res.message || "Đặt hàng thất bại", "error");
    }
  } catch (err) {
    console.error("[placeOrder] error:", err);
    UI.toast(CONFIG.messages?.error?.networkError || "Lỗi kết nối", "error");
  } finally {
    UI.setButtonLoading(placeBtn, false);
  }
}

function logout() {
  Auth.logout();
  window.location.href = `${CONFIG.paths.login}?loggedout=1`;
}

// ============ Event Handlers ============

function onProductGridClick(e) {
  const card = e.target.closest(".product-card");
  if (!card) return;
  const product = Products.findById(card.dataset.productId);
  if (!product) return;
  const action = e.target.dataset.action;
  if (action === "increment") Cart.increment(product);
  else if (action === "decrement") Cart.decrement(product);
}

function onProductGridChange(e) {
  if (e.target.dataset.action !== "quantity") return;
  const card = e.target.closest(".product-card");
  if (!card) return;
  const product = Products.findById(card.dataset.productId);
  if (!product) return;
  const qty = Math.max(0, Math.floor(Number(e.target.value) || 0));
  Cart.setQuantity(product, qty);
}

// ============ Init ============

async function init() {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("[Dashboard] INITIALIZATION START");
  console.log("═══════════════════════════════════════════════════════════════");

  // Inject logo từ config
  try {
    const logoElement = document.getElementById("headerLogo");
    if (logoElement) {
      logoElement.innerHTML = BrandingUtils.getLogoBrandingHTML(CONFIG.paths.dashboard);
      console.log("[Dashboard] ✅ Logo injected");
    }
  } catch (err) {
    console.error("[Dashboard] ❌ Logo injection failed:", err);
  }

  if (!Auth.requireAuth()) {
    console.error("[Dashboard] ❌ Auth failed, redirecting to login");
    return;
  }

  dealer = Auth.getCurrentDealer();
  console.log("[Dashboard] ✅ Dealer loaded from storage:", {
    email: dealer?.email,
    fullname: dealer?.fullname,
    minOrderQuantity: dealer?.minOrderQuantity,
  });

  // Cập nhật welcome message
  const welcomeEl = UI.$("#dashboardWelcome");
  if (welcomeEl) {
    const name = dealer?.fullname || dealer?.email || "";
    welcomeEl.innerHTML = name ? `Xin chào, <strong>${UI.escapeHtml(name)}</strong>` : `Xin chào`;
  }

  // Cập nhật label số lượng tối thiểu
  const minQty = dealer?.minOrderQuantity || CONFIG.app?.minOrderQuantity || 10;
  const minLabel = UI.$(".dashboard-section-header .text-muted");
  if (minLabel) minLabel.textContent = `Tối thiểu ${minQty} sản phẩm/đơn`;

  // Load sản phẩm - FORCE REFRESH để lấy từ JSON mới
  console.log("\n[Dashboard] 🔄 Loading products with forceRefresh=true...");
  const products = await Products.load(true); // Force refresh from JSON
  console.log("[Dashboard] ✅ Products loaded, count:", products.length);
  if (products.length > 0) {
    console.log("[Dashboard] Sample product (full object):", JSON.stringify(products[0], null, 2));
  }

  console.log("\n[Dashboard] 🎨 Rendering products to DOM...");
  allProducts = products; // Store for search
  renderProducts(products);

  // Search event
  console.log("[Dashboard] 🔍 Attaching search listener...");
  const searchInput = UI.$("#productSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", onProductSearchInput);
    console.log("[Dashboard] ✅ Search listener attached");
  }

  // Cart
  console.log("[Dashboard] 🛒 Initializing cart...");
  renderCart();
  Cart.on("change", renderCart);

  // Events
  console.log("[Dashboard] 🔗 Attaching event listeners...");
  const grid = UI.$("#productGrid");
  if (grid) {
    grid.addEventListener("click", onProductGridClick);
    grid.addEventListener("change", onProductGridChange);
    grid.addEventListener("input", onProductGridChange);
    console.log("[Dashboard] ✅ Product grid events attached");
  } else {
    console.warn("[Dashboard] ⚠️ productGrid not found for events");
  }

  const placeOrderBtn = UI.$("#placeOrderBtn");
  const logoutBtn = UI.$("#logoutBtn");
  const orderTabBtn = UI.$("#orderTabBtn");
  const updateProfileBtn = UI.$("#updateProfileBtn");
  const changePasswordBtn = UI.$("#changePasswordBtn");

  if (placeOrderBtn) placeOrderBtn.addEventListener("click", placeOrder);
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (orderTabBtn) orderTabBtn.addEventListener("click", () => switchTab("orderTab"));
  if (updateProfileBtn) updateProfileBtn.addEventListener("click", handleUpdateProfile);
  if (changePasswordBtn) changePasswordBtn.addEventListener("click", handleChangePassword);

  console.log("[Dashboard] ✅ All button events attached");

  // Load thông tin tài khoản (sau khi dealer có)
  loadAccountInfo();

  // Load order history
  console.log("[Dashboard] 📋 Loading order history...");
  await loadOrderHistory();

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("[Dashboard] ✅ INITIALIZATION COMPLETE");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

export default { init };