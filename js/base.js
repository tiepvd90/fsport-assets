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

// ✅ Gọi supportchat nếu có
//const sc = document.createElement("script");
//sc.src = "/js/supportchat.js";
//document.body.appendChild(sc);

function initFbLivePopup() {
  // Kiểm tra tránh chèn trùng
  if (document.getElementById("fbLivePopup")) return;

  // CSS nội tuyến
  const style = document.createElement("style");
  style.textContent = `
    #fbLivePopup {
      position: fixed;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 90px;
      background: #fff;
      border: 1px solid #ddd;
      border-left: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      border-radius: 0 10px 10px 0;
      overflow: hidden;
      z-index: 9999;
      transition: transform 0.3s ease;
    }
    #fbLivePopup iframe {
      width: 100%;
      height: 160px;
      display: block;
    }
    #fbLivePopup .close-btn {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 14px;
      cursor: pointer;
      line-height: 20px;
      text-align: center;
    }
    #fbLivePopup.hidden {
      transform: translate(-100%, -50%);
    }
    @media (max-width: 768px) {
      #fbLivePopup { width: 70px; }
      #fbLivePopup iframe { height: 120px; }
    }
  `;
  document.head.appendChild(style);

  // HTML popup
  const popup = document.createElement("div");
  popup.id = "fbLivePopup";
  popup.innerHTML = `
    <button class="close-btn" onclick="this.parentElement.classList.add('hidden')">&times;</button>
    <iframe 
      src="https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F2579888902356798%2F&show_text=true&width=267&t=0"
      style="border:none;overflow:hidden"
      scrolling="no"
      frameborder="0"
      allowfullscreen="true"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
    </iframe>
  `;
  document.body.appendChild(popup);
}

// ✅ Gọi hàm sau khi trang load
document.addEventListener("DOMContentLoaded", initFbLivePopup);

