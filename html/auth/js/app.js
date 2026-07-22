/**
 * app.js - Khởi tạo và render ứng dụng
 * Load productSettings từ HTML → render template → setup handlers
 */

// Ngăn zoom gesture trên mobile
;['gesturestart', 'gesturechange', 'gestureend', 'dblclick'].forEach(evt => {
  document.addEventListener(evt, e => e.preventDefault(), { passive: false });
});

function renderSpecs(product) {
  return (product.specs || []).map(([label, value]) =>
    `<tr><td>${label}</td><td>${value}</td></tr>`
  ).join('');
}

function renderTemplate(product) {
  const { verify, form, warranty, popup } = UIConfig;
  const warrantyPolicy = warranty.policyText.replace('{days}', product.warrantyDays);

  document.body.innerHTML = `
    <!-- Popup xác thực -->
    <div class="verify-overlay" id="verifyPopup">
      <div class="verify-card">
        <div class="verify-loading" id="loadingIcon"></div>
        <div class="verify-icon" id="checkIcon">✓</div>
        <div class="verify-message" id="verifyMessage">${verify.loadingMessage}</div>
        <div class="verify-sub" id="verifySub"></div>
        <button class="verify-btn" id="continueBtn">${verify.continueBtn}</button>
      </div>
    </div>

    <!-- Nội dung chính -->
    <main id="productSection" style="display:none;">
      <h2>${product.title}</h2>
      <img src="${product.image}" alt="${product.title}">

      <table>${renderSpecs(product)}</table>

      <p>${product.description}</p>

      ${product.description2 ? `<p>${product.description2}</p>` : ''}

      <h3>${warranty.title}</h3>
      <p>${warrantyPolicy}</p>

      <p class="note">${form.noteText}</p>

      <form id="warrantyForm">
        <input type="tel" id="phone" name="phone" placeholder="${form.phonePlaceholder}" required>
        <input type="email" id="email" name="email" placeholder="${form.emailPlaceholder}" required>
        <button type="submit" id="submitBtn">${form.submitBtn}</button>
      </form>
    </main>

    <!-- Popup thành công -->
    <div class="popup-success" id="successPopup">
      <div class="popup-box">
        <div class="popup-inner">
          <div class="success-icon">✓</div>
          <h4 class="popup-title" id="popupTitle"></h4>
          <p class="popup-text" id="popupText"></p>
          <p class="popup-warranty" id="popupWarranty"></p>
          <p class="popup-countdown" id="popupCountdown"></p>
          <button class="finish-btn" id="finishBtn">${popup.finishBtn}</button>
        </div>
      </div>
    </div>
  `;
}

function simulateVerification() {
  setTimeout(() => {
    document.getElementById('loadingIcon').style.display = 'none';
    document.getElementById('checkIcon').style.display = 'block';
    document.getElementById('verifyMessage').innerHTML = UIConfig.verify.successMessage;
    document.getElementById('verifySub').textContent = UIConfig.verify.successSub;
    document.getElementById('continueBtn').style.display = 'inline-block';
  }, UIConfig.verify.delayMs);
}

function showProduct() {
  document.getElementById('verifyPopup').style.display = 'none';
  document.getElementById('productSection').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeSuccess() {
  window.location.replace(UIConfig.popup.redirectUrl);
}

function setupFormHandler(product) {
  document.getElementById('continueBtn').addEventListener('click', showProduct);

  document.getElementById('finishBtn').addEventListener('click', closeSuccess);

  document.getElementById('warrantyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const submitBtn = document.getElementById('submitBtn');

    submitBtn.disabled = true;
    submitBtn.textContent = UIConfig.form.submittingBtn;

    await warranty.execute({ phone, email }, product);

    submitBtn.disabled = false;
    submitBtn.textContent = UIConfig.form.submitBtn;

    // Reset form nếu không bị stop (popup đã hiện)
    if (document.getElementById('successPopup').style.display === 'flex') {
      e.target.reset();
    }
  });
}

function pageFromRow(row) {
  const specs = Array.isArray(row.specs) ? row.specs : [];
  return {
    id: row.slug,
    slug: row.slug,
    name: row.product_name,
    title: row.title,
    image: row.image_url,
    specs: specs.map(item => Array.isArray(item) ? item : [item.label || '', item.value || '']),
    description: row.description || '',
    description2: row.description2 || '',
    warrantyDays: row.warranty_days || 90
  };
}

async function loadProductSettings() {
  if (typeof productSettings !== 'undefined') return productSettings;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || params.get('s') || '';
  if (!slug) throw new Error('Missing NFC slug');

  const cfg = WarrantyConfig.supabase || {};
  if (!cfg.url || !cfg.anonKey) throw new Error('Missing Supabase config');

  const url = cfg.url + '/rest/v1/nfc_auth_pages?select=slug,product_name,title,image_url,specs,description,description2,warranty_days&slug=eq.' + encodeURIComponent(slug) + '&is_active=eq.true&limit=1';
  const response = await fetch(url, {
    headers: {
      apikey: cfg.anonKey,
      Authorization: 'Bearer ' + cfg.anonKey
    }
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(rows) || !rows.length) throw new Error('NFC page not found');
  return pageFromRow(rows[0]);
}

async function initApp() {
  let settings;
  try {
    settings = await loadProductSettings();
  } catch (err) {
    console.error('[app.js] Cannot load product settings:', err);
    document.body.innerHTML = '<main style="padding:24px;font-family:Arial,sans-serif;text-align:center"><h2>Không tìm thấy trang xác thực</h2><p>Vui lòng kiểm tra lại link NFC hoặc liên hệ F-SPORT.</p></main>';
    return;
  }

  renderTemplate(settings);
  simulateVerification();
  setupFormHandler(settings);
}

window.addEventListener('DOMContentLoaded', initApp);
