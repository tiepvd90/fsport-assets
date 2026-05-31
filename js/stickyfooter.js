// ✅ TỰ ĐỘNG LOAD FILE cartpopup JS TƯƠNG ỨNG
(function loadCartPopupJS() {
  const type = window.cartpopupType || "cartpopup"; // fallback mặc định
  const script = document.createElement("script");
  script.src = `/js/${type}.js`;
  script.onload = () => console.log(`✅ Loaded: ${script.src}`);
  script.onerror = () => console.error(`❌ Failed to load: ${script.src}`);
  document.body.appendChild(script);
})();

// ✅ GỌI POPUP GIỎ HÀNG
function tryOpenCartPopup(attempt = 1) {
  if (typeof toggleCartPopup === "function") {
    console.log("✅ Gọi toggleCartPopup");
    toggleCartPopup(true);
  } else if (attempt < 5) {
    console.warn(`🔁 Đợi cartpopup JS (lần ${attempt})...`);
    setTimeout(() => tryOpenCartPopup(attempt + 1), 200);
  } else {
    console.error("❌ toggleCartPopup chưa sẵn sàng.");
  }
}

// ✅ ĐỢI DOM XONG MỚI GẮN SỰ KIỆN
setTimeout(() => {
  const btnAtc = document.getElementById("btn-atc");
  const callLink = document.getElementById("call-link");
  const chatLink = document.getElementById("chat-link");

  console.log("🔍 Kiểm tra DOM:");
  console.log(" - btnAtc:", btnAtc);
  console.log(" - callLink:", callLink);
  console.log(" - chatLink:", chatLink);

  // ✅ BẮT SỰ KIỆN NÚT "THÊM VÀO GIỎ HÀNG"
  if (btnAtc) {
    btnAtc.addEventListener("click", () => {
  const loai = window.productCategory || window.loai || "unknown";
  console.log("🔥 ĐÃ CLICK STICKY Footer button", loai);

  // ✅ Gửi đúng event bạn muốn
  if (typeof trackBothPixels === "function") {
    trackBothPixels("AddToWishlist", {
      content_name: "click_btn_atc_" + loai,
      content_category: loai
    });
  }

  // ✅ Analytics nội bộ
  if (typeof window.fsport !== 'undefined') {
    window.fsport.track('wishlist_add', {
      product_id: window.productPage || loai,
      product_name: window.productName || null
    })
  }

  tryOpenCartPopup();
});
  } else {
    console.error("❌ Không tìm thấy nút btn-atc trong DOM");
  }

  // ✅ CẬP NHẬT LINK GỌI/CHAT TỪ settings.json
  fetch("https://friendly-kitten-d760ff.netlify.app/json/settings.json")
    .then(res => res.json())
    .then(data => {
      if (callLink && data.tel) callLink.href = "tel:" + data.tel;
      if (chatLink && data["fb-page"]) chatLink.href = data["fb-page"];
      console.log("✅ Đã cập nhật call/chat link từ settings.json");
    })
    .catch(err => console.warn("⚠️ Lỗi tải settings.json:", err));
}, 300);
