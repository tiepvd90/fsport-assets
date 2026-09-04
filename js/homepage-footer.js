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
  var footerConfig = {}

  function fetchFooterConfig(cb) {
    var url = window.FSPORT_SUPABASE_URL || 'https://xcigbbcpwfzluqazadez.supabase.co'
    var anon = window.FSPORT_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4'
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url + '/rest/v1/rpc/get_homepage_sticky_footer', true)
    xhr.setRequestHeader('apikey', anon)
    xhr.setRequestHeader('Authorization', 'Bearer ' + anon)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onload = function() {
      try {
        var rows = JSON.parse(xhr.responseText)
        cb((rows && rows[0] && rows[0].config) || {})
      } catch (_) { cb({}) }
    }
    xhr.onerror = function() { cb({}) }
    xhr.send('{}')
  }

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
    link: function() {
      return '<svg class="fs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.1.1l2-2A5 5 0 0 0 12 4l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>'
    },
  }

  function escapeAttr(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function footerIcon(name, active, iconUrl) {
    var custom = iconUrl || footerConfig[name + '_icon_url']
    if (custom && name === 'cart') return '<span class="fs-cart-icon-wrap"><img class="fs-nav-icon" src="' + escapeAttr(custom) + '" alt=""><span class="fs-cart-count" data-cart-count>0</span></span>'
    if (custom) return '<img class="fs-nav-icon" src="' + escapeAttr(custom) + '" alt="">'
    return (ICONS[name] || ICONS.link)(active)
  }

  function configuredItems() {
    if (Array.isArray(footerConfig.items) && footerConfig.items.length) {
      return footerConfig.items.slice(0, 6).map(function(item, index) {
        return {
          id: String(item.id || ('item-' + index)),
          action: item.action === 'chat' || item.action === 'cart' ? item.action : 'link',
          label: String(item.label || 'ITEM'),
          url: String(item.url || ''),
          icon_url: String(item.icon_url || '')
        }
      })
    }
    return [
      { id:'home', action:'link', label:footerConfig.home_label || 'HOME', url:footerConfig.home_url || HOME_URL, icon_url:footerConfig.home_icon_url || '' },
      { id:'feed', action:'link', label:footerConfig.feed_label || 'FEED', url:footerConfig.feed_url || FEED_URL, icon_url:footerConfig.feed_icon_url || '' },
      { id:'chat', action:'chat', label:footerConfig.chat_label || 'CHAT', icon_url:footerConfig.chat_icon_url || '' },
      { id:'cart', action:'cart', label:footerConfig.cart_label || 'CART', icon_url:footerConfig.cart_icon_url || '' }
    ]
  }

  function itemIsActive(item) {
    if (item.action !== 'link' || !item.url) return false
    try {
      var targetPath = new URL(item.url, window.location.origin).pathname.replace(/\/$/, '') || '/'
      var currentPath = path.replace(/\/$/, '') || '/'
      if (targetPath === '/index.html') targetPath = '/'
      if (currentPath === '/index.html') currentPath = '/'
      return targetPath === currentPath || (targetPath === '/feed' && currentPath.indexOf('/feed') === 0)
    } catch (_) { return false }
  }

  // ── Build item ───────────────────────────────────────────────
  function linkTab(item, active) {
    var color = active ? '#050505' : '#8a8a8a'
    return '<a class="fs-nav-tab' + (active ? ' is-active' : '') + '" href="' + escapeAttr(item.url || '#') + '"' + (active ? ' aria-current="page"' : '') + ' style="color:' + color + '">' +
      '<span class="fs-nav-icon-shell">' + footerIcon(item.id, active, item.icon_url) + '</span>' +
      '<span class="fs-nav-label">' + escapeAttr(item.label) + '</span>' +
    '</a>'
  }

  function actionTab(item) {
    return '<button type="button" class="fs-nav-tab" data-footer-action="' + item.action + '" aria-label="' + escapeAttr(item.label) + '">' +
      '<span class="fs-nav-icon-shell">' + footerIcon(item.action, false, item.icon_url) + '</span>' +
      '<span class="fs-nav-label">' + escapeAttr(item.label) + '</span>' +
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
    if (window.FSPORT_FAKE_NOTIFY && typeof window.FSPORT_FAKE_NOTIFY.hide === 'function') {
      window.FSPORT_FAKE_NOTIFY.hide()
    }
    if (typeof window.showCheckoutPopup === 'function') {
      window.showCheckoutPopup()
      return
    }
    var existingCart = document.getElementById('cartIcon')
    if (existingCart) existingCart.click()
  }

  function openChat() {
    if (window.FSPORT_FAKE_NOTIFY && typeof window.FSPORT_FAKE_NOTIFY.hide === 'function') {
      window.FSPORT_FAKE_NOTIFY.hide()
    }
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
      script.src = '/js/ai-chat.js?v=20260806-active-products-only-1'
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
    var items = configuredItems()
    var rounded = footerConfig.footer_style === 'rounded'

    var el = document.createElement('div')
    el.id = 'fsport-nav-footer'
    el.className = rounded ? 'is-rounded' : 'is-rectangle'
    el.style.cssText = [
      'position:fixed', rounded ? 'bottom:max(8px, env(safe-area-inset-bottom))' : 'bottom:0',
      'left:50%', 'transform:translateX(-50%)',
      rounded ? 'width:calc(100% - 20px)' : 'width:100%', 'max-width:1180px',
      'background:#fff',
      'display:flex',
      'align-items:stretch',
      'z-index:9998',
      rounded ? 'border-radius:22px' : 'border-radius:0',
      rounded ? 'border:1px solid rgba(15,23,42,.10)' : 'border-top:1px solid #e5e7eb',
      rounded ? 'box-shadow:0 8px 28px rgba(15,23,42,.14),0 2px 8px rgba(15,23,42,.08)' : 'box-shadow:0 -1px 12px rgba(0,0,0,0.06)',
      rounded ? 'padding:4px 6px' : 'padding-bottom:env(safe-area-inset-bottom)',
      'box-sizing:border-box',
      (footerConfig.footer_height ? 'min-height:' + Number(footerConfig.footer_height) + 'px' : ''),
    ].join(';')

    el.innerHTML = items.map(function(item) {
      return item.action === 'link' ? linkTab(item, itemIsActive(item)) : actionTab(item)
    }).join('')

    document.body.appendChild(el)
    el.querySelectorAll('[data-footer-action="chat"]').forEach(function(button) { button.addEventListener('click', openChat) })
    el.querySelectorAll('[data-footer-action="cart"]').forEach(function(button) { button.addEventListener('click', openCart) })
    updateFooterCartCount()

    // Padding body để nội dung không bị che
    var h = el.offsetHeight || 60
    document.body.style.paddingBottom = (parseInt(document.body.style.paddingBottom || '0', 10) + h + (rounded ? 16 : 0)) + 'px'
  }

  function removeFooter() {
    var el = document.getElementById('fsport-nav-footer')
    if (el) el.remove()
  }

  function ensureFooterStyle() {
    if (document.getElementById('fsport-nav-footer-style')) return
    var style = document.createElement('style')
    style.id = 'fsport-nav-footer-style'
    style.textContent = '#fsport-nav-footer{--fs-nav-icon:30px}.fs-nav-tab{position:relative;flex:1;min-width:0;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 2px 7px;text-decoration:none;color:#8a8a8a;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .15s ease,transform .12s ease}.fs-nav-tab:active{transform:scale(.96)}.fs-nav-tab:focus-visible{outline:2px solid #111;outline-offset:-3px;border-radius:16px}.fs-nav-icon-shell{width:48px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:18px;transition:background-color .15s ease}.fs-nav-tab.is-active .fs-nav-icon-shell{background:#f0f1f3}.fs-nav-label{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 10px/1.2 -apple-system,\"Be Vietnam Pro\",sans-serif;letter-spacing:.03em}.fs-nav-tab.is-active .fs-nav-label{font-weight:700}.fs-nav-icon{width:var(--fs-nav-icon);height:var(--fs-nav-icon);display:block;object-fit:contain}.fs-cart-icon-wrap{position:relative;display:block}.fs-cart-count{position:absolute;top:-7px;right:-10px;min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:#e53935;color:#fff;font:700 10px/17px -apple-system,\"Be Vietnam Pro\",sans-serif;text-align:center;border:2px solid #fff}.fs-cart-count[hidden]{display:none}#fsport-nav-footer.is-rounded{overflow:visible}@media(max-width:374px){#fsport-nav-footer.is-rounded{width:calc(100% - 12px)!important;border-radius:19px!important;padding-left:2px!important;padding-right:2px!important}.fs-nav-icon-shell{width:42px}}@media (min-width:768px){#fsport-nav-footer{--fs-nav-icon:36px}.fs-nav-tab{padding-top:10px;padding-bottom:8px}.fs-nav-label{font-size:15px}#fsport-nav-footer.is-rounded{max-width:760px!important;border-radius:25px!important}.fs-nav-icon-shell{width:58px;height:40px;border-radius:20px}}'
    document.head.appendChild(style)
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    var frontendReady = window.FSPORT_FRONTEND_PAGE_CONFIG_PROMISE || Promise.resolve(null)
    frontendReady.catch(function() { return null }).then(function(pageConfig) {
      if (pageConfig && pageConfig.settings && pageConfig.settings.stickyFooter && pageConfig.settings.stickyFooter.enabled === false) {
        removeFooter()
        return
      }
      function finish(config) {
        footerConfig = config || {}
        if (isLocal) { buildFooter(); return }
        fetchFeedSettings(function(cfg) {
          if (cfg.enabled === false || cfg.stickyFooter === false) { removeFooter(); return }
          buildFooter()
        })
      }
      if (pageConfig && pageConfig.stickyFooter) {
        finish(pageConfig.stickyFooter.config)
        return
      }
      fetchFooterConfig(function(config) {
        finish(config)
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

})()
