// contact.js — targeted fix for _elapsed_ms (no backend changes)
document.addEventListener('alpine:init', () => {
  Alpine.data('formGuard', () => ({
    start: Date.now(),

    init() {
      // Hide status boxes initially
      const boxes = ['.loading', '.error-message', '.sent-message'];
      boxes.forEach(sel => { const el = this.$el.querySelector(sel); if (el) el.style.display = 'none'; });

      // If action="" exists, copy hx-post for compatibility (harmless)
      if (this.$el.getAttribute('action') === '') {
        const hx = this.$el.getAttribute('hx-post') || this.$el.dataset.action;
        if (hx) this.$el.setAttribute('action', hx);
      }
    },

    // Attach to the element (no .window), so we always receive the event for this form
    configRequest(e) {
      if (e.target !== this.$el) return;

      // Compute elapsed AT SUBMIT time (ms), not at page load.
      const elapsed = Math.max(1, Date.now() - this.start);

      // 1) Mirror into hidden input if present (for diagnostics / fallbacks)
      const h = this.$el.querySelector('input[name="_elapsed_ms"]');
      if (h) h.value = String(elapsed);

      // 2) Ensure json-enc sends the correct numeric field
      const p = e.detail.parameters || (e.detail.parameters = {});
      p._elapsed_ms = elapsed;

      // Optional: brief UI state
      const loading = this.$el.querySelector('.loading');
      const error = this.$el.querySelector('.error-message');
      if (error) { error.style.display = 'none'; error.textContent = ''; }
      if (loading) { loading.style.display = 'block'; }
    },

    beforeRequest(e) {
      if (e.target !== this.$el) return;
      // no-op
    },

    afterRequest(e) {
      if (e.target !== this.$el) return;

      const loading = this.$el.querySelector('.loading');
      const ok = this.$el.querySelector('.sent-message');
      const error = this.$el.querySelector('.error-message');

      if (loading) loading.style.display = 'none';

      const xhr = e.detail.xhr;
      let data = null;
      try { data = JSON.parse(xhr.responseText || ''); } catch { }

      if (xhr.status >= 200 && xhr.status < 300 && data && data.ok) {
        if (ok) { ok.style.display = 'block'; }
        this.$el.reset();
        // Reset start so a second submit doesn't falsely trip the guard
        this.start = Date.now();
        return;
      }

      const msg = (data && data.error) ? data.error :
        (xhr.status ? `Error (${xhr.status})` : 'Network error');
      if (error) { error.textContent = msg; error.style.display = 'block'; }
    },

    sendError(e) {
      if (e.target !== this.$el) return;
      const loading = this.$el.querySelector('.loading');
      const error = this.$el.querySelector('.error-message');
      if (loading) loading.style.display = 'none';
      if (error) { error.textContent = 'Network error — please try again later.'; error.style.display = 'block'; }
    }
  }));
});
