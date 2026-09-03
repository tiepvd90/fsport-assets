(function () {
  var html = `
<section class="fsport-about" aria-label="Thông tin về F-SPORT">
  <div class="fsport-about__container">
    <div class="fsport-about__list">

      <div class="fsport-about__item">
        <button class="fsport-about__trigger" aria-expanded="false" aria-controls="fsport-panel-1" id="fsport-btn-1">
          <span class="fsport-about__trigger-text">Giới thiệu về F-SPORT</span>
          <span class="fsport-about__icon" aria-hidden="true">+</span>
        </button>
        <div class="fsport-about__panel" id="fsport-panel-1" role="region" aria-labelledby="fsport-btn-1">
          <p class="fsport-about__content">F-SPORT là thương hiệu pickleball Việt Nam tập trung phát triển các dòng vợt trung cấp và cao cấp với định hướng hiệu năng, độ bền và trải nghiệm chơi thực tế. Chúng tôi theo đuổi phong cách thiết kế hiện đại, mạnh mẽ kết hợp cùng các công nghệ như Fullfoam Core, Toray Carbon Surface và Metallic Chrome Edge nhằm tạo ra những cây vợt có khả năng trợ lực tốt, cảm giác đánh ổn định và độ hoàn thiện cao cho người chơi pickleball hiện đại.</p>
        </div>
      </div>

      <div class="fsport-about__item">
        <button class="fsport-about__trigger" aria-expanded="false" aria-controls="fsport-panel-2" id="fsport-btn-2">
          <span class="fsport-about__trigger-text">Vận chuyển &amp; thanh toán</span>
          <span class="fsport-about__icon" aria-hidden="true">+</span>
        </button>
        <div class="fsport-about__panel" id="fsport-panel-2" role="region" aria-labelledby="fsport-btn-2">
          <p class="fsport-about__content">F-SPORT hỗ trợ giao hàng toàn quốc từ Hà Nội. Thời gian vận chuyển dự kiến 1–2 ngày đối với miền Bắc, 2–3 ngày đối với miền Trung và 3–4 ngày đối với miền Nam. Khách hàng được kiểm tra, thử sản phẩm theo điều kiện công bố và thanh toán khi nhận hàng (COD). <a href="/chinh-sach-van-chuyen">Xem chính sách chi tiết</a>.</p>
        </div>
      </div>

      <div class="fsport-about__item">
        <button class="fsport-about__trigger" aria-expanded="false" aria-controls="fsport-panel-3" id="fsport-btn-3">
          <span class="fsport-about__trigger-text">Bảo hành &amp; hỗ trợ đổi trả</span>
          <span class="fsport-about__icon" aria-hidden="true">+</span>
        </button>
        <div class="fsport-about__panel" id="fsport-panel-3" role="region" aria-labelledby="fsport-btn-3">
          <p class="fsport-about__content">Các dòng vợt lõi tổ ong của F-SPORT được hỗ trợ bảo hành 30 ngày và các dòng vợt lõi foam được hỗ trợ bảo hành lên đến 90 ngày đối với lỗi sản xuất. Chính sách bảo hành không áp dụng cho hư hỏng do va đập mạnh, tác động ngoại lực hoặc sử dụng sai mục đích. Hỗ trợ qua Hotline/Zalo: 0384 735 980. <a href="/chinh-sach-bao-hanh">Xem chính sách bảo hành</a> và <a href="/chinh-sach-doi-tra-hoan-tien">chính sách đổi trả</a>.</p>
        </div>
      </div>

    </div>
  </div>
</section>`;

  var placeholder = document.getElementById("about-placeholder");
  if (placeholder) placeholder.outerHTML = html;

  document.querySelectorAll(".fsport-about__item").forEach(function (item) {
    item.querySelector(".fsport-about__trigger").addEventListener("click", function () {
      var isOpen = item.classList.contains("fsport-about__item--open");

      document.querySelectorAll(".fsport-about__item").forEach(function (el) {
        el.classList.remove("fsport-about__item--open");
        el.querySelector(".fsport-about__trigger").setAttribute("aria-expanded", "false");
        el.querySelector(".fsport-about__icon").textContent = "+";
      });

      if (!isOpen) {
        item.classList.add("fsport-about__item--open");
        item.querySelector(".fsport-about__trigger").setAttribute("aria-expanded", "true");
        item.querySelector(".fsport-about__icon").textContent = "–";
      }
    });
  });
})();
