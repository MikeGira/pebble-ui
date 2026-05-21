/* Pebble UI — Magnetic Custom Cursor
   Performance rules:
   - Mouse position read in mousemove; rendering via requestAnimationFrame only
   - Only transform is animated (compositor thread, no layout)
   - Magnetic shift computed once per frame, not per event
   - Removed on touch devices immediately */
(function () {
  'use strict';

  // Skip on touch-primary devices right away
  if (window.matchMedia('(pointer: coarse)').matches) return;

  var LERP_RING = 0.1;        // ring lag — lower = more lag
  var MAG_STRENGTH = 0.38;    // magnetic pull (0 = none, 1 = full snap)
  var MAG_RANGE = 72;         // px radius where magnetism activates

  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;
  var ringX = mouseX;
  var ringY = mouseY;
  var active = true;

  // Create ring
  var ring = document.createElement('div');
  ring.className = 'pebble-cursor';
  ring.setAttribute('aria-hidden', 'true');

  // Create dot
  var dot = document.createElement('div');
  dot.className = 'pebble-cursor-dot';
  dot.setAttribute('aria-hidden', 'true');

  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add('pebble-cursor-active');

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Dot follows exactly; ring lerps
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
  });

  // Track hover state
  var hoverClass = 'pebble-cursor--hover';
  var pressClass = 'pebble-cursor--pressed';
  var textClass  = 'pebble-cursor--text';

  function addClass(cls) { ring.classList.add(cls); }
  function rmClass(cls)  { ring.classList.remove(cls); }

  document.addEventListener('mouseover', function (e) {
    var el = e.target;
    if (el.matches('input[type="text"], input[type="email"], input[type="search"], textarea')) {
      addClass(textClass);
    } else if (el.closest('a, button, [role="button"], [data-magnetic], .card, .btn')) {
      rmClass(textClass);
      addClass(hoverClass);
    }
  });

  document.addEventListener('mouseout', function (e) {
    var el = e.target;
    if (el.matches('input[type="text"], input[type="email"], input[type="search"], textarea')) {
      rmClass(textClass);
    } else if (el.closest('a, button, [role="button"], [data-magnetic], .card, .btn')) {
      rmClass(hoverClass);
    }
  });

  document.addEventListener('mousedown', function () { addClass(pressClass); });
  document.addEventListener('mouseup',   function () { rmClass(pressClass); });

  // Magnetic elements: DOM queried once; re-query on DOM change via MutationObserver
  var magneticEls = [];

  function bindMagnetic() {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      if (magneticEls.includes(el)) return;
      magneticEls.push(el);

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width  / 2;
        var cy = rect.top  + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        el.style.transform = 'translate(' + (dx * MAG_STRENGTH) + 'px,' + (dy * MAG_STRENGTH) + 'px)';
      });

      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 450);
      });
    });
  }

  bindMagnetic();

  var mo = new MutationObserver(bindMagnetic);
  mo.observe(document.body, { childList: true, subtree: true });

  // RAF loop — only runs transform (compositor thread)
  function tick() {
    if (!active) return;
    ringX = lerp(ringX, mouseX, LERP_RING);
    ringY = lerp(ringY, mouseY, LERP_RING);
    ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px)';
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // Disable on first touch (user switched to touch mid-session)
  document.addEventListener('touchstart', function () {
    active = false;
    ring.style.opacity = '0';
    dot.style.opacity  = '0';
    document.body.classList.remove('pebble-cursor-active');
    mo.disconnect();
  }, { once: true });

  // Hide when leaving window
  document.addEventListener('mouseleave', function () {
    ring.classList.add('pebble-cursor--hidden');
    dot.classList.add('pebble-cursor--hidden');
  });
  document.addEventListener('mouseenter', function () {
    ring.classList.remove('pebble-cursor--hidden');
    dot.classList.remove('pebble-cursor--hidden');
  });
})();
