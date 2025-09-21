// contact.js — Alpine + htmx contact form (frontend-only fix)
//
// What it fixes:
// - Restores `$store.fg.status` so `<p x-text="$store.fg.status">` works.
// - Computes `_elapsed_ms` at SUBMIT time and injects it into the JSON payload.
// - Also mirrors `_elapsed_ms` into a hidden input if present.
// - No jQuery, no vendor validate.js required.

document.addEventListener('alpine:init', () => {
  // Provide the store used by the template: $store.fg.status
  Alpine.store('fg', { status: '' });

  Alpine.data('formGuard', () => ({
    start: 0,

    init() {
      // Start timer when component is ready
      this.start = Date.now();

      // Optional: keep initial UI quiet
      this._hide('.loading'); this._hide('.error-message'); this._hide('.sent-message');

      // Harmless compat: set action="" from hx-post if empty (some scripts check it)
      if (this.$el.getAttribute('action') === '') {
        const hx = this.$el.getAttribute('hx-post') || this.$el.dataset.action;
        if (hx) this.$el.setAttribute('action', hx);
      }
    },

    // htmx:configRequest handler — bind on the form or with .window; we accept both.
    configRequest(e) {
      // e.target is the element the request originates from (the <form>); guard to this form
      if (e.target !== this.$el) return;

      // Compute elapsed AT SUBMIT TIME (ms)
      const elapsed = Math.max(1, Date.now() - this.start);

      // 1) Ensure json-enc sends correct numeric field
      const p = e.detail.parameters || (e.detail.parameters = {});
      p._elapsed_ms = elapsed;

      // 2) Mirror into hidden input if present (useful for quick diagnostics)
      const hidden = this.$el.querySelector('input[name="_elapsed_ms"]');
      if (hidden) hidden.value = String(elapsed);

      // UI status
      Alpine.store('fg').status = 'sending…';
      this._hide('.error-message'); this._hide('.sent-message'); this._show('.loading');
    },

    beforeRequest(e) {
      if (e.target !== this.$el) return;
      // no-op
    },

    afterRequest(e) {
      if (e.target !== this.$el) return;

      this._hide('.loading');

      const xhr = e.detail.xhr;
      let data = null;
      try { data = JSON.parse(xhr.responseText || ''); } catch { }

      if (xhr.status >= 200 && xhr.status < 300 && data && data.ok) {
        Alpine.store('fg').status = 'sent ✓';
        this._show('.sent-message');
        this.$el.reset();
        // reset timer for a potential second submit
        this.start = Date.now();
        return;
      }

      const msg = (data && data.error) ? data.error :
        (xhr.status ? `Error (${xhr.status})` : 'Network error');
      Alpine.store('fg').status = msg;
      this._setText('.error-message', msg); this._show('.error-message');
    },

    sendError(e) {
      if (e.target !== this.$el) return;
      this._hide('.loading');
      const msg = 'Network error — please try again later.';
      Alpine.store('fg').status = msg;
      this._setText('.error-message', msg); this._show('.error-message');
    },

    // --- tiny DOM helpers ---
    _q(sel) { return this.$el.querySelector(sel); },
    _hide(sel) { const el = this._q(sel); if (el) el.style.display = 'none'; },
    _show(sel) { const el = this._q(sel); if (el) el.style.display = 'block'; },
    _setText(sel, txt) { const el = this._q(sel); if (el) el.textContent = txt; },
  }));
});
