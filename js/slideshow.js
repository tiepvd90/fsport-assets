// slideshow.js
fetch('https://friendly-kitten-d760ff.netlify.app/json/slideshow.json')
  .then(res => res.json())
  .then(data => {
    const loai = window.loai || 'chair';
    const productPage = window.productPage || 'chair001';
    const images = (data[loai] && data[loai][productPage]) || [];

    const container = document.getElementById('lazySlideshow');
    const counter = document.getElementById('slideCounter');

    images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'slide lazy-slide' + (i === 0 ? ' show' : '');
      img.loading = 'lazy';
      container.insertBefore(img, counter);
    });

    initSlideshow(images.length);
  });

function initSlideshow(totalSlides) {
  let currentSlide = 0;
  const slides = document.querySelectorAll('.lazy-slide');
  const counterEl = document.getElementById('slideCounter');
  counterEl.textContent = `${currentSlide + 1}/${totalSlides}`;

  let slideInterval = setInterval(nextSlide, 4000);

  function nextSlide() {
    slides[currentSlide].classList.remove('show');
    currentSlide = (currentSlide + 1) % totalSlides;
    slides[currentSlide].classList.add('show');
    counterEl.textContent = `${currentSlide + 1}/${totalSlides}`;
  }

  function prevSlide() {
    slides[currentSlide].classList.remove('show');
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    slides[currentSlide].classList.add('show');
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
