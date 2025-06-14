function initStickyHeader() {
  console.log("✅ initStickyHeader chạy");

  const cartBtn = document.getElementById("cartBtn");
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      console.log("🛒 [DEBUG] Icon giỏ hàng đã được click.");
      if (typeof toggleCheckoutPopup === "function") {
        toggleCheckoutPopup(true);
      } else {
        alert("⚠️ Giỏ hàng chưa hoạt động – thiếu hàm toggleCheckoutPopup!");
        console.warn("⚠️ toggleCheckoutPopup chưa được định nghĩa.");
      }
    });
  }
}
