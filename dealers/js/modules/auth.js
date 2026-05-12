// js/modules/auth.js
import CONFIG from "../../config.js";
import Storage from "../utils/storage.js";
import { postJSON } from "../utils/api.js";

const Auth = {
  isAuthenticated() {
    return Storage.getDealerInfo() !== null;
  },

  getCurrentDealer() {
    return Storage.getDealerInfo();
  },

  async register(dealerData) {
    console.log("[Auth.register] Registering dealer:", dealerData.email);

    try {
      const payload = { action: "register", ...dealerData };
      const response = await postJSON(CONFIG.webhooks.registration, payload);

      console.log("[Auth.register] Response received:", JSON.stringify(response, null, 2));

      if (response && response.success) {
        console.log("[Auth.register] Registration successful");

        // Hỗ trợ nhiều format response
        const data = response.data || response || {};

        const minOrderQty = data.minOrderQuantity
          ? parseInt(data.minOrderQuantity, 10)
          : CONFIG.app.minOrderQuantity || 10;

        const dealer = {
          email: data.email || dealerData.email,
          fullname: data.fullname || data.name || dealerData.fullname || "",
          phone: data.phone || data.phoneNumber || dealerData.phone || "",
          address: data.address || data.deliveryAddress || dealerData.address || "",
          minOrderQuantity: minOrderQty,
          loginAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + CONFIG.app.sessionTimeout).toISOString()
        };

        console.log("[Auth.register] Dealer info:", {
          email: dealer.email,
          fullname: dealer.fullname,
          phone: dealer.phone
        });

        const saved = Storage.setDealerInfo(dealer);
        console.log("[Auth.register] Storage save result:", saved);

        return { success: true, dealer };
      } else {
        console.log("[Auth.register] Registration failed:", response);
        return { success: false, message: response?.message || "Đăng ký thất bại" };
      }
    } catch (err) {
      console.error("[Auth.register] Error:", err);
      return { success: false, message: "Lỗi kết nối. Vui lòng thử lại." };
    }
  },

  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();

    console.log("[Auth.login] Attempting login for:", cleanEmail);

    try {
      const loginPayload = { action: "login", email: cleanEmail, password };
      const response = await postJSON(CONFIG.webhooks.login, loginPayload);

      console.log("[Auth.login] Response received:", JSON.stringify(response, null, 2));

      if (response && response.success) {
        // Dealer info từ webhook response - hỗ trợ nhiều format
        const data = response.data || response || {};

        // Nếu webhook không trả về email, lấy từ input
        const dealerEmail = data.email || cleanEmail;

        const minOrderQty = data.minOrderQuantity
          ? parseInt(data.minOrderQuantity, 10)
          : CONFIG.app.minOrderQuantity || 10;

        const dealer = {
          email: dealerEmail,
          fullname: data.fullname || data.name || "",
          phone: data.phone || data.phoneNumber || "",
          address: data.address || data.deliveryAddress || "",
          minOrderQuantity: minOrderQty,
          loginAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + CONFIG.app.sessionTimeout).toISOString()
        };

        console.log("[Auth.login] Login successful, dealer info:", {
          email: dealer.email,
          fullname: dealer.fullname,
          phone: dealer.phone,
          address: dealer.address
        });

        console.log("[Auth.login] Raw response data:", JSON.stringify(data));

        // Lưu vào localStorage - LẬP LÀ LƯU CẢ KHI TRỐNG
        console.log("[Auth.login] Attempting to save dealer info to localStorage...");
        try {
          localStorage.setItem(CONFIG.storage.dealerInfo, JSON.stringify(dealer));
          console.log("[Auth.login] ✅ Successfully saved to localStorage");
          console.log("[Auth.login] Verification - Reading back from localStorage:");
          const verify = localStorage.getItem(CONFIG.storage.dealerInfo);
          console.log("[Auth.login] Read back:", verify);
        } catch (e) {
          console.error("[Auth.login] ❌ Failed to save to localStorage:", e);
        }

        return { success: true, dealer };
      } else {
        console.log("[Auth.login] Login failed:", response);
        return { success: false, message: response?.message || "Email hoặc mật khẩu không đúng" };
      }

    } catch (err) {
      console.error("[Auth.login] Error:", err);
      return { success: false, message: "Lỗi kết nối. Vui lòng thử lại." };
    }
  },

  logout() {
    localStorage.removeItem(CONFIG.storage.dealerInfo);
    localStorage.removeItem(CONFIG.storage.cart);
    localStorage.removeItem(CONFIG.storage.orderHistory);
    localStorage.removeItem(CONFIG.storage.lastFetch);
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      const isAlreadyOnLogin = window.location.pathname.endsWith("index.html") ||
                              window.location.pathname === "/" ||
                              window.location.pathname === CONFIG.paths.login;
      if (!isAlreadyOnLogin) {
        window.location.href = CONFIG.paths.login;
      }
      return false;
    }
    return true;
  },

  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      const isAlreadyOnDashboard = window.location.pathname.endsWith("dashboard.html");
      if (!isAlreadyOnDashboard) {
        window.location.href = CONFIG.paths.dashboard;
      }
      return true;
    }
    return false;
  },

  async updateProfile(updates) {
    const dealer = this.getCurrentDealer();
    if (!dealer) return { success: false, message: "Không tìm thấy tài khoản" };

    try {
      const payload = { action: "updateDealer", email: dealer.email, ...updates };
      const response = await postJSON(CONFIG.webhooks.registration, payload);

      if (response && response.success) {
        // Cập nhật trong localStorage
        const updated = {
          ...dealer,
          fullname: response.data?.fullname || updates.fullname || dealer.fullname,
          phone: response.data?.phone || updates.phone || dealer.phone,
          address: response.data?.address || updates.address || dealer.address
        };
        localStorage.setItem(CONFIG.storage.dealerInfo, JSON.stringify(updated));

        console.log("[Auth.updateProfile] Updated successfully");
        return { success: true, message: "Cập nhật thông tin thành công" };
      } else {
        return { success: false, message: response?.message || "Cập nhật thất bại" };
      }
    } catch (err) {
      console.error("[Auth.updateProfile] Error:", err);
      return { success: false, message: "Lỗi kết nối. Vui lòng thử lại." };
    }
  },

  async changePassword(email, currentPassword, newPassword) {
    console.log("[Auth.changePassword] Changing password for:", email);

    try {
      const payload = { action: "changePassword", email, currentPassword, newPassword };
      const response = await postJSON(CONFIG.webhooks.login, payload);

      if (response && response.success) {
        console.log("[Auth.changePassword] Password changed successfully");
        return { success: true, message: "Đổi mật khẩu thành công" };
      } else {
        return { success: false, message: response?.message || "Đổi mật khẩu thất bại" };
      }
    } catch (err) {
      console.error("[Auth.changePassword] Error:", err);
      return { success: false, message: "Lỗi kết nối. Vui lòng thử lại." };
    }
  }
};

export default Auth;
