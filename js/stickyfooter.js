function isMetaInApp() {
  const ua = navigator.userAgent || "";
  const ref = document.referrer || "";

  // Check UserAgent
  const uaMatch =
    /(FBAN|FBAV|FBBV|FBDV|FB_IAB|FB4A|FBIOS|Instagram|IGAPP|IG_VERSION)/i.test(ua);

  // Check Referrer
  const refMatch = /(facebook\.com|instagram\.com)/i.test(ref);

  return uaMatch || refMatch;
}

// 👉 Dùng thử
if (isMetaInApp()) {
  console.log("✅ Đang chạy trong Facebook/Instagram in-app browser");
  document.body.classList.add("inapp-meta");
} else {
  console.log("🌐 Trình duyệt thường (Chrome/Safari)");
}

// ✅ Auto load cartpopup JS
(function loadCartPopupJS() {
  const type = window.cartpopupType || "cartpopup"; // fallback mặc định
  const script = document.createElement("script");
  script.src = `/js/${type}.js`;
  script.onload = () => console.log(`✅ Loaded: ${script.src}`);
  script.onerror = () => console.error(`❌ Failed to load: ${script.src}`);
  document.body.appendChild(script);
})();

// ✅ Hàm gọi popup giỏ hàng với retry
function tryOpenCartPopup(attempt = 1) {
  if (typeof toggleCartPopup === "function") {
    console.log("✅ Gọi toggleCartPopup");
    toggleCartPopup(true);
  } else if (attempt < 5) {
    console.warn(`🔁 Chờ cartpopup JS (lần ${attempt})...`);
    setTimeout(() => tryOpenCartPopup(attempt + 1), 250);
  } else {
    console.error("❌ toggleCartPopup chưa sẵn sàng sau nhiều lần thử.");
  }
}

// ✅ DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  const btnAtc = document.getElementById("btn-atc");
  const callLink = document.getElementById("call-link");
  const chatLink = document.getElementById("chat-link");

  console.log("🔍 StickyFooter DOM Ready:");
  console.log(" - btnAtc:", btnAtc);
  console.log(" - callLink:", callLink);
  console.log(" - chatLink:", chatLink);

  // 🛒 Sự kiện click "THÊM VÀO GIỎ HÀNG"
  if (btnAtc) {
    btnAtc.addEventListener("click", () => {
      const loai = window.productCategory || window.loai || "unknown";
      console.log("🔥 Click StickyFooter ATC:", loai);

      // Gửi Pixel event nếu có hàm trackBothPixels
      if (typeof trackBothPixels === "function") {
        trackBothPixels("AddToWishlist", {
          content_name: "click_btn_atc_" + loai,
          content_category: loai
        });
      }

      tryOpenCartPopup();
    });
  } else {
    console.error("❌ Không tìm thấy nút btn-atc trong DOM");
  }

  // ☎️ Cập nhật link call/chat từ settings.json
  fetch("https://friendly-kitten-d760ff.netlify.app/json/settings.json")
    .then(res => res.json())
    .then(data => {
      if (callLink && data.tel) {
        callLink.href = "tel:" + data.tel;
      }
      if (chatLink && data["fb-page"]) {
        chatLink.href = data["fb-page"];
      }
      console.log("✅ Đã cập nhật call/chat link từ settings.json");
    })
    .catch(err => console.warn("⚠️ Lỗi tải settings.json:", err));
});

// ✅ Fix: ép stickyfooter hiển thị nếu in-app browser render sai
window.addEventListener("load", () => {
  const footer = document.querySelector(".sticky-footer");
  if (footer && footer.getBoundingClientRect().height < 10) {
    footer.style.display = "flex";
    footer.style.height = "60px";
    console.log("⚡ Ép sticky-footer hiển thị lại (in-app fix)");
  }
});
