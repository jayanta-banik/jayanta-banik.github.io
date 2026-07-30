/* Image carousels for publication thumbnails.
   Shows one image at a time; hovering advances to the next image.
   Dots allow manual selection. No auto-rotation. */
(function () {
  "use strict";

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-carousel]"),
    function (car) {
      var imgs = Array.prototype.slice.call(car.querySelectorAll("img"));
      if (imgs.length < 2) return;
      var idx = 0;

      var dots = document.createElement("div");
      dots.className = "dots";

      function show(i) {
        idx = (i + imgs.length) % imgs.length;
        imgs.forEach(function (im, j) {
          im.classList.toggle("active", j === idx);
        });
        Array.prototype.forEach.call(dots.children, function (d, j) {
          d.classList.toggle("active", j === idx);
        });
      }

      imgs.forEach(function (_, i) {
        var b = document.createElement("button");
        b.setAttribute("aria-label", "Show image " + (i + 1));
        b.addEventListener("click", function () { show(i); });
        dots.appendChild(b);
      });
      car.appendChild(dots);

      show(0);

      // Advance to the next image each time the pointer enters.
      car.addEventListener("mouseenter", function () { show(idx + 1); });
    }
  );
})();
