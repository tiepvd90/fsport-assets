// js/modules/cart.js - Cart state & operations
import CONFIG from "../../config.js";
import Storage from "../utils/storage.js";

/**
 * Cart events:
 *   "change" — emitted whenever cart contents change
 * Subscribe via Cart.on(eventName, handler)
 */

const listeners = new Map();

const Cart = {
  /**
   * Get cart items (always returns array)
   */
  getItems() {
    const cart = Storage.getCart();
    return cart.items;
  },

  /**
   * Find item by productId
   */
  getItem(productId) {
    return this.getItems().find((item) => item.productId === productId);
  },

  /**
   * Get quantity of a single product (0 if absent)
   */
  getQuantity(productId) {
    const item = this.getItem(productId);
    return item ? item.quantity : 0;
  },

  /**
   * Set the quantity for a product (replaces). 0 removes it.
   * @param {object} product - Full product object {id, name, dealerPrice, ...}
   * @param {number} quantity
   */
  setQuantity(product, quantity) {
    const items = this.getItems();
    const idx = items.findIndex((i) => i.productId === product.id);

    quantity = Math.max(0, Math.floor(Number(quantity) || 0));

    // Use dealerPrice if available, fallback to price for backward compatibility
    const price = product.dealerPrice || product.price;

    if (quantity === 0) {
      if (idx >= 0) items.splice(idx, 1);
    } else if (idx >= 0) {
      items[idx].quantity = quantity;
      items[idx].price = price;
      items[idx].productName = product.name;
    } else {
      items.push({
        productId: product.id,
        productName: product.name,
        quantity,
        price: price,
      });
    }

    Storage.setCart(items);
    this._emit("change", { items });
  },

  /**
   * Increment quantity by 1
   */
  increment(product) {
    this.setQuantity(product, this.getQuantity(product.id) + 1);
  },

  /**
   * Decrement quantity by 1 (min 0)
   */
  decrement(product) {
    this.setQuantity(product, Math.max(0, this.getQuantity(product.id) - 1));
  },

  /**
   * Remove a single item
   */
  remove(productId) {
    const items = this.getItems().filter((i) => i.productId !== productId);
    Storage.setCart(items);
    this._emit("change", { items });
  },

  /**
   * Clear cart entirely
   */
  clear() {
    Storage.clearCart();
    this._emit("change", { items: [] });
  },

  /**
   * Compute total quantity (sum of all units)
   */
  totalQuantity() {
    return this.getItems().reduce((sum, i) => sum + (i.quantity || 0), 0);
  },

  /**
   * Compute total price (VND)
   */
  totalPrice() {
    return this.getItems().reduce(
      (sum, i) => sum + (i.quantity || 0) * (i.price || 0),
      0
    );
  },

  /**
   * Whether the cart meets minimum order quantity
   */
  meetsMinimum() {
    return this.totalQuantity() >= CONFIG.app.minOrderQuantity;
  },

  /**
   * Build the items payload to send with order webhook
   */
  toOrderItems() {
    return this.getItems().map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      price: i.price,
    }));
  },

  /**
   * Subscribe to cart events
   */
  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => listeners.get(event)?.delete(handler);
  },

  _emit(event, payload) {
    listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error("[Cart] listener error:", err);
      }
    });
  },
};

export default Cart;
