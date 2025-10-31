/* ==========================================================
 *  🎯 OUTBOUND CLICK TRACKER — fun-sport.co
 *  Mục đích: Gửi dữ liệu click sang Make.com (Google Sheet)
 *  Author: F-Sport Dev
 *  ========================================================== */

(function () {
  const MAKE_WEBHOOK = "https://hook.eu2.make.com/47xaye20idohgs8qts584amkh6yjacmn";

  /**
   * Gửi dữ liệu click đến Make webhook
   * @param {Object} data - Dữ liệu cần gửi
   */
  function sendOutboundData(data) {
    try {
      // Ưu tiên sendBeacon (chạy ngầm, không chặn redirect)
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      if (!navigator.sendBeacon(MAKE_WEBHOOK, blob)) throw new Error("Beacon failed");
    } catch (err) {
      // Fallback sang fetch nếu trình duyệt không hỗ trợ sendBeacon
      fetch(MAKE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch((e) => console.warn("Fetch outbound error:", e));
    }
  }

  /**
   * Hàm chính: gửi log và mở link
   */
  window.trackOutboundClick = function () {
    const payload = {
      productPage: window.productPage || "",
      productCategory: window.productCategory || "",
      destinationURL: window.shopeeLink || "",
      timestamp: new Date().toISOString(),
    };

    sendOutboundData(payload);

    // Chuyển hướng sang Shopee (mở tab mới để tránh bị popup-block)
    if (window.shopeeLink) {
      window.open(window.shopeeLink, "_blank");
    } else {
      console.warn("⚠️ Không tìm thấy window.shopeeLink!");
    }
  };

  console.log("✅ Outbound click tracker loaded");
})();
