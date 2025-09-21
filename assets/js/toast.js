// assets/js/toast.js — tiny, framework-agnostic toast helper
// Usage: toast('Message sent', 'success', {duration: 4000})

(function () {
  const POS = { bottom: '24px', right: '24px' };

  function ensureToaster() {
    let el = document.getElementById('toaster');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toaster';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'false');
      document.body.appendChild(el);
    }
    return el;
  }

  function removeToast(node, delay) {
    setTimeout(() => {
      node.classList.remove('is-shown');
      setTimeout(() => node.remove(), 300);
    }, delay);
  }

  window.toast = function (message, type = 'info', opts = {}) {
    const root = ensureToaster();
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.role = 'status';
    t.textContent = message || '';

    root.appendChild(t);
    // force reflow, then show
    void t.offsetWidth;
    t.classList.add('is-shown');

    const dur = Math.max(1500, opts.duration || 3500);
    removeToast(t, dur);
  };
})();
