// ================================================================
// ORDER CONFIRM CHAT — Chatbox phía khách hàng
// Mở sau khi đặt hàng thành công (thay popup cảm ơn)
// Mobile: full màn hình kiểu Zalo
// Desktop: popup căn giữa
// ================================================================
(function () {
  'use strict'

  // Đọc dynamic thay vì capture 1 lần — tránh lỗi timing khi script load trước khi biến được set
  function SUPABASE_URL()  { return window.FSPORT_SUPABASE_URL  || '' }
  function SUPABASE_ANON() { return window.FSPORT_SUPABASE_ANON || '' }
  var _conversationId        = null
  var _realtimeSub           = null
  var _isOpen                = false
  var _sbClient              = null   // Supabase JS client cho Realtime
  var _settings              = null   // Cache settings (ai_enabled, ai_context, ai_api_key...)
  var _orderData             = null   // Cache order data cho AI context
  var _heartbeatTimer        = null   // Interval gửi heartbeat mỗi 30 giây
  var _inactivityTimer       = null   // Timeout tự đóng khi khách không hoạt động
  var _inactivityMs          = 30 * 60 * 1000  // mặc định 30 phút
  var _handleUnload          = null   // beforeunload/pagehide handler
  var _handleVisibility      = null   // visibilitychange handler
  var _visibilityOfflineTimer = null  // Debounce 45s trước khi mark offline (tránh false-offline khi đổi app)

  // Patch đồng bộ (dùng cho unload — không async)
  function _patchSync(id, body) {
    try {
      var xhr = new XMLHttpRequest()
      xhr.open('PATCH', SUPABASE_URL() + '/rest/v1/order_confirm_conversations?id=eq.' + id, false)
      xhr.setRequestHeader('apikey', SUPABASE_ANON())
      xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_ANON())
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.send(JSON.stringify(body))
    } catch(e) {}
  }

  // Reset inactivity timer — gọi mỗi khi khách gửi tin
  function _resetInactivity() {
    if (_inactivityTimer) clearTimeout(_inactivityTimer)
    if (!_inactivityMs) return
    _inactivityTimer = setTimeout(function() {
      close()
    }, _inactivityMs)
  }

  // Cleanup session timers + listeners
  function _cleanupSession() {
    if (_heartbeatTimer)  { clearInterval(_heartbeatTimer);  _heartbeatTimer  = null }
    if (_inactivityTimer) { clearTimeout(_inactivityTimer);  _inactivityTimer = null }
    // Huỷ debounce offline nếu đang pending
    if (_visibilityOfflineTimer) { clearTimeout(_visibilityOfflineTimer); _visibilityOfflineTimer = null }
    if (_handleUnload) {
      window.removeEventListener('beforeunload', _handleUnload)
      window.removeEventListener('pagehide',     _handleUnload)
      _handleUnload = null
    }
    if (_handleVisibility) {
      document.removeEventListener('visibilitychange', _handleVisibility)
      _handleVisibility = null
    }
  }

  // ─── LAZY LOAD SUPABASE JS CLIENT (cho Realtime) ───────────
  function _loadSupabaseClient() {
    return new Promise(function(resolve) {
      // Nếu đã có sẵn (từ ERP context hoặc lần trước)
      if (window.supabase && window.supabase.channel) { resolve(window.supabase); return }
      if (window._supabaseLib) { resolve(window._supabaseLib); return }
      var script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
      script.onload = function() {
        try {
          var lib = window.supabase || (window.supabaseJs && window.supabaseJs.createClient)
          if (window.supabase && window.supabase.createClient) {
            // UMD exports createClient on the module itself
            window._supabaseLib = window.supabase.createClient(SUPABASE_URL(), SUPABASE_ANON())
          } else {
            window._supabaseLib = null
          }
          resolve(window._supabaseLib)
        } catch(e) { resolve(null) }
      }
      script.onerror = function() { resolve(null) }
      document.head.appendChild(script)
    })
  }

  // ─── XHR HELPERS ───────────────────────────────────────────
  function _get(path) {
    var url = SUPABASE_URL(), anon = SUPABASE_ANON()
    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', url + path, true)
      xhr.setRequestHeader('apikey', anon)
      xhr.setRequestHeader('Authorization', 'Bearer ' + anon)
      xhr.setRequestHeader('Accept', 'application/json')
      xhr.onload = function() { resolve({ ok: xhr.status < 300, data: JSON.parse(xhr.responseText || 'null') }) }
      xhr.onerror = function() { resolve({ ok: false, data: null }) }
      xhr.send()
    })
  }

  function _post(path, body) {
    var url = SUPABASE_URL(), anon = SUPABASE_ANON()
    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest()
      xhr.open('POST', url + path, true)
      xhr.setRequestHeader('apikey', anon)
      xhr.setRequestHeader('Authorization', 'Bearer ' + anon)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Prefer', 'return=representation')
      xhr.onload = function() { resolve({ ok: xhr.status < 300, data: JSON.parse(xhr.responseText || 'null') }) }
      xhr.onerror = function() { resolve({ ok: false, data: null }) }
      xhr.send(JSON.stringify(body))
    })
  }

  function _patch(path, body) {
    var url = SUPABASE_URL(), anon = SUPABASE_ANON()
    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest()
      xhr.open('PATCH', url + path, true)
      xhr.setRequestHeader('apikey', anon)
      xhr.setRequestHeader('Authorization', 'Bearer ' + anon)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Prefer', 'return=minimal')
      xhr.onload = function() { resolve({ ok: xhr.status < 300 }) }
      xhr.onerror = function() { resolve({ ok: false }) }
      xhr.send(JSON.stringify(body))
    })
  }

  // ─── TEMPLATE RENDER ───────────────────────────────────────
  function renderTemplate(tpl, vars) {
    return tpl.replace(/\{\{(\w+)\}\}/g, function(_, key) {
      return vars[key] !== undefined ? vars[key] : ''
    })
  }

  function pickTemplate(settings, items) {
    var hasYsandal = (items || []).some(function(i) {
      var cat = (i.category || '').toLowerCase()
      return cat.indexOf('ysandal') >= 0 || cat.indexOf('sandal') >= 0
    })
    return hasYsandal ? settings.template_ysandal : settings.template_pickleball
  }

  function buildProductList(items) {
    return (items || []).map(function(i) {
      var name = i['Phân loại'] || i.product_name || i.id || ''
      return name
    }).filter(Boolean).join(', ')
  }

  // ─── MAIN OPEN FUNCTION ────────────────────────────────────
  async function open(opts) {
    // opts: { orderId, orderCode, customerName, customerPhone, customerAddress, items, total }
    console.log('[OC_CHAT] open() called', opts)
    // Nếu đang có chatbox cũ (đơn khác) → đóng hẳn rồi mở mới
    // Tránh trường hợp khách đặt đơn mới trước khi đóng chatbox cũ → chat lạc conversation
    if (_isOpen) {
      console.log('[OC_CHAT] force-closing existing session before opening new order')
      close()
    }
    _isOpen = true

    // 1. Load settings
    console.log('[OC_CHAT] loading settings from Supabase, URL:', SUPABASE_URL())
    var sRes = await _get('/rest/v1/order_confirm_settings?id=eq.1&select=*')
    console.log('[OC_CHAT] settings response:', sRes)
    var settings = (sRes.ok && sRes.data && sRes.data[0]) || null
    _settings = settings  // cache cho _callAI dùng

    // 2. Kiểm tra enabled
    if (!settings || !settings.enabled) {
      _isOpen = false
      if (typeof showThankyouPopup === 'function') showThankyouPopup()
      return
    }

    // 2. Tìm conversation theo order_id — KHÔNG tạo mới nếu đã tồn tại
    //    Đảm bảo admin và khách luôn ở cùng 1 conversation cho mỗi đơn hàng
    console.log('[OC_CHAT] looking up conversation for order:', opts.orderId)
    var existRes = await _get('/rest/v1/order_confirm_conversations?order_id=eq.' + opts.orderId + '&select=id&limit=1')
    var existConv = existRes.ok && existRes.data && existRes.data[0]

    var starterText = ''
    if (existConv) {
      // Đã có conversation → reuse, chỉ cập nhật trạng thái online
      _conversationId = existConv.id
      console.log('[OC_CHAT] reusing existing conversation:', _conversationId)
      await _patch('/rest/v1/order_confirm_conversations?id=eq.' + _conversationId, {
        customer_online: true,
        updated_at: new Date().toISOString()
      })
      // Lấy starter text để hiển thị trong chatbox (không insert lại)
      var productList = buildProductList(opts.items)
      var tpl = pickTemplate(settings, opts.items)
      starterText = renderTemplate(tpl, {
        customer_name: opts.customerName || '',
        phone:         opts.customerPhone || '',
        address:       opts.customerAddress || '',
        product_list:  productList,
        total_amount:  Number(opts.total || 0).toLocaleString('vi-VN') + 'đ',
        order_code:    opts.orderCode || ''
      })
    } else {
      // Chưa có → tạo mới
      console.log('[OC_CHAT] creating new conversation...')
      var convRes = await _post('/rest/v1/order_confirm_conversations', {
        order_id:        opts.orderId,
        order_code:      opts.orderCode,
        customer_name:   opts.customerName,
        customer_phone:  opts.customerPhone,
        customer_online: true,
        admin_took_over: false
      })
      console.log('[OC_CHAT] conversation response:', convRes)
      if (!convRes.ok || !convRes.data || !convRes.data[0]) {
        _isOpen = false
        if (typeof showThankyouPopup === 'function') showThankyouPopup()
        return
      }
      _conversationId = convRes.data[0].id

      // 3. Tạo starter message (chỉ khi conversation MỚI)
      var productList = buildProductList(opts.items)
      var tpl = pickTemplate(settings, opts.items)
      starterText = renderTemplate(tpl, {
        customer_name: opts.customerName || '',
        phone:         opts.customerPhone || '',
        address:       opts.customerAddress || '',
        product_list:  productList,
        total_amount:  Number(opts.total || 0).toLocaleString('vi-VN') + 'đ',
        order_code:    opts.orderCode || ''
      })
      await _post('/rest/v1/order_confirm_messages', {
        conversation_id: _conversationId,
        sender:          'shop',
        content:         starterText
      })
    }

    // 3b. Cache order data để _callAI không cần fetch lại mỗi tin nhắn
    _orderData = null
    var _orderId = opts.orderId
    if (_orderId) {
      var oRes = await _get(
        '/rest/v1/orders?id=eq.' + _orderId +
        '&select=order_code,customer_name,customer_phone,customer_address,total,order_items(product_name,color,size,quantity,unit_price)'
      )
      _orderData = (oRes.ok && oRes.data && oRes.data[0]) || null
    }
    // Nếu không lấy được từ DB thì tổng hợp từ opts (fallback)
    if (!_orderData) {
      _orderData = {
        order_code:       opts.orderCode || '',
        customer_name:    opts.customerName || '',
        customer_phone:   opts.customerPhone || '',
        customer_address: opts.customerAddress || '',
        total:            opts.total || 0,
        order_items:      (opts.items || []).map(function(i) {
          return {
            product_name: i['Phân loại'] || i.product_name || '',
            color:        i.color || null,
            size:         i.size || null,
            quantity:     i.quantity || 1,
            unit_price:   i.Giá || i.unit_price || 0
          }
        })
      }
    }

    // 4. Lấy avatar — ưu tiên settings.shop_avatar_url, fallback về erp_settings.iconUrl
    var avatarUrl = settings.shop_avatar_url || ''
    if (!avatarUrl) {
      try {
        var erpSet = JSON.parse(localStorage.getItem('fsport_erp_settings') || '{}')
        avatarUrl = erpSet.iconUrl || ''
      } catch(e) {}
    }

    // 5. Render chatbox
    renderChatbox(settings, starterText, avatarUrl, opts)

    // 6. Session management
    _inactivityMs = (settings.session_timeout_minutes || 30) * 60 * 1000

    // Heartbeat mỗi 30 giây — ERP dùng updated_at để phát hiện stale session
    _heartbeatTimer = setInterval(function() {
      if (_conversationId) {
        _patch('/rest/v1/order_confirm_conversations?id=eq.' + _conversationId, {
          updated_at: new Date().toISOString()
        })
      }
    }, 30 * 1000)

    // Inactivity timeout
    _resetInactivity()

    // visibilitychange — tab ẩn/đóng → offline (debounce 45s); hiện lại → online + huỷ debounce
    // Lý do debounce: mobile thường fire 'hidden' khi chuyển app ngắn hạn, kéo notification,
    // tắt màn hình tạm — nếu mark offline ngay thì backend sẽ khoá input admin oan
    _handleVisibility = function() {
      if (!_conversationId) return
      if (document.visibilityState === 'hidden') {
        // Chờ 45 giây — nếu khách quay lại trong thời gian đó thì không mark offline
        if (_visibilityOfflineTimer) return  // debounce đã đang chờ, không tạo thêm
        _visibilityOfflineTimer = setTimeout(function() {
          _visibilityOfflineTimer = null
          // Chỉ mark offline nếu tab vẫn còn bị ẩn sau 45s
          if (document.visibilityState === 'hidden' && _conversationId) {
            _patchSync(_conversationId, { customer_online: false, updated_at: new Date().toISOString() })
          }
        }, 45000)
      } else if (document.visibilityState === 'visible') {
        // Khách quay lại → huỷ debounce offline, mark online lại
        // customer_closed: false vì khách chưa thực sự tắt tab
        if (_visibilityOfflineTimer) {
          clearTimeout(_visibilityOfflineTimer)
          _visibilityOfflineTimer = null
        }
        _patch('/rest/v1/order_confirm_conversations?id=eq.' + _conversationId, {
          customer_online: true, customer_closed: false, updated_at: new Date().toISOString()
        })
        _resetInactivity()
      }
    }
    document.addEventListener('visibilitychange', _handleVisibility)

    // beforeunload / pagehide — khách tắt tab thật → set customer_closed: true (hard lock backend)
    _handleUnload = function() {
      if (_conversationId) _patchSync(_conversationId, {
        customer_online: false,
        customer_closed: true,
        updated_at: new Date().toISOString()
      })
    }
    window.addEventListener('beforeunload', _handleUnload)
    window.addEventListener('pagehide',     _handleUnload)

    // 7. Subscribe realtime
    subscribeRealtime()
  }

  // ─── RENDER CHATBOX ────────────────────────────────────────
  function renderChatbox(settings, starterText, avatarUrl, opts) {
    // Inject CSS
    if (!document.getElementById('oc-chat-style')) {
      var style = document.createElement('style')
      style.id = 'oc-chat-style'
      style.textContent = [
        // Mobile: bottom sheet 70% — backdrop mờ, panel trượt lên từ dưới
        '#oc-overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,.4);overflow:hidden}',
        '#oc-panel{display:flex;flex-direction:column;width:100%;height:70%;min-height:0;overflow:hidden;border-radius:16px 16px 0 0;background:#EDEFF3}',
        '#oc-drag-handle{width:36px;height:4px;background:rgba(0,0,0,.18);border-radius:2px;margin:8px auto 4px;flex-shrink:0}',
        '#oc-header{background:linear-gradient(135deg,#007AFF 0%,#00A6FF 100%);padding-top:0;flex-shrink:0}',
        '#oc-header-inner{display:flex;align-items:center;gap:10px;padding:12px 16px;height:56px;box-sizing:content-box;position:relative}',
        '#oc-close-btn{background:none;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:6px;flex-shrink:0;-webkit-tap-highlight-color:transparent;margin-left:auto}',
        '#oc-shop-info{display:flex;align-items:center;gap:10px;flex:1;min-width:0}',
        '#oc-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.4);flex-shrink:0}',
        '#oc-avatar-placeholder{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;text-align:center;line-height:1.2;padding:2px;box-sizing:border-box}',
        '#oc-shop-name{font-weight:700;font-size:16px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '#oc-msg-list{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}',
        '#oc-date-chip{text-align:center;font-size:11px;color:#8e8e93;background:rgba(0,0,0,.06);border-radius:10px;padding:3px 10px;display:inline-block;align-self:center;margin-bottom:4px}',
        '.oc-msg-shop{display:flex;align-items:flex-end;gap:8px}',
        '.oc-msg-shop-avatar{width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(0,0,0,.06)}',
        '.oc-msg-shop-avatar-ph{width:30px;height:30px;border-radius:50%;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;flex-shrink:0;text-align:center;line-height:1.1;padding:2px;box-sizing:border-box}',
        '.oc-bubble-shop{background:#fff;border-radius:2px 14px 14px 14px;padding:9px 13px;font-size:15px;color:#1e293b;max-width:72vw;word-break:break-word;box-shadow:0 1px 2px rgba(0,0,0,.08);line-height:1.45}',
        '.oc-msg-time{font-size:10px;color:#8e8e93;margin-top:3px;padding-left:2px}',
        '.oc-msg-customer{display:flex;justify-content:flex-end}',
        '.oc-bubble-customer{background:#D9F1FF;border-radius:14px 2px 14px 14px;padding:9px 13px;font-size:15px;color:#1e293b;max-width:72vw;word-break:break-word;line-height:1.45}',
        '.oc-msg-time-right{font-size:10px;color:#8e8e93;margin-top:3px;text-align:right;padding-right:2px}',
        '#oc-input-bar{background:#fff;border-top:1px solid #E5E5E5;padding:8px 12px;padding-bottom:calc(8px + env(safe-area-inset-bottom,0px));display:flex;gap:8px;align-items:center;flex-shrink:0}',
        '#oc-text-input{flex:1;border:1px solid #E5E5E5;border-radius:22px;padding:9px 16px;font-size:15px;outline:none;background:#F3F5F7;color:#1e293b;-webkit-appearance:none}',
        '#oc-text-input::placeholder{color:#8e8e93}',
        '#oc-text-input:focus{border-color:#007AFF;background:#fff}',
        '#oc-send-btn{background:#007AFF;color:#fff;border:none;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;-webkit-tap-highlight-color:transparent}',
        '#oc-send-btn:active{background:#005ecb}',
        // Typing indicator
        '#oc-typing{display:flex;align-items:flex-end;gap:8px}',
        '#oc-typing .oc-typing-dots{background:#fff;border-radius:2px 14px 14px 14px;padding:10px 14px;display:flex;gap:5px;align-items:center;box-shadow:0 1px 2px rgba(0,0,0,.08)}',
        '#oc-typing .oc-dot{width:7px;height:7px;border-radius:50%;background:#94a3b8;display:inline-block;animation:oc-bounce 1.2s ease-in-out infinite}',
        '#oc-typing .oc-dot:nth-child(2){animation-delay:.2s}',
        '#oc-typing .oc-dot:nth-child(3){animation-delay:.4s}',
        '@keyframes oc-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}',
        // Desktop: popup căn giữa (768px trở lên)
        '@media (min-width:768px){',
          '#oc-overlay{background:rgba(0,0,0,.5);align-items:center;justify-content:center}',
          '#oc-panel{width:420px;height:85vh;max-height:720px;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;flex:none;background:#EDEFF3;box-shadow:0 20px 60px rgba(0,0,0,.3)}',
          '#oc-header{border-radius:16px 16px 0 0}',
          '.oc-bubble-shop,.oc-bubble-customer{max-width:280px}',
        '}'
      ].join('')
      document.head.appendChild(style)
    }

    // Avatar HTML
    var shopInitials = (settings.shop_name || 'S').substring(0, 6)
    var avatarHTML = avatarUrl
      ? '<img id="oc-avatar" src="' + avatarUrl + '" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.4);flex-shrink:0">'
      : '<div id="oc-avatar-placeholder" style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">' + shopInitials + '</div>'

    var smallAvatarHTML = avatarUrl
      ? '<img class="oc-msg-shop-avatar" src="' + avatarUrl + '" alt="" onerror="this.outerHTML=\'<div class=oc-msg-shop-avatar-ph>' + shopInitials + '</div>\'">'
      : '<div class="oc-msg-shop-avatar-ph">' + shopInitials + '</div>'

    // Date chip
    var now = new Date(Date.now() + 7 * 3600000)
    var dateStr = now.getUTCDate() + '/' + (now.getUTCMonth() + 1) + '/' + now.getUTCFullYear()
    var timeStr = String(now.getUTCHours()).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0')

    // Starter message HTML
    var starterHTML = makeShopBubble(starterText, timeStr, smallAvatarHTML)

    // Build DOM
    var overlay = document.createElement('div')
    overlay.id = 'oc-overlay'
    overlay.innerHTML = (
      '<div id="oc-panel">' +

        '<div id="oc-drag-handle" aria-hidden="true"></div>' +

        '<div id="oc-header">' +
          '<div id="oc-header-inner">' +
            '<div id="oc-shop-info">' +
              avatarHTML +
              '<span id="oc-shop-name">' + esc(settings.shop_name || 'Shop') + '</span>' +
            '</div>' +
            '<button id="oc-close-btn" aria-label="Đóng">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div id="oc-msg-list">' +
          '<span id="oc-date-chip">' + dateStr + '</span>' +
          starterHTML +
        '</div>' +

        '<div id="oc-input-bar">' +
          '<input id="oc-text-input" type="text" placeholder="Nhập tin nhắn..." autocomplete="off" enterkeyhint="send">' +
          '<button id="oc-send-btn" aria-label="Gửi">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>' +
          '</button>' +
        '</div>' +

      '</div>'
    )

    document.body.appendChild(overlay)
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    // ① Chặn scroll trang phía sau (iOS Safari không đủ chỉ với overflow:hidden)
    overlay.addEventListener('touchmove', function(e) {
      var panel = document.getElementById('oc-panel')
      if (panel && panel.contains(e.target)) return   // scroll trong panel vẫn chạy bình thường
      e.preventDefault()                               // chặn scroll backdrop
    }, { passive: false })

    // ② Tap backdrop (ngoài panel) → đóng chatbox
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close()
    })

    // 📱 Fix bàn phím ảo mobile: dùng visualViewport API
    // - Overlay co theo visual viewport để input bar không bị keyboard che
    // - Khi keyboard bật: mở rộng panel lên 100% để giữ tối đa vùng xem tin nhắn
    // - Khi keyboard tắt: trở về 70% CSS default
    function _handleVpResize() {
      var el = document.getElementById('oc-overlay')
      if (!el) return
      var vp = window.visualViewport
      if (vp) {
        el.style.top    = vp.offsetTop + 'px'
        el.style.height = vp.height + 'px'
        el.style.bottom = 'auto'
        // Phát hiện bàn phím: viewport < 75% chiều cao thực của thiết bị
        var screenH = window.screen.availHeight || window.screen.height || window.innerHeight
        var keyboardOpen = vp.height < screenH * 0.75
        var panel = document.getElementById('oc-panel')
        if (panel) panel.style.height = keyboardOpen ? '100%' : ''  // '' → CSS 70%
      }
      // Giữ scroll về cuối danh sách tin nhắn sau khi bàn phím xuất hiện
      var list = document.getElementById('oc-msg-list')
      if (list) list.scrollTop = list.scrollHeight
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', _handleVpResize)
      window.visualViewport.addEventListener('scroll', _handleVpResize)
      overlay._removeResizeListener = function() {
        window.visualViewport.removeEventListener('resize', _handleVpResize)
        window.visualViewport.removeEventListener('scroll', _handleVpResize)
      }
    } else {
      // Fallback cho trình duyệt không hỗ trợ visualViewport
      window.addEventListener('resize', _handleVpResize)
      overlay._removeResizeListener = function() {
        window.removeEventListener('resize', _handleVpResize)
      }
    }
    _handleVpResize() // Gọi ngay để set kích thước ban đầu đúng

    // KHÔNG auto-focus — để khách xem tin nhắn trước, tránh bàn phím bật lên ngay

    // Events
    document.getElementById('oc-close-btn').addEventListener('click', close)

    var sendBtn = document.getElementById('oc-send-btn')
    var textInp = document.getElementById('oc-text-input')

    function doSend() {
      var text = (textInp.value || '').trim()
      if (!text || !_conversationId) return
      textInp.value = ''
      // Append optimistic bubble ngay
      appendCustomerBubble(text)
      // Reset inactivity timer mỗi khi khách nhắn
      _resetInactivity()
      // Gửi lên Supabase — sau đó gọi AI nếu bật
      _post('/rest/v1/order_confirm_messages', {
        conversation_id: _conversationId,
        sender:          'customer',
        content:         text
      }).then(function(res) {
        if (!res.ok) return
        // Chỉ gọi AI khi ai_enabled = true
        if (_settings && _settings.ai_enabled) {
          showTyping()
          _callAI(text).catch(function(e) {
            console.warn('[OC_CHAT] AI error:', e)
            hideTyping()
          })
        }
      })
    }

    sendBtn.addEventListener('click', doSend)
    textInp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); doSend() }
    })
  }

  // ─── BUBBLE BUILDERS ───────────────────────────────────────
  function makeShopBubble(text, time, smallAvatarHTML) {
    return (
      '<div class="oc-msg-shop">' +
        (smallAvatarHTML || '') +
        '<div>' +
          '<div class="oc-bubble-shop">' + esc(text) + '</div>' +
          '<div class="oc-msg-time">' + (time || '') + '</div>' +
        '</div>' +
      '</div>'
    )
  }

  function makeCustomerBubble(text, time) {
    return (
      '<div class="oc-msg-customer">' +
        '<div>' +
          '<div class="oc-bubble-customer">' + esc(text) + '</div>' +
          '<div class="oc-msg-time-right">' + (time || '') + '</div>' +
        '</div>' +
      '</div>'
    )
  }

  function appendCustomerBubble(text) {
    var list = document.getElementById('oc-msg-list')
    if (!list) return
    var now = new Date(Date.now() + 7 * 3600000)
    var t = String(now.getUTCHours()).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0')
    var el = document.createElement('div')
    el.innerHTML = makeCustomerBubble(text, t)
    list.appendChild(el.firstElementChild || el)
    list.scrollTop = list.scrollHeight
  }

  function showTyping() {
    var list = document.getElementById('oc-msg-list')
    if (!list || document.getElementById('oc-typing')) return
    var avatarEl = document.querySelector('#oc-shop-info #oc-avatar')
    var shopInitials = (document.getElementById('oc-shop-name') || {}).textContent || 'S'
    shopInitials = shopInitials.substring(0, 6)
    var avatarHTML = (avatarEl && avatarEl.src)
      ? '<img class="oc-msg-shop-avatar" src="' + avatarEl.src + '" alt="">'
      : '<div class="oc-msg-shop-avatar-ph">' + shopInitials + '</div>'
    var el = document.createElement('div')
    el.id = 'oc-typing'
    el.innerHTML = avatarHTML + '<div class="oc-typing-dots"><span class="oc-dot"></span><span class="oc-dot"></span><span class="oc-dot"></span></div>'
    list.appendChild(el)
    list.scrollTop = list.scrollHeight
  }

  function hideTyping() {
    var el = document.getElementById('oc-typing')
    if (el) el.remove()
  }

  function appendShopBubble(text) {
    var list = document.getElementById('oc-msg-list')
    if (!list) return
    var now = new Date(Date.now() + 7 * 3600000)
    var t = String(now.getUTCHours()).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0')
    // Lấy lại small avatar
    var avatarEl = document.querySelector('#oc-shop-info #oc-avatar')
    var avatarPh = document.querySelector('#oc-shop-info #oc-avatar-placeholder')
    var shopInitials = (document.getElementById('oc-shop-name') || {}).textContent || 'S'
    shopInitials = shopInitials.substring(0, 6)
    var smallAvatarHTML = (avatarEl && avatarEl.src)
      ? '<img class="oc-msg-shop-avatar" src="' + avatarEl.src + '" alt="">'
      : '<div class="oc-msg-shop-avatar-ph">' + shopInitials + '</div>'
    var el = document.createElement('div')
    el.innerHTML = makeShopBubble(text, t, smallAvatarHTML)
    list.appendChild(el.firstElementChild || el)
    list.scrollTop = list.scrollHeight
  }

  // ─── AI AGENT — gọi Gemini trực tiếp, không qua Make.com ──
  // Được gọi sau khi customer POST tin nhắn lên Supabase.
  // Flow: check admin_took_over → fetch full history → call Gemini → POST reply
  // Realtime subscription sẽ tự hiển thị reply và gọi hideTyping()
  async function _callAI(latestMessage) {
    console.log('[OC_AI] _callAI() called, message:', latestMessage)
    console.log('[OC_AI] _settings:', _settings)
    if (!_settings || !_settings.ai_enabled || !_conversationId) {
      console.warn('[OC_AI] Guard fail — ai_enabled:', _settings && _settings.ai_enabled, '| conversationId:', _conversationId)
      hideTyping(); return
    }

    // 1. Check admin_took_over — nếu admin đã can thiệp thì im lặng
    var convRes = await _get(
      '/rest/v1/order_confirm_conversations?id=eq.' + _conversationId +
      '&select=admin_took_over'
    )
    console.log('[OC_AI] conversation check:', convRes)
    var conv = convRes.ok && convRes.data && convRes.data[0]
    if (!conv || conv.admin_took_over) {
      console.warn('[OC_AI] admin_took_over=true hoặc không lấy được conversation — bỏ qua')
      hideTyping(); return
    }

    // 2. Fetch toàn bộ lịch sử hội thoại (kể cả starter message)
    var histRes = await _get(
      '/rest/v1/order_confirm_messages?conversation_id=eq.' + _conversationId +
      '&order=created_at.asc&limit=100&select=sender,content'
    )
    console.log('[OC_AI] history fetch:', histRes.ok, '| count:', histRes.data && histRes.data.length)
    var history = (histRes.ok && histRes.data) || []

    // 3. Build order info từ cache _orderData
    var orderInfo = ''
    if (_orderData) {
      var o = _orderData
      var itemLines = (o.order_items || []).map(function(i) {
        var line = '  - ' + (i.product_name || '(không tên)')
        if (i.color) line += ' | Màu: ' + i.color
        if (i.size)  line += ' | Size: ' + i.size
        line += ' | SL: ' + (i.quantity || 1)
        line += ' | ' + Number(i.unit_price || 0).toLocaleString('vi-VN') + 'đ'
        return line
      }).join('\n')
      orderInfo = [
        'Mã đơn:    ' + (o.order_code || ''),
        'Khách:     ' + (o.customer_name || '') + ' | SĐT: ' + (o.customer_phone || ''),
        'Địa chỉ:   ' + (o.customer_address || ''),
        'Tổng tiền: ' + Number(o.total || 0).toLocaleString('vi-VN') + 'đ',
        'Sản phẩm:\n' + itemLines
      ].join('\n')
    }

    // 4. Build conversation history text (bỏ tin system)
    var historyText = history
      .filter(function(m) { return m.sender !== 'system' })
      .map(function(m) {
        return (m.sender === 'shop' ? 'SHOP' : 'KHÁCH') + ': ' + m.content
      })
      .join('\n')

    // 5. Tổng hợp system prompt:
    //    [context từ settings] + [thông tin đơn] + [lịch sử hội thoại]
    var baseContext = (_settings.ai_context || '').trim()
    var systemText =
      baseContext +
      '\n\n=== THÔNG TIN ĐƠN HÀNG ===\n' + orderInfo +
      '\n\n=== TOÀN BỘ LỊCH SỬ HỘI THOẠI (từ đầu đến hiện tại) ===\n' + historyText +
      '\n\nDựa trên lịch sử hội thoại trên, hãy trả lời tin nhắn cuối cùng của KHÁCH. ' +
      'Chỉ trả lời đúng trọng tâm. Không bịa thông tin. ' +
      "Nếu không biết, nói 'Em sẽ hỏi lại shop và phản hồi anh/chị sớm nhé'.\n\n" +
      'ĐẶC BIỆT: Nếu hội thoại đã kết thúc tự nhiên (khách nói cảm ơn, tạm biệt, xác nhận không cần thêm gì, hoặc vấn đề đã được giải quyết hoàn toàn), ' +
      'hãy gửi thêm 1 tin nhắn lời chào kết thúc lịch sự (ví dụ: "Dạ em xin phép kết thúc phiên chat tại đây, anh/chị có cần hỗ trợ thêm bất cứ lúc nào cứ liên hệ F-SPORT nhé 🙏"), ' +
      'sau đó thêm [[END]] vào CUỐI CÙNG của tin nhắn đó. ' +
      'Chỉ dùng [[END]] khi thực sự chắc chắn hội thoại đã xong — không dùng khi khách vẫn còn thắc mắc.'

    // 6. Gọi Gemini API trực tiếp
    var apiKey = (_settings.ai_api_key || '').trim()
    console.log('[OC_AI] api_key present:', !!apiKey, '| key prefix:', apiKey.substring(0, 8) + '...')
    if (!apiKey) {
      console.warn('[OC_AI] Không có API key — vào ERP > Inbox > Settings > Gemini API Key')
      hideTyping(); return
    }
    console.log('[OC_AI] systemText length:', systemText.length)
    console.log('[OC_AI] calling Gemini...')
    var geminiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey

    var reqBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: systemText }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: latestMessage }]
      }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7
      }
    })

    var gemRes = await new Promise(function(resolve) {
      var xhr = new XMLHttpRequest()
      xhr.open('POST', geminiUrl, true)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.onload = function() {
        try { resolve({ ok: xhr.status < 300, data: JSON.parse(xhr.responseText) }) }
        catch(e) { resolve({ ok: false, data: null }) }
      }
      xhr.onerror = function() { resolve({ ok: false, data: null }) }
      xhr.send(reqBody)
    })

    // 7. Trích xuất text từ response Gemini (index 0 — JS 0-based, khác Make.com 1-based)
    var aiText = gemRes.ok &&
      gemRes.data &&
      gemRes.data.candidates &&
      gemRes.data.candidates[0] &&
      gemRes.data.candidates[0].content &&
      gemRes.data.candidates[0].content.parts &&
      gemRes.data.candidates[0].content.parts[0] &&
      gemRes.data.candidates[0].content.parts[0].text

    console.log('[OC_AI] Gemini response ok:', gemRes.ok, '| full response:', JSON.stringify(gemRes.data))
    if (!gemRes.ok) {
      console.error('[OC_AI] Gemini API error:', JSON.stringify(gemRes.data))
      hideTyping(); return
    }
    if (!aiText || !aiText.trim()) {
      console.warn('[OC_AI] AI trả về rỗng — full response:', gemRes.data)
      hideTyping(); return
    }
    // Kiểm tra marker [[END]] — AI muốn kết thúc hội thoại
    var shouldEnd = aiText.indexOf('[[END]]') >= 0
    var cleanText = aiText.replace(/\[\[END\]\]/g, '').trim()

    console.log('[OC_AI] AI reply:', cleanText, '| shouldEnd:', shouldEnd)

    // 8. POST AI reply vào Supabase — Realtime sub sẽ tự hiển thị + gọi hideTyping()
    await _post('/rest/v1/order_confirm_messages', {
      conversation_id: _conversationId,
      sender:          'shop',
      content:         cleanText
    })

    // 9. Nếu AI đánh dấu kết thúc → đóng chatbox sau 4 giây (để khách đọc tin cuối)
    if (shouldEnd && _conversationId) {
      console.log('[OC_AI] AI kết thúc hội thoại — đóng sau 4 giây')
      setTimeout(function() {
        if (_isOpen) close()
      }, 4000)
    }
  }

  // ─── REALTIME ──────────────────────────────────────────────
  async function subscribeRealtime() {
    if (!_conversationId) return
    _sbClient = await _loadSupabaseClient()
    if (!_sbClient) { console.warn('[OC_CHAT] Realtime unavailable — Supabase client failed to load'); return }
    _realtimeSub = _sbClient
      .channel('customer-chat-' + _conversationId)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'order_confirm_messages',
        filter: 'conversation_id=eq.' + _conversationId
      }, function(payload) {
        var msg = payload.new
        // Tin nhắn hệ thống — admin kết thúc phiên
        if (msg.sender === 'system' && msg.content === '__SESSION_ENDED__') {
          _lockSessionByAdmin()
          return
        }
        // Chỉ hiển thị tin nhắn từ shop (customer đã optimistic append rồi)
        if (msg.sender === 'shop') { hideTyping(); appendShopBubble(msg.content) }
      })
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'order_confirm_conversations',
        filter: 'id=eq.' + _conversationId
      }, function(payload) {
        // Admin ấn "Kết thúc phiên" → customer_closed = true → lock frontend khách
        if (payload.new && payload.new.customer_closed) {
          _lockSessionByAdmin()
        }
      })
      .subscribe()
  }

  // ─── LOCK BY ADMIN ─────────────────────────────────────────
  // Được gọi khi admin ấn "Kết thúc phiên" — đóng chatbox + hiện toast, không patch DB
  function _lockSessionByAdmin() {
    // Dọn timers + listeners (không patch DB — admin đã set rồi)
    if (_inactivityTimer)        { clearTimeout(_inactivityTimer);        _inactivityTimer = null }
    if (_visibilityOfflineTimer) { clearTimeout(_visibilityOfflineTimer); _visibilityOfflineTimer = null }
    document.removeEventListener('visibilitychange', _handleVisibility)
    window.removeEventListener('beforeunload', _handleUnload)
    window.removeEventListener('pagehide',     _handleUnload)
    // Huỷ realtime
    if (_realtimeSub && _sbClient) { _sbClient.removeChannel(_realtimeSub); _realtimeSub = null }
    // Đóng overlay chatbox
    var overlay = document.getElementById('oc-overlay')
    if (overlay) {
      if (overlay._removeResizeListener) overlay._removeResizeListener()
      overlay.remove()
    }
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    _isOpen = false
    _conversationId = null
    _settings = null
    _orderData = null
    // Hiện toast "Phiên chat đã kết thúc" rồi tự mất sau 3 giây
    var toast = document.createElement('div')
    toast.textContent = 'PHIÊN CHAT ĐÃ KẾT THÚC'
    toast.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(30,41,59,.88)',
      'color:#fff',
      'font-size:13px',
      'font-weight:600',
      'letter-spacing:.05em',
      'padding:10px 20px',
      'border-radius:24px',
      'z-index:99999',
      'pointer-events:none',
      'opacity:1',
      'transition:opacity .4s ease'
    ].join(';')
    document.body.appendChild(toast)
    setTimeout(function() { toast.style.opacity = '0' }, 2600)
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast) }, 3000)
  }

  // ─── CLOSE ─────────────────────────────────────────────────
  function close() {
    // Dọn timers + event listeners
    _cleanupSession()
    // Đánh dấu khách offline + closed (gọi bởi inactivity timeout hoặc user chủ động đóng)
    // customer_closed: true → backend hard lock input admin
    if (_conversationId) {
      _patch('/rest/v1/order_confirm_conversations?id=eq.' + _conversationId, {
        customer_online: false,
        customer_closed: true,
        updated_at: new Date().toISOString()
      })
    }
    // Huỷ realtime
    if (_realtimeSub && _sbClient) {
      _sbClient.removeChannel(_realtimeSub)
      _realtimeSub = null
    }
    // Xoá overlay
    var overlay = document.getElementById('oc-overlay')
    if (overlay) {
      if (overlay._removeResizeListener) overlay._removeResizeListener()
      overlay.remove()
    }
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    _isOpen = false
    _conversationId = null
    _settings = null
    _orderData = null
  }

  // ─── HELPERS ───────────────────────────────────────────────
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // ─── PUBLIC ────────────────────────────────────────────────
  window.OC_CHAT = { open: open, close: close }

})()
