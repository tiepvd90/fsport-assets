// ===================================================
// ✅ THANKS & UPSELL BRIDGE (V3 - Wait for Inject)
// - KHÔNG sửa checkoutpopup.js
// - Đảm bảo: nếu showThankyouPopup() bị gọi TRƯỚC khi HTML inject xong,
//   sẽ đợi #thankyouPopup xuất hiện rồi mới hiển thị.
// - Upsell chỉ hiện khi window.productCategory === "pickleball"
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

  // ---- Đợi #thankyouPopup xuất hiện (do inject async) ----
  function waitForPopup(timeoutMs = 3000) {
    return new Promise((resolve) => {
      const { popup } = refreshRefs();
      if (popup) return resolve(true);

      const start = Date.now();
      const iv = setInterval(() => {
        const ok = !!$id("thankyouPopup");
        const expired = Date.now() - start > timeoutMs;
        if (ok || expired) {
          clearInterval(iv);
          resolve(ok);
        }
      }, 40);
    });
  }

  // ---- Bọc các hàm global cũ nếu tồn tại, nếu chưa có thì tạo ----
  const originalShow = window.showThankyouPopup;
  const originalHide = window.hideThankyouPopup;

  window.showThankyouPopup = async function () {
    // 1) Đợi HTML inject xong
    const ready = await waitForPopup();
    const refs = refreshRefs();

    if (!ready || !refs.popup) {
      console.warn("[thanksandupsell] #thankyouPopup not found after waiting");
      // fallback: nếu có hàm cũ thì gọi, nếu không thì thôi
      if (typeof originalShow === "function") originalShow();
      return;
    }

    // 2) Gọi hàm cũ để giữ hành vi (inline display:flex + lock scroll)
    if (typeof originalShow === "function") {
      originalShow();
    } else {
      // hoặc tự bật nếu chưa có hàm cũ
      applyCriticalOverlayStyles(refs.popup);
      document.body.style.overflow = "hidden";
    }

    // 3) Áp logic upsell + reset UI
    resetUpsellUI(refs);
    showUpsellAccordingToCategory(refs);

    // 4) Lưu info khách (dùng cho upsell)
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
  (function bindUpsellButtonWithRetry() {
    // Gắn ngay nếu đã có
    let refs = refreshRefs();
    if (refs.upsellBtn) {
      attach();
      return;
    }
    // Nếu chưa có (do inject muộn), retry ngắn
    const start = Date.now();
    const iv = setInterval(() => {
      refs = refreshRefs();
      if (refs.upsellBtn || Date.now() - start > 3000) {
        clearInterval(iv);
        if (refs.upsellBtn) attach();
      }
    }, 60);

    function attach() {
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
    }
  })();

})();
