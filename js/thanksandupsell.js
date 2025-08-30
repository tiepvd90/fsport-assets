// ===================================================
// ✅ THANKS & UPSELL MODULE (v2)
// - 1 popup duy nhất: luôn có khối "Cảm ơn" tối giản
// - Nếu category === "pickleball" → hiển thị thêm khối upsell bóng ở TRÊN
// - Tương thích inject HTML muộn (refresh refs mỗi lần gọi)
// ===================================================

(function () {
  // ---- Config có thể chỉnh nhanh tại đây ----
  const CONFIG = {
    UPSOLD_ID: "bongthidau",
    UNIT_PRICE: 26000,          // giá 1 bóng
    QUANTITY: 5,                // combo 5 bóng
    TOTAL_PRICE: 130000,        // giá sau ưu đãi
    HOOK_URL: "https://hook.eu2.make.com/your-upsell-hook-id", // 🔁 THAY bằng hook thực tế
    BTN_LABEL_DEFAULT: "THÊM COMBO 5 BÓNG – 130.000₫",
    BTN_LABEL_DONE: "ĐÃ THÊM COMBO",
  };

  // ---- Ref DOM: luôn làm tươi để hỗ trợ inject HTML muộn ----
  const refs = {};
  function refreshRefs() {
    refs.popup = document.getElementById("thankyouPopup");
    refs.upsellBlock = document.getElementById("upsellBlock");
    refs.upsellBtn = document.getElementById("upsellBtn");
    refs.upsellStatus = document.getElementById("upsellStatus");
  }

  // ---- State ----
  let hasUpsellBeenClicked = false;

  // ---- Helper: lấy category hiệu lực theo trang ----
  function getEffectiveCategory(category) {
    return (category || window.productCategory || "").toLowerCase();
  }

  // ---------------------------------------------------
  // 🧠 SHOW: mở popup cảm ơn, và tùy theo category sẽ bật upsell
  // ---------------------------------------------------
  function show({ category = "", name = "", phone = "", address = "" } = {}) {
    refreshRefs();
    const popup = refs.popup;
    const upsellBlock = refs.upsellBlock;
    const upsellBtn = refs.upsellBtn;
    const upsellStatus = refs.upsellStatus;

    if (!popup) return;

    const effectiveCategory = getEffectiveCategory(category);

    // Reset UI
    if (upsellBlock) upsellBlock.classList.add("hidden");
    if (upsellStatus) upsellStatus.classList.add("hidden");
    if (upsellBtn) {
      upsellBtn.disabled = false;
      upsellBtn.innerText = CONFIG.BTN_LABEL_DEFAULT;
    }
    hasUpsellBeenClicked = false;

    // Chỉ hiện upsell nếu là pickleball
    if (effectiveCategory === "pickleball" && upsellBlock) {
      upsellBlock.classList.remove("hidden");
    }

    // Mở popup
    popup.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Lưu info khách cho đơn upsell
    window._lastCustomerInfo = { name, phone, address };
  }

  // ---------------------------------------------------
  // 🧼 HIDE: đóng popup
  // ---------------------------------------------------
  function hide() {
    refreshRefs();
    const popup = refs.popup;
    if (popup) popup.style.display = "none";
    document.body.style.overflow = "auto";
  }

  // ---------------------------------------------------
  // 🚀 HANDLE UPSELL ORDER: gửi yêu cầu mua combo bóng
  // ---------------------------------------------------
  function handleUpsellOrder() {
    refreshRefs();
    const upsellBtn = refs.upsellBtn;
    const upsellStatus = refs.upsellStatus;

    if (hasUpsellBeenClicked) return;
    hasUpsellBeenClicked = true;

    const upsellData = {
      id: CONFIG.UPSOLD_ID,
      name: window._lastCustomerInfo?.name || "",
      phone: window._lastCustomerInfo?.phone || "",
      address: window._lastCustomerInfo?.address || "",
      quantity: CONFIG.QUANTITY,
      price: CONFIG.UNIT_PRICE,
      total: CONFIG.TOTAL_PRICE,
      source: "thankyouPopup-upsell",
    };

    fetch(CONFIG.HOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upsellData),
    })
      .then(() => {
        if (upsellBtn) {
          upsellBtn.innerText = CONFIG.BTN_LABEL_DONE;
          upsellBtn.disabled = true;
        }
        if (upsellStatus) upsellStatus.classList.remove("hidden");
      })
      .catch((err) => {
        console.error("❌ Lỗi gửi đơn upsell:", err);
        alert("Có lỗi khi thêm sản phẩm upsell. Vui lòng thử lại sau.");
        hasUpsellBeenClicked = false;
      });
  }

  // ---------------------------------------------------
  // 🌐 Export ra global
  // ---------------------------------------------------
  window.thanksAndUpsell = {
    show,
    hide,
    handleUpsellOrder,
  };
})();
