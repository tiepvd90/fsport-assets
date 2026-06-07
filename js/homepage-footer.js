// ================================================================
// homepage-footer.js — Bottom nav TikTok style
// Chỉ dùng cho: index.html (homepage) và /feed (feed page)
// Nền đen, icon trắng. Tổng 4 slots — hiện dùng 2.
// Toggle bật/tắt từ ERP Settings → Feed → "Tab Feed trong sticky footer"
// ================================================================
;(function () {
  'use strict'

  // Local (Live Server / file://) dùng /feed.html, production dùng /feed
  var isLocal  = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:'
  var FEED_URL = isLocal ? '/feed.html' : '/feed'
  var HOME_URL = isLocal ? '/index.html' : '/'

  var path       = window.location.pathname
  var isFeed     = path === '/feed' || path === '/feed.html' || path.startsWith('/feed/')
  var isHomepage = path === '/' || path === '/index.html'

  if (!isHomepage && !isFeed) return

  // ── Đọc toggle từ Supabase (anon) ───────────────────────────
  function fetchFeedSettings(cb) {
    var url  = window.FSPORT_SUPABASE_URL  || ''
    var anon = window.FSPORT_SUPABASE_ANON || ''
    if (!url || !anon) { cb({ enabled: true, stickyFooter: true }); return }
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url + '/rest/v1/rpc/get_public_feed_settings', true)
    xhr.setRequestHeader('apikey', anon)
    xhr.setRequestHeader('Authorization', 'Bearer ' + anon)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.timeout = 3000
    xhr.onload = function () {
      try { cb(JSON.parse(xhr.responseText) || { enabled: true, stickyFooter: true }) }
      catch (e) { cb({ enabled: true, stickyFooter: true }) }
    }
    xhr.onerror = xhr.ontimeout = function () { cb({ enabled: true, stickyFooter: true }) }
    xhr.send('{}')
  }

  // ── SVG icons ───────────────────────────────────────────────
  var ICONS = {
    home: function(active) {
      return active
        ? '<svg class="fs-nav-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M3.4 10.9 12 3.35l8.6 7.55a1 1 0 0 1 .34.75V20a1 1 0 0 1-1 1H15v-6.15a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1V21H4.06a1 1 0 0 1-1-1v-8.35a1 1 0 0 1 .34-.75Z"/></svg>'
        : '<svg class="fs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M3.4 10.9 12 3.35l8.6 7.55"/><path d="M5 10.8V20h4v-5.5h6V20h4v-9.2"/></svg>'
    },
    feed: function(active) {
      return active
        ? '<svg class="fs-nav-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5Zm3.4 5.05a.85.85 0 0 0-1.3.72v5.46a.85.85 0 0 0 1.3.72l4.35-2.73a.85.85 0 0 0 0-1.44L10.4 8.55Z"/></svg>'
        : '<svg class="fs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m10 8.8 5 3.2-5 3.2Z"/></svg>'
    },
    chat: function() {
      return '<svg class="fs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2.24V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>'
    },
    cart: function() {
      return '<span class="fs-cart-icon-wrap"><svg class="fs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 8.5h11l1 11h-13l1-11Z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9"/></svg><span class="fs-cart-count" data-cart-count>0</span></span>'
    },
  }

  // ── Build tab ────────────────────────────────────────────────
  function tab(href, iconName, label, active) {
    var color = active ? '#050505' : '#8a8a8a'
    return '<a href="' + href + '" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-decoration:none;color:' + color + ';padding:10px 0 8px;-webkit-tap-highlight-color:transparent;transition:color .15s">' +
      ICONS[iconName](active) +
      '<span style="font-size:10px;font-weight:' + (active ? '700' : '500') + ';letter-spacing:.03em;font-family:-apple-system,\'Be Vietnam Pro\',sans-serif">' + label + '</span>' +
    '</a>'
  }

  function cartTab() {
    return '<button type="button" id="fs-footer-cart" aria-label="Cart" style="flex:1;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#8a8a8a;padding:10px 0 8px;cursor:pointer;-webkit-tap-highlight-color:transparent">' +
      ICONS.cart() +
      '<span style="font-size:10px;font-weight:500;letter-spacing:.03em;font-family:-apple-system,\'Be Vietnam Pro\',sans-serif">CART</span>' +
    '</button>'
  }

  function chatTab() {
    return '<button type="button" id="fs-footer-chat" aria-label="AI Chat" style="flex:1;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#8a8a8a;padding:10px 0 8px;cursor:pointer;-webkit-tap-highlight-color:transparent">' +
      ICONS.chat() +
      '<span style="font-size:10px;font-weight:500;letter-spacing:.03em;font-family:-apple-system,\'Be Vietnam Pro\',sans-serif">CHAT</span>' +
    '</button>'
  }

  function cartQuantity() {
    try {
      return (JSON.parse(localStorage.getItem('cart') || '[]') || []).reduce(function(sum, item) {
        return sum + Number(item.quantity || 1)
      }, 0)
    } catch (e) {
      return 0
    }
  }

  function updateFooterCartCount() {
    var count = cartQuantity()
    document.querySelectorAll('[data-cart-count]').forEach(function(el) {
      el.textContent = count
      el.hidden = false
    })
  }

  function openCart() {
    if (typeof window.showCheckoutPopup === 'function') {
      window.showCheckoutPopup()
      return
    }
    var existingCart = document.getElementById('cartIcon')
    if (existingCart) existingCart.click()
  }

  function openChat() {
    if (window.FSPORT_AI_CHAT && typeof window.FSPORT_AI_CHAT.open === 'function') {
      window.FSPORT_AI_CHAT.open()
      return
    }
    var bar = document.getElementById('aic-bar-inner') || document.getElementById('aic-bar-logo')
    if (bar) {
      bar.click()
      return
    }
    if (!document.getElementById('aic-container')) {
      var container = document.createElement('div')
      container.id = 'aic-container'
      document.body.appendChild(container)
    }

    function initAndOpen() {
      if (!window.AiChat || typeof window.AiChat.init !== 'function') return Promise.reject(new Error('AI Chat unavailable'))
      return window.AiChat.init({ slug: 'global', productGroup: '' }).then(function() {
        if (window.FSPORT_AI_CHAT && typeof window.FSPORT_AI_CHAT.open === 'function') {
          window.FSPORT_AI_CHAT.open()
        }
      })
    }

    if (window.AiChat) {
      initAndOpen()
      return
    }

    if (!window.FSPORT_AI_CHAT_LOADING) {
      window.FSPORT_AI_CHAT_LOADING = new Promise(function(resolve, reject) {
      var script = document.createElement('script')
      script.id = 'fs-footer-ai-chat-loader'
      script.src = '/js/ai-chat.js?v=20260607-3'
        script.onload = resolve
        script.onerror = reject
      document.body.appendChild(script)
      })
    }
    window.FSPORT_AI_CHAT_LOADING.then(initAndOpen).catch(function(err) {
      console.warn('[Footer] AI Chat load failed', err)
      window.FSPORT_AI_CHAT_LOADING = null
    })
  }

  // ── Build footer ─────────────────────────────────────────────
  function buildFooter() {
    if (document.getElementById('fsport-nav-footer')) return
    ensureFooterStyle()

    var el = document.createElement('div')
    el.id = 'fsport-nav-footer'
    el.style.cssText = [
      'position:fixed', 'bottom:0',
      'left:50%', 'transform:translateX(-50%)',
      'width:100%', 'max-width:1180px',
      'background:#fff',
      'display:flex',
      'align-items:stretch',
      'z-index:9998',
      'border-radius:0',
      'border-top:1px solid #e5e7eb',
      'box-shadow:0 -1px 12px rgba(0,0,0,0.06)',
      'padding-bottom:env(safe-area-inset-bottom)',
      'box-sizing:border-box',
    ].join(';')

    el.innerHTML =
      tab(HOME_URL, 'home', 'HOME', isHomepage) +
      tab(FEED_URL, 'feed', 'FEED', isFeed) +
      chatTab() +
      cartTab()
    // Slot 3 và 4 thêm vào đây sau khi có ý tưởng

    document.body.appendChild(el)
    document.getElementById('fs-footer-chat').addEventListener('click', openChat)
    document.getElementById('fs-footer-cart').addEventListener('click', openCart)
    document.getElementById('fs-footer-cart').setAttribute('aria-label', 'Cart')
    updateFooterCartCount()

    // Padding body để nội dung không bị che
    var h = el.offsetHeight || 60
    document.body.style.paddingBottom = (parseInt(document.body.style.paddingBottom || '0', 10) + h) + 'px'
  }

  function removeFooter() {
    var el = document.getElementById('fsport-nav-footer')
    if (el) el.remove()
  }

  function ensureFooterStyle() {
    if (document.getElementById('fsport-nav-footer-style')) return
    var style = document.createElement('style')
    style.id = 'fsport-nav-footer-style'
    style.textContent = '#fsport-nav-footer{--fs-nav-icon:30px}.fs-nav-icon{width:var(--fs-nav-icon);height:var(--fs-nav-icon);display:block}.fs-cart-icon-wrap{position:relative;display:block}.fs-cart-count{position:absolute;top:-7px;right:-10px;min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:#e53935;color:#fff;font:700 10px/17px -apple-system,\"Be Vietnam Pro\",sans-serif;text-align:center;border:2px solid #fff}.fs-cart-count[hidden]{display:none}@media (min-width:768px){#fsport-nav-footer{--fs-nav-icon:50px}#fsport-nav-footer a,#fsport-nav-footer button{padding-top:12px!important;padding-bottom:10px!important}#fsport-nav-footer span:not(.fs-cart-count){font-size:11px!important}}'
    document.head.appendChild(style)
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    // Local: skip Supabase, luôn hiện footer
    if (isLocal) { buildFooter(); return }
    fetchFeedSettings(function (cfg) {
      if (cfg.enabled === false || cfg.stickyFooter === false) { removeFooter(); return }
      buildFooter()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

})()
