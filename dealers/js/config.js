// js/config.js - Centralized configuration for the F-Sport Dealer application

const CONFIG = {
  // Branding & Logo Configuration
  branding: {
    logo: {
      image: "https://i.postimg.cc/XNCBfXM5/fsport-logo-2.webp",
      alt: "F-Sport Pickleball",
      fallback: "./assets/images/logo.svg", // Fallback nếu image không load
    },
    text: "ĐẠI LÝ",
    company: "F-SPORT PICKLEBALL",
  },

  // Contact Information (display on all pages)
  contact: {
    phone: "0384735980",
    website: "fun-sport.co",
    websiteUrl: "https://fun-sport.co",
    facebook: "facebook.com/funsport1",
    facebookUrl: "https://web.facebook.com/funsport1",
    email: "tiepvd90@gmail.com",
  },

  // Paths & Routes
  paths: {
    login: "./index.html",
    register: "./register.html",
    dashboard: "./dashboard.html",
    account: "./account.html",
    orderHistory: "./order-history.html",
  },

  // API Endpoints (Make.com Webhooks)
  webhooks: {
    login: "https://hook.make.com/[WEBHOOK_ID_LOGIN]",
    register: "https://hook.make.com/[WEBHOOK_ID_REGISTER]",
    updateProfile: "https://hook.make.com/[WEBHOOK_ID_UPDATE_PROFILE]",
    changePassword: "https://hook.make.com/[WEBHOOK_ID_CHANGE_PASSWORD]",
    createOrder: "https://hook.make.com/[WEBHOOK_ID_CREATE_ORDER]",
    fetchOrders: "https://hook.make.com/[WEBHOOK_ID_FETCH_ORDERS]",
    cancelOrder: "https://hook.make.com/[WEBHOOK_ID_CANCEL_ORDER]",
  },

  // Product Configuration
  products: {
    dataSource: "./json/products.json",
    cacheKey: "fsport_products",
    searchDebounceMs: 300,
    minQuantityValidation: true,
  },

  // Cart Configuration
  cart: {
    cacheKey: "fsport_cart",
    shippingNote: "Ghi chú: Hàng sẽ được giao trong 3-5 ngày làm việc",
    minOrderNote: "(*) Số lượng tối thiểu đặt hàng",
  },

  // Order Configuration
  orders: {
    cacheKey: "fsport_orders",
    recentLimit: 5, // Số đơn hàng gần đây hiển thị trên dashboard
    statusBadges: {
      pending: { label: "Chờ xử lý", class: "status-pending" },
      processing: { label: "Đang xử lý", class: "status-processing" },
      shipped: { label: "Đã giao", class: "status-shipped" },
      delivered: { label: "Đã nhận", class: "status-delivered" },
      cancelled: { label: "Đã hủy", class: "status-cancelled" },
    },
  },

  // Authentication Configuration
  auth: {
    dealerInfoKey: "fsport_dealer_info",
    sessionTimeoutMs: 8 * 60 * 60 * 1000, // 8 hours
    requireAuthOnPages: ["dashboard", "account", "order-history"],
  },

  // UI Configuration
  ui: {
    toastDuration: 3000, // milliseconds
    buttonLoadingText: "Đang...",
    pageTransitionDelay: 300, // milliseconds
  },

  // Validation Rules
  validation: {
    password: {
      minLength: 6,
      errorMsg: "Mật khẩu phải có ít nhất 6 ký tự.",
    },
    phone: {
      pattern: /^0\d{9}$/,
      errorMsg: "Số điện thoại không hợp lệ.",
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMsg: "Email không hợp lệ.",
    },
  },

  // Messages
  messages: {
    // Success
    successLogin: "Đăng nhập thành công",
    successRegister: "Đăng ký thành công",
    successProfileUpdate: "Cập nhật thông tin thành công",
    successPasswordChange: "Đổi mật khẩu thành công",
    successOrderCreated: "Đơn hàng được tạo thành công",

    // Error
    errorNetwork: "Lỗi kết nối. Vui lòng thử lại.",
    errorInvalidCredentials: "Email hoặc mật khẩu không đúng.",
    errorSessionExpired: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
    errorRequired: "Vui lòng điền đầy đủ tất cả thông tin bắt buộc.",
    errorEmptyCart: "Giỏ hàng trống. Vui lòng thêm sản phẩm.",
    errorMinQuantity: "Số lượng không đạt tối thiểu cho sản phẩm này.",

    // Warning
    warningCheckInfo: "Vui lòng kiểm tra thông tin",
    warningCheckPassword: "Vui lòng kiểm tra thông tin mật khẩu",

    // Info
    infoAccountRequired: "Vui lòng đăng nhập để tiếp tục.",
  },

  // Footer Configuration
  footer: {
    copyright: "© 2026 F-Sport Pickleball. All rights reserved.",
    showLinks: true,
  },

  // Debug Mode
  debug: {
    enabled: false, // Set to true for development
    logApiCalls: false,
    logStorageAccess: false,
  },
};

export default CONFIG;
