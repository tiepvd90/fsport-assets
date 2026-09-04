(function () {
  if (window.__FSPORT_STICKY_FOOTER_CONFIG_LOADING) return
  window.__FSPORT_STICKY_FOOTER_CONFIG_LOADING = true
  var slug = window.productPage || ''
  if (!slug) return

  function legacyConfig() {
    var url = window.FSPORT_SUPABASE_URL || 'https://xcigbbcpwfzluqazadez.supabase.co'
    return fetch(url + '/functions/v1/product-page-config?footerOnly=1&slug=' + encodeURIComponent(slug), {
      method: 'GET'
    }).then(function(response) {
      if (!response.ok) throw new Error('Sticky Footer HTTP ' + response.status)
      return response.json()
    }).then(function(payload) {
      return payload && payload.stickyFooter && payload.stickyFooter.config
    })
  }

  function escapeAttr(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function configuredItems(config) {
    if (Array.isArray(config.items) && config.items.length) {
      return config.items.slice(0, 6).map(function(item, index) {
        return {
          id:String(item.id || ('item-' + index)),
          action:item.action === 'chat' || item.action === 'cart' ? item.action : 'link',
          label:String(item.label || 'ITEM'),
          url:String(item.url || ''),
          icon_url:String(item.icon_url || '')
        }
      })
    }
    return [
      { id:'home', action:'link', label:config.home_label || 'Home', url:config.home_url || 'https://fun-sport.co', icon_url:config.home_icon_url || '' },
      { id:'messenger', action:'link', label:config.messenger_label || 'Mess', url:config.messenger_url || 'https://m.me/funsport1', icon_url:config.messenger_icon_url || '' },
      { id:'zalo', action:'link', label:config.zalo_label || 'Zalo', url:config.zalo_url || 'https://zalo.me/0384735980', icon_url:config.zalo_icon_url || '' },
      { id:'phone', action:'link', label:config.phone_label || 'Call', url:config.phone ? 'tel:' + String(config.phone).replace(/\s+/g, '') : 'tel:0384735980', icon_url:config.phone_icon_url || '' },
      { id:'cart', action:'cart', label:config.cart_label || 'THÊM VÀO GIỎ HÀNG', url:'', icon_url:config.cart_icon_url || '' }
    ]
  }

  var FALLBACK_ICONS = {
    home:'https://img.icons8.com/ios-filled/40/000000/home.png',
    messenger:'https://img.icons8.com/ios-filled/40/000000/facebook-messenger.png',
    zalo:'https://img.icons8.com/ios-filled/40/000000/zalo.png',
    phone:'https://img.icons8.com/ios-filled/40/000000/phone.png'
  }

  function iconHtml(item) {
    var source = item.icon_url || FALLBACK_ICONS[item.id]
    if (source) return '<img src="' + escapeAttr(source) + '" alt="">'
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1.1l2-2A5 5 0 0 0 12 4l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>'
  }

  function openChat() {
    if (window.FSPORT_AI_CHAT && typeof window.FSPORT_AI_CHAT.open === 'function') return window.FSPORT_AI_CHAT.open()
    var trigger = document.getElementById('aic-bar-inner') || document.getElementById('aic-bar-logo')
    if (trigger) trigger.click()
  }

  function ensureStyle(config) {
    var style = document.getElementById('product-sticky-footer-runtime-style') || document.createElement('style')
    style.id = 'product-sticky-footer-runtime-style'
    var height = Math.max(48, Math.min(140, Number(config.footer_height) || 64))
    style.textContent = '.sticky-footer .fs-product-footer-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:38px;color:#111;text-decoration:none;border:0;background:transparent;padding:2px;cursor:pointer;font:500 10px/1.15 "Be Vietnam Pro",sans-serif;-webkit-tap-highlight-color:transparent}.sticky-footer .fs-product-footer-item img,.sticky-footer .fs-product-footer-item svg{display:block;width:22px;height:22px;object-fit:contain}.sticky-footer #btn-atc{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;background:#e11d2e;color:#fff;font-weight:800;border:0;border-radius:10px;padding:9px 13px;font-size:13px;white-space:nowrap}.sticky-footer #btn-atc img{width:20px;height:20px;object-fit:contain}.sticky-footer.is-rounded{overflow:visible}.sticky-footer.is-rounded #btn-atc{border-radius:12px}@media(max-width:400px){.sticky-footer .fs-product-footer-item{min-width:32px;font-size:9px}.sticky-footer .fs-product-footer-item img,.sticky-footer .fs-product-footer-item svg{width:20px;height:20px}.sticky-footer #btn-atc{padding:8px 10px;font-size:12px}}@media(min-width:768px){.sticky-footer.is-rounded,.sticky-footer.is-rectangle{left:50%!important;right:auto!important;width:100%!important;max-width:1180px!important;transform:translateX(-50%);justify-content:center!important;height:' + height + 'px!important;min-height:' + height + 'px!important;padding:9px 18px!important;gap:0!important}.sticky-footer .fs-product-footer-item{flex:1 1 0;min-width:0;font-size:12px}.sticky-footer .fs-product-footer-item img,.sticky-footer .fs-product-footer-item svg{width:32px;height:32px}.sticky-footer #btn-atc{box-sizing:border-box;flex:0 0 50%;width:50%;min-width:0;max-width:50%;min-height:52px;margin-left:14px;padding:12px 30px;font-size:16px!important}}'
    if (!style.parentNode) document.head.appendChild(style)
  }

  function applyConfig(config) {
    if (!config) return
    var footer = document.querySelector('.sticky-footer')
    var cart = document.getElementById('btn-atc')
    if (!footer || !cart) return
    var items = configuredItems(config)
    var rounded = config.footer_style === 'rounded'
    ensureStyle(config)

    footer.classList.toggle('is-rounded', rounded)
    footer.classList.toggle('is-rectangle', !rounded)
    footer.style.bottom = rounded ? 'max(8px, env(safe-area-inset-bottom))' : '0'
    footer.style.left = rounded ? '10px' : '0'
    footer.style.right = rounded ? '10px' : '0'
    footer.style.width = rounded ? 'auto' : '100%'
    footer.style.maxWidth = rounded ? 'none' : '100vw'
    footer.style.borderRadius = rounded ? '22px' : '0'
    footer.style.border = rounded ? '1px solid rgba(15,23,42,.10)' : '0'
    footer.style.borderTop = rounded ? '1px solid rgba(15,23,42,.10)' : '1px solid #ddd'
    footer.style.boxShadow = rounded ? '0 8px 28px rgba(15,23,42,.14),0 2px 8px rgba(15,23,42,.08)' : '0 -1px 12px rgba(0,0,0,.06)'
    footer.style.gap = '12px'

    footer.innerHTML = ''
    items.forEach(function(item) {
      if (item.action === 'cart') {
        cart.innerHTML = item.icon_url ? '<img src="' + escapeAttr(item.icon_url) + '" alt=""><span>' + escapeAttr(item.label) + '</span>' : escapeAttr(item.label)
        cart.dataset.footerItemId = item.id
        footer.appendChild(cart)
        return
      }
      var element
      if (item.action === 'chat') {
        element = document.createElement('button')
        element.type = 'button'
        element.addEventListener('click', openChat)
      } else {
        element = document.createElement('a')
        element.href = item.url || '#'
        if (item.id !== 'home' && /^https?:/i.test(item.url || '')) { element.target = '_blank'; element.rel = 'noopener' }
      }
      element.className = 'fs-product-footer-item'
      element.dataset.footerItemId = item.id
      element.innerHTML = iconHtml(item) + '<span>' + escapeAttr(item.label) + '</span>'
      footer.appendChild(element)
    })
    if (!cart.parentNode || cart.parentNode !== footer) footer.appendChild(cart)
    window.__fsportStickyFooterConfig = config
  }

  window.FSPORT_PRODUCT_STICKY_FOOTER = { apply:applyConfig }
  var ready = window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || Promise.resolve(null)
  ready.catch(function() { return null }).then(function(runtime) {
    var runtimeConfig = runtime && runtime.stickyFooter && runtime.stickyFooter.config
    return runtimeConfig || legacyConfig()
  }).then(applyConfig).catch(function(error) {
    console.warn('[StickyFooter] Using static fallback:', error.message)
  })
})()
