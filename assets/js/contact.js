// contact.js — robust _elapsed_ms (Alpine + htmx + json-enc)
//
// Key change:
// - Sets the hidden `_elapsed_ms` on the native `submit` event with `{capture:true}`
//   so it runs BEFORE htmx/json-enc collects form values. This avoids ordering issues.
// - Still updates e.detail.parameters in htmx hooks as a backup.
// - Restores `$store.fg.status` for UI messages. No jQuery, no vendor scripts.

document.addEventListener('alpine:init', () => {
  Alpine.store('fg', { status: '' });

  Alpine.data('formGuard', () => ({
    start: 0,
    lastElapsed: 0,

    init() {
      this.start = Date.now();

      // Quiet initial UI
      this._hide('.loading'); this._hide('.error-message'); this._hide('.sent-message');

      // Compat: fill action from hx-post if empty
      if (this.$el.getAttribute('action') === '') {
        const hx = this.$el.getAttribute('hx-post') || this.$el.dataset.action;
        if (hx) this.$el.setAttribute('action', hx);
      }

      // CRITICAL: set _elapsed_ms before htmx/json-enc handles the submit
      this.$el.addEventListener('submit', (ev) => {
        const elapsed = Math.max(1, Date.now() - this.start);
        this.lastElapsed = elapsed;
        const hidden = this.$el.querySelector('input[name="_elapsed_ms"]');
        if (hidden) hidden.value = String(elapsed);
        // Do NOT preventDefault; htmx will handle the submission.
      }, { capture: true });
    },

    // htmx:configRequest — backup injection into JSON body
    configRequest(e) {
      if (e.target !== this.$el) return;
      const elapsed = this.lastElapsed || Math.max(1, Date.now() - this.start);
      const p = e.detail.parameters || (e.detail.parameters = {});
      p._elapsed_ms = elapsed;

      Alpine.store('fg').status = 'sending…';
      this._hide('.error-message'); this._hide('.sent-message'); this._show('.loading');
    },

    beforeRequest(e) {
      if (e.target !== this.$el) return;
      // Ensure hidden field still has the value
      const elapsed = this.lastElapsed || Math.max(1, Date.now() - this.start);
      const hidden = this.$el.querySelector('input[name="_elapsed_ms"]');
      if (hidden) hidden.value = String(elapsed);
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

    // helpers
    _q(sel) { return this.$el.querySelector(sel); },
    _hide(sel) { const el = this._q(sel); if (el) el.style.display = 'none'; },
    _show(sel) { const el = this._q(sel); if (el) el.style.display = 'block'; },
    _setText(sel, txt) { const el = this._q(sel); if (el) el.textContent = txt; },
  }));
});
