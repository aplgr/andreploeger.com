const AP_INQUIRY_CONTEXT_PATTERN = /^Anfragekontext\nService: [^\n]+(?:\nGewählter Einstieg: [^\n]+)?\n\n?/;

function normalizeInquiryValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getInquiryPayload() {
  const context = window.apInquiryContext || {};
  if (!context.service) {
    return {};
  }

  const payload = {
    service: normalizeInquiryValue(context.service),
  };

  if (context.option) {
    payload.option = normalizeInquiryValue(context.option);
  }

  return payload;
}

function prependInquiryContext(form) {
  const context = window.apInquiryContext || {};
  if (!context.service) {
    return {};
  }

  const message = form.querySelector('textarea[name="message"]');
  if (!message) {
    return getInquiryPayload();
  }

  const lines = [
    'Anfragekontext',
    `Service: ${context.service}`,
  ];

  if (context.option) {
    lines.push(`Gewählter Einstieg: ${context.option}`);
  }

  const visitorMessage = message.value.replace(AP_INQUIRY_CONTEXT_PATTERN, '');
  message.value = `${lines.join('\n')}\n\n${visitorMessage}`;

  return getInquiryPayload();
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-inquiry-service]');
  if (!trigger) return;

  window.apInquiryContext = {
    service: trigger.dataset.inquiryService || '',
    option: trigger.dataset.inquiryOption || '',
  };
});

document.addEventListener('alpine:init', () => {
  Alpine.store('fg', { status: '' });

  function trackUmami(eventName, payload = {}) {
    if (typeof window.apTrackUmami === 'function') {
      return window.apTrackUmami(eventName, payload);
    }

    if (!window.umami || typeof window.umami.track !== 'function') {
      return false;
    }

    if (Object.keys(payload).length > 0) {
      window.umami.track(eventName, payload);
    } else {
      window.umami.track(eventName);
    }

    return true;
  }

  Alpine.data('formGuard', () => ({
    start: 0,
    lastElapsed: 0,
    requestPending: false,
    requestOutcomeTracked: false,

    init() {
      this.start = Date.now();
      this.setState('idle');

      // Ensure _elapsed_ms is set before htmx/json-enc serializes
      this.$el.addEventListener('submit', () => {
        const elapsed = Math.max(1, Date.now() - this.start);
        this.lastElapsed = elapsed;
        const hidden = this.$el.querySelector('input[name=\"_elapsed_ms\"]');
        if (hidden) hidden.value = String(elapsed);
        this.requestPending = true;
        this.requestOutcomeTracked = false;
        const inquiryPayload = prependInquiryContext(this.$el);
        trackUmami('contact_form_submit', inquiryPayload);
      }, { capture: true });

      // Fallback: copy hx-post into action if empty
      if (this.$el.getAttribute('action') === '') {
        const hx = this.$el.getAttribute('hx-post') || this.$el.dataset.action;
        if (hx) this.$el.setAttribute('action', hx);
      }

      // Listen for centralized notifications to update SR text / inline boxes
      this.$el.addEventListener('ap:notify', (ev) => {
        const d = ev.detail || {};
        const msg = d.message || '';
        Alpine.store('fg').status = msg;
      });
    },

    // htmx hooks (no strings here)
    configRequest(e) {
      if (e.target !== this.$el) return;
      const elapsed = this.lastElapsed || Math.max(1, Date.now() - this.start);
      const p = e.detail.parameters || (e.detail.parameters = {});
      p._elapsed_ms = elapsed;
      this.setState('loading');
    },

    beforeRequest(e) {
      if (e.target !== this.$el) return;
      const elapsed = this.lastElapsed || Math.max(1, Date.now() - this.start);
      const hidden = this.$el.querySelector('input[name=\"_elapsed_ms\"]');
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
        this.trackRequestOutcome('contact_form_success');
        this.setState('sent');
        this.$el.reset();
        window.apInquiryContext = null;
        this.start = Date.now();
        this.lastElapsed = 0;
      } else {
        this.trackRequestOutcome('contact_form_error', xhr.status ? { status_code: xhr.status } : {});
        this.setState('error');
      }
    },

    sendError(e) {
      if (e.target !== this.$el) return;
      this.trackRequestOutcome('contact_form_error');
      this.setState('error');
    },

    trackRequestOutcome(eventName, payload = {}) {
      // htmx can surface both sendError and afterRequest for the same attempt.
      if (!this.requestPending || this.requestOutcomeTracked) {
        return;
      }

      this.requestOutcomeTracked = true;
      this.requestPending = false;
      trackUmami(eventName, payload);
    },

    // visual state for CSS fallbacks
    setState(state) {
      this.$el.setAttribute('data-status', state || 'idle');
    },
  }));
});
