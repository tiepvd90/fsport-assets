const totalImages = 20;
const imagesToShow = 5;

const container = document.getElementById('lazySlideshow');
const counter = document.getElementById('slideCounter');

let loadedCount = 0;
let triedCount = 0;
const slides = [];

// ✅ Đường dẫn cố định
const basePath = 'assets/images/gallery/chair/chair001';

// 👉 Hàm random 5 số khác nhau từ 1 đến 20
function getRandomNumbers(count, max) {
  const set = new Set();
  while (set.size < count) {
    set.add(Math.floor(Math.random() * max) + 1);
  }
  return Array.from(set);
}

// 👉 Random 5 ảnh
const randomIndices = getRandomNumbers(imagesToShow, totalImages);

// 👉 Thêm ảnh đại diện video đầu tiên
const videoImg = document.createElement('img');
videoImg.src = `${basePath}/random.jpg`;
videoImg.className = 'slide lazy-slide';
videoImg.loading = 'eager';

videoImg.onload = () => {
  slides.push(videoImg);
  loadedCount++;
  triedCount++;
  checkReady();
};

videoImg.onerror = () => {
  triedCount++;
  checkReady();
};

// 👉 Load các ảnh ngẫu nhiên
randomIndices.forEach((i) => {
  const src = `${basePath}/${i}.jpg`;
  const img = document.createElement('img');
  img.src = src;
  img.className = 'slide lazy-slide';
  img.loading = 'lazy';

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
});

function checkReady() {
  if (triedCount === imagesToShow + 1) { // 5 ảnh + 1 ảnh video
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

// ✅ Hàm slideshow giữ nguyên như cũ
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
