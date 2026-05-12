// js/utils/validation.js - Form validation helpers

const Validation = {
  /**
   * Validate email format (RFC 5322 simplified)
   */
  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  },

  /**
   * Validate Vietnamese phone (10-11 digits, may start with 0 or +84)
   */
  isValidPhone(phone) {
    if (!phone || typeof phone !== "string") return false;
    const cleaned = phone.replace(/[\s\-().]/g, "");
    // Allow +84xxxxxxxxx (12 chars including +) or 0xxxxxxxxx (10-11 digits)
    if (/^\+84\d{9,10}$/.test(cleaned)) return true;
    return /^0\d{9,10}$/.test(cleaned);
  },

  /**
   * Validate password (min 6 chars)
   */
  isValidPassword(password) {
    return typeof password === "string" && password.length >= 6;
  },

  /**
   * Validate non-empty string after trim
   */
  isNotEmpty(value) {
    return typeof value === "string" && value.trim().length > 0;
  },

  /**
   * Validate registration form
   * Returns object: { valid: boolean, errors: { fieldName: 'message' } }
   */
  validateRegistration(data) {
    const errors = {};

    if (!this.isNotEmpty(data.fullname)) {
      errors.fullname = "Vui lòng nhập tên đại lý.";
    }
    if (!this.isValidEmail(data.email)) {
      errors.email = "Email không hợp lệ.";
    }
    if (!this.isValidPhone(data.phone)) {
      errors.phone = "Số điện thoại không hợp lệ (10-11 chữ số).";
    }
    if (!this.isNotEmpty(data.address)) {
      errors.address = "Vui lòng nhập địa chỉ nhận hàng.";
    }
    if (!this.isValidPassword(data.password)) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate login form
   */
  validateLogin(data) {
    const errors = {};
    if (!this.isValidEmail(data.email)) {
      errors.email = "Email không hợp lệ.";
    }
    if (!this.isNotEmpty(data.password)) {
      errors.password = "Vui lòng nhập mật khẩu.";
    }
    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate shipping address
   */
  validateAddress(data) {
    const errors = {};
    if (!this.isNotEmpty(data.addressLine1)) {
      errors.addressLine1 = "Vui lòng nhập địa chỉ.";
    }
    if (!this.isNotEmpty(data.province)) {
      errors.province = "Vui lòng chọn tỉnh/thành phố.";
    }
    if (!this.isNotEmpty(data.district)) {
      errors.district = "Vui lòng nhập quận/huyện.";
    }
    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

export default Validation;
