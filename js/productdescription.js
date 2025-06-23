document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("productdescription-placeholder");
  if (!container) {
    console.warn("⚠️ Không tìm thấy #productdescription-placeholder trong DOM.");
    return;
  }

  const url = container.getAttribute("data-src");
  if (!url) {
    console.warn("⚠️ Thiếu thuộc tính data-src trên #productdescription-placeholder.");
    return;
  }

  console.log("📦 Bắt đầu fetch mô tả sản phẩm từ:", url);

  fetch(url)
    .then(res => {
      console.log("📥 Phản hồi fetch:", res.status, res.ok);
      if (!res.ok) throw new Error("Không tải được mô tả: " + res.status);
      return res.text();
    })
    .then(html => {
      console.log("✅ Thành công, đang chèn HTML mô tả...");
      container.innerHTML = html;

      // ✅ Kích hoạt nút Xem thêm sau khi HTML được render
      const toggleBtn = container.querySelector("#toggleDesc");
      const descFull = container.querySelector("#descFull");
      const descFade = container.querySelector("#descFade");

      if (!toggleBtn || !descFull || !descFade) return;

      toggleBtn.addEventListener("click", () => {
        const isHidden = descFull.classList.contains("hidden");

        if (isHidden) {
          descFull.classList.remove("hidden");
          descFade.style.display = "none";
          toggleBtn.innerHTML = `Thu Gọn <span class="arrow">&#x25B2;</span>`;
        } else {
          descFull.classList.add("hidden");
          descFade.style.display = "block";
          toggleBtn.innerHTML = `Xem Thêm <span class="arrow">&#x25BC;</span>`;
        }
      });
    })
    .catch(err => {
      console.error("❌ Lỗi khi fetch mô tả sản phẩm:", err);
    });
});
