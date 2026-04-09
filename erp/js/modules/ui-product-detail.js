// ===== PRODUCT DETAIL MODULE (GỌN GÀNG - CHỈ 1 FORM MỖI VARIANT) =====
(function () {
  const sheet = document.getElementById("erpSheet");
  const backdrop = document.getElementById("erpSheetBackdrop");
  const closeBtn = document.getElementById("erpSheetClose");
  const contentEl = document.getElementById("erpSheetContent");
  const titleEl = document.getElementById("erpDetailTitle");

  let currentGroup = null;

  function open(group) {
    if (!group) return;
    currentGroup = group;
    
    // Tiêu đề popup gộp đủ: Tên SP - Màu - Size: Tổng tồn
    const mainVariant = group.variants[0];
    const size = mainVariant?.size || '';
    const color = group.color || mainVariant?.color || '';
    const totalStock = group.total_stock;
    
    titleEl.innerText = `${group.name}${color ? ' - ' + color : ''} ( Tồn: ${totalStock}) `;
    
    render(group);
    sheet.classList.add("is-open");
    backdrop.classList.add("is-open");
  }

  function close() {
    sheet.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    currentGroup = null;
  }

  function render(group) {
    // Không còn summary tổng tồn nữa (đã có ở title)
    let html = '';
    
    // Nhóm theo màu nếu có nhiều màu, nếu không thì bỏ qua màu
    const colorMap = ERP_UTILS.groupBy(group.variants, "color");
    const hasMultipleColors = Object.keys(colorMap).length > 1;
    
    if (hasMultipleColors) {
      Object.keys(colorMap).forEach(color => {
        const variants = colorMap[color].sort(ERP_UTILS.sortSize);
        html += `<div class="erp-color-section"><div class="erp-color-label">${color}</div>`;
        variants.forEach(v => { html += renderVariantRow(v); });
        html += '</div>';
      });
    } else {
      // Chỉ một màu: hiển thị thẳng các variant
      const variants = group.variants.sort(ERP_UTILS.sortSize);
      variants.forEach(v => { html += renderVariantRow(v); });
    }

    contentEl.innerHTML = html;
    bindActions();
  }

  function renderVariantRow(v) {
    // Dòng hiển thị: Size và tồn hiện tại (rất gọn)
    return `
      <div class="erp-variant-row-compact" data-id="${v.id}">
        <div class="erp-variant-info-compact">
          <span class="erp-size-badge">Size ${v.size || '-'}</span>
          <span class="erp-stock-badge">Tồn: <strong>${ERP_UTILS.formatNumber(v.stock)}</strong></span>
        </div>
        
        <div class="erp-variant-controls-compact">
          <input type="number" class="erp-qty-input-compact" value="1" min="1" step="1" data-action="qty" />
          <button class="erp-btn-import" data-action="import">📥 Nhập</button>
          <button class="erp-btn-export" data-action="export">📤 Xuất</button>
        </div>
        
        <div class="erp-note-wrapper">
          <input type="text" class="erp-note-input-compact" placeholder="Ghi chú" data-action="note" />
        </div>
      </div>
    `;
  }

  function bindActions() {
    const rows = contentEl.querySelectorAll(".erp-variant-row-compact");
    
    rows.forEach(row => {
      const variantId = row.dataset.id;
      const importBtn = row.querySelector('[data-action="import"]');
      const exportBtn = row.querySelector('[data-action="export"]');
      const qtyInput = row.querySelector('[data-action="qty"]');
      
      if (importBtn) {
        importBtn.addEventListener('click', () => handleStockChange(variantId, 'import', row));
      }
      if (exportBtn) {
        exportBtn.addEventListener('click', () => handleStockChange(variantId, 'export', row));
      }
      if (qtyInput) {
        qtyInput.addEventListener('change', function() {
          let val = parseInt(this.value);
          if (isNaN(val) || val < 1) this.value = 1;
        });
      }
    });
  }

  async function handleStockChange(variantId, action, row) {
    const qtyInput = row.querySelector('[data-action="qty"]');
    let quantity = parseInt(qtyInput?.value) || 1;
    if (quantity < 1) quantity = 1;
    
    const noteInput = row.querySelector('[data-action="note"]');
    const note = noteInput?.value?.trim() || '';
    
    const variant = findVariant(variantId);
    if (!variant) {
      ERP_TOAST.error('Không tìm thấy sản phẩm');
      return;
    }
    
    const productName = currentGroup?.name || variantId;
    const actionText = action === 'import' ? 'Nhập vào' : 'Xuất ra';
    const changeQty = action === 'import' ? quantity : -quantity;
    
    const confirmed = await ERP_DIALOG.show({
      title: `Xác nhận ${actionText}`,
      body: `Bạn có chắc muốn ${actionText.toLowerCase()} ${quantity} sản phẩm "${productName}" (Màu ${variant.color} - Size ${variant.size || ''})?`,
      icon: action === 'import' ? '📥' : '📤',
      confirmText: action === 'import' ? 'Nhập' : 'Xuất'
    });
    
    if (!confirmed) return;
    
    ERP_TOAST.info(`Đang xử lý...`);
    
    const user = ERP_AUTH.getCurrentUser() || 'tiep';
    
    const payload = {
      product_id: variantId,
      change_qty: changeQty,
      user: user,
      note: note || `${actionText} ${quantity} sản phẩm`
    };
    
    try {
      await ERP_API.updateStock(payload);
      
      const newStock = variant.stock + changeQty;
      ERP_STATE.updateStockLocal(variantId, changeQty);
      
      // Cập nhật UI trong row
      const stockStrong = row.querySelector('.erp-stock-badge strong');
      if (stockStrong) {
        stockStrong.textContent = ERP_UTILS.formatNumber(newStock);
      }
      
      // Cập nhật title tổng tồn
      if (currentGroup) {
        const updatedGroup = ERP_STATE.groupMap[currentGroup.group];
        if (updatedGroup) {
          const mainVariant = updatedGroup.variants[0];
          const size = mainVariant?.size || '';
          const color = updatedGroup.color || mainVariant?.color || '';
          titleEl.innerText = `${updatedGroup.name}${color ? ' - ' + color : ''}${size ? ' - ' + size : ''} (Tồn: ${updatedGroup.total_stock})`;
        }
      }
      
      if (qtyInput) qtyInput.value = 1;
      if (noteInput) noteInput.value = '';
      
      ERP_TOAST.success(`Đã ${actionText.toLowerCase()} ${quantity} sản phẩm`);
      
      window.dispatchEvent(new CustomEvent('stock-updated', { 
        detail: { variantId, changeQty, newStock } 
      }));
      
    } catch (error) {
      console.error('Update stock error:', error);
      ERP_TOAST.error('Lỗi cập nhật kho');
    }
  }

  function findVariant(variantId) {
    if (!currentGroup) return null;
    return currentGroup.variants.find(v => v.id === variantId);
  }

  backdrop.addEventListener("click", close);
  closeBtn.addEventListener("click", close);

  window.ERP_UI_PRODUCT_DETAIL = {
    open,
    close,
    refresh: () => {
      if (currentGroup) render(currentGroup);
    }
  };
})();