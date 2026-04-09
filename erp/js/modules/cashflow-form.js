// ===== CASHFLOW FORM MODULE =====
(function() {
  let sheet = null, backdrop = null;
  const newBtn = document.getElementById('btnNewCashflow');
  
  // Tạo sheet nếu chưa có
  function initSheet() {
    if (document.getElementById("erpCashflowSheet")) return;
    
    backdrop = document.createElement("div");
    backdrop.className = "erp-sheet-backdrop";
    backdrop.id = "erpCashflowBackdrop";
    
    sheet = document.createElement("div");
    sheet.className = "erp-sheet";
    sheet.id = "erpCashflowSheet";
    sheet.innerHTML = `
      <div class="erp-sheet-handle"></div>
      <div class="erp-sheet-head">
        <div>
          <div class="erp-sheet-title">Lập Phiếu Thu / Chi</div>
          <div class="erp-sheet-sub">Nhập thông tin giao dịch</div>
        </div>
        <button class="erp-sheet-close" id="erpCashflowClose">✕</button>
      </div>
      <div class="erp-sheet-scroll" id="erpCashflowContent"></div>
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    
    document.getElementById("erpCashflowClose").addEventListener("click", closeSheet);
    backdrop.addEventListener("click", closeSheet);
  }
  
  function openSheet() {
    initSheet();
    renderForm();
    sheet.classList.add("is-open");
    backdrop.classList.add("is-open");
  }
  
  function closeSheet() {
    sheet.classList.remove("is-open");
    backdrop.classList.remove("is-open");
  }
  
  function renderForm() {
    const content = document.getElementById("erpCashflowContent");
    const expenseCats = ERP_CONFIG.cashflow.expenseCategories;
    const incomeCats = ERP_CONFIG.cashflow.incomeCategories;
    const refs = ERP_CONFIG.cashflow.references;
    
    content.innerHTML = `
      <form class="erp-cashflow-form" id="cashflowForm">
        <div class="erp-form-group">
          <label class="erp-label">Loại giao dịch</label>
          <div class="erp-radio-group">
            <label class="erp-radio-label">
              <input type="radio" name="cashflowType" value="income" checked> 💰 Thu
            </label>
            <label class="erp-radio-label">
              <input type="radio" name="cashflowType" value="expense"> 💸 Chi
            </label>
          </div>
        </div>
        
        <div class="erp-form-group">
          <label class="erp-label">Số tiền (VNĐ)</label>
          <input type="number" class="erp-input" id="cashflowAmount" placeholder="Nhập số tiền" min="1000" step="1000" required>
        </div>
        
        <div class="erp-form-group">
          <label class="erp-label">Danh mục</label>
          <select class="erp-select" id="cashflowCategory" required></select>
        </div>
        
        <div class="erp-form-group">
          <label class="erp-label">Tham chiếu / Nhà cung cấp</label>
          <select class="erp-select" id="cashflowReference">
            ${refs.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
          </select>
        </div>
        
        <div class="erp-form-group">
          <label class="erp-label">Ghi chú</label>
          <textarea class="erp-textarea" id="cashflowNote" placeholder="Nhập ghi chú (không bắt buộc)" rows="2"></textarea>
        </div>
        
        <button type="submit" class="erp-submit-btn" id="cashflowSubmit">💾 Lưu phiếu</button>
      </form>
    `;
    
    const typeRadios = document.getElementsByName('cashflowType');
    const categorySelect = document.getElementById('cashflowCategory');
    
    function updateCategoryOptions(type) {
      const cats = type === 'income' ? incomeCats : expenseCats;
      categorySelect.innerHTML = cats.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
    }
    
    typeRadios.forEach(r => r.addEventListener('change', (e) => {
      updateCategoryOptions(e.target.value);
    }));
    
    updateCategoryOptions('income'); // mặc định
    
    document.getElementById('cashflowForm').addEventListener('submit', handleSubmit);
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    const type = document.querySelector('input[name="cashflowType"]:checked').value;
    const amount = parseInt(document.getElementById('cashflowAmount').value);
    const category = document.getElementById('cashflowCategory').value;
    const reference = document.getElementById('cashflowReference').value;
    const note = document.getElementById('cashflowNote').value.trim();
    
    if (!amount || amount <= 0) {
      ERP_TOAST.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    const actionText = type === 'income' ? 'Thu' : 'Chi';
    const confirmed = await ERP_DIALOG.show({
      title: `Xác nhận ${actionText}`,
      body: `Tạo phiếu ${actionText.toLowerCase()} số tiền ${ERP_CONFIG.formatCurrency(amount)}?`,
      icon: type === 'income' ? '💰' : '💸',
      confirmText: 'Xác nhận'
    });
    
    if (!confirmed) return;
    
    const user = ERP_AUTH.getCurrentUser();
    if (!user) {
      ERP_TOAST.error('Không xác định được người dùng');
      return;
    }
    
    const payload = {
      type: type,
      amount: amount,
      category: category,
      reference: reference,
      user: user,
      note: note || `${actionText} ${ERP_CONFIG.formatCurrency(amount)}`
    };
    
    ERP_TOAST.info('Đang xử lý...');
    
    try {
      await ERP_API.createCashflow(payload);
      ERP_TOAST.success(`Đã tạo phiếu ${actionText.toLowerCase()} thành công`);
      closeSheet();
      
      // Refresh danh sách logs
      if (window.ERP_CASHFLOW && ERP_CASHFLOW.refresh) {
        ERP_CASHFLOW.refresh();
      }
      
      // Kích hoạt sự kiện để cập nhật số dư tiền mặt nếu cần
      window.dispatchEvent(new CustomEvent('cashflow-created'));
      
    } catch (error) {
      console.error('Cashflow error:', error);
      ERP_TOAST.error('Lỗi tạo phiếu, thử lại');
    }
  }
  
  // Khởi tạo
  if (newBtn) {
    newBtn.addEventListener('click', openSheet);
  }
  
  window.ERP_CASHFLOW_FORM = {
    open: openSheet
  };
})();