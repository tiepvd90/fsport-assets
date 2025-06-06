// ✅ Gắn sự kiện mở form giỏ hàng khi bấm nút ở sticky footer
document.addEventListener("DOMContentLoaded", () => {
  const btnATC = document.getElementById("btn-atc");
  if (btnATC) {
    btnATC.addEventListener("click", () => {
      toggleForm(true); // Gọi hàm từ base.js
    });
  }
});
