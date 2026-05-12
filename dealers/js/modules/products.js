// js/modules/products.js - Product loading & lookup
import CONFIG from "../../config.js";
import Storage from "../utils/storage.js";
import API from "../utils/api.js";

const Products = {
  _cache: null,

  /**
   * Clear all caches (memory and localStorage)
   */
  clearAllCaches() {
    console.log("[Products.clearAllCaches] Clearing memory cache and localStorage");
    this._cache = null;
    Storage.remove(CONFIG.storage.products);
  },

  /**
   * Load all products. Caches in memory and localStorage.
   */
  async load(forceRefresh = false) {
    console.log("[Products.load] ===== PRODUCTS LOAD START =====");
    console.log("[Products.load] forceRefresh:", forceRefresh);

    if (!forceRefresh && this._cache) {
      console.log("[Products.load] ✅ Returning cached products (in-memory):", this._cache.length, "items");
      return this._cache;
    }

    if (!forceRefresh) {
      const cached = Storage.get(CONFIG.storage.products);
      console.log("[Products.load] Checking localStorage with key:", CONFIG.storage.products);
      console.log("[Products.load] localStorage cached data:", cached ? `${cached.length} items` : "null");
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log("[Products.load] ✅ Returning products from localStorage:", cached.length, "items");
        this._cache = cached;
        console.log("[Products.load] First product sample:", cached[0]);
        return cached;
      }
    }

    try {
      console.log("[Products.load] 🔄 Fetching products from:", CONFIG.paths.products);
      const products = await API.fetchProducts();

      console.log("[Products.load] 📨 Response received, type:", typeof products, "isArray:", Array.isArray(products));
      console.log("[Products.load] Full response:", JSON.stringify(products, null, 2).substring(0, 500));

      if (!Array.isArray(products)) {
        console.error("[Products.load] ❌ Response is not an array:", products);
        throw new Error("Invalid products format");
      }

      console.log("[Products.load] ✅ Loaded", products.length, "products");

      // Log each product's key info
      products.forEach((p, idx) => {
        console.log(`[Products.load] Product ${idx + 1}: id=${p.id}, name=${p.name}, image=${p.image}`);
      });

      this._cache = products;
      Storage.set(CONFIG.storage.products, products);
      console.log("[Products.load] 💾 Saved to localStorage");
      return products;
    } catch (err) {
      console.error("[Products.load] ❌ Error fetching products:", err);
      console.error("[Products.load] Error stack:", err.stack);

      // Return last cached version if available
      const cached = Storage.get(CONFIG.storage.products);
      console.log("[Products.load] Attempting fallback to cached products:", cached ? `${cached.length} items` : "null");
      if (cached && Array.isArray(cached)) {
        console.log("[Products.load] ✅ Falling back to cached products");
        this._cache = cached;
        return cached;
      }
      console.warn("[Products.load] ⚠️ No products available, returning empty array");
      return [];
    }
  },

  /**
   * Find a product by ID
   */
  findById(id) {
    if (!this._cache) return null;
    return this._cache.find((p) => p.id === id) || null;
  },

  /**
   * Get all products synchronously (must call load() first)
   */
  getAll() {
    return this._cache || [];
  },

  /**
   * Group products by category
   */
  groupByCategory() {
    const products = this.getAll();
    return products.reduce((acc, p) => {
      const cat = p.category || "Khác";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});
  },
};

export default Products;
