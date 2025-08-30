// ===================================================
// ✅ THANKS & UPSELL MODULE (FINAL)
// - Popup duy nhất: luôn có khối "Cảm ơn" tối giản (bên dưới)
// - Nếu category === "pickleball" → hiển thị thêm khối upsell bóng (ở TRÊN)
// - Tương thích việc inject HTML muộn qua fetch("/html/thanksandupsell.html")
// - Giữ tương thích với code cũ: showThankyouPopup()/hideThankyouPopup()
// ===================================================

(function () {
  // ====== Cấu hình nhanh ======
  const CONFIG = {
    UPSOLD_ID: "bongthidau",
    UNIT_PRICE: 26000,        // giá 1 bóng
    QUANTITY: 5,              // combo 5 bóng
    TOTAL_PRICE: 130000,      // giá combo sau ưu đãi
    // 🔁 THAY bằng hook upsell thực tế của bạn:
    HOOK_URL: "https://hook.eu2.make.com/your-upsell-hook-id",
    BTN_LABEL_DEFAULT: "THÊM COMBO 5 BÓNG – 130.000₫",
    BTN_LABEL_DONE: "ĐÃ THÊM COMBO",
    INJECT_TIMEOUT_MS: 2500,  // thời gian đợi HTML được inject (ms)
  };

  // ====== Tham chiếu DOM (luôn làm tươi khi dùng) ======
  const refs = {};
  function refreshRefs() {
    refs.popup = document.getElementById("thankyouPopup");
    refs.upsellBlock = document.getElementById("upsellBlock");
    refs.upsellBtn = document.getElementById("upsellBtn");
    refs.upsellStatus = document.getElementById("upsellStatus");
  }

  // Chờ HTML đã được inject vào DOM (nếu load muộn)
  function ensureInjected(timeoutMs = CONFIG.INJECT_TIMEOUT_MS) {
    return new Promise((resolve) => {
      refreshRefs();
      if (refs.popup) return resolve(true);

      const start = Date.now();
      const iv = setInterval(() => {
        refreshRefs();
        const ok = !!refs.popup;
        const expired = Date.now() - start > timeoutMs;
        if (ok || expired) {
          clearInterval(iv);
          resolve(ok);
        }
      }, 50);
    });
  }

  // ====== State ======
  let hasUpsellBeenClicked = false;

  // ====== Helpers ======
  function getEffectiveCategory(category) {
    return (category || window.productCategory || "").toLowerCase();
  }

  function resetUpsellUI() {
    const { upsellBlock, upsellBtn, upsellStatus } = refs;
    if (upsellBlock) upsellBlock.classList.add("hidden");
    if (upsellStatus) upsellStatus.classList.add("hidden");
    if (upsellBtn) {
      upsellBtn.disabled = false;
      upsellBtn.innerText = CONFIG.BTN_LABEL_DEFAULT;
    }
    hasUpsellBeenClicked = false;
  }

  // ===================================================
  // 🧠 SHOW: mở popup cảm ơn + upsell (nếu pickleball)
  // ===================================================
  async function show({ category = "", name = "", phone = "", address = "" } = {}) {
    const injected = await ensureInjected();
    if (!injected) {
      console.warn("[thanksAndUpsell] Không tìm thấy #thankyouPopup. Kiểm tra /html/thanksandupsell.html đã được inject.");
      return;
    }

    const popup = refs.popup;
    const upsellBlock = refs.upsellBlock;

    // Reset UI mỗi lần mở
    resetUpsellUI();

    // Chỉ hiện upsell khi đúng category
    const effectiveCategory = getEffectiveCategory(category);
    if (effectiveCategory === "pickleball" && upsellBlock) {
      upsellBlock.classList.remove("hidden");
    }

    // Mở popup
    popup.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Lưu thông tin khách để gửi upsell
    window._lastCustomerInfo = { name, phone, address };
  }

  // ===================================================
  // 🧼 HIDE: đóng popup
  // ===================================================
  function hide() {
    refreshRefs();
    if (refs.popup) refs.popup.style.display = "none";
    document.body.style.overflow = "auto";
  }

  // ===================================================
  // 🚀 HANDLE UPSELL ORDER: gửi mua combo bóng
  // ===================================================
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

  // ===================================================
  // 🌉 Bridge tương thích: giữ nguyên code cũ gọi showThankyouPopup()
  // ===================================================
  window.showThankyouPopup = function () {
    try {
      const saved = JSON.parse(localStorage.getItem("checkoutInfo") || "{}");
      window.thanksAndUpsell?.show({
        // category sẽ tự lấy từ window.productCategory nếu không truyền
        name: saved.name || "",
        phone: saved.phone || "",
        address: saved.address || "",
      });
    } catch {
      window.thanksAndUpsell?.show();
    }
  };

  window.hideThankyouPopup = function () {
    window.thanksAndUpsell?.hide();
  };

  // ===================================================
  // 🔁 Export module
  // ===================================================
  window.thanksAndUpsell = { show, hide, handleUpsellOrder };
})();
