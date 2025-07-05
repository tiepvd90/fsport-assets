let totalImages = 0;

switch (window.productPage) {
  case "chair001":
  case "sup001":
    totalImages = 14;
    break;
  case "ysandalbn68":
  case "firstpickleball":
  case "pickleball-airforce":
    totalImages = 9;
    break;
  case "ysandal5568":
    totalImages = 41;
    break;
  case "ysandal5560":
    totalImages = 14;
    break;
  case "meikan":
    totalImages = 9;
    break;
  default:
    totalImages = 5;
    break;
}

const imagesToShow = 5;
const container = document.getElementById('lazySlideshow');
const counter = document.getElementById('slideCounter');
const loai = window.loai;
const productPage = window.productPage;
const basePath = `/assets/images/gallery/${loai}/${productPage}`;

let loadedCount = 0;
const slides = [];

// ✅ Tạo ảnh 1 và gắn vào DOM ngay lập tức
const firstImage = document.createElement('img');
firstImage.src = `${basePath}/1.jpg`;
firstImage.className = 'slide lazy-slide show';
firstImage.loading = 'eager';
container.insertBefore(firstImage, counter);

firstImage.onload = () => {
  loadedCount++;
  checkReady();
};

firstImage.onerror = () => {
  console.warn("❌ Không tải được ảnh 1.jpg");
  checkReady();
};

// ✅ Random 4 ảnh còn lại từ 2 → totalImages
function getRandomFromTwoOnwards(count, max) {
  const nums = [];
  for (let i = 2; i <= max; i++) nums.push(i);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums.slice(0, count);
}

const randomIndices = getRandomFromTwoOnwards(imagesToShow - 1, totalImages);

// 🔁 Tải ảnh 2 → ...
randomIndices.forEach((i) => {
  const src = `${basePath}/${i}.jpg`;
  const img = document.createElement('img');
  img.src = src;
  img.className = 'slide lazy-slide';
  img.loading = 'lazy';

  img.onload = () => {
    loadedCount++;
    container.insertBefore(img, counter);
    checkReady();
  };

  img.onerror = () => {
    console.warn(`❌ Lỗi tải ảnh ${i}.jpg`);
    checkReady();
  };
});

function checkReady() {
  if (loadedCount >= imagesToShow) {
    initSlideshow(imagesToShow);
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

  // 👉 Touch support
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

  // 👉 Mouse drag support
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
