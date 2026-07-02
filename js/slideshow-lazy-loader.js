(function () {
  "use strict";
  if (window.FSportSlideshowLazyLoader) return;

  function reveal(image) {
    if (!image || !image.dataset || !image.dataset.src) return;
    image.src = image.dataset.src;
    delete image.dataset.src;
  }

  function loadSequentially(images, options) {
    var list = Array.prototype.slice.call(images || []);
    var settings = options || {};
    var first = list[0];
    var index = 1;
    var initialDelay = Number(settings.initialDelay) || 250;
    var itemDelay = Number(settings.itemDelay) || 350;

    function loadNext() {
      var image = list[index++];
      if (!image) return;
      reveal(image);
      var continueLoading = function () {
        window.setTimeout(loadNext, itemDelay);
      };
      if (image.complete) continueLoading();
      else {
        image.addEventListener("load", continueLoading, { once: true });
        image.addEventListener("error", continueLoading, { once: true });
      }
    }

    function begin() {
      window.setTimeout(loadNext, initialDelay);
    }

    if (!first || first.complete) begin();
    else {
      first.addEventListener("load", begin, { once: true });
      first.addEventListener("error", begin, { once: true });
    }
  }

  function bindZoom(options) {
    var settings = options || {};
    var trigger = settings.trigger;
    var overlay = settings.overlay;
    var zoomImage = settings.zoomImage;
    var closeButton = settings.closeButton;
    var getCurrentImage = settings.getCurrentImage;
    if (!trigger || !overlay || !zoomImage || !closeButton || !getCurrentImage) return;

    var dragging = false;
    var startX = 0;
    var startY = 0;
    var originX = 0;
    var originY = 0;

    function close() {
      overlay.style.display = "none";
      zoomImage.src = "";
      zoomImage.style.transform = "translate(0, 0)";
      document.body.style.overflow = "";
    }

    trigger.addEventListener("click", function (event) {
      if (event.target.closest("button")) return;
      var current = getCurrentImage();
      if (!current || !current.src) return;
      zoomImage.src = current.currentSrc || current.src;
      overlay.style.display = "flex";
      zoomImage.style.transform = "translate(0, 0)";
      originX = 0;
      originY = 0;
      document.body.style.overflow = "hidden";
    });
    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay.style.display === "flex") close();
    });
    zoomImage.addEventListener("mousedown", function (event) {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      zoomImage.style.cursor = "grabbing";
      event.preventDefault();
    });
    document.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      zoomImage.style.cursor = "grab";
      var matrix = new DOMMatrixReadOnly(window.getComputedStyle(zoomImage).transform);
      originX = matrix.m41;
      originY = matrix.m42;
    });
    document.addEventListener("mousemove", function (event) {
      if (!dragging) return;
      zoomImage.style.transform = "translate(" +
        (originX + event.clientX - startX) + "px, " +
        (originY + event.clientY - startY) + "px)";
    });
  }

  window.FSportSlideshowLazyLoader = {
    reveal: reveal,
    loadSequentially: loadSequentially,
    bindZoom: bindZoom
  };
})();
