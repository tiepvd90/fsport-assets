export default {
  webhooks: {
    registration: "https://hook.eu2.make.com/36v9wk1kngkwxi4dmidfvendvo9ijsyw",
    createOrder: "https://hook.eu2.make.com/1kn7a7mwyglrwavgl73w70yfginfanij",
    fetchOrders: "https://hook.eu2.make.com/n9egwot7vbyxa48m40tpgwy5krhy8v75",
    login: "https://hook.eu2.make.com/jiqtqnm9pwqob4j88982dkatemgcv3kv"
  },
  api: {
    timeout: 10000,
    retries: 2,
  },
  app: {
    minOrderQuantity: 10,
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 giờ
  },
  storage: {
    dealerInfo: "fsport_dealer_info",
    cart: "fsport_cart",
    orderHistory: "fsport_orders",
    products: "fsport_products",
    lastFetch: "fsport_last_fetch",
  },
  paths: {
    login: "./index.html",
    register: "./register.html",
    dashboard: "./dashboard.html",
    account: "./account.html",
    orderHistory: "./order-history.html",
    products: "./json/products.json",
  },
  orderStatus: {
    confirmed: "Chờ Xác Nhận",
    shipping: "Đang Giao",
    shipped: "Đã Giao",
    cancelled: "Đã Hủy",
  },
  orderStatusMap: {
    "confirmed": "Chờ Xác Nhận",
    "Confirmed": "Chờ Xác Nhận",
    "shipping": "Đang Giao",
    "Shipping": "Đang Giao",
    "shipped": "Đã Giao",
    "Shipped": "Đã Giao",
    "cancelled": "Đã Hủy",
    "Cancelled": "Đã Hủy",
    "cancel": "Đã Hủy",
    "hủy": "Đã Hủy",
  },
  messages: {
    success: {
      loggedIn: "Đăng nhập thành công!",
      loggedOut: "Đã đăng xuất.",
      registered: "Đăng ký thành công! Vui lòng đăng nhập.",
      orderPlaced: "Đơn hàng đã được gửi! F-Sport sẽ gọi xác nhận.",
      addressSaved: "Đã lưu địa chỉ giao hàng.",
    },
    error: {
      invalidCredentials: "Email hoặc mật khẩu không đúng.",
      networkError: "Lỗi kết nối mạng, vui lòng thử lại.",
      minOrderNotMet: "Đơn hàng phải có ít nhất 10 sản phẩm.",
      orderFailed: "Đặt hàng thất bại, vui lòng thử lại.",
      registrationFailed: "Đăng ký thất bại, vui lòng thử lại.",
      sessionExpired: "Phiên làm việc hết hạn, vui lòng đăng nhập lại.",
    },
    default: {},
  },
  provinces: [
    "TP. Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
  ],
};