;(function (global) {
  'use strict'

  var API = global.FSPORT_SUPABASE_URL || ''
  var KEY = global.FSPORT_SUPABASE_ANON || ''
  var PAGE_SIZE = 10
  var SELECT = 'id,slug,title,content_type,category,images,video_url,video_id,tags,published_at,created_at,feed_order_at,feed_post_products(product_code,product_name,product_image_url,product_price,product_category,product_color,product_size,display_order)'
  var usedPostIds = new Set()
  var loadedPosts = []
  var requestCache = new Map()
  var activeControllers = new Set()
  var loadQueue = Promise.resolve()
  var latestCursor = null
  var latestDone = false
  var checkoutPromise = null
  var activeSection = 'home'

  var SPORT_CONFIG = {
    running: { label: 'Chạy bộ', category: 'ysandal', title: 'Chạy bộ: tập đúng, tiến bộ bền vững', deck: 'Bài viết, hình ảnh và video về chạy bộ dành cho runner ở mọi trình độ.' },
    pickleball: { label: 'Pickleball', category: 'pickleball', title: 'Pickleball: từ nhập môn đến thi đấu', deck: 'Bài viết, hình ảnh và video Pickleball được biên tập theo một chuyên mục thống nhất.' },
    badminton: { label: 'Cầu lông', category: 'badminton', title: 'Cầu lông', deck: 'Tin tức, hướng dẫn và câu chuyện về Cầu lông.' },
    football: { label: 'Bóng đá', category: 'football', title: 'Bóng đá', deck: 'Tin tức và câu chuyện đáng chú ý về Bóng đá.' },
    tennis: { label: 'Tennis', category: 'tennis', title: 'Tennis', deck: 'Tin tức, hướng dẫn và câu chuyện về Tennis.' },
    basketball: { label: 'Bóng rổ', category: 'basketball', title: 'Bóng rổ', deck: 'Tin tức, hướng dẫn và câu chuyện về Bóng rổ.' },
    fitness: { label: 'Fitness', category: 'fitness', title: 'Fitness', deck: 'Nội dung tập luyện và câu chuyện trong môn Fitness.' },
    'other-sports': { label: 'Thể thao khác', category: 'other-sports', title: 'Thể thao khác', deck: 'Những môn thể thao và câu chuyện vận động khác.' }
  }

  var SECTION_CONFIG = {
    home: {
      title: '',
      deck: 'Bắt đầu với Chạy bộ và Pickleball, sau đó mở rộng từng môn khi có đủ nội dung chất lượng.',
      kicker: 'F-SPORT FEED'
    }
  }
  Object.keys(SPORT_CONFIG).forEach(function (key) {
    SECTION_CONFIG[key] = {
      title: SPORT_CONFIG[key].title,
      deck: SPORT_CONFIG[key].deck,
      kicker: 'MÔN ' + SPORT_CONFIG[key].label.toUpperCase()
    }
  })

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function detectSection() {
    var query = new URLSearchParams(global.location.search).get('section')
    if (SECTION_CONFIG[query]) return query
    var part = String(global.location.pathname || '').replace(/\/+$/, '').split('/').pop()
    if (part === 'chay-bo') return 'running'
    if (SPORT_CONFIG[part]) return part
    return 'home'
  }

  function configurePage(section) {
    var config = SECTION_CONFIG[section] || SECTION_CONFIG.home
    activeSection = section
    document.body.dataset.feedSection = section
    var pageTitle = document.getElementById('fn-page-title')
    pageTitle.textContent = config.title
    pageTitle.hidden = !config.title
    document.getElementById('fn-page-deck').textContent = config.deck
    document.getElementById('fn-page-kicker').textContent = config.kicker
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      if (link.dataset.nav === section) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
    var visible = section === 'home' ? ['running', 'pickleball', 'video', 'sport'] : ['latest']
    document.querySelectorAll('.fn-lazy-section[data-loader]').forEach(function (el) {
      if (el.dataset.loader === 'commerce') return
      el.hidden = !visible.includes(el.dataset.loader)
    })
    var latestTitle = document.getElementById('fn-latest-title')
    if (latestTitle && SPORT_CONFIG[section]) latestTitle.textContent = 'Bài mới về ' + SPORT_CONFIG[section].label
  }

  function setupMenu() {
    var current = document.querySelector('.fn-topic-scroll [aria-current="page"]')
    if (current && typeof current.scrollIntoView === 'function') {
      current.scrollIntoView({ block: 'nearest', inline: 'center' })
    }
  }

  function futureSportsUrl() {
    var categories = Object.keys(SPORT_CONFIG).filter(function (key) { return key !== 'running' && key !== 'pickleball' })
      .map(function (key) { return SPORT_CONFIG[key].category })
    var params = new URLSearchParams()
    params.set('status', 'eq.published')
    params.set('select', 'category')
    params.set('category', 'in.(' + categories.join(',') + ')')
    params.set('limit', '1000')
    return API + '/rest/v1/feed_posts?' + params.toString()
  }

  function insertSportSection(key) {
    if (activeSection !== 'home' || document.getElementById('fn-' + key)) return
    var sport = SPORT_CONFIG[key]
    var section = document.createElement('section')
    section.id = 'fn-' + key
    section.className = 'fn-section fn-lazy-section'
    section.dataset.loader = 'sport'
    section.dataset.category = sport.category
    section.dataset.sport = key
    section.setAttribute('aria-labelledby', section.id + '-title')
    section.innerHTML = '<div class="fn-section-heading"><h2 id="' + section.id + '-title">' + esc(sport.label) + '</h2><a href="/feed/' + esc(key) + '">Xem tất cả</a></div><div class="fn-section-placeholder">Nội dung ' + esc(sport.label) + ' sẽ tải khi cần</div>'
    var video = document.getElementById('fn-video')
    video.parentNode.insertBefore(section, video)
  }

  function discoverFutureSports() {
    if (!API || !KEY) return Promise.resolve()
    return fetch(futureSportsUrl(), {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, Accept: 'application/json' }
    }).then(function (response) {
      if (!response.ok) return []
      return response.json()
    }).then(function (rows) {
      var available = new Set((Array.isArray(rows) ? rows : []).map(function (row) { return row.category }))
      Object.keys(SPORT_CONFIG).forEach(function (key) {
        var sport = SPORT_CONFIG[key]
        if (!available.has(sport.category)) return
        insertSportSection(key)
      })
    }).catch(function () {
      return undefined
    })
  }

  function buildQuery(options) {
    options = options || {}
    var params = new URLSearchParams()
    params.set('status', 'eq.published')
    params.set('select', SELECT)
    params.set('order', 'feed_order_at.desc.nullslast,published_at.desc.nullslast,id.desc')
    params.set('limit', String(options.limit || 8))
    if (options.category) params.set('category', 'eq.' + options.category)
    if (options.contentType) params.set('content_type', 'eq.' + options.contentType)
    if (options.tag) params.set('tags', 'cs.' + JSON.stringify([options.tag]))
    if (options.cursor && options.cursor.time) params.set('feed_order_at', 'lt.' + options.cursor.time)
    return API + '/rest/v1/feed_posts?' + params.toString()
  }

  function queryPosts(options) {
    var url = buildQuery(options)
    if (requestCache.has(url)) return requestCache.get(url)
    var controller = new AbortController()
    activeControllers.add(controller)
    var promise = fetch(url, {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, Accept: 'application/json' },
      signal: controller.signal
    }).then(function (response) {
      if (!response.ok) throw new Error('Không tải được nội dung (' + response.status + ')')
      return response.json()
    }).then(function (rows) {
      return (Array.isArray(rows) ? rows : []).map(normalizePost)
    }).finally(function () {
      activeControllers.delete(controller)
    })
    requestCache.set(url, promise)
    return promise
  }

  function normalizePost(row) {
    var images = row.images
    if (typeof images === 'string') {
      try { images = JSON.parse(images) } catch (e) { images = [] }
    }
    if (!Array.isArray(images)) images = []
    var normalizedImages = images.map(function (image) {
      if (typeof image === 'string') return { url: image, caption: '' }
      return { url: image && image.url || '', caption: image && image.caption || '' }
    }).filter(function (image) { return /^https?:\/\//i.test(image.url) || image.url.indexOf('/') === 0 })
    var products = (row.feed_post_products || []).slice().sort(function (a, b) {
      return Number(a.display_order || 0) - Number(b.display_order || 0)
    })
    var post = {
      id: String(row.id || ''), slug: String(row.slug || ''), title: String(row.title || '').trim(),
      contentType: row.content_type || 'photo', rawCategory: row.category || '', images: normalizedImages,
      videoId: youtubeId(row.video_id || row.video_url), tags: Array.isArray(row.tags) ? row.tags : [],
      publishedAt: row.published_at || row.created_at || '', orderAt: row.feed_order_at || row.published_at || row.created_at || '',
      products: products
    }
    post.category = categoryFor(post)
    post.image = normalizedImages[0] ? normalizedImages[0].url : (post.videoId ? youtubePoster(post.videoId) : '')
    post.url = '/feed/' + encodeURIComponent(post.slug)
    return post
  }

  function youtubeId(value) {
    value = String(value || '').trim()
    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value
    var match = value.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|watch\?(?:[^#]*&)?v=))([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : ''
  }

  function youtubePoster(id) { return 'https://img.youtube.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg' }

  function searchable(post) { return (post.title + ' ' + post.tags.join(' ')).toLowerCase() }

  function categoryFor(post) {
    var matched = Object.keys(SPORT_CONFIG).find(function (key) { return SPORT_CONFIG[key].category === post.rawCategory })
    if (matched) return matched
    var text = searchable(post)
    if (/pickleball|kitchen|dink|paddle|vợt/.test(text)) return 'pickleball'
    if (/chạy|runner|marathon|ysandal|sandal|pace|vo2|lactate|cadence/.test(text)) return 'running'
    return 'other'
  }

  function categoryLabel(post) {
    return SPORT_CONFIG[post.category] ? SPORT_CONFIG[post.category].label : 'Thể thao'
  }

  function formatDate(value) {
    if (!value) return ''
    try { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) } catch (e) { return '' }
  }

  function imageHtml(post, eager, alt, width, height) {
    if (!post.image) return '<div class="fn-card-image-empty" aria-hidden="true"></div>'
    return '<img src="' + esc(post.image) + '" alt="' + esc(alt || post.title) + '" width="' + (width || 800) + '" height="' + (height || 600) + '" loading="' + (eager ? 'eager' : 'lazy') + '" fetchpriority="' + (eager ? 'high' : 'low') + '" decoding="async">'
  }

  function track(type, metadata) {
    if (global.fsport && typeof global.fsport.track === 'function') global.fsport.track(type, metadata || {})
  }

  function bindStoryTracking(root) {
    ;(root || document).querySelectorAll('a[data-story-id]:not([data-track-bound])').forEach(function (link) {
      link.dataset.trackBound = '1'
      link.addEventListener('click', function () {
        track('feed_post_open', { post_id: link.dataset.storyId, slug: link.dataset.slug, section: link.dataset.section || '' })
      })
    })
  }

  function leadHtml(post, side) {
    var tag = side ? 'h3' : 'h2'
    var classes = (side ? 'fn-side-story' : 'fn-hero') + (post.videoId ? ' fn-is-video' : '')
    return '<a class="' + classes + '" href="' + esc(post.url) + '" data-story-id="' + esc(post.id) + '" data-slug="' + esc(post.slug) + '" data-section="lead">' +
      imageHtml(post, !side) + '<span class="fn-story-shade"></span><div class="fn-story-copy"><span class="fn-label">' + esc(categoryLabel(post)) + '</span><' + tag + '>' + esc(post.title) + '</' + tag + '><div class="fn-story-meta"><span>' + esc(formatDate(post.publishedAt)) + '</span>' + (post.videoId ? '<span>Video</span>' : '') + '</div></div></a>'
  }

  function renderLead(posts, section) {
    var container = document.getElementById('fn-lead')
    var eligible = posts.filter(function (post) { return post.title && post.slug && post.image })
    if (section !== 'home' && section !== 'video') {
      eligible = eligible.filter(function (post) { return !post.videoId }).concat(eligible.filter(function (post) { return !!post.videoId }))
    }
    if (!eligible.length) {
      container.innerHTML = '<div class="fn-empty">Chưa có bài nổi bật phù hợp.</div>'
      container.setAttribute('aria-busy', 'false')
      return
    }
    var hero = eligible[0]
    var side = eligible.slice(1, 5)
    ;[hero].concat(side).forEach(function (post) { usedPostIds.add(post.id) })
    loadedPosts = loadedPosts.concat([hero].concat(side))
    container.innerHTML = leadHtml(hero, false) + '<div class="fn-lead-side">' + side.map(function (post) { return leadHtml(post, true) }).join('') + '</div>'
    container.setAttribute('aria-busy', 'false')
    bindStoryTracking(container)
  }

  function storyCardHtml(post, options) {
    options = options || {}
    var play = post.videoId ? '<span class="fn-card-play" aria-hidden="true">▶</span>' : ''
    var dimensions = [960, 540]
    return '<article class="fn-story-card' + (options.lead ? ' fn-lead-card' : '') + '"><a class="fn-card-link" href="' + esc(post.url) + '" data-story-id="' + esc(post.id) + '" data-slug="' + esc(post.slug) + '" data-section="' + esc(options.section || '') + '"><div class="fn-card-media">' + imageHtml(post, false, '', dimensions[0], dimensions[1]) + '<span class="fn-card-label">' + esc(categoryLabel(post)) + '</span>' + play + '</div><div class="fn-card-body"><h3>' + esc(post.title) + '</h3><div class="fn-card-meta">' + esc(formatDate(post.publishedAt)) + '</div></div></a></article>'
  }

  function mediaRowHtml(post, section) {
    return '<article class="fn-media-row"><a class="fn-card-media" href="' + esc(post.url) + '" data-story-id="' + esc(post.id) + '" data-slug="' + esc(post.slug) + '" data-section="' + esc(section) + '">' + imageHtml(post, false, '', 480, 270) + '</a><div class="fn-card-body"><div class="fn-card-meta">' + esc(categoryLabel(post)) + ' · ' + esc(formatDate(post.publishedAt)) + '</div><a href="' + esc(post.url) + '" data-story-id="' + esc(post.id) + '" data-slug="' + esc(post.slug) + '" data-section="' + esc(section) + '"><h3>' + esc(post.title) + '</h3></a></div></article>'
  }

  function uniqueUnused(posts, count) {
    var result = []
    posts.forEach(function (post) {
      if (result.length >= count || usedPostIds.has(post.id) || !post.title || !post.slug) return
      usedPostIds.add(post.id)
      result.push(post)
    })
    loadedPosts = loadedPosts.concat(result)
    return result
  }

  function renderEditorialSection(el, posts, section) {
    var picked = uniqueUnused(posts, 5)
    if (!picked.length) { renderEmpty(el); return }
    var lead = picked[0]
    el.querySelector('.fn-section-placeholder')?.remove()
    el.insertAdjacentHTML('beforeend', '<div class="fn-section-layout">' + storyCardHtml(lead, { lead: true, section: section }) + '<div class="fn-section-list">' + picked.slice(1).map(function (post) { return mediaRowHtml(post, section) }).join('') + '</div></div>')
    bindStoryTracking(el)
  }

  function renderVideoSection(el, posts) {
    var picked = uniqueUnused(posts.filter(function (post) { return !!post.videoId }), 5)
    if (!picked.length) { renderEmpty(el); return }
    el.querySelector('.fn-section-placeholder')?.remove()
    el.insertAdjacentHTML('beforeend', '<div class="fn-video-grid">' + picked.map(function (post) {
      return storyCardHtml(post, { section: 'video' })
    }).join('') + '</div>')
    bindStoryTracking(el)
  }

  function renderEmpty(el) {
    var placeholder = el.querySelector('.fn-section-placeholder')
    if (placeholder) placeholder.outerHTML = '<div class="fn-empty">Chưa có nội dung phù hợp trong chuyên mục này.</div>'
  }

  function renderError(el, error) {
    var placeholder = el.querySelector('.fn-section-placeholder')
    var html = '<div class="fn-error">Không tải được nội dung. ' + esc(error && error.message || '') + '</div>'
    if (placeholder) placeholder.outerHTML = html
    else el.insertAdjacentHTML('beforeend', html)
  }

  function loadSection(name, el) {
    if (el.dataset.loaded === '1') return Promise.resolve()
    el.dataset.loaded = '1'
    if (name === 'running') return queryPosts({ category: 'ysandal', limit: 12 }).then(function (posts) { renderEditorialSection(el, posts, 'running'); renderCommerce() })
    if (name === 'pickleball') return queryPosts({ category: 'pickleball', limit: 12 }).then(function (posts) { renderEditorialSection(el, posts, 'pickleball'); renderCommerce() })
    if (name === 'video') return queryPosts({ contentType: 'video', limit: 12 }).then(function (posts) { renderVideoSection(el, posts); renderCommerce() })
    if (name === 'sport') return queryPosts({ category: el.dataset.category, limit: 12 }).then(function (posts) { renderEditorialSection(el, posts, el.dataset.sport) })
    if (name === 'latest') return loadLatest(el, false)
    return Promise.resolve()
  }

  function enqueueSection(name, el) {
    loadQueue = loadQueue.then(function () { return loadSection(name, el) }).catch(function (error) { renderError(el, error) })
    return loadQueue
  }

  function setupLazySections() {
    var sections = Array.from(document.querySelectorAll('.fn-lazy-section[data-loader]:not([hidden])')).filter(function (el) { return el.dataset.loader !== 'commerce' })
    if (!('IntersectionObserver' in global)) {
      sections.forEach(function (el) { enqueueSection(el.dataset.loader, el) })
      return
    }
    var nextIndex = 0
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return
        observer.unobserve(entry.target)
        enqueueSection(entry.target.dataset.loader, entry.target).finally(function () {
          nextIndex += 1
          if (sections[nextIndex]) {
            // Re-measure only after the current section has expanded. This
            // prevents compact placeholders from preloading later sections.
            global.requestAnimationFrame(function () { observer.observe(sections[nextIndex]) })
          }
        })
      })
    }, { rootMargin: '0px 0px 80px', threshold: 0.01 })
    if (sections[0]) observer.observe(sections[0])
  }

  function latestItemHtml(post) {
    var videoClass = post.videoId ? ' fn-latest-video' : ''
    var dimensions = [480, 270]
    var play = post.videoId ? '<span class="fn-latest-play" aria-hidden="true">▶</span>' : ''
    return '<article class="fn-latest-item' + videoClass + '"><a href="' + esc(post.url) + '" data-story-id="' + esc(post.id) + '" data-slug="' + esc(post.slug) + '" data-section="latest">' + imageHtml(post, false, '', dimensions[0], dimensions[1]) + play + '</a><div><div class="fn-card-meta">' + esc(categoryLabel(post)) + ' · ' + esc(formatDate(post.publishedAt)) + '</div><a href="' + esc(post.url) + '" data-story-id="' + esc(post.id) + '" data-slug="' + esc(post.slug) + '" data-section="latest"><h3>' + esc(post.title) + '</h3></a></div></article>'
  }

  function loadLatest(el, append) {
    var options = { limit: 40 }
    if (SPORT_CONFIG[activeSection]) options.category = SPORT_CONFIG[activeSection].category
    if (append && latestCursor) options.cursor = latestCursor
    return queryPosts(options).then(function (posts) {
      var picked = uniqueUnused(posts, PAGE_SIZE)
      if (picked.length) {
        var last = picked[picked.length - 1]
        latestCursor = { time: last.orderAt, id: last.id }
      } else if (posts.length) {
        var fallbackLast = posts[posts.length - 1]
        latestCursor = { time: fallbackLast.orderAt, id: fallbackLast.id }
      }
      if (posts.length < options.limit || !picked.length) latestDone = true
      var list = el.querySelector('.fn-latest-list')
      if (!list) {
        el.querySelector('.fn-section-placeholder')?.remove()
        el.insertAdjacentHTML('beforeend', '<div class="fn-latest-list"></div><button class="fn-load-more" type="button">Xem thêm bài</button>')
        list = el.querySelector('.fn-latest-list')
        el.querySelector('.fn-load-more').addEventListener('click', function () {
          var button = this
          button.disabled = true
          button.textContent = 'Đang tải…'
          loadLatest(el, true).catch(function (error) { renderError(el, error) }).finally(function () {
            button.disabled = false
            button.textContent = 'Xem thêm bài'
          })
        })
      }
      if (picked.length) list.insertAdjacentHTML('beforeend', picked.map(latestItemHtml).join(''))
      bindStoryTracking(list)
      var button = el.querySelector('.fn-load-more')
      if (button) button.hidden = latestDone
      if (!list.children.length) renderEmpty(el)
    })
  }

  function renderCommerce() {
    var section = document.getElementById('fn-commerce')
    if (!section || section.dataset.loaded === '1') return
    var seen = new Set()
    var products = []
    loadedPosts.forEach(function (post) {
      post.products.forEach(function (product) {
        var code = String(product.product_code || '').trim()
        if (!code || seen.has(code) || !product.product_image_url || products.length >= 3) return
        seen.add(code)
        products.push({ post: post, data: product })
      })
    })
    if (!products.length) return
    section.dataset.loaded = '1'
    section.hidden = false
    var grid = section.querySelector('.fn-product-grid')
    grid.innerHTML = products.map(function (item) {
      return '<button class="fn-product-card" type="button" data-code="' + esc(item.data.product_code) + '" data-post="' + esc(item.post.id) + '"><img src="' + esc(item.data.product_image_url) + '" alt="' + esc(item.data.product_name || item.data.product_code) + '" width="84" height="84" loading="lazy" decoding="async"><span><strong>' + esc(item.data.product_name || item.data.product_code) + '</strong><span>Chọn sản phẩm →</span></span></button>'
    }).join('')
    grid.querySelectorAll('.fn-product-card').forEach(function (button) {
      button.addEventListener('click', function () {
        var item = products.find(function (entry) { return entry.data.product_code === button.dataset.code && entry.post.id === button.dataset.post })
        if (item) addProductFromFeed(item.post, item.data, button)
      })
    })
  }

  function loadStyle(href) {
    if (document.querySelector('link[href^="' + href + '"]')) return
    var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link)
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = reject; document.body.appendChild(script)
    })
  }

  function ensureCheckout() {
    if (typeof global.FSPORT_ENSURE_CHECKOUT === 'function') return global.FSPORT_ENSURE_CHECKOUT()
    if (checkoutPromise) return checkoutPromise
    loadStyle('/css/checkoutpopup.css')
    checkoutPromise = fetch('/html/checkoutpopup.html').then(function (response) { return response.ok ? response.text() : '' }).then(function (html) {
      var target = document.getElementById('checkoutPopup-placeholder')
      if (target && html) target.innerHTML = html
      return loadScript('/js/checkoutpopup.js?v=20260930-phone-fix-1')
    })
    return checkoutPromise
  }

  function addProductFromFeed(post, product, button) {
    button.disabled = true
    var original = button.querySelector('span span')
    if (original) original.textContent = 'Đang mở…'
    ensureCheckout().then(function () {
      var name = product.product_name || product.product_code
      var variant = [product.product_color, product.product_size].filter(Boolean).join(' - ')
      var item = {
        id: product.product_code, category: product.product_category || 'feed', loai: product.product_category || 'feed',
        product_name: name, color: product.product_color || '', size: product.product_size || '', variant: variant,
        'Phân loại': name + (variant ? ' - ' + variant : ''), 'Giá': Number(product.product_price || 0), 'Ảnh': product.product_image_url || '',
        feed_source: 'feed', feed_post_id: post.id, feed_product_code: product.product_code, quantity: 1
      }
      var cart
      try { cart = JSON.parse(localStorage.getItem('cart') || '[]') } catch (e) { cart = [] }
      if (!Array.isArray(cart)) cart = []
      cart.push(item); global.cart = cart
      try { localStorage.setItem('cart', JSON.stringify(cart)) } catch (e) {}
      track('feed_atc', { post_id: post.id, product_code: product.product_code, source: 'feed_newsroom_product' })
      if (typeof global.showCheckoutPopup === 'function') global.showCheckoutPopup()
    }).catch(function () {
      global.location.href = product.product_category === 'pickleball' ? '/pickleball/collection' : '/ysandal/collection'
    }).finally(function () {
      button.disabled = false
      if (original) original.textContent = 'Chọn sản phẩm →'
    })
  }

  function initialOptions(section) {
    if (SPORT_CONFIG[section]) return { category: SPORT_CONFIG[section].category, limit: 24 }
    return { limit: 32 }
  }

  function homeHotPosition(post) {
    var tags = Array.isArray(post.tags) ? post.tags : []
    for (var index = 1; index <= 5; index += 1) {
      if (tags.includes('home-hot-' + index)) return index
    }
    return 99
  }

  function queryLeadPosts(section) {
    if (section !== 'home') return queryPosts(initialOptions(section))
    return Promise.all([
      queryPosts({ tag: 'home-hot', limit: 5 }).catch(function () { return [] }),
      queryPosts({ limit: 32 })
    ]).then(function (results) {
      var selected = results[0].slice().sort(function (a, b) { return homeHotPosition(a) - homeHotPosition(b) })
      var selectedIds = new Set(selected.map(function (post) { return post.id }))
      var fallback = results[1].filter(function (post) { return !selectedIds.has(post.id) })
      fallback = fallback.filter(function (post) { return !post.videoId }).concat(fallback.filter(function (post) { return !!post.videoId }))
      return selected.concat(fallback)
    })
  }

  function init() {
    var section = detectSection()
    configurePage(section)
    setupMenu()
    track('feed_enter', { section: section, page_path: global.location.pathname })
    queryLeadPosts(section).then(function (posts) {
      renderLead(posts, section)
      renderCommerce()
      return discoverFutureSports()
    }).then(function () {
      setupLazySections()
    }).catch(function (error) {
      var lead = document.getElementById('fn-lead')
      lead.innerHTML = '<div class="fn-error">Không tải được trang nhất Feed. ' + esc(error.message) + '</div>'
      lead.setAttribute('aria-busy', 'false')
      discoverFutureSports().finally(setupLazySections)
    })
  }

  global.addEventListener('pagehide', function () {
    activeControllers.forEach(function (controller) { controller.abort() })
  })

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})(window)
