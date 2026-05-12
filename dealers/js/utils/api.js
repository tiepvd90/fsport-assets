// js/utils/api.js - Make.com webhook API helpers
import CONFIG from "../../config.js";
import mockWebhook from "./mockWebhook.js";

/**
 * POST request to a webhook URL with timeout and retry
 * @param {string} url
 * @param {object} payload
 * @param {object} options
 * @returns {Promise<object>}
 */
async function postJSON(url, payload, options = {}) {
  const {
    timeout = CONFIG.api.timeout,
    retries = CONFIG.api.retries,
    method = "POST",
  } = options;

  // Use mock webhook for local testing
  const useMockWebhook = false; // Set to false to use real Make.com webhooks
  if (useMockWebhook) {
    try {
      console.log(`[API] Using mock webhook for: ${url}`);
      const result = await mockWebhook.handle(url, payload);
      return result;
    } catch (err) {
      console.error(`[API] Mock webhook error:`, err);
      throw err;
    }
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
      };

      if (method !== "GET" && method !== "HEAD") {
        fetchOptions.body = JSON.stringify(payload);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Try to parse JSON; Make.com sometimes returns plain text
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : { success: true };
      } catch {
        // If response is plain text like "Accepted", consider it success
        data = { success: true, message: text || "OK", raw: text };
      }

      return data;
    } catch (err) {
      lastError = err;
      console.warn(`[API] Attempt ${attempt + 1} failed:`, err.message);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Request failed");
}

/**
 * Fetch a JSON file (e.g. products.json) with timeout
 */
async function fetchJSON(url, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`[API.fetchJSON] Failed to fetch ${url}:`, err);
    throw err;
  }
}

const API = {
  /**
   * Submit dealer registration
   */
  async register(dealerData) {
    const payload = {
      action: "register",
      ...dealerData,
      createdAt: new Date().toISOString(),
    };
    return postJSON(CONFIG.webhooks.registration, payload);
  },

  /**
   * Login (server-side validation via webhook). Optional - app may use localStorage.
   */
  async login(email, password) {
    const payload = {
      action: "login",
      email,
      password,
    };
    return postJSON(CONFIG.webhooks.login, payload);
  },

  /**
   * Submit a new order
   */
  async createOrder(orderData) {
    const payload = {
      action: "createOrder",
      ...orderData,
      createdAt: new Date().toISOString(),
    };
    return postJSON(CONFIG.webhooks.createOrder, payload);
  },

  /**
   * Fetch order history for a dealer
   */
  async fetchOrders(dealerEmail) {
    const payload = {
      action: "fetchOrders",
      dealerEmail,
    };
    return postJSON(CONFIG.webhooks.fetchOrders, payload);
  },

  /**
   * Fetch products from local JSON
   */
  async fetchProducts() {
    return fetchJSON(CONFIG.paths.products);
  },

  /**
   * Update dealer profile or password
   * Uses createOrder webhook (handles updateDealer action)
   */
  async updateDealer(updateData) {
    const payload = {
      action: "updateDealer",
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    return postJSON(CONFIG.webhooks.createOrder, payload);
  },

  /**
   * Update only dealer address
   * Uses createOrder webhook (handles updateDealerAddress action)
   */
  async updateDealerAddress(dealerEmail, address) {
    const payload = {
      action: "updateDealerAddress",
      dealerEmail,
      address,
      updatedAt: new Date().toISOString(),
    };
    return postJSON(CONFIG.webhooks.createOrder, payload);
  },
};

export default API;
export { postJSON, fetchJSON };
