/* ======================================================
 * 🎯 OUTBOUND CLICK TRACKER — fun-sport.co (SYNCED FINAL)
 * Gửi log click về Make.com và chuyển hướng Shopee (same tab)
 * ====================================================== */

(function () {
  const WEBHOOK_URL = "https://hook.eu2.make.com/lpksqwgx4jid73t2uewg6md9279h276y";

  window.trackOutboundClick = function () {
    const payload = {
      productPage: window.productPage || "",
      productCategory: window.productCategory || "",
      destinationURL: window.shopeeLink || "",
      timestamp: new Date().toISOString(),
    };

    console.log("🧭 Gửi dữ liệu click:", payload);

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Webhook POST failed");
        console.log("✅ Đã gửi log click thành công về Make.com");
      })
      .catch((err) => {
        console.warn("⚠️ Lỗi khi gửi log:", err);
      })
      .finally(() => {
        // ✅ Chuyển hướng Shopee trong cùng tab (trải nghiệm tốt hơn trên mobile)
        if (window.shopeeLink) {
          window.open(window.shopeeLink, "_blank");
        } else {
          alert("⚠️ Thiếu window.shopeeLink — không thể mở Shopee!");
        }
      });
  };

  console.log("✅ outbound-click.js (FINAL SYNC) loaded");
})();
