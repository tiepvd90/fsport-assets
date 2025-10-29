/* ===========================================
 * 💬 ZALO OA CHAT WIDGET — FunSport
 * Tự động nhúng chat widget Zalo OA vào website
 * =========================================== */

(function () {
  const ZALO_OA_ID = "3913722836443497435"; // OA ID của bạn
  const ZALO_DIV_ID = "zaloChatWidget";

  // Nếu đã tồn tại thì không tạo lại
  if (document.getElementById(ZALO_DIV_ID)) return;

  // Tạo div chat
  const zaloDiv = document.createElement("div");
  zaloDiv.id = ZALO_DIV_ID;
  zaloDiv.className = "zalo-chat-widget";
  zaloDiv.setAttribute("data-oaid", ZALO_OA_ID);
  zaloDiv.setAttribute("data-welcome-message", "EM CÓ THỂ GIÚP GÌ ANH/CHỊ Ạ?");
  zaloDiv.setAttribute("data-autopopup", "0");
  zaloDiv.setAttribute("data-width", "");
  zaloDiv.setAttribute("data-height", "");

  // Thêm widget vào cuối body
  document.body.appendChild(zaloDiv);

  // Thêm SDK của Zalo
  const zaloScript = document.createElement("script");
  zaloScript.src = "https://sp.zalo.me/plugins/sdk.js";
  zaloScript.async = true;

  document.body.appendChild(zaloScript);
})();
