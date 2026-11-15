/*
 * Testo che si "decifra": per un attimo mostra caratteri a caso, poi torna il testo vero.
 * Usa il plugin ScrambleText di GSAP. Lo usiamo solo sulle scritte piccole in carattere
 * monospazio, dove ogni lettera è larga uguale e quindi la riga non "balla":
 * - le etichette delle sezioni e i numeri dei servizi, quando entrano nello schermo
 * - le voci del menu, quando ci passi sopra con il mouse
 */
class TextScramble {
  static LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  static DIGITS = "0123456789";
  static DURATION_SECONDS = 0.9;

  constructor(environment) {
    this.gsap = environment.gsap;
    this.isAvailable = Boolean(environment.scrambleText);
    this.finePointer = environment.finePointer;
  }

  start() {
    if (!this.isAvailable) {
      return;
    }
    this.scrambleWhenVisible(".eyebrow, .edu .k, .lang .k", TextScramble.LETTERS);
    this.scrambleWhenVisible(".svc-num", TextScramble.DIGITS);

    if (this.finePointer) {
      this.scrambleOnHover(".nav ul a");
    }
  }

  // IntersectionObserver avvisa quando un elemento entra nello schermo. Per un effetto che parte
  // una volta sola basta questo: non serve che ScrollTrigger ne tenga aggiornata la posizione.
  scrambleWhenVisible(selector, characters) {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          this.scramble(entry.target, characters);
        }
      }
    });

    const labels = document.querySelectorAll(selector);
    for (const label of labels) {
      observer.observe(label);
    }
  }

  scrambleOnHover(selector) {
    const links = document.querySelectorAll(selector);
    for (const link of links) {
      link.addEventListener("mouseenter", () => this.scramble(link, TextScramble.LETTERS));
    }
  }

  scramble(element, characters) {
    // Il testo vero viene salvato la prima volta: se l'effetto riparte a metà,
    // non rischiamo di prendere per buono un testo ancora "mescolato"
    if (!element.dataset.scrambleText) {
      element.dataset.scrambleText = element.textContent;
    }

    this.gsap.to(element, {
      duration: TextScramble.DURATION_SECONDS,
      ease: "none",
      // "auto" ferma solo un eventuale scramble già in corso sullo stesso elemento,
      // non le altre animazioni (es. il numero dei servizi che intanto sta comparendo)
      overwrite: "auto",
      scrambleText: { text: element.dataset.scrambleText, chars: characters, speed: 0.5 },
    });
  }
}
