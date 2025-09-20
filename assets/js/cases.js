function relatedCases() {
  return {
    selectedCases: [],
    async init() {
      const res = await fetch('/cases/cases.json');
      const allCases = await res.json();
      const current = window.location.pathname.split('/').pop();
      const filtered = allCases.filter(c => c.url !== current);
      this.selectedCases = this.pickRandom(filtered, 2);
    },
    pickRandom(array, count) {
      const shuffled = array.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
  }
}

document.addEventListener('alpine:init', () => {
  Alpine.store('toast', {
    open: false,
    isError: false,
    message: '',
    _timer: null,
    show(msg, { error = false, ms = 2500 } = {}) {
      this.message = msg;
      this.isError = !!error;
      this.open = true;
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.open = false, ms);
    },
    async copy(text) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const t = document.createElement('textarea');
          t.value = text; t.setAttribute('readonly', '');
          t.style.position = 'fixed'; t.style.left = '-9999px';
          document.body.appendChild(t); t.select();
          document.execCommand('copy'); document.body.removeChild(t);
        }
        this.show('Link kopiert.');
      } catch (e) {
        this.show('Kopieren nicht möglich.', { error: true, ms: 3500 });
      }
    }
  });
});

