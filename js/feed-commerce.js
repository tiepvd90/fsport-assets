;(function (global) {
  'use strict'

  var CONFIG_URL = 'https://xcigbbcpwfzluqazadez.supabase.co/functions/v1/cart-popup-config?slug='
  var cache = new Map()
  var GROUPS = {
    running: {
      label: 'Chạy bộ',
      title: 'Dép chạy bộ dành cho bạn',
      products: [
        { slug: 'carbon2', name: 'YSandal Carbon 2', code: 'BAL5638', href: '/ysandal/carbon2', filter: function (item) { return /carbon\s*2/i.test(item.text || '') }, rowFilter: function (row) { return row.model_code === 'BAL5638' || /^BAL5638-/i.test(row.product_code || row.id || '') } },
        { slug: 'carbon', name: 'YSandal Carbon 1', code: 'BAL5617', href: '/ysandal/carbon' },
        { slug: 'ysandal5568', name: 'YSandal BCU5568', code: 'BCU5568', href: '/product/ysandal5568' },
        { slug: 'ysandalbn68', name: 'YSandal BN68', code: 'BN68', href: '/product/ysandalbn68' }
      ]
    },
    pickleball: {
      label: 'Pickleball',
      title: 'Vợt Pickleball nổi bật',
      products: [
        { slug: 'panther', name: 'Vợt Pickleball Panther', code: 'PANTHER', href: '/pickleball/panther', filter: function (item) { return /^panther-/i.test(item.id || '') }, rowFilter: function (row) { return /^panther-/i.test(row.product_code || row.id || '') } },
        { slug: 'legacy', name: 'Vợt Pickleball Legacy', code: 'LEGACY', href: '/pickleball/legacy', filter: function (item) { return /^legacy-/i.test(item.id || '') }, rowFilter: function (row) { return /^legacy-/i.test(row.product_code || row.id || '') } },
        { slug: 'active', name: 'Vợt Pickleball FastBlock', code: 'FASTBLOCK', href: '/pickleball/active', filter: function (item) { return /^fastblock-/i.test(item.id || '') }, rowFilter: function (row) { return /^fastblock-/i.test(row.product_code || row.id || '') } },
        { slug: 'gen4', name: 'Vợt Pickleball Gen4 Hồng', code: 'GEN4 HỒNG', href: '/pickleball/gen4', filter: function (item) { return /^pickleball-gen4-hong$/i.test(item.id || '') }, rowFilter: function (row) { return /^pickleball-gen4-hong$/i.test(row.product_code || row.id || '') } }
      ]
    }
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function money(value) {
    var amount = Number(value || 0)
    return amount > 0 ? amount.toLocaleString('vi-VN') + 'đ' : ''
  }

  function colorAttribute(config) {
    return (config.attributes || []).find(function (attribute) {
      return /color|màu|mau/i.test(String(attribute.key || '') + ' ' + String(attribute.label || ''))
    }) || (config.attributes || [])[0] || { values: [] }
  }

  function loadProduct(product) {
    if (cache.has(product.slug)) return cache.get(product.slug)
    var promise = fetch(CONFIG_URL + encodeURIComponent(product.slug), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.json()
      })
      .then(function (config) {
        var variants = (colorAttribute(config).values || []).map(function (item) {
          return { id: String(item.id || ''), text: String(item.text || ''), image: String(item.image || '') }
        }).filter(function (item) { return item.image && (!product.filter || product.filter(item)) })
        var rows = (config.variants || []).filter(function (row) { return !product.rowFilter || product.rowFilter(row) })
        return {
          slug: product.slug,
          name: product.name,
          code: product.code,
          href: product.href,
          price: Number(rows[0] && rows[0].price || config.base && config.base.price || 0),
          variants: variants,
          rows: rows
        }
      })
      .catch(function () { return null })
    cache.set(product.slug, promise)
    return promise
  }

  function swatchHtml(variant, index) {
    return '<button class="fc-swatch' + (index === 0 ? ' is-active' : '') + '" type="button" data-fc-color="' + index + '" aria-label="Chọn màu ' + esc(variant.text) + '" aria-pressed="' + (index === 0 ? 'true' : 'false') + '"><img src="' + esc(variant.image) + '" alt="" width="42" height="42" loading="lazy" decoding="async"></button>'
  }

  function productHtml(product) {
    if (!product || !product.variants.length) return ''
    var first = product.variants[0]
    return '<article class="fc-card" data-fc-product="' + esc(product.slug) + '">' +
      '<a class="fc-image-link" href="' + esc(product.href) + '" aria-label="Xem ' + esc(product.name) + '"><img class="fc-image" src="' + esc(first.image) + '" alt="' + esc(product.name + ' - ' + first.text) + '" width="420" height="420" loading="lazy" decoding="async"></a>' +
      '<div class="fc-card-copy"><span class="fc-code">' + esc(product.code) + '</span><strong class="fc-name">' + esc(product.name) + '</strong><span class="fc-price">' + esc(money(product.price)) + '</span><span class="fc-color-name">' + esc(first.text) + '</span>' +
      '<div class="fc-swatches" aria-label="Màu sắc">' + product.variants.map(swatchHtml).join('') + '</div>' +
      '<button class="fc-cta" type="button">Thêm vào giỏ hàng</button></div></article>'
  }

  function bindCards(root, products) {
    root.querySelectorAll('.fc-card').forEach(function (card) {
      var product = products.find(function (item) { return item.slug === card.dataset.fcProduct })
      if (!product) return
      card.querySelectorAll('[data-fc-color]').forEach(function (button) {
        button.addEventListener('click', function () {
          var index = Number(button.dataset.fcColor || 0)
          var variant = product.variants[index]
          if (!variant) return
          card.querySelectorAll('[data-fc-color]').forEach(function (other) {
            var active = other === button
            other.classList.toggle('is-active', active)
            other.setAttribute('aria-pressed', active ? 'true' : 'false')
          })
          var image = card.querySelector('.fc-image')
          image.src = variant.image
          image.alt = product.name + ' - ' + variant.text
          card.querySelector('.fc-color-name').textContent = variant.text
          card.dataset.fcSelectedColor = variant.text
        })
      })
      card.dataset.fcSelectedColor = product.variants[0].text
      card.querySelector('.fc-cta').addEventListener('click', function () { openPurchase(product, card.dataset.fcSelectedColor) })
    })
  }

  function groupHtml(groupKey, products, layout) {
    var group = GROUPS[groupKey]
    var cards = products.map(productHtml).join('')
    if (!cards) return ''
    return '<div class="fc-panel" data-fc-panel="' + esc(groupKey) + '"><div class="fc-heading"><strong>' + esc(group.title) + '</strong></div><div class="fc-products fc-products-' + esc(layout || 'banner') + '">' + cards + '</div></div>'
  }

  function ensurePopup() {
    var popup = document.getElementById('fc-buy-popup')
    if (popup) return popup
    popup = document.createElement('div')
    popup.id = 'fc-buy-popup'
    popup.className = 'fc-buy-popup'
    popup.hidden = true
    popup.innerHTML = '<div class="fc-buy-dialog" role="dialog" aria-modal="true" aria-labelledby="fc-buy-title"><button class="fc-buy-close" type="button" aria-label="Đóng">×</button><div id="fc-buy-content"></div></div>'
    document.body.appendChild(popup)
    popup.addEventListener('click', function (event) { if (event.target === popup) closePopup() })
    popup.querySelector('.fc-buy-close').addEventListener('click', closePopup)
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !popup.hidden) closePopup() })
    return popup
  }

  function closePopup() {
    var popup = document.getElementById('fc-buy-popup')
    if (popup) popup.hidden = true
    document.body.classList.remove('fc-buy-open')
  }

  function rowColor(row) {
    return String(row.color || row['Màu Sắc'] || row.text || '')
  }

  function rowImage(row, product) {
    return String(row.image || (row.image_urls || [])[0] || (product.variants[0] && product.variants[0].image) || '')
  }

  function availableRows(product) {
    return (product.rows || []).filter(function (row) { return row.is_active !== false })
  }

  function openPurchase(product, preferredColor) {
    var popup = ensurePopup()
    popup.dataset.product = product.slug
    popup.dataset.preferredColor = preferredColor || ''
    renderPurchase(product, preferredColor)
    popup.hidden = false
    document.body.classList.add('fc-buy-open')
    popup.querySelector('.fc-buy-close').focus()
  }

  function selectedRow(product) {
    var size = document.getElementById('fc-buy-size')
    var color = document.getElementById('fc-buy-color')
    return availableRows(product).find(function (row) {
      return (!size || String(row.size || '') === size.value) && rowColor(row) === color.value
    }) || null
  }

  function renderPurchase(product, preferredColor, preferredSize) {
    var rows = availableRows(product)
    var sizes = Array.from(new Set(rows.map(function (row) { return String(row.size || '') }).filter(Boolean)))
    var size = sizes.indexOf(String(preferredSize || '')) >= 0 ? String(preferredSize) : (sizes[0] || '')
    var scoped = size ? rows.filter(function (row) { return String(row.size || '') === size }) : rows
    var colors = Array.from(new Set(scoped.map(rowColor).filter(Boolean)))
    var color = colors.indexOf(preferredColor) >= 0 ? preferredColor : (colors[0] || '')
    var variant = scoped.find(function (row) { return rowColor(row) === color }) || null
    var stock = variant ? Math.max(0, Number(variant.stock_qty || 0)) : 0
    var image = rowImage(variant || {}, product)
    var sizeField = sizes.length ? '<label>SIZE<select id="fc-buy-size">' + sizes.map(function (item) { return '<option value="' + esc(item) + '"' + (item === size ? ' selected' : '') + '>' + esc(item) + '</option>' }).join('') + '</select></label>' : ''
    document.getElementById('fc-buy-content').innerHTML = '<div class="fc-buy-head"><img src="' + esc(image) + '" alt="' + esc(product.name) + '"><div><small>F-SPORT</small><h3 id="fc-buy-title">' + esc(product.name) + '</h3><strong>' + esc(money(variant && variant.price || product.price)) + '</strong></div></div>' +
      '<div class="fc-buy-fields' + (sizes.length ? '' : ' fc-buy-fields-no-size') + '">' + sizeField + '<label>MÀU SẮC<select id="fc-buy-color">' + colors.map(function (item) { return '<option value="' + esc(item) + '"' + (item === color ? ' selected' : '') + '>' + esc(item) + '</option>' }).join('') + '</select></label><label>SỐ LƯỢNG<input id="fc-buy-quantity" type="number" min="1" max="' + Math.max(1, stock) + '" value="1"></label></div>' +
      '<div class="fc-buy-actions"><button id="fc-buy-confirm" type="button"' + (stock > 0 ? '' : ' disabled') + '>' + (stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng') + '</button><a href="' + esc(product.href + '?color=' + encodeURIComponent(color)) + '">Xem chi tiết</a></div><p id="fc-buy-message" class="fc-buy-message" role="status"></p>'
    var sizeSelect = document.getElementById('fc-buy-size')
    if (sizeSelect) sizeSelect.addEventListener('change', function () { renderPurchase(product, '', this.value) })
    document.getElementById('fc-buy-color').addEventListener('change', function () { renderPurchase(product, this.value, sizeSelect && sizeSelect.value) })
    document.getElementById('fc-buy-confirm').addEventListener('click', function () { addToCart(product) })
  }

  function ensureCheckout() {
    if (typeof global.FSPORT_ENSURE_CHECKOUT === 'function') return global.FSPORT_ENSURE_CHECKOUT()
    if (ensureCheckout.promise) return ensureCheckout.promise
    if (!document.getElementById('checkoutPopup-placeholder')) document.body.insertAdjacentHTML('beforeend', '<div id="checkoutPopup-placeholder"></div>')
    if (!document.querySelector('link[href^="/css/checkoutpopup.css"]')) {
      var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/css/checkoutpopup.css'; document.head.appendChild(link)
    }
    ensureCheckout.promise = fetch('/html/checkoutpopup.html').then(function (response) { return response.ok ? response.text() : '' }).then(function (html) {
      document.getElementById('checkoutPopup-placeholder').innerHTML = html
      return new Promise(function (resolve, reject) {
        var script = document.createElement('script'); script.src = '/js/checkoutpopup.js?v=20260930-phone-fix-1'; script.onload = resolve; script.onerror = reject; document.body.appendChild(script)
      })
    })
    return ensureCheckout.promise
  }

  function addToCart(product) {
    var row = selectedRow(product)
    var quantity = Math.max(1, parseInt(document.getElementById('fc-buy-quantity').value, 10) || 1)
    var message = document.getElementById('fc-buy-message')
    if (!row || Number(row.stock_qty || 0) < quantity) { message.textContent = 'Số lượng đã chọn không còn đủ trong kho.'; return }
    var color = rowColor(row)
    var size = String(row.size || '')
    var item = {
      id: row.product_code || row.id, category: row.category || 'feed', loai: row.category || 'feed',
      product_name: row.product_name || product.name, color: color, size: size,
      variant: [color, size].filter(Boolean).join(' - '),
      'Phân loại': (row.product_name || product.name) + ' - ' + [color, size].filter(Boolean).join(' - '),
      'Giá': Number(row.price || product.price || 0), 'Ảnh': rowImage(row, product), feed_source: 'feed-commerce', quantity: quantity
    }
    var cart = []
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]') } catch (_) {}
    if (!Array.isArray(cart)) cart = []
    var existing = cart.find(function (entry) { return String(entry.id) === String(item.id) })
    if (existing) existing.quantity = Number(existing.quantity || 0) + quantity
    else cart.push(item)
    global.cart = cart
    localStorage.setItem('cart', JSON.stringify(cart))
    global.dispatchEvent(new Event('storage'))
    closePopup()
    ensureCheckout().then(function () { if (typeof global.showCheckoutPopup === 'function') global.showCheckoutPopup() })
  }

  function loadGroup(groupKey) {
    var group = GROUPS[groupKey]
    if (!group) return Promise.resolve([])
    return Promise.all(group.products.map(loadProduct)).then(function (items) { return items.filter(Boolean) })
  }

  function renderGroup(container, groupKey, layout) {
    container.setAttribute('aria-busy', 'true')
    return loadGroup(groupKey).then(function (products) {
      var html = groupHtml(groupKey, products, layout)
      if (!html) {
        container.hidden = true
        return
      }
      container.innerHTML = html
      container.hidden = false
      container.dataset.fcMounted = '1'
      bindCards(container, products)
    }).finally(function () { container.removeAttribute('aria-busy') })
  }

  function mount(container, context, layout) {
    if (!container || container.dataset.fcMounted === '1') return Promise.resolve()
    var key = context === 'ysandal' ? 'running' : context
    if (!GROUPS[key]) { container.hidden = true; return Promise.resolve() }
    return renderGroup(container, key, layout || 'banner')
  }

  function lazyMount(container, context, layout) {
    if (!container || container.dataset.fcMounted === '1' || container.dataset.fcLazy === '1') return
    container.dataset.fcLazy = '1'
    container.hidden = false
    container.classList.add('is-lazy-pending')
    var load = function () {
      container.classList.remove('is-lazy-pending')
      mount(container, context, layout)
    }
    if (!('IntersectionObserver' in global)) { load(); return }
    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting }) ) return
      observer.disconnect()
      load()
    }, { rootMargin: '600px 0px', threshold: 0.01 })
    observer.observe(container)
  }

  function insertMobileArticleBlock(source) {
    if (!source || !/^(running|pickleball|ysandal)$/.test(source.dataset.feedCommerce || '')) return
    if (document.body.classList.contains('fs-size-finder-page')) return
    var body = document.querySelector('body>main>article>.body')
    if (!body || body.querySelector('.fn-feed-commerce-mobile')) return
    var children = Array.prototype.filter.call(body.children, function (child) {
      return !child.matches('script,style,.products,.feed-collection')
    })
    if (!children.length) return
    var target = children[Math.max(0, Math.ceil(children.length / 2) - 1)]
    var block = document.createElement('aside')
    block.className = 'fn-feed-commerce fn-feed-commerce-mobile'
    block.dataset.feedCommerce = source.dataset.feedCommerce
    block.setAttribute('aria-label', 'Sản phẩm gợi ý từ F-SPORT')
    target.insertAdjacentElement('afterend', block)
    lazyMount(block, block.dataset.feedCommerce, 'inline')
  }

  function initArticle() {
    var rail = document.querySelector('.fn-feed-commerce-rail[data-feed-commerce]')
    if (!rail) return
    lazyMount(rail, rail.dataset.feedCommerce, 'rail')
    insertMobileArticleBlock(rail)
  }

  global.FSportFeedCommerce = { mount: mount, lazyMount: lazyMount, initArticle: initArticle }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initArticle)
  else initArticle()
})(window)
