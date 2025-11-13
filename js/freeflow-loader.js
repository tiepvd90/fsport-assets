(function () {
  const containerId = "freeflow-placeholder";

  // Nếu chưa có container thì tự tạo
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;

    // Đặt sau dòng tiêu đề nếu có
    const h2 = document.querySelector("h2.freeflow-heading");
    if (h2 && h2.parentNode) {
      h2.parentNode.insertBefore(container, h2.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  }

  // Load HTML của FreeFlow (DÙNG ĐƯỜNG DẪN GỐC "/")
  fetch("/html/freeflow.html")
    .then(res => res.text())
    .then(html => {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      Array.from(temp.children).forEach(el => {
        if (el.id === "videoOverlay") {
          document.body.appendChild(el);
        } else {
          container.appendChild(el);
        }
      });

      // Load script FreeFlow logic (DÙNG "/js/")
      const ffScript = document.createElement("script");
      ffScript.src = "/js/freeflow.js";

      ffScript.onload = () => {
        // Ưu tiên init mới
        if (window.freeflowInit) {
          window.freeflowInit({
            sheetUrl:
              "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec",
            startNow: true
          });
        } else if (typeof fetchFreeFlowData === "function") {
          // Tương thích ngược
          fetchFreeFlowData(
            "https://script.google.com/macros/s/AKfycbwuEh9sP65vyQL0XzU8gY1Os0QYV_K5egKJgm8OhImAPjvdyrQiU7XCY909N99TnltP/exec"
          );
        }
      };

      document.body.appendChild(ffScript);
    });

  // Gắn lại nút đóng popup
  document.addEventListener("click", function (e) {
    if (e.target.id === "videoCloseBtn") {
      const frame = document.getElementById("videoFrame");
      const popup = document.getElementById("videoOverlay");
      if (frame) frame.src = "";
      if (popup) popup.style.display = "none";
    }
  });
})();
