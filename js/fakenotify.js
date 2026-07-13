(function () {
  "use strict";
  if (window.__fakeNotifyLoaded) return;
  window.__fakeNotifyLoaded = true;

  var config = {
    fallbackBottom: 72,
    footerGap: 12,
    visibleLeft: 12,
    hiddenLeft: -420,
    firstDelay: 5000,
    showMs: 5000,
    minGapMs: 10000,
    maxGapMs: 25000
  };

  var defaults = {
    users: [
      "T**u", "M**n", "H***e", "AnhT***", "B***C", "HoangA***",
      "L***Huong", "Q***Khanh", "KimL***", "MyLinh", "N***A", "VanK***"
    ],
    products: [
      "Dép Chạy BCU5568", "Vợt Hammer Đỏ", "Vợt Prime FullFoam",
      "Dép Chạy BN68", "Vợt TruFoam Panther Cam", "Vợt Gen4 Trắng",
      "Vợt TruFoam Panther Xanh", "Vợt Active Xanh"
    ],
    actions: ["Vừa Đặt Mua", "Vừa Thêm Vào Giỏ"]
  };
  var custom = window.FAKE_NOTIFY || {};
  var users = custom.users || defaults.users;
  var products = custom.products || defaults.products;
  var actions = custom.actions || defaults.actions;
  var timer = 0;
  var firstTimer = 0;
  var suppressed = false;

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function nextGap() {
    return Math.floor(Math.random() * (config.maxGapMs - config.minGapMs)) + config.minGapMs;
  }

  function activeFooterHeight() {
    var height = 0;
    document.querySelectorAll("#fsport-nav-footer, .sticky-footer").forEach(function (footer) {
      var style = window.getComputedStyle(footer);
      var rect = footer.getBoundingClientRect();
      if (style.display !== "none" && style.visibility !== "hidden" && rect.height > 0) {
        height = Math.max(height, rect.height);
      }
    });
    return height;
  }

  function updatePosition() {
    var notification = document.getElementById("fakeNotification");
    if (!notification) return;
    var footerHeight = activeFooterHeight();
    notification.style.bottom =
      (footerHeight ? footerHeight + config.footerGap : config.fallbackBottom) + "px";
  }

  function isCartPopupOpen() {
    var popup = document.getElementById("cartPopup");
    if (!popup) return false;
    var style = window.getComputedStyle(popup);
    return style.display !== "none" && !popup.classList.contains("hidden");
  }

  function isAiChatOpen() {
    var panel = document.getElementById("aic-panel");
    var backdrop = document.getElementById("aic-backdrop");
    return document.body.classList.contains("aic-panel-open") ||
      (panel && window.getComputedStyle(panel).display !== "none") ||
      (backdrop && window.getComputedStyle(backdrop).display !== "none");
  }

  function hideNotification() {
    var notification = document.getElementById("fakeNotification");
    if (notification) notification.style.left = config.hiddenLeft + "px";
  }

  function updateSuppressedState() {
    var shouldSuppress = isCartPopupOpen() || isAiChatOpen();
    if (shouldSuppress === suppressed) return;
    suppressed = shouldSuppress;
    if (suppressed) {
      window.clearTimeout(timer);
      window.clearTimeout(firstTimer);
      hideNotification();
    } else if (!document.hidden) {
      start();
    }
  }

  var style = document.createElement("style");
  style.textContent = [
    "#fakeNotification{",
    "position:fixed;",
    "bottom:" + config.fallbackBottom + "px;",
    "left:" + config.hiddenLeft + "px;",
    "z-index:9000;",
    "max-width:min(calc(100vw - 24px),360px);",
    "padding:8px 14px;",
    "overflow:hidden;",
    "border-radius:999px;",
    "background:#fff;",
    "box-shadow:0 2px 8px rgba(0,0,0,.2);",
    "color:#111;",
    "font:400 12px/1.35 'Be Vietnam Pro',system-ui,sans-serif;",
    "white-space:nowrap;",
    "text-overflow:ellipsis;",
    "pointer-events:none;",
    "transition:left .6s ease,bottom .2s ease;",
    "}",
    "@media(max-width:380px){#fakeNotification{font-size:11px;padding:7px 12px;}}"
  ].join("");
  document.head.appendChild(style);

  function ensureNode() {
    var notification = document.getElementById("fakeNotification");
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "fakeNotification";
      notification.setAttribute("role", "status");
      notification.setAttribute("aria-live", "polite");
      document.body.appendChild(notification);
    }
    updatePosition();
    return notification;
  }

  function showOnce() {
    updateSuppressedState();
    if (suppressed || document.hidden) return;
    var notification = ensureNode();
    notification.textContent =
      randomItem(users) + " " + randomItem(actions) + " " + randomItem(products);
    updatePosition();
    notification.style.left = config.visibleLeft + "px";

    window.setTimeout(function () {
      notification.style.left = config.hiddenLeft + "px";
    }, config.showMs);
    timer = window.setTimeout(showOnce, nextGap());
  }

  function start() {
    window.clearTimeout(timer);
    window.clearTimeout(firstTimer);
    updateSuppressedState();
    if (suppressed || document.hidden) return;
    firstTimer = window.setTimeout(showOnce, config.firstDelay);
  }

  window.FSPORT_FAKE_NOTIFY = {
    hide: function () {
      window.clearTimeout(timer);
      window.clearTimeout(firstTimer);
      hideNotification();
    },
    refresh: updateSuppressedState
  };

  var observer = new MutationObserver(function () {
    updatePosition();
    updateSuppressedState();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
  window.addEventListener("resize", function () {
    updatePosition();
    updateSuppressedState();
  }, { passive: true });
  window.addEventListener("orientationchange", function () {
    updatePosition();
    updateSuppressedState();
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      window.clearTimeout(timer);
      window.clearTimeout(firstTimer);
    } else {
      start();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
