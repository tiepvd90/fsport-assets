// tracking.js
// ======= Meta Pixel chính (2551563688514905) =======
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod ?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '2551563688514905'); // Pixel chính
fbq('track', 'PageView');

// ======= Meta Pixel phụ (644988365190821 - Funsports) =======
// VẪN KHỞI TẠO để không ảnh hưởng đến các tính năng khác (audience, custom conversions...)
// NHƯNG SẼ KHÔNG ĐƯỢC GỬI SỰ KIỆN TỪ HÀM trackBothPixels (chỉ gửi đến pixel chính)
fbq('init', '644988365190821');
fbq('track', 'PageView'); // PageView vẫn gửi đến cả hai (giữ nguyên như cũ)

// ======= TikTok Pixel (CVPMFPRC77U7H4FD4TVG) =======
!function (w, d, t) {
  w.TiktokAnalyticsObject = t;
  var ttq = w[t] = w[t] || [];
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  ttq.setAndDefer = function (t, e) {
    t[e] = function () {
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
  ttq.instance = function (t) {
    for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
    return e;
  };
  ttq.load = function (e, n) {
    var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._i[e]._u = r;
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date;
    ttq._o = ttq._o || {};
    ttq._o[e] = n || {};
    n = d.createElement("script");
    n.type = "text/javascript";
    n.async = !0;
    n.src = r + "?sdkid=" + e + "&lib=" + t;
    e = d.getElementsByTagName("script")[0];
    e.parentNode.insertBefore(n, e);
  };

  ttq.load('CVPMFPRC77U7H4FD4TVG');
  ttq.page();
}(window, document, 'ttq');

// ======= Hàm gọi tracking (Meta Pixel CHÍNH + TikTok) =======
// GIỮ NGUYÊN TÊN HÀM "trackBothPixels" – KHÔNG CẦN SỬA CÁC TRANG KHÁC
function trackBothPixels(eventName, params = {}, options = {}) {
  // Meta Pixel: CHỈ gửi đến Pixel chính (2551563688514905)
  if (typeof fbq !== 'undefined') {
    fbq('trackSingle', '2551563688514905', eventName, params, options);
    console.log(`[Meta Pixel] Tracked (single): ${eventName}`, params, options);
  }

  // TikTok Pixel (giữ nguyên)
  if (typeof ttq !== 'undefined') {
    const tiktokParams = normalizeTikTokPixelParams(eventName, params, options);
    ttq.track(eventName, tiktokParams);
    console.log(`[TikTok Pixel] Tracked: ${eventName}`, tiktokParams);
  }
}

function tiktokToNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeTikTokContent(item) {
  item = item || {};
  const contentId = item.content_id || item.id || item.item_id || item.product_id || item.product_code || item.feed_product_code || "";
  const contentName = item.content_name || item.item_name || item.name || item.product_name || "";
  const quantity = Math.max(1, parseInt(item.quantity || item.qty || 1, 10) || 1);
  const price = tiktokToNumber(item.price || item.item_price || item.product_price || item["Gi\u00e1"] || item["Gi\u00c3\u00a1"]);
  const out = {
    content_id: String(contentId || ""),
    content_name: String(contentName || contentId || ""),
    quantity: quantity,
    price: price
  };
  if (item.content_category || item.category) out.content_category = item.content_category || item.category;
  return out;
}

function normalizeTikTokPixelParams(eventName, params, options) {
  params = params || {};
  options = options || {};
  const rawContents = Array.isArray(params.contents) && params.contents.length
    ? params.contents
    : [{
        content_id: params.content_id || (Array.isArray(params.content_ids) ? params.content_ids[0] : ""),
        content_name: params.content_name,
        content_category: params.content_category,
        quantity: params.quantity || 1,
        price: params.price || params.item_price || params.value
      }];

  const contents = rawContents.map(normalizeTikTokContent);
  const contentIds = Array.isArray(params.content_ids) && params.content_ids.length
    ? params.content_ids.map(String)
    : contents.map(function(item) { return item.content_id; }).filter(Boolean);
  const quantity = contents.reduce(function(sum, item) { return sum + (item.quantity || 1); }, 0) || (params.quantity || 1);
  const value = params.value != null
    ? tiktokToNumber(params.value)
    : contents.reduce(function(sum, item) { return sum + tiktokToNumber(item.price) * (item.quantity || 1); }, 0);

  const out = {
    content_type: params.content_type || "product",
    content_ids: contentIds,
    contents: contents,
    quantity: quantity,
    value: value,
    currency: params.currency || "VND"
  };

  const description = params.description || params.content_name || contents.map(function(item) {
    return item.content_name;
  }).filter(Boolean).join(", ");
  if (description) out.description = description;
  const eventId = params.event_id || params.eventID || options.event_id || options.eventID;
  if (eventId) out.event_id = String(eventId);
  return out;
}

// GA (giữ nguyên)
(function() {
  const s1 = document.createElement('script');
  s1.src = 'https://www.googletagmanager.com/gtag/js?id=G-RXC205951M';
  s1.async = true;
  document.head.appendChild(s1);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', 'G-RXC205951M');
})();

// ======= GA4 Ecommerce helpers =======
function ga4TrackEvent(eventName, params) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params || {});
  console.log(`[GA4] Tracked: ${eventName}`, params || {});
}

function ga4ToNumber(value) {
  var n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function ga4BuildItem(input, fallbackQuantity) {
  input = input || {};
  var quantity = Math.max(1, parseInt(input.quantity || input.qty || fallbackQuantity || 1, 10) || 1);
  var price = ga4ToNumber(input.price || input.item_price || input.product_price || input["Gi\u00e1"] || input["Gi\u00c3\u00a1"]);
  var itemId = input.item_id || input.id || input.product_id || input.product_code || input.feed_product_code || input.sku || window.productPage || 'unknown';
  var itemName = input.item_name || input.name || input.product_name || input.content_name || input["Ph\u00e2n lo\u1ea1i"] || input["Ph\u00c3\u00a2n lo\u00e1\u00ba\u00a1i"] || window.productName || itemId;
  return {
    item_id: String(itemId || 'unknown'),
    item_name: String(itemName || itemId || 'unknown'),
    price: price,
    quantity: quantity
  };
}

function trackGA4EcommerceEvent(eventName, payload) {
  payload = payload || {};
  var rawItems = Array.isArray(payload.items) ? payload.items : [payload.item || payload];
  var items = rawItems.map(function(item) {
    return ga4BuildItem(item, payload.quantity);
  }).filter(function(item) {
    return !!item.item_id || !!item.item_name;
  });
  if (!items.length) return;

  var value = payload.value != null
    ? ga4ToNumber(payload.value)
    : items.reduce(function(sum, item) { return sum + ga4ToNumber(item.price) * (item.quantity || 1); }, 0);

  var params = {
    currency: payload.currency || 'VND',
    value: value,
    items: items
  };

  if (eventName === 'purchase') {
    if (!payload.transaction_id) return;
    params.transaction_id = String(payload.transaction_id);
    if (payload.shipping != null) params.shipping = ga4ToNumber(payload.shipping);
  }

  ga4TrackEvent(eventName, params);
}

window.ga4TrackEvent = ga4TrackEvent;
window.trackGA4EcommerceEvent = trackGA4EcommerceEvent;
