/**
 * warrantyHandler.js - Handler chain pipeline
 * Chạy tuần tự: validate → webhook → popup
 */

class WarrantyHandler {
  constructor(handlers = []) {
    this.handlers = handlers;
  }

  async execute(formData, product) {
    const context = { formData, product, stop: false };

    const run = async (index) => {
      if (index >= this.handlers.length || context.stop) return;
      const handler = this.handlers[index];
      await handler.handle(context, () => run(index + 1));
    };

    await run(0);
  }
}

// Singleton với 3 handlers mặc định
const warranty = new WarrantyHandler([
  validateHandler,
  webhookHandler,
  popupHandler
]);
