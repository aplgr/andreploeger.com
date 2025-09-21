// contact.js — robust _elapsed_ms handling (Alpine + htmx + json-enc)
//
// Goals:
// - Always compute `_elapsed_ms` at submit-time and include it in the JSON body.
// - Mirror the same value into a hidden input (if present) to survive any re-scan.
// - Avoid Alpine rebinding issues by NOT relying on :value in HTML.
// - Keep $store.fg.status working for UI messages.

document.addEventListener('alpine:init', () => {
  Alpine.store('fg', { status: '' });

  Alpine.data('formGuard', () => ({
    start: 0,
    lastElapsed: 0,

    init() {
      this.start = Date.now();

      // Quiet initial UI
      this._hide('.loading'); this._hide('.error-message'); this._hide('.sent-message');

      // Harmless compat: copy hx-post to action if action=""
      if (this.$el.getAttribute('action') === '') {
        const hx = this.$el.getAttribute('hx-post') || this.$el.dataset.action;
        if (hx) this.$el.setAttribute('action', hx);
      }
    },

    // Runs when htmx configures the request; order may vary with extensions.
    configRequest(e) {
      if (e.target !== this.$el) return;

      const elapsed = Math.max(1, Date.now() - this.start);
      this.lastElapsed = elapsed;

      // 1) Force parameter in JSON body
      const p = e.detail.parameters || (e.detail.parameters = {});
      // remove empty/previous value to avoid accidental overwrite
      if (p._elapsed_ms === '' || p._elapsed_ms == null) delete p._elapsed_ms;
      p._elapsed_ms = elapsed;

      // 2) Mirror into hidden input so any re-scan picks it up
      const hidden = this.$el.querySelector('input[name="_elapsed_ms"]');
      if (hidden) hidden.value = String(elapsed);

      Alpine.store('fg').status = 'sending…';
      this._hide('.error-message'); this._hide('.sent-message'); this._show('.loading');
    },

    // If json-enc reworks parameters after configRequest, enforce again right before send.
    beforeRequest(e) {
      if (e.target !== this.$el) return;

      const elapsed = this.lastElapsed || Math.max(1, Date.now() - this.start);

      // Update hidden input again (last line of defense)
      const hidden = this.$el.querySelector('input[name="_elapsed_ms"]');
      if (hidden) hidden.value = String(elapsed);

      // And parameters again, in case another listener mutated them
      const p = e.detail.parameters || (e.detail.parameters = {});
      p._elapsed_ms = elapsed;
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
        // Restart timing window for next submit
        this.start = Date.now();
        this.lastElapsed = 0;
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
