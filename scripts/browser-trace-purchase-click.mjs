const endpoint = process.argv[2] || 'http://127.0.0.1:9226/json'
const pages = await fetch(endpoint).then(response => response.json())
const page = pages.find(item => item.type === 'page' && item.url.includes('fun-sport.co'))
if (!page) throw new Error('F-Sport product page was not found in Chrome')
const paths = process.argv.slice(3)

const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once:true })
  socket.addEventListener('error', reject, { once:true })
})

let commandId = 0
const pending = new Map()
const requests = new Map()
const responses = []
socket.addEventListener('message', async event => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    const request = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
    return
  }
  if (message.method === 'Network.requestWillBeSent') {
    requests.set(message.params.requestId, message.params.request)
  }
  if (message.method === 'Network.responseReceived') {
    const request = requests.get(message.params.requestId)
    if (!request || !/track_profile_event|analytics_events/.test(request.url)) return
    responses.push({ requestId:message.params.requestId, url:request.url, method:request.method, postData:request.postData, status:message.params.response.status })
  }
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
const clickStates = []
for (const path of (paths.length ? paths : [new URL(page.url).pathname])) {
  const target = new URL(path, 'https://fun-sport.co').href
  await command('Page.navigate', { url:target })
  await new Promise(resolve => setTimeout(resolve, 7000))
  const clickState = await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('#fsPurchaseChannelButtons button'))
    const shopee = buttons.find(button => /SHOPEE/i.test(button.textContent))
    window.open = function() { return { opener:null } }
    if (shopee) shopee.click()
    return { path:location.pathname, found:!!shopee, fsportReady:!!(window.fsport && typeof window.fsport.track === 'function') }
  })()`)
  clickStates.push(clickState)
  await new Promise(resolve => setTimeout(resolve, 3000))
}

for (const response of responses) {
  try {
    const body = await command('Network.getResponseBody', { requestId:response.requestId })
    response.body = body.body
  } catch (_) {}
  delete response.requestId
  if (response.postData) {
    try {
      const payload = JSON.parse(response.postData)
      response.eventType = payload.p_event_type || payload.event_type
      response.metadata = payload.p_metadata || payload.metadata
    } catch (_) {}
    delete response.postData
  }
}

console.log(JSON.stringify({ clickStates, responses }, null, 2))
socket.close()
const successfulClicks = responses.filter(item => item.status < 300 && item.eventType === 'purchase_button_click').length
if (clickStates.some(item => !item.found || !item.fsportReady) || successfulClicks < clickStates.length) process.exitCode = 1
