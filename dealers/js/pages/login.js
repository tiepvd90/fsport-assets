// js/pages/login.js - Login page logic
import CONFIG from "../../config.js";
import Validation from "../utils/validation.js";
import UI from "../utils/ui.js";
import Auth from "../modules/auth.js";
import BrandingUtils from "../utils/branding.js";

function getFormData(form) {
  const fd = new FormData(form);
  return {
    email: (fd.get("email") || "").toString().trim().toLowerCase(),
    password: (fd.get("password") || "").toString(),
  };
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');

  UI.clearFormErrors(form);

  const data = getFormData(form);
  const { valid, errors } = Validation.validateLogin(data);
  if (!valid) {
    UI.applyFormErrors(errors, form);
    return;
  }

  UI.setButtonLoading(submitBtn, true, "Đang đăng nhập...");

  try {
    const res = await Auth.login(data.email, data.password);
    if (res.success) {
      // Đăng nhập thành công - chuyển dashboard
      window.location.href = CONFIG.paths.dashboard;
    } else {
      // Đăng nhập thất bại - hiển thị lỗi
      UI.setFieldError("password", res.message || CONFIG.messages.error.invalidCredentials, form);
      UI.setButtonLoading(submitBtn, false);
    }
  } catch (err) {
    console.error("[login] error:", err);
    UI.toast(CONFIG.messages.error.networkError, "danger");
    UI.setButtonLoading(submitBtn, false);
  }
}

function init() {
  // Inject logo từ config
  try {
    const logoElement = document.getElementById("headerLogo");
    if (logoElement) {
      logoElement.innerHTML = BrandingUtils.getLogoBrandingHTML("./register.html");
      console.log("[Login] ✅ Logo injected");
    }
  } catch (err) {
    console.error("[Login] ❌ Logo injection failed:", err);
  }

  // If a session exists, jump straight to dashboard
  if (Auth.redirectIfAuthenticated()) return;

  // Show "session expired" if we got here from a protected page
  const params = new URLSearchParams(window.location.search);
  if (params.get("expired") === "1") {
    UI.toast(CONFIG.messages.error.sessionExpired, "warning", 5000);
  }
  if (params.get("loggedout") === "1") {
    UI.toast(CONFIG.messages.success.loggedOut, "info", 3000);
  }

  const form = UI.$("#loginForm");
  if (form) form.addEventListener("submit", handleSubmit);
}

export default { init };
