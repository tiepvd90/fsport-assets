import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9337;
const profile = join(tmpdir(), `fsport-feed-smoke-${Date.now()}`);
const output = process.argv[2] || join(tmpdir(), 'fsport-feed-mobile-cdp.png');
const targetUrl = process.argv[3] || 'http://127.0.0.1:8791/feed';
const viewportWidth = Number(process.env.SMOKE_WIDTH || 390);
const viewportHeight = Number(process.env.SMOKE_HEIGHT || 1100);
const deviceScaleFactor = Number(process.env.SMOKE_SCALE || 2);

const browser = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--disable-extensions', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let sequence = 0;
const pending = new Map();

async function json(url, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await delay(150);
  }
  throw new Error(`Chrome DevTools did not become ready at ${url}`);
}

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

try {
  const targets = await json(`http://127.0.0.1:${port}/json`);
  const page = targets.find(target => target.type === 'page');
  if (!page) throw new Error('No Chrome page target found');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const item = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message));
    else item.resolve(message.result);
  });

  await command('Page.enable');
  await command('Emulation.setDeviceMetricsOverride', {
    width: viewportWidth, height: viewportHeight, deviceScaleFactor,
    mobile: viewportWidth <= 767,
    screenWidth: viewportWidth, screenHeight: viewportHeight
  });
  await command('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('fsport_tracking_consent_v1','denied');`
  });
  await command('Page.navigate', { url: targetUrl });
  await delay(4500);
  if (process.env.SMOKE_WAIT_MS) await delay(Math.max(0, Number(process.env.SMOKE_WAIT_MS) || 0));
  if (process.env.SMOKE_SCROLL) {
    await command('Runtime.evaluate', {
      expression: `document.querySelector(${JSON.stringify(process.env.SMOKE_SCROLL)})?.scrollIntoView({block:'start'})`
    });
    await delay(2500);
  }
  if (process.env.SMOKE_SCROLL_Y) {
    await command('Runtime.evaluate', { expression: `scrollTo(0, ${Number(process.env.SMOKE_SCROLL_Y) || 0})` });
    await delay(1200);
  }
  if (process.env.SMOKE_SCROLL_ALL === '1') {
    for (let step = 0; step < 18; step += 1) {
      await command('Runtime.evaluate', { expression: `scrollBy(0, Math.max(320, innerHeight * .72))` });
      await delay(500);
    }
    await delay(2500);
  }
  if (process.env.SMOKE_SCROLL_FINAL) {
    await command('Runtime.evaluate', {
      expression: `document.querySelector(${JSON.stringify(process.env.SMOKE_SCROLL_FINAL)})?.scrollIntoView({block:'start'})`
    });
    await delay(1000);
  }
  if (process.env.SMOKE_CLICK_CART === '1') {
    await command('Runtime.evaluate', {
      expression: `document.querySelector('[data-footer-action="cart"]')?.click()`
    });
    await delay(3500);
  }
  if (process.env.SMOKE_CLICK_FEED_COMMERCE === '1') {
    const commerceSelector = process.env.SMOKE_FEED_COMMERCE_SELECTOR || '.fn-feed-commerce:not([hidden]) .fc-cta';
    await command('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(commerceSelector)})?.click()` });
    await delay(1200);
  }
  if (process.env.SMOKE_CONFIRM_FEED_COMMERCE === '1') {
    await command('Runtime.evaluate', { expression: `document.getElementById('fc-buy-confirm')?.click()` });
    await delay(3000);
  }
  if (process.env.SMOKE_CLICK_VIDEO === '1') {
    await command('Runtime.evaluate', {
      expression: `document.querySelector('.fn-article-video')?.click()`
    });
    await delay(2500);
    if (process.env.SMOKE_CLOSE_VIDEO === '1') {
      await command('Runtime.evaluate', { expression: `document.querySelector('.fn-video-modal-close')?.click()` });
      await delay(800);
    }
  }
  if (process.env.SMOKE_CLICK_SCROLL_TOP === '1') {
    await command('Runtime.evaluate', { expression: `document.getElementById('fn-scroll-top')?.click()` });
    await delay(1200);
  }
  const metrics = await command('Runtime.evaluate', {
    expression: `JSON.stringify({
      viewport: [innerWidth, innerHeight],
      scrollY: Math.round(scrollY),
      documentWidth: document.documentElement.scrollWidth,
      menuDisplay: document.querySelector('.fn-menu-button') ? getComputedStyle(document.querySelector('.fn-menu-button')).display : null,
      title: document.title,
      iframeCount: document.querySelectorAll('iframe').length,
      checkoutLoaded: !!document.querySelector('script[src*="checkout"]'),
      checkoutVisible: (() => { const el = document.getElementById('checkoutPopup'); return !!(el && getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden')) })(),
      feedCommerce: (() => { const blocks = Array.from(document.querySelectorAll('.fn-feed-commerce')); const visible = blocks.filter(el => !el.hidden && getComputedStyle(el).display !== 'none'); const popup = document.getElementById('fc-buy-popup'); let cart = []; try { cart = JSON.parse(localStorage.getItem('cart') || '[]') } catch {} return { blocks: blocks.length, visible: visible.length, cards: visible.reduce((sum, el) => sum + el.querySelectorAll('.fc-card').length, 0), tabs: document.querySelectorAll('.fc-tabs').length, lazyPending: document.querySelectorAll('.fn-feed-commerce.is-lazy-pending').length, popupOpen: !!(popup && !popup.hidden), popupSizes: document.querySelectorAll('#fc-buy-size option').length, popupColors: document.querySelectorAll('#fc-buy-color option').length, legacyCards: document.querySelectorAll('.feed-collection,.products').length, cartItems: Array.isArray(cart) ? cart.length : 0, lastCartSource: Array.isArray(cart) && cart.length ? cart[cart.length - 1].feed_source : '' }; })(),
      backButtonCount: document.querySelectorAll('[data-feed-back]').length,
      backSticky: (() => { const wrap = document.querySelector('.fn-back-sticky'); const button = wrap?.querySelector('[data-feed-back]'); return wrap && button ? { position: getComputedStyle(wrap).position, top: Math.round(button.getBoundingClientRect().top), inMasthead: !!button.closest('.fn-masthead') } : null })(),
      articleDate: (() => { const date = document.querySelector('.fn-article-date'); const pager = document.querySelector('.fn-article-pager'); return date ? { count: document.querySelectorAll('.fn-article-date').length, headerCount: document.querySelectorAll('article>header time').length, beforePager: !pager || !!(date.compareDocumentPosition(pager) & Node.DOCUMENT_POSITION_FOLLOWING), text: date.textContent.trim() } : null })(),
      scrollTopButton: (() => { const el = document.getElementById('fn-scroll-top'); return el ? { exists: true, visible: el.classList.contains('is-visible'), bottom: getComputedStyle(el).bottom } : { exists: false } })(),
      videoModal: (() => { const modal = document.querySelector('.fn-video-modal'); const player = document.querySelector('.fn-video-modal-player'); const iframe = player && player.querySelector('iframe'); return modal ? { open: true, ratio: Number((player.clientWidth / player.clientHeight).toFixed(3)), src: iframe ? iframe.src : '', bodyPosition: getComputedStyle(document.body).position, htmlLocked: document.documentElement.classList.contains('fn-video-modal-open'), inertSiblings: Array.from(document.body.children).filter(el => el !== modal).every(el => el.inert) } : { open: false } })(),
      infiniteAudit: {
        categoryPageItems: document.querySelectorAll('#fn-latest .fn-latest-item').length,
        manualLoadButtons: document.querySelectorAll('.fn-load-more').length,
        detailCategoryItems: document.querySelectorAll('#fn-article-category-stream .fn-related-card').length,
        detailLatestItems: document.querySelectorAll('#fn-article-after-category .fn-article-latest-item').length,
        afterCategoryHidden: document.getElementById('fn-article-after-category')?.hidden ?? null,
        sentinelText: Array.from(document.querySelectorAll('.fn-infinite-sentinel small')).map(el => el.textContent.trim())
      },
      articleVideoButtons: document.querySelectorAll('.fn-article-video').length,
      articleNavigation: Object.fromEntries(Object.entries({
        header: '.fn-article-site-header a', inline: '.fn-inline-related a', rail: '.fn-detail-rail a', pager: '.fn-article-pager a',
        related: '.fn-article-related a', latest: '.fn-article-latest a', return: '.fn-article-return a', footer: '.fn-article-footer a'
      }).map(([name, selector]) => [name, document.querySelectorAll(selector).length])),
      detailRail: (() => { const el = document.querySelector('.fn-detail-rail'); if (!el) return null; const box = el.getBoundingClientRect(); const style = getComputedStyle(el); return { display: style.display, position: style.position, top: Math.round(box.top), bottom: Math.round(box.bottom), height: Math.round(box.height), maxHeight: style.maxHeight, overflowY: style.overflowY }; })(),
      visibleFixedElements: Array.from(document.querySelectorAll('body *')).filter(el => {
        const style = getComputedStyle(el); const box = el.getBoundingClientRect();
        return style.position === 'fixed' && box.width > 100 && box.height > 30 && box.bottom > 0 && box.top < innerHeight;
      }).map(el => ({ tag: el.tagName, id: el.id, className: String(el.className || '').slice(0, 100) })).slice(0, 10),
      bodyFont: getComputedStyle(document.body).fontFamily,
      stylesheetHrefs: Array.from(document.styleSheets).map(sheet => sheet.href).filter(Boolean),
      feedApiRequests: performance.getEntriesByType('resource').filter(entry => entry.name.includes('/rest/v1/feed_posts')).length,
      feedAssetRequests: performance.getEntriesByType('resource').filter(entry => /feed-(?:newsroom|article)|feed-shell/.test(entry.name)).length,
      loadedSections: Array.from(document.querySelectorAll('.fn-lazy-section[data-loaded="1"]')).map(section => section.dataset.loader),
      videoCardRatio: (() => { const el = document.querySelector('.fn-video-grid .fn-card-media'); return el ? Number((el.clientWidth / el.clientHeight).toFixed(3)) : null })(),
      articleVideoRatio: (() => { const el = document.querySelector('.video-media'); return el ? Number((el.clientWidth / el.clientHeight).toFixed(3)) : null })(),
      thumbnailAudit: Object.fromEntries(Object.entries({
        hero: '.fn-hero img', side: '.fn-side-story img', cards: '.fn-card-media img',
        video: '.fn-video-grid .fn-card-media', rows: '.fn-media-row .fn-card-media',
        latest: '.fn-latest-item>a:first-child', products: '.fn-product-card img',
        related: '.fn-related-card img'
      }).map(([name, selector]) => [name, Array.from(document.querySelectorAll(selector)).map(el => {
        const box = el.getBoundingClientRect();
        return [Math.round(box.width), Math.round(box.height), box.height ? Number((box.width / box.height).toFixed(3)) : 0];
      })]))
    })`, returnByValue: true
  });
  const shot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(output, Buffer.from(shot.data, 'base64'));
  console.log(metrics.result.value);
  console.log(output);
} finally {
  if (socket) socket.close();
  browser.kill();
}
