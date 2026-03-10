// tracking.js

// ============================================
// META PIXEL + TIKTOK PIXEL + GA
// Mục tiêu:
// - Meta Pixel chính: 2551563688514905
// - Meta Pixel phụ: 644988365190821
// - Purchase CHỈ gửi về pixel chính
// - Các event khác (PageView, ViewContent, AddToCart...) vẫn giữ như cũ
// ============================================

// ======= KHAI BÁO PIXEL ID =======
const META_PIXEL_MAIN = '2551563688514905';
const META_PIXEL_SUB  = '644988365190821';
const TIKTOK_PIXEL_ID = 'CVPMFPRC77U7H4FD4TVG';
const GA_ID = 'G-RXC205951M';

// ============================================
// 1) META PIXEL
// ============================================
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

// Init 2 pixel
fbq('init', META_PIXEL_MAIN);
fbq('init', META_PIXEL_SUB);

// PageView:
// dùng trackSingle để kiểm soát rõ ràng, tránh mơ hồ
fbq('trackSingle', META_PIXEL_MAIN, 'PageView');
fbq('trackSingle', META_PIXEL_SUB, 'PageView');

// ============================================
// 2) TIKTOK PIXEL
// ============================================
(function (w, d, t) {
  w.TiktokAnalyticsObject = t;
  const ttq = (w[t] = w[t] || []);

  ttq.methods = [
    "page", "track", "identify", "instances", "debug", "on", "off",
    "once", "ready", "alias", "group", "enableCookie", "disableCookie",
    "holdConsent", "revokeConsent", "grantConsent"
  ];

  ttq.setAndDefer = function (target, method) {
    target[method] = function () {
      target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };

  for (let i = 0; i < ttq.methods.length; i++) {
    ttq.setAndDefer(ttq, ttq.methods[i]);
  }

  ttq.instance = function (id) {
    const instance = ttq._i[id] || [];
    for (let i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(instance, ttq.methods[i]);
    }
    return instance;
  };

  ttq.load = function (id, config) {
    const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[id] = [];
    ttq._i[id]._u = url;
    ttq._t = ttq._t || {};
    ttq._t[id] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[id] = config || {};

    const script = d.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = url + "?sdkid=" + id + "&lib=" + t;

    const firstScript = d.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  };

  ttq.load(TIKTOK_PIXEL_ID);
  ttq.page();
})(window, document, 'ttq');

// ============================================
// 3) HÀM TRACK CHUNG
// ============================================
// QUY TẮC:
// - Purchase:
//   + Meta: chỉ pixel chính
//   + TikTok: vẫn track bình thường
//
// - Các event khác:
//   + Meta: bắn cho cả 2 pixel
//   + TikTok: track bình thường
// ============================================
function trackBothPixels(eventName, params = {}) {
  const safeEventName = String(eventName || '').trim();
  const safeParams = params && typeof params === 'object' ? params : {};

  // ===== META =====
  if (typeof fbq !== 'undefined') {
    if (safeEventName === 'Purchase') {
      // CHỈ gửi Purchase về pixel chính
      fbq('trackSingle', META_PIXEL_MAIN, 'Purchase', safeParams);
      console.log(`[Meta Main Only] Tracked: Purchase`, safeParams);
    } else {
      // Các event khác vẫn gửi cho cả 2 pixel
      fbq('trackSingle', META_PIXEL_MAIN, safeEventName, safeParams);
      fbq('trackSingle', META_PIXEL_SUB, safeEventName, safeParams);
      console.log(`[Meta Both Pixels] Tracked: ${safeEventName}`, safeParams);
    }
  }

  // ===== TIKTOK =====
  if (typeof ttq !== 'undefined') {
    ttq.track(safeEventName, safeParams);
    console.log(`[TikTok Pixel] Tracked: ${safeEventName}`, safeParams);
  }
}

// ============================================
// 4) GOOGLE ANALYTICS
// ============================================
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

// ============================================
// 5) OPTIONAL: expose ra global cho chắc
// ============================================
window.trackBothPixels = trackBothPixels;
