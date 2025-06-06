// ✅ Fix iOS zoom khi focus input
document.querySelectorAll("input, select, textarea").forEach((el) => {
  el.addEventListener("touchstart", () => {
    document.documentElement.style.fontSize = "16px";
  });
});

// ✅ Scroll to top khi mở popup (tuỳ lúc gọi)
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ✅ Toggle sticky footer
function toggleFooter(show) {
  const footer = document.querySelector(".sticky-footer");
  if (footer) footer.style.display = show ? "flex" : "none";
}

// ✅ Toggle slideForm (giỏ hàng)
function toggleForm(show = true) {
  const form = document.getElementById("slideForm");
  if (!form) return;

  if (show) {
    form.classList.remove("hidden");
    toggleFooter(false);
  } else {
    form.classList.add("hidden");
    toggleFooter(true);
  }
}

// ✅ Gắn nút đóng popup (dùng class .close-popup)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".close-popup").forEach((btn) => {
    btn.addEventListener("click", () => toggleForm(false));
  });
});

// ✅ Auto hide mascot khi popup mở
const observer = new MutationObserver(() => {
  const isPopupVisible = !document.getElementById("slideForm")?.classList.contains("hidden");
  const mascot = document.getElementById("mascot-container");
  if (mascot) mascot.style.display = isPopupVisible ? "none" : "block";
});
observer.observe(document.body, { childList: true, subtree: true });

// ✅ Format tiền
function formatPrice(vnd) {
  return vnd.toLocaleString("vi-VN") + "đ";
}
