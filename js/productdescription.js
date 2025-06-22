document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggleDesc");
  const descFull = document.getElementById("descFull");
  const fade = document.getElementById("descFade");

  toggleBtn.addEventListener("click", () => {
    const isHidden = descFull.classList.contains("hidden");
    descFull.classList.toggle("hidden");
    fade.style.display = isHidden ? "none" : "block";
    toggleBtn.innerHTML = isHidden
      ? 'Thu Gọn <span class="arrow">&#x25B2;</span>'
      : 'Xem Thêm <span class="arrow">&#x25BC;</span>';
  });
});
