# 📚 F-Sport Dealer Management System - Hướng Dẫn Toàn Bộ Project

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Cấu Trúc Project](#cấu-trúc-project)
3. [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
4. [Các Trang Chính](#các-trang-chính)
5. [Hệ Thống Branding](#hệ-thống-branding)
6. [Hệ Thống Xác Thực](#hệ-thống-xác-thực)
7. [Quản Lý Sản Phẩm](#quản-lý-sản-phẩm)
8. [Quản Lý Đơn Hàng](#quản-lý-đơn-hàng)
9. [Quản Lý Tài Khoản](#quản-lý-tài-khoản)
10. [Hướng Dẫn Phát Triển](#hướng-dẫn-phát-triển)

---

## 🎯 Tổng Quan

**F-Sport Dealer Management System** là một ứng dụng web cho phép các đại lý:
- ✅ Đăng ký & đăng nhập
- ✅ Duyệt danh sách sản phẩm
- ✅ Tìm kiếm sản phẩm
- ✅ Quản lý giỏ hàng
- ✅ Đặt hàng
- ✅ Xem lịch sử đơn hàng
- ✅ Quản lý thông tin tài khoản
- ✅ Đổi mật khẩu

---

## 📁 Cấu Trúc Project

```
F-SPORT DEALER/
│
├── 📄 HTML Pages (6 trang)
│   ├── index.html              (Trang đăng nhập)
│   ├── register.html           (Trang đăng ký)
│   ├── dashboard.html          (Dashboard chính)
│   ├── account.html            (Thông tin tài khoản)
│   ├── order-history.html      (Lịch sử đơn hàng)
│   └── (+ html pages khác)
│
├── 🎨 CSS (6 files)
│   ├── css/reset.css           (CSS reset)
│   ├── css/variables.css       (CSS variables & colors)
│   ├── css/layout.css          (Layout & header/footer)
│   ├── css/components.css      (Button, form, card)
│   ├── css/pages.css           (Page-specific styles)
│   └── css/responsive.css      (Mobile responsive)
│
├── ⚙️ JavaScript
│   ├── js/app.js               (Entry point, router)
│   ├── js/config.js            (Cấu hình tuyền trung)
│   │
│   ├── js/modules/
│   │   ├── auth.js             (Authentication, login, register)
│   │   ├── products.js         (Load sản phẩm từ JSON)
│   │   ├── cart.js             (Quản lý giỏ hàng)
│   │   └── orders.js           (Tạo & lấy đơn hàng)
│   │
│   ├── js/utils/
│   │   ├── branding.js         (Logo & branding utilities)
│   │   ├── ui.js               (Toast, errors, helpers)
│   │   ├── validation.js       (Form validation)
│   │   └── api.js              (API calls)
│   │
│   └── js/pages/
│       ├── login.js            (Trang login)
│       ├── register.js         (Trang đăng ký)
│       ├── dashboard.js        (Dashboard logic)
│       ├── account.js          (Account page logic)
│       └── order-history.js    (Order history logic)
│
├── 📦 Data
│   └── json/products.json      (Danh sách sản phẩm)
│
├── 🖼️ Assets
│   └── assets/
│       ├── favicon.ico
│       └── images/
│           ├── logo.svg        (Fallback logo)
│           └── placeholder.svg
│
├── 📚 Docs (Tài liệu)
│   └── docs/PROJECT_GUIDE.md   (File này)
│
└── 📝 Config Files
    ├── DEALERS_SPEC.md         (Specs toàn bộ project)
    └── INTERFACE_SPEC.md       (UI/Design specs)
```

---

## 🛠 Công Nghệ Sử Dụng

| Công Nghệ | Mục Đích |
|-----------|---------|
| **HTML5** | Markup & structure |
| **CSS3** | Styling & responsive design |
| **JavaScript (ES6+)** | Logic & interactivity |
| **ES6 Modules** | Code organization (import/export) |
| **localStorage** | Client-side session storage |
| **Make.com Webhooks** | Backend integration |
| **JSON** | Product data format |

**Không sử dụng:**
- ❌ Framework (React, Vue, Angular)
- ❌ Build tools (Webpack, Vite)
- ❌ Package manager (npm, yarn)
- ❌ Database (pure client-side + webhooks)

---

## 📄 Các Trang Chính

### 1. **index.html** - Trang Đăng Nhập
- **URL**: `/index.html`
- **Script**: `js/pages/login.js`
- **Chức năng**:
  - Nhập email + mật khẩu
  - Xác thực qua Make.com webhook
  - Lưu session vào localStorage
  - Chuyển đến dashboard nếu thành công

### 2. **register.html** - Trang Đăng Ký
- **URL**: `/register.html`
- **Script**: `js/pages/register.js`
- **Chức năng**:
  - Nhập thông tin đại lý (tên, email, phone, address, password)
  - Kiểm tra dữ liệu hợp lệ
  - Gửi đến Make.com webhook
  - Auto-login sau đó chuyển dashboard

### 3. **dashboard.html** - Dashboard Chính
- **URL**: `/dashboard.html` (yêu cầu xác thực)
- **Script**: `js/pages/dashboard.js`
- **Chức năng**:
  - Hiển thị danh sách sản phẩm (grid 4 cột desktop, 3 mobile)
  - Tìm kiếm sản phẩm (by name hoặc category)
  - Giỏ hàng (bên phải, sticky)
  - Đặt hàng
  - Xem lịch sử đơn hàng gần đây (5 đơn)
  - Chính sách accordion
  - Tab-based layout (Order / Account)

### 4. **account.html** - Thông Tin Tài Khoản
- **URL**: `/account.html` (yêu cầu xác thực)
- **Script**: `js/pages/account.js`
- **Chức năng**:
  - Xem/sửa thông tin (fullname, phone, address)
  - Đổi mật khẩu
  - Đăng xuất

### 5. **order-history.html** - Lịch Sử Đơn Hàng
- **URL**: `/order-history.html` (yêu cầu xác thực)
- **Script**: `js/pages/order-history.js`
- **Chức năng**:
  - Bảng tất cả đơn hàng
  - Lọc theo trạng thái
  - Refresh danh sách
  - Xem chi tiết / hủy đơn (nút ẩn)

---

## 🎨 Hệ Thống Branding

### Cấu Hình Logo & Brand
**File**: `js/config.js`

```javascript
CONFIG.branding = {
  logo: {
    image: "https://i.postimg.cc/XNCBfXM5/fsport-logo-2.webp",
    alt: "F-Sport Pickleball",
    fallback: "./assets/images/logo.svg"
  },
  text: "ĐẠI LÝ"
}
```

### Render Logo
**File**: `js/utils/branding.js`

Sử dụng `BrandingUtils.getLogoBrandingHTML()` để render logo từ config.

**Pages sử dụng**:
- ✅ index.html (login)
- ✅ register.html
- ✅ dashboard.html
- ✅ account.html
- ✅ order-history.html

### Sửa Logo/Text
1. Edit `js/config.js` → `CONFIG.branding.logo.image` & `text`
2. Reload browser
3. Tất cả 5 trang tự động cập nhật!

---

## 🔐 Hệ Thống Xác Thực

### Auth Module
**File**: `js/modules/auth.js`

#### Các Function Chính:
```javascript
// Đăng nhập
Auth.login(email, password)
// → Gọi webhook, trả về { success, dealer_info }

// Đăng ký
Auth.register(fullname, email, phone, address, password)
// → Gọi webhook, auto-login

// Lấy thông tin đại lý hiện tại
Auth.getCurrentDealer()
// → Lấy từ localStorage

// Cập nhật profile
Auth.updateProfile(data)
// → Sửa thông tin qua webhook

// Đổi mật khẩu
Auth.changePassword(email, currentPassword, newPassword)
// → Gọi webhook đổi pass

// Đăng xuất
Auth.logout()
// → Xóa localStorage, redirect login

// Check xác thực bắt buộc
Auth.requireAuth()
// → Kiểm tra session, redirect nếu chưa login
```

### Session Storage
**Key**: `fsport_dealer_info`
```javascript
{
  email: "dealer@example.com",
  fullname: "Tên Đại Lý",
  phone: "0384735980",
  address: "Địa chỉ",
  loginTime: 1715467200000
}
```

**Timeout**: 8 giờ (480 phút)

---

## 🛒 Quản Lý Sản Phẩm

### Product Module
**File**: `js/modules/products.js`

#### Load Sản Phẩm:
```javascript
// Từ JSON file
const products = await Products.load()

// Với force refresh
const products = await Products.load(true)

// Tìm sản phẩm by ID
const product = Products.findById(id)
```

### Caching
- **Memory cache**: Lưu trong module variable
- **localStorage cache**: Key `fsport_products`
- Tự động fallback nếu JSON không load

### Product Structure
```javascript
{
  id: "PROD001",
  name: "Vợt Pickleball Full Foam",
  category: "Vợt",
  series: "Full Foam",
  dealerPrice: 250000,
  minRetailPrice: 350000,
  image: "https://...",
  description: "HOT"
}
```

### Tìm Kiếm
**File**: `js/pages/dashboard.js` → `searchProducts()`
- Filter by name (case-insensitive)
- Filter by category
- Real-time khi user gõ

---

## 🛍️ Quản Lý Giỏ Hàng

### Cart Module
**File**: `js/modules/cart.js`

#### Các Function:
```javascript
// Thêm vào giỏ
Cart.add(productId, product, quantity)

// Xóa khỏi giỏ
Cart.remove(productId)

// Sửa số lượng
Cart.updateQuantity(productId, quantity)

// Lấy tất cả items
Cart.getItems()

// Tổng số lượng
Cart.totalQuantity()

// Tổng tiền
Cart.totalPrice()

// Xóa giỏ
Cart.clear()

// Listen thay đổi
Cart.on('change', callback)
```

### Cart Storage
**Key**: `fsport_cart`
```javascript
[
  {
    productId: "PROD001",
    productName: "Vợt Pickleball",
    image: "https://...",
    price: 250000,
    quantity: 2,
    subtotal: 500000
  }
]
```

### Validation
- ✅ Kiểm tra minimum order quantity (10 sản phẩm/đơn)
- ✅ Kiểm tra mỗi sản phẩm có đủ min quantity không
- ✅ Disable nút "Đặt hàng" nếu không đạt

---

## 📦 Quản Lý Đơn Hàng

### Orders Module
**File**: `js/modules/orders.js`

#### Các Function:
```javascript
// Tạo đơn hàng
Orders.create(dealer, items)
// → Gọi webhook, trả về { success, orderId }

// Lấy lịch sử
Orders.fetchHistory(dealerEmail)
// → Gọi webhook, trả về danh sách orders

// Lấy từ cache
Orders.getCachedHistory()

// Hủy đơn (currently hidden)
Orders.cancelOrder(email, orderId)
```

### Order Structure
```javascript
{
  id: "ORD20260512001",
  dealerEmail: "dealer@example.com",
  dealerName: "Tên Đại Lý",
  items: [
    { productId, name, quantity, dealerPrice, subtotal }
  ],
  totalQuantity: 15,
  totalAmount: 3750000,
  shippingAddress: "Địa chỉ",
  status: "pending",
  createdAt: 1715467200000,
  updatedAt: 1715467200000
}
```

### Order Status
- `pending` - Chờ xử lý
- `processing` - Đang xử lý
- `shipped` - Đã giao
- `delivered` - Đã nhận
- `cancelled` - Đã hủy

### Order History Cache
**Key**: `fsport_orders`

---

## 👤 Quản Lý Tài Khoản

### Account Features (account.html)

#### 1. Thông Tin Đại Lý
- Xem/sửa: Tên, SĐT, Địa chỉ
- Email read-only
- Validate form
- Save qua Auth.updateProfile()

#### 2. Đổi Mật Khẩu
- Nhập mật khẩu hiện tại
- Nhập mật khẩu mới (min 6 ký tự)
- Confirm password (phải khớp)
- Submit qua Auth.changePassword()

#### 3. Đăng Xuất
- Button ở header
- Clear localStorage
- Redirect login page

---

## 🔧 Hướng Dẫn Phát Triển

### Setup
```bash
# Không cần install dependencies!
# Chỉ cần mở index.html trong browser
# hoặc chạy local server:

python -m http.server 8000
# hoặc
php -S localhost:8000
```

### Workflow Phát Triển

#### 1. **Thêm Page Mới**
```html
<!-- 1. Tạo file HTML với: -->
<div id="headerLogo" class="logo"></div>

<!-- 2. Tạo file JS: js/pages/newpage.js -->
import BrandingUtils from "../utils/branding.js";

function init() {
  BrandingUtils.getLogoBrandingHTML();
  // rest of logic...
}

<!-- 3. Register route trong app.js -->
import NewPage from "./pages/newpage.js";
const routes = { newpage: NewPage, ... };
```

#### 2. **Sửa Config**
```javascript
// js/config.js - edit giá trị, reload browser
CONFIG.branding.logo.image = "new-url";
CONFIG.contact.phone = "0123456789";
```

#### 3. **Thêm Webhook**
```javascript
// js/config.js → webhooks section
webhooks: {
  myNewAPI: "https://hook.make.com/..."
}

// js/modules/mymodule.js
async function myFunction() {
  const response = await fetch(CONFIG.webhooks.myNewAPI, { ... });
}
```

#### 4. **CSS Responsive**
```css
/* Desktop default */
.element { font-size: 1rem; }

/* Mobile */
@media (max-width: 480px) {
  .element { font-size: 0.9rem; }
}
```

#### 5. **Chặn Zoom trên Mobile iOS**
**File**: `css/reset.css`

```css
/* === Reset font và fix zoom iOS === */
html, body, input, textarea {
  -webkit-text-size-adjust: 100%;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #222;
}

input, textarea, select {
  font-size: 16px !important;
}
```

**Giải thích**:
- `-webkit-text-size-adjust: 100%` - Chặn Safari iOS tự động zoom
- `font-size: 16px` - Font size ≥ 16px sẽ không trigger auto-zoom iOS
- `font-size: 16px !important` - Đảm bảo input/textarea không bị override

**Hiệu quả**: Zoom sẽ bị chặn hoàn toàn khi tap vào input ở iOS Safari

### Debug Tools

#### 1. **Console Logs**
Mở DevTools (F12) → Console để xem logs:
```javascript
[Dashboard] INITIALIZATION START
[Dashboard] ✅ Dealer loaded
[Dashboard] ✅ Products loaded
```

#### 2. **localStorage Inspector**
```javascript
// Xem tất cả data
localStorage

// Clear tất cả
localStorage.clear()

// Xem một key
localStorage.getItem('fsport_dealer_info')
```

#### 3. **Network Tab**
- F12 → Network
- Xem webhook calls
- Check response status

### Testing Checklist
- [ ] Login/Register hoạt động
- [ ] Dashboard load sản phẩm
- [ ] Tìm kiếm hoạt động
- [ ] Giỏ hàng cập nhật
- [ ] Đặt hàng ghi nhận
- [ ] Lịch sử đơn hàng hiển thị
- [ ] Account sửa info thành công
- [ ] Đổi password thành công
- [ ] Đăng xuất + redirect login
- [ ] Logo hiển thị tất cả trang
- [ ] Responsive mobile

---

## 📝 Quy Ước Code

### Naming Conventions
```javascript
// Module functions
const Auth = { login(), register(), logout() }

// Utility classes
class BrandingUtils { static getLogoHTML() {} }

// HTML IDs
id="headerLogo"
id="dashboardWelcome"
id="loginForm"

// CSS Classes
class="logo"
class="btn btn-primary"
class="form-error"

// Config objects
CONFIG.branding
CONFIG.contact
CONFIG.webhooks
```

### File Organization
```
js/
├── modules/    (Business logic: auth, products, cart, orders)
├── pages/      (Page-specific logic: dashboard.js, account.js)
├── utils/      (Helpers: branding, ui, validation, api)
└── config.js   (Centralized configuration)
```

### Comments
```javascript
// Descriptive comment trước function
async function handleSubmit(e) {
  // Detailed comment cho complex logic
  const data = getFormData(form);
}
```

---

## 🚀 Deployment Checklist

- [ ] Tất cả webhooks được setup trong Make.com
- [ ] Logo URL accessible
- [ ] Fallback logo tồn tại
- [ ] All pages tested
- [ ] Mobile responsive verified
- [ ] No console errors
- [ ] Contact info updated
- [ ] Product data current
- [ ] Git commit & push
- [ ] Documentation updated

---

## 📞 Troubleshooting

### Logo không hiển thị
1. Check URL trong config.js
2. Verify image load (Network tab)
3. Check fallback logo tồn tại
4. Hard refresh: Ctrl+Shift+R

### Session mất
1. Check localStorage không bị clear
2. Verify session timeout (8 hours)
3. Check auth token hợp lệ
4. Re-login

### Webhook không connect
1. Verify URL đúng trong config.js
2. Check Make.com scenario active
3. Test webhook manually
4. Xem Network tab requests

### Products không load
1. Check json/products.json tồn tại
2. Verify JSON syntax valid
3. Clear cache: localStorage.clear()
4. Reload page

---

## 📚 Tài Liệu Khác

- `DEALERS_SPEC.md` - Specs toàn bộ project
- `INTERFACE_SPEC.md` - UI/Design specifications

---

**Version**: 1.0  
**Last Updated**: May 2026  
**Maintained By**: F-Sport Development Team
