import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const targetUrl = process.argv[2] || 'http://127.0.0.1:8792/feed/chon-size-dep-chay-bo-ysandal-ung-chuan-huong-dan-chi-tiet-cho-nguoi-moi-va-chuyen-nghiep-20260724'
const outputPath = resolve(process.argv[3] || 'artifacts/FSport-Size-Finder-UI-Redesign-Brief.pdf')
const work = await mkdtemp(join(tmpdir(), 'fsport-size-finder-brief-'))
const profile = join(work, 'chrome-profile')
const port = 9354
const browser = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--disable-extensions', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' })

const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms))
let socket
let sequence = 0
const pending = new Map()

async function json(url, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch {}
    await delay(100)
  }
  throw new Error(`Chrome DevTools unavailable at ${url}`)
}

function command(method, params = {}) {
  const id = ++sequence
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolveCommand, rejectCommand) => pending.set(id, { resolve: resolveCommand, reject: rejectCommand }))
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed')
  return result.result.value
}

async function captureTool(name, width, height, mobile) {
  await command('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height
  })
  await command('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('fsport_tracking_consent_v1','denied')`
  })
  await command('Page.navigate', { url: targetUrl })
  await delay(5000)
  await evaluate(`(() => {
    const style = document.createElement('style')
    style.textContent = '.fn-skip,#fsport-nav-footer,#fn-scroll-top,.fake-notification,.cookie-consent-banner{display:none!important}'
    document.head.appendChild(style)
    document.getElementById('fsf-tab-foot')?.click()
    const length = document.getElementById('fsf-foot-length')
    const footWidth = document.getElementById('fsf-foot-width')
    if (length) { length.value = '26'; length.dispatchEvent(new Event('input', { bubbles:true })) }
    if (footWidth) { footWidth.value = '10,2'; footWidth.dispatchEvent(new Event('input', { bubbles:true })) }
    document.getElementById('fsf-submit')?.click()
  })()`)
  await delay(1800)
  await evaluate(`(async () => {
    const root = document.getElementById('fs-size-finder')
    root.querySelectorAll('img').forEach(img => { img.loading = 'eager'; if (img.dataset.src && !img.src) img.src = img.dataset.src })
    const top = root.getBoundingClientRect().top + scrollY
    const bottom = top + root.getBoundingClientRect().height
    for (let y = top; y < bottom; y += Math.max(360, innerHeight * .7)) {
      scrollTo(0, y)
      await new Promise(resolveScroll => setTimeout(resolveScroll, 180))
    }
    scrollTo(0, top)
  })()`)
  await evaluate(`Promise.all([...document.querySelectorAll('#fs-size-finder img')].map(img => img.complete ? true : new Promise(resolveImage => { img.addEventListener('load', resolveImage, {once:true}); img.addEventListener('error', resolveImage, {once:true}); setTimeout(resolveImage, 2500) })))`)
  const clip = JSON.parse(await evaluate(`JSON.stringify((() => {
    const box = document.getElementById('fs-size-finder').getBoundingClientRect()
    return { x:Math.max(0,box.left + scrollX), y:Math.max(0,box.top + scrollY), width:Math.ceil(box.width), height:Math.ceil(box.height), scale:1 }
  })())`))
  const shot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true, clip })
  const path = join(work, `${name}.png`)
  await writeFile(path, Buffer.from(shot.data, 'base64'))
  return { path, width: clip.width, height: clip.height }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[char])
}

const prompt = `BẠN LÀ AI THIẾT KẾ UI ĐỘC LẬP ĐANG ĐÁNH GIÁ CÔNG CỤ F-SPORT SIZE FINDER.

Hai ảnh trong tài liệu này là trạng thái hiện tại của riêng phần công cụ trên desktop và mobile. Hãy đề xuất một hệ phối màu mới giúp công cụ đơn giản, tinh gọn và sang trọng hơn, đồng thời vẫn rõ ràng, dễ mua hàng và phù hợp thương hiệu thể thao F-SPORT.

PHẠM VI ĐƯỢC PHÉP:
- Thay bảng màu, màu nền, màu chữ, màu viền, trạng thái hover/focus/selected/error/disabled.
- Tinh chỉnh rất nhẹ shadow, gradient, độ tương phản và sắc độ bề mặt để tạo chiều sâu cao cấp.
- Giữ màu đỏ làm accent có kiểm soát cho hành động hoặc thông tin quan trọng nếu hợp lý; không để đỏ xuất hiện dày đặc.
- Có thể đề xuất token màu riêng cho desktop/mobile nếu thật sự cần, nhưng phải giữ cùng một hệ nhận diện.

KHÔNG ĐƯỢC THAY ĐỔI:
- Không đổi cấu trúc, bố cục, số cột, kích thước, spacing, typography, nội dung chữ hoặc thứ tự thành phần.
- Không thêm/bớt component, icon, ảnh, animation hoặc chức năng.
- Không thay logic quy đổi size, thương hiệu, sản phẩm, tồn kho, popup mua hàng hay chia sẻ.
- Không thiết kế lại phần nội dung bài viết bên dưới; chỉ đánh giá phần tool xuất hiện trong ảnh.
- Không viết lại toàn bộ CSS và không đề xuất framework mới.

MỤC TIÊU THỊ GIÁC:
- Tối giản nhưng không lạnh lẽo; sang trọng nhưng không giống thương hiệu thời trang xa xỉ.
- Nền và surface sạch, phân cấp rõ, ít màu cạnh tranh.
- Các card sản phẩm, input, tab, brand card và vùng kết quả phải đồng nhất.
- CTA mua hàng dễ thấy; trạng thái HẾT HÀNG vẫn rõ nhưng không thô.
- Đạt tương phản WCAG AA cho chữ thông thường và trạng thái tương tác.
- Hoạt động tốt trên cả desktop và mobile như hai ảnh tham chiếu.

HÃY TRẢ VỀ ĐÚNG MỘT FILE MARKDOWN TÊN:
FSport-Size-Finder-Color-Refresh-Spec.md

FILE ĐÓ PHẢI CÓ ĐỦ:
1. Tên concept và mô tả định hướng trong tối đa 120 từ.
2. Bảng palette gồm mã HEX, vai trò và lý do sử dụng.
3. Danh sách CSS design tokens đề xuất theo dạng --token-name: #HEX;.
4. Bảng ánh xạ màu cụ thể cho: nền toàn tool, header thương hiệu, form card, result card, input/select, segmented tabs, brand cards, product cards, size đề xuất, CTA chính, HẾT HÀNG, validation, bảng size, popup mua hàng và nhóm chia sẻ.
5. Trạng thái default/hover/focus/selected/disabled/error với màu cụ thể.
6. Lưu ý riêng cho desktop và mobile, nhưng không thay layout.
7. Một khối CSS override tối thiểu chỉ chứa biến màu và các override thực sự cần thiết; không sao chép toàn bộ stylesheet.
8. Checklist nghiệm thu ngắn để một developer khác có thể triển khai chính xác.

Không trả lời bằng lời dẫn ngoài file. Không tạo mockup mới, không tạo nhiều phương án và không trả nhiều file. Chọn duy nhất một hướng phối màu tốt nhất dựa trên ảnh.`

try {
  const targets = await json(`http://127.0.0.1:${port}/json`)
  const page = targets.find(target => target.type === 'page')
  if (!page) throw new Error('No Chrome page target found')
  socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once:true })
    socket.addEventListener('error', rejectOpen, { once:true })
  })
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    const item = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) item.reject(new Error(message.error.message))
    else item.resolve(message.result)
  })
  await command('Page.enable')
  await command('Runtime.enable')

  const desktop = await captureTool('desktop', 1440, 1000, false)
  const mobile = await captureTool('mobile', 390, 844, true)
  const desktopData = (await readFile(desktop.path)).toString('base64')
  const mobileData = (await readFile(mobile.path)).toString('base64')
  const reportPath = join(work, 'brief.html')
  const report = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>F-SPORT Size Finder UI Redesign Brief</title><style>
    @page{size:16.5in 46.8in;margin:.45in}*{box-sizing:border-box}body{margin:0;color:#171717;background:#fff;font-family:Arial,sans-serif}h1{margin:0 0 12px;font-size:30px}h2{margin:0 0 18px;font-size:22px}.meta{margin:0 0 24px;color:#555;font-size:13px}.prompt{white-space:pre-wrap;border:1px solid #d7d7d7;border-radius:14px;padding:24px;background:#f7f7f5;font:14px/1.55 Consolas,monospace}.page{break-before:page}.shot{display:block;margin:0 auto;border:1px solid #d0d0d0;background:#eee;object-fit:contain;object-position:top}.desktop{width:15in;max-height:42in}.mobile{width:5in;max-height:42in}.caption{margin:0 0 14px;color:#555;font-size:12px}
  </style></head><body><section><h1>F-SPORT SIZE FINDER — COLOR REFRESH BRIEF</h1><p class="meta">Phạm vi: chỉ phần tool · Tham chiếu desktop và mobile · Không thay layout hoặc logic</p><div class="prompt">${escapeHtml(prompt)}</div></section><section class="page"><h2>ẢNH THAM CHIẾU — DESKTOP</h2><p class="caption">Kích thước phần tool: ${desktop.width} × ${desktop.height}px</p><img class="shot desktop" src="data:image/png;base64,${desktopData}" alt="Toàn bộ F-SPORT Size Finder trên desktop"></section><section class="page"><h2>ẢNH THAM CHIẾU — MOBILE</h2><p class="caption">Kích thước phần tool: ${mobile.width} × ${mobile.height}px</p><img class="shot mobile" src="data:image/png;base64,${mobileData}" alt="Toàn bộ F-SPORT Size Finder trên mobile"></section></body></html>`
  await writeFile(reportPath, report, 'utf8')
  await command('Emulation.clearDeviceMetricsOverride')
  await command('Page.navigate', { url:pathToFileURL(reportPath).href })
  await delay(1800)
  const pdf = await command('Page.printToPDF', { printBackground:true, preferCSSPageSize:true, displayHeaderFooter:false })
  await mkdir(resolve(outputPath, '..'), { recursive:true })
  await writeFile(outputPath, Buffer.from(pdf.data, 'base64'))
  console.log(JSON.stringify({ outputPath, desktop, mobile }, null, 2))
} finally {
  if (socket) socket.close()
  browser.kill()
}
