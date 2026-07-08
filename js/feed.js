// ================================================================
// FSPORT FEED — js/feed.js  v2
// Facebook-style feed: photo (square), carousel, video
// Product tag: TikTok-style button → bottom sheet
// Text body: truncate 3 lines + "Xem thêm"
// Lightbox: swipe any direction to close
// ================================================================
;(function (global) {
  'use strict'

  // ─── CONSTANTS ────────────────────────────────────────────
  var INITIAL_PAGE_SIZE = 6
  var PAGE_SIZE         = 10
  var BODY_LINES   = 2   // số dòng hiển thị trước khi truncate

  // ─── STATE ────────────────────────────────────────────────
  var _loading     = false
  var _noMore      = false
  var _allPosts    = []
  var _postsById   = {}
  var _cursor      = null
  var _likedSet    = {}
  var _uid         = ''
  var _viewTimers  = {}
  var _viewObserver = null
  var _publishOrderSupported = true
  var _settings    = { enabled: true, likesEnabled: true, brandName: 'F-SPORT', brandLogo: '/favicon.png' }
  var _productSheet = { post: null, products: [], selectedCode: '' }
  var _feedSheetScrollY = 0
  var _userHasScrolled = false

  function supaUrl()  { return global.FSPORT_SUPABASE_URL  || '' }
  function supaAnon() { return global.FSPORT_SUPABASE_ANON || '' }

  function _applyBrandToHeader(s) {
    var logo = document.getElementById('feed-hdr-logo')
    var name = document.getElementById('feed-hdr-name')
    if (logo && s.brandLogo) logo.src         = s.brandLogo
    if (name && s.brandName) name.textContent = s.brandName
  }

  // ─── BOOT ─────────────────────────────────────────────────
  function boot() {
    _uid = _getOrCreateUid()
    _loadLikedSet()
    _loadSettings(function (s) {
      _settings = s
      _applyBrandToHeader(s)
      if (s.enabled === false) { _renderDisabled(); return }
      _fetchPosts(true)
      _initInfiniteScroll()
      _initScrollToTop()
      _initLightbox()
      _trackEvent('feed_enter', { source: document.referrer ? 'referral' : 'direct' })
    })
  }

  // ─── UID ──────────────────────────────────────────────────
  function _getOrCreateUid() {
    try {
      var uid = localStorage.getItem('fsport_uid')
      if (!uid) {
        uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        })
        localStorage.setItem('fsport_uid', uid)
      }
      return uid
    } catch (e) { return '' }
  }

  function _loadLikedSet() {
    try { _likedSet = JSON.parse(localStorage.getItem('fsport_feed_likes') || '{}') } catch (e) { _likedSet = {} }
  }
  function _saveLikedSet() {
    try { localStorage.setItem('fsport_feed_likes', JSON.stringify(_likedSet)) } catch (e) {}
  }

  function _loadSettings(cb) {
    var isLocal = global.location.hostname === '127.0.0.1' || global.location.hostname === 'localhost'
    var DEFAULTS = { enabled: true, likesEnabled: true, brandName: 'F-SPORT', brandLogo: '/favicon.png' }
    var url = supaUrl(), anon = supaAnon()
    if (!url || !anon) { cb(DEFAULTS); return }
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url + '/rest/v1/rpc/get_public_feed_settings', true)
    xhr.setRequestHeader('apikey', anon)
    xhr.setRequestHeader('Authorization', 'Bearer ' + anon)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.timeout = 4000
    xhr.onload = function () {
      try {
        var s = JSON.parse(xhr.responseText) || {}
        // Merge defaults cho các field chưa có (SQL cũ chưa trả về brand fields)
        s.brandName    = s.brandName    || DEFAULTS.brandName
        s.brandLogo    = s.brandLogo    || DEFAULTS.brandLogo
        s.likesEnabled = s.likesEnabled !== false
        // Khi chạy local: luôn enable feed để test
        if (isLocal) s.enabled = true
        cb(s)
      } catch (e) { cb(DEFAULTS) }
    }
    xhr.onerror = xhr.ontimeout = function () { cb(DEFAULTS) }
    xhr.send('{}')
  }

  // ─── FETCH POSTS ──────────────────────────────────────────
  function _fetchPosts(reset) {
    if (_loading || (_noMore && !reset)) return
    _loading = true
    if (reset) {
      _allPosts = []
      _postsById = {}
      _cursor = null
      _noMore = false
      Object.keys(_viewTimers).forEach(function (id) { clearTimeout(_viewTimers[id]) })
      _viewTimers = {}
      if (_viewObserver) _viewObserver.disconnect()
    }

    var url = supaUrl(), anon = supaAnon()
    if (!url || !anon) { _renderMockPosts(); _loading = false; return }

    var requestSize = reset ? INITIAL_PAGE_SIZE : PAGE_SIZE
    var orderField = _publishOrderSupported ? 'feed_order_at' : 'created_at'
    var selectFields = 'id,slug,title,body,content_type,images,video_url,video_id,tags,like_count,view_count,product_tap_count,feed_atwl_count,feed_atc_count,created_at'
    if (_publishOrderSupported) selectFields += ',published_at,feed_order_at'
    var q = url + '/rest/v1/feed_posts'
      + '?status=eq.published'
      + '&order=' + orderField + '.desc,id.desc'
      + '&limit=' + requestSize
      + '&select=' + selectFields + ',feed_post_products(product_code,product_name,product_image_url,product_price,product_category,product_color,product_size,display_order)'

    if (_cursor) {
      var cursorFilter = '(' + orderField + '.lt.' + _cursor.orderAt
        + ',and(' + orderField + '.eq.' + _cursor.orderAt + ',id.lt.' + _cursor.id + '))'
      q += '&or=' + encodeURIComponent(cursorFilter)
    }

    var xhr = new XMLHttpRequest()
    xhr.open('GET', q, true)
    xhr.setRequestHeader('apikey', anon)
    xhr.setRequestHeader('Authorization', 'Bearer ' + anon)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.timeout = 8000
    xhr.onload = function () {
      _loading = false
      _hideSkeleton()
      if (xhr.status >= 400 && _publishOrderSupported) {
        var errorText = xhr.responseText || ''
        if (/published_at|feed_order_at/i.test(errorText)) {
          _publishOrderSupported = false
          _fetchPosts(reset)
          return
        }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var posts = JSON.parse(xhr.responseText) || []
          if (!posts.length && reset) { _renderEmpty(); return }
          if (posts.length < requestSize) _noMore = true
          if (posts.length) {
            var lastPost = posts[posts.length - 1]
            _cursor = { orderAt: lastPost.feed_order_at || lastPost.created_at, id: lastPost.id }
          }
          posts.forEach(function (p) {
            _allPosts.push(p)
            _postsById[p.id] = p
          })
          _renderPosts(posts, reset)
          _updateLoadMore()
          _initViewTracking()
        } catch (e) { _renderEmpty() }
      } else { _renderEmpty() }
    }
    xhr.onerror = xhr.ontimeout = function () { _loading = false; _hideSkeleton(); _renderEmpty() }
    xhr.send()
  }

  // ─── MOCK (local dev without posts) ───────────────────────
  function _renderMockPosts() {
    _hideSkeleton()
    var list = document.getElementById('feed-list')
    if (!list) return
    list.innerHTML = '<div class="feed-empty">' +
      '<div style="font-size:40px;margin-bottom:8px"></div>' +
      '<p>Ch\u01b0a c\u00f3 b\u00e0i vi\u1ebft n\u00e0o.</p>' +
      '<p style="font-size:12px;color:#aaa;margin-top:4px">T\u1ea1o b\u00e0i trong ERP \u2192 Feed</p>' +
    '</div>'
  }

  function _renderDisabled() {
    _hideSkeleton()
    var c = document.getElementById('feed-list')
    if (c) c.innerHTML = '<div class="feed-empty"><p>Feed \u0111ang t\u1ea1m \u0111\u00f3ng.</p></div>'
  }

  function _renderEmpty() {
    var list = document.getElementById('feed-list')
    if (list && _allPosts.length === 0) list.innerHTML = '<div class="feed-empty"><p>Ch\u01b0a c\u00f3 b\u00e0i vi\u1ebft.</p></div>'
    _updateLoadMore()
  }

  function _hideSkeleton() {
    var s = document.getElementById('feed-skeletons')
    if (s) s.style.display = 'none'
  }

  // ─── RENDER POSTS ─────────────────────────────────────────
  function _renderPosts(posts, reset) {
    var list = document.getElementById('feed-list')
    if (!list) return
    if (reset) list.innerHTML = ''
    posts.forEach(function (p, index) {
      list.insertAdjacentHTML('beforeend', _buildCard(p, reset && index === 0))
      _bindCard(p)
    })
  }

  // ═══════════════════════════════════════════════════════════
  // CARD HTML
  // ═══════════════════════════════════════════════════════════
  function _buildCard(p, prioritizeMedia) {
    var liked   = !!_likedSet[p.id]

    // ── Media ───────────────────────────────────────────────
    var mediaHtml = ''
    if (p.content_type === 'photo' && p.images && p.images.length > 0) {
      mediaHtml = _buildPhotoMedia(p, prioritizeMedia)
    } else if (p.content_type === 'carousel' && p.images && p.images.length > 0) {
      mediaHtml = _buildCarouselMedia(p, prioritizeMedia)
    } else if (p.content_type === 'video' && _youtubeId(p)) {
      mediaHtml = _buildVideoMedia(p, prioritizeMedia)
    }

    // ── Body (truncated) ────────────────────────────────────
    var bodyHtml = ''
    if (p.body && p.body.trim()) {
      bodyHtml =
        '<div class="fc-body-wrap">' +
          '<div class="fc-body is-clamped" id="body-' + p.id + '">' + _nl2br(_esc(p.body)) + '</div>' +
          '<button class="fc-see-more" id="seem-' + p.id + '" style="display:none">Xem Th\u00eam</button>' +
        '</div>'
    }

    // ── Like count ──────────────────────────────────────────
    // ── Action btns ─────────────────────────────────────────
    var likeBtn = _settings.likesEnabled !== false
      ? '<button class="fc-action-btn fc-like-btn' + (liked ? ' is-liked' : '') + '" data-id="' + p.id + '">' +
          _likeButtonInner(p, liked) +
        '</button>'
      : ''

    var cartBtn = '<button class="fc-action-btn fc-cart-btn" data-feed-cart-id="' + p.id + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h8.72a2 2 0 0 0 2-1.58l1.38-7.22H5.12"/></svg>' +
      '<span>Th\u00eam V\u00e0o Gi\u1ecf H\u00e0ng</span>' +
    '</button>'

    return '<article class="feed-card" id="post-' + p.id + '" data-id="' + p.id + '">' +
      // Header
      '<div class="fc-header">' +
        '<div class="fc-avatar"><img src="' + _esc(_settings.brandLogo || '/favicon.png') + '" alt="' + _esc(_settings.brandName || 'F-SPORT') + '" onerror="this.src=\'/favicon.png\'"/></div>' +
        '<div class="fc-meta">' +
          '<div class="fc-brand">' + _esc(_settings.brandName || 'F-SPORT') + ' <svg style="width:14px;height:14px;vertical-align:middle;fill:#1877f2;margin-left:2px" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>' +
          '<div class="fc-time">' + _timeAgo(p.published_at || p.created_at) + '</div>' +
        '</div>' +
      '</div>' +
      // Body truncated
      bodyHtml +
      // Media
      mediaHtml +
      // Like count + actions
      '<div class="fc-actions">' +
        '<div class="fc-action-bar">' + likeBtn + cartBtn + '</div>' +
      '</div>' +
    '</article>'
  }

  function _likeSvg(filled) {
    var s = 'currentColor'
    return '<svg class="fc-heart" viewBox="0 0 24 24" fill="none" stroke="' + s + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v11"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-1.34 4.66A4 4 0 0 1 16.57 20H7"/><path d="M7 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/><path d="M15 5.88V4a2 2 0 0 0-2-2l-4 8"/></svg>'
  }

  function _likeButtonInner(p, liked) {
    var count = Number((p && p.like_count) || 0)
    return _likeSvg(liked) +
      (count > 0 ? '<span class="fc-like-inline-count">' + _formatCount(count) + '</span>' : '')
  }

  // ─── PHOTO MEDIA ──────────────────────────────────────────
  function _buildPhotoMedia(p, prioritizeMedia) {
    var img = p.images[0]
    var url = img.url || img
    var cap = img.caption || ''
    return '<div class="fc-media fc-photo" data-id="' + p.id + '">' +
      '<img src="' + _esc(url) + '" alt="' + _esc(cap || p.title || '') + '" loading="' + (prioritizeMedia ? 'eager' : 'lazy') + '" fetchpriority="' + (prioritizeMedia ? 'high' : 'low') + '" decoding="async" class="fc-media-img" draggable="false">' +
      (cap ? '<div class="fc-caption">' + _esc(cap) + '</div>' : '') +
    '</div>'
  }

  // ─── CAROUSEL MEDIA ───────────────────────────────────────
  function _buildCarouselMedia(p, prioritizeMedia) {
    var total = p.images.length
    var id    = 'car-' + p.id

    var slides = p.images.map(function (img, i) {
      var url = img.url || img
      var cap = img.caption || ''
      return '<div class="car-slide">' +
        '<img src="' + _esc(url) + '" alt="' + _esc(cap || p.title || '') + '" loading="' + (prioritizeMedia && i === 0 ? 'eager' : 'lazy') + '" fetchpriority="' + (prioritizeMedia && i === 0 ? 'high' : 'low') + '" decoding="async" draggable="false">' +
        (cap ? '<div class="car-cap">' + _esc(cap) + '</div>' : '') +
      '</div>'
    }).join('')

    var dots = p.images.map(function (_, i) {
      return '<span class="car-dot' + (i === 0 ? ' on' : '') + '"></span>'
    }).join('')

    return '<div class="fc-media fc-carousel" id="' + id + '" data-id="' + p.id + '" data-total="' + total + '" data-cur="0">' +
      '<div class="car-viewport">' +
        '<div class="car-track">' + slides + '</div>' +
      '</div>' +
      (total > 1 ? '<div class="car-counter"><span class="car-cur-n">1</span>/<span>' + total + '</span></div>' : '') +
      (total > 1 ? '<button class="car-nav car-prev" aria-label="Trước"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' : '') +
      (total > 1 ? '<button class="car-nav car-next" aria-label="Sau"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' : '') +
      (total > 1 ? '<div class="car-dots">' + dots + '</div>' : '') +
    '</div>'
  }

  // ─── VIDEO MEDIA ──────────────────────────────────────────
  function _buildVideoMedia(p, prioritizeMedia) {
    var videoId = _youtubeId(p)
    var thumb = 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg'
    return '<div class="fc-media fc-video" data-id="' + p.id + '" data-vid="' + videoId + '">' +
      '<div class="fc-video-thumb">' +
        '<img class="fc-video-poster" src="' + thumb + '" data-video-id="' + videoId + '" data-thumb-fallback="0" alt="' + _esc(p.title || 'YouTube video') + '" loading="' + (prioritizeMedia ? 'eager' : 'lazy') + '" fetchpriority="' + (prioritizeMedia ? 'high' : 'low') + '" decoding="async" onerror="window.feedVideoThumbFallback(this)">' +
        '<button class="fc-video-open" aria-label="Ph\u00e1t video">' +
          '<span class="fc-video-play"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30"/><path d="M26 20l20 12-20 12z"/></svg></span>' +
        '</button>' +
      '</div>' +
    '</div>'
  }

  function _youtubeId(p) {
    var values = typeof p === 'string' ? [p] : [p && p.video_id, p && p.video_url]
    for (var i = 0; i < values.length; i++) {
      var value = String(values[i] || '').trim()
      if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value
      var match = value.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|watch\?(?:[^#]*&)?v=))([a-zA-Z0-9_-]{11})/)
      if (match) return match[1]
    }
    return ''
  }

  global.feedVideoThumbFallback = function (img) {
    var id = img && img.dataset.videoId
    if (!id) return
    var step = Number(img.dataset.thumbFallback || 0) + 1
    img.dataset.thumbFallback = String(step)
    if (step === 1) img.src = 'https://img.youtube.com/vi/' + id + '/sddefault.jpg'
    else if (step === 2) img.src = 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg'
    else img.onerror = null
  }

  // ═══════════════════════════════════════════════════════════
  // BIND CARD EVENTS
  // ═══════════════════════════════════════════════════════════
  function _bindCard(p) {
    var root = document.getElementById('post-' + p.id)
    if (!root) return

    // "Xem thêm" — check if clamp needed
    var bodyEl = document.getElementById('body-' + p.id)
    var seeEl  = document.getElementById('seem-' + p.id)
    if (bodyEl && seeEl) {
      function updateSeeMoreVisibility() {
        var wasClamped = bodyEl.classList.contains('is-clamped')
        bodyEl.classList.remove('is-clamped')
        var fullHeight = bodyEl.getBoundingClientRect().height
        var lineHeight = parseFloat(global.getComputedStyle(bodyEl).lineHeight) || 22
        if (wasClamped) bodyEl.classList.add('is-clamped')
        seeEl.style.display = fullHeight > lineHeight * BODY_LINES + 4 ? 'block' : 'none'
      }

      requestAnimationFrame(function () {
        updateSeeMoreVisibility()
        setTimeout(updateSeeMoreVisibility, 100)
      })

      seeEl.addEventListener('click', function () {
        var isOpening = bodyEl.classList.contains('is-clamped')
        bodyEl.classList.toggle('is-clamped', !isOpening)
        seeEl.textContent = isOpening ? '\u1ea8n B\u1edbt' : 'Xem Th\u00eam'
      })
    }

    // Photo click → lightbox
    var photoImg = root.querySelector('.fc-photo .fc-media-img')
    if (photoImg) {
      photoImg.addEventListener('click', function () { _openLightbox(p, 0) })
    }

    // Carousel
    var carEl = document.getElementById('car-' + p.id)
    if (carEl) _initCarousel(carEl, p)

    // Click anywhere on the video opens the full-screen player with audio.
    var videoOpen = root.querySelector('.fc-video-open')
    if (videoOpen) {
      videoOpen.addEventListener('click', function () { _openVideoLightbox(p) })
    }

    // Like
    var likeBtn = root.querySelector('.fc-like-btn')
    if (likeBtn) {
      likeBtn.addEventListener('click', function (e) { e.stopPropagation(); _toggleLike(p) })
    }

    // Feed add-to-cart
    var cartBtn = root.querySelector('[data-feed-cart-id]')
    if (cartBtn) {
      cartBtn.addEventListener('click', function (e) { e.stopPropagation(); _openFeedProductSheet(p) })
    }

  }

  // ═══════════════════════════════════════════════════════════
  // CAROUSEL
  // ═══════════════════════════════════════════════════════════
  function _initCarousel(el, p) {
    var track    = el.querySelector('.car-track')
    var viewport = el.querySelector('.car-viewport')
    var prevBtn  = el.querySelector('.car-prev')
    var nextBtn  = el.querySelector('.car-next')
    var dots     = el.querySelectorAll('.car-dot')
    var curLabel = el.querySelector('.car-cur-n')
    var originals = track.querySelectorAll('.car-slide')
    var total    = parseInt(el.dataset.total, 10)
    var cur      = 0
    var visual   = 0
    var moving   = false
    var moveTimer = null

    if (total > 1 && originals.length > 1) {
      var firstClone = originals[0].cloneNode(true)
      var lastClone  = originals[originals.length - 1].cloneNode(true)
      firstClone.dataset.clone = 'first'
      firstClone.dataset.realIndex = '0'
      lastClone.dataset.clone = 'last'
      lastClone.dataset.realIndex = String(total - 1)
      track.insertBefore(lastClone, originals[0])
      track.appendChild(firstClone)
      visual = 1
    }

    var slides = track.querySelectorAll('.car-slide')

    function visualFor(idx) {
      return total > 1 ? idx + 1 : idx
    }

    function slideX(visualIdx) {
      if (!slides[visualIdx]) return 0
      var centerInset = Math.max(0, (viewport.clientWidth - slides[visualIdx].offsetWidth) / 2)
      return slides[visualIdx].offsetLeft - centerInset
    }

    function setTrack(visualIdx, animate) {
      track.style.transition = animate === false ? 'none' : 'transform .28s cubic-bezier(.4,0,.2,1)'
      track.style.transform  = 'translateX(-' + slideX(visualIdx) + 'px)'
    }

    function syncUi(idx) {
      el.dataset.cur = idx
      if (curLabel) curLabel.textContent = idx + 1
      dots.forEach(function (d, i) { d.classList.toggle('on', i === idx) })
      if (prevBtn) prevBtn.style.opacity = '1'
      if (prevBtn) prevBtn.style.pointerEvents = ''
      if (nextBtn) nextBtn.style.opacity = '1'
      if (nextBtn) nextBtn.style.pointerEvents = ''
    }

    function goTo(idx, animate) {
      if (!total) return
      moving = false
      if (moveTimer) { clearTimeout(moveTimer); moveTimer = null }
      if (idx < 0) idx = total - 1
      if (idx >= total) idx = 0
      cur = idx
      visual = visualFor(idx)
      setTrack(visual, animate)
      syncUi(idx)
    }

    function finishMove() {
      if (visual === 0) {
        visual = total
        setTrack(visual, false)
      } else if (visual === total + 1) {
        visual = 1
        setTrack(visual, false)
      }
      moving = false
      if (moveTimer) { clearTimeout(moveTimer); moveTimer = null }
    }

    function move(delta) {
      if (moving || total <= 1) return
      moving = true
      if (moveTimer) clearTimeout(moveTimer)
      visual += delta
      var nextCur = cur + delta
      if (nextCur < 0) nextCur = total - 1
      if (nextCur >= total) nextCur = 0
      cur = nextCur
      setTrack(visual, true)
      syncUi(cur)
      moveTimer = setTimeout(finishMove, 380)
    }

    goTo(0, false)
    global.addEventListener('resize', function () { goTo(cur, false) })

    track.addEventListener('transitionend', function (e) {
      if (e.target !== track || e.propertyName !== 'transform') return
      finishMove()
    })

    if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); move(-1) })
    if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); move(1) })

    // Touch swipe
    var sx = 0, sy = 0, st = 0, dragging = false, liveDx = 0

    viewport.addEventListener('touchstart', function (e) {
      if (moving) return
      if (e.touches.length > 1) return
      sx = e.touches[0].clientX
      sy = e.touches[0].clientY
      st = Date.now()
      dragging = true
      liveDx   = 0
      track.style.transition = 'none'
    }, { passive: true })

    viewport.addEventListener('touchmove', function (e) {
      if (!dragging || e.touches.length > 1) return
      var dx = e.touches[0].clientX - sx
      var dy = e.touches[0].clientY - sy
      if (Math.abs(dy) > Math.abs(dx) * 1.5) { dragging = false; return }
      e.preventDefault()
      liveDx = dx
      track.style.transform = 'translateX(' + ((slideX(visual) * -1) + dx) + 'px)'
    }, { passive: false })

    viewport.addEventListener('touchend', function (e) {
      if (!dragging) return
      dragging = false
      var dx  = e.changedTouches[0].clientX - sx
      var dy  = e.changedTouches[0].clientY - sy
      var dt  = Date.now() - st
      var vel = Math.abs(dx) / (dt || 1)

      if (Math.abs(dx) > 60 || vel > 0.4) {
        if (dx < 0) {
          move(1)
          _trackEvent('feed_carousel_swipe', { post_id: p.id, slide_index: cur })
        } else if (dx > 0) {
          move(-1)
          _trackEvent('feed_carousel_swipe', { post_id: p.id, slide_index: cur })
        } else {
          goTo(cur, true) // snap back
        }
      } else {
        goTo(cur, true)
      }
    }, { passive: true })

    // Click slide → lightbox (bind on slide, not img, to avoid pointer-events issues)
    track.querySelectorAll('.car-slide').forEach(function (slide, i) {
      slide.addEventListener('click', function () {
        var realIndex = slide.dataset.realIndex
        if (realIndex == null) realIndex = total > 1 ? i - 1 : i
        realIndex = Math.max(0, Math.min(total - 1, parseInt(realIndex, 10) || 0))
        _openLightbox(p, realIndex)
      })
    })
  }

  // ─── VIDEO ────────────────────────────────────────────────
  // ─── LIKE ─────────────────────────────────────────────────
  function _toggleLike(p) {
    if (_settings.likesEnabled === false) return
    var was = !!_likedSet[p.id]
    _likedSet[p.id] = !was
    _saveLikedSet()

    var btn  = document.querySelector('#post-' + p.id + ' .fc-like-btn')
    var post = _postsById[p.id] || p
    post.like_count = Math.max(0, (post.like_count || 0) + (was ? -1 : 1))

    if (btn) {
      btn.classList.toggle('is-liked', !was)
      btn.innerHTML = _likeButtonInner(post, !was)
    }

    // Supabase
    var url = supaUrl(), anon = supaAnon()
    if (!url || !anon || !_uid) return
    if (!was) {
      var x = new XMLHttpRequest()
      x.open('POST', url + '/rest/v1/feed_likes', true)
      x.setRequestHeader('apikey', anon)
      x.setRequestHeader('Authorization', 'Bearer ' + anon)
      x.setRequestHeader('Content-Type', 'application/json')
      x.setRequestHeader('Prefer', 'return=minimal')
      x.send(JSON.stringify({ post_id: p.id, user_id: _uid }))
    } else {
      var x2 = new XMLHttpRequest()
      x2.open('DELETE', url + '/rest/v1/feed_likes?post_id=eq.' + p.id + '&user_id=eq.' + encodeURIComponent(_uid), true)
      x2.setRequestHeader('apikey', anon)
      x2.setRequestHeader('Authorization', 'Bearer ' + anon)
      x2.send()
    }
    _trackEvent('feed_like', { post_id: p.id })
  }

  // ─── SHARE ────────────────────────────────────────────────
  function _sharePost(p) {
    var url = global.location.origin + '/feed/' + p.slug
    if (navigator.share) {
      navigator.share({ title: p.title || 'F-SPORT', url: url }).catch(function () {})
    } else {
      var ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      _showToast('\u0110\u00e3 sao ch\u00e9p link!')
    }
  }





  // ─── LOAD PRODUCTS (update shop button label) ─────────────

  // ═══════════════════════════════════════════════════════════
  // LIGHTBOX
  // ═══════════════════════════════════════════════════════════
  // Correct feed product flow: tagged rows are already final product variants from ERP.
  function _getTaggedProducts(p) {
    return (p.feed_post_products || [])
      .slice()
      .sort(function (a, b) { return (a.display_order || 0) - (b.display_order || 0) })
      .map(function (row) {
        var code = String(row.product_code || '').trim()
        if (!code) return null
        return {
          product_code: code,
          product_name: row.product_name || code,
          product_image_url: row.product_image_url || '',
          product_price: Number(row.product_price || 0),
          product_category: row.product_category || 'feed',
          product_color: row.product_color || '',
          product_size: row.product_size || ''
        }
      })
      .filter(Boolean)
  }

  function _openFeedProductSheet(p) {
    var products = _getTaggedProducts(p)
    if (!products.length) { _showToast('B\u00e0i n\u00e0y ch\u01b0a g\u1eafn s\u1ea3n ph\u1ea9m'); return }
    _ensureFeedProductSheet()
    _productSheet.post = p
    _productSheet.products = products
    _productSheet.selectedCode = products[0] ? products[0].product_code : ''
    _renderFeedProductSheet()
    _trackEvent('feed_atwl', { post_id: p.id, source: 'feed_action_button', product_codes: products.map(function (x) { return x.product_code }) })
  }

  function _ensureFeedProductSheet() {
    if (document.getElementById('feedProductSheet')) return
    var style = document.createElement('style')
    style.textContent =
      '#feedProductSheet{position:fixed;inset:0;z-index:2500;display:none;align-items:center;justify-content:center;padding:12px;background:rgba(17,24,39,.48);backdrop-filter:blur(4px);overscroll-behavior:contain}' +
      '#feedProductSheet.on{display:flex}' +
      '.fps-panel{width:min(100%,520px);background:#fff;border-radius:16px;max-height:min(88dvh,720px);overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.26);transform:translateY(0);display:flex;flex-direction:column}' +
      '.fps-head{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid #eef0f3;background:#fff}' +
      '.fps-title{font-size:17px;font-weight:800;letter-spacing:0;color:#111;line-height:1.2;flex:1}.fps-close{width:68px;height:68px;border-radius:50%;background:#f3f4f6;color:#111;font-size:42px;line-height:1}.fps-close:active{transform:scale(.96);background:#e5e7eb}' +
      '.fps-list{padding:14px;display:flex;flex-direction:column;gap:10px;overflow:auto;max-height:calc(min(88dvh,720px) - 138px);background:#fafafa}' +
      '.fps-product{display:grid;grid-template-columns:82px 1fr 22px;gap:12px;width:100%;padding:10px;border:1px solid #eceff3;border-radius:14px;background:#fff;text-align:left;align-items:center;transition:border-color .12s,box-shadow .12s,background .12s}' +
      '.fps-product.is-selected{border-color:#d0021b;background:#fff8f8;box-shadow:0 0 0 2px rgba(208,2,27,.08)}' +
      '.fps-product img,.fps-thumb{width:82px;height:82px;border-radius:12px;object-fit:cover;background:#f1f2f4}' +
      '.fps-main{min-width:0}.fps-name{font-size:15px;font-weight:800;line-height:1.34;color:#111;letter-spacing:0}.fps-variant{font-size:12px;font-weight:700;color:#475569;margin-top:4px}.fps-code{font-size:11px;color:#8a8f98;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fps-price{font-size:15px;font-weight:900;color:#0f766e;margin-top:7px}' +
      '.fps-radio{width:20px;height:20px;border-radius:50%;border:2px solid #d1d5db;display:block;position:relative;justify-self:end}.fps-product.is-selected .fps-radio{border-color:#d0021b}.fps-product.is-selected .fps-radio:after{content:"";position:absolute;inset:3px;border-radius:50%;background:#d0021b}' +
      '.fps-footer{padding:12px 14px 14px;border-top:1px solid #eef0f3;background:#fff}.fps-confirm{width:100%;border-radius:12px;background:#d0021b;color:#fff;font-size:15px;font-weight:900;padding:13px;transition:transform .12s,background .12s}.fps-confirm:active{transform:scale(.99);background:#b00017}' +
      '@media (max-width:420px){#feedProductSheet{padding:8px}.fps-panel{border-radius:15px}.fps-head{padding:14px 15px}.fps-list{padding:12px}.fps-product{grid-template-columns:76px 1fr 20px;padding:10px;gap:10px}.fps-product img,.fps-thumb{width:76px;height:76px}.fps-name{font-size:14px}.fps-footer{padding:11px 12px 12px}.fps-confirm{font-size:14px}}' +
      '@media (min-width:768px){#feedProductSheet{padding:24px}.fps-panel{width:min(88vw,680px);max-height:min(86dvh,720px);border-radius:18px}.fps-title{font-size:18px}.fps-list{padding:16px;gap:12px;max-height:calc(min(86dvh,720px) - 140px)}.fps-product{grid-template-columns:96px 1fr 24px;padding:12px;gap:14px}.fps-product img,.fps-thumb{width:96px;height:96px}.fps-name{font-size:16px}.fps-price{font-size:16px}.fps-footer{padding:14px 16px 16px}.fps-confirm{font-size:16px;padding:14px}}'
    document.head.appendChild(style)

    var el = document.createElement('div')
    el.id = 'feedProductSheet'
    el.innerHTML = '<div class="fps-panel" role="dialog" aria-modal="true"><div class="fps-head"><div class="fps-title">Ch\u1ecdn s\u1ea3n ph\u1ea9m</div><button class="fps-close" aria-label="\u0110\u00f3ng">&times;</button></div><div class="fps-list"></div><div class="fps-footer"><button class="fps-confirm" type="button">Th\u00eam V\u00e0o Gi\u1ecf H\u00e0ng</button></div></div>'
    document.body.appendChild(el)
    el.addEventListener('click', function (e) { if (e.target === el) _closeFeedProductSheet() })
    el.addEventListener('touchmove', function (e) { if (e.target === el) e.preventDefault() }, { passive: false })
    el.querySelector('.fps-close').addEventListener('click', _closeFeedProductSheet)
    el.querySelector('.fps-confirm').addEventListener('click', function () {
      var product = _productSheet.products.find(function (x) { return x.product_code === _productSheet.selectedCode })
      if (product) _addTaggedProductToCart(product)
    })
  }

  function _renderFeedProductSheet() {
    var sheet = document.getElementById('feedProductSheet')
    var box = document.querySelector('#feedProductSheet .fps-list')
    if (!sheet || !box) return
    sheet.classList.add('on')
    document.body.classList.add('feed-product-sheet-open')
    _lockFeedPageScroll()
    box.innerHTML = _productSheet.products.map(function (p) {
      var selected = p.product_code === _productSheet.selectedCode
      return '<button class="fps-product' + (selected ? ' is-selected' : '') + '" type="button" data-code="' + _esc(p.product_code) + '">' +
        (p.product_image_url ? '<img src="' + _esc(p.product_image_url) + '" alt="">' : '<div class="fps-thumb"></div>') +
        '<div class="fps-main">' +
          '<div class="fps-name">' + _esc(_productDisplayName(p)) + '</div>' +
          '<div class="fps-code">' + _esc(p.product_code) + '</div>' +
          '<div class="fps-price">' + (p.product_price ? _formatPrice(p.product_price) : '') + '</div>' +
        '</div>' +
        '<span class="fps-radio"></span>' +
      '</button>'
    }).join('')
    box.querySelectorAll('.fps-product').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _productSheet.selectedCode = btn.dataset.code || ''
        box.querySelectorAll('.fps-product').forEach(function (x) { x.classList.remove('is-selected') })
        btn.classList.add('is-selected')
      })
    })
  }

  function _addTaggedProductToCart(product) {
    var name = product.product_name || product.product_code
    var variant = _productVariantText(product)
    var cartName = name + (variant ? ' - ' + variant : '')
    var item = {
      id: product.product_code,
      category: product.product_category || 'feed',
      loai: product.product_category || 'feed',
      product_name: name,
      color: product.product_color || '',
      size: product.product_size || '',
      variant: variant,
      'Ph\u00e2n lo\u1ea1i': cartName,
      'Gi\u00e1': Number(product.product_price || 0),
      '\u1ea2nh': product.product_image_url || '',
      feed_source: 'feed',
      feed_post_id: _productSheet.post && _productSheet.post.id,
      feed_product_code: product.product_code,
      quantity: 1
    }

    try {
      var cart = JSON.parse(localStorage.getItem('cart') || '[]')
      if (!Array.isArray(cart)) cart = []
      cart.push(item)
      window.cart = cart
      localStorage.setItem('cart', JSON.stringify(cart))
    } catch (e) {
      window.cart = window.cart || []
      window.cart.push(item)
    }

    _trackEvent('feed_atc', { post_id: _productSheet.post && _productSheet.post.id, source: 'feed_product_popup', product_code: product.product_code })
    if (typeof global.trackGA4EcommerceEvent === 'function') {
      global.trackGA4EcommerceEvent('add_to_cart', {
        currency: 'VND',
        value: Number(product.product_price || 0),
        items: [{
          item_id: product.product_code,
          item_name: _productDisplayName(product),
          price: Number(product.product_price || 0),
          quantity: 1
        }]
      })
    }
    _closeFeedProductSheet()
    _openCheckoutAfterFeedAtc()
  }

  function _productVariantText(product) {
    var parts = []
    if (product.product_color) parts.push(product.product_color)
    if (product.product_size) parts.push(product.product_size)
    return parts.join(' - ')
  }

  function _productDisplayName(product) {
    var name = product.product_name || product.product_code
    var variant = _productVariantText(product)
    return name + (variant ? ' - ' + variant : '')
  }

  function _openCheckoutAfterFeedAtc(attempt) {
    attempt = attempt || 1
    if (typeof global.showCheckoutPopup === 'function') {
      global.showCheckoutPopup()
      return
    }
    if (attempt < 8) {
      setTimeout(function () { _openCheckoutAfterFeedAtc(attempt + 1) }, 150)
      return
    }
    _showToast('\u0110\u00e3 th\u00eam v\u00e0o gi\u1ecf h\u00e0ng')
  }

  function _lockFeedPageScroll() {
    if (document.body.dataset.feedSheetLocked === '1') return
    _feedSheetScrollY = window.scrollY || document.documentElement.scrollTop || 0
    document.body.dataset.feedSheetLocked = '1'
    document.body.style.position = 'fixed'
    document.body.style.top = '-' + _feedSheetScrollY + 'px'
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
  }

  function _unlockFeedPageScroll() {
    if (document.body.dataset.feedSheetLocked !== '1') return
    document.body.dataset.feedSheetLocked = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    window.scrollTo(0, _feedSheetScrollY || 0)
  }

  function _closeFeedProductSheet() {
    var sheet = document.getElementById('feedProductSheet')
    if (sheet) sheet.classList.remove('on')
    document.body.classList.remove('feed-product-sheet-open')
    _unlockFeedPageScroll()
  }

  var _lb = { open: false, type: 'image', post: null, idx: 0, imgs: [], scale: 1, panX: 0, panY: 0 }

  function _openLightbox(p, startIdx) {
    _lb.type  = 'image'
    _lb.post  = p
    _lb.idx   = startIdx
    _lb.imgs  = p.images || []
    _lb.scale = 1; _lb.panX = 0; _lb.panY = 0
    _lb.open  = true

    var lb = document.getElementById('feed-lightbox')
    if (!lb) return
    lb.style.display = 'flex'
    requestAnimationFrame(function () { lb.classList.add('is-open') })
    document.body.style.overflow = 'hidden'
    _lbRender()
    _lbUpdateNav()
    document.addEventListener('keydown', _lbKey)
  }

  function _openVideoLightbox(p) {
    var videoId = _youtubeId(p)
    if (!videoId) return
    _trackEvent('feed-video', { post_id: p.id, video_id: videoId, action: 'fullscreen_open' })
    _lb.type = 'video'
    _lb.post = p
    _lb.imgs = []
    _lb.open = true
    var lb = document.getElementById('feed-lightbox')
    if (!lb) return
    var frame = lb.querySelector('.lb-video')
    if (frame) frame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&mute=0&playsinline=1&controls=1&rel=0'
    lb.classList.add('is-video')
    lb.style.display = 'flex'
    requestAnimationFrame(function () { lb.classList.add('is-open') })
    document.body.classList.add('feed-video-fullscreen')
    document.body.style.overflow = 'hidden'
    _lbUpdateNav()
    document.addEventListener('keydown', _lbKey)
  }

  function _closeLightbox() {
    if (!_lb.open) return
    _lb.open = false
    document.removeEventListener('keydown', _lbKey)
    document.body.style.overflow = ''
    var lb = document.getElementById('feed-lightbox')
    if (!lb) return
    var frame = lb.querySelector('.lb-video')
    if (frame) frame.src = ''
    lb.classList.remove('is-video')
    document.body.classList.remove('feed-video-fullscreen')
    lb.classList.remove('is-open')
    setTimeout(function () { lb.style.display = 'none' }, 220)
  }

  function _lbKey(e) {
    if (e.key === 'Escape')     _closeLightbox()
    if (e.key === 'ArrowRight') _lbGo(_lb.idx + 1)
    if (e.key === 'ArrowLeft')  _lbGo(_lb.idx - 1)
  }

  function _lbGo(idx) {
    if (idx < 0 || idx >= _lb.imgs.length) { _closeLightbox(); return }
    _lb.idx   = idx
    _lb.scale = 1; _lb.panX = 0; _lb.panY = 0
    _lbRender()
    _lbUpdateNav()
  }

  function _lbRender() {
    var lb  = document.getElementById('feed-lightbox')
    if (!lb || _lb.type !== 'image' || !_lb.imgs.length) return
    var img = _lb.imgs[_lb.idx]
    var url = img ? (img.url || img) : ''
    var cap = img ? (img.caption || '') : ''
    var el  = lb.querySelector('.lb-img')
    if (el) { el.src = url; el.alt = cap; el.style.transform = '' }
    var capEl = lb.querySelector('.lb-caption')
    if (capEl) capEl.textContent = cap

    // Dots
    var dotsWrap = lb.querySelector('.lb-dots')
    if (dotsWrap) {
      dotsWrap.innerHTML = _lb.imgs.length > 1
        ? _lb.imgs.map(function (_, i) {
            return '<span class="lb-dot' + (i === _lb.idx ? ' on' : '') + '"></span>'
          }).join('')
        : ''
    }
  }

  function _lbUpdateNav() {
    var lb = document.getElementById('feed-lightbox')
    if (!lb) return
    var total = _lb.imgs.length
    var idx   = _lb.idx
    var prev  = lb.querySelector('.lb-prev')
    var next  = lb.querySelector('.lb-next')
    var ctr   = lb.querySelector('.lb-counter')
    if (_lb.type === 'video') {
      if (prev) prev.style.display = 'none'
      if (next) next.style.display = 'none'
      if (ctr) ctr.style.display = 'none'
      return
    }
    if (prev) prev.style.display = ''
    if (next) next.style.display = ''
    if (prev) prev.style.opacity = idx === 0 ? '0' : '1'
    if (prev) prev.style.pointerEvents = idx === 0 ? 'none' : ''
    if (next) next.style.opacity = idx === total - 1 ? '0' : '1'
    if (next) next.style.pointerEvents = idx === total - 1 ? 'none' : ''
    if (ctr)  ctr.style.display = total > 1 ? 'block' : 'none'
    if (ctr)  ctr.textContent = (idx + 1) + ' / ' + total
  }

  function _initLightbox() {
    var lb = document.getElementById('feed-lightbox')
    if (!lb) return

    lb.querySelector('.lb-close')?.addEventListener('click', _closeLightbox)
    lb.querySelector('.lb-prev')?.addEventListener('click', function (e) { e.stopPropagation(); _lbGo(_lb.idx - 1) })
    lb.querySelector('.lb-next')?.addEventListener('click', function (e) { e.stopPropagation(); _lbGo(_lb.idx + 1) })
    lb.querySelector('.lb-backdrop')?.addEventListener('click', _closeLightbox)

    // Touch swipe to close / navigate
    var wrap = lb.querySelector('.lb-img-wrap')
    if (!wrap) return
    var sx = 0, sy = 0, st = 0

    wrap.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now()
    }, { passive: true })

    wrap.addEventListener('touchend', function (e) {
      var dx  = e.changedTouches[0].clientX - sx
      var dy  = e.changedTouches[0].clientY - sy
      var dt  = Date.now() - st
      var adx = Math.abs(dx), ady = Math.abs(dy)
      var vel = Math.max(adx, ady) / (dt || 1)
      var isFlick = vel > 0.4 && dt < 350

      if (!isFlick && adx < 50 && ady < 50) return // tiny tap — ignore

      var moreH = adx > ady * 1.2
      var moreV = ady > adx * 1.2

      if (_lb.imgs.length === 1) {
        _closeLightbox(); return
      }

      if (moreH) {
        if (dx < 0) _lbGo(_lb.idx + 1) // swipe left = next
        else        _lbGo(_lb.idx - 1) // swipe right = prev
      } else if (moreV || isFlick) {
        _closeLightbox() // up/down = close
      }
    }, { passive: true })
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW TRACKING
  // ═══════════════════════════════════════════════════════════
  function _initViewTracking() {
    if (!('IntersectionObserver' in global)) return
    if (!_viewObserver) {
      _viewObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.dataset.id
          if (!id) return
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!_viewTimers[id]) {
              _viewTimers[id] = setTimeout(function () {
                var post = _postsById[id]
                if (post) _trackEvent('feed_post_view', { post_id: id, slug: post.slug, content_type: post.content_type })
                delete _viewTimers[id]
              }, 10000)
            }
          } else {
            clearTimeout(_viewTimers[id])
            delete _viewTimers[id]
          }
        })
      }, { threshold: 0.5 })
    }
    document.querySelectorAll('.feed-card:not([data-view-observed])').forEach(function (card) {
      card.dataset.viewObserved = '1'
      _viewObserver.observe(card)
    })
  }

  // ─── INFINITE SCROLL ──────────────────────────────────────
  function _initInfiniteScroll() {
    var btn = document.getElementById('feed-load-more')
    if (btn) btn.addEventListener('click', function () { _fetchPosts(false) })
    var sentinel = document.getElementById('feed-sentinel')
    if (!sentinel) return

    function maybeLoadMore() {
      if (!_userHasScrolled || _loading || _noMore) return
      if (sentinel.getBoundingClientRect().top <= global.innerHeight + 120) {
        _fetchPosts(false)
      }
    }

    global.addEventListener('scroll', function () {
      if ((global.scrollY || document.documentElement.scrollTop || 0) > 20) {
        _userHasScrolled = true
      }
      maybeLoadMore()
    }, { passive: true })

    if ('IntersectionObserver' in global) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) maybeLoadMore()
      }, { rootMargin: '120px' }).observe(sentinel)
    }
  }

  function _updateLoadMore() {
    var btn = document.getElementById('feed-load-more')
    if (btn) btn.style.display = _noMore || ('IntersectionObserver' in global) ? 'none' : 'block'
  }

  function _initScrollToTop() {
    var btn = document.getElementById('feed-scroll-top')
    if (!btn) return

    function updateVisibility() {
      var y = global.scrollY || document.documentElement.scrollTop || 0
      btn.classList.toggle('is-visible', y > 900)
    }

    btn.addEventListener('click', function () {
      global.scrollTo({ top: 0, behavior: 'smooth' })
    })
    global.addEventListener('scroll', updateVisibility, { passive: true })
    updateVisibility()
  }

  // ─── ANALYTICS ────────────────────────────────────────────
  function _trackEvent(type, meta) {
    if (global.fsport && typeof global.fsport.track === 'function') {
      global.fsport.track(type, meta); return
    }
    var url = supaUrl(), anon = supaAnon()
    if (!url || !anon) return
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url + '/rest/v1/analytics_events', true)
    xhr.setRequestHeader('apikey', anon)
    xhr.setRequestHeader('Authorization', 'Bearer ' + anon)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Prefer', 'return=minimal')
    xhr.send(JSON.stringify({ event_type: type, user_id: _uid || null, metadata: meta || {}, created_at: new Date().toISOString() }))
  }

  // ─── TOAST ────────────────────────────────────────────────
  function _showToast(msg) {
    var t = document.getElementById('feed-toast')
    if (!t) return
    t.textContent = msg
    t.classList.add('on')
    setTimeout(function () { t.classList.remove('on') }, 2200)
  }

  // ─── UTILS ────────────────────────────────────────────────
  function _esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
  function _nl2br(s) { return s.replace(/\n/g, '<br>') }
  function _formatCount(n) { n = n || 0; if (n >= 1000) return (n/1000).toFixed(1).replace('.0','')+'K'; return String(n) }
  function _formatPrice(p) { return Number(p).toLocaleString('vi-VN') + '\u0111' }
  function _timeAgo(iso) {
    if (!iso) return ''
    var d = (Date.now() - new Date(iso).getTime()) / 1000
    if (d < 60)        return 'V\u1eeba xong'
    if (d < 3600)      return Math.floor(d/60) + ' ph\u00fat'
    if (d < 86400)     return Math.floor(d/3600) + ' gi\u1edd'
    if (d < 86400*7)   return Math.floor(d/86400) + ' ng\u00e0y'
    if (d < 86400*30)  return Math.floor(d/86400/7) + ' tu\u1ea7n'
    if (d < 86400*365) return Math.floor(d/86400/30) + ' th\u00e1ng'
    return Math.floor(d/86400/365) + ' n\u0103m'
  }

  // ─── INIT ─────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }

  global.FSPORT_FEED = { refresh: function () { _fetchPosts(true) } }

})(window)
