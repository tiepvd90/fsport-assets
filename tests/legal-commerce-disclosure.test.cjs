const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const requiredPages = [
  'cong-khai-thong-tin-thuong-mai-dien-tu.html',
  'quyen-va-nghia-vu-cua-cac-ben.html',
  'tiep-nhan-giai-quyet-khieu-nai.html',
  'chinh-sach-gia.html',
  'chinh-sach-thanh-toan.html',
  'dieu-kien-han-che-cung-cap.html',
  'chinh-sach-uu-tien-hien-thi.html',
];

test('required commerce disclosure pages exist and are linked globally', () => {
  const footer = read('js/legal-footer.js');
  const sitemap = read('page-sitemap.xml');

  for (const file of requiredPages) {
    const route = `/${file.replace(/\.html$/, '')}`;
    assert.ok(fs.existsSync(path.join(root, file)), `${file} must exist`);
    assert.match(footer, new RegExp(route), `${route} must be in the legal footer`);
    assert.match(sitemap, new RegExp(route), `${route} must be in the sitemap`);
  }
});

test('Article 6 disclosure identifies every party and direct-sale model', () => {
  const rights = read('quyen-va-nghia-vu-cua-cac-ben.html');

  assert.match(rights, /Quyền và nghĩa vụ của chủ quản nền tảng/);
  assert.match(rights, /Quyền và nghĩa vụ của người bán/);
  assert.match(rights, /Quyền và nghĩa vụ của người mua/);
  assert.match(rights, /HỘ KINH DOANH HUYỀN 1191 vừa là chủ quản nền tảng, vừa là người bán duy nhất/);
  assert.match(rights, /không cho phép bên thứ ba mở gian hàng/);
});

test('checkout exposes legal terms before an order is submitted', () => {
  const checkout = read('html/checkoutpopup.html');

  assert.match(checkout, /\/dieu-khoan-giao-dich/);
  assert.match(checkout, /\/quyen-va-nghia-vu-cua-cac-ben/);
  assert.match(checkout, /\/chinh-sach-bao-mat/);
});
