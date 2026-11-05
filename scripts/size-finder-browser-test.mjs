import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const url = process.argv[2]
if (!url) throw new Error('Pass the local Size Finder URL')
const viewportWidth = Number(process.env.FSF_WIDTH || 390)
const viewportHeight = Number(process.env.FSF_HEIGHT || 844)
const port = 9341
const profile = join(tmpdir(), `fsport-size-finder-test-${Date.now()}`)
const browser = spawn(chrome, ['--headless=new','--disable-gpu','--disable-extensions',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'], { stdio:'ignore' })
const delay = ms => new Promise(resolve => setTimeout(resolve,ms))
let socket
let id = 0
const pending = new Map()
async function json(endpoint) {
  for (let attempt=0; attempt<50; attempt+=1) {
    try { const response=await fetch(endpoint); if(response.ok) return response.json() } catch {}
    await delay(100)
  }
  throw new Error('Chrome DevTools unavailable')
}
function command(method,params={}) {
  const requestId=++id
  socket.send(JSON.stringify({id:requestId,method,params}))
  return new Promise((resolve,reject)=>pending.set(requestId,{resolve,reject}))
}
async function evaluate(expression) {
  const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})
  if(result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
try {
  const page=(await json(`http://127.0.0.1:${port}/json`)).find(item=>item.type==='page')
  socket=new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})})
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(!message.id||!pending.has(message.id))return;const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(new Error(message.error.message)):item.resolve(message.result)})
  await command('Runtime.enable')
  await command('Page.enable')
  await command('Emulation.setDeviceMetricsOverride',{width:viewportWidth,height:viewportHeight,deviceScaleFactor:1,mobile:viewportWidth<=767,screenWidth:viewportWidth,screenHeight:viewportHeight})
  const errors=[]
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text)})
  await command('Page.navigate',{url})
  await delay(5000)
  await evaluate(`document.querySelector('[data-consent="granted"]')?.click()`)
  await evaluate(`document.getElementById('fsf-source-picker').click()`)
  await delay(1200)
  const initial=await evaluate(`JSON.stringify({ready:document.getElementById('fs-size-finder')?.dataset.ready,articleH1:!!document.querySelector('article h1'),introDescription:document.querySelector('.fsf-intro')?.textContent.includes('Nhập size đôi giày'),cover:!!document.querySelector('.fsf-editorial-cover img'),coverLoaded:document.querySelector('.fsf-editorial-cover img')?.complete&&document.querySelector('.fsf-editorial-cover img')?.naturalWidth>0,brands:document.querySelectorAll('[data-fsf-target]').length,brandLogoImages:document.querySelectorAll('.fsf-brand-logo').length,loadedBrandLogos:[...document.querySelectorAll('.fsf-brand-logo')].filter(img=>img.complete&&img.naturalWidth>0).length,sourceLogoImages:document.querySelectorAll('.fsf-source-option img').length,loadedSourceLogos:[...document.querySelectorAll('.fsf-source-option img')].filter(img=>img.complete&&img.naturalWidth>0).length,anta:[...document.querySelectorAll('[data-fsf-target]')].some(el=>el.textContent.includes('ANTA')),lining:[...document.querySelectorAll('[data-fsf-target]')].some(el=>el.textContent.includes('Li-Ning')),mizuno:[...document.querySelectorAll('[data-fsf-target]')].some(el=>el.textContent.includes('Mizuno')),euLabel:[...document.querySelectorAll('[data-fsf-system]')].find(el=>el.dataset.fsfSystem==='EU')?.textContent.trim(),share:!!document.getElementById('fsf-share-copy'),zalo:!!document.getElementById('fsf-share-zalo'),instagram:!!document.getElementById('fsf-share-instagram'),threads:!!document.getElementById('fsf-share-threads'),telegram:!!document.getElementById('fsf-share-telegram'),nativeShare:!!document.getElementById('fsf-share-native'),pickerCue:!!document.querySelector('.fsf-picker-cue'),placeholder:document.getElementById('fsf-source-current').textContent.trim(),genericOption:[...document.querySelectorAll('.fsf-source-option')].some(el=>el.textContent.toUpperCase().includes('KHÔNG CHỌN HÃNG - DÙNG SIZE GIÀY THỂ THAO PHỔ THÔNG')),sourceLabel:document.querySelector('label[for="fsf-source-picker"]')?.textContent.trim(),overflow:document.documentElement.scrollWidth-innerWidth})`)
  await evaluate(`document.querySelector('.fsf-editorial-cover img').scrollIntoView({block:'center'})`)
  await delay(700)
  const coverLoaded=await evaluate(`document.querySelector('.fsf-editorial-cover img').complete&&document.querySelector('.fsf-editorial-cover img').naturalWidth>0`)
  if(process.env.FSF_DROPDOWN_SHOT){await evaluate(`document.getElementById('fsf-source-picker').click();document.getElementById('fsf-source-picker').scrollIntoView({block:'center'})`);await delay(200);const shot=await command('Page.captureScreenshot',{format:'png',fromSurface:true});await writeFile(process.env.FSF_DROPDOWN_SHOT,Buffer.from(shot.data,'base64'))}
  await evaluate(`document.querySelector('.fsf-source-option[data-fsf-source=""]')?.click();document.getElementById('fsf-submit').click()`)
  await delay(350)
  const requiredSource=await evaluate(`JSON.stringify({message:document.getElementById('fsf-source-error').textContent.trim(),bottomEmpty:document.getElementById('fsf-error').textContent.trim()==='',redBorder:getComputedStyle(document.getElementById('fsf-source-picker')).borderTopColor==='rgb(217, 39, 63)',below:document.getElementById('fsf-source-error').getBoundingClientRect().top>=document.getElementById('fsf-source-picker').getBoundingClientRect().bottom,focused:document.activeElement===document.getElementById('fsf-source-picker')})`)
  await evaluate(`document.getElementById('fsf-tab-foot').click();document.getElementById('fsf-foot-length').value='17';document.getElementById('fsf-submit').click()`)
  await delay(350)
  const footValidation=await evaluate(`JSON.stringify({helpVisible:!document.getElementById('fsf-measure-text').hidden,helpColor:getComputedStyle(document.getElementById('fsf-measure-text')).color,helpWeight:Number(getComputedStyle(document.getElementById('fsf-measure-text')).fontWeight),helpSize:parseFloat(getComputedStyle(document.getElementById('fsf-measure-text')).fontSize),message:document.getElementById('fsf-foot-length-error').textContent.trim(),bottomEmpty:document.getElementById('fsf-error').textContent.trim()==='',below:document.getElementById('fsf-foot-length-error').getBoundingClientRect().top>=document.getElementById('fsf-foot-length').getBoundingClientRect().bottom,invalid:document.getElementById('fsf-foot-length').getAttribute('aria-invalid')==='true'})`)
  await evaluate(`document.getElementById('fsf-foot-length').value='24,5';document.getElementById('fsf-foot-length').dispatchEvent(new Event('input'));document.getElementById('fsf-submit').click()`)
  await delay(350)
  const commaLength=await evaluate(`JSON.stringify({accepted:document.getElementById('fsf-foot-length-error').textContent.trim()===''&&!document.getElementById('fsf-result-title').textContent.includes('Cần thêm thông tin'),description:document.getElementById('fsf-result-sub').textContent})`)
  await evaluate(`document.getElementById('fsf-foot-length').value='24.5';document.getElementById('fsf-foot-length').dispatchEvent(new Event('input'));document.getElementById('fsf-submit').click()`)
  await delay(350)
  const dotLength=await evaluate(`JSON.stringify({accepted:document.getElementById('fsf-foot-length-error').textContent.trim()===''&&!document.getElementById('fsf-result-title').textContent.includes('Cần thêm thông tin'),description:document.getElementById('fsf-result-sub').textContent})`)
  await evaluate(`document.getElementById('fsf-tab-foot').click();document.getElementById('fsf-foot-length').value='26';document.getElementById('fsf-foot-width').value='10.2';document.getElementById('fsf-submit').click()`)
  await delay(1200)
  const foot=await evaluate(`JSON.stringify({intermediateVisible:/Chuẩn trung gian|Adidas EU/i.test(document.getElementById('fsf-output').textContent),products:document.querySelectorAll('.fsf-product').length,buyButtons:document.querySelectorAll('.fsf-product-buy').length,columns:getComputedStyle(document.querySelector('.fsf-product-grid')).gridTemplateColumns.split(' ').length,images:[...document.querySelectorAll('.fsf-product-media img')].filter(img=>img.currentSrc||img.src).length,statuses:document.querySelectorAll('.fsf-product-status').length,redundantText:/Có variant size này trong kho|Ngoài dải size đang bán|Giảm [12] size|Công thức F-SPORT|Bạn chưa chọn thương hiệu đang đi/.test(document.getElementById('fsf-output').textContent),buyWhiteSpace:getComputedStyle(document.querySelector('.fsf-product-buy')).whiteSpace,buyFont:parseFloat(getComputedStyle(document.querySelector('.fsf-product-buy')).fontSize),sizeWhiteSpace:getComputedStyle(document.querySelector('.fsf-product-size strong')).whiteSpace,theme:{headline:!!document.querySelector('.fsf-intro h2'),tab:getComputedStyle(document.querySelector('.fsf-segmented .is-active')).backgroundColor,pill:getComputedStyle(document.querySelector('.fsf-pills .is-active')).backgroundColor,brand:getComputedStyle(document.querySelector('.fsf-brand.is-active')).backgroundColor,submit:getComputedStyle(document.getElementById('fsf-submit')).backgroundColor,buy:getComputedStyle(document.querySelector('.fsf-product-buy')).backgroundColor,copy:getComputedStyle(document.getElementById('fsf-share-copy')).backgroundColor},added:Object.fromEntries(['BCU5206','BCU5555','BCU7712'].map(code=>{const card=document.querySelector('[data-fsf-product="'+code+'"]');return[code,card?{size:card.dataset.fsfSize,path:card.dataset.fsfPath,image:!!card.querySelector('img')}:null]}))})`)
  if(process.env.FSF_RESULT_SHOT){await evaluate(`document.querySelector('.fsf-product-grid').scrollIntoView({block:'start'})`);await delay(200);const shot=await command('Page.captureScreenshot',{format:'png',fromSurface:true});await writeFile(process.env.FSF_RESULT_SHOT,Buffer.from(shot.data,'base64'))}
  await evaluate(`document.querySelector('.fsf-product-buy').click()`)
  await delay(250)
  const purchase=await evaluate(`JSON.stringify({open:!document.getElementById('fsf-buy-popup').hidden,size:document.getElementById('fsf-buy-size').value,color:document.getElementById('fsf-buy-color').value,confirmEnabled:!document.getElementById('fsf-buy-confirm').disabled,hasDetail:!!document.querySelector('.fsf-buy-actions a'),stockRemoved:!document.querySelector('.fsf-buy-stock'),firstAction:document.querySelector('.fsf-buy-actions>*')?.id,confirmBackground:getComputedStyle(document.getElementById('fsf-buy-confirm')).backgroundColor,confirmColor:getComputedStyle(document.getElementById('fsf-buy-confirm')).color,confirmWeight:Number(getComputedStyle(document.getElementById('fsf-buy-confirm')).fontWeight)})`)
  if(process.env.FSF_POPUP_SHOT){const shot=await command('Page.captureScreenshot',{format:'png',fromSurface:true});await writeFile(process.env.FSF_POPUP_SHOT,Buffer.from(shot.data,'base64'))}
  await evaluate(`localStorage.removeItem('cart');window.FSPORT_ENSURE_CHECKOUT=()=>Promise.resolve();window.showCheckoutPopup=()=>{window.__fsfCheckoutOpened=true};document.getElementById('fsf-buy-confirm').click()`)
  await delay(150)
  const purchaseAdd=await evaluate(`JSON.stringify({closed:document.getElementById('fsf-buy-popup').hidden,checkout:window.__fsfCheckoutOpened===true,cart:JSON.parse(localStorage.getItem('cart')||'[]').map(item=>({id:item.id,size:item.size,color:item.color,quantity:item.quantity}))})`)
  await evaluate(`document.getElementById('fsf-foot-length').value='35';document.querySelector('[data-fsf-target="Y-Sandal"]').click();document.getElementById('fsf-submit').click()`)
  await delay(250)
  const outOfStock=await evaluate(`JSON.stringify({disabled:document.querySelectorAll('.fsf-product-buy:disabled').length,allDisabledCorrect:[...document.querySelectorAll('.fsf-product-buy:disabled')].every(btn=>btn.textContent.trim()==='HẾT HÀNG'&&btn.classList.contains('is-disabled'))})`)
  if(process.env.FSF_OUTSTOCK_SHOT){await evaluate(`document.querySelector('.fsf-product-grid').scrollIntoView({block:'start'})`);await delay(200);const shot=await command('Page.captureScreenshot',{format:'png',fromSurface:true});await writeFile(process.env.FSF_OUTSTOCK_SHOT,Buffer.from(shot.data,'base64'))}
  await evaluate(`document.getElementById('fsf-tab-size').click();document.getElementById('fsf-source-brand').value='ANTA';document.getElementById('fsf-source-brand').dispatchEvent(new Event('change'));document.getElementById('fsf-shoe-size').value='42';document.getElementById('fsf-submit').click()`)
  await delay(500)
  const anta=await evaluate(`JSON.stringify({sub:document.getElementById('fsf-result-sub').textContent,products:document.querySelectorAll('.fsf-product').length,intermediateVisible:/Chuẩn trung gian|Adidas EU/i.test(document.getElementById('fsf-output').textContent)})`)
  await evaluate(`document.getElementById('fsf-source-brand').value='Li-Ning';document.getElementById('fsf-source-brand').dispatchEvent(new Event('change'));document.getElementById('fsf-shoe-size').value='41 2/3';document.getElementById('fsf-submit').click()`)
  await delay(400)
  const lining=await evaluate(`JSON.stringify({sub:document.getElementById('fsf-result-sub').textContent,products:document.querySelectorAll('.fsf-product').length,intermediateVisible:/Chuẩn trung gian|Adidas EU/i.test(document.getElementById('fsf-output').textContent)})`)
  await evaluate(`document.getElementById('fsf-source-brand').value='Puma';document.getElementById('fsf-source-brand').dispatchEvent(new Event('change'));document.getElementById('fsf-shoe-size').value='42';document.querySelector('[data-fsf-target="Skechers"]').click();document.getElementById('fsf-submit').click()`)
  await delay(300)
  const indirect=await evaluate(`JSON.stringify({converted:!document.getElementById('fsf-output').textContent.includes('Chưa thể quy đổi'),reference:document.getElementById('fsf-output').textContent.includes('ƯỚC TÍNH THEO SIZE EU GẦN NHẤT'),title:document.getElementById('fsf-result-title').textContent})`)
  await evaluate(`document.querySelector('[data-fsf-target="Adidas"]').click();document.getElementById('fsf-submit').click()`)
  await delay(300)
  const nearby=await evaluate(`JSON.stringify({exists:!!document.querySelector('.data-table'),tableBorder:getComputedStyle(document.querySelector('.data-table')).borderTopWidth,cellBorder:getComputedStyle(document.querySelector('.data-table td')).borderRightWidth,selectedRow:!!document.querySelector('.data-table tr.selected')})`)
  if(process.env.FSF_STANDARD_SHOT){await evaluate(`document.querySelector('.fsf-summary').scrollIntoView({block:'center'})`);await delay(350);const shot=await command('Page.captureScreenshot',{format:'png',fromSurface:true});await writeFile(process.env.FSF_STANDARD_SHOT,Buffer.from(shot.data,'base64'))}
  await evaluate(`document.getElementById('fsf-tab-foot').click();document.getElementById('fsf-foot-length').value='26';document.getElementById('fsf-foot-width').value='2';document.getElementById('fsf-submit').click()`)
  await delay(300)
  const width=await evaluate(`document.getElementById('fsf-output').textContent.includes('chưa hợp lý')`)
  await evaluate(`document.getElementById('fsf-share-copy').click()`)
  await delay(250)
  const share=await evaluate(`JSON.stringify({copied:document.getElementById('fsf-share-status').textContent,facebook:document.getElementById('fsf-share-facebook').href,threads:document.getElementById('fsf-share-threads').href})`)
  const matrix=await evaluate(`JSON.stringify((()=>{const source=document.getElementById('fsf-source-brand');const size=document.getElementById('fsf-shoe-size');const failures=[];document.getElementById('fsf-tab-size').click();for(const sourceBrand of [...source.options].map(o=>o.value).filter(Boolean)){source.value=sourceBrand;source.dispatchEvent(new Event('change'));if(!size.value){failures.push(sourceBrand+' has no source size');continue}for(const target of [...document.querySelectorAll('[data-fsf-target]')]){target.click();document.getElementById('fsf-submit').click();if(document.getElementById('fsf-result-title').textContent.includes('Cần thêm thông tin'))failures.push(sourceBrand+' > '+target.dataset.fsfTarget)}}document.getElementById('fsf-tab-foot').click();document.getElementById('fsf-foot-length').value='26';document.getElementById('fsf-foot-width').value='10';for(const target of [...document.querySelectorAll('[data-fsf-target]')]){target.click();document.getElementById('fsf-submit').click();if(document.getElementById('fsf-result-title').textContent.includes('Cần thêm thông tin'))failures.push('foot > '+target.dataset.fsfTarget)}return {failures}})())`)
  const report={initial:JSON.parse(initial),coverLoaded,requiredSource:JSON.parse(requiredSource),footValidation:JSON.parse(footValidation),commaLength:JSON.parse(commaLength),dotLength:JSON.parse(dotLength),foot:JSON.parse(foot),purchase:JSON.parse(purchase),purchaseAdd:JSON.parse(purchaseAdd),outOfStock:JSON.parse(outOfStock),anta:JSON.parse(anta),lining:JSON.parse(lining),indirect:JSON.parse(indirect),nearby:JSON.parse(nearby),invalidWidthWarned:width,share:JSON.parse(share),matrix:JSON.parse(matrix),exceptions:errors}
  const failures=[]
  if(report.initial.ready!=='1'||report.initial.articleH1||report.initial.introDescription||!report.initial.cover||!report.coverLoaded||report.initial.brands!==12||report.initial.brandLogoImages!==12||report.initial.loadedBrandLogos!==12||report.initial.sourceLogoImages!==11||report.initial.loadedSourceLogos!==11||!report.initial.anta||!report.initial.lining||!report.initial.mizuno||report.initial.euLabel!=='Việt Nam (EU)'||!report.initial.share||report.initial.zalo||!report.initial.instagram||!report.initial.threads||report.initial.telegram||report.initial.nativeShare||report.initial.pickerCue||report.initial.placeholder!=='—'||!report.initial.genericOption||!report.initial.sourceLabel.includes('bạn đang sử dụng')||report.initial.overflow>1)failures.push('initial UI')
  if(report.requiredSource.message!=='Vui lòng chọn thương hiệu đôi giày đang sử dụng'||!report.requiredSource.bottomEmpty||!report.requiredSource.below||!report.requiredSource.focused)failures.push('required source selection')
  if(!report.footValidation.helpVisible||report.footValidation.helpColor!=='rgb(18, 53, 116)'||report.footValidation.helpWeight<700||report.footValidation.helpSize<12||report.footValidation.message!=='Vui lòng nhập chiều dài chân hợp lý từ 18 đến 38 cm.'||!report.footValidation.bottomEmpty||!report.footValidation.below||!report.footValidation.invalid)failures.push('foot-length inline validation')
  if(!report.commaLength.accepted||!report.commaLength.description.includes('24,5')||!report.dotLength.accepted||!report.dotLength.description.includes('24,5'))failures.push('Vietnamese decimal input')
  if(report.foot.intermediateVisible||report.foot.products!==10||report.foot.buyButtons!==10||report.foot.columns!==2||report.foot.images!==10||report.foot.statuses!==0||report.foot.redundantText||report.foot.buyWhiteSpace!=='nowrap'||report.foot.buyFont>9||report.foot.sizeWhiteSpace!=='nowrap')failures.push('Y-Sandal result')
  if(report.foot.theme.headline||report.foot.theme.tab!=='rgb(241, 244, 248)'||report.foot.theme.pill!=='rgb(241, 244, 248)'||report.foot.theme.brand!=='rgb(241, 244, 248)'||report.foot.theme.submit!=='rgb(215, 38, 61)'||report.foot.theme.buy!=='rgb(255, 255, 255)'||report.foot.theme.copy!=='rgb(255, 255, 255)')failures.push('color refresh theme')
  if(report.foot.added.BCU5206?.size!=='42'||report.foot.added.BCU5206?.path!=='/ysandal/bcu5206'||report.foot.added.BCU5555?.size!=='42'||report.foot.added.BCU5555?.path!=='/ysandal/bcu5555'||report.foot.added.BCU7712?.size!=='43'||report.foot.added.BCU7712?.path!=='/ysandal/bcu7712'||!Object.values(report.foot.added).every(item=>item?.image))failures.push('three added Y-Sandal models')
  if(!report.purchase.open||!report.purchase.size||!report.purchase.color||!report.purchase.confirmEnabled||!report.purchase.hasDetail||!report.purchase.stockRemoved||report.purchase.firstAction!=='fsf-buy-confirm'||report.purchase.confirmBackground!=='rgb(215, 38, 61)'||report.purchase.confirmColor!=='rgb(255, 255, 255)'||report.purchase.confirmWeight<700)failures.push('purchase popup')
  if(!report.purchaseAdd.closed||!report.purchaseAdd.checkout||report.purchaseAdd.cart.length!==1||!report.purchaseAdd.cart[0].id||!report.purchaseAdd.cart[0].size||!report.purchaseAdd.cart[0].color||report.purchaseAdd.cart[0].quantity!==1)failures.push('add to cart')
  if(report.outOfStock.disabled<1||!report.outOfStock.allDisabledCorrect)failures.push('out of stock purchase blocking')
  if(!report.nearby.exists||report.nearby.tableBorder!=='1px'||report.nearby.cellBorder!=='1px'||!report.nearby.selectedRow)failures.push('nearby table')
  if(!report.anta.sub.includes('ANTA EU 42')||report.anta.products!==10||report.anta.intermediateVisible)failures.push('ANTA bridge')
  if(!report.lining.sub.includes('Li-Ning EU 41 2/3')||report.lining.products!==10||report.lining.intermediateVisible)failures.push('Li-Ning bridge')
  if(!report.indirect.converted||!report.indirect.reference||report.indirect.title!=='')failures.push('indirect conversion')
  if(!report.invalidWidthWarned)failures.push('width validation')
  if(report.share.copied!=='Đã copy link!'||!report.share.facebook.includes('facebook.com/sharer')||!report.share.threads.includes('threads.net/intent'))failures.push('share actions')
  if(report.matrix.failures.length)failures.push('all-brand matrix: '+report.matrix.failures.join('; '))
  if(report.exceptions.length)failures.push('browser exceptions')
  console.log(JSON.stringify(report,null,2))
  if(failures.length) throw new Error('Failed: '+failures.join(', '))
} finally {
  if(socket) socket.close()
  browser.kill()
}
