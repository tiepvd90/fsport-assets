// ✅ template01.js – Xử lý hiển thị giá Flash Sale cho từng productPage

(function () {
  // 🐞 Debug để kiểm tra giá trị truyền vào
  console.log("🟡 [template01.js] window.productPage =", window.productPage);

  // ✅ Danh sách giá theo trang sản phẩm
  const priceMap = {
    "pickleball-bag": "269.000đ",
    "meikan": "80.000đ - 120.000đ",
    "gaiter": "49.000đ"
    // ➕ Thêm sản phẩm khác ở đây nếu cần
  };

  // ✅ Lấy tên sản phẩm đang xem
  const productPage = window.productPage || "default";

  // ✅ Lấy giá theo productPage (nếu không có thì fallback)
  const flashPrice = priceMap[productPage] || "Từ 49K";

  // ✅ Gán giá vào DOM
  const priceEl = document.getElementById("flashSalePrice");
  if (priceEl) {
    priceEl.textContent = flashPrice;
  } else {
    console.warn("⚠️ [template01.js] Không tìm thấy phần tử #flashSalePrice");
  }
})();
