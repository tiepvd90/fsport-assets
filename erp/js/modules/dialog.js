// ===== DIALOG MODULE =====
(function() {
  const backdrop = document.getElementById('erpDialogBackdrop');
  const dialog = document.getElementById('erpConfirmDialog');
  const iconEl = document.getElementById('dialogIcon');
  const titleEl = document.getElementById('dialogTitle');
  const bodyEl = document.getElementById('dialogBody');
  const cancelBtn = document.getElementById('dialogCancelBtn');
  const confirmBtn = document.getElementById('dialogConfirmBtn');
  
  let currentResolve = null;
  
  function close() {
    backdrop?.classList.remove('is-open');
    dialog?.classList.remove('is-open');
    
    if (currentResolve) {
      currentResolve(false);
      currentResolve = null;
    }
  }
  
  function confirm() {
    backdrop?.classList.remove('is-open');
    dialog?.classList.remove('is-open');
    
    if (currentResolve) {
      currentResolve(true);
      currentResolve = null;
    }
  }
  
  function show(options = {}) {
    const {
      title = 'Xác nhận',
      body = 'Bạn có chắc muốn thực hiện hành động này?',
      icon = '⚠️',
      confirmText = 'Đồng ý',
      cancelText = 'Hủy'
    } = options;
    
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
    if (iconEl) iconEl.textContent = icon;
    if (confirmBtn) confirmBtn.textContent = confirmText;
    if (cancelBtn) cancelBtn.textContent = cancelText;
    
    backdrop?.classList.add('is-open');
    dialog?.classList.add('is-open');
    
    return new Promise((resolve) => {
      currentResolve = resolve;
    });
  }
  
  // Khởi tạo sự kiện
  function init() {
    if (cancelBtn) {
      cancelBtn.addEventListener('click', close);
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', confirm);
    }
    
    if (backdrop) {
      backdrop.addEventListener('click', close);
    }
    
    // ESC để đóng
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dialog?.classList.contains('is-open')) {
        close();
      }
    });
  }
  
  window.ERP_DIALOG = {
    show,
    init
  };
  
  // Auto init
  document.addEventListener('DOMContentLoaded', init);
})();