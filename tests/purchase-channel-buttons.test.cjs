const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const runtime = fs.readFileSync(path.join(root, 'js', 'product-page-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'frontend.css'), 'utf8');
const backendRoot = path.resolve(root, '..', 'fsport-backend');
const manager = fs.readFileSync(path.join(backendRoot, 'src', 'js', 'modules', 'product-pages-page.js'), 'utf8');
const purchaseManager = fs.readFileSync(path.join(backendRoot, 'src', 'js', 'modules', 'purchase-buttons-page.js'), 'utf8');
const migration = fs.readFileSync(path.join(backendRoot, 'supabase', 'migrations', '20261016090000_purchase_channel_buttons.sql'), 'utf8');

assert.match(runtime, /config\.buttons\.slice\(0, 3\)/, 'runtime must cap storefront buttons at three');
assert.match(runtime, /description\.insertAdjacentElement\("afterend", host\)/, 'buttons must render after product description');
assert.match(runtime, /track\("purchase_button_click", metadata\)/, 'every purchase button click must be tracked');
assert.match(css, /\.fs-purchase-channel-buttons \.btn-block[\s\S]*?flex-wrap:\s*nowrap/, 'buttons must stay on one row');

const flashIndex = manager.indexOf('flashBannerContentCard() +');
const purchaseIndex = manager.indexOf('purchaseButtonsContentCard() +');
assert.ok(flashIndex >= 0 && purchaseIndex > flashIndex, 'Product Page card must be immediately after Flash Banner');
assert.match(manager, /Link for: <b>[\s\S]*?button\.text/, 'link fields must be labelled with their Button text');
assert.doesNotMatch(manager, /data-marketplace=/, 'page links must not depend on a marketplace selector');
assert.match(manager, /filter\(function\(button\) \{ return button\.action === 'marketplace' \}\)/, 'only Marketplace Link buttons receive URL fields');
assert.match(manager, /pp-purchase-open-link/, 'each Marketplace Link input must include a quick-open button');
assert.match(manager, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/, 'quick-open buttons must open valid links in a new tab');
assert.match(purchaseManager, /ERP_DATE_PICKER\.open/, 'click report must reuse the shared date range picker');
assert.match(purchaseManager, /id="pcbReportPage"/, 'click report must filter by Product Page');
assert.match(purchaseManager, />' \+ esc\(productPagePath\(page\)\) \+ '<\/option>/, 'Product Page report filter must show Frontend path');
assert.match(purchaseManager, /page \? productPagePath\(page\) : row\.page_slug/, 'Product Page report column must show Frontend path');
assert.match(purchaseManager, /data-pcb-tab="/, 'Presets and Report must use separate page tabs');
assert.match(purchaseManager, /activeTab === 'report' \? renderReport\(\) : renderPresets\(\)/, 'only the active Purchase Buttons tab may render');
assert.match(purchaseManager, /id="pcbPresetSelect"/, 'Presets must be selected from a database-backed dropdown');
assert.doesNotMatch(purchaseManager, /data-pcb-preset=/, 'Presets must not use a separate card list column');
assert.ok(purchaseManager.indexOf('<main class="fb-editor">') < purchaseManager.indexOf('<aside class="fb-preview">'), 'Live Preview must render below the preset editor');

for (const slug of ['carbon', 'ysandalbn68', 'ysandal5568']) {
  assert.match(migration, new RegExp(`when '${slug}'`), `migration must seed ${slug}`);
}
for (const file of ['ysandal/carbon.html', 'product/ysandalbn68.html', 'product/ysandal5568.html']) {
  const page = fs.readFileSync(path.join(root, file), 'utf8');
  assert.doesNotMatch(page, /buyShopeeBtn|window\.shopeeLink|outbound-click\.js/, `${file} must not retain legacy Shopee button code`);
}
assert.match(migration, /jsonb_array_length\(config -> 'buttons'\) between 1 and 3/, 'database must enforce one to three buttons');

console.log('purchase channel buttons contract: ok');
