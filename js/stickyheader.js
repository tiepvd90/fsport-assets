// Gọi sau khi stickyheader.html đã được inject xong
function initStickyHeader() {
  const cartIcon = document.getElementById("cartIcon");

  if (!cartIcon) {
    console.error("❌ Không tìm thấy phần tử #cartIcon trong DOM.");
    return;
  }

  cartIcon.addEventListener("click", () => {
    console.log("🛒 [DEBUG] Icon giỏ hàng đã được click.");

    if (typeof toggleCheckoutPopup === "function") {
      console.log("✅ [DEBUG] Gọi toggleCheckoutPopup(true)");
      toggleCheckoutPopup(true);
    } else {
      console.warn("⚠️ [DEBUG] Hàm toggleCheckoutPopup chưa được định nghĩa.");
      alert("⚠️ Giỏ hàng chưa hoạt động – thiếu hàm toggleCheckoutPopup!");
    }
  });
}
