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
/* ===========================
   ✅ FAKE NOTIFY BẮT ĐẦU Ở ĐÂY
   =========================== */

// 🟢 Danh sách user
const userPool = [
  "TuanTran", "M**n", "HuyenLe", "AnhT***", "B***Ngoc",
  "HoangA***", "L***Huong", "Q***Khanh", "P***Thao", "KimL***",
  "MyLinh", "ThanhT***", "NgocA***", "VanK***", "HaiD***",
  "ThuT***", "DucH***", "NhatM***", "B***Tram", "GiaB***",
  "KhanhL***", "LienH***", "Phuoc***", "ThaoN***", "Vuong***",
  "NamPh***", "HieuT***", "T***Anh", "LinhD***", "Phat***",
  "T***Trang", "BaoN***", "Quynh***", "D***Tien", "HoaiA***",
  "AnK***", "PhongL***", "Dieu***", "H***Phat", "MaiL***",
  "Khang***", "SonT***", "YenL***", "Toan***", "Huong***",
  "Kiet***", "VyL***", "LocT***", "Trang***", "Trung***"
];

// 🟠 Danh sách sản phẩm
const productPool = [
  "Vợt Phantom", "Vợt Gen4 Hồng", "Vợt AirForce", "Vợt Teflon", 
  "Vợt Rồng Đen", "Vợt Gen4 Xám", "Vợt T700 Pro", "Vợt AirForce", "Thuyền SUP", "Vợt Rồng Trắng"
];

// 🔵 Danh sách hành động
const actionPool = [
    "Vừa Đặt Mua", "Vừa Thêm Vào Giỏ"
];

// ✅ Hàm chọn ngẫu nhiên
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ✅ Hiển thị popup
function showFakeNotification() {
  const user = randomItem(userPool);
  const product = randomItem(productPool);
  const action = randomItem(actionPool);

  const popup = document.getElementById("fakeNotification");
  if (!popup) return; // nếu chưa có div thì thoát

  popup.textContent = `${user} ${action} ${product}`;
  popup.style.left = "20px"; // trượt vào

  setTimeout(() => {
    popup.style.left = "-400px"; // trượt ra
  }, 5000);

  // Random lại thời gian hiển thị tiếp theo (20–40 giây)
  const nextTime = Math.floor(Math.random() * 10000) + 10000;
  setTimeout(showFakeNotification, nextTime);
}

// ✅ Khởi động fake notify sau khi DOM load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(showFakeNotification, 5000);
});
