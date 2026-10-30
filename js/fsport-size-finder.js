(function () {
  'use strict'

  var root = document.getElementById('fs-size-finder')
  if (!root || root.dataset.ready === '1') return
  root.dataset.ready = '1'

  var SUPABASE_URL = window.FSPORT_SUPABASE_URL || 'https://xcigbbcpwfzluqazadez.supabase.co'
  var SUPABASE_ANON = window.FSPORT_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaWdiYmNwd2Z6bHVxYXphZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTA1NjEsImV4cCI6MjA5NDkyNjU2MX0.8LGX0FkU5w9q26LynYetUY9rGN_oFnjvDFJ5tjG9QV4'
  var DATA_URL = '/json/fsport-size-finder-data.json?v=20261029-adidas-1'
  var EXTRA_DATA_URL = '/json/fsport-size-finder-extra-data.json?v=20261029-anta-lining-1'

  var PRODUCTS = [
    { code:'BAL5617', name:'Carbon Version 1', slug:'carbon', path:'/ysandal/carbon', modelId:'5b1584de-a818-41ef-b9bb-5f44c916c71d', offset:1, image:'/assets/images/gallery/ysandal/carbon/1.jpg' },
    { code:'BAL5638', name:'Carbon Version 2', slug:'carbon2', path:'/ysandal/carbon2', modelId:'19324f02-bb07-46cb-a828-7c759b575aa8', offset:1, image:'https://pub-e9a87597962f48a39d9b80b93c33e46c.r2.dev/feed/2026/09/1789209806884-product-pages-1-1000x1000.webp' },
    { code:'BN68', name:'Dép chạy không quai', slug:'ysandalbn68', path:'/product/ysandalbn68', modelId:'37251b11-8e0c-45ff-a70f-f6ade618448f', offset:1, image:'/assets/images/gallery/ysandal/ysandalbn68/1.jpg' },
    { code:'BCU188', name:'Recovery', slug:'bcu188', path:'/ysandal/bcu188', modelId:'adbf2de2-7095-493a-aac4-77b7b32b0382', offset:1, image:'https://pub-e9a87597962f48a39d9b80b93c33e46c.r2.dev/feed/2026/09/1789113636448-product-pages-1-1000x825.webp' },
    { code:'BN520', name:'EVA Oyster Tech', slug:'bn520', path:'/ysandal/bn520', modelId:'8d545b44-5ebb-4a8b-a5c1-d45e0e363bf0', offset:1, image:'/assets/images/gallery/ysandal/bn520/1.jpg' },
    { code:'BCU5206', name:'EVA nguyên khối', slug:'bcu5206', path:'/ysandal/bcu5206', modelId:'b31c764b-13ff-4718-9b93-e8939a788e55', offset:1, image:'https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m8vnb8s3qnb6a0.webp' },
    { code:'BCU5555', name:'Dép Châu Chấu', slug:'bcu5555', path:'/ysandal/bcu5555', modelId:'f2a71668-2091-443f-af9b-a95ae0f8b1e0', offset:1, image:'https://cdn-general.cybassets.com/media/W1siZiIsIjMzMzAwL3Byb2R1Y3RzLzU2NzU0NzEzLzE3NTE1MzkyNjBfYjk0NTQzZmMxYWRiM2MwZTU2ZTkuanBlZyJdLFsicCIsInRodW1iIiwiMjA0OHgyMDQ4Il1d.jpeg?sha=05b8dde3b2ca088b' },
    { code:'BCU7712', name:'Giày lười phục hồi', slug:'bcu7712', path:'/ysandal/bcu7712', modelId:'8e936ce1-a9ba-42dd-8b2a-d4815f8ff551', offset:0, image:'https://cdn-general.cybassets.com/media/W1siZiIsIjMzMzAwL3Byb2R1Y3RzLzU2NzU2OTQ1LzMzMzAwLXByb2R1Y3QtcGhvdG8tMjAyNTA2MjctNzUtMW4zZTM3Ml8xODlmYTc5MmE5MDM3YTc0YzI3ZC5qcGVnIl0sWyJwIiwidGh1bWIiLCI2MDB4NjAwIl1d.jpeg?sha=2fccc6bc4a15cad8' },
    { code:'BCU5568', name:'Dép chạy có quai hậu', slug:'ysandal5568', path:'/product/ysandal5568', modelId:'b880d3b2-188f-4832-ab70-09023a7edcf1', offset:2, image:'https://pub-e9a87597962f48a39d9b80b93c33e46c.r2.dev/feed/2026/10/1790839367461-product-pages-couple1-1000x1000.webp' },
    { code:'BCU5560', name:'Quai hậu siêu nhẹ', slug:'ysandal5560', path:'/product/ysandal5560', modelId:'5781808c-20ca-4bd6-8fea-76f3f206659b', offset:2, image:'/assets/images/gallery/ysandal/ysandal5560/1.jpg' }
  ]

  var BRANDS = ['Y-Sandal','Nike','Adidas','New Balance','ASICS','HOKA','ANTA','Li-Ning','On','Puma','Skechers','Mizuno']
  var BRAND_LOGOS = {
    'Y-Sandal':'https://cdn-general.cybassets.com/media/W1siZiIsIjMzMzAwL2F0dGFjaGVkX3Bob3Rvcy8xNzUxODkyOTczXyjmqaspMjAyNS3psbfprZpMT0dPX-iLseaWh-eJiOato-eiuueJiFBOR-aqlC5wbmcucG5nIl1d.png?sha=15465efccd3190c4',
    'Nike':'https://commons.wikimedia.org/wiki/Special:FilePath/Logo_NIKE.svg',
    'Adidas':'https://commons.wikimedia.org/wiki/Special:FilePath/Adidas_2022_logo.svg',
    'New Balance':'https://cdn.simpleicons.org/newbalance/14284C',
    'ASICS':'https://commons.wikimedia.org/wiki/Special:FilePath/Asics_Logo.svg',
    'HOKA':'https://durbanrunner.co.za/cdn/shop/collections/Hoka-Black-Logo-Vector_svg.png?v=1709367984',
    'ANTA':'https://cdn.simpleicons.org/anta/14284C',
    'Li-Ning':'https://cdn.simpleicons.org/lining/14284C',
    'On':'https://commons.wikimedia.org/wiki/Special:FilePath/On-cloud-logo-white-background.svg',
    'Puma':'https://cdn.simpleicons.org/puma/14284C',
    'Skechers':'https://pluspng.com/img-png/skechers-logo-png-skechers-logos-img-4841x869.png',
    'Mizuno':'https://www.pikpng.com/pngl/m/12-125480_mizuno-logo-png-download-mizuno-logo-clipart.png'
  }
  var COMPARABLE_LENGTH = new Set(['Nike','Adidas','New Balance','ASICS','HOKA','Skechers','ANTA','Li-Ning','Mizuno'])
  var GENERIC_BRAND = '__generic__'
  var state = { mode:'size', system:'EU', gender:'men', target:'Y-Sandal', data:null, catalog:{} }
  var $ = function (id) { return document.getElementById(id) }
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char] }) }
  var number = function (value) { return Number(String(value == null ? '' : value).trim().replace(',','.')) }
  var displayNumber = function (value) { return String(value).replace('.',',') }
  var formatMoney = function (value) { return Number(value || 0).toLocaleString('vi-VN') + 'đ' }

  function normalizeEU(value) {
    var text = String(value || '').trim()
    if (text.indexOf('1/3') >= 0) return parseInt(text,10) + 1/3
    if (text.indexOf('2/3') >= 0) return parseInt(text,10) + 2/3
    return number(text)
  }

  function sourceField() {
    if (state.system === 'EU') return 'eu'
    if (state.system === 'UK') return 'uk'
    return state.gender === 'men' ? 'usm' : 'usw'
  }

  function sameSize(a, b, field) {
    if (a == null || b == null) return false
    var left = field === 'eu' ? normalizeEU(a) : number(a)
    var right = field === 'eu' ? normalizeEU(b) : number(b)
    return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < .015
  }

  function rowsFor(brand) {
    return state.data && state.data.charts && state.data.charts[brand]
      ? state.data.charts[brand][state.gender] || []
      : []
  }

  function chartHasComparableLength(brand, row) {
    if (!COMPARABLE_LENGTH.has(brand) || !row || !Number.isFinite(Number(row.cm))) return false
    if (brand === 'Skechers' && state.gender === 'men') return false
    return true
  }

  function sourceFootCm(brand, row) {
    var cm = Number(row && row.cm)
    if (!Number.isFinite(cm)) return null
    return brand === 'Mizuno' ? cm - 1 : cm
  }

  function rowForFoot(brand, cm) {
    var rows = rowsFor(brand).filter(function (row) { return Number.isFinite(Number(row.cm)) })
    if (!rows.length || !COMPARABLE_LENGTH.has(brand)) return null
    var lookupCm = brand === 'Mizuno' ? cm + 1 : cm
    if (brand === 'HOKA') {
      return rows.reduce(function (best, row) {
        return !best || Math.abs(Number(row.cm) - lookupCm) < Math.abs(Number(best.cm) - lookupCm) ? row : best
      }, null)
    }
    return rows.find(function (row) { return Number(row.cm) + .00001 >= lookupCm }) || null
  }

  function nearestRowByEU(brand, eu) {
    var target = normalizeEU(eu)
    if (!Number.isFinite(target)) return null
    return rowsFor(brand).reduce(function (best, row) {
      var value = normalizeEU(row.eu)
      if (!Number.isFinite(value)) return best
      return !best || Math.abs(value - target) < Math.abs(normalizeEU(best.eu) - target) ? row : best
    }, null)
  }

  function nearestRowByField(rows, field, value) {
    var target = field === 'eu' ? normalizeEU(value) : number(value)
    if (!Number.isFinite(target)) return null
    return rows.reduce(function (best, row) {
      if (row[field] == null) return best
      var current = field === 'eu' ? normalizeEU(row[field]) : number(row[field])
      if (!Number.isFinite(current)) return best
      var bestValue = best ? (field === 'eu' ? normalizeEU(best[field]) : number(best[field])) : null
      return !best || Math.abs(current - target) < Math.abs(bestValue - target) ? row : best
    }, null)
  }

  function validateWidth(length, width) {
    if (!Number.isFinite(width)) return { valid:false, message:'Chiều ngang không phải số hợp lệ nên đã được bỏ qua.' }
    var ratio = width / length
    if (width < 6 || width > 15 || ratio < .25 || ratio > .55) {
      return { valid:false, message:'Chiều ngang có vẻ chưa hợp lý so với chiều dài chân; kết quả chỉ dùng chiều dài.' }
    }
    return { valid:true, message:'' }
  }

  function readInput() {
    if (state.mode === 'foot') {
      var cm = number($('fsf-foot-length').value)
      if (!Number.isFinite(cm) || cm < 18 || cm > 38) throw new Error('Vui lòng nhập chiều dài chân hợp lý từ 18 đến 38 cm.')
      var widthText = $('fsf-foot-width').value.trim()
      var widthCheck = widthText ? validateWidth(cm, number(widthText)) : null
      return {
        kind:'foot', cm:cm, width:widthCheck && widthCheck.valid ? number(widthText) : null,
        widthMessage:widthCheck && !widthCheck.valid ? widthCheck.message : '',
        description:'Chân dài ' + displayNumber(cm) + ' cm' + (widthCheck && widthCheck.valid ? ', ngang ' + displayNumber(number(widthText)) + ' cm' : '')
      }
    }
    var value = $('fsf-shoe-size').value
    var brand = $('fsf-source-brand').value
    var field = sourceField()
    if (!value) throw new Error('Vui lòng chọn size đang đi.')
    if (!brand) throw new Error('Vui lòng chọn thương hiệu đôi giày đang sử dụng')
    if (brand === GENERIC_BRAND) return { kind:'generic', value:value, field:field, description:state.system + ' ' + value + ' · size giày thể thao phổ thông' }
    var row = rowsFor(brand).find(function (item) { return sameSize(item[field], value, field) })
    if (!row) throw new Error('Bảng ' + brand + ' chưa có dòng size này. Hãy chọn size khác hoặc nhập chiều dài chân.')
    return { kind:'brand', brand:brand, row:row, description:brand + ' ' + state.system + ' ' + value }
  }

  function adidasBaseline(input) {
    var row = null
    var footCm = null
    var warning = ''
    if (input.kind === 'foot') {
      footCm = input.cm
      row = rowForFoot('Adidas', footCm)
    } else if (input.kind === 'brand' && input.brand === 'Adidas') {
      row = input.row
    } else if (input.kind === 'brand') {
      if (chartHasComparableLength(input.brand, input.row)) {
        footCm = sourceFootCm(input.brand, input.row)
        row = rowForFoot('Adidas', footCm)
      } else {
        row = nearestRowByEU('Adidas', input.row.eu)
        warning = 'ƯỚC TÍNH THEO SIZE EU GẦN NHẤT: ' + input.brand + ' chưa công bố Foot Length phù hợp; nên kiểm tra chiều dài bàn chân nếu đang ở giữa hai size.'
      }
    } else if (input.kind === 'generic' && input.field === 'eu') {
      row = rowsFor('Adidas').find(function (item) { return sameSize(item.eu, input.value, 'eu') })
      if (!row) {
        row = rowsFor('Adidas').reduce(function (best, item) {
          return !best || Math.abs(normalizeEU(item.eu) - normalizeEU(input.value)) < Math.abs(normalizeEU(best.eu) - normalizeEU(input.value)) ? item : best
        }, null)
      }
      warning = 'Bạn chưa chọn hãng đang đi; mốc Adidas là ước tính từ nhãn EU.'
    } else {
      return { error:'Với size US/UK, cần chọn hãng đang đi hoặc nhập chiều dài chân.' }
    }
    if (!row) return { error:'Số đo nằm ngoài phạm vi bảng Adidas chính hãng hiện có.' }
    var integerEU = Math.round(normalizeEU(row.eu))
    return {
      row:row, integerEU:integerEU, footCm:footCm,
      warning:warning,
      description:(input.kind === 'brand' && input.brand === 'Adidas' ? 'Đối chiếu trực tiếp' : input.description + ' → Adidas')
    }
  }

  function mapStandardBrand(brand, input) {
    var rows = rowsFor(brand)
    if (!rows.length) return { error:'Chưa có bảng chính hãng phù hợp cho ' + brand + '.' }
    if (input.kind === 'brand' && input.brand === brand) return { row:input.row, warning:'ĐỐI CHIẾU TRỰC TIẾP TRONG BẢNG CHÍNH HÃNG.', confidence:'high' }
    if (input.kind === 'generic') {
      var direct = rows.find(function (row) { return row[input.field] != null && sameSize(row[input.field], input.value, input.field) })
      var genericRow = direct || nearestRowByField(rows, input.field, input.value)
      return genericRow ? { row:genericRow, warning:'', confidence:direct ? 'high' : 'reference' } : { error:'Không tìm thấy size phù hợp trong bảng ' + brand + '.' }
    }
    var cm = input.kind === 'foot' ? input.cm : chartHasComparableLength(input.brand, input.row) ? sourceFootCm(input.brand, input.row) : null
    var row = Number.isFinite(cm) ? rowForFoot(brand, cm) : null
    var reference = false
    if (!row) {
      var euReference = null
      if (Number.isFinite(cm)) {
        var adidasFromFoot = rowForFoot('Adidas', cm)
        euReference = adidasFromFoot && adidasFromFoot.eu
      } else if (input.kind === 'brand') {
        euReference = input.row.eu
      }
      row = nearestRowByEU(brand, euReference)
      reference = true
    }
    if (!row) row = rows[Math.floor(rows.length / 2)] || null
    if (!row) return { error:'Không tìm thấy size phù hợp trong bảng ' + brand + '.' }
    return {
      row:row,
      confidence:reference ? 'reference' : 'high',
      warning:reference
        ? 'ƯỚC TÍNH THEO SIZE EU GẦN NHẤT: một trong hai hãng chưa công bố Foot Length phù hợp. Hãy kiểm tra chiều dài bàn chân nếu đang ở giữa hai size.'
        : brand === 'HOKA' ? 'HOKA hướng dẫn chọn mốc gần nhất theo Foot Length; kết quả vẫn nên được thử thực tế.' : 'ĐỐI CHIẾU THEO CHIỀU DÀI CHÍNH HÃNG ' + brand + '.'
    }
  }

  function widthAdvice(brand, input, resultRow) {
    if (input.kind !== 'foot' || input.width == null) return ''
    if (brand !== 'New Balance' || state.gender !== 'men') {
      return '<div class="fsf-note is-good">Chiều ngang ' + esc(displayNumber(input.width)) + ' cm nằm trong khoảng hợp lý và chỉ dùng tham khảo. Chưa có bảng width phù hợp để tự động đổi size cho lựa chọn này.</div>'
    }
    var widths = state.data.nbWidthMen && state.data.nbWidthMen[String(resultRow.usm)]
    if (!widths) return '<div class="fsf-note">New Balance chưa có dòng width tương ứng size này trong dữ liệu chính hãng đã nhập.</div>'
    var labels = ['Narrow (B)','Standard (D)','Wide (2E)','X-Wide (4E)']
    var index = widths.findIndex(function (limit) { return input.width <= Number(limit) })
    return index >= 0
      ? '<div class="fsf-note is-good"><strong>Độ rộng tham khảo:</strong> ' + labels[index] + ' theo bảng New Balance nam US ' + esc(resultRow.usm) + '.</div>'
      : '<div class="fsf-note">Chiều ngang lớn hơn mốc 4E của New Balance ở size này; không tự gán độ rộng.</div>'
  }

  function sizeLabelContains(label, recommended) {
    return String(label || '').split('/').some(function (part) { return Number(part.trim()) === Number(recommended) })
  }

  function imageFor(row) {
    if (row && row.image_url) return row.image_url
    var urls = row && row.image_urls
    if (typeof urls === 'string') {
      try { urls = JSON.parse(urls) } catch (_) { urls = [] }
    }
    return Array.isArray(urls) && urls[0] ? urls[0] : ''
  }

  function catalogFor(product) {
    return state.catalog[product.modelId] || []
  }

  function colorOptions(rows, sizeLabel) {
    var map = {}
    rows.filter(function (row) { return !sizeLabel || String(row.size) === String(sizeLabel) }).forEach(function (row) {
      var color = String(row.color || 'Mặc định')
      if (!map[color]) map[color] = { color:color, image:imageFor(row), stock:0 }
      map[color].stock += Math.max(0, Number(row.stock_qty || 0))
      if (!map[color].image) map[color].image = imageFor(row)
    })
    return Object.keys(map).map(function (key) { return map[key] })
  }

  function productCard(product, baseline) {
    var recommended = baseline.integerEU - product.offset
    var rows = catalogFor(product)
    var labels = Array.from(new Set(rows.map(function (row) { return String(row.size || '') }).filter(Boolean)))
    var sizeLabel = labels.find(function (label) { return sizeLabelContains(label, recommended) }) || ''
    var matched = sizeLabel ? rows.filter(function (row) { return String(row.size) === sizeLabel }) : []
    var inStock = matched.some(function (row) { return Number(row.stock_qty || 0) > 0 })
    var colors = colorOptions(rows, sizeLabel)
    if (!colors.length) colors = colorOptions(rows, '')
    var firstColor = colors.find(function (item) { return item.stock > 0 && item.image }) || colors.find(function (item) { return item.image }) || null
    var image = firstColor && firstColor.image ? firstColor.image : product.image
    var priceRow = matched.find(function (row) { return Number(row.price) > 0 }) || rows.find(function (row) { return Number(row.price) > 0 })
    var params = new URLSearchParams({ source:'size-finder', recommended_size:sizeLabel || String(recommended) })
    if (firstColor) params.set('color', firstColor.color)
    var colorHtml = colors.slice(0,8).map(function (item) {
      return '<button type="button" class="fsf-color' + (firstColor && item.color === firstColor.color ? ' is-active' : '') + '" data-fsf-color="' + esc(item.color) + '" data-fsf-image="' + esc(item.image || image) + '" title="' + esc(item.color + (item.stock > 0 ? '' : ' · tạm hết')) + '">' + (item.image ? '<img src="' + esc(item.image) + '" alt="" loading="lazy">' : '') + '</button>'
    }).join('')
    return '<article class="fsf-product" data-fsf-product="' + esc(product.code) + '" data-fsf-path="' + esc(product.path) + '" data-fsf-size="' + esc(sizeLabel || recommended) + '">' +
      '<div class="fsf-product-media"><img src="' + esc(image) + '" alt="' + esc(product.code + ' ' + product.name) + '" loading="lazy" decoding="async"></div>' +
      '<div class="fsf-product-copy"><div class="fsf-product-code">' + esc(product.code) + '</div><div class="fsf-product-name">' + esc(product.name) + (priceRow ? ' · ' + formatMoney(priceRow.price) : '') + '</div>' +
      '<div class="fsf-product-size"><strong>Size ' + esc(sizeLabel || recommended) + '</strong></div>' +
      (colorHtml ? '<div class="fsf-colors" aria-label="Màu sản phẩm">' + colorHtml + '</div>' : '<div class="fsf-colors"></div>') +
      '<button class="fsf-product-buy' + (sizeLabel && inStock ? '' : ' is-disabled') + '" type="button"' + (sizeLabel && inStock ? '' : ' disabled aria-disabled="true"') + '>' + (sizeLabel && inStock ? 'THÊM VÀO GIỎ HÀNG' : 'HẾT HÀNG') + '</button></div></article>'
  }

  function renderYSandal(input) {
    var baseline = adidasBaseline(input)
    if (baseline.error) return renderResultError(baseline.error)
    var html = ''
    if (input.widthMessage) html += '<div class="fsf-note">' + esc(input.widthMessage) + '</div>'
    html += widthAdvice('Y-Sandal', input, baseline.row)
    html += '<div class="fsf-products-title"><strong>10 dòng Y-Sandal B&amp;M</strong><span>Size được kiểm tra với catalog hiện tại</span></div><div class="fsf-product-grid">' + PRODUCTS.map(function (product) { return productCard(product, baseline) }).join('') + '</div>'
    $('fsf-output').innerHTML = html
    $('fsf-result-title').textContent = ''
    $('fsf-result-sub').textContent = input.description
    bindProductColors()
    revealResults()
  }

  function renderStandard(brand, input) {
    var result = mapStandardBrand(brand, input)
    if (result.error) return renderResultError(result.error)
    var row = result.row
    var us = state.gender === 'men' ? row.usm : row.usw
    var chart = state.data.charts[brand]
    var rows = rowsFor(brand)
    var index = rows.indexOf(row)
    var nearby = rows.slice(Math.max(0,index-2),Math.min(rows.length,index+3))
    var confidenceLabel = result.confidence === 'reference' ? 'Kết quả tham khảo · ' + brand : 'Đối chiếu bảng chính hãng · ' + brand
    var html = '<div class="fsf-summary"><div class="fsf-summary-copy"><div class="fsf-summary-label">' + esc(confidenceLabel) + '</div><div class="fsf-summary-size">EU ' + esc(row.eu) + '</div><p>US ' + esc(us == null ? '—' : us) + ' · UK ' + esc(row.uk == null ? '—' : row.uk) + (row.cm != null ? ' · CM ' + esc(displayNumber(row.cm)) : '') + '</p></div></div>'
    if (result.warning) html += '<div class="fsf-note">' + esc(result.warning) + '</div>'
    if (input.widthMessage) html += '<div class="fsf-note">' + esc(input.widthMessage) + '</div>'
    html += widthAdvice(brand, input, row)
    html += '<div class="fsf-products-title"><strong>Bảng size lân cận</strong><span>Nam/Nữ theo lựa chọn</span></div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>EU</th><th>US</th><th>UK</th><th>CM</th></tr></thead><tbody>' + nearby.map(function (item) { return '<tr class="' + (item === row ? 'selected' : '') + '"><td>' + esc(item.eu) + '</td><td>' + esc((state.gender === 'men' ? item.usm : item.usw) == null ? '—' : (state.gender === 'men' ? item.usm : item.usw)) + '</td><td>' + esc(item.uk == null ? '—' : item.uk) + '</td><td>' + esc(item.cm == null ? '—' : displayNumber(item.cm)) + '</td></tr>' }).join('') + '</tbody></table></div>'
    html += '<p class="fsf-source">Nguồn: <a href="' + esc(chart.source) + '" target="_blank" rel="noopener noreferrer">hướng dẫn size chính thức ' + esc(brand) + ' ↗</a>.<br>' + esc(chart.note || '') + '</p>'
    $('fsf-output').innerHTML = html
    $('fsf-result-title').textContent = ''
    $('fsf-result-sub').textContent = input.description
    revealResults()
  }

  function renderResultError(message) {
    $('fsf-output').innerHTML = '<div class="fsf-empty"><div><i>!</i><strong>Chưa thể quy đổi</strong><p>' + esc(message) + '</p></div></div>'
    $('fsf-result-title').textContent = 'Cần thêm thông tin'
    $('fsf-result-sub').textContent = message
    revealResults()
  }

  function revealResults() {
    if (window.innerWidth <= 900) {
      $('fsf-results').scrollIntoView({ behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' })
      $('fsf-results').setAttribute('tabindex','-1')
      window.setTimeout(function () { $('fsf-results').focus({ preventScroll:true }) }, 350)
    }
  }

  function bindProductColors() {
    root.querySelectorAll('.fsf-product').forEach(function (card) {
      card.querySelectorAll('.fsf-color').forEach(function (button) {
        button.addEventListener('click', function () {
          card.querySelectorAll('.fsf-color').forEach(function (item) { item.classList.remove('is-active') })
          button.classList.add('is-active')
          var image = card.querySelector('.fsf-product-media img')
          if (image && button.dataset.fsfImage) image.src = button.dataset.fsfImage
        })
      })
      var buy = card.querySelector('.fsf-product-buy')
      if (buy) buy.addEventListener('click',function () { openPurchasePopup(card) })
    })
  }

  function purchaseProductFor(card) {
    return PRODUCTS.find(function (product) { return product.code === card.dataset.fsfProduct }) || null
  }

  function purchaseRows(product) {
    return catalogFor(product).filter(function (row) { return String(row.size || '').trim() && String(row.color || '').trim() })
  }

  function ensurePurchasePopup() {
    if ($('fsf-buy-popup')) return
    var popup = document.createElement('div')
    popup.id = 'fsf-buy-popup'
    popup.className = 'fsf-buy-popup'
    popup.hidden = true
    popup.innerHTML = '<div class="fsf-buy-dialog" role="dialog" aria-modal="true" aria-labelledby="fsf-buy-title"><button class="fsf-buy-close" type="button" aria-label="Đóng">×</button><div id="fsf-buy-content"></div></div>'
    document.body.appendChild(popup)
    popup.addEventListener('click',function (event) { if (event.target === popup) closePurchasePopup() })
    popup.querySelector('.fsf-buy-close').addEventListener('click',closePurchasePopup)
    document.addEventListener('keydown',function (event) { if (event.key === 'Escape' && !popup.hidden) closePurchasePopup() })
  }

  function closePurchasePopup() {
    var popup = $('fsf-buy-popup')
    if (!popup) return
    popup.hidden = true
    document.body.classList.remove('fsf-buy-open')
  }

  function selectedPurchaseVariant() {
    var product = state.purchaseProduct
    if (!product) return null
    var size = $('fsf-buy-size') && $('fsf-buy-size').value
    var color = $('fsf-buy-color') && $('fsf-buy-color').value
    return purchaseRows(product).find(function (row) {
      return String(row.size) === String(size) && String(row.color) === String(color)
    }) || null
  }

  function renderPurchasePopup(preferredColor) {
    var product = state.purchaseProduct
    var rows = purchaseRows(product)
    var sizes = Array.from(new Set(rows.map(function (row) { return String(row.size) })))
    var size = state.purchaseSize
    if (sizes.indexOf(size) < 0) size = sizes[0] || ''
    state.purchaseSize = size
    var sizeRows = rows.filter(function (row) { return String(row.size) === String(size) })
    var colors = Array.from(new Set(sizeRows.map(function (row) { return String(row.color) })))
    var color = preferredColor || state.purchaseColor
    if (colors.indexOf(color) < 0) color = colors[0] || ''
    state.purchaseColor = color
    var variant = sizeRows.find(function (row) { return String(row.color) === String(color) }) || null
    var image = imageFor(variant) || product.image
    var stock = variant ? Math.max(0,Number(variant.stock_qty || 0)) : 0
    var content = $('fsf-buy-content')
    content.innerHTML = '<div class="fsf-buy-head"><img src="' + esc(image) + '" alt="' + esc(product.code + ' ' + product.name) + '"><div><small>YSANDAL B&amp;M</small><h3 id="fsf-buy-title">' + esc(product.code + ' · ' + product.name) + '</h3><strong>' + (variant ? formatMoney(variant.price) : 'Liên hệ') + '</strong></div></div>' +
      '<div class="fsf-buy-fields"><label>SIZE<select id="fsf-buy-size">' + sizes.map(function (item) { return '<option value="' + esc(item) + '"' + (item === size ? ' selected' : '') + '>' + esc(item) + '</option>' }).join('') + '</select></label><label>MÀU SẮC<select id="fsf-buy-color">' + colors.map(function (item) { return '<option value="' + esc(item) + '"' + (item === color ? ' selected' : '') + '>' + esc(item) + '</option>' }).join('') + '</select></label><label>SỐ LƯỢNG<input id="fsf-buy-quantity" type="number" min="1" max="' + Math.max(1,stock) + '" value="1"></label></div>' +
      '<div class="fsf-buy-actions"><button id="fsf-buy-confirm" type="button"' + (stock > 0 ? '' : ' disabled') + '>Thêm vào giỏ hàng</button><a href="' + esc(product.path + '?source=size-finder&recommended_size=' + encodeURIComponent(size) + '&color=' + encodeURIComponent(color)) + '">Xem chi tiết</a></div><p id="fsf-buy-message" class="fsf-buy-message" role="status"></p>'
    $('fsf-buy-size').addEventListener('change',function () { state.purchaseSize = this.value; renderPurchasePopup('') })
    $('fsf-buy-color').addEventListener('change',function () { state.purchaseColor = this.value; renderPurchasePopup(this.value) })
    $('fsf-buy-confirm').addEventListener('click',addPurchaseToCart)
  }

  function openPurchasePopup(card) {
    var product = purchaseProductFor(card)
    if (!product) return
    ensurePurchasePopup()
    state.purchaseProduct = product
    state.purchaseSize = String(card.dataset.fsfSize || '')
    var activeColor = card.querySelector('.fsf-color.is-active')
    state.purchaseColor = activeColor ? activeColor.dataset.fsfColor : ''
    renderPurchasePopup(state.purchaseColor)
    $('fsf-buy-popup').hidden = false
    document.body.classList.add('fsf-buy-open')
    $('fsf-buy-popup').querySelector('.fsf-buy-close').focus()
  }

  function addPurchaseToCart() {
    var variant = selectedPurchaseVariant()
    var product = state.purchaseProduct
    var message = $('fsf-buy-message')
    var quantity = Math.max(1,parseInt($('fsf-buy-quantity').value,10) || 1)
    if (!variant || Number(variant.stock_qty || 0) < quantity) {
      message.textContent = 'Số lượng đã chọn không còn đủ trong kho.'
      return
    }
    var item = {
      id:variant.product_code,
      category:'ysandal', loai:'ysandal', product_name:variant.product_name || product.name,
      color:variant.color, size:variant.size, variant:variant.color + ' - ' + variant.size,
      'Phân loại':(variant.product_name || product.name) + ' - ' + variant.color + ' - ' + variant.size,
      'Giá':Number(variant.price || 0), 'Ảnh':imageFor(variant) || product.image,
      feed_source:'size-finder', quantity:quantity
    }
    var cart = []
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]') } catch (_) {}
    if (!Array.isArray(cart)) cart = []
    var existing = cart.find(function (entry) { return String(entry.id) === String(item.id) })
    if (existing) existing.quantity = Number(existing.quantity || 0) + quantity
    else cart.push(item)
    window.cart = cart
    localStorage.setItem('cart',JSON.stringify(cart))
    window.dispatchEvent(new Event('storage'))
    closePurchasePopup()
    if (typeof window.FSPORT_ENSURE_CHECKOUT === 'function') {
      window.FSPORT_ENSURE_CHECKOUT().then(function () { if (typeof window.showCheckoutPopup === 'function') window.showCheckoutPopup() })
    } else {
      var cartButton = document.querySelector('[data-footer-action="cart"]')
      if (cartButton) cartButton.click()
    }
  }

  function renderBrands() {
    $('fsf-brand-grid').innerHTML = BRANDS.map(function (brand) {
      return '<button type="button" class="fsf-brand' + (brand === state.target ? ' is-active' : '') + '" data-fsf-target="' + esc(brand) + '" aria-pressed="' + (brand === state.target) + '"><img class="fsf-brand-logo" src="' + esc(BRAND_LOGOS[brand]) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"><span class="fsf-brand-name">' + (brand === 'Y-Sandal' ? 'Y-SANDAL' : esc(brand)) + '</span>' + (brand === 'Y-Sandal' ? '<small>B&amp;M · Taiwan</small>' : '') + '</button>'
    }).join('')
  }

  function populateSourceBrands() {
    $('fsf-source-brand').innerHTML = '<option value="">—</option><option value="' + GENERIC_BRAND + '">KHÔNG CHỌN HÃNG - DÙNG SIZE GIÀY THỂ THAO PHỔ THÔNG</option>' + BRANDS.filter(function (brand) { return brand !== 'Y-Sandal' }).map(function (brand) { return '<option value="' + esc(brand) + '">' + esc(brand) + '</option>' }).join('')
    renderSourceOptions()
    updateSourcePicker()
  }

  function updateSourcePicker() {
    var brand = $('fsf-source-brand').value
    $('fsf-source-picker').classList.toggle('is-placeholder',!brand)
    $('fsf-source-current').innerHTML = brand && brand !== GENERIC_BRAND
      ? '<img src="' + esc(BRAND_LOGOS[brand]) + '" alt="" onerror="this.style.display=\'none\'"><span>' + esc(brand) + '</span>'
      : '<span' + (brand === GENERIC_BRAND ? ' class="fsf-generic-label"' : '') + '>' + (brand === GENERIC_BRAND ? 'KHÔNG CHỌN HÃNG - DÙNG SIZE GIÀY THỂ THAO PHỔ THÔNG' : '—') + '</span>'
    root.querySelectorAll('.fsf-source-option').forEach(function (option) {
      option.setAttribute('aria-selected',String(option.dataset.fsfSource === brand))
    })
  }

  function renderSourceOptions() {
    var brands = ['',GENERIC_BRAND].concat(BRANDS.filter(function (brand) { return brand !== 'Y-Sandal' }))
    $('fsf-source-options').innerHTML = brands.map(function (brand) {
      var content = !brand ? '<span>—</span>' : brand === GENERIC_BRAND ? '<span class="fsf-generic-label">KHÔNG CHỌN HÃNG - DÙNG SIZE GIÀY THỂ THAO PHỔ THÔNG</span>' : '<img src="' + esc(BRAND_LOGOS[brand]) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"><span>' + esc(brand) + '</span>'
      return '<button type="button" class="fsf-source-option' + (!brand ? ' is-placeholder' : '') + '" role="option" data-fsf-source="' + esc(brand) + '" aria-selected="false">' + content + '</button>'
    }).join('')
  }

  function populateSizes() {
    var select = $('fsf-shoe-size')
    var previous = select.value
    var brand = $('fsf-source-brand').value
    var field = sourceField()
    var values = brand && brand !== GENERIC_BRAND ? rowsFor(brand).map(function (row) { return row[field] }).filter(function (value) { return value != null }) : state.system === 'EU' ? Array.from({length:20},function (_,index) { return String(index+33) }) : Array.from({length:27},function (_,index) { return String(3+index*.5) })
    values = Array.from(new Set(values.map(String)))
    select.innerHTML = values.map(function (value) { return '<option value="' + esc(value) + '">' + esc(value + ' ' + state.system) + '</option>' }).join('')
    var fallback = state.system === 'EU' ? '42' : state.system === 'US' ? '8.5' : '7.5'
    select.value = values.indexOf(previous) >= 0 ? previous : values.indexOf(fallback) >= 0 ? fallback : values[Math.floor(values.length/2)] || ''
  }

  function setMode(mode) {
    state.mode = mode
    $('fsf-tab-size').classList.toggle('is-active',mode === 'size')
    $('fsf-tab-foot').classList.toggle('is-active',mode === 'foot')
    $('fsf-tab-size').setAttribute('aria-selected',String(mode === 'size'))
    $('fsf-tab-foot').setAttribute('aria-selected',String(mode === 'foot'))
    $('fsf-size-fields').hidden = mode !== 'size'
    $('fsf-foot-fields').hidden = mode !== 'foot'
    if (mode === 'foot') {
      $('fsf-measure-text').hidden = false
      $('fsf-measure-help').setAttribute('aria-expanded','true')
    }
  }

  function submit() {
    try {
      $('fsf-error').textContent = ''
      $('fsf-foot-length-error').textContent = ''
      $('fsf-foot-length').removeAttribute('aria-invalid')
      $('fsf-source-error').textContent = ''
      $('fsf-source-picker').classList.remove('is-error')
      var input = readInput()
      if (state.target === 'Y-Sandal') renderYSandal(input)
      else renderStandard(state.target,input)
    } catch (error) {
      var message = error.message || String(error)
      if (message === 'Vui lòng chọn thương hiệu đôi giày đang sử dụng') {
        $('fsf-source-error').textContent = message
        $('fsf-source-picker').classList.add('is-error')
        $('fsf-source-picker').setAttribute('aria-invalid','true')
        $('fsf-source-picker').scrollIntoView({ behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' })
        window.setTimeout(function () { $('fsf-source-picker').focus({ preventScroll:true }) },250)
      } else if (message === 'Vui lòng nhập chiều dài chân hợp lý từ 18 đến 38 cm.') {
        $('fsf-foot-length-error').textContent = message
        $('fsf-foot-length').setAttribute('aria-invalid','true')
        $('fsf-foot-length').scrollIntoView({ behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' })
        window.setTimeout(function () { $('fsf-foot-length').focus({ preventScroll:true }) },250)
      } else $('fsf-error').textContent = message
    }
  }

  function groupCatalog(rows) {
    return (Array.isArray(rows) ? rows : []).reduce(function (groups, row) {
      var key = String(row.model_id || '')
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
      return groups
    }, {})
  }

  async function loadCatalog() {
    var ids = PRODUCTS.map(function (product) { return product.modelId }).join(',')
    var query = 'model_id=in.(' + ids + ')&is_active=eq.true&select=model_id,product_code,product_name,color,size,image_url,image_urls,price,original_price,stock_qty&order=color.asc,size.asc&limit=1000'
    var response = await fetch(SUPABASE_URL + '/rest/v1/products?' + query, { headers:{ apikey:SUPABASE_ANON, Authorization:'Bearer ' + SUPABASE_ANON, Accept:'application/json' } })
    if (!response.ok) throw new Error('Catalog HTTP ' + response.status)
    return groupCatalog(await response.json())
  }

  function bind() {
    $('fsf-tab-size').addEventListener('click',function () { setMode('size') })
    $('fsf-tab-foot').addEventListener('click',function () { setMode('foot') })
    $('fsf-foot-length').addEventListener('input',function () {
      $('fsf-foot-length-error').textContent = ''
      this.removeAttribute('aria-invalid')
    })
    $('fsf-system-pills').addEventListener('click',function (event) {
      var button = event.target.closest('[data-fsf-system]')
      if (!button) return
      state.system = button.dataset.fsfSystem
      root.querySelectorAll('[data-fsf-system]').forEach(function (item) { item.classList.toggle('is-active',item === button); item.setAttribute('aria-pressed',String(item === button)) })
      populateSizes()
    })
    $('fsf-gender-pills').addEventListener('click',function (event) {
      var button = event.target.closest('[data-fsf-gender]')
      if (!button) return
      state.gender = button.dataset.fsfGender
      root.querySelectorAll('[data-fsf-gender]').forEach(function (item) { item.classList.toggle('is-active',item === button); item.setAttribute('aria-pressed',String(item === button)) })
      populateSizes()
    })
    $('fsf-source-brand').addEventListener('change',function () { populateSizes(); updateSourcePicker(); $('fsf-source-error').textContent = ''; $('fsf-source-picker').classList.remove('is-error'); $('fsf-source-picker').removeAttribute('aria-invalid') })
    $('fsf-source-picker').addEventListener('click',function () {
      var options = $('fsf-source-options')
      options.hidden = !options.hidden
      $('fsf-source-picker').setAttribute('aria-expanded',String(!options.hidden))
    })
    $('fsf-source-options').addEventListener('click',function (event) {
      var option = event.target.closest('[data-fsf-source]')
      if (!option) return
      $('fsf-source-brand').value = option.dataset.fsfSource
      $('fsf-source-brand').dispatchEvent(new Event('change'))
      $('fsf-source-options').hidden = true
      $('fsf-source-picker').setAttribute('aria-expanded','false')
      $('fsf-source-picker').focus()
    })
    document.addEventListener('click',function (event) {
      if (event.target.closest('.fsf-source-picker-wrap')) return
      $('fsf-source-options').hidden = true
      $('fsf-source-picker').setAttribute('aria-expanded','false')
    })
    $('fsf-source-picker').addEventListener('keydown',function (event) {
      if (event.key !== 'Escape') return
      $('fsf-source-options').hidden = true
      $('fsf-source-picker').setAttribute('aria-expanded','false')
    })
    $('fsf-brand-grid').addEventListener('click',function (event) {
      var button = event.target.closest('[data-fsf-target]')
      if (!button) return
      state.target = button.dataset.fsfTarget
      renderBrands()
    })
    $('fsf-measure-help').addEventListener('click',function () {
      var text = $('fsf-measure-text')
      text.hidden = !text.hidden
      $('fsf-measure-help').setAttribute('aria-expanded',String(!text.hidden))
    })
    $('fsf-submit').addEventListener('click',submit)
    var shareUrl = window.location.origin + window.location.pathname
    $('fsf-share-facebook').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl)
    $('fsf-share-threads').href = 'https://www.threads.net/intent/post?text=' + encodeURIComponent('Công cụ quy đổi size giày dép đa thương hiệu của F-SPORT ' + shareUrl)
    function copied() {
      $('fsf-share-status').textContent = 'Đã copy link!'
      window.setTimeout(function () { $('fsf-share-status').textContent = '' }, 2500)
    }
    async function copyLink() {
      try {
        await navigator.clipboard.writeText(shareUrl)
        copied()
      } catch (_) {
        var input = document.createElement('input')
        input.value = shareUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        input.remove()
        copied()
      }
    }
    $('fsf-share-copy').addEventListener('click',copyLink)
    $('fsf-share-instagram').addEventListener('click',function () {
      window.open('https://www.instagram.com/','_blank','noopener,noreferrer')
      copyLink()
    })
  }

  async function init() {
    root.classList.add('fsf-loading')
    try {
      var loaded = await Promise.all([
        fetch(DATA_URL).then(function (response) { if (!response.ok) throw new Error('Size data HTTP ' + response.status); return response.json() }),
        fetch(EXTRA_DATA_URL).then(function (response) { if (!response.ok) throw new Error('Extra size data HTTP ' + response.status); return response.json() }),
        loadCatalog().catch(function (error) { console.warn('[SizeFinder] Product catalog fallback',error); return {} })
      ])
      state.data = loaded[0]
      Object.assign(state.data.charts, loaded[1].charts || {})
      state.catalog = loaded[2]
      populateSourceBrands()
      renderBrands()
      populateSizes()
      bind()
    } catch (error) {
      console.error('[SizeFinder] Cannot initialize',error)
      $('fsf-output').innerHTML = '<div class="fsf-empty"><div><i>!</i><strong>Không tải được dữ liệu size</strong><p>Vui lòng tải lại trang hoặc xem trực tiếp trang sản phẩm.</p></div></div>'
      $('fsf-error').textContent = 'Không tải được dữ liệu bảng size.'
    } finally {
      root.classList.remove('fsf-loading')
    }
  }

  init()
})()
