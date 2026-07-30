/* ==========================================================================
   Lightweight client-side HTML includes.

   Any element with a data-include="path" attribute is replaced by the
   contents of that file. Once all components are in the DOM, the interactive
   scripts (viz, carousel) are loaded so they can find their elements.

   Runs on GitHub Pages / any HTTP server. Opening index.html directly from
   the filesystem (file://) will not work because fetch blocks local files;
   use a local server, e.g. `python -m http.server`.
   ========================================================================== */
(function () {
  'use strict';

  // Fetch one component and swap it in for its placeholder element.
  function inject(el) {
    var url = el.getAttribute('data-include');
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status + ' for ' + url);
        return res.text();
      })
      .then(function (html) {
        el.outerHTML = html;
      })
      .catch(function (err) {
        console.error('Include failed:', url, err);
      });
  }

  // Append a script and resolve when it has loaded (never rejects).
  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () {
        console.error('Script failed to load:', src);
        resolve();
      };
      document.body.appendChild(s);
    });
  }

  var placeholders = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));

  Promise.all(placeholders.map(inject))
    .then(function () {
      return loadScript('js/viz.js');
    })
    .then(function () {
      return loadScript('js/carousel.js');
    });
})();
