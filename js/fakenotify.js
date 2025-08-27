/* =========================================================
   FAKE NOTIFY (self-contained) – inject CSS + DOM + logic
   Chỉ cần được load (bởi base.js), không cần sửa HTML/CSS
   ========================================================= */
(function () {
  'use strict';

  // Tránh load trùng
  if (window.__fakeNotifyLoaded) return;
  window.__fakeNotifyLoaded = true;

  // ── Config nhanh
  const CONFIG = {
    bottom: 60,          // px vị trí cách đáy
    leftHidden: -400,    // px khi ẩn (trượt ra ngoài)
    leftVisible: 16,     // px khi hiện
    firstDelay: 5000,    // ms lần đầu xuất hiện
    showMs: 5000,        // ms hiển thị mỗi lần
    minGapMs: 10000,     // ms tối thiểu giữa 2 lần
    maxGapMs: 25000      // ms tối đa giữa 2 lần
  };

  // ── Pools (có thể override qua window.FAKE_NOTIFY = { users, products, actions })
  const NAME_POOL = (window.FAKE_NOTIFY && window.FAKE_NOTIFY.users) || [
    "T**u","M**n","H***e","AnhT***","B***C","HoangA***","L***Huong","Q***Khanh","P**4","KimL***",
    "MyLinh","T***3","N***A","VanK***","H***a","ThuT***","DucH***","Nhat553","B***m","G***4",
    "K***T","LienH***","Phuoc***","ThaoN***","Vuong***","N***U","HieuT***","T***h","L***D","Phat***",
    "T***Trang","BaoN***","Q***7","D***Tien","HoaiA***","AnK***","PhongL***","Dieu***","H***Phat","MaiL***",
    "K***e","SonT***","Y***e","T***n","H***u","Kiet***","VyL***","LocT***","Trang***","Trung***"
  ];

  const PRODUCT_POOL = (window.FAKE_NOTIFY && window.FAKE_NOTIFY.products) || [
    "Dép Chạy BCU5568","Vợt Gen4 Hồng","Vợt AirForce","Dép Chạy BN68", "Set Tranh Decor",
    "Vợt Rồng Đen","Vợt Gen4 Xám","Vợt T700 Pro","Thuyền SUP","Vợt Rồng Trắng"
  ];

  const ACTION_POOL = (window.FAKE_NOTIFY && window.FAKE_NOTIFY.actions) || [
    "Vừa Đặt Mua","Vừa Thêm Vào Giỏ"
  ];

  // ── Utils
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const nextGap = () => Math.floor(Math.random() * (CONFIG.maxGapMs - CONFIG.minGapMs)) + CONFIG.minGapMs;

  // ── Inject CSS (gọn, không cần file riêng)
  const style = document.createElement('style');
  style.textContent = `
  #fakeNotification {
    position: fixed;
    bottom: ${CONFIG.bottom}px;
    left: ${CONFIG.leftHidden}px;
    z-index: 9999;
    background: #fff;
    padding: 8px 14px;
    border-radius: 999px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-size: 12px; /* ✅ nhỏ lại còn 2/3 */
    font-weight: normal; /* ✅ bỏ bold */
    transition: left 0.6s ease;
    pointer-events: none;
    color: #111;
    font-family: 'Be Vietnam Pro', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    max-width: min(90vw, 360px);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  @media (max-width: 380px) {
    #fakeNotification { font-size: 11px; padding: 7px 12px; }
  }
`;

  document.head.appendChild(style);

  // ── Tạo node
  function ensureNode() {
    let el = document.getElementById('fakeNotification');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fakeNotification';
      el.textContent = 'Vừa đặt hàng thành công';
      document.body.appendChild(el);
    }
    return el;
  }

  let _timer = 0;
  function showOnce() {
    const el = ensureNode();
    el.textContent = `${rand(NAME_POOL)} ${rand(ACTION_POOL)} ${rand(PRODUCT_POOL)}`;
    el.style.left = CONFIG.leftVisible + 'px';

    // Ẩn sau showMs
    setTimeout(() => {
      el.style.left = CONFIG.leftHidden + 'px';
    }, CONFIG.showMs);

    // Lịch lần tiếp theo
    _timer = setTimeout(showOnce, nextGap());
  }

  function start() {
    // dọn timer cũ (nếu có)
    if (_timer) clearTimeout(_timer);
    setTimeout(showOnce, CONFIG.firstDelay);
  }

  // Pause khi tab ẩn để khỏi spam
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (_timer) clearTimeout(_timer);
    } else {
      start();
    }
  });

  // Bắt đầu sau DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
