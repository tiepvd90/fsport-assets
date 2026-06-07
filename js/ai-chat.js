// ================================================================
// AI TƯ VẤN — Widget tư vấn + bán hàng tích hợp Gemini
// Dùng: AiChat.init({ slug: 'panther.html', productGroup: 'panther' })
// ================================================================
(function (global) {
  'use strict'

  var GEMINI_MODEL      = 'gemini-2.5-flash'
  var GEMINI_MAX_TOKENS = 5000
  var NONSENSE_LIMIT    = 4   // số tin vô nghĩa liên tiếp trước khi block
  var LS_KEY            = 'fsport_ai_chat_v1'

  // Regex nhận diện SĐT Việt Nam
  var PHONE_RE = /(?:(?:\+?84)|0)(?:3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}/g

  function SUPABASE_URL()  { return window.FSPORT_SUPABASE_URL  || '' }
  function SUPABASE_ANON() { return window.FSPORT_SUPABASE_ANON || '' }

  // ─── STATE ──────────────────────────────────────────────────
  var _cfg            = null
  var _session        = null   // { id, session_key, message_count, is_blocked, nonsense_count, has_phone }
  var _products       = []
  var _history        = []
  var _isOpen         = false
  var _isThinking     = false
  var _scrollY        = 0   // lưu vị trí cuộn khi mở panel
  var _slug           = ''
  var _group          = ''
  var _MAX            = 20
  var _sessionIds     = []
  var _initPromise    = null
  var _initialized    = false
  var _nonsenseStreak = 0      // đếm liên tiếp — reset khi AI trả lời bình thường

  // ─── XHR ────────────────────────────────────────────────────
  function _xhr(method, path, body) {
    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest()
      xhr.open(method, SUPABASE_URL() + path, true)
      xhr.setRequestHeader('apikey', SUPABASE_ANON())
      xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_ANON())
      xhr.setRequestHeader('Accept', 'application/json')
      if (body) {
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Prefer', method === 'POST' ? 'return=representation' : 'return=minimal')
      }
      xhr.onload = function() {
        try { resolve({ ok: xhr.status < 300, data: JSON.parse(xhr.responseText || 'null') }) }
        catch(e) { resolve({ ok: false, data: null }) }
      }
      xhr.onerror = function() { resolve({ ok: false, data: null }) }
      xhr.send(body ? JSON.stringify(body) : null)
    })
  }
  function _get(p)    { return _xhr('GET',   p, null) }
  function _post(p,b) { return _xhr('POST',  p, b)    }
  function _patch(p,b){ return _xhr('PATCH', p, b)    }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  }

  function _parseMarkdown(s) {
    if (!s) return ''
    var h = String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    h = h.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    h = h.replace(/\n/g, '<br>')
    return h
  }

  // ─── PHONE DETECTION ────────────────────────────────────────
  function _extractPhone(text) {
    var matches = text.replace(/[\s\-\.]/g,'').match(PHONE_RE)
    return matches ? matches[0] : null
  }

  // ─── LOCAL STORAGE ──────────────────────────────────────────
  function _lsGet() { try { return JSON.parse(localStorage.getItem(LS_KEY)||'null') } catch(e){ return null } }
  function _lsSet(d){ try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch(e){} }
  function _uuid()  {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
      var r=Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16)
    })
  }

  // ─── SESSION ────────────────────────────────────────────────
  // Chỉ kiểm tra session cũ, KHÔNG tạo mới (tránh ghi DB khi chưa có tin)
  async function _checkSession() {
    var ls  = _lsGet()
    var key = (ls && ls.session_key) ? ls.session_key : _uuid()
    if (!ls || !ls.session_key) _lsSet({ session_key: key })
    var res = await _get(
      '/rest/v1/ai_chat_sessions?session_key=eq.' + key +
      '&select=id,session_key,message_count,is_blocked,block_reason,nonsense_count,has_phone,customer_phone' +
      '&order=created_at.desc&limit=1000'
    )
    var sessions = (res.ok && res.data) || []
    _sessionIds = sessions.map(function(s) { return s.id }).filter(Boolean)
    var existing = sessions[0]
    if (existing) {
      _session = existing
      _nonsenseStreak = existing.nonsense_count || 0
    } else {
      // Giữ session_key nhưng chưa tạo record
      _session = { id: null, session_key: key, message_count: 0,
        is_blocked: false, nonsense_count: 0, has_phone: false }
    }
    return _session
  }

  // Tạo session thực khi gửi tin đầu tiên
  async function _initSession() {
    var key = (_session && _session.session_key) || _lsGet()?.session_key || _uuid()
    var uid = (typeof window.fsport !== 'undefined') ? window.fsport.getUserId() : null
    var cr  = await _post('/rest/v1/ai_chat_sessions', {
      session_key: key, slug: 'global', product_group: _group,
      user_id: uid,
      message_count: 0, is_blocked: false, nonsense_count: 0, has_phone: false
    })
    var created = (cr.ok && cr.data && cr.data[0]) || null
    if (created) {
      _session = created
      _sessionIds = [created.id]
      _nonsenseStreak = 0
    }
    return _session
  }

  async function _loadHistory() {
    if (!_sessionIds.length) return []
    var res = await _get(
      '/rest/v1/ai_chat_messages?session_id=in.(' + _sessionIds.join(',') + ')' +
      '&select=sender,content&order=created_at.asc&limit=1000'
    )
    _history = (res.ok && res.data) || []
    return _history
  }

  async function _saveMessage(sender, content) {
    if (!_session || !_session.id) return
    await _post('/rest/v1/ai_chat_messages', { session_id: _session.id, sender, content })
    _history.push({ sender, content })
  }

  async function _patchSession(fields) {
    if (!_session || !_session.id) return
    Object.assign(_session, fields)
    await _patch('/rest/v1/ai_chat_sessions?id=eq.' + _session.id, fields)
  }

  async function _fetchProducts() {
    var res = await _get(
      '/rest/v1/products?ai_enabled=eq.true' +
      '&select=product_code,product_name,category,color,size,price,stock_qty,image_url,image_urls' +
      '&order=category.asc,color.asc,size.asc'
    )
    _products = (res.ok && res.data) || []
    return _products
  }

  // ─── BLOCK SESSION ──────────────────────────────────────────
  async function _blockSession(reason) {
    await _patchSession({ is_blocked: true, block_reason: reason || 'Tự động chặn' })
    var inp  = document.getElementById('aic-input')
    var send = document.getElementById('aic-send')
    if (inp)  { inp.disabled = true; inp.placeholder = 'Phiên chat đã bị chặn' }
    if (send) send.disabled = true
  }

  // ─── GEMINI ─────────────────────────────────────────────────
  async function _callGemini(userMessage) {
    var apiKey = ((_cfg && _cfg.gemini_api_key) || '').trim()
    if (!apiKey) return null

    var productLines = _products.map(function(p) {
      var line = '  - [' + (p.product_code||'?') + '] ' + (p.product_name||'')
      if (p.color)     line += ' | Màu: '    + p.color
      if (p.size)      line += ' | Size: '   + p.size
      if (p.category)  line += ' | Loại: '   + p.category
      line += ' | Giá bán: ' + Number(p.price||0).toLocaleString('vi-VN') + 'đ'
      line += ' | Tồn kho: ' + (p.stock_qty > 0 ? p.stock_qty + ' sản phẩm' : 'Hết hàng')
      // Tất cả ảnh (image_urls ưu tiên, fallback image_url)
      var imgs = Array.isArray(p.image_urls) && p.image_urls.length ? p.image_urls : (p.image_url ? [p.image_url] : [])
      if (imgs.length) line += '\n    Ảnh: ' + imgs.join(' | ')
      return line
    }).join('\n')

    var historyText = _history
      .filter(function(m){ return m.sender !== 'system' })
      .map(function(m){ return (m.sender==='user' ? 'KHÁCH' : 'AI') + ': ' + m.content })
      .join('\n')

    var baseContext = ((_cfg && _cfg.ai_context) || '').trim()

    // Phần hướng dẫn marker — cố định, không chỉnh được qua ERP
    var markerInstructions =
      '\n\n=== HƯỚNG DẪN MARKER ĐẶC BIỆT (KHÔNG hiển thị cho khách) ===' +
      '\nCuối phản hồi, thêm 1 trong các marker sau nếu cần:' +
      '\n- [[BLOCK]]: Tin nhắn vi phạm tiêu chuẩn (nói bậy, xúc phạm, nội dung không phù hợp, spam rõ ràng có chủ đích). Chặn ngay lập tức.' +
      '\n- [[NONSENSE]]: Tin nhắn vô nghĩa hoàn toàn (gõ lung tung, không thể hiểu được ý định). KHÔNG dùng nếu câu hỏi chỉ là ngắn hoặc không liên quan sản phẩm.' +
      '\n- Không thêm marker nào: Tin nhắn bình thường (kể cả câu ngắn, câu hỏi ngoài sản phẩm, hay câu chào hỏi).' +
      '\nQuy tắc: [[BLOCK]] ưu tiên hơn [[NONSENSE]]. Chỉ dùng [[NONSENSE]] khi KHÔNG thể đoán được bất kỳ ý định nào.'

    // Context 1: hướng dẫn + chính sách (admin nhập tay)
    // Context 2: dữ liệu sản phẩm (tự động từ DB)
    var productContext = productLines
      ? '=== DANH SÁCH SẢN PHẨM F-SPORT (' + _products.length + ' sản phẩm) ===\n' + productLines
      : '(Chưa có dữ liệu sản phẩm)'

    var systemText =
      baseContext +
      '\n\n' + productContext +
      '\n\n=== LỊCH SỬ HỘI THOẠI ===\n' + (historyText || '(Chưa có)') +
      '\n\nHãy trả lời tin nhắn cuối cùng của KHÁCH. Không bịa thêm thông tin ngoài context.' +
      markerInstructions

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL +
              ':generateContent?key=' + apiKey

    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.onload = function() {
        try {
          var d = JSON.parse(xhr.responseText)
          var text = d && d.candidates && d.candidates[0] &&
            d.candidates[0].content && d.candidates[0].content.parts &&
            d.candidates[0].content.parts[0] && d.candidates[0].content.parts[0].text
          resolve(text ? text.trim() : null)
        } catch(e) { resolve(null) }
      }
      xhr.onerror = function(){ resolve(null) }
      xhr.send(JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: GEMINI_MAX_TOKENS, temperature: 0.65 }
      }))
    })
  }

  // ─── PARSE AI RESPONSE MARKERS ───────────────────────────────
  // Trả về { text, isBlock, isNonsense }
  function _parseMarkers(raw) {
    if (!raw) return { text: '', isBlock: false, isNonsense: false }
    var isBlock    = raw.indexOf('[[BLOCK]]') >= 0
    var isNonsense = !isBlock && raw.indexOf('[[NONSENSE]]') >= 0
    var text = raw.replace(/\[\[BLOCK\]\]/g, '').replace(/\[\[NONSENSE\]\]/g, '').trim()
    return { text, isBlock, isNonsense }
  }

  // ================================================================
  // UI
  // ================================================================
  var WIDGET_ID = 'fsport-ai-chat-widget'
  var _pendingOpen = false

  function _color() { return (_cfg && _cfg.widget_color) || '#111827' }

  function _renderWidget() {
    if (document.getElementById(WIDGET_ID)) return
    var cfg       = _cfg || {}
    var max       = cfg.max_messages_per_session || 20
    var count     = (_session && _session.message_count) || 0
    var color     = _color()
    var bgColor   = (cfg && cfg.chat_bg_color) || '#f8fafc'
    var questions = Array.isArray(cfg.suggested_questions) ? cfg.suggested_questions : []

    // Bar logo — full width, auto height (fill hết chiều ngang)
    var logoHTMLBar = cfg.logo_url
      ? '<img src="' + esc(cfg.logo_url) + '" style="width:100%;height:auto;display:block" onerror="this.remove()">'
      : '<span style="font-weight:700;font-size:16px;color:#fff">AI Tư Vấn</span>'
    // Panel header logo — fixed height 30px, width tự nhiên, căn trái
    var logoHTML = cfg.logo_url
      ? '<img src="' + esc(cfg.logo_url) + '" style="height:30px;width:auto;max-width:100%;display:block" onerror="this.remove()">'
      : '<span style="font-weight:700;font-size:14px;color:#fff">AI Tư Vấn</span>'

    var chipsHTML = questions.map(function(q){
      return '<button class="aic-chip" style="white-space:nowrap;border:1px solid ' + esc(color) + ';color:' + esc(color) + ';' +
        'background:#fff;border-radius:20px;padding:5px 12px;font-size:12px;cursor:pointer;flex-shrink:0">' + esc(q) + '</button>'
    }).join('')

    var isBlocked   = _session && _session.is_blocked
    var inputDisabled = (isBlocked || count >= max) ? 'disabled' : ''

    document.getElementById('aic-container').innerHTML =
      '<div id="' + WIDGET_ID + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;box-sizing:border-box">' +

      '<style>' +
        '#' + WIDGET_ID + ' *{box-sizing:border-box}' +
        '.aic-chip:hover{opacity:.8}.aic-chip:active{opacity:.6}' +
        '.aic-send-btn:hover:not(:disabled){opacity:.85}.aic-send-btn:active:not(:disabled){transform:scale(.95)}' +
        // Bubble style — Telegram/Zalo pattern
        // AI: trắng + shadow nhẹ, tail góc trái trên (border-radius nhỏ)
        // User: màu primary (widget color) + chữ trắng, tail góc phải trên
        '.aic-bubble-ai{background:#fff;color:#1e293b;border-radius:4px 14px 14px 14px;' +
          'align-self:flex-start;max-width:85%;box-shadow:0 1px 2px rgba(0,0,0,.10)}' +
        '.aic-bubble-user{background:' + esc(color) + ';color:#fff;border-radius:14px 4px 14px 14px;' +
          'align-self:flex-end;max-width:85%}' +
        '.aic-bubble-sys{background:#fef3c7;color:#92400e;border-radius:8px;align-self:center;font-size:12px;padding:6px 12px!important;text-align:center}' +
        '.aic-typing span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:aicDot 1.2s infinite}' +
        '.aic-typing span:nth-child(2){animation-delay:.2s}.aic-typing span:nth-child(3){animation-delay:.4s}' +
        '@keyframes aicDot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}' +
        '@keyframes aicSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}' +
        '@keyframes aicPanelUp{from{transform:translate(-50%,100%)}to{transform:translate(-50%,0)}}' +
        '#aic-chips::-webkit-scrollbar{height:5px;display:block}' +
        '#aic-chips::-webkit-scrollbar-track{background:#e2e8f0;border-radius:3px}' +
        '#aic-chips::-webkit-scrollbar-thumb{background:#94a3b8;border-radius:3px}' +
        '@media(max-width:767px){' +
          '#aic-panel{position:fixed!important;inset:0!important;' +
          'width:100%!important;height:100dvh!important;' +
          'border-radius:0!important;flex-direction:column!important;' +
          'box-shadow:none!important;overflow:hidden!important;z-index:9999!important;' +
          'animation:aicSheetUp .28s cubic-bezier(.22,.8,.25,1)!important}' +
          '#aic-panel>div:first-child{flex-shrink:0!important;z-index:1!important}' +
          '#' + WIDGET_ID + ' .aic-bubble-ai,#' + WIDGET_ID + ' .aic-bubble-user{font-size:14px!important}' +
          '#' + WIDGET_ID + ' .aic-bubble-sys{font-size:12px!important}' +
          '#' + WIDGET_ID + ' #aic-input{font-size:16px!important}' +
          '#' + WIDGET_ID + ' #aic-bar-inner span{font-size:13px!important}' +
          '#' + WIDGET_ID + ' .aic-chip{font-size:12px!important}' +
          '#' + WIDGET_ID + ' #aic-counter{font-size:10px!important}' +
          '#' + WIDGET_ID + ' button,#' + WIDGET_ID + ' input{touch-action:manipulation!important}' +
        '}' +
        '@media(min-width:768px){' +
          '#aic-panel{position:fixed!important;bottom:24px!important;left:50%!important;' +
          'transform:translateX(-50%)!important;margin-left:0!important;' +
          'width:clamp(560px,70vw,860px)!important;border-radius:16px!important;' +
          'height:min(820px,calc(100dvh - 48px))!important;box-shadow:0 8px 40px rgba(0,0,0,.22)!important;' +
          'animation:aicPanelUp .28s cubic-bezier(.22,.8,.25,1)!important}' +
          '#' + WIDGET_ID + ' .aic-bubble-ai,#' + WIDGET_ID + ' .aic-bubble-user{font-size:19px!important;max-width:80%;word-break:break-word!important}' +
          '#' + WIDGET_ID + ' .aic-bubble-sys{font-size:16px!important}' +
          '#' + WIDGET_ID + ' #aic-input{font-size:21px!important}' +
          '#' + WIDGET_ID + ' #aic-bar-inner span{font-size:17px!important}' +
          '#' + WIDGET_ID + ' .aic-chip{font-size:16px!important;padding:6px 14px!important}' +
          '#' + WIDGET_ID + ' #aic-counter{font-size:13px!important}' +
        '}' +
      '</style>' +

      // BAR — bọc ngoài bằng màu nền setting
      '<div id="aic-bar" style="background:' + esc(bgColor) + ';padding:4px;border-radius:16px">' +
        // Logo strip — full width, colored background
        '<div id="aic-bar-logo" style="background:' + esc(color) + ';border-radius:12px 12px 0 0;padding:8px 14px;cursor:pointer;overflow:hidden">' +
          logoHTML +
        '</div>' +
        // Input row
        '<div id="aic-bar-inner" style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;' +
          'padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px">' +
          '<span style="flex:1;font-size:13px;color:#475569">' + esc((_cfg && _cfg.input_placeholder) || 'Tôi Muốn Một Cây Vợt Pickleball Có ...') + '</span>' +
          '<div style="width:32px;height:32px;background:' + esc(color) + ';border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
          '</div>' +
        '</div>' +
        (chipsHTML ? '<div id="aic-chips-wrap" style="position:relative">' +
          '<div id="aic-chips" style="display:flex;gap:6px;overflow-x:scroll;padding:8px 8px 8px;-webkit-overflow-scrolling:touch;scrollbar-width:auto;scrollbar-color:#94a3b8 transparent">' + chipsHTML + '</div>' +
          '<div style="position:absolute;right:0;top:0;bottom:0;width:32px;background:linear-gradient(to right,transparent,' + esc(bgColor) + ');pointer-events:none;border-radius:0 12px 12px 0"></div>' +
        '</div>' : '') +
      '</div>' +

      // BACKDROP
      '<div id="aic-backdrop" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998"></div>' +

      // PANEL
      '<div id="aic-panel" style="display:none;z-index:9999;background:#fff;flex-direction:column;overflow:hidden">' +

        // Header
        '<div style="background:' + esc(color) + ';padding:12px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0">' +
          '<div style="flex:1">' + logoHTML + '</div>' +
          '<button id="aic-close" style="background:rgba(255,255,255,.92);border:none;color:#1e293b;border-radius:50%;' +
            'width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
            'box-shadow:0 1px 4px rgba(0,0,0,.18);flex-shrink:0">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +

        // Messages — nền xám nhạt như Telegram/Zalo để bubble trắng nổi bật
        '<div id="aic-messages" style="flex:1;min-height:0;overflow-y:auto;padding:14px 12px;background:#f0f2f5;display:flex;flex-direction:column;gap:8px"></div>' +

        // Chips gợi ý trong panel
        (chipsHTML ? '<div id="aic-panel-chips" style="flex-shrink:0;display:flex;gap:6px;overflow-x:auto;padding:8px 12px;border-top:1px solid #e8eaed;background:#f0f2f5;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent">' + chipsHTML + '</div>' : '') +

        // Input area
        '<div style="flex-shrink:0;background:#f0f2f5;border-top:1px solid #e8eaed">' +
          '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px">' +
            '<input id="aic-input" type="text" placeholder="' + (isBlocked ? 'Phiên chat bị chặn' : 'Nhập câu hỏi...') + '" ' + inputDisabled + ' style="' +
              'flex:1;border:1px solid #e2e8f0;border-radius:22px;padding:9px 14px;font-size:16px;' +
              'outline:none;background:#f8fafc;color:#1e293b' +
            '" maxlength="500">' +
            '<button id="aic-send" class="aic-send-btn" ' + (inputDisabled ? 'disabled' : '') + ' style="' +
              'width:40px;height:40px;border-radius:50%;background:' + esc(color) + ';border:none;' +
              'display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s' +
            '">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
            '</button>' +
          '</div>' +
          '<div style="padding:0 14px 14px;display:flex;justify-content:space-between;align-items:center">' +
            '<span id="aic-counter" style="font-size:10px;color:#94a3b8">' + count + '/' + max + '</span>' +
          '</div>' +
        '</div>' +

      '</div></div>' // end panel + widget
  }

  // ─── LIGHTBOX ────────────────────────────────────────────────
  function _openLightbox(src) {
    var old = document.getElementById('aic-lightbox')
    if (old) old.remove()

    var lb = document.createElement('div')
    lb.id = 'aic-lightbox'
    lb.style.cssText =
      'position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.88);' +
      'display:flex;align-items:center;justify-content:center;padding:16px;' +
      'animation:aicLbIn .15s ease'

    var img = document.createElement('img')
    img.src = src
    img.style.cssText =
      'max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;' +
      'box-shadow:0 8px 40px rgba(0,0,0,.6);user-select:none'

    var closeBtn = document.createElement('button')
    closeBtn.style.cssText =
      'position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;' +
      'background:rgba(255,255,255,.92);border:none;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.3);color:#1e293b;z-index:1'
    closeBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'

    var close = function() { lb.remove(); document.removeEventListener('keydown', _lbKey) }
    var _lbKey = function(e) { if (e.key === 'Escape') close() }

    closeBtn.addEventListener('click', close)
    lb.addEventListener('click', function(e) { if (e.target === lb) close() })
    document.addEventListener('keydown', _lbKey)

    // Thêm animation keyframe nếu chưa có
    if (!document.getElementById('aic-lb-style')) {
      var st = document.createElement('style')
      st.id = 'aic-lb-style'
      st.textContent = '@keyframes aicLbIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}'
      document.head.appendChild(st)
    }

    lb.appendChild(img)
    lb.appendChild(closeBtn)
    document.body.appendChild(lb)
  }

  // Regex nhận URL ảnh trong text
  var IMG_URL_RE = /https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif|avif)(\?[^\s]*)?/gi

  function _renderBubbleContent(el, text) {
    // Tách text thành đoạn text thuần + URL ảnh
    var parts = [], lastIdx = 0, m
    IMG_URL_RE.lastIndex = 0
    while ((m = IMG_URL_RE.exec(text)) !== null) {
      if (m.index > lastIdx) {
        var txt = text.slice(lastIdx, m.index).trim()
        if (txt) {
          var span = document.createElement('p')
          span.style.cssText = 'margin:0 0 6px'
          span.innerHTML = _parseMarkdown(txt)
          el.appendChild(span)
        }
      }
      var imgWrap = document.createElement('div')
      imgWrap.style.cssText = 'margin:4px 0'
      var img = document.createElement('img')
      img.src = m[0]
      img.alt = ''
      img.loading = 'lazy'
      img.style.cssText = 'max-width:100%;max-height:240px;border-radius:10px;display:block;cursor:zoom-in;object-fit:cover'
      img.onerror = function(){ this.parentNode.remove() }
      img.addEventListener('click', function(){ _openLightbox(this.src) })
      imgWrap.appendChild(img)
      el.appendChild(imgWrap)
      lastIdx = m.index + m[0].length
    }
    if (lastIdx < text.length) {
      var rem = text.slice(lastIdx).trim()
      if (rem) {
        var span2 = document.createElement('p')
        span2.style.cssText = 'margin:0'
        span2.innerHTML = _parseMarkdown(rem)
        el.appendChild(span2)
      }
    }
    // Nếu không có gì cả → textContent
    if (!el.children.length) el.textContent = text
  }

  function _appendBubble(sender, text) {
    var list = document.getElementById('aic-messages')
    if (!list) return
    var el = document.createElement('div')
    var cls = sender === 'user' ? 'aic-bubble-user' : sender === 'system' ? 'aic-bubble-sys' : 'aic-bubble-ai'
    el.className = cls
    el.style.cssText = 'padding:9px 13px;font-size:14px;line-height:1.55;word-break:break-word'
    if (sender === 'ai') {
      if (IMG_URL_RE.test(text)) {
        _renderBubbleContent(el, text)
      } else {
        el.innerHTML = _parseMarkdown(text)
      }
    } else {
      el.textContent = text
    }
    list.appendChild(el)
    list.scrollTop = list.scrollHeight
  }

  function _showTyping() {
    var list = document.getElementById('aic-messages')
    if (!list || document.getElementById('aic-typing')) return
    var el = document.createElement('div')
    el.id = 'aic-typing'; el.className = 'aic-bubble-ai'
    el.style.cssText = 'padding:10px 13px'
    el.innerHTML = '<div class="aic-typing"><span></span><span></span><span></span></div>'
    list.appendChild(el)
    list.scrollTop = list.scrollHeight
  }

  function _hideTyping() { var el = document.getElementById('aic-typing'); if (el) el.remove() }

  function _updateCounter() {
    var el = document.getElementById('aic-counter')
    if (!el) return
    var count = (_session && _session.message_count) || 0
    var max   = (_cfg && _cfg.max_messages_per_session) || _MAX
    el.textContent = count + '/' + max
    el.style.color = count >= max ? '#ef4444' : count >= max * 0.75 ? '#f59e0b' : '#94a3b8'
  }

  function _renderHistory() {
    var list = document.getElementById('aic-messages')
    if (!list) return
    list.innerHTML = ''
    if (!_history.length) {
      return
    }
    _history.forEach(function(m) { _appendBubble(m.sender, m.content) })
  }

  var _hiddenPageEls = []

  function _openPanel(prefillText) {
    if (_isOpen) return
    _isOpen = true
    var container = document.getElementById('aic-container')
    var bar       = document.getElementById('aic-bar')
    var panel     = document.getElementById('aic-panel')
    var backdrop  = document.getElementById('aic-backdrop')

    // Lock cuộn — iOS cần position:fixed trick
    _scrollY = window.scrollY || window.pageYOffset
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top      = '-' + _scrollY + 'px'
    document.body.style.width    = '100%'

    // Trên mobile: ẩn TẤT CẢ element fixed/sticky trên trang (cart, popup, icon nổi, v.v.)
    // để panel full screen không bị đè. Dùng computed style nên bắt được mọi loại.
    _hiddenPageEls = []
    if (window.innerWidth < 768) {
      try {
        var all = document.querySelectorAll('body *')
        for (var i = 0; i < all.length; i++) {
          var el = all[i]
          // Bỏ qua chính widget
          if (el.id === WIDGET_ID || el.id === 'aic-container' ||
              (el.closest && (el.closest('#' + WIDGET_ID) || el.closest('#aic-container')))) continue
          var pos = window.getComputedStyle(el).position
          if (pos === 'fixed' || pos === 'sticky') {
            _hiddenPageEls.push({ el: el, vis: el.style.visibility, imp: el.style.getPropertyPriority('visibility') })
            el.style.setProperty('visibility', 'hidden', 'important')
          }
        }
      } catch(e) {}
    }

    // Đưa container ra khỏi page flow để bar không còn chiếm chỗ
    if (container) { container.dataset.origPos = container.style.position || ''; container.style.position = 'fixed'; container.style.inset = '0'; container.style.zIndex = '9990'; container.style.pointerEvents = 'none'; container.style.maxWidth = 'none'; container.style.padding = '0'; container.style.margin = '0' }
    if (bar)    { bar.style.display = 'none' }
    if (panel)  {
      panel.style.display = 'flex'
      panel.style.pointerEvents = 'auto'
      // Z-index max — thắng mọi element khác trên trang
      panel.style.zIndex = '2147483647'
    }
    // Backdrop chỉ cần trên desktop (mobile: panel là full screen)
    if (backdrop) { backdrop.style.display = 'block'; backdrop.style.pointerEvents = 'auto' }
    _renderHistory()
    _updateCounter()
    if (_session && _session.is_blocked) return
    // Không autofocus trên mobile để tránh iOS zoom vào input
    if (window.innerWidth >= 768) {
      setTimeout(function() {
        var inp = document.getElementById('aic-input')
        if (inp) { inp.focus(); if (prefillText) inp.value = prefillText }
      }, 150)
    } else if (prefillText) {
      setTimeout(function() {
        var inp = document.getElementById('aic-input')
        if (inp) inp.value = prefillText
      }, 150)
    }
  }

  window.FSPORT_AI_CHAT = window.FSPORT_AI_CHAT || {}
  window.FSPORT_AI_CHAT.open = function(prefillText) {
    if (document.getElementById('aic-panel')) {
      return _checkSession()
        .then(_loadHistory)
        .then(function() {
          _renderHistory()
          _openPanel(prefillText)
        })
    } else {
      _pendingOpen = prefillText || true
      return Promise.resolve()
    }
  }

  function _closePanel() {
    _isOpen = false
    // Restore cuộn — khôi phục đúng vị trí
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top      = ''
    document.body.style.width    = ''
    window.scrollTo(0, _scrollY)
    var container = document.getElementById('aic-container')
    var bar       = document.getElementById('aic-bar')
    var panel     = document.getElementById('aic-panel')
    var backdrop  = document.getElementById('aic-backdrop')
    // Trả container về page flow
    if (container) { container.style.position = container.dataset.origPos || ''; container.style.inset = ''; container.style.zIndex = ''; container.style.pointerEvents = ''; container.style.maxWidth = ''; container.style.padding = ''; container.style.margin = '' }
    // Restore các element trang đã ẩn
    _hiddenPageEls.forEach(function(item) {
      if (item.vis) {
        item.el.style.setProperty('visibility', item.vis, item.imp || '')
      } else {
        item.el.style.removeProperty('visibility')
      }
    })
    _hiddenPageEls = []
    if (bar)      bar.style.display = ''
    if (panel)    { panel.style.display = 'none'; panel.style.height = ''; panel.style.top = ''; panel.style.bottom = '' }
    if (backdrop) backdrop.style.display = 'none'
  }

  // ─── SEND ────────────────────────────────────────────────────
  async function _send() {
    if (_isThinking) return
    if (_session && _session.is_blocked) return

    var inp = document.getElementById('aic-input')
    if (!inp) return
    var text = (inp.value || '').trim()
    if (!text) return

    // Tạo session DB nếu chưa có (lần gửi đầu tiên)
    if (!_session || !_session.id) {
      await _initSession()
      if (!_session || !_session.id) {
        _isThinking = false
        return
      }
    }
    var max   = (_cfg && _cfg.max_messages_per_session) || _MAX
    var count = (_session && _session.message_count) || 0

    if (count >= max) {
      inp.disabled = true
      var sb = document.getElementById('aic-send')
      if (sb) sb.disabled = true
      var limitMsg = (_cfg && _cfg.limit_reached_message) || 'Bạn đã dùng hết lượt hỏi trong phiên này. Liên hệ F-SPORT qua Zalo để được hỗ trợ thêm nhé!'
      _appendBubble('system', limitMsg)
      return
    }

    inp.value = ''
    _isThinking = true

    // Analytics nội bộ
    if (typeof window.fsport !== 'undefined') {
      window.fsport.track('ai_chat_message', {
        question: text,
        product_id: _group || _slug || null,
        session_id: _session ? _session.id : null
      })
    }

    // Hiện tin khách
    _appendBubble('user', text)
    await _saveMessage('user', text)

    // Cập nhật message_count + last_active
    var newCount = count + 1
    await _patchSession({ message_count: newCount, last_active_at: new Date().toISOString() })
    _updateCounter()

    // Kiểm tra SĐT trong tin khách
    if (!_session.has_phone) {
      var phone = _extractPhone(text)
      if (phone) {
        await _patchSession({ has_phone: true, customer_phone: phone })
      }
    }

    // Disable input nếu đã hết lượt
    if (newCount >= max) {
      inp.disabled = true
      var sb2 = document.getElementById('aic-send')
      if (sb2) sb2.disabled = true
    }

    _showTyping()
    var raw = await _callGemini(text)
    _hideTyping()

    if (!raw) {
      _appendBubble('ai', 'Xin lỗi, mình gặp lỗi kỹ thuật. Bạn thử lại sau hoặc liên hệ F-SPORT qua Zalo nhé.')
      _isThinking = false
      return
    }

    var parsed = _parseMarkers(raw)

    // Hiện reply (text đã strip marker)
    var replyText = parsed.text || 'Xin lỗi, mình chưa hiểu câu hỏi của bạn. Bạn có thể hỏi lại không?'
    _appendBubble('ai', replyText)
    await _saveMessage('ai', replyText)

    // Xử lý marker
    if (parsed.isBlock) {
      await _blockSession('Vi phạm tiêu chuẩn')
      _appendBubble('system', 'Phiên chat đã bị chặn do vi phạm tiêu chuẩn.')
    } else if (parsed.isNonsense) {
      _nonsenseStreak++
      await _patchSession({ nonsense_count: _nonsenseStreak })
      if (_nonsenseStreak >= NONSENSE_LIMIT) {
        await _blockSession('Lặp lại tin vô nghĩa')
        _appendBubble('system', 'Phiên chat tạm dừng. Nếu cần hỗ trợ, bạn vui lòng liên hệ F-SPORT qua Zalo nhé.')
      }
    } else {
      // Tin bình thường → reset streak
      if (_nonsenseStreak > 0) {
        _nonsenseStreak = 0
        await _patchSession({ nonsense_count: 0 })
      }
    }

    _isThinking = false
    if (inp && !inp.disabled) inp.focus()
  }

  // ─── EVENTS ──────────────────────────────────────────────────
  function _bindEvents() {
    var barInner = document.getElementById('aic-bar-inner')
    if (barInner) barInner.addEventListener('click', function(){ _openPanel() })
    var barLogo = document.getElementById('aic-bar-logo')
    if (barLogo) barLogo.addEventListener('click', function(){ _openPanel() })

    document.querySelectorAll('#' + WIDGET_ID + ' .aic-chip').forEach(function(chip) {
      chip.addEventListener('click', function(){
        var q = chip.textContent
        _openPanel(q)
        // Auto-send sau khi panel mở (chờ input sẵn sàng)
        setTimeout(function(){
          var inp = document.getElementById('aic-input')
          if (inp) { inp.value = q; _send() }
        }, 200)
      })
    })

    var closeBtn = document.getElementById('aic-close')
    if (closeBtn) closeBtn.addEventListener('click', _closePanel)

    var backdrop = document.getElementById('aic-backdrop')
    if (backdrop) backdrop.addEventListener('click', _closePanel)

    var sendBtn = document.getElementById('aic-send')
    if (sendBtn) sendBtn.addEventListener('click', _send)

    var inp = document.getElementById('aic-input')
    if (inp) inp.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); _send() }
    })

    // Fix iOS: giữ header + input cố định khi bàn phím ảo xuất hiện
    // VisualViewport API — panel tự co theo chiều cao thực của viewport
    if (window.visualViewport) {
      var _vpUpdate = function() {
        if (!_isOpen || window.innerWidth >= 768) return
        var panel = document.getElementById('aic-panel')
        if (!panel) return
        var vp = window.visualViewport
        // Keep the whole panel inside the visible viewport above the keyboard.
        panel.style.setProperty('top', vp.offsetTop + 'px', 'important')
        panel.style.setProperty('height', vp.height + 'px', 'important')
        panel.style.setProperty('bottom', 'auto', 'important')
      }
      var _vpReset = function() {
        if (!_isOpen || window.innerWidth >= 768) return
        var panel = document.getElementById('aic-panel')
        if (!panel) return
        // Bàn phím đóng → trả về inset:0 full screen
        panel.style.setProperty('top', '0', 'important')
        panel.style.setProperty('height', '100dvh', 'important')
        panel.style.setProperty('bottom', 'auto', 'important')
      }
      window.visualViewport.addEventListener('resize', function() {
        var vp = window.visualViewport
        // Phân biệt keyboard đang mở hay đóng
        if (vp.height < window.innerHeight - 100) _vpUpdate()
        else _vpReset()
      })
      window.visualViewport.addEventListener('scroll', _vpUpdate)
    }
  }

  // ─── PARSE MARKERS ───────────────────────────────────────────
  function _parseMarkers(raw) {
    if (!raw) return { text: '', isBlock: false, isNonsense: false }
    var isBlock    = raw.indexOf('[[BLOCK]]') >= 0
    var isNonsense = !isBlock && raw.indexOf('[[NONSENSE]]') >= 0
    var text = raw.replace(/\[\[BLOCK\]\]/g,'').replace(/\[\[NONSENSE\]\]/g,'').trim()
    return { text, isBlock, isNonsense }
  }

  // ================================================================
  // INIT
  // ================================================================
  async function _doInit(opts) {
    _slug  = (opts && opts.slug)         || ''
    _group = (opts && opts.productGroup) || ''

    var container = document.getElementById('aic-container')
    if (!container) return
    container.innerHTML = '<div style="padding:12px;color:#94a3b8;font-size:13px">Đang tải AI Tư Vấn...</div>'

    var sRes = await _get('/rest/v1/ai_chat_settings?id=eq.1&select=*')
    _cfg = (sRes.ok && sRes.data && sRes.data[0]) || null

    if (!_cfg || !_cfg.enabled) { container.innerHTML = ''; return }

    // Fallback group từ slug
    if (!_group && _slug) _group = _slug.replace(/\.html$/i, '')
    _MAX = _cfg.max_messages_per_session || 20

    var results = await Promise.all([_checkSession(), _fetchProducts()])
    _session = results[0]

    await _loadHistory()
    _renderWidget()
    _bindEvents()
    if (_pendingOpen) {
      var pending = _pendingOpen === true ? '' : _pendingOpen
      _pendingOpen = false
      _openPanel(pending)
    }
    _initialized = true
  }

  function init(opts) {
    if (_initialized) return Promise.resolve()
    if (!_initPromise) {
      _initPromise = _doInit(opts).catch(function(err) {
        _initPromise = null
        throw err
      }).then(function(result) {
        if (!_initialized) _initPromise = null
        return result
      })
    }
    return _initPromise
  }

  global.AiChat = { init }

})(window)
