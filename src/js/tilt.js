/* Pebble UI — 3D Card Tilt
   Binds to every .card-tilt element.
   Uses pointer events per-card (no document-level listeners).
   Smooth lerp via RAF; will-change cleared when idle to free GPU. */
(function () {
  'use strict';

  // Skip on touch-only and on reduced-motion
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var MAX_TILT   = 13;     // degrees
  var PERSPECTIVE = 1000;  // px
  var LERP_SPEED  = 0.09;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function bindTilt(el) {
    var targetRX = 0, targetRY = 0;
    var currentRX = 0, currentRY = 0;
    var rafId = null;
    var hovered = false;

    el.style.transformStyle = 'preserve-3d';

    function tick() {
      currentRX = lerp(currentRX, targetRX, LERP_SPEED);
      currentRY = lerp(currentRY, targetRY, LERP_SPEED);

      el.style.transform =
        'perspective(' + PERSPECTIVE + 'px)' +
        ' rotateX(' + currentRX.toFixed(3) + 'deg)' +
        ' rotateY(' + currentRY.toFixed(3) + 'deg)';

      var stillMoving = Math.abs(currentRX - targetRX) > 0.01 ||
                        Math.abs(currentRY - targetRY) > 0.01;

      if (hovered || stillMoving) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.style.willChange = 'auto';
        el.style.transform  = '';
        rafId = null;
      }
    }

    el.addEventListener('pointerenter', function () {
      hovered = true;
      el.style.willChange = 'transform';
      if (!rafId) rafId = requestAnimationFrame(tick);
    });

    el.addEventListener('pointermove', function (e) {
      var rect = el.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 → 0.5
      var y = (e.clientY - rect.top)  / rect.height - 0.5;
      targetRY =  x * MAX_TILT * 2;
      targetRX = -y * MAX_TILT * 2;
    });

    el.addEventListener('pointerleave', function () {
      hovered = false;
      targetRX = 0;
      targetRY = 0;
      if (!rafId) rafId = requestAnimationFrame(tick);
    });
  }

  // Bind on load
  document.querySelectorAll('.card-tilt').forEach(bindTilt);

  // Bind dynamically added cards
  var mo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches('.card-tilt')) bindTilt(node);
        node.querySelectorAll && node.querySelectorAll('.card-tilt').forEach(bindTilt);
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
