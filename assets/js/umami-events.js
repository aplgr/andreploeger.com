(function () {
  "use strict";

  if (window.__apUmamiEventsInitialized) {
    return;
  }

  window.__apUmamiEventsInitialized = true;

  function trackUmami(eventName, payload) {
    if (!eventName || !window.umami || typeof window.umami.track !== 'function') {
      return false;
    }

    if (payload && Object.keys(payload).length > 0) {
      window.umami.track(eventName, payload);
    } else {
      window.umami.track(eventName);
    }

    return true;
  }

  window.apTrackUmami = trackUmami;

  // Use a single delegated listener so HTMX-swapped content is tracked automatically.
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented) {
      return;
    }

    const target = event.target.closest('[data-umami-event]');
    if (!target || target.matches(':disabled')) {
      return;
    }

    trackUmami(target.getAttribute('data-umami-event'));
  }, true);
})();
