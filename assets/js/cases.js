  function relatedCases() {
    return {
      selectedCases: [],
      async init() {
        const res = await fetch('/cases/cases.json'); // ggf. Pfad anpassen
        const allCases = await res.json();

        // Entferne aktuelle Seite (z. B. anhand window.location)
        const current = window.location.pathname.split('/').pop();
        const filtered = allCases.filter(c => c.url !== current);

        // 2 zufällig auswählen
        this.selectedCases = this.pickRandom(filtered, 2);
      },
      pickRandom(array, count) {
        const shuffled = array.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      }
    }
  }
