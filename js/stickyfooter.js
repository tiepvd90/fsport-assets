// ✅ Auto load cartpopup JS
(function loadCartPopupJS() {
  const type = window.cartpopupType || "cartpopup";
  const script = document.createElement("script");
  script.src = `/js/${type}.js`;
  script.onload = () => console.log(`✅ Loaded: ${script.src}`);
  script.onerror = () => console.error(`❌ Failed to load: ${script.src}`);
  document.body.appendChild(script);
})();

// ✅ Gọi popup giỏ hàng
function tryOpenCartPopup(attempt = 1) {
  if (typeof toggleCartPopup === "function") {
    toggleCartPopup(true);
  } else if (attempt < 5) {
    setTimeout(() => tryOpenCartPopup(attempt + 1), 250);
  } else {
    console.error("❌ toggleCartPopup chưa sẵn sàng.");
  }
}

// 🔎 Nhận diện chắc chắn trang ysandal5568 (global var + URL + data-attr)
function isYS5568Page() {
  const fromVar = (window.productPage || "").toLowerCase();
  const fromPath = (location.pathname || "").toLowerCase();
  const fromMeta = (document.querySelector("[data-product-page]")?.getAttribute("data-product-page") || "").toLowerCase();
  const joined = `${fromVar} ${fromPath} ${fromMeta}`;
  const match = /ysandal\s*5568|ysandal5568|\/product\/ysandal5568/.test(joined);
  console.log("stickyfooter detect:", { productPage: window.productPage, path: fromPath, meta: fromMeta, isYS5568: match });
  return match;
}

// ✅ DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  const btnAtc = document.getElementById("btn-atc");
  const callLink = document.getElementById("call-link");
  const chatLink = document.getElementById("chat-link");
  const isYS5568 = isYS5568Page();

  if (btnAtc) {
    if (isYS5568) {
      // 🔶 Chỉ riêng dép 5568: đổi thành nút Shopee (giữ nguyên chiều dài)
      btnAtc.textContent = "MUA TẠI SHOPEE";
      btnAtc.classList.add("shopee"); // màu cam đã có trong CSS
      btnAtc.onclick = () => {
        // (tuỳ chọn) bắn pixel riêng
        if (typeof trackBothPixels === "function") {
          trackBothPixels("InitiateCheckout", { source: "Shopee", content_name: "ysandal5568" });
        }
        window.open("https://s.shopee.vn/2B5tYCe5Ui", "_blank");
      };
    } else {
      // 🛒 Các trang khác: giữ nút THÊM VÀO GIỎ HÀNG
      btnAtc.addEventListener("click", () => {
        const loai = window.productCategory || window.loai || "unknown";
        if (typeof trackBothPixels === "function") {
          trackBothPixels("AddToWishlist", {
            content_name: "click_btn_atc_" + loai,
            content_category: loai
          });
        }
        tryOpenCartPopup();
      });
    }
  }

  // ☎️ Cập nhật link call/chat từ settings.json (không chặn lỗi)
  fetch("https://friendly-kitten-d760ff.netlify.app/json/settings.json")
    .then(res => res.json())
    .then(data => {
      if (callLink && data.tel) callLink.href = "tel:" + data.tel;
      if (chatLink && data["fb-page"]) chatLink.href = data["fb-page"];
    })
    .catch(() => {});
});

// ✅ Ép stickyfooter hiển thị chắc chắn ở mọi môi trường (in-app)
window.addEventListener("load", () => {
  const footer = document.querySelector(".sticky-footer");
  if (footer) {
    footer.style.position = "fixed";
    footer.style.bottom = "0";
    footer.style.left = "0";
    footer.style.right = "0";
    footer.style.width = "100%";
    footer.style.zIndex = "2147483647";
    if (footer.getBoundingClientRect().height < 10) {
      footer.style.display = "flex";
      footer.style.height = "60px";
    }
  }
});
