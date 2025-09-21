// contact.js — framework-neutral logic (Alpine + htmx)
// - JS handles logic only: timing, payload, simple state flag on the <form>.
// - CSS controls presentation via [data-status] selectors (see snippet below).
// - No Bootstrap classes in JS, no inline styles.
//
// States (set on <form data-status="...">):
//   idle | loading | sent | error
//
// Requirements:
// - Alpine loaded, htmx + json-enc loaded
// - Form has x-data="formGuard()" x-init="init()" and htmx event bindings
// - Hidden input: <input type="hidden" name="_elapsed_ms">
// - Status boxes exist in markup (any classes); CSS decides visibility using [data-status].
//
// Accessibility hint: keep your <p class="form-status" x-text="$store.fg.status"> for SR feedback.

document.addEventListener('alpine:init', () => {
  Alpine.store('fg', { status: '' });

  Alpine.data('formGuard', () => ({
    start: 0,
    lastElapsed: 0,

    init() {
      this.start = Date.now();
      this.setStatus('idle');

      // Optional: copy hx-post -> action if action=""
      if (this.$el.getAttribute('action') === '') {
        const hx = this.$el.getAttribute('hx-post') || this.$el.dataset.action;
        if (hx) this.$el.setAttribute('action', hx);
      }

      // Critical: set _elapsed_ms before htmx/json-enc serializes the form
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

      // Ensure JSON gets the timing
      const p = e.detail.parameters || (e.detail.parameters = {});
      p._elapsed_ms = elapsed;

      this.setStatus('loading');
    },

    beforeRequest(e) {
      if (e.target !== this.$el) return;
      // Final guard: keep hidden field and params in sync
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
        this.$el.reset();
        this.start = Date.now();
        this.lastElapsed = 0;
        return;
      }

      const msg = (data && data.error) ? data.error :
        (xhr.status ? `Fehler (${xhr.status})` : 'Netzwerkfehler');
      this.setStatus('error', msg);
    },

    sendError(e) {
      if (e.target !== this.$el) return;
      this.setStatus('error', 'Netzwerkfehler – bitte später erneut versuchen.');
    },

    setStatus(state, msg) {
      this.$el.setAttribute('data-status', state || 'idle');
      if (typeof msg === 'string') Alpine.store('fg').status = msg;
      else {
        if (state === 'loading') Alpine.store('fg').status = 'Nachricht wird gesendet …';
        else if (state === 'sent') Alpine.store('fg').status = 'Gesendet ✓';
        else if (state === 'error') Alpine.store('fg').status = 'Fehler';
        else Alpine.store('fg').status = '';
      }
      // Also mirror text into explicit boxes if present
      const setText = (sel, text) => {
        const el = this.$el.querySelector(sel);
        if (el && typeof text === 'string') el.textContent = text;
      };
      if (state === 'error') setText('.error-message', msg || '');
    },
  }));
});
