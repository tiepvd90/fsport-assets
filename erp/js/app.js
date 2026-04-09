document.addEventListener("DOMContentLoaded", async () => {
  ERP_AUTH.init();
  
  ERP_AUTH.onLoginSuccess(async (username) => {
    await loadAppData();
  });
  
  if (ERP_AUTH.checkAuth()) {
    await loadAppData();
  }
  
  async function loadAppData() {
    try {
      ERP_TOAST.info("Đang tải dữ liệu...");
      
      const data = await ERP_API.getProducts();
      if (!Array.isArray(data)) throw new Error("Data không đúng format");
      
      ERP_STATE.setProducts(data);
      
      // Load cashflow logs
      const cashflowData = await ERP_API.getCashflowLogs();
      ERP_STATE.cashflowLogs = cashflowData;
      
      // ✅ Gọi refresh để render 5 dòng logs
      if (window.ERP_CASHFLOW && typeof ERP_CASHFLOW.refresh === 'function') {
        await ERP_CASHFLOW.refresh();
      }
      
      updateTopStats();
      
      ERP_TOAST.success(`Đã tải ${data.length} sản phẩm`);
      
      const input = document.getElementById("erpSearchInput");
      if (input && window.ERP_SEARCH) {
        ERP_SEARCH.run(input.value || "");
      }
    } catch (err) {
      console.error("LOAD ERROR:", err);
      ERP_TOAST.error("Không load được dữ liệu");
    }
  }
  
  function updateTopStats() {
  const totalInventory = ERP_STATE.getTotalInventoryValue();
  const actualCash = ERP_STATE.getActualCash();

  // Cập nhật các card cũ (nếu vẫn còn trong overview – có thể giữ hoặc xóa tùy ý)
  const totalInvEl = document.getElementById('totalInventoryValue');
  const actualCashEl = document.getElementById('actualCashValue');
  if (totalInvEl) totalInvEl.innerText = ERP_CONFIG.formatCurrency(totalInventory);
  if (actualCashEl) actualCashEl.innerText = ERP_CONFIG.formatCurrency(actualCash);

  // ===== CẬP NHẬT 2 CHỈ SỐ MỚI TRÊN HEADER =====
  const headerTotalInv = document.getElementById('headerTotalInventory');
  const headerActualCash = document.getElementById('headerActualCash');
  if (headerTotalInv) headerTotalInv.innerText = ERP_CONFIG.formatCurrency(totalInventory);
  if (headerActualCash) headerActualCash.innerText = ERP_CONFIG.formatCurrency(actualCash);
}
  
  window.addEventListener('stock-updated', updateTopStats);
  window.addEventListener('cashflow-created', updateTopStats); // Cập nhật số dư khi có phiếu mới
});