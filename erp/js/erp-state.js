// ===== ERP STATE =====

window.ERP_STATE = {

  products: [],
  grouped: [],
  groupMap: {},
   cashflowLogs: [],  // lưu lịch sử thu chi
  searchKeyword: "",
  searchResult: [],

  currentGroup: null,

  // ===== INTERNAL =====
  _isLoading: false, // chống gọi API trùng

  // ===== CACHE CONFIG =====
  CACHE_KEY: "inventory_cache",
  CACHE_TIME_KEY: "inventory_cache_time",
  CACHE_TTL: 60 * 60 * 1000, // 1 tiếng

  // ===== INIT =====
  async init() {

    // ❗ tránh init nhiều lần
    if (this._isLoading) {
      ERP_CONFIG.log("⚠️ init bị gọi lại, bỏ qua");
      return;
    }

    this._isLoading = true;

    this.products = [];
    this.grouped = [];
    this.groupMap = {};
    this.searchResult = [];
    this.currentGroup = null;

    const data = await this.loadProducts();
    this.setProducts(data);

    this._isLoading = false;
  },

  // ===== LOAD PRODUCTS =====
async loadProducts(force = false) {
  const now = Date.now();
  const cachedData = localStorage.getItem(this.CACHE_KEY);
  const cachedTimeRaw = localStorage.getItem(this.CACHE_TIME_KEY);
  const cachedTime = Number(cachedTimeRaw);

  if (!force && cachedData && cachedTime && (now - cachedTime < this.CACHE_TTL)) {
    ERP_CONFIG.log("⚡ CACHE HIT (products)");
    return JSON.parse(cachedData);
  }

  // ✅ SỬA: Dùng webhook "products" thay vì "inventory"
  const url = ERP_CONFIG.getWebhook("products");
  ERP_CONFIG.log("🌐 FETCH PRODUCTS:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const raw = await res.json();

    // Dữ liệu từ Make có thể là mảng trực tiếp
    const data = Array.isArray(raw) ? raw : (raw.data || []);

    // Chuẩn hóa dữ liệu (map từ key số sang tên trường)
    const normalized = data.map(item => ({
      product_id: item["0"] || "",
      category: item["1"] || "",
      product_group: item["2"] || "",
      product_name: item["3"] || "",
      color: item["4"] || "",
      size: item["5"] || "",
      stock_qty: Number(item["8"] || 0),
      image_url: item["12"] || "",
      price: Number(item["7"] || 0)
    }));

    localStorage.setItem(this.CACHE_KEY, JSON.stringify(normalized));
    localStorage.setItem(this.CACHE_TIME_KEY, now.toString());
    return normalized;
  } catch (err) {
    console.error("❌ FETCH ERROR:", err);
    if (cachedData) {
      ERP_CONFIG.log("⚠️ FALLBACK CACHE");
      return JSON.parse(cachedData);
    }
    return [];
  }
},

  // ===== FORCE RELOAD =====
  async reloadProducts() {
    ERP_CONFIG.log("🔄 FORCE RELOAD");

    const data = await this.loadProducts(true);
    this.setProducts(data);
  },

  // ===== SET PRODUCTS =====
  setProducts(data = []) {
    this.products = data;
    this.buildGroups();
  },

  // ===== BUILD GROUP =====
  buildGroups() {

    const grouped = {};

    this.products.forEach(p => {

      // SAU KHI SỬA - group theo product_name + color
const groupKey = `${p.product_name || p.product_id}_${p.color || ''}`;

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          group: groupKey,
          name: p.product_name || groupKey,
          image: p.image_url || "",
          category: p.category || "",
          total_stock: 0,
          variants: [],
          color: p.color || "",
          search_text: ""
        };
      }

      grouped[groupKey].total_stock += Number(p.stock_qty || 0);

      grouped[groupKey].variants.push({
        id: p.product_id,
        color: p.color || "",
        size: p.size || "",
        stock: Number(p.stock_qty || 0),
        raw: p
      });

    });

    // ===== BUILD SEARCH TEXT =====
    this.grouped = Object.values(grouped).map(g => {

      const variantText = g.variants.map(v => {
        return [
          v.id,
          v.color,
          v.size,
          v.raw?.category || "",
          v.raw?.product_name || ""
        ].join(" ");
      }).join(" ");

      g.search_text = ERP_UTILS.normalize([
        g.name,
        g.group,
        g.category,
        variantText
      ].join(" "));

      return g;

    });

    // ===== MAP =====
    this.groupMap = {};
    this.grouped.forEach(g => {
      this.groupMap[g.group] = g;
    });

  },

  // ===== SEARCH =====
  search(keyword = "") {

    const kw = ERP_UTILS.normalize(keyword);
    this.searchKeyword = keyword;

    if (!kw) {
      this.searchResult = this.grouped.slice(0, ERP_CONFIG.app.maxSearchResult);
      return this.searchResult;
    }

    const results = this.grouped.filter(g => {
      return ERP_UTILS.matchKeyword(g.search_text || "", kw);
    });

    this.searchResult = results.slice(0, ERP_CONFIG.app.maxSearchResult);

    return this.searchResult;

  },

  // ===== SELECT GROUP =====
  selectGroup(groupId) {
    const group = this.groupMap[groupId];
    this.currentGroup = group || null;
    return group;
  },

  // ===== UPDATE STOCK LOCAL =====
  updateStockLocal(productId, delta) {

    const p = this.products.find(p => p.product_id === productId);
    if (!p) return;

    p.stock_qty = Number(p.stock_qty || 0) + delta;

    this.buildGroups();
    this.search(this.searchKeyword);

    // 💾 update cache theo state mới
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.products));
    localStorage.setItem(this.CACHE_TIME_KEY, Date.now().toString());

    ERP_CONFIG.log("💾 CACHE UPDATED (local change)");
  },
// ===== TÍNH TIỀN ĐANG CÓ THỰC TẾ =====
  getActualCash() {
    if (!this.cashflowLogs || this.cashflowLogs.length === 0) return 0;
    return this.cashflowLogs.reduce((balance, log) => {
      if (log.type === 'income') return balance + log.amount;
      if (log.type === 'expense') return balance - log.amount;
      return balance;
    }, 0);
  },

  // ===== TÍNH TỔNG TIỀN HÀNG TỒN =====
    getTotalInventoryValue() {
    if (!this.products || this.products.length === 0) return 0;
    return this.products.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      return sum + (Number(p.stock_qty || 0) * price);
    }, 0);
  },
};