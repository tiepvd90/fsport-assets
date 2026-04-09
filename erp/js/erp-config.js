// ===== F-SPORT ERP CONFIG =====

window.ERP_CONFIG = {

  // ===== WEBHOOK =====
  webhooks: {
    inventory: "https://hook.eu2.make.com/hdedlqbyg188pn12honj95d66gub2vfx",
    products: "https://hook.eu2.make.com/lilqm7nm0rwspuluyy265h5mxk8jk0fb",
    cashflow: "https://hook.eu2.make.com/gn5q6vmcqmyqce1nqz259tnzqx76nswe",
    cashflow_logs: "https://hook.eu2.make.com/lrlhswkpvstv9xe31e4mgdwv3ib2bnvi"
  },
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxQ5Ey1QCBpXlxAEXh4WwTNjdb_iS0HNA5zOSiOvSgV1v9YDBq596ebue5-tUyclQe0eA/exec",
  appsScriptToken: "mytoken",

  // ===== APP SETTINGS =====
  app: {
    maxSearchResult: 20,
    searchDebounce: 200,
    enableVibration: true,
    currency: "VND"
  },

  // ===== INVENTORY =====
  inventory: {
    stepPresets: [1, 2, 5],
    lowStockThreshold: 5,
    allowLongPress: true,
    longPressDelay: 400,
    longPressInterval: 80
  },

  // ===== SEARCH =====
  search: {
    enableAccentNormalize: true,
    enableFuzzy: false,
    minKeywordLength: 1
  },

  // ===== UI =====
  ui: {
    enableToast: true,
    toastDuration: 1800,
    highlightAfterUpdate: true
  },

  // ===== CASHFLOW SETTINGS =====
  cashflow: {
    // Danh mục cho phiếu chi (expense)
    expenseCategories: [
      { value: "chi_nhap_hang", label: "Chi nhập hàng" },
      { value: "thanh_toan_chay_visa", label: "Thanh toán chạy visa" },
      { value: "mua_vat_lieu", label: "Mua vật liệu" },
      { value: "khac", label: "Khác" }
    ],
    // Danh mục cho phiếu thu (income)
    incomeCategories: [
      { value: "rut_tien_san_viettel", label: "Rút tiền từ Sàn/Viettel" },
      { value: "khach_le", label: "Khách lẻ" },
      { value: "khac", label: "Khác" }
    ],
    // Danh sách nhà cung cấp / tham chiếu (reference)
    references: [
      { value: "khac", label: "Khác" },
      { value: "ncc_feillin", label: "NCC Feillin" },
      { value: "ncc_qis", label: "NCC QIS" },
      { value: "ncc_jusain", label: "NCC Jusain" }
    ]
  },

  // ===== USER =====
  users: [
    { id: "tiep", name: "Tiếp" },
    { id: "huyen", name: "Huyền" }
  ],

  defaultUser: "tiep", // chỉ dùng khi cần fallback, không tự động login

  // ===== STORAGE KEYS =====
  storage: {
    user: "erp_user",
    recent: "erp_recent_products"
  }

};

// ===== DERIVED CONFIG (AUTO BUILD) =====

// URL helper
window.ERP_CONFIG.getWebhook = function(type) {
  return this.webhooks[type] || "";
};

// format tiền nhanh
window.ERP_CONFIG.formatCurrency = function(value) {
  if (!value) return "0đ";
  try {
    return Number(value).toLocaleString("vi-VN") + "đ";
  } catch (e) {
    return value + "đ";
  }
};

// rung nhẹ (mobile)
window.ERP_CONFIG.vibrate = function(duration = 10) {
  if (!this.app.enableVibration) return;
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
};

// lấy user hiện tại - trả về null nếu chưa đăng nhập
window.ERP_CONFIG.getCurrentUser = function() {
  const key = this.storage.user;
  const user = localStorage.getItem(key);
  // Kiểm tra user có hợp lệ không
  if (user && this.users.some(u => u.id === user)) {
    return user;
  }
  return null; // Chưa đăng nhập
};

// set user
window.ERP_CONFIG.setCurrentUser = function(userId) {
  const key = this.storage.user;
  if (userId) {
    localStorage.setItem(key, userId);
  } else {
    localStorage.removeItem(key);
  }
};

// ===== DEBUG MODE =====
window.ERP_CONFIG.debug = false;
window.ERP_CONFIG.log = function(...args) {
  if (this.debug) {
    console.log("[ERP]", ...args);
  }
};