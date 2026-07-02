import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productDir = path.join(root, 'pickleball');
const template = fs.readFileSync(path.join(productDir, 'panther.html'), 'utf8');
const targets = ['foam', 'fullfoam', 'active', 'phantom', 'gen4'];

function match(source, expression, label, slug) {
  const result = source.match(expression);
  if (!result) throw new Error(`Cannot read ${label} from ${slug}.html`);
  return result[1];
}

for (const slug of targets) {
  const targetPath = path.join(productDir, `${slug}.html`);
  const current = fs.readFileSync(targetPath, 'utf8');
  const title = match(current, /<title>([\s\S]*?)<\/title>/i, 'title', slug);
  const imageCount = match(current, /window\.imageCount\s*=\s*(\d+)/, 'imageCount', slug);
  const heading = match(current, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i, 'heading', slug)
    .replace(/^\s+|\s+$/g, '');
  const productHeading = heading
    .replace(/<span\b[\s\S]*?<\/span>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  let output = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/window\.imageCount\s*=\s*\d+;/, `window.imageCount = ${imageCount};`)
    .replace(
      /(<h1 class="fs-product-title">)[\s\S]*?(<\/h1>)/,
      `$1\n        <span class="fs-product-badge fs-product-badge--mall">Mall</span>\n` +
      `        <span class="fs-product-badge fs-product-badge--official">Hàng Chính Hãng</span>\n` +
      `        ${productHeading}\n      $2`
    )
    .replace(
      '/html/productdescription/pickleball/panther.html',
      `/html/productdescription/pickleball/${slug}.html`
    )
    .replace(
      '/js/product-page-runtime.js?v=20260630-central-runtime-2',
      '/js/product-page-runtime.js?v=20260702-central-runtime-2'
    )
    .replace(
      '/css/frontend.css?v=20260702-footer-clearance-1',
      '/css/frontend.css?v=20260702-product-runtime-1'
    );

  fs.writeFileSync(targetPath, output, 'utf8');
  console.log(`Synced ${slug}.html`);
}
