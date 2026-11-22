/*
 * Osserva gli elementi .watch e, la prima volta che entrano nello schermo:
 * - aggiunge la classe "inview" (utile al CSS per animazioni d'ingresso)
 * - avvia i finti terminali (TypingTerminal) che l'elemento contiene
 */
class InViewWatcher {
  constructor(terminals) {
    this.terminals = terminals;
  }

  start() {
    if (!("IntersectionObserver" in window)) {
      // Browser molto vecchio: mostriamo subito tutto
      const elements = document.querySelectorAll(".watch");
      for (const element of elements) {
        element.classList.add("inview");
      }
      return;
    }

    this.observer = new IntersectionObserver((entries) => this.onIntersect(entries), { threshold: 0.35 });

    const elements = document.querySelectorAll(".watch");
    for (const element of elements) {
      this.observer.observe(element);
    }
  }

  onIntersect(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.onEnterScreen(entry.target);
      }
    }
  }

  onEnterScreen(element) {
    element.classList.add("inview");

    for (const terminal of this.terminals) {
      if (element.contains(terminal.element)) {
        terminal.play();
      }
    }

    // Ogni elemento si anima una volta sola
    this.observer.unobserve(element);
  }
}
