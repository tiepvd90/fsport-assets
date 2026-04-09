// ===== CASHFLOW LOGS MODULE (ENHANCED) =====
(function() {
  let logsData = [];
  let sheet = null, backdrop = null;
  const listEl = document.getElementById("erpCashflowList");
  const viewAllBtn = document.getElementById("btnViewAllLogs");
  
  // Helper functions
  function getCategoryLabel(catValue, type) {
    const cats = type === 'income' ? ERP_CONFIG.cashflow.incomeCategories : ERP_CONFIG.cashflow.expenseCategories;
    const found = cats.find(c => c.value === catValue);
    return found ? found.label : (catValue || (type === 'income' ? 'Thu' : 'Chi'));
  }
  
  function getReferenceLabel(refValue) {
    const refs = ERP_CONFIG.cashflow.references;
    const found = refs.find(r => r.value === refValue);
    return found ? found.label : refValue;
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch(e) {
      return dateStr;
    }
  }
  
  function formatMoney(amount) {
    return (amount || 0).toLocaleString('vi-VN') + 'đ';
  }
  
  // ===== RENDER HOME (5 LOGS) =====
  async function renderHome() {
    if (!listEl) return;
    
    listEl.innerHTML = `<div class="erp-loading" style="padding:20px;text-align:center;">Đang tải...</div>`;
    
    try {
      const logs = await ERP_API.getCashflowLogs();
      logsData = logs;
      const recentLogs = logs.slice(0, 5);
      
      if (!recentLogs.length) {
        listEl.innerHTML = `
          <div class="erp-empty">
            <div class="erp-empty-icon">💰</div>
            <div class="erp-empty-title">Chưa có giao dịch</div>
            <div class="erp-empty-text">Tạo phiếu thu/chi đầu tiên</div>
          </div>
        `;
        return;
      }
      
      listEl.innerHTML = recentLogs.map(log => {
        const categoryLabel = getCategoryLabel(log.category, log.type);
        const refLabel = log.reference && log.reference !== 'khac' ? ` • ${getReferenceLabel(log.reference)}` : '';
        const notePreview = log.note ? ` • 📝 ${log.note.substring(0, 20)}${log.note.length > 20 ? '…' : ''}` : '';
        
        return `
          <div class="erp-cashflow-item" data-id="${log.transaction_id}">
            <div class="erp-cashflow-info">
              <div class="erp-cashflow-category">${categoryLabel}</div>
              <div class="erp-cashflow-meta">
                <span>${formatDate(log.created_at)}</span>
                ${log.user ? `<span>• ${log.user}</span>` : ''}
                ${refLabel}
                ${notePreview}
              </div>
            </div>
            <div class="erp-cashflow-amount ${log.type}">
              ${log.type === 'income' ? '+' : '-'} ${formatMoney(log.amount)}
            </div>
          </div>
        `;
      }).join('');
      
      // Click vào item để xem chi tiết
      document.querySelectorAll('.erp-cashflow-item').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.dataset.id;
          const log = logsData.find(l => l.transaction_id === id);
          if (log) showDetailPopup(log);
        });
      });
      
    } catch(err) {
      console.error('Render cashflow error:', err);
      listEl.innerHTML = `<div class="erp-empty"><div class="erp-empty-icon">⚠️</div><div class="erp-empty-title">Lỗi tải dữ liệu</div></div>`;
    }
  }
  
  // ===== POPUP XEM TẤT CẢ =====
  function initPopup() {
    if (document.getElementById("erpLogsSheet")) return;
    backdrop = document.createElement("div");
    backdrop.className = "erp-sheet-backdrop";
    backdrop.id = "erpLogsBackdrop";
    sheet = document.createElement("div");
    sheet.className = "erp-sheet";
    sheet.id = "erpLogsSheet";
    sheet.innerHTML = `
      <div class="erp-sheet-handle"></div>
      <div class="erp-sheet-head">
        <div>
          <div class="erp-sheet-title">Lịch sử Thu / Chi</div>
          <div class="erp-sheet-sub">Tất cả giao dịch</div>
        </div>
        <button class="erp-sheet-close" id="erpLogsClose">✕</button>
      </div>
      <div class="erp-sheet-scroll" id="erpLogsContent"></div>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    document.getElementById("erpLogsClose").addEventListener("click", closePopup);
    backdrop.addEventListener("click", closePopup);
  }
  
  async function openPopup() {
    initPopup();
    const content = document.getElementById("erpLogsContent");
    if (!content) return;
    
    content.innerHTML = `<div class="erp-loading" style="padding:20px;text-align:center;">Đang tải...</div>`;
    sheet.classList.add("is-open");
    backdrop.classList.add("is-open");
    
    try {
      const logs = await ERP_API.getCashflowLogs();
      if (!logs.length) {
        content.innerHTML = `<div class="erp-empty"><div class="erp-empty-icon">📋</div><div class="erp-empty-title">Chưa có dữ liệu</div></div>`;
        return;
      }
      
      content.innerHTML = `
        <div class="erp-logs-list">
          ${logs.map(log => `
            <div class="erp-log-card">
              <div class="erp-log-header">
                <span class="erp-pill ${log.type === 'income' ? 'is-income-badge' : 'is-expense-badge'}">${log.type === 'income' ? 'Thu' : 'Chi'}</span>
                <span class="erp-log-id">${log.transaction_id || ''}</span>
                <span class="erp-log-amount ${log.type === 'income' ? 'erp-text-green' : 'erp-text-red'}">${log.type === 'income' ? '+' : '-'}${formatMoney(log.amount)}</span>
              </div>
              <div class="erp-log-body">
                <div><span class="erp-log-label">Danh mục:</span> ${getCategoryLabel(log.category, log.type)}</div>
                ${log.reference ? `<div><span class="erp-log-label">Tham chiếu:</span> ${getReferenceLabel(log.reference)}</div>` : ''}
                ${log.user ? `<div><span class="erp-log-label">Người tạo:</span> ${log.user}</div>` : ''}
                ${log.note ? `<div><span class="erp-log-label">Ghi chú:</span> ${log.note}</div>` : ''}
                <div class="erp-log-footer">
                  <span>${formatDate(log.created_at)}</span>
                  <span>Số dư sau: ${formatMoney(log.balance_after)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch(err) {
      content.innerHTML = `<div class="erp-empty"><div class="erp-empty-icon">⚠️</div><div class="erp-empty-title">Lỗi tải dữ liệu</div></div>`;
    }
  }
  
  function closePopup() {
    sheet.classList.remove("is-open");
    backdrop.classList.remove("is-open");
  }
  
  function showDetailPopup(log) {
    alert(`Chi tiết:\nSố tiền: ${formatMoney(log.amount)}\nDanh mục: ${getCategoryLabel(log.category, log.type)}\nTham chiếu: ${getReferenceLabel(log.reference)}\nGhi chú: ${log.note || 'Không'}`);
  }
  
  // Refresh toàn bộ
  async function refresh() {
    await renderHome();
  }
  
  // ===== KHỞI TẠO =====
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', openPopup);
  }
  
  window.addEventListener('cashflow-created', () => {
    refresh();
    if (sheet && sheet.classList.contains('is-open')) {
      openPopup();
    }
  });
  
  window.ERP_CASHFLOW = {
    refresh,
    openPopup
  };
  
  // KHÔNG tự động refresh ở DOMContentLoaded nữa, để app.js gọi
})();