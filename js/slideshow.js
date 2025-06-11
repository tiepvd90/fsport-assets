const totalImages = 20;

const container = document.getElementById('lazySlideshow');
const counter = document.getElementById('slideCounter');

let loadedCount = 0;
let triedCount = 0;
const slides = [];

for (let i = 1; i <= totalImages; i++) {
  const src = `/assets/images/gallery/${loai}/${productPage}/${i}.jpg`;
  const img = document.createElement('img');
  img.src = src;
  img.className = 'slide lazy-slide';
  img.loading = i === 1 ? 'eager' : 'lazy';

  img.onload = () => {
    slides.push(img);
    loadedCount++;
    triedCount++;
    checkReady();
  };

  img.onerror = () => {
    triedCount++;
    checkReady();
  };
}

function checkReady() {
  // Khi đã thử đủ số ảnh
  if (triedCount === totalImages) {
    // Chèn các ảnh đã load thành công
    slides.forEach((img, i) => {
      if (i === 0) img.classList.add('show');
      container.insertBefore(img, counter);
    });

    if (slides.length > 0) {
      initSlideshow(slides.length);
    } else {
      console.warn("❌ Không có ảnh nào được load.");
    }
  }
}

function initSlideshow(totalSlides) {
  let currentSlide = 0;
  const slidesEls = document.querySelectorAll('.lazy-slide');
  const counterEl = document.getElementById('slideCounter');
  counterEl.textContent = `${currentSlide + 1}/${totalSlides}`;
  let slideInterval = setInterval(nextSlide, 4000);

  function nextSlide() {
    slidesEls[currentSlide].classList.remove('show');
    currentSlide = (currentSlide + 1) % totalSlides;
    slidesEls[currentSlide].classList.add('show');
    counterEl.textContent = `${currentSlide + 1}/${totalSlides}`;
  }

  function prevSlide() {
    slidesEls[currentSlide].classList.remove('show');
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    slidesEls[currentSlide].classList.add('show');
    counterEl.textContent = `${currentSlide + 1}/${totalSlides}`;
  }

  // Touch
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

  // Mouse drag
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
