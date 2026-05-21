/**
 * validate.js - Handler kiểm tra dữ liệu form
 * Dừng pipeline nếu phone hoặc email không hợp lệ
 */

const validateHandler = {
  name: 'validate',

  async handle(context, next) {
    if (!WarrantyConfig.handlers.enableValidation) {
      return next(context);
    }

    const { phone, email } = context.formData;
    const { validation } = UIConfig;
    const { phonePattern, emailPattern } = WarrantyConfig.validation;

    if (!phone || !email) {
      alert(validation.emptyFieldMsg);
      context.stop = true;
      return;
    }

    if (!phonePattern.test(phone)) {
      alert(validation.invalidPhoneMsg);
      context.stop = true;
      return;
    }

    if (!emailPattern.test(email)) {
      alert(validation.invalidEmailMsg);
      context.stop = true;
      return;
    }

    return next(context);
  }
};
