/* Pebble UI — Magnetic Custom Cursor
   Performance rules:
   - Mouse position read in mousemove; rendering via requestAnimationFrame only
   - Only transform is animated (compositor thread, no layout)
   - Magnetic shift computed once per frame, not per event
   - For .btn elements: inner content translates, container never moves
   - Removed on touch devices immediately */
(function () {
  'use strict';

  if (window.matchMedia('(pointer: coarse)').matches) return;

  var LERP_RING    = 0.1;   // ring lag
  var MAG_STRENGTH = 0.38;  // pull for free-floating elements (circle btn, decorative)
  var MAG_INNER    = 0.18;  // pull for btn inner content — stays within button bounds
  var MAG_RANGE    = 72;    // px radius where magnetism activates

  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;
  var ringX  = mouseX;
  var ringY  = mouseY;
  var active = true;

  var ring = document.createElement('div');
  ring.className = 'pebble-cursor';
  ring.setAttribute('aria-hidden', 'true');

  var dot = document.createElement('div');
  dot.className = 'pebble-cursor-dot';
  dot.setAttribute('aria-hidden', 'true');

  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add('pebble-cursor-active');

  function lerp(a, b, t) { return a + (b - a) * t; }

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
  });

  var hoverClass = 'pebble-cursor--hover';
  var pressClass = 'pebble-cursor--pressed';
  var textClass  = 'pebble-cursor--text';

  function addClass(cls) { ring.classList.add(cls); }
  function rmClass(cls)  { ring.classList.remove(cls); }

  document.addEventListener('mouseover', function (e) {
    var el = e.target;
    if (el.matches('input[type="text"],input[type="email"],input[type="search"],textarea')) {
      addClass(textClass);
    } else if (el.closest('a,button,[role="button"],[data-magnetic],.card,.btn')) {
      rmClass(textClass);
      addClass(hoverClass);
    }
  });

  document.addEventListener('mouseout', function (e) {
    var el = e.target;
    if (el.matches('input[type="text"],input[type="email"],input[type="search"],textarea')) {
      rmClass(textClass);
    } else if (el.closest('a,button,[role="button"],[data-magnetic],.card,.btn')) {
      rmClass(hoverClass);
    }
  });

  document.addEventListener('mousedown', function () { addClass(pressClass); });
  document.addEventListener('mouseup',   function () { rmClass(pressClass); });

  var magneticEls = [];

  /* For .btn elements: wrap children in an inner span so the container
     never moves — only the text/icon content floats inside the pill.
     For .btn-circle and bare data-magnetic: translate the element itself. */
  function getTarget(el) {
    var isBtn = el.classList.contains('btn') && !el.classList.contains('btn-circle');
    if (!isBtn) return { node: el, strength: MAG_STRENGTH };

    if (!el._magInner) {
      var inner = document.createElement('span');
      inner.className = 'pb-mag-inner';
      /* inherit flex + gap so content layout is unchanged */
      inner.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:inherit',
        'pointer-events:none',
        'will-change:transform'
      ].join(';');
      /* move every existing child node into the inner span */
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el._magInner = inner;
    }
    return { node: el._magInner, strength: MAG_INNER };
  }

  function bindMagnetic() {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      if (magneticEls.indexOf(el) !== -1) return;
      magneticEls.push(el);

      var t = getTarget(el);

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var dx   = e.clientX - (rect.left + rect.width  / 2);
        var dy   = e.clientY - (rect.top  + rect.height / 2);
        t.node.style.transform = 'translate(' + (dx * t.strength) + 'px,' + (dy * t.strength) + 'px)';
      });

      el.addEventListener('mouseleave', function () {
        t.node.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1)';
        t.node.style.transform  = '';
        setTimeout(function () { t.node.style.transition = ''; }, 480);
      });
    });
  }

  bindMagnetic();

  var mo = new MutationObserver(bindMagnetic);
  mo.observe(document.body, { childList: true, subtree: true });

  function tick() {
    if (!active) return;
    ringX = lerp(ringX, mouseX, LERP_RING);
    ringY = lerp(ringY, mouseY, LERP_RING);
    ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px)';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.addEventListener('touchstart', function () {
    active = false;
    ring.style.opacity = '0';
    dot.style.opacity  = '0';
    document.body.classList.remove('pebble-cursor-active');
    mo.disconnect();
  }, { once: true });

  document.addEventListener('mouseleave', function () {
    ring.classList.add('pebble-cursor--hidden');
    dot.classList.add('pebble-cursor--hidden');
  });
  document.addEventListener('mouseenter', function () {
    ring.classList.remove('pebble-cursor--hidden');
    dot.classList.remove('pebble-cursor--hidden');
  });
})();
