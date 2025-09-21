// Contact form logic (Alpine.js + htmx, no jQuery, no vendor validate.js)
// - Provides lightweight spam guards (time-to-fill, duplicate cooldown, JS challenge)
// - Uses htmx (with json-enc) to POST to the endpoint from hx-post
// - Controls UI boxes: .loading, .error-message, .sent-message

document.addEventListener('alpine:init', () => {
  Alpine.store('fg', { status: '' });

  Alpine.data('formGuard', () => ({
    // --- Tunables ---
    minFillMs: 3000,        // require at least 3s before submit
    cooldownMs: 60000,      // block duplicates for 60s
    dupKey: 'contact:lastHash',
    cooldownKey: 'contact:lastTs',

    // --- Runtime ---
    challenge: randomHex(16),
    start: Date.now(),

    init() {
      // Ensure action="" won't break any legacy scripts if present
      if (this.$el.getAttribute('action') === '') {
        const hx = this.$el.getAttribute('hx-post') || this.$el.dataset.action;
        if (hx) this.$el.setAttribute('action', hx);
      }
      // Hide boxes initially
      this.hideAll();
    },

    // htmx:configRequest
    configRequest(e) {
      if (e.target !== this.$el) return;

      // Basic HTML5 validation
      if (!this.$el.checkValidity()) {
        e.preventDefault();
        this.$el.reportValidity && this.$el.reportValidity();
        this.hideAll(); this.show(this.boxError(), 'Please check your input.');
        return;
      }

      // Spam/time guard
      const elapsed = Date.now() - this.start;
      if (elapsed < this.minFillMs) {
        e.preventDefault();
        this.hideAll(); this.show(this.boxError(), 'Please wait a moment before sending.');
        return;
      }

      // Build parameters for json-enc
      const fd = new FormData(this.$el);
      const trim = v => (v == null ? '' : String(v)).trim();

      const name = trim(fd.get('name'));
      const email = trim(fd.get('email'));
      const subject = trim(fd.get('subject')) || document.title;
      const message = trim(fd.get('message'));
      const website = trim(fd.get('website') || ''); // honeypot (optional)

      // Duplicate guard (hash recent payload)
      const hash = hashStr([name, email, subject, message].join('|'));
      const now = Date.now();
      const lastHash = localStorage.getItem(this.dupKey);
      const lastTs = parseInt(localStorage.getItem(this.cooldownKey) || '0', 10);
      if (hash && lastHash === hash && now - lastTs < this.cooldownMs) {
        e.preventDefault();
        this.hideAll(); this.show(this.boxError(), 'Please wait before sending the same message again.');
        return;
      }
      // Store for later (if request goes out we keep it; a failed network will still block briefly)
      localStorage.setItem(this.dupKey, hash);
      localStorage.setItem(this.cooldownKey, String(now));

      // Attach parameters for json-enc
      const p = e.detail.parameters || (e.detail.parameters = {});
      p.name = name; p.email = email; p.subject = subject; p.message = message;
      p.website = website;
      p._elapsed_ms = Math.max(1, elapsed);
      p._js_challenge = this.challenge;

      // UI
      this.hideAll(); this.show(this.boxLoading());
    },

    // htmx:beforeRequest
    beforeRequest(e) {
      if (e.target !== this.$el) return;
      // nothing special here; configRequest already set UI
    },

    // htmx:afterRequest
    afterRequest(e) {
      if (e.target !== this.$el) return;
      this.hideAll();

      const xhr = e.detail.xhr;
      const status = xhr.status || 0;

      let data = null;
      try { data = JSON.parse(xhr.responseText || ''); } catch (_) { }

      if (status >= 200 && status < 300 && data && data.ok) {
        this.show(this.boxOk());
        this.$el.reset();
        this.resetGuards();
        return;
      }

      const msg = (data && data.error) ? data.error :
        (status ? `Error (${status})` : 'Network error');
      this.show(this.boxError(), msg);
    },

    // optional: global sendError hook (network)
    sendError(e) {
      if (e.target !== this.$el) return;
      this.hideAll(); this.show(this.boxError(), 'Network error — please try again later.');
    },

    // UI helpers
    boxLoading() { return this.$el.querySelector('.loading'); },
    boxError() { return this.$el.querySelector('.error-message'); },
    boxOk() { return this.$el.querySelector('.sent-message'); },
    hideAll() {
      [this.boxLoading(), this.boxError(), this.boxOk()].forEach(el => {
        if (!el) return;
        el.style.display = 'none';
        if (el.classList.contains('error-message')) el.textContent = '';
      });
    },
    show(el, msg) {
      if (!el) return;
      if (typeof msg === 'string') el.textContent = msg;
      el.style.display = 'block';
    },

    resetGuards() {
      this.start = Date.now();
      this.challenge = randomHex(16);
    }
  }));
});

// Utilities
function randomHex(len) {
  const a = new Uint8Array(len);
  (crypto || window.crypto).getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}
