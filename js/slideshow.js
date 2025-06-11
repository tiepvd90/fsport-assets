const loai = window.loai || 'chair';
const productPage = window.productPage || 'chair001';
const totalImages = 20; // để cao hơn số thực tế, không lo ảnh lỗi

const container = document.getElementById('lazySlideshow');
const counter = document.getElementById('slideCounter');

let loaded = 0;

for (let i = 1; i <= totalImages; i++) {
  const src = `/assets/images/gallery/${loai}/${productPage}/${i}.jpg`;
  const img = document.createElement('img');
  img.src = src;
  img.className = 'slide lazy-slide';

  // ✅ Ảnh đầu load ngay, ảnh sau lazy
  img.loading = i === 1 ? 'eager' : 'lazy';

  img.onload = () => {
    if (loaded === 0) img.classList.add('show');
    container.insertBefore(img, counter);
    loaded++;

    if (loaded === 1) initSlideshow();
  };

  img.onerror = () => img.remove();
}

function initSlideshow() {
  let currentSlide = 0;
  const slides = document.querySelectorAll('.lazy-slide');
  const counterEl = document.getElementById('slideCounter');
  if (!slides.length) return;

  counterEl.textContent = `${currentSlide + 1}/${slides.length}`;
  let slideInterval = setInterval(nextSlide, 4000);

  function nextSlide() {
    slides[currentSlide].classList.remove('show');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('show');
    counterEl.textContent = `${currentSlide + 1}/${slides.length}`;
  }

  function prevSlide() {
    slides[currentSlide].classList.remove('show');
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    slides[currentSlide].classList.add('show');
    counterEl.textContent = `${currentSlide + 1}/${slides.length}`;
  }

  // 👆 Touch
  let startX = 0;
  const slideshow = document.getElementById('lazySlideshow');

  slideshow.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });

  slideshow.addEventListener('touchend', (e) => {
    const diffX = e.changedTouches[0].clientX - startX;
    if (Math.abs(diffX) > 50) {
      clearInterval(slideInterval);
      diffX < 0 ? nextSlide() : prevSlide();
      slideInterval = setInterval(nextSlide, 4000);
    }
  });

  // 🖱 Mouse drag
  let isDragging = false;
  let dragStart = 0;

  slideshow.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStart = e.clientX;
  });

  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    const diffX = e.clientX - dragStart;
    if (Math.abs(diffX) > 50) {
      clearInterval(slideInterval);
      diffX < 0 ? nextSlide() : prevSlide();
      slideInterval = setInterval(nextSlide, 4000);
    }
    isDragging = false;
  });
}
