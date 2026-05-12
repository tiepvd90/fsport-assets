// js/pages/account.js - Account information page logic
import CONFIG from "../../config.js";
import Validation from "../utils/validation.js";
import UI from "../utils/ui.js";
import Auth from "../modules/auth.js";
import BrandingUtils from "../utils/branding.js";

function loadAccountInfo() {
  const dealer = Auth.getCurrentDealer();
  if (!dealer) return;

  document.getElementById("accFullname").value = dealer.fullname || "";
  document.getElementById("accEmail").value = dealer.email || "";
  document.getElementById("accPhone").value = dealer.phone || "";
  document.getElementById("accAddress").value = dealer.address || "";
}

function validateAccountForm(data) {
  const errors = {};

  if (!Validation.isNotEmpty(data.fullname)) {
    errors.fullname = "Vui lòng nhập tên đại lý.";
  }

  if (!Validation.isNotEmpty(data.phone)) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!Validation.isValidPhone(data.phone)) {
    errors.phone = "Số điện thoại không hợp lệ.";
  }

  if (!Validation.isNotEmpty(data.address)) {
    errors.address = "Vui lòng nhập địa chỉ nhận hàng.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function validatePasswordForm(data) {
  const errors = {};

  if (!Validation.isNotEmpty(data.currentPassword)) {
    errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
  }

  if (!Validation.isNotEmpty(data.newPassword)) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (data.newPassword.length < 6) {
    errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự.";
  }

  if (!Validation.isNotEmpty(data.confirmPassword)) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function getAccountFormData(form) {
  const fd = new FormData(form);
  return {
    fullname: (fd.get("fullname") || "").toString().trim(),
    phone: (fd.get("phone") || "").toString().trim(),
    address: (fd.get("address") || "").toString().trim(),
  };
}

function getPasswordFormData(form) {
  const fd = new FormData(form);
  return {
    currentPassword: (fd.get("currentPassword") || "").toString(),
    newPassword: (fd.get("newPassword") || "").toString(),
    confirmPassword: (fd.get("confirmPassword") || "").toString(),
  };
}

async function handleAccountSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');

  UI.clearFormErrors(form);

  const data = getAccountFormData(form);
  const validation = validateAccountForm(data);

  if (!validation.valid) {
    UI.applyFormErrors(validation.errors, form);
    UI.toast("Vui lòng điền đầy đủ tất cả thông tin bắt buộc", "warning");
    return;
  }

  UI.setButtonLoading(submitBtn, true, "Đang lưu...");

  try {
    const result = await Auth.updateProfile(data);

    if (result.success) {
      UI.toast("Cập nhật thông tin thành công", "success");
      loadAccountInfo();
    } else {
      throw new Error(result.message || "Lỗi cập nhật");
    }
  } catch (err) {
    console.error("[account] Update error:", err);
    UI.toast(err.message || "Không thể cập nhật thông tin. Vui lòng thử lại.", "error");
  } finally {
    UI.setButtonLoading(submitBtn, false);
  }
}

async function handlePasswordSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');

  UI.clearFormErrors(form);

  const data = getPasswordFormData(form);
  const validation = validatePasswordForm(data);

  if (!validation.valid) {
    UI.applyFormErrors(validation.errors, form);
    UI.toast("Vui lòng kiểm tra thông tin mật khẩu", "warning");
    return;
  }

  UI.setButtonLoading(submitBtn, true, "Đang đổi...");

  try {
    const dealer = Auth.getCurrentDealer();
    if (!dealer) {
      throw new Error("Không tìm thấy tài khoản");
    }

    const result = await Auth.changePassword(dealer.email, data.currentPassword, data.newPassword);

    if (result.success) {
      UI.toast("Đổi mật khẩu thành công", "success");
      // Clear password fields
      form.reset();
    } else {
      throw new Error(result.message || "Lỗi đổi mật khẩu");
    }
  } catch (err) {
    console.error("[account] Password change error:", err);
    UI.toast(err.message || "Không thể đổi mật khẩu. Vui lòng thử lại.", "error");
  } finally {
    UI.setButtonLoading(submitBtn, false);
  }
}

function init() {
  // Inject logo từ config
  try {
    const logoElement = document.getElementById("headerLogo");
    if (logoElement) {
      logoElement.innerHTML = BrandingUtils.getLogoBrandingHTML(CONFIG.paths.dashboard);
      console.log("[Account] ✅ Logo injected");
    }
  } catch (err) {
    console.error("[Account] ❌ Logo injection failed:", err);
  }

  // Require authentication
  if (!Auth.requireAuth()) return;

  // Update welcome message
  const dealer = Auth.getCurrentDealer();
  const welcomeEl = document.getElementById("dashboardWelcome");
  if (welcomeEl && dealer) {
    const name = dealer.fullname || dealer.email || "";
    welcomeEl.innerHTML = name ? `Xin chào, <strong>${UI.escapeHtml(name)}</strong>` : `Xin chào`;
  }

  loadAccountInfo();

  // Account form
  const accountForm = document.getElementById("accountForm");
  if (accountForm) {
    accountForm.addEventListener("submit", handleAccountSubmit);
  }

  const accountCancelBtn = document.getElementById("accountCancel");
  if (accountCancelBtn) {
    accountCancelBtn.addEventListener("click", () => {
      window.location.href = CONFIG.paths.dashboard;
    });
  }

  // Password form
  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordSubmit);
  }

  const passwordCancelBtn = document.getElementById("passwordCancel");
  if (passwordCancelBtn) {
    passwordCancelBtn.addEventListener("click", () => {
      passwordForm.reset();
      UI.clearFormErrors(passwordForm);
    });
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.logout();
      window.location.href = CONFIG.paths.login;
    });
  }
}

export default { init };
