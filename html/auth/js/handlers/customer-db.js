/**
 * customer-db.js - Submit NFC activation to Supabase.
 * Updates/creates the CRM customer by phone and stores a submit log.
 */

const customerDatabaseHandler = {
  name: 'customer-db',

  async handle(context, next) {
    const { phone, email } = context.formData;
    const { product } = context;
    const cfg = WarrantyConfig.supabase || {};

    if (!cfg.url || !cfg.anonKey) {
      alert('Không thể kết nối hệ thống bảo hành, vui lòng thử lại sau.');
      context.stop = true;
      return;
    }

    const response = await fetch(cfg.url + '/rest/v1/rpc/submit_nfc_auth_activation', {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + cfg.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_slug: product.id || product.slug,
        p_phone: phone,
        p_email: email,
        p_user_agent: navigator.userAgent || '',
        p_referrer: document.referrer || ''
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      console.error('[customerDatabaseHandler] Submit failed:', data);
      alert('Không thể ghi nhận thông tin, vui lòng thử lại sau.');
      context.stop = true;
      return;
    }

    context.customerResult = data;
    return next(context);
  }
};
