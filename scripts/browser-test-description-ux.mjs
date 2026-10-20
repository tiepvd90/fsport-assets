const endpoint = process.argv[2] || 'http://127.0.0.1:9235/json'
const targetUrl = process.argv[3] || 'http://127.0.0.1:8788/ysandal/carbon2?description-ux-test=1'

const pages = await fetch(endpoint).then(response => response.json())
const page = pages.find(item => item.type === 'page')
if (!page) throw new Error('Chrome test page was not found')

const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once:true })
  socket.addEventListener('error', reject, { once:true })
})

let commandId = 0
const pending = new Map()
const runtimeErrors = []
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text || 'Runtime exception')
  if (!message.id || !pending.has(message.id)) return
  const request = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) request.reject(new Error(message.error.message))
  else request.resolve(message.result)
})

function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++commandId
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed')
  return result.result.value
}

await command('Runtime.enable')
await command('Page.enable')
await command('Emulation.setDeviceMetricsOverride', {
  width:390, height:844, deviceScaleFactor:2, mobile:true
})
await command('Page.navigate', { url:targetUrl })
await new Promise(resolve => setTimeout(resolve, 6500))

const initial = await evaluate(`(() => {
  const slides = Array.from(document.querySelectorAll('#lazySlideshow .slide'))
  const directText = Array.from(document.querySelectorAll('#productdescription-placeholder > div'))
    .find(node => node.id !== 'descContainer' && node.id !== 'descFull' && node.id !== 'descFade' && node.textContent.trim())
  const expandedText = document.querySelector('#descFull > div')
  return {
    path:location.pathname,
    viewport:[innerWidth, innerHeight],
    firstSlide:slides[0] && (slides[0].currentSrc || slides[0].src),
    secondSlide:slides[1] && (slides[1].dataset.src || slides[1].currentSrc || slides[1].src),
    preload:Array.from(document.querySelectorAll('link[rel="preload"][as="image"]')).map(link => link.getAttribute('href')),
    slideCount:slides.length,
    toggleText:(document.getElementById('toggleDesc') || {}).textContent || '',
    directFont:directText && getComputedStyle(directText).fontSize,
    expandedFont:expandedText && getComputedStyle(expandedText).fontSize
  }
})()`)

const expanded = await evaluate(`(async () => {
  const button = document.getElementById('toggleDesc')
  button.scrollIntoView({ block:'center', behavior:'auto' })
  await new Promise(resolve => setTimeout(resolve, 80))
  button.click()
  await new Promise(resolve => setTimeout(resolve, 900))
  const full = document.getElementById('descFull')
  return {
    hidden:full.classList.contains('hidden'),
    aria:button.getAttribute('aria-expanded'),
    firstRevealedTop:full.getBoundingClientRect().top,
    scrollY:window.scrollY
  }
})()`)

const collapsed = await evaluate(`(async () => {
  const button = document.getElementById('toggleDesc')
  button.scrollIntoView({ block:'center', behavior:'auto' })
  await new Promise(resolve => setTimeout(resolve, 80))
  const before = button.getBoundingClientRect().top
  button.click()
  await new Promise(resolve => setTimeout(resolve, 180))
  const after = button.getBoundingClientRect().top
  const footer = document.getElementById('sticky-footer-placeholder')
  return {
    hidden:document.getElementById('descFull').classList.contains('hidden'),
    aria:button.getAttribute('aria-expanded'),
    buttonTopBefore:Math.round(before),
    buttonTopAfter:Math.round(after),
    positionDelta:Math.round(after - before),
    buttonVisible:after >= 0 && after <= innerHeight,
    footerCoversViewport:!!footer && footer.getBoundingClientRect().top < innerHeight / 2
  }
})()`)

await command('Page.navigate', { url:'http://127.0.0.1:8788/pickleball/ball?description-ux-test=1' })
await new Promise(resolve => setTimeout(resolve, 3500))
const legacyPage = await evaluate(`(async () => {
  const button = document.getElementById('toggleDesc')
  const full = document.getElementById('descFull')
  if (!button || !full) return { ready:false }
  button.scrollIntoView({ block:'center', behavior:'auto' })
  button.click()
  await new Promise(resolve => setTimeout(resolve, 700))
  const expandedOnce = !full.classList.contains('hidden') && button.getAttribute('aria-expanded') === 'true'
  button.scrollIntoView({ block:'center', behavior:'auto' })
  await new Promise(resolve => setTimeout(resolve, 80))
  const before = button.getBoundingClientRect().top
  button.click()
  await new Promise(resolve => setTimeout(resolve, 180))
  const after = button.getBoundingClientRect().top
  return {
    ready:true,
    expandedOnce,
    collapsed:full.classList.contains('hidden'),
    positionDelta:Math.round(after - before),
    scriptVersion:Array.from(document.scripts).some(script => script.src.includes('productdescription.js?v=20261021-reading-anchor-1'))
  }
})()`)

const result = { initial, expanded, collapsed, legacyPage, runtimeErrors }
console.log(JSON.stringify(result, null, 2))
socket.close()

const failed = initial.path !== '/ysandal/carbon2' ||
  !/\/assets\/images\/critical\/carbon2-first-1789209806884\.webp/.test(initial.firstSlide || '') ||
  !initial.preload.some(url => /carbon2-first-1789209806884\.webp/.test(url)) ||
  !/^https:\/\//.test(initial.secondSlide || '') ||
  initial.directFont !== initial.expandedFont ||
  expanded.hidden || expanded.aria !== 'true' ||
  !collapsed.hidden || collapsed.aria !== 'false' ||
  Math.abs(collapsed.positionDelta) > 3 || !collapsed.buttonVisible ||
  !legacyPage.ready || !legacyPage.expandedOnce || !legacyPage.collapsed ||
  Math.abs(legacyPage.positionDelta) > 3 || !legacyPage.scriptVersion ||
  runtimeErrors.length > 0

if (failed) throw new Error('Product description UX browser assertions failed')
