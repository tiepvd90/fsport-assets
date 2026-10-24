;(function (global) {
  'use strict'

  function track(type, metadata) {
    if (global.fsport && typeof global.fsport.track === 'function') global.fsport.track(type, metadata || {})
  }

  function postSlug() {
    return String(global.location.pathname || '').replace(/\/+$/, '').split('/').pop()
  }

  function initVideos() {
    document.querySelectorAll('.fn-article-video').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.dataset.videoId || ''
        if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return
        var title = button.dataset.videoTitle || 'Video F-SPORT'
        var iframe = document.createElement('iframe')
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1'
        iframe.title = title
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
        iframe.allowFullscreen = true
        button.replaceWith(iframe)
        track('feed_video_play', { slug: postSlug(), video_id: id, source: 'feed_article' })
      }, { once: true })
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
    document.querySelectorAll('.fn-inline-related a, .fn-detail-rail a, .fn-article-pager a, .fn-article-related a, .fn-article-latest a, .fn-article-return a').forEach(function (link) {
      link.addEventListener('click', function () {
        var source = link.closest('.fn-inline-related') ? 'inline_related' :
          link.closest('.fn-detail-rail') ? 'detail_rail' :
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
    track('feed_post_view', { slug: postSlug(), source: 'feed_article' })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})(window)
