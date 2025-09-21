// assets/js/contact-toasts.js — global htmx listeners for toasts (no Alpine dependency)
(function () {
  function isForm(e) {
    return e && e.target && e.target.matches && e.target.matches('form.php-email-form');
  }

  document.addEventListener('htmx:configRequest', function (e) {
    if (!isForm(e) || !window.toast) return;
    toast('Message is being sent …', 'info', { duration: 2000 });
  });

  document.addEventListener('htmx:afterRequest', function (e) {
    if (!isForm(e) || !window.toast) return;

    var xhr = e.detail && e.detail.xhr;
    var status = (xhr && xhr.status) || 0;
    var data = null;
    try { data = JSON.parse((xhr && xhr.responseText) || ''); } catch (_) { }

    if (status >= 200 && status < 300 && data && data.ok) {
      toast('Thank you! I\'ll get back to you as soon as possible.', 'success');
    } else {
      var msg = (data && data.error) ? data.error : (status ? ('Error (' + status + ')') : 'Network error');
      toast(msg, 'error', { duration: 5000 });
    }
  });

  document.addEventListener('htmx:sendError', function (e) {
    if (!isForm(e) || !window.toast) return;
    toast('Network error – please retry later.', 'error');
  });
})();
