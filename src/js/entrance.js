/* Pebble UI — Scroll Entrance Animations
   Observes [data-entrance] elements; adds .pebble-visible when they enter viewport.
   Each element is unobserved after first trigger (animate once). */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Just make everything visible immediately
    document.querySelectorAll('[data-entrance]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = '';
    });
    return;
  }

  if (!('IntersectionObserver' in window)) {
    // Fallback: show all immediately
    document.querySelectorAll('[data-entrance]').forEach(function (el) {
      el.style.opacity = '1';
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('pebble-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
  );

  function observe(el) { observer.observe(el); }

  document.querySelectorAll('[data-entrance]').forEach(observe);

  // Watch for dynamically added elements
  var mo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.hasAttribute('data-entrance')) observe(node);
        node.querySelectorAll && node.querySelectorAll('[data-entrance]').forEach(observe);
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
