/**
 * webhook.js - Handler gửi dữ liệu tới Make.com
 * Tiếp tục pipeline kể cả khi gửi thất bại (continueOnWebhookFail)
 */

const webhookHandler = {
  name: 'webhook',

  async handle(context, next) {
    if (!WarrantyConfig.handlers.enableWebhook) {
      return next(context);
    }

    const { phone, email } = context.formData;
    const { product } = context;
    const { webhook } = WarrantyConfig;

    const payload = {
      type: 'warranty',
      product: product.name,
      phone,
      email,
      warrantyDays: product.warrantyDays,
      date: new Date().toLocaleString('vi-VN'),
      timestamp: Date.now(),
      source: webhook.source
    };

    try {
      await fetch(webhook.url, {
        method: webhook.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (WarrantyConfig.errorHandling.logErrors) {
        console.error('[webhookHandler] Lỗi gửi webhook:', err);
      }
      if (!WarrantyConfig.handlers.continueOnWebhookFail) {
        alert('Không thể gửi thông tin, vui lòng thử lại sau.');
        context.stop = true;
        return;
      }
    }

    return next(context);
  }
};
