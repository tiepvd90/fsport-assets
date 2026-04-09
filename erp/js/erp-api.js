// ===== ERP API =====

window.ERP_API = {};

// ===== GENERIC POST (giữ nguyên) =====
ERP_API.post = async function (url, data = {}) {
  ERP_CONFIG.log("API POST", url, data);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Network error");
  try { return await res.json(); } catch (e) { return {}; }
};

// ===== UPDATE STOCK (giữ nguyên - qua webhook Make) =====
ERP_API.updateStock = async function (payload) {
  const url = ERP_CONFIG.getWebhook("inventory");
  const data = { ...payload, client_time: new Date().toISOString() };
  const res = await ERP_API.post(url, data);
  ERP_CONFIG.log("UPDATE STOCK RES", res);
  return res;
};

// ===== CASHFLOW CREATE (giữ nguyên - qua webhook Make) =====
ERP_API.createCashflow = async function (payload) {
  const url = ERP_CONFIG.getWebhook("cashflow");
  const data = { ...payload, client_time: new Date().toISOString() };
  const res = await ERP_API.post(url, data);
  ERP_CONFIG.log("CASHFLOW RES", res);
  return res;
};

// ===== GET PRODUCTS (SỬA: dùng Apps Script) =====
ERP_API.getProducts = async function () {
  const baseUrl = ERP_CONFIG.appsScriptUrl;
  const token = ERP_CONFIG.appsScriptToken;
  const url = `${baseUrl}?action=products&token=${encodeURIComponent(token)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error " + response.status);
    const rows = await response.json(); // Mảng các mảng

    // Chuyển đổi dựa trên thứ tự cột trong Google Sheet
    const data = rows.map(row => ({
      product_id: row[0] || "",
      category: row[1] || "",
      product_group: row[2] || "",
      product_name: row[3] || "",
      color: row[4] || "",
      size: row[5] || "",
      stock_qty: Number(row[8] || 0),
      image_url: row[12] || "",
      price: Number(row[7] || 0)
    }));

    // Cache lại
    localStorage.setItem("erp_products_cache", JSON.stringify(data));
    return data;
  } catch (err) {
    console.error("Apps Script products error:", err);
    // Fallback đọc cache
    const cached = localStorage.getItem("erp_products_cache");
    if (cached) return JSON.parse(cached);
    return [];
  }
};

// ===== GET CASHFLOW LOGS (SỬA: dùng Apps Script) =====
ERP_API.getCashflowLogs = async function () {
  const baseUrl = ERP_CONFIG.appsScriptUrl;
  const token = ERP_CONFIG.appsScriptToken;
  const url = `${baseUrl}?action=cashflow&token=${encodeURIComponent(token)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error " + response.status);
    const rows = await response.json();

    const logs = rows.map(row => ({
      transaction_id: row[0] || "",
      type: row[1] || "",           // "income" hoặc "expense"
      amount: Number(row[2]) || 0,
      balance_before: Number(row[3]) || 0,
      balance_after: Number(row[4]) || 0,
      category: row[5] || "",
      reference: row[6] || "",
      user: row[7] || "",
      note: row[8] || "",
      created_at: row[9] || ""
    }));

    // Sắp xếp mới nhất lên đầu
    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    localStorage.setItem("erp_cashflow_cache", JSON.stringify(logs));
    return logs;
  } catch (err) {
    console.error("Apps Script cashflow logs error:", err);
    const cached = localStorage.getItem("erp_cashflow_cache");
    return cached ? JSON.parse(cached) : [];
  }
};