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
fbq('init', '644988365190821'); // Pixel phụ
fbq('track', 'PageView');

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

// ======= Hàm gọi cả Meta & TikTok Pixel với tham số =======
function trackBothPixels(eventName, params = {}) {
  // Facebook Pixel (2 ID)
  if (typeof fbq !== 'undefined') {
    fbq('track', eventName, params);
    console.log(`[Facebook Pixel] Tracked: ${eventName}`, params);
  }

  // TikTok Pixel
  if (typeof ttq !== 'undefined') {
    ttq.track(eventName, params);
    console.log(`[TikTok Pixel] Tracked: ${eventName}`, params);
  }
}
