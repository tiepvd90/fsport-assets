// ===================================================
// ✅ THANKS AND UPSELL MODULE
// ===================================================

window.thanksAndUpsell = (function () {
  const popup = document.getElementById("thankyouPopup");
  const upsellBlock = document.getElementById("upsellBlock");
  const upsellBtn = document.getElementById("upsellBtn");
  const upsellStatus = document.getElementById("upsellStatus");

  let hasUpsellBeenClicked = false;

  // 🧠 Hàm chính để hiển thị popup cảm ơn + upsell nếu cần
  function show({ category = "", name = "", phone = "", address = "" } = {}) {
    if (!popup) return;

    // Reset trạng thái
    if (upsellBlock) upsellBlock.style.display = "none";
    if (upsellStatus) upsellStatus.classList.add("hidden");
    if (upsellBtn) {
      upsellBtn.disabled = false;
      upsellBtn.innerText = "MUA THÊM 5 BÓNG";
    }
    hasUpsellBeenClicked = false;

    // Nếu là đơn hàng pickleball → hiện upsell
    if (category.toLowerCase() === "pickleball") {
      if (upsellBlock) upsellBlock.style.display = "block";
    }

    // Hiển thị popup
    popup.style.display = "flex";
    document.body.style.overflow = "hidden";

    // (Tuỳ chọn) lưu thông tin nếu cần sau này
    window._lastCustomerInfo = { name, phone, address };
  }

  // 🧼 Đóng popup cảm ơn
  function hide() {
    if (popup) popup.style.display = "none";
    document.body.style.overflow = "auto";
  }

  // 🚀 Khi khách nhấn MUA THÊM 5 BÓNG
  function handleUpsellOrder() {
    if (hasUpsellBeenClicked) return;
    hasUpsellBeenClicked = true;

    // Dữ liệu đơn upsell
    const upsellData = {
      id: "bongthidau",
      name: window._lastCustomerInfo?.name || "",
      phone: window._lastCustomerInfo?.phone || "",
      address: window._lastCustomerInfo?.address || "",
      quantity: 5,
      price: 26000,
      total: 130000,
      source: "upsell"
    };

    fetch("https://hook.eu2.make.com/your-upsell-hook-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upsellData)
    })
      .then(() => {
        if (upsellBtn) {
          upsellBtn.innerText = "ĐÃ MUA";
          upsellBtn.disabled = true;
        }
        if (upsellStatus) {
          upsellStatus.classList.remove("hidden");
        }
      })
      .catch(err => {
        console.error("❌ Lỗi gửi đơn upsell:", err);
        alert("Có lỗi khi thêm sản phẩm upsell. Vui lòng thử lại sau.");
        hasUpsellBeenClicked = false;
      });
  }

  // Export
  return {
    show,
    hide,
    handleUpsellOrder
  };
})();
