const endpoint = process.argv[2] || 'http://127.0.0.1:9225/json'
const targetUrl = process.argv[3] || 'http://127.0.0.1:8081/ysandal/carbon2?marketplace-only=1'
const pages = await fetch(endpoint).then(response => response.json())
const targetOrigin = new URL(targetUrl).origin
const page = pages.find(item => item.type === 'page' && item.url.startsWith(targetOrigin))
if (!page) throw new Error('Local Carbon 2 page was not found')
const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once:true })
  socket.addEventListener('error', reject, { once:true })
})

let commandId = 0
const pending = new Map()
const purchaseRequests = []
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    const request = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
    return
  }
  if (message.method !== 'Network.requestWillBeSent') return
  const request = message.params.request
  if (!request.postData || !/track_profile_event|analytics_events/.test(request.url)) return
  try {
    const payload = JSON.parse(request.postData)
    if ((payload.p_event_type || payload.event_type) === 'purchase_button_click') {
      purchaseRequests.push(payload.p_metadata || payload.metadata)
    }
  } catch (_) {}
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
await command('Network.enable')
await command('Page.navigate', { url:targetUrl })
await new Promise(resolve => setTimeout(resolve, 7000))
const state = await evaluate(`(async () => {
  const buttons = Array.from(document.querySelectorAll('#fsPurchaseChannelButtons button'))
  const website = buttons.find(button => /WEBSITE/i.test(button.textContent))
  const shopee = buttons.find(button => /SHOPEE/i.test(button.textContent))
  if (website) website.click()
  await new Promise(resolve => setTimeout(resolve, 1200))
  const popup = document.getElementById('cartPopup')
  const cartOpened = !!(popup && popup.style.display === 'flex' && !popup.classList.contains('hidden'))
  if (typeof window.toggleCartPopup === 'function') window.toggleCartPopup(false)
  window.open = function() { return { opener:null } }
  if (shopee) shopee.click()
  return { websiteFound:!!website, shopeeFound:!!shopee, cartOpened }
})()`)
await new Promise(resolve => setTimeout(resolve, 3000))

console.log(JSON.stringify({ state, purchaseRequests }, null, 2))
socket.close()
if (!state.websiteFound || !state.shopeeFound || !state.cartOpened || purchaseRequests.length !== 1 || purchaseRequests[0].action !== 'marketplace') process.exitCode = 1
