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

// ✅ Load fake notify
fetch('/js/fakenotify.js')
  .then(res => res.text())
  .then(script => {
    const wrapper = document.createElement("script");
    wrapper.textContent = script;
    document.body.appendChild(wrapper);
  })
  .catch(err => console.warn("Không load được fakenotify:", err));


// ✅ Gọi supportchat nếu có
//const sc = document.createElement("script");
//sc.src = "/js/supportchat.js";
//document.body.appendChild(sc);

