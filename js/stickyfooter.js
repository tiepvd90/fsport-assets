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

// ✅ DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  const btnAtc = document.getElementById("btn-atc");
  const callLink = document.getElementById("call-link");
  const chatLink = document.getElementById("chat-link");

  // 🔶 Nếu là đúng productPage = "ysandal5568" thì thay nút bằng Shopee
  if (window.productPage === "ysandal5568" && btnAtc) {
    btnAtc.textContent = "MUA TẠI SHOPEE";
    btnAtc.classList.add("shopee"); // style cam trong stickyfooter.css
    btnAtc.onclick = () => {
      if (typeof trackBothPixels === "function") {
        trackBothPixels("InitiateCheckout", {
          content_name: "ysandal5568",
          source: "Shopee"
        });
      }
      window.open("https://s.shopee.vn/2B5tYCe5Ui", "_blank");
    };
  } else {
    // 🛒 Các sản phẩm khác thì giữ logic giỏ hàng
    if (btnAtc) {
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

  // ☎️ Call/chat link từ settings.json
  fetch("https://friendly-kitten-d760ff.netlify.app/json/settings.json")
    .then(res => res.json())
    .then(data => {
      if (callLink && data.tel) callLink.href = "tel:" + data.tel;
      if (chatLink && data["fb-page"]) chatLink.href = data["fb-page"];
    })
    .catch(() => {});
});

// ✅ Ép stickyfooter hiển thị chắc chắn ở mọi môi trường
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
