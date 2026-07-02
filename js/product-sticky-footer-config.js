;(function () {
  if (window.__FSPORT_STICKY_FOOTER_CONFIG_LOADING) return
  window.__FSPORT_STICKY_FOOTER_CONFIG_LOADING = true
  var slug = window.productPage || ''
  if (!slug) return

  function legacyConfig() {
    var url = window.FSPORT_SUPABASE_URL || 'https://xcigbbcpwfzluqazadez.supabase.co'
    var anon = window.FSPORT_SUPABASE_ANON || ''
    if (!anon) return Promise.resolve(null)
    return fetch(url + '/rest/v1/rpc/get_product_page_sticky_footer', {
      method: 'POST',
      headers: { apikey: anon, Authorization: 'Bearer ' + anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: slug })
    }).then(function(response) {
      if (!response.ok) throw new Error('Sticky Footer HTTP ' + response.status)
      return response.json()
    }).then(function(rows) {
      return rows && rows[0] && rows[0].config
    })
  }

  function applyConfig(config) {
    if (!config) return
    function apply(id, href, label, iconUrl) {
      var element = document.getElementById(id)
      if (!element) return
      if (href) element.href = href
      var text = element.querySelector('span')
      if (text && label) text.textContent = label
      var image = element.querySelector('img')
      if (image && iconUrl) image.src = iconUrl
    }
    apply('home-link', config.home_url, config.home_label, config.home_icon_url)
    apply('messenger-link', config.messenger_url, config.messenger_label, config.messenger_icon_url)
    apply('zalo-link', config.zalo_url, config.zalo_label, config.zalo_icon_url)
    apply('call-link', config.phone ? 'tel:' + String(config.phone).replace(/\s+/g, '') : '', config.phone_label, config.phone_icon_url)
    var cart = document.getElementById('btn-atc')
    if (cart && config.cart_label) cart.textContent = config.cart_label
    var footer = document.querySelector('.sticky-footer')
    if (footer && config.footer_height) {
      var style = document.getElementById('product-sticky-footer-runtime-size') || document.createElement('style')
      style.id = 'product-sticky-footer-runtime-size'
      style.textContent = '@media(min-width:768px){.sticky-footer{height:' + Number(config.footer_height) + 'px!important;min-height:' + Number(config.footer_height) + 'px!important;padding:9px 18px!important}.sticky-footer>div{gap:28px!important}.sticky-footer a{font-size:12px!important}.sticky-footer a img{width:28px!important;height:28px!important}.sticky-footer #btn-atc{min-height:46px!important;padding:10px 22px!important;font-size:14px!important}}'
      if (!style.parentNode) document.head.appendChild(style)
    }
  }

  var ready = window.FSPORT_PRODUCT_PAGE_CONFIG_PROMISE || Promise.resolve(null)
  ready.catch(function() { return null }).then(function(runtime) {
    if (runtime) return runtime.stickyFooter && runtime.stickyFooter.config
    return legacyConfig()
  }).then(applyConfig).catch(function(error) {
    console.warn('[StickyFooter] Using static fallback:', error.message)
  })
})()
