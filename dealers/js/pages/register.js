// js/pages/register.js - Registration page logic
import CONFIG from "../../config.js";
import Validation from "../utils/validation.js";
import API from "../utils/api.js";
import UI from "../utils/ui.js";
import Auth from "../modules/auth.js";
import Products from "../modules/products.js";
import BrandingUtils from "../utils/branding.js";

async function loadProductsPreview() {
  const grid = UI.$("#productsPreviewGrid");
  if (!grid) return;
  try {
    const products = await Products.load();
    const preview = products.slice(0, 6);
    grid.innerHTML = preview
      .map(
        (p) => `
        <article class="preview-card">
          <img src="${UI.escapeHtml(p.image)}" alt="${UI.escapeHtml(p.name)}"
               onerror="this.src='./assets/images/placeholder.svg'">
          <div class="preview-card-body">
            <h4>${UI.escapeHtml(p.name)}</h4>
            <div class="price">${UI.formatCurrency(p.price)}</div>
          </div>
        </article>
      `
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<p class="text-muted">Không tải được danh sách sản phẩm.</p>`;
  }
}

function getFormData(form) {
  const fd = new FormData(form);
  return {
    fullname: (fd.get("fullname") || "").toString().trim(),
    email: (fd.get("email") || "").toString().trim().toLowerCase(),
    phone: (fd.get("phone") || "").toString().trim(),
    address: (fd.get("address") || "").toString().trim(),
    password: (fd.get("password") || "").toString(),
    confirmPassword: (fd.get("confirmPassword") || "").toString(),
  };
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');

  UI.clearFormErrors(form);

  const data = getFormData(form);
  const { valid, errors } = Validation.validateRegistration(data);
  if (!valid) {
    UI.applyFormErrors(errors, form);
    UI.toast("Vui lòng điền đầy đủ tất cả thông tin", "warning");
    return;
  }

  UI.setButtonLoading(submitBtn, true, "Đang đăng ký...");

  try {
    // Gọi webhook để đăng ký
    const registerResult = await Auth.register({
      fullname: data.fullname,
      email: data.email,
      phone: data.phone,
      address: data.address,
      password: data.password,
    });

    if (registerResult.success) {
      // Đăng ký thành công - tự động chuyển vào dashboard (không cần thông báo)
      form.reset();
      console.log("[register] Registration successful, redirecting to dashboard in 500ms");

      // Track Lead event for Meta pixel
      if (typeof trackBothPixels === 'function') {
        trackBothPixels('Lead', {
          content_name: 'Dealer Registration',
          content_category: 'Wholesale Dealer',
          status: 'completed'
        });
        console.log("[register] Lead event tracked for Meta pixel");
      }

      // Delay a bit to ensure all data is saved
      setTimeout(() => {
        window.location.href = CONFIG.paths.dashboard;
      }, 500);
    } else {
      // Đăng ký thất bại - hiển thị lỗi
      throw new Error(registerResult.message || "Đăng ký thất bại");
    }
  } catch (err) {
    console.error("[register] Submission error:", err);
    UI.setButtonLoading(submitBtn, false);

    // Hiển thị popup lỗi
    UI.showModal({
      title: "Lỗi đăng ký",
      body: `<p>${err.message || "Đăng ký thất bại. Vui lòng thử lại."}</p>`,
      buttons: [
        {
          label: "Đóng",
          className: "btn-primary",
          onClick: () => {
            return true;
          },
        },
      ],
      closeOnBackdrop: true,
    });
  }
}

function init() {
  // Inject logo từ config
  try {
    const logoElement = document.getElementById("headerLogo");
    if (logoElement) {
      logoElement.innerHTML = BrandingUtils.getLogoBrandingHTML();
      console.log("[Register] ✅ Logo injected");
    }
  } catch (err) {
    console.error("[Register] ❌ Logo injection failed:", err);
  }

  // If already logged in, jump to dashboard
  if (Auth.redirectIfAuthenticated()) return;

  loadProductsPreview();

  const form = UI.$("#registerForm");
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  // Smooth scroll for hero CTA
  const ctaBtn = UI.$("#ctaRegister");
  if (ctaBtn) {
    ctaBtn.addEventListener("click", (e) => {
      e.preventDefault();
      UI.$("#registerForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

export default { init };
