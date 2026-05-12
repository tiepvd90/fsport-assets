// js/utils/storage.js - localStorage helpers
import CONFIG from "../../config.js";

const Storage = {
  /**
   * Get a value from localStorage and parse JSON
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`[Storage.get] Failed to parse key "${key}":`, err);
      return null;
    }
  },

  /**
   * Set a value to localStorage (auto-stringify)
   * @param {string} key
   * @param {any} value
   * @returns {boolean}
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[Storage.set] Failed to set key "${key}":`, err);
      return false;
    }
  },

  /**
   * Remove a single key
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`[Storage.remove] Failed:`, err);
    }
  },

  /**
   * Clear all F-Sport related data only
   */
  clearAll() {
    Object.values(CONFIG.storage).forEach((key) => {
      this.remove(key);
    });
  },

  /**
   * Get dealer info (with session expiry validation)
   * Returns null if missing or expired (and clears expired data)
   */
  getDealerInfo() {
    const info = this.get(CONFIG.storage.dealerInfo);
    if (!info) {
      console.warn("[Storage.getDealerInfo] ⚠️ No dealer info in localStorage");
      return null;
    }

    console.log("[Storage.getDealerInfo] Found info:", info);

    // Require email to be a valid dealer object
    if (!info.email) {
      console.warn("[Storage.getDealerInfo] ⚠️ No email in dealer info, removing");
      this.remove(CONFIG.storage.dealerInfo);
      return null;
    }

    // Validate session expiry — if no expiresAt, still accept the data but log warning
    if (!info.expiresAt) {
      console.warn("[Storage.getDealerInfo] ⚠️ No expiresAt in dealer info, accepting anyway (legacy or immediate data)");
      // Continue without removing - this might be intentional for testing
    } else {
      const expiresAt = new Date(info.expiresAt).getTime();
      if (isNaN(expiresAt)) {
        console.warn("[Storage.getDealerInfo] ⚠️ Invalid expiresAt date format:", info.expiresAt);
        // Continue anyway - data is still usable even if expiry is malformed
      } else if (Date.now() > expiresAt) {
        console.warn("[Storage.getDealerInfo] ⚠️ Session expired at:", info.expiresAt, "Current time:", new Date(Date.now()).toISOString());
        this.remove(CONFIG.storage.dealerInfo);
        return null;
      }
    }

    console.log("[Storage.getDealerInfo] ✅ Valid dealer info retrieved:", {
      email: info.email,
      fullname: info.fullname,
      expiresAt: info.expiresAt,
    });
    return info;
  },

  /**
   * Save dealer info with session expiry
   */
  setDealerInfo(info) {
    const now = Date.now();
    const data = {
      ...info,
      loginAt: info.loginAt || new Date(now).toISOString(),
      expiresAt: new Date(now + CONFIG.app.sessionTimeout).toISOString(),
    };
    console.log("[Storage.setDealerInfo] ✅ Saving dealer info:", {
      email: data.email,
      fullname: data.fullname,
      phone: data.phone,
      address: data.address,
      expiresAt: data.expiresAt,
    });
    const result = this.set(CONFIG.storage.dealerInfo, data);
    if (result) {
      console.log("[Storage.setDealerInfo] ✅ Successfully saved to localStorage");
    } else {
      console.error("[Storage.setDealerInfo] ❌ Failed to save to localStorage!");
    }
    return result;
  },

  /**
   * Update partial dealer info (e.g. address) without changing session expiry
   */
  updateDealerInfo(partial) {
    const existing = this.get(CONFIG.storage.dealerInfo);
    if (!existing) return false;
    const merged = { ...existing, ...partial };
    return this.set(CONFIG.storage.dealerInfo, merged);
  },

  /**
   * Get cart from localStorage
   */
  getCart() {
    const cart = this.get(CONFIG.storage.cart);
    if (!cart || !Array.isArray(cart.items)) {
      return { items: [], lastUpdated: null };
    }
    return cart;
  },

  /**
   * Save cart
   */
  setCart(items) {
    return this.set(CONFIG.storage.cart, {
      items,
      lastUpdated: new Date().toISOString(),
    });
  },

  /**
   * Clear cart
   */
  clearCart() {
    this.remove(CONFIG.storage.cart);
  },
};

export default Storage;
