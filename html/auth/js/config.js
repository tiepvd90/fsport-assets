/**
 * F-Sport Warranty Activation System
 * config.js - Cấu hình tập trung cho toàn bộ hệ thống
 */

const UIConfig = {
  verify: {
    loadingMessage: 'Đang xác nhận chính hãng F-SPORT...',
    successMessage: '<strong>XÁC NHẬN CHÍNH HÃNG F-SPORT</strong>',
    successSub: 'Ấn Tiếp Tục Để Kích Hoạt Bảo Hành',
    continueBtn: 'TIẾP TỤC',
    delayMs: 1000
  },

  form: {
    phonePlaceholder: 'Số điện thoại',
    emailPlaceholder: 'Email',
    submitBtn: 'GỬI YÊU CẦU KÍCH HOẠT',
    submittingBtn: 'ĐANG GỬI...',
    noteText: '<strong>Vui lòng sử dụng số điện thoại đã đặt hàng</strong> để gửi yêu cầu kích hoạt bảo hành. Hệ thống sẽ đối chiếu thông tin đơn hàng nhằm xác thực quyền lợi chính hãng.'
  },

  warranty: {
    title: 'CHÍNH SÁCH BẢO HÀNH',
    policyText: 'Sản phẩm được <strong>bảo hành {days} ngày</strong> kể từ ngày kích hoạt điện tử đối với các lỗi sản xuất liên quan đến lõi, gãy nứt vật liệu hoặc lỗi cấu trúc. (không áp dụng cho rơi, va đập hoặc sử dụng sai cách).'
  },

  popup: {
    title: '✅ F-SPORT ĐÃ NHẬN THÔNG TIN KÍCH HOẠT',
    text: 'Yêu cầu kích hoạt bảo hành đã được ghi nhận.',
    warrantyText: 'Thời gian bảo hành: <strong>{days} ngày</strong>',
    countdownText: 'Chuyển hướng trong {n} giây...',
    finishBtn: 'HOÀN TẤT',
    countdownSeconds: 5,
    redirectUrl: 'https://fun-sport.co'
  },

  validation: {
    emptyFieldMsg: 'Vui lòng nhập đầy đủ số điện thoại và email.',
    invalidPhoneMsg: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 chữ số, bắt đầu bằng 0.',
    invalidEmailMsg: 'Email không hợp lệ. Vui lòng kiểm tra lại.'
  }
};

const WarrantyConfig = {
  supabase: {
    url: 'https://xcigbbcpwfzluqazadez.supabase.co',
    anonKey: window.FSPORT_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4'
  },

  webhook: {
    url: 'https://hook.eu2.make.com/dxl7ngaypediyxwb8g7jir704356vhjt',
    method: 'POST',
    source: 'Xác thực chính hãng - fun-sport.co'
  },

  handlers: {
    enableValidation: true,
    enableWebhook: true,
    enablePopup: true,
    continueOnWebhookFail: true
  },

  errorHandling: {
    logErrors: true,
    showToUser: false
  },

  validation: {
    phonePattern: /^0\d{9}$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};
