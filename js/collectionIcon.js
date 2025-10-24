/* =========================================================
 * collectionIcon.js — Hiển thị icon dẫn đến các BST cố định
 * ---------------------------------------------------------
 * ✅ Hiển thị ở mọi trang (dù trang load động)
 * ✅ Dùng position: fixed + z-index cao
 * ✅ Không phụ thuộc layout HTML
 * ========================================================= */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // ====== Kiểm tra nếu chưa có icon thì mới tạo ======
    if (!document.getElementById("bstPickleballIcon")) {
      const iconPickle = document.createElement("a");
      iconPickle.id = "bstPickleballIcon";
      iconPickle.href = "/pickleball/collection";
      iconPickle.innerHTML = `
        <img src="https://i.postimg.cc/nLZSyFgb/pickleball-icon.png" 
             alt="BST Pickleball" 
             style="width:20px;height:20px;object-fit:contain;">
        <span style="margin-top:2px;">BST</span>
      `;
      Object.assign(iconPickle.style, {
        position: "fixed",
        top: "12px",
        left: "12px",
        zIndex: "99999",
        background: "rgba(255,255,255,0.85)",
        borderRadius: "8px",
        padding: "4px 6px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        fontFamily: "'Be Vietnam Pro', sans-serif",
        textDecoration: "none",
        color: "black",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "fit-content",
        fontSize: "10px",
        lineHeight: "1.1"
      });
      document.body.appendChild(iconPickle);
    }

    // ====== Icon thứ hai: ART ======
    if (!document.getElementById("bstArtIcon")) {
      const iconArt = document.createElement("a");
      iconArt.id = "bstArtIcon";
      iconArt.href = "/art";
      iconArt.innerHTML = `
        <img src="https://cdn-icons-png.freepik.com/256/12685/12685382.png" 
             alt="BST Art" 
             style="width:21px;height:21px;object-fit:contain;">
        <span style="margin-top:2px;">BST</span>
      `;
      Object.assign(iconArt.style, {
        position: "fixed",
        top: "60px",
        left: "12px",
        zIndex: "99999",
        background: "rgba(255,255,255,0.85)",
        borderRadius: "8px",
        padding: "4px 6px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        fontFamily: "'Be Vietnam Pro', sans-serif",
        textDecoration: "none",
        color: "black",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "fit-content",
        fontSize: "10px",
        lineHeight: "1.1"
      });
      document.body.appendChild(iconArt);
    }

    console.log("✅ collectionIcon.js loaded: BST icons attached");
  });
})();
