// js/modules/orders.js - Order creation & history fetching
import CONFIG from "../../config.js";
import Storage from "../utils/storage.js";
import API, { postJSON } from "../utils/api.js";

const Orders = {
  /**
   * Submit a new order to the createOrder webhook
   * @param {object} dealer - dealer info (email, fullname, phone, address)
   * @param {Array} items - cart items
   * @returns {Promise<{success, message, orderId?}>}
   */
  async create(dealer, items) {
    const totalQuantity = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const totalPrice = items.reduce(
      (s, i) => s + (i.quantity || 0) * (i.price || 0),
      0
    );

    const orderPayload = {
      dealerEmail: dealer.email,
      dealerFullname: dealer.fullname,
      dealerPhone: dealer.phone,
      items: items,
      totalQuantity: totalQuantity,
      totalPrice: totalPrice,
      shippingAddress: dealer.address,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await API.createOrder(orderPayload);
      const success = res && (res.success === true || res.success === "true");
      return {
        success: success,
        message: (res && res.message) || (success ? "Order created" : "Order failed"),
        orderId: (res && res.data && res.data.orderId) || (res && res.orderId) || null,
        status: (res && res.data && res.data.status) || (res && res.status) || CONFIG.orderStatus?.confirmed || "Confirmed",
        raw: res,
      };
    } catch (err) {
      console.error("[Orders.create] failed:", err);
      return {
        success: false,
        message: CONFIG.messages?.error?.orderFailed || "Đặt hàng thất bại, vui lòng thử lại.",
      };
    }
  },

  /**
   * Parse items JSON from Make.com
   * Items can be: "[{object}]" string or actual array or "[{...},{...}]"
   * @param {string|Array} itemsData - Raw items data from Make.com key "4"
   * @returns {Array} - Array of items or empty array
   */
  _parseItems(itemsData) {
    if (!itemsData) return [];

    // If already an array, return it
    if (Array.isArray(itemsData)) {
      return itemsData;
    }

    // If string, try to parse
    if (typeof itemsData === 'string') {
      const trimmed = itemsData.trim();
      if (!trimmed || trimmed === "" || trimmed === "[{object}]") {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn("[Orders._parseItems] Failed to parse items:", itemsData, e.message);
        return [];
      }
    }

    return [];
  },

  /**
   * Convert Make.com numeric key format to standard order format
   * Input: {"0": "orderId", "4": "items JSON", "5": "qty", "6": "price", "7": "address", "8": "status", "9": "date"}
   * Output: {orderId, items, totalQuantity, totalPrice, shippingAddress, status, createdAt}
   * @param {object} item - Raw item from Make.com
   * @returns {object|null} - Normalized order or null if invalid
   */
  _normalizeOrderFromMakeFormat(item) {
    if (!item || typeof item !== 'object') {
      console.warn("[Orders._normalizeOrderFromMakeFormat] Invalid item:", item);
      return null;
    }

    // Extract values from numeric keys
    const orderId = item["0"];
    const itemsData = item["4"];        // NEW: Parse items
    const totalQuantity = item["5"];
    const totalPrice = item["6"];
    const shippingAddress = item["7"];
    const status = item["8"];
    const createdAt = item["9"];

    // Validate required fields
    if (!orderId || !status || !createdAt) {
      console.warn("[Orders._normalizeOrderFromMakeFormat] Missing required fields:", { orderId, status, createdAt });
      return null;
    }

    return {
      orderId: String(orderId).trim(),
      items: this._parseItems(itemsData),        // NEW: Include parsed items
      totalQuantity: parseInt(totalQuantity || 0),
      totalPrice: parseInt(totalPrice || 0),
      shippingAddress: String(shippingAddress || "").trim(),
      status: String(status).trim(),
      createdAt: String(createdAt).trim()
    };
  },

  /**
   * Fix invalid JSON format from Make.com
   * Make.com sometimes returns: {"data": {...}, {...}}
   * Which is invalid JSON. Convert to valid array format.
   * @param {string} jsonString - Raw JSON string
   * @returns {string|null} - Fixed JSON string or null if can't fix
   */
  _fixInvalidJSON(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') return null;

    let fixed = jsonString.trim();

    // Try simple approach: Replace "data": { with "data": [{
    // and replace }, { with }, {
    // and ensure closing bracket

    // Step 1: Find "data": and what comes after
    const dataIndex = fixed.indexOf('"data"');
    if (dataIndex === -1) return null;

    // Step 2: Find the colon after "data"
    const colonIndex = fixed.indexOf(':', dataIndex);
    if (colonIndex === -1) return null;

    const beforeData = fixed.substring(0, colonIndex + 1);
    let afterData = fixed.substring(colonIndex + 1).trim();

    // Step 3: Check if we have pattern: { ... }, { ... }
    if (!afterData.startsWith('{')) return null;

    // Step 4: Count braces and find all top-level objects
    const objects = [];
    let currentObj = '';
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < afterData.length; i++) {
      const char = afterData[i];

      if (escapeNext) {
        currentObj += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        currentObj += char;
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        currentObj += char;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
          currentObj += char;
        } else if (char === '}') {
          braceCount--;
          currentObj += char;

          // Complete object found
          if (braceCount === 0) {
            objects.push(currentObj.trim());
            currentObj = '';

            // Skip comma and whitespace
            let j = i + 1;
            while (j < afterData.length && (afterData[j] === ',' || afterData[j] === ' ')) {
              j++;
            }
            i = j - 1;
          }
        } else if (char === ',' && braceCount === 0) {
          // Skip commas between objects
          continue;
        } else {
          currentObj += char;
        }
      } else {
        currentObj += char;
      }
    }

    // Step 5: Wrap objects in array and rebuild JSON
    if (objects.length > 0) {
      const arrayStr = '[' + objects.join(', ') + ']';
      fixed = beforeData + ' ' + arrayStr + '}';
      console.log("[Orders._fixInvalidJSON] Fixed: found", objects.length, "objects");
      return fixed;
    }

    return null;
  },

  /**
   * Parse response that might be wrapped in string
   * Handles invalid JSON from Make.com
   * @param {object} res - Response object
   * @returns {object} - Parsed response with actual data
   */
  _parseResponseData(res) {
    if (!res) return null;

    let actualData = res.data;

    // Try to parse if data is string
    if (typeof actualData === 'string') {
      try {
        actualData = JSON.parse(actualData);
        console.log("[Orders._parseResponseData] Parsed data from string:", actualData);
        return actualData;
      } catch (e) {
        console.warn("[Orders._parseResponseData] Failed to parse data string:", e.message);
      }
    }

    // If data already looks good, return it
    if (actualData && typeof actualData === 'object') {
      console.log("[Orders._parseResponseData] Data is already object/array");
      return actualData;
    }

    // If no data field, try message or raw field containing JSON
    if (!actualData && (res.message || res.raw)) {
      let jsonString = res.message || res.raw;

      if (typeof jsonString === 'string') {
        // Try to parse as-is first
        try {
          const parsed = JSON.parse(jsonString);
          actualData = parsed.data || parsed;
          console.log("[Orders._parseResponseData] Parsed message/raw directly");
          return actualData;
        } catch (e1) {
          console.warn("[Orders._parseResponseData] Direct parse failed, trying to fix JSON...");

          // Try to fix invalid JSON
          const fixed = this._fixInvalidJSON(jsonString);
          if (fixed) {
            try {
              const parsed = JSON.parse(fixed);
              actualData = parsed.data || parsed;
              console.log("[Orders._parseResponseData] Parsed after fixing JSON");
              return actualData;
            } catch (e2) {
              console.warn("[Orders._parseResponseData] Failed to parse fixed JSON:", e2.message);
            }
          }
        }
      }
    }

    console.warn("[Orders._parseResponseData] Could not extract or parse data");
    return null;
  },

  /**
   * Fetch order history for the current dealer
   *
   * Handles Make.com response format (may be wrapped in string):
   * {
   *   "success": true,
   *   "data": {
   *     "0": "FSP-20260510124237-7C35",
   *     "5": "11",
   *     "6": "4990000",
   *     "7": "Thôn Đông...",
   *     "8": "Confirmed",
   *     "9": "2026-05-10T05:42:37.815Z"
   *   }
   * }
   *
   * @param {string} dealerEmail
   * @returns {Promise<{success, orders, message?}>}
   */
  async fetchHistory(dealerEmail) {
    const url = CONFIG.webhooks.fetchOrders;
    const hasWebhook = url && url.startsWith("http");

    if (!hasWebhook) {
      console.warn("[Orders.fetchHistory] No fetchOrders webhook configured.");
      const cached = Storage.get(CONFIG.storage?.orderHistory) || [];
      return { success: true, orders: cached, fromCache: true };
    }

    try {
      const res = await API.fetchOrders(dealerEmail);
      console.log("[Orders.fetchHistory] Raw API response:", JSON.stringify(res, null, 2));

      let orders = [];

      // Parse response data (might be wrapped in string)
      const data = this._parseResponseData(res);

      if (!data) {
        console.warn("[Orders.fetchHistory] No data found after parsing");
        return { success: false, orders: [], message: "No data received" };
      }

      console.log("[Orders.fetchHistory] Parsed data:", data);

      // ============================================================
      // Case 1: data is an ARRAY of objects with numeric keys
      // Example: [{"0": "...", "5": "...", ...}, {"0": "...", ...}]
      // ============================================================
      if (Array.isArray(data)) {
        console.log("[Orders.fetchHistory] Data is array, processing", data.length, "items");
        orders = data
          .map(item => this._normalizeOrderFromMakeFormat(item))
          .filter(item => item !== null);
      }
      // ============================================================
      // Case 2: data is an OBJECT - check structure
      // ============================================================
      else if (typeof data === 'object') {
        const keys = Object.keys(data);
        console.log("[Orders.fetchHistory] Data is object with keys:", keys);

        // Check if looks like a single order (numeric keys like "0", "5", "6", etc)
        const isNumericKeysOrder = keys.some(k => ["0", "5", "6", "7", "8", "9"].includes(k));

        if (isNumericKeysOrder) {
          console.log("[Orders.fetchHistory] Detected single order with numeric keys");
          const normalized = this._normalizeOrderFromMakeFormat(data);
          if (normalized) {
            orders = [normalized];
          }
        } else {
          // Multiple orders as object properties
          console.log("[Orders.fetchHistory] Data is object with multiple orders");
          const itemsArray = Object.values(data).filter(v => v && typeof v === 'object');
          console.log("[Orders.fetchHistory] Found", itemsArray.length, "order objects");

          orders = itemsArray
            .map(item => this._normalizeOrderFromMakeFormat(item))
            .filter(item => item !== null);
        }
      }

      console.log("[Orders.fetchHistory] Processed", orders.length, "valid orders:", orders);

      // Sort by newest first
      orders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
      });

      // Save to cache
      if (CONFIG.storage?.orderHistory) {
        Storage.set(CONFIG.storage.orderHistory, orders);
      }
      if (CONFIG.storage?.lastFetch) {
        Storage.set(CONFIG.storage.lastFetch, new Date().toISOString());
      }

      return { success: true, orders: orders };
    } catch (err) {
      console.error("[Orders.fetchHistory] Error:", err);
      const cached = Storage.get(CONFIG.storage?.orderHistory) || [];
      return {
        success: false,
        orders: cached,
        message: CONFIG.messages?.error?.networkError || "Lỗi kết nối mạng",
        error: err.message
      };
    }
  },

  /**
   * Get cached order history
   * @returns {Array}
   */
  getCachedHistory() {
    return Storage.get(CONFIG.storage?.orderHistory) || [];
  },

  /**
   * Clear cached order history
   */
  clearCache() {
    if (CONFIG.storage?.orderHistory) {
      Storage.remove(CONFIG.storage.orderHistory);
    }
  },

  /**
   * Cancel an order (change status to cancelled)
   * @param {string} dealerEmail - dealer email
   * @param {string} orderId - order ID to cancel
   * @returns {Promise<{success, message}>}
   */
  async cancelOrder(dealerEmail, orderId) {
    try {
      console.log("[Orders.cancelOrder] Cancelling order:", orderId, "for dealer:", dealerEmail);

      const payload = {
        action: "cancelOrder",
        dealerEmail: dealerEmail,
        orderId: orderId,
        status: "Cancelled",
        cancelledAt: new Date().toISOString()
      };

      const res = await postJSON(CONFIG.webhooks.createOrder, payload);
      console.log("[Orders.cancelOrder] Response:", res);

      const success = res && (res.success === true || res.success === "true");
      return {
        success: success,
        message: (res && res.message) || (success ? "Đơn hàng đã được hủy" : "Hủy đơn hàng thất bại")
      };
    } catch (err) {
      console.error("[Orders.cancelOrder] Error:", err);
      return {
        success: false,
        message: "Lỗi kết nối khi hủy đơn hàng"
      };
    }
  }
};

export default Orders;