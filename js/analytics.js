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

  // ─── SOURCE / UTM ────────────────────────────────────────────
  function getSource() {
    var p   = {}
    var qs  = global.location.search.replace(/^\?/, '')
    qs.split('&').forEach(function (pair) {
      var kv = pair.split('=')
      if (kv[0]) p[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '')
    })
    return {
      utm_source:   p['utm_source']   || null,
      utm_medium:   p['utm_medium']   || null,
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
  var _userId    = null
  var _userType  = 'anonymous'
  var _ready     = false
  var _queue     = []

  function init() {
    // 1. Lấy hoặc tạo user_id
    var stored = lsGet(LS_UID_KEY)
    _userId = (typeof stored === 'string' && stored) ? stored : uuid()
    lsSet(LS_UID_KEY, _userId)

    // 2. Detect customer
    var customer = detectCustomer()
    _userType = customer.user_type

    // 3. Lưu/upsert user vào Supabase
    var cachedUser = lsGet(LS_USER_KEY)
    var isNew      = !cachedUser || cachedUser.user_id !== _userId

    var src = getSource()

    if (isNew) {
      // Tạo mới
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
      xhr('POST', '/rest/v1/analytics_users', payload)
      lsSet(LS_USER_KEY, { user_id: _userId, user_type: customer.user_type })
    } else {
      // Cập nhật last_seen + user_type (có thể đã thành customer)
      var updates = { last_seen: new Date().toISOString(), user_type: customer.user_type }
      if (customer.phone) updates.phone = customer.phone
      xhr('PATCH', '/rest/v1/analytics_users?user_id=eq.' + _userId, updates)
      // Cập nhật cache nếu user_type thay đổi
      if (cachedUser.user_type !== customer.user_type) {
        lsSet(LS_USER_KEY, { user_id: _userId, user_type: customer.user_type })
      }
    }

    _ready = true

    // Flush queue
    _queue.forEach(function (item) { _track(item.type, item.meta) })
    _queue = []
  }

  // ─── TRACK ───────────────────────────────────────────────────
  function _track(eventType, metadata) {
    if (!_userId) return
    xhr('POST', '/rest/v1/analytics_events', {
      user_id:    _userId,
      event_type: eventType,
      metadata:   metadata || {},
      created_at: new Date().toISOString()
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

  // ─── AUTO: view_product (sau 10 giây) ────────────────────────
  function autoTrackProduct() {
    var productId   = global.productPage || global.productCategory || null
    var productName = global.productName || null
    if (!productId) return
    setTimeout(function () {
      track('view_product', { product_id: productId, product_name: productName })
    }, 10000)
  }

  // ─── EXPOSE ──────────────────────────────────────────────────
  global.fsport = global.fsport || {}
  global.fsport.track       = track
  global.fsport.getUserId   = getUserId
  global.fsport.getUserType = getUserType

  // Khởi động khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); autoTrackProduct() })
  } else {
    init()
    autoTrackProduct()
  }

})(window)
