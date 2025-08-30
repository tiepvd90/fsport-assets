// ===================================================
// ✅ THANKS & UPSELL BRIDGE (TƯƠNG THÍCH checkoutpopup.js)
// - Không sửa checkoutpopup.js
// - Tự động "bọc" showThankyouPopup()/hideThankyouPopup() để:
//   + Bật/tắt upsell theo window.productCategory
//   + Gửi upsell khi bấm nút
// - Có critical inline styles để overlay luôn hiện nếu CSS chưa tải
// ===================================================

(function () {
  console.log("[thanksandupsell] module loaded");

  // ---- Config nhanh ----
  const HOOK_URL    = "https://hook.eu2.make.com/your-upsell-hook-id"; // 🔁 thay bằng hook thật
  const COMBO_PRICE = 130000;
  const UNIT_PRICE  = 26000;
  const QUANTITY    = 5;

  // ---- Helpers ----
  function $id(id) { return document.getElementById(id); }
  function refreshRefs() {
    return {
      popup:       $id("thankyouPopup"),
      upsellBlock: $id("upsellBlock"),
      upsellBtn:   $id("upsellBtn"),
      upsellStatus:$id("upsellStatus"),
    };
  }
  function applyCriticalOverlayStyles(popup) {
    if (!popup) return;
    popup.style.position = "fixed";
    popup.style.inset = "0";
    popup.style.background = "rgba(0,0,0,.6)";
    popup.style.zIndex = "99999";
    popup.style.display = "flex";
    popup.style.alignItems = "center";
    popup.style.justifyContent = "center";
  }
  function showUpsellAccordingToCategory(refs) {
    const pageCat = (window.productCategory || "").toLowerCase();
    if (!refs.upsellBlock) return;
    if (pageCat === "pickleball") {
      refs.upsellBlock.classList.remove("hidden");
    } else {
      refs.upsellBlock.classList.add("hidden");
    }
  }
  function resetUpsellUI(refs) {
    if (refs.upsellStatus) refs.upsellStatus.classList.add("hidden");
    if (refs.upsellBtn) {
      refs.upsellBtn.disabled = false;
      refs.upsellBtn.textContent = "THÊM COMBO 5 BÓNG – 130.000₫";
    }
  }

  // ---- Bọc các hàm global cũ nếu tồn tại, nếu chưa có thì tạo ----
  const originalShow = window.showThankyouPopup;
  const originalHide = window.hideThankyouPopup;

  window.showThankyouPopup = function () {
    const refs = refreshRefs();
    if (!refs.popup) {
      console.warn("[thanksandupsell] #thankyouPopup not found in DOM");
      return originalShow ? originalShow() : void 0;
    }

    // 1) Gọi hàm cũ (giữ hành vi: set display:flex, lock scroll)
    if (typeof originalShow === "function") {
      originalShow();
    } else {
      // Fallback nếu chưa định nghĩa: tự bật overlay + lock scroll
      applyCriticalOverlayStyles(refs.popup);
      document.body.style.overflow = "hidden";
    }

    // 2) Áp logic mới: upsell theo category + reset UI
    resetUpsellUI(refs);
    showUpsellAccordingToCategory(refs);

    // 3) Lưu info khách để gửi upsell (nếu có)
    try {
      window._lastCustomerInfo = JSON.parse(localStorage.getItem("checkoutInfo") || "{}");
    } catch { window._lastCustomerInfo = {}; }
  };

  window.hideThankyouPopup = function () {
    const refs = refreshRefs();
    if (typeof originalHide === "function") {
      return originalHide();
    }
    // Fallback
    if (refs.popup) refs.popup.style.display = "none";
    document.body.style.overflow = "auto";
  };

  // ---- Gắn handler cho nút upsell (sau khi HTML đã inject) ----
  // Vì file này được load SAU khi checkoutpopup.js append popup + script,
  // nên tại thời điểm này DOM đã có #thankyouPopup.
  (function bindUpsellButton() {
    const refs = refreshRefs();
    if (!refs.upsellBtn) return; // phòng khi HTML lỗi
    refs.upsellBtn.addEventListener("click", function () {
      if (refs.upsellBtn.disabled) return;

      const payload = {
        id: "bongthidau",
        name: (window._lastCustomerInfo && window._lastCustomerInfo.name) || "",
        phone: (window._lastCustomerInfo && window._lastCustomerInfo.phone) || "",
        address: (window._lastCustomerInfo && window._lastCustomerInfo.address) || "",
        quantity: QUANTITY,
        price: UNIT_PRICE,
        total: COMBO_PRICE,
        source: "thankyouPopup-upsell",
      };

      fetch(HOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      .then(function () {
        refs.upsellBtn.textContent = "ĐÃ THÊM COMBO";
        refs.upsellBtn.disabled = true;
        refs.upsellStatus && refs.upsellStatus.classList.remove("hidden");
      })
      .catch(function (err) {
        console.error("❌ Lỗi upsell:", err);
        alert("Có lỗi khi thêm sản phẩm upsell. Vui lòng thử lại sau.");
      });
    });
  })();

})();
