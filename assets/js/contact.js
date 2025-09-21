// assets/js/contact.js — logic-only; optional toast() UI if present
document.addEventListener('alpine:init', () => {
  Alpine.store('fg', { status: '' });

  Alpine.data('formGuard', () => ({
    start: 0,
    lastElapsed: 0,

    init() {
      this.start = Date.now();
      this.setStatus('idle');

      // Compat: copy hx-post → action if action empty
      if (this.$el.getAttribute('action') === '') {
        const hx = this.$el.getAttribute('hx-post') || this.$el.dataset.action;
        if (hx) this.$el.setAttribute('action', hx);
      }

      // Capture submit first → set _elapsed_ms before htmx/json-enc serializes
      this.$el.addEventListener('submit', () => {
        const elapsed = Math.max(1, Date.now() - this.start);
        this.lastElapsed = elapsed;
        const hidden = this.$el.querySelector('input[name="_elapsed_ms"]');
        if (hidden) hidden.value = String(elapsed);
      }, { capture: true });
    },

    configRequest(e) {
      if (e.target !== this.$el) return;
      const elapsed = this.lastElapsed || Math.max(1, Date.now() - this.start);
      const p = e.detail.parameters || (e.detail.parameters = {});
      p._elapsed_ms = elapsed;

      this.setStatus('loading', 'Nachricht wird gesendet …');
      if (window.toast) toast('Nachricht wird gesendet …', 'info', { duration: 2000 });
    },

    beforeRequest(e) {
      if (e.target !== this.$el) return;
      const elapsed = this.lastElapsed || Math.max(1, Date.now() - this.start);
      const hidden = this.$el.querySelector('input[name="_elapsed_ms"]');
      if (hidden) hidden.value = String(elapsed);
      const p = e.detail.parameters || (e.detail.parameters = {});
      p._elapsed_ms = elapsed;
    },

    afterRequest(e) {
      if (e.target !== this.$el) return;

      const xhr = e.detail.xhr;
      let data = null;
      try { data = JSON.parse(xhr.responseText || ''); } catch { }

      if (xhr.status >= 200 && xhr.status < 300 && data && data.ok) {
        this.setStatus('sent', 'Vielen Dank! ✓');
        if (window.toast) toast('Vielen Dank! Ich melde mich schnellstmöglich zurück.', 'success');
        this.$el.reset();
        this.start = Date.now();
        this.lastElapsed = 0;
        return;
      }

      const msg = (data && data.error) ? data.error :
        (xhr.status ? `Fehler (${xhr.status})` : 'Netzwerkfehler');
      this.setStatus('error', msg);
      if (window.toast) toast(msg, 'error', { duration: 5000 });
    },

    sendError(e) {
      if (e.target !== this.$el) return;
      const msg = 'Netzwerkfehler – bitte später erneut versuchen.';
      this.setStatus('error', msg);
      if (window.toast) toast(msg, 'error');
    },

    // state & SR text
    setStatus(state, msg) {
      this.$el.setAttribute('data-status', state || 'idle');
      if (typeof msg === 'string') Alpine.store('fg').status = msg;
      else {
        if (state === 'loading') Alpine.store('fg').status = 'Nachricht wird gesendet …';
        else if (state === 'sent') Alpine.store('fg').status = 'Gesendet ✓';
        else if (state === 'error') Alpine.store('fg').status = 'Fehler';
        else Alpine.store('fg').status = '';
      }
      // Mirror error text into explicit error box if present
      if (state === 'error') {
        const el = this.$el.querySelector('.error-message');
        if (el && typeof msg === 'string') el.textContent = msg;
      }
    },
  }));
});
