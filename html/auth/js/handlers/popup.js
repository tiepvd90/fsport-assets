/**
 * popup.js - Handler hiển thị popup thành công và redirect
 * Hiển thị warranty days, countdown 5 giây, redirect fun-sport.co
 */

const popupHandler = {
  name: 'popup',

  async handle(context, next) {
    if (!WarrantyConfig.handlers.enablePopup) {
      return next(context);
    }

    const { product } = context;
    const { popup } = UIConfig;
    const days = product.warrantyDays;

    // Cập nhật nội dung popup
    const el = (id) => document.getElementById(id);

    el('popupTitle').innerHTML = popup.title;
    el('popupText').textContent = popup.text;
    el('popupWarranty').innerHTML = popup.warrantyText.replace('{days}', days);

    // Hiển thị popup
    el('successPopup').style.display = 'flex';

    // Countdown + redirect
    let remaining = popup.countdownSeconds;
    const countdownEl = el('popupCountdown');

    const tick = () => {
      countdownEl.textContent = popup.countdownText.replace('{n}', remaining);
      if (remaining <= 0) {
        window.location.replace(popup.redirectUrl);
        return;
      }
      remaining--;
      setTimeout(tick, 1000);
    };
    tick();
  }
};
