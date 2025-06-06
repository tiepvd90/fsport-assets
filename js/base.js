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

// ✅ Hiện/ẩn sticky footer
function toggleFooter(show) {
  const footer = document.querySelector(".sticky-footer");
  if (footer) footer.style.display = show ? "flex" : "none";
}

// ✅ Hiện/ẩn popup form (giỏ hàng)
function toggleForm(show = true) {
  const form = document.getElementById("slideForm");
  const footer = document.querySelector(".sticky-footer");

  if (form && footer) {
    if (show) {
      form.classList.remove("hidden");
      form.style.bottom = "0"; // ✅ Hiệu ứng trượt lên
      footer.style.display = "none";
      scrollToTop();
    } else {
      form.style.bottom = "-100%"; // ✅ Trượt xuống
      setTimeout(() => form.classList.add("hidden"), 400); // Delay để ẩn sau animation
      footer.style.display = "flex";
    }
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
