/* Pebble UI — Theme (dark / light)
   Runs immediately (not deferred) so there's no flash of wrong theme. */
(function () {
  'use strict';

  var KEY = 'pebble-theme';
  var DARK = 'dark';
  var LIGHT = 'light';

  function preferred() {
    var stored = localStorage.getItem(KEY);
    if (stored === DARK || stored === LIGHT) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (_) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', theme === DARK ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('data-current-theme', theme);
    });
  }

  function toggle() {
    apply(document.documentElement.getAttribute('data-theme') === DARK ? LIGHT : DARK);
  }

  // Initialize on parse
  apply(preferred());

  // Wire toggles (event delegation — catches dynamically added buttons too)
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-theme-toggle]')) toggle();
  });

  // Respond to OS-level preference change (only when user hasn't overridden)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (_) {}
    if (!stored) apply(e.matches ? DARK : LIGHT);
  });
})();
