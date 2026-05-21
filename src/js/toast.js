/* Pebble UI — Toast notifications
   API: window.pebble.toast({ title, message, type, duration })
   type: 'success' | 'error' | 'warning' | 'info'  (default: 'info')
   duration: ms before auto-dismiss (0 = no auto-dismiss)  (default: 4000) */
(function () {
  'use strict';

  var DURATION = 4000;

  var ICONS = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  var CLOSE_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'pebble-toast-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  function dismiss(el) {
    el.classList.add('pebble-toast--exiting');
    el.addEventListener('animationend', function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, { once: true });
  }

  function toast(opts) {
    var type     = opts.type     || 'info';
    var title    = opts.title    || '';
    var message  = opts.message  || '';
    var duration = opts.duration != null ? opts.duration : DURATION;

    var el = document.createElement('div');
    el.className = 'pebble-toast pebble-toast--' + type;
    el.setAttribute('role', 'alert');

    var icon = document.createElement('span');
    icon.className = 'pebble-toast-icon';
    icon.innerHTML = ICONS[type] || ICONS.info;

    var content = document.createElement('div');
    content.className = 'pebble-toast-content';

    if (title) {
      var t = document.createElement('div');
      t.className = 'pebble-toast-title';
      t.textContent = title;
      content.appendChild(t);
    }

    if (message) {
      var m = document.createElement('div');
      m.className = 'pebble-toast-msg';
      m.textContent = message;
      content.appendChild(m);
    }

    var close = document.createElement('button');
    close.className = 'pebble-toast-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.innerHTML = CLOSE_ICON;
    close.addEventListener('click', function () { dismiss(el); });

    el.appendChild(icon);
    el.appendChild(content);
    el.appendChild(close);

    if (duration > 0) {
      var bar = document.createElement('div');
      bar.className = 'pebble-toast-progress';
      bar.style.animationDuration = duration + 'ms';
      el.appendChild(bar);
      setTimeout(function () { dismiss(el); }, duration);
    }

    getContainer().appendChild(el);
    return el;
  }

  window.pebble = window.pebble || {};
  window.pebble.toast = toast;
})();
