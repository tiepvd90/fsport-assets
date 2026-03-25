// ============================================
// ✅ META PIXEL – SINGLE ONLY
// ============================================

const META_PIXEL_ID = '2551563688514905';

// Load Meta Pixel
(function (f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function () {
    n.callMethod
      ? n.callMethod.apply(n, arguments)
      : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  t = b.createElement(e);
  t.async = true;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
})(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

// Init
fbq('init', META_PIXEL_ID);

// PageView (bắn luôn khi load)
fbq('track', 'PageView');

// ============================================
// ✅ HÀM TRACK DUY NHẤT
// ============================================

function trackMeta(eventName, params = {}) {
  if (typeof fbq === 'undefined') return;

  const safeEvent = String(eventName || '').trim();
  const safeParams = (params && typeof params === 'object') ? params : {};

  fbq('track', safeEvent, safeParams);

  console.log(`[Meta] ${safeEvent}`, safeParams);
}

// expose global
window.trackMeta = trackMeta;


// ============================================
// ✅ GOOGLE ANALYTICS (giữ nguyên nếu cần)
// ============================================

const GA_ID = 'G-RXC205951M';

(function () {
  const s1 = document.createElement('script');
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  s1.async = true;
  document.head.appendChild(s1);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID);
})();
