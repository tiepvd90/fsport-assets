;(function (global) {
  'use strict'

  var FEED_API = global.FSPORT_SUPABASE_URL || 'https://xcigbbcpwfzluqazadez.supabase.co'
  var FEED_KEY = global.FSPORT_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4'

  function track(type, metadata) {
    if (global.fsport && typeof global.fsport.track === 'function') global.fsport.track(type, metadata || {})
  }

  function postSlug() {
    return String(global.location.pathname || '').replace(/\/+$/, '').split('/').pop()
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function postImage(post) {
    var images = post.images
    if (typeof images === 'string') {
      try { images = JSON.parse(images) } catch (_) { images = [] }
    }
    if (!Array.isArray(images)) images = []
    var first = images[0]
    var url = typeof first === 'string' ? first : first && first.url
    return url || (post.video_id ? 'https://img.youtube.com/vi/' + encodeURIComponent(post.video_id) + '/hqdefault.jpg' : '')
  }

  function categoryStreamCard(post) {
    var image = postImage(post)
    var videoClass = post.video_id ? ' fn-related-video' : ''
    return '<article class="fn-related-card' + videoClass + '" data-post-id="' + escapeHtml(post.id) + '"><a href="/feed/' + encodeURIComponent(post.slug) + '">' +
      (image ? '<span class="fn-related-media"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(post.title) + '" width="360" height="203" loading="lazy" decoding="async">' + (post.video_id ? '<i aria-hidden="true">▶</i>' : '') + '</span>' : '') +
      '<strong>' + escapeHtml(post.title) + '</strong></a></article>'
  }

  function initCategoryStream() {
    var section = document.getElementById('fn-article-category-stream')
    if (!section) return
    var grid = section.querySelector('.fn-related-grid')
    var sentinel = section.querySelector('.fn-infinite-sentinel')
    var status = sentinel && sentinel.querySelector('small')
    var after = document.getElementById('fn-article-after-category')
    if (!grid || !sentinel) { if (after) after.hidden = false; return }

    var batchSize = 10
    var offset = 0
    var loading = false
    var finished = false
    grid.querySelectorAll('.fn-related-card').forEach(function(card) { card.dataset.trackReady = '1' })
    var seen = new Set(Array.from(grid.querySelectorAll('[data-post-id]')).map(function(card) { return card.dataset.postId }))
    seen.add(section.dataset.currentId || '')

    function finish(message) {
      finished = true
      sentinel.classList.add('is-finished')
      if (status) status.textContent = message || 'Đã xem hết bài trong chuyên mục.'
      if (after) after.hidden = false
    }

    function loadMore() {
      if (loading || finished) return Promise.resolve()
      loading = true
      sentinel.classList.add('is-loading')
      if (status) status.textContent = 'Đang tải thêm bài…'
      var params = new URLSearchParams()
      params.set('status', 'eq.published')
      params.set('is_feed_visible', 'eq.true')
      params.set('category', 'eq.' + section.dataset.category)
      params.set('select', 'id,slug,title,images,video_id,published_at,feed_order_at')
      params.set('order', 'feed_order_at.desc.nullslast,published_at.desc.nullslast,id.desc')
      params.set('limit', String(batchSize))
      params.set('offset', String(offset))
      return fetch(FEED_API + '/rest/v1/feed_posts?' + params.toString(), {
        headers: { apikey: FEED_KEY, Authorization: 'Bearer ' + FEED_KEY, Accept: 'application/json' }
      }).then(function(response) {
        if (!response.ok) throw new Error('Feed ' + response.status)
        return response.json()
      }).then(function(rows) {
        rows = Array.isArray(rows) ? rows : []
        offset += rows.length
        var fresh = rows.filter(function(post) {
          if (!post.id || !post.slug || !post.title || seen.has(post.id)) return false
          seen.add(post.id)
          return true
        })
        if (fresh.length) {
          grid.insertAdjacentHTML('beforeend', fresh.map(categoryStreamCard).join(''))
          grid.querySelectorAll('.fn-related-card:not([data-track-ready]) a').forEach(function(link) {
            link.closest('.fn-related-card').dataset.trackReady = '1'
            link.addEventListener('click', function() { track('feed_post_open', { source: 'category_stream', from_slug: postSlug(), target_path: link.getAttribute('href') }) })
          })
        }
        if (rows.length < batchSize) finish()
      }).catch(function(error) {
        console.warn('[Feed] Category stream load failed', error)
        finish('Không thể tải thêm bài. Bạn vẫn có thể xem các bài mới bên dưới.')
      }).finally(function() {
        loading = false
        sentinel.classList.remove('is-loading')
      })
    }

    if (!('IntersectionObserver' in global)) { loadMore(); return }
    var observer = new IntersectionObserver(function(entries) {
      if (!entries.some(function(entry) { return entry.isIntersecting })) return
      observer.unobserve(sentinel)
      loadMore().finally(function() {
        if (!finished) global.requestAnimationFrame(function() { observer.observe(sentinel) })
        else observer.disconnect()
      })
    }, { rootMargin: '900px 0px', threshold: 0.01 })
    observer.observe(sentinel)
  }

  var videoModalState = null

  function closeVideoModal() {
    if (!videoModalState) return
    var state = videoModalState
    videoModalState = null
    document.removeEventListener('keydown', state.onKeydown)
    document.removeEventListener('touchmove', state.blockBackgroundGesture)
    document.removeEventListener('wheel', state.blockBackgroundGesture)
    state.inertNodes.forEach(function(item) { item.node.inert = item.wasInert })
    state.modal.remove()
    document.documentElement.classList.remove('fn-video-modal-open')
    document.body.style.position = state.bodyPosition
    document.body.style.top = state.bodyTop
    document.body.style.left = state.bodyLeft
    document.body.style.right = state.bodyRight
    document.body.style.width = state.bodyWidth
    global.scrollTo(0, state.scrollY)
    if (state.trigger && document.contains(state.trigger)) state.trigger.focus({ preventScroll: true })
  }

  function openVideoModal(button) {
    closeVideoModal()
    var id = button.dataset.videoId || ''
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return
    var title = button.dataset.videoTitle || 'Video F-SPORT'
    var scrollY = global.scrollY || document.documentElement.scrollTop || 0
    var modal = document.createElement('div')
    modal.className = 'fn-video-modal'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('aria-label', title)
    modal.innerHTML = '<button class="fn-video-modal-close" type="button" aria-label="Đóng video"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="fn-video-modal-player"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?playsinline=1&rel=0" title="' + title.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'
    document.body.appendChild(modal)

    var inertNodes = Array.from(document.body.children).filter(function(node) { return node !== modal }).map(function(node) {
      var item = { node: node, wasInert: !!node.inert }
      node.inert = true
      return item
    })
    var blockBackgroundGesture = function(event) {
      if (!modal.contains(event.target)) event.preventDefault()
    }
    var onKeydown = function(event) { if (event.key === 'Escape') closeVideoModal() }
    videoModalState = {
      modal: modal, trigger: button, scrollY: scrollY, inertNodes: inertNodes,
      blockBackgroundGesture: blockBackgroundGesture, onKeydown: onKeydown,
      bodyPosition: document.body.style.position, bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left, bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width
    }
    document.documentElement.classList.add('fn-video-modal-open')
    document.body.style.position = 'fixed'
    document.body.style.top = '-' + scrollY + 'px'
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('touchmove', blockBackgroundGesture, { passive: false })
    document.addEventListener('wheel', blockBackgroundGesture, { passive: false })
    modal.querySelector('.fn-video-modal-close').addEventListener('click', closeVideoModal)
    modal.querySelector('.fn-video-modal-close').focus()
    track('feed_video_open', { slug: postSlug(), video_id: id, source: 'feed_article' })
  }

  function initVideos() {
    document.querySelectorAll('.fn-article-video').forEach(function (button) {
      button.addEventListener('click', function () {
        openVideoModal(button)
      })
    })
  }

  function initMenu() {
    var button = document.querySelector('.fn-menu-button')
    var menu = document.getElementById('fn-mobile-menu')
    if (!button || !menu) return
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') === 'true'
      button.setAttribute('aria-expanded', open ? 'false' : 'true')
      menu.hidden = open
    })
    document.addEventListener('click', function (event) {
      if (menu.hidden || menu.contains(event.target) || button.contains(event.target)) return
      menu.hidden = true
      button.setAttribute('aria-expanded', 'false')
    })
  }

  function initRelatedTracking() {
    document.querySelectorAll('.fn-detail-rail a, .fn-article-pager a, .fn-article-related a, .fn-article-latest a, .fn-article-return a').forEach(function (link) {
      link.addEventListener('click', function () {
        var source = link.closest('.fn-detail-rail') ? 'detail_rail' :
          link.closest('.fn-article-pager') ? 'article_pager' :
            link.closest('.fn-article-latest') ? 'article_latest' :
              link.closest('.fn-article-return') ? 'article_return' : 'related_story'
        track('feed_post_open', { source: source, from_slug: postSlug(), target_path: link.getAttribute('href') })
      })
    })
  }

  function init() {
    initMenu()
    initVideos()
    initRelatedTracking()
    initCategoryStream()
    track('feed_post_view', { slug: postSlug(), source: 'feed_article' })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})(window)
