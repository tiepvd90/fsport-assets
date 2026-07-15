// ================================================================
// FSPORT ANALYTICS — tracking nội bộ
// Load ở tất cả các trang sản phẩm, trước các script khác
// Yêu cầu: window.FSPORT_SUPABASE_URL + window.FSPORT_SUPABASE_ANON đã có
// ================================================================
(function (global) {
  'use strict'

  var LS_UID_KEY      = 'fsport_uid'
  var LS_USER_KEY     = 'fsport_user'
  var LS_CHECKOUT_KEY = 'checkoutInfo'
  var LS_PROFILE_TOKEN_KEY = 'fsport_profile_token'
  var LS_PROFILE_ID_KEY    = 'fsport_profile_id'

  // ─── UTILS ───────────────────────────────────────────────────
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }

  function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') } catch (e) { return null }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch (e) {}
  }

  function supaUrl()  { return global.FSPORT_SUPABASE_URL  || '' }
  function supaAnon() { return global.FSPORT_SUPABASE_ANON || '' }

  function xhr(method, path, body) {
    return new Promise(function (resolve) {
      if (!supaUrl() || !supaAnon()) return resolve({ ok: false })
      var req = new XMLHttpRequest()
      req.open(method, supaUrl() + path, true)
      req.setRequestHeader('apikey', supaAnon())
      req.setRequestHeader('Authorization', 'Bearer ' + supaAnon())
      req.setRequestHeader('Accept', 'application/json')
      if (body) {
        req.setRequestHeader('Content-Type', 'application/json')
        req.setRequestHeader('Prefer', 'return=minimal')
      }
      req.onload  = function () { resolve({ ok: req.status < 300 }) }
      req.onerror = function () { resolve({ ok: false }) }
      req.send(body ? JSON.stringify(body) : null)
    })
  }

  function rpc(name, body) {
    return new Promise(function (resolve) {
      if (!supaUrl() || !supaAnon()) return resolve({ ok: false, data: null })
      var req = new XMLHttpRequest()
      req.open('POST', supaUrl() + '/rest/v1/rpc/' + name, true)
      req.setRequestHeader('apikey', supaAnon())
      req.setRequestHeader('Authorization', 'Bearer ' + supaAnon())
      req.setRequestHeader('Accept', 'application/json')
      req.setRequestHeader('Content-Type', 'application/json')
      req.onload = function () {
        var data = null
        try { data = JSON.parse(req.responseText || 'null') } catch (e) {}
        resolve({ ok: req.status < 300, data: data })
      }
      req.onerror = function () { resolve({ ok: false, data: null }) }
      req.send(JSON.stringify(body || {}))
    })
  }

  function profileAttribution(src) {
    src = src || {}
    return {
      source: src.utm_source || null,
      medium: src.utm_medium || null,
      campaign: src.utm_campaign || null,
      content: src.utm_content || null,
      referrer: src.referrer || null,
      landing_url: src.landing_url || null,
      device: src.device || null
    }
  }

  // ─── SOURCE / UTM ────────────────────────────────────────────
  function getSource() {
    var p   = {}
    var qs  = global.location.search.replace(/^\?/, '')
    qs.split('&').forEach(function (pair) {
      var kv = pair.split('=')
      if (kv[0]) p[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '')
    })
    function refHost() {
      if (!document.referrer) return ''
      try { return new URL(document.referrer).hostname.replace(/^www\./, '') } catch (e) { return '' }
    }
    function normalizeSource(source, medium) {
      var s = String(source || '').trim()
      var m = String(medium || '').trim().toLowerCase()
      var low = s.toLowerCase()
      if (low === 'fb' || low === 'facebook' || low === 'fb ads' || low === 'facebook ads') return 'FB Ads'
      if ((low.indexOf('facebook.') >= 0 || low.indexOf('fb.') >= 0) && /paid|cpc|ads?|social_paid/.test(m)) return 'FB Ads'
      if (low === 'google ads' || low === 'google adwords') return 'google'
      if (low === 'bing ads') return 'bing'
      return s || null
    }
    // Nhận diện click ID của từng nền tảng quảng cáo
    var clickIds = {
      fbclid:  { source: 'FB Ads',   medium: 'paid' },
      gclid:   { source: 'google',   medium: 'paid' },
      ttclid:  { source: 'tiktok',   medium: 'paid' },
      twclid:  { source: 'twitter',  medium: 'paid' },
      msclkid: { source: 'bing',     medium: 'paid' },
    }
    var detectedSource = p['utm_source'] || null
    var detectedMedium = p['utm_medium'] || null
    if (!detectedSource) {
      for (var cid in clickIds) {
        if (p[cid]) { detectedSource = clickIds[cid].source; detectedMedium = clickIds[cid].medium; break }
      }
    }
    detectedSource = normalizeSource(detectedSource, detectedMedium)
    if (!detectedSource && document.referrer) {
      var host = refHost()
      if (/google\./i.test(host)) {
        detectedSource = 'google'
        detectedMedium = 'organic'
      } else if (/bing\./i.test(host)) {
        detectedSource = 'bing'
        detectedMedium = 'organic'
      } else if (/yahoo\./i.test(host)) {
        detectedSource = 'yahoo'
        detectedMedium = 'organic'
      } else if (/facebook\.|fb\./i.test(host)) {
        detectedSource = host
        detectedMedium = 'referral'
      } else if (host) {
        detectedSource = host
        detectedMedium = 'referral'
      }
    }
    // Có "?" trong URL nhưng không nhận ra nguồn → dùng referrer domain hoặc 'unknown'
    // Không có "?" → mới tính là Direct (null)
    // Direct only when there is no UTM/click-id/referrer. Unknown means URL has params but no source signal.
    var hasParams = global.location.search.length > 1
    if (!detectedSource && hasParams) {
      detectedSource = 'unknown'
    }
    return {
      utm_source:   detectedSource,
      utm_medium:   detectedMedium,
      utm_campaign: p['utm_campaign'] || null,
      utm_content:  p['utm_content']  || null,
      referrer:     document.referrer || null,
      landing_url:  global.location.href || null,
      device:       /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }
  }

  // ─── DETECT CUSTOMER ─────────────────────────────────────────
  function detectCustomer() {
    var info = lsGet(LS_CHECKOUT_KEY)
    if (info && info.phone) {
      return { user_type: 'customer', phone: info.phone }
    }
    return { user_type: 'anonymous', phone: null }
  }

  // ─── INIT ────────────────────────────────────────────────────
  var _userId       = null
  var _profileToken = null
  var _profileId    = null
  var _userType     = 'anonymous'
  var _ready        = false
  var _queue        = []
  var _sessionStart = null
  var _sourceContext = null

  function init() {
    // 1. Lấy hoặc tạo user_id
    var stored = lsGet(LS_UID_KEY)
    _userId = (typeof stored === 'string' && stored) ? stored : uuid()
    lsSet(LS_UID_KEY, _userId)
    var storedToken = lsGet(LS_PROFILE_TOKEN_KEY)
    _profileToken = (typeof storedToken === 'string' && storedToken) ? storedToken : uuid()
    lsSet(LS_PROFILE_TOKEN_KEY, _profileToken)
    var storedProfileId = lsGet(LS_PROFILE_ID_KEY)
    _profileId = (typeof storedProfileId === 'string' && storedProfileId) ? storedProfileId : null

    // 2. Detect customer
    var customer = detectCustomer()
    _userType = customer.user_type

    // 3. Lưu/upsert user vào Supabase
    var cachedUser = lsGet(LS_USER_KEY)
    var isNew      = !cachedUser || cachedUser.user_id !== _userId

    var src = getSource()
    _sourceContext = src

    var resolvePromise = rpc('resolve_website_profile', {
      p_browser_token: _profileToken,
      p_legacy_uid: _userId,
      p_attribution: profileAttribution(src)
    })
    resolvePromise.then(function (res) {
      if (!res.ok || !res.data) return
      _profileId = res.data.profile_id || _profileId
      _userType = res.data.status || _userType
      if (_profileId) lsSet(LS_PROFILE_ID_KEY, _profileId)
    })

    resolvePromise.then(function (profileRes) {
      if (profileRes.ok && profileRes.data) {
        lsSet(LS_USER_KEY, { user_id: _userId, user_type: _userType })
        return
      }
      if (isNew) {
      // Tạo mới — chỉ cache localStorage SAU KHI insert thành công
      var payload = {
        user_id:      _userId,
        user_type:    customer.user_type,
        phone:        customer.phone,
        utm_source:   src.utm_source,
        utm_medium:   src.utm_medium,
        utm_campaign: src.utm_campaign,
        utm_content:  src.utm_content,
        referrer:     src.referrer,
        landing_url:  src.landing_url,
        device:       src.device,
        first_seen:   new Date().toISOString(),
        last_seen:    new Date().toISOString()
      }
      xhr('POST', '/rest/v1/analytics_users', payload).then(function (res) {
        if (res.ok) lsSet(LS_USER_KEY, { user_id: _userId, user_type: customer.user_type })
      })
      } else {
      // Cập nhật last_seen + user_type (có thể đã thành customer)
      var updates = { last_seen: new Date().toISOString(), user_type: customer.user_type }
      if (customer.phone) updates.phone = customer.phone
        xhr('PATCH', '/rest/v1/analytics_users?user_id=eq.' + encodeURIComponent(_userId), updates)
      // Cập nhật cache nếu user_type thay đổi
      if (cachedUser.user_type !== customer.user_type) {
        lsSet(LS_USER_KEY, { user_id: _userId, user_type: customer.user_type })
      }
      }
    })

    _ready = true
    _sessionStart = Date.now()
    _resetIdleTimer()

    // Flush queue
    _queue.forEach(function (item) { _track(item.type, item.meta) })
    _queue = []
  }

  // ─── SESSION DURATION ────────────────────────────────────────
  // Định nghĩa kết thúc phiên:
  //   Mobile : visibilitychange:hidden (tắt màn hình, chuyển app, chuyển tab)
  //   Desktop: như trên + idle 5 phút không có thao tác nào
  var _isMobile  = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  var IDLE_MS    = 5 * 60 * 1000   // 5 phút không hoạt động → cắt phiên (desktop)
  var _idleTimer = null

  function _trackSessionEnd() {
    if (!_sessionStart || !_userId) return
    var durationSec = Math.round((Date.now() - _sessionStart) / 1000)
    _sessionStart = null
    clearTimeout(_idleTimer)
    if (durationSec < 2) return
    var body = {
      user_id:    _userId,
      event_type: 'session_end',
      metadata:   { duration_sec: durationSec },
      created_at: new Date().toISOString()
    }
    if (navigator.sendBeacon && supaUrl() && supaAnon()) {
      try {
        var url = supaUrl() + '/rest/v1/analytics_events?apikey=' + supaAnon()
        navigator.sendBeacon(url, new Blob([JSON.stringify(body)], { type: 'application/json' }))
        return
      } catch (e) {}
    }
    _track('session_end', { duration_sec: durationSec })
  }

  function _resetIdleTimer() {
    if (_isMobile) return   // mobile dùng visibilitychange là đủ
    clearTimeout(_idleTimer)
    _idleTimer = setTimeout(_trackSessionEnd, IDLE_MS)
  }

  // Bất kỳ thao tác nào → reset idle timer, resume session nếu đang trống
  ;['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (!_sessionStart) _sessionStart = Date.now()  // phiên mới sau khi idle cắt
      _resetIdleTimer()
    }, { passive: true })
  })

  // Tắt màn hình / chuyển app / chuyển tab (mobile + desktop)
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      _trackSessionEnd()
    } else {
      _sessionStart = Date.now()
      _resetIdleTimer()
    }
  })

  // Tắt hẳn tab (desktop)
  global.addEventListener('beforeunload', _trackSessionEnd)

  // ─── TRACK ───────────────────────────────────────────────────
  function _track(eventType, metadata) {
    if (!_userId) return
    var meta = {}
    Object.keys(metadata || {}).forEach(function (k) { meta[k] = metadata[k] })
    if (_sourceContext) {
      if (meta.traffic_source === undefined) meta.traffic_source = _sourceContext.utm_source || null
      if (meta.traffic_medium === undefined) meta.traffic_medium = _sourceContext.utm_medium || null
      if (meta.traffic_campaign === undefined) meta.traffic_campaign = _sourceContext.utm_campaign || null
      if (meta.traffic_content === undefined) meta.traffic_content = _sourceContext.utm_content || null
      if (meta.referrer === undefined) meta.referrer = _sourceContext.referrer || null
    }
    if (eventType === 'purchase') {
      var phone = meta.customer_phone || meta.phone || null
      var updates = { user_type: 'customer', last_seen: new Date().toISOString() }
      if (phone) updates.phone = phone
      xhr('PATCH', '/rest/v1/analytics_users?user_id=eq.' + encodeURIComponent(_userId), updates)
      lsSet(LS_USER_KEY, { user_id: _userId, user_type: 'customer' })
      _userType = 'customer'
    }
    rpc('track_profile_event', {
      p_browser_token: _profileToken,
      p_legacy_uid: _userId,
      p_event_type: eventType,
      p_metadata: meta,
      p_attribution: profileAttribution(_sourceContext),
      p_profile_session_id: null
    }).then(function (res) {
      if (res.ok && res.data) {
        _profileId = res.data.profile_id || _profileId
        if (_profileId) lsSet(LS_PROFILE_ID_KEY, _profileId)
        return
      }
      xhr('POST', '/rest/v1/analytics_events', {
        user_id:    _userId,
        event_type: eventType,
        metadata:   meta,
        created_at: new Date().toISOString()
      })
    })
  }

  function track(eventType, metadata) {
    if (!_ready) {
      _queue.push({ type: eventType, meta: metadata || {} })
      return
    }
    _track(eventType, metadata || {})
  }

  function getUserId()   { return _userId }
  function getUserType() { return _userType }
  function getProfileId() { return _profileId }
  function getProfileToken() { return _profileToken }

  function identifyCustomer(customer) {
    customer = customer || {}
    return rpc('identify_profile_customer', {
      p_browser_token: _profileToken,
      p_legacy_uid: _userId,
      p_phone: customer.phone || null,
      p_name: customer.name || null,
      p_email: customer.email || null,
      p_customer_id: customer.customerId || null,
      p_order_id: customer.orderId || null
    }).then(function (res) {
      if (res.ok && res.data) {
        _profileId = res.data.profile_id || _profileId
        _userType = res.data.status || 'customer'
        if (_profileId) lsSet(LS_PROFILE_ID_KEY, _profileId)
        lsSet(LS_USER_KEY, { user_id: _userId, user_type: _userType })
      }
      return res
    })
  }

  // ─── AUTO: view_product (sau 10 giây) ────────────────────────
  function autoTrackProduct() {
    var pathSlug = (global.location && global.location.pathname ? global.location.pathname : '').split('/').pop().replace(/\.html$/i, '')
    var productId   = global.productPage || pathSlug || global.productCategory || null
    var productName = global.productName || null
    if (!productId) return
    setTimeout(function () {
      track('view_product', { page_slug: productId, product_id: productId, product_name: productName })
    }, 10000)
  }

  // ─── EXPOSE ──────────────────────────────────────────────────
  // Expose sớm ngay khi script load — slideshow/productdescription gọi được liền
  // Trước khi init() xong thì track() tự queue, sau init() flush hết
  global.fsport = global.fsport || {}
  global.fsport.track       = track
  global.fsport.getUserId   = getUserId
  global.fsport.getUserType = getUserType
  global.fsport.getProfileId = getProfileId
  global.fsport.getProfileToken = getProfileToken
  global.fsport.identifyCustomer = identifyCustomer

  // Khởi động khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); autoTrackProduct() })
  } else {
    init()
    autoTrackProduct()
  }

})(window)
