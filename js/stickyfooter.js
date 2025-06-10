// ✅ Script xử lý Sticky Footer
function tryOpenCartPopup(attempt = 1) {
  if (typeof toggleCartPopup === "function") {
    console.log("✅ Gọi toggleCartPopup");
    toggleCartPopup(true);
  } else if (attempt < 5) {
    console.warn(`🔁 Đợi cartpopup.js (lần ${attempt})...`);
    setTimeout(() => tryOpenCartPopup(attempt + 1), 200);
  } else {
    console.error("❌ toggleCartPopup chưa sẵn sàng.");
  }
}

// ✅ Đợi 300ms sau DOM inject để gắn sự kiện
setTimeout(() => {
  const btnAtc = document.getElementById("btn-atc");
  const callLink = document.getElementById("call-link");
  const chatLink = document.getElementById("chat-link");

  console.log("🔍 Kiểm tra DOM:");
  console.log(" - btnAtc:", btnAtc);
  console.log(" - callLink:", callLink);
  console.log(" - chatLink:", chatLink);

  if (btnAtc) {
    btnAtc.addEventListener("click", () => {
      const loai = window.productCategory || window.loai || "unknown";
      console.log("🧪 Đã click nút ATC:", loai);

      if (typeof trackBothPixels === "function") {
        trackBothPixels("AddToCart", {
          content_name: "click_btn_atc_" + loai,
          content_category: loai
        });
      } else {
        console.warn("⚠️ trackBothPixels chưa tồn tại");
      }

      tryOpenCartPopup();
    });
  } else {
    console.error("❌ Không tìm thấy nút btn-atc trong DOM");
  }

  fetch("https://friendly-kitten-d760ff.netlify.app/json/settings.json")
    .then(res => res.json())
    .then(data => {
      if (callLink && data.tel) callLink.href = "tel:" + data.tel;
      if (chatLink && data["fb-page"]) chatLink.href = data["fb-page"];
      console.log("✅ Đã cập nhật call/chat link từ settings.json");
    })
    .catch(err => console.warn("⚠️ Lỗi tải settings.json:", err));
}, 300);
