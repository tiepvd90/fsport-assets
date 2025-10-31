/* ==========================================================
 * 🎯 OUTBOUND CLICK TRACKER — fun-sport.co
 * Mục đích: gửi log click về Make.com webhook
 * ========================================================== */

(function () {
  const WEBHOOK_URL = "https://hook.eu2.make.com/47xaye20idohgs8qts584amkh6yjacmn";

  window.trackOutboundClick = function () {
    const payload = {
      productPage: window.productPage || "",
      productCategory: window.productCategory || "",
      destinationURL: window.shopeeLink || "",
      timestamp: new Date().toISOString(),
    };

    // ✅ Gửi log (sendBeacon trước, fetch fallback)
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      if (!navigator.sendBeacon(WEBHOOK_URL, blob)) throw new Error("Beacon failed");
      console.log("✅ Outbound click: beacon sent");
    } catch (err) {
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => console.log("✅ Outbound click: fetch sent"))
        .catch((e) => console.warn("⚠️ Outbound click error:", e));
    }

    // ✅ Mở link Shopee
    if (window.shopeeLink) {
      window.open(window.shopeeLink, "_blank");
    } else {
      console.warn("⚠️ Không tìm thấy window.shopeeLink");
    }
  };

  console.log("✅ outbound-click.js loaded");
})();
