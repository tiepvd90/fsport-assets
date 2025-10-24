/* =========================================================
 * collectionIcon.js — Hiển thị icon BST cố định (v2)
 * ========================================================= */
(function () {
  "use strict";

  function renderCollectionIcons() {
    if (document.getElementById("bstPickleballIcon")) return;

    // Nếu body chưa sẵn, thử lại sau 100ms
    if (!document.body) {
      return setTimeout(renderCollectionIcons, 100);
    }

    // --- PICKLEBALL ---
    const pickle = document.createElement("a");
    pickle.id = "bstPickleballIcon";
    pickle.href = "/pickleball/collection";
    pickle.innerHTML = `
      <img src="https://i.postimg.cc/nLZSyFgb/pickleball-icon.png"
           alt="BST Pickleball"
           style="width:20px;height:20px;object-fit:contain;">
      <span style="margin-top:2px;">BST</span>
    `;
    Object.assign(pickle.style, {
      position: "fixed",
      top: "12px",
      left: "12px",
      zIndex: "999999",
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
    document.body.appendChild(pickle);

    // --- ART ---
    const art = document.createElement("a");
    art.id = "bstArtIcon";
    art.href = "/art";
    art.innerHTML = `
      <img src="https://cdn-icons-png.freepik.com/256/12685/12685382.png"
           alt="BST Art"
           style="width:21px;height:21px;object-fit:contain;">
      <span style="margin-top:2px;">BST</span>
    `;
    Object.assign(art.style, {
      position: "fixed",
      top: "60px",
      left: "12px",
      zIndex: "999999",
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
    document.body.appendChild(art);

    console.log("✅ collectionIcon.js: icons rendered");
  }

  // Nếu DOM đã sẵn → render ngay
  if (document.readyState === "complete" || document.readyState === "interactive") {
    renderCollectionIcons();
  } else {
    document.addEventListener("DOMContentLoaded", renderCollectionIcons);
  }
})();
