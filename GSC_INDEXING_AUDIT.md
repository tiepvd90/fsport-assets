# GSC Indexing Audit - F-SPORT

Thoi diem audit: 2026-07-22 22:34 ICT. Cap nhat post-deploy: 2026-07-22 23:48 ICT. Repo frontend: `D:\WEBSITE\Code\26\fsport-frontend`.

## 1. Ket luan nhanh

Ket luan: Co loi ky thuat co the anh huong indexing.

Do tin cay: 88%.

Hai loi da xac minh bang request thuc te:

- Nhieu trang tinh trong sitemap dang public tra HTML 200 nhung thieu canonical va meta description trong HTML ban dau. Day la loi can sua, khong nen tiep tuc cho rang GSC chi cham xu ly.
- URL khong ton tai dang tra homepage voi HTTP 200, co nguy co soft 404. Nguyen nhan phu hop voi Cloudflare Pages SPA fallback khi repo khong co top-level `404.html`.

Khong thay bang chung sitemap XML bi hong. Viec GSC bao `https://fun-sport.co/` la `Page with redirect` la binh thuong vi apex redirect sang `https://www.fun-sport.co/`.

## 2. Nhung bang chung cho thay website dang duoc index

- Web search `site:fun-sport.co` tra ve ket qua homepage `https://www.fun-sport.co/` va mot so URL san pham/stories.
- Theo thong tin chu website cung cap, Search Results van ghi nhan click tu Google Search.
- Public crawl thanh cong: homepage, feed, san pham, danh muc va feed detail deu tra HTTP 200.
- Google-selected canonical trong URL Inspection cua apex la `https://www.fun-sport.co/`, dung voi huong canonical www.

## 3. Cac loi da phat hien

1. Muc do: High
   URL/file lien quan: 22 trang tinh trong `google-sitemap.xml`, vi du `https://www.fun-sport.co/pickleball/panther`, `https://www.fun-sport.co/product/sportcap`, `https://www.fun-sport.co/`.
   Bang chung: Mau public 30 URL co 22 URL thieu canonical va 22 URL thieu meta description trong HTML server response.
   Anh huong den Google: Google phai tu chon canonical, de nham voi bien the www/non-www, trailing slash hoac URL cu.
   Da sua: Co. Da them canonical, description rieng theo tung trang, og:url, og:title, og:description, og:image va twitter card vao 22 file HTML tinh trong sitemap.

2. Muc do: High
   URL/file lien quan: `https://www.fun-sport.co/duong-dan-khong-ton-tai-audit-404`, file moi `404.html`.
   Bang chung: Public request URL khong ton tai tra HTTP 200 va noi dung homepage.
   Anh huong den Google: Co nguy co soft 404, lam loang crawl/index va lam GSC bao cao trang loi khong ro.
   Da sua: Co trong repo. Da them `404.html` co `noindex, follow`. Theo Cloudflare Pages docs, top-level `404.html` dung de Pages render Not Found thay vi SPA fallback.

3. Muc do: Medium
   URL/file lien quan: DNS `fun-sport.co`.
   Bang chung: `fun-sport.co` A record tro `52.74.6.109`, `13.215.239.219`; `www.fun-sport.co` CNAME tro `fsport-frontend.pages.dev`.
   Anh huong den Google: Apex di qua Netlify/old origin de redirect, con www chay Cloudflare Pages. Hien khong tao loop, nhung day la cau hinh hosting khong gon.
   Da sua: Chua. Khong sua DNS theo yeu cau.

4. Muc do: Informational
   URL/file lien quan: `https://fun-sport.co/`.
   Bang chung: URL Inspection bao `Page with redirect`, curl xac nhan apex 301 sang www.
   Anh huong den Google: Binh thuong. URL redirect khong duoc index la dung; URL dich www moi la URL can index.
   Da sua: Khong can sua trong repo.

## 4. Redirect audit

| URL kiem tra | Status dau tien | Redirect chain | URL cuoi | Danh gia |
|---|---:|---|---|---|
| `http://fun-sport.co/` | 301 | `http -> https apex -> https www` | `https://www.fun-sport.co/` | Hop le, 2 hop |
| `https://fun-sport.co/` | 301 | `apex -> www` | `https://www.fun-sport.co/` | Hop le |
| `http://www.fun-sport.co/` | 301 | `http www -> https www` | `https://www.fun-sport.co/` | Hop le |
| `https://www.fun-sport.co/` | 200 | Khong redirect | `https://www.fun-sport.co/` | Tot |
| `http://fun-sport.co/pickleball/panther?utm=test` | 301 | `http apex -> https apex -> https www` | `https://www.fun-sport.co/pickleball/panther?utm=test` | Giu path/query, 2 hop |
| `https://fun-sport.co/pickleball/panther?utm=test` | 301 | `apex -> www` | `https://www.fun-sport.co/pickleball/panther?utm=test` | Giu path/query |
| `https://fun-sport.co/feed/` | 301 | `apex -> www` | `https://www.fun-sport.co/feed/` | Giu path |
| `https://fun-sport.co/product/sportcap` | 301 | `apex -> www` | `https://www.fun-sport.co/product/sportcap` | Giu path |
| `https://www.fun-sport.co/feed/nghe-thuat-third-shot-trong-pickleball-quyet-inh-giua-drop-va-drive-20260713` | 200 | Khong redirect | Cung URL | Tot |
| `https://www.fun-sport.co/duong-dan-khong-ton-tai-audit-404` | 200 | Khong redirect | Cung URL | Sai truoc sua: soft 404/homepage fallback |

## 5. Canonical audit

| Loai trang | URL | Canonical | Dung/Sai | Ghi chu |
|---|---|---|---|---|
| Homepage public | `https://www.fun-sport.co` | Thieu | Sai | Da them trong `index.html` |
| Feed listing | `https://www.fun-sport.co/feed` | `https://www.fun-sport.co/feed` | Dung | Co san truoc audit |
| Danh muc | `https://www.fun-sport.co/pickleball/collection` | Thieu public | Sai | Da them trong source |
| San pham | `https://www.fun-sport.co/pickleball/panther` | Thieu public | Sai | Da them trong source |
| San pham | `https://www.fun-sport.co/product/sportcap` | Thieu public | Sai | Da them trong source |
| Feed detail | `https://www.fun-sport.co/feed/nghe-thuat-third-shot-trong-pickleball-quyet-inh-giua-drop-va-drive-20260713` | Cung URL | Dung | SSR qua Pages Function/Supabase |
| Feed detail 404 | `https://www.fun-sport.co/feed/slug-khong-ton-tai-test-404-xyz` | Khong can | Dung | Tra HTTP 404 va meta robots noindex |

Kiem tra local sau sua: 22/22 trang tinh trong sitemap co dung 1 canonical, dung `https://www.fun-sport.co`, khong query string. `og:url` cung khop URL sitemap.

## 6. Sitemap audit

- `https://www.fun-sport.co/google-sitemap.xml`: HTTP 200. Sau deploy, homepage loc la `https://www.fun-sport.co/`, khop canonical homepage.
- Content-Type: `application/xml`.
- Kich thuoc: 28,171 bytes.
- Tong so URL: 221.
- URL unique: 221.
- URL HTTPS: 221/221.
- URL www: 221/221.
- URL duplicate: 0.
- URL malformed: 0.
- XML declaration: Co.
- Namespace sitemap: Co.
- Ky tu `&` chua escape: Khong phat hien.
- `lastmod`: Khong co, nen khong co ngay sai/tuong lai.
- Mau public 30 URL: 30 URL HTTP 200, 0 redirect, 0 404, 0 5xx, 0 noindex, 22 thieu canonical/description truoc deploy.
- `sitemap.xml`: HTTP 200, Content-Type `application/xml`, gom 3 sitemap con.
- `feed-sitemap.xml`: HTTP 200, Content-Type `application/xml; charset=utf-8`, sinh qua Pages Function, cache `public, max-age=300`.

Khong ket luan sitemap loi chi vi GSC bao Temporary processing error. Du lieu thuc te cho thay XML hop le va crawl duoc.

## 7. Robots va indexing directives

`robots.txt` public tra HTTP 200, Content-Type `text/plain; charset=utf-8`:

```txt
User-agent: *
Allow: /

Sitemap: https://www.fun-sport.co/sitemap.xml
Sitemap: https://www.fun-sport.co/google-sitemap.xml
```

Khong co `Disallow: /`. Khong thay `X-Robots-Tag` tren cac URL mau. Feed detail khong ton tai tra 404 va co meta `noindex`, dung.

## 8. SSR va HTML audit

- Feed detail co SSR metadata: title, description, canonical, og:url va h1 nam trong HTML response ban dau.
- Feed listing co metadata trong HTML ban dau, nhung h1 khong co trong server HTML.
- Trang san pham va danh muc la static HTML co title/h1 noi dung san pham. Truoc sua thieu canonical/description; sau sua metadata da nam trong HTML file, khong phu thuoc JavaScript.
- Trang homepage co noi dung/links duoc gan them bang JavaScript cho collection grid, nhung sau sua da co title/description/canonical server-side.
- Public URL khong ton tai tra homepage HTTP 200 truoc sua. Da them `404.html` de Cloudflare Pages tra Not Found sau deploy.
- Cloudflare Pages local dev (`npx wrangler pages dev . --port 8788`) xac nhan URL sai tra HTTP 404 that va dung noi dung `404.html`; cac route hop le `/pickleball/panther`, `/product/sportcap`, `/feed/<slug>` van tra 200.
- Route dong `/p/:slug` van duoc `_redirects` xu ly truoc 404 va tra dynamic product page; hanh vi nay giong public hien tai, nen `404.html` khong lam hong route dong dang ton tai.

## 9. Nhung thay doi da thuc hien

- Them `404.html`: trang 404 co `meta robots noindex, follow`.
- Sua `index.html`: doi title ro hon, them description, canonical, Open Graph va twitter card.
- Sua 21 file trang tinh khac trong sitemap: them description rieng theo title/trang, canonical, Open Graph va twitter card.
- Cac file da sua: `pickleball/collection.html`, `ysandal/collection.html`, `product/gaiter.html`, `product/sportcap.html`, `product/ysandal5560.html`, `product/ysandal5568.html`, `product/ysandalbn68.html`, `pickleball/active.html`, `pickleball/bag.html`, `pickleball/ball.html`, `pickleball/cover.html`, `pickleball/foam.html`, `pickleball/fullfoam-vietnam.html`, `pickleball/fullfoam.html`, `pickleball/gen4.html`, `pickleball/panther.html`, `pickleball/phantom.html`, `ysandal/bcu5206.html`, `ysandal/bn520.html`, `ysandal/carbon.html`, `giadung/batmattroi.html`.
- Ly do: canonical va metadata can co trong HTML ban dau cho URL indexable.
- Rui ro: mot phan cau mo ta bo sung dung ASCII de tranh loi encoding khi bulk edit, nhung title san pham co dau van duoc giu trong description rieng. Chua deploy nen public chua co thay doi.

## 10. Ket qua build/test

- `Test-Path package.json`: `False`. Repo frontend khong co `package.json`, khong co build/lint/test command de chay.
- `node` validation local: 22/22 trang tinh trong `google-sitemap.xml` co dung 1 canonical, co description va og:url.
- `node` validation local: 0 nhom duplicate description trong 22 trang tinh; 24 file thay doi khong co ky tu UTF-8 replacement `�`.
- `node` XML validation local: `sitemap.xml`, `google-sitemap.xml`, `page-sitemap.xml`, `product-sitemap.xml` deu co XML declaration, loc hop le, khong duplicate, khong URL non-www/non-HTTPS.
- `curl` public robots/sitemap/feed-sitemap: deu HTTP 200.
- `npx wrangler pages dev . --port 8788`: `404.html` duoc phuc vu tu output root, URL sai tra `HTTP/1.1 404 Not Found`; sitemap/robots local van 200.

## 10.1. Ket qua deploy production

- Commit SEO chinh: `2c67da53 Fix GSC indexing metadata and 404 handling`.
- Commit can chinh homepage trailing slash: `e505edce Align homepage canonical with trailing slash`.
- `npx wrangler pages deploy . --project-name fsport-frontend --branch main --commit-dirty=false`: khong chay duoc vi moi truong khong co `CLOUDFLARE_API_TOKEN`.
- Da deploy production bang cach push `main` len GitHub remote `origin`; Cloudflare Pages tu dong lay commit moi.
- Public check sau deploy:
  - `https://www.fun-sport.co/duong-dan-khong-ton-tai-audit-404`: `HTTP/1.1 404 Not Found`, co `meta name="robots" content="noindex, follow"`.
  - `https://www.fun-sport.co/`: `HTTP/1.1 200 OK`, canonical `https://www.fun-sport.co/`.
  - `https://www.fun-sport.co/pickleball/panther`: `HTTP/1.1 200 OK`, canonical `https://www.fun-sport.co/pickleball/panther`.
  - `https://www.fun-sport.co/product/sportcap`: `HTTP/1.1 200 OK`, canonical `https://www.fun-sport.co/product/sportcap`.
  - `https://www.fun-sport.co/robots.txt`: `HTTP/1.1 200 OK`.
  - `https://www.fun-sport.co/google-sitemap.xml`: `HTTP/1.1 200 OK`, root loc `https://www.fun-sport.co/`.

Ket luan post-deploy: cac dieu kien ky thuat can thiet de Googlebot crawl/index URL chinh da dat. Neu GSC van khong cap nhat sau 3-7 ngay, can xem lai GSC property/sitemap state va cau hinh DNS apex con tro Netlify.

## 11. Nhung viec chu website phai lam trong Google Search Console

- Submit lai `https://www.fun-sport.co/google-sitemap.xml` trong GSC.
- Inspect va Request indexing cho: `https://www.fun-sport.co/`, `https://www.fun-sport.co/pickleball/panther`, `https://www.fun-sport.co/product/sportcap`, `https://www.fun-sport.co/feed/nghe-thuat-third-shot-trong-pickleball-quyet-inh-giua-drop-va-drive-20260713`.
- Inspect mot URL sai bat ky sau deploy, vi du `https://www.fun-sport.co/duong-dan-khong-ton-tai-audit-404`, de xac nhan tra 404 that.
- Khong can request indexing cho `https://fun-sport.co/`; URL nay redirect la dung.
- Kiem tra lai Pages report sau 3-7 ngay. Neu GSC van `Processing data` qua 7 ngay sau deploy/sitemap submit, chup man hinh Coverage/Pages va Sitemap details de doi chieu.

## 12. Du lieu can cung cap them

- Anh chup GSC Sitemap detail cua `google-sitemap.xml`: Last read, Status, Discovered URLs.
- Anh chup URL Inspection cua URL dich `https://www.fun-sport.co/`, khong phai apex.
- Anh chup Pages report neu van hien `Processing data`.
- Quyen xem Cloudflare Pages custom domain/DNS neu muon xu ly apex con tro Netlify.

## 13. Ket luan danh cho chuyen gia kiem tra tiep

Website F-SPORT van duoc crawl va co dau hieu dang duoc index. GSC bao apex `https://fun-sport.co/` la `Page with redirect` la hanh vi binh thuong vi canonical dich la `https://www.fun-sport.co/`. Sitemap public hien tai hop le, 221 URL deu HTTPS/www va khong duplicate. Hai van de can xu ly da duoc sua trong repo la thieu canonical/meta description tren 22 trang tinh indexable va Cloudflare Pages SPA fallback lam URL khong ton tai tra homepage 200. Sau khi deploy, can xac nhan public HTML da co canonical va URL sai tra 404 that, sau do submit lai sitemap va cho GSC xu ly lai bao cao.
