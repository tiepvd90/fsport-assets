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

document.addEventListener("DOMContentLoaded", () => {
  const btnAtc = document.getElementById("btn-atc");
  const callLink = document.getElementById("call-link");
  const chatLink = document.getElementById("chat-link");

  if (btnAtc) {
    btnAtc.addEventListener("click", () => {
      const loai = window.productCategory || window.loai || "unknown";
      console.log("🛒 Click btn-atc:", loai);

      if (typeof trackBothPixels === "function") {
        trackBothPixels("AddToCart", {
          content_name: "click_btn_atc_" + loai,
          content_category: loai
        });
      } else {
        console.warn("⚠️ Hàm trackBothPixels không tồn tại");
      }

      tryOpenCartPopup();
    });
  }

  fetch("https://friendly-kitten-d760ff.netlify.app/json/settings.json")
    .then(res => res.json())
    .then(data => {
      if (callLink && data.tel) callLink.href = "tel:" + data.tel;
      if (chatLink && data["fb-page"]) chatLink.href = data["fb-page"];
    })
    .catch(err => console.warn("⚠️ Lỗi tải settings.json:", err));
});
