const endpoint = process.argv[2] || 'http://127.0.0.1:9225/json'
const pages = await fetch(endpoint).then(response => response.json())
const page = pages.find(item => item.type === 'page' && item.url.includes('/ysandal/carbon2'))
if (!page) throw new Error('Carbon 2 page was not found in Chrome')

const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once:true })
  socket.addEventListener('error', reject, { once:true })
})

let commandId = 0
const pending = new Map()
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
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
await new Promise(resolve => setTimeout(resolve, 5000))

const state = await evaluate(`(async () => {
  const host = document.getElementById('fsPurchaseChannelButtons')
  const buttons = host ? Array.from(host.querySelectorAll('button')) : []
  const website = buttons.find(button => /WEBSITE/i.test(button.textContent))
  const shopee = buttons.find(button => /SHOPEE/i.test(button.textContent))
  const popup = document.getElementById('cartPopup')

  if (website) website.click()
  await new Promise(resolve => setTimeout(resolve, 100))
  const cartOpened = !!(popup && popup.style.display === 'flex' && !popup.classList.contains('hidden'))
  if (typeof window.toggleCartPopup === 'function') window.toggleCartPopup(false)

  window.__outboundOpen = null
  window.open = function(url, target, features) {
    window.__outboundOpen = { url, target, features }
    return { opener:'initial' }
  }
  if (shopee) shopee.click()

  return {
    runtimeSource:Array.from(document.scripts).map(script => script.src).find(src => src.includes('product-page-runtime.js')) || '',
    buttonCount:buttons.length,
    websiteFound:!!website,
    cartOpened,
    shopeeFound:!!shopee,
    outboundOpen:window.__outboundOpen,
    currentPath:location.pathname
  }
})()`)

console.log(JSON.stringify(state, null, 2))
socket.close()

if (!state.websiteFound || !state.cartOpened || !state.shopeeFound ||
    !state.outboundOpen || state.outboundOpen.target !== '_blank' ||
    !String(state.outboundOpen.features || '').includes('noopener') ||
    state.currentPath !== '/ysandal/carbon2') process.exitCode = 1
