// ✅ Fix iOS zoom khi focus input
document.querySelectorAll("input, select, textarea").forEach((el) => {
  el.addEventListener("touchstart", () => {
    document.documentElement.style.fontSize = "16px";
  });
});

// ✅ Scroll to top khi mở popup (tuỳ lúc gọi thêm)
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ✅ Hiện/ẩn popup form (giỏ hàng)
function toggleForm(show = true) {
  const form = document.getElementById("slideForm");
  if (!form) return;

  if (show) {
    form.classList.remove("hidden");
    form.style.bottom = "0"; // ✅ Trượt lên
    scrollToTop();
  } else {
    form.style.bottom = "-100%"; // ✅ Trượt xuống
    setTimeout(() => form.classList.add("hidden"), 400); // Delay để ẩn sau animation
  }
}

// ✅ Gắn sự kiện đóng popup cho nút có class "close-popup"
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".close-popup").forEach((btn) => {
    btn.addEventListener("click", () => toggleForm(false));
  });
});

// ✅ Theo dõi popup để ẩn mascot nếu đang hiển thị popup
const observer = new MutationObserver(() => {
  const popup = document.getElementById("slideForm");
  const mascot = document.getElementById("mascot-container");
  if (popup && mascot) {
    const isVisible = !popup.classList.contains("hidden");
    mascot.style.display = isVisible ? "none" : "block";
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// ✅ Format tiền VND
function formatPrice(vnd) {
  return vnd.toLocaleString("vi-VN") + "đ";
}

// ✅ Chặn pinch zoom và double tap zoom trên mobile
document.addEventListener('touchstart', function (event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);
// ✅ Tự động đóng popup khi người dùng ấn nút Back
window.onpopstate = function () {
  // Đóng các popup nếu đang mở
  document.getElementById("cartPopup")?.classList.add("hidden");
  document.getElementById("checkoutPopup")?.classList.add("hidden");
  document.getElementById("voucherPopup")?.classList.add("hidden");
  document.getElementById("productVideoPopup")?.classList.remove("show");
  document.getElementById("slideForm")?.classList.add("hidden"); // nếu đang dùng popup trượt
};

// ✅ Load fake notify (gọi như script thật để tránh lỗi CORS/textContent)
const fakenotifyScript = document.createElement("script");
fakenotifyScript.src = "/js/fakenotify.js";
fakenotifyScript.defer = true;
document.body.appendChild(fakenotifyScript);

/* ===========================
   ✅ FAKE NOTIFY LOADER (tách riêng)
   – Không fetch text, không inline; load như script chuẩn
   – fakenotify.js tự inject CSS/HTML và tự wait DOM
   =========================== */
(function loadFakeNotify() {
  if (window.disableFakeNotify) return;           // Cho phép tắt qua global flag
  if (window.__fakeNotifyInjected) return;
  window.__fakeNotifyInjected = true;

  const s = document.createElement('script');
  s.src = '/js/fakenotify.js?v=1';
  s.async = true;                                  // tải song song, thực thi khi tải xong
  s.onerror = (e) => console.warn('Không load được fakenotify.js', e);
  document.head.appendChild(s);
})();

// ✅ KEEP TAB ALIVE – tránh Safari unload tab gây about:blank (tuỳ chọn)
setInterval(() => {
  fetch('/favicon.ico', { cache: "no-store" }).catch(() => {});
}, 5 * 60 * 1000);
/* ===========================
   ✅ COLLECTION ICON LOADER
   =========================== */
(function loadCollectionIcon() {
  if (window.__collectionIconInjected) return;
  window.__collectionIconInjected = true;

  const s = document.createElement('script');
  s.src = '/js/collectionIcon.js?v=1';
  s.defer = true;
  s.onerror = (e) => console.warn('Không load được collectionIcon.js', e);
  document.head.appendChild(s);
})();

// ✅ Gọi supportchat nếu có
//const sc = document.createElement("script");
//sc.src = "/js/supportchat.js";
//document.body.appendChild(sc);
// ============================================
// 🎾 GỌI FLOAT IMAGE PICKLEBALL
// ============================================
(function loadFloatImage() {
  const script = document.createElement("script");
  script.src = "/js/floatimage.js";
  script.defer = true;
  document.body.appendChild(script);
})();

// ============================================
// 💬 GỌI ZALO OA CHAT
// ============================================
(function loadZaloChat() {
  if (window.__zaloInjected) return;
  window.__zaloInjected = true;

  const s = document.createElement("script");
  s.src = "/js/zalo.js?v=1";
  s.defer = true;
  s.onerror = (e) => console.warn("Không load được zalo.js", e);
  document.head.appendChild(s);
})();
